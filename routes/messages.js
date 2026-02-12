import express from "express";
import { GroupMessage } from "../models/GroupMessage.js";
import { PrivateMessage } from "../models/PrivateMessage.js";

const router = express.Router();

// Get last 50 room messages
router.get("/room/:room", async (req, res) => {
  const { room } = req.params;
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);

  const msgs = await GroupMessage.find({ room })
    .sort({ _id: -1 })
    .limit(limit);

  res.json(msgs.reverse());
});

router.get("/private", async (req, res) => {
  const { user1, user2 } = req.query;
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);

  if (!user1 || !user2) return res.status(400).json({ error: "user1 and user2 required" });

  const msgs = await PrivateMessage.find({
    $or: [
      { from_user: user1, to_user: user2 },
      { from_user: user2, to_user: user1 }
    ]
  })
    .sort({ _id: -1 })
    .limit(limit);

  res.json(msgs.reverse());
});

export default router;
