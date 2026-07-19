import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["job_seeker", "employer", "recruiter", "admin"], default: "job_seeker", index: true }
  },
  { timestamps: true }
);

export const User = model("User", userSchema);
