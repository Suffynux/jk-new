import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ActivitySchema = new Schema(
  {
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    action: {
      type: String,
      enum: ["created", "status_changed", "voiceover_changed", "updated", "deleted", "user_created", "user_deleted"],
      required: true,
    },
    srNumber: { type: Number },
    newsTitle: { type: String },
    detail: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type ActivityDoc = InferSchemaType<typeof ActivitySchema>;

export const Activity = mongoose.models.Activity || mongoose.model("Activity", ActivitySchema);
