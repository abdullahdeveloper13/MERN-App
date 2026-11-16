import type { Request, Response } from "express";
import { Company } from "../models/Company.js";
import { Job } from "../models/Job.js";
import { RecruiterProfile } from "../models/RecruiterProfile.js";
import { Review } from "../models/Review.js";
import { deleteAsset, uploadImage } from "../services/cloudinary.service.js";
import { AppError } from "../utils/AppError.js";
import { buildPaginationMeta, getPagination } from "../utils/pagination.js";
import { sendSuccess, sendMessage } from "../utils/response.js";
import { buildUniqueSlug } from "../utils/slug.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findCompany(identifier: string) {
  const query = /^[a-f\d]{24}$/i.test(identifier) ? { _id: identifier } : { slug: identifier };
  return Company.findOne(query);
}

export async function listCompaniesController(req: Request, res: Response) {
  const query = req.query as {
    q?: string;
    industry?: string;
    verified?: string;
    page?: number;
    limit?: number;
  };
  const { page, limit, skip } = getPagination(query, { limit: 12 });
  const filter: Record<string, unknown> = {};

  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ name: regex }, { industry: regex }, { description: regex }];
  }

  if (query.industry) {
    filter.industry = new RegExp(escapeRegex(query.industry), "i");
  }

  if (query.verified) {
    filter.verified = query.verified === "true";
  }

  const [companies, total] = await Promise.all([
    Company.find(filter).sort({ verified: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Company.countDocuments(filter)
  ]);

  return sendSuccess(res, 200, companies, buildPaginationMeta(page, limit, total));
}

export async function getCompanyController(req: Request, res: Response) {
  const company = await findCompany(req.params.id as string);

  if (!company) {
    throw new AppError(404, "Company not found.");
  }

  const jobs = await Job.find({ company: company._id, status: "published" })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  return sendSuccess(res, 200, { company, jobs });
}

export async function getMyCompanyController(req: Request, res: Response) {
  if (req.user!.role === "employer") {
    const company = await Company.findOne({ owner: req.user!.id }).lean();
    return sendSuccess(res, 200, company);
  }

  if (req.user!.role === "recruiter") {
    const profile = await RecruiterProfile.findOne({ user: req.user!.id }).lean();
    const companies = await Company.find({ _id: { $in: profile?.assignedCompanies ?? [] } }).lean();
    return sendSuccess(res, 200, companies);
  }

  if (req.user!.role === "admin") {
    const companies = await Company.find().sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 200, companies);
  }

  throw new AppError(403, "You do not have access to company administration.");
}

export async function createCompanyController(req: Request, res: Response) {
  if (req.user!.role === "employer") {
    const existing = await Company.exists({ owner: req.user!.id });

    if (existing) {
      throw new AppError(409, "You already have a company profile.");
    }
  }

  const data = req.body as { name: string };
  const slug = await buildUniqueSlug(data.name, async (candidate) => Boolean(await Company.exists({ slug: candidate })), "company");

  const company = await Company.create({ ...req.body, slug, owner: req.user!.id });

  return sendSuccess(res, 201, company);
}

export async function updateCompanyController(req: Request, res: Response) {
  const company = await Company.findById(req.params.id);

  if (!company) {
    throw new AppError(404, "Company not found.");
  }

  if (req.user!.role !== "admin" && company.owner.toString() !== req.user!.id) {
    throw new AppError(403, "You do not have permission to edit this company.");
  }

  const updates = req.body as Record<string, unknown>;

  if (typeof updates.name === "string" && updates.name !== company.name) {
    updates.slug = await buildUniqueSlug(
      updates.name,
      async (candidate) => Boolean(await Company.exists({ slug: candidate, _id: { $ne: company._id } })),
      "company"
    );
  }

  Object.assign(company, updates);
  await company.save();

  return sendSuccess(res, 200, company);
}

export async function uploadCompanyLogoController(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError(400, "Select a logo image to upload.");
  }

  const company = await Company.findById(req.params.id);

  if (!company) {
    throw new AppError(404, "Company not found.");
  }

  if (req.user!.role !== "admin" && company.owner.toString() !== req.user!.id) {
    throw new AppError(403, "You do not have permission to edit this company.");
  }

  const uploaded = await uploadImage(req.file.buffer, "company-logos");
  const previousPublicId = company.logoPublicId;
  company.logo = uploaded.url;
  company.logoPublicId = uploaded.publicId;
  await company.save();

  if (previousPublicId && previousPublicId !== uploaded.publicId) {
    await deleteAsset(previousPublicId, "image", "upload");
  }

  return sendSuccess(res, 200, company);
}

export async function listCompanyReviewsController(req: Request, res: Response) {
  const company = await findCompany(req.params.id as string);

  if (!company) {
    throw new AppError(404, "Company not found.");
  }

  const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, { limit: 10 });
  const [reviews, total] = await Promise.all([
    Review.find({ company: company._id })
      .populate("author", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ company: company._id })
  ]);

  return sendSuccess(res, 200, reviews, buildPaginationMeta(page, limit, total));
}

export async function createCompanyReviewController(req: Request, res: Response) {
  const company = await findCompany(req.params.id as string);

  if (!company) {
    throw new AppError(404, "Company not found.");
  }

  if (company.owner.toString() === req.user!.id) {
    throw new AppError(400, "You cannot review your own company.");
  }

  const existing = await Review.exists({ company: company._id, author: req.user!.id });

  if (existing) {
    throw new AppError(409, "You have already reviewed this company.");
  }

  const review = await Review.create({
    ...(req.body as Record<string, unknown>),
    company: company._id,
    author: req.user!.id
  });

  return sendSuccess(res, 201, review);
}

export async function deleteCompanyController(req: Request, res: Response) {
  if (req.user!.role !== "admin") {
    throw new AppError(403, "Only administrators can delete companies.");
  }

  const company = await Company.findByIdAndDelete(req.params.id);

  if (!company) {
    throw new AppError(404, "Company not found.");
  }

  await deleteAsset(company.logoPublicId ?? "", "image", "upload").catch(() => undefined);

  return sendMessage(res, 200, "Company deleted.");
}
