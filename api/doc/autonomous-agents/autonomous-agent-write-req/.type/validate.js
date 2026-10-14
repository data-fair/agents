/* eslint-disable */
// @ts-nocheck

import _equal from "ajv/dist/runtime/equal.js";
const equal = _equal.default || _equal;
import ucs2length from "ajv/dist/runtime/ucs2length.js";
"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/autonomous-agent/write-req","title":"Autonomous agent","x-i18n-title":{"en":"Autonomous agent","fr":"Agent autonome"},"x-exports":["validate","types","vjsf"],"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"required":["title","persona","mcpServers","enabled"],"layout":{"title":null},"properties":{"title":{"type":"string","title":"Name","x-i18n-title":{"en":"Name","fr":"Nom"}},"persona":{"type":"string","layout":"textarea","title":"Persona","x-i18n-title":{"en":"Persona","fr":"Persona"},"description":"Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.","x-i18n-description":{"en":"Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.","fr":"Qui est cet agent autonome : son rôle, son ton et son périmètre. Devient le prompt système."}},"instructions":{"type":"string","layout":"textarea","title":"Instructions","x-i18n-title":{"en":"Instructions","fr":"Instructions"},"description":"How it should work: procedures, constraints, what to do when unsure.","x-i18n-description":{"en":"How it should work: procedures, constraints, what to do when unsure.","fr":"Comment il doit travailler : procédures, contraintes, conduite à tenir en cas de doute."}},"mcpServers":{"type":"array","default":[],"title":"MCP servers","x-i18n-title":{"en":"MCP servers","fr":"Serveurs MCP"},"description":"Picked from the servers configured for this deployment.","x-i18n-description":{"en":"Picked from the servers configured for this deployment.","fr":"Choisis parmi les serveurs configurés pour ce déploiement."},"layout":{"itemTitle":"item?.serverId || \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","additionalProperties":false,"required":["serverId"],"properties":{"serverId":{"type":"string","title":"Server","x-i18n-title":{"en":"Server","fr":"Serveur"},"layout":{"comp":"autocomplete","getItems":{"url":"${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers","itemsResults":"data.results","itemTitle":"item.name","itemKey":"item.id","itemValue":"item.id"}}},"profiles":{"type":"array","title":"Profiles","x-i18n-title":{"en":"Profiles","fr":"Profils"},"description":"What this server lets the agent do, by profile.","x-i18n-description":{"en":"What this server lets the agent do, by profile.","fr":"Ce que ce serveur permet à l'agent, par profil."},"items":{"type":"string"}},"toolFilter":{"type":"array","title":"Only these tools","x-i18n-title":{"en":"Only these tools","fr":"Uniquement ces outils"},"description":"Leave empty to expose every tool this server offers.","x-i18n-description":{"en":"Leave empty to expose every tool this server offers.","fr":"Laissez vide pour exposer tous les outils proposés par ce serveur."},"items":{"type":"string"}}}}},"nhi":{"type":"object","additionalProperties":false,"required":["clientId"],"title":"Non-human identity","x-i18n-title":{"en":"Non-human identity","fr":"Identité non humaine"},"properties":{"clientId":{"type":"string","minLength":1,"title":"Client id","x-i18n-title":{"en":"Client id","fr":"Identifiant client"}},"siteUrl":{"type":"string","readOnly":true},"issuer":{"type":"string","readOnly":true}}},"instructors":{"type":"array","default":[],"title":"Who may instruct","x-i18n-title":{"en":"Who may instruct","fr":"Qui peut donner des instructions"},"description":"Admins of the owning organization are always allowed. Anyone matched here borrows this autonomous agent's permissions.","x-i18n-description":{"en":"Admins of the owning organization are always allowed. Anyone matched here borrows this autonomous agent's permissions.","fr":"Les administrateurs de l'organisation propriétaire sont toujours autorisés. Toute personne correspondant à une référence ci-dessous emprunte les permissions de cet agent autonome."},"items":{"$ref":"https://github.com/data-fair/lib/access-ref"}},"approvals":{"type":"object","additionalProperties":false,"title":"Approvals","x-i18n-title":{"en":"Approvals","fr":"Approbations"},"description":"What happens when this autonomous agent calls a tool, by the kind of action the tool declares. \"Approve\" stops the turn until the person in the chat approves the call; a scheduled task never gets such a tool. Tools that declare nothing count as writing.","x-i18n-description":{"en":"What happens when this autonomous agent calls a tool, by the kind of action the tool declares. \"Approve\" stops the turn until the person in the chat approves the call; a scheduled task never gets such a tool. Tools that declare nothing count as writing.","fr":"Ce qui se passe quand cet agent autonome appelle un outil, selon le type d'action que l'outil déclare. « Approuver » arrête le tour jusqu'à ce que la personne dans la conversation approuve l'appel ; une tâche planifiée ne reçoit jamais un tel outil. Les outils qui ne déclarent rien comptent comme écrivant."},"properties":{"readOnly":{"type":"string","title":"Reading","x-i18n-title":{"en":"Reading","fr":"Lecture"},"default":"allow","oneOf":[{"const":"allow","title":"Allow","x-i18n-title":{"en":"Allow","fr":"Autoriser"}},{"const":"approve","title":"Approve each call","x-i18n-title":{"en":"Approve each call","fr":"Approuver chaque appel"}},{"const":"deny","title":"Never offer","x-i18n-title":{"en":"Never offer","fr":"Ne jamais proposer"}}]},"write":{"type":"string","title":"Writing","x-i18n-title":{"en":"Writing","fr":"Écriture"},"default":"allow","oneOf":[{"const":"allow","title":"Allow","x-i18n-title":{"en":"Allow","fr":"Autoriser"}},{"const":"approve","title":"Approve each call","x-i18n-title":{"en":"Approve each call","fr":"Approuver chaque appel"}},{"const":"deny","title":"Never offer","x-i18n-title":{"en":"Never offer","fr":"Ne jamais proposer"}}]},"destructive":{"type":"string","title":"Destructive","x-i18n-title":{"en":"Destructive","fr":"Destruction"},"default":"approve","oneOf":[{"const":"allow","title":"Allow","x-i18n-title":{"en":"Allow","fr":"Autoriser"}},{"const":"approve","title":"Approve each call","x-i18n-title":{"en":"Approve each call","fr":"Approuver chaque appel"}},{"const":"deny","title":"Never offer","x-i18n-title":{"en":"Never offer","fr":"Ne jamais proposer"}}]}}},"memory":{"type":"object","additionalProperties":false,"required":["enabled"],"title":"Memory","x-i18n-title":{"en":"Memory","fr":"Mémoire"},"properties":{"enabled":{"type":"boolean","default":false,"title":"Keep a memory across conversations","x-i18n-title":{"en":"Keep a memory across conversations","fr":"Conserver une mémoire entre les conversations"},"description":"The agent keeps notes it reuses in every later conversation, and tidies them once a day from what people told it. Administrators can read, edit and restore this memory. Memory writes are not subject to the approval settings: every change is versioned and can be restored.","x-i18n-description":{"en":"The agent keeps notes it reuses in every later conversation, and tidies them once a day from what people told it. Administrators can read, edit and restore this memory. Memory writes are not subject to the approval settings: every change is versioned and can be restored.","fr":"L'agent conserve des notes qu'il réutilise dans toutes ses conversations suivantes, et les remet en ordre une fois par jour à partir de ce qu'on lui a dit. Les administrateurs peuvent lire, modifier et restaurer cette mémoire. Les écritures en mémoire ne sont pas soumises aux réglages d'approbation : chaque modification est versionnée et peut être restaurée."}}}},"web":{"type":"object","additionalProperties":false,"required":["enabled"],"title":"Web access","x-i18n-title":{"en":"Web access","fr":"Accès au web"},"description":"Pages under the allowed URLs are read by the agent as text, and text can contain instructions: their authors can in effect instruct this agent, with its identity and all its tools, and make it send information out. Enable this only on agents with very restricted write and administration capabilities.","x-i18n-description":{"en":"Pages under the allowed URLs are read by the agent as text, and text can contain instructions: their authors can in effect instruct this agent, with its identity and all its tools, and make it send information out. Enable this only on agents with very restricted write and administration capabilities.","fr":"Les pages sous les URL autorisées sont lues par l'agent comme du texte, et un texte peut contenir des instructions : leurs auteurs peuvent de fait donner des instructions à cet agent, avec son identité et tous ses outils, et lui faire envoyer des informations à l'extérieur. N'activez cet accès que sur des agents aux capacités d'écriture et d'administration très restreintes."},"properties":{"enabled":{"type":"boolean","default":false,"title":"Read web pages","x-i18n-title":{"en":"Read web pages","fr":"Lire des pages web"},"description":"The agent can read pages, feeds and sitemaps under the allowed URLs, and ask an administrator of the organization, in a conversation, to allow more.","x-i18n-description":{"en":"The agent can read pages, feeds and sitemaps under the allowed URLs, and ask an administrator of the organization, in a conversation, to allow more.","fr":"L'agent peut lire les pages, flux et plans de site sous les URL autorisées, et demander à un administrateur de l'organisation, dans une conversation, d'en autoriser d'autres."}},"allowedUrls":{"type":"array","maxItems":100,"default":[],"title":"Allowed URLs","x-i18n-title":{"en":"Allowed URLs","fr":"URL autorisées"},"description":"An address can be read when it starts with one of these: \"https://github.com/data-fair\" allows the repositories of that organization only, \"https://www.data.gouv.fr/\" the whole site. A site's robots.txt, sitemaps and search description are readable as soon as one of its addresses is allowed.","x-i18n-description":{"en":"An address can be read when it starts with one of these: \"https://github.com/data-fair\" allows the repositories of that organization only, \"https://www.data.gouv.fr/\" the whole site. A site's robots.txt, sitemaps and search description are readable as soon as one of its addresses is allowed.","fr":"Une adresse peut être lue quand elle commence par l'une de celles-ci : « https://github.com/data-fair » n'autorise que les dépôts de cette organisation, « https://www.data.gouv.fr/ » tout le site. Le robots.txt, les plans de site et la description de recherche d'un site sont lisibles dès que l'une de ses adresses est autorisée."},"layout":{"if":"parent.data?.enabled"},"items":{"type":"string","minLength":1}}}},"externalMcpServers":{"type":"array","maxItems":50,"default":[],"title":"External MCP servers","x-i18n-title":{"en":"External MCP servers","fr":"Serveurs MCP externes"},"description":"Public MCP servers the agent uses anonymously — another data portal, on this platform or elsewhere. Their authors write the descriptions the agent reads, and what it sends them leaves the platform: like web access, this lets them in effect instruct the agent.","x-i18n-description":{"en":"Public MCP servers the agent uses anonymously — another data portal, on this platform or elsewhere. Their authors write the descriptions the agent reads, and what it sends them leaves the platform: like web access, this lets them in effect instruct the agent.","fr":"Serveurs MCP publics que l'agent utilise de façon anonyme — un autre portail de données, sur cette plateforme ou ailleurs. Leurs auteurs écrivent les descriptions que l'agent lit, et ce qu'il leur envoie quitte la plateforme : comme l'accès au web, cela leur permet de fait de donner des instructions à l'agent."},"layout":{"itemTitle":"item?.url || \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","additionalProperties":false,"required":["url"],"properties":{"url":{"type":"string","minLength":1,"title":"URL","x-i18n-title":{"en":"URL","fr":"URL"}}}}},"enabled":{"type":"boolean","default":true,"title":"Enabled","x-i18n-title":{"en":"Enabled","fr":"Activé"}}}};
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
if(!(((key1 === "serverId") || (key1 === "profiles")) || (key1 === "toolFilter"))){
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
if(data4.profiles !== undefined){
let data6 = data4.profiles;
if(Array.isArray(data6)){
const len1 = data6.length;
for(let i1=0; i1<len1; i1++){
if(typeof data6[i1] !== "string"){
const err11 = {instancePath:instancePath+"/mcpServers/" + i0+"/profiles/" + i1,schemaPath:"#/properties/mcpServers/items/properties/profiles/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err12 = {instancePath:instancePath+"/mcpServers/" + i0+"/profiles",schemaPath:"#/properties/mcpServers/items/properties/profiles/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data4.toolFilter !== undefined){
let data8 = data4.toolFilter;
if(Array.isArray(data8)){
const len2 = data8.length;
for(let i2=0; i2<len2; i2++){
if(typeof data8[i2] !== "string"){
const err13 = {instancePath:instancePath+"/mcpServers/" + i0+"/toolFilter/" + i2,schemaPath:"#/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err14 = {instancePath:instancePath+"/mcpServers/" + i0+"/toolFilter",schemaPath:"#/properties/mcpServers/items/properties/toolFilter/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
const err15 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"#/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
const err16 = {instancePath:instancePath+"/mcpServers",schemaPath:"#/properties/mcpServers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.nhi !== undefined){
let data10 = data.nhi;
if(data10 && typeof data10 == "object" && !Array.isArray(data10)){
if(data10.clientId === undefined){
const err17 = {instancePath:instancePath+"/nhi",schemaPath:"#/properties/nhi/required",keyword:"required",params:{missingProperty: "clientId"},message:"must have required property '"+"clientId"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key2 in data10){
if(!(((key2 === "clientId") || (key2 === "siteUrl")) || (key2 === "issuer"))){
const err18 = {instancePath:instancePath+"/nhi",schemaPath:"#/properties/nhi/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data10.clientId !== undefined){
let data11 = data10.clientId;
if(typeof data11 === "string"){
if(func3(data11) < 1){
const err19 = {instancePath:instancePath+"/nhi/clientId",schemaPath:"#/properties/nhi/properties/clientId/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
else {
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
if(data10.siteUrl !== undefined){
if(typeof data10.siteUrl !== "string"){
const err21 = {instancePath:instancePath+"/nhi/siteUrl",schemaPath:"#/properties/nhi/properties/siteUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data10.issuer !== undefined){
if(typeof data10.issuer !== "string"){
const err22 = {instancePath:instancePath+"/nhi/issuer",schemaPath:"#/properties/nhi/properties/issuer/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err23 = {instancePath:instancePath+"/nhi",schemaPath:"#/properties/nhi/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.instructors !== undefined){
let data14 = data.instructors;
if(Array.isArray(data14)){
const len3 = data14.length;
for(let i3=0; i3<len3; i3++){
let data15 = data14[i3];
if(!(data15 && typeof data15 == "object" && !Array.isArray(data15))){
const err24 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
const _errs37 = errors;
let valid12 = false;
let passing0 = null;
const _errs38 = errors;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.mode === undefined){
const err25 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data15.type === undefined){
const err26 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data15.id === undefined){
const err27 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
for(const key3 in data15){
if(!(((key3 === "mode") || (key3 === "type")) || (key3 === "id"))){
const err28 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data15.mode !== undefined){
let data16 = data15.mode;
if(typeof data16 !== "string"){
const err29 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if("member" !== data16){
const err30 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data15.type !== undefined){
let data17 = data15.type;
if(typeof data17 !== "string"){
const err31 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if("user" !== data17){
const err32 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data15.id !== undefined){
if(typeof data15.id !== "string"){
const err33 = {instancePath:instancePath+"/instructors/" + i3+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
}
var _valid0 = _errs38 === errors;
if(_valid0){
valid12 = true;
passing0 = 0;
}
const _errs46 = errors;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.mode === undefined){
const err34 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data15.type === undefined){
const err35 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data15.email === undefined){
const err36 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/required",keyword:"required",params:{missingProperty: "email"},message:"must have required property '"+"email"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
for(const key4 in data15){
if(!(((key4 === "mode") || (key4 === "type")) || (key4 === "email"))){
const err37 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data15.mode !== undefined){
let data19 = data15.mode;
if(typeof data19 !== "string"){
const err38 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if("member" !== data19){
const err39 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data15.type !== undefined){
let data20 = data15.type;
if(typeof data20 !== "string"){
const err40 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if("user" !== data20){
const err41 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data15.email !== undefined){
let data21 = data15.email;
if(typeof data21 === "string"){
if(!(formats0.test(data21))){
const err42 = {instancePath:instancePath+"/instructors/" + i3+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/email/format",keyword:"format",params:{format: "email"},message:"must match format \""+"email"+"\""};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
else {
const err43 = {instancePath:instancePath+"/instructors/" + i3+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/email/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
}
var _valid0 = _errs46 === errors;
if(_valid0 && valid12){
valid12 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid12 = true;
passing0 = 1;
}
const _errs54 = errors;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.mode === undefined){
const err44 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data15.type === undefined){
const err45 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data15.id === undefined){
const err46 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
for(const key5 in data15){
if(!(((((key5 === "mode") || (key5 === "type")) || (key5 === "department")) || (key5 === "roles")) || (key5 === "id"))){
const err47 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data15.mode !== undefined){
let data22 = data15.mode;
if(typeof data22 !== "string"){
const err48 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if("member" !== data22){
const err49 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data15.type !== undefined){
let data23 = data15.type;
if(typeof data23 !== "string"){
const err50 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if("organization" !== data23){
const err51 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data15.department !== undefined){
let data24 = data15.department;
if(typeof data24 !== "string"){
const err52 = {instancePath:instancePath+"/instructors/" + i3+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if("*" !== data24){
const err53 = {instancePath:instancePath+"/instructors/" + i3+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/department/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
if(data15.roles !== undefined){
let data25 = data15.roles;
if(!func0(data25, schema17.oneOf[2].properties.roles.const)){
const err54 = {instancePath:instancePath+"/instructors/" + i3+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/roles/const",keyword:"const",params:{allowedValue: schema17.oneOf[2].properties.roles.const},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(Array.isArray(data25)){
const len4 = data25.length;
for(let i4=0; i4<len4; i4++){
if(typeof data25[i4] !== "string"){
const err55 = {instancePath:instancePath+"/instructors/" + i3+"/roles/" + i4,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err56 = {instancePath:instancePath+"/instructors/" + i3+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data15.id !== undefined){
if(typeof data15.id !== "string"){
const err57 = {instancePath:instancePath+"/instructors/" + i3+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
var _valid0 = _errs54 === errors;
if(_valid0 && valid12){
valid12 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid12 = true;
passing0 = 2;
}
const _errs68 = errors;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.mode === undefined){
const err58 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data15.type === undefined){
const err59 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data15.id === undefined){
const err60 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
for(const key6 in data15){
if(!(((((key6 === "mode") || (key6 === "type")) || (key6 === "id")) || (key6 === "department")) || (key6 === "roles"))){
const err61 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data15.mode !== undefined){
let data28 = data15.mode;
if(typeof data28 !== "string"){
const err62 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if("internal" !== data28){
const err63 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/mode/const",keyword:"const",params:{allowedValue: "internal"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data15.type !== undefined){
let data29 = data15.type;
if(typeof data29 !== "string"){
const err64 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if("organization" !== data29){
const err65 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
if(data15.id !== undefined){
if(typeof data15.id !== "string"){
const err66 = {instancePath:instancePath+"/instructors/" + i3+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data15.department !== undefined){
if(typeof data15.department !== "string"){
const err67 = {instancePath:instancePath+"/instructors/" + i3+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data15.roles !== undefined){
let data32 = data15.roles;
if(Array.isArray(data32)){
const len5 = data32.length;
for(let i5=0; i5<len5; i5++){
if(typeof data32[i5] !== "string"){
const err68 = {instancePath:instancePath+"/instructors/" + i3+"/roles/" + i5,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
}
else {
const err69 = {instancePath:instancePath+"/instructors/" + i3+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
}
var _valid0 = _errs68 === errors;
if(_valid0 && valid12){
valid12 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid12 = true;
passing0 = 3;
}
}
}
}
if(!valid12){
const err70 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
else {
errors = _errs37;
if(vErrors !== null){
if(_errs37){
vErrors.length = _errs37;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err71 = {instancePath:instancePath+"/instructors",schemaPath:"#/properties/instructors/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(data.approvals !== undefined){
let data34 = data.approvals;
if(data34 && typeof data34 == "object" && !Array.isArray(data34)){
for(const key7 in data34){
if(!(((key7 === "readOnly") || (key7 === "write")) || (key7 === "destructive"))){
const err72 = {instancePath:instancePath+"/approvals",schemaPath:"#/properties/approvals/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(data34.readOnly !== undefined){
let data35 = data34.readOnly;
if(typeof data35 !== "string"){
const err73 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
const _errs87 = errors;
let valid22 = false;
let passing1 = null;
const _errs88 = errors;
if("allow" !== data35){
const err74 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/oneOf/0/const",keyword:"const",params:{allowedValue: "allow"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
var _valid1 = _errs88 === errors;
if(_valid1){
valid22 = true;
passing1 = 0;
}
const _errs89 = errors;
if("approve" !== data35){
const err75 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/oneOf/1/const",keyword:"const",params:{allowedValue: "approve"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
var _valid1 = _errs89 === errors;
if(_valid1 && valid22){
valid22 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid22 = true;
passing1 = 1;
}
const _errs90 = errors;
if("deny" !== data35){
const err76 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/oneOf/2/const",keyword:"const",params:{allowedValue: "deny"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
var _valid1 = _errs90 === errors;
if(_valid1 && valid22){
valid22 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid22 = true;
passing1 = 2;
}
}
}
if(!valid22){
const err77 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
else {
errors = _errs87;
if(vErrors !== null){
if(_errs87){
vErrors.length = _errs87;
}
else {
vErrors = null;
}
}
}
}
if(data34.write !== undefined){
let data36 = data34.write;
if(typeof data36 !== "string"){
const err78 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
const _errs93 = errors;
let valid23 = false;
let passing2 = null;
const _errs94 = errors;
if("allow" !== data36){
const err79 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/oneOf/0/const",keyword:"const",params:{allowedValue: "allow"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
var _valid2 = _errs94 === errors;
if(_valid2){
valid23 = true;
passing2 = 0;
}
const _errs95 = errors;
if("approve" !== data36){
const err80 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/oneOf/1/const",keyword:"const",params:{allowedValue: "approve"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
var _valid2 = _errs95 === errors;
if(_valid2 && valid23){
valid23 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid23 = true;
passing2 = 1;
}
const _errs96 = errors;
if("deny" !== data36){
const err81 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/oneOf/2/const",keyword:"const",params:{allowedValue: "deny"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
var _valid2 = _errs96 === errors;
if(_valid2 && valid23){
valid23 = false;
passing2 = [passing2, 2];
}
else {
if(_valid2){
valid23 = true;
passing2 = 2;
}
}
}
if(!valid23){
const err82 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
else {
errors = _errs93;
if(vErrors !== null){
if(_errs93){
vErrors.length = _errs93;
}
else {
vErrors = null;
}
}
}
}
if(data34.destructive !== undefined){
let data37 = data34.destructive;
if(typeof data37 !== "string"){
const err83 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
const _errs99 = errors;
let valid24 = false;
let passing3 = null;
const _errs100 = errors;
if("allow" !== data37){
const err84 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/oneOf/0/const",keyword:"const",params:{allowedValue: "allow"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
var _valid3 = _errs100 === errors;
if(_valid3){
valid24 = true;
passing3 = 0;
}
const _errs101 = errors;
if("approve" !== data37){
const err85 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/oneOf/1/const",keyword:"const",params:{allowedValue: "approve"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
var _valid3 = _errs101 === errors;
if(_valid3 && valid24){
valid24 = false;
passing3 = [passing3, 1];
}
else {
if(_valid3){
valid24 = true;
passing3 = 1;
}
const _errs102 = errors;
if("deny" !== data37){
const err86 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/oneOf/2/const",keyword:"const",params:{allowedValue: "deny"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
var _valid3 = _errs102 === errors;
if(_valid3 && valid24){
valid24 = false;
passing3 = [passing3, 2];
}
else {
if(_valid3){
valid24 = true;
passing3 = 2;
}
}
}
if(!valid24){
const err87 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/oneOf",keyword:"oneOf",params:{passingSchemas: passing3},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
else {
errors = _errs99;
if(vErrors !== null){
if(_errs99){
vErrors.length = _errs99;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err88 = {instancePath:instancePath+"/approvals",schemaPath:"#/properties/approvals/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
if(data.memory !== undefined){
let data38 = data.memory;
if(data38 && typeof data38 == "object" && !Array.isArray(data38)){
if(data38.enabled === undefined){
const err89 = {instancePath:instancePath+"/memory",schemaPath:"#/properties/memory/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
for(const key8 in data38){
if(!(key8 === "enabled")){
const err90 = {instancePath:instancePath+"/memory",schemaPath:"#/properties/memory/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
if(data38.enabled !== undefined){
if(typeof data38.enabled !== "boolean"){
const err91 = {instancePath:instancePath+"/memory/enabled",schemaPath:"#/properties/memory/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
const err92 = {instancePath:instancePath+"/memory",schemaPath:"#/properties/memory/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
if(data.web !== undefined){
let data40 = data.web;
if(data40 && typeof data40 == "object" && !Array.isArray(data40)){
if(data40.enabled === undefined){
const err93 = {instancePath:instancePath+"/web",schemaPath:"#/properties/web/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
for(const key9 in data40){
if(!((key9 === "enabled") || (key9 === "allowedUrls"))){
const err94 = {instancePath:instancePath+"/web",schemaPath:"#/properties/web/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
if(data40.enabled !== undefined){
if(typeof data40.enabled !== "boolean"){
const err95 = {instancePath:instancePath+"/web/enabled",schemaPath:"#/properties/web/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
if(data40.allowedUrls !== undefined){
let data42 = data40.allowedUrls;
if(Array.isArray(data42)){
if(data42.length > 100){
const err96 = {instancePath:instancePath+"/web/allowedUrls",schemaPath:"#/properties/web/properties/allowedUrls/maxItems",keyword:"maxItems",params:{limit: 100},message:"must NOT have more than 100 items"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
const len6 = data42.length;
for(let i6=0; i6<len6; i6++){
let data43 = data42[i6];
if(typeof data43 === "string"){
if(func3(data43) < 1){
const err97 = {instancePath:instancePath+"/web/allowedUrls/" + i6,schemaPath:"#/properties/web/properties/allowedUrls/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
else {
const err98 = {instancePath:instancePath+"/web/allowedUrls/" + i6,schemaPath:"#/properties/web/properties/allowedUrls/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
}
else {
const err99 = {instancePath:instancePath+"/web/allowedUrls",schemaPath:"#/properties/web/properties/allowedUrls/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
else {
const err100 = {instancePath:instancePath+"/web",schemaPath:"#/properties/web/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
if(data.externalMcpServers !== undefined){
let data44 = data.externalMcpServers;
if(Array.isArray(data44)){
if(data44.length > 50){
const err101 = {instancePath:instancePath+"/externalMcpServers",schemaPath:"#/properties/externalMcpServers/maxItems",keyword:"maxItems",params:{limit: 50},message:"must NOT have more than 50 items"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
const len7 = data44.length;
for(let i7=0; i7<len7; i7++){
let data45 = data44[i7];
if(data45 && typeof data45 == "object" && !Array.isArray(data45)){
if(data45.url === undefined){
const err102 = {instancePath:instancePath+"/externalMcpServers/" + i7,schemaPath:"#/properties/externalMcpServers/items/required",keyword:"required",params:{missingProperty: "url"},message:"must have required property '"+"url"+"'"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
for(const key10 in data45){
if(!(key10 === "url")){
const err103 = {instancePath:instancePath+"/externalMcpServers/" + i7,schemaPath:"#/properties/externalMcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key10},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
if(data45.url !== undefined){
let data46 = data45.url;
if(typeof data46 === "string"){
if(func3(data46) < 1){
const err104 = {instancePath:instancePath+"/externalMcpServers/" + i7+"/url",schemaPath:"#/properties/externalMcpServers/items/properties/url/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err105 = {instancePath:instancePath+"/externalMcpServers/" + i7+"/url",schemaPath:"#/properties/externalMcpServers/items/properties/url/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err106 = {instancePath:instancePath+"/externalMcpServers/" + i7,schemaPath:"#/properties/externalMcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
}
}
else {
const err107 = {instancePath:instancePath+"/externalMcpServers",schemaPath:"#/properties/externalMcpServers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
}
if(data.enabled !== undefined){
if(typeof data.enabled !== "boolean"){
const err108 = {instancePath:instancePath+"/enabled",schemaPath:"#/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
}
}
else {
const err109 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
