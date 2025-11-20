<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { spotifyClient } from '../services/spotify';
import { apiCache } from '../utils/cache';
import { usePlayerStore } from '../stores/player';
import BaseButton from '../components/BaseButton.vue';
import DataCard from '../components/DataCard.vue';
import TrackItem from '../components/TrackItem.vue';

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
  followers: { total: number };
  genres: string[];
  popularity: number;
  external_urls: { spotify: string };
}

interface Track {
  id: string;
  name: string;
  duration_ms: number;
  album: {
    name: string;
    images: { url: string }[];
  };
  artists: { name: string }[];
  popularity: number;
}

const route = useRoute();
const router = useRouter();
const playerStore = usePlayerStore();

const artist = ref<Artist | null>(null);
const topTracks = ref<Track[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const fetchArtistData = async () => {
  const artistId = route.params.id as string;
  if (!artistId) {
    error.value = 'No artist ID provided';
    isLoading.value = false;
    return;
  }

  const cacheKey = `artist-${artistId}`;
  const cached = apiCache.get<{ artist: Artist; topTracks: Track[] }>(cacheKey);

  if (cached) {
    artist.value = cached.artist;
    topTracks.value = cached.topTracks;
    isLoading.value = false;
    return;
  }

  try {
    const [artistRes, tracksRes] = await Promise.all([
      spotifyClient.getArtist(artistId),
      spotifyClient.getArtistTopTracks(artistId)
    ]);

    artist.value = artistRes.data;
    topTracks.value = tracksRes.data.tracks || [];

    apiCache.set(cacheKey, {
      artist: artist.value,
      topTracks: topTracks.value
    }, 300000); // 5 min
  } catch (err) {
    console.error('Failed to fetch artist data:', err);
    error.value = 'Failed to load artist details';
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  router.back();
};

const openInSpotify = () => {
  if (artist.value?.external_urls.spotify) {
    window.open(artist.value.external_urls.spotify, '_blank');
  }
};

const formatFollowers = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

onMounted(() => {
  fetchArtistData();
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
      <p>Loading artist details...</p>
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

    <!-- Artist Details -->
    <div v-else-if="artist" class="artist-details">
      <!-- Artist Header -->
      <div class="artist-header">
        <img
          v-if="artist.images[0]"
          :src="artist.images[0].url"
          :alt="artist.name"
          class="artist-image"
        />
        <div class="artist-main-info">
          <h1>{{ artist.name }}</h1>
          <div class="artist-meta">
            <span class="followers">
              <i class="pi pi-users"></i>
              {{ formatFollowers(artist.followers.total) }} followers
            </span>
            <span class="popularity">
              <i class="pi pi-chart-line"></i>
              {{ artist.popularity }}% popularity
            </span>
          </div>
          <div v-if="artist.genres.length" class="genres">
            <span v-for="genre in artist.genres.slice(0, 4)" :key="genre" class="genre-tag">
              {{ genre }}
            </span>
          </div>
          <BaseButton
            icon="pi pi-external-link"
            label="Open in Spotify"
            severity="success"
            @click="openInSpotify"
          />
        </div>
      </div>

      <!-- Top Tracks -->
      <DataCard v-if="topTracks.length" title="Popular Tracks" icon="pi-play">
        <div class="tracks-list">
          <TrackItem
            v-for="(track, index) in topTracks.slice(0, 5)"
            :key="track.id"
            :track-id="track.id"
            :image="track.album.images[0]?.url"
            :title="`${index + 1}. ${track.name}`"
            :artists="track.artists.map(a => a.name).join(', ')"
            :album="track.album.name"
            :duration="playerStore.formatDuration(track.duration_ms)"
            :show-info="true"
          />
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

.artist-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.artist-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.artist-image {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
}

.artist-main-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.artist-main-info h1 {
  margin: 0 0 0.5rem 0;
  font-size: 3rem;
  color: var(--fgColor-default);
}

.artist-meta {
  margin: 0 0 0.5rem 0;
  display: flex;
  gap: 1.5rem;
  color: var(--fgColor-muted);
}

.artist-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.artist-meta i {
  font-size: 0.9rem;
}

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.artist-main-info :deep(.p-button) {
  width: fit-content;
}

.genre-tag {
  padding: 0.375rem 0.75rem;
  background: var(--bgColor-muted);
  border: 1px solid var(--borderColor-default);
  border-radius: 16px;
  font-size: 0.85rem;
  color: var(--fgColor-default);
}

.tracks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (max-width: 600px) {
  .artist-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .artist-image {
    width: 150px;
    height: 150px;
  }

  .artist-main-info {
    align-items: center;
  }

  .artist-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .genres {
    justify-content: center;
  }

  .related-artists {
    grid-template-columns: repeat(2, 1fr);
  }

  .related-image,
  .related-placeholder {
    width: 80px;
    height: 80px;
  }
}
</style>
