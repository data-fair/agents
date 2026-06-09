# Introduction

## Présentation du service

**data-fair/agents** est un service d'assistant IA conversationnel conçu pour être embarqué au cœur des applications de la plateforme data-fair — aussi bien dans les interfaces d'administration (back-office) que dans les portails de données publics. Il offre aux utilisateurs un point d'accès unifié à plusieurs **fournisseurs LLM** (grands modèles de langage), tels qu'OpenAI, Anthropic, Google, Mistral, Scaleway ou tout serveur compatible avec l'API OpenAI, sans que l'application hôte n'ait à gérer directement ces intégrations.

Le service ne se limite pas à un simple relais de conversation : il met en œuvre le **tool-use** (appel d'outils), permettant à l'assistant de déclencher des actions concrètes — interroger un jeu de données, naviguer dans l'application, récupérer des métadonnées — en réponse aux demandes de l'utilisateur. Cette capacité est au cœur de la proposition de valeur du service.

## Proposition de valeur

data-fair/agents vise à réduire la distance entre l'utilisateur et la donnée. Concrètement, il permet :

- **L'exploration et l'analyse de jeux de données** : l'utilisateur peut poser des questions en langage naturel sur des données structurées, obtenir des filtrages, des agrégations ou des mises en contexte sans manipuler directement les interfaces techniques.
- **La navigation guidée dans l'application** : l'assistant connaît les fonctionnalités disponibles et peut orienter l'utilisateur vers les bons écrans ou lui expliquer des concepts métier.
- **L'assistance à la configuration** : dans le back-office, l'assistant peut accompagner les opérateurs dans des tâches de paramétrage, en vérifiant les valeurs saisies ou en suggérant des options adaptées au contexte.

## À qui s'adresse ce document

Ce document s'adresse à deux profils :

- Les **intégrateurs** qui souhaitent embarquer data-fair/agents dans une application data-fair existante ou dans un portail de données. Ils trouveront ici une description des mécanismes d'intégration, du modèle de découverte d'outils et des flux de communication.
- Les **experts sécurité** côté client qui évaluent le service avant tout déploiement en production. Ce document leur fournit une vue synthétique de l'architecture, des flux de données, des surfaces d'exposition et des contrôles d'accès mis en place.

Il s'agit d'une présentation conceptuelle et synthétique : aucun chemin de code source ni détail d'implémentation interne ne sera mentionné.

## Principes structurants

Les chapitres suivants développent quatre principes fondateurs du service :

1. **Une passerelle sans état** : data-fair/agents expose une interface compatible OpenAI qui joue le rôle de passerelle (gateway) entre l'application hôte et les fournisseurs LLM configurés. Cette passerelle gère l'authentification, la sélection du fournisseur, la limitation de débit et la traçabilité, sans conserver d'état de conversation côté serveur.

2. **Une orchestration côté navigateur** : la logique d'orchestration réside dans le navigateur de l'utilisateur, pas sur le serveur. L'**assistant global** pilote la conversation de haut niveau et délègue les tâches spécialisées à des **sous-agents** — des instances LLM distinctes, chacune dotée d'un périmètre d'outils précis.

3. **Un embarquement par iframe avec découverte dynamique d'outils** : l'assistant est rendu dans une iframe isolée, intégrée dans l'application hôte. Les **éléments de page** — composants de l'application parente — s'enregistrent dynamiquement auprès de l'assistant pour lui exposer leurs capacités sous forme d'outils. Cette architecture garantit l'isolation tout en permettant une interaction fine avec le contexte applicatif.

4. **Une configuration multi-fournisseurs** : les administrateurs configurent les fournisseurs LLM disponibles et assignent des modèles à des rôles fonctionnels distincts (assistant principal, agent outillé, résumeur, évaluateur, modérateur). Cette séparation permet d'optimiser le rapport qualité/coût selon les usages.

## Terminologie

Les termes suivants sont utilisés de manière cohérente dans l'ensemble du document :

| Terme | Définition |
|---|---|
| **Passerelle** (*gateway*) | Composant serveur qui relaie les requêtes LLM vers les fournisseurs configurés |
| **Fournisseur LLM** | Service externe fournissant un modèle de langage (OpenAI, Anthropic, Mistral, etc.) |
| **Assistant global** | Instance LLM principale gérant le fil conversationnel de haut niveau |
| **Sous-agents** | Instances LLM spécialisées, pilotées par l'assistant global pour des tâches outillées |
| **Élément de page** | Composant de l'application hôte exposant des outils à l'assistant via l'iframe |
