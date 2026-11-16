import { Schema, model, type InferSchemaType } from "mongoose";

export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship", "temporary"] as const;
export const WORKPLACE_TYPES = ["onsite", "remote", "hybrid"] as const;
export const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "lead", "executive"] as const;
export const JOB_STATUSES = ["draft", "published", "paused", "closed", "archived"] as const;

const salaryRangeSchema = new Schema(
  {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 },
    currency: { type: String, default: "USD", uppercase: true, trim: true }
  },
  { _id: false }
);

const jobSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true, maxlength: 20000 },
    responsibilities: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    skills: { type: [String], default: [], index: true },
    location: { type: String, trim: true },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: "full_time", index: true },
    workplaceType: { type: String, enum: WORKPLACE_TYPES, default: "onsite", index: true },
    salaryRange: { type: salaryRangeSchema, default: () => ({}) },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, default: "mid", index: true },
    category: { type: String, trim: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedRecruiter: { type: Schema.Types.ObjectId, ref: "User", index: true },
    status: { type: String, enum: JOB_STATUSES, default: "draft", index: true },
    applicationDeadline: { type: Date },
    applicationQuestions: {
      type: [{ question: { type: String, required: true }, required: { type: Boolean, default: false } }],
      default: []
    },
    publishedAt: { type: Date },
    applicationCount: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ company: 1, status: 1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ assignedRecruiter: 1, status: 1 });
jobSchema.index({ title: "text", description: "text", skills: "text" });

export type JobDocument = InferSchemaType<typeof jobSchema>;
export const Job = model("Job", jobSchema);
