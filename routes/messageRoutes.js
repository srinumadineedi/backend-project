// routes/messageRoutes.js
import express from "express";
import { getMessages, sendMessage } from '../controllers/messageController.js';

const router = express.Router();

router.get("/:conversation_id", getMessages);
router.post("/", sendMessage);

export default router;