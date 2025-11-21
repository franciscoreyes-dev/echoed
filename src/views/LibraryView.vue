<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useLibraryStore, type TimeRange } from '../stores/library';
import { usePlayerStore } from '../stores/player';
import DataCard from '../components/DataCard.vue';
import TrackItem from '../components/TrackItem.vue';
import ArtistItem from '../components/ArtistItem.vue';
import PlaylistCard from '../components/PlaylistCard.vue';
import BaseButton from '../components/BaseButton.vue';

const authStore = useAuthStore();
const libraryStore = useLibraryStore();
const playerStore = usePlayerStore();

const selectedTimeRange = ref<TimeRange>('medium_term');
const showCreatePlaylist = ref(false);
const newPlaylistName = ref('');
const isCreating = ref(false);
const showDeleteModal = ref(false);
const playlistToDelete = ref<{ id: string; name: string } | null>(null);
const isDeleting = ref(false);

const timeRangeOptions = [
  { value: 'short_term', label: '4 Weeks' },
  { value: 'medium_term', label: '6 Months' },
  { value: 'long_term', label: 'All Time' }
];

const loadLibraryData = async () => {
  if (authStore.isAuthenticated) {
    await libraryStore.fetchAllLibraryData(selectedTimeRange.value);
  }
};

const handleTimeRangeChange = async (range: TimeRange) => {
  selectedTimeRange.value = range;
  await Promise.all([
    libraryStore.fetchTopArtists(range, 20),
    libraryStore.fetchTopTracks(range, 20)
  ]);
};

const handleCreatePlaylist = async () => {
  if (!newPlaylistName.value.trim() || !authStore.user?.id) return;

  isCreating.value = true;
  try {
    await libraryStore.createPlaylist(authStore.user.id, newPlaylistName.value.trim());
    newPlaylistName.value = '';
    showCreatePlaylist.value = false;
  } catch (err) {
    console.error('Failed to create playlist:', err);
  } finally {
    isCreating.value = false;
  }
};

const handleDeleteClick = (playlistId: string) => {
  const playlist = libraryStore.playlists.find(p => p.id === playlistId);
  if (playlist) {
    playlistToDelete.value = { id: playlist.id, name: playlist.name };
    showDeleteModal.value = true;
  }
};

const confirmDelete = async () => {
  if (!playlistToDelete.value) return;

  isDeleting.value = true;
  try {
    await libraryStore.deletePlaylist(playlistToDelete.value.id);
    showDeleteModal.value = false;
    playlistToDelete.value = null;
  } catch (err) {
    console.error('Failed to delete playlist:', err);
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  loadLibraryData();
});

watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      loadLibraryData();
    }
  }
);
</script>

<template>
  <div class="view-container">
    <div class="view-header">
      <div class="header-top">
        <div>
          <h1>Your Library</h1>
          <p class="subtitle">Playlists, liked songs, and top music</p>
        </div>
        <div class="time-range-selector">
          <BaseButton
            v-for="option in timeRangeOptions"
            :key="option.value"
            :label="option.label"
            :severity="selectedTimeRange === option.value ? 'primary' : 'secondary'"
            :variant="selectedTimeRange === option.value ? undefined : 'outlined'"
            size="small"
            @click="handleTimeRangeChange(option.value as TimeRange)"
          />
        </div>
      </div>
    </div>

    <!-- Not authenticated -->
    <div v-if="!authStore.isAuthenticated" class="empty-state">
      <i class="pi pi-lock"></i>
      <p>Connect to Spotify to see your library</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="libraryStore.isLoading && libraryStore.isPlaylistsLoading && libraryStore.isSavedTracksLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your library...</p>
    </div>

    <!-- Content -->
    <div v-else class="content-grid">
      <!-- Playlists -->
      <DataCard title="Playlists" icon="pi-list" class="playlists-card">
        <template #header-actions>
          <BaseButton
            :icon="showCreatePlaylist ? 'pi pi-times' : 'pi pi-plus'"
            severity="success"
            :variant="showCreatePlaylist ? 'text' : 'outlined'"
            :label="showCreatePlaylist ? '' : 'New Playlist'"
            size="small"
            @click="showCreatePlaylist = !showCreatePlaylist"
            :aria-label="showCreatePlaylist ? 'Cancel' : 'Create playlist'"
          />
        </template>

        <!-- Create Playlist Form -->
        <div v-if="showCreatePlaylist" class="create-playlist-form">
          <input
            v-model="newPlaylistName"
            type="text"
            placeholder="New playlist name..."
            class="playlist-input"
            @keyup.enter="handleCreatePlaylist"
          />
          <BaseButton
            label="Create"
            icon="pi pi-check"
            severity="primary"
            size="small"
            :loading="isCreating"
            :disabled="!newPlaylistName.trim()"
            @click="handleCreatePlaylist"
          />
        </div>

        <div v-if="libraryStore.isPlaylistsLoading" class="loading-inline">
          <div class="spinner-small"></div>
        </div>
        <div v-else-if="libraryStore.playlists.length === 0" class="empty-state">
          <p>No playlists found</p>
        </div>
        <div v-else class="playlists-list">
          <PlaylistCard
            v-for="playlist in libraryStore.playlists"
            :key="playlist.id"
            :playlist-id="playlist.id"
            :image="playlist.images?.[0]?.url"
            :name="playlist.name"
            :track-count="playlist.tracks.total"
            @delete="handleDeleteClick"
          />
        </div>
      </DataCard>

      <!-- Liked Songs -->
      <DataCard title="Liked Songs" icon="pi-heart-fill">
        <template #header-actions>
          <span class="track-count">{{ libraryStore.savedTracksTotal }} songs</span>
        </template>

        <div v-if="libraryStore.isSavedTracksLoading" class="loading-inline">
          <div class="spinner-small"></div>
        </div>
        <div v-else-if="libraryStore.savedTracks.length === 0" class="empty-state">
          <p>No liked songs found</p>
        </div>
        <div v-else class="list-container">
          <TrackItem
            v-for="item in libraryStore.savedTracks"
            :key="item.track.id"
            :track-id="item.track.id"
            :image="item.track.album.images[item.track.album.images.length - 1]?.url"
            :title="item.track.name"
            :artists="item.track.artists.map((a) => a.name).join(', ')"
            :album="item.track.album.name"
            :duration="playerStore.formatDuration(item.track.duration_ms)"
            show-info
          />
        </div>
      </DataCard>

      <!-- Top Tracks -->
      <DataCard title="Top Tracks" icon="pi-headphones">
        <div v-if="libraryStore.topTracks.length === 0" class="empty-state">
          <p>No top tracks found</p>
        </div>
        <div v-else class="list-container">
          <TrackItem
            v-for="track in libraryStore.topTracks"
            :key="track.id"
            :track-id="track.id"
            :image="track.album.images[track.album.images.length - 1]?.url"
            :title="track.name"
            :artists="track.artists.map((a) => a.name).join(', ')"
            :album="track.album.name"
            :duration="playerStore.formatDuration(track.duration_ms)"
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
            v-for="(artist, index) in libraryStore.topArtists"
            :key="artist.id"
            :artist-id="artist.id"
            :rank="index + 1"
            :image="artist.images[artist.images.length - 1]?.url"
            :name="artist.name"
            :genres="artist.genres.slice(0, 2).join(', ')"
            :followers="libraryStore.formatFollowers(artist.followers.total)"
          />
        </div>
      </DataCard>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content">
        <h3>Delete Playlist</h3>
        <p>Are you sure you want to delete "{{ playlistToDelete?.name }}"? This action cannot be undone.</p>
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
            @click="confirmDelete"
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

.view-header {
  margin-bottom: 2rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
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

.time-range-selector {
  display: flex;
  gap: 0.5rem;
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
  border-top-color: var(--color-ansi-green-bright);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-inline {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid var(--borderColor-default);
  border-top-color: var(--color-ansi-green-bright);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: var(--fgColor-muted);
  font-size: 1rem;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.playlists-card {
  grid-column: 1 / -1;
}

.playlists-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 500px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--fgColor-muted);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.track-count {
  font-size: 0.85rem;
  color: var(--fgColor-muted);
}

/* Create Playlist Form */
.create-playlist-form {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--bgColor-default);
  border-radius: 6px;
  border: 1px solid var(--borderColor-default);
}

.playlist-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--borderColor-default);
  border-radius: 6px;
  background: var(--bgColor-muted);
  color: var(--fgColor-default);
  font-size: 0.9rem;
}

.playlist-input:focus {
  outline: none;
  border-color: var(--color-ansi-green-bright);
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

/* Responsive */
@media (max-width: 768px) {
  .header-top {
    flex-direction: column;
  }

  .time-range-selector {
    width: 100%;
    justify-content: flex-start;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .playlists-list {
    grid-template-columns: 1fr;
  }
}
</style>
