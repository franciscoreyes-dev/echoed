import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import type { TrackInfo } from '@/stores/player'

let player: Spotify.Player | null = null

function loadSDKScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('spotify-sdk')) {
      resolve()
      return
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve()

    const script = document.createElement('script')
    script.id = 'spotify-sdk'
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.onerror = () => reject(new Error('Failed to load Spotify SDK'))
    document.head.appendChild(script)
  })
}

function parseTrack(state: Spotify.PlayerState): TrackInfo {
  const track = state.track_window.current_track
  return {
    uri: track.uri,
    name: track.name,
    artists: track.artists.map((a) => a.name),
    albumArt: track.album.images.find((img) => img.size === 'SMALL')?.url
      ?? track.album.images[0]?.url
      ?? '',
    durationMs: track.duration_ms,
  }
}

export function useSpotifyPlayer() {
  const authStore = useAuthStore()
  const playerStore = usePlayerStore()

  async function initialize(): Promise<void> {
    if (player) return

    await loadSDKScript()

    player = new window.Spotify.Player({
      name: 'Echoed',
      getOAuthToken: (cb: (token: string) => void) => {
        if (authStore.accessToken) {
          cb(authStore.accessToken)
        }
      },
      volume: 0.8,
    })

    player.on('ready', async ({ device_id }) => {
      playerStore.deviceId = device_id

      // player-state-changed only becomes available after ready fires
      player!.on('player-state-changed', (state) => {
        playerStore.currentTrack = parseTrack(state)
        playerStore.isPlaying = !state.paused
        playerStore.positionMs = state.position
      })

      // sync initial state in case something was already playing
      const state = await player!.getCurrentState()
      if (state) {
        playerStore.currentTrack = parseTrack(state)
        playerStore.isPlaying = !state.paused
        playerStore.positionMs = state.position
      }
    })

    player.on('not_ready', () => {
      playerStore.deviceId = null
    })

    await player.connect()
  }

  async function play(): Promise<void> {
    if (!player) return
    await player.play()
  }

  async function pause(): Promise<void> {
    if (!player) return
    await player.pause()
  }

  async function seek(positionMs: number): Promise<void> {
    if (!player) return
    await player.seek(positionMs)
  }

  async function transferPlayback(): Promise<void> {
    if (!playerStore.deviceId || !authStore.accessToken) return

    await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ device_ids: [playerStore.deviceId], play: true }),
    })
  }

  function destroy(): void {
    if (!player) return
    player.disconnect()
    player = null
    playerStore.reset()
  }

  return { initialize, play, pause, seek, transferPlayback, destroy }
}
