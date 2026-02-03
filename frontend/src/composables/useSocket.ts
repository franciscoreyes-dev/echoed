import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { useRoomStore } from '@/stores/room'
import { usePlayerStore } from '@/stores/player'
import { useRouter } from 'vue-router'
import type { RoomMember } from '@/stores/room'
import type { TrackInfo } from '@/stores/player'

interface RoomResponse {
  code: string
  members: RoomMember[]
}

interface ErrorResponse {
  error: string
}

interface SyncPayload {
  track: TrackInfo | null
  positionMs: number
  isPlaying: boolean
  timestamp: number
}

interface SyncData {
  track: TrackInfo | null
  positionMs: number
  isPlaying: boolean
}

type SyncCallback = (data: SyncData) => void

let socket: Socket | null = null
let syncCallback: SyncCallback | null = null

export function useSocket() {
  const roomStore = useRoomStore()
  const playerStore = usePlayerStore()
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

      socket.on('player:sync', (payload: SyncPayload) => {
        // Calculate expected position accounting for network latency
        const latency = Date.now() - payload.timestamp
        const expectedPosition = payload.positionMs + (payload.isPlaying ? latency : 0)

        // Update player store
        playerStore.currentTrack = payload.track
        playerStore.isPlaying = payload.isPlaying
        playerStore.positionMs = expectedPosition

        // Call sync callback for non-hosts to control their player
        if (!roomStore.isHost && syncCallback) {
          syncCallback({
            track: payload.track,
            positionMs: expectedPosition,
            isPlaying: payload.isPlaying,
          })
        }
      })
    }
    return socket
  }

  function onSync(callback: SyncCallback): void {
    syncCallback = callback
  }

  function emitPlayerState(track: TrackInfo | null, positionMs: number, isPlaying: boolean): void {
    if (!socket || !roomStore.isHost) return
    socket.emit('player:state-change', { track, positionMs, isPlaying })
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

  return { createRoom, joinRoom, leaveRoom, disconnect, onSync, emitPlayerState }
}
