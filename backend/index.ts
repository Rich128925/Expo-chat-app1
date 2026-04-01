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
const PORT = process.env.PORT || 4000;

// socket setup

initializeSocket(server);

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

// connect DB and start server
connectDB()
  .then(() => {
    console.log("✅ Database Connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Failed to connect to MongoDB", error);
  });