import { Schema, model, type InferSchemaType } from "mongoose";

export const VERIFICATION_TOKEN_TYPES = ["email_verification", "password_reset"] as const;

const verificationTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: VERIFICATION_TOKEN_TYPES, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true, select: false },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date }
  },
  { timestamps: true }
);

verificationTokenSchema.index({ user: 1, type: 1 });
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type VerificationTokenDocument = InferSchemaType<typeof verificationTokenSchema>;
export const VerificationToken = model("VerificationToken", verificationTokenSchema);
