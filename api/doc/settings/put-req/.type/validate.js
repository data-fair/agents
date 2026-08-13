/* eslint-disable */
// @ts-nocheck

import { fullFormats } from "ajv-formats/dist/formats.js";
"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/settings-put","x-exports":["validate","types","vjsf"],"title":"Settings put","x-i18n-title":{"en":"Settings","fr":"Paramètres"},"layout":{"title":null},"definitions":{"RoleQuota":{"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Unlimited","x-i18n-title":{"en":"Unlimited","fr":"Illimité"},"default":false},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Monthly Limit","x-i18n-title":{"en":"Monthly Limit","fr":"Limite mensuelle"},"description":"Weekly limit = monthly / 2, daily limit = monthly / 4","x-i18n-description":{"en":"Weekly limit = monthly / 2, daily limit = monthly / 4","fr":"Limite hebdomadaire = mensuelle / 2, limite journalière = mensuelle / 4"},"default":0,"minimum":0}}},"Model":{"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${(rootData.providers || []).map(p => p.id).join(\",\")}","itemsResults":"data.results","itemTitle":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","itemKey":"item.id"}},"properties":{"id":{"type":"string","title":"Model ID"},"name":{"type":"string","title":"Name"},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type"},"name":{"type":"string","title":"Provider Name"},"id":{"type":"string","title":"Provider ID"}}}}}},"type":"object","additionalProperties":false,"required":["providers"],"properties":{"createdAt":{"type":"string","format":"date-time","readOnly":true},"updatedAt":{"type":"string","format":"date-time","readOnly":true},"storeTraces":{"type":"boolean","title":"Store conversation traces","x-i18n-title":{"en":"Store conversation traces","fr":"Enregistrer les traces de conversation"},"description":"When enabled, conversations of consenting users are stored on the server for 30 days for admin review. Each user must explicitly accept.","x-i18n-description":{"en":"When enabled, conversations of consenting users are stored on the server for 30 days for admin review. Each user must explicitly accept.","fr":"Si activé, les conversations des utilisateurs consentants sont enregistrées sur le serveur pendant 30 jours pour relecture par un administrateur. Chaque utilisateur doit explicitement accepter."},"default":false},"owner":{"type":"object","additionalProperties":false,"required":["type","id"],"readOnly":true,"properties":{"type":{"type":"string","enum":["user","organization"]},"id":{"type":"string"},"name":{"type":"string"},"department":{"type":"string"}}},"providers":{"type":"array","title":"AI Providers","x-i18n-title":{"en":"AI Providers","fr":"Fournisseurs IA"},"layout":{"itemTitle":"item ? `${item.name || \"\"} - ${item.id.slice(0, 8)}` : \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","title":"Provider","x-i18n-title":{"en":"Provider","fr":"Fournisseur"},"unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Open AI\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Anthropic\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Google\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Mistral\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"OpenRouter\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Ollama\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}},"baseURL":{"type":"string","title":"Base URL","x-i18n-title":{"en":"Base URL","fr":"URL de base"},"default":"http://localhost:11434"}}},{"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","description":"For an API key scoped to a specific Scaleway Project, set the Project ID so requests target that project. Leave it empty to use the organization default project.","x-i18n-description":{"en":"For an API key scoped to a specific Scaleway Project, set the Project ID so requests target that project. Leave it empty to use the organization default project.","fr":"Pour une clé API liée à un Projet Scaleway spécifique, renseignez l'ID du projet afin que les requêtes ciblent ce projet. Laissez vide pour utiliser le projet par défaut de l'organisation."},"properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Scaleway\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}},"projectId":{"type":"string","title":"Project ID","x-i18n-title":{"en":"Project ID","fr":"ID du projet"},"description":"Optional. The Scaleway Project ID (UUID) the API key is scoped to. Required when the key only has access to a specific project, otherwise model listing and inference return 403.","x-i18n-description":{"en":"Optional. The Scaleway Project ID (UUID) the API key is scoped to. Required when the key only has access to a specific project, otherwise model listing and inference return 403.","fr":"Optionnel. L'ID du Projet Scaleway (UUID) auquel la clé API est liée. Requis lorsque la clé n'a accès qu'à un projet spécifique, sinon le listing des modèles et l'inférence renvoient une erreur 403."}}}},{"required":["type","name","id","enabled","baseURL"],"title":"OpenAI Compatible","x-i18n-title":{"en":"OpenAI Compatible","fr":"Compatible OpenAI"},"description":"Generic provider for any OpenAI-compatible endpoint (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). API Key is optional for unauthenticated local servers.","x-i18n-description":{"en":"Generic provider for any OpenAI-compatible endpoint (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). API Key is optional for unauthenticated local servers.","fr":"Fournisseur générique pour tout endpoint compatible OpenAI (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). La clé API est optionnelle pour les serveurs locaux sans authentification."},"properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"OpenAI Compatible\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"baseURL":{"type":"string","title":"Base URL","x-i18n-title":{"en":"Base URL","fr":"URL de base"}},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}},"compatibility":{"type":"string","title":"Compatibility Mode","x-i18n-title":{"en":"Compatibility Mode","fr":"Mode de compatibilité"},"description":"Use \"compatible\" for providers that do not support the new /v1/responses endpoint (e.g. LiteLLM, older OpenAI-compatible APIs). Leave empty for standard OpenAI behavior.","x-i18n-description":{"en":"Utilisez \"compatible\" pour les fournisseurs qui ne supportent pas le nouveau endpoint /v1/responses (ex: LiteLLM, anciennes APIs compatibles OpenAI). Laissez vide pour le comportement OpenAI standard.","fr":"Utilisez \"compatible\" pour les fournisseurs qui ne supportent pas le nouveau endpoint /v1/responses (ex: LiteLLM, anciennes APIs compatibles OpenAI). Laissez vide pour le comportement OpenAI standard."},"enum":["default","compatible"],"default":"default"}}},{"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Mock\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true}}}]}},"models":{"type":"array","title":"Models","x-i18n-title":{"en":"Models","fr":"Modèles"},"default":[],"layout":{"if":"parent.data.providers?.length","itemTitle":"item?.model ? `${item.model.name} (${item.usage?.join(\", \")})` : \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","additionalProperties":false,"required":["model","usage"],"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","x-i18n-title":{"en":"Model","fr":"Modèle"}},"usage":{"type":"array","uniqueItems":true,"minItems":1,"title":"Appropriate usages","x-i18n-title":{"en":"Appropriate usages","fr":"Usages appropriés"},"items":{"type":"string","oneOf":[{"const":"assistant","title":"Assistant"},{"const":"tools","title":"Tools","x-i18n-title":{"en":"Tools","fr":"Outils"}},{"const":"summarizer","title":"Summarizer","x-i18n-title":{"en":"Summarizer","fr":"Résumeur"}},{"const":"evaluator","title":"Evaluator","x-i18n-title":{"en":"Evaluator","fr":"Évaluateur"}},{"const":"moderator","title":"Moderator","x-i18n-title":{"en":"Moderator","fr":"Modérateur"}}]}},"multiplier":{"type":"number","minimum":0,"default":1,"title":"Credit multiplier","x-i18n-title":{"en":"Credit multiplier","fr":"Multiplicateur de crédits"},"description":"credits = (input tokens + output tokens × output weight) / 1M × multiplier","x-i18n-description":{"en":"credits = (input tokens + output tokens × output weight) / 1M × multiplier","fr":"crédits = (tokens d'entrée + tokens de sortie × poids de sortie) / 1M × multiplicateur"}}}}},"modelMapping":{"type":"object","additionalProperties":false,"title":"Model roles","x-i18n-title":{"en":"Model roles","fr":"Rôles de modèles"},"layout":{"if":"parent.data.providers?.length"},"properties":{"assistant":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Assistant","x-i18n-title":{"en":"Assistant","fr":"Assistant"},"description":"The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.","x-i18n-description":{"en":"The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.","fr":"L'interface conversationnelle principale. Équilibré pour le raisonnement, le suivi d'instructions et l'interaction naturelle. Ce modèle gère le flux de haut niveau et délègue les tâches complexes aux sous-agents."},"layout":{"comp":"autocomplete","cols":{"md":6},"getItems":{"url":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=assistant","itemsResults":"data.results","itemTitle":"`${item.name} (${item.provider.name})`","itemKey":"item.provider.id + \":\" + item.id","itemValue":"({ provider: item.provider.id, id: item.id, name: item.name })"}},"properties":{"provider":{"type":"string"},"id":{"type":"string"},"name":{"type":"string"}}},"tools":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Tools","x-i18n-title":{"en":"Tools","fr":"Outils"},"description":"The \"technician.\" Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.","x-i18n-description":{"en":"The \"technician.\" Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.","fr":"Le « technicien ». Spécialisé dans les données structurées et l'interaction avec les API. Il excelle à enchaîner plusieurs appels d'outils sans remplissage conversationnel, garantissant une haute fiabilité dans les workflows automatisés."},"layout":{"comp":"autocomplete","cols":{"md":6},"getItems":{"url":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=tools","itemsResults":"data.results","itemTitle":"`${item.name} (${item.provider.name})`","itemKey":"item.provider.id + \":\" + item.id","itemValue":"({ provider: item.provider.id, id: item.id, name: item.name })"}},"properties":{"provider":{"type":"string"},"id":{"type":"string"},"name":{"type":"string"}}},"summarizer":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Summarizer","x-i18n-title":{"en":"Summarizer","fr":"Résumeur"},"description":"A \"shorthand\" specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.","x-i18n-description":{"en":"A \"shorthand\" specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.","fr":"Un spécialiste de la « synthèse ». Optimisé pour extraire rapidement les points clés de blocs de texte petits à moyens. Il privilégie la densité d'information et la concision pour garder les fenêtres de contexte légères et les coûts bas."},"layout":{"comp":"autocomplete","cols":{"md":6},"getItems":{"url":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=summarizer","itemsResults":"data.results","itemTitle":"`${item.name} (${item.provider.name})`","itemKey":"item.provider.id + \":\" + item.id","itemValue":"({ provider: item.provider.id, id: item.id, name: item.name })"}},"properties":{"provider":{"type":"string"},"id":{"type":"string"},"name":{"type":"string"}}},"evaluator":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Evaluator","x-i18n-title":{"en":"Evaluator","fr":"Évaluateur"},"description":"The \"quality controller.\" Analyzes the assistant's logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.","x-i18n-description":{"en":"The \"quality controller.\" Analyzes the assistant's logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.","fr":"Le « contrôleur qualité ». Analyse la logique de l'assistant et les sorties des outils pour vérifier la précision et la sécurité. Il nécessite les capacités de raisonnement les plus élevées pour servir de référence fiable pour les performances du système."},"layout":{"comp":"autocomplete","cols":{"md":6},"getItems":{"url":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=evaluator","itemsResults":"data.results","itemTitle":"`${item.name} (${item.provider.name})`","itemKey":"item.provider.id + \":\" + item.id","itemValue":"({ provider: item.provider.id, id: item.id, name: item.name })"}},"properties":{"provider":{"type":"string"},"id":{"type":"string"},"name":{"type":"string"}}},"moderator":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Moderator","x-i18n-title":{"en":"Moderator","fr":"Modérateur"},"description":"The \"gatekeeper.\" Classifies each new user message for profanity, prompt-injection, persona override, and out-of-scope requests. Should be fast and cheap — it sits on the critical path to the first response token. Dedicated moderation classifiers (Llama Guard, moderation APIs) are not compatible: they use fixed taxonomies and output formats that cannot express this platform's custom policy.","x-i18n-description":{"en":"The \"gatekeeper.\" Classifies each new user message for profanity, prompt-injection, persona override, and out-of-scope requests. Should be fast and cheap — it sits on the critical path to the first response token. Dedicated moderation classifiers (Llama Guard, moderation APIs) are not compatible: they use fixed taxonomies and output formats that cannot express this platform's custom policy.","fr":"Le « gardien ». Classe chaque nouveau message utilisateur (grossièretés, injection de prompt, usurpation de persona, demandes hors périmètre). Doit être rapide et peu coûteux — il se trouve sur le chemin critique vers le premier token de réponse. Les classifieurs de modération dédiés (Llama Guard, API de modération) ne sont pas compatibles : leurs taxonomies et formats de sortie fixes ne peuvent pas exprimer la politique spécifique de cette plateforme."},"layout":{"comp":"autocomplete","cols":{"md":6},"getItems":{"url":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=moderator","itemsResults":"data.results","itemTitle":"`${item.name} (${item.provider.name})`","itemKey":"item.provider.id + \":\" + item.id","itemValue":"({ provider: item.provider.id, id: item.id, name: item.name })"}},"properties":{"provider":{"type":"string"},"id":{"type":"string"},"name":{"type":"string"}}}}},"moderation":{"type":"object","title":"Input moderation","x-i18n-title":{"en":"Input moderation","fr":"Modération des entrées"},"layout":{"if":"parent.data.providers?.length"},"default":{"enabled":false,"categories":["anonymous","external"]},"required":["enabled","categories"],"additionalProperties":false,"properties":{"enabled":{"type":"boolean","title":"Enable input moderation","x-i18n-title":{"en":"Enable input moderation","fr":"Activer la modération des entrées"},"description":"When enabled, the last user message of each request from a moderated category is classified before the model responds.","x-i18n-description":{"en":"When enabled, the last user message of each request from a moderated category is classified before the model responds.","fr":"Si activé, le dernier message utilisateur de chaque requête provenant d'une catégorie modérée est classé avant la réponse du modèle."},"default":false},"categories":{"type":"array","uniqueItems":true,"default":["anonymous","external"],"title":"Moderated user categories","x-i18n-title":{"en":"Moderated user categories","fr":"Catégories d'utilisateurs modérées"},"description":"User categories whose requests are checked by the gate when moderation is enabled.","x-i18n-description":{"en":"User categories whose requests are checked by the gate when moderation is enabled.","fr":"Catégories d'utilisateurs dont les requêtes sont vérifiées par le filtre lorsque la modération est activée."},"items":{"type":"string","oneOf":[{"const":"anonymous","title":"Anonymous","x-i18n-title":{"en":"Anonymous","fr":"Anonyme"}},{"const":"external","title":"External","x-i18n-title":{"en":"External","fr":"Externe"}},{"const":"user","title":"User","x-i18n-title":{"en":"User","fr":"Utilisateur"}},{"const":"contrib","title":"Contributor","x-i18n-title":{"en":"Contributor","fr":"Contributeur"}},{"const":"admin","title":"Admin","x-i18n-title":{"en":"Admin","fr":"Administrateur"}}]}}}},"quotas":{"type":"object","title":"Role Quotas","x-i18n-title":{"en":"Role Quotas","fr":"Quotas par rôle"},"layout":{"title":null,"if":"parent.data.providers?.length","children":[{"key":"admin","cols":{"sm":6,"md":4}},{"key":"contrib","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"user","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"external","cols":{"sm":6,"md":4}},{"key":"anonymous","cols":{"sm":6,"md":4}},{"key":"untrusted","cols":{"sm":6,"md":4}}]},"required":["admin","contrib","user","external","anonymous"],"default":{"admin":{"unlimited":true,"monthlyLimit":0},"contrib":{"unlimited":false,"monthlyLimit":0},"user":{"unlimited":false,"monthlyLimit":0},"external":{"unlimited":false,"monthlyLimit":0},"anonymous":{"unlimited":false,"monthlyLimit":0},"untrusted":{"unlimited":false,"monthlyLimit":0}},"properties":{"admin":{"$ref":"#/definitions/RoleQuota","title":"Admin quotas","x-i18n-title":{"en":"Admin quotas","fr":"Quotas administrateur"},"default":{"unlimited":true,"monthlyLimit":0}},"contrib":{"$ref":"#/definitions/RoleQuota","title":"Contributor quotas","x-i18n-title":{"en":"Contributor quotas","fr":"Quotas contributeur"},"default":{"unlimited":false,"monthlyLimit":0}},"user":{"$ref":"#/definitions/RoleQuota","title":"Simple user Quotas","x-i18n-title":{"en":"Simple user Quotas","fr":"Quotas utilisateur simple"},"default":{"unlimited":false,"monthlyLimit":0}},"external":{"$ref":"#/definitions/RoleQuota","title":"External user quotas","x-i18n-title":{"en":"External user quotas","fr":"Quotas utilisateur externe"},"default":{"unlimited":false,"monthlyLimit":0}},"anonymous":{"$ref":"#/definitions/RoleQuota","title":"Anonymous user quotas","x-i18n-title":{"en":"Anonymous user quotas","fr":"Quotas utilisateur anonyme"},"default":{"unlimited":false,"monthlyLimit":0}},"untrusted":{"$ref":"#/definitions/RoleQuota","title":"Anonymous + external pool","x-i18n-title":{"en":"Anonymous + external pool","fr":"Réserve anonyme + externe"},"description":"Aggregate cap shared by all anonymous and external usage combined, so untrusted traffic cannot consume the whole account budget. 0 = no pool cap.","x-i18n-description":{"en":"Aggregate cap shared by all anonymous and external usage combined, so untrusted traffic cannot consume the whole account budget. 0 = no pool cap.","fr":"Plafond agrégé partagé par l'ensemble des usages anonymes et externes, afin que le trafic non fiable ne puisse pas consommer tout le budget du compte. 0 = pas de plafond de réserve."},"default":{"unlimited":false,"monthlyLimit":0}}}}},"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"]};
const schema17 = {"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${(rootData.providers || []).map(p => p.id).join(\",\")}","itemsResults":"data.results","itemTitle":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","itemKey":"item.id"}},"properties":{"id":{"type":"string","title":"Model ID"},"name":{"type":"string","title":"Name"},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type"},"name":{"type":"string","title":"Provider Name"},"id":{"type":"string","title":"Provider ID"}}}}};
const schema18 = {"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Unlimited","x-i18n-title":{"en":"Unlimited","fr":"Illimité"},"default":false},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Monthly Limit","x-i18n-title":{"en":"Monthly Limit","fr":"Limite mensuelle"},"description":"Weekly limit = monthly / 2, daily limit = monthly / 4","x-i18n-description":{"en":"Weekly limit = monthly / 2, daily limit = monthly / 4","fr":"Limite hebdomadaire = mensuelle / 2, limite journalière = mensuelle / 4"},"default":0,"minimum":0}}};
const func2 = Object.prototype.hasOwnProperty;
const formats0 = fullFormats["date-time"];

function validate14(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/agents/settings-put" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.providers === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "providers"},message:"must have required property '"+"providers"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(func2.call(schema16.properties, key0))){
const err1 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.createdAt !== undefined){
let data0 = data.createdAt;
if(typeof data0 === "string"){
if(!(formats0.validate(data0))){
const err2 = {instancePath:instancePath+"/createdAt",schemaPath:"#/properties/createdAt/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
else {
const err3 = {instancePath:instancePath+"/createdAt",schemaPath:"#/properties/createdAt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.updatedAt !== undefined){
let data1 = data.updatedAt;
if(typeof data1 === "string"){
if(!(formats0.validate(data1))){
const err4 = {instancePath:instancePath+"/updatedAt",schemaPath:"#/properties/updatedAt/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
else {
const err5 = {instancePath:instancePath+"/updatedAt",schemaPath:"#/properties/updatedAt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.storeTraces !== undefined){
if(typeof data.storeTraces !== "boolean"){
const err6 = {instancePath:instancePath+"/storeTraces",schemaPath:"#/properties/storeTraces/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.owner !== undefined){
let data3 = data.owner;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.type === undefined){
const err7 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data3.id === undefined){
const err8 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key1 in data3){
if(!((((key1 === "type") || (key1 === "id")) || (key1 === "name")) || (key1 === "department"))){
const err9 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data3.type !== undefined){
let data4 = data3.type;
if(typeof data4 !== "string"){
const err10 = {instancePath:instancePath+"/owner/type",schemaPath:"#/properties/owner/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!((data4 === "user") || (data4 === "organization"))){
const err11 = {instancePath:instancePath+"/owner/type",schemaPath:"#/properties/owner/properties/type/enum",keyword:"enum",params:{allowedValues: schema16.properties.owner.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data3.id !== undefined){
if(typeof data3.id !== "string"){
const err12 = {instancePath:instancePath+"/owner/id",schemaPath:"#/properties/owner/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data3.name !== undefined){
if(typeof data3.name !== "string"){
const err13 = {instancePath:instancePath+"/owner/name",schemaPath:"#/properties/owner/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data3.department !== undefined){
if(typeof data3.department !== "string"){
const err14 = {instancePath:instancePath+"/owner/department",schemaPath:"#/properties/owner/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
}
else {
const err15 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.providers !== undefined){
let data8 = data.providers;
if(Array.isArray(data8)){
const len0 = data8.length;
for(let i0=0; i0<len0; i0++){
let data9 = data8[i0];
if(!(data9 && typeof data9 == "object" && !Array.isArray(data9))){
const err16 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
const _errs23 = errors;
let valid4 = false;
let passing0 = null;
const _errs24 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err17 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data9.name === undefined){
const err18 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data9.id === undefined){
const err19 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data9.enabled === undefined){
const err20 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data9.type !== undefined){
let data10 = data9.type;
if(typeof data10 !== "string"){
const err21 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if("openai" !== data10){
const err22 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data9.id !== undefined){
if(typeof data9.id !== "string"){
const err23 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data9.name !== undefined){
if(typeof data9.name !== "string"){
const err24 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data9.enabled !== undefined){
if(typeof data9.enabled !== "boolean"){
const err25 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data9.apiKey !== undefined){
if(typeof data9.apiKey !== "string"){
const err26 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
var _valid0 = _errs24 === errors;
if(_valid0){
valid4 = true;
passing0 = 0;
}
const _errs35 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err27 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data9.name === undefined){
const err28 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data9.id === undefined){
const err29 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data9.enabled === undefined){
const err30 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data9.type !== undefined){
let data15 = data9.type;
if(typeof data15 !== "string"){
const err31 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if("anthropic" !== data15){
const err32 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data9.id !== undefined){
if(typeof data9.id !== "string"){
const err33 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data9.name !== undefined){
if(typeof data9.name !== "string"){
const err34 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data9.enabled !== undefined){
if(typeof data9.enabled !== "boolean"){
const err35 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data9.apiKey !== undefined){
if(typeof data9.apiKey !== "string"){
const err36 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
}
var _valid0 = _errs35 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid4 = true;
passing0 = 1;
}
const _errs46 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err37 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data9.name === undefined){
const err38 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data9.id === undefined){
const err39 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data9.enabled === undefined){
const err40 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data9.type !== undefined){
let data20 = data9.type;
if(typeof data20 !== "string"){
const err41 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if("google" !== data20){
const err42 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data9.id !== undefined){
if(typeof data9.id !== "string"){
const err43 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data9.name !== undefined){
if(typeof data9.name !== "string"){
const err44 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data9.enabled !== undefined){
if(typeof data9.enabled !== "boolean"){
const err45 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data9.apiKey !== undefined){
if(typeof data9.apiKey !== "string"){
const err46 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
}
var _valid0 = _errs46 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid4 = true;
passing0 = 2;
}
const _errs57 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err47 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data9.name === undefined){
const err48 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data9.id === undefined){
const err49 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(data9.enabled === undefined){
const err50 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(data9.type !== undefined){
let data25 = data9.type;
if(typeof data25 !== "string"){
const err51 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if("mistral" !== data25){
const err52 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data9.id !== undefined){
if(typeof data9.id !== "string"){
const err53 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
if(data9.name !== undefined){
if(typeof data9.name !== "string"){
const err54 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data9.enabled !== undefined){
if(typeof data9.enabled !== "boolean"){
const err55 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
if(data9.apiKey !== undefined){
if(typeof data9.apiKey !== "string"){
const err56 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
}
var _valid0 = _errs57 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid4 = true;
passing0 = 3;
}
const _errs68 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err57 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data9.name === undefined){
const err58 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data9.id === undefined){
const err59 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data9.enabled === undefined){
const err60 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data9.type !== undefined){
let data30 = data9.type;
if(typeof data30 !== "string"){
const err61 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if("openrouter" !== data30){
const err62 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
if(data9.id !== undefined){
if(typeof data9.id !== "string"){
const err63 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data9.name !== undefined){
if(typeof data9.name !== "string"){
const err64 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(data9.enabled !== undefined){
if(typeof data9.enabled !== "boolean"){
const err65 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
if(data9.apiKey !== undefined){
if(typeof data9.apiKey !== "string"){
const err66 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
}
var _valid0 = _errs68 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid4 = true;
passing0 = 4;
}
const _errs79 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err67 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(data9.name === undefined){
const err68 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(data9.id === undefined){
const err69 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(data9.enabled === undefined){
const err70 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(data9.baseURL === undefined){
const err71 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(data9.type !== undefined){
let data35 = data9.type;
if(typeof data35 !== "string"){
const err72 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if("ollama" !== data35){
const err73 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data9.id !== undefined){
if(typeof data9.id !== "string"){
const err74 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(data9.name !== undefined){
if(typeof data9.name !== "string"){
const err75 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
if(data9.enabled !== undefined){
if(typeof data9.enabled !== "boolean"){
const err76 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(data9.apiKey !== undefined){
if(typeof data9.apiKey !== "string"){
const err77 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data9.baseURL !== undefined){
if(typeof data9.baseURL !== "string"){
const err78 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
}
var _valid0 = _errs79 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 5];
}
else {
if(_valid0){
valid4 = true;
passing0 = 5;
}
const _errs92 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err79 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(data9.name === undefined){
const err80 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(data9.id === undefined){
const err81 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(data9.enabled === undefined){
const err82 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if(data9.apiKey === undefined){
const err83 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "apiKey"},message:"must have required property '"+"apiKey"+"'"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(data9.type !== undefined){
let data41 = data9.type;
if(typeof data41 !== "string"){
const err84 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if("scaleway" !== data41){
const err85 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "scaleway"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(data9.id !== undefined){
if(typeof data9.id !== "string"){
const err86 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(data9.name !== undefined){
if(typeof data9.name !== "string"){
const err87 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
if(data9.enabled !== undefined){
if(typeof data9.enabled !== "boolean"){
const err88 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
if(data9.apiKey !== undefined){
if(typeof data9.apiKey !== "string"){
const err89 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/6/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
if(data9.projectId !== undefined){
if(typeof data9.projectId !== "string"){
const err90 = {instancePath:instancePath+"/providers/" + i0+"/projectId",schemaPath:"#/properties/providers/items/oneOf/6/properties/projectId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
}
var _valid0 = _errs92 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 6];
}
else {
if(_valid0){
valid4 = true;
passing0 = 6;
}
const _errs105 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err91 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if(data9.name === undefined){
const err92 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
if(data9.id === undefined){
const err93 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
if(data9.enabled === undefined){
const err94 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
if(data9.baseURL === undefined){
const err95 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
if(data9.type !== undefined){
let data47 = data9.type;
if(typeof data47 !== "string"){
const err96 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/7/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if("openai-compatible" !== data47){
const err97 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue: "openai-compatible"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
if(data9.id !== undefined){
if(typeof data9.id !== "string"){
const err98 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/7/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
if(data9.name !== undefined){
if(typeof data9.name !== "string"){
const err99 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/7/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
}
if(data9.enabled !== undefined){
if(typeof data9.enabled !== "boolean"){
const err100 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/7/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
if(data9.baseURL !== undefined){
if(typeof data9.baseURL !== "string"){
const err101 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/oneOf/7/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
}
if(data9.apiKey !== undefined){
if(typeof data9.apiKey !== "string"){
const err102 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/7/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
}
if(data9.compatibility !== undefined){
let data53 = data9.compatibility;
if(typeof data53 !== "string"){
const err103 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/oneOf/7/properties/compatibility/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
if(!((data53 === "default") || (data53 === "compatible"))){
const err104 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/oneOf/7/properties/compatibility/enum",keyword:"enum",params:{allowedValues: schema16.properties.providers.items.oneOf[7].properties.compatibility.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
}
}
var _valid0 = _errs105 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 7];
}
else {
if(_valid0){
valid4 = true;
passing0 = 7;
}
const _errs120 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err105 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if(data9.name === undefined){
const err106 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
if(data9.id === undefined){
const err107 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(data9.enabled === undefined){
const err108 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
if(data9.type !== undefined){
let data54 = data9.type;
if(typeof data54 !== "string"){
const err109 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/8/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if("mock" !== data54){
const err110 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
}
if(data9.id !== undefined){
if(typeof data9.id !== "string"){
const err111 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/8/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
}
if(data9.name !== undefined){
if(typeof data9.name !== "string"){
const err112 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/8/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
}
if(data9.enabled !== undefined){
if(typeof data9.enabled !== "boolean"){
const err113 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/8/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
}
}
var _valid0 = _errs120 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 8];
}
else {
if(_valid0){
valid4 = true;
passing0 = 8;
}
}
}
}
}
}
}
}
}
if(!valid4){
const err114 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
else {
errors = _errs23;
if(vErrors !== null){
if(_errs23){
vErrors.length = _errs23;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err115 = {instancePath:instancePath+"/providers",schemaPath:"#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
}
if(data.models !== undefined){
let data58 = data.models;
if(Array.isArray(data58)){
const len1 = data58.length;
for(let i1=0; i1<len1; i1++){
let data59 = data58[i1];
if(data59 && typeof data59 == "object" && !Array.isArray(data59)){
if(data59.model === undefined){
const err116 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "model"},message:"must have required property '"+"model"+"'"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
if(data59.usage === undefined){
const err117 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "usage"},message:"must have required property '"+"usage"+"'"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
for(const key2 in data59){
if(!(((key2 === "model") || (key2 === "usage")) || (key2 === "multiplier"))){
const err118 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
}
if(data59.model !== undefined){
let data60 = data59.model;
if(data60 && typeof data60 == "object" && !Array.isArray(data60)){
if(data60.id === undefined){
const err119 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
if(data60.name === undefined){
const err120 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
if(data60.provider === undefined){
const err121 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if(data60.id !== undefined){
if(typeof data60.id !== "string"){
const err122 = {instancePath:instancePath+"/models/" + i1+"/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
}
if(data60.name !== undefined){
if(typeof data60.name !== "string"){
const err123 = {instancePath:instancePath+"/models/" + i1+"/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
}
if(data60.provider !== undefined){
let data63 = data60.provider;
if(data63 && typeof data63 == "object" && !Array.isArray(data63)){
if(data63.type === undefined){
const err124 = {instancePath:instancePath+"/models/" + i1+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
if(data63.name === undefined){
const err125 = {instancePath:instancePath+"/models/" + i1+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
if(data63.id === undefined){
const err126 = {instancePath:instancePath+"/models/" + i1+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
if(data63.type !== undefined){
if(typeof data63.type !== "string"){
const err127 = {instancePath:instancePath+"/models/" + i1+"/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
}
if(data63.name !== undefined){
if(typeof data63.name !== "string"){
const err128 = {instancePath:instancePath+"/models/" + i1+"/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
}
if(data63.id !== undefined){
if(typeof data63.id !== "string"){
const err129 = {instancePath:instancePath+"/models/" + i1+"/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
}
}
else {
const err130 = {instancePath:instancePath+"/models/" + i1+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
}
}
else {
const err131 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
if(data59.usage !== undefined){
let data67 = data59.usage;
if(Array.isArray(data67)){
if(data67.length < 1){
const err132 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
const len2 = data67.length;
for(let i2=0; i2<len2; i2++){
let data68 = data67[i2];
if(typeof data68 !== "string"){
const err133 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
const _errs153 = errors;
let valid22 = false;
let passing1 = null;
const _errs154 = errors;
if("assistant" !== data68){
const err134 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/0/const",keyword:"const",params:{allowedValue: "assistant"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
var _valid1 = _errs154 === errors;
if(_valid1){
valid22 = true;
passing1 = 0;
}
const _errs155 = errors;
if("tools" !== data68){
const err135 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/1/const",keyword:"const",params:{allowedValue: "tools"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
var _valid1 = _errs155 === errors;
if(_valid1 && valid22){
valid22 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid22 = true;
passing1 = 1;
}
const _errs156 = errors;
if("summarizer" !== data68){
const err136 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/2/const",keyword:"const",params:{allowedValue: "summarizer"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
var _valid1 = _errs156 === errors;
if(_valid1 && valid22){
valid22 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid22 = true;
passing1 = 2;
}
const _errs157 = errors;
if("evaluator" !== data68){
const err137 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/3/const",keyword:"const",params:{allowedValue: "evaluator"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
var _valid1 = _errs157 === errors;
if(_valid1 && valid22){
valid22 = false;
passing1 = [passing1, 3];
}
else {
if(_valid1){
valid22 = true;
passing1 = 3;
}
const _errs158 = errors;
if("moderator" !== data68){
const err138 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/4/const",keyword:"const",params:{allowedValue: "moderator"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
var _valid1 = _errs158 === errors;
if(_valid1 && valid22){
valid22 = false;
passing1 = [passing1, 4];
}
else {
if(_valid1){
valid22 = true;
passing1 = 4;
}
}
}
}
}
if(!valid22){
const err139 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
else {
errors = _errs153;
if(vErrors !== null){
if(_errs153){
vErrors.length = _errs153;
}
else {
vErrors = null;
}
}
}
}
let i3 = data67.length;
let j0;
if(i3 > 1){
const indices0 = {};
for(;i3--;){
let item0 = data67[i3];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err140 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
break;
}
indices0[item0] = i3;
}
}
}
else {
const err141 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
}
if(data59.multiplier !== undefined){
let data69 = data59.multiplier;
if(typeof data69 == "number"){
if(data69 < 0 || isNaN(data69)){
const err142 = {instancePath:instancePath+"/models/" + i1+"/multiplier",schemaPath:"#/properties/models/items/properties/multiplier/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
}
else {
const err143 = {instancePath:instancePath+"/models/" + i1+"/multiplier",schemaPath:"#/properties/models/items/properties/multiplier/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
}
}
else {
const err144 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
}
}
else {
const err145 = {instancePath:instancePath+"/models",schemaPath:"#/properties/models/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
}
if(data.modelMapping !== undefined){
let data70 = data.modelMapping;
if(data70 && typeof data70 == "object" && !Array.isArray(data70)){
for(const key3 in data70){
if(!(((((key3 === "assistant") || (key3 === "tools")) || (key3 === "summarizer")) || (key3 === "evaluator")) || (key3 === "moderator"))){
const err146 = {instancePath:instancePath+"/modelMapping",schemaPath:"#/properties/modelMapping/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
}
if(data70.assistant !== undefined){
let data71 = data70.assistant;
if(data71 && typeof data71 == "object" && !Array.isArray(data71)){
if(data71.provider === undefined){
const err147 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"#/properties/modelMapping/properties/assistant/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
if(data71.id === undefined){
const err148 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"#/properties/modelMapping/properties/assistant/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
for(const key4 in data71){
if(!(((key4 === "provider") || (key4 === "id")) || (key4 === "name"))){
const err149 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"#/properties/modelMapping/properties/assistant/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
}
if(data71.provider !== undefined){
if(typeof data71.provider !== "string"){
const err150 = {instancePath:instancePath+"/modelMapping/assistant/provider",schemaPath:"#/properties/modelMapping/properties/assistant/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err150];
}
else {
vErrors.push(err150);
}
errors++;
}
}
if(data71.id !== undefined){
if(typeof data71.id !== "string"){
const err151 = {instancePath:instancePath+"/modelMapping/assistant/id",schemaPath:"#/properties/modelMapping/properties/assistant/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
}
if(data71.name !== undefined){
if(typeof data71.name !== "string"){
const err152 = {instancePath:instancePath+"/modelMapping/assistant/name",schemaPath:"#/properties/modelMapping/properties/assistant/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err152];
}
else {
vErrors.push(err152);
}
errors++;
}
}
}
else {
const err153 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"#/properties/modelMapping/properties/assistant/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err153];
}
else {
vErrors.push(err153);
}
errors++;
}
}
if(data70.tools !== undefined){
let data75 = data70.tools;
if(data75 && typeof data75 == "object" && !Array.isArray(data75)){
if(data75.provider === undefined){
const err154 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"#/properties/modelMapping/properties/tools/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err154];
}
else {
vErrors.push(err154);
}
errors++;
}
if(data75.id === undefined){
const err155 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"#/properties/modelMapping/properties/tools/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
for(const key5 in data75){
if(!(((key5 === "provider") || (key5 === "id")) || (key5 === "name"))){
const err156 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"#/properties/modelMapping/properties/tools/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
}
if(data75.provider !== undefined){
if(typeof data75.provider !== "string"){
const err157 = {instancePath:instancePath+"/modelMapping/tools/provider",schemaPath:"#/properties/modelMapping/properties/tools/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
}
if(data75.id !== undefined){
if(typeof data75.id !== "string"){
const err158 = {instancePath:instancePath+"/modelMapping/tools/id",schemaPath:"#/properties/modelMapping/properties/tools/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
}
if(data75.name !== undefined){
if(typeof data75.name !== "string"){
const err159 = {instancePath:instancePath+"/modelMapping/tools/name",schemaPath:"#/properties/modelMapping/properties/tools/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
}
}
else {
const err160 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"#/properties/modelMapping/properties/tools/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
}
if(data70.summarizer !== undefined){
let data79 = data70.summarizer;
if(data79 && typeof data79 == "object" && !Array.isArray(data79)){
if(data79.provider === undefined){
const err161 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"#/properties/modelMapping/properties/summarizer/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
if(data79.id === undefined){
const err162 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"#/properties/modelMapping/properties/summarizer/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
for(const key6 in data79){
if(!(((key6 === "provider") || (key6 === "id")) || (key6 === "name"))){
const err163 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"#/properties/modelMapping/properties/summarizer/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
}
if(data79.provider !== undefined){
if(typeof data79.provider !== "string"){
const err164 = {instancePath:instancePath+"/modelMapping/summarizer/provider",schemaPath:"#/properties/modelMapping/properties/summarizer/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
}
if(data79.id !== undefined){
if(typeof data79.id !== "string"){
const err165 = {instancePath:instancePath+"/modelMapping/summarizer/id",schemaPath:"#/properties/modelMapping/properties/summarizer/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
}
if(data79.name !== undefined){
if(typeof data79.name !== "string"){
const err166 = {instancePath:instancePath+"/modelMapping/summarizer/name",schemaPath:"#/properties/modelMapping/properties/summarizer/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
}
}
else {
const err167 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"#/properties/modelMapping/properties/summarizer/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
}
if(data70.evaluator !== undefined){
let data83 = data70.evaluator;
if(data83 && typeof data83 == "object" && !Array.isArray(data83)){
if(data83.provider === undefined){
const err168 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"#/properties/modelMapping/properties/evaluator/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
if(data83.id === undefined){
const err169 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"#/properties/modelMapping/properties/evaluator/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
for(const key7 in data83){
if(!(((key7 === "provider") || (key7 === "id")) || (key7 === "name"))){
const err170 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"#/properties/modelMapping/properties/evaluator/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
}
if(data83.provider !== undefined){
if(typeof data83.provider !== "string"){
const err171 = {instancePath:instancePath+"/modelMapping/evaluator/provider",schemaPath:"#/properties/modelMapping/properties/evaluator/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
}
if(data83.id !== undefined){
if(typeof data83.id !== "string"){
const err172 = {instancePath:instancePath+"/modelMapping/evaluator/id",schemaPath:"#/properties/modelMapping/properties/evaluator/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err172];
}
else {
vErrors.push(err172);
}
errors++;
}
}
if(data83.name !== undefined){
if(typeof data83.name !== "string"){
const err173 = {instancePath:instancePath+"/modelMapping/evaluator/name",schemaPath:"#/properties/modelMapping/properties/evaluator/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
}
errors++;
}
}
}
else {
const err174 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"#/properties/modelMapping/properties/evaluator/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err174];
}
else {
vErrors.push(err174);
}
errors++;
}
}
if(data70.moderator !== undefined){
let data87 = data70.moderator;
if(data87 && typeof data87 == "object" && !Array.isArray(data87)){
if(data87.provider === undefined){
const err175 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"#/properties/modelMapping/properties/moderator/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
if(data87.id === undefined){
const err176 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"#/properties/modelMapping/properties/moderator/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err176];
}
else {
vErrors.push(err176);
}
errors++;
}
for(const key8 in data87){
if(!(((key8 === "provider") || (key8 === "id")) || (key8 === "name"))){
const err177 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"#/properties/modelMapping/properties/moderator/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
}
}
if(data87.provider !== undefined){
if(typeof data87.provider !== "string"){
const err178 = {instancePath:instancePath+"/modelMapping/moderator/provider",schemaPath:"#/properties/modelMapping/properties/moderator/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err178];
}
else {
vErrors.push(err178);
}
errors++;
}
}
if(data87.id !== undefined){
if(typeof data87.id !== "string"){
const err179 = {instancePath:instancePath+"/modelMapping/moderator/id",schemaPath:"#/properties/modelMapping/properties/moderator/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err179];
}
else {
vErrors.push(err179);
}
errors++;
}
}
if(data87.name !== undefined){
if(typeof data87.name !== "string"){
const err180 = {instancePath:instancePath+"/modelMapping/moderator/name",schemaPath:"#/properties/modelMapping/properties/moderator/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err180];
}
else {
vErrors.push(err180);
}
errors++;
}
}
}
else {
const err181 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"#/properties/modelMapping/properties/moderator/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
}
}
else {
const err182 = {instancePath:instancePath+"/modelMapping",schemaPath:"#/properties/modelMapping/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err182];
}
else {
vErrors.push(err182);
}
errors++;
}
}
if(data.moderation !== undefined){
let data91 = data.moderation;
if(data91 && typeof data91 == "object" && !Array.isArray(data91)){
if(data91.enabled === undefined){
const err183 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err183];
}
else {
vErrors.push(err183);
}
errors++;
}
if(data91.categories === undefined){
const err184 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/required",keyword:"required",params:{missingProperty: "categories"},message:"must have required property '"+"categories"+"'"};
if(vErrors === null){
vErrors = [err184];
}
else {
vErrors.push(err184);
}
errors++;
}
for(const key9 in data91){
if(!((key9 === "enabled") || (key9 === "categories"))){
const err185 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err185];
}
else {
vErrors.push(err185);
}
errors++;
}
}
if(data91.enabled !== undefined){
if(typeof data91.enabled !== "boolean"){
const err186 = {instancePath:instancePath+"/moderation/enabled",schemaPath:"#/properties/moderation/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err186];
}
else {
vErrors.push(err186);
}
errors++;
}
}
if(data91.categories !== undefined){
let data93 = data91.categories;
if(Array.isArray(data93)){
const len3 = data93.length;
for(let i4=0; i4<len3; i4++){
let data94 = data93[i4];
if(typeof data94 !== "string"){
const err187 = {instancePath:instancePath+"/moderation/categories/" + i4,schemaPath:"#/properties/moderation/properties/categories/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err187];
}
else {
vErrors.push(err187);
}
errors++;
}
const _errs218 = errors;
let valid33 = false;
let passing2 = null;
const _errs219 = errors;
if("anonymous" !== data94){
const err188 = {instancePath:instancePath+"/moderation/categories/" + i4,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/0/const",keyword:"const",params:{allowedValue: "anonymous"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err188];
}
else {
vErrors.push(err188);
}
errors++;
}
var _valid2 = _errs219 === errors;
if(_valid2){
valid33 = true;
passing2 = 0;
}
const _errs220 = errors;
if("external" !== data94){
const err189 = {instancePath:instancePath+"/moderation/categories/" + i4,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/1/const",keyword:"const",params:{allowedValue: "external"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err189];
}
else {
vErrors.push(err189);
}
errors++;
}
var _valid2 = _errs220 === errors;
if(_valid2 && valid33){
valid33 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid33 = true;
passing2 = 1;
}
const _errs221 = errors;
if("user" !== data94){
const err190 = {instancePath:instancePath+"/moderation/categories/" + i4,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/2/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err190];
}
else {
vErrors.push(err190);
}
errors++;
}
var _valid2 = _errs221 === errors;
if(_valid2 && valid33){
valid33 = false;
passing2 = [passing2, 2];
}
else {
if(_valid2){
valid33 = true;
passing2 = 2;
}
const _errs222 = errors;
if("contrib" !== data94){
const err191 = {instancePath:instancePath+"/moderation/categories/" + i4,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/3/const",keyword:"const",params:{allowedValue: "contrib"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err191];
}
else {
vErrors.push(err191);
}
errors++;
}
var _valid2 = _errs222 === errors;
if(_valid2 && valid33){
valid33 = false;
passing2 = [passing2, 3];
}
else {
if(_valid2){
valid33 = true;
passing2 = 3;
}
const _errs223 = errors;
if("admin" !== data94){
const err192 = {instancePath:instancePath+"/moderation/categories/" + i4,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/4/const",keyword:"const",params:{allowedValue: "admin"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err192];
}
else {
vErrors.push(err192);
}
errors++;
}
var _valid2 = _errs223 === errors;
if(_valid2 && valid33){
valid33 = false;
passing2 = [passing2, 4];
}
else {
if(_valid2){
valid33 = true;
passing2 = 4;
}
}
}
}
}
if(!valid33){
const err193 = {instancePath:instancePath+"/moderation/categories/" + i4,schemaPath:"#/properties/moderation/properties/categories/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err193];
}
else {
vErrors.push(err193);
}
errors++;
}
else {
errors = _errs218;
if(vErrors !== null){
if(_errs218){
vErrors.length = _errs218;
}
else {
vErrors = null;
}
}
}
}
let i5 = data93.length;
let j1;
if(i5 > 1){
const indices1 = {};
for(;i5--;){
let item1 = data93[i5];
if(typeof item1 !== "string"){
continue;
}
if(typeof indices1[item1] == "number"){
j1 = indices1[item1];
const err194 = {instancePath:instancePath+"/moderation/categories",schemaPath:"#/properties/moderation/properties/categories/uniqueItems",keyword:"uniqueItems",params:{i: i5, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i5+" are identical)"};
if(vErrors === null){
vErrors = [err194];
}
else {
vErrors.push(err194);
}
errors++;
break;
}
indices1[item1] = i5;
}
}
}
else {
const err195 = {instancePath:instancePath+"/moderation/categories",schemaPath:"#/properties/moderation/properties/categories/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err195];
}
else {
vErrors.push(err195);
}
errors++;
}
}
}
else {
const err196 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err196];
}
else {
vErrors.push(err196);
}
errors++;
}
}
if(data.quotas !== undefined){
let data95 = data.quotas;
if(data95 && typeof data95 == "object" && !Array.isArray(data95)){
if(data95.admin === undefined){
const err197 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "admin"},message:"must have required property '"+"admin"+"'"};
if(vErrors === null){
vErrors = [err197];
}
else {
vErrors.push(err197);
}
errors++;
}
if(data95.contrib === undefined){
const err198 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "contrib"},message:"must have required property '"+"contrib"+"'"};
if(vErrors === null){
vErrors = [err198];
}
else {
vErrors.push(err198);
}
errors++;
}
if(data95.user === undefined){
const err199 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "user"},message:"must have required property '"+"user"+"'"};
if(vErrors === null){
vErrors = [err199];
}
else {
vErrors.push(err199);
}
errors++;
}
if(data95.external === undefined){
const err200 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "external"},message:"must have required property '"+"external"+"'"};
if(vErrors === null){
vErrors = [err200];
}
else {
vErrors.push(err200);
}
errors++;
}
if(data95.anonymous === undefined){
const err201 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "anonymous"},message:"must have required property '"+"anonymous"+"'"};
if(vErrors === null){
vErrors = [err201];
}
else {
vErrors.push(err201);
}
errors++;
}
if(data95.admin !== undefined){
let data96 = data95.admin;
if(data96 && typeof data96 == "object" && !Array.isArray(data96)){
if(data96.unlimited === undefined){
const err202 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'"};
if(vErrors === null){
vErrors = [err202];
}
else {
vErrors.push(err202);
}
errors++;
}
if(data96.monthlyLimit === undefined){
const err203 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'"};
if(vErrors === null){
vErrors = [err203];
}
else {
vErrors.push(err203);
}
errors++;
}
if(data96.unlimited !== undefined){
if(typeof data96.unlimited !== "boolean"){
const err204 = {instancePath:instancePath+"/quotas/admin/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err204];
}
else {
vErrors.push(err204);
}
errors++;
}
}
if(data96.monthlyLimit !== undefined){
let data98 = data96.monthlyLimit;
if(typeof data98 == "number"){
if(data98 < 0 || isNaN(data98)){
const err205 = {instancePath:instancePath+"/quotas/admin/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err205];
}
else {
vErrors.push(err205);
}
errors++;
}
}
else {
const err206 = {instancePath:instancePath+"/quotas/admin/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err206];
}
else {
vErrors.push(err206);
}
errors++;
}
}
}
else {
const err207 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err207];
}
else {
vErrors.push(err207);
}
errors++;
}
}
if(data95.contrib !== undefined){
let data99 = data95.contrib;
if(data99 && typeof data99 == "object" && !Array.isArray(data99)){
if(data99.unlimited === undefined){
const err208 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'"};
if(vErrors === null){
vErrors = [err208];
}
else {
vErrors.push(err208);
}
errors++;
}
if(data99.monthlyLimit === undefined){
const err209 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'"};
if(vErrors === null){
vErrors = [err209];
}
else {
vErrors.push(err209);
}
errors++;
}
if(data99.unlimited !== undefined){
if(typeof data99.unlimited !== "boolean"){
const err210 = {instancePath:instancePath+"/quotas/contrib/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err210];
}
else {
vErrors.push(err210);
}
errors++;
}
}
if(data99.monthlyLimit !== undefined){
let data101 = data99.monthlyLimit;
if(typeof data101 == "number"){
if(data101 < 0 || isNaN(data101)){
const err211 = {instancePath:instancePath+"/quotas/contrib/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err211];
}
else {
vErrors.push(err211);
}
errors++;
}
}
else {
const err212 = {instancePath:instancePath+"/quotas/contrib/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err212];
}
else {
vErrors.push(err212);
}
errors++;
}
}
}
else {
const err213 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err213];
}
else {
vErrors.push(err213);
}
errors++;
}
}
if(data95.user !== undefined){
let data102 = data95.user;
if(data102 && typeof data102 == "object" && !Array.isArray(data102)){
if(data102.unlimited === undefined){
const err214 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'"};
if(vErrors === null){
vErrors = [err214];
}
else {
vErrors.push(err214);
}
errors++;
}
if(data102.monthlyLimit === undefined){
const err215 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'"};
if(vErrors === null){
vErrors = [err215];
}
else {
vErrors.push(err215);
}
errors++;
}
if(data102.unlimited !== undefined){
if(typeof data102.unlimited !== "boolean"){
const err216 = {instancePath:instancePath+"/quotas/user/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err216];
}
else {
vErrors.push(err216);
}
errors++;
}
}
if(data102.monthlyLimit !== undefined){
let data104 = data102.monthlyLimit;
if(typeof data104 == "number"){
if(data104 < 0 || isNaN(data104)){
const err217 = {instancePath:instancePath+"/quotas/user/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err217];
}
else {
vErrors.push(err217);
}
errors++;
}
}
else {
const err218 = {instancePath:instancePath+"/quotas/user/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err218];
}
else {
vErrors.push(err218);
}
errors++;
}
}
}
else {
const err219 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err219];
}
else {
vErrors.push(err219);
}
errors++;
}
}
if(data95.external !== undefined){
let data105 = data95.external;
if(data105 && typeof data105 == "object" && !Array.isArray(data105)){
if(data105.unlimited === undefined){
const err220 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'"};
if(vErrors === null){
vErrors = [err220];
}
else {
vErrors.push(err220);
}
errors++;
}
if(data105.monthlyLimit === undefined){
const err221 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'"};
if(vErrors === null){
vErrors = [err221];
}
else {
vErrors.push(err221);
}
errors++;
}
if(data105.unlimited !== undefined){
if(typeof data105.unlimited !== "boolean"){
const err222 = {instancePath:instancePath+"/quotas/external/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err222];
}
else {
vErrors.push(err222);
}
errors++;
}
}
if(data105.monthlyLimit !== undefined){
let data107 = data105.monthlyLimit;
if(typeof data107 == "number"){
if(data107 < 0 || isNaN(data107)){
const err223 = {instancePath:instancePath+"/quotas/external/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err223];
}
else {
vErrors.push(err223);
}
errors++;
}
}
else {
const err224 = {instancePath:instancePath+"/quotas/external/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err224];
}
else {
vErrors.push(err224);
}
errors++;
}
}
}
else {
const err225 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err225];
}
else {
vErrors.push(err225);
}
errors++;
}
}
if(data95.anonymous !== undefined){
let data108 = data95.anonymous;
if(data108 && typeof data108 == "object" && !Array.isArray(data108)){
if(data108.unlimited === undefined){
const err226 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'"};
if(vErrors === null){
vErrors = [err226];
}
else {
vErrors.push(err226);
}
errors++;
}
if(data108.monthlyLimit === undefined){
const err227 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'"};
if(vErrors === null){
vErrors = [err227];
}
else {
vErrors.push(err227);
}
errors++;
}
if(data108.unlimited !== undefined){
if(typeof data108.unlimited !== "boolean"){
const err228 = {instancePath:instancePath+"/quotas/anonymous/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err228];
}
else {
vErrors.push(err228);
}
errors++;
}
}
if(data108.monthlyLimit !== undefined){
let data110 = data108.monthlyLimit;
if(typeof data110 == "number"){
if(data110 < 0 || isNaN(data110)){
const err229 = {instancePath:instancePath+"/quotas/anonymous/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err229];
}
else {
vErrors.push(err229);
}
errors++;
}
}
else {
const err230 = {instancePath:instancePath+"/quotas/anonymous/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err230];
}
else {
vErrors.push(err230);
}
errors++;
}
}
}
else {
const err231 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err231];
}
else {
vErrors.push(err231);
}
errors++;
}
}
if(data95.untrusted !== undefined){
let data111 = data95.untrusted;
if(data111 && typeof data111 == "object" && !Array.isArray(data111)){
if(data111.unlimited === undefined){
const err232 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'"};
if(vErrors === null){
vErrors = [err232];
}
else {
vErrors.push(err232);
}
errors++;
}
if(data111.monthlyLimit === undefined){
const err233 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'"};
if(vErrors === null){
vErrors = [err233];
}
else {
vErrors.push(err233);
}
errors++;
}
if(data111.unlimited !== undefined){
if(typeof data111.unlimited !== "boolean"){
const err234 = {instancePath:instancePath+"/quotas/untrusted/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err234];
}
else {
vErrors.push(err234);
}
errors++;
}
}
if(data111.monthlyLimit !== undefined){
let data113 = data111.monthlyLimit;
if(typeof data113 == "number"){
if(data113 < 0 || isNaN(data113)){
const err235 = {instancePath:instancePath+"/quotas/untrusted/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err235];
}
else {
vErrors.push(err235);
}
errors++;
}
}
else {
const err236 = {instancePath:instancePath+"/quotas/untrusted/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err236];
}
else {
vErrors.push(err236);
}
errors++;
}
}
}
else {
const err237 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err237];
}
else {
vErrors.push(err237);
}
errors++;
}
}
}
else {
const err238 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err238];
}
else {
vErrors.push(err238);
}
errors++;
}
}
}
else {
const err239 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err239];
}
else {
vErrors.push(err239);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
