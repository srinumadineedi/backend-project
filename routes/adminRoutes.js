import express from "express";
import { 
    getAllUsers, updateUser, deleteUser, 
    getAdminReports, logAdminAction ,createUser
} from "../controllers/adminController.js";

const router = express.Router();

// ✅ Admin user management
router.get("/users", getAllUsers);      // Fetch all users
router.put("/users/:id", updateUser);   // Update user details
router.delete("/users/:id", deleteUser); // Delete a user
router.post("/users", createUser);  // ✅ Ensure this route exists

// ✅ Admin reports & logs
router.get("/reports", getAdminReports); // Retrieve system analytics & reports
router.post("/logs", logAdminAction);   // Log admin actions

export default router;

