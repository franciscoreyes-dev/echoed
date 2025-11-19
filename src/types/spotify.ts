/**
 * Spotify API Type Definitions
 */

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: SpotifyImage[];
  country: string;
  product: 'premium' | 'free' | 'open';
  followers: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

export interface SpotifyTokenRefreshResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
}

export interface AuthState {
  user: SpotifyUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface PKCETokens {
  codeVerifier: string;
  codeChallenge: string;
}

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

export interface SpotifyPlaybackState {
  device: SpotifyDevice;
  repeat_state: 'off' | 'track' | 'context';
  shuffle_state: boolean;
  timestamp: number;
  progress_ms: number;
  is_playing: boolean;
  item: SpotifyTrack | null;
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
  album: {
    id: string;
    name: string;
    images: SpotifyImage[];
    external_urls: {
      spotify: string;
    };
  };
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
  uri: string;
}
