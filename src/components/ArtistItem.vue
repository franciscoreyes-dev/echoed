<script setup lang="ts">
interface Props {
  rank?: number;
  image?: string;
  name: string;
  genres?: string;
  followers?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="artist-item">
    <div v-if="rank" class="artist-rank">{{ rank }}</div>
    <img
      v-if="image"
      :src="image"
      :alt="name"
      class="artist-image"
    />
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
  transition: background-color 0.2s;
  border: 1px solid var(--bgColor-muted);
  background: var(--bgColor-muted);
}

.artist-item:hover {
  border: 1px solid var(--borderColor-default);
}

.artist-rank {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--fgColor-muted);
  width: 2rem;
  text-align: center;
  flex-shrink: 0;
}

.artist-image {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
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
