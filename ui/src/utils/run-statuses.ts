/**
 * A run's statuses and their words, in one place: the history's status filter and a run's summary
 * name them the same way.
 */
export const runStatuses = ['running', 'done', 'error', 'aborted', 'interrupted', 'skipped'] as const

const labels: Record<'en' | 'fr', Record<string, string>> = {
  en: { running: 'Running', done: 'Done', error: 'Error', aborted: 'Aborted', interrupted: 'Interrupted', skipped: 'Skipped' },
  fr: { running: 'En cours', done: 'Terminée', error: 'Erreur', aborted: 'Arrêtée', interrupted: 'Interrompue', skipped: 'Ignorée' }
}

export const runStatusLabel = (status: string, locale: string) =>
  (locale === 'fr' ? labels.fr : labels.en)[status] ?? status
