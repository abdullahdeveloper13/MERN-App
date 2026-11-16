import type { Request, Response } from "express";
import { Application } from "../models/Application.js";
import { Company } from "../models/Company.js";
import { Job } from "../models/Job.js";
import { RecruiterProfile } from "../models/RecruiterProfile.js";
import { SavedJob } from "../models/SavedJob.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { buildPaginationMeta, getPagination } from "../utils/pagination.js";
import { sendSuccess, sendMessage } from "../utils/response.js";
import { buildUniqueSlug } from "../utils/slug.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function canManageCompany(userId: string, role: string, companyId: string): Promise<boolean> {
  if (role === "admin") {
    return true;
  }

  if (role === "employer") {
    return Boolean(await Company.exists({ _id: companyId, owner: userId }));
  }

  if (role === "recruiter") {
    const profile = await RecruiterProfile.findOne({ user: userId }).lean();
    return Boolean(profile?.assignedCompanies.some((id) => id.toString() === companyId));
  }

  return false;
}

async function assertJobManager(jobId: string, req: Request) {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new AppError(404, "Job not found.");
  }

  const allowed =
    req.user!.role === "admin" ||
    job.postedBy.toString() === req.user!.id ||
    job.assignedRecruiter?.toString() === req.user!.id ||
    (await canManageCompany(req.user!.id, req.user!.role, job.company.toString()));

  if (!allowed) {
    throw new AppError(403, "You do not have permission to manage this job.");
  }

  return job;
}

export async function listJobsController(req: Request, res: Response) {
  const query = req.query as {
    q?: string;
    location?: string;
    category?: string;
    company?: string;
    employmentType?: string;
    workplaceType?: string;
    experienceLevel?: string;
    minSalary?: number;
    maxSalary?: number;
    skills?: string;
    sort?: string;
    page?: number;
    limit?: number;
  };
  const { page, limit, skip } = getPagination(query, { limit: 12 });
  const filter: Record<string, unknown> = { status: "published" };

  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ title: regex }, { description: regex }, { skills: regex }, { category: regex }];
  }

  if (query.location) {
    filter.location = new RegExp(escapeRegex(query.location), "i");
  }

  if (query.category) {
    filter.category = new RegExp(`^${escapeRegex(query.category)}$`, "i");
  }

  if (query.company) {
    filter.company = query.company;
  }

  if (query.employmentType) {
    filter.employmentType = query.employmentType;
  }

  if (query.workplaceType) {
    filter.workplaceType = query.workplaceType;
  }

  if (query.experienceLevel) {
    filter.experienceLevel = query.experienceLevel;
  }

  if (query.skills) {
    const skills = query.skills.split(",").map((skill) => skill.trim()).filter(Boolean);
    if (skills.length > 0) {
      filter.skills = { $in: skills.map((skill) => new RegExp(`^${escapeRegex(skill)}$`, "i")) };
    }
  }

  if (query.minSalary !== undefined || query.maxSalary !== undefined) {
    const range: Record<string, unknown>[] = [];
    if (query.maxSalary !== undefined) {
      range.push({ "salaryRange.min": { $lte: query.maxSalary } });
    }
    if (query.minSalary !== undefined) {
      range.push({ "salaryRange.max": { $gte: query.minSalary } });
    }
    if (range.length > 0) {
      filter.$and = range;
    }
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    salary: { "salaryRange.max": -1 },
    applications: { applicationCount: -1 }
  };

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate("company", "name slug logo industry headquarters verified")
      .sort(sortMap[query.sort ?? "newest"] ?? sortMap.newest)
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter)
  ]);

  return sendSuccess(res, 200, jobs, buildPaginationMeta(page, limit, total));
}

export async function getJobController(req: Request, res: Response) {
  const identifier = req.params.id as string;
  const query = /^[a-f\d]{24}$/i.test(identifier) ? { _id: identifier } : { slug: identifier };
  const job = await Job.findOne(query)
    .populate("company", "name slug logo industry headquarters verified website description")
    .populate("postedBy", "name avatar")
    .populate("assignedRecruiter", "name avatar");

  if (!job) {
    throw new AppError(404, "Job not found.");
  }

  if (job.status !== "published") {
    const canView =
      req.user &&
      (req.user.role === "admin" ||
        job.postedBy._id.toString() === req.user.id ||
        (await canManageCompany(req.user.id, req.user.role, job.company._id.toString())));

    if (!canView) {
      throw new AppError(404, "Job not found.");
    }
  } else {
    void Job.updateOne({ _id: job._id }, { $inc: { viewCount: 1 } });
  }

  return sendSuccess(res, 200, job);
}

export async function listMyJobsController(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, { limit: 12 });
  const query = req.query as { q?: string; status?: string };
  const filter: Record<string, unknown> = {};

  if (req.user!.role === "employer") {
    const companyIds = await Company.find({ owner: req.user!.id }).distinct("_id");
    filter.company = { $in: companyIds };
  } else if (req.user!.role === "recruiter") {
    const profile = await RecruiterProfile.findOne({ user: req.user!.id }).lean();
    filter.$or = [
      { assignedRecruiter: req.user!.id },
      { _id: { $in: profile?.assignedJobs ?? [] } },
      { company: { $in: profile?.assignedCompanies ?? [] } }
    ];
  } else if (req.user!.role !== "admin") {
    throw new AppError(403, "You do not have access to job management.");
  }

  if (query.q) {
    filter.title = new RegExp(escapeRegex(query.q), "i");
  }

  if (query.status) {
    filter.status = query.status;
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate("company", "name slug logo")
      .populate("assignedRecruiter", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter)
  ]);

  return sendSuccess(res, 200, jobs, buildPaginationMeta(page, limit, total));
}

export async function createJobController(req: Request, res: Response) {
  const body = req.body as {
    companyId: string;
    title: string;
    status: "draft" | "published";
    assignedRecruiter?: string;
    [key: string]: unknown;
  };

  if (!(await canManageCompany(req.user!.id, req.user!.role, body.companyId))) {
    throw new AppError(403, "You cannot publish jobs for this company.");
  }

  if (body.assignedRecruiter) {
    const recruiter = await User.exists({ _id: body.assignedRecruiter, role: "recruiter" });
    if (!recruiter) {
      throw new AppError(400, "Assigned recruiter is invalid.");
    }
  }

  const slug = await buildUniqueSlug(
    body.title,
    async (candidate) => Boolean(await Job.exists({ slug: candidate })),
    "job"
  );

  const { companyId, ...rest } = body;
  const job = await Job.create({
    ...rest,
    company: companyId,
    postedBy: req.user!.id,
    slug,
    ...(body.status === "published" ? { publishedAt: new Date() } : {})
  });

  await job.populate("company", "name slug logo industry");

  return sendSuccess(res, 201, job);
}

export async function updateJobController(req: Request, res: Response) {
  const job = await assertJobManager(req.params.id as string, req);
  const body = req.body as Record<string, unknown> & { companyId?: string; assignedRecruiter?: string | null };

  if (body.companyId && body.companyId !== job.company.toString()) {
    if (!(await canManageCompany(req.user!.id, req.user!.role, body.companyId))) {
      throw new AppError(403, "You cannot move this job to that company.");
    }
    job.company = body.companyId as unknown as typeof job.company;
  }

  if (body.assignedRecruiter) {
    const recruiter = await User.exists({ _id: body.assignedRecruiter, role: "recruiter" });
    if (!recruiter) {
      throw new AppError(400, "Assigned recruiter is invalid.");
    }
  }

  const allowedFields = [
    "title",
    "description",
    "responsibilities",
    "requirements",
    "skills",
    "location",
    "employmentType",
    "workplaceType",
    "salaryRange",
    "experienceLevel",
    "category",
    "status",
    "applicationDeadline",
    "assignedRecruiter",
    "applicationQuestions"
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      (job as unknown as Record<string, unknown>)[field] = body[field];
    }
  }

  if (body.status === "published" && !job.publishedAt) {
    job.publishedAt = new Date();
  }

  await job.save();
  await job.populate("company", "name slug logo industry");

  return sendSuccess(res, 200, job);
}

export async function deleteJobController(req: Request, res: Response) {
  const job = await assertJobManager(req.params.id as string, req);

  if (req.user!.role !== "admin" && job.status !== "draft") {
    throw new AppError(400, "Only draft jobs can be deleted. Close or pause published jobs instead.");
  }

  await Promise.all([
    Application.deleteMany({ job: job._id }),
    SavedJob.deleteMany({ job: job._id }),
    Job.deleteOne({ _id: job._id })
  ]);

  return sendMessage(res, 200, "Job deleted.");
}

export async function publicJobStatsController(_req: Request, res: Response) {
  const [publishedJobs, companies, applications, categories] = await Promise.all([
    Job.countDocuments({ status: "published" }),
    Company.countDocuments(),
    Application.countDocuments(),
    Job.distinct("category", { status: "published", category: { $nin: [null, ""] } })
  ]);

  return sendSuccess(res, 200, {
    publishedJobs,
    companies,
    applications,
    categories: categories.length
  });
}

export async function jobCategoriesController(_req: Request, res: Response) {
  const categories = await Job.aggregate<{ _id: string; count: number }>([
    { $match: { status: "published", category: { $nin: [null, ""] } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 12 }
  ]);

  return sendSuccess(
    res,
    200,
    categories.map((category) => ({ name: category._id, count: category.count }))
  );
}
