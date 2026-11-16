import { Schema, model, type InferSchemaType } from "mongoose";

const recruiterProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    specialization: { type: String, trim: true },
    experienceYears: { type: Number, min: 0, default: 0 },
    assignedCompanies: { type: [{ type: Schema.Types.ObjectId, ref: "Company" }], default: [], index: true },
    assignedJobs: { type: [{ type: Schema.Types.ObjectId, ref: "Job" }], default: [], index: true },
    assignedCandidates: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    performanceMetrics: {
      placements: { type: Number, default: 0, min: 0 },
      interviews: { type: Number, default: 0, min: 0 },
      activeCandidates: { type: Number, default: 0, min: 0 }
    }
  },
  { timestamps: true }
);

export type RecruiterProfileDocument = InferSchemaType<typeof recruiterProfileSchema>;
export const RecruiterProfile = model("RecruiterProfile", recruiterProfileSchema);
