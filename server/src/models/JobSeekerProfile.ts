import { Schema, model, type InferSchemaType } from "mongoose";

const experienceSchema = new Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: String,
    startDate: Date,
    endDate: Date,
    current: { type: Boolean, default: false },
    description: String
  },
  { _id: false }
);

const educationSchema = new Schema(
  {
    institution: { type: String, required: true },
    degree: String,
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    description: String
  },
  { _id: false }
);

const certificationSchema = new Schema(
  {
    name: { type: String, required: true },
    issuer: String,
    issueDate: Date,
    credentialUrl: String
  },
  { _id: false }
);

const salaryExpectationSchema = new Schema(
  {
    amount: { type: Number, min: 0 },
    currency: { type: String, default: "USD", uppercase: true },
    period: { type: String, enum: ["hourly", "monthly", "yearly"], default: "yearly" }
  },
  { _id: false }
);

const jobSeekerProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    headline: { type: String, trim: true, maxlength: 180 },
    professionalSummary: { type: String, maxlength: 5000 },
    skills: { type: [String], default: [] },
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    portfolio: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    resumePublicId: { type: String },
    resumeFileName: { type: String },
    preferredJobTypes: { type: [String], default: [] },
    preferredLocations: { type: [String], default: [] },
    salaryExpectation: { type: salaryExpectationSchema }
  },
  { timestamps: true }
);

jobSeekerProfileSchema.index({ skills: 1 });
jobSeekerProfileSchema.index({ preferredLocations: 1 });

export type JobSeekerProfileDocument = InferSchemaType<typeof jobSeekerProfileSchema>;
export const JobSeekerProfile = model("JobSeekerProfile", jobSeekerProfileSchema);
