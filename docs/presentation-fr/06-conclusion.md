## Conclusion

| Choix structurant | Ce qu'il apporte | Sa contrepartie |
|---|---|---|
| Passerelle sans état | Extensible horizontalement, aucune conversation stockée par défaut | Complexité reportée vers le navigateur |
| Orchestration côté navigateur | Conversation lisible, coûts maîtrisés par les sous-agents | Dépend des capacités du poste client |
| Outils exécutés côté client, sans écriture | Aucune élévation de privilèges possible, l'utilisateur valide tout | L'assistant ne peut pas automatiser de bout en bout |
| Modération du seul trafic non fiable | Coût et latence nuls pour les membres | Sorties et injection indirecte hors champ |
| Traces optionnelles et consenties | Conception orientée RGPD | Capacité d'audit conditionnelle, bornée à 30 jours |

Les principales limites à garder en tête tiennent à des choix assumés plus qu'à des manques. La modération ne porte que sur les messages entrants du trafic non fiable, laissant hors champ les sorties du modèle et l'injection indirecte par les données. Un enregistrement serveur des traces existe, mais désactivé par défaut, conditionné à l'activation par un administrateur et au consentement de l'utilisateur, et borné à 30 jours : la capacité d'audit en dépend. La passerelle, enfin, applique un échec rapide sans reprise ni bascule, la continuité reposant sur la disponibilité du fournisseur configuré.

Parmi les évolutions envisageables figurent l'extension de la modération aux sorties et à l'injection indirecte, ainsi que des optimisations de mise en cache de prompt pour réduire latence et coûts. Ce document restant synthétique, toute évaluation détaillée — technique, sécurité ou contractuelle — s'appuiera sur les sections précédentes et sur un échange direct avec les équipes du service.
