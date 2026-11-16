import { Schema, model, type InferSchemaType } from "mongoose";

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] as const;

const companySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    logo: { type: String },
    logoPublicId: { type: String },
    description: { type: String, maxlength: 8000 },
    website: { type: String, trim: true },
    industry: { type: String, trim: true, index: true },
    companySize: { type: String, enum: COMPANY_SIZES, default: "1-10" },
    headquarters: { type: String, trim: true },
    foundedYear: { type: Number, min: 1800, max: new Date().getFullYear() },
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    verified: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

companySchema.index({ name: "text", description: "text", industry: "text" });
companySchema.index({ verified: 1, createdAt: -1 });

export type CompanyDocument = InferSchemaType<typeof companySchema>;
export const Company = model("Company", companySchema);
