<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import PlayerBar from './components/PlayerBar.vue'
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
