<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useRouter } from 'vue-router';
import { useColorExtraction } from '../composables/useColorExtraction';
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
}

const props = withDefaults(defineProps<Props>(), {
  showInfo: false
});

const router = useRouter();
const imageUrl = toRef(props, 'image');
const { dominantColor } = useColorExtraction(imageUrl);

const hoverStyle = computed(() => {
  if (!dominantColor.value) return {};
  return {
    '--hover-bg': dominantColor.value
  };
});

const handleInfoClick = (event: Event) => {
  event.stopPropagation();
  if (props.trackId) {
    router.push(`/track/${props.trackId}`);
  }
};
</script>

<template>
  <div class="track-item" :style="hoverStyle" :class="{ 'has-color': dominantColor }">
    <img
      v-if="image"
      :src="image"
      :alt="album || title"
      class="track-image"
    />
    <div class="track-info">
      <div class="track-name-row">
        <div class="track-name">{{ title }}</div>
        <BaseButton
          v-if="showInfo && trackId"
          icon="pi pi-info-circle"
          severity="secondary"
          variant="text"
          size="small"
          @click="handleInfoClick"
          aria-label="Track info"
          class="info-btn"
        />
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

.track-image {
  width: 56px;
  height: 56px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.track-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.track-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.track-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-btn {
  flex-shrink: 0;
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
