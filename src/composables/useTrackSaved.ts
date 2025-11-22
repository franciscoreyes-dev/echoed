import { ref } from 'vue';
import { spotifyClient } from '../services/spotify';

const savedTracks = ref<Map<string, boolean>>(new Map());
const pendingChecks = ref<Set<string>>(new Set());

export function useTrackSaved() {
  const checkIfSaved = async (trackIds: string[]): Promise<void> => {
    const uncheckedIds = trackIds.filter(
      id => !savedTracks.value.has(id) && !pendingChecks.value.has(id)
    );

    if (uncheckedIds.length === 0) return;

    uncheckedIds.forEach(id => pendingChecks.value.add(id));

    try {
      const response = await spotifyClient.checkSavedTracks(uncheckedIds);
      const results = response.data as boolean[];

      uncheckedIds.forEach((id, index) => {
        savedTracks.value.set(id, results[index] ?? false);
        pendingChecks.value.delete(id);
      });
    } catch (err) {
      console.error('Failed to check saved tracks:', err);
      uncheckedIds.forEach(id => pendingChecks.value.delete(id));
    }
  };

  const isSaved = (trackId: string): boolean => {
    return savedTracks.value.get(trackId) ?? false;
  };

  const toggleSaved = async (trackId: string): Promise<boolean> => {
    const currentState = isSaved(trackId);

    try {
      if (currentState) {
        await spotifyClient.removeSavedTracks([trackId]);
        savedTracks.value.set(trackId, false);
        return false;
      } else {
        await spotifyClient.saveTracks([trackId]);
        savedTracks.value.set(trackId, true);
        return true;
      }
    } catch (err) {
      console.error('Failed to toggle saved track:', err);
      throw err;
    }
  };

  const clearCache = () => {
    savedTracks.value.clear();
  };

  return {
    savedTracks,
    checkIfSaved,
    isSaved,
    toggleSaved,
    clearCache
  };
}
