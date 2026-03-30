/* eslint-disable */
// @ts-nocheck

import { fullFormats } from "ajv-formats/dist/formats.js";
"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/settings-put","x-exports":["validate","types","vjsf"],"title":"Settings put","x-i18n-title":{"en":"Settings","fr":"Paramètres"},"layout":{"title":null},"definitions":{"RoleQuota":{"type":"object","layout":"card","required":["unlimited","dailyTokenLimit","monthlyTokenLimit"],"properties":{"unlimited":{"type":"boolean","title":"Unlimited","x-i18n-title":{"en":"Unlimited","fr":"Illimité"},"default":false},"dailyTokenLimit":{"layout":{"if":"!parent.data.unlimited","cols":6},"type":"integer","title":"Daily Token Limit","x-i18n-title":{"en":"Daily Token Limit","fr":"Limite de tokens journalière"},"default":0,"minimum":0},"monthlyTokenLimit":{"layout":{"if":"!parent.data.unlimited","cols":6},"type":"integer","title":"Monthly Token Limit","x-i18n-title":{"en":"Monthly Token Limit","fr":"Limite de tokens mensuelle"},"default":0,"minimum":0}}},"Model":{"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}","itemsResults":"data.results","itemTitle":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","itemKey":"item.id"}},"properties":{"id":{"type":"string","title":"Model ID"},"name":{"type":"string","title":"Name"},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type"},"name":{"type":"string","title":"Provider Name"},"id":{"type":"string","title":"Provider ID"}}}}}},"type":"object","additionalProperties":false,"required":["providers","models","quotas"],"properties":{"createdAt":{"type":"string","format":"date-time","readOnly":true},"updatedAt":{"type":"string","format":"date-time","readOnly":true},"owner":{"type":"object","additionalProperties":false,"required":["type","id"],"readOnly":true,"properties":{"type":{"type":"string","enum":["user","organization"]},"id":{"type":"string"},"name":{"type":"string"},"department":{"type":"string"}}},"providers":{"type":"array","title":"AI Providers","x-i18n-title":{"en":"AI Providers","fr":"Fournisseurs IA"},"layout":{"itemTitle":"item ? `${item.name || \"\"} - ${item.id.slice(0, 8)}` : \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","title":"Provider","x-i18n-title":{"en":"Provider","fr":"Fournisseur"},"unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Open AI\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Anthropic\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Google\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Mistral\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"OpenRouter\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Ollama\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}},"baseURL":{"type":"string","title":"Base URL","x-i18n-title":{"en":"Base URL","fr":"URL de base"},"default":"http://localhost:11434"}}},{"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Mock\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true}}}]}},"models":{"type":"object","title":"Models","x-i18n-title":{"en":"Models","fr":"Modèles"},"layout":{"title":null,"if":"parent.data.providers?.length"},"default":{},"properties":{"assistant":{"type":"object","title":"Assistant","description":"\nThe primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.\n          \nRecommendations: GPT-5.4, Claude 4.5 Sonnet, Llama 4 Maverick, Mistral Large 3, etc.","x-i18n-title":{"en":"Assistant","fr":"Assistant"},"x-i18n-description":{"en":"The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.\n\nRecommendations: GPT-5.4, Claude 4.5 Sonnet, Llama 4 Maverick, Mistral Large 3, etc.","fr":"L'interface conversationnelle principale. Équilibré pour le raisonnement, le suivi d'instructions et l'interaction naturelle. Ce modèle gère le flux de haut niveau et délègue les tâches complexes aux sous-agents.\n\nRecommandations : GPT-5.4, Claude 4.5 Sonnet, Llama 4 Maverick, Mistral Large 3, etc."},"layout":{"comp":"card","children":[{"key":"model","cols":8},{"key":"ratio","cols":4}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","x-i18n-title":{"en":"Model","fr":"Modèle"}},"ratio":{"type":"number","title":"Usage Ratio","x-i18n-title":{"en":"Usage Ratio","fr":"Ratio d'utilisation"},"description":"Multiplier applied to token usage for quota accounting (e.g. 1.0 = full cost, 0.5 = half cost)","x-i18n-description":{"en":"Multiplier applied to token usage for quota accounting (e.g. 1.0 = full cost, 0.5 = half cost)","fr":"Multiplicateur appliqué à l'utilisation des tokens pour le calcul des quotas (ex : 1.0 = coût plein, 0.5 = demi-coût)"},"default":1,"minimum":0}}},"tools":{"type":"object","title":"Tools","description":"\nThe \"technician.\" Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.\n\nRecommendations: GPT-5.4 Mini, Mistral DevStral, Claude 4.5 Sonnet (Computer Use), MiMo-V2-Flash, etc.","x-i18n-title":{"en":"Tools","fr":"Outils"},"x-i18n-description":{"en":"The \"technician.\" Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.\n\nRecommendations: GPT-5.4 Mini, Mistral DevStral, Claude 4.5 Sonnet (Computer Use), MiMo-V2-Flash, etc.","fr":"Le « technicien ». Spécialisé dans les données structurées et l'interaction avec les API. Il excelle à enchaîner plusieurs appels d'outils sans remplissage conversationnel, garantissant une haute fiabilité dans les workflows automatisés.\n\nRecommandations : GPT-5.4 Mini, Mistral DevStral, Claude 4.5 Sonnet (Computer Use), MiMo-V2-Flash, etc."},"layout":{"comp":"card","children":[{"key":"model","cols":8},{"key":"ratio","cols":4}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","x-i18n-title":{"en":"Model","fr":"Modèle"}},"ratio":{"type":"number","title":"Usage Ratio","x-i18n-title":{"en":"Usage Ratio","fr":"Ratio d'utilisation"},"description":"Multiplier applied to token usage for quota accounting","x-i18n-description":{"en":"Multiplier applied to token usage for quota accounting","fr":"Multiplicateur appliqué à l'utilisation des tokens pour le calcul des quotas"},"default":0.5,"minimum":0}}},"summarizer":{"type":"object","title":"Summarizer","description":"\nA \"shorthand\" specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.\n          \nRecommendations: GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Llama 4 (8B), etc.","x-i18n-title":{"en":"Summarizer","fr":"Résumeur"},"x-i18n-description":{"en":"A \"shorthand\" specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.\n\nRecommendations: GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Llama 4 (8B), etc.","fr":"Un spécialiste de la « synthèse ». Optimisé pour extraire rapidement les points clés de blocs de texte petits à moyens. Il privilégie la densité d'information et la concision pour garder les fenêtres de contexte légères et les coûts bas.\n\nRecommandations : GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Llama 4 (8B), etc."},"layout":{"comp":"card","children":[{"key":"model","cols":8},{"key":"ratio","cols":4}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","x-i18n-title":{"en":"Model","fr":"Modèle"}},"ratio":{"type":"number","title":"Usage Ratio","x-i18n-title":{"en":"Usage Ratio","fr":"Ratio d'utilisation"},"description":"Multiplier applied to token usage for quota accounting (e.g. 0.5 for cheaper summarization)","x-i18n-description":{"en":"Multiplier applied to token usage for quota accounting (e.g. 0.5 for cheaper summarization)","fr":"Multiplicateur appliqué à l'utilisation des tokens pour le calcul des quotas (ex : 0.5 pour une synthèse moins coûteuse)"},"default":0.5,"minimum":0}}},"evaluator":{"type":"object","title":"Evaluator","description":"\nThe \"quality controller.\" Analyzes the assistant's logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.\n\nRecommendations: Claude Opus 4.6, GPT-5.4 (Reasoning), DeepSeek-R1, Pharia-1-LLM, etc.","x-i18n-title":{"en":"Evaluator","fr":"Évaluateur"},"x-i18n-description":{"en":"The \"quality controller.\" Analyzes the assistant's logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.\n\nRecommendations: Claude Opus 4.6, GPT-5.4 (Reasoning), DeepSeek-R1, Pharia-1-LLM, etc.","fr":"Le « contrôleur qualité ». Analyse la logique de l'assistant et les sorties des outils pour vérifier la précision et la sécurité. Il nécessite les capacités de raisonnement les plus élevées pour servir de référence fiable pour les performances du système.\n\nRecommandations : Claude Opus 4.6, GPT-5.4 (Reasoning), DeepSeek-R1, Pharia-1-LLM, etc."},"layout":{"comp":"card","children":[{"key":"model","cols":8},{"key":"ratio","cols":4}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","x-i18n-title":{"en":"Model","fr":"Modèle"}},"ratio":{"type":"number","title":"Usage Ratio","x-i18n-title":{"en":"Usage Ratio","fr":"Ratio d'utilisation"},"description":"Multiplier applied to token usage for quota accounting","x-i18n-description":{"en":"Multiplier applied to token usage for quota accounting","fr":"Multiplicateur appliqué à l'utilisation des tokens pour le calcul des quotas"},"default":1,"minimum":0}}}}},"quotas":{"type":"object","title":"Role Quotas","x-i18n-title":{"en":"Role Quotas","fr":"Quotas par rôle"},"layout":{"title":null,"if":"parent.data.providers?.length","children":[{"key":"global","cols":{"sm":6,"md":4}},{"key":"admin","cols":{"sm":6,"md":4}},{"key":"contrib","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"user","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"external","cols":{"sm":6,"md":4}},{"key":"anonymous","cols":{"sm":6,"md":4}}]},"required":["global","admin","contrib","user","external","anonymous"],"default":{"global":{"unlimited":false,"dailyTokenLimit":100000,"monthlyTokenLimit":1000000},"admin":{"unlimited":true,"dailyTokenLimit":0,"monthlyTokenLimit":0},"contrib":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0},"user":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0},"external":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0},"anonymous":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0}},"properties":{"global":{"$ref":"#/definitions/RoleQuota","title":"Global quotas","x-i18n-title":{"en":"Global quotas","fr":"Quotas globaux"},"default":{"unlimited":false,"dailyTokenLimit":100000,"monthlyTokenLimit":1000000}},"admin":{"$ref":"#/definitions/RoleQuota","title":"Admin quotas","x-i18n-title":{"en":"Admin quotas","fr":"Quotas administrateur"},"default":{"unlimited":true,"dailyTokenLimit":0,"monthlyTokenLimit":0}},"contrib":{"$ref":"#/definitions/RoleQuota","title":"Contributor quotas","x-i18n-title":{"en":"Contributor quotas","fr":"Quotas contributeur"},"default":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0}},"user":{"$ref":"#/definitions/RoleQuota","title":"Simple user Quotas","x-i18n-title":{"en":"Simple user Quotas","fr":"Quotas utilisateur simple"},"default":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0}},"external":{"$ref":"#/definitions/RoleQuota","title":"External user quotas","x-i18n-title":{"en":"External user quotas","fr":"Quotas utilisateur externe"},"default":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0}},"anonymous":{"$ref":"#/definitions/RoleQuota","title":"Anonymous user quotas","x-i18n-title":{"en":"Anonymous user quotas","fr":"Quotas utilisateur anonyme"},"default":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0}}}}},"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"]};
const schema17 = {"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}","itemsResults":"data.results","itemTitle":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","itemKey":"item.id"}},"properties":{"id":{"type":"string","title":"Model ID"},"name":{"type":"string","title":"Name"},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type"},"name":{"type":"string","title":"Provider Name"},"id":{"type":"string","title":"Provider ID"}}}}};
const schema21 = {"type":"object","layout":"card","required":["unlimited","dailyTokenLimit","monthlyTokenLimit"],"properties":{"unlimited":{"type":"boolean","title":"Unlimited","x-i18n-title":{"en":"Unlimited","fr":"Illimité"},"default":false},"dailyTokenLimit":{"layout":{"if":"!parent.data.unlimited","cols":6},"type":"integer","title":"Daily Token Limit","x-i18n-title":{"en":"Daily Token Limit","fr":"Limite de tokens journalière"},"default":0,"minimum":0},"monthlyTokenLimit":{"layout":{"if":"!parent.data.unlimited","cols":6},"type":"integer","title":"Monthly Token Limit","x-i18n-title":{"en":"Monthly Token Limit","fr":"Limite de tokens mensuelle"},"default":0,"minimum":0}}};
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
if(data.models === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "models"},message:"must have required property '"+"models"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.quotas === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "quotas"},message:"must have required property '"+"quotas"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "createdAt") || (key0 === "updatedAt")) || (key0 === "owner")) || (key0 === "providers")) || (key0 === "models")) || (key0 === "quotas"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.createdAt !== undefined){
let data0 = data.createdAt;
if(typeof data0 === "string"){
if(!(formats0.validate(data0))){
const err4 = {instancePath:instancePath+"/createdAt",schemaPath:"#/properties/createdAt/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err5 = {instancePath:instancePath+"/createdAt",schemaPath:"#/properties/createdAt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.updatedAt !== undefined){
let data1 = data.updatedAt;
if(typeof data1 === "string"){
if(!(formats0.validate(data1))){
const err6 = {instancePath:instancePath+"/updatedAt",schemaPath:"#/properties/updatedAt/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/updatedAt",schemaPath:"#/properties/updatedAt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.owner !== undefined){
let data2 = data.owner;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.type === undefined){
const err8 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data2.id === undefined){
const err9 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key1 in data2){
if(!((((key1 === "type") || (key1 === "id")) || (key1 === "name")) || (key1 === "department"))){
const err10 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data2.type !== undefined){
let data3 = data2.type;
if(typeof data3 !== "string"){
const err11 = {instancePath:instancePath+"/owner/type",schemaPath:"#/properties/owner/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!((data3 === "user") || (data3 === "organization"))){
const err12 = {instancePath:instancePath+"/owner/type",schemaPath:"#/properties/owner/properties/type/enum",keyword:"enum",params:{allowedValues: schema16.properties.owner.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data2.id !== undefined){
if(typeof data2.id !== "string"){
const err13 = {instancePath:instancePath+"/owner/id",schemaPath:"#/properties/owner/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data2.name !== undefined){
if(typeof data2.name !== "string"){
const err14 = {instancePath:instancePath+"/owner/name",schemaPath:"#/properties/owner/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data2.department !== undefined){
if(typeof data2.department !== "string"){
const err15 = {instancePath:instancePath+"/owner/department",schemaPath:"#/properties/owner/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
}
else {
const err16 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.providers !== undefined){
let data7 = data.providers;
if(Array.isArray(data7)){
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
if(!(data8 && typeof data8 == "object" && !Array.isArray(data8))){
const err17 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
const _errs21 = errors;
let valid4 = false;
let passing0 = null;
const _errs22 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err18 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data8.name === undefined){
const err19 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data8.id === undefined){
const err20 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data8.enabled === undefined){
const err21 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data8.type !== undefined){
let data9 = data8.type;
if(typeof data9 !== "string"){
const err22 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if("openai" !== data9){
const err23 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data8.id !== undefined){
if(typeof data8.id !== "string"){
const err24 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data8.name !== undefined){
if(typeof data8.name !== "string"){
const err25 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data8.enabled !== undefined){
if(typeof data8.enabled !== "boolean"){
const err26 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data8.apiKey !== undefined){
if(typeof data8.apiKey !== "string"){
const err27 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
}
var _valid0 = _errs22 === errors;
if(_valid0){
valid4 = true;
passing0 = 0;
}
const _errs33 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err28 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data8.name === undefined){
const err29 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data8.id === undefined){
const err30 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data8.enabled === undefined){
const err31 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(data8.type !== undefined){
let data14 = data8.type;
if(typeof data14 !== "string"){
const err32 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if("anthropic" !== data14){
const err33 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data8.id !== undefined){
if(typeof data8.id !== "string"){
const err34 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data8.name !== undefined){
if(typeof data8.name !== "string"){
const err35 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data8.enabled !== undefined){
if(typeof data8.enabled !== "boolean"){
const err36 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data8.apiKey !== undefined){
if(typeof data8.apiKey !== "string"){
const err37 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
}
var _valid0 = _errs33 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid4 = true;
passing0 = 1;
}
const _errs44 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err38 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data8.name === undefined){
const err39 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data8.id === undefined){
const err40 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data8.enabled === undefined){
const err41 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data8.type !== undefined){
let data19 = data8.type;
if(typeof data19 !== "string"){
const err42 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if("google" !== data19){
const err43 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data8.id !== undefined){
if(typeof data8.id !== "string"){
const err44 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data8.name !== undefined){
if(typeof data8.name !== "string"){
const err45 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data8.enabled !== undefined){
if(typeof data8.enabled !== "boolean"){
const err46 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data8.apiKey !== undefined){
if(typeof data8.apiKey !== "string"){
const err47 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
}
var _valid0 = _errs44 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid4 = true;
passing0 = 2;
}
const _errs55 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err48 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data8.name === undefined){
const err49 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(data8.id === undefined){
const err50 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(data8.enabled === undefined){
const err51 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(data8.type !== undefined){
let data24 = data8.type;
if(typeof data24 !== "string"){
const err52 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if("mistral" !== data24){
const err53 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
if(data8.id !== undefined){
if(typeof data8.id !== "string"){
const err54 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data8.name !== undefined){
if(typeof data8.name !== "string"){
const err55 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
if(data8.enabled !== undefined){
if(typeof data8.enabled !== "boolean"){
const err56 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data8.apiKey !== undefined){
if(typeof data8.apiKey !== "string"){
const err57 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
}
var _valid0 = _errs55 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid4 = true;
passing0 = 3;
}
const _errs66 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err58 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data8.name === undefined){
const err59 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data8.id === undefined){
const err60 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data8.enabled === undefined){
const err61 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(data8.type !== undefined){
let data29 = data8.type;
if(typeof data29 !== "string"){
const err62 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if("openrouter" !== data29){
const err63 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data8.id !== undefined){
if(typeof data8.id !== "string"){
const err64 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(data8.name !== undefined){
if(typeof data8.name !== "string"){
const err65 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
if(data8.enabled !== undefined){
if(typeof data8.enabled !== "boolean"){
const err66 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data8.apiKey !== undefined){
if(typeof data8.apiKey !== "string"){
const err67 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
}
var _valid0 = _errs66 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid4 = true;
passing0 = 4;
}
const _errs77 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err68 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(data8.name === undefined){
const err69 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(data8.id === undefined){
const err70 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(data8.enabled === undefined){
const err71 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(data8.baseURL === undefined){
const err72 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(data8.type !== undefined){
let data34 = data8.type;
if(typeof data34 !== "string"){
const err73 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if("ollama" !== data34){
const err74 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(data8.id !== undefined){
if(typeof data8.id !== "string"){
const err75 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
if(data8.name !== undefined){
if(typeof data8.name !== "string"){
const err76 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(data8.enabled !== undefined){
if(typeof data8.enabled !== "boolean"){
const err77 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data8.apiKey !== undefined){
if(typeof data8.apiKey !== "string"){
const err78 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data8.baseURL !== undefined){
if(typeof data8.baseURL !== "string"){
const err79 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
}
var _valid0 = _errs77 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 5];
}
else {
if(_valid0){
valid4 = true;
passing0 = 5;
}
const _errs90 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err80 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(data8.name === undefined){
const err81 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(data8.id === undefined){
const err82 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if(data8.enabled === undefined){
const err83 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(data8.type !== undefined){
let data40 = data8.type;
if(typeof data40 !== "string"){
const err84 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if("mock" !== data40){
const err85 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(data8.id !== undefined){
if(typeof data8.id !== "string"){
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
if(data8.name !== undefined){
if(typeof data8.name !== "string"){
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
if(data8.enabled !== undefined){
if(typeof data8.enabled !== "boolean"){
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
}
var _valid0 = _errs90 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 6];
}
else {
if(_valid0){
valid4 = true;
passing0 = 6;
}
}
}
}
}
}
}
if(!valid4){
const err89 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
else {
errors = _errs21;
if(vErrors !== null){
if(_errs21){
vErrors.length = _errs21;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err90 = {instancePath:instancePath+"/providers",schemaPath:"#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
if(data.models !== undefined){
let data44 = data.models;
if(data44 && typeof data44 == "object" && !Array.isArray(data44)){
if(data44.assistant !== undefined){
let data45 = data44.assistant;
if(data45 && typeof data45 == "object" && !Array.isArray(data45)){
if(data45.model !== undefined){
let data46 = data45.model;
if(data46 && typeof data46 == "object" && !Array.isArray(data46)){
if(data46.id === undefined){
const err91 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if(data46.name === undefined){
const err92 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
if(data46.provider === undefined){
const err93 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
if(data46.id !== undefined){
if(typeof data46.id !== "string"){
const err94 = {instancePath:instancePath+"/models/assistant/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
if(data46.name !== undefined){
if(typeof data46.name !== "string"){
const err95 = {instancePath:instancePath+"/models/assistant/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
if(data46.provider !== undefined){
let data49 = data46.provider;
if(data49 && typeof data49 == "object" && !Array.isArray(data49)){
if(data49.type === undefined){
const err96 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(data49.name === undefined){
const err97 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
if(data49.id === undefined){
const err98 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(data49.type !== undefined){
if(typeof data49.type !== "string"){
const err99 = {instancePath:instancePath+"/models/assistant/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
}
if(data49.name !== undefined){
if(typeof data49.name !== "string"){
const err100 = {instancePath:instancePath+"/models/assistant/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
if(data49.id !== undefined){
if(typeof data49.id !== "string"){
const err101 = {instancePath:instancePath+"/models/assistant/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
}
}
else {
const err102 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
}
}
else {
const err103 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
if(data45.ratio !== undefined){
let data53 = data45.ratio;
if(typeof data53 == "number"){
if(data53 < 0 || isNaN(data53)){
const err104 = {instancePath:instancePath+"/models/assistant/ratio",schemaPath:"#/properties/models/properties/assistant/properties/ratio/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
}
else {
const err105 = {instancePath:instancePath+"/models/assistant/ratio",schemaPath:"#/properties/models/properties/assistant/properties/ratio/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
}
}
else {
const err106 = {instancePath:instancePath+"/models/assistant",schemaPath:"#/properties/models/properties/assistant/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
}
if(data44.tools !== undefined){
let data54 = data44.tools;
if(data54 && typeof data54 == "object" && !Array.isArray(data54)){
if(data54.model !== undefined){
let data55 = data54.model;
if(data55 && typeof data55 == "object" && !Array.isArray(data55)){
if(data55.id === undefined){
const err107 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(data55.name === undefined){
const err108 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
if(data55.provider === undefined){
const err109 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if(data55.id !== undefined){
if(typeof data55.id !== "string"){
const err110 = {instancePath:instancePath+"/models/tools/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
}
if(data55.name !== undefined){
if(typeof data55.name !== "string"){
const err111 = {instancePath:instancePath+"/models/tools/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
}
if(data55.provider !== undefined){
let data58 = data55.provider;
if(data58 && typeof data58 == "object" && !Array.isArray(data58)){
if(data58.type === undefined){
const err112 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
if(data58.name === undefined){
const err113 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
if(data58.id === undefined){
const err114 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
if(data58.type !== undefined){
if(typeof data58.type !== "string"){
const err115 = {instancePath:instancePath+"/models/tools/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
}
if(data58.name !== undefined){
if(typeof data58.name !== "string"){
const err116 = {instancePath:instancePath+"/models/tools/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
}
if(data58.id !== undefined){
if(typeof data58.id !== "string"){
const err117 = {instancePath:instancePath+"/models/tools/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
}
else {
const err118 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
}
}
else {
const err119 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
}
if(data54.ratio !== undefined){
let data62 = data54.ratio;
if(typeof data62 == "number"){
if(data62 < 0 || isNaN(data62)){
const err120 = {instancePath:instancePath+"/models/tools/ratio",schemaPath:"#/properties/models/properties/tools/properties/ratio/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
}
else {
const err121 = {instancePath:instancePath+"/models/tools/ratio",schemaPath:"#/properties/models/properties/tools/properties/ratio/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
}
}
else {
const err122 = {instancePath:instancePath+"/models/tools",schemaPath:"#/properties/models/properties/tools/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
}
if(data44.summarizer !== undefined){
let data63 = data44.summarizer;
if(data63 && typeof data63 == "object" && !Array.isArray(data63)){
if(data63.model !== undefined){
let data64 = data63.model;
if(data64 && typeof data64 == "object" && !Array.isArray(data64)){
if(data64.id === undefined){
const err123 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
if(data64.name === undefined){
const err124 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
if(data64.provider === undefined){
const err125 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
if(data64.id !== undefined){
if(typeof data64.id !== "string"){
const err126 = {instancePath:instancePath+"/models/summarizer/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
}
if(data64.name !== undefined){
if(typeof data64.name !== "string"){
const err127 = {instancePath:instancePath+"/models/summarizer/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
}
if(data64.provider !== undefined){
let data67 = data64.provider;
if(data67 && typeof data67 == "object" && !Array.isArray(data67)){
if(data67.type === undefined){
const err128 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
if(data67.name === undefined){
const err129 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
if(data67.id === undefined){
const err130 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
if(data67.type !== undefined){
if(typeof data67.type !== "string"){
const err131 = {instancePath:instancePath+"/models/summarizer/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
if(data67.name !== undefined){
if(typeof data67.name !== "string"){
const err132 = {instancePath:instancePath+"/models/summarizer/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
}
if(data67.id !== undefined){
if(typeof data67.id !== "string"){
const err133 = {instancePath:instancePath+"/models/summarizer/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
}
}
else {
const err134 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
}
}
else {
const err135 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
}
if(data63.ratio !== undefined){
let data71 = data63.ratio;
if(typeof data71 == "number"){
if(data71 < 0 || isNaN(data71)){
const err136 = {instancePath:instancePath+"/models/summarizer/ratio",schemaPath:"#/properties/models/properties/summarizer/properties/ratio/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
}
else {
const err137 = {instancePath:instancePath+"/models/summarizer/ratio",schemaPath:"#/properties/models/properties/summarizer/properties/ratio/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
}
}
else {
const err138 = {instancePath:instancePath+"/models/summarizer",schemaPath:"#/properties/models/properties/summarizer/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
}
if(data44.evaluator !== undefined){
let data72 = data44.evaluator;
if(data72 && typeof data72 == "object" && !Array.isArray(data72)){
if(data72.model !== undefined){
let data73 = data72.model;
if(data73 && typeof data73 == "object" && !Array.isArray(data73)){
if(data73.id === undefined){
const err139 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
if(data73.name === undefined){
const err140 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
if(data73.provider === undefined){
const err141 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
if(data73.id !== undefined){
if(typeof data73.id !== "string"){
const err142 = {instancePath:instancePath+"/models/evaluator/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
}
if(data73.name !== undefined){
if(typeof data73.name !== "string"){
const err143 = {instancePath:instancePath+"/models/evaluator/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
}
if(data73.provider !== undefined){
let data76 = data73.provider;
if(data76 && typeof data76 == "object" && !Array.isArray(data76)){
if(data76.type === undefined){
const err144 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
if(data76.name === undefined){
const err145 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
if(data76.id === undefined){
const err146 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
if(data76.type !== undefined){
if(typeof data76.type !== "string"){
const err147 = {instancePath:instancePath+"/models/evaluator/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
}
if(data76.name !== undefined){
if(typeof data76.name !== "string"){
const err148 = {instancePath:instancePath+"/models/evaluator/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
}
if(data76.id !== undefined){
if(typeof data76.id !== "string"){
const err149 = {instancePath:instancePath+"/models/evaluator/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
}
}
else {
const err150 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err150];
}
else {
vErrors.push(err150);
}
errors++;
}
}
}
else {
const err151 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
}
if(data72.ratio !== undefined){
let data80 = data72.ratio;
if(typeof data80 == "number"){
if(data80 < 0 || isNaN(data80)){
const err152 = {instancePath:instancePath+"/models/evaluator/ratio",schemaPath:"#/properties/models/properties/evaluator/properties/ratio/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err152];
}
else {
vErrors.push(err152);
}
errors++;
}
}
else {
const err153 = {instancePath:instancePath+"/models/evaluator/ratio",schemaPath:"#/properties/models/properties/evaluator/properties/ratio/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err153];
}
else {
vErrors.push(err153);
}
errors++;
}
}
}
else {
const err154 = {instancePath:instancePath+"/models/evaluator",schemaPath:"#/properties/models/properties/evaluator/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err154];
}
else {
vErrors.push(err154);
}
errors++;
}
}
}
else {
const err155 = {instancePath:instancePath+"/models",schemaPath:"#/properties/models/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
}
if(data.quotas !== undefined){
let data81 = data.quotas;
if(data81 && typeof data81 == "object" && !Array.isArray(data81)){
if(data81.global === undefined){
const err156 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "global"},message:"must have required property '"+"global"+"'"};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
if(data81.admin === undefined){
const err157 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "admin"},message:"must have required property '"+"admin"+"'"};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
if(data81.contrib === undefined){
const err158 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "contrib"},message:"must have required property '"+"contrib"+"'"};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
if(data81.user === undefined){
const err159 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "user"},message:"must have required property '"+"user"+"'"};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
if(data81.external === undefined){
const err160 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "external"},message:"must have required property '"+"external"+"'"};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
if(data81.anonymous === undefined){
const err161 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "anonymous"},message:"must have required property '"+"anonymous"+"'"};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
if(data81.global !== undefined){
let data82 = data81.global;
if(data82 && typeof data82 == "object" && !Array.isArray(data82)){
if(data82.unlimited === undefined){
const err162 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'"};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
if(data82.dailyTokenLimit === undefined){
const err163 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "dailyTokenLimit"},message:"must have required property '"+"dailyTokenLimit"+"'"};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
if(data82.monthlyTokenLimit === undefined){
const err164 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyTokenLimit"},message:"must have required property '"+"monthlyTokenLimit"+"'"};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
if(data82.unlimited !== undefined){
if(typeof data82.unlimited !== "boolean"){
const err165 = {instancePath:instancePath+"/quotas/global/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
}
if(data82.dailyTokenLimit !== undefined){
let data84 = data82.dailyTokenLimit;
if(!((typeof data84 == "number") && (!(data84 % 1) && !isNaN(data84)))){
const err166 = {instancePath:instancePath+"/quotas/global/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
if(typeof data84 == "number"){
if(data84 < 0 || isNaN(data84)){
const err167 = {instancePath:instancePath+"/quotas/global/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
}
}
if(data82.monthlyTokenLimit !== undefined){
let data85 = data82.monthlyTokenLimit;
if(!((typeof data85 == "number") && (!(data85 % 1) && !isNaN(data85)))){
const err168 = {instancePath:instancePath+"/quotas/global/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
if(typeof data85 == "number"){
if(data85 < 0 || isNaN(data85)){
const err169 = {instancePath:instancePath+"/quotas/global/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
}
}
}
else {
const err170 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
}
if(data81.admin !== undefined){
let data86 = data81.admin;
if(data86 && typeof data86 == "object" && !Array.isArray(data86)){
if(data86.unlimited === undefined){
const err171 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'"};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
if(data86.dailyTokenLimit === undefined){
const err172 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "dailyTokenLimit"},message:"must have required property '"+"dailyTokenLimit"+"'"};
if(vErrors === null){
vErrors = [err172];
}
else {
vErrors.push(err172);
}
errors++;
}
if(data86.monthlyTokenLimit === undefined){
const err173 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyTokenLimit"},message:"must have required property '"+"monthlyTokenLimit"+"'"};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
}
errors++;
}
if(data86.unlimited !== undefined){
if(typeof data86.unlimited !== "boolean"){
const err174 = {instancePath:instancePath+"/quotas/admin/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err174];
}
else {
vErrors.push(err174);
}
errors++;
}
}
if(data86.dailyTokenLimit !== undefined){
let data88 = data86.dailyTokenLimit;
if(!((typeof data88 == "number") && (!(data88 % 1) && !isNaN(data88)))){
const err175 = {instancePath:instancePath+"/quotas/admin/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
if(typeof data88 == "number"){
if(data88 < 0 || isNaN(data88)){
const err176 = {instancePath:instancePath+"/quotas/admin/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err176];
}
else {
vErrors.push(err176);
}
errors++;
}
}
}
if(data86.monthlyTokenLimit !== undefined){
let data89 = data86.monthlyTokenLimit;
if(!((typeof data89 == "number") && (!(data89 % 1) && !isNaN(data89)))){
const err177 = {instancePath:instancePath+"/quotas/admin/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
}
if(typeof data89 == "number"){
if(data89 < 0 || isNaN(data89)){
const err178 = {instancePath:instancePath+"/quotas/admin/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err178];
}
else {
vErrors.push(err178);
}
errors++;
}
}
}
}
else {
const err179 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err179];
}
else {
vErrors.push(err179);
}
errors++;
}
}
if(data81.contrib !== undefined){
let data90 = data81.contrib;
if(data90 && typeof data90 == "object" && !Array.isArray(data90)){
if(data90.unlimited === undefined){
const err180 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'"};
if(vErrors === null){
vErrors = [err180];
}
else {
vErrors.push(err180);
}
errors++;
}
if(data90.dailyTokenLimit === undefined){
const err181 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "dailyTokenLimit"},message:"must have required property '"+"dailyTokenLimit"+"'"};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
if(data90.monthlyTokenLimit === undefined){
const err182 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyTokenLimit"},message:"must have required property '"+"monthlyTokenLimit"+"'"};
if(vErrors === null){
vErrors = [err182];
}
else {
vErrors.push(err182);
}
errors++;
}
if(data90.unlimited !== undefined){
if(typeof data90.unlimited !== "boolean"){
const err183 = {instancePath:instancePath+"/quotas/contrib/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err183];
}
else {
vErrors.push(err183);
}
errors++;
}
}
if(data90.dailyTokenLimit !== undefined){
let data92 = data90.dailyTokenLimit;
if(!((typeof data92 == "number") && (!(data92 % 1) && !isNaN(data92)))){
const err184 = {instancePath:instancePath+"/quotas/contrib/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err184];
}
else {
vErrors.push(err184);
}
errors++;
}
if(typeof data92 == "number"){
if(data92 < 0 || isNaN(data92)){
const err185 = {instancePath:instancePath+"/quotas/contrib/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err185];
}
else {
vErrors.push(err185);
}
errors++;
}
}
}
if(data90.monthlyTokenLimit !== undefined){
let data93 = data90.monthlyTokenLimit;
if(!((typeof data93 == "number") && (!(data93 % 1) && !isNaN(data93)))){
const err186 = {instancePath:instancePath+"/quotas/contrib/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err186];
}
else {
vErrors.push(err186);
}
errors++;
}
if(typeof data93 == "number"){
if(data93 < 0 || isNaN(data93)){
const err187 = {instancePath:instancePath+"/quotas/contrib/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err187];
}
else {
vErrors.push(err187);
}
errors++;
}
}
}
}
else {
const err188 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err188];
}
else {
vErrors.push(err188);
}
errors++;
}
}
if(data81.user !== undefined){
let data94 = data81.user;
if(data94 && typeof data94 == "object" && !Array.isArray(data94)){
if(data94.unlimited === undefined){
const err189 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'"};
if(vErrors === null){
vErrors = [err189];
}
else {
vErrors.push(err189);
}
errors++;
}
if(data94.dailyTokenLimit === undefined){
const err190 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "dailyTokenLimit"},message:"must have required property '"+"dailyTokenLimit"+"'"};
if(vErrors === null){
vErrors = [err190];
}
else {
vErrors.push(err190);
}
errors++;
}
if(data94.monthlyTokenLimit === undefined){
const err191 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyTokenLimit"},message:"must have required property '"+"monthlyTokenLimit"+"'"};
if(vErrors === null){
vErrors = [err191];
}
else {
vErrors.push(err191);
}
errors++;
}
if(data94.unlimited !== undefined){
if(typeof data94.unlimited !== "boolean"){
const err192 = {instancePath:instancePath+"/quotas/user/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err192];
}
else {
vErrors.push(err192);
}
errors++;
}
}
if(data94.dailyTokenLimit !== undefined){
let data96 = data94.dailyTokenLimit;
if(!((typeof data96 == "number") && (!(data96 % 1) && !isNaN(data96)))){
const err193 = {instancePath:instancePath+"/quotas/user/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err193];
}
else {
vErrors.push(err193);
}
errors++;
}
if(typeof data96 == "number"){
if(data96 < 0 || isNaN(data96)){
const err194 = {instancePath:instancePath+"/quotas/user/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err194];
}
else {
vErrors.push(err194);
}
errors++;
}
}
}
if(data94.monthlyTokenLimit !== undefined){
let data97 = data94.monthlyTokenLimit;
if(!((typeof data97 == "number") && (!(data97 % 1) && !isNaN(data97)))){
const err195 = {instancePath:instancePath+"/quotas/user/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err195];
}
else {
vErrors.push(err195);
}
errors++;
}
if(typeof data97 == "number"){
if(data97 < 0 || isNaN(data97)){
const err196 = {instancePath:instancePath+"/quotas/user/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err196];
}
else {
vErrors.push(err196);
}
errors++;
}
}
}
}
else {
const err197 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err197];
}
else {
vErrors.push(err197);
}
errors++;
}
}
if(data81.external !== undefined){
let data98 = data81.external;
if(data98 && typeof data98 == "object" && !Array.isArray(data98)){
if(data98.unlimited === undefined){
const err198 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'"};
if(vErrors === null){
vErrors = [err198];
}
else {
vErrors.push(err198);
}
errors++;
}
if(data98.dailyTokenLimit === undefined){
const err199 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "dailyTokenLimit"},message:"must have required property '"+"dailyTokenLimit"+"'"};
if(vErrors === null){
vErrors = [err199];
}
else {
vErrors.push(err199);
}
errors++;
}
if(data98.monthlyTokenLimit === undefined){
const err200 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyTokenLimit"},message:"must have required property '"+"monthlyTokenLimit"+"'"};
if(vErrors === null){
vErrors = [err200];
}
else {
vErrors.push(err200);
}
errors++;
}
if(data98.unlimited !== undefined){
if(typeof data98.unlimited !== "boolean"){
const err201 = {instancePath:instancePath+"/quotas/external/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err201];
}
else {
vErrors.push(err201);
}
errors++;
}
}
if(data98.dailyTokenLimit !== undefined){
let data100 = data98.dailyTokenLimit;
if(!((typeof data100 == "number") && (!(data100 % 1) && !isNaN(data100)))){
const err202 = {instancePath:instancePath+"/quotas/external/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err202];
}
else {
vErrors.push(err202);
}
errors++;
}
if(typeof data100 == "number"){
if(data100 < 0 || isNaN(data100)){
const err203 = {instancePath:instancePath+"/quotas/external/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err203];
}
else {
vErrors.push(err203);
}
errors++;
}
}
}
if(data98.monthlyTokenLimit !== undefined){
let data101 = data98.monthlyTokenLimit;
if(!((typeof data101 == "number") && (!(data101 % 1) && !isNaN(data101)))){
const err204 = {instancePath:instancePath+"/quotas/external/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err204];
}
else {
vErrors.push(err204);
}
errors++;
}
if(typeof data101 == "number"){
if(data101 < 0 || isNaN(data101)){
const err205 = {instancePath:instancePath+"/quotas/external/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err205];
}
else {
vErrors.push(err205);
}
errors++;
}
}
}
}
else {
const err206 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err206];
}
else {
vErrors.push(err206);
}
errors++;
}
}
if(data81.anonymous !== undefined){
let data102 = data81.anonymous;
if(data102 && typeof data102 == "object" && !Array.isArray(data102)){
if(data102.unlimited === undefined){
const err207 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'"};
if(vErrors === null){
vErrors = [err207];
}
else {
vErrors.push(err207);
}
errors++;
}
if(data102.dailyTokenLimit === undefined){
const err208 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "dailyTokenLimit"},message:"must have required property '"+"dailyTokenLimit"+"'"};
if(vErrors === null){
vErrors = [err208];
}
else {
vErrors.push(err208);
}
errors++;
}
if(data102.monthlyTokenLimit === undefined){
const err209 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyTokenLimit"},message:"must have required property '"+"monthlyTokenLimit"+"'"};
if(vErrors === null){
vErrors = [err209];
}
else {
vErrors.push(err209);
}
errors++;
}
if(data102.unlimited !== undefined){
if(typeof data102.unlimited !== "boolean"){
const err210 = {instancePath:instancePath+"/quotas/anonymous/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err210];
}
else {
vErrors.push(err210);
}
errors++;
}
}
if(data102.dailyTokenLimit !== undefined){
let data104 = data102.dailyTokenLimit;
if(!((typeof data104 == "number") && (!(data104 % 1) && !isNaN(data104)))){
const err211 = {instancePath:instancePath+"/quotas/anonymous/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err211];
}
else {
vErrors.push(err211);
}
errors++;
}
if(typeof data104 == "number"){
if(data104 < 0 || isNaN(data104)){
const err212 = {instancePath:instancePath+"/quotas/anonymous/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data102.monthlyTokenLimit !== undefined){
let data105 = data102.monthlyTokenLimit;
if(!((typeof data105 == "number") && (!(data105 % 1) && !isNaN(data105)))){
const err213 = {instancePath:instancePath+"/quotas/anonymous/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err213];
}
else {
vErrors.push(err213);
}
errors++;
}
if(typeof data105 == "number"){
if(data105 < 0 || isNaN(data105)){
const err214 = {instancePath:instancePath+"/quotas/anonymous/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err214];
}
else {
vErrors.push(err214);
}
errors++;
}
}
}
}
else {
const err215 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err215];
}
else {
vErrors.push(err215);
}
errors++;
}
}
}
else {
const err216 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err216];
}
else {
vErrors.push(err216);
}
errors++;
}
}
}
else {
const err217 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err217];
}
else {
vErrors.push(err217);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
