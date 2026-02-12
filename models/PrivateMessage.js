import mongoose from "mongoose";

const privateMessageSchema = new mongoose.Schema({
  from_user: { type: String, required: true },
  to_user: { type: String, required: true },
  message: { type: String, required: true },
  date_sent: { type: String, required: true }
});

export const PrivateMessage = mongoose.model("PrivateMessage", privateMessageSchema);
