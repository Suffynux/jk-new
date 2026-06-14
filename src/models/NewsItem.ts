import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const NEWS_STATUSES = ["pending", "in-progress", "done"] as const;
export type NewsStatus = (typeof NEWS_STATUSES)[number];

const NewsItemSchema = new Schema(
  {
    srNumber: { type: Number, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    voiceOver: { type: Boolean, default: false },
    status: { type: String, enum: NEWS_STATUSES, default: "pending" },
    createdBy: { type: String, required: true },
    newStartedAt: { type: Date },
    newsCompletedAt: { type: Date },
    progress: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type NewsItemDoc = InferSchemaType<typeof NewsItemSchema>;

export const NewsItem = mongoose.models.NewsItem || mongoose.model("NewsItem", NewsItemSchema);
