<template>
  <div
    v-if="users.length"
    style="position: relative;"
    :style="{ height: Math.max(150, users.length * 30 + 50) + 'px' }"
  >
    <Bar
      :data="chartData"
      :options="chartOptions"
    />
  </div>
  <div
    v-else
    class="text-body-2 text-medium-emphasis pa-2"
  >
    {{ t('noData') }}
  </div>
</template>

<i18n lang="yaml">
fr:
  tokens: Tokens
  noData: Aucune donnée pour ce jour
en:
  tokens: Tokens
  noData: No data for this day
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

interface UserEntry {
  userId: string
  totalTokens: number
  inputTokens: number
  outputTokens: number
}

const props = defineProps<{
  users: UserEntry[]
}>()

const { t } = useI18n()

const chartData = computed(() => ({
  labels: props.users.map(u => u.userId),
  datasets: [{
    label: t('tokens'),
    data: props.users.map(u => u.totalTokens),
    backgroundColor: 'rgba(25, 118, 210, 0.7)',
    borderRadius: 2
  }]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${(ctx.raw as number).toLocaleString()} tokens`
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        callback: (val: string | number) => {
          const n = Number(val)
          if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
          if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
          return n
        }
      }
    },
    y: {
      grid: { display: false }
    }
  }
}))
</script>
