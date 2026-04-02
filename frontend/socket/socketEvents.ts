import { getSocket } from "./socket";

type TestSocketPayload = {
  msg: string;
};

export const testSocket = (
  payload: TestSocketPayload | ((data: TestSocketPayload) => void),
  off: boolean = false
) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    if (typeof payload === "function") {
      socket.off("testSocket", payload);
    }
  } else if (typeof payload === "function") {
    socket.on("testSocket", payload);
  } else {
    socket.emit("testSocket", payload);
  }
};