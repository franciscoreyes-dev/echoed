<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const isActive = (routeName: string) => {
  return computed(() => route.name === routeName)
}
</script>

<template>
  <header class="app-header">
    <div class="header-container">
      <div class="logo">
        <RouterLink to="/" class="logo-link">
          <img src="../assets/echoed-logo.svg" alt="Echoed" class="logo-image" />
        </RouterLink>
      </div>

      <nav class="nav-menu">
        <RouterLink
          to="/"
          class="nav-link"
          :class="{ active: isActive('home').value }"
        >
          Home
        </RouterLink>
        <RouterLink
          to="/search"
          class="nav-link"
          :class="{ active: isActive('search').value }"
        >
          Search
        </RouterLink>
        <RouterLink
          to="/library"
          class="nav-link"
          :class="{ active: isActive('library').value }"
        >
          Your Library
        </RouterLink>
      </nav>

      <div class="user-section">
        <RouterLink
          to="/profile"
          class="profile-link"
          :class="{ active: isActive('profile').value }"
        >
          Profile
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.85) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}

.logo-image {
  height: 40px;
  width: auto;
}

.logo-link {
  text-decoration: none;
  transition: opacity 0.2s;
}

.logo-link:hover {
  opacity: 0.8;
}

.nav-menu {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;
}

.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.nav-link.active {
  color: #1db954;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 1rem;
  right: 1rem;
  height: 2px;
  background: #1db954;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-link {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1.25rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s;
}

.profile-link:hover {
  color: #fff;
  border-color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.profile-link.active {
  color: #1db954;
  border-color: #1db954;
}
</style>
