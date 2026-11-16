import { Schema, model, type InferSchemaType } from "mongoose";

export const APPLICATION_STATUSES = [
  "applied",
  "reviewing",
  "shortlisted",
  "interview",
  "offered",
  "hired",
  "rejected",
  "withdrawn"
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const resumeSchema = new Schema(
  {
    publicId: { type: String, required: true },
    fileName: { type: String }
  },
  { _id: false }
);

const interviewDetailsSchema = new Schema(
  {
    scheduledAt: { type: Date },
    durationMinutes: { type: Number, min: 15, max: 480 },
    mode: { type: String, enum: ["video", "phone", "onsite"], default: "video" },
    location: { type: String },
    notes: { type: String }
  },
  { _id: false }
);

const applicationSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    applicant: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    resume: { type: resumeSchema },
    coverLetter: { type: String, maxlength: 12000 },
    answers: {
      type: [{ question: String, answer: String }],
      default: []
    },
    status: { type: String, enum: APPLICATION_STATUSES, default: "applied", index: true },
    recruiterNotes: { type: String, maxlength: 8000 },
    interviewDetails: { type: interviewDetailsSchema },
    appliedAt: { type: Date, default: Date.now },
    statusUpdatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, status: 1 });
applicationSchema.index({ company: 1, status: 1 });
applicationSchema.index({ job: 1, status: 1 });

export type ApplicationDocument = InferSchemaType<typeof applicationSchema>;
export const Application = model("Application", applicationSchema);
