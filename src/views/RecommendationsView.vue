<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { spotifyClient } from '../services/spotify';
import { useAuthStore } from '../stores/auth';
import { usePlayerStore } from '../stores/player';
import DataCard from '../components/DataCard.vue';
import TrackItem from '../components/TrackItem.vue';
import BaseButton from '../components/BaseButton.vue';

interface Track {
  id: string;
  name: string;
  duration_ms: number;
  album: {
    id: string;
    name: string;
    images: { url: string }[];
  };
  artists: { id: string; name: string }[];
  uri: string;
}

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
}

const authStore = useAuthStore();
const playerStore = usePlayerStore();

const recommendations = ref<Track[]>([]);
const seedTracks = ref<Track[]>([]);
const seedArtists = ref<Artist[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const isAuthenticated = computed(() => authStore.isAuthenticated);

const fetchRecommendations = async () => {
  if (!isAuthenticated.value) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    // Get user's top tracks and artists for seeds
    const [topTracksRes, topArtistsRes] = await Promise.all([
      spotifyClient.getTopTracks('medium_term', 5),
      spotifyClient.getTopArtists('medium_term', 5)
    ]);

    seedTracks.value = topTracksRes.data.items || [];
    seedArtists.value = topArtistsRes.data.items || [];

    // Use top 2 tracks and top 3 artists as seeds (max 5 total)
    const trackSeeds = seedTracks.value.slice(0, 2).map(t => t.id);
    const artistSeeds = seedArtists.value.slice(0, 3).map(a => a.id);

    if (trackSeeds.length === 0 && artistSeeds.length === 0) {
      error.value = 'Not enough listening history for recommendations';
      return;
    }

    const recsRes = await spotifyClient.getRecommendations({
      seed_tracks: trackSeeds,
      seed_artists: artistSeeds,
      limit: 30
    });

    recommendations.value = recsRes.data.tracks || [];
  } catch (err: unknown) {
    console.error('Failed to fetch recommendations:', err);
    const axiosError = err as { response?: { status?: number } };
    if (axiosError.response?.status === 404 || axiosError.response?.status === 403) {
      error.value = 'Recommendations API is not available. Spotify has restricted this endpoint.';
    } else {
      error.value = 'Failed to load recommendations';
    }
  } finally {
    isLoading.value = false;
  }
};

const refreshRecommendations = () => {
  fetchRecommendations();
};

const playTrack = async (track: Track) => {
  try {
    await spotifyClient.playTrack(track.uri);
  } catch (err) {
    console.error('Failed to play track:', err);
  }
};

onMounted(() => {
  fetchRecommendations();
});
</script>

<template>
  <div class="view-container">
    <div class="page-header">
      <h1>Recommended For You</h1>
      <BaseButton
        icon="pi pi-refresh"
        label="Refresh"
        severity="secondary"
        variant="outlined"
        :disabled="isLoading"
        @click="refreshRecommendations"
      />
    </div>

    <!-- Not Authenticated -->
    <div v-if="!isAuthenticated" class="empty-state">
      <i class="pi pi-lock"></i>
      <h2>Connect to Spotify</h2>
      <p>Sign in to get personalized recommendations based on your listening history.</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Finding tracks you'll love...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="pi pi-exclamation-circle"></i>
      <p>{{ error }}</p>
      <BaseButton
        label="Try Again"
        severity="secondary"
        @click="refreshRecommendations"
      />
    </div>

    <!-- Recommendations -->
    <div v-else class="recommendations-content">
      <!-- Seeds Info -->
      <DataCard v-if="seedTracks.length || seedArtists.length" title="Based on your favorites" icon="pi-heart">
        <div class="seeds-container">
          <div v-if="seedArtists.length" class="seed-artists">
            <RouterLink
              v-for="artist in seedArtists.slice(0, 3)"
              :key="artist.id"
              :to="`/artist/${artist.id}`"
              class="seed-artist"
            >
              <img
                v-if="artist.images[0]"
                :src="artist.images[0].url"
                :alt="artist.name"
                class="seed-image"
              />
              <span>{{ artist.name }}</span>
            </RouterLink>
          </div>
        </div>
      </DataCard>

      <!-- Recommended Tracks -->
      <DataCard v-if="recommendations.length" title="Recommended Tracks" icon="pi-sparkles">
        <div class="tracks-list">
          <TrackItem
            v-for="track in recommendations"
            :key="track.id"
            :track-id="track.id"
            :image="track.album.images[0]?.url"
            :title="track.name"
            :artists="track.artists"
            :album="track.album.name"
            :duration="playerStore.formatDuration(track.duration_ms)"
            show-like
            @click="playTrack(track)"
          />
        </div>
      </DataCard>

      <div v-else class="empty-state">
        <i class="pi pi-music"></i>
        <p>No recommendations found. Keep listening to build your taste profile!</p>
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--fgColor-default);
}

.loading-state,
.error-state,
.empty-state {
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

.error-state i,
.empty-state i {
  font-size: 3rem;
  color: var(--fgColor-muted);
}

.error-state i {
  color: var(--fgColor-danger);
}

.empty-state h2 {
  margin: 0;
  color: var(--fgColor-default);
}

.empty-state p,
.error-state p {
  margin: 0;
  color: var(--fgColor-muted);
}

.recommendations-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.seeds-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.seed-artists {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.seed-artist {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem 0.5rem 0.5rem;
  background: var(--bgColor-muted);
  border-radius: 24px;
  text-decoration: none;
  color: var(--fgColor-default);
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.seed-artist:hover {
  background: var(--borderColor-default);
}

.seed-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.tracks-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }
}
</style>
