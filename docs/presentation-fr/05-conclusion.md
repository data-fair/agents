## Conclusion

| Choix structurant | Ce qu'il apporte | Sa contrepartie |
|---|---|---|
| Passerelle sans état | Extensible horizontalement, aucune conversation stockée par défaut | Complexité reportée vers le navigateur |
| Orchestration côté navigateur | Conversation lisible, coûts maîtrisés par les sous-agents | Dépend des capacités du poste client |
| Outils exécutés côté client, sans écriture | Aucune élévation de privilèges possible, l'utilisateur valide tout | L'assistant ne peut pas automatiser de bout en bout |
| Modération du seul trafic non fiable | Coût et latence nuls pour les membres | Sorties et injection indirecte hors champ |
| Traces optionnelles et consenties | Conception orientée RGPD | Capacité d'audit conditionnelle, bornée à 30 jours |

Ces choix dessinent un service volontairement mince, et c'est sa principale force. L'intelligence ne réside pas dans agents lui-même mais à ses deux extrémités : d'un côté le **fournisseur de modèle**, librement configuré par chaque compte ; de l'autre l'**outillage contextuel**, déclaré par les pages hôtes. Entre les deux, le service se réduit pour l'essentiel à une passerelle et à une interface de chat. Cette généricité rend le code d'orchestration indépendant du fournisseur comme des applications : on absorbe l'évolution rapide des modèles, ou on ouvre l'assistant à une nouvelle application, sans rien réécrire.

Le pari sur **WebMCP** prolonge cette logique vers l'avenir. Les outils qu'une page expose aujourd'hui à l'assistant ne lui sont pas réservés : déclarés selon un standard ouvert, ils pourront demain être consommés par d'autres agents — y compris des agents personnels que l'utilisateur amène avec lui. L'effort d'outillage investi sur la plateforme se capitalise ainsi bien au-delà du seul assistant embarqué.

La posture de sécurité découle de la même sobriété : plutôt que d'empiler les filtres, le service réduit la surface. Les outils s'exécutent dans le navigateur avec les seuls droits de l'utilisateur, n'écrivent jamais sans sa validation, et la passerelle ne conserve aucune conversation par défaut. Les responsabilités sont nettement réparties — l'opérateur choisit son fournisseur et porte ses obligations réglementaires, la plateforme borne le périmètre d'action, l'utilisateur garde la main sur tout effet persistant —, ce qui rend l'ensemble plus simple à raisonner et à auditer qu'un assemblage de protections opaques.

Les contreparties résumées ci-dessus sont des choix assumés, et plusieurs ouvrent des perspectives concrètes : extension de la modération aux sorties et à l'injection indirecte, mise en cache de prompt pour réduire encore latence et coûts, enrichissement continu du catalogue d'outils réutilisables.
