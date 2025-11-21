<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useRouter } from 'vue-router';
import { useColorExtraction } from '../composables/useColorExtraction';
import BaseButton from './BaseButton.vue';

interface Props {
  playlistId: string;
  image?: string;
  name: string;
  trackCount: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  delete: [playlistId: string];
}>();

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
  router.push(`/playlist/${props.playlistId}`);
};

const handleDelete = (event: Event) => {
  event.stopPropagation();
  emit('delete', props.playlistId);
};
</script>

<template>
  <div
    class="playlist-card"
    :style="hoverStyle"
    :class="{ 'has-color': dominantColor }"
    @click="handleClick"
  >
    <img
      v-if="image"
      :src="image"
      :alt="name"
      class="playlist-image"
    />
    <div v-else class="playlist-image-placeholder">
      <i class="pi pi-music"></i>
    </div>
    <div class="playlist-info">
      <div class="playlist-name-row">
        <div class="playlist-name">{{ name }}</div>
        <BaseButton
          icon="pi pi-trash"
          severity="danger"
          variant="text"
          size="small"
          @click="handleDelete"
          aria-label="Delete playlist"
          class="delete-btn"
        />
      </div>
      <div class="playlist-meta">{{ trackCount }} tracks</div>
    </div>
  </div>
</template>

<style scoped>
.playlist-card {
  display: flex;
  gap: 0.8rem;
  padding: 10px;
  border-radius: 8px;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  background: rgb(from var(--hover-bg) r g b / 0.1);
  border: 1px solid rgb(from var(--hover-bg) r g b / 0);
  color: var(--fgColor-default);
}

.playlist-card:hover {
  border-color: var(--display-green-scale-2);
  color: var(--color-ansi-green-bright);
  background: rgb(from var(--display-green-scale-0) r g b / 0.4);
}

.playlist-card.has-color:hover {
  background: rgb(from var(--hover-bg) r g b / 0.3);
  border-color: var(--hover-bg);
  color: var(--fgColor-default);
}

.playlist-image {
  width: 64px;
  height: 64px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.playlist-image-placeholder {
  width: 64px;
  height: 64px;
  background: var(--bgColor-default);
  border-radius: 4px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.playlist-image-placeholder i {
  font-size: 1.5rem;
  color: var(--fgColor-muted);
}

.playlist-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.playlist-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.playlist-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.playlist-card:hover .delete-btn {
  opacity: 1;
}

.playlist-meta {
  font-size: 0.85rem;
  color: var(--fgColor-muted);
}
</style>
