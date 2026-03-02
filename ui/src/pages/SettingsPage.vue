<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">
          Settings
        </h1>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col cols="12">
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </v-col>
    </v-row>

    <v-row v-else-if="error">
      <v-col cols="12">
        <v-alert type="error">
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12">
        <v-form @submit.prevent="saveSettings">
          <v-card>
            <v-card-title>Global Prompt</v-card-title>
            <v-card-text>
              <v-textarea
                v-model="settings.globalPrompt"
                label="Global Prompt"
                hint="This prompt will be injected into all AI agents for this account"
                persistent-hint
                rows="4"
              />
            </v-card-text>
          </v-card>

          <v-card class="mt-4">
            <v-card-title>AI Providers</v-card-title>
            <v-card-text>
              <v-container>
                <v-row
                  v-for="(provider, index) in settings.providers"
                  :key="index"
                  class="mb-4"
                >
                  <v-col cols="12">
                    <v-card variant="outlined">
                      <v-card-text>
                        <v-row>
                          <v-col
                            cols="12"
                            md="4"
                          >
                            <v-select
                              v-model="provider.type"
                              :items="providerTypes"
                              label="Provider Type"
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="4"
                          >
                            <v-text-field
                              v-model="provider.name"
                              label="Display Name"
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="4"
                          >
                            <v-switch
                              v-model="provider.enabled"
                              label="Enabled"
                              color="success"
                            />
                          </v-col>
                        </v-row>

                        <!-- OpenAI -->
                        <v-row v-if="provider.type === 'openai'">
                          <v-col
                            cols="12"
                            md="6"
                          >
                            <v-text-field
                              v-model="provider.openai.apiKey"
                              label="API Key"
                              type="password"
                              hint="Your OpenAI API key"
                              persistent-hint
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="3"
                          >
                            <v-text-field
                              v-model="provider.openai.organization"
                              label="Organization ID"
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="3"
                          >
                            <v-text-field
                              v-model="provider.openai.defaultModel"
                              label="Default Model"
                              placeholder="gpt-4o"
                            />
                          </v-col>
                        </v-row>

                        <!-- Anthropic -->
                        <v-row v-if="provider.type === 'anthropic'">
                          <v-col
                            cols="12"
                            md="6"
                          >
                            <v-text-field
                              v-model="provider.anthropic.apiKey"
                              label="API Key"
                              type="password"
                              hint="Your Anthropic API key"
                              persistent-hint
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="6"
                          >
                            <v-text-field
                              v-model="provider.anthropic.defaultModel"
                              label="Default Model"
                              placeholder="claude-sonnet-4-20250514"
                            />
                          </v-col>
                        </v-row>

                        <!-- Google -->
                        <v-row v-if="provider.type === 'google'">
                          <v-col
                            cols="12"
                            md="4"
                          >
                            <v-text-field
                              v-model="provider.google.apiKey"
                              label="API Key"
                              type="password"
                              hint="Your Google AI API key"
                              persistent-hint
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="4"
                          >
                            <v-text-field
                              v-model="provider.google.project"
                              label="Project ID"
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="4"
                          >
                            <v-text-field
                              v-model="provider.google.defaultModel"
                              label="Default Model"
                              placeholder="gemini-2.0-flash"
                            />
                          </v-col>
                        </v-row>

                        <!-- Mistral -->
                        <v-row v-if="provider.type === 'mistral'">
                          <v-col
                            cols="12"
                            md="6"
                          >
                            <v-text-field
                              v-model="provider.mistral.apiKey"
                              label="API Key"
                              type="password"
                              hint="Your Mistral API key"
                              persistent-hint
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="6"
                          >
                            <v-text-field
                              v-model="provider.mistral.defaultModel"
                              label="Default Model"
                              placeholder="mistral-large-latest"
                            />
                          </v-col>
                        </v-row>

                        <!-- OpenRouter -->
                        <v-row v-if="provider.type === 'openrouter'">
                          <v-col
                            cols="12"
                            md="6"
                          >
                            <v-text-field
                              v-model="provider.openrouter.apiKey"
                              label="API Key"
                              type="password"
                              hint="Your OpenRouter API key"
                              persistent-hint
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="6"
                          >
                            <v-text-field
                              v-model="provider.openrouter.defaultModel"
                              label="Default Model"
                              placeholder="openai/gpt-4o"
                            />
                          </v-col>
                        </v-row>

                        <!-- Ollama -->
                        <v-row v-if="provider.type === 'ollama'">
                          <v-col
                            cols="12"
                            md="6"
                          >
                            <v-text-field
                              v-model="provider.ollama.baseURL"
                              label="Base URL"
                              placeholder="http://localhost:11434"
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="6"
                          >
                            <v-text-field
                              v-model="provider.ollama.defaultModel"
                              label="Default Model"
                              placeholder="llama3.1"
                            />
                          </v-col>
                        </v-row>

                        <!-- Custom -->
                        <v-row v-if="provider.type === 'custom'">
                          <v-col
                            cols="12"
                            md="3"
                          >
                            <v-text-field
                              v-model="provider.custom.name"
                              label="Provider Name"
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="3"
                          >
                            <v-text-field
                              v-model="provider.custom.baseURL"
                              label="Base URL"
                              placeholder="https://api.example.com/v1"
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="3"
                          >
                            <v-text-field
                              v-model="provider.custom.apiKey"
                              label="API Key"
                              type="password"
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="3"
                          >
                            <v-text-field
                              v-model="provider.custom.defaultModel"
                              label="Default Model"
                            />
                          </v-col>
                        </v-row>
                      </v-card-text>
                      <v-card-actions>
                        <v-spacer />
                        <v-btn
                          color="error"
                          variant="text"
                          @click="removeProvider(index)"
                        >
                          Remove
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </v-row>

                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="addProvider"
                >
                  Add Provider
                </v-btn>
              </v-container>
            </v-card-text>
          </v-card>

          <v-btn
            color="primary"
            type="submit"
            class="mt-4"
            :loading="saving"
          >
            Save Settings
          </v-btn>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

const providerTypes = [
  { title: 'OpenAI', value: 'openai' },
  { title: 'Anthropic', value: 'anthropic' },
  { title: 'Google', value: 'google' },
  { title: 'Mistral', value: 'mistral' },
  { title: 'OpenRouter', value: 'openrouter' },
  { title: 'Ollama', value: 'ollama' },
  { title: 'Custom', value: 'custom' }
]

const settings = ref<any>({
  globalPrompt: '',
  providers: []
})

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

async function fetchSettings () {
  try {
    loading.value = true
    error.value = null

    const response = await fetch(`${apiUrl}/api/settings`, {
      credentials: 'include'
    })

    if (response.status === 200) {
      const data = await response.json()
      if (data.results && data.results.length > 0) {
        settings.value = data.results[0]
      } else {
        settings.value = {
          globalPrompt: '',
          providers: []
        }
      }
    } else if (response.status === 404) {
      settings.value = {
        globalPrompt: '',
        providers: []
      }
    } else {
      throw new Error('Failed to load settings')
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function saveSettings () {
  try {
    saving.value = true
    error.value = null

    const method = settings.value._id ? 'PATCH' : 'POST'
    const url = settings.value._id
      ? `${apiUrl}/api/settings/${settings.value._id}`
      : `${apiUrl}/api/settings`

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(settings.value)
    })

    if (!response.ok) {
      throw new Error('Failed to save settings')
    }

    const data = await response.json()
    settings.value = data
  } catch (e: any) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

function addProvider () {
  settings.value.providers.push({
    type: 'openai',
    name: '',
    enabled: true,
    openai: {
      apiKey: '',
      defaultModel: ''
    }
  })
}

function removeProvider (index: number) {
  settings.value.providers.splice(index, 1)
}

onMounted(() => {
  fetchSettings()
})
</script>
