<script setup lang="ts">
import { useRouter } from 'vue-router';
import Avatar from 'primevue/avatar';
import BaseButton from '../components/BaseButton.vue';
import { useAuthStore } from '../stores/auth';
import { computed } from 'vue';

const router = useRouter();
const authStore = useAuthStore();

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
</script>

<template>
  <div class="view-container">
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
        <p v-if="authStore.user?.email">{{ authStore.user.email }}</p>
      </div>
    </div>

    <div class="profile-actions">
      <BaseButton
        icon="pi pi-sign-out"
        label="Logout"
        severity="danger"
        @click="handleLogout"
      />
    </div>
  </div>
</template>

<style scoped>
.view-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.profile-avatar-large {
  width: 100px;
  height: 100px;
  font-size: 2.5rem;
}

.profile-info h1 {
  color: var(--fgColor-default);
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
}

.profile-info p {
  color: var(--fgColor-muted);
  margin: 0;
}

.profile-actions {
  padding-top: 1rem;
  border-top: 1px solid var(--borderColor-default);
}
</style>
