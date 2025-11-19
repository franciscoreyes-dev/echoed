<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue';
import { usePlayerStore } from '../stores/player';
import { useAuthStore } from '../stores/auth';
import BaseButton from './BaseButton.vue';

const playerStore = usePlayerStore();
const authStore = useAuthStore();

// Computed values from store
const currentTrack = computed(() => playerStore.currentlyPlaying);
const isPlaying = computed(() => playerStore.isPlaying);
const progressMs = computed(() => playerStore.progressMs);
const durationMs = computed(() => playerStore.durationMs);
const volumePercent = computed({
  get: () => playerStore.volumePercent,
  set: (value: number) => handleVolumeChange(value),
});

// Computed for track info display
const trackName = computed(() => currentTrack.value?.name || 'No track playing');
const artistNames = computed(() =>
  currentTrack.value?.artists.map(a => a.name).join(', ') || 'Connect to Spotify'
);
const albumImage = computed(() =>
  currentTrack.value?.album.images[0]?.url || null
);

// Computed for progress bar
const progressPercent = computed(() =>
  durationMs.value > 0 ? (progressMs.value / durationMs.value) * 100 : 0
);

// Format time in MM:SS
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Playback controls
const handlePlayPause = async () => {
  try {
    await playerStore.togglePlayPause();
  } catch (err) {
    console.error('Playback control failed:', err);
  }
};

const handleNext = async () => {
  try {
    await playerStore.skipToNext();
  } catch (err) {
    console.error('Skip next failed:', err);
  }
};

const handlePrevious = async () => {
  try {
    await playerStore.skipToPrevious();
  } catch (err) {
    console.error('Skip previous failed:', err);
  }
};

const handleSeek = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const newPositionMs = parseInt(target.value);
  try {
    await playerStore.seek(newPositionMs);
  } catch (err) {
    console.error('Seek failed:', err);
  }
};

const handleVolumeChange = async (value: number) => {
  try {
    await playerStore.setVolume(value);
  } catch (err) {
    console.error('Volume change failed:', err);
  }
};

// Watch auth state and start/stop polling
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      playerStore.startPolling();
    } else {
      playerStore.stopPolling();
    }
  },
  { immediate: true }
);

// Start polling on mount if authenticated
onMounted(() => {
  if (authStore.isAuthenticated) {
    playerStore.startPolling();
  }
});

// Stop polling on unmount
onUnmounted(() => {
  playerStore.stopPolling();
});
</script>

<template>
  <footer class="player-bar">
    <div class="player-container">
      <!-- Track Info -->
      <div class="track-info">
        <div class="track-artwork">
          <img
            v-if="albumImage"
            :src="albumImage"
            :alt="trackName"
            class="artwork-image"
          />
          <div v-else class="artwork-placeholder">♪</div>
        </div>
        <div class="track-details">
          <div class="track-name">{{ trackName }}</div>
          <div class="track-artist">{{ artistNames }}</div>
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
            @click="handlePrevious"
            :disabled="!currentTrack"
          />

          <BaseButton
            :icon="isPlaying ? 'pi pi-pause' : 'pi pi-play'"
            rounded
            severity="primary"
            @click="handlePlayPause"
            aria-label="Play/Pause"
            :disabled="!currentTrack"
          />

          <BaseButton
            icon="pi pi-step-forward"
            variant="text"
            rounded
            severity="secondary"
            aria-label="Next"
            @click="handleNext"
            :disabled="!currentTrack"
          />
        </div>

        <!-- Progress Bar -->
        <div class="progress-container">
          <span class="time-label">{{ formatTime(progressMs) }}</span>
          <div class="progress-bar">
            <input
              type="range"
              min="0"
              :max="durationMs"
              :value="progressMs"
              @input="handleSeek"
              class="progress-slider"
              :disabled="!currentTrack"
            />
            <div
              class="progress-fill"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
          <span class="time-label">{{ formatTime(durationMs) }}</span>
        </div>
      </div>

      <!-- Volume Control -->
      <div class="volume-control">
        <BaseButton
          :icon="volumePercent === 0 ? 'pi pi-volume-off' : volumePercent < 50 ? 'pi pi-volume-down' : 'pi pi-volume-up'"
          variant="text"
          severity="secondary"
          size="small"
          aria-label="Volume"
          :disabled="!currentTrack"
        />
        <div class="volume-slider-container">
          <input
            type="range"
            min="0"
            max="100"
            v-model="volumePercent"
            class="volume-slider"
            :disabled="!currentTrack"
          />
          <div
            class="volume-fill"
            :style="{ width: `${volumePercent}%` }"
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

.artwork-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.progress-slider:disabled {
  cursor: not-allowed;
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

.volume-slider:disabled {
  cursor: not-allowed;
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
