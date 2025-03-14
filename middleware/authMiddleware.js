import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import pool from "../config/db.js"; // ✅ Database Connection

dotenv.config();

// ✅ Protect Routes Middleware (Verify JWT Token)
export const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: decoded.user_id, role: decoded.role }; // ✅ Attach role
        next(); // ✅ Proceed to Next
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token." });
    }
};

// ✅ Check if User is Admin Middleware
export const isAdmin = async (req, res, next) => {
    const { userId } = req.user;

    try {
        const result = await pool.query(`SELECT role FROM "User" WHERE user_id = $1`, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const userRole = result.rows[0].role;

        if (userRole !== "admin") {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }

        next(); // ✅ Allow Access
    } catch (error) {
        console.error("❌ Error Checking Admin:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
