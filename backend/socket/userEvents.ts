import { Socket, Server as SocketIOServer } from "socket.io";
import User from "../modals/User";
import { generateToken } from "../utils/token";

export function registerUserEvents(io: SocketIOServer, socket: Socket) {
  socket.on("testSocket", (data, callback) => {
    console.log("📩 Received testSocket event:", data);

    const response = { msg: "It's working!!!" };

    socket.emit("testSocket", response);

    if (callback) {
      callback(response);
    }
  });

  socket.on(
    "updateProfile",
    async (data: {
      name?: string;
      avatar?: string | null;
      username?: string;
      phone?: string;
      address?: string;
      bio?: string;
    }) => {
      console.log("updateProfile event:", data);

      const userId = socket.data.userId;

      if (!userId) {
        return socket.emit("updateProfile", {
          success: false,
          msg: "Unauthorized",
        });
      }

      try {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            name: data.name,
            avatar: data.avatar,
            username: data.username,
            phone: data.phone,
            address: data.address,
            bio: data.bio,
          },
          { returnDocument: "after" }
        );

        if (!updatedUser) {
          return socket.emit("updateProfile", {
            success: false,
            msg: "User not found",
          });
        }

        const newToken = generateToken(updatedUser);

        socket.emit("updateProfile", {
          success: true,
          data: {
            token: newToken,
            user: updatedUser,
          },
          msg: "Profile updated successfully",
        });
      } catch (error) {
        console.log("Error updating profile:", error);

        socket.emit("updateProfile", {
          success: false,
          msg: "Error updating profile",
        });
      }
    }
  );

  socket.on("getContacts", async () => {
    try {
      const currentUserId = socket.data.userId;

      if (!currentUserId) {
        socket.emit("getContacts", {
          success: false,
          msg: "Unauthorized",
        });

        return;
      }

      const users = await User.find(
        {_id: {$ne: currentUserId}},
        {password: 0} // exlude password
      ). lean(); // will fetch js objects

      const contacts = users.map((user)=> ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || ""
      }));

      socket.emit("getContacts", {
        success: true,
        data: contacts,
      });

    } catch (error: any) {
      console.log("getContacts error:", error);
      socket.emit("getContacts", {
        success: false,
        msg: "Failed to fetch contacts",
      });
    }
  });
}