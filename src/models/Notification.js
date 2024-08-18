import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    alertId: { type: String },
    recipient: { type: String, required: true, lowercase: true, index: true },
    payload: { type: [String], required: true },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", NotificationSchema);
