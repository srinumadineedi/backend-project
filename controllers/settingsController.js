import pool from "../config/db.js";

// ✅ Get User Messaging Settings
export const getMessagingSettings = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ Extract user ID from token

    const result = await pool.query(
      `SELECT chat_notifications, email_notifications 
       FROM "User" 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]); // ✅ Return Chat & Email Notifications
  } catch (error) {
    console.error("❌ Error fetching settings:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Update User Messaging Settings
export const updateMessagingSettings = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ Extract user ID from token
    const { chat_notifications, email_notifications } = req.body; // ✅ Get Updated Settings

    const result = await pool.query(
      `UPDATE "User"
       SET chat_notifications = COALESCE($1, chat_notifications), 
           email_notifications = COALESCE($2, email_notifications),
           updated_at = NOW()
       WHERE user_id = $3 
       RETURNING chat_notifications, email_notifications`,
      [chat_notifications, email_notifications, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "✅ Messaging Settings Updated Successfully",
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error updating settings:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
