<script setup lang="ts">
interface Props {
  title: string;
  icon?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="data-card">
    <div class="card-header">
      <i v-if="icon" :class="['pi', icon]"></i>
      <h2>{{ title }}</h2>
    </div>
    <div class="card-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.data-card {
  border: 1px solid var(--borderColor-default);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 10px 20px;
  border-bottom: 1px solid var(--borderColor-default);
  background: var(--bgColor-muted);
}

.card-header i {
  font-size: 0.875rem;
  color: var(--color-ansi-green-bright);
}

.card-header h2 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--fgColor-default);
}

.card-content {
  padding: 20px;
}
</style>
