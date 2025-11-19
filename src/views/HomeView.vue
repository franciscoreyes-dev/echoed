<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import BaseButton from '../components/BaseButton.vue';

const authStore = useAuthStore();

const handleLogin = async () => {
  await authStore.login();
};
</script>

<template>
  <div class="view-container">
    <!-- Not authenticated - show call to action -->
    <div v-if="!authStore.isAuthenticated" class="unauthenticated-state">
      <div class="hero">
        <i class="pi pi-chart-bar hero-icon"></i>
        <h1>Visualize Your Music Journey</h1>
        <p class="subtitle">
          Connect your Spotify account to unlock personalized insights about your listening habits,
          discover trends, and explore your musical DNA.
        </p>
        <BaseButton
          label="Connect to Spotify"
          icon="pi pi-spotify"
          severity="success"
          @click="handleLogin"
          size="large"
        />
      </div>

      <div class="features">
        <div class="feature-card">
          <i class="pi pi-clock"></i>
          <h3>Recently Played</h3>
          <p>Track your listening history and rediscover your favorite tracks</p>
        </div>
        <div class="feature-card">
          <i class="pi pi-users"></i>
          <h3>Top Artists</h3>
          <p>See which artists dominate your playlists</p>
        </div>
        <div class="feature-card">
          <i class="pi pi-chart-line"></i>
          <h3>Listening Stats</h3>
          <p>Beautiful visualizations of your music preferences</p>
        </div>
      </div>
    </div>

    <!-- Authenticated - show dashboard -->
    <div v-else class="authenticated-state">
      <div class="view-header">
        <h1>Welcome back, {{ authStore.user?.display_name }}!</h1>
        <p class="subtitle">Here's your music overview</p>
      </div>

      <div class="content-section">
        <div class="placeholder-card">
          <i class="pi pi-clock"></i>
          <h2>Recently Played</h2>
          <p>Your recently played tracks will appear here</p>
        </div>

        <div class="placeholder-card">
          <i class="pi pi-users"></i>
          <h2>Top Artists</h2>
          <p>Your most listened artists will appear here</p>
        </div>

        <div class="placeholder-card">
          <i class="pi pi-chart-line"></i>
          <h2>Listening Stats</h2>
          <p>Your listening statistics will be visualized here</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Unauthenticated State */
.unauthenticated-state {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.hero-icon {
  font-size: 5rem;
  color: var(--button-primary-bgColor-rest);
  margin-bottom: 1rem;
}

.hero h1 {
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
  color: var(--fgColor-default);
}

.hero .subtitle {
  font-size: 1.25rem;
  color: var(--fgColor-muted);
  margin: 0;
  max-width: 600px;
  line-height: 1.6;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  padding: 2rem 0;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  background: var(--bgColor-muted);
  border: 1px solid var(--borderColor-default);
  border-radius: 12px;
  transition: all 0.3s;
}

.feature-card:hover {
  background: var(--bgColor-emphasis);
  border-color: var(--borderColor-emphasis);
  transform: translateY(-4px);
}

.feature-card i {
  font-size: 3rem;
  color: var(--button-primary-bgColor-rest);
  margin-bottom: 1rem;
  display: block;
}

.feature-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: var(--fgColor-default);
}

.feature-card p {
  color: var(--fgColor-muted);
  margin: 0;
  line-height: 1.5;
}

/* Authenticated State */
.authenticated-state {
  min-height: calc(100vh - 154px);
}

.view-header {
  margin-bottom: 2rem;
}

.view-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--fgColor-default);
}

.subtitle {
  font-size: 1.1rem;
  color: var(--fgColor-muted);
  margin: 0;
}

.content-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.placeholder-card {
  background: var(--bgColor-muted);
  border: 1px solid var(--borderColor-default);
  border-radius: 12px;
  padding: 2rem;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  transition: all 0.3s;
  gap: 1rem;
}

.placeholder-card:hover {
  background: var(--bgColor-emphasis);
  border-color: var(--borderColor-emphasis);
  transform: translateY(-2px);
}

.placeholder-card i {
  font-size: 2.5rem;
  color: var(--button-primary-bgColor-rest);
}

.placeholder-card h2 {
  font-size: 1.5rem;
  margin: 0;
  color: var(--fgColor-default);
}

.placeholder-card p {
  color: var(--fgColor-muted);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }

  .hero .subtitle {
    font-size: 1rem;
  }

  .features {
    grid-template-columns: 1fr;
  }
}
</style>
