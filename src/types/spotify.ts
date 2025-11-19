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
