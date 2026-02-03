import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import { useRoomStore } from '@/stores/room'
import { useSocket } from '@/composables/useSocket'
import type { TrackInfo } from '@/stores/player'

let player: Spotify.Player | null = null
let statePoller: ReturnType<typeof setInterval> | null = null
let lastEmittedState: { uri: string | null; isPlaying: boolean; positionMs: number } = {
  uri: null,
  isPlaying: false,
  positionMs: 0,
}

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
  const roomStore = useRoomStore()
  const { onSync, emitPlayerState } = useSocket()

  async function initialize(): Promise<void> {
    if (player) return

    await loadSDKScript()

    // Register sync callback for non-hosts to control their player
    onSync(async (data) => {
      if (roomStore.isHost || !playerStore.deviceId || !authStore.accessToken) return

      const state = player ? await player.getCurrentState() : null
      const currentUri = state?.track_window.current_track.uri ?? null

      // If track changed or we need to start playing a new track
      if (data.track && data.track.uri !== currentUri) {
        // Play the new track via Spotify API
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${playerStore.deviceId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${authStore.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [data.track.uri],
            position_ms: data.positionMs,
          }),
        })
        return
      }

      // Handle play/pause state changes
      if (data.track && player) {
        const localIsPlaying = state ? !state.paused : false

        if (data.isPlaying && !localIsPlaying) {
          await player.resume()
        } else if (!data.isPlaying && localIsPlaying) {
          await player.pause()
        }

        // Only seek if drift exceeds 500ms to avoid constant seeking
        if (state && data.isPlaying) {
          const drift = Math.abs(state.position - data.positionMs)
          if (drift > 500) {
            await player.seek(data.positionMs)
          }
        }
      }

      // Handle track stop
      if (!data.track && player && state) {
        await player.pause()
      }
    })

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

      // player-state-changed is unreliable in the SDK; poll getCurrentState instead
      const syncState = async (): Promise<void> => {
        if (!player) return
        const state = await player.getCurrentState()
        if (!state) {
          playerStore.currentTrack = null
          // Host: emit null track if track was cleared
          if (roomStore.isHost && lastEmittedState.uri !== null) {
            lastEmittedState = { uri: null, isPlaying: false, positionMs: 0 }
            emitPlayerState(null, 0, false)
          }
          return
        }
        const track = parseTrack(state)
        const isPlaying = !state.paused

        // only reset position on track change to let the Player ticker stay smooth
        if (playerStore.currentTrack?.uri !== track.uri) {
          playerStore.positionMs = state.position
        }
        playerStore.currentTrack = track
        playerStore.isPlaying = isPlaying

        // Host: emit state changes to sync other room members
        if (roomStore.isHost) {
          const trackChanged = lastEmittedState.uri !== track.uri
          const playStateChanged = lastEmittedState.isPlaying !== isPlaying
          // Emit on track change, play/pause change, or significant position change (seek)
          const positionDrift = Math.abs(lastEmittedState.positionMs - state.position)
          const significantSeek = positionDrift > 2000 && !trackChanged

          if (trackChanged || playStateChanged || significantSeek) {
            lastEmittedState = { uri: track.uri, isPlaying, positionMs: state.position }
            emitPlayerState(track, state.position, isPlaying)
          } else {
            // Update position tracking even if not emitting
            lastEmittedState.positionMs = state.position
          }
        }
      }

      await syncState()
      statePoller = setInterval(syncState, 1000)
    })

    player.on('not_ready', () => {
      playerStore.deviceId = null
    })

    await player.connect()
  }

  async function play(): Promise<void> {
    if (!player) return
    await player.resume()
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
    if (statePoller !== null) {
      clearInterval(statePoller)
      statePoller = null
    }
    if (!player) return
    player.disconnect()
    player = null
    playerStore.reset()
  }

  return { initialize, play, pause, seek, transferPlayback, destroy }
}
