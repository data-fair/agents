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
    class="text-body-medium text-medium-emphasis pa-2"
  >
    {{ t('noData') }}
  </div>
</template>

<i18n lang="yaml">
fr:
  cost: Consommation
  noData: Aucune donnée pour ce jour
  credits: crédits
en:
  cost: Consumption
  noData: No data for this day
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
}>()

const { t, locale } = useI18n()

const formatCost = (amount: number) => formatCredits(locale.value, amount)

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
        label: (ctx: any) => `${formatCost(ctx.raw as number)} ${t('credits')}`
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        callback: (val: string | number) => formatCost(Number(val))
      }
    },
    y: {
      grid: { display: false }
    }
  }
}))
</script>
