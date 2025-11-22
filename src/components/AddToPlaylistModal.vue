<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLibraryStore } from '../stores/library';
import { spotifyClient } from '../services/spotify';
import BaseButton from './BaseButton.vue';

const props = defineProps<{
  trackId: string;
  trackName: string;
}>();

const emit = defineEmits<{
  close: [];
  added: [playlistName: string];
}>();

const libraryStore = useLibraryStore();
const isLoading = ref(false);
const addingTo = ref<string | null>(null);

onMounted(async () => {
  if (libraryStore.playlists.length === 0) {
    isLoading.value = true;
    await libraryStore.fetchPlaylists();
    isLoading.value = false;
  }
});

const addToPlaylist = async (playlistId: string, playlistName: string) => {
  addingTo.value = playlistId;
  try {
    const trackUri = `spotify:track:${props.trackId}`;
    await spotifyClient.addTracksToPlaylist(playlistId, [trackUri]);
    emit('added', playlistName);
    emit('close');
  } catch (err) {
    console.error('Failed to add track to playlist:', err);
  } finally {
    addingTo.value = null;
  }
};
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Add to Playlist</h3>
        <BaseButton
          icon="pi pi-times"
          variant="text"
          severity="secondary"
          size="small"
          @click="emit('close')"
        />
      </div>

      <p class="track-name">{{ trackName }}</p>

      <div class="playlist-list">
        <div v-if="isLoading" class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading playlists...</span>
        </div>

        <div v-else-if="libraryStore.playlists.length === 0" class="empty-state">
          <p>No playlists found</p>
        </div>

        <div
          v-else
          v-for="playlist in libraryStore.playlists"
          :key="playlist.id"
          class="playlist-item"
          @click="addToPlaylist(playlist.id, playlist.name)"
        >
          <img
            v-if="playlist.images[0]"
            :src="playlist.images[playlist.images.length - 1]?.url || playlist.images[0].url"
            :alt="playlist.name"
            class="playlist-image"
          />
          <div v-else class="playlist-image placeholder">
            <i class="pi pi-music"></i>
          </div>
          <div class="playlist-info">
            <div class="playlist-name">{{ playlist.name }}</div>
            <div class="playlist-tracks">{{ playlist.tracks.total }} tracks</div>
          </div>
          <i v-if="addingTo === playlist.id" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-plus add-icon"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--borderColor-default);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--fgColor-default);
}

.track-name {
  padding: 0.75rem 1.5rem;
  margin: 0;
  font-size: 0.85rem;
  color: var(--fgColor-muted);
  border-bottom: 1px solid var(--borderColor-default);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--fgColor-muted);
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.playlist-item:hover {
  background: var(--bgColor-muted);
}

.playlist-image {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.playlist-image.placeholder {
  background: var(--bgColor-emphasis);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fgColor-muted);
}

.playlist-info {
  flex: 1;
  min-width: 0;
}

.playlist-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--fgColor-default);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-tracks {
  font-size: 0.75rem;
  color: var(--fgColor-muted);
}

.add-icon {
  color: var(--fgColor-muted);
  opacity: 0;
  transition: opacity 0.15s;
}

.playlist-item:hover .add-icon {
  opacity: 1;
}

.playlist-item:hover .add-icon {
  color: var(--color-ansi-green-bright);
}
</style>
