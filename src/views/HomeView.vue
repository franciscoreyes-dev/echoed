<script setup lang="ts">
// Home view - Dashboard with overview of listening data
</script>

<template>
  <div class="view-container">
    <div class="view-header">
      <h1>Welcome to Echoed</h1>
      <p class="subtitle">Your personalized music insights</p>
    </div>

    <div class="content-section">
      <div class="placeholder-card">
        <h2>Recently Played</h2>
        <p>Your recently played tracks will appear here</p>
      </div>

      <div class="placeholder-card">
        <h2>Top Artists</h2>
        <p>Your most listened artists will appear here</p>
      </div>

      <div class="placeholder-card">
        <h2>Listening Stats</h2>
        <p>Your listening statistics will be visualized here</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  margin-bottom: 2rem;
}

.view-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: #fff;
}

.subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.content-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.placeholder-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  transition: all 0.3s;
}

.placeholder-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.placeholder-card h2 {
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  color: #fff;
}

.placeholder-card p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}
</style>
