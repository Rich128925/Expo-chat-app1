import {API_URL} from '@/constants'
import {io, Socket} from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";


let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
const token = await AsyncStorage.getItem("token");

if (!token) {
  throw new Error("No token found. User must be authenticated to connect to socket.");
}

if(!socket){
  socket = io(API_URL, {
    auth: {token}
  });

  // wait for connection to be established
  await new Promise((resolve) => {
    socket?.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);
      resolve(socket);
    }); 
});   

  socket.on('disconnect', () => {
    console.log("🔌 Socket disconnected");
    socket = null; // reset socket on disconnect
  });
}
return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void
{
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}