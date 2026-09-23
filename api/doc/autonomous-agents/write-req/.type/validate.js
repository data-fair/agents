/* eslint-disable */
// @ts-nocheck

"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/autonomous-agent/write-req","title":"Autonomous agent","x-i18n-title":{"en":"Autonomous agent","fr":"Agent autonome"},"x-exports":["validate","types","vjsf"],"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"required":["title","persona","mcpServers","toolDisclosure","enabled"],"layout":{"title":null},"properties":{"title":{"type":"string","title":"Name","x-i18n-title":{"en":"Name","fr":"Nom"}},"persona":{"type":"string","layout":"textarea","title":"Persona","x-i18n-title":{"en":"Persona","fr":"Persona"},"description":"Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.","x-i18n-description":{"en":"Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.","fr":"Qui est cet agent autonome : son rôle, son ton et son périmètre. Devient le prompt système."}},"instructions":{"type":"string","layout":"textarea","title":"Instructions","x-i18n-title":{"en":"Instructions","fr":"Instructions"},"description":"How it should work: procedures, constraints, what to do when unsure.","x-i18n-description":{"en":"How it should work: procedures, constraints, what to do when unsure.","fr":"Comment il doit travailler : procédures, contraintes, conduite à tenir en cas de doute."}},"mcpServers":{"type":"array","default":[],"title":"MCP servers","x-i18n-title":{"en":"MCP servers","fr":"Serveurs MCP"},"description":"Picked from the servers configured for this deployment.","x-i18n-description":{"en":"Picked from the servers configured for this deployment.","fr":"Choisis parmi les serveurs configurés pour ce déploiement."},"layout":{"itemTitle":"item?.serverId || \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","additionalProperties":false,"required":["serverId"],"properties":{"serverId":{"type":"string","title":"Server","x-i18n-title":{"en":"Server","fr":"Serveur"},"layout":{"comp":"autocomplete","getItems":{"url":"${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers","itemsResults":"data.results","itemTitle":"item.name","itemKey":"item.id","itemValue":"item.id"}}},"toolFilter":{"type":"array","title":"Only these tools","x-i18n-title":{"en":"Only these tools","fr":"Uniquement ces outils"},"description":"Leave empty to expose every tool this server offers.","x-i18n-description":{"en":"Leave empty to expose every tool this server offers.","fr":"Laissez vide pour exposer tous les outils proposés par ce serveur."},"items":{"type":"string"}}}}},"toolDisclosure":{"type":"string","enum":["static","exploration"],"default":"static","title":"Tool disclosure","x-i18n-title":{"en":"Tool disclosure","fr":"Exposition des outils"},"description":"\"static\" sends every selected tool on every turn. \"exploration\" shows names only and lets the autonomous agent promote the ones it needs — use it when the selection is large.","x-i18n-description":{"en":"\"static\" sends every selected tool on every turn. \"exploration\" shows names only and lets the autonomous agent promote the ones it needs — use it when the selection is large.","fr":"« static » envoie tous les outils sélectionnés à chaque tour. « exploration » n'affiche que les noms et laisse l'agent autonome promouvoir ceux dont il a besoin — à utiliser quand la sélection est grande."}},"nhi":{"type":"object","additionalProperties":false,"required":["clientId"],"title":"Non-human identity","x-i18n-title":{"en":"Non-human identity","fr":"Identité non humaine"},"properties":{"clientId":{"type":"string","title":"Client id","x-i18n-title":{"en":"Client id","fr":"Identifiant client"}}}},"instructors":{"type":"array","default":[],"title":"Users allowed to instruct","x-i18n-title":{"en":"Users allowed to instruct","fr":"Utilisateurs autorisés à donner des instructions"},"description":"Admins of the owning organization are always allowed. Anyone listed here borrows this autonomous agent's permissions.","x-i18n-description":{"en":"Admins of the owning organization are always allowed. Anyone listed here borrows this autonomous agent's permissions.","fr":"Les administrateurs de l'organisation propriétaire sont toujours autorisés. Toute personne listée ici emprunte les permissions de cet agent autonome."},"items":{"type":"object","additionalProperties":false,"required":["userId"],"properties":{"userId":{"type":"string","title":"User id","x-i18n-title":{"en":"User id","fr":"Identifiant utilisateur"}},"userName":{"type":"string","title":"User name","x-i18n-title":{"en":"User name","fr":"Nom"}}}}},"enabled":{"type":"boolean","default":true,"title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"}}}};

function validate14(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/agents/autonomous-agent/write-req" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.title === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.persona === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "persona"},message:"must have required property '"+"persona"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.mcpServers === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mcpServers"},message:"must have required property '"+"mcpServers"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.toolDisclosure === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "toolDisclosure"},message:"must have required property '"+"toolDisclosure"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.enabled === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "title") || (key0 === "persona")) || (key0 === "instructions")) || (key0 === "mcpServers")) || (key0 === "toolDisclosure")) || (key0 === "nhi")) || (key0 === "instructors")) || (key0 === "enabled"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.title !== undefined){
if(typeof data.title !== "string"){
const err6 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.persona !== undefined){
if(typeof data.persona !== "string"){
const err7 = {instancePath:instancePath+"/persona",schemaPath:"#/properties/persona/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.instructions !== undefined){
if(typeof data.instructions !== "string"){
const err8 = {instancePath:instancePath+"/instructions",schemaPath:"#/properties/instructions/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.mcpServers !== undefined){
let data3 = data.mcpServers;
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
let data4 = data3[i0];
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.serverId === undefined){
const err9 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "serverId"},message:"must have required property '"+"serverId"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key1 in data4){
if(!((key1 === "serverId") || (key1 === "toolFilter"))){
const err10 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"#/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data4.serverId !== undefined){
if(typeof data4.serverId !== "string"){
const err11 = {instancePath:instancePath+"/mcpServers/" + i0+"/serverId",schemaPath:"#/properties/mcpServers/items/properties/serverId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data4.toolFilter !== undefined){
let data6 = data4.toolFilter;
if(Array.isArray(data6)){
const len1 = data6.length;
for(let i1=0; i1<len1; i1++){
if(typeof data6[i1] !== "string"){
const err12 = {instancePath:instancePath+"/mcpServers/" + i0+"/toolFilter/" + i1,schemaPath:"#/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err13 = {instancePath:instancePath+"/mcpServers/" + i0+"/toolFilter",schemaPath:"#/properties/mcpServers/items/properties/toolFilter/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
else {
const err14 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"#/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
const err15 = {instancePath:instancePath+"/mcpServers",schemaPath:"#/properties/mcpServers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.toolDisclosure !== undefined){
let data8 = data.toolDisclosure;
if(typeof data8 !== "string"){
const err16 = {instancePath:instancePath+"/toolDisclosure",schemaPath:"#/properties/toolDisclosure/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(!((data8 === "static") || (data8 === "exploration"))){
const err17 = {instancePath:instancePath+"/toolDisclosure",schemaPath:"#/properties/toolDisclosure/enum",keyword:"enum",params:{allowedValues: schema16.properties.toolDisclosure.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.nhi !== undefined){
let data9 = data.nhi;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.clientId === undefined){
const err18 = {instancePath:instancePath+"/nhi",schemaPath:"#/properties/nhi/required",keyword:"required",params:{missingProperty: "clientId"},message:"must have required property '"+"clientId"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
for(const key2 in data9){
if(!(key2 === "clientId")){
const err19 = {instancePath:instancePath+"/nhi",schemaPath:"#/properties/nhi/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data9.clientId !== undefined){
if(typeof data9.clientId !== "string"){
const err20 = {instancePath:instancePath+"/nhi/clientId",schemaPath:"#/properties/nhi/properties/clientId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
}
else {
const err21 = {instancePath:instancePath+"/nhi",schemaPath:"#/properties/nhi/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.instructors !== undefined){
let data11 = data.instructors;
if(Array.isArray(data11)){
const len2 = data11.length;
for(let i2=0; i2<len2; i2++){
let data12 = data11[i2];
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.userId === undefined){
const err22 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"#/properties/instructors/items/required",keyword:"required",params:{missingProperty: "userId"},message:"must have required property '"+"userId"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
for(const key3 in data12){
if(!((key3 === "userId") || (key3 === "userName"))){
const err23 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"#/properties/instructors/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data12.userId !== undefined){
if(typeof data12.userId !== "string"){
const err24 = {instancePath:instancePath+"/instructors/" + i2+"/userId",schemaPath:"#/properties/instructors/items/properties/userId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data12.userName !== undefined){
if(typeof data12.userName !== "string"){
const err25 = {instancePath:instancePath+"/instructors/" + i2+"/userName",schemaPath:"#/properties/instructors/items/properties/userName/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
}
else {
const err26 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"#/properties/instructors/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err27 = {instancePath:instancePath+"/instructors",schemaPath:"#/properties/instructors/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.enabled !== undefined){
if(typeof data.enabled !== "boolean"){
const err28 = {instancePath:instancePath+"/enabled",schemaPath:"#/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
}
else {
const err29 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
