<script setup lang="ts">
// OAuth callback handler
</script>

<template>
  <div class="view-container">
    <h1>Loading...</h1>
    <p>Processing authentication</p>
  </div>
</template>

<style scoped>
.view-container {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

h1 {
  color: #fff;
  font-size: 2rem;
  margin-bottom: 1rem;
}

p {
  color: rgba(255, 255, 255, 0.7);
}
</style>
