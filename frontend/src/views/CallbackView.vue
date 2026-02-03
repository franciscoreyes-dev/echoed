<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { Button } from '@/components/ui/button'

const { handleCallback } = useAuth()
const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    await handleCallback()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Something went wrong during authentication.'
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center px-6">
    <div class="max-w-sm w-full text-center space-y-6">
      <div v-if="isLoading">
        <p class="text-gray-400 text-lg">Connecting to Spotify...</p>
      </div>
      <div v-else-if="error" class="space-y-4">
        <p class="text-red-400">{{ error }}</p>
        <router-link to="/">
          <Button variant="outline" class="border-gray-700 text-gray-300 hover:bg-gray-800">
            Try again
          </Button>
        </router-link>
      </div>
    </div>
  </div>
</template>
