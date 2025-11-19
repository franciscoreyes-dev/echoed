<script setup lang="ts">
import { onMounted } from 'vue';
import AppHeader from './components/AppHeader.vue';
import PlayerBar from './components/PlayerBar.vue';
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();

// Initialize authentication on app startup
onMounted(async () => {
  await authStore.initializeAuth();
});
</script>

<template>
  <div class="app-layout">
    <AppHeader />

    <main class="main-content">
      <RouterView />
    </main>

    <PlayerBar />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  margin-top: 64px; /* Header height */
  margin-bottom: 90px; /* Player bar height */
  overflow-y: auto;
}
</style>
