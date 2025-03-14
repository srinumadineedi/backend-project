import express from "express";
import { getAllPets, createPet, updatePet, deletePet, getPetById , getMatchingPets } from "../controllers/petController.js";
import { protect } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();

// ✅ Multer Setup for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// ✅ Pet Routes
router.get("/", getAllPets);
router.post("/", protect, upload.single("profile_pic"), createPet);
router.get("/matches", protect, getMatchingPets); // ✅ Matchmaking Route
router.get("/:id", getPetById);
router.put("/:id", protect, upload.single("profile_pic"), updatePet);
router.delete("/:id", protect, deletePet);

export default router;