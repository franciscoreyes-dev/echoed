import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TrackInfo {
  uri: string
  name: string
  artists: string[]
  albumArt: string
  durationMs: number
}

export const usePlayerStore = defineStore('player', () => {
  const currentTrack = ref<TrackInfo | null>(null)
  const isPlaying = ref<boolean>(false)
  const positionMs = ref<number>(0)
  const deviceId = ref<string | null>(null)

  function reset(): void {
    currentTrack.value = null
    isPlaying.value = false
    positionMs.value = 0
  }

  return { currentTrack, isPlaying, positionMs, deviceId, reset }
})
