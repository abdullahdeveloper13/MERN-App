import type { Request, Response } from "express";
import { Application, type ApplicationStatus } from "../models/Application.js";
import { Company } from "../models/Company.js";
import { Job } from "../models/Job.js";
import { JobSeekerProfile } from "../models/JobSeekerProfile.js";
import { RecruiterProfile } from "../models/RecruiterProfile.js";
import { User } from "../models/User.js";
import { logAudit } from "../services/audit.service.js";
import { sendEmailSafe } from "../services/email.service.js";
import { createNotification } from "../services/notification.service.js";
import { emitToUser } from "../sockets/index.js";
import {
  applicationConfirmationEmail,
  applicationStatusEmail,
  interviewInvitationEmail,
  newApplicationEmail
} from "../templates/email.js";
import { AppError } from "../utils/AppError.js";
import { buildPaginationMeta, getPagination } from "../utils/pagination.js";
import { sendSuccess, sendMessage } from "../utils/response.js";

const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ["reviewing", "shortlisted", "rejected"],
  reviewing: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["offered", "rejected"],
  offered: ["hired", "rejected"],
  hired: [],
  rejected: [],
  withdrawn: []
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function canManageApplication(applicationId: string, req: Request) {
  const application = await Application.findById(applicationId);

  if (!application) {
    throw new AppError(404, "Application not found.");
  }

  if (req.user!.role === "admin") {
    return application;
  }

  if (application.applicant.toString() === req.user!.id) {
    return application;
  }

  if (req.user!.role === "employer") {
    const ownsCompany = await Company.exists({
      _id: application.company,
      owner: req.user!.id
    });

    if (ownsCompany) {
      return application;
    }
  }

  if (req.user!.role === "recruiter") {
    const profile = await RecruiterProfile.findOne({ user: req.user!.id }).lean();
    const job = await Job.findById(application.job).select("assignedRecruiter company").lean();
    const assigned =
      job?.assignedRecruiter?.toString() === req.user!.id ||
      profile?.assignedJobs.some((id) => id.toString() === application.job.toString()) ||
      profile?.assignedCompanies.some((id) => id.toString() === application.company.toString());

    if (assigned) {
      return application;
    }
  }

  throw new AppError(403, "You do not have permission to access this application.");
}

export async function createApplicationController(req: Request, res: Response) {
  if (req.user!.role !== "job_seeker") {
    throw new AppError(403, "Only job seekers can apply for jobs.");
  }

  const { job: jobId, coverLetter, answers } = req.body as {
    job: string;
    coverLetter?: string;
    answers: Array<{ question: string; answer: string }>;
  };

  const job = await Job.findById(jobId);

  if (!job) {
    throw new AppError(404, "Job not found.");
  }

  if (job.status !== "published") {
    throw new AppError(400, "This job is not accepting applications.");
  }

  if (job.applicationDeadline && job.applicationDeadline.getTime() < Date.now()) {
    throw new AppError(400, "The application deadline has passed.");
  }

  const profile = await JobSeekerProfile.findOne({ user: req.user!.id }).lean();

  if (!profile?.resumePublicId) {
    throw new AppError(400, "Upload a resume before applying.");
  }

  const duplicate = await Application.exists({ job: job._id, applicant: req.user!.id });

  if (duplicate) {
    throw new AppError(409, "You have already applied for this job.");
  }

  for (const question of job.applicationQuestions ?? []) {
    if (question.required) {
      const response = answers.find((item) => item.question === question.question);
      if (!response?.answer.trim()) {
        throw new AppError(422, `An answer is required for: ${question.question}`);
      }
    }
  }

  const application = await Application.create({
    job: job._id,
    applicant: req.user!.id,
    company: job.company,
    resume: { publicId: profile.resumePublicId, fileName: profile.resumeFileName },
    coverLetter,
    answers
  });

  await Job.updateOne({ _id: job._id }, { $inc: { applicationCount: 1 } });

  const company = await Company.findById(job.company).lean();
  const applicant = await User.findById(req.user!.id).lean();

  if (company) {
    const employer = await User.findById(company.owner).select("name email").lean();
    const recipients = [company.owner.toString()];

    if (job.assignedRecruiter) {
      recipients.push(job.assignedRecruiter.toString());
    }

    await Promise.all(
      recipients.map((recipientId) =>
        createNotification({
          userId: recipientId,
          title: "New job application",
          message: `${applicant?.name ?? "A candidate"} applied for ${job.title}.`,
          type: "application",
          relatedResource: { type: "application", id: application._id.toString() }
        })
      )
    );

    if (employer) {
      const employerEmail = newApplicationEmail(employer.name, applicant?.name ?? "A candidate", job.title);
      void sendEmailSafe(employer.email, employerEmail.subject, employerEmail.html);
    }
  }

  if (applicant && company) {
    const confirmation = applicationConfirmationEmail(applicant.name, job.title, company.name);
    void sendEmailSafe(applicant.email, confirmation.subject, confirmation.html);
  }

  await application.populate([
    { path: "job", select: "title slug location workplaceType employmentType salaryRange status" },
    { path: "company", select: "name slug logo" }
  ]);

  return sendSuccess(res, 201, application);
}

export async function myApplicationsController(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, { limit: 10 });
  const status = (req.query as { status?: ApplicationStatus }).status;
  const filter: Record<string, unknown> = { applicant: req.user!.id };

  if (status) {
    filter.status = status;
  }

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate("job", "title slug location workplaceType employmentType salaryRange status")
      .populate("company", "name slug logo industry")
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter)
  ]);

  return sendSuccess(res, 200, applications, buildPaginationMeta(page, limit, total));
}

export async function listApplicationsController(req: Request, res: Response) {
  const query = req.query as {
    job?: string;
    company?: string;
    status?: ApplicationStatus;
    q?: string;
    page?: number;
    limit?: number;
  };
  const { page, limit, skip } = getPagination(query, { limit: 20 });
  const filter: Record<string, unknown> = {};
  const andConditions: Record<string, unknown>[] = [];

  if (req.user!.role === "employer") {
    const companyIds = await Company.find({ owner: req.user!.id }).distinct("_id");
    filter.company = { $in: companyIds };
  } else if (req.user!.role === "recruiter") {
    const profile = await RecruiterProfile.findOne({ user: req.user!.id }).lean();
    const assignedJobIds = await Job.find({ assignedRecruiter: req.user!.id }).distinct("_id");
    filter.$or = [
      { job: { $in: [...(profile?.assignedJobs ?? []), ...assignedJobIds] } },
      { company: { $in: profile?.assignedCompanies ?? [] } }
    ];
  } else if (req.user!.role !== "admin") {
    throw new AppError(403, "You do not have access to applications.");
  }

  if (query.job) {
    filter.job = query.job;
  }

  if (query.company) {
    filter.company = query.company;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q), "i");
    const matchingUsers = await User.find({ $or: [{ name: regex }, { email: regex }] }).distinct("_id");
    andConditions.push({ applicant: { $in: matchingUsers } });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate("applicant", "name email avatar phone location")
      .populate("job", "title slug status company")
      .populate("company", "name slug logo")
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter)
  ]);

  return sendSuccess(res, 200, applications, buildPaginationMeta(page, limit, total));
}

export async function getApplicationController(req: Request, res: Response) {
  const application = await canManageApplication(req.params.id as string, req);
  const applicantId = application.applicant.toString();

  await application.populate([
    { path: "applicant", select: "name email avatar phone location" },
    { path: "job", select: "title slug description status company assignedRecruiter" },
    { path: "company", select: "name slug logo owner" }
  ]);

  const applicantProfile = await JobSeekerProfile.findOne({ user: applicantId })
    .select(
      "headline professionalSummary skills experience education certifications portfolio linkedinUrl githubUrl resumeFileName"
    )
    .lean();

  return sendSuccess(res, 200, {
    ...application.toObject(),
    applicantProfile,
    resumeAccessUrl: `/api/v1/profiles/resume/${applicantId}`
  });
}

export async function updateApplicationStatusController(req: Request, res: Response) {
  const application = await canManageApplication(req.params.id as string, req);
  const { status, recruiterNotes, interviewDetails } = req.body as {
    status: ApplicationStatus;
    recruiterNotes?: string;
    interviewDetails?: {
      scheduledAt?: Date;
      durationMinutes?: number;
      mode?: string;
      location?: string;
      notes?: string;
    };
  };

  if (application.applicant.toString() === req.user!.id && req.user!.role !== "admin") {
    throw new AppError(403, "Applicants cannot change their own application status.");
  }

  if (req.user!.role !== "admin" && !allowedTransitions[application.status].includes(status)) {
    throw new AppError(400, `Cannot move an application from ${application.status} to ${status}.`);
  }

  if (interviewDetails && status !== "interview") {
    throw new AppError(422, "Interview details can only be set for interview-stage applications.");
  }

  application.status = status;
  application.statusUpdatedAt = new Date();

  if (recruiterNotes !== undefined) {
    application.recruiterNotes = recruiterNotes;
  }

  if (interviewDetails) {
    application.interviewDetails = {
      ...application.interviewDetails,
      ...interviewDetails
    } as typeof application.interviewDetails;
  }

  await application.save();
  await application.populate([
    { path: "applicant", select: "name email avatar" },
    { path: "job", select: "title slug company" },
    { path: "company", select: "name slug logo" }
  ]);

  const applicant = application.applicant as unknown as { _id: unknown; name: string; email: string };
  const job = application.job as unknown as { title: string };

  await createNotification({
    userId: String(applicant._id),
    title: "Application status updated",
    message: `Your application for ${job.title} is now ${status.replaceAll("_", " ")}.`,
    type: status === "interview" ? "interview" : "application",
    relatedResource: { type: "application", id: application._id.toString() }
  });

  emitToUser(String(applicant._id), "application:status", {
    applicationId: application._id.toString(),
    jobId: application.job.toString(),
    status,
    interviewDetails: application.interviewDetails ?? null
  });

  if (status === "interview" && interviewDetails?.scheduledAt) {
    const message = interviewInvitationEmail(
      applicant.name,
      job.title,
      interviewDetails.scheduledAt.toISOString(),
      interviewDetails.location
    );
    void sendEmailSafe(applicant.email, message.subject, message.html);
  } else {
    const message = applicationStatusEmail(applicant.name, job.title, status);
    void sendEmailSafe(applicant.email, message.subject, message.html);
  }

  await logAudit(
    {
      actorId: req.user!.id,
      action: "application.status_changed",
      resourceType: "Application",
      resourceId: application._id.toString(),
      metadata: { status }
    },
    req
  );

  return sendSuccess(res, 200, application);
}

export async function withdrawApplicationController(req: Request, res: Response) {
  const application = await Application.findById(req.params.id as string);

  if (!application) {
    throw new AppError(404, "Application not found.");
  }

  if (application.applicant.toString() !== req.user!.id) {
    throw new AppError(403, "You can only withdraw your own application.");
  }

  if (!["applied", "reviewing", "shortlisted", "interview"].includes(application.status)) {
    throw new AppError(400, "This application can no longer be withdrawn.");
  }

  application.status = "withdrawn";
  application.statusUpdatedAt = new Date();
  await application.save();

  const company = await Company.findById(application.company).select("owner name").lean();

  if (company) {
    await createNotification({
      userId: company.owner.toString(),
      title: "Application withdrawn",
      message: "A candidate withdrew an application.",
      type: "application",
      relatedResource: { type: "application", id: application._id.toString() }
    });
  }

  return sendMessage(res, 200, "Application withdrawn.");
}
