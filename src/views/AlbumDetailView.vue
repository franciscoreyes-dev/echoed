<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { spotifyClient } from '../services/spotify';
import { apiCache } from '../utils/cache';
import { usePlayerStore } from '../stores/player';
import BaseButton from '../components/BaseButton.vue';
import DataCard from '../components/DataCard.vue';
import TrackItem from '../components/TrackItem.vue';

interface AlbumTrack {
  id: string;
  name: string;
  duration_ms: number;
  track_number: number;
  artists: Array<{ id: string; name: string }>;
  external_urls: { spotify: string };
}

interface Album {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string; external_urls: { spotify: string } }>;
  images: Array<{ url: string }>;
  release_date: string;
  total_tracks: number;
  album_type: string;
  label: string;
  copyrights: Array<{ text: string; type: string }>;
  external_urls: { spotify: string };
  tracks: { items: AlbumTrack[] };
}

const route = useRoute();
const router = useRouter();
const playerStore = usePlayerStore();

const album = ref<Album | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const fetchAlbumData = async () => {
  const albumId = route.params.id as string;
  if (!albumId) {
    error.value = 'No album ID provided';
    isLoading.value = false;
    return;
  }

  const cacheKey = `album-${albumId}`;
  const cached = apiCache.get<Album>(cacheKey);

  if (cached) {
    album.value = cached;
    isLoading.value = false;
    return;
  }

  try {
    const response = await spotifyClient.getAlbum(albumId);
    album.value = response.data;
    apiCache.set(cacheKey, response.data, 300000); // 5 min
  } catch (err) {
    console.error('Failed to fetch album data:', err);
    error.value = 'Failed to load album details';
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  router.back();
};

const openInSpotify = () => {
  if (album.value?.external_urls.spotify) {
    window.open(album.value.external_urls.spotify, '_blank');
  }
};

const playAlbum = () => {
  if (album.value) {
    const contextUri = `spotify:album:${album.value.id}`;
    spotifyClient.playContext(contextUri);
  }
};

const formatReleaseDate = (date: string) => {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatAlbumType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const getTotalDuration = () => {
  if (!album.value) return 0;
  return album.value.tracks.items.reduce((total, track) => total + track.duration_ms, 0);
};

onMounted(() => {
  fetchAlbumData();
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
      <p>Loading album details...</p>
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

    <!-- Album Details -->
    <div v-else-if="album" class="album-details">
      <div class="album-header">
        <img
          v-if="album.images[0]"
          :src="album.images[0].url"
          :alt="album.name"
          class="album-cover"
        />
        <div class="album-main-info">
          <div class="type-badge">{{ formatAlbumType(album.album_type) }}</div>
          <h1>{{ album.name }}</h1>
          <p class="artists">
            <RouterLink
              v-for="(artist, index) in album.artists"
              :key="artist.id"
              :to="`/artist/${artist.id}`"
              class="artist-link"
            >
              {{ artist.name }}<span v-if="index < album.artists.length - 1">, </span>
            </RouterLink>
          </p>
          <p class="meta">{{ formatReleaseDate(album.release_date) }} · {{ album.total_tracks }} tracks · {{ playerStore.formatDuration(getTotalDuration()) }}</p>
          <div class="action-buttons">
            <BaseButton
              icon="pi pi-play-circle"
              label="Play"
              severity="success"
              @click="playAlbum"
            />
            <BaseButton
              icon="pi pi-external-link"
              label="Open in Spotify"
              severity="secondary"
              variant="outlined"
              @click="openInSpotify"
            />
          </div>
        </div>
      </div>

      <DataCard title="Tracks" icon="pi-list">
        <div class="tracks-list">
          <TrackItem
            v-for="track in album.tracks.items"
            :key="track.id"
            :track-id="track.id"
            :title="track.name"
            :artists="track.artists.map(a => a.name).join(', ')"
            :duration="playerStore.formatDuration(track.duration_ms)"
            show-like
          />
        </div>
      </DataCard>

      <DataCard v-if="album.label || album.copyrights.length" title="Album Info" icon="pi-info-circle">
        <div class="info-grid">
          <div v-if="album.label" class="info-item">
            <span class="label">Label</span>
            <span class="value">{{ album.label }}</span>
          </div>
          <div v-if="album.copyrights.length" class="info-item full-width">
            <span class="label">Copyright</span>
            <span class="value copyright">{{ album.copyrights[0].text }}</span>
          </div>
        </div>
      </DataCard>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  padding: 2rem;
  max-width: 1200px;
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
  border-top-color: var(--color-ansi-green-bright);
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

.album-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.album-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.album-cover {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.album-main-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.type-badge {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--fgColor-muted);
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.album-main-info h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  color: var(--fgColor-default);
}

.album-main-info .artists {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.artist-link {
  color: var(--fgColor-default);
  text-decoration: none;
  font-weight: 500;
}

.artist-link:hover {
  color: var(--color-ansi-green-bright);
  text-decoration: underline;
}

.album-main-info .meta {
  margin: 0 0 1rem 0;
  color: var(--fgColor-muted);
  font-size: 0.9rem;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
}

.tracks-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 400px;
  overflow-y: auto;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  background: var(--bgColor-default);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--borderColor-default);
}

.info-item.full-width {
  grid-column: 1 / -1;
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

.info-item .value.copyright {
  font-size: 0.85rem;
  font-weight: 400;
}

@media (max-width: 600px) {
  .album-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .album-cover {
    width: 180px;
    height: 180px;
  }

  .album-main-info {
    align-items: center;
  }

  .album-main-info h1 {
    font-size: 1.75rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
