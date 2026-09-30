<script setup>
// @ts-nocheck

import { StatefulLayout } from '@json-layout/core/state'
import { ref, shallowRef, getCurrentInstance, useSlots, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

import Tree from '@koumoul/vjsf/components/tree.vue'
import { useVjsf, emits } from '@koumoul/vjsf/composables/use-vjsf.js'
import '@koumoul/vjsf/styles/vjsf.css'


import sectionNode from '@koumoul/vjsf/components/nodes/section.vue'

import textfieldNode from '@koumoul/vjsf/components/nodes/text-field.vue'

import textareaNode from '@koumoul/vjsf/components/nodes/textarea.vue'

import listNode from '@koumoul/vjsf/components/nodes/list.vue'

import autocompleteNode from '@koumoul/vjsf/components/nodes/autocomplete.vue'

import comboboxNode from '@koumoul/vjsf/components/nodes/combobox.vue'

import checkboxNode from '@koumoul/vjsf/components/nodes/checkbox.vue'


import localizeErrors from "ajv-i18n/localize/en/index.js";
import ucs2length from "ajv/dist/runtime/ucs2length.js";

const export0 = validate22;
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items"};
const schema28 = {"type":"string","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items","errorMessage":{}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.type,parentSchema:schema28,data};
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
const schema29 = {"$id":"export1","$ref":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items"};
const schema30 = {"type":"object","additionalProperties":false,"required":["serverId"],"properties":{"serverId":{"type":"string","title":"Server","layout":{"comp":"autocomplete","getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers","pure":true,"dataAlias":"value","ref":2},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":5},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":3},"itemKey":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId","errorMessage":{}},"toolFilter":{"type":"array","title":"Only these tools","description":"Leave empty to expose every tool this server offers.","items":{"type":"string","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items","errorMessage":{"required":{"serverId":"required information"}}};
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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "serverId"},message:"must have required property '"+"serverId"+"'",schema:schema30.required,parentSchema:schema30,data};
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
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema30,data};
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
const err2 = {instancePath:instancePath+"/serverId",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.properties.serverId.type,parentSchema:schema30.properties.serverId,data:data0};
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
const err4 = {instancePath:instancePath+"/toolFilter/" + i0,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.properties.toolFilter.items.type,parentSchema:schema30.properties.toolFilter.items,data:data2};
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
const err6 = {instancePath:instancePath+"/toolFilter",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema30.properties.toolFilter.type,parentSchema:schema30.properties.toolFilter,data:data1};
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
const err8 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema30.type,parentSchema:schema30,data};
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
if((((((err9.keyword !== "errorMessage") && (!err9.emUsed)) && (err9.instancePath === instancePath)) && (err9.keyword in emErrors0)) && (err9.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items") === 0)) && (/^\/[^\/]*$/.test(err9.schemaPath.slice(91)))){
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
const err10 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema30.errorMessage[key1][keyProp0],schema:schema30.errorMessage,parentSchema:schema30,data};
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
const schema31 = {"$id":"export2","$ref":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items"};
const schema32 = {"type":"object","additionalProperties":false,"required":["userId"],"properties":{"userId":{"type":"string","title":"User id","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userId","errorMessage":{}},"userName":{"type":"string","title":"User name","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userName","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items","errorMessage":{"required":{"userId":"required information"}}};

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
if(data.userId === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/required",keyword:"required",params:{missingProperty: "userId"},message:"must have required property '"+"userId"+"'",schema:schema32.required,parentSchema:schema32,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "userId") || (key0 === "userName"))){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema32,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.userId !== undefined){
let data0 = data.userId;
if(typeof data0 !== "string"){
const err2 = {instancePath:instancePath+"/userId",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema32.properties.userId.type,parentSchema:schema32.properties.userId,data:data0};
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
if(data.userName !== undefined){
let data1 = data.userName;
if(typeof data1 !== "string"){
const err4 = {instancePath:instancePath+"/userName",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userName/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema32.properties.userName.type,parentSchema:schema32.properties.userName,data:data1};
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
const err6 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema32.type,parentSchema:schema32,data};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"userId":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err7 of vErrors){
if((((((err7.keyword !== "errorMessage") && (!err7.emUsed)) && (err7.instancePath === instancePath)) && (err7.keyword in emErrors0)) && (err7.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items") === 0)) && (/^\/[^\/]*$/.test(err7.schemaPath.slice(92)))){
emPropParams0 = obj0[err7.keyword];
emParamsErrors0 = emErrors0[err7.keyword][err7.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err7);
err7.emUsed = true;
}
}
}
for(const key1 in emErrors0){
for(const keyProp0 in emErrors0[key1]){
emParamsErrors0 = emErrors0[key1][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key1] && templates0[key1][keyProp0];
const err8 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema32.errorMessage[key1][keyProp0],schema:schema32.errorMessage,parentSchema:schema32,data};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
}
const emErrs2 = [];
for(const err9 of vErrors){
if(!err9.emUsed){
emErrs2.push(err9);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export3 = validate26;
const schema33 = {"$id":"export3","$ref":"https://github.com/data-fair/agents/autonomous-agent/write-req#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/autonomous-agent/write-req","title":"Autonomous agent","x-exports":["validate","types","vjsf"],"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"required":["title","persona","mcpServers","enabled"],"layout":{"title":null},"properties":{"title":{"type":"string","title":"Name","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/title","errorMessage":{}},"persona":{"type":"string","layout":"textarea","title":"Persona","description":"Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/persona","errorMessage":{}},"instructions":{"type":"string","layout":"textarea","title":"Instructions","description":"How it should work: procedures, constraints, what to do when unsure.","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructions","errorMessage":{}},"mcpServers":{"type":"array","default":[],"title":"MCP servers","description":"Picked from the servers configured for this deployment.","layout":{"itemTitle":"item?.serverId || \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","additionalProperties":false,"required":["serverId"],"properties":{"serverId":{"type":"string","title":"Server","layout":{"comp":"autocomplete","getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers","pure":true,"dataAlias":"value","ref":2},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":5},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":3},"itemKey":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId","errorMessage":{}},"toolFilter":{"type":"array","title":"Only these tools","description":"Leave empty to expose every tool this server offers.","items":{"type":"string","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items","errorMessage":{"required":{"serverId":"required information"}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers","errorMessage":{}},"nhi":{"type":"object","additionalProperties":false,"required":["clientId"],"title":"Non-human identity","properties":{"clientId":{"type":"string","minLength":1,"title":"Client id","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId","errorMessage":{}},"siteUrl":{"type":"string","readOnly":true,"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/siteUrl","errorMessage":{}},"issuer":{"type":"string","readOnly":true,"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/issuer","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi","errorMessage":{"required":{"clientId":"required information"}}},"instructors":{"type":"array","default":[],"title":"Users allowed to instruct","description":"Admins of the owning organization are always allowed. Anyone listed here borrows this autonomous agent's permissions.","items":{"type":"object","additionalProperties":false,"required":["userId"],"properties":{"userId":{"type":"string","title":"User id","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userId","errorMessage":{}},"userName":{"type":"string","title":"User name","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userName","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items","errorMessage":{"required":{"userId":"required information"}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors","errorMessage":{}},"enabled":{"type":"boolean","default":true,"title":"Enabled","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/enabled","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#","errorMessage":{"required":{"title":"required information","persona":"required information","mcpServers":"required information","enabled":"required information"}}};
const func1 = ucs2length.default;

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
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.title === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.persona === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/required",keyword:"required",params:{missingProperty: "persona"},message:"must have required property '"+"persona"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.mcpServers === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/required",keyword:"required",params:{missingProperty: "mcpServers"},message:"must have required property '"+"mcpServers"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "title") || (key0 === "persona")) || (key0 === "instructions")) || (key0 === "mcpServers")) || (key0 === "nhi")) || (key0 === "instructors")) || (key0 === "enabled"))){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
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
let data0 = data.title;
if(typeof data0 !== "string"){
const err5 = {instancePath:instancePath+"/title",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.title.type,parentSchema:schema27.properties.title,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err6 of vErrors){
if(!err6.emUsed){
emErrs0.push(err6);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.persona !== undefined){
let data1 = data.persona;
if(typeof data1 !== "string"){
const err7 = {instancePath:instancePath+"/persona",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/persona/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.persona.type,parentSchema:schema27.properties.persona,data:data1};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err8 of vErrors){
if(!err8.emUsed){
emErrs1.push(err8);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.instructions !== undefined){
let data2 = data.instructions;
if(typeof data2 !== "string"){
const err9 = {instancePath:instancePath+"/instructions",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructions/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.instructions.type,parentSchema:schema27.properties.instructions,data:data2};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err10 of vErrors){
if(!err10.emUsed){
emErrs2.push(err10);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
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
const err11 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "serverId"},message:"must have required property '"+"serverId"+"'",schema:schema27.properties.mcpServers.items.required,parentSchema:schema27.properties.mcpServers.items,data:data4};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
for(const key1 in data4){
if(!((key1 === "serverId") || (key1 === "toolFilter"))){
const err12 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.mcpServers.items,data:data4};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data4.serverId !== undefined){
let data5 = data4.serverId;
if(typeof data5 !== "string"){
const err13 = {instancePath:instancePath+"/mcpServers/" + i0+"/serverId",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.mcpServers.items.properties.serverId.type,parentSchema:schema27.properties.mcpServers.items.properties.serverId,data:data5};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(errors > 0){
const emErrs3 = [];
for(const err14 of vErrors){
if(!err14.emUsed){
emErrs3.push(err14);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data4.toolFilter !== undefined){
let data6 = data4.toolFilter;
if(Array.isArray(data6)){
const len1 = data6.length;
for(let i1=0; i1<len1; i1++){
let data7 = data6[i1];
if(typeof data7 !== "string"){
const err15 = {instancePath:instancePath+"/mcpServers/" + i0+"/toolFilter/" + i1,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.mcpServers.items.properties.toolFilter.items.type,parentSchema:schema27.properties.mcpServers.items.properties.toolFilter.items,data:data7};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err16 of vErrors){
if(!err16.emUsed){
emErrs4.push(err16);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
}
else {
const err17 = {instancePath:instancePath+"/mcpServers/" + i0+"/toolFilter",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.mcpServers.items.properties.toolFilter.type,parentSchema:schema27.properties.mcpServers.items.properties.toolFilter,data:data6};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err18 of vErrors){
if(!err18.emUsed){
emErrs5.push(err18);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
}
else {
const err19 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.mcpServers.items.type,parentSchema:schema27.properties.mcpServers.items,data:data4};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"serverId":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err20 of vErrors){
if((((((err20.keyword !== "errorMessage") && (!err20.emUsed)) && (err20.instancePath === instancePath+"/mcpServers/" + i0)) && (err20.keyword in emErrors0)) && (err20.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items") === 0)) && (/^\/[^\/]*$/.test(err20.schemaPath.slice(91)))){
emPropParams0 = obj0[err20.keyword];
emParamsErrors0 = emErrors0[err20.keyword][err20.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err20);
err20.emUsed = true;
}
}
}
for(const key2 in emErrors0){
for(const keyProp0 in emErrors0[key2]){
emParamsErrors0 = emErrors0[key2][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key2] && templates0[key2][keyProp0];
const err21 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.mcpServers.items.errorMessage[key2][keyProp0],schema:schema27.properties.mcpServers.items.errorMessage,parentSchema:schema27.properties.mcpServers.items,data:data4};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
}
const emErrs6 = [];
for(const err22 of vErrors){
if(!err22.emUsed){
emErrs6.push(err22);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
}
else {
const err23 = {instancePath:instancePath+"/mcpServers",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.mcpServers.type,parentSchema:schema27.properties.mcpServers,data:data3};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err24 of vErrors){
if(!err24.emUsed){
emErrs7.push(err24);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data.nhi !== undefined){
let data8 = data.nhi;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.clientId === undefined){
const err25 = {instancePath:instancePath+"/nhi",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/required",keyword:"required",params:{missingProperty: "clientId"},message:"must have required property '"+"clientId"+"'",schema:schema27.properties.nhi.required,parentSchema:schema27.properties.nhi,data:data8};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
for(const key3 in data8){
if(!(((key3 === "clientId") || (key3 === "siteUrl")) || (key3 === "issuer"))){
const err26 = {instancePath:instancePath+"/nhi",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.nhi,data:data8};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data8.clientId !== undefined){
let data9 = data8.clientId;
if(typeof data9 === "string"){
if(func1(data9) < 1){
const err27 = {instancePath:instancePath+"/nhi/clientId",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters",schema:1,parentSchema:schema27.properties.nhi.properties.clientId,data:data9};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
else {
const err28 = {instancePath:instancePath+"/nhi/clientId",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.nhi.properties.clientId.type,parentSchema:schema27.properties.nhi.properties.clientId,data:data9};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err29 of vErrors){
if(!err29.emUsed){
emErrs8.push(err29);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
if(data8.siteUrl !== undefined){
let data10 = data8.siteUrl;
if(typeof data10 !== "string"){
const err30 = {instancePath:instancePath+"/nhi/siteUrl",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/siteUrl/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.nhi.properties.siteUrl.type,parentSchema:schema27.properties.nhi.properties.siteUrl,data:data10};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err31 of vErrors){
if(!err31.emUsed){
emErrs9.push(err31);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
if(data8.issuer !== undefined){
let data11 = data8.issuer;
if(typeof data11 !== "string"){
const err32 = {instancePath:instancePath+"/nhi/issuer",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/issuer/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.nhi.properties.issuer.type,parentSchema:schema27.properties.nhi.properties.issuer,data:data11};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err33 of vErrors){
if(!err33.emUsed){
emErrs10.push(err33);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
}
else {
const err34 = {instancePath:instancePath+"/nhi",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.nhi.type,parentSchema:schema27.properties.nhi,data:data8};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"clientId":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err35 of vErrors){
if((((((err35.keyword !== "errorMessage") && (!err35.emUsed)) && (err35.instancePath === instancePath+"/nhi")) && (err35.keyword in emErrors1)) && (err35.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi") === 0)) && (/^\/[^\/]*$/.test(err35.schemaPath.slice(78)))){
emPropParams1 = obj0[err35.keyword];
emParamsErrors1 = emErrors1[err35.keyword][err35.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err35);
err35.emUsed = true;
}
}
}
for(const key4 in emErrors1){
for(const keyProp1 in emErrors1[key4]){
emParamsErrors1 = emErrors1[key4][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key4] && templates1[key4][keyProp1];
const err36 = {instancePath:instancePath+"/nhi",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.properties.nhi.errorMessage[key4][keyProp1],schema:schema27.properties.nhi.errorMessage,parentSchema:schema27.properties.nhi,data:data8};
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
const emErrs11 = [];
for(const err37 of vErrors){
if(!err37.emUsed){
emErrs11.push(err37);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
}
if(data.instructors !== undefined){
let data12 = data.instructors;
if(Array.isArray(data12)){
const len2 = data12.length;
for(let i2=0; i2<len2; i2++){
let data13 = data12[i2];
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.userId === undefined){
const err38 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/required",keyword:"required",params:{missingProperty: "userId"},message:"must have required property '"+"userId"+"'",schema:schema27.properties.instructors.items.required,parentSchema:schema27.properties.instructors.items,data:data13};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
for(const key5 in data13){
if(!((key5 === "userId") || (key5 === "userName"))){
const err39 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.instructors.items,data:data13};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data13.userId !== undefined){
let data14 = data13.userId;
if(typeof data14 !== "string"){
const err40 = {instancePath:instancePath+"/instructors/" + i2+"/userId",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.instructors.items.properties.userId.type,parentSchema:schema27.properties.instructors.items.properties.userId,data:data14};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err41 of vErrors){
if(!err41.emUsed){
emErrs12.push(err41);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
if(data13.userName !== undefined){
let data15 = data13.userName;
if(typeof data15 !== "string"){
const err42 = {instancePath:instancePath+"/instructors/" + i2+"/userName",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userName/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.instructors.items.properties.userName.type,parentSchema:schema27.properties.instructors.items.properties.userName,data:data15};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err43 of vErrors){
if(!err43.emUsed){
emErrs13.push(err43);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
}
else {
const err44 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.instructors.items.type,parentSchema:schema27.properties.instructors.items,data:data13};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"userId":[]}};
const templates2 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err45 of vErrors){
if((((((err45.keyword !== "errorMessage") && (!err45.emUsed)) && (err45.instancePath === instancePath+"/instructors/" + i2)) && (err45.keyword in emErrors2)) && (err45.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items") === 0)) && (/^\/[^\/]*$/.test(err45.schemaPath.slice(92)))){
emPropParams2 = obj0[err45.keyword];
emParamsErrors2 = emErrors2[err45.keyword][err45.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err45);
err45.emUsed = true;
}
}
}
for(const key6 in emErrors2){
for(const keyProp2 in emErrors2[key6]){
emParamsErrors2 = emErrors2[key6][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates2[key6] && templates2[key6][keyProp2];
const err46 = {instancePath:instancePath+"/instructors/" + i2,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema27.properties.instructors.items.errorMessage[key6][keyProp2],schema:schema27.properties.instructors.items.errorMessage,parentSchema:schema27.properties.instructors.items,data:data13};
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
const emErrs14 = [];
for(const err47 of vErrors){
if(!err47.emUsed){
emErrs14.push(err47);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
}
else {
const err48 = {instancePath:instancePath+"/instructors",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.instructors.type,parentSchema:schema27.properties.instructors,data:data12};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(errors > 0){
const emErrs15 = [];
for(const err49 of vErrors){
if(!err49.emUsed){
emErrs15.push(err49);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
if(data.enabled !== undefined){
let data16 = data.enabled;
if(typeof data16 !== "boolean"){
const err50 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.enabled.type,parentSchema:schema27.properties.enabled,data:data16};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err51 of vErrors){
if(!err51.emUsed){
emErrs16.push(err51);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
}
else {
const err52 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(errors > 0){
const emErrors3 = {"required":{"title":[],"persona":[],"mcpServers":[],"enabled":[]}};
const templates3 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err53 of vErrors){
if((((((err53.keyword !== "errorMessage") && (!err53.emUsed)) && (err53.instancePath === instancePath)) && (err53.keyword in emErrors3)) && (err53.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/write-req#") === 0)) && (/^\/[^\/]*$/.test(err53.schemaPath.slice(63)))){
emPropParams3 = obj0[err53.keyword];
emParamsErrors3 = emErrors3[err53.keyword][err53.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err53);
err53.emUsed = true;
}
}
}
for(const key7 in emErrors3){
for(const keyProp3 in emErrors3[key7]){
emParamsErrors3 = emErrors3[key7][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates3[key7] && templates3[key7][keyProp3];
const err54 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema27.errorMessage[key7][keyProp3],schema:schema27.errorMessage,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
}
const emErrs17 = [];
for(const err55 of vErrors){
if(!err55.emUsed){
emErrs17.push(err55);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
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
}function expression6(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.options)
}
const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/autonomous-agent/write-req#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/autonomous-agent/write-req#": {
      title: "Autonomous agent",
      root: "https://github.com/data-fair/agents/autonomous-agent/write-req#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items": {
      title: "",
      root: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items": {
      title: "",
      root: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items": {
      title: "",
      root: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/autonomous-agent/write-req#": {
      title: "Autonomous agent",
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#",
      pure: true,

      propertyKeys: [
        "title",
        "persona",
        "instructions",
        "mcpServers",
        "nhi",
        "instructors",
        "enabled"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/title",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/persona",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructions",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/enabled"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/title": {
      title: "Name",
      key: "title",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/title",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/title",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/persona": {
      title: "Persona",
      key: "persona",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/persona",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/persona",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructions": {
      title: "Instructions",
      key: "instructions",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructions",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructions",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers": {
      title: "MCP servers",
      key: "mcpServers",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items",
      pure: true,
      propertyKeys: ["serverId", "toolFilter"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId": {
      title: "Server",
      key: "serverId",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter": {
      title: "Only these tools",
      key: "toolFilter",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi": {
      title: "Non-human identity",
      key: "nhi",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi",
      pure: true,
      propertyKeys: ["clientId", "siteUrl", "issuer"],
      roPropertyKeys: ["siteUrl", "issuer"],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/siteUrl",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/issuer"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId": {
      title: "Client id",
      key: "clientId",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/siteUrl": {
      title: undefined,
      key: "siteUrl",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/siteUrl",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/siteUrl",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/issuer": {
      title: undefined,
      key: "issuer",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/issuer",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/issuer",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors": {
      title: "Users allowed to instruct",
      key: "instructors",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items",
      pure: true,
      propertyKeys: ["userId", "userName"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userId",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userName"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userId": {
      title: "User id",
      key: "userId",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userId",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userId",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userName": {
      title: "User name",
      key: "userName",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userName",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userName",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/enabled": {
      title: "Enabled",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/autonomous-agent/write-req#": {
      title: null,
      comp: "section",

      children: [{
        key: "title"
      }, {
        key: "persona"
      }, {
        key: "instructions"
      }, {
        key: "mcpServers"
      }, {
        key: "nhi"
      }, {
        key: "instructors"
      }, {
        key: "enabled"
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

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/title": {
      comp: "text-field",
      label: "Name"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/persona": {
      comp: "textarea",
      label: "Persona",
      help: "<p>Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.</p>"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructions": {
      comp: "textarea",
      label: "Instructions",
      help: "<p>How it should work: procedures, constraints, what to do when unsure.</p>"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers": {
      itemTitle: {
        type: "js-eval",
        expr: "item?.serverId || \"\"",
        pure: true,
        dataAlias: "item",
        ref: 1
      },

      listActions: ["add", "edit", "delete"],
      comp: "list",
      title: "MCP servers",
      listEditMode: "inline-single",
      help: "<p>Picked from the servers configured for this deployment.</p>",
      defaultData: [],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items": {
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

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId": {
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

      label: "Server"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter": {
      comp: "combobox",
      multiple: true,
      label: "Only these tools",
      help: "<p>Leave empty to expose every tool this server offers.</p>"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items": {
      comp: "text-field",
      label: "",
      nullable: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi": {
      comp: "section",

      children: [{
        key: "clientId"
      }, {
        key: "siteUrl"
      }, {
        key: "issuer"
      }],

      title: "Non-human identity"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId": {
      comp: "text-field",
      label: "Client id"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/siteUrl": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "siteUrl",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 6
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/issuer": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "issuer",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 6
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors": {
      comp: "list",
      title: "Users allowed to instruct",
      listEditMode: "inline-single",

      listActions: [
        "add",
        "edit",
        "delete",
        "sort",
        "duplicate"
      ],

      help: "<p>Admins of the owning organization are always allowed. Anyone listed here borrows this autonomous agent&#39;s permissions.</p>",
      defaultData: [],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items": {
      comp: "section",

      children: [{
        key: "userId"
      }, {
        key: "userName"
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

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userId": {
      comp: "text-field",
      label: "User id"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items/properties/userName": {
      comp: "text-field",
      label: "User name"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/enabled": {
      comp: "checkbox",
      label: "Enabled",
      defaultData: true,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    }
  },

  validates: {
    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items": export0,
    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items": export1,
    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items": export2,
    "https://github.com/data-fair/agents/autonomous-agent/write-req#": export3
  },

  validationErrors: {},

  expressions: [
    expression0,
    expression1,
    expression2,
    expression3,
    expression4,
    expression5,
    expression6
  ],

  locale: "en",

  messages: {
    errorOneOf: "chose one",
    errorRequired: "required information",
    addItem: "Add item",
    delete: "Delete",
    edit: "Edit",
    confirm: "Confirm",
    close: "Close",
    duplicate: "Duplicate",
    insertAfter: "Insert after",
    copy: "Copy",
    paste: "Paste",
    sort: "Sort",
    up: "Move up",
    down: "Move down",
    showHelp: "Show a help message",
    default: "default: ",
    name: "name: ",
    examples: "Examples: ",
    deprecated: "Warning, this information is deprecated.",
    keyboardDate: "MM/DD/YYYY",
    keyboardDateTime: "MM/DD/YYYY HH:mm"
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
  
  "text-field": textfieldNode,
  
  "textarea": textareaNode,
  
  "list": listNode,
  
  "autocomplete": autocompleteNode,
  
  "combobox": comboboxNode,
  
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