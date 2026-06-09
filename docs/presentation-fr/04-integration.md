# Scénarios d'intégration

Ce chapitre décrit les trois modes d'intégration principaux de la passerelle, ainsi que le mécanisme de configuration des fournisseurs et des modèles.

## Assistant global — back-office data-fair

Dans l'interface d'administration de data-fair, la passerelle se présente sous la forme d'un **tiroir latéral** accessible depuis n'importe quelle page du back-office. L'activation de cet assistant est contrôlée par un réglage propre à chaque compte (utilisateur ou organisation) ; un compte peut donc disposer de son propre assistant indépendamment des autres.

L'assistant global du back-office bénéficie d'un jeu d'outils étendu couvrant l'ensemble des fonctionnalités de la plateforme :

- **Navigation applicative** : parcours des sections du back-office, accès aux ressources par identifiant.
- **Exploration et interrogation de jeux de données** : recherche dans le catalogue, lecture de métadonnées, interrogation des données tabulaires.
- **Gestion des applications et visualisations** : création, duplication, configuration et publication de visualisations.
- **Géolocalisation** : enrichissement d'adresses, conversion de coordonnées, calculs de proximité.
- **Aides à la création** : suggestions de schémas, de titres et de descriptions à partir du contenu existant.

Des **boutons d'aide contextuels** sont positionnés sur certaines pages clés (création d'un jeu de données, configuration d'une application…). Un clic sur l'un de ces boutons ouvre le tiroir de l'assistant en transmettant automatiquement le contexte de la page en cours, ce qui permet à l'utilisateur d'obtenir une assistance ciblée sans reformuler sa situation.

## Assistant global — portail de données public

Sur les portails de données publics, l'assistant peut être exposé selon **deux présentations au choix** : tiroir latéral ou menu flottant. La présentation, ainsi que l'ensemble des paramètres de comportement, sont pilotés par la configuration du portail :

- **Activation globale** : l'assistant peut être activé ou désactivé pour l'ensemble du portail.
- **Type d'affichage** : tiroir latéral ou bouton flottant positionnable (coin de l'écran).
- **Visibilité par rôle** : l'assistant peut être limité aux utilisateurs authentifiés, aux contributeurs, aux administrateurs, ou ouvert aux visiteurs anonymes.
- **Prompt système propre au portail** : chaque portail peut définir une consigne d'introduction spécifique qui oriente le comportement de l'assistant (thématique, tonalité, périmètre éditorial).
- **Position du bouton d'ouverture** : configurable pour s'adapter à la charte graphique du portail.

Les outils mis à disposition sont orientés contenu de portail : exploration des jeux de données publiés, navigation par adresses lisibles (slugs), consultation des événements, des actualités et des réutilisations. L'assistant opère uniquement sur les ressources visibles par l'utilisateur courant, dans le respect des droits d'accès du portail.

## Élément de page (chat confiné)

Le mode « élément de page » est une variante distincte qui n'utilise ni tiroir ni superposition flottante : le composant de chat s'intègre **directement dans le flux d'une page de portail**, comme n'importe quel autre bloc de contenu.

Chaque instance de cet élément de page est configurée indépendamment :

- **Prompt système propre au bloc** : la consigne d'introduction est spécifique à ce bloc et peut définir un rôle ou un contexte thématique précis.
- **Jeux de données focalisés** : il est possible de restreindre l'assistant à un ou plusieurs jeux de données, limitant ainsi son périmètre de recherche à des ressources prédéfinies. Cette contrainte de périmètre évite que l'assistant s'écarte du sujet du bloc.
- **Consigne de confinement à la page** : une instruction systématique indique à l'assistant de ne pas proposer de navigation vers d'autres pages, sauf demande explicite de l'utilisateur, afin de maintenir la cohérence de la page courante.
- **Visibilité par rôle** : comme pour l'assistant global, la visibilité peut être limitée à certains rôles (anonyme, authentifié, contributeur, administrateur).
- **Hauteur configurable** : la hauteur du bloc de chat est paramétrable pour s'adapter à la mise en page de la page hôte.

## Fournisseurs LLM et affectation des modèles

La passerelle ne fixe pas de fournisseur LLM par défaut. Chaque compte (utilisateur ou organisation) configure ses propres fournisseurs et l'affectation des modèles via l'interface de paramétrage dédiée.

### Fournisseurs pris en charge

Plusieurs familles de fournisseurs sont supportées nativement :

- **OpenAI** (GPT-4, GPT-5, etc.)
- **Anthropic** (Claude Haiku, Sonnet, Opus)
- **Google** (Gemini)
- **Mistral** (Mistral Large, Small, DevStral, etc.)
- **OpenRouter** (agrégateur multi-modèles)
- **Ollama** (déploiement local ou sur site)
- **Tout point d'accès compatible OpenAI** : vLLM, LM Studio, Scaleway, Together, Fireworks, Groq, DeepInfra, et tout autre service exposant l'API OpenAI standard.

Plusieurs fournisseurs peuvent coexister dans la configuration d'un même compte.

### Affectation des modèles aux rôles fonctionnels

Une fois les fournisseurs déclarés, chaque rôle fonctionnel de la passerelle se voit attribuer un modèle spécifique (voir également le chapitre Architecture) :

| Rôle fonctionnel | Fonction |
|---|---|
| **Assistant** | Interface conversationnelle principale, orchestration du flux |
| **Outils** | Exécution fiable des appels d'outils et workflows automatisés |
| **Résumeur** | Synthèse légère pour compresser le contexte et réduire les coûts |
| **Évaluateur** | Contrôle qualité des sorties, raisonnement de haut niveau |
| **Modérateur** | Classification rapide des messages entrants (injections, hors périmètre) |

Cette séparation permet d'allouer des modèles plus puissants (et plus coûteux) aux tâches qui l'exigent, et des modèles rapides et peu coûteux aux tâches de routine.

### Sécurité des clés d'API

Les clés d'API des fournisseurs sont **chiffrées au repos** dans la base de données. L'API ne retourne jamais une clé en clair : lors de la consultation des paramètres, les clés sont remplacées par une valeur masquée. Seule la saisie d'une nouvelle valeur (différente de la valeur masquée) déclenche un rechiffrement et le remplacement de la clé stockée.

## Tableau comparatif

| | **Assistant global** | **Élément de page** |
|---|---|---|
| **Présentation** | Tiroir latéral ou menu flottant, superposé au contenu | Bloc fixe intégré dans le flux de la page |
| **Visibilité** | Paramétrable par rôle (anonyme → admin) au niveau du portail ou du back-office | Paramétrable par rôle au niveau du bloc |
| **Périmètre d'outils** | Jeu d'outils complet (navigation, catalogue, gestion, géoloc…) ou orienté portail | Restreint optionnellement à des jeux de données focalisés ; confinement à la page |
| **Configuration** | Activation, type d'affichage, prompt système, position — au niveau du compte ou du portail | Prompt système, jeux de données focalisés, hauteur — au niveau du bloc de page |
