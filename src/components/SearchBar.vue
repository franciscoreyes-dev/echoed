<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { spotifyClient } from '../services/spotify';
import { usePlayerStore } from '../stores/player';

interface SearchResults {
  tracks: Array<{
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: { images: Array<{ url: string }> };
  }>;
  artists: Array<{
    id: string;
    name: string;
    images: Array<{ url: string }>;
  }>;
  albums: Array<{
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    images: Array<{ url: string }>;
  }>;
}

const router = useRouter();
const playerStore = usePlayerStore();

const query = ref('');
const results = ref<SearchResults>({ tracks: [], artists: [], albums: [] });
const isOpen = ref(false);
const isLoading = ref(false);
const searchRef = ref<HTMLElement | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const search = async () => {
  if (!query.value.trim()) {
    results.value = { tracks: [], artists: [], albums: [] };
    return;
  }

  isLoading.value = true;
  try {
    const response = await spotifyClient.search(query.value, ['track', 'artist', 'album'], 5);
    results.value = {
      tracks: response.data.tracks?.items || [],
      artists: response.data.artists?.items || [],
      albums: response.data.albums?.items || []
    };
    isOpen.value = true;
  } catch (err) {
    console.error('Search failed:', err);
  } finally {
    isLoading.value = false;
  }
};

watch(query, () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(search, 300);
});

const handleFocus = () => {
  if (query.value.trim() && hasResults()) {
    isOpen.value = true;
  }
};

const hasResults = () => {
  return results.value.tracks.length > 0 ||
         results.value.artists.length > 0 ||
         results.value.albums.length > 0;
};

const handleClickOutside = (event: MouseEvent) => {
  if (searchRef.value && !searchRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

const playTrack = (trackId: string) => {
  playerStore.playTrack(trackId);
  isOpen.value = false;
  query.value = '';
};

const goToTrack = (trackId: string) => {
  router.push(`/track/${trackId}`);
  isOpen.value = false;
  query.value = '';
};

const goToArtist = (artistId: string) => {
  router.push(`/artist/${artistId}`);
  isOpen.value = false;
  query.value = '';
};

const goToAlbum = (albumId: string) => {
  router.push(`/album/${albumId}`);
  isOpen.value = false;
  query.value = '';
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>

<template>
  <div ref="searchRef" class="search-bar">
    <div class="search-input-wrapper">
      <i class="pi pi-search search-icon"></i>
      <input
        v-model="query"
        type="text"
        placeholder="Search tracks, artists, albums..."
        class="search-input"
        @focus="handleFocus"
      />
      <i v-if="isLoading" class="pi pi-spin pi-spinner loading-icon"></i>
    </div>

    <div v-if="isOpen && hasResults()" class="search-results">
      <!-- Tracks -->
      <div v-if="results.tracks.length" class="result-section">
        <div class="section-title">Tracks</div>
        <div
          v-for="track in results.tracks"
          :key="track.id"
          class="result-item"
          @click="goToTrack(track.id)"
        >
          <img
            v-if="track.album.images.length"
            :src="track.album.images[track.album.images.length - 1]?.url"
            :alt="track.name"
            class="result-image"
          />
          <div class="result-info">
            <div class="result-name">{{ track.name }}</div>
            <div class="result-meta">{{ track.artists.map(a => a.name).join(', ') }}</div>
          </div>
          <button class="play-btn" @click.stop="playTrack(track.id)">
            <i class="pi pi-play"></i>
          </button>
        </div>
      </div>

      <!-- Artists -->
      <div v-if="results.artists.length" class="result-section">
        <div class="section-title">Artists</div>
        <div
          v-for="artist in results.artists"
          :key="artist.id"
          class="result-item"
          @click="goToArtist(artist.id)"
        >
          <img
            v-if="artist.images.length"
            :src="artist.images[artist.images.length - 1]?.url"
            :alt="artist.name"
            class="result-image artist-image"
          />
          <div v-else class="result-image artist-image placeholder">
            <i class="pi pi-user"></i>
          </div>
          <div class="result-info">
            <div class="result-name">{{ artist.name }}</div>
            <div class="result-meta">Artist</div>
          </div>
        </div>
      </div>

      <!-- Albums -->
      <div v-if="results.albums.length" class="result-section">
        <div class="section-title">Albums</div>
        <div
          v-for="album in results.albums"
          :key="album.id"
          class="result-item"
          @click="goToAlbum(album.id)"
        >
          <img
            v-if="album.images.length"
            :src="album.images[album.images.length - 1]?.url"
            :alt="album.name"
            class="result-image"
          />
          <div class="result-info">
            <div class="result-name">{{ album.name }}</div>
            <div class="result-meta">{{ album.artists.map(a => a.name).join(', ') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  width: 280px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--fgColor-muted);
  font-size: 0.85rem;
}

.loading-icon {
  position: absolute;
  right: 12px;
  color: var(--fgColor-muted);
  font-size: 0.85rem;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid var(--borderColor-default);
  border-radius: 20px;
  background: var(--bgColor-muted);
  color: var(--fgColor-default);
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input::placeholder {
  color: var(--fgColor-muted);
}

.search-input:focus {
  border-color: var(--color-ansi-green-bright);
  box-shadow: 0 0 0 2px rgb(from var(--color-ansi-green-bright) r g b / 0.2);
}

.search-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--bgColor-default);
  border: 1px solid var(--borderColor-default);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
}

.result-section {
  padding: 8px 0;
}

.result-section:not(:last-child) {
  border-bottom: 1px solid var(--borderColor-default);
}

.section-title {
  padding: 4px 12px 8px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--fgColor-muted);
  letter-spacing: 0.05em;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.result-item:hover {
  background: var(--bgColor-muted);
}

.result-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.result-image.artist-image {
  border-radius: 50%;
}

.result-image.placeholder {
  background: var(--bgColor-emphasis);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fgColor-muted);
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--fgColor-default);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  font-size: 0.75rem;
  color: var(--fgColor-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.play-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--color-ansi-green-bright);
  color: var(--bgColor-default);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s, transform 0.15s;
  flex-shrink: 0;
}

.result-item:hover .play-btn {
  opacity: 1;
}

.play-btn:hover {
  transform: scale(1.1);
}

.play-btn i {
  font-size: 0.75rem;
  margin-left: 2px;
}
</style>
