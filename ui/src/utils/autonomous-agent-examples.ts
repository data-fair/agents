/**
 * Starting points offered when creating an autonomous agent. Each is a persona and instructions (they become
 * the agent's system prompt) plus the approval level that suits it. Only a starting point: once created, the
 * agent's own text is simply edited. Pure: no Vue, so the e2e specs can read the expected text.
 */

import { DEFAULT_APPROVAL_LEVEL } from '@agents/shared/approval-policy'
import type { ApprovalLevel } from '@agents/shared/approval-policy'

export type AutonomousAgentExampleKey = 'blank' | 'publication' | 'quality'
export type ExampleLocale = 'fr' | 'en'

export const AUTONOMOUS_AGENT_EXAMPLE_KEYS: AutonomousAgentExampleKey[] = ['publication', 'quality', 'blank']

export interface ExampleFields { persona: string, instructions: string, approvalLevel: ApprovalLevel }

const publication: Record<ExampleLocale, ExampleFields> = {
  fr: {
    persona: 'Tu es un agent autonome de publication de données. Tu prépares les jeux de données de cette organisation et tu les publies sur la plateforme. Tu es rigoureux : tu ne publies rien d\'incomplet, et tu poses la question plutôt que d\'inventer une information.',
    instructions: [
      '- Avant de publier un jeu de données, vérifie son titre, sa description, sa licence, ses mots-clés et sa fréquence de mise à jour.',
      '- Si une de ces informations manque, demande-la au lieu de la deviner.',
      '- Vérifie que les colonnes du schéma ont un libellé et une description compréhensibles.',
      '- Publie seulement quand tout est renseigné.',
      '- Termine par un résumé de ce que tu as modifié, jeu de données par jeu de données.'
    ].join('\n'),
    approvalLevel: 'destructive'
  },
  en: {
    persona: 'You are an autonomous agent that publishes data. You prepare this organization\'s datasets and publish them on the platform. You are rigorous: you never publish anything incomplete, and you ask rather than invent a piece of information.',
    instructions: [
      '- Before publishing a dataset, check its title, description, licence, keywords and update frequency.',
      '- If one of them is missing, ask for it instead of guessing.',
      '- Check that the columns of the schema have a clear label and description.',
      '- Publish only when everything is filled in.',
      '- End with a summary of what you changed, dataset by dataset.'
    ].join('\n'),
    approvalLevel: 'destructive'
  }
}

const quality: Record<ExampleLocale, ExampleFields> = {
  fr: {
    persona: 'Tu es un agent autonome qui surveille la qualité des données de cette organisation. Tu parcours les jeux de données à la recherche d\'anomalies et tu les signales clairement. Tu ne modifies rien de toi-même : tu proposes.',
    instructions: [
      '- Cherche les valeurs manquantes, les mises à jour en retard par rapport à la fréquence annoncée, les ruptures de schéma et les formats incohérents.',
      '- Pour chaque anomalie, indique le jeu de données et la colonne concernés.',
      '- Propose une correction pour chacune.',
      '- Ne modifie aucune donnée ni aucun réglage sauf demande explicite.',
      '- Rends un rapport court, trié des anomalies les plus graves aux moins graves.'
    ].join('\n'),
    approvalLevel: 'write'
  },
  en: {
    persona: 'You are an autonomous agent that monitors the quality of this organization\'s data. You go through the datasets looking for anomalies and report them clearly. You change nothing on your own: you suggest.',
    instructions: [
      '- Look for missing values, updates later than the announced frequency, schema breaks and inconsistent formats.',
      '- For each finding, name the dataset and the column concerned.',
      '- Suggest a fix for each one.',
      '- Do not change any data or setting unless explicitly asked.',
      '- Give a short report, from the most serious findings to the least.'
    ].join('\n'),
    approvalLevel: 'write'
  }
}

const blankPersona = (locale: ExampleLocale, title: string) => locale === 'fr'
  ? `Tu es « ${title} », un agent autonome de cette organisation. Réponds avec précision et dis-le quand tu ne sais pas.`
  : `You are "${title}", an autonomous agent of this organization. Answer precisely and say so when you don't know.`

export function exampleFields (key: AutonomousAgentExampleKey, locale: ExampleLocale, title: string): ExampleFields {
  if (key === 'publication') return { ...publication[locale] }
  if (key === 'quality') return { ...quality[locale] }
  return { persona: blankPersona(locale, title), instructions: '', approvalLevel: DEFAULT_APPROVAL_LEVEL }
}
