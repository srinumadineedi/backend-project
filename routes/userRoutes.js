import express from "express";
import multer from "multer";
import { getUserProfile, updateUserProfile, uploadProfilePic } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, `${req.user.userId}-${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.post("/profile/upload", protect, upload.single("profilePic"), uploadProfilePic);


export default router;
