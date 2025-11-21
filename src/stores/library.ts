/**
 * Library Store
 * Manages user's library data: top artists, top tracks, saved tracks
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { spotifyClient } from '../services/spotify';
import { apiCache } from '../utils/cache';

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

export interface Playlist {
  id: string;
  name: string;
  description: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  owner: {
    id: string;
    display_name: string;
  };
  tracks: {
    total: number;
  };
  public: boolean;
  external_urls: {
    spotify: string;
  };
}

export interface SavedTrack {
  added_at: string;
  track: {
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
  };
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export const useLibraryStore = defineStore('library', () => {
  // State
  const topArtists = ref<Artist[]>([]);
  const topTracks = ref<TopTrack[]>([]);
  const playlists = ref<Playlist[]>([]);
  const savedTracks = ref<SavedTrack[]>([]);
  const savedTracksTotal = ref(0);
  const currentTimeRange = ref<TimeRange>('medium_term');
  const isLoading = ref(false);
  const isPlaylistsLoading = ref(false);
  const isSavedTracksLoading = ref(false);
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
    const cacheKey = `top-artists-${timeRange}-${limit}`;
    const cached = apiCache.get<Artist[]>(cacheKey);

    if (cached) {
      topArtists.value = cached;
      currentTimeRange.value = timeRange;
      return;
    }

    // Only show loading on initial load
    const isInitialLoad = topArtists.value.length === 0;
    if (isInitialLoad) {
      isLoading.value = true;
    }
    error.value = null;

    try {
      const response = await spotifyClient.getTopArtists(timeRange, limit);
      topArtists.value = response.data.items;
      currentTimeRange.value = timeRange;
      apiCache.set(cacheKey, response.data.items, 60000); // Cache for 1 minute
    } catch (err) {
      console.error('Failed to fetch top artists:', err);
      error.value = err instanceof Error ? err.message : 'Failed to fetch top artists';
      throw err;
    } finally {
      if (isInitialLoad) {
        isLoading.value = false;
      }
    }
  };

  /**
   * Fetch top tracks
   */
  const fetchTopTracks = async (
    timeRange: TimeRange = 'medium_term',
    limit: number = 20
  ): Promise<void> => {
    const cacheKey = `top-tracks-${timeRange}-${limit}`;
    const cached = apiCache.get<TopTrack[]>(cacheKey);

    if (cached) {
      topTracks.value = cached;
      currentTimeRange.value = timeRange;
      return;
    }

    // Only show loading on initial load
    const isInitialLoad = topTracks.value.length === 0;
    if (isInitialLoad) {
      isLoading.value = true;
    }
    error.value = null;

    try {
      const response = await spotifyClient.getTopTracks(timeRange, limit);
      topTracks.value = response.data.items;
      currentTimeRange.value = timeRange;
      apiCache.set(cacheKey, response.data.items, 60000); // Cache for 1 minute
    } catch (err) {
      console.error('Failed to fetch top tracks:', err);
      error.value = err instanceof Error ? err.message : 'Failed to fetch top tracks';
      throw err;
    } finally {
      if (isInitialLoad) {
        isLoading.value = false;
      }
    }
  };

  /**
   * Fetch user playlists
   */
  const fetchPlaylists = async (limit: number = 50): Promise<void> => {
    const cacheKey = `playlists-${limit}`;
    const cached = apiCache.get<Playlist[]>(cacheKey);

    if (cached) {
      playlists.value = cached;
      return;
    }

    const isInitialLoad = playlists.value.length === 0;
    if (isInitialLoad) {
      isPlaylistsLoading.value = true;
    }
    error.value = null;

    try {
      const response = await spotifyClient.getUserPlaylists(limit);
      playlists.value = response.data.items;
      apiCache.set(cacheKey, response.data.items, 60000);
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
      error.value = err instanceof Error ? err.message : 'Failed to fetch playlists';
      throw err;
    } finally {
      if (isInitialLoad) {
        isPlaylistsLoading.value = false;
      }
    }
  };

  /**
   * Fetch saved/liked tracks
   */
  const fetchSavedTracks = async (limit: number = 50): Promise<void> => {
    const cacheKey = `saved-tracks-${limit}`;
    const cached = apiCache.get<{ items: SavedTrack[]; total: number }>(cacheKey);

    if (cached) {
      savedTracks.value = cached.items;
      savedTracksTotal.value = cached.total;
      return;
    }

    const isInitialLoad = savedTracks.value.length === 0;
    if (isInitialLoad) {
      isSavedTracksLoading.value = true;
    }
    error.value = null;

    try {
      const response = await spotifyClient.getSavedTracks(limit);
      savedTracks.value = response.data.items;
      savedTracksTotal.value = response.data.total;
      apiCache.set(cacheKey, { items: response.data.items, total: response.data.total }, 60000);
    } catch (err) {
      console.error('Failed to fetch saved tracks:', err);
      error.value = err instanceof Error ? err.message : 'Failed to fetch saved tracks';
      throw err;
    } finally {
      if (isInitialLoad) {
        isSavedTracksLoading.value = false;
      }
    }
  };

  /**
   * Create a new playlist
   */
  const createPlaylist = async (userId: string, name: string, description = ''): Promise<Playlist> => {
    try {
      const response = await spotifyClient.createPlaylist(userId, name, description);
      // Refresh playlists after creation
      await fetchPlaylists();
      return response.data;
    } catch (err) {
      console.error('Failed to create playlist:', err);
      error.value = err instanceof Error ? err.message : 'Failed to create playlist';
      throw err;
    }
  };

  /**
   * Delete (unfollow) a playlist
   */
  const deletePlaylist = async (playlistId: string): Promise<void> => {
    try {
      await spotifyClient.unfollowPlaylist(playlistId);
      // Remove from local state
      playlists.value = playlists.value.filter(p => p.id !== playlistId);
    } catch (err) {
      console.error('Failed to delete playlist:', err);
      error.value = err instanceof Error ? err.message : 'Failed to delete playlist';
      throw err;
    }
  };

  /**
   * Fetch all library data
   */
  const fetchAllLibraryData = async (timeRange: TimeRange = 'medium_term'): Promise<void> => {
    await Promise.all([
      fetchTopArtists(timeRange, 20),
      fetchTopTracks(timeRange, 20),
      fetchPlaylists(),
      fetchSavedTracks()
    ]);
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
    playlists,
    savedTracks,
    savedTracksTotal,
    currentTimeRange,
    isLoading,
    isPlaylistsLoading,
    isSavedTracksLoading,
    error,

    // Getters
    totalUniqueGenres,
    topGenres,
    averagePopularity,

    // Actions
    fetchTopArtists,
    fetchTopTracks,
    fetchPlaylists,
    fetchSavedTracks,
    createPlaylist,
    deletePlaylist,
    fetchAllLibraryData,
    formatFollowers,
  };
});
