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
      <div class="header-left">
        <i v-if="icon" :class="['pi', icon]"></i>
        <h2>{{ title }}</h2>
      </div>
      <div class="header-actions">
        <slot name="header-actions" />
      </div>
    </div>
    <div class="card-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.data-card {
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s;
  background: var(--bgColor-muted);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: var(--bgColor-muted);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-left i {
  font-size: 0.875rem;
  color: var(--color-ansi-green-bright);
}

.header-left h2 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--fgColor-default);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-content {
  padding: 20px;
}
</style>
