<script setup lang="ts">
import { computed, toRef, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useColorExtraction } from '../composables/useColorExtraction';
import { useTrackSaved } from '../composables/useTrackSaved';
import { usePlayerStore } from '../stores/player';
import BaseButton from './BaseButton.vue';

interface Props {
  trackId?: string;
  image?: string;
  title: string;
  artists: string;
  album?: string;
  duration?: string;
  playedAt?: string;
  showInfo?: boolean;
  spotifyUrl?: string;
  draggable?: boolean;
  index?: number;
  showLike?: boolean;
  playlistId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showInfo: false,
  draggable: false,
  showLike: false
});

const emit = defineEmits<{
  removed: [trackId: string];
}>();

const router = useRouter();
const playerStore = usePlayerStore();
const { checkIfSaved, isSaved, toggleSaved } = useTrackSaved();
const imageUrl = toRef(props, 'image');
const { dominantColor } = useColorExtraction(imageUrl);

const isTrackSaved = computed(() => props.trackId ? isSaved(props.trackId) : false);

onMounted(() => {
  if (props.showLike && props.trackId) {
    checkIfSaved([props.trackId]);
  }
});

watch(() => props.trackId, (newId) => {
  if (props.showLike && newId) {
    checkIfSaved([newId]);
  }
});

const hoverStyle = computed(() => {
  if (!dominantColor.value) return {};
  return {
    '--hover-bg': dominantColor.value
  };
});

const handleItemClick = () => {
  if (props.trackId && !props.draggable) {
    router.push(`/track/${props.trackId}`);
  }
};

const handlePlayClick = (event: Event) => {
  event.stopPropagation();
  if (props.trackId) {
    playerStore.playTrack(props.trackId);
  }
};

const handleSpotifyClick = (event: Event) => {
  event.stopPropagation();
  if (props.spotifyUrl) {
    window.open(props.spotifyUrl, '_blank');
  } else if (props.trackId) {
    window.open(`https://open.spotify.com/track/${props.trackId}`, '_blank');
  }
};

const handleLikeClick = async (event: Event) => {
  event.stopPropagation();
  if (props.trackId) {
    await toggleSaved(props.trackId);
  }
};

const handleRemoveClick = (event: Event) => {
  event.stopPropagation();
  if (props.trackId) {
    emit('removed', props.trackId);
  }
};
</script>

<template>
  <div
    class="track-item"
    :style="hoverStyle"
    :class="{
      'has-color': dominantColor,
      'clickable': trackId && !draggable,
      'is-draggable': draggable
    }"
    @click="handleItemClick"
  >
    <div v-if="draggable" class="drag-handle">
      <i class="pi pi-bars"></i>
    </div>
    <div v-if="image" class="track-image-wrapper" @click="handlePlayClick">
      <img
        :src="image"
        :alt="album || title"
        class="track-image"
      />
      <div class="play-overlay">
        <i class="pi pi-play"></i>
      </div>
    </div>
    <div class="track-info">
      <div class="track-name-row">
        <div class="track-name">{{ title }}</div>
        <div class="track-actions">
          <BaseButton
            v-if="showLike && trackId"
            :icon="isTrackSaved ? 'pi pi-heart-fill' : 'pi pi-heart'"
            :severity="isTrackSaved ? 'success' : 'secondary'"
            variant="text"
            size="small"
            @click="handleLikeClick"
            :aria-label="isTrackSaved ? 'Remove from Liked Songs' : 'Add to Liked Songs'"
            class="like-btn"
          />
          <BaseButton
            v-if="playlistId && trackId"
            icon="pi pi-trash"
            severity="danger"
            variant="text"
            size="small"
            @click="handleRemoveClick"
            aria-label="Remove from playlist"
            class="remove-btn"
          />
          <BaseButton
            v-if="showInfo && trackId"
            label="Open on Spotify"
            severity="secondary"
            variant="text"
            size="small"
            @click="handleSpotifyClick"
            aria-label="Open on Spotify"
            class="spotify-btn"
          />
        </div>
      </div>
      <div v-if="album || duration || playedAt" class="track-meta">
        <div class="track-artist">{{ artists }}</div>
        <div v-if="duration">{{ duration }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.track-item {
  display: flex;
  gap: 0.8rem;
  padding: 10px;
  border-radius: 8px;
  align-items: center;
  transition: background-color 0.2s, border-color 0.2s;
  background: rgb(from var(--hover-bg) r g b / 0.1);
  border: 1px solid rgb(from var(--hover-bg) r g b / 0);
  color: var(--fgColor-default);
}

.track-item.clickable {
  cursor: pointer;
}

.track-item.is-draggable {
  cursor: grab;
}

.track-item.is-draggable:active {
  cursor: grabbing;
}

.track-item:hover {
  border-color: var(--display-green-scale-2);
  color: var(--color-ansi-green-bright);
  background: rgb(from var(--display-green-scale-0) r g b / 0.4);
}

.track-item.has-color:hover {
  background: rgb(from var(--hover-bg) r g b / 0.3);
  border-color: var(--hover-bg);
  color: var(--fgColor-default);
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  color: var(--fgColor-muted);
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.track-image-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  cursor: pointer;
}

.track-image {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.track-image-wrapper:hover .play-overlay {
  opacity: 1;
}

.play-overlay i {
  color: white;
  font-size: 1.5rem;
}

.track-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.track-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.track-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.like-btn,
.remove-btn,
.spotify-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.track-item:hover .like-btn,
.track-item:hover .remove-btn,
.track-item:hover .spotify-btn,
.like-btn[class*="success"] {
  opacity: 1;
}

.track-item.has-color .like-btn:hover,
.track-item.has-color .remove-btn:hover,
.track-item.has-color .spotify-btn:hover {
  background: rgb(from var(--hover-bg) r g b / 0.1) !important;
}

.track-artist {
  color: var(--fgColor-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-meta {
  color: var(--fgColor-muted);
  font-size: 0.85rem;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
}

.track-meta .separator {
  color: var(--borderColor-default);
}

.played-at {
  color: var(--fgColor-muted);
  font-style: italic;
}
</style>
