<script setup>
// @ts-nocheck

import { StatefulLayout } from '@json-layout/core/state'
import { ref, shallowRef, getCurrentInstance, useSlots, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

import Tree from '@koumoul/vjsf/components/tree.vue'
import { useVjsf, emits } from '@koumoul/vjsf/composables/use-vjsf.js'
import '@koumoul/vjsf/styles/vjsf.css'


import sectionNode from '@koumoul/vjsf/components/nodes/section.vue'

import listNode from '@koumoul/vjsf/components/nodes/list.vue'

import autocompleteNode from '@koumoul/vjsf/components/nodes/autocomplete.vue'

import comboboxNode from '@koumoul/vjsf/components/nodes/combobox.vue'

import textfieldNode from '@koumoul/vjsf/components/nodes/text-field.vue'

import checkboxNode from '@koumoul/vjsf/components/nodes/checkbox.vue'


import localizeErrors from "ajv-i18n/localize/fr/index.js";
import ucs2length from "ajv/dist/runtime/ucs2length.js";

const export0 = validate22;
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items"};
const schema28 = {"type":"string","__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items","errorMessage":{}};

function validate22(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export0" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate22.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data !== "string"){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.type,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err1 of vErrors){
if(!err1.emUsed){
emErrs0.push(err1);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"dynamicProps":false,"dynamicItems":false};

const export1 = validate24;
const schema29 = {"$id":"export1","$ref":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items"};
const schema30 = {"type":"object","additionalProperties":false,"required":["serverId"],"properties":{"serverId":{"type":"string","title":"Serveur","layout":{"comp":"autocomplete","getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers","pure":true,"dataAlias":"value","ref":2},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":5},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":3},"itemKey":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/serverId","errorMessage":{}},"toolFilter":{"type":"array","title":"Uniquement ces outils","description":"Laissez vide pour exposer tous les outils proposés par ce serveur.","items":{"type":"string","__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items","errorMessage":{"required":{"serverId":"information obligatoire"}}};
const obj0 = {"required":"missingProperty","dependencies":"property","dependentRequired":"property"};

function validate24(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export1" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate24.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.serverId === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "serverId"},message:"must have required property '"+"serverId"+"'",schema:schema30.required,parentSchema:schema30,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "serverId") || (key0 === "toolFilter"))){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema30,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.serverId !== undefined){
let data0 = data.serverId;
if(typeof data0 !== "string"){
const err2 = {instancePath:instancePath+"/serverId",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/serverId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.properties.serverId.type,parentSchema:schema30.properties.serverId,data:data0};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err3 of vErrors){
if(!err3.emUsed){
emErrs0.push(err3);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.toolFilter !== undefined){
let data1 = data.toolFilter;
if(Array.isArray(data1)){
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(typeof data2 !== "string"){
const err4 = {instancePath:instancePath+"/toolFilter/" + i0,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.properties.toolFilter.items.type,parentSchema:schema30.properties.toolFilter.items,data:data2};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err5 of vErrors){
if(!err5.emUsed){
emErrs1.push(err5);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
}
else {
const err6 = {instancePath:instancePath+"/toolFilter",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema30.properties.toolFilter.type,parentSchema:schema30.properties.toolFilter,data:data1};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err7 of vErrors){
if(!err7.emUsed){
emErrs2.push(err7);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
}
else {
const err8 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema30.type,parentSchema:schema30,data};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"serverId":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err9 of vErrors){
if((((((err9.keyword !== "errorMessage") && (!err9.emUsed)) && (err9.instancePath === instancePath)) && (err9.keyword in emErrors0)) && (err9.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items") === 0)) && (/^\/[^\/]*$/.test(err9.schemaPath.slice(92)))){
emPropParams0 = obj0[err9.keyword];
emParamsErrors0 = emErrors0[err9.keyword][err9.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err9);
err9.emUsed = true;
}
}
}
for(const key1 in emErrors0){
for(const keyProp0 in emErrors0[key1]){
emParamsErrors0 = emErrors0[key1][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key1] && templates0[key1][keyProp0];
const err10 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema30.errorMessage[key1][keyProp0],schema:schema30.errorMessage,parentSchema:schema30,data};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
const emErrs3 = [];
for(const err11 of vErrors){
if(!err11.emUsed){
emErrs3.push(err11);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export2 = validate25;
const schema31 = {"$id":"export2","$ref":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items"};
const schema32 = {"type":"object","additionalProperties":false,"required":["url"],"properties":{"url":{"type":"string","minLength":1,"title":"URL","__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/properties/url","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items","errorMessage":{"required":{"url":"information obligatoire"}}};
const func1 = ucs2length.default;

function validate25(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export2" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate25.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.url === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/required",keyword:"required",params:{missingProperty: "url"},message:"must have required property '"+"url"+"'",schema:schema32.required,parentSchema:schema32,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(key0 === "url")){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema32,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.url !== undefined){
let data0 = data.url;
if(typeof data0 === "string"){
if(func1(data0) < 1){
const err2 = {instancePath:instancePath+"/url",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/properties/url/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters",schema:1,parentSchema:schema32.properties.url,data:data0};
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
const err3 = {instancePath:instancePath+"/url",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/properties/url/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema32.properties.url.type,parentSchema:schema32.properties.url,data:data0};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err4 of vErrors){
if(!err4.emUsed){
emErrs0.push(err4);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
}
else {
const err5 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema32.type,parentSchema:schema32,data};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"url":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err6 of vErrors){
if((((((err6.keyword !== "errorMessage") && (!err6.emUsed)) && (err6.instancePath === instancePath)) && (err6.keyword in emErrors0)) && (err6.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items") === 0)) && (/^\/[^\/]*$/.test(err6.schemaPath.slice(100)))){
emPropParams0 = obj0[err6.keyword];
emParamsErrors0 = emErrors0[err6.keyword][err6.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err6);
err6.emUsed = true;
}
}
}
for(const key1 in emErrors0){
for(const keyProp0 in emErrors0[key1]){
emParamsErrors0 = emErrors0[key1][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key1] && templates0[key1][keyProp0];
const err7 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema32.errorMessage[key1][keyProp0],schema:schema32.errorMessage,parentSchema:schema32,data};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
const emErrs1 = [];
for(const err8 of vErrors){
if(!err8.emUsed){
emErrs1.push(err8);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export3 = validate26;
const schema33 = {"$id":"export3","$ref":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items"};
const schema34 = {"type":"string","minLength":1,"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items","errorMessage":{}};

function validate26(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export3" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate26.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func1(data) < 1){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters",schema:1,parentSchema:schema34,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
else {
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema34.type,parentSchema:schema34,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err2 of vErrors){
if(!err2.emUsed){
emErrs0.push(err2);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"dynamicProps":false,"dynamicItems":false};

const export4 = validate27;
const schema35 = {"$id":"export4","$ref":"https://github.com/data-fair/agents/autonomous-agent/form-tools#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/autonomous-agent/form-tools","x-exports":["vjsf"],"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"required":["mcpServers"],"layout":{"title":null},"properties":{"mcpServers":{"type":"array","default":[],"title":"Serveurs MCP","description":"Choisis parmi les serveurs configurés pour ce déploiement.","layout":{"itemTitle":"item?.serverId || \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","additionalProperties":false,"required":["serverId"],"properties":{"serverId":{"type":"string","title":"Serveur","layout":{"comp":"autocomplete","getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers","pure":true,"dataAlias":"value","ref":2},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":5},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":3},"itemKey":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/serverId","errorMessage":{}},"toolFilter":{"type":"array","title":"Uniquement ces outils","description":"Laissez vide pour exposer tous les outils proposés par ce serveur.","items":{"type":"string","__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items","errorMessage":{"required":{"serverId":"information obligatoire"}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers","errorMessage":{}},"externalMcpServers":{"type":"array","maxItems":50,"default":[],"title":"Serveurs MCP externes","description":"Serveurs MCP publics que l'agent utilise de façon anonyme — un autre portail de données, sur cette plateforme ou ailleurs. Leurs auteurs écrivent les descriptions que l'agent lit, et ce qu'il leur envoie quitte la plateforme : comme l'accès au web, cela leur permet de fait de donner des instructions à l'agent.","layout":{"itemTitle":"item?.url || \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","additionalProperties":false,"required":["url"],"properties":{"url":{"type":"string","minLength":1,"title":"URL","__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/properties/url","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items","errorMessage":{"required":{"url":"information obligatoire"}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers","errorMessage":{}},"web":{"type":"object","additionalProperties":false,"required":["enabled"],"title":"Accès au web","description":"Les pages sous les URL autorisées sont lues par l'agent comme du texte, et un texte peut contenir des instructions : leurs auteurs peuvent de fait donner des instructions à cet agent, avec son identité et tous ses outils, et lui faire envoyer des informations à l'extérieur. N'activez cet accès que sur des agents aux capacités d'écriture et d'administration très restreintes.","properties":{"enabled":{"type":"boolean","default":false,"title":"Lire des pages web","description":"L'agent peut lire les pages, flux et plans de site sous les URL autorisées, et demander à un administrateur de l'organisation, dans une conversation, d'en autoriser d'autres.","__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/enabled","errorMessage":{}},"allowedUrls":{"type":"array","maxItems":100,"default":[],"title":"URL autorisées","description":"Une adresse peut être lue quand elle commence par l'une de celles-ci : « https://github.com/data-fair » n'autorise que les dépôts de cette organisation, « https://www.data.gouv.fr/ » tout le site. Le robots.txt, les plans de site et la description de recherche d'un site sont lisibles dès que l'une de ses adresses est autorisée.","layout":{"if":"parent.data?.enabled"},"items":{"type":"string","minLength":1,"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web","errorMessage":{"required":{"enabled":"information obligatoire"}}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-tools#","errorMessage":{"required":{"mcpServers":"information obligatoire"}}};

function validate27(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export4" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate27.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.mcpServers === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/required",keyword:"required",params:{missingProperty: "mcpServers"},message:"must have required property '"+"mcpServers"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "mcpServers") || (key0 === "externalMcpServers")) || (key0 === "web"))){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.mcpServers !== undefined){
let data0 = data.mcpServers;
if(Array.isArray(data0)){
const len0 = data0.length;
for(let i0=0; i0<len0; i0++){
let data1 = data0[i0];
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.serverId === undefined){
const err2 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "serverId"},message:"must have required property '"+"serverId"+"'",schema:schema27.properties.mcpServers.items.required,parentSchema:schema27.properties.mcpServers.items,data:data1};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key1 in data1){
if(!((key1 === "serverId") || (key1 === "toolFilter"))){
const err3 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.mcpServers.items,data:data1};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data1.serverId !== undefined){
let data2 = data1.serverId;
if(typeof data2 !== "string"){
const err4 = {instancePath:instancePath+"/mcpServers/" + i0+"/serverId",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/serverId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.mcpServers.items.properties.serverId.type,parentSchema:schema27.properties.mcpServers.items.properties.serverId,data:data2};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err5 of vErrors){
if(!err5.emUsed){
emErrs0.push(err5);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data1.toolFilter !== undefined){
let data3 = data1.toolFilter;
if(Array.isArray(data3)){
const len1 = data3.length;
for(let i1=0; i1<len1; i1++){
let data4 = data3[i1];
if(typeof data4 !== "string"){
const err6 = {instancePath:instancePath+"/mcpServers/" + i0+"/toolFilter/" + i1,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.mcpServers.items.properties.toolFilter.items.type,parentSchema:schema27.properties.mcpServers.items.properties.toolFilter.items,data:data4};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err7 of vErrors){
if(!err7.emUsed){
emErrs1.push(err7);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
}
else {
const err8 = {instancePath:instancePath+"/mcpServers/" + i0+"/toolFilter",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.mcpServers.items.properties.toolFilter.type,parentSchema:schema27.properties.mcpServers.items.properties.toolFilter,data:data3};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err9 of vErrors){
if(!err9.emUsed){
emErrs2.push(err9);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
}
else {
const err10 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.mcpServers.items.type,parentSchema:schema27.properties.mcpServers.items,data:data1};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"serverId":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err11 of vErrors){
if((((((err11.keyword !== "errorMessage") && (!err11.emUsed)) && (err11.instancePath === instancePath+"/mcpServers/" + i0)) && (err11.keyword in emErrors0)) && (err11.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items") === 0)) && (/^\/[^\/]*$/.test(err11.schemaPath.slice(92)))){
emPropParams0 = obj0[err11.keyword];
emParamsErrors0 = emErrors0[err11.keyword][err11.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err11);
err11.emUsed = true;
}
}
}
for(const key2 in emErrors0){
for(const keyProp0 in emErrors0[key2]){
emParamsErrors0 = emErrors0[key2][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key2] && templates0[key2][keyProp0];
const err12 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.mcpServers.items.errorMessage[key2][keyProp0],schema:schema27.properties.mcpServers.items.errorMessage,parentSchema:schema27.properties.mcpServers.items,data:data1};
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
const emErrs3 = [];
for(const err13 of vErrors){
if(!err13.emUsed){
emErrs3.push(err13);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
}
else {
const err14 = {instancePath:instancePath+"/mcpServers",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.mcpServers.type,parentSchema:schema27.properties.mcpServers,data:data0};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err15 of vErrors){
if(!err15.emUsed){
emErrs4.push(err15);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
if(data.externalMcpServers !== undefined){
let data5 = data.externalMcpServers;
if(Array.isArray(data5)){
if(data5.length > 50){
const err16 = {instancePath:instancePath+"/externalMcpServers",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/maxItems",keyword:"maxItems",params:{limit: 50},message:"must NOT have more than 50 items",schema:50,parentSchema:schema27.properties.externalMcpServers,data:data5};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
const len2 = data5.length;
for(let i2=0; i2<len2; i2++){
let data6 = data5[i2];
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.url === undefined){
const err17 = {instancePath:instancePath+"/externalMcpServers/" + i2,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/required",keyword:"required",params:{missingProperty: "url"},message:"must have required property '"+"url"+"'",schema:schema27.properties.externalMcpServers.items.required,parentSchema:schema27.properties.externalMcpServers.items,data:data6};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key3 in data6){
if(!(key3 === "url")){
const err18 = {instancePath:instancePath+"/externalMcpServers/" + i2,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.externalMcpServers.items,data:data6};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data6.url !== undefined){
let data7 = data6.url;
if(typeof data7 === "string"){
if(func1(data7) < 1){
const err19 = {instancePath:instancePath+"/externalMcpServers/" + i2+"/url",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/properties/url/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters",schema:1,parentSchema:schema27.properties.externalMcpServers.items.properties.url,data:data7};
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
const err20 = {instancePath:instancePath+"/externalMcpServers/" + i2+"/url",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/properties/url/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.externalMcpServers.items.properties.url.type,parentSchema:schema27.properties.externalMcpServers.items.properties.url,data:data7};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err21 of vErrors){
if(!err21.emUsed){
emErrs5.push(err21);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
}
else {
const err22 = {instancePath:instancePath+"/externalMcpServers/" + i2,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.externalMcpServers.items.type,parentSchema:schema27.properties.externalMcpServers.items,data:data6};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"url":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err23 of vErrors){
if((((((err23.keyword !== "errorMessage") && (!err23.emUsed)) && (err23.instancePath === instancePath+"/externalMcpServers/" + i2)) && (err23.keyword in emErrors1)) && (err23.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items") === 0)) && (/^\/[^\/]*$/.test(err23.schemaPath.slice(100)))){
emPropParams1 = obj0[err23.keyword];
emParamsErrors1 = emErrors1[err23.keyword][err23.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err23);
err23.emUsed = true;
}
}
}
for(const key4 in emErrors1){
for(const keyProp1 in emErrors1[key4]){
emParamsErrors1 = emErrors1[key4][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key4] && templates1[key4][keyProp1];
const err24 = {instancePath:instancePath+"/externalMcpServers/" + i2,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.properties.externalMcpServers.items.errorMessage[key4][keyProp1],schema:schema27.properties.externalMcpServers.items.errorMessage,parentSchema:schema27.properties.externalMcpServers.items,data:data6};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
}
const emErrs6 = [];
for(const err25 of vErrors){
if(!err25.emUsed){
emErrs6.push(err25);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
}
else {
const err26 = {instancePath:instancePath+"/externalMcpServers",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.externalMcpServers.type,parentSchema:schema27.properties.externalMcpServers,data:data5};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err27 of vErrors){
if(!err27.emUsed){
emErrs7.push(err27);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data.web !== undefined){
let data8 = data.web;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.enabled === undefined){
const err28 = {instancePath:instancePath+"/web",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.web.required,parentSchema:schema27.properties.web,data:data8};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
for(const key5 in data8){
if(!((key5 === "enabled") || (key5 === "allowedUrls"))){
const err29 = {instancePath:instancePath+"/web",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.web,data:data8};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data8.enabled !== undefined){
let data9 = data8.enabled;
if(typeof data9 !== "boolean"){
const err30 = {instancePath:instancePath+"/web/enabled",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.web.properties.enabled.type,parentSchema:schema27.properties.web.properties.enabled,data:data9};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err31 of vErrors){
if(!err31.emUsed){
emErrs8.push(err31);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
if(data8.allowedUrls !== undefined){
let data10 = data8.allowedUrls;
if(Array.isArray(data10)){
if(data10.length > 100){
const err32 = {instancePath:instancePath+"/web/allowedUrls",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/maxItems",keyword:"maxItems",params:{limit: 100},message:"must NOT have more than 100 items",schema:100,parentSchema:schema27.properties.web.properties.allowedUrls,data:data10};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
const len3 = data10.length;
for(let i3=0; i3<len3; i3++){
let data11 = data10[i3];
if(typeof data11 === "string"){
if(func1(data11) < 1){
const err33 = {instancePath:instancePath+"/web/allowedUrls/" + i3,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters",schema:1,parentSchema:schema27.properties.web.properties.allowedUrls.items,data:data11};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
else {
const err34 = {instancePath:instancePath+"/web/allowedUrls/" + i3,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.web.properties.allowedUrls.items.type,parentSchema:schema27.properties.web.properties.allowedUrls.items,data:data11};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err35 of vErrors){
if(!err35.emUsed){
emErrs9.push(err35);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
}
else {
const err36 = {instancePath:instancePath+"/web/allowedUrls",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.web.properties.allowedUrls.type,parentSchema:schema27.properties.web.properties.allowedUrls,data:data10};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err37 of vErrors){
if(!err37.emUsed){
emErrs10.push(err37);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
}
else {
const err38 = {instancePath:instancePath+"/web",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.web.type,parentSchema:schema27.properties.web,data:data8};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"enabled":[]}};
const templates2 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err39 of vErrors){
if((((((err39.keyword !== "errorMessage") && (!err39.emUsed)) && (err39.instancePath === instancePath+"/web")) && (err39.keyword in emErrors2)) && (err39.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web") === 0)) && (/^\/[^\/]*$/.test(err39.schemaPath.slice(79)))){
emPropParams2 = obj0[err39.keyword];
emParamsErrors2 = emErrors2[err39.keyword][err39.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err39);
err39.emUsed = true;
}
}
}
for(const key6 in emErrors2){
for(const keyProp2 in emErrors2[key6]){
emParamsErrors2 = emErrors2[key6][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates2[key6] && templates2[key6][keyProp2];
const err40 = {instancePath:instancePath+"/web",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema27.properties.web.errorMessage[key6][keyProp2],schema:schema27.properties.web.errorMessage,parentSchema:schema27.properties.web,data:data8};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
}
const emErrs11 = [];
for(const err41 of vErrors){
if(!err41.emUsed){
emErrs11.push(err41);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
}
}
else {
const err42 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(errors > 0){
const emErrors3 = {"required":{"mcpServers":[]}};
const templates3 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err43 of vErrors){
if((((((err43.keyword !== "errorMessage") && (!err43.emUsed)) && (err43.instancePath === instancePath)) && (err43.keyword in emErrors3)) && (err43.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/form-tools#") === 0)) && (/^\/[^\/]*$/.test(err43.schemaPath.slice(64)))){
emPropParams3 = obj0[err43.keyword];
emParamsErrors3 = emErrors3[err43.keyword][err43.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err43);
err43.emUsed = true;
}
}
}
for(const key7 in emErrors3){
for(const keyProp3 in emErrors3[key7]){
emParamsErrors3 = emErrors3[key7][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates3[key7] && templates3[key7][keyProp3];
const err44 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-tools#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema27.errorMessage[key7][keyProp3],schema:schema27.errorMessage,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
}
const emErrs12 = [];
for(const err45 of vErrors){
if(!err45.emUsed){
emErrs12.push(err45);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
validate27.errors = vErrors;
return errors === 0;
}
validate27.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
function expression0(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.defaultData)
}function expression1(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item?.serverId || "")
}function expression2(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers`
}function expression3(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item.name)
}function expression4(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item.id)
}function expression5(data,body,options,context,display,layout,readOnly,summary,validates
) {
return (data.results)
}function expression6(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item?.url || "")
}function expression7(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return (parent.data?.enabled)
}
const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/autonomous-agent/form-tools#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/autonomous-agent/form-tools#": {
      title: "main",
      root: "https://github.com/data-fair/agents/autonomous-agent/form-tools#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items": {
      title: "",
      root: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items": {
      title: "",
      root: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items": {
      title: "",
      root: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items": {
      title: "",
      root: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/autonomous-agent/form-tools#": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#",
      pure: false,

      propertyKeys: [
        "mcpServers",
        "externalMcpServers",
        "web"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers",
        "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers",
        "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers": {
      title: "Serveurs MCP",
      key: "mcpServers",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items",
      pure: true,
      propertyKeys: ["serverId", "toolFilter"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/serverId",
        "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/serverId": {
      title: "Serveur",
      key: "serverId",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/serverId",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/serverId",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter": {
      title: "Uniquement ces outils",
      key: "toolFilter",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers": {
      title: "Serveurs MCP externes",
      key: "externalMcpServers",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items",
      pure: true,
      propertyKeys: ["url"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/properties/url"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/properties/url": {
      title: "URL",
      key: "url",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/properties/url",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/properties/url",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web": {
      title: "Accès au web",
      key: "web",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web",
      pure: false,
      propertyKeys: ["enabled", "allowedUrls"],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/enabled",
        "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/enabled": {
      title: "Lire des pages web",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls": {
      title: "URL autorisées",
      key: "allowedUrls",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls",
      pure: false,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/autonomous-agent/form-tools#": {
      title: null,
      comp: "section",

      children: [{
        key: "mcpServers"
      }, {
        key: "externalMcpServers"
      }, {
        key: "web"
      }],

      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers": {
      itemTitle: {
        type: "js-eval",
        expr: "item?.serverId || \"\"",
        pure: true,
        dataAlias: "item",
        ref: 1
      },

      listActions: ["add", "edit", "delete"],
      comp: "list",
      title: "Serveurs MCP",
      listEditMode: "inline-single",
      help: "<p>Choisis parmi les serveurs configurés pour ce déploiement.</p>",
      defaultData: [],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items": {
      comp: "section",

      children: [{
        key: "serverId"
      }, {
        key: "toolFilter"
      }],

      title: null,
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      },

      nullable: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/serverId": {
      comp: "autocomplete",

      getItems: {
        url: {
          type: "js-tpl",
          expr: "${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers",
          pure: true,
          dataAlias: "value",
          ref: 2
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.results",
          pure: true,
          dataAlias: "body",
          ref: 5
        },

        itemTitle: {
          type: "js-eval",
          expr: "item.name",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemKey: {
          type: "js-eval",
          expr: "item.id",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        itemValue: {
          type: "js-eval",
          expr: "item.id",
          pure: true,
          dataAlias: "item",
          ref: 4
        }
      },

      label: "Serveur"
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter": {
      comp: "combobox",
      multiple: true,
      label: "Uniquement ces outils",
      help: "<p>Laissez vide pour exposer tous les outils proposés par ce serveur.</p>"
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items": {
      comp: "text-field",
      label: "",
      nullable: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers": {
      itemTitle: {
        type: "js-eval",
        expr: "item?.url || \"\"",
        pure: true,
        dataAlias: "item",
        ref: 6
      },

      listActions: ["add", "edit", "delete"],
      comp: "list",
      title: "Serveurs MCP externes",
      listEditMode: "inline-single",
      help: "<p>Serveurs MCP publics que l&#39;agent utilise de façon anonyme — un autre portail de données, sur cette plateforme ou ailleurs. Leurs auteurs écrivent les descriptions que l&#39;agent lit, et ce qu&#39;il leur envoie quitte la plateforme : comme l&#39;accès au web, cela leur permet de fait de donner des instructions à l&#39;agent.</p>",
      defaultData: [],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items": {
      comp: "section",

      children: [{
        key: "url"
      }],

      title: null,
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      },

      nullable: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items/properties/url": {
      comp: "text-field",
      label: "URL"
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web": {
      comp: "section",

      children: [{
        key: "enabled"
      }, {
        key: "allowedUrls"
      }],

      title: "Accès au web",
      subtitle: "<p>Les pages sous les URL autorisées sont lues par l&#39;agent comme du texte, et un texte peut contenir des instructions : leurs auteurs peuvent de fait donner des instructions à cet agent, avec son identité et tous ses outils, et lui faire envoyer des informations à l&#39;extérieur. N&#39;activez cet accès que sur des agents aux capacités d&#39;écriture et d&#39;administration très restreintes.</p>"
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/enabled": {
      comp: "checkbox",
      label: "Lire des pages web",
      help: "<p>L&#39;agent peut lire les pages, flux et plans de site sous les URL autorisées, et demander à un administrateur de l&#39;organisation, dans une conversation, d&#39;en autoriser d&#39;autres.</p>",
      defaultData: false,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls": {
      if: {
        type: "js-eval",
        expr: "parent.data?.enabled",
        pure: false,
        dataAlias: "value",
        ref: 7
      },

      comp: "combobox",
      multiple: true,
      label: "URL autorisées",
      help: "<p>Une adresse peut être lue quand elle commence par l&#39;une de celles-ci : « <a href=\"https://github.com/data-fair\">https://github.com/data-fair</a> » n&#39;autorise que les dépôts de cette organisation, « <a href=\"https://www.data.gouv.fr/\">https://www.data.gouv.fr/</a> » tout le site. Le robots.txt, les plans de site et la description de recherche d&#39;un site sont lisibles dès que l&#39;une de ses adresses est autorisée.</p>",
      defaultData: [],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items": {
      comp: "text-field",
      label: "",
      nullable: true
    }
  },

  validates: {
    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items/properties/toolFilter/items": export0,
    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/mcpServers/items": export1,
    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/externalMcpServers/items": export2,
    "https://github.com/data-fair/agents/autonomous-agent/form-tools#/properties/web/properties/allowedUrls/items": export3,
    "https://github.com/data-fair/agents/autonomous-agent/form-tools#": export4
  },

  validationErrors: {},

  expressions: [
    expression0,
    expression1,
    expression2,
    expression3,
    expression4,
    expression5,
    expression6,
    expression7
  ],

  locale: "fr",

  messages: {
    errorOneOf: "choisissez une valeur",
    errorRequired: "information obligatoire",
    addItem: "Ajouter un élément",
    delete: "Supprimer",
    edit: "Éditer",
    confirm: "Confirmer",
    close: "Fermer",
    duplicate: "Dupliquer",
    insertAfter: "Insérer après",
    copy: "Copier",
    paste: "Coller",
    sort: "Trier",
    up: "Décaler vers le haut",
    down: "Décaler vers le bas",
    showHelp: "Afficher un message d'aide",
    default: "défaut : ",
    name: "nom : ",
    examples: "Exemples : ",
    deprecated: "Attention, cette information est obsolète.",
    keyboardDate: "JJ/MM/AAAA",
    keyboardDateTime: "JJ/MM/AAAA HH:mm"
  },

  components: {
    none: {
      name: "none"
    },

    slot: {
      name: "slot"
    },

    "composite-slot": {
      name: "composite-slot",
      composite: true
    },

    section: {
      name: "section",
      composite: true
    },

    tabs: {
      name: "tabs",
      composite: true
    },

    "vertical-tabs": {
      name: "vertical-tabs",
      composite: true
    },

    "expansion-panels": {
      name: "expansion-panels",
      composite: true
    },

    stepper: {
      name: "stepper",
      composite: true
    },

    card: {
      name: "card",
      composite: true
    },

    list: {
      name: "list",
      itemsBased: true,

      schema: {
        required: ["listEditMode", "listActions"],

        properties: {
          title: {
            type: "string"
          },

          listEditMode: {
            type: "string",

            enum: [
              "inline",
              "inline-single",
              "menu",
              "dialog"
            ]
          },

          listActions: {
            type: "array",

            items: {
              type: "string",

              enum: [
                "add",
                "edit",
                "delete",
                "sort",
                "duplicate",
                "insertAfter",
                "copy",
                "paste"
              ]
            }
          },

          clipboardKey: {
            type: "string"
          },

          itemTitle: {
            $ref: "https://json-layout.github.io/normalized-layout-keyword#/$defs/expression"
          },

          itemSubtitle: {
            $ref: "https://json-layout.github.io/normalized-layout-keyword#/$defs/expression"
          },

          itemCopy: {
            $ref: "https://json-layout.github.io/normalized-layout-keyword#/$defs/expression"
          },

          indexed: {
            type: "array",

            items: {
              type: "string"
            }
          },

          messages: {
            type: "object",
            additionalProperties: false,

            properties: {
              addItem: {
                type: "string"
              },

              delete: {
                type: "string"
              },

              edit: {
                type: "string"
              },

              duplicate: {
                type: "string"
              },

              insertAfter: {
                type: "string"
              },

              sort: {
                type: "string"
              }
            }
          }
        }
      }
    },

    "text-field": {
      name: "text-field",
      shouldDebounce: true,
      focusable: true,
      emitsBlur: true,

      schema: {
        properties: {
          placeholder: {
            type: "string"
          }
        }
      }
    },

    textarea: {
      name: "textarea",
      shouldDebounce: true,
      focusable: true,
      emitsBlur: true,

      schema: {
        properties: {
          placeholder: {
            type: "string"
          },

          rows: {
            type: "number"
          }
        }
      }
    },

    "number-field": {
      name: "number-field",
      shouldDebounce: true,
      focusable: true,

      schema: {
        properties: {
          step: {
            type: "number"
          },

          min: {
            type: "number"
          },

          max: {
            type: "number"
          },

          precision: {
            type: "number"
          },

          placeholder: {
            type: "string"
          }
        }
      }
    },

    checkbox: {
      name: "checkbox"
    },

    switch: {
      name: "switch"
    },

    slider: {
      name: "slider",
      shouldDebounce: true,

      schema: {
        properties: {
          step: {
            type: "number"
          },

          min: {
            type: "number"
          },

          max: {
            type: "number"
          }
        }
      }
    },

    "date-picker": {
      name: "date-picker",

      schema: {
        properties: {
          min: {
            type: "string",
            format: "date"
          },

          max: {
            type: "string",
            format: "date"
          },

          format: {
            type: "string",
            enum: ["date", "date-time"],
            default: "date"
          }
        }
      }
    },

    "date-time-picker": {
      name: "date-time-picker",

      schema: {
        properties: {
          min: {
            type: "string",
            format: "date-time"
          },

          max: {
            type: "string",
            format: "date-time"
          }
        }
      }
    },

    "time-picker": {
      name: "time-picker",

      schema: {
        properties: {
          min: {
            type: "string",
            format: "time"
          },

          max: {
            type: "string",
            format: "time"
          }
        }
      }
    },

    "color-picker": {
      name: "color-picker",
      shouldDebounce: true
    },

    select: {
      name: "select",
      focusable: true,
      itemsBased: true,
      multipleCompat: true,

      schema: {
        properties: {
          placeholder: {
            type: "string"
          }
        }
      }
    },

    autocomplete: {
      name: "autocomplete",
      focusable: true,
      itemsBased: true,
      multipleCompat: true,

      schema: {
        properties: {
          placeholder: {
            type: "string"
          }
        }
      }
    },

    combobox: {
      name: "combobox",
      focusable: true,
      itemsBased: true,
      multipleCompat: true,

      schema: {
        properties: {
          placeholder: {
            type: "string"
          }
        }
      }
    },

    "number-combobox": {
      name: "number-combobox",
      focusable: true,
      itemsBased: true,
      multipleCompat: true,

      schema: {
        properties: {
          placeholder: {
            type: "string"
          },

          step: {
            type: "number"
          },

          min: {
            type: "number"
          },

          max: {
            type: "number"
          }
        }
      }
    },

    "checkbox-group": {
      name: "checkbox-group",
      itemsBased: true,
      multipleCompat: true
    },

    "switch-group": {
      name: "switch-group",
      itemsBased: true,
      multipleCompat: true
    },

    "radio-group": {
      name: "radio-group",
      itemsBased: true
    },

    "file-input": {
      name: "file-input",
      focusable: true,
      multipleCompat: true,
      isFileInput: true,

      schema: {
        properties: {
          accept: {
            type: "string"
          },

          placeholder: {
            type: "string"
          }
        }
      }
    },

    "one-of-select": {
      name: "one-of-select",

      schema: {
        required: ["oneOfItems"],

        properties: {
          emptyData: {
            type: "boolean"
          },

          autocomplete: {
            type: "boolean"
          },

          oneOfItems: {
            type: "array",

            items: {
              $ref: "https://json-layout.github.io/normalized-layout-keyword#/$defs/one-of-item"
            }
          }
        }
      }
    },

    markdown: {
      name: "markdown",
      shouldDebounce: true,
      emitsBlur: true,
      focusable: true
    }
  },

  localizeErrors: localizeErrors
}

const nodeComponents = {
  
  "section": sectionNode,
  
  "list": listNode,
  
  "autocomplete": autocompleteNode,
  
  "combobox": comboboxNode,
  
  "text-field": textfieldNode,
  
  "checkbox": checkboxNode,
    
}

const props = defineProps({
  modelValue: {
    type: null,
    default: null
  },
  options: {
    /** @type import('vue').PropType<import('@koumoul/vjsf/types.js').PartialVjsfOptions | null> */
    type: Object,
    default: null
  }
})

const emit = defineEmits(emits)

const { el, statefulLayout, stateTree } = useVjsf(
  null,
  computed(() => props.modelValue),
  computed(() => ({...props.options, components: {}})),
  nodeComponents,
  emit,
  null,
  null,
  computed(() => compiledLayout)
)

</script>

<template>
  <div
    ref="el"
    class="vjsf"
  >
    <tree
      v-if="statefulLayout && stateTree"
      :model-value="stateTree"
      :stateful-layout="statefulLayout"
    />
  </div>
</template>