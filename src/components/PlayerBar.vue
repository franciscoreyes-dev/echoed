<script setup lang="ts">
import { ref } from 'vue';
import BaseButton from './BaseButton.vue';

const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(180); // 3 minutes placeholder
const volume = ref(70);

const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
</script>

<template>
  <footer class="player-bar">
    <div class="player-container">
      <!-- Track Info -->
      <div class="track-info">
        <div class="track-artwork">
          <div class="artwork-placeholder">♪</div>
        </div>
        <div class="track-details">
          <div class="track-name">No track playing</div>
          <div class="track-artist">Connect to Spotify</div>
        </div>
      </div>

      <!-- Playback Controls -->
      <div class="player-controls">
        <div class="control-buttons">
          <BaseButton
            icon="pi pi-step-backward"
            variant="text"
            rounded
            severity="secondary"
            aria-label="Previous"
          />

          <BaseButton
            :icon="isPlaying ? 'pi pi-pause' : 'pi pi-play'"
            rounded
            severity="primary"
            @click="togglePlay"
            aria-label="Play/Pause"
          />

          <BaseButton
            icon="pi pi-step-forward"
            variant="text"
            rounded
            severity="secondary"
            aria-label="Next"
          />
        </div>

        <!-- Progress Bar -->
        <div class="progress-container">
          <span class="time-label">{{ formatTime(currentTime) }}</span>
          <div class="progress-bar">
            <input
              type="range"
              min="0"
              :max="duration"
              v-model="currentTime"
              class="progress-slider"
            />
            <div
              class="progress-fill"
              :style="{ width: `${(currentTime / duration) * 100}%` }"
            ></div>
          </div>
          <span class="time-label">{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- Volume Control -->
      <div class="volume-control">
        <BaseButton
          icon="pi pi-volume-up"
          variant="text"
          severity="secondary"
          size="small"
          aria-label="Volume"
        />
        <div class="volume-slider-container">
          <input
            type="range"
            min="0"
            max="100"
            v-model="volume"
            class="volume-slider"
          />
          <div
            class="volume-fill"
            :style="{ width: `${volume}%` }"
          ></div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 90px;
  background: var(--bgColor-muted);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--borderColor-default);
  z-index: 100;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.player-container {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  gap: 2rem;
  padding: 0 2rem;
}

/* Track Info */
.track-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.track-artwork {
  width: 56px;
  height: 56px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.artwork-placeholder {
  width: 100%;
  height: 100%;
  background: var(--bgColor-emphasis);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fgColor-muted);
  font-size: 1.5rem;
}

.track-details {
  min-width: 0;
}

.track-name {
  font-weight: 500;
  color: var(--fgColor-default);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: 0.8rem;
  color: var(--fgColor-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Playback Controls */
.player-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Progress Bar */
.progress-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.time-label {
  font-size: 0.75rem;
  color: var(--fgColor-muted);
  min-width: 40px;
  text-align: center;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--borderColor-default);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.progress-slider {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.progress-fill {
  height: 100%;
  background: var(--button-primary-bgColor-rest);
  border-radius: 2px;
  transition: width 0.1s linear;
  pointer-events: none;
}

.progress-bar:hover .progress-fill {
  background: var(--button-primary-bgColor-hover);
}

/* Volume Control */
.volume-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: flex-end;
}

.volume-slider-container {
  width: 100px;
  height: 4px;
  background: var(--borderColor-default);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.volume-slider {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.volume-fill {
  height: 100%;
  background: var(--fgColor-muted);
  border-radius: 2px;
  transition: width 0.1s linear;
  pointer-events: none;
}

.volume-slider-container:hover .volume-fill {
  background: var(--button-primary-bgColor-rest);
}

/* Responsive */
@media (max-width: 768px) {
  .player-container {
    grid-template-columns: 1fr 2fr;
  }

  .volume-control {
    display: none;
  }
}
</style>
