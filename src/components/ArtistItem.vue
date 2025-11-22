<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useRouter } from 'vue-router';
import { useColorExtraction } from '../composables/useColorExtraction';
import { spotifyClient } from '../services/spotify';

interface Props {
  artistId?: string;
  rank?: number;
  image?: string;
  name: string;
  genres?: string;
  followers?: string;
}

const props = defineProps<Props>();
const router = useRouter();

const imageUrl = toRef(props, 'image');
const { dominantColor } = useColorExtraction(imageUrl);

const hoverStyle = computed(() => {
  if (!dominantColor.value) return {};
  return {
    '--hover-bg': dominantColor.value
  };
});

const handleClick = () => {
  if (props.artistId) {
    router.push(`/artist/${props.artistId}`);
  }
};

const handlePlayClick = async (event: Event) => {
  event.stopPropagation();
  if (props.artistId) {
    try {
      await spotifyClient.playContext(`spotify:artist:${props.artistId}`);
    } catch (err) {
      console.error('Failed to play artist:', err);
    }
  }
};
</script>

<template>
  <div
    class="artist-item"
    :style="hoverStyle"
    :class="{ 'has-color': dominantColor, 'clickable': artistId }"
    @click="handleClick"
  >
    <div v-if="rank" class="artist-rank">{{ rank }}</div>
    <div v-if="image" class="artist-image-wrapper">
      <img
        :src="image"
        :alt="name"
        class="artist-image"
      />
      <div class="play-overlay" @click="handlePlayClick">
        <i class="pi pi-play"></i>
      </div>
    </div>
    <div class="artist-info">
      <div class="artist-name">{{ name }}</div>
      <div v-if="genres || followers" class="artist-meta">
        <span v-if="followers">{{ followers }} followers</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.artist-item {
  display: flex;
  gap: 1rem;
  padding: 10px;
  border-radius: 8px;
  align-items: center;
  transition: background-color 0.2s, border-color 0.2s;
  border: 1px solid rgb(from var(--hover-bg) r g b / 0);
  background: rgb(from var(--hover-bg) r g b / 0.1);
}

.artist-item.clickable {
  cursor: pointer;
}

.artist-item:hover {
  border: 1px solid var(--borderColor-default);
}

.artist-item.has-color:hover {
  border-color: var(--hover-bg);
  background: rgb(from var(--hover-bg) r g b / 0.3);
}

.artist-rank {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--fgColor-muted);
  width: 2rem;
  text-align: center;
  flex-shrink: 0;
}

.artist-image-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.artist-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
}

.artist-image-wrapper:hover .play-overlay {
  opacity: 1;
}

.play-overlay i {
  color: white;
  font-size: 1.25rem;
  margin-left: 2px;
}

.artist-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.artist-name {
  font-weight: 600;
  color: var(--fgColor-default);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist-meta {
  color: var(--fgColor-muted);
  font-size: 0.85rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.artist-meta .separator {
  color: var(--borderColor-default);
}
</style>
