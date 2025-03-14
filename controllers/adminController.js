import pool from "../config/db.js";
import bcrypt from "bcryptjs";

/**
 * ✅ Fetch all users (Admin)
 */
export const getAllUsers = async (req, res) => {
    try {
        console.log("🔍 Fetching all users...");  // Debugging
        const result = await pool.query(`SELECT * FROM "User" ORDER BY user_id ASC`);
        console.log("✅ Users found:", result.rows); // Debugging
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};


/**
 * ✅ Update user details
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params; // Get user_id from URL
        const { name, email, role } = req.body; // Get new user data
        console.log(`🔍 Updating user ID: ${id}`); // Debugging

        const result = await pool.query(
            `UPDATE "User" SET full_name = $1, email = $2, role = $3 WHERE user_id = $4 RETURNING *`,
            [name, email, role, id]
        );
        
        if (result.rowCount === 0) {
            console.log(`❌ No user found with ID: ${id}`);
            return res.status(404).json({ message: "User not found" });
        }

        console.log("✅ User updated:", result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error("❌ Error updating user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * ✅ Delete a user
 */
export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM "User" WHERE user_id = $1 RETURNING *`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * ✅ Fetch admin reports/logs
 */
export const getAdminReports = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM "Admin_Log" ORDER BY timestamp DESC`);
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching reports:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * ✅ Log admin actions
 */
export const logAdminAction = async (req, res) => {
    const { admin_id, action, description } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO "Admin_Log" (admin_id, action, description, timestamp) 
             VALUES ($1, $2, $3, NOW()) RETURNING *`,
            [admin_id, action, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("❌ Error logging admin action:", error);
        res.status(500).json({ message: "Server error" });
    }
};


/**
 * ✅ create user
 * 
 */

export const createUser = async (req, res) => {
    try {
        console.log("🟢 Received Request Body:", req.body);

        const { full_name, email, role, password } = req.body;

        if (!full_name || !email || !role || !password) {
            console.log("❌ Missing fields!");
            return res.status(400).json({ message: "All fields are required" });
        }

        // ✅ Check if email already exists
        const emailCheck = await pool.query(`SELECT * FROM "User" WHERE email = $1`, [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // ✅ Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Insert new user
        const result = await pool.query(
            `INSERT INTO "User" (full_name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING *`,
            [full_name, email, role, hashedPassword]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("❌ Error creating user:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};