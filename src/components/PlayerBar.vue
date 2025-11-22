<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { usePlayerStore } from '../stores/player';
import { useAuthStore } from '../stores/auth';
import BaseButton from './BaseButton.vue';

const router = useRouter();
const playerStore = usePlayerStore();
const authStore = useAuthStore();

// Local volume state for immediate UI feedback
const localVolume = ref(50);
const previousVolume = ref(50);
const lastVolumeChangeTime = ref(0);
const VOLUME_SYNC_DELAY = 2000; // Ignore store updates for 2 seconds after local change

// UI state for panels
const showQueue = ref(false);
const showDevices = ref(false);

// Computed values from store
const currentTrack = computed(() => playerStore.currentlyPlaying);
const isPlaying = computed(() => playerStore.isPlaying);
const progressMs = computed(() => playerStore.progressMs);
const durationMs = computed(() => playerStore.durationMs);

// Sync local volume with store (but not immediately after local changes to prevent glitches)
watch(
  () => playerStore.volumePercent,
  (newVolume) => {
    const timeSinceLastChange = Date.now() - lastVolumeChangeTime.value;
    // Only sync if we haven't made a local change recently
    if (timeSinceLastChange > VOLUME_SYNC_DELAY) {
      localVolume.value = newVolume;
    }
  },
  { immediate: true }
);

// Computed for track info display
const trackName = computed(() => currentTrack.value?.name || 'No track playing');
const albumImage = computed(() =>
  currentTrack.value?.album.images[0]?.url || null
);

const trackId = computed(() => currentTrack.value?.id || null);

const navigateToTrack = () => {
  if (trackId.value) {
    router.push(`/track/${trackId.value}`);
  }
};

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

const handleVolumeChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = parseInt(target.value);

  // Update local state immediately for smooth UI
  localVolume.value = value;
  lastVolumeChangeTime.value = Date.now(); // Prevent polling from overwriting

  // Save previous volume for mute toggle (only if not muting)
  if (value > 0) {
    previousVolume.value = value;
  }

  try {
    await playerStore.setVolume(value);
  } catch (err) {
    console.error('Volume change failed:', err);
  }
};

const toggleMute = async () => {
  const newVolume = localVolume.value === 0 ? previousVolume.value : 0;

  // Update local state immediately
  localVolume.value = newVolume;
  lastVolumeChangeTime.value = Date.now(); // Prevent polling from overwriting

  try {
    await playerStore.setVolume(newVolume);
  } catch (err) {
    console.error('Mute toggle failed:', err);
    // Revert on error
    localVolume.value = localVolume.value === 0 ? previousVolume.value : 0;
  }
};

const handleShuffle = async () => {
  try {
    await playerStore.toggleShuffle();
  } catch (err) {
    console.error('Shuffle toggle failed:', err);
  }
};

const handleRepeat = async () => {
  try {
    await playerStore.cycleRepeat();
  } catch (err) {
    console.error('Repeat cycle failed:', err);
  }
};

const toggleQueue = async () => {
  showDevices.value = false;
  showQueue.value = !showQueue.value;
  if (showQueue.value) {
    await playerStore.fetchQueue();
  }
};

const toggleDevices = async () => {
  showQueue.value = false;
  showDevices.value = !showDevices.value;
  if (showDevices.value) {
    await playerStore.fetchDevices();
  }
};

const selectDevice = async (deviceId: string) => {
  try {
    await playerStore.transferToDevice(deviceId);
    showDevices.value = false;
  } catch (err) {
    console.error('Device transfer failed:', err);
  }
};

const playQueueTrack = async (trackId: string) => {
  try {
    await playerStore.playTrack(trackId);
    showQueue.value = false;
  } catch (err) {
    console.error('Failed to play queue track:', err);
  }
};

const getDeviceIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'computer': return 'pi pi-desktop';
    case 'smartphone': return 'pi pi-mobile';
    case 'speaker': return 'pi pi-volume-up';
    default: return 'pi pi-wifi';
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
        <div
          class="track-artwork"
          :class="{ clickable: trackId }"
          @click="navigateToTrack"
        >
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
          <div class="track-artist">
            <template v-if="currentTrack?.artists">
              <template v-for="(artist, index) in currentTrack.artists" :key="artist.id">
                <RouterLink
                  :to="`/artist/${artist.id}`"
                  class="artist-link"
                >{{ artist.name }}</RouterLink><span v-if="index < currentTrack.artists.length - 1">, </span>
              </template>
            </template>
            <template v-else>Connect to Spotify</template>
          </div>
        </div>
      </div>

      <!-- Playback Controls -->
      <div class="player-controls">
        <div class="control-buttons">
          <BaseButton
            icon="pi pi-sparkles"
            variant="text"
            :severity="playerStore.shuffleState ? 'success' : 'secondary'"
            aria-label="Shuffle"
            @click="handleShuffle"
            :disabled="!currentTrack"
            size="small"
            :class="{ active: playerStore.shuffleState }"
          />

          <BaseButton
            icon="pi pi-step-backward"
            rounded
            severity="secondary"
            aria-label="Previous"
            @click="handlePrevious"
            :disabled="!currentTrack"
          />

          <BaseButton
            :icon="isPlaying ? 'pi pi-pause-circle' : 'pi pi-play-circle'"
            @click="handlePlayPause"
            aria-label="Play/Pause"
            :disabled="!currentTrack"
            size="large"
            variant="text"
            severity="success"
            rounded
          />

          <BaseButton
            icon="pi pi-step-forward"
            rounded
            severity="secondary"
            aria-label="Next"
            @click="handleNext"
            :disabled="!currentTrack"
          />

          <div class="repeat-button-wrapper">
            <BaseButton
              icon="pi pi-refresh"
              variant="text"
              :severity="playerStore.repeatState !== 'off' ? 'success' : 'secondary'"
              aria-label="Repeat"
              @click="handleRepeat"
              :disabled="!currentTrack"
              size="small"
              :class="{ active: playerStore.repeatState !== 'off' }"
            />
            <span v-if="playerStore.repeatState === 'track'" class="repeat-badge">1</span>
          </div>
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

      <!-- Right Controls -->
      <div class="right-controls">
        <BaseButton
          icon="pi pi-list"
          variant="text"
          :severity="showQueue ? 'success' : 'secondary'"
          size="small"
          aria-label="Queue"
          :disabled="!currentTrack"
          @click="toggleQueue"
        />
        <BaseButton
          :icon="getDeviceIcon(playerStore.currentDevice?.type || '')"
          variant="text"
          :severity="showDevices ? 'success' : 'secondary'"
          size="small"
          aria-label="Devices"
          @click="toggleDevices"
        />
        <div class="volume-control">
          <BaseButton
            :icon="localVolume === 0 ? 'pi pi-volume-off' : localVolume < 50 ? 'pi pi-volume-down' : 'pi pi-volume-up'"
            variant="text"
            severity="secondary"
            size="small"
            aria-label="Volume"
            :disabled="!currentTrack"
            @click="toggleMute"
          />
          <div class="volume-slider-container">
            <input
              type="range"
              min="0"
              max="100"
              :value="localVolume"
              @input="handleVolumeChange"
              class="volume-slider"
              :disabled="!currentTrack"
            />
            <div
              class="volume-fill"
              :style="{ width: `${localVolume}%` }"
            ></div>
          </div>
        </div>

        <!-- Queue Panel -->
        <div v-if="showQueue" class="panel queue-panel">
          <div class="panel-header">
            <h4>Queue</h4>
            <BaseButton
              icon="pi pi-times"
              variant="text"
              severity="secondary"
              size="small"
              @click="showQueue = false"
            />
          </div>
          <div class="panel-content">
            <div v-if="playerStore.queue.length === 0" class="empty-panel">
              <p>Queue is empty</p>
            </div>
            <div v-else class="queue-list">
              <div
                v-for="(track, index) in playerStore.queue.slice(0, 10)"
                :key="track.id + index"
                class="queue-item"
                @click="playQueueTrack(track.id)"
              >
                <img
                  v-if="track.album.images[0]"
                  :src="track.album.images[track.album.images.length - 1]?.url"
                  :alt="track.name"
                  class="queue-image"
                />
                <div class="queue-info">
                  <div class="queue-name">{{ track.name }}</div>
                  <div class="queue-artist">{{ track.artists.map(a => a.name).join(', ') }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Devices Panel -->
        <div v-if="showDevices" class="panel devices-panel">
          <div class="panel-header">
            <h4>Devices</h4>
            <BaseButton
              icon="pi pi-times"
              variant="text"
              severity="secondary"
              size="small"
              @click="showDevices = false"
            />
          </div>
          <div class="panel-content">
            <div v-if="playerStore.devices.length === 0" class="empty-panel">
              <p>No devices found</p>
            </div>
            <div v-else class="device-list">
              <div
                v-for="device in playerStore.devices"
                :key="device.id"
                class="device-item"
                :class="{ active: device.is_active }"
                @click="selectDevice(device.id)"
              >
                <i :class="getDeviceIcon(device.type)"></i>
                <div class="device-info">
                  <div class="device-name">{{ device.name }}</div>
                  <div v-if="device.is_active" class="device-active">Currently playing</div>
                </div>
              </div>
            </div>
          </div>
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
  background: var(--bgColor-default);
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.track-artwork.clickable {
  cursor: pointer;
}

.track-artwork.clickable:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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

.artist-link {
  color: var(--fgColor-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.artist-link:hover {
  color: var(--color-ansi-green-bright);
  text-decoration: underline;
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

.repeat-button-wrapper {
  position: relative;
  display: inline-flex;
}

.repeat-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  background: var(--color-ansi-green-bright);
  color: var(--bgColor-default);
  font-size: 9px;
  font-weight: 600;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
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
  background: var(--color-ansi-green-bright);
  border-radius: 2px;
  transition: width 0.1s linear;
  pointer-events: none;
}

.progress-bar:hover .progress-fill {
  background: var(--button-primary-bgColor-hover);
}

/* Right Controls */
.right-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
  position: relative;
}

/* Volume Control */
.volume-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  background: var(--color-ansi-green-bright);
  border-radius: 2px;
  transition: width 0.1s linear;
  pointer-events: none;
}

.volume-slider-container:hover .volume-fill {
  background: var(--button-primary-bgColor-hover);
}

/* Panels */
.panel {
  position: absolute;
  bottom: 100%;
  right: 0;
  width: 300px;
  max-height: 400px;
  background: var(--bgColor-default);
  border: 1px solid var(--borderColor-default);
  border-radius: 8px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--borderColor-default);
}

.panel-header h4 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--fgColor-default);
}

.panel-content {
  max-height: 300px;
  overflow-y: auto;
}

.empty-panel {
  padding: 2rem;
  text-align: center;
  color: var(--fgColor-muted);
}

.empty-panel p {
  margin: 0;
  font-size: 0.85rem;
}

/* Queue styles */
.queue-list {
  padding: 0.5rem;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.queue-item:hover {
  background: var(--bgColor-muted);
}

.queue-item:active {
  background: rgb(from var(--color-ansi-green-bright) r g b / 0.1);
}

.queue-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}

.queue-info {
  flex: 1;
  min-width: 0;
}

.queue-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--fgColor-default);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-artist {
  font-size: 0.75rem;
  color: var(--fgColor-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Device styles */
.device-list {
  padding: 0.5rem;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}

.device-item:hover {
  background: var(--bgColor-muted);
}

.device-item.active {
  background: rgb(from var(--color-ansi-green-bright) r g b / 0.1);
}

.device-item i {
  font-size: 1.25rem;
  color: var(--fgColor-muted);
}

.device-item.active i {
  color: var(--color-ansi-green-bright);
}

.device-info {
  flex: 1;
}

.device-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--fgColor-default);
}

.device-active {
  font-size: 0.75rem;
  color: var(--color-ansi-green-bright);
}

/* Responsive */
@media (max-width: 768px) {
  .player-bar {
    height: 70px;
  }

  .player-container {
    grid-template-columns: 1fr auto 1fr;
    gap: 0.5rem;
    padding: 0 0.75rem;
  }

  .track-info {
    gap: 0.5rem;
  }

  .track-artwork {
    width: 44px;
    height: 44px;
  }

  .track-name {
    font-size: 0.8rem;
  }

  .track-artist {
    font-size: 0.7rem;
  }

  .player-controls {
    gap: 0.25rem;
  }

  .control-buttons {
    gap: 0.25rem;
  }

  .control-buttons .base-button:first-child,
  .control-buttons .repeat-button-wrapper {
    display: none;
  }

  .progress-container {
    display: none;
  }

  .right-controls {
    justify-content: flex-end;
  }

  .volume-slider-container {
    display: none;
  }

  .panel {
    position: fixed;
    left: 0.5rem;
    right: 0.5rem;
    width: auto;
    bottom: 80px;
  }
}

@media (max-width: 480px) {
  .player-container {
    padding: 0 0.5rem;
  }

  .track-details {
    max-width: 80px;
  }

  .right-controls .base-button:nth-child(1),
  .right-controls .base-button:nth-child(2) {
    display: none;
  }
}
</style>
