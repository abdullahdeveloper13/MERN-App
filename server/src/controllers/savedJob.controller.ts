import type { Request, Response } from "express";
import { Job } from "../models/Job.js";
import { SavedJob } from "../models/SavedJob.js";
import { AppError } from "../utils/AppError.js";
import { buildPaginationMeta, getPagination } from "../utils/pagination.js";
import { sendSuccess, sendMessage } from "../utils/response.js";

export async function listSavedJobsController(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, { limit: 12 });
  const filter = { user: req.user!.id };

  const [savedJobs, total] = await Promise.all([
    SavedJob.find(filter)
      .populate({
        path: "job",
        select: "title slug location workplaceType employmentType salaryRange status company createdAt",
        populate: { path: "company", select: "name slug logo" }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SavedJob.countDocuments(filter)
  ]);

  return sendSuccess(res, 200, savedJobs, buildPaginationMeta(page, limit, total));
}

export async function saveJobController(req: Request, res: Response) {
  const job = await Job.exists({ _id: req.params.jobId, status: "published" });

  if (!job) {
    throw new AppError(404, "Job not found.");
  }

  const saved = await SavedJob.findOneAndUpdate(
    { user: req.user!.id, job: req.params.jobId },
    { $setOnInsert: { user: req.user!.id, job: req.params.jobId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return sendSuccess(res, 201, saved);
}

export async function removeSavedJobController(req: Request, res: Response) {
  const result = await SavedJob.deleteOne({ user: req.user!.id, job: req.params.jobId });

  if (result.deletedCount === 0) {
    throw new AppError(404, "Saved job not found.");
  }

  return sendMessage(res, 200, "Job removed from saved jobs.");
}
