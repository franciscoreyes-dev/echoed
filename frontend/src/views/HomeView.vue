<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'
import { Button } from '@/components/ui/button'

const { login } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
    <div class="max-w-md w-full text-center space-y-10">
      <div>
        <h1 class="text-7xl font-bold text-white tracking-tighter">Echoed</h1>
        <p class="text-gray-500 text-lg mt-3">Listen together, perfectly in sync.</p>
      </div>

      <Button
        size="lg"
        class="w-full gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold rounded-full"
        @click="login"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm4.585 14.242a.75.75 0 01-1.06.182c-2.498-1.666-5.631-2.045-9.335-1.187a.75.75 0 01-.907-.581.75.75 0 01.581-.907c4.052-.88 7.527-.457 10.357 1.37a.75.75 0 01.181 1.043zm1.238-2.723a.938.938 0 01-1.327.24c-2.862-1.756-7.223-2.265-10.626-1.24a.938.938 0 01-1.157-.726.938.938 0 01.726-1.157c3.845-1.04 8.668-.495 11.91 1.501a.938.938 0 01.241 1.325zm.112-2.84a1.125 1.125 0 01-1.593.266c-3.253-2.167-8.291-2.651-12.279-1.451a1.125 1.125 0 01-1.381-.853 1.125 1.125 0 01.853-1.381c4.441-1.272 9.978-.727 13.666 1.655a1.125 1.125 0 01.266 1.593z" />
        </svg>
        Connect with Spotify
      </Button>

      <div class="border-t border-gray-800 pt-6">
        <div class="grid grid-cols-3 gap-4">
          <div>
            <p class="text-white text-sm font-medium">Real-time sync</p>
            <p class="text-gray-600 text-xs mt-1">Under 500ms drift</p>
          </div>
          <div>
            <p class="text-white text-sm font-medium">Group rooms</p>
            <p class="text-gray-600 text-xs mt-1">Share a code</p>
          </div>
          <div>
            <p class="text-white text-sm font-medium">Shared queue</p>
            <p class="text-gray-600 text-xs mt-1">Everyone adds</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
