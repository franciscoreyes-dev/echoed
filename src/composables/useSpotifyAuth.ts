/**
 * Spotify OAuth Authentication with PKCE
 *
 * PKCE (Proof Key for Code Exchange) is critical for SPAs to prevent
 * authorization code interception attacks.
 *
 * Flow:
 * 1. Generate code_verifier (random string)
 * 2. Create code_challenge = BASE64URL(SHA256(code_verifier))
 * 3. Redirect to Spotify with code_challenge
 * 4. User authorizes
 * 5. Spotify redirects back with authorization code
 * 6. Exchange code + code_verifier for tokens
 * 7. Spotify verifies code_challenge matches code_verifier
 */

import { SPOTIFY_CONFIG, STORAGE_KEYS } from '../config/spotify';
import type { SpotifyTokenResponse, SpotifyTokenRefreshResponse } from '../types/spotify';

/**
 * Generate a cryptographically secure random string for PKCE code_verifier
 * Must be 43-128 characters from [A-Z][a-z][0-9]-._~
 */
const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
};

/**
 * Generate code_challenge from code_verifier using SHA-256
 */
const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
};

/**
 * Base64URL encoding (without padding)
 */
const base64UrlEncode = (array: Uint8Array): string => {
  const base64 = btoa(String.fromCharCode(...array));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Generate random state for CSRF protection
 */
const generateState = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
};

/**
 * Initiate Spotify OAuth login
 * Redirects user to Spotify authorization page
 */
export const initiateSpotifyLogin = async (): Promise<void> => {
  // Generate PKCE values
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Store code_verifier and state for later use
  sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
  sessionStorage.setItem(STORAGE_KEYS.STATE, state);

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: SPOTIFY_CONFIG.redirectUri,
    state: state,
    scope: SPOTIFY_CONFIG.scopes.join(' '),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  const authUrl = `${SPOTIFY_CONFIG.endpoints.authorize}?${params.toString()}`;

  // Redirect to Spotify
  window.location.href = authUrl;
};

/**
 * Handle OAuth callback and exchange code for tokens
 */
export const handleSpotifyCallback = async (
  code: string,
  state: string
): Promise<SpotifyTokenResponse> => {
  // Verify state to prevent CSRF attacks
  const storedState = sessionStorage.getItem(STORAGE_KEYS.STATE);
  if (state !== storedState) {
    throw new Error('State mismatch - possible CSRF attack');
  }

  // Retrieve code_verifier
  const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

  // Exchange authorization code for tokens
  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.clientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: SPOTIFY_CONFIG.redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(SPOTIFY_CONFIG.endpoints.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
  }

  const tokens: SpotifyTokenResponse = await response.json();

  // Clean up stored PKCE values
  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
  sessionStorage.removeItem(STORAGE_KEYS.STATE);

  return tokens;
};

/**
 * Refresh access token using refresh token
 */
export const refreshSpotifyToken = async (
  refreshToken: string
): Promise<SpotifyTokenRefreshResponse> => {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_CONFIG.endpoints.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
  }

  return await response.json();
};

/**
 * Check if access token is expired or will expire soon
 * @param expiresAt - Timestamp when token expires
 * @param bufferMinutes - Minutes before expiration to consider token expired (default: 5)
 */
export const isTokenExpired = (expiresAt: number, bufferMinutes: number = 5): boolean => {
  const now = Date.now();
  const buffer = bufferMinutes * 60 * 1000; // Convert to milliseconds
  return now >= expiresAt - buffer;
};

/**
 * Store tokens in localStorage
 */
export const storeTokens = (
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): void => {
  const expiresAt = Date.now() + expiresIn * 1000;

  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
};

/**
 * Retrieve tokens from localStorage
 */
export const retrieveTokens = (): {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
} => {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAt ? parseInt(expiresAt, 10) : null,
  };
};

/**
 * Clear all stored tokens
 */
export const clearTokens = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
  sessionStorage.removeItem(STORAGE_KEYS.STATE);
};
