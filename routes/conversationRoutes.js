// routes/conversationRoutes.js
import express from "express";
import { getConversations, createConversation } from '../controllers/conversationController.js';

const router = express.Router();

router.get("/:user_id", getConversations);
router.post("/", createConversation);

export default router;