<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const error = ref<string | null>(null);
const isProcessing = ref(true);

onMounted(async () => {
  // Check for error in URL params (user denied access)
  const errorParam = route.query.error as string | undefined;
  if (errorParam) {
    error.value = errorParam === 'access_denied'
      ? 'You denied access to Spotify. Please try again.'
      : `Authentication error: ${errorParam}`;
    isProcessing.value = false;
    return;
  }

  // Get authorization code and state from URL
  const code = route.query.code as string | undefined;
  const state = route.query.state as string | undefined;

  if (!code || !state) {
    error.value = 'Missing authorization code or state';
    isProcessing.value = false;
    return;
  }

  try {
    // Complete authentication
    await authStore.completeAuth(code, state);

    // Redirect to home page
    router.push('/');
  } catch (err) {
    console.error('Authentication failed:', err);
    error.value = err instanceof Error ? err.message : 'Authentication failed';
    isProcessing.value = false;
  }
});
</script>

<template>
  <div class="view-container">
    <div v-if="isProcessing" class="processing">
      <div class="spinner"></div>
      <h1>Connecting to Spotify</h1>
      <p>Please wait while we authenticate your account...</p>
    </div>

    <div v-else-if="error" class="error">
      <i class="pi pi-exclamation-circle"></i>
      <h1>Authentication Failed</h1>
      <p>{{ error }}</p>
      <button @click="router.push('/')" class="back-button">
        Return to Home
      </button>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 154px); /* Full height minus header and player */
}

.processing,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--borderColor-default);
  border-top-color: var(--button-primary-bgColor-rest);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

h1 {
  color: var(--fgColor-default);
  font-size: 1.75rem;
  margin: 0;
}

p {
  color: var(--fgColor-muted);
  font-size: 1rem;
  max-width: 500px;
  margin: 0;
}

.error i {
  font-size: 4rem;
  color: var(--bgColor-danger-emphasis);
}

.back-button {
  padding: 10px 20px;
  background: var(--bgColor-emphasis);
  color: var(--fgColor-default);
  border: 1px solid var(--borderColor-default);
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: var(--bgColor-neutral-emphasis);
  border-color: var(--borderColor-emphasis);
}
</style>
