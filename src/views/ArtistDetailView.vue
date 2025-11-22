<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { spotifyClient } from '../services/spotify';
import { apiCache } from '../utils/cache';
import { usePlayerStore } from '../stores/player';
import { useLibraryStore } from '../stores/library';
import Avatar from 'primevue/avatar';
import AvatarGroup from 'primevue/avatargroup';
import BaseButton from '../components/BaseButton.vue';
import DataCard from '../components/DataCard.vue';
import TrackItem from '../components/TrackItem.vue';
import AlbumItem from '../components/AlbumItem.vue';
import ArtistGraph from '../components/ArtistGraph.vue';

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
  followers: { total: number };
  genres: string[];
  popularity: number;
  external_urls: { spotify: string };
}

interface Track {
  id: string;
  name: string;
  duration_ms: number;
  album: {
    name: string;
    images: { url: string }[];
  };
  artists: { id: string; name: string }[];
  popularity: number;
}

interface Album {
  id: string;
  name: string;
  images: { url: string }[];
  release_date: string;
  album_type: string;
  total_tracks: number;
}

interface ConnectedArtist {
  id: string;
  name: string;
  image?: string;
}

interface Connection {
  source: string;
  target: string;
  type: 'collaboration' | 'genre';
}

const route = useRoute();
const router = useRouter();
const playerStore = usePlayerStore();
const libraryStore = useLibraryStore();

const artist = ref<Artist | null>(null);
const topTracks = ref<Track[]>([]);
const albums = ref<Album[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Graph state
const showGraph = ref(false);
const connectedArtists = ref<ConnectedArtist[]>([]);
const connections = ref<Connection[]>([]);
const isLoadingConnections = ref(false);

const centerArtist = computed(() => {
  if (!artist.value) return { id: '', name: '', image: '' };
  return {
    id: artist.value.id,
    name: artist.value.name,
    image: artist.value.images[0]?.url
  };
});

const fetchArtistData = async () => {
  const artistId = route.params.id as string;
  if (!artistId) {
    error.value = 'No artist ID provided';
    isLoading.value = false;
    return;
  }

  // Reset graph state when loading new artist
  showGraph.value = false;
  connectedArtists.value = [];
  connections.value = [];

  const cacheKey = `artist-${artistId}`;
  const cached = apiCache.get<{ artist: Artist; topTracks: Track[]; albums: Album[] }>(cacheKey);

  if (cached) {
    artist.value = cached.artist;
    topTracks.value = cached.topTracks;
    albums.value = cached.albums;
    isLoading.value = false;
    return;
  }

  try {
    const [artistRes, tracksRes, albumsRes] = await Promise.all([
      spotifyClient.getArtist(artistId),
      spotifyClient.getArtistTopTracks(artistId),
      spotifyClient.getArtistAlbums(artistId, 50)
    ]);

    artist.value = artistRes.data;
    topTracks.value = tracksRes.data.tracks || [];
    albums.value = albumsRes.data.items || [];

    apiCache.set(cacheKey, {
      artist: artist.value,
      topTracks: topTracks.value,
      albums: albums.value
    }, 300000); // 5 min
  } catch (err) {
    console.error('Failed to fetch artist data:', err);
    error.value = 'Failed to load artist details';
  } finally {
    isLoading.value = false;
  }
};

const fetchConnections = async () => {
  if (!artist.value || connectedArtists.value.length > 0) return;

  isLoadingConnections.value = true;
  const artistId = artist.value.id;
  const foundArtists = new Map<string, ConnectedArtist>();
  const foundConnections: Connection[] = [];

  try {
    // 1. Collect all collaborator IDs from top tracks (first level)
    const firstLevelCollabs: { id: string; name: string }[] = [];
    for (const track of topTracks.value) {
      for (const trackArtist of track.artists) {
        if (trackArtist.id && trackArtist.id !== artistId && !firstLevelCollabs.some(c => c.id === trackArtist.id)) {
          firstLevelCollabs.push({ id: trackArtist.id, name: trackArtist.name });
        }
      }
    }

    // 2. Fetch first-level collaborator details in parallel
    const batchSize = 5;
    for (let i = 0; i < firstLevelCollabs.length; i += batchSize) {
      const batch = firstLevelCollabs.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(collab => spotifyClient.getArtist(collab.id))
      );

      results.forEach((result, index) => {
        const collab = batch[index];
        if (result.status === 'fulfilled') {
          foundArtists.set(collab.id, {
            id: collab.id,
            name: collab.name,
            image: result.value.data.images[0]?.url
          });
        } else {
          foundArtists.set(collab.id, {
            id: collab.id,
            name: collab.name
          });
        }
        foundConnections.push({
          source: artistId,
          target: collab.id,
          type: 'collaboration'
        });
      });
    }

    // 3. Fetch second-level connections (collaborators' top tracks)
    const firstLevelIds = Array.from(foundArtists.keys()).slice(0, 5); // Limit to first 5 for performance
    for (const collabId of firstLevelIds) {
      try {
        const tracksRes = await spotifyClient.getArtistTopTracks(collabId);
        const tracks = tracksRes.data.tracks || [];

        for (const track of tracks.slice(0, 5)) { // Limit tracks checked
          for (const trackArtist of track.artists) {
            if (
              trackArtist.id &&
              trackArtist.id !== artistId &&
              trackArtist.id !== collabId &&
              !foundArtists.has(trackArtist.id)
            ) {
              // Add second-level artist
              try {
                const artistRes = await spotifyClient.getArtist(trackArtist.id);
                foundArtists.set(trackArtist.id, {
                  id: trackArtist.id,
                  name: trackArtist.name,
                  image: artistRes.data.images[0]?.url
                });
              } catch {
                foundArtists.set(trackArtist.id, {
                  id: trackArtist.id,
                  name: trackArtist.name
                });
              }
              // Connect to first-level collaborator
              foundConnections.push({
                source: collabId,
                target: trackArtist.id,
                type: 'collaboration'
              });
            }
          }
        }
      } catch {
        // Skip if we can't fetch tracks
      }
    }

    // 4. Find genre matches from user's top artists
    if (artist.value.genres.length > 0 && libraryStore.topArtists.length > 0) {
      const artistGenres = new Set(artist.value.genres.map(g => g.toLowerCase()));

      for (const topArtist of libraryStore.topArtists) {
        if (topArtist.id !== artistId && !foundArtists.has(topArtist.id)) {
          const hasGenreMatch = topArtist.genres.some(g => artistGenres.has(g.toLowerCase()));
          if (hasGenreMatch) {
            foundArtists.set(topArtist.id, {
              id: topArtist.id,
              name: topArtist.name,
              image: topArtist.images[0]?.url
            });
            foundConnections.push({
              source: artistId,
              target: topArtist.id,
              type: 'genre'
            });
          }
        }
      }
    }

    // 5. Check for cross-connections between second-level artists and other artists in graph
    const allArtistIds = new Set([artistId, ...foundArtists.keys()]);
    const secondLevelIds = Array.from(foundArtists.keys()).filter(id =>
      !firstLevelCollabs.some(c => c.id === id)
    );

    // For each second-level artist, check if they connect to other artists in the graph
    for (const secondLevelId of secondLevelIds.slice(0, 10)) { // Limit for performance
      try {
        const tracksRes = await spotifyClient.getArtistTopTracks(secondLevelId);
        const tracks = tracksRes.data.tracks || [];

        for (const track of tracks.slice(0, 3)) {
          for (const trackArtist of track.artists) {
            // Check if this artist is already in our graph (cross-connection)
            if (
              trackArtist.id &&
              trackArtist.id !== secondLevelId &&
              allArtistIds.has(trackArtist.id) &&
              !foundConnections.some(c =>
                (c.source === secondLevelId && c.target === trackArtist.id) ||
                (c.source === trackArtist.id && c.target === secondLevelId)
              )
            ) {
              foundConnections.push({
                source: secondLevelId,
                target: trackArtist.id,
                type: 'collaboration'
              });
            }
          }
        }
      } catch {
        // Skip if we can't fetch tracks
      }
    }

    connectedArtists.value = Array.from(foundArtists.values()).slice(0, 30);
    connections.value = foundConnections.filter(c =>
      (connectedArtists.value.some(a => a.id === c.target) || c.target === artistId) &&
      (c.source === artistId || connectedArtists.value.some(a => a.id === c.source))
    );
  } catch (err) {
    console.error('Failed to fetch connections:', err);
  } finally {
    isLoadingConnections.value = false;
  }
};

const toggleGraph = async () => {
  if (!showGraph.value) {
    await fetchConnections();
  }
  showGraph.value = !showGraph.value;
};

const closeGraph = () => {
  showGraph.value = false;
};

const goBack = () => {
  if (showGraph.value) {
    closeGraph();
  } else {
    router.back();
  }
};

const openInSpotify = () => {
  if (artist.value?.external_urls.spotify) {
    window.open(artist.value.external_urls.spotify, '_blank');
  }
};

const formatFollowers = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

// Watch for route changes to reload data
watch(() => route.params.id, () => {
  if (route.params.id) {
    isLoading.value = true;
    fetchArtistData();
  }
});

onMounted(() => {
  fetchArtistData();
  // Ensure we have user's top artists for genre matching
  if (libraryStore.topArtists.length === 0) {
    libraryStore.fetchTopArtists('medium_term', 50);
  }
});
</script>

<template>
  <div class="artist-view" :class="{ 'graph-open': showGraph }">
    <!-- Artist Details Panel -->
    <div class="artist-panel">
      <div class="view-container">
        <div class="back-nav">
          <BaseButton
            icon="pi pi-arrow-left"
            label="Back"
            severity="secondary"
            variant="text"
            @click="goBack"
          />
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading artist details...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <i class="pi pi-exclamation-circle"></i>
          <p>{{ error }}</p>
          <BaseButton
            label="Go Back"
            severity="secondary"
            @click="goBack"
          />
        </div>

        <!-- Artist Details -->
        <div v-else-if="artist" class="artist-details">
          <!-- Artist Header -->
          <div class="artist-header">
            <img
              v-if="artist.images[0]"
              :src="artist.images[0].url"
              :alt="artist.name"
              class="artist-image"
            />
            <div class="artist-main-info">
              <h1>{{ artist.name }}</h1>
              <div class="artist-meta">
                <span class="followers">
                  <i class="pi pi-users"></i>
                  {{ formatFollowers(artist.followers.total) }} followers
                </span>
                <span class="popularity">
                  <i class="pi pi-chart-line"></i>
                  {{ artist.popularity }}% popularity
                </span>
              </div>
              <div v-if="artist.genres.length" class="genres">
                <span v-for="genre in artist.genres.slice(0, 4)" :key="genre" class="genre-tag">
                  {{ genre }}
                </span>
              </div>
              <div class="action-buttons">
                <BaseButton
                  icon="pi pi-external-link"
                  label="Open in Spotify"
                  severity="success"
                  @click="openInSpotify"
                />
                <!-- Connections Button -->
                <div class="connections-button" @click="toggleGraph">
                  <BaseButton
                    icon="pi pi-share-alt"
                    :label="showGraph ? 'Hide Connections' : 'Connections'"
                    :severity="showGraph ? 'primary' : 'secondary'"
                    :variant="showGraph ? undefined : 'outlined'"
                    :loading="isLoadingConnections"
                  />
                  <AvatarGroup v-if="connectedArtists.length > 0 && !showGraph" class="avatar-preview">
                    <Avatar
                      v-for="ca in connectedArtists.slice(0, 3)"
                      :key="ca.id"
                      :image="ca.image"
                      :label="ca.image ? undefined : ca.name[0]"
                      shape="circle"
                      size="small"
                    />
                    <Avatar
                      v-if="connectedArtists.length > 3"
                      :label="`+${connectedArtists.length - 3}`"
                      shape="circle"
                      size="small"
                      class="more-avatar"
                    />
                  </AvatarGroup>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Tracks -->
          <DataCard v-if="topTracks.length" title="Popular Tracks" icon="pi-play">
            <div class="tracks-list">
              <TrackItem
                v-for="(track, index) in topTracks.slice(0, 5)"
                :key="track.id"
                :track-id="track.id"
                :image="track.album.images[0]?.url"
                :title="`${index + 1}. ${track.name}`"
                :artists="track.artists.map(a => a.name).join(', ')"
                :album="track.album.name"
                :duration="playerStore.formatDuration(track.duration_ms)"
                :show-info="true"
              />
            </div>
          </DataCard>

          <!-- Discography -->
          <DataCard v-if="albums.length" title="Discography" icon="pi-th-large">
            <div class="albums-grid">
              <AlbumItem
                v-for="album in albums.slice(0, 12)"
                :key="album.id"
                :album-id="album.id"
                :image="album.images[0]?.url"
                :name="album.name"
                :release-year="album.release_date?.split('-')[0]"
                :album-type="album.album_type"
              />
            </div>
          </DataCard>
        </div>
      </div>
    </div>

    <!-- Graph Panel -->
    <div class="graph-panel">
      <div class="graph-header">
        <h2>Artist Connections</h2>
        <BaseButton
          icon="pi pi-times"
          severity="secondary"
          variant="text"
          @click="closeGraph"
        />
      </div>
      <div v-if="connectedArtists.length === 0" class="empty-connections">
        <i class="pi pi-info-circle"></i>
        <p>No connections found for this artist</p>
      </div>
      <ArtistGraph
        v-else
        :center-artist="centerArtist"
        :connected-artists="connectedArtists"
        :connections="connections"
      />
    </div>
  </div>
</template>

<style scoped>
.artist-view {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.artist-panel {
  flex: 1;
  overflow-y: auto;
  transition: flex 0.4s ease-in-out;
}

.graph-open .artist-panel {
  flex: 0 0 400px;
}

.graph-open .artist-image {
  width: 120px;
  height: 120px;
}

.graph-open .artist-main-info h1 {
  font-size: 1.5rem;
}

.graph-open .artist-meta {
  flex-direction: column;
  gap: 0.25rem;
}

.graph-open .genres {
  display: none;
}

.graph-open .action-buttons {
  flex-direction: column;
}

.graph-open .tracks-list,
.graph-open .albums-grid {
  display: none;
}

.graph-panel {
  flex: 0;
  overflow: hidden;
  background: var(--bgColor-default);
  border-left: 1px solid var(--borderColor-default);
  display: flex;
  flex-direction: column;
  transition: flex 0.4s ease-in-out;
}

.graph-open .graph-panel {
  flex: 1;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--borderColor-default);
}

.graph-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--fgColor-default);
}

.empty-connections {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--fgColor-muted);
}

.empty-connections i {
  font-size: 2rem;
}

.view-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.back-nav {
  margin-bottom: 1.5rem;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1.5rem;
  text-align: center;
}

.loading-state .spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--borderColor-default);
  border-top-color: var(--color-ansi-green-bright);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state i {
  font-size: 3rem;
  color: var(--fgColor-danger);
}

.error-state p {
  color: var(--fgColor-muted);
  margin: 0;
}

.artist-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.artist-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.artist-image {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
  transition: width 0.4s ease-in-out, height 0.4s ease-in-out;
}

.artist-main-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.artist-main-info h1 {
  margin: 0 0 0.5rem 0;
  font-size: 3rem;
  color: var(--fgColor-default);
  transition: font-size 0.4s ease-in-out;
}

.artist-meta {
  margin: 0 0 0.5rem 0;
  display: flex;
  gap: 1.5rem;
  color: var(--fgColor-muted);
  transition: flex-direction 0.4s ease-in-out, gap 0.4s ease-in-out;
}

.artist-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.artist-meta i {
  font-size: 0.9rem;
}

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  transition: display 0.4s ease-in-out;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
  align-items: flex-start;
  transition: flex-direction 0.4s ease-in-out;
}

.connections-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.avatar-preview {
  margin-left: 0.25rem;
}

.avatar-preview :deep(.p-avatar) {
  width: 28px;
  height: 28px;
  font-size: 0.7rem;
}

.more-avatar {
  background: var(--bgColor-muted) !important;
  color: var(--fgColor-muted) !important;
}

.genre-tag {
  padding: 0.375rem 0.75rem;
  background: var(--bgColor-muted);
  border: 1px solid var(--borderColor-default);
  border-radius: 16px;
  font-size: 0.85rem;
  color: var(--fgColor-default);
}

.tracks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .graph-open .artist-panel {
    flex: 0 0 100%;
  }

  .graph-open .graph-panel {
    position: absolute;
    inset: 0;
    z-index: 100;
  }
}

@media (max-width: 600px) {
  .artist-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .artist-image {
    width: 150px;
    height: 150px;
  }

  .artist-main-info {
    align-items: center;
  }

  .artist-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .genres {
    justify-content: center;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
}
</style>
