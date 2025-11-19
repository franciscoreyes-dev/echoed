<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import Avatar from 'primevue/avatar';
import BaseButton from './BaseButton.vue';
import { useTheme } from '../composables/useTheme';

const route = useRoute();
const router = useRouter();
const { currentTheme, toggleTheme } = useTheme();

const isActive = (routeName: string) => computed(() => route.name === routeName);

const navigateTo = (path: string) => {
  router.push(path);
};

const themeIcon = computed(() =>
  currentTheme.value === 'light' ? 'pi pi-moon' : 'pi pi-sun'
);
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
        <BaseButton
          icon="pi pi-home"
          label="Home"
          :severity="isActive('home').value ? 'primary' : 'secondary'"
          @click="navigateTo('/')"
          size="small"
          variant="text"
        />
        <BaseButton
          icon="pi pi-search"
          label="Search"
          :severity="isActive('search').value ? 'primary' : 'secondary'"
          @click="navigateTo('/search')"
          size="small"
          variant="text"
        />
        <BaseButton
          icon="pi pi-book"
          label="Library"
          :severity="isActive('library').value ? 'primary' : 'secondary'"
          @click="navigateTo('/library')"
          size="small"
          variant="text"
        />
      </nav>

      <div class="user-section">
        <BaseButton
          :icon="themeIcon"
          severity="secondary"
          variant="outlined"
          @click="toggleTheme"
          :aria-label="`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`"
          size="small"
        />
        <Avatar
          image="/src/assets/fighter-avatar.jpg"
          shape="circle"
          @click="navigateTo('/profile')"
          class="profile-avatar"
          :class="{ active: isActive('profile').value }"
        />
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
  background: var(--bgColor-default);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--borderColor-default);
  z-index: 100;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}

.logo-image {
  height: 1.1rem;
  width: auto;
}

.logo-link {
  text-decoration: none;
  display: flex; 
  align-items: center;
  transition: opacity 0.2s;
}

.logo-link:hover {
  opacity: 0.8;
}

.nav-menu {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-avatar {
  cursor: pointer;
  color: var(--fgColor-default);
  border: 1px solid var(--borderColor-default);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transform: scale(1);
  position: relative;
}

.profile-avatar::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  border: 2px solid var(--button-primary-bgColor-rest);
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.profile-avatar :deep(.p-avatar-icon) {
  font-size: 0.875rem;
}

.profile-avatar:hover {
  opacity: 1;
  transform: scale(1.05);
}

.profile-avatar.active {
  opacity: 1;
  border-color: var(--button-primary-bgColor-rest);
  color: var(--button-primary-bgColor-rest);
  transform: scale(1.08);
  box-shadow: 0 0 0 3px var(--button-primary-bgColor-rest, #238636)33;
}

.profile-avatar.active::before {
  opacity: 1;
  transform: scale(1);
}
</style>
