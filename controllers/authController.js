import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js'; // Ensure you have database connection
import nodemailer from 'nodemailer';


// Register User
export const registerUser = async (req, res) => {
    console.log("🔹 Register API hit!");
    console.log("📌 Request Body:", req.body); // Debugging

    try {
        const { full_name, email, password, role, profile_pic } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ message: "Full name, email, and password are required" });
        }

        // Check if user already exists
        const existingUser = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user into DB
        const newUser = await pool.query(
            `INSERT INTO "User" (full_name, email, password_hash, role, profile_pic, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
            [full_name, email, hashedPassword, role || 'user', profile_pic || null]
        );

        // Generate JWT Token
        const token = jwt.sign({ user_id: newUser.rows[0].user_id, email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: "User registered successfully", token });
    } catch (error) {
        console.error("🔥 Error:", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// user Login 

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
      const userQuery = 'SELECT user_id, full_name, email, password_hash, role FROM "User" WHERE email = $1';
      const { rows } = await pool.query(userQuery, [email]);

      if (rows.length === 0) {
          return res.status(401).json({ message: 'Invalid email or password' });
      }

      const user = rows[0];

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
          return res.status(401).json({ message: 'Invalid email or password' });
      }

      // ✅ Generate JWT token with correct `user_id`
      // ✅ Increase token expiry time to 7 days
          const token = jwt.sign(
            { user_id: user.user_id, role: user.role }, // Ensure correct payload key
            process.env.JWT_SECRET,
            { expiresIn: "7d" } // 🔥 Token now expires in 7 days instead of 1 hour
          );

      res.json({ message: 'Login successful', token });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};

  // Password Recovery (Forgot Password)
  export const forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
  
    try {
      const userQuery = 'SELECT * FROM "User" WHERE email = $1';
      const { rows } = await pool.query(userQuery, [email]);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const user = rows[0];
  
      // Generate Reset Token
      const resetToken = Math.random().toString(36).substr(2);
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry
  
      // Update DB with token
      await pool.query(
        'UPDATE "User" SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
        [resetToken, resetTokenExpiry, email]
      );
  
      // Send Email
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        text: `Use this token to reset your password: ${resetToken}`,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.json({ message: 'Password reset token sent to email' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // Reset Password
export const resetPassword = async (req, res) => {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
        return res.status(400).json({ message: "Email, reset token, and new password are required" });
    }

    try {
        // Check if user exists & token is valid
        const userQuery = 'SELECT * FROM "User" WHERE email = $1 AND reset_token = $2 AND reset_token_expiry > NOW()';
        const { rows } = await pool.query(userQuery, [email, resetToken]);

        if (rows.length === 0) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        const user = rows[0];

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password in DB & clear reset token
        await pool.query(
            'UPDATE "User" SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW() WHERE email = $2',
            [hashedPassword, email]
        );

        res.json({ message: "Password reset successful! You can now log in with your new password." });
    } catch (error) {
        console.error("Error resetting password:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};