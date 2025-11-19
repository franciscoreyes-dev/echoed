/**
 * Player Store
 * Manages playback state, recently played tracks, and currently playing
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { spotifyClient } from '../services/spotify';

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
  const currentlyPlaying = ref<Track | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Fetch recently played tracks
   */
  const fetchRecentlyPlayed = async (limit: number = 20): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await spotifyClient.getRecentlyPlayed(limit);
      recentlyPlayed.value = response.data.items;
    } catch (err) {
      console.error('Failed to fetch recently played tracks:', err);
      error.value = err instanceof Error ? err.message : 'Failed to fetch recently played tracks';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch currently playing track
   */
  const fetchCurrentlyPlaying = async (): Promise<void> => {
    try {
      const response = await spotifyClient.getCurrentlyPlaying();
      if (response.data && response.data.item) {
        currentlyPlaying.value = response.data.item;
      } else {
        currentlyPlaying.value = null;
      }
    } catch (err) {
      console.error('Failed to fetch currently playing track:', err);
      currentlyPlaying.value = null;
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
    isLoading,
    error,

    // Actions
    fetchRecentlyPlayed,
    fetchCurrentlyPlaying,
    formatDuration,
    formatPlayedAt,
  };
});
