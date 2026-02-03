import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { useRoomStore } from '@/stores/room'
import { useRouter } from 'vue-router'
import type { RoomMember } from '@/stores/room'

interface RoomResponse {
  code: string
  members: RoomMember[]
}

interface ErrorResponse {
  error: string
}

let socket: Socket | null = null

export function useSocket() {
  const roomStore = useRoomStore()
  const router = useRouter()

  function ensureSocket(): Socket {
    if (!socket) {
      socket = io(import.meta.env.VITE_BACKEND_URL)

      socket.on('room:members', (data: { members: RoomMember[] }) => {
        roomStore.members = data.members
      })

      socket.on('room:closed', () => {
        roomStore.reset()
        router.push('/lobby')
      })
    }
    return socket
  }

  async function createRoom(spotifyId: string, displayName: string): Promise<string> {
    const s = ensureSocket()
    return new Promise((resolve, reject) => {
      s.emit('room:create', { spotifyId, displayName }, (res: RoomResponse | ErrorResponse) => {
        if ('error' in res) {
          reject(new Error(res.error))
        } else {
          roomStore.roomCode = res.code
          roomStore.members = res.members
          roomStore.isHost = true
          resolve(res.code)
        }
      })
    })
  }

  async function joinRoom(code: string, spotifyId: string, displayName: string): Promise<string> {
    const s = ensureSocket()
    return new Promise((resolve, reject) => {
      s.emit('room:join', { code, spotifyId, displayName }, (res: RoomResponse | ErrorResponse) => {
        if ('error' in res) {
          reject(new Error(res.error))
        } else {
          roomStore.roomCode = res.code
          roomStore.members = res.members
          roomStore.isHost = false
          resolve(res.code)
        }
      })
    })
  }

  function leaveRoom(): void {
    if (!socket) return
    socket.emit('room:leave')
    roomStore.reset()
  }

  function disconnect(): void {
    if (socket) {
      socket.disconnect()
      socket = null
    }
    roomStore.reset()
  }

  return { createRoom, joinRoom, leaveRoom, disconnect }
}
