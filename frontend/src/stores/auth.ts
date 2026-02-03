import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const userId = ref<string | null>(null)
  const displayName = ref<string | null>(null)

  function setAuth(token: string, id: string, name: string): void {
    accessToken.value = token
    userId.value = id
    displayName.value = name
  }

  function clear(): void {
    accessToken.value = null
    userId.value = null
    displayName.value = null
  }

  return { accessToken, userId, displayName, setAuth, clear }
})
