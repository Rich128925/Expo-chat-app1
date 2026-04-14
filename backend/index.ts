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
const PORT: number = parseInt(process.env.PORT || "4000", 10); 

// middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

// Add test endpoint
app.get("/auth/test", (req, res) => {
  res.json({ success: true, message: "Auth endpoint is working!" });
});

// socket setup
initializeSocket(server);

// connect DB and start server
connectDB()
  .then(() => {
    console.log("✅ Database Connected");

    // FIXED: Use PORT as number and '0.0.0.0' as string
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`📍 http://10.0.2.2:${PORT} (for Android emulator)`);
    });
  })
  .catch((error) => {
    console.log("Failed to connect to MongoDB", error);
  });