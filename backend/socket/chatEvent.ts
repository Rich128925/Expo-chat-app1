// socket/chatEvent.ts
import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../modals/Coversation"; // Fixed: models not modals, Conversation not Coversation
import Message from "../modals/Message";
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

  socket.on("getConversations", async () => {
    try {
      const conversations = await Conversation.find({
        participants: socket.data.userId,
      })
        .populate({
          path: "participants",
          select: "name avatar email",
        })
        .populate({
          path: "lastMessage",
          populate: {
            path: "senderId",
            select: "name avatar",
          },
        })
        .sort({ updatedAt: -1 })
        .lean();

      socket.emit("getConversations", {
        success: true,
        data: conversations,
      });
    } catch (error: any) {
      console.log("Get conversations error:", error);
      socket.emit("getConversations", {
        success: false,
        msg: "Failed to fetch conversations",
      });
    }
  });

  socket.on("getMessages", async (data: any) => {
    try {
      const { conversationId } = data;
      if (!conversationId) {
        return socket.emit("getMessages", {
          success: false,
          msg: "conversationId required",
        });
      }

      const messages = await Message.find({ conversationId })
        .populate({
          path: "senderId",
          select: "name avatar email",
        })
        .sort({ createdAt: 1 })
        .lean();

      socket.emit("getMessages", {
        success: true,
        data: messages,
      });
    } catch (error: any) {
      console.log("Get messages error:", error);
      socket.emit("getMessages", {
        success: false,
        msg: "Failed to fetch messages",
      });
    }
  });

  socket.on("sendMessage", async (data: any) => {
    try {
      const { conversationId, content, attachment } = data;

      if (!conversationId || (!content && !attachment)) {
        return socket.emit("newMessage", {
          success: false,
          msg: "Invalid message format",
        });
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return socket.emit("newMessage", {
          success: false,
          msg: "Conversation not found",
        });
      }

      const newMessage = await Message.create({
        conversationId,
        senderId: socket.data.userId,
        content: content || "",
        attachment: attachment || "",
      });

      conversation.lastMessage = newMessage._id;
      conversation.updatedAt = new Date();
      await conversation.save();

      const populatedMessage = await Message.findById(newMessage._id)
        .populate({
          path: "senderId",
          select: "name avatar email",
        })
        .lean();

      // Emit to the conversation room
      io.to(conversationId.toString()).emit("newMessage", {
        success: true,
        data: populatedMessage,
      });
      
      // We also emit a conversations refresh token for participants so they know lastMessage changed
      io.to(conversationId.toString()).emit("refreshConversations");
      
    } catch (error: any) {
      console.log("Send message error:", error);
      socket.emit("newMessage", {
        success: false,
        msg: "Failed to send message",
      });
    }
  });

  socket.on("deleteMessage", async (data: any) => {
    try {
      const { messageId, conversationId } = data;
      if (!messageId || !conversationId) return;

      const message = await Message.findById(messageId);
      
      if (!message || message.senderId.toString() !== socket.data.userId.toString()) {
         return; // Only sender can delete for everyone
      }

      message.content = "";
      message.attachment = "";
      message.isDeleted = true;
      await message.save();

      io.to(conversationId.toString()).emit("messageDeleted", {
        messageId,
        conversationId
      });
      
      io.to(conversationId.toString()).emit("refreshConversations");

    } catch (error) {
      console.log("Delete message error:", error);
    }
  });

  socket.on("deleteConversation", async (data: any) => {
    try {
      const { conversationId } = data;
      if (!conversationId) return;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(socket.data.userId)) {
         return; 
      }

      await Message.deleteMany({ conversationId });
      await Conversation.findByIdAndDelete(conversationId);

      io.to(conversationId.toString()).emit("conversationDeleted", {
        conversationId
      });
      
      io.to(conversationId.toString()).emit("refreshConversations");

    } catch (error) {
       console.log("Delete conv error:", error);
    }
  });
}