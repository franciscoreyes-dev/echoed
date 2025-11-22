<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import { useRouter } from 'vue-router';

interface ArtistNode {
  id: string;
  name: string;
  image?: string;
  isCenter?: boolean;
}

interface Connection {
  source: string;
  target: string;
  type: 'collaboration' | 'genre';
}

interface Props {
  centerArtist: ArtistNode;
  connectedArtists: ArtistNode[];
  connections: Connection[];
}

const props = defineProps<Props>();
const router = useRouter();

const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;
let initRetryTimeout: ReturnType<typeof setTimeout> | null = null;
const circularImageCache = new Map<string, string>();

// Convert image URL to circular base64 using canvas
const createCircularImage = (imageUrl: string, size: number = 100): Promise<string> => {
  return new Promise((resolve) => {
    // Check cache first
    const cacheKey = `${imageUrl}-${size}`;
    if (circularImageCache.has(cacheKey)) {
      resolve(circularImageCache.get(cacheKey)!);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw image centered and scaled to cover
      const scale = Math.max(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      const dataUrl = canvas.toDataURL('image/png');
      circularImageCache.set(cacheKey, dataUrl);
      resolve(dataUrl);
    };

    img.onerror = () => {
      resolve(''); // Return empty on error
    };

    img.src = imageUrl;
  });
};

// Get computed colors for theme support
const getThemeColors = () => {
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  return {
    green: styles.getPropertyValue('--color-ansi-green-bright').trim() || '#2ed573',
    text: styles.getPropertyValue('--fgColor-default').trim() || '#ffffff',
    textMuted: styles.getPropertyValue('--fgColor-muted').trim() || '#8b949e',
    border: styles.getPropertyValue('--borderColor-default').trim() || '#30363d'
  };
};

const initChart = async () => {
  if (!chartRef.value) return;

  // Wait for container to have dimensions
  const { clientWidth, clientHeight } = chartRef.value;
  if (clientWidth === 0 || clientHeight === 0) {
    // Retry after a short delay (waiting for animation)
    initRetryTimeout = setTimeout(initChart, 100);
    return;
  }

  if (chart) {
    chart.dispose();
  }

  chart = echarts.init(chartRef.value);
  const colors = getThemeColors();

  // Pre-load all images as circular
  const centerImage = props.centerArtist.image
    ? await createCircularImage(props.centerArtist.image, 100)
    : '';

  const connectedImages = await Promise.all(
    props.connectedArtists.map(async (artist) => ({
      id: artist.id,
      circularImage: artist.image ? await createCircularImage(artist.image, 80) : ''
    }))
  );

  const imageMap = new Map(connectedImages.map(item => [item.id, item.circularImage]));

  const nodes = [
    {
      id: props.centerArtist.id,
      name: props.centerArtist.name,
      symbol: centerImage ? `image://${centerImage}` : 'circle',
      symbolSize: 80,
      itemStyle: {
        color: colors.green,
        shadowBlur: 20,
        shadowColor: 'rgba(46, 213, 115, 0.5)'
      },
      label: {
        show: true,
        position: 'bottom' as const,
        distance: 10,
        fontSize: 14,
        fontWeight: 'bold' as const,
        color: colors.textMuted
      }
    },
    ...props.connectedArtists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      symbol: imageMap.get(artist.id) ? `image://${imageMap.get(artist.id)}` : 'circle',
      symbolSize: 50,
      itemStyle: {
        color: colors.border
      },
      label: {
        show: true,
        position: 'bottom' as const,
        distance: 8,
        fontSize: 11,
        color: colors.textMuted
      }
    }))
  ];

  const edges = props.connections.map((conn) => ({
    source: conn.source,
    target: conn.target,
    lineStyle: {
      color: conn.type === 'collaboration' ? colors.green : colors.border,
      width: conn.type === 'collaboration' ? 2 : 1,
      curveness: 0.2
    }
  }));

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    animationDuration: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        edges: edges,
        roam: true,
        draggable: true,
        force: {
          repulsion: 300,
          gravity: 0.1,
          edgeLength: [100, 200],
          layoutAnimation: true
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4
          }
        }
      }
    ]
  };

  chart.setOption(option);

  // Handle node clicks
  chart.on('click', (params) => {
    if (params.dataType === 'node' && params.data) {
      const nodeData = params.data as { id: string };
      if (nodeData.id && nodeData.id !== props.centerArtist.id) {
        router.push(`/artist/${nodeData.id}`);
      }
    }
  });

  // Handle cursor on hover
  chart.on('mouseover', (params) => {
    if (params.dataType === 'node' && chartRef.value) {
      const nodeData = params.data as { id: string };
      if (nodeData.id !== props.centerArtist.id) {
        chartRef.value.style.cursor = 'pointer';
      }
    }
  });

  chart.on('mouseout', () => {
    if (chartRef.value) {
      chartRef.value.style.cursor = 'default';
    }
  });
};

const handleResize = () => {
  chart?.resize();
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);

  // Resize after animation completes to fill full width
  setTimeout(() => {
    chart?.resize();
  }, 500);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (initRetryTimeout) {
    clearTimeout(initRetryTimeout);
  }
  chart?.dispose();
});

watch(
  () => [props.centerArtist, props.connectedArtists, props.connections],
  () => {
    if (chart) {
      chart.dispose();
    }
    initChart();
  },
  { deep: true }
);
</script>

<template>
  <div class="artist-graph">
    <div ref="chartRef" class="chart-container"></div>
    <div class="graph-legend">
      <div class="legend-item">
        <span class="legend-line collab"></span>
        <span>Collaboration</span>
      </div>
      <div class="legend-item">
        <span class="legend-line genre"></span>
        <span>Similar Genre</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.artist-graph {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-container {
  flex: 1;
  min-height: 400px;
}

.graph-legend {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  padding: 1rem;
  color: var(--fgColor-muted);
  font-size: 0.85rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-line {
  width: 24px;
  height: 2px;
  border-radius: 1px;
}

.legend-line.collab {
  background: var(--color-ansi-green-bright);
}

.legend-line.genre {
  background: var(--borderColor-default);
}
</style>
