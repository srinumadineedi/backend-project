import express from "express";
import pool from "../config/db.js"; // Import database connection

const router = express.Router();

// ✅ Submit Feedback (POST)
router.post("/", async (req, res) => {
    const { name, email, message } = req.body;

    // ✅ Validate input
    if (!name || !email || !message) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        // ✅ Insert feedback into database
        const result = await pool.query(
            "INSERT INTO feedback (name, email, message, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
            [name, email, message]
        );

        res.status(201).json({ message: "Feedback submitted successfully", feedback: result.rows[0] });
    } catch (error) {
        console.error("❌ Error inserting feedback:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Get All Feedback (Optional - For Admin View)
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM feedback ORDER BY created_at DESC");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching feedback:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
