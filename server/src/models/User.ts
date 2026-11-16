import { Schema, model, type InferSchemaType } from "mongoose";

export const USER_ROLES = ["job_seeker", "employer", "recruiter", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: "job_seeker", index: true },
    avatar: { type: String },
    avatarPublicId: { type: String },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
      index: true
    },
    googleId: { type: String, unique: true, sparse: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ name: "text", email: "text" });
userSchema.set("toJSON", {
  transform: (_document, returned) => {
    const value = returned as Record<string, unknown>;
    delete value.passwordHash;
    delete value.__v;
    return value;
  }
});

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
