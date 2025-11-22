/**
 * Spotify API Client
 * Axios instance configured with automatic token refresh and error handling
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { SPOTIFY_CONFIG } from '../config/spotify';
import { useAuthStore } from '../stores/auth';

/**
 * Create Axios instance for Spotify API
 */
const createSpotifyClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: SPOTIFY_CONFIG.endpoints.api,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Request Interceptor
   * Automatically adds Authorization header with valid access token
   */
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const authStore = useAuthStore();

      try {
        // Get valid access token (will refresh if needed)
        const token = await authStore.getValidAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Failed to get access token:', error);
        // Redirect to login if not authenticated
        authStore.logout();
        window.location.href = '/';
        return Promise.reject(error);
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  /**
   * Response Interceptor
   * Handles errors and automatic token refresh on 401
   */
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If 401 Unauthorized and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const authStore = useAuthStore();

        try {
          // Try to refresh the token
          await authStore.refreshAccessToken();

          // Retry the original request with new token
          const token = await authStore.getValidAccessToken();
          originalRequest.headers.Authorization = `Bearer ${token}`;

          return client(originalRequest);
        } catch (refreshError) {
          // If refresh fails, logout and redirect to home
          console.error('Token refresh failed, logging out:', refreshError);
          authStore.logout();
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
      }

      // Handle rate limiting (429)
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Export singleton instance
export const spotifyApi = createSpotifyClient();

/**
 * Spotify API Helper Methods
 */
export const spotifyClient = {
  /**
   * Get current user's profile
   */
  getCurrentUser: () => spotifyApi.get('/me'),

  /**
   * Get user's playlists
   */
  getUserPlaylists: (limit = 20, offset = 0) =>
    spotifyApi.get('/me/playlists', { params: { limit, offset } }),

  /**
   * Get user's saved tracks
   */
  getSavedTracks: (limit = 20, offset = 0) =>
    spotifyApi.get('/me/tracks', { params: { limit, offset } }),

  /**
   * Get user's saved tracks count (total only)
   */
  getSavedTracksCount: () =>
    spotifyApi.get('/me/tracks', { params: { limit: 1 } }),

  /**
   * Check if tracks are saved in user's library
   */
  checkSavedTracks: (trackIds: string[]) =>
    spotifyApi.get('/me/tracks/contains', { params: { ids: trackIds.join(',') } }),

  /**
   * Save tracks to user's library
   */
  saveTracks: (trackIds: string[]) =>
    spotifyApi.put('/me/tracks', { ids: trackIds }),

  /**
   * Remove tracks from user's library
   */
  removeSavedTracks: (trackIds: string[]) =>
    spotifyApi.delete('/me/tracks', { data: { ids: trackIds } }),

  /**
   * Add tracks to a playlist
   */
  addTracksToPlaylist: (playlistId: string, trackUris: string[]) =>
    spotifyApi.post(`/playlists/${playlistId}/tracks`, { uris: trackUris }),

  /**
   * Remove tracks from a playlist
   */
  removeTracksFromPlaylist: (playlistId: string, trackUris: string[]) =>
    spotifyApi.delete(`/playlists/${playlistId}/tracks`, {
      data: { tracks: trackUris.map(uri => ({ uri })) }
    }),

  /**
   * Get user's playlists count (total only)
   */
  getPlaylistsCount: () =>
    spotifyApi.get('/me/playlists', { params: { limit: 1 } }),

  /**
   * Get user's top artists
   */
  getTopArtists: (timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 20) =>
    spotifyApi.get('/me/top/artists', { params: { time_range: timeRange, limit } }),

  /**
   * Get user's top tracks
   */
  getTopTracks: (timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 20) =>
    spotifyApi.get('/me/top/tracks', { params: { time_range: timeRange, limit } }),

  /**
   * Get recently played tracks
   */
  getRecentlyPlayed: (limit = 20) =>
    spotifyApi.get('/me/player/recently-played', { params: { limit } }),

  /**
   * Get current playback state
   */
  getCurrentPlayback: () => spotifyApi.get('/me/player'),

  /**
   * Get currently playing track
   */
  getCurrentlyPlaying: () => spotifyApi.get('/me/player/currently-playing'),

  /**
   * Play/Resume playback
   */
  play: (deviceId?: string) =>
    spotifyApi.put('/me/player/play', {}, { params: deviceId ? { device_id: deviceId } : {} }),

  /**
   * Play a specific track by URI
   */
  playTrack: (trackUri: string, deviceId?: string) =>
    spotifyApi.put(
      '/me/player/play',
      { uris: [trackUri] },
      { params: deviceId ? { device_id: deviceId } : {} }
    ),

  /**
   * Play a context (playlist, album, artist)
   */
  playContext: (contextUri: string, deviceId?: string) =>
    spotifyApi.put(
      '/me/player/play',
      { context_uri: contextUri },
      { params: deviceId ? { device_id: deviceId } : {} }
    ),

  /**
   * Reorder tracks in a playlist
   */
  reorderPlaylistTracks: (playlistId: string, rangeStart: number, insertBefore: number, rangeLength = 1) =>
    spotifyApi.put(`/playlists/${playlistId}/tracks`, {
      range_start: rangeStart,
      insert_before: insertBefore,
      range_length: rangeLength
    }),

  /**
   * Pause playback
   */
  pause: () => spotifyApi.put('/me/player/pause'),

  /**
   * Skip to next track
   */
  skipToNext: () => spotifyApi.post('/me/player/next'),

  /**
   * Skip to previous track
   */
  skipToPrevious: () => spotifyApi.post('/me/player/previous'),

  /**
   * Seek to position in currently playing track
   */
  seek: (positionMs: number) =>
    spotifyApi.put('/me/player/seek', {}, { params: { position_ms: positionMs } }),

  /**
   * Set volume
   */
  setVolume: (volumePercent: number) =>
    spotifyApi.put('/me/player/volume', {}, { params: { volume_percent: volumePercent } }),

  /**
   * Set shuffle mode
   */
  setShuffle: (state: boolean) =>
    spotifyApi.put('/me/player/shuffle', {}, { params: { state } }),

  /**
   * Set repeat mode (track, context, off)
   */
  setRepeat: (state: 'track' | 'context' | 'off') =>
    spotifyApi.put('/me/player/repeat', {}, { params: { state } }),

  /**
   * Get user's queue
   */
  getQueue: () => spotifyApi.get('/me/player/queue'),

  /**
   * Add item to queue
   */
  addToQueue: (uri: string) =>
    spotifyApi.post('/me/player/queue', {}, { params: { uri } }),

  /**
   * Get available devices
   */
  getDevices: () => spotifyApi.get('/me/player/devices'),

  /**
   * Transfer playback to a device
   */
  transferPlayback: (deviceId: string, play = false) =>
    spotifyApi.put('/me/player', { device_ids: [deviceId], play }),

  /**
   * Get a playlist
   */
  getPlaylist: (playlistId: string) => spotifyApi.get(`/playlists/${playlistId}`),

  /**
   * Create a new playlist
   */
  createPlaylist: (userId: string, name: string, description = '', isPublic = true) =>
    spotifyApi.post(`/users/${userId}/playlists`, {
      name,
      description,
      public: isPublic
    }),

  /**
   * Unfollow (delete) a playlist
   */
  unfollowPlaylist: (playlistId: string) =>
    spotifyApi.delete(`/playlists/${playlistId}/followers`),

  /**
   * Upload custom playlist cover image
   * Image must be Base64 encoded JPEG, max 256KB
   */
  uploadPlaylistCover: (playlistId: string, base64Image: string) =>
    spotifyApi.put(`/playlists/${playlistId}/images`, base64Image, {
      headers: { 'Content-Type': 'image/jpeg' }
    }),

  /**
   * Get playlist tracks
   */
  getPlaylistTracks: (playlistId: string, limit = 100, offset = 0) =>
    spotifyApi.get(`/playlists/${playlistId}/tracks`, { params: { limit, offset } }),

  /**
   * Search for items
   */
  search: (query: string, types: string[] = ['track', 'artist', 'album'], limit = 20) =>
    spotifyApi.get('/search', {
      params: {
        q: query,
        type: types.join(','),
        limit,
      },
    }),

  /**
   * Get a track by ID
   */
  getTrack: (trackId: string) => spotifyApi.get(`/tracks/${trackId}`),

  /**
   * Get track audio features
   */
  getAudioFeatures: (trackId: string) => spotifyApi.get(`/audio-features/${trackId}`),

  /**
   * Get multiple tracks' audio features
   */
  getAudioFeaturesForTracks: (trackIds: string[]) =>
    spotifyApi.get('/audio-features', { params: { ids: trackIds.join(',') } }),

  /**
   * Get an artist by ID
   */
  getArtist: (artistId: string) => spotifyApi.get(`/artists/${artistId}`),

  /**
   * Get artist's top tracks
   */
  getArtistTopTracks: (artistId: string, market = 'US') =>
    spotifyApi.get(`/artists/${artistId}/top-tracks`, { params: { market } }),

  /**
   * Get related artists
   */
  getRelatedArtists: (artistId: string) =>
    spotifyApi.get(`/artists/${artistId}/related-artists`),

  /**
   * Get artist's albums
   */
  getArtistAlbums: (artistId: string, limit = 20) =>
    spotifyApi.get(`/artists/${artistId}/albums`, { params: { limit, include_groups: 'album,single' } }),
};
