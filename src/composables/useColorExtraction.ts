import { ref, watch, type Ref } from 'vue';

export function useColorExtraction(imageUrl: Ref<string | undefined>) {
  const dominantColor = ref<string>('');
  const isLoading = ref(false);

  const extractColor = async (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve('');
          return;
        }

        // Use small canvas for performance
        const size = 10;
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(img, 0, 0, size, size);

        try {
          const imageData = ctx.getImageData(0, 0, size, size);
          const data = imageData.data;

          // Collect colors with frequency
          const colorCounts: Record<string, number> = {};

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i] ?? 0;
            const g = data[i + 1] ?? 0;
            const b = data[i + 2] ?? 0;

            // Skip very dark or very light colors
            const brightness = (r + g + b) / 3;
            if (brightness < 30 || brightness > 220) continue;

            // Quantize colors to reduce variations
            const qr = Math.round(r / 32) * 32;
            const qg = Math.round(g / 32) * 32;
            const qb = Math.round(b / 32) * 32;

            const key = `${qr},${qg},${qb}`;
            colorCounts[key] = (colorCounts[key] || 0) + 1;
          }

          // Find most frequent color
          let maxCount = 0;
          let dominantRgb = '128,128,128';

          for (const [color, count] of Object.entries(colorCounts)) {
            if (count > maxCount) {
              maxCount = count;
              dominantRgb = color;
            }
          }

          const parts = dominantRgb.split(',').map(Number);
          const r = parts[0] ?? 128;
          const g = parts[1] ?? 128;
          const b = parts[2] ?? 128;
          resolve(`rgb(${r}, ${g}, ${b})`);
        } catch {
          resolve('');
        }
      };

      img.onerror = () => resolve('');
      img.src = url;
    });
  };

  watch(imageUrl, async (newUrl) => {
    if (!newUrl) {
      dominantColor.value = '';
      return;
    }

    isLoading.value = true;
    dominantColor.value = await extractColor(newUrl);
    isLoading.value = false;
  }, { immediate: true });

  return {
    dominantColor,
    isLoading
  };
}
