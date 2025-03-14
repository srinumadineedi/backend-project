// controllers/messageController.js
import pool from '../config/db.js';

// Fetch all messages for a conversation
export const getMessages = async (req, res) => {
    try {
        const { conversation_id } = req.params;
        const result = await pool.query(
            `SELECT * FROM messages 
             WHERE conversation_id = $1 
             ORDER BY timestamp ASC`,
            [conversation_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// Send a new message
export const sendMessage = async (req, res) => {
    try {
        const { sender_id, receiver_id, conversation_id, content, image_url } = req.body;

        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, conversation_id, content, image_url) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [sender_id, receiver_id, conversation_id, content, image_url]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};