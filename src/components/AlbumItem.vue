<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useRouter } from 'vue-router';
import { useColorExtraction } from '../composables/useColorExtraction';
import { spotifyClient } from '../services/spotify';

interface Props {
  albumId: string;
  image?: string;
  name: string;
  artists?: string;
  releaseYear?: string;
  albumType?: string;
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
  router.push(`/album/${props.albumId}`);
};

const handlePlayClick = async (event: Event) => {
  event.stopPropagation();
  try {
    await spotifyClient.playContext(`spotify:album:${props.albumId}`);
  } catch (err) {
    console.error('Failed to play album:', err);
  }
};
</script>

<template>
  <div
    class="album-item"
    :style="hoverStyle"
    :class="{ 'has-color': dominantColor }"
    @click="handleClick"
  >
    <div class="album-image-wrapper">
      <img
        v-if="image"
        :src="image"
        :alt="name"
        class="album-image"
      />
      <div v-else class="album-placeholder">
        <i class="pi pi-image"></i>
      </div>
      <div class="play-overlay" @click="handlePlayClick">
        <i class="pi pi-play"></i>
      </div>
    </div>
    <div class="album-info">
      <span class="album-name">{{ name }}</span>
      <span class="album-meta">
        <template v-if="releaseYear">{{ releaseYear }}</template>
        <template v-if="releaseYear && (artists || albumType)"> · </template>
        <template v-if="albumType">{{ albumType }}</template>
        <template v-if="albumType && artists"> · </template>
        <template v-if="artists">{{ artists }}</template>
      </span>
    </div>
  </div>
</template>

<style scoped>
.album-item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  background: rgb(from var(--hover-bg) r g b / 0.05);
}

.album-item:hover {
  background: var(--bgColor-muted);
}

.album-item.has-color:hover {
  background: rgb(from var(--hover-bg) r g b / 0.2);
}

.album-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  margin-bottom: 0.75rem;
}

.album-image {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
}

.album-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: var(--bgColor-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fgColor-muted);
  font-size: 2rem;
}

.play-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-ansi-green-bright);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.2s, transform 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.album-item:hover .play-overlay {
  opacity: 1;
  transform: translateY(0);
}

.play-overlay:hover {
  transform: scale(1.1);
}

.play-overlay i {
  color: var(--bgColor-default);
  font-size: 1rem;
  margin-left: 2px;
}

.album-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.album-name {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--fgColor-default);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-meta {
  font-size: 0.75rem;
  color: var(--fgColor-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: capitalize;
}
</style>
