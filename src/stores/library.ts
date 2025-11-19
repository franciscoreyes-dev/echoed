/**
 * Library Store
 * Manages user's library data: top artists, top tracks, saved tracks
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { spotifyClient } from '../services/spotify';

export interface Artist {
  id: string;
  name: string;
  genres: string[];
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  followers: {
    total: number;
  };
  popularity: number;
  external_urls: {
    spotify: string;
  };
}

export interface TopTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  popularity: number;
  duration_ms: number;
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export const useLibraryStore = defineStore('library', () => {
  // State
  const topArtists = ref<Artist[]>([]);
  const topTracks = ref<TopTrack[]>([]);
  const currentTimeRange = ref<TimeRange>('medium_term');
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const totalUniqueGenres = computed(() => {
    const genres = new Set<string>();
    topArtists.value.forEach((artist) => {
      artist.genres.forEach((genre) => genres.add(genre));
    });
    return genres.size;
  });

  const topGenres = computed(() => {
    const genreCount = new Map<string, number>();
    topArtists.value.forEach((artist) => {
      artist.genres.forEach((genre) => {
        genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
      });
    });

    return Array.from(genreCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);
  });

  const averagePopularity = computed(() => {
    if (topTracks.value.length === 0) return 0;
    const sum = topTracks.value.reduce((acc, track) => acc + track.popularity, 0);
    return Math.round(sum / topTracks.value.length);
  });

  /**
   * Fetch top artists
   */
  const fetchTopArtists = async (
    timeRange: TimeRange = 'medium_term',
    limit: number = 20
  ): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await spotifyClient.getTopArtists(timeRange, limit);
      topArtists.value = response.data.items;
      currentTimeRange.value = timeRange;
    } catch (err) {
      console.error('Failed to fetch top artists:', err);
      error.value = err instanceof Error ? err.message : 'Failed to fetch top artists';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch top tracks
   */
  const fetchTopTracks = async (
    timeRange: TimeRange = 'medium_term',
    limit: number = 20
  ): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await spotifyClient.getTopTracks(timeRange, limit);
      topTracks.value = response.data.items;
      currentTimeRange.value = timeRange;
    } catch (err) {
      console.error('Failed to fetch top tracks:', err);
      error.value = err instanceof Error ? err.message : 'Failed to fetch top tracks';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch all library data
   */
  const fetchAllLibraryData = async (timeRange: TimeRange = 'medium_term'): Promise<void> => {
    await Promise.all([fetchTopArtists(timeRange, 20), fetchTopTracks(timeRange, 20)]);
  };

  /**
   * Format follower count
   */
  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return {
    // State
    topArtists,
    topTracks,
    currentTimeRange,
    isLoading,
    error,

    // Getters
    totalUniqueGenres,
    topGenres,
    averagePopularity,

    // Actions
    fetchTopArtists,
    fetchTopTracks,
    fetchAllLibraryData,
    formatFollowers,
  };
});
