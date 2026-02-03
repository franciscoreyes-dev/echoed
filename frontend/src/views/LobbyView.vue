<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useAuth } from '@/composables/useAuth'
import { Button } from '@/components/ui/button'

const authStore = useAuthStore()
const { logout } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
    <div class="max-w-md w-full space-y-10">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white tracking-tighter">Echoed</h1>
        <p class="text-gray-500 mt-2">Welcome back, {{ authStore.displayName }}</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors cursor-pointer">
          <p class="text-white font-semibold">Create Room</p>
          <p class="text-gray-600 text-xs mt-1">Start a new listening session</p>
        </div>
        <div class="border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors cursor-pointer">
          <p class="text-white font-semibold">Join Room</p>
          <p class="text-gray-600 text-xs mt-1">Enter a room code to join</p>
        </div>
      </div>

      <div class="text-center">
        <Button variant="ghost" class="text-gray-600 hover:text-gray-400 text-sm" @click="logout">
          Logout
        </Button>
      </div>
    </div>
  </div>
</template>
