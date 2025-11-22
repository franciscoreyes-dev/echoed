<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { computed, ref } from 'vue';
import Avatar from 'primevue/avatar';
import BaseButton from './BaseButton.vue';
import SearchBar from './SearchBar.vue';
import { useTheme } from '../composables/useTheme';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { currentTheme, toggleTheme } = useTheme();

const mobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};

const isActive = (routeName: string) => computed(() => route.name === routeName);

const navigateTo = (path: string) => {
  router.push(path);
  closeMobileMenu();
};

const themeIcon = computed(() =>
  currentTheme.value === 'light' ? 'pi pi-moon' : 'pi pi-sun'
);

const handleLogin = async () => {
  await authStore.login();
};

const userAvatar = computed(() => {
  if (!authStore.user?.images || authStore.user.images.length === 0) {
    return null;
  }
  // Get the smallest image (usually the last one)
  return authStore.user.images[authStore.user.images.length - 1]?.url;
});
</script>

<template>
  <header class="app-header">
    <div class="header-container">
      <div class="logo">
        <RouterLink to="/" class="logo-link">
          <img src="../assets/echoed-logo.svg" alt="Echoed" class="logo-image" />
        </RouterLink>
      </div>

      <!-- Hamburger button for mobile -->
      <BaseButton
        :icon="mobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'"
        severity="secondary"
        variant="text"
        @click="toggleMobileMenu"
        class="hamburger-button"
        aria-label="Toggle menu"
      />

      <nav class="nav-menu" :class="{ 'mobile-open': mobileMenuOpen }">
        <BaseButton
          icon="pi pi-home"
          label="Home"
          :severity="isActive('home').value ? 'success' : 'secondary'"
          @click="navigateTo('/')"
          size="small"
          variant="outlined"
          rounded
        />
        <BaseButton
          icon="pi pi-search"
          label="Search"
          :severity="isActive('search').value ? 'success' : 'secondary'"
          @click="navigateTo('/search')"
          size="small"
          variant="outlined"
          rounded
        />
        <BaseButton
          icon="pi pi-book"
          label="Library"
          :severity="isActive('library').value ? 'success' : 'secondary'"
          @click="navigateTo('/library')"
          size="small"
          variant="outlined"
          rounded
        />
        <BaseButton
          icon="pi pi-chart-bar"
          label="Statistics"
          :severity="isActive('statistics').value ? 'success' : 'secondary'"
          @click="navigateTo('/statistics')"
          size="small"
          variant="outlined"
          rounded
        />
      </nav>

      <!-- Mobile menu overlay -->
      <div v-if="mobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>

      <div class="user-section">
        <SearchBar v-if="authStore.isAuthenticated" />
        <BaseButton
          :icon="themeIcon"
          severity="secondary"
          variant="text"
          @click="toggleTheme"
          :aria-label="`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`"
          rounded
        />

        <!-- Not authenticated - show login button -->
        <BaseButton
          v-if="!authStore.isAuthenticated"
          label="Connect to Spotify"
          icon="pi pi-link"
          severity="success"
          @click="handleLogin"
        />

        <!-- Authenticated - show user avatar -->
        <template v-else>
          <Avatar
            v-if="userAvatar"
            :image="userAvatar"
            shape="circle"
            @click="navigateTo('/profile')"
            class="profile-avatar"
            :class="{ active: isActive('profile').value }"
          />
          <Avatar
            v-else
            icon="pi pi-user"
            shape="circle"
            @click="navigateTo('/profile')"
            class="profile-avatar"
            :class="{ active: isActive('profile').value }"
          />
        </template>
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
  border-color: var(--color-ansi-green-bright);
  color: var(--button-primary-bgColor-rest);
  transform: scale(1.08);
  box-shadow: 0 0 0 3px var(--button-primary-bgColor-rest, #238636)33;
}

.profile-avatar.active::before {
  opacity: 1;
  transform: scale(1);
}

/* Hamburger button - hidden on desktop */
.hamburger-button {
  display: none;
}

/* Mobile overlay */
.mobile-overlay {
  display: none;
}

/* Mobile styles */
@media (max-width: 768px) {
  .header-container {
    padding: 0 1rem;
  }

  .hamburger-button {
    display: flex;
    order: 3;
  }

  .nav-menu {
    display: none;
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    background: var(--bgColor-default);
    border-bottom: 1px solid var(--borderColor-default);
    padding: 1rem;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 99;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .nav-menu.mobile-open {
    display: flex;
  }

  .nav-menu :deep(.base-button) {
    width: 100%;
    justify-content: flex-start;
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 98;
  }

  .user-section {
    order: 2;
    gap: 0.5rem;
    margin-left: auto;
  }

  /* Hide search bar on mobile header */
  .user-section :deep(.search-bar) {
    display: none;
  }

  .logo {
    order: 1;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0 0.75rem;
  }

  /* Hide Connect to Spotify label on very small screens */
  .user-section :deep(.base-button .label) {
    display: none;
  }
}
</style>
