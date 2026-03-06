<script setup>
// @ts-nocheck

import { StatefulLayout } from '@json-layout/core/state'
import { ref, shallowRef, getCurrentInstance, useSlots, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

import Tree from '@koumoul/vjsf/components/tree.vue'
import { useVjsf, emits } from '@koumoul/vjsf/composables/use-vjsf.js'
import '@koumoul/vjsf/styles/vjsf.css'


import sectionNode from '@koumoul/vjsf/components/nodes/section.vue'

import datetimepickerNode from '@koumoul/vjsf/components/nodes/date-time-picker.vue'

import selectNode from '@koumoul/vjsf/components/nodes/select.vue'

import textfieldNode from '@koumoul/vjsf/components/nodes/text-field.vue'

import listNode from '@koumoul/vjsf/components/nodes/list.vue'

import oneofselectNode from '@koumoul/vjsf/components/nodes/one-of-select.vue'

import checkboxNode from '@koumoul/vjsf/components/nodes/checkbox.vue'


import localizeErrors from "ajv-i18n/localize/en/index.js";
import { fullFormats } from "ajv-formats/dist/formats.js";

const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0"};
const schema28 = {"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}};
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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.required,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema28.required,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.type !== undefined){
let data0 = data.type;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.type.type,parentSchema:schema28.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openai" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema28.properties.type,data:data0};
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
if(data.id !== undefined){
let data1 = data.id;
if(typeof data1 !== "string"){
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data1};
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
if(data.name !== undefined){
let data2 = data.name;
if(typeof data2 !== "string"){
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data2};
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
if(data.enabled !== undefined){
let data3 = data.enabled;
if(typeof data3 !== "boolean"){
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.enabled.type,parentSchema:schema28.properties.enabled,data:data3};
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
if(data.apiKey !== undefined){
let data4 = data.apiKey;
if(typeof data4 !== "string"){
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.apiKey.type,parentSchema:schema28.properties.apiKey,data:data4};
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
}
else {
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err16 of vErrors){
if((((((err16.keyword !== "errorMessage") && (!err16.emUsed)) && (err16.instancePath === instancePath)) && (err16.keyword in emErrors0)) && (err16.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err16.schemaPath.slice(84)))){
emPropParams0 = obj0[err16.keyword];
emParamsErrors0 = emErrors0[err16.keyword][err16.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err16);
err16.emUsed = true;
}
}
}
for(const key0 in emErrors0){
for(const keyProp0 in emErrors0[key0]){
emParamsErrors0 = emErrors0[key0][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key0] && templates0[key0][keyProp0];
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema28.errorMessage[key0][keyProp0],schema:schema28.errorMessage,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
}
const emErrs5 = [];
for(const err18 of vErrors){
if(!err18.emUsed){
emErrs5.push(err18);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"apiKey":true},"dynamicProps":false,"dynamicItems":false};

const schema29 = {"$id":"export1","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items"};
const schema30 = {"type":"object","title":"Provider","unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items","errorMessage":{"oneOf":"chose one"}};

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
const _errs2 = errors;
let valid1 = false;
let passing0 = null;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema30.oneOf[0].required,parentSchema:schema30.oneOf[0],data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema30.oneOf[0].required,parentSchema:schema30.oneOf[0],data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema30.oneOf[0].required,parentSchema:schema30.oneOf[0],data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema30.oneOf[0].required,parentSchema:schema30.oneOf[0],data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.type !== undefined){
let data0 = data.type;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.oneOf[0].properties.type.type,parentSchema:schema30.oneOf[0].properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openai" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema30.oneOf[0].properties.type,data:data0};
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
if(data.id !== undefined){
let data1 = data.id;
if(typeof data1 !== "string"){
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.oneOf[0].properties.id.type,parentSchema:schema30.oneOf[0].properties.id,data:data1};
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
if(data.name !== undefined){
let data2 = data.name;
if(typeof data2 !== "string"){
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.oneOf[0].properties.name.type,parentSchema:schema30.oneOf[0].properties.name,data:data2};
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
if(data.enabled !== undefined){
let data3 = data.enabled;
if(typeof data3 !== "boolean"){
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema30.oneOf[0].properties.enabled.type,parentSchema:schema30.oneOf[0].properties.enabled,data:data3};
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
if(data.apiKey !== undefined){
let data4 = data.apiKey;
if(typeof data4 !== "string"){
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.oneOf[0].properties.apiKey.type,parentSchema:schema30.oneOf[0].properties.apiKey,data:data4};
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
}
else {
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema30.oneOf[0].type,parentSchema:schema30.oneOf[0],data};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err16 of vErrors){
if((((((err16.keyword !== "errorMessage") && (!err16.emUsed)) && (err16.instancePath === instancePath)) && (err16.keyword in emErrors0)) && (err16.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err16.schemaPath.slice(84)))){
emPropParams0 = obj0[err16.keyword];
emParamsErrors0 = emErrors0[err16.keyword][err16.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err16);
err16.emUsed = true;
}
}
}
for(const key0 in emErrors0){
for(const keyProp0 in emErrors0[key0]){
emParamsErrors0 = emErrors0[key0][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key0] && templates0[key0][keyProp0];
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema30.oneOf[0].errorMessage[key0][keyProp0],schema:schema30.oneOf[0].errorMessage,parentSchema:schema30.oneOf[0],data};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
}
const emErrs5 = [];
for(const err18 of vErrors){
if(!err18.emUsed){
emErrs5.push(err18);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
var _valid0 = _errs3 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
var props0 = {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
if(!valid1){
const err19 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema30.oneOf,parentSchema:schema30,data};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
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
if(data && typeof data == "object" && !Array.isArray(data)){
if(props0 !== true){
for(const key1 in data){
if(!props0 || !props0[key1]){
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/unevaluatedProperties",keyword:"unevaluatedProperties",params:{unevaluatedProperty: key1},message:"must NOT have unevaluated properties",schema:false,parentSchema:schema30,data};
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
}
else {
const err21 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema30.type,parentSchema:schema30,data};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"oneOf":[]};
const templates1 = {};
for(const err22 of vErrors){
if((((((err22.keyword !== "errorMessage") && (!err22.emUsed)) && (err22.instancePath === instancePath)) && (err22.keyword in emErrors1)) && (err22.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items") === 0)) && (/^\/[^\/]*$/.test(err22.schemaPath.slice(76)))){
emErrors1[err22.keyword].push(err22);
err22.emUsed = true;
}
}
for(const key2 in emErrors1){
if(emErrors1[key2].length){
const err23 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors1[key2]},message:key2 in templates1 ? templates1[key2]() : schema30.errorMessage[key2],schema:schema30.errorMessage,parentSchema:schema30,data};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
const emErrs6 = [];
for(const err24 of vErrors){
if(!err24.emUsed){
emErrs6.push(err24);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema31 = {"$id":"export2","$ref":"https://github.com/data-fair/agents/settings-put#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/settings-put","x-exports":["validate","types","vjsf"],"title":"Settings","layout":{"title":null},"type":"object","additionalProperties":false,"required":["providers"],"properties":{"createdAt":{"type":"string","format":"date-time","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/createdAt","errorMessage":{}},"updatedAt":{"type":"string","format":"date-time","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/updatedAt","errorMessage":{}},"owner":{"type":"object","additionalProperties":false,"required":["type","id"],"readOnly":true,"properties":{"type":{"type":"string","enum":["user","organization"],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/type","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/name","errorMessage":{}},"department":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/department","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner","errorMessage":{"required":{"type":"required information","id":"required information"}}},"providers":{"type":"array","title":"AI Providers","layout":{"itemTitle":"`${item.name || \"\"} - ${item.id}`","listActions":["add","edit","delete"]},"items":{"type":"object","title":"Provider","unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items","errorMessage":{"oneOf":"chose one"}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers","errorMessage":{}}},"x-vjsf":{"xI18n":true},"x-vjsf-locales":["en","fr"],"__pointer":"https://github.com/data-fair/agents/settings-put#","errorMessage":{"required":{"providers":"required information"}}};
const formats0 = fullFormats["date-time"];

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
if(data.providers === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/required",keyword:"required",params:{missingProperty: "providers"},message:"must have required property '"+"providers"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "createdAt") || (key0 === "updatedAt")) || (key0 === "owner")) || (key0 === "providers"))){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.createdAt !== undefined){
let data0 = data.createdAt;
if(typeof data0 === "string"){
if(!(formats0.validate(data0))){
const err2 = {instancePath:instancePath+"/createdAt",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/createdAt/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\"",schema:"date-time",parentSchema:schema27.properties.createdAt,data:data0};
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
const err3 = {instancePath:instancePath+"/createdAt",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/createdAt/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.createdAt.type,parentSchema:schema27.properties.createdAt,data:data0};
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
if(data.updatedAt !== undefined){
let data1 = data.updatedAt;
if(typeof data1 === "string"){
if(!(formats0.validate(data1))){
const err5 = {instancePath:instancePath+"/updatedAt",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/updatedAt/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\"",schema:"date-time",parentSchema:schema27.properties.updatedAt,data:data1};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/updatedAt",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/updatedAt/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.updatedAt.type,parentSchema:schema27.properties.updatedAt,data:data1};
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
if(data.owner !== undefined){
let data2 = data.owner;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.type === undefined){
const err8 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/owner/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.owner.required,parentSchema:schema27.properties.owner,data:data2};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data2.id === undefined){
const err9 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/owner/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.owner.required,parentSchema:schema27.properties.owner,data:data2};
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
const err10 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/owner/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.owner,data:data2};
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
const err11 = {instancePath:instancePath+"/owner/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.type.type,parentSchema:schema27.properties.owner.properties.type,data:data3};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(!((data3 === "user") || (data3 === "organization"))){
const err12 = {instancePath:instancePath+"/owner/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/type/enum",keyword:"enum",params:{allowedValues: schema27.properties.owner.properties.type.enum},message:"must be equal to one of the allowed values",schema:schema27.properties.owner.properties.type.enum,parentSchema:schema27.properties.owner.properties.type,data:data3};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err13 of vErrors){
if(!err13.emUsed){
emErrs2.push(err13);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data2.id !== undefined){
let data4 = data2.id;
if(typeof data4 !== "string"){
const err14 = {instancePath:instancePath+"/owner/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.id.type,parentSchema:schema27.properties.owner.properties.id,data:data4};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(errors > 0){
const emErrs3 = [];
for(const err15 of vErrors){
if(!err15.emUsed){
emErrs3.push(err15);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data2.name !== undefined){
let data5 = data2.name;
if(typeof data5 !== "string"){
const err16 = {instancePath:instancePath+"/owner/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.name.type,parentSchema:schema27.properties.owner.properties.name,data:data5};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err17 of vErrors){
if(!err17.emUsed){
emErrs4.push(err17);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
if(data2.department !== undefined){
let data6 = data2.department;
if(typeof data6 !== "string"){
const err18 = {instancePath:instancePath+"/owner/department",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.department.type,parentSchema:schema27.properties.owner.properties.department,data:data6};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err19 of vErrors){
if(!err19.emUsed){
emErrs5.push(err19);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
}
else {
const err20 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/owner/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.owner.type,parentSchema:schema27.properties.owner,data:data2};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"type":[],"id":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err21 of vErrors){
if((((((err21.keyword !== "errorMessage") && (!err21.emUsed)) && (err21.instancePath === instancePath+"/owner")) && (err21.keyword in emErrors0)) && (err21.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/owner") === 0)) && (/^\/[^\/]*$/.test(err21.schemaPath.slice(66)))){
emPropParams0 = obj0[err21.keyword];
emParamsErrors0 = emErrors0[err21.keyword][err21.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err21);
err21.emUsed = true;
}
}
}
for(const key2 in emErrors0){
for(const keyProp0 in emErrors0[key2]){
emParamsErrors0 = emErrors0[key2][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key2] && templates0[key2][keyProp0];
const err22 = {instancePath:instancePath+"/owner",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/owner/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.owner.errorMessage[key2][keyProp0],schema:schema27.properties.owner.errorMessage,parentSchema:schema27.properties.owner,data:data2};
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
if(data.providers !== undefined){
let data7 = data.providers;
if(Array.isArray(data7)){
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
const _errs22 = errors;
let valid5 = false;
let passing0 = null;
const _errs23 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err24 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data8};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data8.name === undefined){
const err25 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data8};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data8.id === undefined){
const err26 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data8};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data8.enabled === undefined){
const err27 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data8};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data8.type !== undefined){
let data9 = data8.type;
if(typeof data9 !== "string"){
const err28 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.type,data:data9};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if("openai" !== data9){
const err29 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema27.properties.providers.items.oneOf[0].properties.type,data:data9};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err30 of vErrors){
if(!err30.emUsed){
emErrs7.push(err30);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data8.id !== undefined){
let data10 = data8.id;
if(typeof data10 !== "string"){
const err31 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.id,data:data10};
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
if(data8.name !== undefined){
let data11 = data8.name;
if(typeof data11 !== "string"){
const err33 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.name,data:data11};
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
if(data8.enabled !== undefined){
let data12 = data8.enabled;
if(typeof data12 !== "boolean"){
const err35 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[0].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.enabled,data:data12};
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
if(data8.apiKey !== undefined){
let data13 = data8.apiKey;
if(typeof data13 !== "string"){
const err37 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.apiKey,data:data13};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(errors > 0){
const emErrs11 = [];
for(const err38 of vErrors){
if(!err38.emUsed){
emErrs11.push(err38);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
}
}
else {
const err39 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[0].type,parentSchema:schema27.properties.providers.items.oneOf[0],data:data8};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err40 of vErrors){
if((((((err40.keyword !== "errorMessage") && (!err40.emUsed)) && (err40.instancePath === instancePath+"/providers/" + i0)) && (err40.keyword in emErrors1)) && (err40.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err40.schemaPath.slice(84)))){
emPropParams1 = obj0[err40.keyword];
emParamsErrors1 = emErrors1[err40.keyword][err40.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err40);
err40.emUsed = true;
}
}
}
for(const key3 in emErrors1){
for(const keyProp1 in emErrors1[key3]){
emParamsErrors1 = emErrors1[key3][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key3] && templates1[key3][keyProp1];
const err41 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.properties.providers.items.oneOf[0].errorMessage[key3][keyProp1],schema:schema27.properties.providers.items.oneOf[0].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[0],data:data8};
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
const emErrs12 = [];
for(const err42 of vErrors){
if(!err42.emUsed){
emErrs12.push(err42);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
var _valid0 = _errs23 === errors;
if(_valid0){
valid5 = true;
passing0 = 0;
var props0 = {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
if(!valid5){
const err43 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema27.properties.providers.items.oneOf,parentSchema:schema27.properties.providers.items,data:data8};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
else {
errors = _errs22;
if(vErrors !== null){
if(_errs22){
vErrors.length = _errs22;
}
else {
vErrors = null;
}
}
}
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(props0 !== true){
for(const key4 in data8){
if(!props0 || !props0[key4]){
const err44 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/unevaluatedProperties",keyword:"unevaluatedProperties",params:{unevaluatedProperty: key4},message:"must NOT have unevaluated properties",schema:false,parentSchema:schema27.properties.providers.items,data:data8};
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
}
else {
const err45 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.type,parentSchema:schema27.properties.providers.items,data:data8};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"oneOf":[]};
const templates2 = {};
for(const err46 of vErrors){
if((((((err46.keyword !== "errorMessage") && (!err46.emUsed)) && (err46.instancePath === instancePath+"/providers/" + i0)) && (err46.keyword in emErrors2)) && (err46.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items") === 0)) && (/^\/[^\/]*$/.test(err46.schemaPath.slice(76)))){
emErrors2[err46.keyword].push(err46);
err46.emUsed = true;
}
}
for(const key5 in emErrors2){
if(emErrors2[key5].length){
const err47 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors2[key5]},message:key5 in templates2 ? templates2[key5]() : schema27.properties.providers.items.errorMessage[key5],schema:schema27.properties.providers.items.errorMessage,parentSchema:schema27.properties.providers.items,data:data8};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
const emErrs13 = [];
for(const err48 of vErrors){
if(!err48.emUsed){
emErrs13.push(err48);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
}
else {
const err49 = {instancePath:instancePath+"/providers",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.providers.type,parentSchema:schema27.properties.providers,data:data7};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(errors > 0){
const emErrs14 = [];
for(const err50 of vErrors){
if(!err50.emUsed){
emErrs14.push(err50);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
}
else {
const err51 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(errors > 0){
const emErrors3 = {"required":{"providers":[]}};
const templates3 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err52 of vErrors){
if((((((err52.keyword !== "errorMessage") && (!err52.emUsed)) && (err52.instancePath === instancePath)) && (err52.keyword in emErrors3)) && (err52.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#") === 0)) && (/^\/[^\/]*$/.test(err52.schemaPath.slice(49)))){
emPropParams2 = obj0[err52.keyword];
emParamsErrors2 = emErrors3[err52.keyword][err52.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err52);
err52.emUsed = true;
}
}
}
for(const key6 in emErrors3){
for(const keyProp2 in emErrors3[key6]){
emParamsErrors2 = emErrors3[key6][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates3[key6] && templates3[key6][keyProp2];
const err53 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema27.errorMessage[key6][keyProp2],schema:schema27.errorMessage,parentSchema:schema27,data};
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
const emErrs15 = [];
for(const err54 of vErrors){
if(!err54.emUsed){
emErrs15.push(err54);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
function expression0(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.defaultData)
}function expression1(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.options)
}function expression2(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ([{"key":"user","title":"user","value":"user"},{"key":"organization","title":"organization","value":"organization"}])
}function expression3(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (`${item.name || ""} - ${item.id}`)
}function expression4(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (summary)
}function expression5(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ({ id: crypto.randomUUID() })
}function expression6(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.constData)
}function expression7(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Open AI")
}

const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/settings-put#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/settings-put#": {
      title: "Settings",
      root: "https://github.com/data-fair/agents/settings-put#",
      refPointer: "https://github.com/data-fair/agents/settings-put#",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items": {
      title: "Provider",
      root: "https://github.com/data-fair/agents/settings-put#/properties/providers/items",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0": {
      title: "Open AI",
      root: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0",
      discriminatorValue: "openai"
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/settings-put#": {
      title: "Settings",
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#",
      refPointer: "https://github.com/data-fair/agents/settings-put#",
      pure: true,
      propertyKeys: ["createdAt", "updatedAt", "owner", "providers"],
      roPropertyKeys: ["createdAt", "updatedAt", "owner"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/createdAt", "https://github.com/data-fair/agents/settings-put#/properties/updatedAt", "https://github.com/data-fair/agents/settings-put#/properties/owner", "https://github.com/data-fair/agents/settings-put#/properties/providers"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/createdAt": {
      title: undefined,
      key: "createdAt",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/createdAt",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/createdAt",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/updatedAt": {
      title: undefined,
      key: "updatedAt",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/updatedAt",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/updatedAt",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/owner": {
      title: undefined,
      key: "owner",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/owner",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/owner",
      pure: true,
      propertyKeys: ["type", "id", "name", "department"],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/owner/properties/type", "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/id", "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/name", "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/department"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/type": {
      title: undefined,
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/id": {
      title: undefined,
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/name": {
      title: undefined,
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/department": {
      title: undefined,
      key: "department",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/department",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/department",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers": {
      title: "AI Providers",
      key: "providers",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      childrenTrees: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items": {
      title: "Provider",
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id": {
      title: "Provider ID",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name": {
      title: "Display Name",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled": {
      title: "Enabled",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey": {
      title: "API Key",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf": {
      key: "$oneOf",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf",
      childrenTrees: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0"],
      discriminator: "type",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey"],
      roPropertyKeys: ["id"]
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/settings-put#": {
      title: null,
      comp: "section",

      children: [{
        key: "createdAt"
      }, {
        key: "updatedAt"
      }, {
        key: "owner"
      }, {
        key: "providers"
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

    "https://github.com/data-fair/agents/settings-put#/properties/createdAt": {
      comp: "date-time-picker",

      options: {
        readOnly: true
      },

      label: "createdAt",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/updatedAt": {
      comp: "date-time-picker",

      options: {
        readOnly: true
      },

      label: "updatedAt",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/owner": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "id"
      }, {
        key: "name"
      }, {
        key: "department"
      }],

      title: null,

      options: {
        readOnly: true
      },

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/type": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"key\":\"user\",\"title\":\"user\",\"value\":\"user\"},{\"key\":\"organization\",\"title\":\"organization\",\"value\":\"organization\"}]",
        immutable: true,
        ref: 2
      },

      label: "type"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/id": {
      comp: "text-field",
      label: "id"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/name": {
      comp: "text-field",
      label: "name"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/department": {
      comp: "text-field",
      label: "department"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers": {
      itemTitle: {
        type: "js-eval",
        expr: "`${item.name || \"\"} - ${item.id}`",
        pure: true,
        dataAlias: "item",
        ref: 3
      },

      listActions: ["add", "edit", "delete"],
      comp: "list",
      title: "AI Providers",
      listEditMode: "inline-single",
      defaultData: [],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items": {
      switch: [{
        getDefaultData: {
          type: "js-eval",
          expr: "{ id: crypto.randomUUID() }",
          pure: true,
          dataAlias: "value",
          ref: 5
        },

        if: {
          type: "js-eval",
          expr: "summary",
          pure: true,
          dataAlias: "value",
          ref: 4
        },

        children: [],
        comp: "section",
        title: "Provider",
        defaultData: {},
        nullable: true
      }, {
        getDefaultData: {
          type: "js-eval",
          expr: "{ id: crypto.randomUUID() }",
          pure: true,
          dataAlias: "value",
          ref: 5
        },

        comp: "section",

        children: [{
          key: "$oneOf"
        }],

        title: "Provider",
        defaultData: {},
        nullable: true
      }]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf": {
      emptyData: true,
      comp: "one-of-select",

      oneOfItems: [{
        key: 0,
        title: "Open AI"
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "id"
      }, {
        key: "name"
      }, {
        key: "enabled"
      }, {
        key: "apiKey"
      }],

      title: "Open AI",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type": {
      comp: "none",
      constData: "openai",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 6
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "Provider ID",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Open AI\"",
        pure: true,
        dataAlias: "value",
        ref: 7
      },

      comp: "text-field",
      label: "Display Name"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
    }
  },

  validates: {
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0": validate22,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items": validate24,
    "https://github.com/data-fair/agents/settings-put#": validate25
  },

  validationErrors: {},
  expressions: [expression0, expression1, expression2, expression3, expression4, expression5, expression6, expression7],
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
  
  "date-time-picker": datetimepickerNode,
  
  "select": selectNode,
  
  "text-field": textfieldNode,
  
  "list": listNode,
  
  "one-of-select": oneofselectNode,
  
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