<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { spotifyClient } from '../services/spotify';
import { useAuthStore } from '../stores/auth';
import { usePlayerStore } from '../stores/player';
import DataCard from '../components/DataCard.vue';
import TrackItem from '../components/TrackItem.vue';
import AlbumItem from '../components/AlbumItem.vue';

interface Track {
  id: string;
  name: string;
  duration_ms: number;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string }>;
  };
  uri: string;
}

interface Artist {
  id: string;
  name: string;
  images: Array<{ url: string }>;
  followers: { total: number };
  genres: string[];
}

interface Album {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  images: Array<{ url: string }>;
  release_date: string;
  total_tracks: number;
}

const authStore = useAuthStore();
const playerStore = usePlayerStore();

const query = ref('');
const tracks = ref<Track[]>([]);
const artists = ref<Artist[]>([]);
const albums = ref<Album[]>([]);
const isLoading = ref(false);
const hasSearched = ref(false);

const isAuthenticated = computed(() => authStore.isAuthenticated);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const search = async () => {
  if (!query.value.trim()) {
    tracks.value = [];
    artists.value = [];
    albums.value = [];
    hasSearched.value = false;
    return;
  }

  isLoading.value = true;
  hasSearched.value = true;

  try {
    const response = await spotifyClient.search(query.value, ['track', 'artist', 'album'], 20);
    tracks.value = response.data.tracks?.items || [];
    artists.value = response.data.artists?.items || [];
    albums.value = response.data.albums?.items || [];
  } catch (err) {
    console.error('Search failed:', err);
  } finally {
    isLoading.value = false;
  }
};

watch(query, () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(search, 400);
});

const playTrack = async (track: Track) => {
  try {
    await spotifyClient.playTrack(track.uri);
  } catch (err) {
    console.error('Failed to play track:', err);
  }
};

const formatFollowers = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const hasResults = computed(() => {
  return tracks.value.length > 0 || artists.value.length > 0 || albums.value.length > 0;
});
</script>

<template>
  <div class="view-container">
    <div class="search-header">
      <h1>Search</h1>
      <div class="search-input-wrapper">
        <i class="pi pi-search search-icon"></i>
        <input
          v-model="query"
          type="text"
          placeholder="What do you want to listen to?"
          class="search-input"
          autofocus
        />
        <i v-if="isLoading" class="pi pi-spin pi-spinner loading-icon"></i>
      </div>
    </div>

    <!-- Not Authenticated -->
    <div v-if="!isAuthenticated" class="empty-state">
      <i class="pi pi-lock"></i>
      <h2>Connect to Spotify</h2>
      <p>Sign in to search for tracks, artists, and albums.</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading && !hasResults" class="loading-state">
      <div class="spinner"></div>
      <p>Searching...</p>
    </div>

    <!-- No Results -->
    <div v-else-if="hasSearched && !hasResults && !isLoading" class="empty-state">
      <i class="pi pi-search"></i>
      <p>No results found for "{{ query }}"</p>
    </div>

    <!-- Initial State -->
    <div v-else-if="!hasSearched" class="empty-state">
      <i class="pi pi-music"></i>
      <p>Search for your favorite tracks, artists, and albums</p>
    </div>

    <!-- Search Results -->
    <div v-else class="search-results">
      <!-- Artists -->
      <DataCard v-if="artists.length" title="Artists" icon="pi-users">
        <div class="artists-grid">
          <RouterLink
            v-for="artist in artists.slice(0, 6)"
            :key="artist.id"
            :to="`/artist/${artist.id}`"
            class="artist-card"
          >
            <img
              v-if="artist.images[0]"
              :src="artist.images[0].url"
              :alt="artist.name"
              class="artist-image"
            />
            <div v-else class="artist-placeholder">
              <i class="pi pi-user"></i>
            </div>
            <span class="artist-name">{{ artist.name }}</span>
            <span class="artist-followers">{{ formatFollowers(artist.followers.total) }} followers</span>
          </RouterLink>
        </div>
      </DataCard>

      <!-- Tracks -->
      <DataCard v-if="tracks.length" title="Tracks" icon="pi-play">
        <div class="tracks-list">
          <TrackItem
            v-for="track in tracks"
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

      <!-- Albums -->
      <DataCard v-if="albums.length" title="Albums" icon="pi-th-large">
        <div class="albums-grid">
          <AlbumItem
            v-for="album in albums"
            :key="album.id"
            :album-id="album.id"
            :image="album.images[0]?.url"
            :name="album.name"
            :artists="album.artists"
            :release-year="album.release_date?.split('-')[0]"
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

.search-header {
  margin-bottom: 2rem;
}

.search-header h1 {
  margin: 0 0 1.5rem 0;
  font-size: 2rem;
  color: var(--fgColor-default);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 500px;
}

.search-icon {
  position: absolute;
  left: 16px;
  color: var(--fgColor-muted);
  font-size: 1rem;
}

.loading-icon {
  position: absolute;
  right: 16px;
  color: var(--fgColor-muted);
  font-size: 1rem;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 1px solid var(--borderColor-default);
  border-radius: 24px;
  background: var(--bgColor-muted);
  color: var(--fgColor-default);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input::placeholder {
  color: var(--fgColor-muted);
}

.search-input:focus {
  border-color: var(--color-ansi-green-bright);
  box-shadow: 0 0 0 3px rgb(from var(--color-ansi-green-bright) r g b / 0.2);
}

.loading-state,
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

.empty-state i {
  font-size: 3rem;
  color: var(--fgColor-muted);
}

.empty-state h2 {
  margin: 0;
  color: var(--fgColor-default);
}

.empty-state p {
  margin: 0;
  color: var(--fgColor-muted);
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.artist-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  padding: 1rem;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.artist-card:hover {
  background: var(--bgColor-muted);
}

.artist-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.75rem;
}

.artist-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--bgColor-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  color: var(--fgColor-muted);
  font-size: 2rem;
}

.artist-name {
  font-weight: 500;
  font-size: 0.95rem;
  color: var(--fgColor-default);
  text-align: center;
  margin-bottom: 0.25rem;
}

.artist-followers {
  font-size: 0.75rem;
  color: var(--fgColor-muted);
}

.tracks-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

@media (max-width: 600px) {
  .search-header h1 {
    font-size: 1.5rem;
  }

  .artists-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .artist-image,
  .artist-placeholder {
    width: 80px;
    height: 80px;
  }

  .albums-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
