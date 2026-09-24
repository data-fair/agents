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


import localizeErrors from "ajv-i18n/localize/en/index.js";

const export0 = validate22;
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/settings/org-form-models#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/settings/org-form-models","x-exports":["vjsf"],"x-vjsf":{"xI18n":true},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"layout":{"title":null},"definitions":{"RoleQuota":{"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Unlimited","default":false},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Monthly Limit","description":"Weekly limit = monthly / 2, daily limit = monthly / 4","default":0,"minimum":0}}}},"properties":{"modelMapping":{"type":"object","additionalProperties":false,"title":"Model per role","layout":{"title":null},"properties":{"assistant":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Assistant","description":"The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.","layout":{"comp":"autocomplete","cols":{"md":6},"getProps":"({ placeholder: context.roleDefaults?.assistant, persistentPlaceholder: !!context.roleDefaults?.assistant })","getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=assistant","pure":true,"dataAlias":"value","ref":2},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":6},"itemTitle":{"type":"js-eval","expr":"item.provider.name ? `${item.name} (${item.provider.name})` : item.name","pure":true,"dataAlias":"item","ref":3},"itemKey":{"type":"js-eval","expr":"(item.provider.id || item.provider) + \":\" + item.id","pure":true,"dataAlias":"item","ref":4},"itemValue":{"type":"js-eval","expr":"({ provider: item.provider.id, id: item.id, name: item.name })","pure":true,"dataAlias":"item","ref":5},"returnObjects":true}},"properties":{"provider":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/provider","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/name","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant","errorMessage":{"required":{"provider":"required information","id":"required information"}}},"tools":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Tools","description":"The \"technician.\" Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.","layout":{"comp":"autocomplete","cols":{"md":6},"getProps":"({ placeholder: context.roleDefaults?.tools, persistentPlaceholder: !!context.roleDefaults?.tools })","getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=tools","pure":true,"dataAlias":"value","ref":8},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":6},"itemTitle":{"type":"js-eval","expr":"item.provider.name ? `${item.name} (${item.provider.name})` : item.name","pure":true,"dataAlias":"item","ref":3},"itemKey":{"type":"js-eval","expr":"(item.provider.id || item.provider) + \":\" + item.id","pure":true,"dataAlias":"item","ref":4},"itemValue":{"type":"js-eval","expr":"({ provider: item.provider.id, id: item.id, name: item.name })","pure":true,"dataAlias":"item","ref":5},"returnObjects":true}},"properties":{"provider":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/provider","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/name","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools","errorMessage":{"required":{"provider":"required information","id":"required information"}}},"summarizer":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Summarizer","description":"A \"shorthand\" specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.","layout":{"comp":"autocomplete","cols":{"md":6},"getProps":"({ placeholder: context.roleDefaults?.summarizer, persistentPlaceholder: !!context.roleDefaults?.summarizer })","getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=summarizer","pure":true,"dataAlias":"value","ref":10},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":6},"itemTitle":{"type":"js-eval","expr":"item.provider.name ? `${item.name} (${item.provider.name})` : item.name","pure":true,"dataAlias":"item","ref":3},"itemKey":{"type":"js-eval","expr":"(item.provider.id || item.provider) + \":\" + item.id","pure":true,"dataAlias":"item","ref":4},"itemValue":{"type":"js-eval","expr":"({ provider: item.provider.id, id: item.id, name: item.name })","pure":true,"dataAlias":"item","ref":5},"returnObjects":true}},"properties":{"provider":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/provider","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/name","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer","errorMessage":{"required":{"provider":"required information","id":"required information"}}},"evaluator":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Evaluator","description":"The \"quality controller.\" Analyzes the assistant's logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.","layout":{"comp":"autocomplete","cols":{"md":6},"getProps":"({ placeholder: context.roleDefaults?.evaluator, persistentPlaceholder: !!context.roleDefaults?.evaluator })","getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=evaluator","pure":true,"dataAlias":"value","ref":12},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":6},"itemTitle":{"type":"js-eval","expr":"item.provider.name ? `${item.name} (${item.provider.name})` : item.name","pure":true,"dataAlias":"item","ref":3},"itemKey":{"type":"js-eval","expr":"(item.provider.id || item.provider) + \":\" + item.id","pure":true,"dataAlias":"item","ref":4},"itemValue":{"type":"js-eval","expr":"({ provider: item.provider.id, id: item.id, name: item.name })","pure":true,"dataAlias":"item","ref":5},"returnObjects":true}},"properties":{"provider":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/provider","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/name","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator","errorMessage":{"required":{"provider":"required information","id":"required information"}}},"moderator":{"type":"object","additionalProperties":false,"required":["provider","id"],"title":"Moderator","description":"The \"gatekeeper.\" Classifies each new user message for profanity, prompt-injection, persona override, and out-of-scope requests. Should be fast and cheap — it sits on the critical path to the first response token. Dedicated moderation classifiers (Llama Guard, moderation APIs) are not compatible: they use fixed taxonomies and output formats that cannot express this platform's custom policy.","layout":{"comp":"autocomplete","cols":{"md":6},"getProps":"({ placeholder: context.roleDefaults?.moderator, persistentPlaceholder: !!context.roleDefaults?.moderator })","getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=moderator","pure":true,"dataAlias":"value","ref":14},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":6},"itemTitle":{"type":"js-eval","expr":"item.provider.name ? `${item.name} (${item.provider.name})` : item.name","pure":true,"dataAlias":"item","ref":3},"itemKey":{"type":"js-eval","expr":"(item.provider.id || item.provider) + \":\" + item.id","pure":true,"dataAlias":"item","ref":4},"itemValue":{"type":"js-eval","expr":"({ provider: item.provider.id, id: item.id, name: item.name })","pure":true,"dataAlias":"item","ref":5},"returnObjects":true}},"properties":{"provider":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/provider","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/name","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator","errorMessage":{"required":{"provider":"required information","id":"required information"}}}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-models#","errorMessage":{}};
const obj0 = {"required":"missingProperty","dependencies":"property","dependentRequired":"property"};

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
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key0 in data){
if(!(key0 === "modelMapping")){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
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
const err1 = {instancePath:instancePath+"/modelMapping",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.modelMapping,data:data0};
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
const err2 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema27.properties.modelMapping.properties.assistant.required,parentSchema:schema27.properties.modelMapping.properties.assistant,data:data1};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data1.id === undefined){
const err3 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.modelMapping.properties.assistant.required,parentSchema:schema27.properties.modelMapping.properties.assistant,data:data1};
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
const err4 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.modelMapping.properties.assistant,data:data1};
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
const err5 = {instancePath:instancePath+"/modelMapping/assistant/provider",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.assistant.properties.provider.type,parentSchema:schema27.properties.modelMapping.properties.assistant.properties.provider,data:data2};
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
const err7 = {instancePath:instancePath+"/modelMapping/assistant/id",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.assistant.properties.id.type,parentSchema:schema27.properties.modelMapping.properties.assistant.properties.id,data:data3};
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
const err9 = {instancePath:instancePath+"/modelMapping/assistant/name",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.assistant.properties.name.type,parentSchema:schema27.properties.modelMapping.properties.assistant.properties.name,data:data4};
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
const err11 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.modelMapping.properties.assistant.type,parentSchema:schema27.properties.modelMapping.properties.assistant,data:data1};
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
if((((((err12.keyword !== "errorMessage") && (!err12.emUsed)) && (err12.instancePath === instancePath+"/modelMapping/assistant")) && (err12.keyword in emErrors0)) && (err12.schemaPath.indexOf("https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant") === 0)) && (/^\/[^\/]*$/.test(err12.schemaPath.slice(106)))){
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
const err13 = {instancePath:instancePath+"/modelMapping/assistant",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.modelMapping.properties.assistant.errorMessage[key3][keyProp0],schema:schema27.properties.modelMapping.properties.assistant.errorMessage,parentSchema:schema27.properties.modelMapping.properties.assistant,data:data1};
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
const err15 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema27.properties.modelMapping.properties.tools.required,parentSchema:schema27.properties.modelMapping.properties.tools,data:data5};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data5.id === undefined){
const err16 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.modelMapping.properties.tools.required,parentSchema:schema27.properties.modelMapping.properties.tools,data:data5};
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
const err17 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.modelMapping.properties.tools,data:data5};
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
const err18 = {instancePath:instancePath+"/modelMapping/tools/provider",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.tools.properties.provider.type,parentSchema:schema27.properties.modelMapping.properties.tools.properties.provider,data:data6};
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
const err20 = {instancePath:instancePath+"/modelMapping/tools/id",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.tools.properties.id.type,parentSchema:schema27.properties.modelMapping.properties.tools.properties.id,data:data7};
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
const err22 = {instancePath:instancePath+"/modelMapping/tools/name",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.tools.properties.name.type,parentSchema:schema27.properties.modelMapping.properties.tools.properties.name,data:data8};
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
const err24 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.modelMapping.properties.tools.type,parentSchema:schema27.properties.modelMapping.properties.tools,data:data5};
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
if((((((err25.keyword !== "errorMessage") && (!err25.emUsed)) && (err25.instancePath === instancePath+"/modelMapping/tools")) && (err25.keyword in emErrors1)) && (err25.schemaPath.indexOf("https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools") === 0)) && (/^\/[^\/]*$/.test(err25.schemaPath.slice(102)))){
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
const err26 = {instancePath:instancePath+"/modelMapping/tools",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.properties.modelMapping.properties.tools.errorMessage[key5][keyProp1],schema:schema27.properties.modelMapping.properties.tools.errorMessage,parentSchema:schema27.properties.modelMapping.properties.tools,data:data5};
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
const err28 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema27.properties.modelMapping.properties.summarizer.required,parentSchema:schema27.properties.modelMapping.properties.summarizer,data:data9};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data9.id === undefined){
const err29 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.modelMapping.properties.summarizer.required,parentSchema:schema27.properties.modelMapping.properties.summarizer,data:data9};
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
const err30 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.modelMapping.properties.summarizer,data:data9};
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
const err31 = {instancePath:instancePath+"/modelMapping/summarizer/provider",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.summarizer.properties.provider.type,parentSchema:schema27.properties.modelMapping.properties.summarizer.properties.provider,data:data10};
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
const err33 = {instancePath:instancePath+"/modelMapping/summarizer/id",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.summarizer.properties.id.type,parentSchema:schema27.properties.modelMapping.properties.summarizer.properties.id,data:data11};
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
const err35 = {instancePath:instancePath+"/modelMapping/summarizer/name",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.summarizer.properties.name.type,parentSchema:schema27.properties.modelMapping.properties.summarizer.properties.name,data:data12};
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
const err37 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.modelMapping.properties.summarizer.type,parentSchema:schema27.properties.modelMapping.properties.summarizer,data:data9};
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
if((((((err38.keyword !== "errorMessage") && (!err38.emUsed)) && (err38.instancePath === instancePath+"/modelMapping/summarizer")) && (err38.keyword in emErrors2)) && (err38.schemaPath.indexOf("https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer") === 0)) && (/^\/[^\/]*$/.test(err38.schemaPath.slice(107)))){
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
const err39 = {instancePath:instancePath+"/modelMapping/summarizer",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema27.properties.modelMapping.properties.summarizer.errorMessage[key7][keyProp2],schema:schema27.properties.modelMapping.properties.summarizer.errorMessage,parentSchema:schema27.properties.modelMapping.properties.summarizer,data:data9};
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
const err41 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema27.properties.modelMapping.properties.evaluator.required,parentSchema:schema27.properties.modelMapping.properties.evaluator,data:data13};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data13.id === undefined){
const err42 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.modelMapping.properties.evaluator.required,parentSchema:schema27.properties.modelMapping.properties.evaluator,data:data13};
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
const err43 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.modelMapping.properties.evaluator,data:data13};
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
const err44 = {instancePath:instancePath+"/modelMapping/evaluator/provider",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.evaluator.properties.provider.type,parentSchema:schema27.properties.modelMapping.properties.evaluator.properties.provider,data:data14};
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
const err46 = {instancePath:instancePath+"/modelMapping/evaluator/id",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.evaluator.properties.id.type,parentSchema:schema27.properties.modelMapping.properties.evaluator.properties.id,data:data15};
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
const err48 = {instancePath:instancePath+"/modelMapping/evaluator/name",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.evaluator.properties.name.type,parentSchema:schema27.properties.modelMapping.properties.evaluator.properties.name,data:data16};
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
const err50 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.modelMapping.properties.evaluator.type,parentSchema:schema27.properties.modelMapping.properties.evaluator,data:data13};
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
if((((((err51.keyword !== "errorMessage") && (!err51.emUsed)) && (err51.instancePath === instancePath+"/modelMapping/evaluator")) && (err51.keyword in emErrors3)) && (err51.schemaPath.indexOf("https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator") === 0)) && (/^\/[^\/]*$/.test(err51.schemaPath.slice(106)))){
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
const err52 = {instancePath:instancePath+"/modelMapping/evaluator",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema27.properties.modelMapping.properties.evaluator.errorMessage[key9][keyProp3],schema:schema27.properties.modelMapping.properties.evaluator.errorMessage,parentSchema:schema27.properties.modelMapping.properties.evaluator,data:data13};
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
const err54 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema27.properties.modelMapping.properties.moderator.required,parentSchema:schema27.properties.modelMapping.properties.moderator,data:data17};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(data17.id === undefined){
const err55 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.modelMapping.properties.moderator.required,parentSchema:schema27.properties.modelMapping.properties.moderator,data:data17};
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
const err56 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key10},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.modelMapping.properties.moderator,data:data17};
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
const err57 = {instancePath:instancePath+"/modelMapping/moderator/provider",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.moderator.properties.provider.type,parentSchema:schema27.properties.modelMapping.properties.moderator.properties.provider,data:data18};
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
const err59 = {instancePath:instancePath+"/modelMapping/moderator/id",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.moderator.properties.id.type,parentSchema:schema27.properties.modelMapping.properties.moderator.properties.id,data:data19};
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
const err61 = {instancePath:instancePath+"/modelMapping/moderator/name",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.modelMapping.properties.moderator.properties.name.type,parentSchema:schema27.properties.modelMapping.properties.moderator.properties.name,data:data20};
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
const err63 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.modelMapping.properties.moderator.type,parentSchema:schema27.properties.modelMapping.properties.moderator,data:data17};
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
if((((((err64.keyword !== "errorMessage") && (!err64.emUsed)) && (err64.instancePath === instancePath+"/modelMapping/moderator")) && (err64.keyword in emErrors4)) && (err64.schemaPath.indexOf("https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator") === 0)) && (/^\/[^\/]*$/.test(err64.schemaPath.slice(106)))){
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
const err65 = {instancePath:instancePath+"/modelMapping/moderator",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema27.properties.modelMapping.properties.moderator.errorMessage[key11][keyProp4],schema:schema27.properties.modelMapping.properties.moderator.errorMessage,parentSchema:schema27.properties.modelMapping.properties.moderator,data:data17};
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
const err67 = {instancePath:instancePath+"/modelMapping",schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.modelMapping.type,parentSchema:schema27.properties.modelMapping,data:data0};
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
}
else {
const err69 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-form-models#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(errors > 0){
const emErrs21 = [];
for(const err70 of vErrors){
if(!err70.emUsed){
emErrs21.push(err70);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
function expression0(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.defaultData)
}function expression1(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (({ placeholder: context.roleDefaults?.assistant, persistentPlaceholder: !!context.roleDefaults?.assistant }))
}function expression2(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=assistant`
}function expression3(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item.provider.name ? `${item.name} (${item.provider.name})` : item.name)
}function expression4(data,item,options,context,display,layout,readOnly,summary,validates
) {
return ((item.provider.id || item.provider) + ":" + item.id)
}function expression5(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (({ provider: item.provider.id, id: item.id, name: item.name }))
}function expression6(data,body,options,context,display,layout,readOnly,summary,validates
) {
return (data.results)
}function expression7(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (({ placeholder: context.roleDefaults?.tools, persistentPlaceholder: !!context.roleDefaults?.tools }))
}function expression8(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=tools`
}function expression9(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (({ placeholder: context.roleDefaults?.summarizer, persistentPlaceholder: !!context.roleDefaults?.summarizer }))
}function expression10(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=summarizer`
}function expression11(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (({ placeholder: context.roleDefaults?.evaluator, persistentPlaceholder: !!context.roleDefaults?.evaluator }))
}function expression12(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=evaluator`
}function expression13(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (({ placeholder: context.roleDefaults?.moderator, persistentPlaceholder: !!context.roleDefaults?.moderator }))
}function expression14(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=moderator`
}
const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/settings/org-form-models#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/settings/org-form-models#": {
      title: "main",
      root: "https://github.com/data-fair/agents/settings/org-form-models#",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/settings/org-form-models#": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#",
      pure: true,
      propertyKeys: ["modelMapping"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping": {
      title: "Model per role",
      key: "modelMapping",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping",
      pure: true,

      propertyKeys: [
        "assistant",
        "tools",
        "summarizer",
        "evaluator",
        "moderator"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant": {
      title: "Assistant",
      key: "assistant",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant",
      pure: true,
      propertyKeys: ["provider", "id", "name"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/provider",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/id",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/name"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/provider": {
      title: undefined,
      key: "provider",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/provider",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/provider",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/id": {
      title: undefined,
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/name": {
      title: undefined,
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools": {
      title: "Tools",
      key: "tools",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools",
      pure: true,
      propertyKeys: ["provider", "id", "name"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/provider",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/id",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/name"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/provider": {
      title: undefined,
      key: "provider",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/provider",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/provider",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/id": {
      title: undefined,
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/name": {
      title: undefined,
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer": {
      title: "Summarizer",
      key: "summarizer",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer",
      pure: true,
      propertyKeys: ["provider", "id", "name"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/provider",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/id",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/name"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/provider": {
      title: undefined,
      key: "provider",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/provider",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/provider",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/id": {
      title: undefined,
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/name": {
      title: undefined,
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator": {
      title: "Evaluator",
      key: "evaluator",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator",
      pure: true,
      propertyKeys: ["provider", "id", "name"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/provider",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/id",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/name"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/provider": {
      title: undefined,
      key: "provider",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/provider",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/provider",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/id": {
      title: undefined,
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/name": {
      title: undefined,
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator": {
      title: "Moderator",
      key: "moderator",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator",
      pure: true,
      propertyKeys: ["provider", "id", "name"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/provider",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/id",
        "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/name"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/provider": {
      title: undefined,
      key: "provider",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/provider",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/provider",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/id": {
      title: undefined,
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/name": {
      title: undefined,
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/settings/org-form-models#": {
      title: null,
      comp: "section",

      children: [{
        key: "modelMapping"
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

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping": {
      title: null,
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
      }]
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant": {
      comp: "autocomplete",

      cols: {
        xs: 12,
        md: 6
      },

      getProps: {
        type: "js-eval",
        expr: "({ placeholder: context.roleDefaults?.assistant, persistentPlaceholder: !!context.roleDefaults?.assistant })",
        pure: true,
        dataAlias: "value",
        ref: 1
      },

      getItems: {
        url: {
          type: "js-tpl",
          expr: "${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=assistant",
          pure: true,
          dataAlias: "value",
          ref: 2
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.results",
          pure: true,
          dataAlias: "body",
          ref: 6
        },

        itemTitle: {
          type: "js-eval",
          expr: "item.provider.name ? `${item.name} (${item.provider.name})` : item.name",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemKey: {
          type: "js-eval",
          expr: "(item.provider.id || item.provider) + \":\" + item.id",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        itemValue: {
          type: "js-eval",
          expr: "({ provider: item.provider.id, id: item.id, name: item.name })",
          pure: true,
          dataAlias: "item",
          ref: 5
        },

        returnObjects: true
      },

      label: "Assistant",
      help: "<p>The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.</p>"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/provider": {
      comp: "text-field",
      label: "provider"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/id": {
      comp: "text-field",
      label: "id"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/assistant/properties/name": {
      comp: "text-field",
      label: "name"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools": {
      comp: "autocomplete",

      cols: {
        xs: 12,
        md: 6
      },

      getProps: {
        type: "js-eval",
        expr: "({ placeholder: context.roleDefaults?.tools, persistentPlaceholder: !!context.roleDefaults?.tools })",
        pure: true,
        dataAlias: "value",
        ref: 7
      },

      getItems: {
        url: {
          type: "js-tpl",
          expr: "${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=tools",
          pure: true,
          dataAlias: "value",
          ref: 8
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.results",
          pure: true,
          dataAlias: "body",
          ref: 6
        },

        itemTitle: {
          type: "js-eval",
          expr: "item.provider.name ? `${item.name} (${item.provider.name})` : item.name",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemKey: {
          type: "js-eval",
          expr: "(item.provider.id || item.provider) + \":\" + item.id",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        itemValue: {
          type: "js-eval",
          expr: "({ provider: item.provider.id, id: item.id, name: item.name })",
          pure: true,
          dataAlias: "item",
          ref: 5
        },

        returnObjects: true
      },

      label: "Tools",
      help: "<p>The &quot;technician.&quot; Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.</p>"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/provider": {
      comp: "text-field",
      label: "provider"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/id": {
      comp: "text-field",
      label: "id"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/tools/properties/name": {
      comp: "text-field",
      label: "name"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer": {
      comp: "autocomplete",

      cols: {
        xs: 12,
        md: 6
      },

      getProps: {
        type: "js-eval",
        expr: "({ placeholder: context.roleDefaults?.summarizer, persistentPlaceholder: !!context.roleDefaults?.summarizer })",
        pure: true,
        dataAlias: "value",
        ref: 9
      },

      getItems: {
        url: {
          type: "js-tpl",
          expr: "${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=summarizer",
          pure: true,
          dataAlias: "value",
          ref: 10
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.results",
          pure: true,
          dataAlias: "body",
          ref: 6
        },

        itemTitle: {
          type: "js-eval",
          expr: "item.provider.name ? `${item.name} (${item.provider.name})` : item.name",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemKey: {
          type: "js-eval",
          expr: "(item.provider.id || item.provider) + \":\" + item.id",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        itemValue: {
          type: "js-eval",
          expr: "({ provider: item.provider.id, id: item.id, name: item.name })",
          pure: true,
          dataAlias: "item",
          ref: 5
        },

        returnObjects: true
      },

      label: "Summarizer",
      help: "<p>A &quot;shorthand&quot; specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.</p>"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/provider": {
      comp: "text-field",
      label: "provider"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/id": {
      comp: "text-field",
      label: "id"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/summarizer/properties/name": {
      comp: "text-field",
      label: "name"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator": {
      comp: "autocomplete",

      cols: {
        xs: 12,
        md: 6
      },

      getProps: {
        type: "js-eval",
        expr: "({ placeholder: context.roleDefaults?.evaluator, persistentPlaceholder: !!context.roleDefaults?.evaluator })",
        pure: true,
        dataAlias: "value",
        ref: 11
      },

      getItems: {
        url: {
          type: "js-tpl",
          expr: "${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=evaluator",
          pure: true,
          dataAlias: "value",
          ref: 12
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.results",
          pure: true,
          dataAlias: "body",
          ref: 6
        },

        itemTitle: {
          type: "js-eval",
          expr: "item.provider.name ? `${item.name} (${item.provider.name})` : item.name",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemKey: {
          type: "js-eval",
          expr: "(item.provider.id || item.provider) + \":\" + item.id",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        itemValue: {
          type: "js-eval",
          expr: "({ provider: item.provider.id, id: item.id, name: item.name })",
          pure: true,
          dataAlias: "item",
          ref: 5
        },

        returnObjects: true
      },

      label: "Evaluator",
      help: "<p>The &quot;quality controller.&quot; Analyzes the assistant&#39;s logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.</p>"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/provider": {
      comp: "text-field",
      label: "provider"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/id": {
      comp: "text-field",
      label: "id"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/evaluator/properties/name": {
      comp: "text-field",
      label: "name"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator": {
      comp: "autocomplete",

      cols: {
        xs: 12,
        md: 6
      },

      getProps: {
        type: "js-eval",
        expr: "({ placeholder: context.roleDefaults?.moderator, persistentPlaceholder: !!context.roleDefaults?.moderator })",
        pure: true,
        dataAlias: "value",
        ref: 13
      },

      getItems: {
        url: {
          type: "js-tpl",
          expr: "${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=moderator",
          pure: true,
          dataAlias: "value",
          ref: 14
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.results",
          pure: true,
          dataAlias: "body",
          ref: 6
        },

        itemTitle: {
          type: "js-eval",
          expr: "item.provider.name ? `${item.name} (${item.provider.name})` : item.name",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemKey: {
          type: "js-eval",
          expr: "(item.provider.id || item.provider) + \":\" + item.id",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        itemValue: {
          type: "js-eval",
          expr: "({ provider: item.provider.id, id: item.id, name: item.name })",
          pure: true,
          dataAlias: "item",
          ref: 5
        },

        returnObjects: true
      },

      label: "Moderator",
      help: "<p>The &quot;gatekeeper.&quot; Classifies each new user message for profanity, prompt-injection, persona override, and out-of-scope requests. Should be fast and cheap — it sits on the critical path to the first response token. Dedicated moderation classifiers (Llama Guard, moderation APIs) are not compatible: they use fixed taxonomies and output formats that cannot express this platform&#39;s custom policy.</p>"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/provider": {
      comp: "text-field",
      label: "provider"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/id": {
      comp: "text-field",
      label: "id"
    },

    "https://github.com/data-fair/agents/settings/org-form-models#/properties/modelMapping/properties/moderator/properties/name": {
      comp: "text-field",
      label: "name"
    }
  },

  validates: {
    "https://github.com/data-fair/agents/settings/org-form-models#": export0
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
    expression7,
    expression8,
    expression9,
    expression10,
    expression11,
    expression12,
    expression13,
    expression14
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
    }
  },

  localizeErrors: localizeErrors
}

const nodeComponents = {
  
  "section": sectionNode,
  
  "autocomplete": autocompleteNode,
  
  "text-field": textfieldNode,
    
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