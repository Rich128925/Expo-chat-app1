import dotenv from "dotenv";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { registerUserEvents } from "./userEvents";
import { registerChatEvents } from "./chatEvent";
import Conversation from "../modals/Coversation";

dotenv.config();

export function initializeSocket(server: any): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
    },
  });

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
      socket.data.userId = userData.id;

      next();
    });
  });

  io.on("connection", async (socket: Socket) => {
    console.log(
      `🔌 Socket connected: ${socket.id} (User ID: ${socket.data.userId})`
    );

    registerChatEvents(io, socket);
    registerUserEvents(io, socket);

    try {
      const userId = socket.data.userId;

      if (!userId) {
        console.log("No userId found on socket");
      } else {
        const conversations = await Conversation.find({
          participants: userId,
        }).select("_id");

        conversations.forEach((conversation: any) => {
          socket.join(conversation._id.toString());
        });

        console.log(
          `✅ User ${userId} joined ${conversations.length} conversation(s)`
        );
      }
    } catch (error: any) {
      console.log("Error joining conversations:", error);
    }

    socket.on("disconnect", () => {
      console.log(
        `🔌 Socket disconnected: ${socket.id} (User ID: ${socket.data.userId})`
      );
    });
  });

  return io;
}