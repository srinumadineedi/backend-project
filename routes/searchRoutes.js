import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// ✅ Advanced Search for Pet Profiles
router.get("/", async (req, res) => {
    try {
        const { name, breed, age, temperament, health_status, gender } = req.query;
        let query = 'SELECT * FROM "Pet" WHERE 1=1';
        let values = [];

        if (name) {
            query += ` AND name ILIKE $${values.length + 1}`;
            values.push(`%${name}%`);
        }
        if (breed) {
            query += ` AND breed ILIKE $${values.length + 1}`;
            values.push(`%${breed}%`);
        }
        if (age) {
            query += ` AND age = $${values.length + 1}`;
            values.push(age);
        }
        if (temperament) {
            query += ` AND temperament ILIKE $${values.length + 1}`;
            values.push(`%${temperament}%`);
        }
        if (health_status) {
            query += ` AND health_status ILIKE $${values.length + 1}`;
            values.push(`%${health_status}%`);
        }
        if (gender) {
            query += ` AND gender ILIKE $${values.length + 1}`;
            values.push(`%${gender}%`);
        }

        console.log("🛠 SQL Query:", query);
        console.log("📊 Query Values:", values);

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Error in /api/search:", err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
