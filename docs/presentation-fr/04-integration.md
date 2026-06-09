## Scénarios d'intégration

Le service s'embarque selon trois modes, qui partagent la même passerelle mais diffèrent par leur présentation, leur périmètre d'outils et leur configuration.

### Assistant global du back-office data-fair

Dans l'interface d'administration, l'assistant prend la forme d'un tiroir latéral accessible depuis n'importe quelle page, activable par compte. Il dispose d'un jeu d'outils étendu couvrant la navigation applicative, l'exploration et l'interrogation des jeux de données, la gestion des applications et visualisations, la géolocalisation et des aides à la création (suggestions de schémas, titres, descriptions). Des boutons d'aide contextuels, placés sur les pages clés comme la création d'un jeu de données, ouvrent le tiroir en lui transmettant le contexte courant, pour une assistance ciblée sans reformulation.

### Assistant global d'un portail public

Sur un portail, l'assistant s'expose en tiroir latéral ou en menu flottant, au choix. Tout son comportement est piloté par la configuration du portail : activation globale, type d'affichage et position du bouton, visibilité par rôle (de l'anonyme à l'administrateur), et prompt système propre au portail qui en oriente la thématique et le ton. Les outils sont orientés contenu : jeux de données publiés, navigation par adresses lisibles, événements, actualités et réutilisations. L'assistant n'opère que sur les ressources visibles par l'utilisateur courant, dans le respect des droits du portail.

### Élément de page confiné

Ce mode n'utilise ni tiroir ni superposition : le chat s'intègre directement dans le flux d'une page de portail, comme un bloc de contenu. Chaque bloc se configure indépendamment — prompt système propre, visibilité par rôle, hauteur — et surtout peut être restreint à un ou plusieurs **jeux de données focalisés** qui bornent son périmètre de recherche. Une consigne de confinement lui interdit de proposer une navigation hors de la page sauf demande explicite, ce qui maintient le bloc centré sur son sujet.

### Configuration des fournisseurs

La passerelle n'impose aucun fournisseur par défaut. Chaque compte déclare les siens et leur affecte des modèles par rôle (voir la section Architecture). Plusieurs familles sont prises en charge nativement : OpenAI, Anthropic, Google, Mistral, OpenRouter, Ollama pour un déploiement local, ainsi que tout point d'accès compatible OpenAI (vLLM, LM Studio, Scaleway, Together, Groq, etc.). Plusieurs fournisseurs peuvent coexister dans un même compte.

Les clés d'API sont chiffrées au repos et ne sont jamais retournées en clair : à la consultation, elles apparaissent masquées, et seule la saisie d'une nouvelle valeur déclenche un rechiffrement.
