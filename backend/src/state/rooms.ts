export interface TrackInfo {
  uri: string
  name: string
  artists: string[]
  albumArt: string
  durationMs: number
}

export interface QueueItem {
  id: string
  track: TrackInfo
  addedBy: string
}

export interface RoomMember {
  socketId: string
  spotifyId: string
  displayName: string
  isHost: boolean
}

export interface RoomState {
  code: string
  members: Map<string, RoomMember>
  currentTrack: TrackInfo | null
  positionMs: number
  isPlaying: boolean
  queue: QueueItem[]
  lastSyncTimestamp: number
}

const rooms = new Map<string, RoomState>()

export function createRoom(code: string, host: RoomMember): RoomState {
  const room: RoomState = {
    code,
    members: new Map([[host.socketId, host]]),
    currentTrack: null,
    positionMs: 0,
    isPlaying: false,
    queue: [],
    lastSyncTimestamp: Date.now(),
  }
  rooms.set(code, room)
  return room
}

export function getRoom(code: string): RoomState | undefined {
  return rooms.get(code)
}

export function deleteRoom(code: string): void {
  rooms.delete(code)
}

export function getAllRooms(): Map<string, RoomState> {
  return rooms
}

export function getRoomBySocketId(socketId: string): RoomState | undefined {
  for (const room of rooms.values()) {
    if (room.members.has(socketId)) return room
  }
  return undefined
}
