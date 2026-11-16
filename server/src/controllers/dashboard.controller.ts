import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Application } from "../models/Application.js";
import { Company } from "../models/Company.js";
import { Job } from "../models/Job.js";
import { JobSeekerProfile } from "../models/JobSeekerProfile.js";
import { Notification } from "../models/Notification.js";
import { RecruiterProfile } from "../models/RecruiterProfile.js";
import { SavedJob } from "../models/SavedJob.js";
import { calculateProfileCompletion } from "./profile.controller.js";
import { sendSuccess } from "../utils/response.js";

function statusMap(items: Array<{ _id: string; count: number }>): Record<string, number> {
  return Object.fromEntries(items.map((item) => [item._id, item.count]));
}

export async function jobSeekerDashboardController(req: Request, res: Response) {
  const userId = req.user!.id;
  const profile = await JobSeekerProfile.findOne({ user: userId }).lean();
  const statusCounts = await Application.aggregate<{ _id: string; count: number }>([
    { $match: { applicant: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const recommendationFilter: Record<string, unknown> = { status: "published" };

  if (profile?.skills?.length || profile?.preferredLocations?.length) {
    recommendationFilter.$or = [
      ...(profile.skills?.length ? [{ skills: { $in: profile.skills } }] : []),
      ...(profile.preferredLocations?.length ? [{ location: { $in: profile.preferredLocations } }] : [])
    ];
  }

  if (profile?.preferredJobTypes?.length) {
    recommendationFilter.employmentType = { $in: profile.preferredJobTypes };
  }

  const [recentApplications, savedCount, upcomingInterviews, recommendedJobs, unreadNotifications] =
    await Promise.all([
      Application.find({ applicant: userId })
        .populate("job", "title slug location workplaceType employmentType")
        .populate("company", "name slug logo")
        .sort({ appliedAt: -1 })
        .limit(5)
        .lean(),
      SavedJob.countDocuments({ user: userId }),
      Application.find({
        applicant: userId,
        status: "interview",
        "interviewDetails.scheduledAt": { $gte: new Date() }
      })
        .populate("job", "title slug")
        .populate("company", "name slug logo")
        .sort({ "interviewDetails.scheduledAt": 1 })
        .limit(5)
        .lean(),
      Job.find(recommendationFilter)
        .populate("company", "name slug logo industry")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Notification.countDocuments({ user: userId, isRead: false })
    ]);

  return sendSuccess(res, 200, {
    profileCompletion: calculateProfileCompletion(profile),
    statusCounts: statusMap(statusCounts),
    recentApplications,
    savedJobsCount: savedCount,
    upcomingInterviews,
    recommendedJobs,
    unreadNotifications
  });
}

export async function employerDashboardController(req: Request, res: Response) {
  const companyIds = await Company.find({ owner: req.user!.id }).distinct("_id");
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
  const applicationFilter = { company: { $in: companyIds } };

  const [activeJobs, totalJobs, totalApplications, newApplications, statusCounts, recentApplications, jobs, upcomingInterviews] =
    await Promise.all([
      Job.countDocuments({ company: { $in: companyIds }, status: "published" }),
      Job.countDocuments({ company: { $in: companyIds } }),
      Application.countDocuments(applicationFilter),
      Application.countDocuments({ ...applicationFilter, createdAt: { $gte: sevenDaysAgo } }),
      Application.aggregate<{ _id: string; count: number }>([
        { $match: applicationFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Application.find(applicationFilter)
        .populate("applicant", "name email avatar")
        .populate("job", "title slug")
        .sort({ appliedAt: -1 })
        .limit(5)
        .lean(),
      Job.find({ company: { $in: companyIds } })
        .populate("company", "name slug logo")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Application.countDocuments({
        ...applicationFilter,
        status: "interview",
        "interviewDetails.scheduledAt": { $gte: new Date() }
      })
    ]);

  return sendSuccess(res, 200, {
    activeJobs,
    totalJobs,
    totalApplications,
    newApplications,
    statusCounts: statusMap(statusCounts),
    recentApplications,
    recentJobs: jobs,
    upcomingInterviews
  });
}

export async function recruiterDashboardController(req: Request, res: Response) {
  const profile = await RecruiterProfile.findOne({ user: req.user!.id }).lean();
  const assignedJobIds = await Job.find({ assignedRecruiter: req.user!.id }).distinct("_id");
  const jobIds = [...(profile?.assignedJobs ?? []), ...assignedJobIds];
  const applicationFilter = {
    $or: [
      { job: { $in: jobIds } },
      { company: { $in: profile?.assignedCompanies ?? [] } }
    ]
  };

  const [recentApplications, statusCounts, upcomingInterviews, candidates, activeJobs] = await Promise.all([
    Application.find(applicationFilter)
      .populate("applicant", "name email avatar")
      .populate("job", "title slug")
      .sort({ appliedAt: -1 })
      .limit(5)
      .lean(),
    Application.aggregate<{ _id: string; count: number }>([
      { $match: applicationFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Application.find({
      ...applicationFilter,
      status: "interview",
      "interviewDetails.scheduledAt": { $gte: new Date() }
    })
      .populate("applicant", "name email avatar")
      .populate("job", "title slug")
      .sort({ "interviewDetails.scheduledAt": 1 })
      .limit(5)
      .lean(),
    Application.distinct("applicant", applicationFilter),
    Job.countDocuments({ _id: { $in: jobIds }, status: "published" })
  ]);

  return sendSuccess(res, 200, {
    assignedCompanies: profile?.assignedCompanies ?? [],
    assignedJobsCount: jobIds.length,
    activeJobs,
    candidatesCount: candidates.length,
    statusCounts: statusMap(statusCounts),
    recentApplications,
    upcomingInterviews,
    performanceMetrics: profile?.performanceMetrics ?? { placements: 0, interviews: 0, activeCandidates: 0 }
  });
}
