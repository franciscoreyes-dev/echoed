<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { usePlayerStore } from '@/stores/player'
import { useSocket } from '@/composables/useSocket'
import { useSpotifyPlayer } from '@/composables/useSpotifyPlayer'
import { Button } from '@/components/ui/button'
import Player from '@/components/Player.vue'

const router = useRouter()
const roomStore = useRoomStore()
const playerStore = usePlayerStore()
const { leaveRoom } = useSocket()
const { initialize } = useSpotifyPlayer()

onMounted(() => {
  if (!roomStore.roomCode) {
    router.push('/lobby')
    return
  }
  initialize().catch(() => {
    console.error('Failed to initialize Spotify player')
  })
})

function handleLeave(): void {
  leaveRoom()
  router.push('/lobby')
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white tracking-tighter">Echoed</h1>
        <p class="text-gray-500 mt-2">Room <span class="text-white font-mono">{{ roomStore.roomCode }}</span></p>
      </div>

      <div class="border border-gray-800 rounded-xl p-4">
        <p class="text-gray-500 text-xs uppercase tracking-wider mb-3">Members</p>
        <div class="space-y-2">
          <div v-for="member in roomStore.members" :key="member.spotifyId" class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-green-500" />
            <span class="text-white text-sm">{{ member.displayName }}</span>
            <span v-if="member.isHost" class="text-xs text-gray-500 ml-auto">Host</span>
          </div>
        </div>
      </div>

      <div>
        <Player v-if="playerStore.currentTrack" />
      </div>

      <div class="text-center">
        <Button variant="ghost" class="text-gray-600 hover:text-gray-400 text-sm" @click="handleLeave">
          Leave Room
        </Button>
      </div>
    </div>
  </div>
</template>
