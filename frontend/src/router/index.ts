import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { tryRestoreSession } from '@/composables/useAuth'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/lobby',
      name: 'lobby',
      component: () => import('../views/LobbyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/callback',
      name: 'callback',
      component: () => import('../views/CallbackView.vue'),
    },
    {
      path: '/room/:code',
      name: 'room',
      component: () => import('../views/RoomView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Navigation guard to restore session on protected routes
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore()

    // Try to restore session if not authenticated
    if (!authStore.accessToken) {
      const restored = await tryRestoreSession()
      if (!restored) {
        return { name: 'home' }
      }
    }
  }
})

export default router
