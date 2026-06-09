# Conclusion

## Limites connues

La modération opère uniquement sur les messages entrants de l'utilisateur. Elle ne couvre pas les sorties générées par le modèle ni l'injection indirecte via des données tierces (contenu de jeux de données réintégré dans le contexte). Les équipes sécurité doivent prendre en compte ces vecteurs dans leur évaluation de risque.

Le traçage est, par défaut, éphémère et entièrement côté client : aucune trace n'est persistée sur les serveurs en dehors d'une activation explicite par l'administrateur. Cette conception préserve la confidentialité des échanges, mais limite la capacité d'audit post-incident dans la configuration par défaut.

La **passerelle** applique une politique d'échec rapide (*fail-fast*) : en cas d'indisponibilité du **fournisseur LLM** sélectionné, la requête échoue immédiatement. Il n'existe pas à ce stade de mécanisme de reprise automatique ni de bascule transparente vers un fournisseur de secours. La continuité de service repose donc sur la disponibilité du fournisseur configuré.

## Pistes d'évolution

Ces éléments représentent des directions de travail possibles, et non des fonctionnalités planifiées ou livrées.

L'extension de la modération aux réponses du modèle et à l'injection indirecte via des données constitue une amélioration naturelle. La mise en place d'un stockage de traces côté serveur, consenti par l'administrateur, avec une rétention limitée dans le temps, pourrait répondre aux besoins d'audit des organisations soumises à des contraintes réglementaires. Des optimisations de mise en cache de prompt permettraient par ailleurs de réduire la latence et les coûts sur les conversations récurrentes.

## Note de lecture

Ce document vise à donner une compréhension synthétique de l'architecture, des protocoles, des mécanismes d'intégration et de la posture de sécurité du service. Toute évaluation détaillée — technique, sécurité ou contractuelle — doit s'appuyer sur la lecture attentive des chapitres précédents et sur les échanges directs avec les équipes concernées.
