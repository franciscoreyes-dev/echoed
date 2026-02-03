<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div v-if="authStore.isRestoring" class="min-h-screen bg-gray-950 flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-white tracking-tighter">Echoed</h1>
      <p class="text-gray-500 mt-2 text-sm">Restoring session...</p>
    </div>
  </div>
  <RouterView v-else />
</template>
