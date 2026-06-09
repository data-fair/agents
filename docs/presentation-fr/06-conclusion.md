## Conclusion

Les principales limites à garder en tête tiennent à des choix assumés plus qu'à des manques. La modération ne porte que sur les messages entrants, laissant hors champ les sorties du modèle et l'injection indirecte par les données. Un enregistrement serveur des traces existe, mais désactivé par défaut, conditionné à l'activation par un administrateur et au consentement de l'utilisateur, et borné à 30 jours : la capacité d'audit en dépend. La passerelle, enfin, applique un échec rapide sans reprise ni bascule, la continuité reposant sur la disponibilité du fournisseur configuré.

Parmi les évolutions envisageables figurent l'extension de la modération aux sorties et à l'injection indirecte, ainsi que des optimisations de mise en cache de prompt pour réduire latence et coûts. Ce document restant synthétique, toute évaluation détaillée — technique, sécurité ou contractuelle — s'appuiera sur les sections précédentes et sur un échange direct avec les équipes du service.
