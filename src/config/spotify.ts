/**
 * Spotify API Configuration
 * Documentation: https://developer.spotify.com/documentation/web-api
 */

export const SPOTIFY_CONFIG = {
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,

  // Spotify API Endpoints
  endpoints: {
    authorize: 'https://accounts.spotify.com/authorize',
    token: 'https://accounts.spotify.com/api/token',
    api: 'https://api.spotify.com/v1',
  },

  // OAuth Scopes - defines what data we can access
  scopes: [
    'user-read-private',        // Read user profile data
    'user-read-email',          // Read user email
    'user-library-read',        // Read saved tracks and albums
    'user-library-modify',      // Modify saved tracks and albums
    'user-read-playback-state', // Read playback state
    'user-modify-playback-state', // Control playback
    'user-read-currently-playing', // Read currently playing
    'user-read-recently-played', // Read recently played tracks
    'user-top-read',            // Read top artists and tracks
    'playlist-read-private',    // Read private playlists
    'playlist-read-collaborative', // Read collaborative playlists
    'playlist-modify-public',   // Modify public playlists
    'playlist-modify-private',  // Modify private playlists
    'ugc-image-upload',         // Upload playlist cover images
    'streaming',                // Web Playback SDK
  ],
} as const;

// Storage keys for tokens
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'spotify_access_token',
  REFRESH_TOKEN: 'spotify_refresh_token',
  EXPIRES_AT: 'spotify_expires_at',
  CODE_VERIFIER: 'spotify_code_verifier',
  STATE: 'spotify_state',
} as const;
