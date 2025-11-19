import { ref, watch } from 'vue';

type Theme = 'light' | 'dark';

const currentTheme = ref<Theme>('light');

export const useTheme = () => {
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
  };

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
  };

  // Watch for theme changes and update DOM
  watch(currentTheme, (newTheme) => {
    const html = document.documentElement;
    html.setAttribute('data-color-mode', newTheme);

    if (newTheme === 'dark') {
      html.setAttribute('data-dark-theme', 'dark');
      html.removeAttribute('data-light-theme');
    } else {
      html.setAttribute('data-light-theme', 'light');
      html.removeAttribute('data-dark-theme');
    }
  }, { immediate: true });

  return {
    currentTheme,
    toggleTheme,
    setTheme,
  };
};
