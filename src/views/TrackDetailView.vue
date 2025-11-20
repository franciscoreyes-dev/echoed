<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { AudioFeatures, SpotifyTrack } from '../types/spotify';
import { spotifyClient, spotifyApi } from '../services/spotify';
import { apiCache } from '../utils/cache';
import { usePlayerStore } from '../stores/player';
import BaseButton from '../components/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const playerStore = usePlayerStore();

const track = ref<SpotifyTrack | null>(null);
const audioFeatures = ref<AudioFeatures | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const keyNames = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];

const musicalKey = computed(() => {
  if (!audioFeatures.value) return '-';
  const key = keyNames[audioFeatures.value.key] || 'Unknown';
  const mode = audioFeatures.value.mode === 1 ? 'Major' : 'Minor';
  return `${key} ${mode}`;
});

const fetchTrackData = async () => {
  const trackId = route.params.id as string;
  if (!trackId) {
    error.value = 'No track ID provided';
    isLoading.value = false;
    return;
  }

  // Check cache for track
  const trackCacheKey = `track-${trackId}`;
  const cachedTrack = apiCache.get<SpotifyTrack>(trackCacheKey);
  if (cachedTrack) {
    track.value = cachedTrack;
  }

  // Check cache for audio features
  const featuresCacheKey = `audio-features-${trackId}`;
  const cachedFeatures = apiCache.get<AudioFeatures>(featuresCacheKey);
  if (cachedFeatures) {
    audioFeatures.value = cachedFeatures;
  }

  if (cachedTrack && cachedFeatures) {
    isLoading.value = false;
    return;
  }

  try {
    const [trackResponse, featuresResponse] = await Promise.all([
      cachedTrack ? Promise.resolve({ data: cachedTrack }) : spotifyApi.get(`/tracks/${trackId}`),
      cachedFeatures ? Promise.resolve({ data: cachedFeatures }) : spotifyClient.getAudioFeatures(trackId)
    ]);

    track.value = trackResponse.data;
    audioFeatures.value = featuresResponse.data;

    apiCache.set(trackCacheKey, trackResponse.data, 300000); // 5 min
    apiCache.set(featuresCacheKey, featuresResponse.data, 300000); // 5 min
  } catch (err) {
    console.error('Failed to fetch track data:', err);
    error.value = 'Failed to load track details';
  } finally {
    isLoading.value = false;
  }
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const goBack = () => {
  router.back();
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
          <p class="duration">{{ playerStore.formatDuration(track.duration_ms) }}</p>
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

      <div v-if="audioFeatures" class="audio-features">
        <h2>Audio Features</h2>

        <div class="features-grid">
          <div class="feature">
            <span class="label">Tempo</span>
            <span class="value">{{ Math.round(audioFeatures.tempo) }} BPM</span>
          </div>
          <div class="feature">
            <span class="label">Key</span>
            <span class="value">{{ musicalKey }}</span>
          </div>
          <div class="feature">
            <span class="label">Time Signature</span>
            <span class="value">{{ audioFeatures.time_signature }}/4</span>
          </div>
          <div class="feature">
            <span class="label">Loudness</span>
            <span class="value">{{ audioFeatures.loudness.toFixed(1) }} dB</span>
          </div>
        </div>

        <div class="feature-bars">
          <div class="bar-item">
            <span class="bar-label">Energy</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: formatPercent(audioFeatures.energy) }"></div>
            </div>
            <span class="bar-value">{{ formatPercent(audioFeatures.energy) }}</span>
          </div>
          <div class="bar-item">
            <span class="bar-label">Danceability</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: formatPercent(audioFeatures.danceability) }"></div>
            </div>
            <span class="bar-value">{{ formatPercent(audioFeatures.danceability) }}</span>
          </div>
          <div class="bar-item">
            <span class="bar-label">Valence</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: formatPercent(audioFeatures.valence) }"></div>
            </div>
            <span class="bar-value">{{ formatPercent(audioFeatures.valence) }}</span>
          </div>
          <div class="bar-item">
            <span class="bar-label">Acousticness</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: formatPercent(audioFeatures.acousticness) }"></div>
            </div>
            <span class="bar-value">{{ formatPercent(audioFeatures.acousticness) }}</span>
          </div>
          <div class="bar-item">
            <span class="bar-label">Instrumentalness</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: formatPercent(audioFeatures.instrumentalness) }"></div>
            </div>
            <span class="bar-value">{{ formatPercent(audioFeatures.instrumentalness) }}</span>
          </div>
          <div class="bar-item">
            <span class="bar-label">Liveness</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: formatPercent(audioFeatures.liveness) }"></div>
            </div>
            <span class="bar-value">{{ formatPercent(audioFeatures.liveness) }}</span>
          </div>
          <div class="bar-item">
            <span class="bar-label">Speechiness</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: formatPercent(audioFeatures.speechiness) }"></div>
            </div>
            <span class="bar-value">{{ formatPercent(audioFeatures.speechiness) }}</span>
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
  margin: 0 0 0.25rem 0;
  color: var(--fgColor-muted);
}

.track-main-info .duration {
  margin: 0 0 1rem 0;
  color: var(--fgColor-muted);
  font-size: 0.9rem;
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

.audio-features {
  background: var(--bgColor-muted);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--borderColor-default);
}

.audio-features h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: var(--fgColor-default);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.feature {
  background: var(--bgColor-default);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--borderColor-default);
}

.feature .label {
  display: block;
  font-size: 0.75rem;
  color: var(--fgColor-muted);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.feature .value {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--fgColor-default);
}

.feature-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bar-item {
  display: grid;
  grid-template-columns: 120px 1fr 60px;
  gap: 1rem;
  align-items: center;
}

.bar-label {
  font-size: 0.9rem;
  color: var(--fgColor-muted);
}

.bar-container {
  height: 10px;
  background: var(--bgColor-default);
  border-radius: 5px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--color-ansi-green);
  border-radius: 5px;
  transition: width 0.3s ease;
}

.bar-value {
  font-size: 0.85rem;
  color: var(--fgColor-muted);
  text-align: right;
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

  .features-grid {
    grid-template-columns: 1fr;
  }

  .bar-item {
    grid-template-columns: 100px 1fr 50px;
    gap: 0.5rem;
  }
}
</style>
