import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1'

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing',
  'streaming',
].join(' ')

function generateCodeVerifier(): string {
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/[+/]/g, '')
    .replace(/=+$/, '')
    .substring(0, 64)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier))
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

interface SpotifyProfile {
  id: string
  display_name: string
  product: string
}

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  async function login(): Promise<void> {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)

    sessionStorage.setItem('spotify_code_verifier', verifier)

    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: import.meta.env.VITE_REDIRECT_URI,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: challenge,
    })

    window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`
  }

  async function handleCallback(): Promise<void> {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error || !code) {
      throw new Error(error ?? 'Missing authorization code')
    }

    const verifier = sessionStorage.getItem('spotify_code_verifier')
    if (!verifier) {
      throw new Error('Missing code verifier — please try logging in again')
    }

    sessionStorage.removeItem('spotify_code_verifier')

    const tokenRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        code_verifier: verifier,
        redirect_uri: import.meta.env.VITE_REDIRECT_URI,
      }),
    })

    if (!tokenRes.ok) {
      throw new Error('Failed to exchange authorization code')
    }

    const tokens: TokenResponse = await tokenRes.json()

    const profileRes = await fetch(`${SPOTIFY_API_URL}/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!profileRes.ok) {
      throw new Error('Failed to fetch user profile')
    }

    const profile: SpotifyProfile = await profileRes.json()

    if (profile.product !== 'premium') {
      throw new Error('Echoed requires a Spotify Premium account')
    }

    authStore.setAuth(tokens.access_token, profile.id, profile.display_name)
    sessionStorage.setItem('spotify_refresh_token', tokens.refresh_token)
    sessionStorage.setItem('spotify_token_expiry', String(Date.now() + tokens.expires_in * 1000))

    router.push('/lobby')
  }

  function logout(): void {
    authStore.clear()
    sessionStorage.removeItem('spotify_refresh_token')
    sessionStorage.removeItem('spotify_token_expiry')
    router.push('/')
  }

  return { login, handleCallback, logout }
}
