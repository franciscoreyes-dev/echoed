<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, BarChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import { useAuthStore } from '../stores/auth';
import { useLibraryStore, type TimeRange } from '../stores/library';
import { useTheme } from '../composables/useTheme';
import BaseButton from '../components/BaseButton.vue';
import DataCard from '../components/DataCard.vue';

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

const authStore = useAuthStore();
const libraryStore = useLibraryStore();
const { currentTheme } = useTheme();

const selectedTimeRange = ref<TimeRange>('medium_term');
const isLoading = ref(false);

// Fullscreen chart state
type ChartType = 'genrePie' | 'genreBar' | 'popularityBar' | 'popularityTrend' | null;
const expandedChart = ref<ChartType>(null);

const expandChart = (chart: ChartType) => {
  expandedChart.value = chart;
  document.body.style.overflow = 'hidden';
};

const closeExpand = () => {
  expandedChart.value = null;
  document.body.style.overflow = '';
};

const getExpandedChartOptions = computed(() => {
  switch (expandedChart.value) {
    case 'genrePie': return genrePieOptions.value;
    case 'genreBar': return genreBarOptions.value;
    case 'popularityBar': return popularityBarOptions.value;
    case 'popularityTrend': return popularityTrendOptions.value;
    default: return null;
  }
});

const getExpandedChartTitle = computed(() => {
  switch (expandedChart.value) {
    case 'genrePie': return 'Genre Distribution';
    case 'genreBar': return 'Top Genres';
    case 'popularityBar': return 'Track Popularity Distribution';
    case 'popularityTrend': return 'Track Popularity Trend';
    default: return '';
  }
});

// Theme-aware colors
const textColor = computed(() => currentTheme.value === 'dark' ? '#e6edf3' : '#1f2328');
const mutedColor = computed(() => currentTheme.value === 'dark' ? '#7d8590' : '#656d76');
const bgColor = computed(() => currentTheme.value === 'dark' ? '#0d1117' : '#ffffff');
const mainGreen = computed(() => currentTheme.value === 'dark' ? '#3fb950' : '#1a7f37');

// Green palette for charts
const chartColors = [
  '#3fb950', // bright green
  '#2ea043',
  '#238636',
  '#1a7f37',
  '#196c2e',
  '#0d5524',
  '#56d364',
  '#7ee787',
  '#a7f3d0',
  '#033a16'
];

const timeRangeLabels: Record<TimeRange, string> = {
  short_term: 'Last 4 Weeks',
  medium_term: 'Last 6 Months',
  long_term: 'All Time'
};

// Fetch data for selected time range (max 50 for better statistics)
const fetchData = async () => {
  if (!authStore.isAuthenticated) return;

  isLoading.value = true;
  try {
    await Promise.all([
      libraryStore.fetchTopArtists(selectedTimeRange.value, 50),
      libraryStore.fetchTopTracks(selectedTimeRange.value, 50)
    ]);
  } catch (err) {
    console.error('Failed to fetch statistics:', err);
  } finally {
    isLoading.value = false;
  }
};

// Genre data for charts
const genreData = computed(() => {
  const genreCount = new Map<string, number>();
  libraryStore.topArtists.forEach((artist) => {
    artist.genres.forEach((genre) => {
      genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
    });
  });

  return Array.from(genreCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));
});

// Pie chart options
const genrePieOptions = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)',
    backgroundColor: bgColor.value,
    borderColor: mutedColor.value,
    textStyle: {
      color: textColor.value
    }
  },
  color: chartColors,
  series: [
    {
      type: 'pie',
      radius: ['50%', '80%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 0,
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 12,
          fontWeight: 'bold',
          color: textColor.value
        }
      },
      labelLine: {
        show: false
      },
      data: genreData.value
    }
  ]
}));

// Bar chart options
const genreBarOptions = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    },
    backgroundColor: bgColor.value,
    borderColor: mutedColor.value,
    textStyle: {
      color: textColor.value
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    axisLabel: {
      color: mutedColor.value
    },
    splitLine: {
      lineStyle: {
        color: currentTheme.value === 'dark' ? '#21262d' : '#d0d7de'
      }
    }
  },
  yAxis: {
    type: 'category',
    data: genreData.value.map(g => g.name).reverse(),
    axisLabel: {
      color: textColor.value,
      fontSize: 11
    }
  },
  series: [
    {
      type: 'bar',
      data: genreData.value.map(g => g.value).reverse(),
      itemStyle: {
        color: mainGreen.value,
        borderRadius: [0, 4, 4, 0]
      }
    }
  ]
}));

// Popularity distribution
const popularityDistribution = computed(() => {
  const ranges = [
    { label: '0-20%', min: 0, max: 20, count: 0 },
    { label: '21-40%', min: 21, max: 40, count: 0 },
    { label: '41-60%', min: 41, max: 60, count: 0 },
    { label: '61-80%', min: 61, max: 80, count: 0 },
    { label: '81-100%', min: 81, max: 100, count: 0 }
  ];

  libraryStore.topTracks.forEach((track) => {
    const range = ranges.find(r => track.popularity >= r.min && track.popularity <= r.max);
    if (range) range.count++;
  });

  return ranges;
});

const popularityBarOptions = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    },
    formatter: '{b}: {c} tracks',
    backgroundColor: bgColor.value,
    borderColor: mutedColor.value,
    textStyle: {
      color: textColor.value
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: popularityDistribution.value.map(r => r.label),
    axisLabel: {
      color: mutedColor.value
    },
    axisLine: {
      lineStyle: {
        color: currentTheme.value === 'dark' ? '#21262d' : '#d0d7de'
      }
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: mutedColor.value
    },
    splitLine: {
      lineStyle: {
        color: currentTheme.value === 'dark' ? '#21262d' : '#d0d7de'
      }
    }
  },
  series: [
    {
      type: 'bar',
      data: popularityDistribution.value.map(r => r.count),
      itemStyle: {
        color: mainGreen.value,
        borderRadius: [4, 4, 0, 0]
      }
    }
  ]
}));

// Track popularity trend line chart
const popularityTrendOptions = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: bgColor.value,
    borderColor: mutedColor.value,
    textStyle: {
      color: textColor.value
    },
    formatter: (params: { dataIndex: number; value: number }[]) => {
      if (!params[0]) return '';
      const idx = params[0].dataIndex;
      const track = libraryStore.topTracks[idx];
      if (track) {
        return `#${idx + 1} ${track.name}<br/>Popularity: ${params[0].value}`;
      }
      return `Popularity: ${params[0].value}`;
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: libraryStore.topTracks.map((_, i) => `#${i + 1}`),
    axisLabel: {
      color: mutedColor.value,
      interval: 9
    },
    axisLine: {
      lineStyle: {
        color: currentTheme.value === 'dark' ? '#21262d' : '#d0d7de'
      }
    }
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 100,
    axisLabel: {
      color: mutedColor.value
    },
    splitLine: {
      lineStyle: {
        color: currentTheme.value === 'dark' ? '#21262d' : '#d0d7de'
      }
    }
  },
  series: [
    {
      type: 'line',
      data: libraryStore.topTracks.map(t => t.popularity),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        color: mainGreen.value,
        width: 2
      },
      itemStyle: {
        color: mainGreen.value
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: mainGreen.value + '40' },
            { offset: 1, color: mainGreen.value + '00' }
          ]
        }
      }
    }
  ]
}));

// Metrics
const totalArtists = computed(() => libraryStore.topArtists.length);
const totalTracks = computed(() => libraryStore.topTracks.length);
const uniqueGenres = computed(() => libraryStore.totalUniqueGenres);
const avgPopularity = computed(() => libraryStore.averagePopularity);

const changeTimeRange = async (range: TimeRange) => {
  selectedTimeRange.value = range;
  await fetchData();
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
    <div class="view-header">
      <h1>Statistics Deep Dive</h1>
      <p class="subtitle">Explore your listening patterns and discover insights</p>
    </div>

    <!-- Time Range Selector -->
    <div class="time-range-selector">
      <BaseButton
        v-for="range in (['short_term', 'medium_term', 'long_term'] as TimeRange[])"
        :key="range"
        :label="timeRangeLabels[range]"
        :severity="selectedTimeRange === range ? 'success' : 'secondary'"
        :variant="selectedTimeRange === range ? undefined : 'outlined'"
        size="small"
        @click="changeTimeRange(range)"
      />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading statistics...</p>
    </div>

    <!-- Statistics Content -->
    <div v-else class="statistics-content">
      <!-- Metrics Cards -->
      <DataCard title="Overview" icon="pi-chart-line">
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">{{ totalArtists }}</div>
            <div class="metric-label">Top Artists</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ totalTracks }}</div>
            <div class="metric-label">Top Tracks</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ uniqueGenres }}</div>
            <div class="metric-label">Unique Genres</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ avgPopularity }}</div>
            <div class="metric-label">Avg Popularity</div>
          </div>
        </div>
      </DataCard>

      <!-- Charts Section -->
      <div class="charts-grid">
        <!-- Genre Pie Chart -->
        <DataCard title="Genre Distribution" icon="pi-chart-pie">
          <template #header-actions>
            <BaseButton
              icon="pi pi-expand"
              variant="text"
              severity="secondary"
              size="small"
              @click="expandChart('genrePie')"
              :disabled="genreData.length === 0"
            />
          </template>
          <div class="chart-container">
            <v-chart
              v-if="genreData.length > 0"
              :option="genrePieOptions"
              autoresize
              class="chart"
            />
            <div v-else class="no-data">No genre data available</div>
          </div>
        </DataCard>

        <!-- Genre Bar Chart -->
        <DataCard title="Top Genres" icon="pi-align-left">
          <template #header-actions>
            <BaseButton
              icon="pi pi-expand"
              variant="text"
              severity="secondary"
              size="small"
              @click="expandChart('genreBar')"
              :disabled="genreData.length === 0"
            />
          </template>
          <div class="chart-container">
            <v-chart
              v-if="genreData.length > 0"
              :option="genreBarOptions"
              autoresize
              class="chart"
            />
            <div v-else class="no-data">No genre data available</div>
          </div>
        </DataCard>

        <!-- Popularity Distribution -->
        <DataCard title="Track Popularity Distribution" icon="pi-star" class="full-width">
          <template #header-actions>
            <BaseButton
              icon="pi pi-expand"
              variant="text"
              severity="secondary"
              size="small"
              @click="expandChart('popularityBar')"
              :disabled="totalTracks === 0"
            />
          </template>
          <div class="chart-container">
            <v-chart
              v-if="totalTracks > 0"
              :option="popularityBarOptions"
              autoresize
              class="chart"
            />
            <div v-else class="no-data">No track data available</div>
          </div>
        </DataCard>

        <!-- Popularity Trend -->
        <DataCard title="Track Popularity Trend" icon="pi-chart-line" class="full-width">
          <template #header-actions>
            <BaseButton
              icon="pi pi-expand"
              variant="text"
              severity="secondary"
              size="small"
              @click="expandChart('popularityTrend')"
              :disabled="totalTracks === 0"
            />
          </template>
          <div class="chart-container">
            <v-chart
              v-if="totalTracks > 0"
              :option="popularityTrendOptions"
              autoresize
              class="chart"
            />
            <div v-else class="no-data">No track data available</div>
          </div>
        </DataCard>
      </div>

      <!-- Fullscreen Chart Modal -->
      <Teleport to="body">
        <div v-if="expandedChart" class="fullscreen-overlay" @click.self="closeExpand">
          <div class="fullscreen-chart-container">
            <div class="fullscreen-header">
              <h2>{{ getExpandedChartTitle }}</h2>
              <BaseButton
                icon="pi pi-times"
                variant="text"
                severity="secondary"
                @click="closeExpand"
              />
            </div>
            <div class="fullscreen-chart">
              <v-chart
                v-if="getExpandedChartOptions"
                :option="getExpandedChartOptions"
                autoresize
                class="chart"
              />
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Top Genres List -->
      <DataCard title="Your Top Genres" icon="pi-tags">
        <div class="genres-list">
          <span
            v-for="(genre, index) in genreData"
            :key="genre.name"
            class="genre-tag"
          >
            <span class="genre-rank">{{ index + 1 }}</span>
            {{ genre.name }}
            <span class="genre-count">{{ genre.value }}</span>
          </span>
        </div>
      </DataCard>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.view-header {
  margin-bottom: 2rem;
}

.view-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--fgColor-default);
}

.subtitle {
  font-size: 1.1rem;
  color: var(--fgColor-muted);
  margin: 0;
}

.time-range-selector {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1.5rem;
}

.loading-state .spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--borderColor-default);
  border-top-color: var(--button-primary-bgColor-rest);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: var(--fgColor-muted);
}

.statistics-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.metric-card {
  background: var(--bgColor-muted);
  border: 1px solid var(--borderColor-default);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-ansi-green-bright);
  margin-bottom: 0.5rem;
}

.metric-label {
  font-size: 0.9rem;
  color: var(--fgColor-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.charts-grid .full-width {
  grid-column: 1 / -1;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart {
  width: 100%;
  height: 100%;
}

.no-data {
  color: var(--fgColor-muted);
  font-style: italic;
}

.genres-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.genre-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bgColor-default);
  border: 1px solid var(--borderColor-default);
  border-radius: 20px;
  font-size: 0.9rem;
  color: var(--fgColor-default);
  transition: all 0.2s;
}

.genre-tag:hover {
  border-color: var(--color-ansi-green-bright);
}

.genre-rank {
  font-weight: 600;
  color: var(--color-ansi-green-bright);
}

.genre-count {
  font-size: 0.8rem;
  color: var(--fgColor-muted);
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card.full-width {
    grid-column: 1;
  }
}
</style>

<style>
/* Fullscreen overlay styles (unscoped for Teleport) */
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.fullscreen-chart-container {
  background: var(--bgColor-default);
  border-radius: 12px;
  width: 100%;
  max-width: 1200px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fullscreen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--borderColor-default);
}

.fullscreen-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--fgColor-default);
}

.fullscreen-chart {
  flex: 1;
  padding: 1.5rem;
  min-height: 0;
}

.fullscreen-chart .chart {
  width: 100%;
  height: 100%;
}
</style>
