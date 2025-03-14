import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from "fs";
import pool from "./config/db.js"; // Import database connection
import jwt from 'jsonwebtoken';

// Import API Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import petRoutes from "./routes/petRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import matchRoutes from "./routes/matchRoutes.js"; // Added match routes
import feedbackRoutes from "./routes/feedbackRoutes.js";
import compatibilityRoutes from "./routes/compatibilityRoutes.js"; // Import new route
import reportRoutes from "./routes/reportRoutes.js"; // Import Reports API
import settingsRoutes from "./routes/settingsRoutes.js";

dotenv.config();

const app = express();
const server = createServer(app); // Create HTTP server
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL, // Change to Railway's Frontend URL
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Ensure "uploads" folder exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

// ✅ JWT Token Verification Middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401); // Unauthorized
    }
};

// ✅ Register All API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/messages", verifyToken, messageRoutes);
app.use("/api/conversations", verifyToken, conversationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/matches", verifyToken, matchRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/pets/compatibility", compatibilityRoutes);
app.use("/api/messaging-settings", settingsRoutes);
app.use("/api/reports", reportRoutes);

// ✅ Database Connection
pool.connect()
    .then(() => console.log("✅ Database connected successfully"))
    .catch(err => {
        console.error("❌ Database connection error:", err);
        process.exit(1);
    });

// ✅ WebSocket Connection Handler
io.on("connection", (socket) => {
    console.log(`🔥 A new user connected: ${socket.id}`);

    socket.on("registerUser", (userId) => {
        console.log(`👤 User registered with WebSocket: userId = ${userId}`);
        socket.userId = userId;
    });

    socket.onAny((event, data) => {
        console.log(`📩 Received event: ${event}, Data:`, data);
    });

    socket.on("sendMessage", async (messageData) => {
        try {
            const { sender_id, receiver_id, conversation_id, content, image_url } = messageData;

            if (!sender_id || !receiver_id || !conversation_id || !content) {
                console.error("❌ Invalid message data received.");
                return;
            }

            await pool.query("BEGIN");
            const result = await pool.query(
                `INSERT INTO messages (sender_id, receiver_id, conversation_id, content, image_url, timestamp)
                 VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
                [sender_id, receiver_id, conversation_id, content, image_url || null]
            );
            await pool.query("COMMIT");

            io.to(conversation_id.toString()).emit("receiveMessage", result.rows[0]);
            console.log(`📢 Message sent to conversation room ${conversation_id}`);
        } catch (error) {
            console.error("❌ Database error:", error);
            await pool.query("ROLLBACK");
        }
    });

    socket.on("disconnect", () => {
        console.log(`❌ User disconnected: ${socket.id}`);
    });
});

// ✅ Port Configuration for Railway
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
});
