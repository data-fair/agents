/* eslint-disable */
// @ts-nocheck

"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/settings/put-req","title":"Settings","x-i18n-title":{"en":"Settings","fr":"Paramètres"},"x-exports":["validate","types","vjsf"],"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"required":["providers"],"layout":{"title":null},"definitions":{"Model":{"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${(rootData.providers || []).map(p => p.id).join(\",\")}","itemsResults":"data.results","itemTitle":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","itemKey":"item.id"}},"properties":{"id":{"type":"string","title":"Model ID"},"name":{"type":"string","title":"Name"},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type"},"name":{"type":"string","title":"Provider Name"},"id":{"type":"string","title":"Provider ID"}}}}}},"properties":{"providers":{"type":"array","title":"AI Providers","x-i18n-title":{"en":"AI Providers","fr":"Fournisseurs IA"},"layout":{"itemTitle":"item ? `${item.name || \"\"} - ${item.id.slice(0, 8)}` : \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","title":"Provider","x-i18n-title":{"en":"Provider","fr":"Fournisseur"},"unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Open AI\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Anthropic\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Google\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Mistral\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"OpenRouter\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}}}},{"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Ollama\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}},"baseURL":{"type":"string","title":"Base URL","x-i18n-title":{"en":"Base URL","fr":"URL de base"},"default":"http://localhost:11434"}}},{"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","description":"For an API key scoped to a specific Scaleway Project, set the Project ID so requests target that project. Leave it empty to use the organization default project.","x-i18n-description":{"en":"For an API key scoped to a specific Scaleway Project, set the Project ID so requests target that project. Leave it empty to use the organization default project.","fr":"Pour une clé API liée à un Projet Scaleway spécifique, renseignez l'ID du projet afin que les requêtes ciblent ce projet. Laissez vide pour utiliser le projet par défaut de l'organisation."},"properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Scaleway\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}},"projectId":{"type":"string","title":"Project ID","x-i18n-title":{"en":"Project ID","fr":"ID du projet"},"description":"Optional. The Scaleway Project ID (UUID) the API key is scoped to. Required when the key only has access to a specific project, otherwise model listing and inference return 403.","x-i18n-description":{"en":"Optional. The Scaleway Project ID (UUID) the API key is scoped to. Required when the key only has access to a specific project, otherwise model listing and inference return 403.","fr":"Optionnel. L'ID du Projet Scaleway (UUID) auquel la clé API est liée. Requis lorsque la clé n'a accès qu'à un projet spécifique, sinon le listing des modèles et l'inférence renvoient une erreur 403."}}}},{"required":["type","name","id","enabled","baseURL"],"title":"OpenAI Compatible","x-i18n-title":{"en":"OpenAI Compatible","fr":"Compatible OpenAI"},"description":"Generic provider for any OpenAI-compatible endpoint (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). API Key is optional for unauthenticated local servers.","x-i18n-description":{"en":"Generic provider for any OpenAI-compatible endpoint (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). API Key is optional for unauthenticated local servers.","fr":"Fournisseur générique pour tout endpoint compatible OpenAI (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). La clé API est optionnelle pour les serveurs locaux sans authentification."},"properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"OpenAI Compatible\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true},"baseURL":{"type":"string","title":"Base URL","x-i18n-title":{"en":"Base URL","fr":"URL de base"}},"apiKey":{"type":"string","title":"API Key","x-i18n-title":{"en":"API Key","fr":"Clé API"}},"compatibility":{"type":"string","title":"Compatibility Mode","x-i18n-title":{"en":"Compatibility Mode","fr":"Mode de compatibilité"},"description":"Use \"compatible\" for providers that do not support the new /v1/responses endpoint (e.g. LiteLLM, older OpenAI-compatible APIs). Leave empty for standard OpenAI behavior.","x-i18n-description":{"en":"Utilisez \"compatible\" pour les fournisseurs qui ne supportent pas le nouveau endpoint /v1/responses (ex: LiteLLM, anciennes APIs compatibles OpenAI). Laissez vide pour le comportement OpenAI standard.","fr":"Utilisez \"compatible\" pour les fournisseurs qui ne supportent pas le nouveau endpoint /v1/responses (ex: LiteLLM, anciennes APIs compatibles OpenAI). Laissez vide pour le comportement OpenAI standard."},"enum":["default","compatible"],"default":"default"}}},{"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock"},"id":{"type":"string","title":"Provider ID","x-i18n-title":{"en":"Provider ID","fr":"ID du fournisseur"},"readOnly":true},"name":{"type":"string","title":"Display Name","x-i18n-title":{"en":"Display Name","fr":"Nom d'affichage"},"layout":{"getDefaultData":"\"Mock\""}},"enabled":{"type":"boolean","title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"},"default":true}}}]}},"models":{"type":"array","title":"Models","x-i18n-title":{"en":"Models","fr":"Modèles"},"default":[],"layout":{"if":"parent.data.providers?.length","itemTitle":"item?.model ? `${item.model.name} (${item.usage?.join(\", \")})` : \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","additionalProperties":false,"required":["model","usage"],"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","x-i18n-title":{"en":"Model","fr":"Modèle"}},"usage":{"type":"array","uniqueItems":true,"minItems":1,"title":"Appropriate usages","x-i18n-title":{"en":"Appropriate usages","fr":"Usages appropriés"},"items":{"type":"string","oneOf":[{"const":"assistant","title":"Assistant"},{"const":"tools","title":"Tools","x-i18n-title":{"en":"Tools","fr":"Outils"}},{"const":"summarizer","title":"Summarizer","x-i18n-title":{"en":"Summarizer","fr":"Résumeur"}},{"const":"evaluator","title":"Evaluator","x-i18n-title":{"en":"Evaluator","fr":"Évaluateur"}},{"const":"moderator","title":"Moderator","x-i18n-title":{"en":"Moderator","fr":"Modérateur"}}]}},"multiplier":{"type":"number","minimum":0,"default":1,"title":"Credit multiplier","x-i18n-title":{"en":"Credit multiplier","fr":"Multiplicateur de crédits"},"description":"credits = (input tokens + output tokens × output weight) / 1M × multiplier","x-i18n-description":{"en":"credits = (input tokens + output tokens × output weight) / 1M × multiplier","fr":"crédits = (tokens d'entrée + tokens de sortie × poids de sortie) / 1M × multiplicateur"}}}}}}};
const schema17 = {"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${(rootData.providers || []).map(p => p.id).join(\",\")}","itemsResults":"data.results","itemTitle":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","itemKey":"item.id"}},"properties":{"id":{"type":"string","title":"Model ID"},"name":{"type":"string","title":"Name"},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type"},"name":{"type":"string","title":"Provider Name"},"id":{"type":"string","title":"Provider ID"}}}}};

function validate14(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/agents/settings/put-req" */;
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
if(!((key0 === "providers") || (key0 === "models"))){
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
if(data.providers !== undefined){
let data0 = data.providers;
if(Array.isArray(data0)){
const len0 = data0.length;
for(let i0=0; i0<len0; i0++){
let data1 = data0[i0];
if(!(data1 && typeof data1 == "object" && !Array.isArray(data1))){
const err2 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
const _errs6 = errors;
let valid3 = false;
let passing0 = null;
const _errs7 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err3 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data1.name === undefined){
const err4 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data1.id === undefined){
const err5 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data1.enabled === undefined){
const err6 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data1.type !== undefined){
let data2 = data1.type;
if(typeof data2 !== "string"){
const err7 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if("openai" !== data2){
const err8 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data1.id !== undefined){
if(typeof data1.id !== "string"){
const err9 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data1.name !== undefined){
if(typeof data1.name !== "string"){
const err10 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data1.enabled !== undefined){
if(typeof data1.enabled !== "boolean"){
const err11 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data1.apiKey !== undefined){
if(typeof data1.apiKey !== "string"){
const err12 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
var _valid0 = _errs7 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
}
const _errs18 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err13 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data1.name === undefined){
const err14 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data1.id === undefined){
const err15 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data1.enabled === undefined){
const err16 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data1.type !== undefined){
let data7 = data1.type;
if(typeof data7 !== "string"){
const err17 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if("anthropic" !== data7){
const err18 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data1.id !== undefined){
if(typeof data1.id !== "string"){
const err19 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data1.name !== undefined){
if(typeof data1.name !== "string"){
const err20 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data1.enabled !== undefined){
if(typeof data1.enabled !== "boolean"){
const err21 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data1.apiKey !== undefined){
if(typeof data1.apiKey !== "string"){
const err22 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
}
var _valid0 = _errs18 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid3 = true;
passing0 = 1;
}
const _errs29 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err23 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data1.name === undefined){
const err24 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data1.id === undefined){
const err25 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data1.enabled === undefined){
const err26 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data1.type !== undefined){
let data12 = data1.type;
if(typeof data12 !== "string"){
const err27 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if("google" !== data12){
const err28 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data1.id !== undefined){
if(typeof data1.id !== "string"){
const err29 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data1.name !== undefined){
if(typeof data1.name !== "string"){
const err30 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data1.enabled !== undefined){
if(typeof data1.enabled !== "boolean"){
const err31 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data1.apiKey !== undefined){
if(typeof data1.apiKey !== "string"){
const err32 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
}
var _valid0 = _errs29 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid3 = true;
passing0 = 2;
}
const _errs40 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err33 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data1.name === undefined){
const err34 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data1.id === undefined){
const err35 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data1.enabled === undefined){
const err36 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data1.type !== undefined){
let data17 = data1.type;
if(typeof data17 !== "string"){
const err37 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if("mistral" !== data17){
const err38 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data1.id !== undefined){
if(typeof data1.id !== "string"){
const err39 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data1.name !== undefined){
if(typeof data1.name !== "string"){
const err40 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data1.enabled !== undefined){
if(typeof data1.enabled !== "boolean"){
const err41 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data1.apiKey !== undefined){
if(typeof data1.apiKey !== "string"){
const err42 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
}
var _valid0 = _errs40 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid3 = true;
passing0 = 3;
}
const _errs51 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err43 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(data1.name === undefined){
const err44 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data1.id === undefined){
const err45 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data1.enabled === undefined){
const err46 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(data1.type !== undefined){
let data22 = data1.type;
if(typeof data22 !== "string"){
const err47 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if("openrouter" !== data22){
const err48 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data1.id !== undefined){
if(typeof data1.id !== "string"){
const err49 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data1.name !== undefined){
if(typeof data1.name !== "string"){
const err50 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data1.enabled !== undefined){
if(typeof data1.enabled !== "boolean"){
const err51 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data1.apiKey !== undefined){
if(typeof data1.apiKey !== "string"){
const err52 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
}
var _valid0 = _errs51 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid3 = true;
passing0 = 4;
}
const _errs62 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err53 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(data1.name === undefined){
const err54 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(data1.id === undefined){
const err55 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(data1.enabled === undefined){
const err56 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data1.baseURL === undefined){
const err57 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data1.type !== undefined){
let data27 = data1.type;
if(typeof data27 !== "string"){
const err58 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if("ollama" !== data27){
const err59 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(data1.id !== undefined){
if(typeof data1.id !== "string"){
const err60 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
if(data1.name !== undefined){
if(typeof data1.name !== "string"){
const err61 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data1.enabled !== undefined){
if(typeof data1.enabled !== "boolean"){
const err62 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
if(data1.apiKey !== undefined){
if(typeof data1.apiKey !== "string"){
const err63 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data1.baseURL !== undefined){
if(typeof data1.baseURL !== "string"){
const err64 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
}
var _valid0 = _errs62 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 5];
}
else {
if(_valid0){
valid3 = true;
passing0 = 5;
}
const _errs75 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err65 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(data1.name === undefined){
const err66 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(data1.id === undefined){
const err67 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(data1.enabled === undefined){
const err68 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(data1.apiKey === undefined){
const err69 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "apiKey"},message:"must have required property '"+"apiKey"+"'"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(data1.type !== undefined){
let data33 = data1.type;
if(typeof data33 !== "string"){
const err70 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if("scaleway" !== data33){
const err71 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "scaleway"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(data1.id !== undefined){
if(typeof data1.id !== "string"){
const err72 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(data1.name !== undefined){
if(typeof data1.name !== "string"){
const err73 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data1.enabled !== undefined){
if(typeof data1.enabled !== "boolean"){
const err74 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(data1.apiKey !== undefined){
if(typeof data1.apiKey !== "string"){
const err75 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/6/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
if(data1.projectId !== undefined){
if(typeof data1.projectId !== "string"){
const err76 = {instancePath:instancePath+"/providers/" + i0+"/projectId",schemaPath:"#/properties/providers/items/oneOf/6/properties/projectId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
}
var _valid0 = _errs75 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 6];
}
else {
if(_valid0){
valid3 = true;
passing0 = 6;
}
const _errs88 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err77 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(data1.name === undefined){
const err78 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if(data1.id === undefined){
const err79 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(data1.enabled === undefined){
const err80 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(data1.baseURL === undefined){
const err81 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(data1.type !== undefined){
let data39 = data1.type;
if(typeof data39 !== "string"){
const err82 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/7/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if("openai-compatible" !== data39){
const err83 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue: "openai-compatible"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
}
if(data1.id !== undefined){
if(typeof data1.id !== "string"){
const err84 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/7/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
if(data1.name !== undefined){
if(typeof data1.name !== "string"){
const err85 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/7/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(data1.enabled !== undefined){
if(typeof data1.enabled !== "boolean"){
const err86 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/7/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(data1.baseURL !== undefined){
if(typeof data1.baseURL !== "string"){
const err87 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/oneOf/7/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
if(data1.apiKey !== undefined){
if(typeof data1.apiKey !== "string"){
const err88 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/7/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
if(data1.compatibility !== undefined){
let data45 = data1.compatibility;
if(typeof data45 !== "string"){
const err89 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/oneOf/7/properties/compatibility/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if(!((data45 === "default") || (data45 === "compatible"))){
const err90 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/oneOf/7/properties/compatibility/enum",keyword:"enum",params:{allowedValues: schema16.properties.providers.items.oneOf[7].properties.compatibility.enum},message:"must be equal to one of the allowed values"};
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
var _valid0 = _errs88 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 7];
}
else {
if(_valid0){
valid3 = true;
passing0 = 7;
}
const _errs103 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err91 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if(data1.name === undefined){
const err92 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
if(data1.id === undefined){
const err93 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
if(data1.enabled === undefined){
const err94 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
if(data1.type !== undefined){
let data46 = data1.type;
if(typeof data46 !== "string"){
const err95 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/8/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
if("mock" !== data46){
const err96 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
}
if(data1.id !== undefined){
if(typeof data1.id !== "string"){
const err97 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/8/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
if(data1.name !== undefined){
if(typeof data1.name !== "string"){
const err98 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/8/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
if(data1.enabled !== undefined){
if(typeof data1.enabled !== "boolean"){
const err99 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/8/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
}
}
var _valid0 = _errs103 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 8];
}
else {
if(_valid0){
valid3 = true;
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
if(!valid3){
const err100 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
else {
errors = _errs6;
if(vErrors !== null){
if(_errs6){
vErrors.length = _errs6;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err101 = {instancePath:instancePath+"/providers",schemaPath:"#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
}
if(data.models !== undefined){
let data50 = data.models;
if(Array.isArray(data50)){
const len1 = data50.length;
for(let i1=0; i1<len1; i1++){
let data51 = data50[i1];
if(data51 && typeof data51 == "object" && !Array.isArray(data51)){
if(data51.model === undefined){
const err102 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "model"},message:"must have required property '"+"model"+"'"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
if(data51.usage === undefined){
const err103 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "usage"},message:"must have required property '"+"usage"+"'"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
for(const key1 in data51){
if(!(((key1 === "model") || (key1 === "usage")) || (key1 === "multiplier"))){
const err104 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
}
if(data51.model !== undefined){
let data52 = data51.model;
if(data52 && typeof data52 == "object" && !Array.isArray(data52)){
if(data52.id === undefined){
const err105 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if(data52.name === undefined){
const err106 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
if(data52.provider === undefined){
const err107 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(data52.id !== undefined){
if(typeof data52.id !== "string"){
const err108 = {instancePath:instancePath+"/models/" + i1+"/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
}
if(data52.name !== undefined){
if(typeof data52.name !== "string"){
const err109 = {instancePath:instancePath+"/models/" + i1+"/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
}
if(data52.provider !== undefined){
let data55 = data52.provider;
if(data55 && typeof data55 == "object" && !Array.isArray(data55)){
if(data55.type === undefined){
const err110 = {instancePath:instancePath+"/models/" + i1+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
if(data55.name === undefined){
const err111 = {instancePath:instancePath+"/models/" + i1+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
if(data55.id === undefined){
const err112 = {instancePath:instancePath+"/models/" + i1+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
if(data55.type !== undefined){
if(typeof data55.type !== "string"){
const err113 = {instancePath:instancePath+"/models/" + i1+"/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
}
if(data55.name !== undefined){
if(typeof data55.name !== "string"){
const err114 = {instancePath:instancePath+"/models/" + i1+"/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
}
if(data55.id !== undefined){
if(typeof data55.id !== "string"){
const err115 = {instancePath:instancePath+"/models/" + i1+"/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
}
}
else {
const err116 = {instancePath:instancePath+"/models/" + i1+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
}
}
else {
const err117 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
if(data51.usage !== undefined){
let data59 = data51.usage;
if(Array.isArray(data59)){
if(data59.length < 1){
const err118 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
const len2 = data59.length;
for(let i2=0; i2<len2; i2++){
let data60 = data59[i2];
if(typeof data60 !== "string"){
const err119 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
const _errs136 = errors;
let valid21 = false;
let passing1 = null;
const _errs137 = errors;
if("assistant" !== data60){
const err120 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/0/const",keyword:"const",params:{allowedValue: "assistant"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
var _valid1 = _errs137 === errors;
if(_valid1){
valid21 = true;
passing1 = 0;
}
const _errs138 = errors;
if("tools" !== data60){
const err121 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/1/const",keyword:"const",params:{allowedValue: "tools"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
var _valid1 = _errs138 === errors;
if(_valid1 && valid21){
valid21 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid21 = true;
passing1 = 1;
}
const _errs139 = errors;
if("summarizer" !== data60){
const err122 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/2/const",keyword:"const",params:{allowedValue: "summarizer"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
var _valid1 = _errs139 === errors;
if(_valid1 && valid21){
valid21 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid21 = true;
passing1 = 2;
}
const _errs140 = errors;
if("evaluator" !== data60){
const err123 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/3/const",keyword:"const",params:{allowedValue: "evaluator"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
var _valid1 = _errs140 === errors;
if(_valid1 && valid21){
valid21 = false;
passing1 = [passing1, 3];
}
else {
if(_valid1){
valid21 = true;
passing1 = 3;
}
const _errs141 = errors;
if("moderator" !== data60){
const err124 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/4/const",keyword:"const",params:{allowedValue: "moderator"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
var _valid1 = _errs141 === errors;
if(_valid1 && valid21){
valid21 = false;
passing1 = [passing1, 4];
}
else {
if(_valid1){
valid21 = true;
passing1 = 4;
}
}
}
}
}
if(!valid21){
const err125 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
else {
errors = _errs136;
if(vErrors !== null){
if(_errs136){
vErrors.length = _errs136;
}
else {
vErrors = null;
}
}
}
}
let i3 = data59.length;
let j0;
if(i3 > 1){
const indices0 = {};
for(;i3--;){
let item0 = data59[i3];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err126 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
break;
}
indices0[item0] = i3;
}
}
}
else {
const err127 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
}
if(data51.multiplier !== undefined){
let data61 = data51.multiplier;
if(typeof data61 == "number"){
if(data61 < 0 || isNaN(data61)){
const err128 = {instancePath:instancePath+"/models/" + i1+"/multiplier",schemaPath:"#/properties/models/items/properties/multiplier/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
}
else {
const err129 = {instancePath:instancePath+"/models/" + i1+"/multiplier",schemaPath:"#/properties/models/items/properties/multiplier/type",keyword:"type",params:{type: "number"},message:"must be number"};
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
const err130 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
const err131 = {instancePath:instancePath+"/models",schemaPath:"#/properties/models/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
}
else {
const err132 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
