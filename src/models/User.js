import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, unique: true, lowercase: true },
    pushSubscription: {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String,
      },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
