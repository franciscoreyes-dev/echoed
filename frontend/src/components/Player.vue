<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useSpotifyPlayer } from '@/composables/useSpotifyPlayer'

const playerStore = usePlayerStore()
const { play, pause, seek } = useSpotifyPlayer()

const barRef = ref<HTMLDivElement | null>(null)

let ticker: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  ticker = setInterval(() => {
    if (playerStore.isPlaying && playerStore.currentTrack) {
      playerStore.positionMs = Math.min(
        playerStore.positionMs + 1000,
        playerStore.currentTrack.durationMs,
      )
    }
  }, 1000)
})

onUnmounted(() => {
  if (ticker !== null) clearInterval(ticker)
})

const progressPercent = computed(() => {
  if (!playerStore.currentTrack) return 0
  return Math.min(100, (playerStore.positionMs / playerStore.currentTrack.durationMs) * 100)
})

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function handleSeek(e: MouseEvent): void {
  if (!barRef.value || !playerStore.currentTrack) return
  const rect = barRef.value.getBoundingClientRect()
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const targetMs = Math.round(ratio * playerStore.currentTrack.durationMs)
  seek(targetMs)
  playerStore.positionMs = targetMs
}

function togglePlay(): void {
  playerStore.isPlaying ? pause() : play()
}
</script>

<template>
  <div class="flex items-center gap-4 p-4 rounded-xl border border-gray-800">
    <img
      :src="playerStore.currentTrack?.albumArt"
      :alt="playerStore.currentTrack?.name"
      class="w-12 h-12 rounded-lg flex-shrink-0"
    />

    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <div class="min-w-0">
          <p class="text-white text-sm font-medium truncate">{{ playerStore.currentTrack?.name }}</p>
          <p class="text-gray-500 text-xs truncate">{{ playerStore.currentTrack?.artists.join(', ') }}</p>
        </div>

        <button class="text-white hover:text-gray-300 transition-colors ml-3" @click="togglePlay">
          <svg
            v-if="!playerStore.isPlaying"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        </button>
      </div>

      <div class="flex items-center gap-2 mt-2">
        <span class="text-gray-600 text-xs w-8 text-right flex-shrink-0">{{ formatTime(playerStore.positionMs) }}</span>
        <div
          ref="barRef"
          class="flex-1 h-1 bg-gray-700 rounded-full cursor-pointer group relative"
          @click="handleSeek"
        >
          <div class="h-full bg-green-500 rounded-full" :style="{ width: `${progressPercent}%` }" />
          <div
            class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            :style="{ left: `${progressPercent}%` }"
          />
        </div>
        <span class="text-gray-600 text-xs w-8 flex-shrink-0">{{ formatTime(playerStore.currentTrack?.durationMs ?? 0) }}</span>
      </div>
    </div>
  </div>
</template>
