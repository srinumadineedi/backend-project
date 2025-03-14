import express from "express";
import {
  getMessagingSettings,
  updateMessagingSettings,
} from "../controllers/settingsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Route to Get Messaging Settings
router.get("/", protect, getMessagingSettings);

// ✅ Route to Update Messaging Settings
router.put("/", protect, updateMessagingSettings);

export default router;
