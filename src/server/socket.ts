import { createServer } from "http";
import { Server } from "socket.io";
import amqp from "amqplib";
import * as dotenv from "dotenv";
import * as admin from "firebase-admin";

dotenv.config({ path: ".env.local" });

// Initialize Firebase Admin
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "consolezonev001"
    });
}

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let rabbitChannel: amqp.Channel | null = null;

async function initRabbitMQ() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost");
        rabbitChannel = await connection.createChannel();
        await rabbitChannel.assertExchange("rental.events", "topic", { durable: true });
        console.log("RabbitMQ connected and exchange asserted.");
    } catch (error) {
        console.error("RabbitMQ connection error:", error);
    }
}

// --- AUTHENTICATION MIDDLEWARE ---
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        console.warn(`[AUTH] Connection rejected for ${socket.id}: No token provided.`);
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        // Verify Firebase ID Token
        const decodedToken = await admin.auth().verifyIdToken(token);

        if (!decodedToken) {
            console.warn(`[AUTH] Invalid token for ${socket.id}: Verification failed.`);
            return next(new Error("Authentication error: Invalid token"));
        }

        // Attach user to socket
        socket.data.user = decodedToken;
        console.log(`[AUTH] User connected: ${decodedToken.email} (${decodedToken.uid})`);
        next();

    } catch (e: any) {
        console.error("Auth Middleware Error (Firebase):", e.message);
        next(new Error("Authentication error: " + e.message));
    }
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("customer_location_update", async (data) => {
        const { lat, lng, speed, heading, timestamp, userId } = data;
        const authUser = socket.data.user;

        console.log(`Location update for user ${userId || authUser?.uid || socket.id}: ${lat}, ${lng}`);

        // 2. Publish to RabbitMQ
        if (rabbitChannel) {
            const payload = JSON.stringify({
                userId: userId || authUser?.uid,
                location: { lat, lng },
                status: "active",
                timestamp
            });

            rabbitChannel.publish("rental.events", "customer.location.updated", Buffer.from(payload));
        }

        // 3. Emit to rider room in realtime (assuming roomId is 'riders')
        io.to("riders").emit("rider_location_sync", {
            userId: userId || authUser?.uid,
            lat,
            lng,
            timestamp
        });
    });

    socket.on("join_room", (room) => {
        socket.join(room);
        console.log(`[ROOM] Client ${socket.id} joined room: ${room}`);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
    initRabbitMQ();
});
