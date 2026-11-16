import { Schema, model, type InferSchemaType } from "mongoose";

const savedJobSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true }
  },
  { timestamps: true }
);

savedJobSchema.index({ user: 1, job: 1 }, { unique: true });
savedJobSchema.index({ user: 1, createdAt: -1 });

export type SavedJobDocument = InferSchemaType<typeof savedJobSchema>;
export const SavedJob = model("SavedJob", savedJobSchema);
