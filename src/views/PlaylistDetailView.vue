<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { spotifyClient } from '../services/spotify';
import { useLibraryStore } from '../stores/library';
import { usePlayerStore } from '../stores/player';
import { apiCache } from '../utils/cache';
import BaseButton from '../components/BaseButton.vue';
import DataCard from '../components/DataCard.vue';
import TrackItem from '../components/TrackItem.vue';

interface PlaylistTrack {
  added_at: string;
  track: {
    id: string;
    name: string;
    duration_ms: number;
    album: {
      name: string;
      images: { url: string }[];
    };
    artists: { id: string; name: string }[];
    external_urls: { spotify: string };
  } | null;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  owner: { display_name: string };
  followers: { total: number };
  tracks: { total: number };
  external_urls: { spotify: string };
}

const route = useRoute();
const router = useRouter();
const libraryStore = useLibraryStore();
const playerStore = usePlayerStore();

const playlist = ref<Playlist | null>(null);
const tracks = ref<PlaylistTrack[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showDeleteModal = ref(false);
const isDeleting = ref(false);
const dragIndex = ref<number | null>(null);

const fetchPlaylistData = async () => {
  const playlistId = route.params.id as string;
  if (!playlistId) {
    error.value = 'No playlist ID provided';
    isLoading.value = false;
    return;
  }

  const cacheKey = `playlist-detail-${playlistId}`;
  const cached = apiCache.get<{ playlist: Playlist; tracks: PlaylistTrack[] }>(cacheKey);

  if (cached) {
    playlist.value = cached.playlist;
    tracks.value = cached.tracks;
    isLoading.value = false;
    return;
  }

  try {
    const [playlistRes, tracksRes] = await Promise.all([
      spotifyClient.getPlaylist(playlistId),
      spotifyClient.getPlaylistTracks(playlistId)
    ]);

    playlist.value = playlistRes.data;
    tracks.value = tracksRes.data.items || [];

    apiCache.set(cacheKey, {
      playlist: playlist.value,
      tracks: tracks.value
    }, 60000); // 1 min
  } catch (err) {
    console.error('Failed to fetch playlist data:', err);
    error.value = 'Failed to load playlist details';
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  router.back();
};

const openInSpotify = () => {
  if (playlist.value?.external_urls.spotify) {
    window.open(playlist.value.external_urls.spotify, '_blank');
  }
};

const handlePlay = () => {
  if (playlist.value) {
    playerStore.playPlaylist(playlist.value.id);
  }
};

const handleDelete = async () => {
  if (!playlist.value) return;

  isDeleting.value = true;
  try {
    await libraryStore.deletePlaylist(playlist.value.id);
    showDeleteModal.value = false;
    router.push('/library');
  } catch (err) {
    console.error('Failed to delete playlist:', err);
  } finally {
    isDeleting.value = false;
  }
};

const formatFollowers = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const handleDragStart = (index: number) => {
  dragIndex.value = index;
};

const handleDrop = async (dropIndex: number) => {
  if (dragIndex.value === null || dragIndex.value === dropIndex || !playlist.value) return;

  const fromIndex = dragIndex.value;
  const toIndex = dropIndex;

  // Update local state immediately for responsiveness
  const [movedItem] = tracks.value.splice(fromIndex, 1);
  tracks.value.splice(toIndex, 0, movedItem);

  // Call Spotify API to persist the change
  try {
    const insertBefore = toIndex > fromIndex ? toIndex + 1 : toIndex;
    await spotifyClient.reorderPlaylistTracks(playlist.value.id, fromIndex, insertBefore);
  } catch (err) {
    console.error('Failed to reorder tracks:', err);
    // Revert on error
    const [item] = tracks.value.splice(toIndex, 1);
    tracks.value.splice(fromIndex, 0, item);
  }

  dragIndex.value = null;
};

onMounted(() => {
  fetchPlaylistData();
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
      <p>Loading playlist...</p>
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

    <!-- Playlist Details -->
    <div v-else-if="playlist" class="playlist-details">
      <!-- Playlist Header -->
      <div class="playlist-header">
        <img
          v-if="playlist.images[0]"
          :src="playlist.images[0].url"
          :alt="playlist.name"
          class="playlist-image"
        />
        <div v-else class="playlist-image-placeholder">
          <i class="pi pi-music"></i>
        </div>
        <div class="playlist-main-info">
          <h1>{{ playlist.name }}</h1>
          <p v-if="playlist.description" class="description">{{ playlist.description }}</p>
          <div class="playlist-meta">
            <span class="owner">
              <i class="pi pi-user"></i>
              {{ playlist.owner.display_name }}
            </span>
            <span class="tracks-count">
              <i class="pi pi-headphones"></i>
              {{ playlist.tracks.total }} tracks
            </span>
            <span v-if="playlist.followers.total" class="followers">
              <i class="pi pi-users"></i>
              {{ formatFollowers(playlist.followers.total) }} followers
            </span>
          </div>
          <div class="action-buttons">
            <BaseButton
              icon="pi pi-play"
              label="Play"
              severity="success"
              @click="handlePlay"
            />
            <BaseButton
              icon="pi pi-external-link"
              label="Open in Spotify"
              severity="secondary"
              variant="outlined"
              @click="openInSpotify"
            />
            <BaseButton
              icon="pi pi-trash"
              label="Delete"
              severity="danger"
              variant="outlined"
              @click="showDeleteModal = true"
            />
          </div>
        </div>
      </div>

      <!-- Tracks List -->
      <DataCard v-if="tracks.length" title="Tracks" icon="pi-list">
        <div class="tracks-list">
          <template v-for="(item, index) in tracks" :key="item.added_at">
            <TrackItem
              v-if="item.track"
              :track-id="item.track.id"
              :image="item.track.album.images[item.track.album.images.length - 1]?.url"
              :title="item.track.name"
              :artists="item.track.artists.map(a => a.name).join(', ')"
              :album="item.track.album.name"
              :duration="playerStore.formatDuration(item.track.duration_ms)"
              :show-info="true"
              :draggable="true"
              :index="index"
              @dragstart="handleDragStart"
              @drop="handleDrop"
            />
          </template>
        </div>
      </DataCard>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content">
        <h3>Delete Playlist</h3>
        <p>Are you sure you want to delete "{{ playlist?.name }}"? This action cannot be undone.</p>
        <div class="modal-actions">
          <BaseButton
            label="Cancel"
            severity="secondary"
            variant="outlined"
            @click="showDeleteModal = false"
          />
          <BaseButton
            label="Delete"
            icon="pi pi-trash"
            severity="danger"
            :loading="isDeleting"
            @click="handleDelete"
          />
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

.playlist-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.playlist-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.playlist-image {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
}

.playlist-image-placeholder {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  background: var(--bgColor-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.playlist-image-placeholder i {
  font-size: 4rem;
  color: var(--fgColor-muted);
}

.playlist-main-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.playlist-main-info h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  color: var(--fgColor-default);
}

.description {
  color: var(--fgColor-muted);
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
}

.playlist-meta {
  display: flex;
  gap: 1.5rem;
  color: var(--fgColor-muted);
  margin-bottom: 1rem;
}

.playlist-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.playlist-meta i {
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
  gap: 0.5rem;
  max-height: 500px;
  overflow-y: auto;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bgColor-default);
  border: 1px solid var(--borderColor-default);
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  color: var(--fgColor-default);
}

.modal-content p {
  color: var(--fgColor-muted);
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 600px) {
  .playlist-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .playlist-image,
  .playlist-image-placeholder {
    width: 150px;
    height: 150px;
  }

  .playlist-main-info {
    align-items: center;
  }

  .playlist-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
