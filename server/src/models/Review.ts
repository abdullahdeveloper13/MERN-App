import { Schema, model, type InferSchemaType } from "mongoose";

const reviewSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 160 },
    comment: { type: String, maxlength: 4000 }
  },
  { timestamps: true }
);

reviewSchema.index({ company: 1, author: 1 }, { unique: true });

export type ReviewDocument = InferSchemaType<typeof reviewSchema>;
export const Review = model("Review", reviewSchema);
