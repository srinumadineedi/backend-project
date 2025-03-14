import pool from "../config/db.js"; // Database connection
import asyncHandler from "express-async-handler";

// ✅ Get User Profile (GET /api/users/profile)
            export const getUserProfile = asyncHandler(async (req, res) => {
                try {
                    const userId = req.user.userId; // Extract user ID from JWT token

                    console.log(`🔹 Fetching profile for user ID: ${userId}`);

                    const userQuery = 'SELECT user_id, full_name, email, profile_pic, role FROM "User" WHERE user_id = $1';
                    const { rows } = await pool.query(userQuery, [userId]);

                    if (rows.length === 0) {
                        return res.status(404).json({ message: "User not found." });
                    }

                    let user = rows[0];

                    // ✅ Ensure profile picture URL is correct (prepend base URL)
                    if (user.profile_pic && !user.profile_pic.startsWith("http")) {
                        user.profile_pic = `http://localhost:5000${user.profile_pic}`;
                    }

                    res.json(user);
                } catch (error) {
                    console.error("❌ Error fetching user profile:", error.message);
                    res.status(500).json({ message: "Server error", error: error.message });
                }
            });


// ✅ Update User Profile (PUT /api/users/profile)
export const updateUserProfile = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.userId; // Get user ID from JWT token
        const { full_name, email, profile_pic } = req.body;

        if (!full_name && !email && !profile_pic) {
            return res.status(400).json({ message: "At least one field (full_name, email, or profile_pic) is required." });
        }

        console.log(`🔹 Updating profile for user ID: ${userId}`); // Debugging log

        const updateQuery = `
            UPDATE "User" 
            SET 
                full_name = COALESCE($1, full_name), 
                email = COALESCE($2, email), 
                profile_pic = COALESCE($3, profile_pic),
                updated_at = NOW()
            WHERE user_id = $4
            RETURNING user_id, full_name, email, profile_pic;
        `;

        const { rows } = await pool.query(updateQuery, [full_name, email, profile_pic, userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json({ message: "Profile updated successfully!", user: rows[0] });
    } catch (error) {
        console.error("❌ Error updating profile:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ Upload Profile Picture (POST /api/users/profile/upload)
            export const uploadProfilePic = asyncHandler(async (req, res) => {
                try {
                    if (!req.file) {
                        return res.status(400).json({ message: "No file uploaded." });
                    }

                    const profilePicUrl = `/uploads/${req.file.filename}`;
                    const userId = req.user.userId;

                    console.log(`🔹 Uploading profile picture for user ID: ${userId}`);

                    const updateQuery = `UPDATE "User" SET profile_pic = $1 WHERE user_id = $2 RETURNING profile_pic`;
                    const { rows } = await pool.query(updateQuery, [profilePicUrl, userId]);

                    if (rows.length === 0) {
                        return res.status(404).json({ message: "User not found." });
                    }

                    res.json({ 
                        message: "Profile picture updated successfully!", 
                        profilePic: `http://localhost:5000${rows[0].profile_pic}` // ✅ Store full URL
                    });
                } catch (error) {
                    console.error("❌ Error uploading profile picture:", error.message);
                    res.status(500).json({ message: "Server error", error: error.message });
                }
            });
