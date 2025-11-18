<script setup lang="ts">
// Library view - User's saved tracks, albums, and playlists
</script>

<template>
  <div class="view-container">
    <div class="view-header">
      <h1>Your Library</h1>
      <p class="subtitle">Playlists, albums, and saved tracks</p>
    </div>

    <div class="library-tabs">
      <button class="tab-btn active">Playlists</button>
      <button class="tab-btn">Albums</button>
      <button class="tab-btn">Tracks</button>
      <button class="tab-btn">Artists</button>
    </div>

    <div class="content-section">
      <div class="placeholder-card">
        <h2>Your Playlists</h2>
        <p>Your saved playlists will appear here</p>
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

.library-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0;
}

.tab-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #fff;
}

.tab-btn.active {
  color: #1db954;
  border-bottom-color: #1db954;
}

.content-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
  color: #fff;
}

.placeholder-card p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-size: 0.9rem;
}
</style>
