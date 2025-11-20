<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { usePlayerStore } from '../stores/player';
import { useLibraryStore } from '../stores/library';
import BaseButton from '../components/BaseButton.vue';
import DataCard from '../components/DataCard.vue';
import TrackItem from '../components/TrackItem.vue';
import ArtistItem from '../components/ArtistItem.vue';

const authStore = useAuthStore();
const playerStore = usePlayerStore();
const libraryStore = useLibraryStore();

// Polling interval
let dataPollingInterval: ReturnType<typeof setInterval> | null = null;
const DATA_POLLING_INTERVAL = 5000; // 5 seconds for data updates

const handleLogin = async () => {
  await authStore.login();
};

const loadUserData = async () => {
  try {
    await Promise.all([
      playerStore.fetchRecentlyPlayed(10),
      libraryStore.fetchAllLibraryData('medium_term'),
    ]);
  } catch (error) {
    console.error('Failed to load user data:', error);
  }
};

const startDataPolling = () => {
  if (dataPollingInterval) return;

  dataPollingInterval = setInterval(() => {
    if (authStore.isAuthenticated) {
      playerStore.fetchRecentlyPlayed(10);
      libraryStore.fetchTopArtists('medium_term');
      libraryStore.fetchTopTracks('medium_term');
    }
  }, DATA_POLLING_INTERVAL);
};

const stopDataPolling = () => {
  if (dataPollingInterval) {
    clearInterval(dataPollingInterval);
    dataPollingInterval = null;
  }
};

// Load data when authenticated
onMounted(() => {
  if (authStore.isAuthenticated) {
    loadUserData();
    startDataPolling();
  }
});

onUnmounted(() => {
  stopDataPolling();
});

// Watch for authentication changes
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      loadUserData();
      startDataPolling();
    } else {
      stopDataPolling();
    }
  }
);
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

      <!-- Loading State -->
      <div v-if="playerStore.isLoading || libraryStore.isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your music data...</p>
      </div>

      <!-- Content -->
      <div v-else class="content-section">
        <!-- Recently Played -->
        <DataCard title="Recently Played" icon="pi-history">
          <div v-if="playerStore.recentlyPlayed.length === 0" class="empty-state">
            <p>No recently played tracks found</p>
          </div>
          <div v-else class="list-container">
            <TrackItem
              v-for="item in playerStore.recentlyPlayed.slice(0, 5)"
              :key="item.played_at + item.track.id"
              :track-id="item.track.id"
              :image="item.track.album.images[item.track.album.images.length - 1]?.url"
              :title="item.track.name"
              :artists="item.track.artists.map((a) => a.name).join(', ')"
              :album="item.track.album.name"
              :duration="playerStore.formatDuration(item.track.duration_ms)"
              :played-at="playerStore.formatPlayedAt(item.played_at)"
              show-info
            />
          </div>
        </DataCard>

        <!-- Top Artists -->
        <DataCard title="Top Artists" icon="pi-users">
          <div v-if="libraryStore.topArtists.length === 0" class="empty-state">
            <p>No top artists found</p>
          </div>
          <div v-else class="list-container">
            <ArtistItem
              v-for="(artist, index) in libraryStore.topArtists.slice(0, 5)"
              :key="artist.id"
              :rank="index + 1"
              :image="artist.images[artist.images.length - 1]?.url"
              :name="artist.name"
              :genres="artist.genres.slice(0, 2).join(', ')"
              :followers="libraryStore.formatFollowers(artist.followers.total)"
            />
          </div>
        </DataCard>

        <!-- Listening Stats -->

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

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1.5rem;
}

.loading-state .spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--borderColor-default);
  border-top-color: var(--button-primary-bgColor-rest);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-state p {
  color: var(--fgColor-muted);
  font-size: 1rem;
}

/* Content Section */
.content-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--fgColor-muted);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: var(--bgColor-default);
  border-radius: 8px;
  border: 1px solid var(--borderColor-default);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--button-primary-bgColor-rest);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--fgColor-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Top Genres */
.top-genres {
  padding: 1rem;
  background: var(--bgColor-default);
  border-radius: 8px;
  border: 1px solid var(--borderColor-default);
}

.genres-label {
  font-weight: 600;
  color: var(--fgColor-default);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.genres-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.genre-tag {
  padding: 0.5rem 1rem;
  background: var(--bgColor-muted);
  border: 1px solid var(--borderColor-default);
  border-radius: 16px;
  font-size: 0.85rem;
  color: var(--fgColor-default);
  transition: all 0.2s;
}

.genre-tag:hover {
  background: var(--bgColor-emphasis);
  border-color: var(--borderColor-emphasis);
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
