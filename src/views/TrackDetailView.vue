<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { SpotifyTrack } from '../types/spotify';
import { spotifyClient } from '../services/spotify';
import { apiCache } from '../utils/cache';
import { usePlayerStore } from '../stores/player';
import BaseButton from '../components/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const playerStore = usePlayerStore();

const track = ref<SpotifyTrack | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const fetchTrackData = async () => {
  const trackId = route.params.id as string;
  if (!trackId) {
    error.value = 'No track ID provided';
    isLoading.value = false;
    return;
  }

  const cacheKey = `track-${trackId}`;
  const cached = apiCache.get<SpotifyTrack>(cacheKey);

  if (cached) {
    track.value = cached;
    isLoading.value = false;
    return;
  }

  try {
    const response = await spotifyClient.getTrack(trackId);
    track.value = response.data;
    apiCache.set(cacheKey, response.data, 300000); // 5 min
  } catch (err) {
    console.error('Failed to fetch track data:', err);
    error.value = 'Failed to load track details';
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  router.back();
};

const formatReleaseDate = (date: string) => {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

onMounted(() => {
  fetchTrackData();
});
</script>

<template>
  <div class="view-container">
    <div class="back-nav">
      <BaseButton
        icon="pi pi-arrow-left"
        label="Back"
        severity="secondary"
        variant="text"
        @click="goBack"
      />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading track details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="pi pi-exclamation-circle"></i>
      <p>{{ error }}</p>
      <BaseButton
        label="Go Back"
        severity="secondary"
        @click="goBack"
      />
    </div>

    <!-- Track Details -->
    <div v-else-if="track" class="track-details">
      <div class="track-header">
        <img
          v-if="track.album.images[0]"
          :src="track.album.images[0].url"
          :alt="track.album.name"
          class="album-cover"
        />
        <div class="track-main-info">
          <h1>{{ track.name }}</h1>
          <p class="artists">{{ track.artists.map(a => a.name).join(', ') }}</p>
          <p class="album">{{ track.album.name }}</p>
          <div class="track-badges">
            <span v-if="track.explicit" class="badge explicit">Explicit</span>
          </div>
          <a
            :href="track.external_urls.spotify"
            target="_blank"
            rel="noopener noreferrer"
            class="spotify-link"
          >
            <i class="pi pi-external-link"></i>
            Open in Spotify
          </a>
        </div>
      </div>

      <div class="track-info-section">
        <h2>Track Information</h2>

        <div class="info-grid">
          <div class="info-item">
            <span class="label">Duration</span>
            <span class="value">{{ playerStore.formatDuration(track.duration_ms) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Popularity</span>
            <div class="popularity-container">
              <div class="popularity-bar">
                <div class="popularity-fill" :style="{ width: `${track.popularity || 0}%` }"></div>
              </div>
              <span class="popularity-value">{{ track.popularity || 0 }}/100</span>
            </div>
          </div>
          <div class="info-item">
            <span class="label">Album</span>
            <span class="value">{{ track.album.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">Release Date</span>
            <span class="value">{{ formatReleaseDate(track.album.release_date || '') }}</span>
          </div>
          <div class="info-item" v-if="track.track_number">
            <span class="label">Track Number</span>
            <span class="value">{{ track.track_number }}</span>
          </div>
          <div class="info-item" v-if="track.disc_number && track.disc_number > 1">
            <span class="label">Disc Number</span>
            <span class="value">{{ track.disc_number }}</span>
          </div>
        </div>

        <div class="artists-section">
          <h3>Artists</h3>
          <div class="artists-list">
            <a
              v-for="artist in track.artists"
              :key="artist.id"
              :href="artist.external_urls.spotify"
              target="_blank"
              rel="noopener noreferrer"
              class="artist-link"
            >
              {{ artist.name }}
              <i class="pi pi-external-link"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.back-nav {
  margin-bottom: 1.5rem;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1.5rem;
  text-align: center;
}

.loading-state .spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--borderColor-default);
  border-top-color: var(--button-primary-bgColor-rest);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state i {
  font-size: 3rem;
  color: var(--fgColor-danger);
}

.error-state p {
  color: var(--fgColor-muted);
  margin: 0;
}

.track-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.album-cover {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.track-main-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.track-main-info h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: var(--fgColor-default);
}

.track-main-info .artists {
  margin: 0 0 0.25rem 0;
  color: var(--fgColor-muted);
  font-size: 1.1rem;
}

.track-main-info .album {
  margin: 0 0 0.75rem 0;
  color: var(--fgColor-muted);
}

.track-badges {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge.explicit {
  background: var(--fgColor-muted);
  color: var(--bgColor-default);
}

.spotify-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #1DB954;
  color: white;
  border-radius: 20px;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
  width: fit-content;
}

.spotify-link:hover {
  background: #1ed760;
  transform: scale(1.02);
}

.track-info-section {
  background: var(--bgColor-muted);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--borderColor-default);
}

.track-info-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: var(--fgColor-default);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  background: var(--bgColor-default);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--borderColor-default);
}

.info-item .label {
  display: block;
  font-size: 0.75rem;
  color: var(--fgColor-muted);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-item .value {
  font-weight: 600;
  font-size: 1rem;
  color: var(--fgColor-default);
}

.popularity-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.popularity-bar {
  flex: 1;
  height: 8px;
  background: var(--borderColor-default);
  border-radius: 4px;
  overflow: hidden;
}

.popularity-fill {
  height: 100%;
  background: var(--color-ansi-green);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.popularity-value {
  font-size: 0.85rem;
  color: var(--fgColor-muted);
  white-space: nowrap;
}

.artists-section {
  border-top: 1px solid var(--borderColor-default);
  padding-top: 1.5rem;
}

.artists-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: var(--fgColor-default);
}

.artists-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.artist-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bgColor-default);
  border: 1px solid var(--borderColor-default);
  border-radius: 20px;
  color: var(--fgColor-default);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.artist-link:hover {
  border-color: var(--color-ansi-green);
  color: var(--color-ansi-green);
}

.artist-link i {
  font-size: 0.75rem;
}

@media (max-width: 600px) {
  .track-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .album-cover {
    width: 150px;
    height: 150px;
  }

  .track-main-info {
    align-items: center;
  }

  .track-badges {
    justify-content: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
