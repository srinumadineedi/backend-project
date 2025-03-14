// controllers/conversationController.js
import pool from '../config/db.js';

// Get all conversations for a user
export const getConversations = async (req, res) => {
    try {
        const { user_id } = req.params;
        const result = await pool.query(
            `SELECT * FROM conversations 
             WHERE user1_id = $1 OR user2_id = $1`,
            [user_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// Create a new conversation between two users
export const createConversation = async (req, res) => {
    try {
        const { user1_id, user2_id } = req.body;

        // Check if conversation already exists
        const existingConversation = await pool.query(
            `SELECT * FROM conversations 
             WHERE (user1_id = $1 AND user2_id = $2) 
                OR (user1_id = $2 AND user2_id = $1)`,
            [user1_id, user2_id]
        );

        if (existingConversation.rows.length > 0) {
            return res.json(existingConversation.rows[0]); // If exists, return it
        }

        // Create new conversation
        const result = await pool.query(
            `INSERT INTO conversations (user1_id, user2_id) 
             VALUES ($1, $2) RETURNING *`,
            [user1_id, user2_id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};