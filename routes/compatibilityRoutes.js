import express from "express";
import { getPetCompatibility } from "../controllers/compatibilityController.js";
import { protect } from "../middleware/authMiddleware.js"; // Authentication middleware

const router = express.Router();

// Route to fetch pet compatibility
router.get("/", protect, getPetCompatibility);

export default router;
