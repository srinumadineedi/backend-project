import pool from "../config/db.js";

// Function to calculate compatibility score
const calculateCompatibility = (pet1, pet2) => {
    if (!pet1.breed || !pet2.breed || !pet1.temperament || !pet2.temperament) {
        console.error("❌ Missing pet properties:", { pet1, pet2 });
        return null; // Skip this match
    }

    let breedScore = pet1.breed.toLowerCase() === pet2.breed.toLowerCase() ? 100 : 50;
    let ageDiff = Math.abs(pet1.age - pet2.age);
    let ageScore = ageDiff <= 2 ? 100 : ageDiff <= 4 ? 70 : 40;
    let temperamentScore = pet1.temperament.toLowerCase() === pet2.temperament.toLowerCase() ? 100 : 60;

    let overallCompatibility = Math.round((breedScore + ageScore + temperamentScore) / 3);

    return {
        breedCompatibility: breedScore,
        ageCompatibility: ageScore,
        personalityMatch: temperamentScore,
        overallCompatibility,
    };
};


// Controller function to get pet compatibility
export const getPetCompatibility = async (req, res) => {
    try {
        console.log("🔍 Received Parameters:", req.params);

        const { pet_id } = req.params;
        const petIdInt = parseInt(pet_id, 10);

        if (isNaN(petIdInt)) {
            return res.status(400).json({ message: "Invalid pet ID. Must be a number." });
        }

        // ✅ Fetch the pet from the database
        const petResult = await pool.query(`SELECT * FROM "Pet" WHERE pet_id = $1`, [petIdInt]);
        if (petResult.rows.length === 0) {
            return res.status(404).json({ message: "Pet not found." });
        }

        const pet = petResult.rows[0];
        console.log("🐶 Fetched Pet:", pet);

        // ✅ Check if required properties exist
        if (!pet.breed || !pet.age || !pet.temperament) {
            return res.status(500).json({ message: "Pet data is incomplete.", pet });
        }

        // ✅ Fetch other pets from database for compatibility check
        const otherPetsResult = await pool.query(`SELECT * FROM "Pet" WHERE pet_id != $1`, [petIdInt]);
        const otherPets = otherPetsResult.rows;

        // ✅ Ensure other pets exist
        if (otherPets.length === 0) {
            return res.json({ message: "No other pets available for compatibility check.", pet, compatibilityResults: [] });
        }

        // ✅ Calculate compatibility
        const compatibilityResults = otherPets
            .map(otherPet => calculateCompatibility(pet, otherPet))
            .filter(result => result !== null); // Remove failed calculations

        res.json({ message: "Pet compatibility fetched successfully!", pet, compatibilityResults });
    } catch (error) {
        console.error("❌ Error fetching pet compatibility:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
