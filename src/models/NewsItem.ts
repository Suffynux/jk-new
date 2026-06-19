import mongoose, { Schema, type InferSchemaType } from "mongoose";

// Workflow pipeline — order matters: progress is derived from a stage's index.
export const NEWS_STATUSES = [
  "in-progress",
  "voice-over",
  "video-editing",
  "onair",
  "done",
] as const;
export type NewsStatus = (typeof NEWS_STATUSES)[number];

export const STATUS_LABELS: Record<NewsStatus, string> = {
  "in-progress": "In Progress",
  "voice-over": "Voice Over",
  "video-editing": "Editing",
  onair: "On Air",
  done: "Done",
};

/** Percentage complete for a given stage (first stage = 20%, last = 100%). */
export function progressForStatus(status: string): number {
  const idx = NEWS_STATUSES.indexOf(status as NewsStatus);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / NEWS_STATUSES.length) * 100);
}

const NewsItemSchema = new Schema(
  {
    srNumber: { type: Number, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    status: { type: String, enum: NEWS_STATUSES, default: "in-progress" },
    createdBy: { type: String, required: true },
    createdByName: { type: String },
    progress: { type: Number, default: progressForStatus("in-progress") },
    // Timing: the clock starts when the news enters the pipeline (creation)
    // and stops the moment it is marked "done".
    startedAt: { type: Date },
    completedAt: { type: Date },
    durationMs: { type: Number },
  },
  { timestamps: true }
);

export type NewsItemDoc = InferSchemaType<typeof NewsItemSchema>;

export const NewsItem = mongoose.models.NewsItem || mongoose.model("NewsItem", NewsItemSchema);
