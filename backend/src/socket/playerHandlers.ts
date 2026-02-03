import type { Server, Socket } from 'socket.io'
import { getRoom, getRoomBySocketId } from '../state/rooms'
import type { TrackInfo } from '../state/rooms'

interface StateChangePayload {
  track: TrackInfo | null
  positionMs: number
  isPlaying: boolean
}

interface SyncPayload {
  track: TrackInfo | null
  positionMs: number
  isPlaying: boolean
  timestamp: number
}

const syncIntervals = new Map<string, ReturnType<typeof setInterval>>()

function broadcastSync(io: Server, roomCode: string): void {
  const room = getRoom(roomCode)
  if (!room) return

  const payload: SyncPayload = {
    track: room.currentTrack,
    positionMs: room.positionMs,
    isPlaying: room.isPlaying,
    timestamp: Date.now(),
  }
  room.lastSyncTimestamp = payload.timestamp

  io.to(roomCode).emit('player:sync', payload)
}

function startSyncInterval(io: Server, roomCode: string): void {
  if (syncIntervals.has(roomCode)) return

  const interval = setInterval(() => {
    const room = getRoom(roomCode)
    if (!room) {
      stopSyncInterval(roomCode)
      return
    }
    // Only broadcast if playing (no need to sync paused state repeatedly)
    if (room.isPlaying) {
      // Update position based on elapsed time since last sync
      const elapsed = Date.now() - room.lastSyncTimestamp
      room.positionMs += elapsed
      broadcastSync(io, roomCode)
    }
  }, 5000)

  syncIntervals.set(roomCode, interval)
}

export function stopSyncInterval(roomCode: string): void {
  const interval = syncIntervals.get(roomCode)
  if (interval) {
    clearInterval(interval)
    syncIntervals.delete(roomCode)
  }
}

export function registerPlayerHandlers(io: Server, socket: Socket): void {
  socket.on('player:state-change', (payload: StateChangePayload) => {
    const room = getRoomBySocketId(socket.id)
    if (!room) return

    // Only host can send state changes
    const member = room.members.get(socket.id)
    if (!member?.isHost) return

    // Update room state
    room.currentTrack = payload.track
    room.positionMs = payload.positionMs
    room.isPlaying = payload.isPlaying

    // Broadcast to all room members
    broadcastSync(io, room.code)

    // Start sync interval if playing
    if (payload.isPlaying) {
      startSyncInterval(io, room.code)
    } else {
      stopSyncInterval(room.code)
    }
  })
}
