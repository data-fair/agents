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
    class="text-body-2 text-medium-emphasis pa-2"
  >
    {{ t('noData') }}
  </div>
</template>

<i18n lang="yaml">
fr:
  consumption: Consommation
  limit: Limite
  noData: Aucune donnée disponible
en:
  consumption: Consumption
  limit: Limit
  noData: No data available
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
  dailyLimit?: number
  monthlyLimit?: number
  currency?: string
}>()

const { t, locale } = useI18n()

const hasData = computed(() => props.entries.some(e => e.cost > 0))

const limit = computed(() => props.dailyLimit ?? props.monthlyLimit ?? 0)

const currencyCode = computed(() => props.currency || 'EUR')
const costFormatter = computed(() => new Intl.NumberFormat(locale.value, { style: 'currency', currency: currencyCode.value }))

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

  // show limit line on the last bar
  if (limit.value > 0) {
    const limitData = props.entries.map((_, i) => i === props.entries.length - 1 ? limit.value : null)
    datasets.push({
      label: t('limit'),
      data: limitData,
      backgroundColor: 'rgba(244, 67, 54, 0.3)',
      borderColor: 'rgba(244, 67, 54, 0.8)',
      borderWidth: 1,
      borderRadius: 2,
      order: 1
    })
  }

  return { labels, datasets }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: limit.value > 0 },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const val = ctx.raw as number
          if (val == null) return ''
          return `${ctx.dataset.label}: ${costFormatter.value.format(val)}`
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
        callback: (val: string | number) => costFormatter.value.format(Number(val))
      }
    }
  }
}))
</script>
