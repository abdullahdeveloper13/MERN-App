import type { Request, Response } from "express";
import { Application } from "../models/Application.js";
import { Company } from "../models/Company.js";
import { Job } from "../models/Job.js";
import { JobSeekerProfile } from "../models/JobSeekerProfile.js";
import { RecruiterProfile } from "../models/RecruiterProfile.js";
import { User } from "../models/User.js";
import {
  deleteAsset,
  getPrivateDocumentUrl,
  uploadImage,
  uploadPrivateDocument
} from "../services/cloudinary.service.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";

interface CompletionProfile {
  headline?: string | null;
  professionalSummary?: string | null;
  skills?: string[] | null;
  experience?: unknown[] | null;
  education?: unknown[] | null;
  resumePublicId?: string | null;
  preferredLocations?: string[] | null;
}

export function calculateProfileCompletion(profile: CompletionProfile | null): number {
  if (!profile) {
    return 0;
  }

  const checks = [
    Boolean(profile.headline),
    Boolean(profile.professionalSummary),
    (profile.skills?.length ?? 0) > 0,
    (profile.experience?.length ?? 0) > 0,
    (profile.education?.length ?? 0) > 0,
    Boolean(profile.resumePublicId),
    (profile.preferredLocations?.length ?? 0) > 0
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function withResumeAccess<T extends { resumePublicId?: string | null } | null>(
  profile: T,
  userId: string
): T & { resumeAccessUrl?: string; completion?: number } {
  if (!profile) {
    return profile as T & { resumeAccessUrl?: string; completion?: number };
  }

  return {
    ...profile,
    completion: calculateProfileCompletion(profile as CompletionProfile),
    ...(profile.resumePublicId ? { resumeAccessUrl: `/api/v1/profiles/resume/${userId}` } : {})
  };
}

export async function getMyProfileController(req: Request, res: Response) {
  const userId = req.user!.id;

  if (req.user!.role === "job_seeker") {
    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    return sendSuccess(res, 200, withResumeAccess(profile, userId));
  }

  if (req.user!.role === "recruiter") {
    const profile = await RecruiterProfile.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate("assignedCompanies", "name slug logo industry")
      .populate("assignedJobs", "title slug status company")
      .lean();
    return sendSuccess(res, 200, profile);
  }

  if (req.user!.role === "employer") {
    const company = await Company.findOne({ owner: userId }).lean();
    return sendSuccess(res, 200, { company });
  }

  return sendSuccess(res, 200, {});
}

export async function updateMyProfileController(req: Request, res: Response) {
  const userId = req.user!.id;
  const updates = req.body as Record<string, unknown>;

  if (req.user!.role === "job_seeker") {
    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: userId },
      { $set: updates, $setOnInsert: { user: userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ).lean();
    return sendSuccess(res, 200, withResumeAccess(profile, userId));
  }

  if (req.user!.role === "recruiter") {
    const profile = await RecruiterProfile.findOneAndUpdate(
      { user: userId },
      { $set: updates, $setOnInsert: { user: userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    )
      .populate("assignedCompanies", "name slug logo industry")
      .populate("assignedJobs", "title slug status company")
      .lean();
    return sendSuccess(res, 200, profile);
  }

  throw new AppError(403, "This profile type cannot be edited through this endpoint.");
}

export async function updateAccountController(req: Request, res: Response) {
  const user = await User.findByIdAndUpdate(req.user!.id, { $set: req.body }, { new: true, runValidators: true });

  if (!user) {
    throw new AppError(404, "Account not found.");
  }

  return sendSuccess(res, 200, user);
}

export async function uploadAvatarController(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError(400, "Select an image to upload.");
  }

  const user = await User.findById(req.user!.id);

  if (!user) {
    throw new AppError(404, "Account not found.");
  }

  const uploaded = await uploadImage(req.file.buffer, "avatars");
  const previousPublicId = user.avatarPublicId;
  user.avatar = uploaded.url;
  user.avatarPublicId = uploaded.publicId;
  await user.save();

  if (previousPublicId && previousPublicId !== uploaded.publicId) {
    await deleteAsset(previousPublicId, "image", "upload");
  }

  return sendSuccess(res, 200, user);
}

export async function uploadResumeController(req: Request, res: Response) {
  if (req.user!.role !== "job_seeker") {
    throw new AppError(403, "Only job seekers can upload a resume.");
  }

  if (!req.file) {
    throw new AppError(400, "Select a PDF or Word document to upload.");
  }

  const uploaded = await uploadPrivateDocument(req.file.buffer, "resumes", req.file.originalname);
  const profile = await JobSeekerProfile.findOneAndUpdate(
    { user: req.user!.id },
    {
      $set: { resumePublicId: uploaded.publicId, resumeFileName: uploaded.fileName },
      $setOnInsert: { user: req.user!.id }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return sendSuccess(res, 200, withResumeAccess(profile, req.user!.id));
}

export async function downloadResumeController(req: Request, res: Response) {
  const { userId } = req.params as { userId: string };
  const profile = await JobSeekerProfile.findOne({ user: userId }).lean();

  if (!profile?.resumePublicId) {
    throw new AppError(404, "Resume not found.");
  }

  const isSelf = req.user!.id === userId;
  const isAdmin = req.user!.role === "admin";
  let authorized = isSelf || isAdmin;

  if (!authorized && req.user!.role === "employer") {
    const companyIds = await Company.find({ owner: req.user!.id }).distinct("_id");
    authorized = Boolean(
      await Application.exists({ applicant: userId, company: { $in: companyIds } })
    );
  }

  if (!authorized && req.user!.role === "recruiter") {
    const recruiter = await RecruiterProfile.findOne({ user: req.user!.id }).lean();
    const assignedJobs = await Job.find({ assignedRecruiter: req.user!.id }).distinct("_id");
    authorized = Boolean(
      await Application.exists({
        applicant: userId,
        $or: [
          { job: { $in: [...(recruiter?.assignedJobs ?? []), ...assignedJobs] } },
          { company: { $in: recruiter?.assignedCompanies ?? [] } }
        ]
      })
    );
  }

  if (!authorized) {
    throw new AppError(403, "You do not have permission to access this resume.");
  }

  return res.redirect(getPrivateDocumentUrl(profile.resumePublicId));
}
