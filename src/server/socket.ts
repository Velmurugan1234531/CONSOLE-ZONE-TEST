import { createServer } from "http";
import { Server } from "socket.io";
import amqp from "amqplib";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

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


import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client for Token Verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Use Anon for getUser, or Service Role for admin tasks if needed. getUser is fine with Anon if we just want to verify validity.
// Actually, to verify a JWT *without* a network call, we'd need the secret.
// To verify via Supabase API (easiest), we use getUser(token).
const supabase = createClient(supabaseUrl, supabaseKey);

// --- AUTHENTICATION MIDDLEWARE ---
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        console.warn(`[AUTH] Connection rejected for ${socket.id}: No token provided.`);
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.warn(`[AUTH] Invalid token for ${socket.id}:`, error?.message);
            return next(new Error("Authentication error: Invalid token"));
        }

        // Attach user to socket
        socket.data.user = user;
        console.log(`[AUTH] User connected: ${user.email} (${user.id})`);
        next();

    } catch (e) {
        console.error("Auth Middleware Error:", e);
        next(new Error("Internal Server Error during Auth"));
    }
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("customer_location_update", async (data) => {
        // 1. Validate JWT (Mocked for now as we don't have the auth middleware here)
        // In a real app, use socket.io middleware to verify JWT

        const { lat, lng, speed, heading, timestamp, userId } = data;

        console.log(`Location update for user ${userId || socket.id}: ${lat}, ${lng}`);

        // 2. Publish to RabbitMQ
        if (rabbitChannel) {
            const payload = JSON.stringify({
                userId,
                location: { lat, lng },
                status: "active",
                timestamp
            });

            rabbitChannel.publish("rental.events", "customer.location.updated", Buffer.from(payload));
        }

        // 3. Emit to rider room in realtime (assuming roomId is 'riders')
        io.to("riders").emit("rider_location_sync", {
            userId,
            lat,
            lng,
            timestamp
        });

        // 4. Save to database (logic would go here)
        // await saveLastLocation(userId, { lat, lng, timestamp });
    });

    socket.on("join_room", (room) => {
        // In production, add a check here: only admins can join 'riders' or 'telemetry'
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
