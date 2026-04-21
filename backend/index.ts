import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import { initializeSocket } from "./socket/socket";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT: number = parseInt(process.env.PORT || "3000", 10);
const HOST: string = process.env.HOST || "0.0.0.0";

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/auth/test", (req, res) => {
  res.json({ success: true, message: "Auth endpoint is working!" });
});

// Socket setup
initializeSocket(server);

// Graceful shutdown helper
const shutdown = (signal: string) => {
  console.log(`${signal} received, closing server...`);
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  // Force exit if server doesn't close in 5 seconds
  setTimeout(() => {
    console.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 5000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Start server
const startServer = async () => {
  try {
    console.log("Starting server...");
    console.log(`Node version: ${process.version}`);

    await connectDB();
    console.log("✅ Database Connected");

    server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
});

    // Handle port-in-use and other listen errors
    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use. Retrying in 3 seconds...`);
        setTimeout(() => {
          server.close();
          server.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Server running on port ${PORT} (after retry)`);
          });
        }, 3000);
      } else {
        console.error("❌ Server error:", error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();