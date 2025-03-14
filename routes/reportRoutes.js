import express from "express";
import pool from "../config/db.js"; // Database connection

const router = express.Router();

// 📊 Get Reports & Analytics Data
router.get("/", async (req, res) => {
    try {
        // Fetch Total Users
        const usersQuery = await pool.query(`SELECT COUNT(*) AS total_users FROM "User"`);
        const totalUsers = usersQuery.rows[0].total_users;

        // Fetch Total Pets
        const petsQuery = await pool.query(`SELECT COUNT(*) AS total_pets FROM "Pet"`);
        const totalPets = petsQuery.rows[0].total_pets;

        // Fetch Total Matches
        const matchesQuery = await pool.query(`SELECT COUNT(*) AS total_matches FROM "matches"`);
        const totalMatches = matchesQuery.rows[0].total_matches;

        // Send response
        res.json({
            totalUsers,
            totalPets,
            totalMatches,
        });
    } catch (error) {
        console.error("❌ Error fetching reports:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
