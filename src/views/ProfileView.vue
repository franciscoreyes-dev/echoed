<script setup lang="ts">
import { useRouter } from 'vue-router';
import { computed, onMounted, watch, ref } from 'vue';
import Avatar from 'primevue/avatar';
import BaseButton from '../components/BaseButton.vue';
import DataCard from '../components/DataCard.vue';
import { useAuthStore } from '../stores/auth';
import { useLibraryStore } from '../stores/library';
import { spotifyClient } from '../services/spotify';

const router = useRouter();
const authStore = useAuthStore();
const libraryStore = useLibraryStore();

// Account stats
const totalPlaylists = ref(0);
const savedTracks = ref(0);

const userAvatar = computed(() => {
  if (!authStore.user?.images || authStore.user.images.length === 0) {
    return null;
  }
  return authStore.user.images[0]?.url;
});

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};

const openSpotifyProfile = () => {
  if (authStore.user?.external_urls.spotify) {
    window.open(authStore.user.external_urls.spotify, '_blank');
  }
};

// Format follower count
const formatFollowers = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

// Get product label
const productLabel = computed(() => {
  const product = authStore.user?.product;
  if (product === 'premium') return 'Premium';
  if (product === 'free') return 'Free';
  return 'Open';
});

// Music personality based on top genres
const musicPersonality = computed(() => {
  const genres = libraryStore.topGenres;
  if (genres.length === 0) return null;

  const topGenre = genres[0]?.toLowerCase() || '';

  // Generate personality based on dominant genre
  if (topGenre.includes('rock') || topGenre.includes('metal')) {
    return { title: 'The Rockstar', icon: 'pi-bolt', description: 'You live for the riffs and the energy. Your playlists are loud, proud, and unapologetic.' };
  }
  if (topGenre.includes('pop')) {
    return { title: 'The Trendsetter', icon: 'pi-star', description: 'You know what\'s hot before everyone else. Your taste is infectious and always on point.' };
  }
  if (topGenre.includes('hip hop') || topGenre.includes('rap')) {
    return { title: 'The Lyricist', icon: 'pi-microphone', description: 'You appreciate the art of words and rhythm. Every bar tells a story.' };
  }
  if (topGenre.includes('electronic') || topGenre.includes('edm') || topGenre.includes('house')) {
    return { title: 'The Night Owl', icon: 'pi-moon', description: 'You thrive when the bass drops. Your energy is electric and endless.' };
  }
  if (topGenre.includes('jazz') || topGenre.includes('blues')) {
    return { title: 'The Sophisticate', icon: 'pi-sparkles', description: 'You have refined taste and appreciate the classics. Smooth and timeless.' };
  }
  if (topGenre.includes('classical')) {
    return { title: 'The Virtuoso', icon: 'pi-crown', description: 'You find beauty in complexity. Your appreciation for music runs deep.' };
  }
  if (topGenre.includes('indie') || topGenre.includes('alternative')) {
    return { title: 'The Explorer', icon: 'pi-compass', description: 'You chart your own path and discover hidden gems. Mainstream? Never heard of it.' };
  }
  if (topGenre.includes('r&b') || topGenre.includes('soul')) {
    return { title: 'The Romantic', icon: 'pi-heart', description: 'You feel the music in your soul. Every note speaks to your heart.' };
  }
  if (topGenre.includes('country') || topGenre.includes('folk')) {
    return { title: 'The Storyteller', icon: 'pi-book', description: 'You love a good tale set to music. Authentic and heartfelt.' };
  }
  if (topGenre.includes('latin') || topGenre.includes('reggaeton')) {
    return { title: 'The Firestarter', icon: 'pi-sun', description: 'Your music makes people move. Passionate and full of life.' };
  }

  return { title: 'The Eclectic', icon: 'pi-palette', description: 'Your taste defies categorization. You appreciate all forms of musical expression.' };
});

// Fetch library data on mount
const fetchData = async () => {
  if (authStore.isAuthenticated) {
    try {
      const [, , playlistsRes, tracksRes] = await Promise.all([
        libraryStore.fetchTopArtists('medium_term', 20),
        libraryStore.fetchTopTracks('medium_term', 20),
        spotifyClient.getPlaylistsCount(),
        spotifyClient.getSavedTracksCount()
      ]);

      totalPlaylists.value = playlistsRes.data.total || 0;
      savedTracks.value = tracksRes.data.total || 0;
    } catch (err) {
      console.error('Failed to fetch profile data:', err);
    }
  }
};

onMounted(() => {
  fetchData();
});

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    fetchData();
  }
});
</script>

<template>
  <div class="view-container">
    <!-- Profile Header -->
    <div class="profile-header">
      <Avatar
        v-if="userAvatar"
        :image="userAvatar"
        shape="circle"
        class="profile-avatar-large"
      />
      <Avatar
        v-else
        icon="pi pi-user"
        shape="circle"
        class="profile-avatar-large"
      />
      <div class="profile-info">
        <h1>{{ authStore.user?.display_name || 'User' }}</h1>
        <div class="profile-meta">
          <span v-if="authStore.user?.followers" class="meta-item">
            <i class="pi pi-users"></i>
            {{ formatFollowers(authStore.user.followers.total) }} followers
          </span>
          <span v-if="authStore.user?.country" class="meta-item">
            <i class="pi pi-globe"></i>
            {{ authStore.user.country }}
          </span>
          <span class="meta-item product-badge" :class="authStore.user?.product">
            {{ productLabel }}
          </span>
        </div>
      </div>
    </div>

    <!-- Music DNA - Special Feature -->
    <DataCard v-if="musicPersonality" title="Your Music DNA" icon="pi-sparkles">
      <div class="music-dna">
        <div class="dna-icon">
          <i :class="['pi', musicPersonality.icon]"></i>
        </div>
        <div class="dna-content">
          <h3>{{ musicPersonality.title }}</h3>
          <p>{{ musicPersonality.description }}</p>
        </div>
      </div>
      <div class="top-genres">
        <span class="genre-label">Based on your top genres:</span>
        <div class="genre-tags">
          <span v-for="genre in libraryStore.topGenres.slice(0, 5)" :key="genre" class="genre-tag">
            {{ genre }}
          </span>
        </div>
      </div>
    </DataCard>

    <!-- Quick Stats -->
    <DataCard title="Your Library" icon="pi-database">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ totalPlaylists }}</div>
          <div class="stat-label">Playlists</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ savedTracks }}</div>
          <div class="stat-label">Liked Songs</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ libraryStore.totalUniqueGenres }}</div>
          <div class="stat-label">Genres</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ libraryStore.averagePopularity }}</div>
          <div class="stat-label">Avg Popularity</div>
        </div>
      </div>
    </DataCard>

    <!-- Account Info -->
    <DataCard title="Account" icon="pi-cog">
      <div class="account-info">
        <div class="account-row">
          <span class="account-label">Email</span>
          <span class="account-value">{{ authStore.user?.email || 'Not available' }}</span>
        </div>
        <div class="account-row">
          <span class="account-label">Spotify ID</span>
          <span class="account-value mono">{{ authStore.user?.id }}</span>
        </div>
        <div class="account-row">
          <span class="account-label">Account Type</span>
          <span class="account-value">{{ productLabel }}</span>
        </div>
      </div>
      <div class="account-actions">
        <BaseButton
          icon="pi pi-external-link"
          label="View on Spotify"
          severity="success"
          variant="outlined"
          @click="openSpotifyProfile"
        />
        <BaseButton
          icon="pi pi-sign-out"
          label="Logout"
          severity="danger"
          variant="outlined"
          @click="handleLogout"
        />
      </div>
    </DataCard>
  </div>
</template>

<style scoped>
.view-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.profile-avatar-large {
  width: 120px;
  height: 120px;
  font-size: 3rem;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
}

.profile-info h1 {
  color: var(--fgColor-default);
  font-size: 2.5rem;
  margin: 0 0 0.75rem 0;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--fgColor-muted);
  font-size: 0.9rem;
}

.meta-item i {
  font-size: 0.85rem;
}

.product-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.product-badge.premium {
  background: var(--color-ansi-green-bright);
  color: var(--bgColor-default);
}

.product-badge.free {
  background: var(--fgColor-muted);
  color: var(--bgColor-default);
}

/* Music DNA */
.music-dna {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.dna-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--bgColor-default);
  border: 2px solid var(--color-ansi-green-bright);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dna-icon i {
  font-size: 2.5rem;
  color: var(--color-ansi-green-bright);
}

.dna-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: var(--color-ansi-green-bright);
}

.dna-content p {
  margin: 0;
  color: var(--fgColor-muted);
  line-height: 1.5;
}

.top-genres {
  border-top: 1px solid var(--borderColor-default);
  padding-top: 1rem;
}

.genre-label {
  display: block;
  font-size: 0.85rem;
  color: var(--fgColor-muted);
  margin-bottom: 0.75rem;
}

.genre-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.genre-tag {
  padding: 0.375rem 0.75rem;
  background: var(--bgColor-default);
  border: 1px solid var(--borderColor-default);
  border-radius: 16px;
  font-size: 0.85rem;
  color: var(--fgColor-default);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: var(--bgColor-default);
  border-radius: 8px;
  border: 1px solid var(--borderColor-default);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-ansi-green-bright);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--fgColor-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Account Info */
.account-info {
  margin-bottom: 1.5rem;
}

.account-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--borderColor-default);
}

.account-row:last-child {
  border-bottom: none;
}

.account-label {
  color: var(--fgColor-muted);
  font-size: 0.9rem;
}

.account-value {
  color: var(--fgColor-default);
  font-weight: 500;
}

.account-value.mono {
  font-family: 'Geist Mono', monospace;
  font-size: 0.85rem;
}

.account-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-meta {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .music-dna {
    flex-direction: column;
    text-align: center;
  }

  .account-actions {
    flex-direction: column;
  }
}
</style>
