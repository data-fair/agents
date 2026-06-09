# Conclusion

## Limites connues

La modération opère uniquement sur les messages entrants de l'utilisateur. Elle ne couvre pas les sorties générées par le modèle ni l'injection indirecte via des données tierces (contenu de jeux de données réintégré dans le contexte). Les équipes sécurité doivent prendre en compte ces vecteurs dans leur évaluation de risque.

Un stockage serveur des traces existe, mais il est désactivé par défaut : il requiert à la fois l'activation explicite par un administrateur et le consentement de l'utilisateur concerné, et les traces conservées sont automatiquement supprimées au bout de 30 jours. La capacité d'audit post-incident dépend donc de l'activation de cet enregistrement et reste bornée à cette fenêtre de rétention.

La **passerelle** applique une politique d'échec rapide (*fail-fast*) : en cas d'indisponibilité du **fournisseur LLM** sélectionné, la requête échoue immédiatement. Il n'existe pas à ce stade de mécanisme de reprise automatique ni de bascule transparente vers un fournisseur de secours. La continuité de service repose donc sur la disponibilité du fournisseur configuré.

## Pistes d'évolution

Ces éléments représentent des directions de travail possibles, et non des fonctionnalités planifiées ou livrées.

L'extension de la modération aux réponses du modèle et à l'injection indirecte via des données constitue une amélioration naturelle. Des optimisations de mise en cache de prompt permettraient par ailleurs de réduire la latence et les coûts sur les conversations récurrentes.

## Note de lecture

Ce document vise à donner une compréhension synthétique de l'architecture, des protocoles, des mécanismes d'intégration et de la posture de sécurité du service. Toute évaluation détaillée — technique, sécurité ou contractuelle — doit s'appuyer sur la lecture attentive des chapitres précédents et sur les échanges directs avec les équipes concernées.
