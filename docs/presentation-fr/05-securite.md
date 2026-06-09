## Sécurité

Cette section vise une évaluation rigoureuse : elle décrit les contrôles en place et énonce honnêtement leurs limites, plutôt que de défendre une posture.

### Modèle de menace

Le service présente quatre surfaces d'entrée : les messages utilisateur (vecteur d'injection de prompt directe), le contenu des jeux de données interrogés (injection indirecte, réintroduite dans le contexte par les outils), les éléments de page de même origine qui enregistrent des outils, et les appels directs à la passerelle hors de l'interface de chat. Les contrôles ci-dessous répondent à ces surfaces avec des garanties inégales, détaillées à chaque fois.

### Authentification, rôles et quotas

La passerelle détermine à chaque requête l'identité et les droits de l'appelant, sans état de session serveur. Le rôle effectif est l'un de : anonyme, propriétaire du compte, membre de l'organisation, ou utilisateur externe. Les appels anonymes ne sont pas rejetés d'office mais exigent un jeton d'action dédié, distinct d'un jeton de session et révocable indépendamment.

Les quotas de jetons s'appliquent à deux niveaux : un plafond global au compte, et des limites par rôle (mensuelles, hebdomadaires, journalières) calculées par ratio. En complément, les appelants non fiables — anonymes et externes — partagent un pool de quota commun, qui empêche ce trafic, pris collectivement, d'épuiser la capacité du compte même lorsque chaque appelant reste sous sa propre limite.

### Chiffrement des clés d'API

Les clés des fournisseurs sont chiffrées au repos (AES-256-CBC) et ne sont jamais renvoyées en clair : l'API de configuration retourne une valeur masquée. Le navigateur n'est jamais exposé aux clés ni aux identifiants de modèles concrets — il ne transmet qu'un rôle fonctionnel, la passerelle résolvant le fournisseur côté serveur. La compromission du navigateur ou d'un script tiers ne donne donc pas accès aux clés.

### Modération des entrées

Chaque message entrant passant par l'interface de chat est classé par un modèle dédié au rôle modérateur (grossièretés, injection de prompt, usurpation d'identité, demande hors périmètre) ; une classification défavorable déclenche un refus fixe et localisé, et le message n'est pas transmis au modèle principal.

Ses limites sont structurelles et doivent être comprises avant tout déploiement. La modération est **consultative, pas une barrière de sécurité** : elle augmente le coût d'une attaque sans la rendre impossible. Elle est **fail-open** — un dépassement du délai d'attente (environ 1,5 s), une erreur de transport ou une sortie inexploitable aboutissent à « autoriser ». Un **appel direct à la passerelle** sur le rôle assistant la contourne entièrement, par conception ; la gouvernance repose alors sur l'authentification et les quotas. Son **périmètre se limite au message entrant** : ni les sorties du modèle, ni les résultats d'outils, ni le contenu des jeux de données, ni les attaques étalées sur plusieurs tours ne sont couverts. Enfin, si la première action d'un tour est un appel d'outil, celui-ci peut s'exécuter avant l'arrivée du verdict : **les effets de bord déjà produits ne sont pas annulables**.

### Isolation et confidentialité des données

L'iframe de chat est isolée du DOM de l'hôte par le mécanisme natif du navigateur, et le canal de découverte d'outils est restreint à la même origine : un contexte d'une autre origine ne peut ni enregistrer d'outils ni recevoir les messages de découverte — la frontière de confiance est la *Same-Origin Policy*. Les prompts système, qui peuvent contenir des consignes sensibles, sont transmis hors de l'URL : ils n'apparaissent donc ni dans les journaux HTTP, ni dans l'historique de navigation, ni dans les en-têtes `Referer`.

```mermaid
flowchart LR
    subgraph Browser["Navigateur (état + orchestration)"]
        IF["iframe de chat"]
        EP["Éléments de page"]
    end
    subgraph GW["Passerelle (sans état)"]
        Auth["Auth + quotas"]
        Route["Résolution fournisseur / modèle"]
    end
    subgraph LLM["Fournisseur LLM (externe)"]
        Model["Modèle de langage"]
    end
    EP -->|"BroadcastChannel (même origine)"| IF
    IF -->|"historique + outils + rôle\n(jeton de session)"| Auth
    Auth --> Route
    Route -->|"clé résolue côté serveur"| Model
    Model -->|"flux SSE"| Route
    Route --> IF
```

À chaque tour, le navigateur envoie à la passerelle l'historique reconstruit, les descripteurs d'outils actifs, les extraits de données nécessaires et le jeton de l'appelant. Le fonctionnement de la passerelle ne repose sur aucune conversation conservée côté serveur : l'historique vit dans le navigateur (l'enregistrement de traces décrit plus bas est une fonction distincte et optionnelle). Les données sont ensuite relayées au fournisseur retenu, dont les conditions (rétention, journalisation, entraînement) régissent leur traitement — le choix d'un fournisseur compatible avec les obligations réglementaires de l'opérateur (RGPD, contraintes sectorielles) relève de sa responsabilité.

### Traçabilité

La traçabilité repose sur un enregistrement **côté serveur, désactivé par défaut**. Il n'existe plus d'enregistreur « live » dans le navigateur : la passerelle consigne une entrée par requête physique adressée au fournisseur, et ces requêtes constituent la source unique de vérité — la trace complète d'une conversation est reconstruite à la consultation, sans double envoi.

L'enregistrement n'a lieu que si deux conditions sont réunies : un administrateur l'a activé au niveau du compte, et l'utilisateur concerné a donné un consentement explicite. Sans cela, rien n'est stocké. Les traces conservées sont automatiquement supprimées après 30 jours, leur lecture est réservée aux administrateurs, et chaque utilisateur peut demander l'effacement des siennes — une conception orientée RGPD (consentement, finalité d'administration, rétention bornée, droit à l'effacement). À noter : une décision de modération *ignorée* (fail-open, sans appel de modèle) ne produit aucune requête physique et n'apparaît donc pas dans la trace. La capacité d'audit dépend ainsi de l'activation de cet enregistrement et reste bornée à 30 jours.

### Limites face à l'injection de prompt

La modération réduit le risque d'**injection directe** sans l'éliminer (fail-open, contournable par appel direct). L'**injection indirecte** via les données n'est pas couverte : le contenu d'un jeu de données réintégré dans le contexte peut contenir des instructions adversariales. Les **descripteurs d'outils** fournis par un élément de page de même origine sont transmis tels quels au modèle, et un élément compromis pourrait tenter de l'influencer. Enfin, une attaque **étalée sur plusieurs tours** n'est pas détectée, chaque message étant évalué isolément. Pour un déploiement traitant des données sensibles, ces limites imposent des mesures complémentaires : contrôle de l'origine des jeux de données accessibles, revue des outils exposés, et accès au moindre privilège.
