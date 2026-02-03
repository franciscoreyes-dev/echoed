import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface RoomMember {
  spotifyId: string
  displayName: string
  isHost: boolean
}

export interface QueueTrack {
  id: string
  uri: string
  name: string
  artists: string[]
  albumArt: string
  durationMs: number
  addedBy: string
}

export const useRoomStore = defineStore('room', () => {
  const roomCode = ref<string | null>(null)
  const members = ref<RoomMember[]>([])
  const queue = ref<QueueTrack[]>([])
  const isHost = ref<boolean>(false)

  function reset(): void {
    roomCode.value = null
    members.value = []
    queue.value = []
    isHost.value = false
  }

  return { roomCode, members, queue, isHost, reset }
})
