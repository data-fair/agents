import { ref } from 'vue'

export const context = ref<{ directoryUrl: string }>({
  directoryUrl: ''
})

export const setContext = (dirUrl: string) => {
  context.value.directoryUrl = dirUrl
}
