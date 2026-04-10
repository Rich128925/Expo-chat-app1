import { API_URL } from '@/constants'
import { io, Socket } from 'socket.io-client'
import AsyncStorage from '@react-native-async-storage/async-storage'

let socket: Socket | null = null

export async function connectSocket(): Promise<Socket> {
  const token = await AsyncStorage.getItem('token')

  if (!token) {
    throw new Error('No token found. User must be authenticated to connect to socket.')
  }

  // prevent multiple connections
  if (!socket) {
    socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'], // ✅ force websocket (important for RN)
    })

    await new Promise<void>((resolve) => {
      socket?.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id)
        resolve()
      })
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
      socket = null
    })

    socket.on('connect_error', (err) => {
      console.log('❌ Socket connection error:', err.message)
    })
  }

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}