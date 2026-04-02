import { Socket, Server as SocketIOServer } from "socket.io";

export function registerUserEvents(io: SocketIOServer, socket: Socket) {
  
  socket.on("testSocket", (data, callback) => {
    console.log("📩 Received testSocket event:", data);

    const response = { msg: "It's working!!!" };

    // send response back
    socket.emit("testSocket", response);

    // optional: acknowledgement callback
    if (callback) {
      callback(response);
    }
  });

}