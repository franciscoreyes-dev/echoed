/**
 * Authentication Store
 * Manages Spotify OAuth state and user data
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SpotifyUser, AuthState } from '../types/spotify';
import {
  initiateSpotifyLogin,
  handleSpotifyCallback,
  refreshSpotifyToken,
  isTokenExpired,
  storeTokens,
  retrieveTokens,
  clearTokens,
} from '../composables/useSpotifyAuth';
import { SPOTIFY_CONFIG } from '../config/spotify';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<SpotifyUser | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const expiresAt = ref<number | null>(null);

  // Getters
  const isAuthenticated = computed(() => {
    return !!accessToken.value && !!user.value;
  });

  const needsTokenRefresh = computed(() => {
    if (!expiresAt.value) return false;
    return isTokenExpired(expiresAt.value);
  });

  /**
   * Initialize auth state from localStorage
   * Should be called on app startup
   */
  const initializeAuth = async (): Promise<void> => {
    const tokens = retrieveTokens();

    if (!tokens.accessToken || !tokens.refreshToken || !tokens.expiresAt) {
      return;
    }

    // Set tokens
    accessToken.value = tokens.accessToken;
    refreshToken.value = tokens.refreshToken;
    expiresAt.value = tokens.expiresAt;

    // Check if token needs refresh
    if (isTokenExpired(tokens.expiresAt)) {
      try {
        await refreshAccessToken();
      } catch (error) {
        console.error('Failed to refresh token on init:', error);
        logout();
        return;
      }
    }

    // Fetch user data
    try {
      await fetchUserProfile();
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    }
  };

  /**
   * Initiate Spotify OAuth login flow
   */
  const login = async (): Promise<void> => {
    await initiateSpotifyLogin();
  };

  /**
   * Handle OAuth callback and complete authentication
   */
  const completeAuth = async (code: string, state: string): Promise<void> => {
    try {
      const tokenResponse = await handleSpotifyCallback(code, state);

      // Store tokens
      accessToken.value = tokenResponse.access_token;
      refreshToken.value = tokenResponse.refresh_token;
      expiresAt.value = Date.now() + tokenResponse.expires_in * 1000;

      // Persist to localStorage
      storeTokens(
        tokenResponse.access_token,
        tokenResponse.refresh_token,
        tokenResponse.expires_in
      );

      // Fetch user profile
      await fetchUserProfile();
    } catch (error) {
      console.error('Auth completion failed:', error);
      throw error;
    }
  };

  /**
   * Refresh the access token
   */
  const refreshAccessToken = async (): Promise<void> => {
    if (!refreshToken.value) {
      throw new Error('No refresh token available');
    }

    try {
      const tokenResponse = await refreshSpotifyToken(refreshToken.value);

      // Update tokens
      accessToken.value = tokenResponse.access_token;
      expiresAt.value = Date.now() + tokenResponse.expires_in * 1000;

      // Update localStorage (keep existing refresh token)
      storeTokens(
        tokenResponse.access_token,
        refreshToken.value,
        tokenResponse.expires_in
      );
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      logout();
      throw error;
    }
  };

  /**
   * Fetch user profile from Spotify API
   */
  const fetchUserProfile = async (): Promise<void> => {
    if (!accessToken.value) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(`${SPOTIFY_CONFIG.endpoints.api}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, try to refresh
          await refreshAccessToken();
          // Retry the request
          return fetchUserProfile();
        }
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }

      user.value = await response.json();
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  };

  /**
   * Logout user and clear all auth data
   */
  const logout = (): void => {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    expiresAt.value = null;
    clearTokens();
  };

  /**
   * Get current access token, refreshing if needed
   * Use this before making API calls
   */
  const getValidAccessToken = async (): Promise<string> => {
    if (!accessToken.value) {
      throw new Error('Not authenticated');
    }

    // Refresh token if expired or will expire soon
    if (expiresAt.value && isTokenExpired(expiresAt.value)) {
      await refreshAccessToken();
    }

    return accessToken.value;
  };

  return {
    // State
    user,
    accessToken,
    refreshToken,
    expiresAt,

    // Getters
    isAuthenticated,
    needsTokenRefresh,

    // Actions
    initializeAuth,
    login,
    completeAuth,
    refreshAccessToken,
    fetchUserProfile,
    logout,
    getValidAccessToken,
  };
});
