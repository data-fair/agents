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
  cost: Coût
  noData: Aucune donnée pour ce jour
en:
  cost: Cost
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
  userLabel: string
  cost: number
}

const props = defineProps<{
  users: UserEntry[]
  currency?: string
}>()

const { t, locale } = useI18n()

const currencyCode = computed(() => props.currency || 'EUR')
const costFormatter = computed(() => new Intl.NumberFormat(locale.value, { style: 'currency', currency: currencyCode.value }))

const chartData = computed(() => ({
  labels: props.users.map(u => u.userLabel),
  datasets: [{
    label: t('cost'),
    data: props.users.map(u => u.cost),
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
        label: (ctx: any) => costFormatter.value.format(ctx.raw as number)
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        callback: (val: string | number) => costFormatter.value.format(Number(val))
      }
    },
    y: {
      grid: { display: false }
    }
  }
}))
</script>
