<script setup lang="ts">
interface Props {
  image?: string;
  title: string;
  artists: string;
  album?: string;
  duration?: string;
  playedAt?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="track-item">
    <img
      v-if="image"
      :src="image"
      :alt="album || title"
      class="track-image"
    />
    <div class="track-info">
      <div class="track-name">{{ title }}</div>
      <div class="track-artist">{{ artists }}</div>
      <div v-if="album || duration || playedAt" class="track-meta">
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
  transition: background-color 0.2s;
  border: 1px solid var(--borderColor-default);
}

.track-item:hover {
  background: var(--bgColor-muted);
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
  gap: 0.1rem;
}

.track-name {
  font-weight: 600;
  color: var(--fgColor-default);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  color: var(--fgColor-muted);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-meta {
  color: var(--fgColor-muted);
  font-size: 0.85rem;
  display: flex;
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
