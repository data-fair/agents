// The edit form of one memory document in the admin panel (ui/src/components/AgentMemoryPanel.vue).
// The path is not in it: it is the document's name, set once when a document is created. The limits
// (MEMORY_LIMITS, api/src/memory/operations.ts) are left to the server, which refuses an overlong write
// with the reason: the content's cap depends on the path, and MEMORY.md needs no description.
export default {
  $id: 'https://github.com/data-fair/agents/memory/document-form',
  'x-exports': ['vjsf'],
  'x-vjsf': { xI18n: true, pluginsImports: ['@koumoul/vjsf-markdown'] },
  'x-vjsf-locales': ['en', 'fr'],
  type: 'object',
  additionalProperties: false,
  layout: { title: null },
  properties: {
    description: {
      type: 'string',
      title: 'Description',
      'x-i18n-title': { en: 'Description', fr: 'Description' },
      description: 'One line saying what the document holds: the agent sees it in its memory index and reads the document only when it is relevant.',
      'x-i18n-description': {
        en: 'One line saying what the document holds: the agent sees it in its memory index and reads the document only when it is relevant.',
        fr: "Une ligne disant ce que contient le document : l'agent la voit dans l'index de sa mémoire et ne lit le document que lorsqu'il est pertinent."
      },
      layout: { comp: 'textarea', props: { rows: 2, autoGrow: true } }
    },
    content: {
      type: 'string',
      title: 'Content',
      'x-i18n-title': { en: 'Content', fr: 'Contenu' },
      layout: 'markdown'
    }
  }
}
