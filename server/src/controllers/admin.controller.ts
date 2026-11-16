import type { Request, Response } from "express";
import { Application } from "../models/Application.js";
import { AuditLog } from "../models/AuditLog.js";
import { Company } from "../models/Company.js";
import { Job } from "../models/Job.js";
import { RecruiterProfile } from "../models/RecruiterProfile.js";
import { User } from "../models/User.js";
import { getAIService } from "../adapters/ai/AIService.js";
import { isCloudinaryConfigured } from "../services/cloudinary.service.js";
import { isEmailConfigured } from "../services/email.service.js";
import { logAudit } from "../services/audit.service.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { buildPaginationMeta, getPagination } from "../utils/pagination.js";
import { sendSuccess } from "../utils/response.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function adminAnalyticsController(_req: Request, res: Response) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

  const [
    totalUsers,
    jobSeekers,
    employers,
    recruiters,
    admins,
    totalCompanies,
    verifiedCompanies,
    publishedJobs,
    totalJobs,
    totalApplications,
    recentUsers,
    recentApplications,
    statusBreakdown,
    topCategories
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "job_seeker" }),
    User.countDocuments({ role: "employer" }),
    User.countDocuments({ role: "recruiter" }),
    User.countDocuments({ role: "admin" }),
    Company.countDocuments(),
    Company.countDocuments({ verified: true }),
    Job.countDocuments({ status: "published" }),
    Job.countDocuments(),
    Application.countDocuments(),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Application.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Application.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Job.aggregate<{ _id: string; count: number }>([
      { $match: { status: "published", category: { $nin: [null, ""] } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ])
  ]);

  return sendSuccess(res, 200, {
    users: { total: totalUsers, jobSeekers, employers, recruiters, admins, newLast30Days: recentUsers },
    companies: { total: totalCompanies, verified: verifiedCompanies },
    jobs: { published: publishedJobs, total: totalJobs },
    applications: { total: totalApplications, newLast30Days: recentApplications, statusBreakdown },
    topCategories: topCategories.map((item) => ({ name: item._id, count: item.count }))
  });
}

export async function adminListUsersController(req: Request, res: Response) {
  const query = req.query as {
    q?: string;
    role?: string;
    isActive?: string;
    page?: number;
    limit?: number;
  };
  const { page, limit, skip } = getPagination(query, { limit: 20 });
  const filter: Record<string, unknown> = {};

  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }

  if (query.role) {
    filter.role = query.role;
  }

  if (query.isActive) {
    filter.isActive = query.isActive === "true";
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter)
  ]);

  return sendSuccess(res, 200, users, buildPaginationMeta(page, limit, total));
}

export async function adminUpdateUserStatusController(req: Request, res: Response) {
  const { isActive } = req.body as { isActive: boolean };
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  if (user._id.toString() === req.user!.id && !isActive) {
    throw new AppError(400, "You cannot deactivate your own account.");
  }

  if (!isActive && user.role === "admin") {
    const activeAdmins = await User.countDocuments({ role: "admin", isActive: true });
    if (activeAdmins <= 1) {
      throw new AppError(400, "The platform must retain at least one active administrator.");
    }
  }

  user.isActive = isActive;
  await user.save();

  await logAudit(
    {
      actorId: req.user!.id,
      action: isActive ? "user.activated" : "user.deactivated",
      resourceType: "User",
      resourceId: user._id.toString()
    },
    req
  );

  return sendSuccess(res, 200, user);
}

export async function adminListCompaniesController(req: Request, res: Response) {
  const query = req.query as { q?: string; verified?: string; page?: number; limit?: number };
  const { page, limit, skip } = getPagination(query, { limit: 20 });
  const filter: Record<string, unknown> = {};

  if (query.q) {
    filter.name = new RegExp(escapeRegex(query.q), "i");
  }

  if (query.verified) {
    filter.verified = query.verified === "true";
  }

  const [companies, total] = await Promise.all([
    Company.find(filter).populate("owner", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Company.countDocuments(filter)
  ]);

  return sendSuccess(res, 200, companies, buildPaginationMeta(page, limit, total));
}

export async function adminVerifyCompanyController(req: Request, res: Response) {
  const company = await Company.findByIdAndUpdate(
    req.params.id,
    { $set: { verified: req.body.verified } },
    { new: true }
  );

  if (!company) {
    throw new AppError(404, "Company not found.");
  }

  await logAudit(
    {
      actorId: req.user!.id,
      action: company.verified ? "company.verified" : "company.unverified",
      resourceType: "Company",
      resourceId: company._id.toString()
    },
    req
  );

  return sendSuccess(res, 200, company);
}

export async function adminListJobsController(req: Request, res: Response) {
  const query = req.query as { q?: string; status?: string; page?: number; limit?: number };
  const { page, limit, skip } = getPagination(query, { limit: 20 });
  const filter: Record<string, unknown> = {};

  if (query.q) {
    filter.title = new RegExp(escapeRegex(query.q), "i");
  }

  if (query.status) {
    filter.status = query.status;
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate("company", "name slug logo verified")
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter)
  ]);

  return sendSuccess(res, 200, jobs, buildPaginationMeta(page, limit, total));
}

export async function adminModerateJobController(req: Request, res: Response) {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new AppError(404, "Job not found.");
  }

  job.status = req.body.status;
  if (job.status === "published" && !job.publishedAt) {
    job.publishedAt = new Date();
  }
  await job.save();

  await logAudit(
    {
      actorId: req.user!.id,
      action: "job.moderated",
      resourceType: "Job",
      resourceId: job._id.toString(),
      metadata: { status: job.status }
    },
    req
  );

  return sendSuccess(res, 200, job);
}

export async function adminListRecruitersController(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, { limit: 20 });
  const [recruiters, total] = await Promise.all([
    User.find({ role: "recruiter" }).select("name email avatar isActive createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments({ role: "recruiter" })
  ]);

  const profiles = await RecruiterProfile.find({
    user: { $in: recruiters.map((recruiter) => recruiter._id) }
  })
    .populate("assignedCompanies", "name slug")
    .populate("assignedJobs", "title slug")
    .lean();
  const profileMap = new Map(profiles.map((profile) => [profile.user.toString(), profile]));

  return sendSuccess(
    res,
    200,
    recruiters.map((recruiter) => ({
      ...recruiter,
      recruiterProfile: profileMap.get(recruiter._id.toString()) ?? null
    })),
    buildPaginationMeta(page, limit, total)
  );
}

export async function adminUpdateRecruiterAssignmentsController(req: Request, res: Response) {
  const recruiter = await User.findOne({ _id: req.params.id, role: "recruiter" });

  if (!recruiter) {
    throw new AppError(404, "Recruiter not found.");
  }

  const updates = req.body as {
    assignedCompanies?: string[];
    assignedJobs?: string[];
    assignedCandidates?: string[];
  };

  const profile = await RecruiterProfile.findOneAndUpdate(
    { user: recruiter._id },
    { $set: updates, $setOnInsert: { user: recruiter._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
    .populate("assignedCompanies", "name slug")
    .populate("assignedJobs", "title slug")
    .lean();

  if (updates.assignedJobs) {
    await Job.updateMany({ _id: { $in: updates.assignedJobs } }, { $set: { assignedRecruiter: recruiter._id } });
    await Job.updateMany(
      { assignedRecruiter: recruiter._id, _id: { $nin: updates.assignedJobs } },
      { $unset: { assignedRecruiter: 1 } }
    );
  }

  await logAudit(
    {
      actorId: req.user!.id,
      action: "recruiter.assignments_updated",
      resourceType: "User",
      resourceId: recruiter._id.toString(),
      metadata: {
        companyCount: updates.assignedCompanies?.length,
        jobCount: updates.assignedJobs?.length,
        candidateCount: updates.assignedCandidates?.length
      }
    },
    req
  );

  return sendSuccess(res, 200, profile);
}

export async function adminAuditLogsController(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, { limit: 30 });
  const [logs, total] = await Promise.all([
    AuditLog.find()
      .populate("actor", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments()
  ]);

  return sendSuccess(res, 200, logs, buildPaginationMeta(page, limit, total));
}

export async function adminSettingsController(_req: Request, res: Response) {
  return sendSuccess(res, 200, {
    environment: env.NODE_ENV,
    integrations: {
      email: isEmailConfigured(),
      cloudinary: isCloudinaryConfigured(),
      google: Boolean(env.GOOGLE_CLIENT_ID),
      ai: getAIService().isConfigured()
    },
    aiProvider: getAIService().getProviderName(),
    databaseName: env.MONGODB_DB_NAME
  });
}
