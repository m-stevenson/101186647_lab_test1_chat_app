import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema({
  from_user: { type: String, required: true },
  room: { type: String, required: true },
  message: { type: String, required: true },
  date_sent: { type: String, required: true }
});

export const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);
