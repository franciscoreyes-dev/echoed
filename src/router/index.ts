import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Home' }
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('../views/LibraryView.vue'),
    meta: { title: 'Your Library' }
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('../views/SearchView.vue'),
    meta: { title: 'Search' }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { title: 'Profile' }
  },
  {
    path: '/statistics',
    name: 'statistics',
    component: () => import('../views/StatisticsView.vue'),
    meta: { title: 'Statistics Deep Dive' }
  },
  {
    path: '/track/:id',
    name: 'track-detail',
    component: () => import('../views/TrackDetailView.vue'),
    meta: { title: 'Track Details' }
  },
  {
    path: '/artist/:id',
    name: 'artist-detail',
    component: () => import('../views/ArtistDetailView.vue'),
    meta: { title: 'Artist Details' }
  },
  {
    path: '/callback',
    name: 'callback',
    component: () => import('../views/CallbackView.vue'),
    meta: { title: 'Loading...' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Update document title based on route meta
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || 'Echoed'} - Echoed`
  next()
})

export default router
