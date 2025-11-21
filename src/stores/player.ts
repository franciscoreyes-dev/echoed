/**
 * Player Store
 * Manages playback state, recently played tracks, and currently playing
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { spotifyClient } from '../services/spotify';
import type { SpotifyPlaybackState, SpotifyTrack } from '../types/spotify';
import { apiCache } from '../utils/cache';

export interface Track {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
}

export interface RecentlyPlayedItem {
  track: Track;
  played_at: string;
  context: {
    type: string;
    href: string;
  } | null;
}

export const usePlayerStore = defineStore('player', () => {
  // State
  const recentlyPlayed = ref<RecentlyPlayedItem[]>([]);
  const currentlyPlaying = ref<SpotifyTrack | null>(null);
  const isPlaying = ref(false);
  const progressMs = ref(0);
  const durationMs = ref(0);
  const volumePercent = ref(50);
  const deviceId = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Polling
  let pollingInterval: ReturnType<typeof setInterval> | null = null;
  const POLLING_INTERVAL = 500; // 1 second

  // Computed
  const hasActivePlayback = computed(() => currentlyPlaying.value !== null);

  /**
   * Fetch recently played tracks
   */
  const fetchRecentlyPlayed = async (limit: number = 20): Promise<void> => {
    const cacheKey = `recently-played-${limit}`;
    const cached = apiCache.get<RecentlyPlayedItem[]>(cacheKey);

    if (cached) {
      recentlyPlayed.value = cached;
      return;
    }

    // Only show loading on initial load
    const isInitialLoad = recentlyPlayed.value.length === 0;
    if (isInitialLoad) {
      isLoading.value = true;
    }
    error.value = null;

    try {
      const response = await spotifyClient.getRecentlyPlayed(limit);
      recentlyPlayed.value = response.data.items;
      apiCache.set(cacheKey, response.data.items, 10000); // Cache for 10 seconds
    } catch (err) {
      console.error('Failed to fetch recently played tracks:', err);
      error.value = err instanceof Error ? err.message : 'Failed to fetch recently played tracks';
      throw err;
    } finally {
      if (isInitialLoad) {
        isLoading.value = false;
      }
    }
  };

  /**
   * Fetch current playback state
   */
  const fetchPlaybackState = async (): Promise<void> => {
    try {
      const response = await spotifyClient.getCurrentPlayback();
      const playbackState = response.data as SpotifyPlaybackState;

      if (playbackState && playbackState.item) {
        currentlyPlaying.value = playbackState.item;
        isPlaying.value = playbackState.is_playing;
        progressMs.value = playbackState.progress_ms || 0;
        durationMs.value = playbackState.item.duration_ms;
        volumePercent.value = playbackState.device?.volume_percent || 50;
        deviceId.value = playbackState.device?.id || null;
      } else {
        // No active playback
        currentlyPlaying.value = null;
        isPlaying.value = false;
        progressMs.value = 0;
        durationMs.value = 0;
      }
    } catch (err) {
      // Silently handle errors (user might not be playing anything)
      if (!axios.isAxiosError(err) || err.response?.status !== 204) {
        console.error('Failed to fetch playback state:', err);
      }
      currentlyPlaying.value = null;
      isPlaying.value = false;
    }
  };

  /**
   * Start polling for playback state
   */
  const startPolling = (): void => {
    if (pollingInterval) return; // Already polling

    // Fetch immediately
    fetchPlaybackState();

    // Then poll every 3 seconds
    pollingInterval = setInterval(() => {
      fetchPlaybackState();
    }, POLLING_INTERVAL);
  };

  /**
   * Stop polling for playback state
   */
  const stopPolling = (): void => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };

  /**
   * Play/Resume playback
   */
  const play = async (): Promise<void> => {
    try {
      await spotifyClient.play();
      isPlaying.value = true;
      // Immediately fetch updated state
      await fetchPlaybackState();
    } catch (err) {
      console.error('Failed to play:', err);
      error.value = 'Failed to play track';
      throw err;
    }
  };

  /**
   * Play a specific track by ID
   */
  const playTrack = async (trackId: string): Promise<void> => {
    try {
      const trackUri = `spotify:track:${trackId}`;
      await spotifyClient.playTrack(trackUri);
      isPlaying.value = true;
      // Wait a bit for Spotify to update, then fetch
      setTimeout(() => fetchPlaybackState(), 300);
    } catch (err) {
      console.error('Failed to play track:', err);
      error.value = 'Failed to play track';
      throw err;
    }
  };

  /**
   * Play a playlist by ID
   */
  const playPlaylist = async (playlistId: string): Promise<void> => {
    try {
      const contextUri = `spotify:playlist:${playlistId}`;
      await spotifyClient.playContext(contextUri);
      isPlaying.value = true;
      // Wait a bit for Spotify to update, then fetch
      setTimeout(() => fetchPlaybackState(), 300);
    } catch (err) {
      console.error('Failed to play playlist:', err);
      error.value = 'Failed to play playlist';
      throw err;
    }
  };

  /**
   * Pause playback
   */
  const pause = async (): Promise<void> => {
    try {
      await spotifyClient.pause();
      isPlaying.value = false;
      // Immediately fetch updated state
      await fetchPlaybackState();
    } catch (err) {
      console.error('Failed to pause:', err);
      error.value = 'Failed to pause playback';
      throw err;
    }
  };

  /**
   * Skip to next track
   */
  const skipToNext = async (): Promise<void> => {
    try {
      await spotifyClient.skipToNext();
      // Wait a bit for Spotify to update, then fetch
      setTimeout(() => fetchPlaybackState(), 300);
    } catch (err) {
      console.error('Failed to skip to next:', err);
      error.value = 'Failed to skip track';
      throw err;
    }
  };

  /**
   * Skip to previous track
   */
  const skipToPrevious = async (): Promise<void> => {
    try {
      await spotifyClient.skipToPrevious();
      // Wait a bit for Spotify to update, then fetch
      setTimeout(() => fetchPlaybackState(), 300);
    } catch (err) {
      console.error('Failed to skip to previous:', err);
      error.value = 'Failed to go back';
      throw err;
    }
  };

  /**
   * Seek to position in track
   */
  const seek = async (positionMs: number): Promise<void> => {
    try {
      await spotifyClient.seek(positionMs);
      progressMs.value = positionMs;
    } catch (err) {
      console.error('Failed to seek:', err);
      error.value = 'Failed to seek';
      throw err;
    }
  };

  /**
   * Set playback volume
   */
  const setVolume = async (volume: number): Promise<void> => {
    try {
      const clampedVolume = Math.max(0, Math.min(100, volume));
      await spotifyClient.setVolume(clampedVolume);
      volumePercent.value = clampedVolume;
    } catch (err) {
      console.error('Failed to set volume:', err);
      error.value = 'Failed to adjust volume';
      throw err;
    }
  };

  /**
   * Toggle play/pause
   */
  const togglePlayPause = async (): Promise<void> => {
    if (isPlaying.value) {
      await pause();
    } else {
      await play();
    }
  };

  /**
   * Format duration from milliseconds to MM:SS
   */
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Format date to readable string
   */
  const formatPlayedAt = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  return {
    // State
    recentlyPlayed,
    currentlyPlaying,
    isPlaying,
    progressMs,
    durationMs,
    volumePercent,
    deviceId,
    isLoading,
    error,

    // Computed
    hasActivePlayback,

    // Actions
    fetchRecentlyPlayed,
    fetchPlaybackState,
    startPolling,
    stopPolling,
    play,
    playTrack,
    playPlaylist,
    pause,
    skipToNext,
    skipToPrevious,
    seek,
    setVolume,
    togglePlayPause,
    formatDuration,
    formatPlayedAt,
  };
});
