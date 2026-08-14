<template>
  <div
    v-if="hasData"
    style="position: relative; height: 250px;"
  >
    <Bar
      :data="chartData"
      :options="chartOptions"
    />
  </div>
  <div
    v-else
    class="text-body-medium text-medium-emphasis pa-2"
  >
    {{ t('noData') }}
  </div>
</template>

<i18n lang="yaml">
fr:
  consumption: Consommation
  noData: Aucune donnée disponible
  credits: crédits
en:
  consumption: Consumption
  noData: No data available
  credits: credits
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bar } from 'vue-chartjs'
import { formatCredits } from '~/utils/credits'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface Entry {
  label: string
  cost: number
}

const props = defineProps<{
  entries: Entry[]
}>()

const { t, locale } = useI18n()

const hasData = computed(() => props.entries.some(e => e.cost > 0))

const formatCost = (amount: number) => formatCredits(locale.value, amount)

const chartData = computed(() => {
  const labels = props.entries.map(e => e.label)
  const data = props.entries.map(e => e.cost)

  const datasets: any[] = [{
    label: t('consumption'),
    data,
    backgroundColor: 'rgba(25, 118, 210, 0.7)',
    borderRadius: 2,
    order: 2
  }]

  return { labels, datasets }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const val = ctx.raw as number
          if (val == null) return ''
          return `${ctx.dataset.label}: ${formatCost(val)} ${t('credits')}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 15 }
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: (val: string | number) => formatCost(Number(val))
      }
    }
  }
}))
</script>
