import type { Server, Socket } from 'socket.io'
import { createRoom, getRoom, deleteRoom, getRoomBySocketId } from '../state/rooms'
import type { RoomMember } from '../state/rooms'
import { stopSyncInterval } from './playerHandlers'

interface CreatePayload {
  spotifyId: string
  displayName: string
}

interface JoinPayload {
  code: string
  spotifyId: string
  displayName: string
}

interface RoomResponse {
  code: string
  members: Array<{ spotifyId: string; displayName: string; isHost: boolean }>
}

interface ErrorResponse {
  error: string
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function serializeMembers(members: Map<string, RoomMember>) {
  return Array.from(members.values()).map(({ spotifyId, displayName, isHost }) => ({
    spotifyId,
    displayName,
    isHost,
  }))
}

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on('room:create', (payload: CreatePayload, cb: (res: RoomResponse | ErrorResponse) => void) => {
    const { spotifyId, displayName } = payload

    let code = generateCode()
    while (getRoom(code)) {
      code = generateCode()
    }

    const host: RoomMember = {
      socketId: socket.id,
      spotifyId,
      displayName,
      isHost: true,
    }

    const room = createRoom(code, host)
    socket.join(code)

    cb({ code, members: serializeMembers(room.members) })
  })

  socket.on('room:join', (payload: JoinPayload, cb: (res: RoomResponse | ErrorResponse) => void) => {
    const { code, spotifyId, displayName } = payload
    const room = getRoom(code)

    if (!room) {
      cb({ error: 'Room not found' })
      return
    }

    const member: RoomMember = {
      socketId: socket.id,
      spotifyId,
      displayName,
      isHost: false,
    }

    room.members.set(socket.id, member)
    socket.join(code)

    io.to(code).emit('room:members', { members: serializeMembers(room.members) })

    // Send current playback state to the new member
    if (room.currentTrack) {
      const elapsed = Date.now() - room.lastSyncTimestamp
      const currentPosition = room.isPlaying ? room.positionMs + elapsed : room.positionMs
      socket.emit('player:sync', {
        track: room.currentTrack,
        positionMs: currentPosition,
        isPlaying: room.isPlaying,
        timestamp: Date.now(),
      })
    }

    cb({ code, members: serializeMembers(room.members) })
  })

  socket.on('room:leave', () => {
    handleLeave(io, socket)
  })

  socket.on('disconnect', () => {
    handleLeave(io, socket)
  })
}

function handleLeave(io: Server, socket: Socket): void {
  const room = getRoomBySocketId(socket.id)
  if (!room) return

  const member = room.members.get(socket.id)
  const isHost = member?.isHost ?? false

  room.members.delete(socket.id)
  socket.leave(room.code)

  if (isHost || room.members.size === 0) {
    stopSyncInterval(room.code)
    io.to(room.code).emit('room:closed')
    deleteRoom(room.code)
  } else {
    io.to(room.code).emit('room:members', { members: serializeMembers(room.members) })
  }
}
