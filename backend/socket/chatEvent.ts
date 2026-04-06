import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from '../modals/Coversation'


export function registerChatEvents(io: SocketIOServer, socket: Socket){
  socket.on("newConversation", async (data) =>{
    console.log("newConversation event: ", data);

    try {
      if (data.type == 'direct') {
        // check if already exists
        const existingConversation = await Conversation.findOne({
          type: 'direct',
          participants: {$all: data.participants, $size: 2},
        })
        .populate({
          path: "participants",
          select: "name avatar email"
        })
        .lean();

        if (existingConversation) {
          socket.emit("newConversation", {
            success: true,
            data: {...existingConversation, isNew: false}
          })
        }
      }


      // create new conversation
      const conversation = await Conversation.create({
        type: data.type,
        participants: data.participants,
        name: data.name || "", // can be empty if direct conversation
        avatar: data.avatar || "", // same
        createdBy: socket.data.userId,
      })
      
    } catch (error: any) {
      console.log("newConversation error: ", error);
      socket.emit("newConversation", {
        success: false,
        msg: "Failed to create conversation",
      })
      
    }
    
  })
}