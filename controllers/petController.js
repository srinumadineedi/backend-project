import pool from "../config/db.js";
import asyncHandler from "express-async-handler";

// ✅ 1. Get All Pets
export const getAllPets = asyncHandler(async (req, res) => {
    try {
        const { breed, gender, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `SELECT * FROM "Pet" WHERE 1=1`;
        let params = [];

        if (breed) {
            params.push(breed);
            query += ` AND breed = $${params.length}`;
        }
        if (gender) {
            params.push(gender);
            query += ` AND gender = $${params.length}`;
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("❌ Error fetching pets:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ 2. Create a Pet
export const createPet = asyncHandler(async (req, res) => {
    try {
        const { name, breed, age, gender, food, temperament, health_status } = req.body;
        const profile_pic = req.file ? `/uploads/${req.file.filename}` : null;
        const user_id = req.user.userId;

        if (!name || !age || !breed || !gender) {
            return res.status(400).json({ message: "Name, age, breed, and gender are required." });
        }

        const insertQuery = `
            INSERT INTO "Pet" (user_id, name, breed, age, gender, food, temperament, health_status, profile_pic)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
        `;

        const { rows } = await pool.query(insertQuery, [user_id, name, breed, age, gender, food, temperament, health_status, profile_pic]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error("❌ Error creating pet:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ 3. Update a Pet
export const updatePet = asyncHandler(async (req, res) => {
    try {
        const petId = req.params.id;
        const { name, breed, age, gender, food, temperament, health_status } = req.body;
        const profile_pic = req.file ? `/uploads/${req.file.filename}` : null;

        const updateQuery = `
            UPDATE "Pet" 
            SET name = COALESCE($1, name),
                breed = COALESCE($2, breed),
                age = COALESCE($3, age),
                gender = COALESCE($4, gender),
                food = COALESCE($5, food),
                temperament = COALESCE($6, temperament),
                health_status = COALESCE($7, health_status),
                profile_pic = COALESCE($8, profile_pic),
                updated_at = NOW()
            WHERE pet_id = $9 RETURNING *;
        `;

        const { rows } = await pool.query(updateQuery, [name, breed, age, gender, food, temperament, health_status, profile_pic, petId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Pet not found." });
        }

        res.json({ message: "Pet updated successfully!", pet: rows[0] });
    } catch (error) {
        console.error("❌ Error updating pet:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ 4. Delete a Pet
export const deletePet = asyncHandler(async (req, res) => {
    try {
        const petId = req.params.id;
        const deleteQuery = `DELETE FROM "Pet" WHERE pet_id = $1 RETURNING *`;
        const { rows } = await pool.query(deleteQuery, [petId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Pet not found." });
        }

        res.json({ message: "Pet deleted successfully!" });
    } catch (error) {
        console.error("❌ Error deleting pet:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// ✅ 5. Get a Single Pet by ID
export const getPetById = async (req, res) => {
    try {
        const petId = req.params.id;
        const petQuery = `SELECT * FROM "Pet" WHERE pet_id = $1`;
        const { rows } = await pool.query(petQuery, [petId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Pet not found." });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("❌ Error fetching pet details:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// ✅ Match Pets Based on Similar Breed, Gender & Temperament 
export const getMatchingPets = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.userId; // ✅ Get logged-in user ID

        // ✅ Get the user's pets
        const userPetsQuery = `SELECT * FROM "Pet" WHERE user_id = $1`;
        const { rows: userPets } = await pool.query(userPetsQuery, [userId]);

        if (userPets.length === 0) {
            return res.status(404).json({ message: "No pets found for this user." });
        }

        let matches = [];

        for (const pet of userPets) {
            const matchQuery = `
                SELECT * FROM "Pet"
                WHERE pet_id != $1 AND gender != $2
                AND (breed = $3 OR temperament = $4)
                ORDER BY RANDOM() LIMIT 3;
            `;
            const { rows: matchedPets } = await pool.query(matchQuery, [
                pet.pet_id,
                pet.gender,
                pet.breed,
                pet.temperament,
            ]);

            matches.push({
                pet: pet.name,
                matches: matchedPets,
            });
        }

        res.json(matches);
    } catch (error) {
        console.error("❌ Error fetching matches:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
