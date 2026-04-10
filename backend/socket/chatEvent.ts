// socket/chatEvent.ts
import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../modals/Coversation"; // Fixed: models not modals, Conversation not Coversation
import mongoose from "mongoose";

export function registerChatEvents(io: SocketIOServer, socket: Socket) {
  
  // Main handler function
  const handleNewConversation = async (data: any) => {
    console.log("New conversation event:", data);

    try {
      if (!data) {
        return socket.emit("newConversation", {
          success: false,
          msg: "No conversation data provided",
        });
      }

      const { type, participants, name, avatar } = data;

      if (!type) {
        return socket.emit("newConversation", {
          success: false,
          msg: "Conversation type is required",
        });
      }

      if (!participants || !Array.isArray(participants) || participants.length < 2) {
        return socket.emit("newConversation", {
          success: false,
          msg: "Participants are required",
        });
      }

      // Include current user if not already in participants
      let allParticipants = [...participants];
      if (!allParticipants.includes(socket.data.userId)) {
        allParticipants.push(socket.data.userId);
      }

      const cleanParticipants = [...new Set(allParticipants.map((id: string) => String(id)))];

      const hasInvalidId = cleanParticipants.some(
        (id: string) => !mongoose.Types.ObjectId.isValid(id)
      );

      if (hasInvalidId) {
        return socket.emit("newConversation", {
          success: false,
          msg: "One or more participant IDs are invalid",
        });
      }

      if (type === "direct") {
        if (cleanParticipants.length !== 2) {
          return socket.emit("newConversation", {
            success: false,
            msg: "Direct conversation must have exactly 2 participants",
          });
        }

        const existingConversation = await Conversation.findOne({
          type: "direct",
          participants: { $all: cleanParticipants, $size: 2 },
        })
          .populate({
            path: "participants",
            select: "name avatar email",
          })
          .lean();

        if (existingConversation) {
          return socket.emit("newConversation", {
            success: true,
            data: { ...existingConversation, isNew: false },
          });
        }
      }

      if (type === "group") {
        if (!name?.trim()) {
          return socket.emit("newConversation", {
            success: false,
            msg: "Group name is required",
          });
        }

        if (cleanParticipants.length < 3) {
          return socket.emit("newConversation", {
            success: false,
            msg: "Group must have at least 3 participants",
          });
        }
      }

      const conversation = await Conversation.create({
        type,
        participants: cleanParticipants,
        name: type === "group" ? name?.trim() || "" : "",
        avatar: type === "group" ? avatar || "" : "",
        createdBy: socket.data.userId,
      });

      const connectedSockets = Array.from(io.sockets.sockets.values()).filter((s) =>
        cleanParticipants.includes(String(s.data.userId))
      );

      connectedSockets.forEach((participantSocket) => {
        participantSocket.join(conversation._id.toString());
      });

      const populatedConversation = await Conversation.findById(conversation._id)
        .populate({
          path: "participants",
          select: "name avatar email",
        })
        .lean();

      // Emit to all participants
      io.to(conversation._id.toString()).emit("newConversation", {
        success: true,
        data: { ...populatedConversation, isNew: true },
      });
      
    } catch (error: any) {
      console.log("New conversation error:", error);
      socket.emit("newConversation", {
        success: false,
        msg: error.message || "Failed to create conversation",
      });
    }
  };

  // Listen for the event that frontend sends
  socket.on("newConversation", handleNewConversation);
}