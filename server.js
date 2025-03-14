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
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// ✅ Middleware
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Ensure "uploads" folder exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

// ✅ Function to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
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

// ✅ Register API Routes (Secured with JWT)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/messages", verifyToken, messageRoutes);
app.use("/api/conversations", verifyToken, conversationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/matches", verifyToken, matchRoutes); // Added match API
app.use("/api/feedback", feedbackRoutes);
app.use("/api/pets/compatibility", compatibilityRoutes); // Add route to server

app.use("/api/messaging-settings", settingsRoutes);




// ✅ Register Reports API
app.use("/api/reports", reportRoutes);



// ✅ Check Database Connection
pool.connect()
    .then(() => console.log("✅ Database connected successfully"))
    .catch(err => {
        console.error("❌ Database connection error:", err);
        process.exit(1);
    });

// ✅ WebSocket Connection Handler
io.on("connection", (socket) => {
    console.log(`🔥 A new user connected: ${socket.id}`);

    // Receive userId from the frontend when connecting
    socket.on("registerUser", (userId) => {
        console.log(`👤 User registered with WebSocket: userId = ${userId}`);

        // Save user in the socket object
        socket.userId = userId;
    });

    // Log all received events
    socket.onAny((event, data) => {
        console.log(`📩 Received event: ${event}, Data:`, data);
    });

    // Handle Sending Messages
    socket.on("sendMessage", async (messageData) => {
        console.log("📨 sendMessage event triggered:", messageData);

        try {
            const sender_id = parseInt(messageData.sender_id, 10);
            const receiver_id = parseInt(messageData.receiver_id, 10);
            const conversation_id = parseInt(messageData.conversation_id, 10);
            const content = messageData.content;
            const image_url = messageData.image_url || null;

            if (isNaN(sender_id) || isNaN(receiver_id) || isNaN(conversation_id) || !content) {
                console.error("❌ Invalid message data received.");
                return;
            }

            // Log sender info
            console.log(`🔹 Sender: ${sender_id}, Receiver: ${receiver_id}, Conversation: ${conversation_id}`);

            // Insert message into database
            await pool.query("BEGIN");
            const result = await pool.query(
                `INSERT INTO messages (sender_id, receiver_id, conversation_id, content, image_url, timestamp)
                 VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
                [sender_id, receiver_id, conversation_id, content, image_url]
            );
            await pool.query("COMMIT");

            console.log("✅ Message saved to DB:", result.rows[0]);

            // Emit the new message to the conversation room
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

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running with WebSockets on port ${PORT}`);
});