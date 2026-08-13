<script setup>
// @ts-nocheck

import { StatefulLayout } from '@json-layout/core/state'
import { ref, shallowRef, getCurrentInstance, useSlots, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

import Tree from '@koumoul/vjsf/components/tree.vue'
import { useVjsf, emits } from '@koumoul/vjsf/composables/use-vjsf.js'
import '@koumoul/vjsf/styles/vjsf.css'


import sectionNode from '@koumoul/vjsf/components/nodes/section.vue'

import autocompleteNode from '@koumoul/vjsf/components/nodes/autocomplete.vue'

import textfieldNode from '@koumoul/vjsf/components/nodes/text-field.vue'

import cardNode from '@koumoul/vjsf/components/nodes/card.vue'

import checkboxNode from '@koumoul/vjsf/components/nodes/checkbox.vue'

import numberfieldNode from '@koumoul/vjsf/components/nodes/number-field.vue'

import selectNode from '@koumoul/vjsf/components/nodes/select.vue'


import localizeErrors from "ajv-i18n/localize/en/index.js";
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items"};
const schema34 = {"type":"string","oneOf":[{"const":"anonymous","title":"Anonymous"},{"const":"external","title":"External"},{"const":"user","title":"User"},{"const":"contrib","title":"Contributor"},{"const":"admin","title":"Admin"}],"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items","errorMessage":{"oneOf":"chose one"}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema34.type,parentSchema:schema34,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
const _errs2 = errors;
let valid1 = false;
let passing0 = null;
const _errs3 = errors;
if("anonymous" !== data){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items/oneOf/0/const",keyword:"const",params:{allowedValue: "anonymous"},message:"must be equal to constant",schema:"anonymous",parentSchema:schema34.oneOf[0],data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
var _valid0 = _errs3 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
}
const _errs4 = errors;
if("external" !== data){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items/oneOf/1/const",keyword:"const",params:{allowedValue: "external"},message:"must be equal to constant",schema:"external",parentSchema:schema34.oneOf[1],data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
var _valid0 = _errs4 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
}
const _errs5 = errors;
if("user" !== data){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items/oneOf/2/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema34.oneOf[2],data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
var _valid0 = _errs5 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid1 = true;
passing0 = 2;
}
const _errs6 = errors;
if("contrib" !== data){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items/oneOf/3/const",keyword:"const",params:{allowedValue: "contrib"},message:"must be equal to constant",schema:"contrib",parentSchema:schema34.oneOf[3],data};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
var _valid0 = _errs6 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid1 = true;
passing0 = 3;
}
const _errs7 = errors;
if("admin" !== data){
const err5 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items/oneOf/4/const",keyword:"const",params:{allowedValue: "admin"},message:"must be equal to constant",schema:"admin",parentSchema:schema34.oneOf[4],data};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
var _valid0 = _errs7 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid1 = true;
passing0 = 4;
}
}
}
}
}
if(!valid1){
const err6 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema34.oneOf,parentSchema:schema34,data};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
else {
errors = _errs2;
if(vErrors !== null){
if(_errs2){
vErrors.length = _errs2;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors0 = {"oneOf":[]};
const templates0 = {};
for(const err7 of vErrors){
if((((((err7.keyword !== "errorMessage") && (!err7.emUsed)) && (err7.instancePath === instancePath)) && (err7.keyword in emErrors0)) && (err7.schemaPath.indexOf("https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items") === 0)) && (/^\/[^\/]*$/.test(err7.schemaPath.slice(107)))){
emErrors0[err7.keyword].push(err7);
err7.emUsed = true;
}
}
for(const key0 in emErrors0){
if(emErrors0[key0].length){
const err8 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors0[key0]},message:key0 in templates0 ? templates0[key0]() : schema34.errorMessage[key0],schema:schema34.errorMessage,parentSchema:schema34,data};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
const emErrs0 = [];
for(const err9 of vErrors){
if(!err9.emUsed){
emErrs0.push(err9);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema35 = {"$id":"export1","$ref":"https://github.com/data-fair/agents/settings/org-put-req#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/settings/org-put-req","title":"Org settings","x-exports":["validate","types","vjsf"],"x-vjsf":{"xI18n":true},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"definitions":{"RoleQuota":{"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Unlimited","default":false,"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/unlimited","errorMessage":{}},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Monthly Limit","description":"Weekly limit = monthly / 2, daily limit = monthly / 4","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/monthlyLimit","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}}},"properties":{"modelMapping":{"type":"object","additionalProperties":false,"title":"Model roles","layout":{},"properties":{"assistant":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Assistant","description":"The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.","layout":{"comp":"autocomplete","cols":{"md":6},"getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=assistant","pure":true,"dataAlias":"value","ref":1},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":5},"itemTitle":{"type":"js-eval","expr":"`${item.name} (${item.provider.name})`","pure":true,"dataAlias":"item","ref":2},"itemKey":{"type":"js-eval","expr":"item.provider.id + \":\" + item.id","pure":true,"dataAlias":"item","ref":3},"itemValue":{"type":"js-eval","expr":"({ provider: item.provider.id, id: item.id, name: item.name })","pure":true,"dataAlias":"item","ref":4},"returnObjects":true}},"properties":{"provider":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/provider","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/name","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant","errorMessage":{"required":{"provider":"required information","id":"required information"}}},"tools":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Tools","description":"The \"technician.\" Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.","layout":{"comp":"autocomplete","cols":{"md":6},"getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=tools","pure":true,"dataAlias":"value","ref":6},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":5},"itemTitle":{"type":"js-eval","expr":"`${item.name} (${item.provider.name})`","pure":true,"dataAlias":"item","ref":2},"itemKey":{"type":"js-eval","expr":"item.provider.id + \":\" + item.id","pure":true,"dataAlias":"item","ref":3},"itemValue":{"type":"js-eval","expr":"({ provider: item.provider.id, id: item.id, name: item.name })","pure":true,"dataAlias":"item","ref":4},"returnObjects":true}},"properties":{"provider":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/provider","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/name","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools","errorMessage":{"required":{"provider":"required information","id":"required information"}}},"summarizer":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Summarizer","description":"A \"shorthand\" specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.","layout":{"comp":"autocomplete","cols":{"md":6},"getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=summarizer","pure":true,"dataAlias":"value","ref":7},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":5},"itemTitle":{"type":"js-eval","expr":"`${item.name} (${item.provider.name})`","pure":true,"dataAlias":"item","ref":2},"itemKey":{"type":"js-eval","expr":"item.provider.id + \":\" + item.id","pure":true,"dataAlias":"item","ref":3},"itemValue":{"type":"js-eval","expr":"({ provider: item.provider.id, id: item.id, name: item.name })","pure":true,"dataAlias":"item","ref":4},"returnObjects":true}},"properties":{"provider":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/provider","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/name","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer","errorMessage":{"required":{"provider":"required information","id":"required information"}}},"evaluator":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Evaluator","description":"The \"quality controller.\" Analyzes the assistant's logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.","layout":{"comp":"autocomplete","cols":{"md":6},"getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=evaluator","pure":true,"dataAlias":"value","ref":8},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":5},"itemTitle":{"type":"js-eval","expr":"`${item.name} (${item.provider.name})`","pure":true,"dataAlias":"item","ref":2},"itemKey":{"type":"js-eval","expr":"item.provider.id + \":\" + item.id","pure":true,"dataAlias":"item","ref":3},"itemValue":{"type":"js-eval","expr":"({ provider: item.provider.id, id: item.id, name: item.name })","pure":true,"dataAlias":"item","ref":4},"returnObjects":true}},"properties":{"provider":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/provider","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/name","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator","errorMessage":{"required":{"provider":"required information","id":"required information"}}},"moderator":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Moderator","description":"The \"gatekeeper.\" Classifies each new user message for profanity, prompt-injection, persona override, and out-of-scope requests. Should be fast and cheap — it sits on the critical path to the first response token. Dedicated moderation classifiers (Llama Guard, moderation APIs) are not compatible: they use fixed taxonomies and output formats that cannot express this platform's custom policy.","layout":{"comp":"autocomplete","cols":{"md":6},"getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=moderator","pure":true,"dataAlias":"value","ref":9},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":5},"itemTitle":{"type":"js-eval","expr":"`${item.name} (${item.provider.name})`","pure":true,"dataAlias":"item","ref":2},"itemKey":{"type":"js-eval","expr":"item.provider.id + \":\" + item.id","pure":true,"dataAlias":"item","ref":3},"itemValue":{"type":"js-eval","expr":"({ provider: item.provider.id, id: item.id, name: item.name })","pure":true,"dataAlias":"item","ref":4},"returnObjects":true}},"properties":{"provider":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/provider","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/name","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator","errorMessage":{"required":{"provider":"required information","id":"required information"}}}},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping","errorMessage":{}},"quotas":{"type":"object","title":"Role Quotas","layout":{"title":null,"children":[{"key":"admin","cols":{"sm":6,"md":4}},{"key":"contrib","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"user","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"external","cols":{"sm":6,"md":4}},{"key":"anonymous","cols":{"sm":6,"md":4}},{"key":"untrusted","cols":{"sm":6,"md":4}}]},"required":["admin","contrib","user","external","anonymous"],"default":{"admin":{"unlimited":true,"monthlyLimit":0},"contrib":{"unlimited":false,"monthlyLimit":0},"user":{"unlimited":false,"monthlyLimit":0},"external":{"unlimited":false,"monthlyLimit":0},"anonymous":{"unlimited":false,"monthlyLimit":0},"untrusted":{"unlimited":false,"monthlyLimit":0}},"properties":{"admin":{"$ref":"#/definitions/RoleQuota","title":"Admin quotas","default":{"unlimited":true,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/admin","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"contrib":{"$ref":"#/definitions/RoleQuota","title":"Contributor quotas","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/contrib","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"user":{"$ref":"#/definitions/RoleQuota","title":"Simple user Quotas","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/user","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"external":{"$ref":"#/definitions/RoleQuota","title":"External user quotas","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/external","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"anonymous":{"$ref":"#/definitions/RoleQuota","title":"Anonymous user quotas","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/anonymous","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"untrusted":{"$ref":"#/definitions/RoleQuota","title":"Anonymous + external pool","description":"Aggregate cap shared by all anonymous and external usage combined, so untrusted traffic cannot consume the whole account budget. 0 = no pool cap.","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/untrusted","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}}},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas","errorMessage":{"required":{"admin":"required information","contrib":"required information","user":"required information","external":"required information","anonymous":"required information"}}},"moderation":{"type":"object","title":"Input moderation","layout":{},"default":{"enabled":false,"categories":["anonymous","external"]},"required":["enabled","categories"],"additionalProperties":false,"properties":{"enabled":{"type":"boolean","title":"Enable input moderation","description":"When enabled, the last user message of each request from a moderated category is classified before the model responds.","default":false,"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/enabled","errorMessage":{}},"categories":{"type":"array","uniqueItems":true,"default":["anonymous","external"],"title":"Moderated user categories","description":"User categories whose requests are checked by the gate when moderation is enabled.","items":{"type":"string","oneOf":[{"const":"anonymous","title":"Anonymous"},{"const":"external","title":"External"},{"const":"user","title":"User"},{"const":"contrib","title":"Contributor"},{"const":"admin","title":"Admin"}],"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items","errorMessage":{"oneOf":"chose one"}},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation","errorMessage":{"required":{"enabled":"required information","categories":"required information"}}},"storeTraces":{"type":"boolean","title":"Store conversation traces","description":"When enabled, conversations of consenting users are stored on the server for 30 days for admin review. Each user must explicitly accept.","default":false,"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/properties/storeTraces","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#","errorMessage":{}};
const schema28 = {"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Unlimited","default":false,"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/unlimited","errorMessage":{}},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Monthly Limit","description":"Weekly limit = monthly / 2, daily limit = monthly / 4","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/monthlyLimit","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}};
const obj0 = {"required":"missingProperty","dependencies":"property","dependentRequired":"property"};

function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://github.com/data-fair/agents/settings/org-put-req" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate23.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key0 in data){
if(!((((key0 === "modelMapping") || (key0 === "quotas")) || (key0 === "moderation")) || (key0 === "storeTraces"))){
const err0 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
if(data.modelMapping !== undefined){
let data0 = data.modelMapping;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
for(const key1 in data0){
if(!(((((key1 === "assistant") || (key1 === "tools")) || (key1 === "summarizer")) || (key1 === "evaluator")) || (key1 === "moderator"))){
const err1 = {instancePath:instancePath+"/modelMapping",schemaPath:"#/properties/modelMapping/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.modelMapping,data:data0};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data0.assistant !== undefined){
let data1 = data0.assistant;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.provider === undefined){
const err2 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"#/properties/modelMapping/properties/assistant/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema27.properties.modelMapping.properties.assistant.required,parentSchema:schema27.properties.modelMapping.properties.assistant,data:data1};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data1.id === undefined){
const err3 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"#/properties/modelMapping/properties/assistant/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.modelMapping.properties.assistant.required,parentSchema:schema27.properties.modelMapping.properties.assistant,data:data1};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key2 in data1){
if(!(((key2 === "provider") || (key2 === "id")) || (key2 === "name"))){
const err4 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"#/properties/modelMapping/properties/assistant/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.modelMapping.properties.assistant,data:data1};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data1.provider !== undefined){
let data2 = data1.provider;
if(typeof data2 !== "string"){
const err5 = {instancePath:instancePath+"/modelMapping/assistant/provider",schemaPath:"#/properties/modelMapping/properties/assistant/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.assistant.properties.provider.type,parentSchema:schema27.properties.modelMapping.properties.assistant.properties.provider,data:data2};
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
if(data1.id !== undefined){
let data3 = data1.id;
if(typeof data3 !== "string"){
const err7 = {instancePath:instancePath+"/modelMapping/assistant/id",schemaPath:"#/properties/modelMapping/properties/assistant/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.assistant.properties.id.type,parentSchema:schema27.properties.modelMapping.properties.assistant.properties.id,data:data3};
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
if(data1.name !== undefined){
let data4 = data1.name;
if(typeof data4 !== "string"){
const err9 = {instancePath:instancePath+"/modelMapping/assistant/name",schemaPath:"#/properties/modelMapping/properties/assistant/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.assistant.properties.name.type,parentSchema:schema27.properties.modelMapping.properties.assistant.properties.name,data:data4};
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
}
else {
const err11 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"#/properties/modelMapping/properties/assistant/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.modelMapping.properties.assistant.type,parentSchema:schema27.properties.modelMapping.properties.assistant,data:data1};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"provider":[],"id":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err12 of vErrors){
if((((((err12.keyword !== "errorMessage") && (!err12.emUsed)) && (err12.instancePath === instancePath+"/modelMapping/assistant")) && (err12.keyword in emErrors0)) && (err12.schemaPath.indexOf("#/properties/modelMapping/properties/assistant") === 0)) && (/^\/[^\/]*$/.test(err12.schemaPath.slice(46)))){
emPropParams0 = obj0[err12.keyword];
emParamsErrors0 = emErrors0[err12.keyword][err12.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err12);
err12.emUsed = true;
}
}
}
for(const key3 in emErrors0){
for(const keyProp0 in emErrors0[key3]){
emParamsErrors0 = emErrors0[key3][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key3] && templates0[key3][keyProp0];
const err13 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"#/properties/modelMapping/properties/assistant/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.modelMapping.properties.assistant.errorMessage[key3][keyProp0],schema:schema27.properties.modelMapping.properties.assistant.errorMessage,parentSchema:schema27.properties.modelMapping.properties.assistant,data:data1};
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
if(data0.tools !== undefined){
let data5 = data0.tools;
if(data5 && typeof data5 == "object" && !Array.isArray(data5)){
if(data5.provider === undefined){
const err15 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"#/properties/modelMapping/properties/tools/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema27.properties.modelMapping.properties.tools.required,parentSchema:schema27.properties.modelMapping.properties.tools,data:data5};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data5.id === undefined){
const err16 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"#/properties/modelMapping/properties/tools/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.modelMapping.properties.tools.required,parentSchema:schema27.properties.modelMapping.properties.tools,data:data5};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
for(const key4 in data5){
if(!(((key4 === "provider") || (key4 === "id")) || (key4 === "name"))){
const err17 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"#/properties/modelMapping/properties/tools/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.modelMapping.properties.tools,data:data5};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data5.provider !== undefined){
let data6 = data5.provider;
if(typeof data6 !== "string"){
const err18 = {instancePath:instancePath+"/modelMapping/tools/provider",schemaPath:"#/properties/modelMapping/properties/tools/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.tools.properties.provider.type,parentSchema:schema27.properties.modelMapping.properties.tools.properties.provider,data:data6};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err19 of vErrors){
if(!err19.emUsed){
emErrs4.push(err19);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
if(data5.id !== undefined){
let data7 = data5.id;
if(typeof data7 !== "string"){
const err20 = {instancePath:instancePath+"/modelMapping/tools/id",schemaPath:"#/properties/modelMapping/properties/tools/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.tools.properties.id.type,parentSchema:schema27.properties.modelMapping.properties.tools.properties.id,data:data7};
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
if(data5.name !== undefined){
let data8 = data5.name;
if(typeof data8 !== "string"){
const err22 = {instancePath:instancePath+"/modelMapping/tools/name",schemaPath:"#/properties/modelMapping/properties/tools/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.tools.properties.name.type,parentSchema:schema27.properties.modelMapping.properties.tools.properties.name,data:data8};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(errors > 0){
const emErrs6 = [];
for(const err23 of vErrors){
if(!err23.emUsed){
emErrs6.push(err23);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
}
else {
const err24 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"#/properties/modelMapping/properties/tools/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.modelMapping.properties.tools.type,parentSchema:schema27.properties.modelMapping.properties.tools,data:data5};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"provider":[],"id":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err25 of vErrors){
if((((((err25.keyword !== "errorMessage") && (!err25.emUsed)) && (err25.instancePath === instancePath+"/modelMapping/tools")) && (err25.keyword in emErrors1)) && (err25.schemaPath.indexOf("#/properties/modelMapping/properties/tools") === 0)) && (/^\/[^\/]*$/.test(err25.schemaPath.slice(42)))){
emPropParams1 = obj0[err25.keyword];
emParamsErrors1 = emErrors1[err25.keyword][err25.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err25);
err25.emUsed = true;
}
}
}
for(const key5 in emErrors1){
for(const keyProp1 in emErrors1[key5]){
emParamsErrors1 = emErrors1[key5][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key5] && templates1[key5][keyProp1];
const err26 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"#/properties/modelMapping/properties/tools/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.properties.modelMapping.properties.tools.errorMessage[key5][keyProp1],schema:schema27.properties.modelMapping.properties.tools.errorMessage,parentSchema:schema27.properties.modelMapping.properties.tools,data:data5};
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
if(data0.summarizer !== undefined){
let data9 = data0.summarizer;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.provider === undefined){
const err28 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"#/properties/modelMapping/properties/summarizer/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema27.properties.modelMapping.properties.summarizer.required,parentSchema:schema27.properties.modelMapping.properties.summarizer,data:data9};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data9.id === undefined){
const err29 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"#/properties/modelMapping/properties/summarizer/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.modelMapping.properties.summarizer.required,parentSchema:schema27.properties.modelMapping.properties.summarizer,data:data9};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
for(const key6 in data9){
if(!(((key6 === "provider") || (key6 === "id")) || (key6 === "name"))){
const err30 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"#/properties/modelMapping/properties/summarizer/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.modelMapping.properties.summarizer,data:data9};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data9.provider !== undefined){
let data10 = data9.provider;
if(typeof data10 !== "string"){
const err31 = {instancePath:instancePath+"/modelMapping/summarizer/provider",schemaPath:"#/properties/modelMapping/properties/summarizer/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.summarizer.properties.provider.type,parentSchema:schema27.properties.modelMapping.properties.summarizer.properties.provider,data:data10};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err32 of vErrors){
if(!err32.emUsed){
emErrs8.push(err32);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
if(data9.id !== undefined){
let data11 = data9.id;
if(typeof data11 !== "string"){
const err33 = {instancePath:instancePath+"/modelMapping/summarizer/id",schemaPath:"#/properties/modelMapping/properties/summarizer/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.summarizer.properties.id.type,parentSchema:schema27.properties.modelMapping.properties.summarizer.properties.id,data:data11};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err34 of vErrors){
if(!err34.emUsed){
emErrs9.push(err34);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
if(data9.name !== undefined){
let data12 = data9.name;
if(typeof data12 !== "string"){
const err35 = {instancePath:instancePath+"/modelMapping/summarizer/name",schemaPath:"#/properties/modelMapping/properties/summarizer/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.summarizer.properties.name.type,parentSchema:schema27.properties.modelMapping.properties.summarizer.properties.name,data:data12};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err36 of vErrors){
if(!err36.emUsed){
emErrs10.push(err36);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
}
else {
const err37 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"#/properties/modelMapping/properties/summarizer/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.modelMapping.properties.summarizer.type,parentSchema:schema27.properties.modelMapping.properties.summarizer,data:data9};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"provider":[],"id":[]}};
const templates2 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err38 of vErrors){
if((((((err38.keyword !== "errorMessage") && (!err38.emUsed)) && (err38.instancePath === instancePath+"/modelMapping/summarizer")) && (err38.keyword in emErrors2)) && (err38.schemaPath.indexOf("#/properties/modelMapping/properties/summarizer") === 0)) && (/^\/[^\/]*$/.test(err38.schemaPath.slice(47)))){
emPropParams2 = obj0[err38.keyword];
emParamsErrors2 = emErrors2[err38.keyword][err38.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err38);
err38.emUsed = true;
}
}
}
for(const key7 in emErrors2){
for(const keyProp2 in emErrors2[key7]){
emParamsErrors2 = emErrors2[key7][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates2[key7] && templates2[key7][keyProp2];
const err39 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"#/properties/modelMapping/properties/summarizer/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema27.properties.modelMapping.properties.summarizer.errorMessage[key7][keyProp2],schema:schema27.properties.modelMapping.properties.summarizer.errorMessage,parentSchema:schema27.properties.modelMapping.properties.summarizer,data:data9};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
}
const emErrs11 = [];
for(const err40 of vErrors){
if(!err40.emUsed){
emErrs11.push(err40);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
}
if(data0.evaluator !== undefined){
let data13 = data0.evaluator;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.provider === undefined){
const err41 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"#/properties/modelMapping/properties/evaluator/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema27.properties.modelMapping.properties.evaluator.required,parentSchema:schema27.properties.modelMapping.properties.evaluator,data:data13};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data13.id === undefined){
const err42 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"#/properties/modelMapping/properties/evaluator/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.modelMapping.properties.evaluator.required,parentSchema:schema27.properties.modelMapping.properties.evaluator,data:data13};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
for(const key8 in data13){
if(!(((key8 === "provider") || (key8 === "id")) || (key8 === "name"))){
const err43 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"#/properties/modelMapping/properties/evaluator/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.modelMapping.properties.evaluator,data:data13};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data13.provider !== undefined){
let data14 = data13.provider;
if(typeof data14 !== "string"){
const err44 = {instancePath:instancePath+"/modelMapping/evaluator/provider",schemaPath:"#/properties/modelMapping/properties/evaluator/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.evaluator.properties.provider.type,parentSchema:schema27.properties.modelMapping.properties.evaluator.properties.provider,data:data14};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err45 of vErrors){
if(!err45.emUsed){
emErrs12.push(err45);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
if(data13.id !== undefined){
let data15 = data13.id;
if(typeof data15 !== "string"){
const err46 = {instancePath:instancePath+"/modelMapping/evaluator/id",schemaPath:"#/properties/modelMapping/properties/evaluator/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.evaluator.properties.id.type,parentSchema:schema27.properties.modelMapping.properties.evaluator.properties.id,data:data15};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err47 of vErrors){
if(!err47.emUsed){
emErrs13.push(err47);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
if(data13.name !== undefined){
let data16 = data13.name;
if(typeof data16 !== "string"){
const err48 = {instancePath:instancePath+"/modelMapping/evaluator/name",schemaPath:"#/properties/modelMapping/properties/evaluator/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.evaluator.properties.name.type,parentSchema:schema27.properties.modelMapping.properties.evaluator.properties.name,data:data16};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(errors > 0){
const emErrs14 = [];
for(const err49 of vErrors){
if(!err49.emUsed){
emErrs14.push(err49);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
}
else {
const err50 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"#/properties/modelMapping/properties/evaluator/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.modelMapping.properties.evaluator.type,parentSchema:schema27.properties.modelMapping.properties.evaluator,data:data13};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(errors > 0){
const emErrors3 = {"required":{"provider":[],"id":[]}};
const templates3 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err51 of vErrors){
if((((((err51.keyword !== "errorMessage") && (!err51.emUsed)) && (err51.instancePath === instancePath+"/modelMapping/evaluator")) && (err51.keyword in emErrors3)) && (err51.schemaPath.indexOf("#/properties/modelMapping/properties/evaluator") === 0)) && (/^\/[^\/]*$/.test(err51.schemaPath.slice(46)))){
emPropParams3 = obj0[err51.keyword];
emParamsErrors3 = emErrors3[err51.keyword][err51.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err51);
err51.emUsed = true;
}
}
}
for(const key9 in emErrors3){
for(const keyProp3 in emErrors3[key9]){
emParamsErrors3 = emErrors3[key9][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates3[key9] && templates3[key9][keyProp3];
const err52 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"#/properties/modelMapping/properties/evaluator/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema27.properties.modelMapping.properties.evaluator.errorMessage[key9][keyProp3],schema:schema27.properties.modelMapping.properties.evaluator.errorMessage,parentSchema:schema27.properties.modelMapping.properties.evaluator,data:data13};
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
const emErrs15 = [];
for(const err53 of vErrors){
if(!err53.emUsed){
emErrs15.push(err53);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
if(data0.moderator !== undefined){
let data17 = data0.moderator;
if(data17 && typeof data17 == "object" && !Array.isArray(data17)){
if(data17.provider === undefined){
const err54 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"#/properties/modelMapping/properties/moderator/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema27.properties.modelMapping.properties.moderator.required,parentSchema:schema27.properties.modelMapping.properties.moderator,data:data17};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(data17.id === undefined){
const err55 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"#/properties/modelMapping/properties/moderator/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.modelMapping.properties.moderator.required,parentSchema:schema27.properties.modelMapping.properties.moderator,data:data17};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
for(const key10 in data17){
if(!(((key10 === "provider") || (key10 === "id")) || (key10 === "name"))){
const err56 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"#/properties/modelMapping/properties/moderator/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key10},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.modelMapping.properties.moderator,data:data17};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data17.provider !== undefined){
let data18 = data17.provider;
if(typeof data18 !== "string"){
const err57 = {instancePath:instancePath+"/modelMapping/moderator/provider",schemaPath:"#/properties/modelMapping/properties/moderator/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.moderator.properties.provider.type,parentSchema:schema27.properties.modelMapping.properties.moderator.properties.provider,data:data18};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err58 of vErrors){
if(!err58.emUsed){
emErrs16.push(err58);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
if(data17.id !== undefined){
let data19 = data17.id;
if(typeof data19 !== "string"){
const err59 = {instancePath:instancePath+"/modelMapping/moderator/id",schemaPath:"#/properties/modelMapping/properties/moderator/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.moderator.properties.id.type,parentSchema:schema27.properties.modelMapping.properties.moderator.properties.id,data:data19};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(errors > 0){
const emErrs17 = [];
for(const err60 of vErrors){
if(!err60.emUsed){
emErrs17.push(err60);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
}
if(data17.name !== undefined){
let data20 = data17.name;
if(typeof data20 !== "string"){
const err61 = {instancePath:instancePath+"/modelMapping/moderator/name",schemaPath:"#/properties/modelMapping/properties/moderator/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.moderator.properties.name.type,parentSchema:schema27.properties.modelMapping.properties.moderator.properties.name,data:data20};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(errors > 0){
const emErrs18 = [];
for(const err62 of vErrors){
if(!err62.emUsed){
emErrs18.push(err62);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
}
}
else {
const err63 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"#/properties/modelMapping/properties/moderator/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.modelMapping.properties.moderator.type,parentSchema:schema27.properties.modelMapping.properties.moderator,data:data17};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(errors > 0){
const emErrors4 = {"required":{"provider":[],"id":[]}};
const templates4 = {required:{}};
let emPropParams4;
let emParamsErrors4;
for(const err64 of vErrors){
if((((((err64.keyword !== "errorMessage") && (!err64.emUsed)) && (err64.instancePath === instancePath+"/modelMapping/moderator")) && (err64.keyword in emErrors4)) && (err64.schemaPath.indexOf("#/properties/modelMapping/properties/moderator") === 0)) && (/^\/[^\/]*$/.test(err64.schemaPath.slice(46)))){
emPropParams4 = obj0[err64.keyword];
emParamsErrors4 = emErrors4[err64.keyword][err64.params[emPropParams4]];
if(emParamsErrors4){
emParamsErrors4.push(err64);
err64.emUsed = true;
}
}
}
for(const key11 in emErrors4){
for(const keyProp4 in emErrors4[key11]){
emParamsErrors4 = emErrors4[key11][keyProp4];
if(emParamsErrors4.length){
const tmpl4 = templates4[key11] && templates4[key11][keyProp4];
const err65 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"#/properties/modelMapping/properties/moderator/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema27.properties.modelMapping.properties.moderator.errorMessage[key11][keyProp4],schema:schema27.properties.modelMapping.properties.moderator.errorMessage,parentSchema:schema27.properties.modelMapping.properties.moderator,data:data17};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
}
const emErrs19 = [];
for(const err66 of vErrors){
if(!err66.emUsed){
emErrs19.push(err66);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
}
}
else {
const err67 = {instancePath:instancePath+"/modelMapping",schemaPath:"#/properties/modelMapping/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.modelMapping.type,parentSchema:schema27.properties.modelMapping,data:data0};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err68 of vErrors){
if(!err68.emUsed){
emErrs20.push(err68);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
if(data.quotas !== undefined){
let data21 = data.quotas;
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(data21.admin === undefined){
const err69 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "admin"},message:"must have required property '"+"admin"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data21};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(data21.contrib === undefined){
const err70 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "contrib"},message:"must have required property '"+"contrib"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data21};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(data21.user === undefined){
const err71 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "user"},message:"must have required property '"+"user"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data21};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(data21.external === undefined){
const err72 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "external"},message:"must have required property '"+"external"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data21};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(data21.anonymous === undefined){
const err73 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "anonymous"},message:"must have required property '"+"anonymous"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data21};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if(data21.admin !== undefined){
let data22 = data21.admin;
if(data22 && typeof data22 == "object" && !Array.isArray(data22)){
if(data22.unlimited === undefined){
const err74 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema28.required,parentSchema:schema28,data:data22};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(data22.monthlyLimit === undefined){
const err75 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema28.required,parentSchema:schema28,data:data22};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if(data22.unlimited !== undefined){
let data23 = data22.unlimited;
if(typeof data23 !== "boolean"){
const err76 = {instancePath:instancePath+"/quotas/admin/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.unlimited.type,parentSchema:schema28.properties.unlimited,data:data23};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
if(errors > 0){
const emErrs21 = [];
for(const err77 of vErrors){
if(!err77.emUsed){
emErrs21.push(err77);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
if(data22.monthlyLimit !== undefined){
let data24 = data22.monthlyLimit;
if(typeof data24 == "number"){
if(data24 < 0 || isNaN(data24)){
const err78 = {instancePath:instancePath+"/quotas/admin/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28.properties.monthlyLimit,data:data24};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
else {
const err79 = {instancePath:instancePath+"/quotas/admin/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.monthlyLimit.type,parentSchema:schema28.properties.monthlyLimit,data:data24};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(errors > 0){
const emErrs22 = [];
for(const err80 of vErrors){
if(!err80.emUsed){
emErrs22.push(err80);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
}
}
else {
const err81 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data22};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(errors > 0){
const emErrors5 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates5 = {required:{}};
let emPropParams5;
let emParamsErrors5;
for(const err82 of vErrors){
if((((((err82.keyword !== "errorMessage") && (!err82.emUsed)) && (err82.instancePath === instancePath+"/quotas/admin")) && (err82.keyword in emErrors5)) && (err82.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err82.schemaPath.slice(23)))){
emPropParams5 = obj0[err82.keyword];
emParamsErrors5 = emErrors5[err82.keyword][err82.params[emPropParams5]];
if(emParamsErrors5){
emParamsErrors5.push(err82);
err82.emUsed = true;
}
}
}
for(const key12 in emErrors5){
for(const keyProp5 in emErrors5[key12]){
emParamsErrors5 = emErrors5[key12][keyProp5];
if(emParamsErrors5.length){
const tmpl5 = templates5[key12] && templates5[key12][keyProp5];
const err83 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors5},message:tmpl5 ? tmpl5() : schema28.errorMessage[key12][keyProp5],schema:schema28.errorMessage,parentSchema:schema28,data:data22};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
}
}
const emErrs23 = [];
for(const err84 of vErrors){
if(!err84.emUsed){
emErrs23.push(err84);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
if(errors > 0){
const emErrors6 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates6 = {required:{}};
let emPropParams6;
let emParamsErrors6;
for(const err85 of vErrors){
if((((((err85.keyword !== "errorMessage") && (!err85.emUsed)) && (err85.instancePath === instancePath+"/quotas/admin")) && (err85.keyword in emErrors6)) && (err85.schemaPath.indexOf("#/properties/quotas/properties/admin") === 0)) && (/^\/[^\/]*$/.test(err85.schemaPath.slice(36)))){
emPropParams6 = obj0[err85.keyword];
emParamsErrors6 = emErrors6[err85.keyword][err85.params[emPropParams6]];
if(emParamsErrors6){
emParamsErrors6.push(err85);
err85.emUsed = true;
}
}
}
for(const key13 in emErrors6){
for(const keyProp6 in emErrors6[key13]){
emParamsErrors6 = emErrors6[key13][keyProp6];
if(emParamsErrors6.length){
const tmpl6 = templates6[key13] && templates6[key13][keyProp6];
const err86 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/properties/quotas/properties/admin/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema27.properties.quotas.properties.admin.errorMessage[key13][keyProp6],schema:schema27.properties.quotas.properties.admin.errorMessage,parentSchema:schema27.properties.quotas.properties.admin,data:data22};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
}
const emErrs24 = [];
for(const err87 of vErrors){
if(!err87.emUsed){
emErrs24.push(err87);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
if(data21.contrib !== undefined){
let data25 = data21.contrib;
if(data25 && typeof data25 == "object" && !Array.isArray(data25)){
if(data25.unlimited === undefined){
const err88 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema28.required,parentSchema:schema28,data:data25};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if(data25.monthlyLimit === undefined){
const err89 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema28.required,parentSchema:schema28,data:data25};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if(data25.unlimited !== undefined){
let data26 = data25.unlimited;
if(typeof data26 !== "boolean"){
const err90 = {instancePath:instancePath+"/quotas/contrib/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.unlimited.type,parentSchema:schema28.properties.unlimited,data:data26};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err91 of vErrors){
if(!err91.emUsed){
emErrs25.push(err91);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
if(data25.monthlyLimit !== undefined){
let data27 = data25.monthlyLimit;
if(typeof data27 == "number"){
if(data27 < 0 || isNaN(data27)){
const err92 = {instancePath:instancePath+"/quotas/contrib/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28.properties.monthlyLimit,data:data27};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
else {
const err93 = {instancePath:instancePath+"/quotas/contrib/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.monthlyLimit.type,parentSchema:schema28.properties.monthlyLimit,data:data27};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err94 of vErrors){
if(!err94.emUsed){
emErrs26.push(err94);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
}
else {
const err95 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data25};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
if(errors > 0){
const emErrors7 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates7 = {required:{}};
let emPropParams7;
let emParamsErrors7;
for(const err96 of vErrors){
if((((((err96.keyword !== "errorMessage") && (!err96.emUsed)) && (err96.instancePath === instancePath+"/quotas/contrib")) && (err96.keyword in emErrors7)) && (err96.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err96.schemaPath.slice(23)))){
emPropParams7 = obj0[err96.keyword];
emParamsErrors7 = emErrors7[err96.keyword][err96.params[emPropParams7]];
if(emParamsErrors7){
emParamsErrors7.push(err96);
err96.emUsed = true;
}
}
}
for(const key14 in emErrors7){
for(const keyProp7 in emErrors7[key14]){
emParamsErrors7 = emErrors7[key14][keyProp7];
if(emParamsErrors7.length){
const tmpl7 = templates7[key14] && templates7[key14][keyProp7];
const err97 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors7},message:tmpl7 ? tmpl7() : schema28.errorMessage[key14][keyProp7],schema:schema28.errorMessage,parentSchema:schema28,data:data25};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
}
const emErrs27 = [];
for(const err98 of vErrors){
if(!err98.emUsed){
emErrs27.push(err98);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
if(errors > 0){
const emErrors8 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates8 = {required:{}};
let emPropParams8;
let emParamsErrors8;
for(const err99 of vErrors){
if((((((err99.keyword !== "errorMessage") && (!err99.emUsed)) && (err99.instancePath === instancePath+"/quotas/contrib")) && (err99.keyword in emErrors8)) && (err99.schemaPath.indexOf("#/properties/quotas/properties/contrib") === 0)) && (/^\/[^\/]*$/.test(err99.schemaPath.slice(38)))){
emPropParams8 = obj0[err99.keyword];
emParamsErrors8 = emErrors8[err99.keyword][err99.params[emPropParams8]];
if(emParamsErrors8){
emParamsErrors8.push(err99);
err99.emUsed = true;
}
}
}
for(const key15 in emErrors8){
for(const keyProp8 in emErrors8[key15]){
emParamsErrors8 = emErrors8[key15][keyProp8];
if(emParamsErrors8.length){
const tmpl8 = templates8[key15] && templates8[key15][keyProp8];
const err100 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/properties/quotas/properties/contrib/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors8},message:tmpl8 ? tmpl8() : schema27.properties.quotas.properties.contrib.errorMessage[key15][keyProp8],schema:schema27.properties.quotas.properties.contrib.errorMessage,parentSchema:schema27.properties.quotas.properties.contrib,data:data25};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
}
const emErrs28 = [];
for(const err101 of vErrors){
if(!err101.emUsed){
emErrs28.push(err101);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
}
if(data21.user !== undefined){
let data28 = data21.user;
if(data28 && typeof data28 == "object" && !Array.isArray(data28)){
if(data28.unlimited === undefined){
const err102 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema28.required,parentSchema:schema28,data:data28};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
if(data28.monthlyLimit === undefined){
const err103 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema28.required,parentSchema:schema28,data:data28};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
if(data28.unlimited !== undefined){
let data29 = data28.unlimited;
if(typeof data29 !== "boolean"){
const err104 = {instancePath:instancePath+"/quotas/user/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.unlimited.type,parentSchema:schema28.properties.unlimited,data:data29};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
if(errors > 0){
const emErrs29 = [];
for(const err105 of vErrors){
if(!err105.emUsed){
emErrs29.push(err105);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
}
if(data28.monthlyLimit !== undefined){
let data30 = data28.monthlyLimit;
if(typeof data30 == "number"){
if(data30 < 0 || isNaN(data30)){
const err106 = {instancePath:instancePath+"/quotas/user/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28.properties.monthlyLimit,data:data30};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
}
else {
const err107 = {instancePath:instancePath+"/quotas/user/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.monthlyLimit.type,parentSchema:schema28.properties.monthlyLimit,data:data30};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(errors > 0){
const emErrs30 = [];
for(const err108 of vErrors){
if(!err108.emUsed){
emErrs30.push(err108);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
}
}
else {
const err109 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data28};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if(errors > 0){
const emErrors9 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates9 = {required:{}};
let emPropParams9;
let emParamsErrors9;
for(const err110 of vErrors){
if((((((err110.keyword !== "errorMessage") && (!err110.emUsed)) && (err110.instancePath === instancePath+"/quotas/user")) && (err110.keyword in emErrors9)) && (err110.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err110.schemaPath.slice(23)))){
emPropParams9 = obj0[err110.keyword];
emParamsErrors9 = emErrors9[err110.keyword][err110.params[emPropParams9]];
if(emParamsErrors9){
emParamsErrors9.push(err110);
err110.emUsed = true;
}
}
}
for(const key16 in emErrors9){
for(const keyProp9 in emErrors9[key16]){
emParamsErrors9 = emErrors9[key16][keyProp9];
if(emParamsErrors9.length){
const tmpl9 = templates9[key16] && templates9[key16][keyProp9];
const err111 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors9},message:tmpl9 ? tmpl9() : schema28.errorMessage[key16][keyProp9],schema:schema28.errorMessage,parentSchema:schema28,data:data28};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
}
}
const emErrs31 = [];
for(const err112 of vErrors){
if(!err112.emUsed){
emErrs31.push(err112);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
if(errors > 0){
const emErrors10 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates10 = {required:{}};
let emPropParams10;
let emParamsErrors10;
for(const err113 of vErrors){
if((((((err113.keyword !== "errorMessage") && (!err113.emUsed)) && (err113.instancePath === instancePath+"/quotas/user")) && (err113.keyword in emErrors10)) && (err113.schemaPath.indexOf("#/properties/quotas/properties/user") === 0)) && (/^\/[^\/]*$/.test(err113.schemaPath.slice(35)))){
emPropParams10 = obj0[err113.keyword];
emParamsErrors10 = emErrors10[err113.keyword][err113.params[emPropParams10]];
if(emParamsErrors10){
emParamsErrors10.push(err113);
err113.emUsed = true;
}
}
}
for(const key17 in emErrors10){
for(const keyProp10 in emErrors10[key17]){
emParamsErrors10 = emErrors10[key17][keyProp10];
if(emParamsErrors10.length){
const tmpl10 = templates10[key17] && templates10[key17][keyProp10];
const err114 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/properties/quotas/properties/user/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors10},message:tmpl10 ? tmpl10() : schema27.properties.quotas.properties.user.errorMessage[key17][keyProp10],schema:schema27.properties.quotas.properties.user.errorMessage,parentSchema:schema27.properties.quotas.properties.user,data:data28};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
}
}
const emErrs32 = [];
for(const err115 of vErrors){
if(!err115.emUsed){
emErrs32.push(err115);
}
}
vErrors = emErrs32;
errors = emErrs32.length;
}
}
if(data21.external !== undefined){
let data31 = data21.external;
if(data31 && typeof data31 == "object" && !Array.isArray(data31)){
if(data31.unlimited === undefined){
const err116 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema28.required,parentSchema:schema28,data:data31};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
if(data31.monthlyLimit === undefined){
const err117 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema28.required,parentSchema:schema28,data:data31};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
if(data31.unlimited !== undefined){
let data32 = data31.unlimited;
if(typeof data32 !== "boolean"){
const err118 = {instancePath:instancePath+"/quotas/external/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.unlimited.type,parentSchema:schema28.properties.unlimited,data:data32};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if(errors > 0){
const emErrs33 = [];
for(const err119 of vErrors){
if(!err119.emUsed){
emErrs33.push(err119);
}
}
vErrors = emErrs33;
errors = emErrs33.length;
}
}
if(data31.monthlyLimit !== undefined){
let data33 = data31.monthlyLimit;
if(typeof data33 == "number"){
if(data33 < 0 || isNaN(data33)){
const err120 = {instancePath:instancePath+"/quotas/external/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28.properties.monthlyLimit,data:data33};
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
const err121 = {instancePath:instancePath+"/quotas/external/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.monthlyLimit.type,parentSchema:schema28.properties.monthlyLimit,data:data33};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if(errors > 0){
const emErrs34 = [];
for(const err122 of vErrors){
if(!err122.emUsed){
emErrs34.push(err122);
}
}
vErrors = emErrs34;
errors = emErrs34.length;
}
}
}
else {
const err123 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data31};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
if(errors > 0){
const emErrors11 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates11 = {required:{}};
let emPropParams11;
let emParamsErrors11;
for(const err124 of vErrors){
if((((((err124.keyword !== "errorMessage") && (!err124.emUsed)) && (err124.instancePath === instancePath+"/quotas/external")) && (err124.keyword in emErrors11)) && (err124.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err124.schemaPath.slice(23)))){
emPropParams11 = obj0[err124.keyword];
emParamsErrors11 = emErrors11[err124.keyword][err124.params[emPropParams11]];
if(emParamsErrors11){
emParamsErrors11.push(err124);
err124.emUsed = true;
}
}
}
for(const key18 in emErrors11){
for(const keyProp11 in emErrors11[key18]){
emParamsErrors11 = emErrors11[key18][keyProp11];
if(emParamsErrors11.length){
const tmpl11 = templates11[key18] && templates11[key18][keyProp11];
const err125 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors11},message:tmpl11 ? tmpl11() : schema28.errorMessage[key18][keyProp11],schema:schema28.errorMessage,parentSchema:schema28,data:data31};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
}
}
const emErrs35 = [];
for(const err126 of vErrors){
if(!err126.emUsed){
emErrs35.push(err126);
}
}
vErrors = emErrs35;
errors = emErrs35.length;
}
if(errors > 0){
const emErrors12 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates12 = {required:{}};
let emPropParams12;
let emParamsErrors12;
for(const err127 of vErrors){
if((((((err127.keyword !== "errorMessage") && (!err127.emUsed)) && (err127.instancePath === instancePath+"/quotas/external")) && (err127.keyword in emErrors12)) && (err127.schemaPath.indexOf("#/properties/quotas/properties/external") === 0)) && (/^\/[^\/]*$/.test(err127.schemaPath.slice(39)))){
emPropParams12 = obj0[err127.keyword];
emParamsErrors12 = emErrors12[err127.keyword][err127.params[emPropParams12]];
if(emParamsErrors12){
emParamsErrors12.push(err127);
err127.emUsed = true;
}
}
}
for(const key19 in emErrors12){
for(const keyProp12 in emErrors12[key19]){
emParamsErrors12 = emErrors12[key19][keyProp12];
if(emParamsErrors12.length){
const tmpl12 = templates12[key19] && templates12[key19][keyProp12];
const err128 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/properties/quotas/properties/external/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors12},message:tmpl12 ? tmpl12() : schema27.properties.quotas.properties.external.errorMessage[key19][keyProp12],schema:schema27.properties.quotas.properties.external.errorMessage,parentSchema:schema27.properties.quotas.properties.external,data:data31};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
}
}
const emErrs36 = [];
for(const err129 of vErrors){
if(!err129.emUsed){
emErrs36.push(err129);
}
}
vErrors = emErrs36;
errors = emErrs36.length;
}
}
if(data21.anonymous !== undefined){
let data34 = data21.anonymous;
if(data34 && typeof data34 == "object" && !Array.isArray(data34)){
if(data34.unlimited === undefined){
const err130 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema28.required,parentSchema:schema28,data:data34};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
if(data34.monthlyLimit === undefined){
const err131 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema28.required,parentSchema:schema28,data:data34};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
if(data34.unlimited !== undefined){
let data35 = data34.unlimited;
if(typeof data35 !== "boolean"){
const err132 = {instancePath:instancePath+"/quotas/anonymous/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.unlimited.type,parentSchema:schema28.properties.unlimited,data:data35};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
if(errors > 0){
const emErrs37 = [];
for(const err133 of vErrors){
if(!err133.emUsed){
emErrs37.push(err133);
}
}
vErrors = emErrs37;
errors = emErrs37.length;
}
}
if(data34.monthlyLimit !== undefined){
let data36 = data34.monthlyLimit;
if(typeof data36 == "number"){
if(data36 < 0 || isNaN(data36)){
const err134 = {instancePath:instancePath+"/quotas/anonymous/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28.properties.monthlyLimit,data:data36};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
}
else {
const err135 = {instancePath:instancePath+"/quotas/anonymous/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.monthlyLimit.type,parentSchema:schema28.properties.monthlyLimit,data:data36};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
if(errors > 0){
const emErrs38 = [];
for(const err136 of vErrors){
if(!err136.emUsed){
emErrs38.push(err136);
}
}
vErrors = emErrs38;
errors = emErrs38.length;
}
}
}
else {
const err137 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data34};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
if(errors > 0){
const emErrors13 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates13 = {required:{}};
let emPropParams13;
let emParamsErrors13;
for(const err138 of vErrors){
if((((((err138.keyword !== "errorMessage") && (!err138.emUsed)) && (err138.instancePath === instancePath+"/quotas/anonymous")) && (err138.keyword in emErrors13)) && (err138.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err138.schemaPath.slice(23)))){
emPropParams13 = obj0[err138.keyword];
emParamsErrors13 = emErrors13[err138.keyword][err138.params[emPropParams13]];
if(emParamsErrors13){
emParamsErrors13.push(err138);
err138.emUsed = true;
}
}
}
for(const key20 in emErrors13){
for(const keyProp13 in emErrors13[key20]){
emParamsErrors13 = emErrors13[key20][keyProp13];
if(emParamsErrors13.length){
const tmpl13 = templates13[key20] && templates13[key20][keyProp13];
const err139 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors13},message:tmpl13 ? tmpl13() : schema28.errorMessage[key20][keyProp13],schema:schema28.errorMessage,parentSchema:schema28,data:data34};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
}
}
const emErrs39 = [];
for(const err140 of vErrors){
if(!err140.emUsed){
emErrs39.push(err140);
}
}
vErrors = emErrs39;
errors = emErrs39.length;
}
if(errors > 0){
const emErrors14 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates14 = {required:{}};
let emPropParams14;
let emParamsErrors14;
for(const err141 of vErrors){
if((((((err141.keyword !== "errorMessage") && (!err141.emUsed)) && (err141.instancePath === instancePath+"/quotas/anonymous")) && (err141.keyword in emErrors14)) && (err141.schemaPath.indexOf("#/properties/quotas/properties/anonymous") === 0)) && (/^\/[^\/]*$/.test(err141.schemaPath.slice(40)))){
emPropParams14 = obj0[err141.keyword];
emParamsErrors14 = emErrors14[err141.keyword][err141.params[emPropParams14]];
if(emParamsErrors14){
emParamsErrors14.push(err141);
err141.emUsed = true;
}
}
}
for(const key21 in emErrors14){
for(const keyProp14 in emErrors14[key21]){
emParamsErrors14 = emErrors14[key21][keyProp14];
if(emParamsErrors14.length){
const tmpl14 = templates14[key21] && templates14[key21][keyProp14];
const err142 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/properties/quotas/properties/anonymous/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors14},message:tmpl14 ? tmpl14() : schema27.properties.quotas.properties.anonymous.errorMessage[key21][keyProp14],schema:schema27.properties.quotas.properties.anonymous.errorMessage,parentSchema:schema27.properties.quotas.properties.anonymous,data:data34};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
}
}
const emErrs40 = [];
for(const err143 of vErrors){
if(!err143.emUsed){
emErrs40.push(err143);
}
}
vErrors = emErrs40;
errors = emErrs40.length;
}
}
if(data21.untrusted !== undefined){
let data37 = data21.untrusted;
if(data37 && typeof data37 == "object" && !Array.isArray(data37)){
if(data37.unlimited === undefined){
const err144 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema28.required,parentSchema:schema28,data:data37};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
if(data37.monthlyLimit === undefined){
const err145 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema28.required,parentSchema:schema28,data:data37};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
if(data37.unlimited !== undefined){
let data38 = data37.unlimited;
if(typeof data38 !== "boolean"){
const err146 = {instancePath:instancePath+"/quotas/untrusted/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.unlimited.type,parentSchema:schema28.properties.unlimited,data:data38};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
if(errors > 0){
const emErrs41 = [];
for(const err147 of vErrors){
if(!err147.emUsed){
emErrs41.push(err147);
}
}
vErrors = emErrs41;
errors = emErrs41.length;
}
}
if(data37.monthlyLimit !== undefined){
let data39 = data37.monthlyLimit;
if(typeof data39 == "number"){
if(data39 < 0 || isNaN(data39)){
const err148 = {instancePath:instancePath+"/quotas/untrusted/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28.properties.monthlyLimit,data:data39};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
}
else {
const err149 = {instancePath:instancePath+"/quotas/untrusted/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.monthlyLimit.type,parentSchema:schema28.properties.monthlyLimit,data:data39};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
if(errors > 0){
const emErrs42 = [];
for(const err150 of vErrors){
if(!err150.emUsed){
emErrs42.push(err150);
}
}
vErrors = emErrs42;
errors = emErrs42.length;
}
}
}
else {
const err151 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data37};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
if(errors > 0){
const emErrors15 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates15 = {required:{}};
let emPropParams15;
let emParamsErrors15;
for(const err152 of vErrors){
if((((((err152.keyword !== "errorMessage") && (!err152.emUsed)) && (err152.instancePath === instancePath+"/quotas/untrusted")) && (err152.keyword in emErrors15)) && (err152.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err152.schemaPath.slice(23)))){
emPropParams15 = obj0[err152.keyword];
emParamsErrors15 = emErrors15[err152.keyword][err152.params[emPropParams15]];
if(emParamsErrors15){
emParamsErrors15.push(err152);
err152.emUsed = true;
}
}
}
for(const key22 in emErrors15){
for(const keyProp15 in emErrors15[key22]){
emParamsErrors15 = emErrors15[key22][keyProp15];
if(emParamsErrors15.length){
const tmpl15 = templates15[key22] && templates15[key22][keyProp15];
const err153 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors15},message:tmpl15 ? tmpl15() : schema28.errorMessage[key22][keyProp15],schema:schema28.errorMessage,parentSchema:schema28,data:data37};
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
const emErrs43 = [];
for(const err154 of vErrors){
if(!err154.emUsed){
emErrs43.push(err154);
}
}
vErrors = emErrs43;
errors = emErrs43.length;
}
if(errors > 0){
const emErrors16 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates16 = {required:{}};
let emPropParams16;
let emParamsErrors16;
for(const err155 of vErrors){
if((((((err155.keyword !== "errorMessage") && (!err155.emUsed)) && (err155.instancePath === instancePath+"/quotas/untrusted")) && (err155.keyword in emErrors16)) && (err155.schemaPath.indexOf("#/properties/quotas/properties/untrusted") === 0)) && (/^\/[^\/]*$/.test(err155.schemaPath.slice(40)))){
emPropParams16 = obj0[err155.keyword];
emParamsErrors16 = emErrors16[err155.keyword][err155.params[emPropParams16]];
if(emParamsErrors16){
emParamsErrors16.push(err155);
err155.emUsed = true;
}
}
}
for(const key23 in emErrors16){
for(const keyProp16 in emErrors16[key23]){
emParamsErrors16 = emErrors16[key23][keyProp16];
if(emParamsErrors16.length){
const tmpl16 = templates16[key23] && templates16[key23][keyProp16];
const err156 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/properties/quotas/properties/untrusted/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors16},message:tmpl16 ? tmpl16() : schema27.properties.quotas.properties.untrusted.errorMessage[key23][keyProp16],schema:schema27.properties.quotas.properties.untrusted.errorMessage,parentSchema:schema27.properties.quotas.properties.untrusted,data:data37};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
}
}
const emErrs44 = [];
for(const err157 of vErrors){
if(!err157.emUsed){
emErrs44.push(err157);
}
}
vErrors = emErrs44;
errors = emErrs44.length;
}
}
}
else {
const err158 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.quotas.type,parentSchema:schema27.properties.quotas,data:data21};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
if(errors > 0){
const emErrors17 = {"required":{"admin":[],"contrib":[],"user":[],"external":[],"anonymous":[]}};
const templates17 = {required:{}};
let emPropParams17;
let emParamsErrors17;
for(const err159 of vErrors){
if((((((err159.keyword !== "errorMessage") && (!err159.emUsed)) && (err159.instancePath === instancePath+"/quotas")) && (err159.keyword in emErrors17)) && (err159.schemaPath.indexOf("#/properties/quotas") === 0)) && (/^\/[^\/]*$/.test(err159.schemaPath.slice(19)))){
emPropParams17 = obj0[err159.keyword];
emParamsErrors17 = emErrors17[err159.keyword][err159.params[emPropParams17]];
if(emParamsErrors17){
emParamsErrors17.push(err159);
err159.emUsed = true;
}
}
}
for(const key24 in emErrors17){
for(const keyProp17 in emErrors17[key24]){
emParamsErrors17 = emErrors17[key24][keyProp17];
if(emParamsErrors17.length){
const tmpl17 = templates17[key24] && templates17[key24][keyProp17];
const err160 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors17},message:tmpl17 ? tmpl17() : schema27.properties.quotas.errorMessage[key24][keyProp17],schema:schema27.properties.quotas.errorMessage,parentSchema:schema27.properties.quotas,data:data21};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
}
}
const emErrs45 = [];
for(const err161 of vErrors){
if(!err161.emUsed){
emErrs45.push(err161);
}
}
vErrors = emErrs45;
errors = emErrs45.length;
}
}
if(data.moderation !== undefined){
let data40 = data.moderation;
if(data40 && typeof data40 == "object" && !Array.isArray(data40)){
if(data40.enabled === undefined){
const err162 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.moderation.required,parentSchema:schema27.properties.moderation,data:data40};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
if(data40.categories === undefined){
const err163 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/required",keyword:"required",params:{missingProperty: "categories"},message:"must have required property '"+"categories"+"'",schema:schema27.properties.moderation.required,parentSchema:schema27.properties.moderation,data:data40};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
for(const key25 in data40){
if(!((key25 === "enabled") || (key25 === "categories"))){
const err164 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key25},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.moderation,data:data40};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
}
if(data40.enabled !== undefined){
let data41 = data40.enabled;
if(typeof data41 !== "boolean"){
const err165 = {instancePath:instancePath+"/moderation/enabled",schemaPath:"#/properties/moderation/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.moderation.properties.enabled.type,parentSchema:schema27.properties.moderation.properties.enabled,data:data41};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
if(errors > 0){
const emErrs46 = [];
for(const err166 of vErrors){
if(!err166.emUsed){
emErrs46.push(err166);
}
}
vErrors = emErrs46;
errors = emErrs46.length;
}
}
if(data40.categories !== undefined){
let data42 = data40.categories;
if(Array.isArray(data42)){
const len0 = data42.length;
for(let i0=0; i0<len0; i0++){
let data43 = data42[i0];
if(typeof data43 !== "string"){
const err167 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.moderation.properties.categories.items.type,parentSchema:schema27.properties.moderation.properties.categories.items,data:data43};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
const _errs103 = errors;
let valid23 = false;
let passing0 = null;
const _errs104 = errors;
if("anonymous" !== data43){
const err168 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/0/const",keyword:"const",params:{allowedValue: "anonymous"},message:"must be equal to constant",schema:"anonymous",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[0],data:data43};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
var _valid0 = _errs104 === errors;
if(_valid0){
valid23 = true;
passing0 = 0;
}
const _errs105 = errors;
if("external" !== data43){
const err169 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/1/const",keyword:"const",params:{allowedValue: "external"},message:"must be equal to constant",schema:"external",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[1],data:data43};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
var _valid0 = _errs105 === errors;
if(_valid0 && valid23){
valid23 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid23 = true;
passing0 = 1;
}
const _errs106 = errors;
if("user" !== data43){
const err170 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/2/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[2],data:data43};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
var _valid0 = _errs106 === errors;
if(_valid0 && valid23){
valid23 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid23 = true;
passing0 = 2;
}
const _errs107 = errors;
if("contrib" !== data43){
const err171 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/3/const",keyword:"const",params:{allowedValue: "contrib"},message:"must be equal to constant",schema:"contrib",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[3],data:data43};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
var _valid0 = _errs107 === errors;
if(_valid0 && valid23){
valid23 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid23 = true;
passing0 = 3;
}
const _errs108 = errors;
if("admin" !== data43){
const err172 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/4/const",keyword:"const",params:{allowedValue: "admin"},message:"must be equal to constant",schema:"admin",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[4],data:data43};
if(vErrors === null){
vErrors = [err172];
}
else {
vErrors.push(err172);
}
errors++;
}
var _valid0 = _errs108 === errors;
if(_valid0 && valid23){
valid23 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid23 = true;
passing0 = 4;
}
}
}
}
}
if(!valid23){
const err173 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema27.properties.moderation.properties.categories.items.oneOf,parentSchema:schema27.properties.moderation.properties.categories.items,data:data43};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
}
errors++;
}
else {
errors = _errs103;
if(vErrors !== null){
if(_errs103){
vErrors.length = _errs103;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors18 = {"oneOf":[]};
const templates18 = {};
for(const err174 of vErrors){
if((((((err174.keyword !== "errorMessage") && (!err174.emUsed)) && (err174.instancePath === instancePath+"/moderation/categories/" + i0)) && (err174.keyword in emErrors18)) && (err174.schemaPath.indexOf("#/properties/moderation/properties/categories/items") === 0)) && (/^\/[^\/]*$/.test(err174.schemaPath.slice(51)))){
emErrors18[err174.keyword].push(err174);
err174.emUsed = true;
}
}
for(const key26 in emErrors18){
if(emErrors18[key26].length){
const err175 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors18[key26]},message:key26 in templates18 ? templates18[key26]() : schema27.properties.moderation.properties.categories.items.errorMessage[key26],schema:schema27.properties.moderation.properties.categories.items.errorMessage,parentSchema:schema27.properties.moderation.properties.categories.items,data:data43};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
}
const emErrs47 = [];
for(const err176 of vErrors){
if(!err176.emUsed){
emErrs47.push(err176);
}
}
vErrors = emErrs47;
errors = emErrs47.length;
}
}
let i1 = data42.length;
let j0;
if(i1 > 1){
const indices0 = {};
for(;i1--;){
let item0 = data42[i1];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err177 = {instancePath:instancePath+"/moderation/categories",schemaPath:"#/properties/moderation/properties/categories/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)",schema:true,parentSchema:schema27.properties.moderation.properties.categories,data:data42};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err178 = {instancePath:instancePath+"/moderation/categories",schemaPath:"#/properties/moderation/properties/categories/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.moderation.properties.categories.type,parentSchema:schema27.properties.moderation.properties.categories,data:data42};
if(vErrors === null){
vErrors = [err178];
}
else {
vErrors.push(err178);
}
errors++;
}
if(errors > 0){
const emErrs48 = [];
for(const err179 of vErrors){
if(!err179.emUsed){
emErrs48.push(err179);
}
}
vErrors = emErrs48;
errors = emErrs48.length;
}
}
}
else {
const err180 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.moderation.type,parentSchema:schema27.properties.moderation,data:data40};
if(vErrors === null){
vErrors = [err180];
}
else {
vErrors.push(err180);
}
errors++;
}
if(errors > 0){
const emErrors19 = {"required":{"enabled":[],"categories":[]}};
const templates19 = {required:{}};
let emPropParams18;
let emParamsErrors18;
for(const err181 of vErrors){
if((((((err181.keyword !== "errorMessage") && (!err181.emUsed)) && (err181.instancePath === instancePath+"/moderation")) && (err181.keyword in emErrors19)) && (err181.schemaPath.indexOf("#/properties/moderation") === 0)) && (/^\/[^\/]*$/.test(err181.schemaPath.slice(23)))){
emPropParams18 = obj0[err181.keyword];
emParamsErrors18 = emErrors19[err181.keyword][err181.params[emPropParams18]];
if(emParamsErrors18){
emParamsErrors18.push(err181);
err181.emUsed = true;
}
}
}
for(const key27 in emErrors19){
for(const keyProp18 in emErrors19[key27]){
emParamsErrors18 = emErrors19[key27][keyProp18];
if(emParamsErrors18.length){
const tmpl18 = templates19[key27] && templates19[key27][keyProp18];
const err182 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors18},message:tmpl18 ? tmpl18() : schema27.properties.moderation.errorMessage[key27][keyProp18],schema:schema27.properties.moderation.errorMessage,parentSchema:schema27.properties.moderation,data:data40};
if(vErrors === null){
vErrors = [err182];
}
else {
vErrors.push(err182);
}
errors++;
}
}
}
const emErrs49 = [];
for(const err183 of vErrors){
if(!err183.emUsed){
emErrs49.push(err183);
}
}
vErrors = emErrs49;
errors = emErrs49.length;
}
}
if(data.storeTraces !== undefined){
let data44 = data.storeTraces;
if(typeof data44 !== "boolean"){
const err184 = {instancePath:instancePath+"/storeTraces",schemaPath:"#/properties/storeTraces/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.storeTraces.type,parentSchema:schema27.properties.storeTraces,data:data44};
if(vErrors === null){
vErrors = [err184];
}
else {
vErrors.push(err184);
}
errors++;
}
if(errors > 0){
const emErrs50 = [];
for(const err185 of vErrors){
if(!err185.emUsed){
emErrs50.push(err185);
}
}
vErrors = emErrs50;
errors = emErrs50.length;
}
}
}
else {
const err186 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err186];
}
else {
vErrors.push(err186);
}
errors++;
}
if(errors > 0){
const emErrs51 = [];
for(const err187 of vErrors){
if(!err187.emUsed){
emErrs51.push(err187);
}
}
vErrors = emErrs51;
errors = emErrs51.length;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(!(validate23(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
function expression0(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.defaultData)
}function expression1(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=assistant`
}function expression2(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (`${item.name} (${item.provider.name})`)
}function expression3(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item.provider.id + ":" + item.id)
}function expression4(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (({ provider: item.provider.id, id: item.id, name: item.name }))
}function expression5(data,body,options,context,display,layout,readOnly,summary,validates
) {
return (data.results)
}function expression6(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=tools`
}function expression7(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=summarizer`
}function expression8(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=evaluator`
}function expression9(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=moderator`
}function expression10(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (context.accountType === "organization")
}function expression11(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return (!parent.data.unlimited)
}function expression12(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ([{"const":"anonymous","title":"Anonymous","key":"anonymous","value":"anonymous"},{"const":"external","title":"External","key":"external","value":"external"},{"const":"user","title":"User","key":"user","value":"user"},{"const":"contrib","title":"Contributor","key":"contrib","value":"contrib"},{"const":"admin","title":"Admin","key":"admin","value":"admin"}])
}

const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/settings/org-put-req#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/settings/org-put-req#": {
      title: "Org settings",
      root: "https://github.com/data-fair/agents/settings/org-put-req#",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items": {
      title: "",
      root: "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/settings/org-put-req#": {
      title: "Org settings",
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#",
      pure: false,
      propertyKeys: ["modelMapping", "quotas", "moderation", "storeTraces"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping", "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas", "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation", "https://github.com/data-fair/agents/settings/org-put-req#/properties/storeTraces"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping": {
      title: "Model roles",
      key: "modelMapping",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping",
      pure: true,
      propertyKeys: ["assistant", "tools", "summarizer", "evaluator", "moderator"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant": {
      title: "Assistant",
      key: "assistant",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant",
      pure: true,
      propertyKeys: ["provider", "id", "name"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/provider", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/id", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/name"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/provider": {
      title: undefined,
      key: "provider",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/provider",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/provider",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/id": {
      title: undefined,
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/name": {
      title: undefined,
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools": {
      title: "Tools",
      key: "tools",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools",
      pure: true,
      propertyKeys: ["provider", "id", "name"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/provider", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/id", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/name"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/provider": {
      title: undefined,
      key: "provider",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/provider",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/provider",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/id": {
      title: undefined,
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/name": {
      title: undefined,
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer": {
      title: "Summarizer",
      key: "summarizer",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer",
      pure: true,
      propertyKeys: ["provider", "id", "name"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/provider", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/id", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/name"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/provider": {
      title: undefined,
      key: "provider",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/provider",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/provider",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/id": {
      title: undefined,
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/name": {
      title: undefined,
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator": {
      title: "Evaluator",
      key: "evaluator",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator",
      pure: true,
      propertyKeys: ["provider", "id", "name"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/provider", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/id", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/name"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/provider": {
      title: undefined,
      key: "provider",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/provider",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/provider",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/id": {
      title: undefined,
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/name": {
      title: undefined,
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator": {
      title: "Moderator",
      key: "moderator",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator",
      pure: true,
      propertyKeys: ["provider", "id", "name"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/provider", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/id", "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/name"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/provider": {
      title: undefined,
      key: "provider",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/provider",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/provider",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/id": {
      title: undefined,
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/name": {
      title: undefined,
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas": {
      title: "Role Quotas",
      key: "quotas",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas",
      pure: false,
      propertyKeys: ["admin", "contrib", "user", "external", "anonymous", "untrusted"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/admin", "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/contrib", "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/user", "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/external", "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/anonymous", "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/untrusted"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/admin": {
      title: "Admin quotas",
      key: "admin",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/admin",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/monthlyLimit"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/unlimited": {
      title: "Unlimited",
      key: "unlimited",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/unlimited",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/unlimited",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/monthlyLimit": {
      title: "Monthly Limit",
      key: "monthlyLimit",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/monthlyLimit",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/monthlyLimit",
      pure: false,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/contrib": {
      title: "Contributor quotas",
      key: "contrib",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/contrib",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/monthlyLimit"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/user": {
      title: "Simple user Quotas",
      key: "user",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/user",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/monthlyLimit"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/external": {
      title: "External user quotas",
      key: "external",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/external",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/monthlyLimit"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/anonymous": {
      title: "Anonymous user quotas",
      key: "anonymous",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/anonymous",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/monthlyLimit"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/untrusted": {
      title: "Anonymous + external pool",
      key: "untrusted",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/untrusted",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/monthlyLimit"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation": {
      title: "Input moderation",
      key: "moderation",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation",
      pure: true,
      propertyKeys: ["enabled", "categories"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/enabled", "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/enabled": {
      title: "Enable input moderation",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories": {
      title: "Moderated user categories",
      key: "categories",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      childrenTrees: ["https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items"]
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/storeTraces": {
      title: "Store conversation traces",
      key: "storeTraces",
      pointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/storeTraces",
      refPointer: "https://github.com/data-fair/agents/settings/org-put-req#/properties/storeTraces",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/settings/org-put-req#": {
      comp: "section",

      children: [{
        key: "modelMapping"
      }, {
        key: "quotas"
      }, {
        key: "moderation"
      }, {
        key: "storeTraces"
      }],

      title: "Org settings",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping": {
      comp: "section",

      children: [{
        key: "assistant"
      }, {
        key: "tools"
      }, {
        key: "summarizer"
      }, {
        key: "evaluator"
      }, {
        key: "moderator"
      }],

      title: "Model roles"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant": {
      comp: "autocomplete",

      cols: {
        xs: 12,
        md: 6
      },

      getItems: {
        url: {
          type: "js-tpl",
          expr: "${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=assistant",
          pure: true,
          dataAlias: "value",
          ref: 1
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
          expr: "`${item.name} (${item.provider.name})`",
          pure: true,
          dataAlias: "item",
          ref: 2
        },

        itemKey: {
          type: "js-eval",
          expr: "item.provider.id + \":\" + item.id",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemValue: {
          type: "js-eval",
          expr: "({ provider: item.provider.id, id: item.id, name: item.name })",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        returnObjects: true
      },

      label: "Assistant",
      help: "<p>The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.</p>"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/provider": {
      comp: "text-field",
      label: "provider"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/id": {
      comp: "text-field",
      label: "id"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/assistant/properties/name": {
      comp: "text-field",
      label: "name"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools": {
      comp: "autocomplete",

      cols: {
        xs: 12,
        md: 6
      },

      getItems: {
        url: {
          type: "js-tpl",
          expr: "${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=tools",
          pure: true,
          dataAlias: "value",
          ref: 6
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
          expr: "`${item.name} (${item.provider.name})`",
          pure: true,
          dataAlias: "item",
          ref: 2
        },

        itemKey: {
          type: "js-eval",
          expr: "item.provider.id + \":\" + item.id",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemValue: {
          type: "js-eval",
          expr: "({ provider: item.provider.id, id: item.id, name: item.name })",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        returnObjects: true
      },

      label: "Tools",
      help: "<p>The &quot;technician.&quot; Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.</p>"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/provider": {
      comp: "text-field",
      label: "provider"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/id": {
      comp: "text-field",
      label: "id"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/tools/properties/name": {
      comp: "text-field",
      label: "name"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer": {
      comp: "autocomplete",

      cols: {
        xs: 12,
        md: 6
      },

      getItems: {
        url: {
          type: "js-tpl",
          expr: "${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=summarizer",
          pure: true,
          dataAlias: "value",
          ref: 7
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
          expr: "`${item.name} (${item.provider.name})`",
          pure: true,
          dataAlias: "item",
          ref: 2
        },

        itemKey: {
          type: "js-eval",
          expr: "item.provider.id + \":\" + item.id",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemValue: {
          type: "js-eval",
          expr: "({ provider: item.provider.id, id: item.id, name: item.name })",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        returnObjects: true
      },

      label: "Summarizer",
      help: "<p>A &quot;shorthand&quot; specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.</p>"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/provider": {
      comp: "text-field",
      label: "provider"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/id": {
      comp: "text-field",
      label: "id"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/summarizer/properties/name": {
      comp: "text-field",
      label: "name"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator": {
      comp: "autocomplete",

      cols: {
        xs: 12,
        md: 6
      },

      getItems: {
        url: {
          type: "js-tpl",
          expr: "${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=evaluator",
          pure: true,
          dataAlias: "value",
          ref: 8
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
          expr: "`${item.name} (${item.provider.name})`",
          pure: true,
          dataAlias: "item",
          ref: 2
        },

        itemKey: {
          type: "js-eval",
          expr: "item.provider.id + \":\" + item.id",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemValue: {
          type: "js-eval",
          expr: "({ provider: item.provider.id, id: item.id, name: item.name })",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        returnObjects: true
      },

      label: "Evaluator",
      help: "<p>The &quot;quality controller.&quot; Analyzes the assistant&#39;s logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.</p>"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/provider": {
      comp: "text-field",
      label: "provider"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/id": {
      comp: "text-field",
      label: "id"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/evaluator/properties/name": {
      comp: "text-field",
      label: "name"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator": {
      comp: "autocomplete",

      cols: {
        xs: 12,
        md: 6
      },

      getItems: {
        url: {
          type: "js-tpl",
          expr: "${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=moderator",
          pure: true,
          dataAlias: "value",
          ref: 9
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
          expr: "`${item.name} (${item.provider.name})`",
          pure: true,
          dataAlias: "item",
          ref: 2
        },

        itemKey: {
          type: "js-eval",
          expr: "item.provider.id + \":\" + item.id",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemValue: {
          type: "js-eval",
          expr: "({ provider: item.provider.id, id: item.id, name: item.name })",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        returnObjects: true
      },

      label: "Moderator",
      help: "<p>The &quot;gatekeeper.&quot; Classifies each new user message for profanity, prompt-injection, persona override, and out-of-scope requests. Should be fast and cheap — it sits on the critical path to the first response token. Dedicated moderation classifiers (Llama Guard, moderation APIs) are not compatible: they use fixed taxonomies and output formats that cannot express this platform&#39;s custom policy.</p>"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/provider": {
      comp: "text-field",
      label: "provider"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/id": {
      comp: "text-field",
      label: "id"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/modelMapping/properties/moderator/properties/name": {
      comp: "text-field",
      label: "name"
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas": {
      title: null,

      children: [{
        key: "admin",

        cols: {
          xs: 12,
          sm: 6,
          md: 4
        }
      }, {
        key: "contrib",

        cols: {
          xs: 12,
          sm: 6,
          md: 4
        },

        if: {
          type: "js-eval",
          expr: "context.accountType === \"organization\"",
          pure: true,
          dataAlias: "value",
          ref: 10
        }
      }, {
        key: "user",

        cols: {
          xs: 12,
          sm: 6,
          md: 4
        },

        if: {
          type: "js-eval",
          expr: "context.accountType === \"organization\"",
          pure: true,
          dataAlias: "value",
          ref: 10
        }
      }, {
        key: "external",

        cols: {
          xs: 12,
          sm: 6,
          md: 4
        }
      }, {
        key: "anonymous",

        cols: {
          xs: 12,
          sm: 6,
          md: 4
        }
      }, {
        key: "untrusted",

        cols: {
          xs: 12,
          sm: 6,
          md: 4
        }
      }],

      comp: "section",

      defaultData: {
        admin: {
          unlimited: true,
          monthlyLimit: 0
        },

        contrib: {
          unlimited: false,
          monthlyLimit: 0
        },

        user: {
          unlimited: false,
          monthlyLimit: 0
        },

        external: {
          unlimited: false,
          monthlyLimit: 0
        },

        anonymous: {
          unlimited: false,
          monthlyLimit: 0
        },

        untrusted: {
          unlimited: false,
          monthlyLimit: 0
        }
      },

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/admin": {
      comp: "card",

      children: [{
        key: "unlimited"
      }, {
        key: "monthlyLimit"
      }],

      title: "Admin quotas",

      defaultData: {
        unlimited: true,
        monthlyLimit: 0
      },

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/unlimited": {
      comp: "checkbox",
      label: "Unlimited",
      defaultData: false,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/definitions/RoleQuota/properties/monthlyLimit": {
      if: {
        type: "js-eval",
        expr: "!parent.data.unlimited",
        pure: false,
        dataAlias: "value",
        ref: 11
      },

      comp: "number-field",
      min: 0,
      label: "Monthly Limit",
      help: "<p>Weekly limit = monthly / 2, daily limit = monthly / 4</p>",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/contrib": {
      comp: "card",

      children: [{
        key: "unlimited"
      }, {
        key: "monthlyLimit"
      }],

      title: "Contributor quotas",

      defaultData: {
        unlimited: false,
        monthlyLimit: 0
      },

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/user": {
      comp: "card",

      children: [{
        key: "unlimited"
      }, {
        key: "monthlyLimit"
      }],

      title: "Simple user Quotas",

      defaultData: {
        unlimited: false,
        monthlyLimit: 0
      },

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/external": {
      comp: "card",

      children: [{
        key: "unlimited"
      }, {
        key: "monthlyLimit"
      }],

      title: "External user quotas",

      defaultData: {
        unlimited: false,
        monthlyLimit: 0
      },

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/anonymous": {
      comp: "card",

      children: [{
        key: "unlimited"
      }, {
        key: "monthlyLimit"
      }],

      title: "Anonymous user quotas",

      defaultData: {
        unlimited: false,
        monthlyLimit: 0
      },

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/quotas/properties/untrusted": {
      comp: "card",

      children: [{
        key: "unlimited"
      }, {
        key: "monthlyLimit"
      }],

      title: "Anonymous + external pool",
      subtitle: "<p>Aggregate cap shared by all anonymous and external usage combined, so untrusted traffic cannot consume the whole account budget. 0 = no pool cap.</p>",

      defaultData: {
        unlimited: false,
        monthlyLimit: 0
      },

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation": {
      comp: "section",

      children: [{
        key: "enabled"
      }, {
        key: "categories"
      }],

      title: "Input moderation",

      defaultData: {
        enabled: false,
        categories: ["anonymous", "external"]
      },

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/enabled": {
      comp: "checkbox",
      label: "Enable input moderation",
      help: "<p>When enabled, the last user message of each request from a moderated category is classified before the model responds.</p>",
      defaultData: false,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"anonymous\",\"title\":\"Anonymous\",\"key\":\"anonymous\",\"value\":\"anonymous\"},{\"const\":\"external\",\"title\":\"External\",\"key\":\"external\",\"value\":\"external\"},{\"const\":\"user\",\"title\":\"User\",\"key\":\"user\",\"value\":\"user\"},{\"const\":\"contrib\",\"title\":\"Contributor\",\"key\":\"contrib\",\"value\":\"contrib\"},{\"const\":\"admin\",\"title\":\"Admin\",\"key\":\"admin\",\"value\":\"admin\"}]",
        immutable: true,
        ref: 12
      },

      multiple: true,
      label: "Moderated user categories",
      help: "<p>User categories whose requests are checked by the gate when moderation is enabled.</p>",
      defaultData: ["anonymous", "external"],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"anonymous\",\"title\":\"Anonymous\",\"key\":\"anonymous\",\"value\":\"anonymous\"},{\"const\":\"external\",\"title\":\"External\",\"key\":\"external\",\"value\":\"external\"},{\"const\":\"user\",\"title\":\"User\",\"key\":\"user\",\"value\":\"user\"},{\"const\":\"contrib\",\"title\":\"Contributor\",\"key\":\"contrib\",\"value\":\"contrib\"},{\"const\":\"admin\",\"title\":\"Admin\",\"key\":\"admin\",\"value\":\"admin\"}]",
        immutable: true,
        ref: 12
      },

      label: "",
      nullable: true
    },

    "https://github.com/data-fair/agents/settings/org-put-req#/properties/storeTraces": {
      comp: "checkbox",
      label: "Store conversation traces",
      help: "<p>When enabled, conversations of consenting users are stored on the server for 30 days for admin review. Each user must explicitly accept.</p>",
      defaultData: false,

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
    "https://github.com/data-fair/agents/settings/org-put-req#/properties/moderation/properties/categories/items": validate22,
    "https://github.com/data-fair/agents/settings/org-put-req#": validate24
  },

  validationErrors: {},
  expressions: [expression0, expression1, expression2, expression3, expression4, expression5, expression6, expression7, expression8, expression9, expression10, expression11, expression12],
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
            enum: ["inline", "inline-single", "menu", "dialog"]
          },

          listActions: {
            type: "array",

            items: {
              type: "string",
              enum: ["add", "edit", "delete", "sort", "duplicate", "copy", "paste"]
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

          oneOfItems: {
            type: "array",

            items: {
              $ref: "https://json-layout.github.io/normalized-layout-keyword#/$defs/one-of-item"
            }
          }
        }
      }
    }
  },

  localizeErrors: localizeErrors
};

const nodeComponents = {
  
  "section": sectionNode,
  
  "autocomplete": autocompleteNode,
  
  "text-field": textfieldNode,
  
  "card": cardNode,
  
  "checkbox": checkboxNode,
  
  "number-field": numberfieldNode,
  
  "select": selectNode,
    
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