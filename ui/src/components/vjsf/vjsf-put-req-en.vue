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

import listNode from '@koumoul/vjsf/components/nodes/list.vue'

import selectNode from '@koumoul/vjsf/components/nodes/select.vue'

import checkboxNode from '@koumoul/vjsf/components/nodes/checkbox.vue'


import localizeErrors from "ajv-i18n/localize/en/index.js";
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items"};
const schema28 = {"type":"object","title":"Provider","additionalProperties":false,"required":["type"],"properties":{"id":{"type":"string","title":"Provider ID","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/id","errorMessage":{}},"type":{"type":"string","title":"Provider Type","enum":["openai","anthropic","google","mistral","openrouter","ollama","custom"],"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/type","errorMessage":{}},"name":{"type":"string","title":"Display Name","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/enabled","errorMessage":{}},"openai":{"type":"object","title":"OpenAI Configuration","properties":{"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/apiKey","errorMessage":{}},"organization":{"type":"string","title":"Organization ID","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/organization","errorMessage":{}},"project":{"type":"string","title":"Project ID","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/project","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/defaultModel","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai","errorMessage":{}},"anthropic":{"type":"object","title":"Anthropic Configuration","properties":{"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/apiKey","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/defaultModel","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic","errorMessage":{}},"google":{"type":"object","title":"Google AI Configuration","properties":{"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/apiKey","errorMessage":{}},"project":{"type":"string","title":"Project ID","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/project","errorMessage":{}},"location":{"type":"string","title":"Location","default":"us-central1","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/location","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/defaultModel","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google","errorMessage":{}},"mistral":{"type":"object","title":"Mistral AI Configuration","properties":{"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/apiKey","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/defaultModel","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral","errorMessage":{}},"openrouter":{"type":"object","title":"OpenRouter Configuration","properties":{"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/apiKey","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/defaultModel","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter","errorMessage":{}},"ollama":{"type":"object","title":"Ollama Configuration","properties":{"baseURL":{"type":"string","title":"Base URL","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/baseURL","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/defaultModel","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama","errorMessage":{}},"custom":{"type":"object","title":"Custom Provider","properties":{"name":{"type":"string","title":"Provider Name","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/name","errorMessage":{}},"baseURL":{"type":"string","title":"Base URL","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/apiKey","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/defaultModel","errorMessage":{}}},"required":["name","baseURL"],"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom","errorMessage":{"required":{"name":"required information","baseURL":"required information"}}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items","errorMessage":{"required":{"type":"required information"}}};
const func1 = Object.prototype.hasOwnProperty;
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
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.required,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema28.properties, key0))){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 !== "string"){
const err2 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data0};
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
if(data.type !== undefined){
let data1 = data.type;
if(typeof data1 !== "string"){
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.type.type,parentSchema:schema28.properties.type,data:data1};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!(((((((data1 === "openai") || (data1 === "anthropic")) || (data1 === "google")) || (data1 === "mistral")) || (data1 === "openrouter")) || (data1 === "ollama")) || (data1 === "custom"))){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/type/enum",keyword:"enum",params:{allowedValues: schema28.properties.type.enum},message:"must be equal to one of the allowed values",schema:schema28.properties.type.enum,parentSchema:schema28.properties.type,data:data1};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err6 of vErrors){
if(!err6.emUsed){
emErrs1.push(err6);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.name !== undefined){
let data2 = data.name;
if(typeof data2 !== "string"){
const err7 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data2};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err8 of vErrors){
if(!err8.emUsed){
emErrs2.push(err8);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data.enabled !== undefined){
let data3 = data.enabled;
if(typeof data3 !== "boolean"){
const err9 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.enabled.type,parentSchema:schema28.properties.enabled,data:data3};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(errors > 0){
const emErrs3 = [];
for(const err10 of vErrors){
if(!err10.emUsed){
emErrs3.push(err10);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data.openai !== undefined){
let data4 = data.openai;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.apiKey !== undefined){
let data5 = data4.apiKey;
if(typeof data5 !== "string"){
const err11 = {instancePath:instancePath+"/openai/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.openai.properties.apiKey.type,parentSchema:schema28.properties.openai.properties.apiKey,data:data5};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err12 of vErrors){
if(!err12.emUsed){
emErrs4.push(err12);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
if(data4.organization !== undefined){
let data6 = data4.organization;
if(typeof data6 !== "string"){
const err13 = {instancePath:instancePath+"/openai/organization",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/organization/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.openai.properties.organization.type,parentSchema:schema28.properties.openai.properties.organization,data:data6};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err14 of vErrors){
if(!err14.emUsed){
emErrs5.push(err14);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
if(data4.project !== undefined){
let data7 = data4.project;
if(typeof data7 !== "string"){
const err15 = {instancePath:instancePath+"/openai/project",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/project/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.openai.properties.project.type,parentSchema:schema28.properties.openai.properties.project,data:data7};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(errors > 0){
const emErrs6 = [];
for(const err16 of vErrors){
if(!err16.emUsed){
emErrs6.push(err16);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
if(data4.defaultModel !== undefined){
let data8 = data4.defaultModel;
if(typeof data8 !== "string"){
const err17 = {instancePath:instancePath+"/openai/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.openai.properties.defaultModel.type,parentSchema:schema28.properties.openai.properties.defaultModel,data:data8};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err18 of vErrors){
if(!err18.emUsed){
emErrs7.push(err18);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
}
else {
const err19 = {instancePath:instancePath+"/openai",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.openai.type,parentSchema:schema28.properties.openai,data:data4};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err20 of vErrors){
if(!err20.emUsed){
emErrs8.push(err20);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
if(data.anthropic !== undefined){
let data9 = data.anthropic;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.apiKey !== undefined){
let data10 = data9.apiKey;
if(typeof data10 !== "string"){
const err21 = {instancePath:instancePath+"/anthropic/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.anthropic.properties.apiKey.type,parentSchema:schema28.properties.anthropic.properties.apiKey,data:data10};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err22 of vErrors){
if(!err22.emUsed){
emErrs9.push(err22);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
if(data9.defaultModel !== undefined){
let data11 = data9.defaultModel;
if(typeof data11 !== "string"){
const err23 = {instancePath:instancePath+"/anthropic/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.anthropic.properties.defaultModel.type,parentSchema:schema28.properties.anthropic.properties.defaultModel,data:data11};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err24 of vErrors){
if(!err24.emUsed){
emErrs10.push(err24);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
}
else {
const err25 = {instancePath:instancePath+"/anthropic",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.anthropic.type,parentSchema:schema28.properties.anthropic,data:data9};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(errors > 0){
const emErrs11 = [];
for(const err26 of vErrors){
if(!err26.emUsed){
emErrs11.push(err26);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
}
if(data.google !== undefined){
let data12 = data.google;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.apiKey !== undefined){
let data13 = data12.apiKey;
if(typeof data13 !== "string"){
const err27 = {instancePath:instancePath+"/google/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.google.properties.apiKey.type,parentSchema:schema28.properties.google.properties.apiKey,data:data13};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err28 of vErrors){
if(!err28.emUsed){
emErrs12.push(err28);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
if(data12.project !== undefined){
let data14 = data12.project;
if(typeof data14 !== "string"){
const err29 = {instancePath:instancePath+"/google/project",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/project/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.google.properties.project.type,parentSchema:schema28.properties.google.properties.project,data:data14};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err30 of vErrors){
if(!err30.emUsed){
emErrs13.push(err30);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
if(data12.location !== undefined){
let data15 = data12.location;
if(typeof data15 !== "string"){
const err31 = {instancePath:instancePath+"/google/location",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/location/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.google.properties.location.type,parentSchema:schema28.properties.google.properties.location,data:data15};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(errors > 0){
const emErrs14 = [];
for(const err32 of vErrors){
if(!err32.emUsed){
emErrs14.push(err32);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
if(data12.defaultModel !== undefined){
let data16 = data12.defaultModel;
if(typeof data16 !== "string"){
const err33 = {instancePath:instancePath+"/google/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.google.properties.defaultModel.type,parentSchema:schema28.properties.google.properties.defaultModel,data:data16};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(errors > 0){
const emErrs15 = [];
for(const err34 of vErrors){
if(!err34.emUsed){
emErrs15.push(err34);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
}
else {
const err35 = {instancePath:instancePath+"/google",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.google.type,parentSchema:schema28.properties.google,data:data12};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err36 of vErrors){
if(!err36.emUsed){
emErrs16.push(err36);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
if(data.mistral !== undefined){
let data17 = data.mistral;
if(data17 && typeof data17 == "object" && !Array.isArray(data17)){
if(data17.apiKey !== undefined){
let data18 = data17.apiKey;
if(typeof data18 !== "string"){
const err37 = {instancePath:instancePath+"/mistral/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.mistral.properties.apiKey.type,parentSchema:schema28.properties.mistral.properties.apiKey,data:data18};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(errors > 0){
const emErrs17 = [];
for(const err38 of vErrors){
if(!err38.emUsed){
emErrs17.push(err38);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
}
if(data17.defaultModel !== undefined){
let data19 = data17.defaultModel;
if(typeof data19 !== "string"){
const err39 = {instancePath:instancePath+"/mistral/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.mistral.properties.defaultModel.type,parentSchema:schema28.properties.mistral.properties.defaultModel,data:data19};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(errors > 0){
const emErrs18 = [];
for(const err40 of vErrors){
if(!err40.emUsed){
emErrs18.push(err40);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
}
}
else {
const err41 = {instancePath:instancePath+"/mistral",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.mistral.type,parentSchema:schema28.properties.mistral,data:data17};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(errors > 0){
const emErrs19 = [];
for(const err42 of vErrors){
if(!err42.emUsed){
emErrs19.push(err42);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
}
if(data.openrouter !== undefined){
let data20 = data.openrouter;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.apiKey !== undefined){
let data21 = data20.apiKey;
if(typeof data21 !== "string"){
const err43 = {instancePath:instancePath+"/openrouter/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.openrouter.properties.apiKey.type,parentSchema:schema28.properties.openrouter.properties.apiKey,data:data21};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err44 of vErrors){
if(!err44.emUsed){
emErrs20.push(err44);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
if(data20.defaultModel !== undefined){
let data22 = data20.defaultModel;
if(typeof data22 !== "string"){
const err45 = {instancePath:instancePath+"/openrouter/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.openrouter.properties.defaultModel.type,parentSchema:schema28.properties.openrouter.properties.defaultModel,data:data22};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(errors > 0){
const emErrs21 = [];
for(const err46 of vErrors){
if(!err46.emUsed){
emErrs21.push(err46);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
}
else {
const err47 = {instancePath:instancePath+"/openrouter",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.openrouter.type,parentSchema:schema28.properties.openrouter,data:data20};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(errors > 0){
const emErrs22 = [];
for(const err48 of vErrors){
if(!err48.emUsed){
emErrs22.push(err48);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
}
if(data.ollama !== undefined){
let data23 = data.ollama;
if(data23 && typeof data23 == "object" && !Array.isArray(data23)){
if(data23.baseURL !== undefined){
let data24 = data23.baseURL;
if(typeof data24 !== "string"){
const err49 = {instancePath:instancePath+"/ollama/baseURL",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.ollama.properties.baseURL.type,parentSchema:schema28.properties.ollama.properties.baseURL,data:data24};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(errors > 0){
const emErrs23 = [];
for(const err50 of vErrors){
if(!err50.emUsed){
emErrs23.push(err50);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
}
if(data23.defaultModel !== undefined){
let data25 = data23.defaultModel;
if(typeof data25 !== "string"){
const err51 = {instancePath:instancePath+"/ollama/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.ollama.properties.defaultModel.type,parentSchema:schema28.properties.ollama.properties.defaultModel,data:data25};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(errors > 0){
const emErrs24 = [];
for(const err52 of vErrors){
if(!err52.emUsed){
emErrs24.push(err52);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
}
else {
const err53 = {instancePath:instancePath+"/ollama",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.ollama.type,parentSchema:schema28.properties.ollama,data:data23};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err54 of vErrors){
if(!err54.emUsed){
emErrs25.push(err54);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
if(data.custom !== undefined){
let data26 = data.custom;
if(data26 && typeof data26 == "object" && !Array.isArray(data26)){
if(data26.name === undefined){
const err55 = {instancePath:instancePath+"/custom",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.custom.required,parentSchema:schema28.properties.custom,data:data26};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(data26.baseURL === undefined){
const err56 = {instancePath:instancePath+"/custom",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema28.properties.custom.required,parentSchema:schema28.properties.custom,data:data26};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data26.name !== undefined){
let data27 = data26.name;
if(typeof data27 !== "string"){
const err57 = {instancePath:instancePath+"/custom/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.custom.properties.name.type,parentSchema:schema28.properties.custom.properties.name,data:data27};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err58 of vErrors){
if(!err58.emUsed){
emErrs26.push(err58);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
if(data26.baseURL !== undefined){
let data28 = data26.baseURL;
if(typeof data28 !== "string"){
const err59 = {instancePath:instancePath+"/custom/baseURL",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.custom.properties.baseURL.type,parentSchema:schema28.properties.custom.properties.baseURL,data:data28};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(errors > 0){
const emErrs27 = [];
for(const err60 of vErrors){
if(!err60.emUsed){
emErrs27.push(err60);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
}
if(data26.apiKey !== undefined){
let data29 = data26.apiKey;
if(typeof data29 !== "string"){
const err61 = {instancePath:instancePath+"/custom/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.custom.properties.apiKey.type,parentSchema:schema28.properties.custom.properties.apiKey,data:data29};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(errors > 0){
const emErrs28 = [];
for(const err62 of vErrors){
if(!err62.emUsed){
emErrs28.push(err62);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
}
if(data26.defaultModel !== undefined){
let data30 = data26.defaultModel;
if(typeof data30 !== "string"){
const err63 = {instancePath:instancePath+"/custom/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.custom.properties.defaultModel.type,parentSchema:schema28.properties.custom.properties.defaultModel,data:data30};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(errors > 0){
const emErrs29 = [];
for(const err64 of vErrors){
if(!err64.emUsed){
emErrs29.push(err64);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
}
}
else {
const err65 = {instancePath:instancePath+"/custom",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.custom.type,parentSchema:schema28.properties.custom,data:data26};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"name":[],"baseURL":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err66 of vErrors){
if((((((err66.keyword !== "errorMessage") && (!err66.emUsed)) && (err66.instancePath === instancePath+"/custom")) && (err66.keyword in emErrors0)) && (err66.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom") === 0)) && (/^\/[^\/]*$/.test(err66.schemaPath.slice(98)))){
emPropParams0 = obj0[err66.keyword];
emParamsErrors0 = emErrors0[err66.keyword][err66.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err66);
err66.emUsed = true;
}
}
}
for(const key1 in emErrors0){
for(const keyProp0 in emErrors0[key1]){
emParamsErrors0 = emErrors0[key1][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key1] && templates0[key1][keyProp0];
const err67 = {instancePath:instancePath+"/custom",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema28.properties.custom.errorMessage[key1][keyProp0],schema:schema28.properties.custom.errorMessage,parentSchema:schema28.properties.custom,data:data26};
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
const emErrs30 = [];
for(const err68 of vErrors){
if(!err68.emUsed){
emErrs30.push(err68);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
}
}
else {
const err69 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"type":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err70 of vErrors){
if((((((err70.keyword !== "errorMessage") && (!err70.emUsed)) && (err70.instancePath === instancePath)) && (err70.keyword in emErrors1)) && (err70.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items") === 0)) && (/^\/[^\/]*$/.test(err70.schemaPath.slice(80)))){
emPropParams1 = obj0[err70.keyword];
emParamsErrors1 = emErrors1[err70.keyword][err70.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err70);
err70.emUsed = true;
}
}
}
for(const key2 in emErrors1){
for(const keyProp1 in emErrors1[key2]){
emParamsErrors1 = emErrors1[key2][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key2] && templates1[key2][keyProp1];
const err71 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema28.errorMessage[key2][keyProp1],schema:schema28.errorMessage,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
}
const emErrs31 = [];
for(const err72 of vErrors){
if(!err72.emUsed){
emErrs31.push(err72);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema29 = {"$id":"export1","$ref":"https://github.com/data-fair/agents/settings/put-req#"};
const schema27 = {"x-exports":["validate","types","vjsf"],"title":"Settings put","type":"object","additionalProperties":false,"required":["providers"],"properties":{"globalPrompt":{"type":"string","title":"Global Prompt","description":"This prompt will be injected into all AI agents for this account","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/globalPrompt","errorMessage":{}},"providers":{"type":"array","title":"AI Providers","items":{"type":"object","title":"Provider","additionalProperties":false,"required":["type"],"properties":{"id":{"type":"string","title":"Provider ID","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/id","errorMessage":{}},"type":{"type":"string","title":"Provider Type","enum":["openai","anthropic","google","mistral","openrouter","ollama","custom"],"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/type","errorMessage":{}},"name":{"type":"string","title":"Display Name","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/enabled","errorMessage":{}},"openai":{"type":"object","title":"OpenAI Configuration","properties":{"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/apiKey","errorMessage":{}},"organization":{"type":"string","title":"Organization ID","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/organization","errorMessage":{}},"project":{"type":"string","title":"Project ID","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/project","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/defaultModel","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai","errorMessage":{}},"anthropic":{"type":"object","title":"Anthropic Configuration","properties":{"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/apiKey","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/defaultModel","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic","errorMessage":{}},"google":{"type":"object","title":"Google AI Configuration","properties":{"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/apiKey","errorMessage":{}},"project":{"type":"string","title":"Project ID","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/project","errorMessage":{}},"location":{"type":"string","title":"Location","default":"us-central1","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/location","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/defaultModel","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google","errorMessage":{}},"mistral":{"type":"object","title":"Mistral AI Configuration","properties":{"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/apiKey","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/defaultModel","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral","errorMessage":{}},"openrouter":{"type":"object","title":"OpenRouter Configuration","properties":{"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/apiKey","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/defaultModel","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter","errorMessage":{}},"ollama":{"type":"object","title":"Ollama Configuration","properties":{"baseURL":{"type":"string","title":"Base URL","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/baseURL","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/defaultModel","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama","errorMessage":{}},"custom":{"type":"object","title":"Custom Provider","properties":{"name":{"type":"string","title":"Provider Name","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/name","errorMessage":{}},"baseURL":{"type":"string","title":"Base URL","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/apiKey","errorMessage":{}},"defaultModel":{"type":"string","title":"Default Model","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/defaultModel","errorMessage":{}}},"required":["name","baseURL"],"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom","errorMessage":{"required":{"name":"required information","baseURL":"required information"}}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items","errorMessage":{"required":{"type":"required information"}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers","errorMessage":{}}},"$id":"https://github.com/data-fair/agents/settings/put-req","x-vjsf":{"xI18n":true},"x-vjsf-locales":["en","fr"],"__pointer":"https://github.com/data-fair/agents/settings/put-req#","errorMessage":{"required":{"providers":"required information"}}};

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
if(data.providers === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/required",keyword:"required",params:{missingProperty: "providers"},message:"must have required property '"+"providers"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "globalPrompt") || (key0 === "providers"))){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.globalPrompt !== undefined){
let data0 = data.globalPrompt;
if(typeof data0 !== "string"){
const err2 = {instancePath:instancePath+"/globalPrompt",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/globalPrompt/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.globalPrompt.type,parentSchema:schema27.properties.globalPrompt,data:data0};
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
if(data.providers !== undefined){
let data1 = data.providers;
if(Array.isArray(data1)){
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.type === undefined){
const err4 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.required,parentSchema:schema27.properties.providers.items,data:data2};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key1 in data2){
if(!(func1.call(schema27.properties.providers.items.properties, key1))){
const err5 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.providers.items,data:data2};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data2.id !== undefined){
let data3 = data2.id;
if(typeof data3 !== "string"){
const err6 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.id.type,parentSchema:schema27.properties.providers.items.properties.id,data:data3};
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
if(data2.type !== undefined){
let data4 = data2.type;
if(typeof data4 !== "string"){
const err8 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.type.type,parentSchema:schema27.properties.providers.items.properties.type,data:data4};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!(((((((data4 === "openai") || (data4 === "anthropic")) || (data4 === "google")) || (data4 === "mistral")) || (data4 === "openrouter")) || (data4 === "ollama")) || (data4 === "custom"))){
const err9 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/type/enum",keyword:"enum",params:{allowedValues: schema27.properties.providers.items.properties.type.enum},message:"must be equal to one of the allowed values",schema:schema27.properties.providers.items.properties.type.enum,parentSchema:schema27.properties.providers.items.properties.type,data:data4};
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
if(data2.name !== undefined){
let data5 = data2.name;
if(typeof data5 !== "string"){
const err11 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.name.type,parentSchema:schema27.properties.providers.items.properties.name,data:data5};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(errors > 0){
const emErrs3 = [];
for(const err12 of vErrors){
if(!err12.emUsed){
emErrs3.push(err12);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data2.enabled !== undefined){
let data6 = data2.enabled;
if(typeof data6 !== "boolean"){
const err13 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.properties.enabled.type,parentSchema:schema27.properties.providers.items.properties.enabled,data:data6};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err14 of vErrors){
if(!err14.emUsed){
emErrs4.push(err14);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
if(data2.openai !== undefined){
let data7 = data2.openai;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.apiKey !== undefined){
let data8 = data7.apiKey;
if(typeof data8 !== "string"){
const err15 = {instancePath:instancePath+"/providers/" + i0+"/openai/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.openai.properties.apiKey.type,parentSchema:schema27.properties.providers.items.properties.openai.properties.apiKey,data:data8};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err16 of vErrors){
if(!err16.emUsed){
emErrs5.push(err16);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
if(data7.organization !== undefined){
let data9 = data7.organization;
if(typeof data9 !== "string"){
const err17 = {instancePath:instancePath+"/providers/" + i0+"/openai/organization",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/organization/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.openai.properties.organization.type,parentSchema:schema27.properties.providers.items.properties.openai.properties.organization,data:data9};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(errors > 0){
const emErrs6 = [];
for(const err18 of vErrors){
if(!err18.emUsed){
emErrs6.push(err18);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
if(data7.project !== undefined){
let data10 = data7.project;
if(typeof data10 !== "string"){
const err19 = {instancePath:instancePath+"/providers/" + i0+"/openai/project",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/project/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.openai.properties.project.type,parentSchema:schema27.properties.providers.items.properties.openai.properties.project,data:data10};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err20 of vErrors){
if(!err20.emUsed){
emErrs7.push(err20);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data7.defaultModel !== undefined){
let data11 = data7.defaultModel;
if(typeof data11 !== "string"){
const err21 = {instancePath:instancePath+"/providers/" + i0+"/openai/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.openai.properties.defaultModel.type,parentSchema:schema27.properties.providers.items.properties.openai.properties.defaultModel,data:data11};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err22 of vErrors){
if(!err22.emUsed){
emErrs8.push(err22);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
}
else {
const err23 = {instancePath:instancePath+"/providers/" + i0+"/openai",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.properties.openai.type,parentSchema:schema27.properties.providers.items.properties.openai,data:data7};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err24 of vErrors){
if(!err24.emUsed){
emErrs9.push(err24);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
if(data2.anthropic !== undefined){
let data12 = data2.anthropic;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.apiKey !== undefined){
let data13 = data12.apiKey;
if(typeof data13 !== "string"){
const err25 = {instancePath:instancePath+"/providers/" + i0+"/anthropic/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.anthropic.properties.apiKey.type,parentSchema:schema27.properties.providers.items.properties.anthropic.properties.apiKey,data:data13};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err26 of vErrors){
if(!err26.emUsed){
emErrs10.push(err26);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
if(data12.defaultModel !== undefined){
let data14 = data12.defaultModel;
if(typeof data14 !== "string"){
const err27 = {instancePath:instancePath+"/providers/" + i0+"/anthropic/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.anthropic.properties.defaultModel.type,parentSchema:schema27.properties.providers.items.properties.anthropic.properties.defaultModel,data:data14};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(errors > 0){
const emErrs11 = [];
for(const err28 of vErrors){
if(!err28.emUsed){
emErrs11.push(err28);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
}
}
else {
const err29 = {instancePath:instancePath+"/providers/" + i0+"/anthropic",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.properties.anthropic.type,parentSchema:schema27.properties.providers.items.properties.anthropic,data:data12};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err30 of vErrors){
if(!err30.emUsed){
emErrs12.push(err30);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
if(data2.google !== undefined){
let data15 = data2.google;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.apiKey !== undefined){
let data16 = data15.apiKey;
if(typeof data16 !== "string"){
const err31 = {instancePath:instancePath+"/providers/" + i0+"/google/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.google.properties.apiKey.type,parentSchema:schema27.properties.providers.items.properties.google.properties.apiKey,data:data16};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err32 of vErrors){
if(!err32.emUsed){
emErrs13.push(err32);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
if(data15.project !== undefined){
let data17 = data15.project;
if(typeof data17 !== "string"){
const err33 = {instancePath:instancePath+"/providers/" + i0+"/google/project",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/project/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.google.properties.project.type,parentSchema:schema27.properties.providers.items.properties.google.properties.project,data:data17};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(errors > 0){
const emErrs14 = [];
for(const err34 of vErrors){
if(!err34.emUsed){
emErrs14.push(err34);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
if(data15.location !== undefined){
let data18 = data15.location;
if(typeof data18 !== "string"){
const err35 = {instancePath:instancePath+"/providers/" + i0+"/google/location",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/location/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.google.properties.location.type,parentSchema:schema27.properties.providers.items.properties.google.properties.location,data:data18};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(errors > 0){
const emErrs15 = [];
for(const err36 of vErrors){
if(!err36.emUsed){
emErrs15.push(err36);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
if(data15.defaultModel !== undefined){
let data19 = data15.defaultModel;
if(typeof data19 !== "string"){
const err37 = {instancePath:instancePath+"/providers/" + i0+"/google/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.google.properties.defaultModel.type,parentSchema:schema27.properties.providers.items.properties.google.properties.defaultModel,data:data19};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err38 of vErrors){
if(!err38.emUsed){
emErrs16.push(err38);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
}
else {
const err39 = {instancePath:instancePath+"/providers/" + i0+"/google",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.properties.google.type,parentSchema:schema27.properties.providers.items.properties.google,data:data15};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(errors > 0){
const emErrs17 = [];
for(const err40 of vErrors){
if(!err40.emUsed){
emErrs17.push(err40);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
}
if(data2.mistral !== undefined){
let data20 = data2.mistral;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.apiKey !== undefined){
let data21 = data20.apiKey;
if(typeof data21 !== "string"){
const err41 = {instancePath:instancePath+"/providers/" + i0+"/mistral/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.mistral.properties.apiKey.type,parentSchema:schema27.properties.providers.items.properties.mistral.properties.apiKey,data:data21};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(errors > 0){
const emErrs18 = [];
for(const err42 of vErrors){
if(!err42.emUsed){
emErrs18.push(err42);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
}
if(data20.defaultModel !== undefined){
let data22 = data20.defaultModel;
if(typeof data22 !== "string"){
const err43 = {instancePath:instancePath+"/providers/" + i0+"/mistral/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.mistral.properties.defaultModel.type,parentSchema:schema27.properties.providers.items.properties.mistral.properties.defaultModel,data:data22};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(errors > 0){
const emErrs19 = [];
for(const err44 of vErrors){
if(!err44.emUsed){
emErrs19.push(err44);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
}
}
else {
const err45 = {instancePath:instancePath+"/providers/" + i0+"/mistral",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.properties.mistral.type,parentSchema:schema27.properties.providers.items.properties.mistral,data:data20};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err46 of vErrors){
if(!err46.emUsed){
emErrs20.push(err46);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
if(data2.openrouter !== undefined){
let data23 = data2.openrouter;
if(data23 && typeof data23 == "object" && !Array.isArray(data23)){
if(data23.apiKey !== undefined){
let data24 = data23.apiKey;
if(typeof data24 !== "string"){
const err47 = {instancePath:instancePath+"/providers/" + i0+"/openrouter/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.openrouter.properties.apiKey.type,parentSchema:schema27.properties.providers.items.properties.openrouter.properties.apiKey,data:data24};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(errors > 0){
const emErrs21 = [];
for(const err48 of vErrors){
if(!err48.emUsed){
emErrs21.push(err48);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
if(data23.defaultModel !== undefined){
let data25 = data23.defaultModel;
if(typeof data25 !== "string"){
const err49 = {instancePath:instancePath+"/providers/" + i0+"/openrouter/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.openrouter.properties.defaultModel.type,parentSchema:schema27.properties.providers.items.properties.openrouter.properties.defaultModel,data:data25};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(errors > 0){
const emErrs22 = [];
for(const err50 of vErrors){
if(!err50.emUsed){
emErrs22.push(err50);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
}
}
else {
const err51 = {instancePath:instancePath+"/providers/" + i0+"/openrouter",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.properties.openrouter.type,parentSchema:schema27.properties.providers.items.properties.openrouter,data:data23};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(errors > 0){
const emErrs23 = [];
for(const err52 of vErrors){
if(!err52.emUsed){
emErrs23.push(err52);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
}
if(data2.ollama !== undefined){
let data26 = data2.ollama;
if(data26 && typeof data26 == "object" && !Array.isArray(data26)){
if(data26.baseURL !== undefined){
let data27 = data26.baseURL;
if(typeof data27 !== "string"){
const err53 = {instancePath:instancePath+"/providers/" + i0+"/ollama/baseURL",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.ollama.properties.baseURL.type,parentSchema:schema27.properties.providers.items.properties.ollama.properties.baseURL,data:data27};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(errors > 0){
const emErrs24 = [];
for(const err54 of vErrors){
if(!err54.emUsed){
emErrs24.push(err54);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
if(data26.defaultModel !== undefined){
let data28 = data26.defaultModel;
if(typeof data28 !== "string"){
const err55 = {instancePath:instancePath+"/providers/" + i0+"/ollama/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.ollama.properties.defaultModel.type,parentSchema:schema27.properties.providers.items.properties.ollama.properties.defaultModel,data:data28};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err56 of vErrors){
if(!err56.emUsed){
emErrs25.push(err56);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
}
else {
const err57 = {instancePath:instancePath+"/providers/" + i0+"/ollama",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.properties.ollama.type,parentSchema:schema27.properties.providers.items.properties.ollama,data:data26};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err58 of vErrors){
if(!err58.emUsed){
emErrs26.push(err58);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
if(data2.custom !== undefined){
let data29 = data2.custom;
if(data29 && typeof data29 == "object" && !Array.isArray(data29)){
if(data29.name === undefined){
const err59 = {instancePath:instancePath+"/providers/" + i0+"/custom",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.properties.custom.required,parentSchema:schema27.properties.providers.items.properties.custom,data:data29};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data29.baseURL === undefined){
const err60 = {instancePath:instancePath+"/providers/" + i0+"/custom",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema27.properties.providers.items.properties.custom.required,parentSchema:schema27.properties.providers.items.properties.custom,data:data29};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data29.name !== undefined){
let data30 = data29.name;
if(typeof data30 !== "string"){
const err61 = {instancePath:instancePath+"/providers/" + i0+"/custom/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.custom.properties.name.type,parentSchema:schema27.properties.providers.items.properties.custom.properties.name,data:data30};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(errors > 0){
const emErrs27 = [];
for(const err62 of vErrors){
if(!err62.emUsed){
emErrs27.push(err62);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
}
if(data29.baseURL !== undefined){
let data31 = data29.baseURL;
if(typeof data31 !== "string"){
const err63 = {instancePath:instancePath+"/providers/" + i0+"/custom/baseURL",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.custom.properties.baseURL.type,parentSchema:schema27.properties.providers.items.properties.custom.properties.baseURL,data:data31};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(errors > 0){
const emErrs28 = [];
for(const err64 of vErrors){
if(!err64.emUsed){
emErrs28.push(err64);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
}
if(data29.apiKey !== undefined){
let data32 = data29.apiKey;
if(typeof data32 !== "string"){
const err65 = {instancePath:instancePath+"/providers/" + i0+"/custom/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.custom.properties.apiKey.type,parentSchema:schema27.properties.providers.items.properties.custom.properties.apiKey,data:data32};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(errors > 0){
const emErrs29 = [];
for(const err66 of vErrors){
if(!err66.emUsed){
emErrs29.push(err66);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
}
if(data29.defaultModel !== undefined){
let data33 = data29.defaultModel;
if(typeof data33 !== "string"){
const err67 = {instancePath:instancePath+"/providers/" + i0+"/custom/defaultModel",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.properties.custom.properties.defaultModel.type,parentSchema:schema27.properties.providers.items.properties.custom.properties.defaultModel,data:data33};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(errors > 0){
const emErrs30 = [];
for(const err68 of vErrors){
if(!err68.emUsed){
emErrs30.push(err68);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
}
}
else {
const err69 = {instancePath:instancePath+"/providers/" + i0+"/custom",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.properties.custom.type,parentSchema:schema27.properties.providers.items.properties.custom,data:data29};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"name":[],"baseURL":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err70 of vErrors){
if((((((err70.keyword !== "errorMessage") && (!err70.emUsed)) && (err70.instancePath === instancePath+"/providers/" + i0+"/custom")) && (err70.keyword in emErrors0)) && (err70.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom") === 0)) && (/^\/[^\/]*$/.test(err70.schemaPath.slice(98)))){
emPropParams0 = obj0[err70.keyword];
emParamsErrors0 = emErrors0[err70.keyword][err70.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err70);
err70.emUsed = true;
}
}
}
for(const key2 in emErrors0){
for(const keyProp0 in emErrors0[key2]){
emParamsErrors0 = emErrors0[key2][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key2] && templates0[key2][keyProp0];
const err71 = {instancePath:instancePath+"/providers/" + i0+"/custom",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.providers.items.properties.custom.errorMessage[key2][keyProp0],schema:schema27.properties.providers.items.properties.custom.errorMessage,parentSchema:schema27.properties.providers.items.properties.custom,data:data29};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
}
const emErrs31 = [];
for(const err72 of vErrors){
if(!err72.emUsed){
emErrs31.push(err72);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
}
}
else {
const err73 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.type,parentSchema:schema27.properties.providers.items,data:data2};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"type":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err74 of vErrors){
if((((((err74.keyword !== "errorMessage") && (!err74.emUsed)) && (err74.instancePath === instancePath+"/providers/" + i0)) && (err74.keyword in emErrors1)) && (err74.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items") === 0)) && (/^\/[^\/]*$/.test(err74.schemaPath.slice(80)))){
emPropParams1 = obj0[err74.keyword];
emParamsErrors1 = emErrors1[err74.keyword][err74.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err74);
err74.emUsed = true;
}
}
}
for(const key3 in emErrors1){
for(const keyProp1 in emErrors1[key3]){
emParamsErrors1 = emErrors1[key3][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key3] && templates1[key3][keyProp1];
const err75 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.properties.providers.items.errorMessage[key3][keyProp1],schema:schema27.properties.providers.items.errorMessage,parentSchema:schema27.properties.providers.items,data:data2};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
}
const emErrs32 = [];
for(const err76 of vErrors){
if(!err76.emUsed){
emErrs32.push(err76);
}
}
vErrors = emErrs32;
errors = emErrs32.length;
}
}
}
else {
const err77 = {instancePath:instancePath+"/providers",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.providers.type,parentSchema:schema27.properties.providers,data:data1};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(errors > 0){
const emErrs33 = [];
for(const err78 of vErrors){
if(!err78.emUsed){
emErrs33.push(err78);
}
}
vErrors = emErrs33;
errors = emErrs33.length;
}
}
}
else {
const err79 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"providers":[]}};
const templates2 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err80 of vErrors){
if((((((err80.keyword !== "errorMessage") && (!err80.emUsed)) && (err80.instancePath === instancePath)) && (err80.keyword in emErrors2)) && (err80.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#") === 0)) && (/^\/[^\/]*$/.test(err80.schemaPath.slice(53)))){
emPropParams2 = obj0[err80.keyword];
emParamsErrors2 = emErrors2[err80.keyword][err80.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err80);
err80.emUsed = true;
}
}
}
for(const key4 in emErrors2){
for(const keyProp2 in emErrors2[key4]){
emParamsErrors2 = emErrors2[key4][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates2[key4] && templates2[key4][keyProp2];
const err81 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema27.errorMessage[key4][keyProp2],schema:schema27.errorMessage,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
}
const emErrs34 = [];
for(const err82 of vErrors){
if(!err82.emUsed){
emErrs34.push(err82);
}
}
vErrors = emErrs34;
errors = emErrs34.length;
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
return ([{"key":"openai","title":"openai","value":"openai"},{"key":"anthropic","title":"anthropic","value":"anthropic"},{"key":"google","title":"google","value":"google"},{"key":"mistral","title":"mistral","value":"mistral"},{"key":"openrouter","title":"openrouter","value":"openrouter"},{"key":"ollama","title":"ollama","value":"ollama"},{"key":"custom","title":"custom","value":"custom"}])
}

const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/settings/put-req#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/settings/put-req#": {
      title: "Settings put",
      root: "https://github.com/data-fair/agents/settings/put-req#",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items": {
      title: "Provider",
      root: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/settings/put-req#": {
      title: "Settings put",
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#",
      pure: true,
      propertyKeys: ["globalPrompt", "providers"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/globalPrompt", "https://github.com/data-fair/agents/settings/put-req#/properties/providers"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/globalPrompt": {
      title: "Global Prompt",
      key: "globalPrompt",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/globalPrompt",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/globalPrompt",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers": {
      title: "AI Providers",
      key: "providers",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      childrenTrees: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items": {
      title: "Provider",
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items",
      pure: true,
      propertyKeys: ["id", "type", "name", "enabled", "openai", "anthropic", "google", "mistral", "openrouter", "ollama", "custom"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/id", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/type", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/name", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/enabled", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/id": {
      title: "Provider ID",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/name": {
      title: "Display Name",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/enabled": {
      title: "Enabled",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai": {
      title: "OpenAI Configuration",
      key: "openai",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai",
      pure: true,
      propertyKeys: ["apiKey", "organization", "project", "defaultModel"],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/apiKey", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/organization", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/project", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/defaultModel"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/apiKey": {
      title: "API Key",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/organization": {
      title: "Organization ID",
      key: "organization",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/organization",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/organization",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/project": {
      title: "Project ID",
      key: "project",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/project",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/project",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/defaultModel": {
      title: "Default Model",
      key: "defaultModel",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/defaultModel",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/defaultModel",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic": {
      title: "Anthropic Configuration",
      key: "anthropic",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic",
      pure: true,
      propertyKeys: ["apiKey", "defaultModel"],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/apiKey", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/defaultModel"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/apiKey": {
      title: "API Key",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/defaultModel": {
      title: "Default Model",
      key: "defaultModel",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/defaultModel",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/defaultModel",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google": {
      title: "Google AI Configuration",
      key: "google",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google",
      pure: true,
      propertyKeys: ["apiKey", "project", "location", "defaultModel"],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/apiKey", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/project", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/location", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/defaultModel"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/apiKey": {
      title: "API Key",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/project": {
      title: "Project ID",
      key: "project",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/project",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/project",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/location": {
      title: "Location",
      key: "location",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/location",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/location",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/defaultModel": {
      title: "Default Model",
      key: "defaultModel",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/defaultModel",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/defaultModel",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral": {
      title: "Mistral AI Configuration",
      key: "mistral",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral",
      pure: true,
      propertyKeys: ["apiKey", "defaultModel"],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/apiKey", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/defaultModel"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/apiKey": {
      title: "API Key",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/defaultModel": {
      title: "Default Model",
      key: "defaultModel",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/defaultModel",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/defaultModel",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter": {
      title: "OpenRouter Configuration",
      key: "openrouter",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter",
      pure: true,
      propertyKeys: ["apiKey", "defaultModel"],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/apiKey", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/defaultModel"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/apiKey": {
      title: "API Key",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/defaultModel": {
      title: "Default Model",
      key: "defaultModel",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/defaultModel",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/defaultModel",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama": {
      title: "Ollama Configuration",
      key: "ollama",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama",
      pure: true,
      propertyKeys: ["baseURL", "defaultModel"],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/baseURL", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/defaultModel"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/baseURL": {
      title: "Base URL",
      key: "baseURL",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/baseURL",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/baseURL",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/defaultModel": {
      title: "Default Model",
      key: "defaultModel",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/defaultModel",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/defaultModel",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom": {
      title: "Custom Provider",
      key: "custom",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom",
      pure: true,
      propertyKeys: ["name", "baseURL", "apiKey", "defaultModel"],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/name", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/baseURL", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/apiKey", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/defaultModel"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/name": {
      title: "Provider Name",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/baseURL": {
      title: "Base URL",
      key: "baseURL",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/baseURL",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/baseURL",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/apiKey": {
      title: "API Key",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/defaultModel": {
      title: "Default Model",
      key: "defaultModel",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/defaultModel",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/defaultModel",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/settings/put-req#": {
      comp: "section",

      children: [{
        key: "globalPrompt"
      }, {
        key: "providers"
      }],

      title: "Settings put",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/globalPrompt": {
      comp: "text-field",
      label: "Global Prompt",
      help: "<p>This prompt will be injected into all AI agents for this account</p>"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers": {
      comp: "list",
      title: "AI Providers",
      listEditMode: "inline-single",
      listActions: ["add", "edit", "delete", "sort", "duplicate"],
      defaultData: [],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items": {
      comp: "section",

      children: [{
        key: "id"
      }, {
        key: "type"
      }, {
        key: "name"
      }, {
        key: "enabled"
      }, {
        key: "openai"
      }, {
        key: "anthropic"
      }, {
        key: "google"
      }, {
        key: "mistral"
      }, {
        key: "openrouter"
      }, {
        key: "ollama"
      }, {
        key: "custom"
      }],

      title: "Provider",
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

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/id": {
      comp: "text-field",
      label: "Provider ID"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/type": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"key\":\"openai\",\"title\":\"openai\",\"value\":\"openai\"},{\"key\":\"anthropic\",\"title\":\"anthropic\",\"value\":\"anthropic\"},{\"key\":\"google\",\"title\":\"google\",\"value\":\"google\"},{\"key\":\"mistral\",\"title\":\"mistral\",\"value\":\"mistral\"},{\"key\":\"openrouter\",\"title\":\"openrouter\",\"value\":\"openrouter\"},{\"key\":\"ollama\",\"title\":\"ollama\",\"value\":\"ollama\"},{\"key\":\"custom\",\"title\":\"custom\",\"value\":\"custom\"}]",
        immutable: true,
        ref: 1
      },

      label: "Provider Type"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/name": {
      comp: "text-field",
      label: "Display Name"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/enabled": {
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
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai": {
      comp: "section",

      children: [{
        key: "apiKey"
      }, {
        key: "organization"
      }, {
        key: "project"
      }, {
        key: "defaultModel"
      }],

      title: "OpenAI Configuration"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/organization": {
      comp: "text-field",
      label: "Organization ID"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/project": {
      comp: "text-field",
      label: "Project ID"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openai/properties/defaultModel": {
      comp: "text-field",
      label: "Default Model"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic": {
      comp: "section",

      children: [{
        key: "apiKey"
      }, {
        key: "defaultModel"
      }],

      title: "Anthropic Configuration"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/anthropic/properties/defaultModel": {
      comp: "text-field",
      label: "Default Model"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google": {
      comp: "section",

      children: [{
        key: "apiKey"
      }, {
        key: "project"
      }, {
        key: "location"
      }, {
        key: "defaultModel"
      }],

      title: "Google AI Configuration"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/project": {
      comp: "text-field",
      label: "Project ID"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/location": {
      comp: "text-field",
      label: "Location",
      defaultData: "us-central1",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/google/properties/defaultModel": {
      comp: "text-field",
      label: "Default Model"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral": {
      comp: "section",

      children: [{
        key: "apiKey"
      }, {
        key: "defaultModel"
      }],

      title: "Mistral AI Configuration"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/mistral/properties/defaultModel": {
      comp: "text-field",
      label: "Default Model"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter": {
      comp: "section",

      children: [{
        key: "apiKey"
      }, {
        key: "defaultModel"
      }],

      title: "OpenRouter Configuration"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/openrouter/properties/defaultModel": {
      comp: "text-field",
      label: "Default Model"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama": {
      comp: "section",

      children: [{
        key: "baseURL"
      }, {
        key: "defaultModel"
      }],

      title: "Ollama Configuration"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/baseURL": {
      comp: "text-field",
      label: "Base URL",
      defaultData: "http://localhost:11434",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/ollama/properties/defaultModel": {
      comp: "text-field",
      label: "Default Model"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom": {
      comp: "section",

      children: [{
        key: "name"
      }, {
        key: "baseURL"
      }, {
        key: "apiKey"
      }, {
        key: "defaultModel"
      }],

      title: "Custom Provider"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/name": {
      comp: "text-field",
      label: "Provider Name"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/baseURL": {
      comp: "text-field",
      label: "Base URL"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/properties/custom/properties/defaultModel": {
      comp: "text-field",
      label: "Default Model"
    }
  },

  validates: {
    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items": validate22,
    "https://github.com/data-fair/agents/settings/put-req#": validate24
  },

  validationErrors: {},
  expressions: [expression0, expression1],
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
    mdeLink1: "[Link title",
    mdeLink2: "](link url)",
    mdeImg1: "![](",
    mdeImg2: "image url)",
    mdeTable1: "",
    mdeTable2: "\n\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text     | Text     |\n\n",
    bold: "Bold",
    italic: "Italic",
    heading: "Title",
    quote: "Quote",
    unorderedList: "Unordered list",
    orderedList: "Ordered list",
    createLink: "Create a link",
    insertImage: "Insert an image",
    createTable: "Create a table",
    preview: "Aperçu du rendu",
    mdeGuide: "Documentation de la syntaxe",
    undo: "Undo",
    redo: "Redo",
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
  
  "text-field": textfieldNode,
  
  "list": listNode,
  
  "select": selectNode,
  
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