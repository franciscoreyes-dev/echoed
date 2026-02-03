<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import { useAuth } from '@/composables/useAuth'
import { useSpotifyPlayer } from '@/composables/useSpotifyPlayer'
import { useSocket } from '@/composables/useSocket'
import { Button } from '@/components/ui/button'
import Player from '@/components/Player.vue'

const router = useRouter()
const authStore = useAuthStore()
const playerStore = usePlayerStore()
const { logout } = useAuth()
const { initialize, transferPlayback, destroy } = useSpotifyPlayer()
const { createRoom, joinRoom, disconnect } = useSocket()

const isJoining = ref(false)
const joinCode = ref('')
const joinError = ref('')

onMounted(() => {
  initialize().catch(() => {
    console.error('Failed to initialize Spotify player')
  })
})

async function handleCreate(): Promise<void> {
  const code = await createRoom(authStore.userId!, authStore.displayName!)
  router.push(`/room/${code}`)
}

async function handleJoin(): Promise<void> {
  joinError.value = ''
  try {
    const code = await joinRoom(joinCode.value.trim().toUpperCase(), authStore.userId!, authStore.displayName!)
    router.push(`/room/${code}`)
  } catch (err) {
    joinError.value = (err as Error).message
  }
}

function handleLogout(): void {
  destroy()
  disconnect()
  logout()
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
    <div class="max-w-md w-full space-y-10">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white tracking-tighter">Echoed</h1>
        <p class="text-gray-500 mt-2">Welcome back, {{ authStore.displayName }}</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div
          class="border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors cursor-pointer"
          @click="handleCreate"
        >
          <p class="text-white font-semibold">Create Room</p>
          <p class="text-gray-600 text-xs mt-1">Start a new listening session</p>
        </div>

        <div
          v-if="!isJoining"
          class="border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors cursor-pointer"
          @click="isJoining = true"
        >
          <p class="text-white font-semibold">Join Room</p>
          <p class="text-gray-600 text-xs mt-1">Enter a room code to join</p>
        </div>
        <div v-else class="border border-gray-800 rounded-xl p-6">
          <p class="text-white font-semibold mb-3">Join Room</p>
          <input
            v-model="joinCode"
            type="text"
            placeholder="Room code"
            autofocus
            class="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gray-500 placeholder-gray-600"
            @keydown.enter="handleJoin"
            @keydown.escape="isJoining = false"
          />
          <p v-if="joinError" class="text-red-500 text-xs mt-2">{{ joinError }}</p>
        </div>
      </div>

      <div>
        <Player v-if="playerStore.currentTrack" />
        <div v-else-if="playerStore.deviceId" class="text-center">
          <Button variant="outline" class="border-green-600 text-green-500 hover:bg-green-600/10" @click="transferPlayback">
            Play on Echoed
          </Button>
        </div>
      </div>

      <div class="text-center">
        <Button variant="ghost" class="text-gray-600 hover:text-gray-400 text-sm" @click="handleLogout">
          Logout
        </Button>
      </div>
    </div>
  </div>
</template>
