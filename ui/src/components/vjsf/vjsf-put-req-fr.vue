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

import oneofselectNode from '@koumoul/vjsf/components/nodes/one-of-select.vue'

import textfieldNode from '@koumoul/vjsf/components/nodes/text-field.vue'

import checkboxNode from '@koumoul/vjsf/components/nodes/checkbox.vue'

import selectNode from '@koumoul/vjsf/components/nodes/select.vue'

import autocompleteNode from '@koumoul/vjsf/components/nodes/autocomplete.vue'

import numberfieldNode from '@koumoul/vjsf/components/nodes/number-field.vue'


import localizeErrors from "ajv-i18n/localize/fr/index.js";
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0"};
const schema29 = {"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};
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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema29.required,parentSchema:schema29,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema29.required,parentSchema:schema29,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema29.required,parentSchema:schema29,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema29.required,parentSchema:schema29,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema29.properties.type.type,parentSchema:schema29.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openai" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema29.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema29.properties.id.type,parentSchema:schema29.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema29.properties.name.type,parentSchema:schema29.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema29.properties.enabled.type,parentSchema:schema29.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema29.properties.apiKey.type,parentSchema:schema29.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema29.type,parentSchema:schema29,data};
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
if((((((err16.keyword !== "errorMessage") && (!err16.emUsed)) && (err16.instancePath === instancePath)) && (err16.keyword in emErrors0)) && (err16.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err16.schemaPath.slice(88)))){
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema29.errorMessage[key0][keyProp0],schema:schema29.errorMessage,parentSchema:schema29,data};
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

const schema30 = {"$id":"export1","$ref":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1"};
const schema31 = {"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema31.required,parentSchema:schema31,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema31.required,parentSchema:schema31,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema31.required,parentSchema:schema31,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema31.required,parentSchema:schema31,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema31.properties.type.type,parentSchema:schema31.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("anthropic" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant",schema:"anthropic",parentSchema:schema31.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema31.properties.id.type,parentSchema:schema31.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema31.properties.name.type,parentSchema:schema31.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema31.properties.enabled.type,parentSchema:schema31.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema31.properties.apiKey.type,parentSchema:schema31.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema31.type,parentSchema:schema31,data};
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
if((((((err16.keyword !== "errorMessage") && (!err16.emUsed)) && (err16.instancePath === instancePath)) && (err16.keyword in emErrors0)) && (err16.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err16.schemaPath.slice(88)))){
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema31.errorMessage[key0][keyProp0],schema:schema31.errorMessage,parentSchema:schema31,data};
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
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"apiKey":true},"dynamicProps":false,"dynamicItems":false};

const schema32 = {"$id":"export2","$ref":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2"};
const schema33 = {"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema33.required,parentSchema:schema33,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema33.required,parentSchema:schema33,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema33.required,parentSchema:schema33,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema33.required,parentSchema:schema33,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema33.properties.type.type,parentSchema:schema33.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("google" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant",schema:"google",parentSchema:schema33.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema33.properties.id.type,parentSchema:schema33.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema33.properties.name.type,parentSchema:schema33.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.enabled.type,parentSchema:schema33.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema33.properties.apiKey.type,parentSchema:schema33.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data};
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
if((((((err16.keyword !== "errorMessage") && (!err16.emUsed)) && (err16.instancePath === instancePath)) && (err16.keyword in emErrors0)) && (err16.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err16.schemaPath.slice(88)))){
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema33.errorMessage[key0][keyProp0],schema:schema33.errorMessage,parentSchema:schema33,data};
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
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"apiKey":true},"dynamicProps":false,"dynamicItems":false};

const schema34 = {"$id":"export3","$ref":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3"};
const schema35 = {"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema35.required,parentSchema:schema35,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema35.required,parentSchema:schema35,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema35.required,parentSchema:schema35,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema35.required,parentSchema:schema35,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema35.properties.type.type,parentSchema:schema35.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("mistral" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant",schema:"mistral",parentSchema:schema35.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema35.properties.id.type,parentSchema:schema35.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema35.properties.name.type,parentSchema:schema35.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema35.properties.enabled.type,parentSchema:schema35.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema35.properties.apiKey.type,parentSchema:schema35.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema35.type,parentSchema:schema35,data};
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
if((((((err16.keyword !== "errorMessage") && (!err16.emUsed)) && (err16.instancePath === instancePath)) && (err16.keyword in emErrors0)) && (err16.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3") === 0)) && (/^\/[^\/]*$/.test(err16.schemaPath.slice(88)))){
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema35.errorMessage[key0][keyProp0],schema:schema35.errorMessage,parentSchema:schema35,data};
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
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"apiKey":true},"dynamicProps":false,"dynamicItems":false};

const schema36 = {"$id":"export4","$ref":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4"};
const schema37 = {"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema37.required,parentSchema:schema37,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema37.required,parentSchema:schema37,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema37.required,parentSchema:schema37,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema37.required,parentSchema:schema37,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema37.properties.type.type,parentSchema:schema37.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openrouter" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant",schema:"openrouter",parentSchema:schema37.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema37.properties.id.type,parentSchema:schema37.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema37.properties.name.type,parentSchema:schema37.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema37.properties.enabled.type,parentSchema:schema37.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema37.properties.apiKey.type,parentSchema:schema37.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema37.type,parentSchema:schema37,data};
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
if((((((err16.keyword !== "errorMessage") && (!err16.emUsed)) && (err16.instancePath === instancePath)) && (err16.keyword in emErrors0)) && (err16.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4") === 0)) && (/^\/[^\/]*$/.test(err16.schemaPath.slice(88)))){
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema37.errorMessage[key0][keyProp0],schema:schema37.errorMessage,parentSchema:schema37,data};
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
validate27.errors = vErrors;
return errors === 0;
}
validate27.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"apiKey":true},"dynamicProps":false,"dynamicItems":false};

const schema38 = {"$id":"export5","$ref":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5"};
const schema39 = {"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}};

function validate28(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export5" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate28.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema39.required,parentSchema:schema39,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema39.required,parentSchema:schema39,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema39.required,parentSchema:schema39,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema39.required,parentSchema:schema39,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.baseURL === undefined){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema39.required,parentSchema:schema39,data};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.type !== undefined){
let data0 = data.type;
if(typeof data0 !== "string"){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema39.properties.type.type,parentSchema:schema39.properties.type,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("ollama" !== data0){
const err6 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant",schema:"ollama",parentSchema:schema39.properties.type,data:data0};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err7 of vErrors){
if(!err7.emUsed){
emErrs0.push(err7);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.id !== undefined){
let data1 = data.id;
if(typeof data1 !== "string"){
const err8 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema39.properties.id.type,parentSchema:schema39.properties.id,data:data1};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err9 of vErrors){
if(!err9.emUsed){
emErrs1.push(err9);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.name !== undefined){
let data2 = data.name;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema39.properties.name.type,parentSchema:schema39.properties.name,data:data2};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err11 of vErrors){
if(!err11.emUsed){
emErrs2.push(err11);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data.enabled !== undefined){
let data3 = data.enabled;
if(typeof data3 !== "boolean"){
const err12 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema39.properties.enabled.type,parentSchema:schema39.properties.enabled,data:data3};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(errors > 0){
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
if(data.apiKey !== undefined){
let data4 = data.apiKey;
if(typeof data4 !== "string"){
const err14 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema39.properties.apiKey.type,parentSchema:schema39.properties.apiKey,data:data4};
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
if(data.baseURL !== undefined){
let data5 = data.baseURL;
if(typeof data5 !== "string"){
const err16 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema39.properties.baseURL.type,parentSchema:schema39.properties.baseURL,data:data5};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err17 of vErrors){
if(!err17.emUsed){
emErrs5.push(err17);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
}
else {
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema39.type,parentSchema:schema39,data};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"baseURL":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err19 of vErrors){
if((((((err19.keyword !== "errorMessage") && (!err19.emUsed)) && (err19.instancePath === instancePath)) && (err19.keyword in emErrors0)) && (err19.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5") === 0)) && (/^\/[^\/]*$/.test(err19.schemaPath.slice(88)))){
emPropParams0 = obj0[err19.keyword];
emParamsErrors0 = emErrors0[err19.keyword][err19.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err19);
err19.emUsed = true;
}
}
}
for(const key0 in emErrors0){
for(const keyProp0 in emErrors0[key0]){
emParamsErrors0 = emErrors0[key0][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key0] && templates0[key0][keyProp0];
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema39.errorMessage[key0][keyProp0],schema:schema39.errorMessage,parentSchema:schema39,data};
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
const emErrs6 = [];
for(const err21 of vErrors){
if(!err21.emUsed){
emErrs6.push(err21);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"apiKey":true,"baseURL":true},"dynamicProps":false,"dynamicItems":false};

const schema40 = {"$id":"export6","$ref":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6"};
const schema41 = {"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","description":"Pour une clé API liée à un Projet Scaleway spécifique, renseignez l'ID du projet afin que les requêtes ciblent ce projet. Laissez vide pour utiliser le projet par défaut de l'organisation.","properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Scaleway\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/apiKey","errorMessage":{}},"projectId":{"type":"string","title":"ID du projet","description":"Optionnel. L'ID du Projet Scaleway (UUID) auquel la clé API est liée. Requis lorsque la clé n'a accès qu'à un projet spécifique, sinon le listing des modèles et l'inférence renvoient une erreur 403.","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/projectId","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","apiKey":"information obligatoire"}}};

function validate29(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export6" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate29.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema41.required,parentSchema:schema41,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema41.required,parentSchema:schema41,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema41.required,parentSchema:schema41,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema41.required,parentSchema:schema41,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.apiKey === undefined){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "apiKey"},message:"must have required property '"+"apiKey"+"'",schema:schema41.required,parentSchema:schema41,data};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.type !== undefined){
let data0 = data.type;
if(typeof data0 !== "string"){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema41.properties.type.type,parentSchema:schema41.properties.type,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("scaleway" !== data0){
const err6 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "scaleway"},message:"must be equal to constant",schema:"scaleway",parentSchema:schema41.properties.type,data:data0};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err7 of vErrors){
if(!err7.emUsed){
emErrs0.push(err7);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.id !== undefined){
let data1 = data.id;
if(typeof data1 !== "string"){
const err8 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema41.properties.id.type,parentSchema:schema41.properties.id,data:data1};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err9 of vErrors){
if(!err9.emUsed){
emErrs1.push(err9);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.name !== undefined){
let data2 = data.name;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema41.properties.name.type,parentSchema:schema41.properties.name,data:data2};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err11 of vErrors){
if(!err11.emUsed){
emErrs2.push(err11);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data.enabled !== undefined){
let data3 = data.enabled;
if(typeof data3 !== "boolean"){
const err12 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema41.properties.enabled.type,parentSchema:schema41.properties.enabled,data:data3};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(errors > 0){
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
if(data.apiKey !== undefined){
let data4 = data.apiKey;
if(typeof data4 !== "string"){
const err14 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema41.properties.apiKey.type,parentSchema:schema41.properties.apiKey,data:data4};
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
if(data.projectId !== undefined){
let data5 = data.projectId;
if(typeof data5 !== "string"){
const err16 = {instancePath:instancePath+"/projectId",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/projectId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema41.properties.projectId.type,parentSchema:schema41.properties.projectId,data:data5};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err17 of vErrors){
if(!err17.emUsed){
emErrs5.push(err17);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
}
else {
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema41.type,parentSchema:schema41,data};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"apiKey":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err19 of vErrors){
if((((((err19.keyword !== "errorMessage") && (!err19.emUsed)) && (err19.instancePath === instancePath)) && (err19.keyword in emErrors0)) && (err19.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6") === 0)) && (/^\/[^\/]*$/.test(err19.schemaPath.slice(88)))){
emPropParams0 = obj0[err19.keyword];
emParamsErrors0 = emErrors0[err19.keyword][err19.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err19);
err19.emUsed = true;
}
}
}
for(const key0 in emErrors0){
for(const keyProp0 in emErrors0[key0]){
emParamsErrors0 = emErrors0[key0][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key0] && templates0[key0][keyProp0];
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema41.errorMessage[key0][keyProp0],schema:schema41.errorMessage,parentSchema:schema41,data};
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
const emErrs6 = [];
for(const err21 of vErrors){
if(!err21.emUsed){
emErrs6.push(err21);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
validate29.errors = vErrors;
return errors === 0;
}
validate29.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"apiKey":true,"projectId":true},"dynamicProps":false,"dynamicItems":false};

const schema42 = {"$id":"export7","$ref":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7"};
const schema43 = {"required":["type","name","id","enabled","baseURL"],"title":"Compatible OpenAI","description":"Fournisseur générique pour tout endpoint compatible OpenAI (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). La clé API est optionnelle pour les serveurs locaux sans authentification.","properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenAI Compatible\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/enabled","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/apiKey","errorMessage":{}},"compatibility":{"type":"string","title":"Mode de compatibilité","description":"Utilisez \"compatible\" pour les fournisseurs qui ne supportent pas le nouveau endpoint /v1/responses (ex: LiteLLM, anciennes APIs compatibles OpenAI). Laissez vide pour le comportement OpenAI standard.","enum":["default","compatible"],"default":"default","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/compatibility","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}};

function validate30(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export7" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate30.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema43.required,parentSchema:schema43,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema43.required,parentSchema:schema43,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema43.required,parentSchema:schema43,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema43.required,parentSchema:schema43,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.baseURL === undefined){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema43.required,parentSchema:schema43,data};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.type !== undefined){
let data0 = data.type;
if(typeof data0 !== "string"){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema43.properties.type.type,parentSchema:schema43.properties.type,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("openai-compatible" !== data0){
const err6 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue: "openai-compatible"},message:"must be equal to constant",schema:"openai-compatible",parentSchema:schema43.properties.type,data:data0};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err7 of vErrors){
if(!err7.emUsed){
emErrs0.push(err7);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.id !== undefined){
let data1 = data.id;
if(typeof data1 !== "string"){
const err8 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema43.properties.id.type,parentSchema:schema43.properties.id,data:data1};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err9 of vErrors){
if(!err9.emUsed){
emErrs1.push(err9);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.name !== undefined){
let data2 = data.name;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema43.properties.name.type,parentSchema:schema43.properties.name,data:data2};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err11 of vErrors){
if(!err11.emUsed){
emErrs2.push(err11);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data.enabled !== undefined){
let data3 = data.enabled;
if(typeof data3 !== "boolean"){
const err12 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema43.properties.enabled.type,parentSchema:schema43.properties.enabled,data:data3};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(errors > 0){
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
if(data.baseURL !== undefined){
let data4 = data.baseURL;
if(typeof data4 !== "string"){
const err14 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema43.properties.baseURL.type,parentSchema:schema43.properties.baseURL,data:data4};
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
if(data.apiKey !== undefined){
let data5 = data.apiKey;
if(typeof data5 !== "string"){
const err16 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema43.properties.apiKey.type,parentSchema:schema43.properties.apiKey,data:data5};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err17 of vErrors){
if(!err17.emUsed){
emErrs5.push(err17);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
if(data.compatibility !== undefined){
let data6 = data.compatibility;
if(typeof data6 !== "string"){
const err18 = {instancePath:instancePath+"/compatibility",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/compatibility/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema43.properties.compatibility.type,parentSchema:schema43.properties.compatibility,data:data6};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!((data6 === "default") || (data6 === "compatible"))){
const err19 = {instancePath:instancePath+"/compatibility",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/compatibility/enum",keyword:"enum",params:{allowedValues: schema43.properties.compatibility.enum},message:"must be equal to one of the allowed values",schema:schema43.properties.compatibility.enum,parentSchema:schema43.properties.compatibility,data:data6};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(errors > 0){
const emErrs6 = [];
for(const err20 of vErrors){
if(!err20.emUsed){
emErrs6.push(err20);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
}
else {
const err21 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema43.type,parentSchema:schema43,data};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"baseURL":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err22 of vErrors){
if((((((err22.keyword !== "errorMessage") && (!err22.emUsed)) && (err22.instancePath === instancePath)) && (err22.keyword in emErrors0)) && (err22.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7") === 0)) && (/^\/[^\/]*$/.test(err22.schemaPath.slice(88)))){
emPropParams0 = obj0[err22.keyword];
emParamsErrors0 = emErrors0[err22.keyword][err22.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err22);
err22.emUsed = true;
}
}
}
for(const key0 in emErrors0){
for(const keyProp0 in emErrors0[key0]){
emParamsErrors0 = emErrors0[key0][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key0] && templates0[key0][keyProp0];
const err23 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema43.errorMessage[key0][keyProp0],schema:schema43.errorMessage,parentSchema:schema43,data};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
}
const emErrs7 = [];
for(const err24 of vErrors){
if(!err24.emUsed){
emErrs7.push(err24);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
validate30.errors = vErrors;
return errors === 0;
}
validate30.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"baseURL":true,"apiKey":true,"compatibility":true},"dynamicProps":false,"dynamicItems":false};

const schema44 = {"$id":"export8","$ref":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8"};
const schema45 = {"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

function validate31(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export8" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate31.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema45.required,parentSchema:schema45,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema45.required,parentSchema:schema45,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema45.required,parentSchema:schema45,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema45.required,parentSchema:schema45,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema45.properties.type.type,parentSchema:schema45.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("mock" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema45.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema45.properties.id.type,parentSchema:schema45.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema45.properties.name.type,parentSchema:schema45.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema45.properties.enabled.type,parentSchema:schema45.properties.enabled,data:data3};
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
}
else {
const err13 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema45.type,parentSchema:schema45,data};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err14 of vErrors){
if((((((err14.keyword !== "errorMessage") && (!err14.emUsed)) && (err14.instancePath === instancePath)) && (err14.keyword in emErrors0)) && (err14.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8") === 0)) && (/^\/[^\/]*$/.test(err14.schemaPath.slice(88)))){
emPropParams0 = obj0[err14.keyword];
emParamsErrors0 = emErrors0[err14.keyword][err14.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err14);
err14.emUsed = true;
}
}
}
for(const key0 in emErrors0){
for(const keyProp0 in emErrors0[key0]){
emParamsErrors0 = emErrors0[key0][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key0] && templates0[key0][keyProp0];
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema45.errorMessage[key0][keyProp0],schema:schema45.errorMessage,parentSchema:schema45,data};
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
const emErrs4 = [];
for(const err16 of vErrors){
if(!err16.emUsed){
emErrs4.push(err16);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
validate31.errors = vErrors;
return errors === 0;
}
validate31.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true},"dynamicProps":false,"dynamicItems":false};

const schema46 = {"$id":"export9","$ref":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items"};
const schema47 = {"type":"object","title":"Fournisseur","unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}},{"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","description":"Pour une clé API liée à un Projet Scaleway spécifique, renseignez l'ID du projet afin que les requêtes ciblent ce projet. Laissez vide pour utiliser le projet par défaut de l'organisation.","properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Scaleway\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/apiKey","errorMessage":{}},"projectId":{"type":"string","title":"ID du projet","description":"Optionnel. L'ID du Projet Scaleway (UUID) auquel la clé API est liée. Requis lorsque la clé n'a accès qu'à un projet spécifique, sinon le listing des modèles et l'inférence renvoient une erreur 403.","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/projectId","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","apiKey":"information obligatoire"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Compatible OpenAI","description":"Fournisseur générique pour tout endpoint compatible OpenAI (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). La clé API est optionnelle pour les serveurs locaux sans authentification.","properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenAI Compatible\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/enabled","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/apiKey","errorMessage":{}},"compatibility":{"type":"string","title":"Mode de compatibilité","description":"Utilisez \"compatible\" pour les fournisseurs qui ne supportent pas le nouveau endpoint /v1/responses (ex: LiteLLM, anciennes APIs compatibles OpenAI). Laissez vide pour le comportement OpenAI standard.","enum":["default","compatible"],"default":"default","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/compatibility","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}}],"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items","errorMessage":{"oneOf":"choisissez une valeur"}};

function validate32(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export9" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate32.evaluated;
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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema47.oneOf[0].required,parentSchema:schema47.oneOf[0],data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema47.oneOf[0].required,parentSchema:schema47.oneOf[0],data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema47.oneOf[0].required,parentSchema:schema47.oneOf[0],data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema47.oneOf[0].required,parentSchema:schema47.oneOf[0],data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[0].properties.type.type,parentSchema:schema47.oneOf[0].properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openai" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema47.oneOf[0].properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[0].properties.id.type,parentSchema:schema47.oneOf[0].properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[0].properties.name.type,parentSchema:schema47.oneOf[0].properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema47.oneOf[0].properties.enabled.type,parentSchema:schema47.oneOf[0].properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[0].properties.apiKey.type,parentSchema:schema47.oneOf[0].properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema47.oneOf[0].type,parentSchema:schema47.oneOf[0],data};
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
if((((((err16.keyword !== "errorMessage") && (!err16.emUsed)) && (err16.instancePath === instancePath)) && (err16.keyword in emErrors0)) && (err16.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err16.schemaPath.slice(88)))){
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema47.oneOf[0].errorMessage[key0][keyProp0],schema:schema47.oneOf[0].errorMessage,parentSchema:schema47.oneOf[0],data};
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
const _errs15 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err19 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema47.oneOf[1].required,parentSchema:schema47.oneOf[1],data};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data.name === undefined){
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema47.oneOf[1].required,parentSchema:schema47.oneOf[1],data};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data.id === undefined){
const err21 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema47.oneOf[1].required,parentSchema:schema47.oneOf[1],data};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data.enabled === undefined){
const err22 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema47.oneOf[1].required,parentSchema:schema47.oneOf[1],data};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data.type !== undefined){
let data5 = data.type;
if(typeof data5 !== "string"){
const err23 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[1].properties.type.type,parentSchema:schema47.oneOf[1].properties.type,data:data5};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if("anthropic" !== data5){
const err24 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant",schema:"anthropic",parentSchema:schema47.oneOf[1].properties.type,data:data5};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(errors > 0){
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
if(data.id !== undefined){
let data6 = data.id;
if(typeof data6 !== "string"){
const err26 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[1].properties.id.type,parentSchema:schema47.oneOf[1].properties.id,data:data6};
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
if(data.name !== undefined){
let data7 = data.name;
if(typeof data7 !== "string"){
const err28 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[1].properties.name.type,parentSchema:schema47.oneOf[1].properties.name,data:data7};
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
if(data.enabled !== undefined){
let data8 = data.enabled;
if(typeof data8 !== "boolean"){
const err30 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema47.oneOf[1].properties.enabled.type,parentSchema:schema47.oneOf[1].properties.enabled,data:data8};
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
if(data.apiKey !== undefined){
let data9 = data.apiKey;
if(typeof data9 !== "string"){
const err32 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[1].properties.apiKey.type,parentSchema:schema47.oneOf[1].properties.apiKey,data:data9};
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
const err34 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema47.oneOf[1].type,parentSchema:schema47.oneOf[1],data};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err35 of vErrors){
if((((((err35.keyword !== "errorMessage") && (!err35.emUsed)) && (err35.instancePath === instancePath)) && (err35.keyword in emErrors1)) && (err35.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err35.schemaPath.slice(88)))){
emPropParams1 = obj0[err35.keyword];
emParamsErrors1 = emErrors1[err35.keyword][err35.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err35);
err35.emUsed = true;
}
}
}
for(const key1 in emErrors1){
for(const keyProp1 in emErrors1[key1]){
emParamsErrors1 = emErrors1[key1][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key1] && templates1[key1][keyProp1];
const err36 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema47.oneOf[1].errorMessage[key1][keyProp1],schema:schema47.oneOf[1].errorMessage,parentSchema:schema47.oneOf[1],data};
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
var _valid0 = _errs15 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
}
const _errs27 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err38 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema47.oneOf[2].required,parentSchema:schema47.oneOf[2],data};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data.name === undefined){
const err39 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema47.oneOf[2].required,parentSchema:schema47.oneOf[2],data};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data.id === undefined){
const err40 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema47.oneOf[2].required,parentSchema:schema47.oneOf[2],data};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data.enabled === undefined){
const err41 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema47.oneOf[2].required,parentSchema:schema47.oneOf[2],data};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data.type !== undefined){
let data10 = data.type;
if(typeof data10 !== "string"){
const err42 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[2].properties.type.type,parentSchema:schema47.oneOf[2].properties.type,data:data10};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if("google" !== data10){
const err43 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant",schema:"google",parentSchema:schema47.oneOf[2].properties.type,data:data10};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err44 of vErrors){
if(!err44.emUsed){
emErrs12.push(err44);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
if(data.id !== undefined){
let data11 = data.id;
if(typeof data11 !== "string"){
const err45 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[2].properties.id.type,parentSchema:schema47.oneOf[2].properties.id,data:data11};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err46 of vErrors){
if(!err46.emUsed){
emErrs13.push(err46);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
if(data.name !== undefined){
let data12 = data.name;
if(typeof data12 !== "string"){
const err47 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[2].properties.name.type,parentSchema:schema47.oneOf[2].properties.name,data:data12};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(errors > 0){
const emErrs14 = [];
for(const err48 of vErrors){
if(!err48.emUsed){
emErrs14.push(err48);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
if(data.enabled !== undefined){
let data13 = data.enabled;
if(typeof data13 !== "boolean"){
const err49 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema47.oneOf[2].properties.enabled.type,parentSchema:schema47.oneOf[2].properties.enabled,data:data13};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(errors > 0){
const emErrs15 = [];
for(const err50 of vErrors){
if(!err50.emUsed){
emErrs15.push(err50);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
if(data.apiKey !== undefined){
let data14 = data.apiKey;
if(typeof data14 !== "string"){
const err51 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[2].properties.apiKey.type,parentSchema:schema47.oneOf[2].properties.apiKey,data:data14};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err52 of vErrors){
if(!err52.emUsed){
emErrs16.push(err52);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
}
else {
const err53 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema47.oneOf[2].type,parentSchema:schema47.oneOf[2],data};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates2 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err54 of vErrors){
if((((((err54.keyword !== "errorMessage") && (!err54.emUsed)) && (err54.instancePath === instancePath)) && (err54.keyword in emErrors2)) && (err54.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err54.schemaPath.slice(88)))){
emPropParams2 = obj0[err54.keyword];
emParamsErrors2 = emErrors2[err54.keyword][err54.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err54);
err54.emUsed = true;
}
}
}
for(const key2 in emErrors2){
for(const keyProp2 in emErrors2[key2]){
emParamsErrors2 = emErrors2[key2][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates2[key2] && templates2[key2][keyProp2];
const err55 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema47.oneOf[2].errorMessage[key2][keyProp2],schema:schema47.oneOf[2].errorMessage,parentSchema:schema47.oneOf[2],data};
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
const emErrs17 = [];
for(const err56 of vErrors){
if(!err56.emUsed){
emErrs17.push(err56);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
var _valid0 = _errs27 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid1 = true;
passing0 = 2;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
}
const _errs39 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err57 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema47.oneOf[3].required,parentSchema:schema47.oneOf[3],data};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data.name === undefined){
const err58 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema47.oneOf[3].required,parentSchema:schema47.oneOf[3],data};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data.id === undefined){
const err59 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema47.oneOf[3].required,parentSchema:schema47.oneOf[3],data};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data.enabled === undefined){
const err60 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema47.oneOf[3].required,parentSchema:schema47.oneOf[3],data};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data.type !== undefined){
let data15 = data.type;
if(typeof data15 !== "string"){
const err61 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[3].properties.type.type,parentSchema:schema47.oneOf[3].properties.type,data:data15};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if("mistral" !== data15){
const err62 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant",schema:"mistral",parentSchema:schema47.oneOf[3].properties.type,data:data15};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(errors > 0){
const emErrs18 = [];
for(const err63 of vErrors){
if(!err63.emUsed){
emErrs18.push(err63);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
}
if(data.id !== undefined){
let data16 = data.id;
if(typeof data16 !== "string"){
const err64 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[3].properties.id.type,parentSchema:schema47.oneOf[3].properties.id,data:data16};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(errors > 0){
const emErrs19 = [];
for(const err65 of vErrors){
if(!err65.emUsed){
emErrs19.push(err65);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
}
if(data.name !== undefined){
let data17 = data.name;
if(typeof data17 !== "string"){
const err66 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[3].properties.name.type,parentSchema:schema47.oneOf[3].properties.name,data:data17};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err67 of vErrors){
if(!err67.emUsed){
emErrs20.push(err67);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
if(data.enabled !== undefined){
let data18 = data.enabled;
if(typeof data18 !== "boolean"){
const err68 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema47.oneOf[3].properties.enabled.type,parentSchema:schema47.oneOf[3].properties.enabled,data:data18};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(errors > 0){
const emErrs21 = [];
for(const err69 of vErrors){
if(!err69.emUsed){
emErrs21.push(err69);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
if(data.apiKey !== undefined){
let data19 = data.apiKey;
if(typeof data19 !== "string"){
const err70 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[3].properties.apiKey.type,parentSchema:schema47.oneOf[3].properties.apiKey,data:data19};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(errors > 0){
const emErrs22 = [];
for(const err71 of vErrors){
if(!err71.emUsed){
emErrs22.push(err71);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
}
}
else {
const err72 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema47.oneOf[3].type,parentSchema:schema47.oneOf[3],data};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(errors > 0){
const emErrors3 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates3 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err73 of vErrors){
if((((((err73.keyword !== "errorMessage") && (!err73.emUsed)) && (err73.instancePath === instancePath)) && (err73.keyword in emErrors3)) && (err73.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3") === 0)) && (/^\/[^\/]*$/.test(err73.schemaPath.slice(88)))){
emPropParams3 = obj0[err73.keyword];
emParamsErrors3 = emErrors3[err73.keyword][err73.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err73);
err73.emUsed = true;
}
}
}
for(const key3 in emErrors3){
for(const keyProp3 in emErrors3[key3]){
emParamsErrors3 = emErrors3[key3][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates3[key3] && templates3[key3][keyProp3];
const err74 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema47.oneOf[3].errorMessage[key3][keyProp3],schema:schema47.oneOf[3].errorMessage,parentSchema:schema47.oneOf[3],data};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
}
const emErrs23 = [];
for(const err75 of vErrors){
if(!err75.emUsed){
emErrs23.push(err75);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
var _valid0 = _errs39 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid1 = true;
passing0 = 3;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
}
const _errs51 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err76 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema47.oneOf[4].required,parentSchema:schema47.oneOf[4],data};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
if(data.name === undefined){
const err77 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema47.oneOf[4].required,parentSchema:schema47.oneOf[4],data};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(data.id === undefined){
const err78 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema47.oneOf[4].required,parentSchema:schema47.oneOf[4],data};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if(data.enabled === undefined){
const err79 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema47.oneOf[4].required,parentSchema:schema47.oneOf[4],data};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(data.type !== undefined){
let data20 = data.type;
if(typeof data20 !== "string"){
const err80 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[4].properties.type.type,parentSchema:schema47.oneOf[4].properties.type,data:data20};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if("openrouter" !== data20){
const err81 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant",schema:"openrouter",parentSchema:schema47.oneOf[4].properties.type,data:data20};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(errors > 0){
const emErrs24 = [];
for(const err82 of vErrors){
if(!err82.emUsed){
emErrs24.push(err82);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
if(data.id !== undefined){
let data21 = data.id;
if(typeof data21 !== "string"){
const err83 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[4].properties.id.type,parentSchema:schema47.oneOf[4].properties.id,data:data21};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err84 of vErrors){
if(!err84.emUsed){
emErrs25.push(err84);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
if(data.name !== undefined){
let data22 = data.name;
if(typeof data22 !== "string"){
const err85 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[4].properties.name.type,parentSchema:schema47.oneOf[4].properties.name,data:data22};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err86 of vErrors){
if(!err86.emUsed){
emErrs26.push(err86);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
if(data.enabled !== undefined){
let data23 = data.enabled;
if(typeof data23 !== "boolean"){
const err87 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema47.oneOf[4].properties.enabled.type,parentSchema:schema47.oneOf[4].properties.enabled,data:data23};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
if(errors > 0){
const emErrs27 = [];
for(const err88 of vErrors){
if(!err88.emUsed){
emErrs27.push(err88);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
}
if(data.apiKey !== undefined){
let data24 = data.apiKey;
if(typeof data24 !== "string"){
const err89 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[4].properties.apiKey.type,parentSchema:schema47.oneOf[4].properties.apiKey,data:data24};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if(errors > 0){
const emErrs28 = [];
for(const err90 of vErrors){
if(!err90.emUsed){
emErrs28.push(err90);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
}
}
else {
const err91 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema47.oneOf[4].type,parentSchema:schema47.oneOf[4],data};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if(errors > 0){
const emErrors4 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates4 = {required:{}};
let emPropParams4;
let emParamsErrors4;
for(const err92 of vErrors){
if((((((err92.keyword !== "errorMessage") && (!err92.emUsed)) && (err92.instancePath === instancePath)) && (err92.keyword in emErrors4)) && (err92.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4") === 0)) && (/^\/[^\/]*$/.test(err92.schemaPath.slice(88)))){
emPropParams4 = obj0[err92.keyword];
emParamsErrors4 = emErrors4[err92.keyword][err92.params[emPropParams4]];
if(emParamsErrors4){
emParamsErrors4.push(err92);
err92.emUsed = true;
}
}
}
for(const key4 in emErrors4){
for(const keyProp4 in emErrors4[key4]){
emParamsErrors4 = emErrors4[key4][keyProp4];
if(emParamsErrors4.length){
const tmpl4 = templates4[key4] && templates4[key4][keyProp4];
const err93 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema47.oneOf[4].errorMessage[key4][keyProp4],schema:schema47.oneOf[4].errorMessage,parentSchema:schema47.oneOf[4],data};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
}
}
const emErrs29 = [];
for(const err94 of vErrors){
if(!err94.emUsed){
emErrs29.push(err94);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
var _valid0 = _errs51 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid1 = true;
passing0 = 4;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
}
const _errs63 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err95 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema47.oneOf[5].required,parentSchema:schema47.oneOf[5],data};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
if(data.name === undefined){
const err96 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema47.oneOf[5].required,parentSchema:schema47.oneOf[5],data};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(data.id === undefined){
const err97 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema47.oneOf[5].required,parentSchema:schema47.oneOf[5],data};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
if(data.enabled === undefined){
const err98 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema47.oneOf[5].required,parentSchema:schema47.oneOf[5],data};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(data.baseURL === undefined){
const err99 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema47.oneOf[5].required,parentSchema:schema47.oneOf[5],data};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
if(data.type !== undefined){
let data25 = data.type;
if(typeof data25 !== "string"){
const err100 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[5].properties.type.type,parentSchema:schema47.oneOf[5].properties.type,data:data25};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
if("ollama" !== data25){
const err101 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant",schema:"ollama",parentSchema:schema47.oneOf[5].properties.type,data:data25};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
if(errors > 0){
const emErrs30 = [];
for(const err102 of vErrors){
if(!err102.emUsed){
emErrs30.push(err102);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
}
if(data.id !== undefined){
let data26 = data.id;
if(typeof data26 !== "string"){
const err103 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[5].properties.id.type,parentSchema:schema47.oneOf[5].properties.id,data:data26};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
if(errors > 0){
const emErrs31 = [];
for(const err104 of vErrors){
if(!err104.emUsed){
emErrs31.push(err104);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
}
if(data.name !== undefined){
let data27 = data.name;
if(typeof data27 !== "string"){
const err105 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[5].properties.name.type,parentSchema:schema47.oneOf[5].properties.name,data:data27};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if(errors > 0){
const emErrs32 = [];
for(const err106 of vErrors){
if(!err106.emUsed){
emErrs32.push(err106);
}
}
vErrors = emErrs32;
errors = emErrs32.length;
}
}
if(data.enabled !== undefined){
let data28 = data.enabled;
if(typeof data28 !== "boolean"){
const err107 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema47.oneOf[5].properties.enabled.type,parentSchema:schema47.oneOf[5].properties.enabled,data:data28};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(errors > 0){
const emErrs33 = [];
for(const err108 of vErrors){
if(!err108.emUsed){
emErrs33.push(err108);
}
}
vErrors = emErrs33;
errors = emErrs33.length;
}
}
if(data.apiKey !== undefined){
let data29 = data.apiKey;
if(typeof data29 !== "string"){
const err109 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[5].properties.apiKey.type,parentSchema:schema47.oneOf[5].properties.apiKey,data:data29};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if(errors > 0){
const emErrs34 = [];
for(const err110 of vErrors){
if(!err110.emUsed){
emErrs34.push(err110);
}
}
vErrors = emErrs34;
errors = emErrs34.length;
}
}
if(data.baseURL !== undefined){
let data30 = data.baseURL;
if(typeof data30 !== "string"){
const err111 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[5].properties.baseURL.type,parentSchema:schema47.oneOf[5].properties.baseURL,data:data30};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
if(errors > 0){
const emErrs35 = [];
for(const err112 of vErrors){
if(!err112.emUsed){
emErrs35.push(err112);
}
}
vErrors = emErrs35;
errors = emErrs35.length;
}
}
}
else {
const err113 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema47.oneOf[5].type,parentSchema:schema47.oneOf[5],data};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
if(errors > 0){
const emErrors5 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"baseURL":[]}};
const templates5 = {required:{}};
let emPropParams5;
let emParamsErrors5;
for(const err114 of vErrors){
if((((((err114.keyword !== "errorMessage") && (!err114.emUsed)) && (err114.instancePath === instancePath)) && (err114.keyword in emErrors5)) && (err114.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5") === 0)) && (/^\/[^\/]*$/.test(err114.schemaPath.slice(88)))){
emPropParams5 = obj0[err114.keyword];
emParamsErrors5 = emErrors5[err114.keyword][err114.params[emPropParams5]];
if(emParamsErrors5){
emParamsErrors5.push(err114);
err114.emUsed = true;
}
}
}
for(const key5 in emErrors5){
for(const keyProp5 in emErrors5[key5]){
emParamsErrors5 = emErrors5[key5][keyProp5];
if(emParamsErrors5.length){
const tmpl5 = templates5[key5] && templates5[key5][keyProp5];
const err115 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors5},message:tmpl5 ? tmpl5() : schema47.oneOf[5].errorMessage[key5][keyProp5],schema:schema47.oneOf[5].errorMessage,parentSchema:schema47.oneOf[5],data};
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
const emErrs36 = [];
for(const err116 of vErrors){
if(!err116.emUsed){
emErrs36.push(err116);
}
}
vErrors = emErrs36;
errors = emErrs36.length;
}
var _valid0 = _errs63 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 5];
}
else {
if(_valid0){
valid1 = true;
passing0 = 5;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
props0.baseURL = true;
}
}
const _errs77 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err117 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema47.oneOf[6].required,parentSchema:schema47.oneOf[6],data};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
if(data.name === undefined){
const err118 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema47.oneOf[6].required,parentSchema:schema47.oneOf[6],data};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if(data.id === undefined){
const err119 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema47.oneOf[6].required,parentSchema:schema47.oneOf[6],data};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
if(data.enabled === undefined){
const err120 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema47.oneOf[6].required,parentSchema:schema47.oneOf[6],data};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
if(data.apiKey === undefined){
const err121 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "apiKey"},message:"must have required property '"+"apiKey"+"'",schema:schema47.oneOf[6].required,parentSchema:schema47.oneOf[6],data};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if(data.type !== undefined){
let data31 = data.type;
if(typeof data31 !== "string"){
const err122 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[6].properties.type.type,parentSchema:schema47.oneOf[6].properties.type,data:data31};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
if("scaleway" !== data31){
const err123 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "scaleway"},message:"must be equal to constant",schema:"scaleway",parentSchema:schema47.oneOf[6].properties.type,data:data31};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
if(errors > 0){
const emErrs37 = [];
for(const err124 of vErrors){
if(!err124.emUsed){
emErrs37.push(err124);
}
}
vErrors = emErrs37;
errors = emErrs37.length;
}
}
if(data.id !== undefined){
let data32 = data.id;
if(typeof data32 !== "string"){
const err125 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[6].properties.id.type,parentSchema:schema47.oneOf[6].properties.id,data:data32};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
if(errors > 0){
const emErrs38 = [];
for(const err126 of vErrors){
if(!err126.emUsed){
emErrs38.push(err126);
}
}
vErrors = emErrs38;
errors = emErrs38.length;
}
}
if(data.name !== undefined){
let data33 = data.name;
if(typeof data33 !== "string"){
const err127 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[6].properties.name.type,parentSchema:schema47.oneOf[6].properties.name,data:data33};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
if(errors > 0){
const emErrs39 = [];
for(const err128 of vErrors){
if(!err128.emUsed){
emErrs39.push(err128);
}
}
vErrors = emErrs39;
errors = emErrs39.length;
}
}
if(data.enabled !== undefined){
let data34 = data.enabled;
if(typeof data34 !== "boolean"){
const err129 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema47.oneOf[6].properties.enabled.type,parentSchema:schema47.oneOf[6].properties.enabled,data:data34};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
if(errors > 0){
const emErrs40 = [];
for(const err130 of vErrors){
if(!err130.emUsed){
emErrs40.push(err130);
}
}
vErrors = emErrs40;
errors = emErrs40.length;
}
}
if(data.apiKey !== undefined){
let data35 = data.apiKey;
if(typeof data35 !== "string"){
const err131 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[6].properties.apiKey.type,parentSchema:schema47.oneOf[6].properties.apiKey,data:data35};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
if(errors > 0){
const emErrs41 = [];
for(const err132 of vErrors){
if(!err132.emUsed){
emErrs41.push(err132);
}
}
vErrors = emErrs41;
errors = emErrs41.length;
}
}
if(data.projectId !== undefined){
let data36 = data.projectId;
if(typeof data36 !== "string"){
const err133 = {instancePath:instancePath+"/projectId",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/projectId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[6].properties.projectId.type,parentSchema:schema47.oneOf[6].properties.projectId,data:data36};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
if(errors > 0){
const emErrs42 = [];
for(const err134 of vErrors){
if(!err134.emUsed){
emErrs42.push(err134);
}
}
vErrors = emErrs42;
errors = emErrs42.length;
}
}
}
else {
const err135 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema47.oneOf[6].type,parentSchema:schema47.oneOf[6],data};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
if(errors > 0){
const emErrors6 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"apiKey":[]}};
const templates6 = {required:{}};
let emPropParams6;
let emParamsErrors6;
for(const err136 of vErrors){
if((((((err136.keyword !== "errorMessage") && (!err136.emUsed)) && (err136.instancePath === instancePath)) && (err136.keyword in emErrors6)) && (err136.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6") === 0)) && (/^\/[^\/]*$/.test(err136.schemaPath.slice(88)))){
emPropParams6 = obj0[err136.keyword];
emParamsErrors6 = emErrors6[err136.keyword][err136.params[emPropParams6]];
if(emParamsErrors6){
emParamsErrors6.push(err136);
err136.emUsed = true;
}
}
}
for(const key6 in emErrors6){
for(const keyProp6 in emErrors6[key6]){
emParamsErrors6 = emErrors6[key6][keyProp6];
if(emParamsErrors6.length){
const tmpl6 = templates6[key6] && templates6[key6][keyProp6];
const err137 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema47.oneOf[6].errorMessage[key6][keyProp6],schema:schema47.oneOf[6].errorMessage,parentSchema:schema47.oneOf[6],data};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
}
}
const emErrs43 = [];
for(const err138 of vErrors){
if(!err138.emUsed){
emErrs43.push(err138);
}
}
vErrors = emErrs43;
errors = emErrs43.length;
}
var _valid0 = _errs77 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 6];
}
else {
if(_valid0){
valid1 = true;
passing0 = 6;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
props0.projectId = true;
}
}
const _errs91 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err139 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema47.oneOf[7].required,parentSchema:schema47.oneOf[7],data};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
if(data.name === undefined){
const err140 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema47.oneOf[7].required,parentSchema:schema47.oneOf[7],data};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
if(data.id === undefined){
const err141 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema47.oneOf[7].required,parentSchema:schema47.oneOf[7],data};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
if(data.enabled === undefined){
const err142 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema47.oneOf[7].required,parentSchema:schema47.oneOf[7],data};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
if(data.baseURL === undefined){
const err143 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema47.oneOf[7].required,parentSchema:schema47.oneOf[7],data};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
if(data.type !== undefined){
let data37 = data.type;
if(typeof data37 !== "string"){
const err144 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[7].properties.type.type,parentSchema:schema47.oneOf[7].properties.type,data:data37};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
if("openai-compatible" !== data37){
const err145 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue: "openai-compatible"},message:"must be equal to constant",schema:"openai-compatible",parentSchema:schema47.oneOf[7].properties.type,data:data37};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
if(errors > 0){
const emErrs44 = [];
for(const err146 of vErrors){
if(!err146.emUsed){
emErrs44.push(err146);
}
}
vErrors = emErrs44;
errors = emErrs44.length;
}
}
if(data.id !== undefined){
let data38 = data.id;
if(typeof data38 !== "string"){
const err147 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[7].properties.id.type,parentSchema:schema47.oneOf[7].properties.id,data:data38};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
if(errors > 0){
const emErrs45 = [];
for(const err148 of vErrors){
if(!err148.emUsed){
emErrs45.push(err148);
}
}
vErrors = emErrs45;
errors = emErrs45.length;
}
}
if(data.name !== undefined){
let data39 = data.name;
if(typeof data39 !== "string"){
const err149 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[7].properties.name.type,parentSchema:schema47.oneOf[7].properties.name,data:data39};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
if(errors > 0){
const emErrs46 = [];
for(const err150 of vErrors){
if(!err150.emUsed){
emErrs46.push(err150);
}
}
vErrors = emErrs46;
errors = emErrs46.length;
}
}
if(data.enabled !== undefined){
let data40 = data.enabled;
if(typeof data40 !== "boolean"){
const err151 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema47.oneOf[7].properties.enabled.type,parentSchema:schema47.oneOf[7].properties.enabled,data:data40};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
if(errors > 0){
const emErrs47 = [];
for(const err152 of vErrors){
if(!err152.emUsed){
emErrs47.push(err152);
}
}
vErrors = emErrs47;
errors = emErrs47.length;
}
}
if(data.baseURL !== undefined){
let data41 = data.baseURL;
if(typeof data41 !== "string"){
const err153 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[7].properties.baseURL.type,parentSchema:schema47.oneOf[7].properties.baseURL,data:data41};
if(vErrors === null){
vErrors = [err153];
}
else {
vErrors.push(err153);
}
errors++;
}
if(errors > 0){
const emErrs48 = [];
for(const err154 of vErrors){
if(!err154.emUsed){
emErrs48.push(err154);
}
}
vErrors = emErrs48;
errors = emErrs48.length;
}
}
if(data.apiKey !== undefined){
let data42 = data.apiKey;
if(typeof data42 !== "string"){
const err155 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[7].properties.apiKey.type,parentSchema:schema47.oneOf[7].properties.apiKey,data:data42};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
if(errors > 0){
const emErrs49 = [];
for(const err156 of vErrors){
if(!err156.emUsed){
emErrs49.push(err156);
}
}
vErrors = emErrs49;
errors = emErrs49.length;
}
}
if(data.compatibility !== undefined){
let data43 = data.compatibility;
if(typeof data43 !== "string"){
const err157 = {instancePath:instancePath+"/compatibility",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/compatibility/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[7].properties.compatibility.type,parentSchema:schema47.oneOf[7].properties.compatibility,data:data43};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
if(!((data43 === "default") || (data43 === "compatible"))){
const err158 = {instancePath:instancePath+"/compatibility",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/compatibility/enum",keyword:"enum",params:{allowedValues: schema47.oneOf[7].properties.compatibility.enum},message:"must be equal to one of the allowed values",schema:schema47.oneOf[7].properties.compatibility.enum,parentSchema:schema47.oneOf[7].properties.compatibility,data:data43};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
if(errors > 0){
const emErrs50 = [];
for(const err159 of vErrors){
if(!err159.emUsed){
emErrs50.push(err159);
}
}
vErrors = emErrs50;
errors = emErrs50.length;
}
}
}
else {
const err160 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema47.oneOf[7].type,parentSchema:schema47.oneOf[7],data};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
if(errors > 0){
const emErrors7 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"baseURL":[]}};
const templates7 = {required:{}};
let emPropParams7;
let emParamsErrors7;
for(const err161 of vErrors){
if((((((err161.keyword !== "errorMessage") && (!err161.emUsed)) && (err161.instancePath === instancePath)) && (err161.keyword in emErrors7)) && (err161.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7") === 0)) && (/^\/[^\/]*$/.test(err161.schemaPath.slice(88)))){
emPropParams7 = obj0[err161.keyword];
emParamsErrors7 = emErrors7[err161.keyword][err161.params[emPropParams7]];
if(emParamsErrors7){
emParamsErrors7.push(err161);
err161.emUsed = true;
}
}
}
for(const key7 in emErrors7){
for(const keyProp7 in emErrors7[key7]){
emParamsErrors7 = emErrors7[key7][keyProp7];
if(emParamsErrors7.length){
const tmpl7 = templates7[key7] && templates7[key7][keyProp7];
const err162 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors7},message:tmpl7 ? tmpl7() : schema47.oneOf[7].errorMessage[key7][keyProp7],schema:schema47.oneOf[7].errorMessage,parentSchema:schema47.oneOf[7],data};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
}
}
const emErrs51 = [];
for(const err163 of vErrors){
if(!err163.emUsed){
emErrs51.push(err163);
}
}
vErrors = emErrs51;
errors = emErrs51.length;
}
var _valid0 = _errs91 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 7];
}
else {
if(_valid0){
valid1 = true;
passing0 = 7;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.baseURL = true;
props0.apiKey = true;
props0.compatibility = true;
}
}
const _errs107 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err164 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema47.oneOf[8].required,parentSchema:schema47.oneOf[8],data};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
if(data.name === undefined){
const err165 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema47.oneOf[8].required,parentSchema:schema47.oneOf[8],data};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
if(data.id === undefined){
const err166 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema47.oneOf[8].required,parentSchema:schema47.oneOf[8],data};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
if(data.enabled === undefined){
const err167 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema47.oneOf[8].required,parentSchema:schema47.oneOf[8],data};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
if(data.type !== undefined){
let data44 = data.type;
if(typeof data44 !== "string"){
const err168 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[8].properties.type.type,parentSchema:schema47.oneOf[8].properties.type,data:data44};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
if("mock" !== data44){
const err169 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema47.oneOf[8].properties.type,data:data44};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
if(errors > 0){
const emErrs52 = [];
for(const err170 of vErrors){
if(!err170.emUsed){
emErrs52.push(err170);
}
}
vErrors = emErrs52;
errors = emErrs52.length;
}
}
if(data.id !== undefined){
let data45 = data.id;
if(typeof data45 !== "string"){
const err171 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[8].properties.id.type,parentSchema:schema47.oneOf[8].properties.id,data:data45};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
if(errors > 0){
const emErrs53 = [];
for(const err172 of vErrors){
if(!err172.emUsed){
emErrs53.push(err172);
}
}
vErrors = emErrs53;
errors = emErrs53.length;
}
}
if(data.name !== undefined){
let data46 = data.name;
if(typeof data46 !== "string"){
const err173 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema47.oneOf[8].properties.name.type,parentSchema:schema47.oneOf[8].properties.name,data:data46};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
}
errors++;
}
if(errors > 0){
const emErrs54 = [];
for(const err174 of vErrors){
if(!err174.emUsed){
emErrs54.push(err174);
}
}
vErrors = emErrs54;
errors = emErrs54.length;
}
}
if(data.enabled !== undefined){
let data47 = data.enabled;
if(typeof data47 !== "boolean"){
const err175 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema47.oneOf[8].properties.enabled.type,parentSchema:schema47.oneOf[8].properties.enabled,data:data47};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
if(errors > 0){
const emErrs55 = [];
for(const err176 of vErrors){
if(!err176.emUsed){
emErrs55.push(err176);
}
}
vErrors = emErrs55;
errors = emErrs55.length;
}
}
}
else {
const err177 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema47.oneOf[8].type,parentSchema:schema47.oneOf[8],data};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
}
if(errors > 0){
const emErrors8 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates8 = {required:{}};
let emPropParams8;
let emParamsErrors8;
for(const err178 of vErrors){
if((((((err178.keyword !== "errorMessage") && (!err178.emUsed)) && (err178.instancePath === instancePath)) && (err178.keyword in emErrors8)) && (err178.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8") === 0)) && (/^\/[^\/]*$/.test(err178.schemaPath.slice(88)))){
emPropParams8 = obj0[err178.keyword];
emParamsErrors8 = emErrors8[err178.keyword][err178.params[emPropParams8]];
if(emParamsErrors8){
emParamsErrors8.push(err178);
err178.emUsed = true;
}
}
}
for(const key8 in emErrors8){
for(const keyProp8 in emErrors8[key8]){
emParamsErrors8 = emErrors8[key8][keyProp8];
if(emParamsErrors8.length){
const tmpl8 = templates8[key8] && templates8[key8][keyProp8];
const err179 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors8},message:tmpl8 ? tmpl8() : schema47.oneOf[8].errorMessage[key8][keyProp8],schema:schema47.oneOf[8].errorMessage,parentSchema:schema47.oneOf[8],data};
if(vErrors === null){
vErrors = [err179];
}
else {
vErrors.push(err179);
}
errors++;
}
}
}
const emErrs56 = [];
for(const err180 of vErrors){
if(!err180.emUsed){
emErrs56.push(err180);
}
}
vErrors = emErrs56;
errors = emErrs56.length;
}
var _valid0 = _errs107 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 8];
}
else {
if(_valid0){
valid1 = true;
passing0 = 8;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
}
}
}
}
}
}
}
}
}
}
if(!valid1){
const err181 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema47.oneOf,parentSchema:schema47,data};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
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
for(const key9 in data){
if(!props0 || !props0[key9]){
const err182 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/unevaluatedProperties",keyword:"unevaluatedProperties",params:{unevaluatedProperty: key9},message:"must NOT have unevaluated properties",schema:false,parentSchema:schema47,data};
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
}
else {
const err183 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema47.type,parentSchema:schema47,data};
if(vErrors === null){
vErrors = [err183];
}
else {
vErrors.push(err183);
}
errors++;
}
if(errors > 0){
const emErrors9 = {"oneOf":[]};
const templates9 = {};
for(const err184 of vErrors){
if((((((err184.keyword !== "errorMessage") && (!err184.emUsed)) && (err184.instancePath === instancePath)) && (err184.keyword in emErrors9)) && (err184.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/providers/items") === 0)) && (/^\/[^\/]*$/.test(err184.schemaPath.slice(80)))){
emErrors9[err184.keyword].push(err184);
err184.emUsed = true;
}
}
for(const key10 in emErrors9){
if(emErrors9[key10].length){
const err185 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors9[key10]},message:key10 in templates9 ? templates9[key10]() : schema47.errorMessage[key10],schema:schema47.errorMessage,parentSchema:schema47,data};
if(vErrors === null){
vErrors = [err185];
}
else {
vErrors.push(err185);
}
errors++;
}
}
const emErrs57 = [];
for(const err186 of vErrors){
if(!err186.emUsed){
emErrs57.push(err186);
}
}
vErrors = emErrs57;
errors = emErrs57.length;
}
validate32.errors = vErrors;
return errors === 0;
}
validate32.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema48 = {"$id":"export10","$ref":"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items"};
const schema49 = {"type":"string","oneOf":[{"const":"assistant","title":"Assistant"},{"const":"tools","title":"Outils"},{"const":"summarizer","title":"Résumeur"},{"const":"evaluator","title":"Évaluateur"},{"const":"moderator","title":"Modérateur"}],"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items","errorMessage":{"oneOf":"choisissez une valeur"}};

function validate33(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export10" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate33.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data !== "string"){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema49.type,parentSchema:schema49,data};
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
if("assistant" !== data){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items/oneOf/0/const",keyword:"const",params:{allowedValue: "assistant"},message:"must be equal to constant",schema:"assistant",parentSchema:schema49.oneOf[0],data};
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
if("tools" !== data){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items/oneOf/1/const",keyword:"const",params:{allowedValue: "tools"},message:"must be equal to constant",schema:"tools",parentSchema:schema49.oneOf[1],data};
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
if("summarizer" !== data){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items/oneOf/2/const",keyword:"const",params:{allowedValue: "summarizer"},message:"must be equal to constant",schema:"summarizer",parentSchema:schema49.oneOf[2],data};
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
if("evaluator" !== data){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items/oneOf/3/const",keyword:"const",params:{allowedValue: "evaluator"},message:"must be equal to constant",schema:"evaluator",parentSchema:schema49.oneOf[3],data};
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
if("moderator" !== data){
const err5 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items/oneOf/4/const",keyword:"const",params:{allowedValue: "moderator"},message:"must be equal to constant",schema:"moderator",parentSchema:schema49.oneOf[4],data};
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
const err6 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema49.oneOf,parentSchema:schema49,data};
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
if((((((err7.keyword !== "errorMessage") && (!err7.emUsed)) && (err7.instancePath === instancePath)) && (err7.keyword in emErrors0)) && (err7.schemaPath.indexOf("https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items") === 0)) && (/^\/[^\/]*$/.test(err7.schemaPath.slice(100)))){
emErrors0[err7.keyword].push(err7);
err7.emUsed = true;
}
}
for(const key0 in emErrors0){
if(emErrors0[key0].length){
const err8 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors0[key0]},message:key0 in templates0 ? templates0[key0]() : schema49.errorMessage[key0],schema:schema49.errorMessage,parentSchema:schema49,data};
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
validate33.errors = vErrors;
return errors === 0;
}
validate33.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema50 = {"$id":"export11","$ref":"https://github.com/data-fair/agents/settings/put-req#/properties/models/items"};
const schema51 = {"type":"object","additionalProperties":false,"required":["model","usage"],"properties":{"model":{"$ref":"#/definitions/Model","title":"Modèle","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}},"usage":{"type":"array","uniqueItems":true,"minItems":1,"title":"Usages appropriés","items":{"type":"string","oneOf":[{"const":"assistant","title":"Assistant"},{"const":"tools","title":"Outils"},{"const":"summarizer","title":"Résumeur"},{"const":"evaluator","title":"Évaluateur"},{"const":"moderator","title":"Modérateur"}],"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items","errorMessage":{"oneOf":"choisissez une valeur"}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage","errorMessage":{}},"multiplier":{"type":"number","minimum":0,"default":1,"title":"Multiplicateur de crédits","description":"crédits = (tokens d'entrée + tokens de sortie × poids de sortie) / 1M × multiplicateur","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/multiplier","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/models/items","errorMessage":{"required":{"model":"information obligatoire","usage":"information obligatoire"}}};
const schema28 = {"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${(rootData.providers || []).map(p => p.id).join(\",\")}","pure":false,"dataAlias":"value","ref":18},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":21},"itemTitle":{"type":"js-eval","expr":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","pure":true,"dataAlias":"item","ref":19},"itemKey":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":20},"returnObjects":true}},"properties":{"id":{"type":"string","title":"Model ID","__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/id","errorMessage":{}},"name":{"type":"string","title":"Name","__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/name","errorMessage":{}},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type","__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/type","errorMessage":{}},"name":{"type":"string","title":"Provider Name","__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/name","errorMessage":{}},"id":{"type":"string","title":"Provider ID","__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/id","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider","errorMessage":{"required":{"type":"information obligatoire","name":"information obligatoire","id":"information obligatoire"}}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}};

function validate35(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate35.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.model === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "model"},message:"must have required property '"+"model"+"'",schema:schema51.required,parentSchema:schema51,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.usage === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "usage"},message:"must have required property '"+"usage"+"'",schema:schema51.required,parentSchema:schema51,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "model") || (key0 === "usage")) || (key0 === "multiplier"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema51,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.model !== undefined){
let data0 = data.model;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.id === undefined){
const err3 = {instancePath:instancePath+"/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data0};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data0.name === undefined){
const err4 = {instancePath:instancePath+"/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data0.provider === undefined){
const err5 = {instancePath:instancePath+"/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data0.id !== undefined){
let data1 = data0.id;
if(typeof data1 !== "string"){
const err6 = {instancePath:instancePath+"/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data1};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err7 of vErrors){
if(!err7.emUsed){
emErrs0.push(err7);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data0.name !== undefined){
let data2 = data0.name;
if(typeof data2 !== "string"){
const err8 = {instancePath:instancePath+"/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data2};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err9 of vErrors){
if(!err9.emUsed){
emErrs1.push(err9);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data0.provider !== undefined){
let data3 = data0.provider;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.type === undefined){
const err10 = {instancePath:instancePath+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data3};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data3.name === undefined){
const err11 = {instancePath:instancePath+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data3};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data3.id === undefined){
const err12 = {instancePath:instancePath+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data3};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data3.type !== undefined){
let data4 = data3.type;
if(typeof data4 !== "string"){
const err13 = {instancePath:instancePath+"/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data4};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err14 of vErrors){
if(!err14.emUsed){
emErrs2.push(err14);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data3.name !== undefined){
let data5 = data3.name;
if(typeof data5 !== "string"){
const err15 = {instancePath:instancePath+"/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data5};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(errors > 0){
const emErrs3 = [];
for(const err16 of vErrors){
if(!err16.emUsed){
emErrs3.push(err16);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data3.id !== undefined){
let data6 = data3.id;
if(typeof data6 !== "string"){
const err17 = {instancePath:instancePath+"/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data6};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err18 of vErrors){
if(!err18.emUsed){
emErrs4.push(err18);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
}
else {
const err19 = {instancePath:instancePath+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data3};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"type":[],"name":[],"id":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err20 of vErrors){
if((((((err20.keyword !== "errorMessage") && (!err20.emUsed)) && (err20.instancePath === instancePath+"/model/provider")) && (err20.keyword in emErrors0)) && (err20.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err20.schemaPath.slice(39)))){
emPropParams0 = obj0[err20.keyword];
emParamsErrors0 = emErrors0[err20.keyword][err20.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err20);
err20.emUsed = true;
}
}
}
for(const key1 in emErrors0){
for(const keyProp0 in emErrors0[key1]){
emParamsErrors0 = emErrors0[key1][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key1] && templates0[key1][keyProp0];
const err21 = {instancePath:instancePath+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema28.properties.provider.errorMessage[key1][keyProp0],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data3};
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
const emErrs5 = [];
for(const err22 of vErrors){
if(!err22.emUsed){
emErrs5.push(err22);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
}
else {
const err23 = {instancePath:instancePath+"/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data0};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"id":[],"name":[],"provider":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err24 of vErrors){
if((((((err24.keyword !== "errorMessage") && (!err24.emUsed)) && (err24.instancePath === instancePath+"/model")) && (err24.keyword in emErrors1)) && (err24.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err24.schemaPath.slice(19)))){
emPropParams1 = obj0[err24.keyword];
emParamsErrors1 = emErrors1[err24.keyword][err24.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err24);
err24.emUsed = true;
}
}
}
for(const key2 in emErrors1){
for(const keyProp1 in emErrors1[key2]){
emParamsErrors1 = emErrors1[key2][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key2] && templates1[key2][keyProp1];
const err25 = {instancePath:instancePath+"/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema28.errorMessage[key2][keyProp1],schema:schema28.errorMessage,parentSchema:schema28,data:data0};
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
const emErrs6 = [];
for(const err26 of vErrors){
if(!err26.emUsed){
emErrs6.push(err26);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
if(errors > 0){
const emErrors2 = {"required":{"id":[],"name":[],"provider":[]}};
const templates2 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err27 of vErrors){
if((((((err27.keyword !== "errorMessage") && (!err27.emUsed)) && (err27.instancePath === instancePath+"/model")) && (err27.keyword in emErrors2)) && (err27.schemaPath.indexOf("#/properties/model") === 0)) && (/^\/[^\/]*$/.test(err27.schemaPath.slice(18)))){
emPropParams2 = obj0[err27.keyword];
emParamsErrors2 = emErrors2[err27.keyword][err27.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err27);
err27.emUsed = true;
}
}
}
for(const key3 in emErrors2){
for(const keyProp2 in emErrors2[key3]){
emParamsErrors2 = emErrors2[key3][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates2[key3] && templates2[key3][keyProp2];
const err28 = {instancePath:instancePath+"/model",schemaPath:"#/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema51.properties.model.errorMessage[key3][keyProp2],schema:schema51.properties.model.errorMessage,parentSchema:schema51.properties.model,data:data0};
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
const emErrs7 = [];
for(const err29 of vErrors){
if(!err29.emUsed){
emErrs7.push(err29);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data.usage !== undefined){
let data7 = data.usage;
if(Array.isArray(data7)){
if(data7.length < 1){
const err30 = {instancePath:instancePath+"/usage",schemaPath:"#/properties/usage/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items",schema:1,parentSchema:schema51.properties.usage,data:data7};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
if(typeof data8 !== "string"){
const err31 = {instancePath:instancePath+"/usage/" + i0,schemaPath:"#/properties/usage/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema51.properties.usage.items.type,parentSchema:schema51.properties.usage.items,data:data8};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
const _errs21 = errors;
let valid6 = false;
let passing0 = null;
const _errs22 = errors;
if("assistant" !== data8){
const err32 = {instancePath:instancePath+"/usage/" + i0,schemaPath:"#/properties/usage/items/oneOf/0/const",keyword:"const",params:{allowedValue: "assistant"},message:"must be equal to constant",schema:"assistant",parentSchema:schema51.properties.usage.items.oneOf[0],data:data8};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
var _valid0 = _errs22 === errors;
if(_valid0){
valid6 = true;
passing0 = 0;
}
const _errs23 = errors;
if("tools" !== data8){
const err33 = {instancePath:instancePath+"/usage/" + i0,schemaPath:"#/properties/usage/items/oneOf/1/const",keyword:"const",params:{allowedValue: "tools"},message:"must be equal to constant",schema:"tools",parentSchema:schema51.properties.usage.items.oneOf[1],data:data8};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
var _valid0 = _errs23 === errors;
if(_valid0 && valid6){
valid6 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid6 = true;
passing0 = 1;
}
const _errs24 = errors;
if("summarizer" !== data8){
const err34 = {instancePath:instancePath+"/usage/" + i0,schemaPath:"#/properties/usage/items/oneOf/2/const",keyword:"const",params:{allowedValue: "summarizer"},message:"must be equal to constant",schema:"summarizer",parentSchema:schema51.properties.usage.items.oneOf[2],data:data8};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
var _valid0 = _errs24 === errors;
if(_valid0 && valid6){
valid6 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid6 = true;
passing0 = 2;
}
const _errs25 = errors;
if("evaluator" !== data8){
const err35 = {instancePath:instancePath+"/usage/" + i0,schemaPath:"#/properties/usage/items/oneOf/3/const",keyword:"const",params:{allowedValue: "evaluator"},message:"must be equal to constant",schema:"evaluator",parentSchema:schema51.properties.usage.items.oneOf[3],data:data8};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
var _valid0 = _errs25 === errors;
if(_valid0 && valid6){
valid6 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid6 = true;
passing0 = 3;
}
const _errs26 = errors;
if("moderator" !== data8){
const err36 = {instancePath:instancePath+"/usage/" + i0,schemaPath:"#/properties/usage/items/oneOf/4/const",keyword:"const",params:{allowedValue: "moderator"},message:"must be equal to constant",schema:"moderator",parentSchema:schema51.properties.usage.items.oneOf[4],data:data8};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
var _valid0 = _errs26 === errors;
if(_valid0 && valid6){
valid6 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid6 = true;
passing0 = 4;
}
}
}
}
}
if(!valid6){
const err37 = {instancePath:instancePath+"/usage/" + i0,schemaPath:"#/properties/usage/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema51.properties.usage.items.oneOf,parentSchema:schema51.properties.usage.items,data:data8};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
else {
errors = _errs21;
if(vErrors !== null){
if(_errs21){
vErrors.length = _errs21;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors3 = {"oneOf":[]};
const templates3 = {};
for(const err38 of vErrors){
if((((((err38.keyword !== "errorMessage") && (!err38.emUsed)) && (err38.instancePath === instancePath+"/usage/" + i0)) && (err38.keyword in emErrors3)) && (err38.schemaPath.indexOf("#/properties/usage/items") === 0)) && (/^\/[^\/]*$/.test(err38.schemaPath.slice(24)))){
emErrors3[err38.keyword].push(err38);
err38.emUsed = true;
}
}
for(const key4 in emErrors3){
if(emErrors3[key4].length){
const err39 = {instancePath:instancePath+"/usage/" + i0,schemaPath:"#/properties/usage/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors3[key4]},message:key4 in templates3 ? templates3[key4]() : schema51.properties.usage.items.errorMessage[key4],schema:schema51.properties.usage.items.errorMessage,parentSchema:schema51.properties.usage.items,data:data8};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
const emErrs8 = [];
for(const err40 of vErrors){
if(!err40.emUsed){
emErrs8.push(err40);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
let i1 = data7.length;
let j0;
if(i1 > 1){
const indices0 = {};
for(;i1--;){
let item0 = data7[i1];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err41 = {instancePath:instancePath+"/usage",schemaPath:"#/properties/usage/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)",schema:true,parentSchema:schema51.properties.usage,data:data7};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err42 = {instancePath:instancePath+"/usage",schemaPath:"#/properties/usage/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema51.properties.usage.type,parentSchema:schema51.properties.usage,data:data7};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err43 of vErrors){
if(!err43.emUsed){
emErrs9.push(err43);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
if(data.multiplier !== undefined){
let data9 = data.multiplier;
if(typeof data9 == "number"){
if(data9 < 0 || isNaN(data9)){
const err44 = {instancePath:instancePath+"/multiplier",schemaPath:"#/properties/multiplier/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema51.properties.multiplier,data:data9};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
else {
const err45 = {instancePath:instancePath+"/multiplier",schemaPath:"#/properties/multiplier/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema51.properties.multiplier.type,parentSchema:schema51.properties.multiplier,data:data9};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err46 of vErrors){
if(!err46.emUsed){
emErrs10.push(err46);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
}
else {
const err47 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema51.type,parentSchema:schema51,data};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(errors > 0){
const emErrors4 = {"required":{"model":[],"usage":[]}};
const templates4 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err48 of vErrors){
if((((((err48.keyword !== "errorMessage") && (!err48.emUsed)) && (err48.instancePath === instancePath)) && (err48.keyword in emErrors4)) && (err48.schemaPath.indexOf("#") === 0)) && (/^\/[^\/]*$/.test(err48.schemaPath.slice(1)))){
emPropParams3 = obj0[err48.keyword];
emParamsErrors3 = emErrors4[err48.keyword][err48.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err48);
err48.emUsed = true;
}
}
}
for(const key5 in emErrors4){
for(const keyProp3 in emErrors4[key5]){
emParamsErrors3 = emErrors4[key5][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates4[key5] && templates4[key5][keyProp3];
const err49 = {instancePath,schemaPath:"#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema51.errorMessage[key5][keyProp3],schema:schema51.errorMessage,parentSchema:schema51,data};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
}
const emErrs11 = [];
for(const err50 of vErrors){
if(!err50.emUsed){
emErrs11.push(err50);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
validate35.errors = vErrors;
return errors === 0;
}
validate35.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate34(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export11" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate34.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate35(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate35.errors : vErrors.concat(validate35.errors);
errors = vErrors.length;
}
validate34.errors = vErrors;
return errors === 0;
}
validate34.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema53 = {"$id":"export12","$ref":"https://github.com/data-fair/agents/settings/put-req#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/settings/put-req","title":"Paramètres","x-exports":["validate","types","vjsf"],"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"required":["providers"],"layout":{"title":null},"definitions":{"Model":{"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${(rootData.providers || []).map(p => p.id).join(\",\")}","pure":false,"dataAlias":"value","ref":18},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":21},"itemTitle":{"type":"js-eval","expr":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","pure":true,"dataAlias":"item","ref":19},"itemKey":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":20},"returnObjects":true}},"properties":{"id":{"type":"string","title":"Model ID","__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/id","errorMessage":{}},"name":{"type":"string","title":"Name","__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/name","errorMessage":{}},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type","__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/type","errorMessage":{}},"name":{"type":"string","title":"Provider Name","__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/name","errorMessage":{}},"id":{"type":"string","title":"Provider ID","__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/id","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider","errorMessage":{"required":{"type":"information obligatoire","name":"information obligatoire","id":"information obligatoire"}}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/definitions/Model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}}},"properties":{"providers":{"type":"array","title":"Fournisseurs IA","layout":{"itemTitle":"item ? `${item.name || \"\"} - ${item.id.slice(0, 8)}` : \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","title":"Fournisseur","unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}},{"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","description":"Pour une clé API liée à un Projet Scaleway spécifique, renseignez l'ID du projet afin que les requêtes ciblent ce projet. Laissez vide pour utiliser le projet par défaut de l'organisation.","properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Scaleway\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/apiKey","errorMessage":{}},"projectId":{"type":"string","title":"ID du projet","description":"Optionnel. L'ID du Projet Scaleway (UUID) auquel la clé API est liée. Requis lorsque la clé n'a accès qu'à un projet spécifique, sinon le listing des modèles et l'inférence renvoient une erreur 403.","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/projectId","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","apiKey":"information obligatoire"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Compatible OpenAI","description":"Fournisseur générique pour tout endpoint compatible OpenAI (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). La clé API est optionnelle pour les serveurs locaux sans authentification.","properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenAI Compatible\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/enabled","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/apiKey","errorMessage":{}},"compatibility":{"type":"string","title":"Mode de compatibilité","description":"Utilisez \"compatible\" pour les fournisseurs qui ne supportent pas le nouveau endpoint /v1/responses (ex: LiteLLM, anciennes APIs compatibles OpenAI). Laissez vide pour le comportement OpenAI standard.","enum":["default","compatible"],"default":"default","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/compatibility","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}}],"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers/items","errorMessage":{"oneOf":"choisissez une valeur"}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/providers","errorMessage":{}},"models":{"type":"array","title":"Modèles","default":[],"layout":{"if":"parent.data.providers?.length","itemTitle":"item?.model ? `${item.model.name} (${item.usage?.join(\", \")})` : \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","additionalProperties":false,"required":["model","usage"],"properties":{"model":{"$ref":"#/definitions/Model","title":"Modèle","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}},"usage":{"type":"array","uniqueItems":true,"minItems":1,"title":"Usages appropriés","items":{"type":"string","oneOf":[{"const":"assistant","title":"Assistant"},{"const":"tools","title":"Outils"},{"const":"summarizer","title":"Résumeur"},{"const":"evaluator","title":"Évaluateur"},{"const":"moderator","title":"Modérateur"}],"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items","errorMessage":{"oneOf":"choisissez une valeur"}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage","errorMessage":{}},"multiplier":{"type":"number","minimum":0,"default":1,"title":"Multiplicateur de crédits","description":"crédits = (tokens d'entrée + tokens de sortie × poids de sortie) / 1M × multiplicateur","__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/multiplier","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/models/items","errorMessage":{"required":{"model":"information obligatoire","usage":"information obligatoire"}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#/properties/models","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/put-req#","errorMessage":{"required":{"providers":"information obligatoire"}}};

function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://github.com/data-fair/agents/settings/put-req" */;
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
if(data.providers === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "providers"},message:"must have required property '"+"providers"+"'",schema:schema27.required,parentSchema:schema27,data};
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
const err1 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
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
const _errs6 = errors;
let valid3 = false;
let passing0 = null;
const _errs7 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err2 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data1};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data1.name === undefined){
const err3 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data1};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data1.id === undefined){
const err4 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data1};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data1.enabled === undefined){
const err5 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data1};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data1.type !== undefined){
let data2 = data1.type;
if(typeof data2 !== "string"){
const err6 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.type,data:data2};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if("openai" !== data2){
const err7 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema27.properties.providers.items.oneOf[0].properties.type,data:data2};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err8 of vErrors){
if(!err8.emUsed){
emErrs0.push(err8);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data1.id !== undefined){
let data3 = data1.id;
if(typeof data3 !== "string"){
const err9 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.id,data:data3};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err10 of vErrors){
if(!err10.emUsed){
emErrs1.push(err10);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data1.name !== undefined){
let data4 = data1.name;
if(typeof data4 !== "string"){
const err11 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.name,data:data4};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err12 of vErrors){
if(!err12.emUsed){
emErrs2.push(err12);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data1.enabled !== undefined){
let data5 = data1.enabled;
if(typeof data5 !== "boolean"){
const err13 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[0].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.enabled,data:data5};
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
if(data1.apiKey !== undefined){
let data6 = data1.apiKey;
if(typeof data6 !== "string"){
const err15 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.apiKey,data:data6};
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
const err17 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[0].type,parentSchema:schema27.properties.providers.items.oneOf[0],data:data1};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err18 of vErrors){
if((((((err18.keyword !== "errorMessage") && (!err18.emUsed)) && (err18.instancePath === instancePath+"/providers/" + i0)) && (err18.keyword in emErrors0)) && (err18.schemaPath.indexOf("#/properties/providers/items/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err18.schemaPath.slice(36)))){
emPropParams0 = obj0[err18.keyword];
emParamsErrors0 = emErrors0[err18.keyword][err18.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err18);
err18.emUsed = true;
}
}
}
for(const key1 in emErrors0){
for(const keyProp0 in emErrors0[key1]){
emParamsErrors0 = emErrors0[key1][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key1] && templates0[key1][keyProp0];
const err19 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.providers.items.oneOf[0].errorMessage[key1][keyProp0],schema:schema27.properties.providers.items.oneOf[0].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[0],data:data1};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
}
const emErrs5 = [];
for(const err20 of vErrors){
if(!err20.emUsed){
emErrs5.push(err20);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
var _valid0 = _errs7 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
var props0 = {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
const _errs19 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err21 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data1};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data1.name === undefined){
const err22 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data1};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data1.id === undefined){
const err23 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data1};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data1.enabled === undefined){
const err24 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data1};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data1.type !== undefined){
let data7 = data1.type;
if(typeof data7 !== "string"){
const err25 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.type,data:data7};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if("anthropic" !== data7){
const err26 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant",schema:"anthropic",parentSchema:schema27.properties.providers.items.oneOf[1].properties.type,data:data7};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(errors > 0){
const emErrs6 = [];
for(const err27 of vErrors){
if(!err27.emUsed){
emErrs6.push(err27);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
if(data1.id !== undefined){
let data8 = data1.id;
if(typeof data8 !== "string"){
const err28 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.id,data:data8};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err29 of vErrors){
if(!err29.emUsed){
emErrs7.push(err29);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data1.name !== undefined){
let data9 = data1.name;
if(typeof data9 !== "string"){
const err30 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.name,data:data9};
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
if(data1.enabled !== undefined){
let data10 = data1.enabled;
if(typeof data10 !== "boolean"){
const err32 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[1].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.enabled,data:data10};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err33 of vErrors){
if(!err33.emUsed){
emErrs9.push(err33);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
if(data1.apiKey !== undefined){
let data11 = data1.apiKey;
if(typeof data11 !== "string"){
const err34 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.apiKey,data:data11};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err35 of vErrors){
if(!err35.emUsed){
emErrs10.push(err35);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
}
else {
const err36 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[1].type,parentSchema:schema27.properties.providers.items.oneOf[1],data:data1};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err37 of vErrors){
if((((((err37.keyword !== "errorMessage") && (!err37.emUsed)) && (err37.instancePath === instancePath+"/providers/" + i0)) && (err37.keyword in emErrors1)) && (err37.schemaPath.indexOf("#/properties/providers/items/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err37.schemaPath.slice(36)))){
emPropParams1 = obj0[err37.keyword];
emParamsErrors1 = emErrors1[err37.keyword][err37.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err37);
err37.emUsed = true;
}
}
}
for(const key2 in emErrors1){
for(const keyProp1 in emErrors1[key2]){
emParamsErrors1 = emErrors1[key2][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key2] && templates1[key2][keyProp1];
const err38 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.properties.providers.items.oneOf[1].errorMessage[key2][keyProp1],schema:schema27.properties.providers.items.oneOf[1].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[1],data:data1};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
}
const emErrs11 = [];
for(const err39 of vErrors){
if(!err39.emUsed){
emErrs11.push(err39);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
var _valid0 = _errs19 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid3 = true;
passing0 = 1;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
}
const _errs31 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err40 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data1};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data1.name === undefined){
const err41 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data1};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data1.id === undefined){
const err42 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data1};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(data1.enabled === undefined){
const err43 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data1};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(data1.type !== undefined){
let data12 = data1.type;
if(typeof data12 !== "string"){
const err44 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.type,data:data12};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if("google" !== data12){
const err45 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant",schema:"google",parentSchema:schema27.properties.providers.items.oneOf[2].properties.type,data:data12};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err46 of vErrors){
if(!err46.emUsed){
emErrs12.push(err46);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
if(data1.id !== undefined){
let data13 = data1.id;
if(typeof data13 !== "string"){
const err47 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.id,data:data13};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(errors > 0){
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
if(data1.name !== undefined){
let data14 = data1.name;
if(typeof data14 !== "string"){
const err49 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.name,data:data14};
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
if(data1.enabled !== undefined){
let data15 = data1.enabled;
if(typeof data15 !== "boolean"){
const err51 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[2].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.enabled,data:data15};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(errors > 0){
const emErrs15 = [];
for(const err52 of vErrors){
if(!err52.emUsed){
emErrs15.push(err52);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
if(data1.apiKey !== undefined){
let data16 = data1.apiKey;
if(typeof data16 !== "string"){
const err53 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.apiKey,data:data16};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err54 of vErrors){
if(!err54.emUsed){
emErrs16.push(err54);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
}
else {
const err55 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[2].type,parentSchema:schema27.properties.providers.items.oneOf[2],data:data1};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates2 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err56 of vErrors){
if((((((err56.keyword !== "errorMessage") && (!err56.emUsed)) && (err56.instancePath === instancePath+"/providers/" + i0)) && (err56.keyword in emErrors2)) && (err56.schemaPath.indexOf("#/properties/providers/items/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err56.schemaPath.slice(36)))){
emPropParams2 = obj0[err56.keyword];
emParamsErrors2 = emErrors2[err56.keyword][err56.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err56);
err56.emUsed = true;
}
}
}
for(const key3 in emErrors2){
for(const keyProp2 in emErrors2[key3]){
emParamsErrors2 = emErrors2[key3][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates2[key3] && templates2[key3][keyProp2];
const err57 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema27.properties.providers.items.oneOf[2].errorMessage[key3][keyProp2],schema:schema27.properties.providers.items.oneOf[2].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[2],data:data1};
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
const emErrs17 = [];
for(const err58 of vErrors){
if(!err58.emUsed){
emErrs17.push(err58);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
var _valid0 = _errs31 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid3 = true;
passing0 = 2;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
}
const _errs43 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err59 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data1};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data1.name === undefined){
const err60 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data1};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data1.id === undefined){
const err61 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data1};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(data1.enabled === undefined){
const err62 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data1};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(data1.type !== undefined){
let data17 = data1.type;
if(typeof data17 !== "string"){
const err63 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.type,data:data17};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if("mistral" !== data17){
const err64 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant",schema:"mistral",parentSchema:schema27.properties.providers.items.oneOf[3].properties.type,data:data17};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(errors > 0){
const emErrs18 = [];
for(const err65 of vErrors){
if(!err65.emUsed){
emErrs18.push(err65);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
}
if(data1.id !== undefined){
let data18 = data1.id;
if(typeof data18 !== "string"){
const err66 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.id,data:data18};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(errors > 0){
const emErrs19 = [];
for(const err67 of vErrors){
if(!err67.emUsed){
emErrs19.push(err67);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
}
if(data1.name !== undefined){
let data19 = data1.name;
if(typeof data19 !== "string"){
const err68 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.name,data:data19};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err69 of vErrors){
if(!err69.emUsed){
emErrs20.push(err69);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
if(data1.enabled !== undefined){
let data20 = data1.enabled;
if(typeof data20 !== "boolean"){
const err70 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[3].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.enabled,data:data20};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(errors > 0){
const emErrs21 = [];
for(const err71 of vErrors){
if(!err71.emUsed){
emErrs21.push(err71);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
if(data1.apiKey !== undefined){
let data21 = data1.apiKey;
if(typeof data21 !== "string"){
const err72 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.apiKey,data:data21};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(errors > 0){
const emErrs22 = [];
for(const err73 of vErrors){
if(!err73.emUsed){
emErrs22.push(err73);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
}
}
else {
const err74 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[3].type,parentSchema:schema27.properties.providers.items.oneOf[3],data:data1};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(errors > 0){
const emErrors3 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates3 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err75 of vErrors){
if((((((err75.keyword !== "errorMessage") && (!err75.emUsed)) && (err75.instancePath === instancePath+"/providers/" + i0)) && (err75.keyword in emErrors3)) && (err75.schemaPath.indexOf("#/properties/providers/items/oneOf/3") === 0)) && (/^\/[^\/]*$/.test(err75.schemaPath.slice(36)))){
emPropParams3 = obj0[err75.keyword];
emParamsErrors3 = emErrors3[err75.keyword][err75.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err75);
err75.emUsed = true;
}
}
}
for(const key4 in emErrors3){
for(const keyProp3 in emErrors3[key4]){
emParamsErrors3 = emErrors3[key4][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates3[key4] && templates3[key4][keyProp3];
const err76 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema27.properties.providers.items.oneOf[3].errorMessage[key4][keyProp3],schema:schema27.properties.providers.items.oneOf[3].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[3],data:data1};
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
const emErrs23 = [];
for(const err77 of vErrors){
if(!err77.emUsed){
emErrs23.push(err77);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
var _valid0 = _errs43 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid3 = true;
passing0 = 3;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
}
const _errs55 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err78 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data1};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if(data1.name === undefined){
const err79 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data1};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(data1.id === undefined){
const err80 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data1};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(data1.enabled === undefined){
const err81 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data1};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(data1.type !== undefined){
let data22 = data1.type;
if(typeof data22 !== "string"){
const err82 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.type,data:data22};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if("openrouter" !== data22){
const err83 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant",schema:"openrouter",parentSchema:schema27.properties.providers.items.oneOf[4].properties.type,data:data22};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(errors > 0){
const emErrs24 = [];
for(const err84 of vErrors){
if(!err84.emUsed){
emErrs24.push(err84);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
if(data1.id !== undefined){
let data23 = data1.id;
if(typeof data23 !== "string"){
const err85 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.id,data:data23};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err86 of vErrors){
if(!err86.emUsed){
emErrs25.push(err86);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
if(data1.name !== undefined){
let data24 = data1.name;
if(typeof data24 !== "string"){
const err87 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.name,data:data24};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err88 of vErrors){
if(!err88.emUsed){
emErrs26.push(err88);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
if(data1.enabled !== undefined){
let data25 = data1.enabled;
if(typeof data25 !== "boolean"){
const err89 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[4].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.enabled,data:data25};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if(errors > 0){
const emErrs27 = [];
for(const err90 of vErrors){
if(!err90.emUsed){
emErrs27.push(err90);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
}
if(data1.apiKey !== undefined){
let data26 = data1.apiKey;
if(typeof data26 !== "string"){
const err91 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.apiKey,data:data26};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if(errors > 0){
const emErrs28 = [];
for(const err92 of vErrors){
if(!err92.emUsed){
emErrs28.push(err92);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
}
}
else {
const err93 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[4].type,parentSchema:schema27.properties.providers.items.oneOf[4],data:data1};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
if(errors > 0){
const emErrors4 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates4 = {required:{}};
let emPropParams4;
let emParamsErrors4;
for(const err94 of vErrors){
if((((((err94.keyword !== "errorMessage") && (!err94.emUsed)) && (err94.instancePath === instancePath+"/providers/" + i0)) && (err94.keyword in emErrors4)) && (err94.schemaPath.indexOf("#/properties/providers/items/oneOf/4") === 0)) && (/^\/[^\/]*$/.test(err94.schemaPath.slice(36)))){
emPropParams4 = obj0[err94.keyword];
emParamsErrors4 = emErrors4[err94.keyword][err94.params[emPropParams4]];
if(emParamsErrors4){
emParamsErrors4.push(err94);
err94.emUsed = true;
}
}
}
for(const key5 in emErrors4){
for(const keyProp4 in emErrors4[key5]){
emParamsErrors4 = emErrors4[key5][keyProp4];
if(emParamsErrors4.length){
const tmpl4 = templates4[key5] && templates4[key5][keyProp4];
const err95 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema27.properties.providers.items.oneOf[4].errorMessage[key5][keyProp4],schema:schema27.properties.providers.items.oneOf[4].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[4],data:data1};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
}
const emErrs29 = [];
for(const err96 of vErrors){
if(!err96.emUsed){
emErrs29.push(err96);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
var _valid0 = _errs55 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid3 = true;
passing0 = 4;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
}
const _errs67 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err97 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data1};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
if(data1.name === undefined){
const err98 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data1};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(data1.id === undefined){
const err99 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data1};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
if(data1.enabled === undefined){
const err100 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data1};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
if(data1.baseURL === undefined){
const err101 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data1};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
if(data1.type !== undefined){
let data27 = data1.type;
if(typeof data27 !== "string"){
const err102 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.type,data:data27};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
if("ollama" !== data27){
const err103 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant",schema:"ollama",parentSchema:schema27.properties.providers.items.oneOf[5].properties.type,data:data27};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
if(errors > 0){
const emErrs30 = [];
for(const err104 of vErrors){
if(!err104.emUsed){
emErrs30.push(err104);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
}
if(data1.id !== undefined){
let data28 = data1.id;
if(typeof data28 !== "string"){
const err105 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.id,data:data28};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if(errors > 0){
const emErrs31 = [];
for(const err106 of vErrors){
if(!err106.emUsed){
emErrs31.push(err106);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
}
if(data1.name !== undefined){
let data29 = data1.name;
if(typeof data29 !== "string"){
const err107 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.name,data:data29};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(errors > 0){
const emErrs32 = [];
for(const err108 of vErrors){
if(!err108.emUsed){
emErrs32.push(err108);
}
}
vErrors = emErrs32;
errors = emErrs32.length;
}
}
if(data1.enabled !== undefined){
let data30 = data1.enabled;
if(typeof data30 !== "boolean"){
const err109 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[5].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.enabled,data:data30};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if(errors > 0){
const emErrs33 = [];
for(const err110 of vErrors){
if(!err110.emUsed){
emErrs33.push(err110);
}
}
vErrors = emErrs33;
errors = emErrs33.length;
}
}
if(data1.apiKey !== undefined){
let data31 = data1.apiKey;
if(typeof data31 !== "string"){
const err111 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.apiKey,data:data31};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
if(errors > 0){
const emErrs34 = [];
for(const err112 of vErrors){
if(!err112.emUsed){
emErrs34.push(err112);
}
}
vErrors = emErrs34;
errors = emErrs34.length;
}
}
if(data1.baseURL !== undefined){
let data32 = data1.baseURL;
if(typeof data32 !== "string"){
const err113 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.baseURL.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.baseURL,data:data32};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
if(errors > 0){
const emErrs35 = [];
for(const err114 of vErrors){
if(!err114.emUsed){
emErrs35.push(err114);
}
}
vErrors = emErrs35;
errors = emErrs35.length;
}
}
}
else {
const err115 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[5].type,parentSchema:schema27.properties.providers.items.oneOf[5],data:data1};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
if(errors > 0){
const emErrors5 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"baseURL":[]}};
const templates5 = {required:{}};
let emPropParams5;
let emParamsErrors5;
for(const err116 of vErrors){
if((((((err116.keyword !== "errorMessage") && (!err116.emUsed)) && (err116.instancePath === instancePath+"/providers/" + i0)) && (err116.keyword in emErrors5)) && (err116.schemaPath.indexOf("#/properties/providers/items/oneOf/5") === 0)) && (/^\/[^\/]*$/.test(err116.schemaPath.slice(36)))){
emPropParams5 = obj0[err116.keyword];
emParamsErrors5 = emErrors5[err116.keyword][err116.params[emPropParams5]];
if(emParamsErrors5){
emParamsErrors5.push(err116);
err116.emUsed = true;
}
}
}
for(const key6 in emErrors5){
for(const keyProp5 in emErrors5[key6]){
emParamsErrors5 = emErrors5[key6][keyProp5];
if(emParamsErrors5.length){
const tmpl5 = templates5[key6] && templates5[key6][keyProp5];
const err117 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors5},message:tmpl5 ? tmpl5() : schema27.properties.providers.items.oneOf[5].errorMessage[key6][keyProp5],schema:schema27.properties.providers.items.oneOf[5].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[5],data:data1};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
}
const emErrs36 = [];
for(const err118 of vErrors){
if(!err118.emUsed){
emErrs36.push(err118);
}
}
vErrors = emErrs36;
errors = emErrs36.length;
}
var _valid0 = _errs67 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 5];
}
else {
if(_valid0){
valid3 = true;
passing0 = 5;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
props0.baseURL = true;
}
}
const _errs81 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err119 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data1};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
if(data1.name === undefined){
const err120 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data1};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
if(data1.id === undefined){
const err121 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data1};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if(data1.enabled === undefined){
const err122 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data1};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
if(data1.apiKey === undefined){
const err123 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "apiKey"},message:"must have required property '"+"apiKey"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data1};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
if(data1.type !== undefined){
let data33 = data1.type;
if(typeof data33 !== "string"){
const err124 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.type,data:data33};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
if("scaleway" !== data33){
const err125 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "scaleway"},message:"must be equal to constant",schema:"scaleway",parentSchema:schema27.properties.providers.items.oneOf[6].properties.type,data:data33};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
if(errors > 0){
const emErrs37 = [];
for(const err126 of vErrors){
if(!err126.emUsed){
emErrs37.push(err126);
}
}
vErrors = emErrs37;
errors = emErrs37.length;
}
}
if(data1.id !== undefined){
let data34 = data1.id;
if(typeof data34 !== "string"){
const err127 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.id,data:data34};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
if(errors > 0){
const emErrs38 = [];
for(const err128 of vErrors){
if(!err128.emUsed){
emErrs38.push(err128);
}
}
vErrors = emErrs38;
errors = emErrs38.length;
}
}
if(data1.name !== undefined){
let data35 = data1.name;
if(typeof data35 !== "string"){
const err129 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.name,data:data35};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
if(errors > 0){
const emErrs39 = [];
for(const err130 of vErrors){
if(!err130.emUsed){
emErrs39.push(err130);
}
}
vErrors = emErrs39;
errors = emErrs39.length;
}
}
if(data1.enabled !== undefined){
let data36 = data1.enabled;
if(typeof data36 !== "boolean"){
const err131 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[6].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.enabled,data:data36};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
if(errors > 0){
const emErrs40 = [];
for(const err132 of vErrors){
if(!err132.emUsed){
emErrs40.push(err132);
}
}
vErrors = emErrs40;
errors = emErrs40.length;
}
}
if(data1.apiKey !== undefined){
let data37 = data1.apiKey;
if(typeof data37 !== "string"){
const err133 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/6/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.apiKey,data:data37};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
if(errors > 0){
const emErrs41 = [];
for(const err134 of vErrors){
if(!err134.emUsed){
emErrs41.push(err134);
}
}
vErrors = emErrs41;
errors = emErrs41.length;
}
}
if(data1.projectId !== undefined){
let data38 = data1.projectId;
if(typeof data38 !== "string"){
const err135 = {instancePath:instancePath+"/providers/" + i0+"/projectId",schemaPath:"#/properties/providers/items/oneOf/6/properties/projectId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.projectId.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.projectId,data:data38};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
if(errors > 0){
const emErrs42 = [];
for(const err136 of vErrors){
if(!err136.emUsed){
emErrs42.push(err136);
}
}
vErrors = emErrs42;
errors = emErrs42.length;
}
}
}
else {
const err137 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[6].type,parentSchema:schema27.properties.providers.items.oneOf[6],data:data1};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
if(errors > 0){
const emErrors6 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"apiKey":[]}};
const templates6 = {required:{}};
let emPropParams6;
let emParamsErrors6;
for(const err138 of vErrors){
if((((((err138.keyword !== "errorMessage") && (!err138.emUsed)) && (err138.instancePath === instancePath+"/providers/" + i0)) && (err138.keyword in emErrors6)) && (err138.schemaPath.indexOf("#/properties/providers/items/oneOf/6") === 0)) && (/^\/[^\/]*$/.test(err138.schemaPath.slice(36)))){
emPropParams6 = obj0[err138.keyword];
emParamsErrors6 = emErrors6[err138.keyword][err138.params[emPropParams6]];
if(emParamsErrors6){
emParamsErrors6.push(err138);
err138.emUsed = true;
}
}
}
for(const key7 in emErrors6){
for(const keyProp6 in emErrors6[key7]){
emParamsErrors6 = emErrors6[key7][keyProp6];
if(emParamsErrors6.length){
const tmpl6 = templates6[key7] && templates6[key7][keyProp6];
const err139 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema27.properties.providers.items.oneOf[6].errorMessage[key7][keyProp6],schema:schema27.properties.providers.items.oneOf[6].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[6],data:data1};
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
const emErrs43 = [];
for(const err140 of vErrors){
if(!err140.emUsed){
emErrs43.push(err140);
}
}
vErrors = emErrs43;
errors = emErrs43.length;
}
var _valid0 = _errs81 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 6];
}
else {
if(_valid0){
valid3 = true;
passing0 = 6;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
props0.projectId = true;
}
}
const _errs95 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err141 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data1};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
if(data1.name === undefined){
const err142 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data1};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
if(data1.id === undefined){
const err143 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data1};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
if(data1.enabled === undefined){
const err144 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data1};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
if(data1.baseURL === undefined){
const err145 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data1};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
if(data1.type !== undefined){
let data39 = data1.type;
if(typeof data39 !== "string"){
const err146 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/7/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.type,data:data39};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
if("openai-compatible" !== data39){
const err147 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue: "openai-compatible"},message:"must be equal to constant",schema:"openai-compatible",parentSchema:schema27.properties.providers.items.oneOf[7].properties.type,data:data39};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
if(errors > 0){
const emErrs44 = [];
for(const err148 of vErrors){
if(!err148.emUsed){
emErrs44.push(err148);
}
}
vErrors = emErrs44;
errors = emErrs44.length;
}
}
if(data1.id !== undefined){
let data40 = data1.id;
if(typeof data40 !== "string"){
const err149 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/7/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.id,data:data40};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
if(errors > 0){
const emErrs45 = [];
for(const err150 of vErrors){
if(!err150.emUsed){
emErrs45.push(err150);
}
}
vErrors = emErrs45;
errors = emErrs45.length;
}
}
if(data1.name !== undefined){
let data41 = data1.name;
if(typeof data41 !== "string"){
const err151 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/7/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.name,data:data41};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
if(errors > 0){
const emErrs46 = [];
for(const err152 of vErrors){
if(!err152.emUsed){
emErrs46.push(err152);
}
}
vErrors = emErrs46;
errors = emErrs46.length;
}
}
if(data1.enabled !== undefined){
let data42 = data1.enabled;
if(typeof data42 !== "boolean"){
const err153 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/7/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[7].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.enabled,data:data42};
if(vErrors === null){
vErrors = [err153];
}
else {
vErrors.push(err153);
}
errors++;
}
if(errors > 0){
const emErrs47 = [];
for(const err154 of vErrors){
if(!err154.emUsed){
emErrs47.push(err154);
}
}
vErrors = emErrs47;
errors = emErrs47.length;
}
}
if(data1.baseURL !== undefined){
let data43 = data1.baseURL;
if(typeof data43 !== "string"){
const err155 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/oneOf/7/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.baseURL.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.baseURL,data:data43};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
if(errors > 0){
const emErrs48 = [];
for(const err156 of vErrors){
if(!err156.emUsed){
emErrs48.push(err156);
}
}
vErrors = emErrs48;
errors = emErrs48.length;
}
}
if(data1.apiKey !== undefined){
let data44 = data1.apiKey;
if(typeof data44 !== "string"){
const err157 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/7/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.apiKey,data:data44};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
if(errors > 0){
const emErrs49 = [];
for(const err158 of vErrors){
if(!err158.emUsed){
emErrs49.push(err158);
}
}
vErrors = emErrs49;
errors = emErrs49.length;
}
}
if(data1.compatibility !== undefined){
let data45 = data1.compatibility;
if(typeof data45 !== "string"){
const err159 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/oneOf/7/properties/compatibility/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.compatibility.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.compatibility,data:data45};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
if(!((data45 === "default") || (data45 === "compatible"))){
const err160 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/oneOf/7/properties/compatibility/enum",keyword:"enum",params:{allowedValues: schema27.properties.providers.items.oneOf[7].properties.compatibility.enum},message:"must be equal to one of the allowed values",schema:schema27.properties.providers.items.oneOf[7].properties.compatibility.enum,parentSchema:schema27.properties.providers.items.oneOf[7].properties.compatibility,data:data45};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
if(errors > 0){
const emErrs50 = [];
for(const err161 of vErrors){
if(!err161.emUsed){
emErrs50.push(err161);
}
}
vErrors = emErrs50;
errors = emErrs50.length;
}
}
}
else {
const err162 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[7].type,parentSchema:schema27.properties.providers.items.oneOf[7],data:data1};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
if(errors > 0){
const emErrors7 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"baseURL":[]}};
const templates7 = {required:{}};
let emPropParams7;
let emParamsErrors7;
for(const err163 of vErrors){
if((((((err163.keyword !== "errorMessage") && (!err163.emUsed)) && (err163.instancePath === instancePath+"/providers/" + i0)) && (err163.keyword in emErrors7)) && (err163.schemaPath.indexOf("#/properties/providers/items/oneOf/7") === 0)) && (/^\/[^\/]*$/.test(err163.schemaPath.slice(36)))){
emPropParams7 = obj0[err163.keyword];
emParamsErrors7 = emErrors7[err163.keyword][err163.params[emPropParams7]];
if(emParamsErrors7){
emParamsErrors7.push(err163);
err163.emUsed = true;
}
}
}
for(const key8 in emErrors7){
for(const keyProp7 in emErrors7[key8]){
emParamsErrors7 = emErrors7[key8][keyProp7];
if(emParamsErrors7.length){
const tmpl7 = templates7[key8] && templates7[key8][keyProp7];
const err164 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors7},message:tmpl7 ? tmpl7() : schema27.properties.providers.items.oneOf[7].errorMessage[key8][keyProp7],schema:schema27.properties.providers.items.oneOf[7].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[7],data:data1};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
}
}
const emErrs51 = [];
for(const err165 of vErrors){
if(!err165.emUsed){
emErrs51.push(err165);
}
}
vErrors = emErrs51;
errors = emErrs51.length;
}
var _valid0 = _errs95 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 7];
}
else {
if(_valid0){
valid3 = true;
passing0 = 7;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.baseURL = true;
props0.apiKey = true;
props0.compatibility = true;
}
}
const _errs111 = errors;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err166 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data1};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
if(data1.name === undefined){
const err167 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data1};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
if(data1.id === undefined){
const err168 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data1};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
if(data1.enabled === undefined){
const err169 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data1};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
if(data1.type !== undefined){
let data46 = data1.type;
if(typeof data46 !== "string"){
const err170 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/8/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[8].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.type,data:data46};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
if("mock" !== data46){
const err171 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema27.properties.providers.items.oneOf[8].properties.type,data:data46};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
if(errors > 0){
const emErrs52 = [];
for(const err172 of vErrors){
if(!err172.emUsed){
emErrs52.push(err172);
}
}
vErrors = emErrs52;
errors = emErrs52.length;
}
}
if(data1.id !== undefined){
let data47 = data1.id;
if(typeof data47 !== "string"){
const err173 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/8/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[8].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.id,data:data47};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
}
errors++;
}
if(errors > 0){
const emErrs53 = [];
for(const err174 of vErrors){
if(!err174.emUsed){
emErrs53.push(err174);
}
}
vErrors = emErrs53;
errors = emErrs53.length;
}
}
if(data1.name !== undefined){
let data48 = data1.name;
if(typeof data48 !== "string"){
const err175 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/8/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[8].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.name,data:data48};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
if(errors > 0){
const emErrs54 = [];
for(const err176 of vErrors){
if(!err176.emUsed){
emErrs54.push(err176);
}
}
vErrors = emErrs54;
errors = emErrs54.length;
}
}
if(data1.enabled !== undefined){
let data49 = data1.enabled;
if(typeof data49 !== "boolean"){
const err177 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/8/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[8].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.enabled,data:data49};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
}
if(errors > 0){
const emErrs55 = [];
for(const err178 of vErrors){
if(!err178.emUsed){
emErrs55.push(err178);
}
}
vErrors = emErrs55;
errors = emErrs55.length;
}
}
}
else {
const err179 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[8].type,parentSchema:schema27.properties.providers.items.oneOf[8],data:data1};
if(vErrors === null){
vErrors = [err179];
}
else {
vErrors.push(err179);
}
errors++;
}
if(errors > 0){
const emErrors8 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates8 = {required:{}};
let emPropParams8;
let emParamsErrors8;
for(const err180 of vErrors){
if((((((err180.keyword !== "errorMessage") && (!err180.emUsed)) && (err180.instancePath === instancePath+"/providers/" + i0)) && (err180.keyword in emErrors8)) && (err180.schemaPath.indexOf("#/properties/providers/items/oneOf/8") === 0)) && (/^\/[^\/]*$/.test(err180.schemaPath.slice(36)))){
emPropParams8 = obj0[err180.keyword];
emParamsErrors8 = emErrors8[err180.keyword][err180.params[emPropParams8]];
if(emParamsErrors8){
emParamsErrors8.push(err180);
err180.emUsed = true;
}
}
}
for(const key9 in emErrors8){
for(const keyProp8 in emErrors8[key9]){
emParamsErrors8 = emErrors8[key9][keyProp8];
if(emParamsErrors8.length){
const tmpl8 = templates8[key9] && templates8[key9][keyProp8];
const err181 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors8},message:tmpl8 ? tmpl8() : schema27.properties.providers.items.oneOf[8].errorMessage[key9][keyProp8],schema:schema27.properties.providers.items.oneOf[8].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[8],data:data1};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
}
}
const emErrs56 = [];
for(const err182 of vErrors){
if(!err182.emUsed){
emErrs56.push(err182);
}
}
vErrors = emErrs56;
errors = emErrs56.length;
}
var _valid0 = _errs111 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 8];
}
else {
if(_valid0){
valid3 = true;
passing0 = 8;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
}
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
const err183 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema27.properties.providers.items.oneOf,parentSchema:schema27.properties.providers.items,data:data1};
if(vErrors === null){
vErrors = [err183];
}
else {
vErrors.push(err183);
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
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(props0 !== true){
for(const key10 in data1){
if(!props0 || !props0[key10]){
const err184 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/unevaluatedProperties",keyword:"unevaluatedProperties",params:{unevaluatedProperty: key10},message:"must NOT have unevaluated properties",schema:false,parentSchema:schema27.properties.providers.items,data:data1};
if(vErrors === null){
vErrors = [err184];
}
else {
vErrors.push(err184);
}
errors++;
}
}
}
}
else {
const err185 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.type,parentSchema:schema27.properties.providers.items,data:data1};
if(vErrors === null){
vErrors = [err185];
}
else {
vErrors.push(err185);
}
errors++;
}
if(errors > 0){
const emErrors9 = {"oneOf":[]};
const templates9 = {};
for(const err186 of vErrors){
if((((((err186.keyword !== "errorMessage") && (!err186.emUsed)) && (err186.instancePath === instancePath+"/providers/" + i0)) && (err186.keyword in emErrors9)) && (err186.schemaPath.indexOf("#/properties/providers/items") === 0)) && (/^\/[^\/]*$/.test(err186.schemaPath.slice(28)))){
emErrors9[err186.keyword].push(err186);
err186.emUsed = true;
}
}
for(const key11 in emErrors9){
if(emErrors9[key11].length){
const err187 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors9[key11]},message:key11 in templates9 ? templates9[key11]() : schema27.properties.providers.items.errorMessage[key11],schema:schema27.properties.providers.items.errorMessage,parentSchema:schema27.properties.providers.items,data:data1};
if(vErrors === null){
vErrors = [err187];
}
else {
vErrors.push(err187);
}
errors++;
}
}
const emErrs57 = [];
for(const err188 of vErrors){
if(!err188.emUsed){
emErrs57.push(err188);
}
}
vErrors = emErrs57;
errors = emErrs57.length;
}
}
}
else {
const err189 = {instancePath:instancePath+"/providers",schemaPath:"#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.providers.type,parentSchema:schema27.properties.providers,data:data0};
if(vErrors === null){
vErrors = [err189];
}
else {
vErrors.push(err189);
}
errors++;
}
if(errors > 0){
const emErrs58 = [];
for(const err190 of vErrors){
if(!err190.emUsed){
emErrs58.push(err190);
}
}
vErrors = emErrs58;
errors = emErrs58.length;
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
const err191 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "model"},message:"must have required property '"+"model"+"'",schema:schema27.properties.models.items.required,parentSchema:schema27.properties.models.items,data:data51};
if(vErrors === null){
vErrors = [err191];
}
else {
vErrors.push(err191);
}
errors++;
}
if(data51.usage === undefined){
const err192 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "usage"},message:"must have required property '"+"usage"+"'",schema:schema27.properties.models.items.required,parentSchema:schema27.properties.models.items,data:data51};
if(vErrors === null){
vErrors = [err192];
}
else {
vErrors.push(err192);
}
errors++;
}
for(const key12 in data51){
if(!(((key12 === "model") || (key12 === "usage")) || (key12 === "multiplier"))){
const err193 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key12},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.models.items,data:data51};
if(vErrors === null){
vErrors = [err193];
}
else {
vErrors.push(err193);
}
errors++;
}
}
if(data51.model !== undefined){
let data52 = data51.model;
if(data52 && typeof data52 == "object" && !Array.isArray(data52)){
if(data52.id === undefined){
const err194 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data52};
if(vErrors === null){
vErrors = [err194];
}
else {
vErrors.push(err194);
}
errors++;
}
if(data52.name === undefined){
const err195 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data52};
if(vErrors === null){
vErrors = [err195];
}
else {
vErrors.push(err195);
}
errors++;
}
if(data52.provider === undefined){
const err196 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data52};
if(vErrors === null){
vErrors = [err196];
}
else {
vErrors.push(err196);
}
errors++;
}
if(data52.id !== undefined){
let data53 = data52.id;
if(typeof data53 !== "string"){
const err197 = {instancePath:instancePath+"/models/" + i1+"/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data53};
if(vErrors === null){
vErrors = [err197];
}
else {
vErrors.push(err197);
}
errors++;
}
if(errors > 0){
const emErrs59 = [];
for(const err198 of vErrors){
if(!err198.emUsed){
emErrs59.push(err198);
}
}
vErrors = emErrs59;
errors = emErrs59.length;
}
}
if(data52.name !== undefined){
let data54 = data52.name;
if(typeof data54 !== "string"){
const err199 = {instancePath:instancePath+"/models/" + i1+"/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data54};
if(vErrors === null){
vErrors = [err199];
}
else {
vErrors.push(err199);
}
errors++;
}
if(errors > 0){
const emErrs60 = [];
for(const err200 of vErrors){
if(!err200.emUsed){
emErrs60.push(err200);
}
}
vErrors = emErrs60;
errors = emErrs60.length;
}
}
if(data52.provider !== undefined){
let data55 = data52.provider;
if(data55 && typeof data55 == "object" && !Array.isArray(data55)){
if(data55.type === undefined){
const err201 = {instancePath:instancePath+"/models/" + i1+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data55};
if(vErrors === null){
vErrors = [err201];
}
else {
vErrors.push(err201);
}
errors++;
}
if(data55.name === undefined){
const err202 = {instancePath:instancePath+"/models/" + i1+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data55};
if(vErrors === null){
vErrors = [err202];
}
else {
vErrors.push(err202);
}
errors++;
}
if(data55.id === undefined){
const err203 = {instancePath:instancePath+"/models/" + i1+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data55};
if(vErrors === null){
vErrors = [err203];
}
else {
vErrors.push(err203);
}
errors++;
}
if(data55.type !== undefined){
let data56 = data55.type;
if(typeof data56 !== "string"){
const err204 = {instancePath:instancePath+"/models/" + i1+"/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data56};
if(vErrors === null){
vErrors = [err204];
}
else {
vErrors.push(err204);
}
errors++;
}
if(errors > 0){
const emErrs61 = [];
for(const err205 of vErrors){
if(!err205.emUsed){
emErrs61.push(err205);
}
}
vErrors = emErrs61;
errors = emErrs61.length;
}
}
if(data55.name !== undefined){
let data57 = data55.name;
if(typeof data57 !== "string"){
const err206 = {instancePath:instancePath+"/models/" + i1+"/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data57};
if(vErrors === null){
vErrors = [err206];
}
else {
vErrors.push(err206);
}
errors++;
}
if(errors > 0){
const emErrs62 = [];
for(const err207 of vErrors){
if(!err207.emUsed){
emErrs62.push(err207);
}
}
vErrors = emErrs62;
errors = emErrs62.length;
}
}
if(data55.id !== undefined){
let data58 = data55.id;
if(typeof data58 !== "string"){
const err208 = {instancePath:instancePath+"/models/" + i1+"/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data58};
if(vErrors === null){
vErrors = [err208];
}
else {
vErrors.push(err208);
}
errors++;
}
if(errors > 0){
const emErrs63 = [];
for(const err209 of vErrors){
if(!err209.emUsed){
emErrs63.push(err209);
}
}
vErrors = emErrs63;
errors = emErrs63.length;
}
}
}
else {
const err210 = {instancePath:instancePath+"/models/" + i1+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data55};
if(vErrors === null){
vErrors = [err210];
}
else {
vErrors.push(err210);
}
errors++;
}
if(errors > 0){
const emErrors10 = {"required":{"type":[],"name":[],"id":[]}};
const templates10 = {required:{}};
let emPropParams9;
let emParamsErrors9;
for(const err211 of vErrors){
if((((((err211.keyword !== "errorMessage") && (!err211.emUsed)) && (err211.instancePath === instancePath+"/models/" + i1+"/model/provider")) && (err211.keyword in emErrors10)) && (err211.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err211.schemaPath.slice(39)))){
emPropParams9 = obj0[err211.keyword];
emParamsErrors9 = emErrors10[err211.keyword][err211.params[emPropParams9]];
if(emParamsErrors9){
emParamsErrors9.push(err211);
err211.emUsed = true;
}
}
}
for(const key13 in emErrors10){
for(const keyProp9 in emErrors10[key13]){
emParamsErrors9 = emErrors10[key13][keyProp9];
if(emParamsErrors9.length){
const tmpl9 = templates10[key13] && templates10[key13][keyProp9];
const err212 = {instancePath:instancePath+"/models/" + i1+"/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors9},message:tmpl9 ? tmpl9() : schema28.properties.provider.errorMessage[key13][keyProp9],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data55};
if(vErrors === null){
vErrors = [err212];
}
else {
vErrors.push(err212);
}
errors++;
}
}
}
const emErrs64 = [];
for(const err213 of vErrors){
if(!err213.emUsed){
emErrs64.push(err213);
}
}
vErrors = emErrs64;
errors = emErrs64.length;
}
}
}
else {
const err214 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data52};
if(vErrors === null){
vErrors = [err214];
}
else {
vErrors.push(err214);
}
errors++;
}
if(errors > 0){
const emErrors11 = {"required":{"id":[],"name":[],"provider":[]}};
const templates11 = {required:{}};
let emPropParams10;
let emParamsErrors10;
for(const err215 of vErrors){
if((((((err215.keyword !== "errorMessage") && (!err215.emUsed)) && (err215.instancePath === instancePath+"/models/" + i1+"/model")) && (err215.keyword in emErrors11)) && (err215.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err215.schemaPath.slice(19)))){
emPropParams10 = obj0[err215.keyword];
emParamsErrors10 = emErrors11[err215.keyword][err215.params[emPropParams10]];
if(emParamsErrors10){
emParamsErrors10.push(err215);
err215.emUsed = true;
}
}
}
for(const key14 in emErrors11){
for(const keyProp10 in emErrors11[key14]){
emParamsErrors10 = emErrors11[key14][keyProp10];
if(emParamsErrors10.length){
const tmpl10 = templates11[key14] && templates11[key14][keyProp10];
const err216 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors10},message:tmpl10 ? tmpl10() : schema28.errorMessage[key14][keyProp10],schema:schema28.errorMessage,parentSchema:schema28,data:data52};
if(vErrors === null){
vErrors = [err216];
}
else {
vErrors.push(err216);
}
errors++;
}
}
}
const emErrs65 = [];
for(const err217 of vErrors){
if(!err217.emUsed){
emErrs65.push(err217);
}
}
vErrors = emErrs65;
errors = emErrs65.length;
}
if(errors > 0){
const emErrors12 = {"required":{"id":[],"name":[],"provider":[]}};
const templates12 = {required:{}};
let emPropParams11;
let emParamsErrors11;
for(const err218 of vErrors){
if((((((err218.keyword !== "errorMessage") && (!err218.emUsed)) && (err218.instancePath === instancePath+"/models/" + i1+"/model")) && (err218.keyword in emErrors12)) && (err218.schemaPath.indexOf("#/properties/models/items/properties/model") === 0)) && (/^\/[^\/]*$/.test(err218.schemaPath.slice(42)))){
emPropParams11 = obj0[err218.keyword];
emParamsErrors11 = emErrors12[err218.keyword][err218.params[emPropParams11]];
if(emParamsErrors11){
emParamsErrors11.push(err218);
err218.emUsed = true;
}
}
}
for(const key15 in emErrors12){
for(const keyProp11 in emErrors12[key15]){
emParamsErrors11 = emErrors12[key15][keyProp11];
if(emParamsErrors11.length){
const tmpl11 = templates12[key15] && templates12[key15][keyProp11];
const err219 = {instancePath:instancePath+"/models/" + i1+"/model",schemaPath:"#/properties/models/items/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors11},message:tmpl11 ? tmpl11() : schema27.properties.models.items.properties.model.errorMessage[key15][keyProp11],schema:schema27.properties.models.items.properties.model.errorMessage,parentSchema:schema27.properties.models.items.properties.model,data:data52};
if(vErrors === null){
vErrors = [err219];
}
else {
vErrors.push(err219);
}
errors++;
}
}
}
const emErrs66 = [];
for(const err220 of vErrors){
if(!err220.emUsed){
emErrs66.push(err220);
}
}
vErrors = emErrs66;
errors = emErrs66.length;
}
}
if(data51.usage !== undefined){
let data59 = data51.usage;
if(Array.isArray(data59)){
if(data59.length < 1){
const err221 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items",schema:1,parentSchema:schema27.properties.models.items.properties.usage,data:data59};
if(vErrors === null){
vErrors = [err221];
}
else {
vErrors.push(err221);
}
errors++;
}
const len2 = data59.length;
for(let i2=0; i2<len2; i2++){
let data60 = data59[i2];
if(typeof data60 !== "string"){
const err222 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.models.items.properties.usage.items.type,parentSchema:schema27.properties.models.items.properties.usage.items,data:data60};
if(vErrors === null){
vErrors = [err222];
}
else {
vErrors.push(err222);
}
errors++;
}
const _errs146 = errors;
let valid21 = false;
let passing1 = null;
const _errs147 = errors;
if("assistant" !== data60){
const err223 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/0/const",keyword:"const",params:{allowedValue: "assistant"},message:"must be equal to constant",schema:"assistant",parentSchema:schema27.properties.models.items.properties.usage.items.oneOf[0],data:data60};
if(vErrors === null){
vErrors = [err223];
}
else {
vErrors.push(err223);
}
errors++;
}
var _valid1 = _errs147 === errors;
if(_valid1){
valid21 = true;
passing1 = 0;
}
const _errs148 = errors;
if("tools" !== data60){
const err224 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/1/const",keyword:"const",params:{allowedValue: "tools"},message:"must be equal to constant",schema:"tools",parentSchema:schema27.properties.models.items.properties.usage.items.oneOf[1],data:data60};
if(vErrors === null){
vErrors = [err224];
}
else {
vErrors.push(err224);
}
errors++;
}
var _valid1 = _errs148 === errors;
if(_valid1 && valid21){
valid21 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid21 = true;
passing1 = 1;
}
const _errs149 = errors;
if("summarizer" !== data60){
const err225 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/2/const",keyword:"const",params:{allowedValue: "summarizer"},message:"must be equal to constant",schema:"summarizer",parentSchema:schema27.properties.models.items.properties.usage.items.oneOf[2],data:data60};
if(vErrors === null){
vErrors = [err225];
}
else {
vErrors.push(err225);
}
errors++;
}
var _valid1 = _errs149 === errors;
if(_valid1 && valid21){
valid21 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid21 = true;
passing1 = 2;
}
const _errs150 = errors;
if("evaluator" !== data60){
const err226 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/3/const",keyword:"const",params:{allowedValue: "evaluator"},message:"must be equal to constant",schema:"evaluator",parentSchema:schema27.properties.models.items.properties.usage.items.oneOf[3],data:data60};
if(vErrors === null){
vErrors = [err226];
}
else {
vErrors.push(err226);
}
errors++;
}
var _valid1 = _errs150 === errors;
if(_valid1 && valid21){
valid21 = false;
passing1 = [passing1, 3];
}
else {
if(_valid1){
valid21 = true;
passing1 = 3;
}
const _errs151 = errors;
if("moderator" !== data60){
const err227 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf/4/const",keyword:"const",params:{allowedValue: "moderator"},message:"must be equal to constant",schema:"moderator",parentSchema:schema27.properties.models.items.properties.usage.items.oneOf[4],data:data60};
if(vErrors === null){
vErrors = [err227];
}
else {
vErrors.push(err227);
}
errors++;
}
var _valid1 = _errs151 === errors;
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
const err228 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf",schema:schema27.properties.models.items.properties.usage.items.oneOf,parentSchema:schema27.properties.models.items.properties.usage.items,data:data60};
if(vErrors === null){
vErrors = [err228];
}
else {
vErrors.push(err228);
}
errors++;
}
else {
errors = _errs146;
if(vErrors !== null){
if(_errs146){
vErrors.length = _errs146;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors13 = {"oneOf":[]};
const templates13 = {};
for(const err229 of vErrors){
if((((((err229.keyword !== "errorMessage") && (!err229.emUsed)) && (err229.instancePath === instancePath+"/models/" + i1+"/usage/" + i2)) && (err229.keyword in emErrors13)) && (err229.schemaPath.indexOf("#/properties/models/items/properties/usage/items") === 0)) && (/^\/[^\/]*$/.test(err229.schemaPath.slice(48)))){
emErrors13[err229.keyword].push(err229);
err229.emUsed = true;
}
}
for(const key16 in emErrors13){
if(emErrors13[key16].length){
const err230 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors13[key16]},message:key16 in templates13 ? templates13[key16]() : schema27.properties.models.items.properties.usage.items.errorMessage[key16],schema:schema27.properties.models.items.properties.usage.items.errorMessage,parentSchema:schema27.properties.models.items.properties.usage.items,data:data60};
if(vErrors === null){
vErrors = [err230];
}
else {
vErrors.push(err230);
}
errors++;
}
}
const emErrs67 = [];
for(const err231 of vErrors){
if(!err231.emUsed){
emErrs67.push(err231);
}
}
vErrors = emErrs67;
errors = emErrs67.length;
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
const err232 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i3+" are identical)",schema:true,parentSchema:schema27.properties.models.items.properties.usage,data:data59};
if(vErrors === null){
vErrors = [err232];
}
else {
vErrors.push(err232);
}
errors++;
break;
}
indices0[item0] = i3;
}
}
}
else {
const err233 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.models.items.properties.usage.type,parentSchema:schema27.properties.models.items.properties.usage,data:data59};
if(vErrors === null){
vErrors = [err233];
}
else {
vErrors.push(err233);
}
errors++;
}
if(errors > 0){
const emErrs68 = [];
for(const err234 of vErrors){
if(!err234.emUsed){
emErrs68.push(err234);
}
}
vErrors = emErrs68;
errors = emErrs68.length;
}
}
if(data51.multiplier !== undefined){
let data61 = data51.multiplier;
if(typeof data61 == "number"){
if(data61 < 0 || isNaN(data61)){
const err235 = {instancePath:instancePath+"/models/" + i1+"/multiplier",schemaPath:"#/properties/models/items/properties/multiplier/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.items.properties.multiplier,data:data61};
if(vErrors === null){
vErrors = [err235];
}
else {
vErrors.push(err235);
}
errors++;
}
}
else {
const err236 = {instancePath:instancePath+"/models/" + i1+"/multiplier",schemaPath:"#/properties/models/items/properties/multiplier/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.items.properties.multiplier.type,parentSchema:schema27.properties.models.items.properties.multiplier,data:data61};
if(vErrors === null){
vErrors = [err236];
}
else {
vErrors.push(err236);
}
errors++;
}
if(errors > 0){
const emErrs69 = [];
for(const err237 of vErrors){
if(!err237.emUsed){
emErrs69.push(err237);
}
}
vErrors = emErrs69;
errors = emErrs69.length;
}
}
}
else {
const err238 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.items.type,parentSchema:schema27.properties.models.items,data:data51};
if(vErrors === null){
vErrors = [err238];
}
else {
vErrors.push(err238);
}
errors++;
}
if(errors > 0){
const emErrors14 = {"required":{"model":[],"usage":[]}};
const templates14 = {required:{}};
let emPropParams12;
let emParamsErrors12;
for(const err239 of vErrors){
if((((((err239.keyword !== "errorMessage") && (!err239.emUsed)) && (err239.instancePath === instancePath+"/models/" + i1)) && (err239.keyword in emErrors14)) && (err239.schemaPath.indexOf("#/properties/models/items") === 0)) && (/^\/[^\/]*$/.test(err239.schemaPath.slice(25)))){
emPropParams12 = obj0[err239.keyword];
emParamsErrors12 = emErrors14[err239.keyword][err239.params[emPropParams12]];
if(emParamsErrors12){
emParamsErrors12.push(err239);
err239.emUsed = true;
}
}
}
for(const key17 in emErrors14){
for(const keyProp12 in emErrors14[key17]){
emParamsErrors12 = emErrors14[key17][keyProp12];
if(emParamsErrors12.length){
const tmpl12 = templates14[key17] && templates14[key17][keyProp12];
const err240 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors12},message:tmpl12 ? tmpl12() : schema27.properties.models.items.errorMessage[key17][keyProp12],schema:schema27.properties.models.items.errorMessage,parentSchema:schema27.properties.models.items,data:data51};
if(vErrors === null){
vErrors = [err240];
}
else {
vErrors.push(err240);
}
errors++;
}
}
}
const emErrs70 = [];
for(const err241 of vErrors){
if(!err241.emUsed){
emErrs70.push(err241);
}
}
vErrors = emErrs70;
errors = emErrs70.length;
}
}
}
else {
const err242 = {instancePath:instancePath+"/models",schemaPath:"#/properties/models/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.models.type,parentSchema:schema27.properties.models,data:data50};
if(vErrors === null){
vErrors = [err242];
}
else {
vErrors.push(err242);
}
errors++;
}
if(errors > 0){
const emErrs71 = [];
for(const err243 of vErrors){
if(!err243.emUsed){
emErrs71.push(err243);
}
}
vErrors = emErrs71;
errors = emErrs71.length;
}
}
}
else {
const err244 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err244];
}
else {
vErrors.push(err244);
}
errors++;
}
if(errors > 0){
const emErrors15 = {"required":{"providers":[]}};
const templates15 = {required:{}};
let emPropParams13;
let emParamsErrors13;
for(const err245 of vErrors){
if((((((err245.keyword !== "errorMessage") && (!err245.emUsed)) && (err245.instancePath === instancePath)) && (err245.keyword in emErrors15)) && (err245.schemaPath.indexOf("#") === 0)) && (/^\/[^\/]*$/.test(err245.schemaPath.slice(1)))){
emPropParams13 = obj0[err245.keyword];
emParamsErrors13 = emErrors15[err245.keyword][err245.params[emPropParams13]];
if(emParamsErrors13){
emParamsErrors13.push(err245);
err245.emUsed = true;
}
}
}
for(const key18 in emErrors15){
for(const keyProp13 in emErrors15[key18]){
emParamsErrors13 = emErrors15[key18][keyProp13];
if(emParamsErrors13.length){
const tmpl13 = templates15[key18] && templates15[key18][keyProp13];
const err246 = {instancePath,schemaPath:"#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors13},message:tmpl13 ? tmpl13() : schema27.errorMessage[key18][keyProp13],schema:schema27.errorMessage,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err246];
}
else {
vErrors.push(err246);
}
errors++;
}
}
}
const emErrs72 = [];
for(const err247 of vErrors){
if(!err247.emUsed){
emErrs72.push(err247);
}
}
vErrors = emErrs72;
errors = emErrs72.length;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate37(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export12" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate37.evaluated;
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
validate37.errors = vErrors;
return errors === 0;
}
validate37.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
function expression0(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.defaultData)
}function expression1(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item ? `${item.name || ""} - ${item.id.slice(0, 8)}` : "")
}function expression2(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (summary)
}function expression3(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ({ id: crypto.randomUUID() })
}function expression4(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.constData)
}function expression5(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.options)
}function expression6(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Open AI")
}function expression7(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Anthropic")
}function expression8(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Google")
}function expression9(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Mistral")
}function expression10(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("OpenRouter")
}function expression11(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Ollama")
}function expression12(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Scaleway")
}function expression13(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("OpenAI Compatible")
}function expression14(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ([{"key":"default","title":"default","value":"default"},{"key":"compatible","title":"compatible","value":"compatible"}])
}function expression15(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Mock")
}function expression16(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return (parent.data.providers?.length)
}function expression17(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item?.model ? `${item.model.name} (${item.usage?.join(", ")})` : "")
}function expression18(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return `${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${(rootData.providers || []).map(p => p.id).join(",")}`
}function expression19(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`)
}function expression20(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item.id)
}function expression21(data,body,options,context,display,layout,readOnly,summary,validates
) {
return (data.results)
}function expression22(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ([{"const":"assistant","title":"Assistant","key":"assistant","value":"assistant"},{"const":"tools","title":"Outils","key":"tools","value":"tools"},{"const":"summarizer","title":"Résumeur","key":"summarizer","value":"summarizer"},{"const":"evaluator","title":"Évaluateur","key":"evaluator","value":"evaluator"},{"const":"moderator","title":"Modérateur","key":"moderator","value":"moderator"}])
}

const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/settings/put-req#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/settings/put-req#": {
      title: "Paramètres",
      root: "https://github.com/data-fair/agents/settings/put-req#",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items": {
      title: "Fournisseur",
      root: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0": {
      title: "Open AI",
      root: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0",
      discriminatorValue: "openai"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1": {
      title: "Anthropic",
      root: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1",
      discriminatorValue: "anthropic"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2": {
      title: "Google",
      root: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2",
      discriminatorValue: "google"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3": {
      title: "Mistral",
      root: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3",
      discriminatorValue: "mistral"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4": {
      title: "OpenRouter",
      root: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4",
      discriminatorValue: "openrouter"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5": {
      title: "Ollama",
      root: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5",
      discriminatorValue: "ollama"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6": {
      title: "Scaleway",
      root: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6",
      discriminatorValue: "scaleway"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7": {
      title: "Compatible OpenAI",
      root: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7",
      discriminatorValue: "openai-compatible"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8": {
      title: "Mock",
      root: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8",
      discriminatorValue: "mock"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items": {
      title: "",
      root: "https://github.com/data-fair/agents/settings/put-req#/properties/models/items",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/models/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items": {
      title: "",
      root: "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/settings/put-req#": {
      title: "Paramètres",
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#",
      pure: false,
      propertyKeys: ["providers", "models"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers", "https://github.com/data-fair/agents/settings/put-req#/properties/models"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers": {
      title: "Fournisseurs IA",
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
      title: "Fournisseur",
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey", "baseURL", "projectId", "compatibility"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/type", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/id", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/name", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/enabled", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/apiKey"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/type", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/id", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/name", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/enabled", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/apiKey"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/type", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/id", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/name", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/enabled", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/apiKey"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/type", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/id", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/name", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/enabled", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/apiKey"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/type", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/id", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/name", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/enabled", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/apiKey"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey", "baseURL"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/type", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/id", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/name", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/enabled", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/apiKey", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/baseURL"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/baseURL": {
      title: "URL de base",
      key: "baseURL",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/baseURL",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/baseURL",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey", "projectId"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/type", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/id", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/name", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/enabled", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/apiKey", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/projectId"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/projectId": {
      title: "ID du projet",
      key: "projectId",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/projectId",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/projectId",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "baseURL", "apiKey", "compatibility"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/type", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/id", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/name", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/enabled", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/baseURL", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/apiKey", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/compatibility"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/baseURL": {
      title: "URL de base",
      key: "baseURL",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/baseURL",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/baseURL",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/compatibility": {
      title: "Mode de compatibilité",
      key: "compatibility",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/compatibility",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/compatibility",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/type", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/id", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/name", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/enabled"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf": {
      key: "$oneOf",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf",
      childrenTrees: ["https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7", "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8"],
      discriminator: "type",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey", "baseURL", "projectId", "compatibility"],
      roPropertyKeys: ["id"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/models": {
      title: "Modèles",
      key: "models",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/models",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/models",
      pure: false,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      childrenTrees: ["https://github.com/data-fair/agents/settings/put-req#/properties/models/items"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/models/items",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/models/items",
      pure: false,
      propertyKeys: ["model", "usage", "multiplier"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/model", "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage", "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/multiplier"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/model": {
      title: "Modèle",
      key: "model",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/model",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/definitions/Model",
      pure: false,
      propertyKeys: ["id", "name", "provider"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/id", "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/name", "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/id": {
      title: "Model ID",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/name": {
      title: "Name",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider": {
      title: undefined,
      key: "provider",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider",
      pure: true,
      propertyKeys: ["type", "name", "id"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/type", "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/name", "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/id"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/name": {
      title: "Provider Name",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/id": {
      title: "Provider ID",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage": {
      title: "Usages appropriés",
      key: "usage",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      childrenTrees: ["https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items"]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/multiplier": {
      title: "Multiplicateur de crédits",
      key: "multiplier",
      pointer: "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/multiplier",
      refPointer: "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/multiplier",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/settings/put-req#": {
      title: null,
      comp: "section",

      children: [{
        key: "providers"
      }, {
        key: "models"
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

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers": {
      itemTitle: {
        type: "js-eval",
        expr: "item ? `${item.name || \"\"} - ${item.id.slice(0, 8)}` : \"\"",
        pure: true,
        dataAlias: "item",
        ref: 1
      },

      listActions: ["add", "edit", "delete"],
      comp: "list",
      title: "Fournisseurs IA",
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

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items": {
      switch: [{
        getDefaultData: {
          type: "js-eval",
          expr: "{ id: crypto.randomUUID() }",
          pure: true,
          dataAlias: "value",
          ref: 3
        },

        if: {
          type: "js-eval",
          expr: "summary",
          pure: true,
          dataAlias: "value",
          ref: 2
        },

        children: [],
        comp: "section",
        title: "Fournisseur",
        defaultData: {},
        nullable: true
      }, {
        getDefaultData: {
          type: "js-eval",
          expr: "{ id: crypto.randomUUID() }",
          pure: true,
          dataAlias: "value",
          ref: 3
        },

        comp: "section",

        children: [{
          key: "$oneOf"
        }],

        title: "Fournisseur",
        defaultData: {},
        nullable: true
      }]
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf": {
      emptyData: true,
      comp: "one-of-select",

      oneOfItems: [{
        key: 0,
        title: "Open AI"
      }, {
        key: 1,
        title: "Anthropic"
      }, {
        key: 2,
        title: "Google"
      }, {
        key: 3,
        title: "Mistral"
      }, {
        key: 4,
        title: "OpenRouter"
      }, {
        key: 5,
        title: "Ollama"
      }, {
        key: 6,
        title: "Scaleway"
      }, {
        key: 7,
        title: "Compatible OpenAI"
      }, {
        key: 8,
        title: "Mock"
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

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0": {
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

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/type": {
      comp: "none",
      constData: "openai",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 4
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/id": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "ID du fournisseur",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 5
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Open AI\"",
        pure: true,
        dataAlias: "value",
        ref: 6
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/enabled": {
      comp: "checkbox",
      label: "Activé",
      defaultData: true,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1": {
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

      title: "Anthropic",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/type": {
      comp: "none",
      constData: "anthropic",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 4
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/id": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "ID du fournisseur",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 5
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Anthropic\"",
        pure: true,
        dataAlias: "value",
        ref: 7
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/enabled": {
      comp: "checkbox",
      label: "Activé",
      defaultData: true,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2": {
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

      title: "Google",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/type": {
      comp: "none",
      constData: "google",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 4
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/id": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "ID du fournisseur",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 5
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Google\"",
        pure: true,
        dataAlias: "value",
        ref: 8
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/enabled": {
      comp: "checkbox",
      label: "Activé",
      defaultData: true,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3": {
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

      title: "Mistral",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/type": {
      comp: "none",
      constData: "mistral",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 4
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/id": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "ID du fournisseur",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 5
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Mistral\"",
        pure: true,
        dataAlias: "value",
        ref: 9
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/enabled": {
      comp: "checkbox",
      label: "Activé",
      defaultData: true,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4": {
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

      title: "OpenRouter",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/type": {
      comp: "none",
      constData: "openrouter",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 4
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/id": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "ID du fournisseur",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 5
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"OpenRouter\"",
        pure: true,
        dataAlias: "value",
        ref: 10
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/enabled": {
      comp: "checkbox",
      label: "Activé",
      defaultData: true,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5": {
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
      }, {
        key: "baseURL"
      }],

      title: "Ollama",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/type": {
      comp: "none",
      constData: "ollama",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 4
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/id": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "ID du fournisseur",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 5
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Ollama\"",
        pure: true,
        dataAlias: "value",
        ref: 11
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/enabled": {
      comp: "checkbox",
      label: "Activé",
      defaultData: true,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5/properties/baseURL": {
      comp: "text-field",
      label: "URL de base",
      defaultData: "http://localhost:11434",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6": {
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
      }, {
        key: "projectId"
      }],

      title: "Scaleway",
      subtitle: "<p>Pour une clé API liée à un Projet Scaleway spécifique, renseignez l&#39;ID du projet afin que les requêtes ciblent ce projet. Laissez vide pour utiliser le projet par défaut de l&#39;organisation.</p>",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/type": {
      comp: "none",
      constData: "scaleway",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 4
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/id": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "ID du fournisseur",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 5
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Scaleway\"",
        pure: true,
        dataAlias: "value",
        ref: 12
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/enabled": {
      comp: "checkbox",
      label: "Activé",
      defaultData: true,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6/properties/projectId": {
      comp: "text-field",
      label: "ID du projet",
      help: "<p>Optionnel. L&#39;ID du Projet Scaleway (UUID) auquel la clé API est liée. Requis lorsque la clé n&#39;a accès qu&#39;à un projet spécifique, sinon le listing des modèles et l&#39;inférence renvoient une erreur 403.</p>"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7": {
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
        key: "baseURL"
      }, {
        key: "apiKey"
      }, {
        key: "compatibility"
      }],

      title: "Compatible OpenAI",
      subtitle: "<p>Fournisseur générique pour tout endpoint compatible OpenAI (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). La clé API est optionnelle pour les serveurs locaux sans authentification.</p>",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/type": {
      comp: "none",
      constData: "openai-compatible",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 4
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/id": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "ID du fournisseur",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 5
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"OpenAI Compatible\"",
        pure: true,
        dataAlias: "value",
        ref: 13
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/enabled": {
      comp: "checkbox",
      label: "Activé",
      defaultData: true,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/baseURL": {
      comp: "text-field",
      label: "URL de base"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7/properties/compatibility": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"key\":\"default\",\"title\":\"default\",\"value\":\"default\"},{\"key\":\"compatible\",\"title\":\"compatible\",\"value\":\"compatible\"}]",
        immutable: true,
        ref: 14
      },

      label: "Mode de compatibilité",
      help: "<p>Utilisez &quot;compatible&quot; pour les fournisseurs qui ne supportent pas le nouveau endpoint /v1/responses (ex: LiteLLM, anciennes APIs compatibles OpenAI). Laissez vide pour le comportement OpenAI standard.</p>",
      defaultData: "default",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "id"
      }, {
        key: "name"
      }, {
        key: "enabled"
      }],

      title: "Mock",
      subtitle: "<p>To a message &quot;hello&quot; respond &quot;world&quot;, to a message &quot;call tool ARG1 ARG2&quot; respond with a tool call, to anything else respond &quot;what do you mean ?&quot;</p>",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/type": {
      comp: "none",
      constData: "mock",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 4
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/id": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "ID du fournisseur",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 5
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Mock\"",
        pure: true,
        dataAlias: "value",
        ref: 15
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8/properties/enabled": {
      comp: "checkbox",
      label: "Activé",
      defaultData: true,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/models": {
      if: {
        type: "js-eval",
        expr: "parent.data.providers?.length",
        pure: false,
        dataAlias: "value",
        ref: 16
      },

      itemTitle: {
        type: "js-eval",
        expr: "item?.model ? `${item.model.name} (${item.usage?.join(\", \")})` : \"\"",
        pure: true,
        dataAlias: "item",
        ref: 17
      },

      listActions: ["add", "edit", "delete"],
      comp: "list",
      title: "Modèles",
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

    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items": {
      comp: "section",

      children: [{
        key: "model"
      }, {
        key: "usage"
      }, {
        key: "multiplier"
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

    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/model": {
      comp: "autocomplete",

      getItems: {
        url: {
          type: "js-tpl",
          expr: "${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${(rootData.providers || []).map(p => p.id).join(\",\")}",
          pure: false,
          dataAlias: "value",
          ref: 18
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.results",
          pure: true,
          dataAlias: "body",
          ref: 21
        },

        itemTitle: {
          type: "js-eval",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          pure: true,
          dataAlias: "item",
          ref: 19
        },

        itemKey: {
          type: "js-eval",
          expr: "item.id",
          pure: true,
          dataAlias: "item",
          ref: 20
        },

        returnObjects: true
      },

      label: "Modèle"
    },

    "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/id": {
      comp: "text-field",
      label: "Model ID"
    },

    "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/name": {
      comp: "text-field",
      label: "Name"
    },

    "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "name"
      }, {
        key: "id"
      }],

      title: null,
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/type": {
      comp: "text-field",
      label: "Provider Type"
    },

    "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/name": {
      comp: "text-field",
      label: "Provider Name"
    },

    "https://github.com/data-fair/agents/settings/put-req#/definitions/Model/properties/provider/properties/id": {
      comp: "text-field",
      label: "Provider ID"
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"assistant\",\"title\":\"Assistant\",\"key\":\"assistant\",\"value\":\"assistant\"},{\"const\":\"tools\",\"title\":\"Outils\",\"key\":\"tools\",\"value\":\"tools\"},{\"const\":\"summarizer\",\"title\":\"Résumeur\",\"key\":\"summarizer\",\"value\":\"summarizer\"},{\"const\":\"evaluator\",\"title\":\"Évaluateur\",\"key\":\"evaluator\",\"value\":\"evaluator\"},{\"const\":\"moderator\",\"title\":\"Modérateur\",\"key\":\"moderator\",\"value\":\"moderator\"}]",
        immutable: true,
        ref: 22
      },

      multiple: true,
      label: "Usages appropriés",
      defaultData: [],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"assistant\",\"title\":\"Assistant\",\"key\":\"assistant\",\"value\":\"assistant\"},{\"const\":\"tools\",\"title\":\"Outils\",\"key\":\"tools\",\"value\":\"tools\"},{\"const\":\"summarizer\",\"title\":\"Résumeur\",\"key\":\"summarizer\",\"value\":\"summarizer\"},{\"const\":\"evaluator\",\"title\":\"Évaluateur\",\"key\":\"evaluator\",\"value\":\"evaluator\"},{\"const\":\"moderator\",\"title\":\"Modérateur\",\"key\":\"moderator\",\"value\":\"moderator\"}]",
        immutable: true,
        ref: 22
      },

      label: "",
      nullable: true
    },

    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/multiplier": {
      comp: "number-field",
      min: 0,
      label: "Multiplicateur de crédits",
      help: "<p>crédits = (tokens d&#39;entrée + tokens de sortie × poids de sortie) / 1M × multiplicateur</p>",
      defaultData: 1,

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
    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/0": validate22,
    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/1": validate24,
    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/2": validate25,
    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/3": validate26,
    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/4": validate27,
    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/5": validate28,
    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/6": validate29,
    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/7": validate30,
    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items/oneOf/8": validate31,
    "https://github.com/data-fair/agents/settings/put-req#/properties/providers/items": validate32,
    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items/properties/usage/items": validate33,
    "https://github.com/data-fair/agents/settings/put-req#/properties/models/items": validate34,
    "https://github.com/data-fair/agents/settings/put-req#": validate37
  },

  validationErrors: {},
  expressions: [expression0, expression1, expression2, expression3, expression4, expression5, expression6, expression7, expression8, expression9, expression10, expression11, expression12, expression13, expression14, expression15, expression16, expression17, expression18, expression19, expression20, expression21, expression22],
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
    },

    markdown: {
      name: "markdown",
      shouldDebounce: true,
      emitsBlur: true,
      focusable: true
    }
  },

  localizeErrors: localizeErrors
};

const nodeComponents = {
  
  "section": sectionNode,
  
  "list": listNode,
  
  "one-of-select": oneofselectNode,
  
  "text-field": textfieldNode,
  
  "checkbox": checkboxNode,
  
  "select": selectNode,
  
  "autocomplete": autocompleteNode,
  
  "number-field": numberfieldNode,
    
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