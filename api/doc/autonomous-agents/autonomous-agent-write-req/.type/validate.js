/* eslint-disable */
// @ts-nocheck

import _equal from "ajv/dist/runtime/equal.js";
const equal = _equal.default || _equal;
import ucs2length from "ajv/dist/runtime/ucs2length.js";
"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/autonomous-agent/write-req","title":"Autonomous agent","x-i18n-title":{"en":"Autonomous agent","fr":"Agent autonome"},"x-exports":["validate","types","vjsf"],"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"required":["title","persona","mcpServers","enabled"],"layout":{"title":null},"properties":{"title":{"type":"string","title":"Name","x-i18n-title":{"en":"Name","fr":"Nom"}},"persona":{"type":"string","layout":"textarea","title":"Persona","x-i18n-title":{"en":"Persona","fr":"Persona"},"description":"Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.","x-i18n-description":{"en":"Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.","fr":"Qui est cet agent autonome : son rôle, son ton et son périmètre. Devient le prompt système."}},"instructions":{"type":"string","layout":"textarea","title":"Instructions","x-i18n-title":{"en":"Instructions","fr":"Instructions"},"description":"How it should work: procedures, constraints, what to do when unsure.","x-i18n-description":{"en":"How it should work: procedures, constraints, what to do when unsure.","fr":"Comment il doit travailler : procédures, contraintes, conduite à tenir en cas de doute."}},"mcpServers":{"type":"array","default":[],"title":"MCP servers","x-i18n-title":{"en":"MCP servers","fr":"Serveurs MCP"},"description":"Picked from the servers configured for this deployment.","x-i18n-description":{"en":"Picked from the servers configured for this deployment.","fr":"Choisis parmi les serveurs configurés pour ce déploiement."},"layout":{"itemTitle":"item?.serverId || \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","additionalProperties":false,"required":["serverId"],"properties":{"serverId":{"type":"string","title":"Server","x-i18n-title":{"en":"Server","fr":"Serveur"},"layout":{"comp":"autocomplete","getItems":{"url":"${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers","itemsResults":"data.results","itemTitle":"item.name","itemKey":"item.id","itemValue":"item.id"}}},"toolFilter":{"type":"array","title":"Only these tools","x-i18n-title":{"en":"Only these tools","fr":"Uniquement ces outils"},"description":"Leave empty to expose every tool this server offers.","x-i18n-description":{"en":"Leave empty to expose every tool this server offers.","fr":"Laissez vide pour exposer tous les outils proposés par ce serveur."},"items":{"type":"string"}}}}},"nhi":{"type":"object","additionalProperties":false,"required":["clientId"],"title":"Non-human identity","x-i18n-title":{"en":"Non-human identity","fr":"Identité non humaine"},"properties":{"clientId":{"type":"string","minLength":1,"title":"Client id","x-i18n-title":{"en":"Client id","fr":"Identifiant client"}},"siteUrl":{"type":"string","readOnly":true},"issuer":{"type":"string","readOnly":true}}},"instructors":{"type":"array","default":[],"title":"Who may instruct","x-i18n-title":{"en":"Who may instruct","fr":"Qui peut donner des instructions"},"description":"Admins of the owning organization are always allowed. Anyone matched here borrows this autonomous agent's permissions.","x-i18n-description":{"en":"Admins of the owning organization are always allowed. Anyone matched here borrows this autonomous agent's permissions.","fr":"Les administrateurs de l'organisation propriétaire sont toujours autorisés. Toute personne correspondant à une référence ci-dessous emprunte les permissions de cet agent autonome."},"items":{"$ref":"https://github.com/data-fair/lib/access-ref"}},"approvals":{"type":"object","additionalProperties":false,"title":"Approvals","x-i18n-title":{"en":"Approvals","fr":"Approbations"},"description":"What happens when this autonomous agent calls a tool, by the kind of action the tool declares. \"Approve\" stops the turn until the person in the chat approves the call; a scheduled task never gets such a tool. Tools that declare nothing count as writing.","x-i18n-description":{"en":"What happens when this autonomous agent calls a tool, by the kind of action the tool declares. \"Approve\" stops the turn until the person in the chat approves the call; a scheduled task never gets such a tool. Tools that declare nothing count as writing.","fr":"Ce qui se passe quand cet agent autonome appelle un outil, selon le type d'action que l'outil déclare. « Approuver » arrête le tour jusqu'à ce que la personne dans la conversation approuve l'appel ; une tâche planifiée ne reçoit jamais un tel outil. Les outils qui ne déclarent rien comptent comme écrivant."},"properties":{"readOnly":{"type":"string","title":"Reading","x-i18n-title":{"en":"Reading","fr":"Lecture"},"default":"allow","oneOf":[{"const":"allow","title":"Allow","x-i18n-title":{"en":"Allow","fr":"Autoriser"}},{"const":"approve","title":"Approve each call","x-i18n-title":{"en":"Approve each call","fr":"Approuver chaque appel"}},{"const":"deny","title":"Never offer","x-i18n-title":{"en":"Never offer","fr":"Ne jamais proposer"}}]},"write":{"type":"string","title":"Writing","x-i18n-title":{"en":"Writing","fr":"Écriture"},"default":"allow","oneOf":[{"const":"allow","title":"Allow","x-i18n-title":{"en":"Allow","fr":"Autoriser"}},{"const":"approve","title":"Approve each call","x-i18n-title":{"en":"Approve each call","fr":"Approuver chaque appel"}},{"const":"deny","title":"Never offer","x-i18n-title":{"en":"Never offer","fr":"Ne jamais proposer"}}]},"destructive":{"type":"string","title":"Destructive","x-i18n-title":{"en":"Destructive","fr":"Destruction"},"default":"approve","oneOf":[{"const":"allow","title":"Allow","x-i18n-title":{"en":"Allow","fr":"Autoriser"}},{"const":"approve","title":"Approve each call","x-i18n-title":{"en":"Approve each call","fr":"Approuver chaque appel"}},{"const":"deny","title":"Never offer","x-i18n-title":{"en":"Never offer","fr":"Ne jamais proposer"}}]}}},"memory":{"type":"object","additionalProperties":false,"required":["enabled"],"title":"Memory","x-i18n-title":{"en":"Memory","fr":"Mémoire"},"properties":{"enabled":{"type":"boolean","default":false,"title":"Keep a memory across conversations","x-i18n-title":{"en":"Keep a memory across conversations","fr":"Conserver une mémoire entre les conversations"},"description":"The agent keeps notes it reuses in every later conversation, and reviews its past conversations to update them. Administrators can read, edit and restore this memory. Memory writes are not subject to the approval settings: every change is versioned and can be restored.","x-i18n-description":{"en":"The agent keeps notes it reuses in every later conversation, and reviews its past conversations to update them. Administrators can read, edit and restore this memory. Memory writes are not subject to the approval settings: every change is versioned and can be restored.","fr":"L'agent conserve des notes qu'il réutilise dans toutes ses conversations suivantes, et relit ses conversations passées pour les mettre à jour. Les administrateurs peuvent lire, modifier et restaurer cette mémoire. Les écritures en mémoire ne sont pas soumises aux réglages d'approbation : chaque modification est versionnée et peut être restaurée."}}}},"enabled":{"type":"boolean","default":true,"title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"}}}};
const schema17 = {"$id":"https://github.com/data-fair/lib/access-ref","x-exports":["types","validate"],"title":"Access Ref","x-i18n-title":{"fr":"Référence d'accès","en":"Access Ref","es":"Referencia de acceso","it":"Riferimento di accesso","pt":"Referência de acesso","de":"Zugriffsreferenz"},"type":"object","discriminator":{"propertyName":"mode"},"oneOfLayout":{"emptyData":true},"oneOf":[{"title":"Un membre de l'organisation","x-i18n-title":{"fr":"Un membre de l'organisation","en":"An organization member","es":"Un miembro de la organización","it":"Un membro dell'organizzazione","pt":"Um membro da organização","de":"Ein Organisationsmitglied"},"layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member"},"type":{"type":"string","const":"user"},"id":{"type":"string","title":"Membre","x-i18n-title":{"fr":"Membre","en":"Member","es":"Miembro","it":"Membro","pt":"Membro","de":"Mitglied"},"layout":{"getItems":{"url":"/simple-directory/api/organizations/${context.owner.id}/members","itemsResults":"data.results","itemTitle":"item.name","itemValue":"item.id","itemIcon":"`/simple-directory/api/avatars/user/${item.id}/avatar.png`"}}}}},{"title":"Un email","x-i18n-title":{"fr":"Un email","en":"An email","es":"Un correo electrónico","it":"Un'email","pt":"Um email","de":"Eine E-Mail"},"required":["mode","type","email"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member"},"type":{"type":"string","const":"user"},"email":{"type":"string","format":"email","title":"Adresse mail","x-i18n-title":{"fr":"Adresse mail","en":"Email address","es":"Dirección de correo","it":"Indirizzo email","pt":"Endereço de email","de":"E-Mail-Adresse"}}}},{"title":"Une organisation partenaire","x-i18n-title":{"fr":"Une organisation partenaire","en":"A partner organization","es":"Una organización asociada","it":"Un'organizzazione partner","pt":"Uma organização parceira","de":"Eine Partnerorganisation"},"layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member"},"type":{"type":"string","const":"organization"},"department":{"type":"string","const":"*"},"roles":{"type":"array","const":[],"items":{"type":"string"}},"id":{"type":"string","title":"Partenaire","x-i18n-title":{"fr":"Partenaire","en":"Partner","es":"Socio","it":"Partner","pt":"Parceiro","de":"Partner"},"layout":{"getItems":{"url":"/simple-directory/api/organizations/${context.owner.id}","itemsResults":"data.partners","itemTitle":"item.name","itemValue":"item.id","itemIcon":"`/simple-directory/api/avatars/organization/${item.id}/avatar.png`"}}}}},{"title":"Un role ou département de mon organisation","x-i18n-title":{"fr":"Un rôle ou département de mon organisation","en":"A role or department of my organization","es":"Un rol o departamento de mi organización","it":"Un ruolo o dipartimento della mia organizzazione","pt":"Um papel ou departamento da minha organização","de":"Eine Rolle oder Abteilung meiner Organisation"},"layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"internal"},"type":{"type":"string","const":"organization"},"id":{"type":"string","layout":{"comp":"none","getConstData":"context.owner.id"}},"department":{"type":"string","title":"Département","x-i18n-title":{"fr":"Département","en":"Department","es":"Departamento","it":"Dipartimento","pt":"Departamento","de":"Abteilung"},"layout":{"getItems":{"url":"/simple-directory/api/organizations/${context.owner.id}","itemsResults":"[...(data.departments || []), {id: \"*\", name: \"Tous les départements\"}, {id: \"-\", name: \"Racine de l'organisation uniquement\"}]","itemTitle":"item.name","itemValue":"item.id"}}},"roles":{"type":"array","title":"Rôles","x-i18n-title":{"fr":"Rôles","en":"Roles","es":"Roles","it":"Ruoli","pt":"Funções","de":"Rollen"},"items":{"type":"string"},"layout":{"getItems":{"url":"/simple-directory/api/organizations/${context.owner.id}","itemsResults":"data.roles"}}}}}]};
const func2 = Object.prototype.hasOwnProperty;
const func3 = ucs2length.default;
const func0 = equal;
const formats0 = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

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
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!(func2.call(schema16.properties, key0))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.title !== undefined){
if(typeof data.title !== "string"){
const err5 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.persona !== undefined){
if(typeof data.persona !== "string"){
const err6 = {instancePath:instancePath+"/persona",schemaPath:"#/properties/persona/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.instructions !== undefined){
if(typeof data.instructions !== "string"){
const err7 = {instancePath:instancePath+"/instructions",schemaPath:"#/properties/instructions/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
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
const err8 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "serverId"},message:"must have required property '"+"serverId"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key1 in data4){
if(!((key1 === "serverId") || (key1 === "toolFilter"))){
const err9 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"#/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data4.serverId !== undefined){
if(typeof data4.serverId !== "string"){
const err10 = {instancePath:instancePath+"/mcpServers/" + i0+"/serverId",schemaPath:"#/properties/mcpServers/items/properties/serverId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
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
const err11 = {instancePath:instancePath+"/mcpServers/" + i0+"/toolFilter/" + i1,schemaPath:"#/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath:instancePath+"/mcpServers/" + i0+"/toolFilter",schemaPath:"#/properties/mcpServers/items/properties/toolFilter/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
const err13 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"#/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
const err14 = {instancePath:instancePath+"/mcpServers",schemaPath:"#/properties/mcpServers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.nhi !== undefined){
let data8 = data.nhi;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.clientId === undefined){
const err15 = {instancePath:instancePath+"/nhi",schemaPath:"#/properties/nhi/required",keyword:"required",params:{missingProperty: "clientId"},message:"must have required property '"+"clientId"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
for(const key2 in data8){
if(!(((key2 === "clientId") || (key2 === "siteUrl")) || (key2 === "issuer"))){
const err16 = {instancePath:instancePath+"/nhi",schemaPath:"#/properties/nhi/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data8.clientId !== undefined){
let data9 = data8.clientId;
if(typeof data9 === "string"){
if(func3(data9) < 1){
const err17 = {instancePath:instancePath+"/nhi/clientId",schemaPath:"#/properties/nhi/properties/clientId/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
else {
const err18 = {instancePath:instancePath+"/nhi/clientId",schemaPath:"#/properties/nhi/properties/clientId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data8.siteUrl !== undefined){
if(typeof data8.siteUrl !== "string"){
const err19 = {instancePath:instancePath+"/nhi/siteUrl",schemaPath:"#/properties/nhi/properties/siteUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data8.issuer !== undefined){
if(typeof data8.issuer !== "string"){
const err20 = {instancePath:instancePath+"/nhi/issuer",schemaPath:"#/properties/nhi/properties/issuer/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
let data12 = data.instructors;
if(Array.isArray(data12)){
const len2 = data12.length;
for(let i2=0; i2<len2; i2++){
let data13 = data12[i2];
if(!(data13 && typeof data13 == "object" && !Array.isArray(data13))){
const err22 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
const _errs33 = errors;
let valid10 = false;
let passing0 = null;
const _errs34 = errors;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.mode === undefined){
const err23 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data13.type === undefined){
const err24 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data13.id === undefined){
const err25 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
for(const key3 in data13){
if(!(((key3 === "mode") || (key3 === "type")) || (key3 === "id"))){
const err26 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data13.mode !== undefined){
let data14 = data13.mode;
if(typeof data14 !== "string"){
const err27 = {instancePath:instancePath+"/instructors/" + i2+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if("member" !== data14){
const err28 = {instancePath:instancePath+"/instructors/" + i2+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data13.type !== undefined){
let data15 = data13.type;
if(typeof data15 !== "string"){
const err29 = {instancePath:instancePath+"/instructors/" + i2+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if("user" !== data15){
const err30 = {instancePath:instancePath+"/instructors/" + i2+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data13.id !== undefined){
if(typeof data13.id !== "string"){
const err31 = {instancePath:instancePath+"/instructors/" + i2+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
}
var _valid0 = _errs34 === errors;
if(_valid0){
valid10 = true;
passing0 = 0;
}
const _errs42 = errors;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.mode === undefined){
const err32 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(data13.type === undefined){
const err33 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data13.email === undefined){
const err34 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/required",keyword:"required",params:{missingProperty: "email"},message:"must have required property '"+"email"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
for(const key4 in data13){
if(!(((key4 === "mode") || (key4 === "type")) || (key4 === "email"))){
const err35 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data13.mode !== undefined){
let data17 = data13.mode;
if(typeof data17 !== "string"){
const err36 = {instancePath:instancePath+"/instructors/" + i2+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if("member" !== data17){
const err37 = {instancePath:instancePath+"/instructors/" + i2+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data13.type !== undefined){
let data18 = data13.type;
if(typeof data18 !== "string"){
const err38 = {instancePath:instancePath+"/instructors/" + i2+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if("user" !== data18){
const err39 = {instancePath:instancePath+"/instructors/" + i2+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data13.email !== undefined){
let data19 = data13.email;
if(typeof data19 === "string"){
if(!(formats0.test(data19))){
const err40 = {instancePath:instancePath+"/instructors/" + i2+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/email/format",keyword:"format",params:{format: "email"},message:"must match format \""+"email"+"\""};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
else {
const err41 = {instancePath:instancePath+"/instructors/" + i2+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/email/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
}
var _valid0 = _errs42 === errors;
if(_valid0 && valid10){
valid10 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid10 = true;
passing0 = 1;
}
const _errs50 = errors;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.mode === undefined){
const err42 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(data13.type === undefined){
const err43 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(data13.id === undefined){
const err44 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
for(const key5 in data13){
if(!(((((key5 === "mode") || (key5 === "type")) || (key5 === "department")) || (key5 === "roles")) || (key5 === "id"))){
const err45 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data13.mode !== undefined){
let data20 = data13.mode;
if(typeof data20 !== "string"){
const err46 = {instancePath:instancePath+"/instructors/" + i2+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if("member" !== data20){
const err47 = {instancePath:instancePath+"/instructors/" + i2+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data13.type !== undefined){
let data21 = data13.type;
if(typeof data21 !== "string"){
const err48 = {instancePath:instancePath+"/instructors/" + i2+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if("organization" !== data21){
const err49 = {instancePath:instancePath+"/instructors/" + i2+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data13.department !== undefined){
let data22 = data13.department;
if(typeof data22 !== "string"){
const err50 = {instancePath:instancePath+"/instructors/" + i2+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if("*" !== data22){
const err51 = {instancePath:instancePath+"/instructors/" + i2+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/department/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data13.roles !== undefined){
let data23 = data13.roles;
if(!func0(data23, schema17.oneOf[2].properties.roles.const)){
const err52 = {instancePath:instancePath+"/instructors/" + i2+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/roles/const",keyword:"const",params:{allowedValue: schema17.oneOf[2].properties.roles.const},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(Array.isArray(data23)){
const len3 = data23.length;
for(let i3=0; i3<len3; i3++){
if(typeof data23[i3] !== "string"){
const err53 = {instancePath:instancePath+"/instructors/" + i2+"/roles/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
}
else {
const err54 = {instancePath:instancePath+"/instructors/" + i2+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data13.id !== undefined){
if(typeof data13.id !== "string"){
const err55 = {instancePath:instancePath+"/instructors/" + i2+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
}
var _valid0 = _errs50 === errors;
if(_valid0 && valid10){
valid10 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid10 = true;
passing0 = 2;
}
const _errs64 = errors;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.mode === undefined){
const err56 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data13.type === undefined){
const err57 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data13.id === undefined){
const err58 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
for(const key6 in data13){
if(!(((((key6 === "mode") || (key6 === "type")) || (key6 === "id")) || (key6 === "department")) || (key6 === "roles"))){
const err59 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(data13.mode !== undefined){
let data26 = data13.mode;
if(typeof data26 !== "string"){
const err60 = {instancePath:instancePath+"/instructors/" + i2+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if("internal" !== data26){
const err61 = {instancePath:instancePath+"/instructors/" + i2+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/mode/const",keyword:"const",params:{allowedValue: "internal"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data13.type !== undefined){
let data27 = data13.type;
if(typeof data27 !== "string"){
const err62 = {instancePath:instancePath+"/instructors/" + i2+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if("organization" !== data27){
const err63 = {instancePath:instancePath+"/instructors/" + i2+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data13.id !== undefined){
if(typeof data13.id !== "string"){
const err64 = {instancePath:instancePath+"/instructors/" + i2+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(data13.department !== undefined){
if(typeof data13.department !== "string"){
const err65 = {instancePath:instancePath+"/instructors/" + i2+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
if(data13.roles !== undefined){
let data30 = data13.roles;
if(Array.isArray(data30)){
const len4 = data30.length;
for(let i4=0; i4<len4; i4++){
if(typeof data30[i4] !== "string"){
const err66 = {instancePath:instancePath+"/instructors/" + i2+"/roles/" + i4,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err67 = {instancePath:instancePath+"/instructors/" + i2+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
var _valid0 = _errs64 === errors;
if(_valid0 && valid10){
valid10 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid10 = true;
passing0 = 3;
}
}
}
}
if(!valid10){
const err68 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
else {
errors = _errs33;
if(vErrors !== null){
if(_errs33){
vErrors.length = _errs33;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err69 = {instancePath:instancePath+"/instructors",schemaPath:"#/properties/instructors/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(data.approvals !== undefined){
let data32 = data.approvals;
if(data32 && typeof data32 == "object" && !Array.isArray(data32)){
for(const key7 in data32){
if(!(((key7 === "readOnly") || (key7 === "write")) || (key7 === "destructive"))){
const err70 = {instancePath:instancePath+"/approvals",schemaPath:"#/properties/approvals/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data32.readOnly !== undefined){
let data33 = data32.readOnly;
if(typeof data33 !== "string"){
const err71 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
const _errs83 = errors;
let valid20 = false;
let passing1 = null;
const _errs84 = errors;
if("allow" !== data33){
const err72 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/oneOf/0/const",keyword:"const",params:{allowedValue: "allow"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
var _valid1 = _errs84 === errors;
if(_valid1){
valid20 = true;
passing1 = 0;
}
const _errs85 = errors;
if("approve" !== data33){
const err73 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/oneOf/1/const",keyword:"const",params:{allowedValue: "approve"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
var _valid1 = _errs85 === errors;
if(_valid1 && valid20){
valid20 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid20 = true;
passing1 = 1;
}
const _errs86 = errors;
if("deny" !== data33){
const err74 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/oneOf/2/const",keyword:"const",params:{allowedValue: "deny"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
var _valid1 = _errs86 === errors;
if(_valid1 && valid20){
valid20 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid20 = true;
passing1 = 2;
}
}
}
if(!valid20){
const err75 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
else {
errors = _errs83;
if(vErrors !== null){
if(_errs83){
vErrors.length = _errs83;
}
else {
vErrors = null;
}
}
}
}
if(data32.write !== undefined){
let data34 = data32.write;
if(typeof data34 !== "string"){
const err76 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
const _errs89 = errors;
let valid21 = false;
let passing2 = null;
const _errs90 = errors;
if("allow" !== data34){
const err77 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/oneOf/0/const",keyword:"const",params:{allowedValue: "allow"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
var _valid2 = _errs90 === errors;
if(_valid2){
valid21 = true;
passing2 = 0;
}
const _errs91 = errors;
if("approve" !== data34){
const err78 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/oneOf/1/const",keyword:"const",params:{allowedValue: "approve"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
var _valid2 = _errs91 === errors;
if(_valid2 && valid21){
valid21 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid21 = true;
passing2 = 1;
}
const _errs92 = errors;
if("deny" !== data34){
const err79 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/oneOf/2/const",keyword:"const",params:{allowedValue: "deny"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
var _valid2 = _errs92 === errors;
if(_valid2 && valid21){
valid21 = false;
passing2 = [passing2, 2];
}
else {
if(_valid2){
valid21 = true;
passing2 = 2;
}
}
}
if(!valid21){
const err80 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
else {
errors = _errs89;
if(vErrors !== null){
if(_errs89){
vErrors.length = _errs89;
}
else {
vErrors = null;
}
}
}
}
if(data32.destructive !== undefined){
let data35 = data32.destructive;
if(typeof data35 !== "string"){
const err81 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
const _errs95 = errors;
let valid22 = false;
let passing3 = null;
const _errs96 = errors;
if("allow" !== data35){
const err82 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/oneOf/0/const",keyword:"const",params:{allowedValue: "allow"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
var _valid3 = _errs96 === errors;
if(_valid3){
valid22 = true;
passing3 = 0;
}
const _errs97 = errors;
if("approve" !== data35){
const err83 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/oneOf/1/const",keyword:"const",params:{allowedValue: "approve"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
var _valid3 = _errs97 === errors;
if(_valid3 && valid22){
valid22 = false;
passing3 = [passing3, 1];
}
else {
if(_valid3){
valid22 = true;
passing3 = 1;
}
const _errs98 = errors;
if("deny" !== data35){
const err84 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/oneOf/2/const",keyword:"const",params:{allowedValue: "deny"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
var _valid3 = _errs98 === errors;
if(_valid3 && valid22){
valid22 = false;
passing3 = [passing3, 2];
}
else {
if(_valid3){
valid22 = true;
passing3 = 2;
}
}
}
if(!valid22){
const err85 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/oneOf",keyword:"oneOf",params:{passingSchemas: passing3},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
else {
errors = _errs95;
if(vErrors !== null){
if(_errs95){
vErrors.length = _errs95;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err86 = {instancePath:instancePath+"/approvals",schemaPath:"#/properties/approvals/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(data.memory !== undefined){
let data36 = data.memory;
if(data36 && typeof data36 == "object" && !Array.isArray(data36)){
if(data36.enabled === undefined){
const err87 = {instancePath:instancePath+"/memory",schemaPath:"#/properties/memory/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
for(const key8 in data36){
if(!(key8 === "enabled")){
const err88 = {instancePath:instancePath+"/memory",schemaPath:"#/properties/memory/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
if(data36.enabled !== undefined){
if(typeof data36.enabled !== "boolean"){
const err89 = {instancePath:instancePath+"/memory/enabled",schemaPath:"#/properties/memory/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
}
else {
const err90 = {instancePath:instancePath+"/memory",schemaPath:"#/properties/memory/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
if(data.enabled !== undefined){
if(typeof data.enabled !== "boolean"){
const err91 = {instancePath:instancePath+"/enabled",schemaPath:"#/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
}
else {
const err92 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
