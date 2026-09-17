<!-- ui/src/components/dev/WorkflowWizard.vue -->
<template>
  <v-card
    variant="tonal"
    class="pa-3"
  >
    <v-stepper
      v-model="step"
      flat
    >
      <v-stepper-header>
        <v-stepper-item
          value="type"
          :title="t('stepType')"
          :subtitle="type ?? undefined"
        />
        <v-divider />
        <v-stepper-item
          value="title"
          :title="t('stepTitle')"
        />
        <v-divider />
        <v-stepper-item
          value="confirm"
          :title="t('stepConfirm')"
        />
      </v-stepper-header>
      <v-stepper-window>
        <v-stepper-window-item value="type">
          <v-btn
            class="mr-2"
            :color="type === 'note' ? 'primary' : undefined"
            @click="selectType('note')"
          >
            Note
          </v-btn>
          <v-btn
            :color="type === 'list' ? 'primary' : undefined"
            @click="selectType('list')"
          >
            List
          </v-btn>
        </v-stepper-window-item>
        <v-stepper-window-item value="title">
          <v-text-field
            v-model="title"
            :label="t('title')"
            variant="outlined"
            density="compact"
          />
          <v-btn
            :disabled="!titleValid"
            @click="advance()"
          >
            Continue
          </v-btn>
        </v-stepper-window-item>
        <v-stepper-window-item value="confirm">
          <p class="mb-2">
            {{ t('recap', { type, title }) }}
          </p>
          <v-btn
            color="primary"
            @click="create()"
          >
            Create
          </v-btn>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </v-card>
</template>

<i18n lang="yaml">
fr:
  stepType: Type
  stepTitle: Titre
  stepConfirm: Confirmation
  title: Titre
  recap: "Créer {type} « {title} » ?"
en:
  stepType: Type
  stepTitle: Title
  stepConfirm: Confirmation
  title: Title
  recap: "Create {type} \"{title}\"?"
</i18n>

<script lang="ts" setup>
/**
 * The data-fair creation wizard in miniature: three steps driven either by clicking or by
 * the page tools. Tool results are one-line acknowledgements on purpose — what the screen
 * shows reaches the model through the keyed `wizard` state appended to those results.
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentTool, useAgentState } from '@data-fair/lib-vue-agents'

const emit = defineEmits<{ created: [item: { id: string, title: string }] }>()
const { t } = useI18n()

type ItemType = 'note' | 'list'
const step = ref<'type' | 'title' | 'confirm'>('type')
const type = ref<ItemType | null>(null)
const title = ref('')
const titleValid = computed(() => title.value.trim().length >= 4)

useAgentState('wizard', () => ({ step: step.value, type: type.value ?? 'none', title: title.value }))

function selectType (value: ItemType) {
  type.value = value
  step.value = 'title'
}
function advance (): string | null {
  if (!type.value) return 'Select a type first.'
  if (!titleValid.value) return 'The title must be at least 4 characters.'
  step.value = 'confirm'
  return null
}
function create () {
  emit('created', { id: `item-${Date.now().toString(36)}`, title: title.value })
}

onMounted(() => {
  useAgentTool({
    name: 'select_type',
    title: 'Select type',
    description: 'Choose the item type (note or list) and move to the title step',
    inputSchema: { type: 'object', properties: { type: { type: 'string', enum: ['note', 'list'] } }, required: ['type'] } as any,
    execute: (args: { type: ItemType }) => {
      selectType(args.type)
      return `Type set to ${args.type}.`
    }
  } as any)
  useAgentTool({
    name: 'set_title',
    title: 'Set title',
    description: 'Set the item title (at least 4 characters)',
    inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] } as any,
    execute: (args: { title: string }) => {
      title.value = args.title
      return `Title set to "${args.title}".`
    }
  } as any)
  useAgentTool({
    name: 'advance',
    title: 'Advance',
    description: 'Move to the confirmation step; the user then clicks Create themselves',
    inputSchema: { type: 'object', properties: {} } as any,
    execute: () => advance() ?? 'On the confirmation step.'
  } as any)
})
</script>
