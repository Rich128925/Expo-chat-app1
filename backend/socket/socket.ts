import dotenv from "dotenv";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { registerUserEvents } from "./userEvents";

dotenv.config();

export function initializeSocket(server: any): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
    },
  });

  // 🔐 Auth middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
      if (err) {
        return next(new Error("Authentication error: Invalid token"));
      }

      const userData = decoded.user;

      socket.data.user = userData;
      socket.data.userId = userData._id || userData.name;

      next(); 
    });
  });

  // 🔌 Connection handler
  io.on("connection", (socket: Socket) => {
    console.log(
      `🔌 Socket connected: ${socket.id} (User ID: ${socket.data.userId})`
    );

    // Register user
    registerUserEvents(io, socket);

    // disconnect event
    socket.on("disconnect", () => {
      console.log(
        `🔌 Socket disconnected: ${socket.id} (User ID: ${socket.data.userId})`
      );
    });
  });

  return io;
}