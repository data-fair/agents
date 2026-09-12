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

import checkboxNode from '@koumoul/vjsf/components/nodes/checkbox.vue'

import selectNode from '@koumoul/vjsf/components/nodes/select.vue'

import textfieldNode from '@koumoul/vjsf/components/nodes/text-field.vue'

import listNode from '@koumoul/vjsf/components/nodes/list.vue'

import oneofselectNode from '@koumoul/vjsf/components/nodes/one-of-select.vue'

import cardNode from '@koumoul/vjsf/components/nodes/card.vue'

import autocompleteNode from '@koumoul/vjsf/components/nodes/autocomplete.vue'

import numberfieldNode from '@koumoul/vjsf/components/nodes/number-field.vue'


import localizeErrors from "ajv-i18n/localize/fr/index.js";
import { fullFormats } from "ajv-formats/dist/formats.js";

const export0 = validate22;
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0"};
const schema40 = {"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};
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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema40.required,parentSchema:schema40,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema40.required,parentSchema:schema40,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema40.required,parentSchema:schema40,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema40.required,parentSchema:schema40,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema40.properties.type.type,parentSchema:schema40.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openai" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema40.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema40.properties.id.type,parentSchema:schema40.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema40.properties.name.type,parentSchema:schema40.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema40.properties.enabled.type,parentSchema:schema40.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema40.properties.apiKey.type,parentSchema:schema40.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema40.type,parentSchema:schema40,data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema40.errorMessage[key0][keyProp0],schema:schema40.errorMessage,parentSchema:schema40,data};
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

const export1 = validate24;
const schema41 = {"$id":"export1","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1"};
const schema42 = {"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema42.required,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema42.required,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema42.required,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema42.required,parentSchema:schema42,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.type.type,parentSchema:schema42.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("anthropic" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant",schema:"anthropic",parentSchema:schema42.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.id.type,parentSchema:schema42.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.name.type,parentSchema:schema42.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema42.properties.enabled.type,parentSchema:schema42.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.apiKey.type,parentSchema:schema42.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema42.type,parentSchema:schema42,data};
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
if((((((err16.keyword !== "errorMessage") && (!err16.emUsed)) && (err16.instancePath === instancePath)) && (err16.keyword in emErrors0)) && (err16.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err16.schemaPath.slice(84)))){
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema42.errorMessage[key0][keyProp0],schema:schema42.errorMessage,parentSchema:schema42,data};
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

const export2 = validate25;
const schema43 = {"$id":"export2","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2"};
const schema44 = {"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema44.required,parentSchema:schema44,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema44.required,parentSchema:schema44,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema44.required,parentSchema:schema44,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema44.required,parentSchema:schema44,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.properties.type.type,parentSchema:schema44.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("google" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant",schema:"google",parentSchema:schema44.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.properties.id.type,parentSchema:schema44.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.properties.name.type,parentSchema:schema44.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema44.properties.enabled.type,parentSchema:schema44.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.properties.apiKey.type,parentSchema:schema44.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema44.type,parentSchema:schema44,data};
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
if((((((err16.keyword !== "errorMessage") && (!err16.emUsed)) && (err16.instancePath === instancePath)) && (err16.keyword in emErrors0)) && (err16.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err16.schemaPath.slice(84)))){
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema44.errorMessage[key0][keyProp0],schema:schema44.errorMessage,parentSchema:schema44,data};
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

const export3 = validate26;
const schema45 = {"$id":"export3","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3"};
const schema46 = {"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema46.required,parentSchema:schema46,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema46.required,parentSchema:schema46,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema46.required,parentSchema:schema46,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema46.required,parentSchema:schema46,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.type.type,parentSchema:schema46.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("mistral" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant",schema:"mistral",parentSchema:schema46.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.id.type,parentSchema:schema46.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.name.type,parentSchema:schema46.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema46.properties.enabled.type,parentSchema:schema46.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.apiKey.type,parentSchema:schema46.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema46.type,parentSchema:schema46,data};
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
if((((((err16.keyword !== "errorMessage") && (!err16.emUsed)) && (err16.instancePath === instancePath)) && (err16.keyword in emErrors0)) && (err16.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3") === 0)) && (/^\/[^\/]*$/.test(err16.schemaPath.slice(84)))){
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema46.errorMessage[key0][keyProp0],schema:schema46.errorMessage,parentSchema:schema46,data};
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

const export4 = validate27;
const schema47 = {"$id":"export4","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4"};
const schema48 = {"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema48.required,parentSchema:schema48,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema48.required,parentSchema:schema48,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema48.required,parentSchema:schema48,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema48.required,parentSchema:schema48,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema48.properties.type.type,parentSchema:schema48.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openrouter" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant",schema:"openrouter",parentSchema:schema48.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema48.properties.id.type,parentSchema:schema48.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema48.properties.name.type,parentSchema:schema48.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema48.properties.enabled.type,parentSchema:schema48.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema48.properties.apiKey.type,parentSchema:schema48.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema48.type,parentSchema:schema48,data};
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
if((((((err16.keyword !== "errorMessage") && (!err16.emUsed)) && (err16.instancePath === instancePath)) && (err16.keyword in emErrors0)) && (err16.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4") === 0)) && (/^\/[^\/]*$/.test(err16.schemaPath.slice(84)))){
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema48.errorMessage[key0][keyProp0],schema:schema48.errorMessage,parentSchema:schema48,data};
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

const export5 = validate28;
const schema49 = {"$id":"export5","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5"};
const schema50 = {"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema50.required,parentSchema:schema50,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema50.required,parentSchema:schema50,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema50.required,parentSchema:schema50,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema50.required,parentSchema:schema50,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.baseURL === undefined){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema50.required,parentSchema:schema50,data};
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
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema50.properties.type.type,parentSchema:schema50.properties.type,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("ollama" !== data0){
const err6 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant",schema:"ollama",parentSchema:schema50.properties.type,data:data0};
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
const err8 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema50.properties.id.type,parentSchema:schema50.properties.id,data:data1};
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
const err10 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema50.properties.name.type,parentSchema:schema50.properties.name,data:data2};
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
const err12 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema50.properties.enabled.type,parentSchema:schema50.properties.enabled,data:data3};
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
const err14 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema50.properties.apiKey.type,parentSchema:schema50.properties.apiKey,data:data4};
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
const err16 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema50.properties.baseURL.type,parentSchema:schema50.properties.baseURL,data:data5};
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
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema50.type,parentSchema:schema50,data};
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
if((((((err19.keyword !== "errorMessage") && (!err19.emUsed)) && (err19.instancePath === instancePath)) && (err19.keyword in emErrors0)) && (err19.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5") === 0)) && (/^\/[^\/]*$/.test(err19.schemaPath.slice(84)))){
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
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema50.errorMessage[key0][keyProp0],schema:schema50.errorMessage,parentSchema:schema50,data};
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

const export6 = validate29;
const schema51 = {"$id":"export6","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6"};
const schema52 = {"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","description":"Pour une clé API liée à un Projet Scaleway spécifique, renseignez l'ID du projet afin que les requêtes ciblent ce projet. Laissez vide pour utiliser le projet par défaut de l'organisation.","properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Scaleway\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey","errorMessage":{}},"projectId":{"type":"string","title":"ID du projet","description":"Optionnel. L'ID du Projet Scaleway (UUID) auquel la clé API est liée. Requis lorsque la clé n'a accès qu'à un projet spécifique, sinon le listing des modèles et l'inférence renvoient une erreur 403.","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/projectId","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","apiKey":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema52.required,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema52.required,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema52.required,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema52.required,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.apiKey === undefined){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "apiKey"},message:"must have required property '"+"apiKey"+"'",schema:schema52.required,parentSchema:schema52,data};
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
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.properties.type.type,parentSchema:schema52.properties.type,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("scaleway" !== data0){
const err6 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "scaleway"},message:"must be equal to constant",schema:"scaleway",parentSchema:schema52.properties.type,data:data0};
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
const err8 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.properties.id.type,parentSchema:schema52.properties.id,data:data1};
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
const err10 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.properties.name.type,parentSchema:schema52.properties.name,data:data2};
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
const err12 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema52.properties.enabled.type,parentSchema:schema52.properties.enabled,data:data3};
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
const err14 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.properties.apiKey.type,parentSchema:schema52.properties.apiKey,data:data4};
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
const err16 = {instancePath:instancePath+"/projectId",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/projectId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.properties.projectId.type,parentSchema:schema52.properties.projectId,data:data5};
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
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema52.type,parentSchema:schema52,data};
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
if((((((err19.keyword !== "errorMessage") && (!err19.emUsed)) && (err19.instancePath === instancePath)) && (err19.keyword in emErrors0)) && (err19.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6") === 0)) && (/^\/[^\/]*$/.test(err19.schemaPath.slice(84)))){
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
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema52.errorMessage[key0][keyProp0],schema:schema52.errorMessage,parentSchema:schema52,data};
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

const export7 = validate30;
const schema53 = {"$id":"export7","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7"};
const schema54 = {"required":["type","name","id","enabled","baseURL"],"title":"Compatible OpenAI","description":"Fournisseur générique pour tout endpoint compatible OpenAI (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). La clé API est optionnelle pour les serveurs locaux sans authentification.","properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenAI Compatible\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey","errorMessage":{}},"compatibility":{"type":"string","title":"Mode de compatibilité","description":"Utilisez \"compatible\" pour les fournisseurs qui ne supportent pas le nouveau endpoint /v1/responses (ex: LiteLLM, anciennes APIs compatibles OpenAI). Laissez vide pour le comportement OpenAI standard.","enum":["default","compatible"],"default":"default","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/compatibility","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema54.required,parentSchema:schema54,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema54.required,parentSchema:schema54,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema54.required,parentSchema:schema54,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema54.required,parentSchema:schema54,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.baseURL === undefined){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema54.required,parentSchema:schema54,data};
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
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema54.properties.type.type,parentSchema:schema54.properties.type,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("openai-compatible" !== data0){
const err6 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue: "openai-compatible"},message:"must be equal to constant",schema:"openai-compatible",parentSchema:schema54.properties.type,data:data0};
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
const err8 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema54.properties.id.type,parentSchema:schema54.properties.id,data:data1};
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
const err10 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema54.properties.name.type,parentSchema:schema54.properties.name,data:data2};
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
const err12 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema54.properties.enabled.type,parentSchema:schema54.properties.enabled,data:data3};
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
const err14 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema54.properties.baseURL.type,parentSchema:schema54.properties.baseURL,data:data4};
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
const err16 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema54.properties.apiKey.type,parentSchema:schema54.properties.apiKey,data:data5};
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
const err18 = {instancePath:instancePath+"/compatibility",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/compatibility/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema54.properties.compatibility.type,parentSchema:schema54.properties.compatibility,data:data6};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!((data6 === "default") || (data6 === "compatible"))){
const err19 = {instancePath:instancePath+"/compatibility",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/compatibility/enum",keyword:"enum",params:{allowedValues: schema54.properties.compatibility.enum},message:"must be equal to one of the allowed values",schema:schema54.properties.compatibility.enum,parentSchema:schema54.properties.compatibility,data:data6};
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
const err21 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema54.type,parentSchema:schema54,data};
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
if((((((err22.keyword !== "errorMessage") && (!err22.emUsed)) && (err22.instancePath === instancePath)) && (err22.keyword in emErrors0)) && (err22.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7") === 0)) && (/^\/[^\/]*$/.test(err22.schemaPath.slice(84)))){
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
const err23 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema54.errorMessage[key0][keyProp0],schema:schema54.errorMessage,parentSchema:schema54,data};
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

const export8 = validate31;
const schema55 = {"$id":"export8","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8"};
const schema56 = {"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema56.required,parentSchema:schema56,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema56.required,parentSchema:schema56,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema56.required,parentSchema:schema56,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema56.required,parentSchema:schema56,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema56.properties.type.type,parentSchema:schema56.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("mock" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema56.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema56.properties.id.type,parentSchema:schema56.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema56.properties.name.type,parentSchema:schema56.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema56.properties.enabled.type,parentSchema:schema56.properties.enabled,data:data3};
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
const err13 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema56.type,parentSchema:schema56,data};
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
if((((((err14.keyword !== "errorMessage") && (!err14.emUsed)) && (err14.instancePath === instancePath)) && (err14.keyword in emErrors0)) && (err14.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8") === 0)) && (/^\/[^\/]*$/.test(err14.schemaPath.slice(84)))){
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema56.errorMessage[key0][keyProp0],schema:schema56.errorMessage,parentSchema:schema56,data};
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

const export9 = validate32;
const schema57 = {"$id":"export9","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items"};
const schema58 = {"type":"object","title":"Fournisseur","unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}},{"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","description":"Pour une clé API liée à un Projet Scaleway spécifique, renseignez l'ID du projet afin que les requêtes ciblent ce projet. Laissez vide pour utiliser le projet par défaut de l'organisation.","properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Scaleway\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey","errorMessage":{}},"projectId":{"type":"string","title":"ID du projet","description":"Optionnel. L'ID du Projet Scaleway (UUID) auquel la clé API est liée. Requis lorsque la clé n'a accès qu'à un projet spécifique, sinon le listing des modèles et l'inférence renvoient une erreur 403.","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/projectId","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","apiKey":"information obligatoire"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Compatible OpenAI","description":"Fournisseur générique pour tout endpoint compatible OpenAI (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). La clé API est optionnelle pour les serveurs locaux sans authentification.","properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenAI Compatible\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey","errorMessage":{}},"compatibility":{"type":"string","title":"Mode de compatibilité","description":"Utilisez \"compatible\" pour les fournisseurs qui ne supportent pas le nouveau endpoint /v1/responses (ex: LiteLLM, anciennes APIs compatibles OpenAI). Laissez vide pour le comportement OpenAI standard.","enum":["default","compatible"],"default":"default","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/compatibility","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items","errorMessage":{"oneOf":"choisissez une valeur"}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema58.oneOf[0].required,parentSchema:schema58.oneOf[0],data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema58.oneOf[0].required,parentSchema:schema58.oneOf[0],data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema58.oneOf[0].required,parentSchema:schema58.oneOf[0],data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema58.oneOf[0].required,parentSchema:schema58.oneOf[0],data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[0].properties.type.type,parentSchema:schema58.oneOf[0].properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openai" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema58.oneOf[0].properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[0].properties.id.type,parentSchema:schema58.oneOf[0].properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[0].properties.name.type,parentSchema:schema58.oneOf[0].properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema58.oneOf[0].properties.enabled.type,parentSchema:schema58.oneOf[0].properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[0].properties.apiKey.type,parentSchema:schema58.oneOf[0].properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[0].type,parentSchema:schema58.oneOf[0],data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema58.oneOf[0].errorMessage[key0][keyProp0],schema:schema58.oneOf[0].errorMessage,parentSchema:schema58.oneOf[0],data};
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
const err19 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema58.oneOf[1].required,parentSchema:schema58.oneOf[1],data};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data.name === undefined){
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema58.oneOf[1].required,parentSchema:schema58.oneOf[1],data};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data.id === undefined){
const err21 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema58.oneOf[1].required,parentSchema:schema58.oneOf[1],data};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data.enabled === undefined){
const err22 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema58.oneOf[1].required,parentSchema:schema58.oneOf[1],data};
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
const err23 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[1].properties.type.type,parentSchema:schema58.oneOf[1].properties.type,data:data5};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if("anthropic" !== data5){
const err24 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant",schema:"anthropic",parentSchema:schema58.oneOf[1].properties.type,data:data5};
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
const err26 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[1].properties.id.type,parentSchema:schema58.oneOf[1].properties.id,data:data6};
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
const err28 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[1].properties.name.type,parentSchema:schema58.oneOf[1].properties.name,data:data7};
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
const err30 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema58.oneOf[1].properties.enabled.type,parentSchema:schema58.oneOf[1].properties.enabled,data:data8};
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
const err32 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[1].properties.apiKey.type,parentSchema:schema58.oneOf[1].properties.apiKey,data:data9};
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
const err34 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[1].type,parentSchema:schema58.oneOf[1],data};
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
if((((((err35.keyword !== "errorMessage") && (!err35.emUsed)) && (err35.instancePath === instancePath)) && (err35.keyword in emErrors1)) && (err35.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err35.schemaPath.slice(84)))){
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
const err36 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema58.oneOf[1].errorMessage[key1][keyProp1],schema:schema58.oneOf[1].errorMessage,parentSchema:schema58.oneOf[1],data};
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
const err38 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema58.oneOf[2].required,parentSchema:schema58.oneOf[2],data};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data.name === undefined){
const err39 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema58.oneOf[2].required,parentSchema:schema58.oneOf[2],data};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data.id === undefined){
const err40 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema58.oneOf[2].required,parentSchema:schema58.oneOf[2],data};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data.enabled === undefined){
const err41 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema58.oneOf[2].required,parentSchema:schema58.oneOf[2],data};
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
const err42 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[2].properties.type.type,parentSchema:schema58.oneOf[2].properties.type,data:data10};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if("google" !== data10){
const err43 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant",schema:"google",parentSchema:schema58.oneOf[2].properties.type,data:data10};
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
const err45 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[2].properties.id.type,parentSchema:schema58.oneOf[2].properties.id,data:data11};
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
const err47 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[2].properties.name.type,parentSchema:schema58.oneOf[2].properties.name,data:data12};
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
const err49 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema58.oneOf[2].properties.enabled.type,parentSchema:schema58.oneOf[2].properties.enabled,data:data13};
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
const err51 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[2].properties.apiKey.type,parentSchema:schema58.oneOf[2].properties.apiKey,data:data14};
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
const err53 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[2].type,parentSchema:schema58.oneOf[2],data};
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
if((((((err54.keyword !== "errorMessage") && (!err54.emUsed)) && (err54.instancePath === instancePath)) && (err54.keyword in emErrors2)) && (err54.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err54.schemaPath.slice(84)))){
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
const err55 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema58.oneOf[2].errorMessage[key2][keyProp2],schema:schema58.oneOf[2].errorMessage,parentSchema:schema58.oneOf[2],data};
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
const err57 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema58.oneOf[3].required,parentSchema:schema58.oneOf[3],data};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data.name === undefined){
const err58 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema58.oneOf[3].required,parentSchema:schema58.oneOf[3],data};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data.id === undefined){
const err59 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema58.oneOf[3].required,parentSchema:schema58.oneOf[3],data};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data.enabled === undefined){
const err60 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema58.oneOf[3].required,parentSchema:schema58.oneOf[3],data};
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
const err61 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[3].properties.type.type,parentSchema:schema58.oneOf[3].properties.type,data:data15};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if("mistral" !== data15){
const err62 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant",schema:"mistral",parentSchema:schema58.oneOf[3].properties.type,data:data15};
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
const err64 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[3].properties.id.type,parentSchema:schema58.oneOf[3].properties.id,data:data16};
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
const err66 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[3].properties.name.type,parentSchema:schema58.oneOf[3].properties.name,data:data17};
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
const err68 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema58.oneOf[3].properties.enabled.type,parentSchema:schema58.oneOf[3].properties.enabled,data:data18};
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
const err70 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[3].properties.apiKey.type,parentSchema:schema58.oneOf[3].properties.apiKey,data:data19};
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
const err72 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[3].type,parentSchema:schema58.oneOf[3],data};
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
if((((((err73.keyword !== "errorMessage") && (!err73.emUsed)) && (err73.instancePath === instancePath)) && (err73.keyword in emErrors3)) && (err73.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3") === 0)) && (/^\/[^\/]*$/.test(err73.schemaPath.slice(84)))){
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
const err74 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema58.oneOf[3].errorMessage[key3][keyProp3],schema:schema58.oneOf[3].errorMessage,parentSchema:schema58.oneOf[3],data};
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
const err76 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema58.oneOf[4].required,parentSchema:schema58.oneOf[4],data};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
if(data.name === undefined){
const err77 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema58.oneOf[4].required,parentSchema:schema58.oneOf[4],data};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(data.id === undefined){
const err78 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema58.oneOf[4].required,parentSchema:schema58.oneOf[4],data};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if(data.enabled === undefined){
const err79 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema58.oneOf[4].required,parentSchema:schema58.oneOf[4],data};
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
const err80 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[4].properties.type.type,parentSchema:schema58.oneOf[4].properties.type,data:data20};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if("openrouter" !== data20){
const err81 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant",schema:"openrouter",parentSchema:schema58.oneOf[4].properties.type,data:data20};
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
const err83 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[4].properties.id.type,parentSchema:schema58.oneOf[4].properties.id,data:data21};
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
const err85 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[4].properties.name.type,parentSchema:schema58.oneOf[4].properties.name,data:data22};
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
const err87 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema58.oneOf[4].properties.enabled.type,parentSchema:schema58.oneOf[4].properties.enabled,data:data23};
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
const err89 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[4].properties.apiKey.type,parentSchema:schema58.oneOf[4].properties.apiKey,data:data24};
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
const err91 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[4].type,parentSchema:schema58.oneOf[4],data};
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
if((((((err92.keyword !== "errorMessage") && (!err92.emUsed)) && (err92.instancePath === instancePath)) && (err92.keyword in emErrors4)) && (err92.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4") === 0)) && (/^\/[^\/]*$/.test(err92.schemaPath.slice(84)))){
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
const err93 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema58.oneOf[4].errorMessage[key4][keyProp4],schema:schema58.oneOf[4].errorMessage,parentSchema:schema58.oneOf[4],data};
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
const err95 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema58.oneOf[5].required,parentSchema:schema58.oneOf[5],data};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
if(data.name === undefined){
const err96 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema58.oneOf[5].required,parentSchema:schema58.oneOf[5],data};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(data.id === undefined){
const err97 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema58.oneOf[5].required,parentSchema:schema58.oneOf[5],data};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
if(data.enabled === undefined){
const err98 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema58.oneOf[5].required,parentSchema:schema58.oneOf[5],data};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(data.baseURL === undefined){
const err99 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema58.oneOf[5].required,parentSchema:schema58.oneOf[5],data};
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
const err100 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[5].properties.type.type,parentSchema:schema58.oneOf[5].properties.type,data:data25};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
if("ollama" !== data25){
const err101 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant",schema:"ollama",parentSchema:schema58.oneOf[5].properties.type,data:data25};
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
const err103 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[5].properties.id.type,parentSchema:schema58.oneOf[5].properties.id,data:data26};
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
const err105 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[5].properties.name.type,parentSchema:schema58.oneOf[5].properties.name,data:data27};
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
const err107 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema58.oneOf[5].properties.enabled.type,parentSchema:schema58.oneOf[5].properties.enabled,data:data28};
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
const err109 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[5].properties.apiKey.type,parentSchema:schema58.oneOf[5].properties.apiKey,data:data29};
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
const err111 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[5].properties.baseURL.type,parentSchema:schema58.oneOf[5].properties.baseURL,data:data30};
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
const err113 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[5].type,parentSchema:schema58.oneOf[5],data};
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
if((((((err114.keyword !== "errorMessage") && (!err114.emUsed)) && (err114.instancePath === instancePath)) && (err114.keyword in emErrors5)) && (err114.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5") === 0)) && (/^\/[^\/]*$/.test(err114.schemaPath.slice(84)))){
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
const err115 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors5},message:tmpl5 ? tmpl5() : schema58.oneOf[5].errorMessage[key5][keyProp5],schema:schema58.oneOf[5].errorMessage,parentSchema:schema58.oneOf[5],data};
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
const err117 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema58.oneOf[6].required,parentSchema:schema58.oneOf[6],data};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
if(data.name === undefined){
const err118 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema58.oneOf[6].required,parentSchema:schema58.oneOf[6],data};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if(data.id === undefined){
const err119 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema58.oneOf[6].required,parentSchema:schema58.oneOf[6],data};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
if(data.enabled === undefined){
const err120 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema58.oneOf[6].required,parentSchema:schema58.oneOf[6],data};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
if(data.apiKey === undefined){
const err121 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "apiKey"},message:"must have required property '"+"apiKey"+"'",schema:schema58.oneOf[6].required,parentSchema:schema58.oneOf[6],data};
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
const err122 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[6].properties.type.type,parentSchema:schema58.oneOf[6].properties.type,data:data31};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
if("scaleway" !== data31){
const err123 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "scaleway"},message:"must be equal to constant",schema:"scaleway",parentSchema:schema58.oneOf[6].properties.type,data:data31};
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
const err125 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[6].properties.id.type,parentSchema:schema58.oneOf[6].properties.id,data:data32};
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
const err127 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[6].properties.name.type,parentSchema:schema58.oneOf[6].properties.name,data:data33};
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
const err129 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema58.oneOf[6].properties.enabled.type,parentSchema:schema58.oneOf[6].properties.enabled,data:data34};
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
const err131 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[6].properties.apiKey.type,parentSchema:schema58.oneOf[6].properties.apiKey,data:data35};
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
const err133 = {instancePath:instancePath+"/projectId",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/projectId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[6].properties.projectId.type,parentSchema:schema58.oneOf[6].properties.projectId,data:data36};
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
const err135 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[6].type,parentSchema:schema58.oneOf[6],data};
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
if((((((err136.keyword !== "errorMessage") && (!err136.emUsed)) && (err136.instancePath === instancePath)) && (err136.keyword in emErrors6)) && (err136.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6") === 0)) && (/^\/[^\/]*$/.test(err136.schemaPath.slice(84)))){
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
const err137 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema58.oneOf[6].errorMessage[key6][keyProp6],schema:schema58.oneOf[6].errorMessage,parentSchema:schema58.oneOf[6],data};
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
const err139 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema58.oneOf[7].required,parentSchema:schema58.oneOf[7],data};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
if(data.name === undefined){
const err140 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema58.oneOf[7].required,parentSchema:schema58.oneOf[7],data};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
if(data.id === undefined){
const err141 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema58.oneOf[7].required,parentSchema:schema58.oneOf[7],data};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
if(data.enabled === undefined){
const err142 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema58.oneOf[7].required,parentSchema:schema58.oneOf[7],data};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
if(data.baseURL === undefined){
const err143 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema58.oneOf[7].required,parentSchema:schema58.oneOf[7],data};
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
const err144 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[7].properties.type.type,parentSchema:schema58.oneOf[7].properties.type,data:data37};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
if("openai-compatible" !== data37){
const err145 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue: "openai-compatible"},message:"must be equal to constant",schema:"openai-compatible",parentSchema:schema58.oneOf[7].properties.type,data:data37};
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
const err147 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[7].properties.id.type,parentSchema:schema58.oneOf[7].properties.id,data:data38};
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
const err149 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[7].properties.name.type,parentSchema:schema58.oneOf[7].properties.name,data:data39};
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
const err151 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema58.oneOf[7].properties.enabled.type,parentSchema:schema58.oneOf[7].properties.enabled,data:data40};
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
const err153 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[7].properties.baseURL.type,parentSchema:schema58.oneOf[7].properties.baseURL,data:data41};
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
const err155 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[7].properties.apiKey.type,parentSchema:schema58.oneOf[7].properties.apiKey,data:data42};
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
const err157 = {instancePath:instancePath+"/compatibility",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/compatibility/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[7].properties.compatibility.type,parentSchema:schema58.oneOf[7].properties.compatibility,data:data43};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
if(!((data43 === "default") || (data43 === "compatible"))){
const err158 = {instancePath:instancePath+"/compatibility",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/compatibility/enum",keyword:"enum",params:{allowedValues: schema58.oneOf[7].properties.compatibility.enum},message:"must be equal to one of the allowed values",schema:schema58.oneOf[7].properties.compatibility.enum,parentSchema:schema58.oneOf[7].properties.compatibility,data:data43};
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
const err160 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[7].type,parentSchema:schema58.oneOf[7],data};
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
if((((((err161.keyword !== "errorMessage") && (!err161.emUsed)) && (err161.instancePath === instancePath)) && (err161.keyword in emErrors7)) && (err161.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7") === 0)) && (/^\/[^\/]*$/.test(err161.schemaPath.slice(84)))){
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
const err162 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors7},message:tmpl7 ? tmpl7() : schema58.oneOf[7].errorMessage[key7][keyProp7],schema:schema58.oneOf[7].errorMessage,parentSchema:schema58.oneOf[7],data};
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
const err164 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema58.oneOf[8].required,parentSchema:schema58.oneOf[8],data};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
if(data.name === undefined){
const err165 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema58.oneOf[8].required,parentSchema:schema58.oneOf[8],data};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
if(data.id === undefined){
const err166 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema58.oneOf[8].required,parentSchema:schema58.oneOf[8],data};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
if(data.enabled === undefined){
const err167 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema58.oneOf[8].required,parentSchema:schema58.oneOf[8],data};
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
const err168 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[8].properties.type.type,parentSchema:schema58.oneOf[8].properties.type,data:data44};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
if("mock" !== data44){
const err169 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema58.oneOf[8].properties.type,data:data44};
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
const err171 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[8].properties.id.type,parentSchema:schema58.oneOf[8].properties.id,data:data45};
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
const err173 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[8].properties.name.type,parentSchema:schema58.oneOf[8].properties.name,data:data46};
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
const err175 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema58.oneOf[8].properties.enabled.type,parentSchema:schema58.oneOf[8].properties.enabled,data:data47};
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
const err177 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[8].type,parentSchema:schema58.oneOf[8],data};
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
if((((((err178.keyword !== "errorMessage") && (!err178.emUsed)) && (err178.instancePath === instancePath)) && (err178.keyword in emErrors8)) && (err178.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8") === 0)) && (/^\/[^\/]*$/.test(err178.schemaPath.slice(84)))){
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
const err179 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors8},message:tmpl8 ? tmpl8() : schema58.oneOf[8].errorMessage[key8][keyProp8],schema:schema58.oneOf[8].errorMessage,parentSchema:schema58.oneOf[8],data};
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
const err181 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema58.oneOf,parentSchema:schema58,data};
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
const err182 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/unevaluatedProperties",keyword:"unevaluatedProperties",params:{unevaluatedProperty: key9},message:"must NOT have unevaluated properties",schema:false,parentSchema:schema58,data};
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
const err183 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.type,parentSchema:schema58,data};
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
if((((((err184.keyword !== "errorMessage") && (!err184.emUsed)) && (err184.instancePath === instancePath)) && (err184.keyword in emErrors9)) && (err184.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items") === 0)) && (/^\/[^\/]*$/.test(err184.schemaPath.slice(76)))){
emErrors9[err184.keyword].push(err184);
err184.emUsed = true;
}
}
for(const key10 in emErrors9){
if(emErrors9[key10].length){
const err185 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors9[key10]},message:key10 in templates9 ? templates9[key10]() : schema58.errorMessage[key10],schema:schema58.errorMessage,parentSchema:schema58,data};
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

const export10 = validate33;
const schema59 = {"$id":"export10","$ref":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items"};
const schema60 = {"type":"string","oneOf":[{"const":"anonymous","title":"Anonyme"},{"const":"external","title":"Externe"},{"const":"user","title":"Utilisateur"},{"const":"contrib","title":"Contributeur"},{"const":"admin","title":"Administrateur"}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items","errorMessage":{"oneOf":"choisissez une valeur"}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.type,parentSchema:schema60,data};
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
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/oneOf/0/const",keyword:"const",params:{allowedValue: "anonymous"},message:"must be equal to constant",schema:"anonymous",parentSchema:schema60.oneOf[0],data};
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
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/oneOf/1/const",keyword:"const",params:{allowedValue: "external"},message:"must be equal to constant",schema:"external",parentSchema:schema60.oneOf[1],data};
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
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/oneOf/2/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema60.oneOf[2],data};
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
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/oneOf/3/const",keyword:"const",params:{allowedValue: "contrib"},message:"must be equal to constant",schema:"contrib",parentSchema:schema60.oneOf[3],data};
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
const err5 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/oneOf/4/const",keyword:"const",params:{allowedValue: "admin"},message:"must be equal to constant",schema:"admin",parentSchema:schema60.oneOf[4],data};
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
const err6 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema60.oneOf,parentSchema:schema60,data};
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
if((((((err7.keyword !== "errorMessage") && (!err7.emUsed)) && (err7.instancePath === instancePath)) && (err7.keyword in emErrors0)) && (err7.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items") === 0)) && (/^\/[^\/]*$/.test(err7.schemaPath.slice(99)))){
emErrors0[err7.keyword].push(err7);
err7.emUsed = true;
}
}
for(const key0 in emErrors0){
if(emErrors0[key0].length){
const err8 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors0[key0]},message:key0 in templates0 ? templates0[key0]() : schema60.errorMessage[key0],schema:schema60.errorMessage,parentSchema:schema60,data};
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

const export11 = validate34;
const schema61 = {"$id":"export11","$ref":"https://github.com/data-fair/agents/settings-put#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/settings-put","x-exports":["validate","types","vjsf"],"title":"Paramètres","layout":{"title":null},"definitions":{"RoleQuota":{"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Illimité","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited","errorMessage":{}},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Limite mensuelle","description":"Limite hebdomadaire = mensuelle / 2, limite journalière = mensuelle / 4","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"Model":{"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":{"pure":false,"type":"js-tpl","dataAlias":"value","expr":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}","ref":18},"itemsResults":{"pure":true,"type":"js-eval","dataAlias":"body","expr":"data.results","ref":21},"itemTitle":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","ref":19},"itemKey":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"item.id","ref":20},"returnObjects":true}},"properties":{"id":{"type":"string","title":"Model ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id","errorMessage":{}},"name":{"type":"string","title":"Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name","errorMessage":{}},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type","errorMessage":{}},"name":{"type":"string","title":"Provider Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name","errorMessage":{}},"id":{"type":"string","title":"Provider ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider","errorMessage":{"required":{"type":"information obligatoire","name":"information obligatoire","id":"information obligatoire"}}},"contextWindow":{"type":"number","title":"Context window","readOnly":true,"description":"Taille totale du contexte en tokens, telle que rapportée par le fournisseur lors de la sélection du modèle.","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/contextWindow","errorMessage":{}},"cachedInputPricePerMillion":{"type":"number","title":"Cached input price (per 1M tokens)","readOnly":true,"description":"Rapporté par le fournisseur lors de la sélection du modèle.","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cachedInputPricePerMillion","errorMessage":{}},"cacheWritePricePerMillion":{"type":"number","title":"Cache write price (per 1M tokens)","readOnly":true,"description":"Rapporté par le fournisseur lors de la sélection du modèle.","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cacheWritePricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}}},"type":"object","additionalProperties":false,"required":["providers"],"properties":{"createdAt":{"type":"string","format":"date-time","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/createdAt","errorMessage":{}},"updatedAt":{"type":"string","format":"date-time","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/updatedAt","errorMessage":{}},"storeTraces":{"type":"boolean","title":"Enregistrer les traces de conversation","description":"Si activé, les conversations des utilisateurs consentants sont enregistrées sur le serveur pendant 30 jours pour relecture par un administrateur. Chaque utilisateur doit explicitement accepter.","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/storeTraces","errorMessage":{}},"owner":{"type":"object","additionalProperties":false,"required":["type","id"],"readOnly":true,"properties":{"type":{"type":"string","enum":["user","organization"],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/type","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/name","errorMessage":{}},"department":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/department","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire"}}},"providers":{"type":"array","title":"Fournisseurs IA","layout":{"itemTitle":"item ? `${item.name || \"\"} - ${item.id.slice(0, 8)}` : \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","title":"Fournisseur","unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}},{"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","description":"Pour une clé API liée à un Projet Scaleway spécifique, renseignez l'ID du projet afin que les requêtes ciblent ce projet. Laissez vide pour utiliser le projet par défaut de l'organisation.","properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Scaleway\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey","errorMessage":{}},"projectId":{"type":"string","title":"ID du projet","description":"Optionnel. L'ID du Projet Scaleway (UUID) auquel la clé API est liée. Requis lorsque la clé n'a accès qu'à un projet spécifique, sinon le listing des modèles et l'inférence renvoient une erreur 403.","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/projectId","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","apiKey":"information obligatoire"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Compatible OpenAI","description":"Fournisseur générique pour tout endpoint compatible OpenAI (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). La clé API est optionnelle pour les serveurs locaux sans authentification.","properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenAI Compatible\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey","errorMessage":{}},"compatibility":{"type":"string","title":"Mode de compatibilité","description":"Utilisez \"compatible\" pour les fournisseurs qui ne supportent pas le nouveau endpoint /v1/responses (ex: LiteLLM, anciennes APIs compatibles OpenAI). Laissez vide pour le comportement OpenAI standard.","enum":["default","compatible"],"default":"default","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/compatibility","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items","errorMessage":{"oneOf":"choisissez une valeur"}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers","errorMessage":{}},"models":{"type":"object","title":"Modèles","layout":{"title":null,"if":"parent.data.providers?.length"},"default":{},"properties":{"assistant":{"type":"object","title":"Assistant","description":"L'interface conversationnelle principale. Équilibré pour le raisonnement, le suivi d'instructions et l'interaction naturelle. Ce modèle gère le flux de haut niveau et délègue les tâches complexes aux sous-agents.\n\nRecommandations : GPT-5.4, Claude 4.5 Sonnet, Kimi K2, Mistral Large 3, etc.","layout":{"comp":"card","children":[{"key":"model"},{"key":"contextWindow","cols":6},{"key":"inputPricePerMillion","cols":4},{"key":"cachedInputPricePerMillion","cols":4},{"key":"cacheWritePricePerMillion","cols":4},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Modèle","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}},"contextWindow":{"type":"number","title":"Taille de contexte (tokens, surcharge)","description":"Laissez vide pour utiliser la valeur rapportée par le fournisseur, ou 32000 si le fournisseur ne rapporte rien.","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/contextWindow","errorMessage":{}},"inputPricePerMillion":{"type":"number","title":"Prix d'entrée (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/inputPricePerMillion","errorMessage":{}},"cachedInputPricePerMillion":{"type":"number","title":"Prix d'entrée en cache (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/cachedInputPricePerMillion","errorMessage":{}},"cacheWritePricePerMillion":{"type":"number","title":"Prix d'écriture en cache (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/cacheWritePricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Prix de sortie (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant","errorMessage":{}},"tools":{"type":"object","title":"Outils","description":"Le « technicien ». Spécialisé dans les données structurées et l'interaction avec les API. Il excelle à enchaîner plusieurs appels d'outils sans remplissage conversationnel, garantissant une haute fiabilité dans les workflows automatisés.\n\nRecommandations : GPT-5.4 Mini, Mistral DevStral, Claude 4.5 Sonnet (Computer Use), MiMo-V2-Flash, etc.","layout":{"comp":"card","children":[{"key":"model"},{"key":"contextWindow","cols":6},{"key":"inputPricePerMillion","cols":4},{"key":"cachedInputPricePerMillion","cols":4},{"key":"cacheWritePricePerMillion","cols":4},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Modèle","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}},"contextWindow":{"type":"number","title":"Taille de contexte (tokens, surcharge)","description":"Laissez vide pour utiliser la valeur rapportée par le fournisseur, ou 32000 si le fournisseur ne rapporte rien.","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/contextWindow","errorMessage":{}},"inputPricePerMillion":{"type":"number","title":"Prix d'entrée (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/inputPricePerMillion","errorMessage":{}},"cachedInputPricePerMillion":{"type":"number","title":"Prix d'entrée en cache (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/cachedInputPricePerMillion","errorMessage":{}},"cacheWritePricePerMillion":{"type":"number","title":"Prix d'écriture en cache (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/cacheWritePricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Prix de sortie (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools","errorMessage":{}},"summarizer":{"type":"object","title":"Résumeur","description":"Un spécialiste de la « synthèse ». Optimisé pour extraire rapidement les points clés de blocs de texte petits à moyens. Il privilégie la densité d'information et la concision pour garder les fenêtres de contexte légères et les coûts bas.\n\nRecommandations : GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Qwen3 (8B), etc.","layout":{"comp":"card","children":[{"key":"model"},{"key":"contextWindow","cols":6},{"key":"inputPricePerMillion","cols":4},{"key":"cachedInputPricePerMillion","cols":4},{"key":"cacheWritePricePerMillion","cols":4},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Modèle","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}},"contextWindow":{"type":"number","title":"Taille de contexte (tokens, surcharge)","description":"Laissez vide pour utiliser la valeur rapportée par le fournisseur, ou 32000 si le fournisseur ne rapporte rien.","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/contextWindow","errorMessage":{}},"inputPricePerMillion":{"type":"number","title":"Prix d'entrée (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/inputPricePerMillion","errorMessage":{}},"cachedInputPricePerMillion":{"type":"number","title":"Prix d'entrée en cache (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/cachedInputPricePerMillion","errorMessage":{}},"cacheWritePricePerMillion":{"type":"number","title":"Prix d'écriture en cache (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/cacheWritePricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Prix de sortie (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer","errorMessage":{}},"evaluator":{"type":"object","title":"Évaluateur","description":"Le « contrôleur qualité ». Analyse la logique de l'assistant et les sorties des outils pour vérifier la précision et la sécurité. Il nécessite les capacités de raisonnement les plus élevées pour servir de référence fiable pour les performances du système.\n\nRecommandations : Claude Opus 4.6, GPT-5.4 (Reasoning), DeepSeek-R1, Pharia-1-LLM, etc.","layout":{"comp":"card","children":[{"key":"model"},{"key":"contextWindow","cols":6},{"key":"inputPricePerMillion","cols":4},{"key":"cachedInputPricePerMillion","cols":4},{"key":"cacheWritePricePerMillion","cols":4},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Modèle","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}},"contextWindow":{"type":"number","title":"Taille de contexte (tokens, surcharge)","description":"Laissez vide pour utiliser la valeur rapportée par le fournisseur, ou 32000 si le fournisseur ne rapporte rien.","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/contextWindow","errorMessage":{}},"inputPricePerMillion":{"type":"number","title":"Prix d'entrée (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/inputPricePerMillion","errorMessage":{}},"cachedInputPricePerMillion":{"type":"number","title":"Prix d'entrée en cache (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/cachedInputPricePerMillion","errorMessage":{}},"cacheWritePricePerMillion":{"type":"number","title":"Prix d'écriture en cache (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/cacheWritePricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Prix de sortie (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator","errorMessage":{}},"moderator":{"type":"object","title":"Modérateur","description":"Le « gardien ». Classe chaque nouveau message utilisateur (grossièretés, injection de prompt, usurpation de persona, demandes hors périmètre). Doit être rapide et peu coûteux — il se trouve sur le chemin critique vers le premier token de réponse.\n\nRecommandations : un modèle généraliste petit et rapide avec support de sortie structurée (JSON), par ex. Claude 4.5 Haiku, GPT-5.4 Mini, Mistral Small 4, Qwen3 (4B). Les classifieurs de modération dédiés (Llama Guard, API de modération) ne sont pas compatibles : leurs taxonomies et formats de sortie fixes ne peuvent pas exprimer la politique spécifique de cette plateforme.","layout":{"comp":"card","children":[{"key":"model"},{"key":"contextWindow","cols":6},{"key":"inputPricePerMillion","cols":4},{"key":"cachedInputPricePerMillion","cols":4},{"key":"cacheWritePricePerMillion","cols":4},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Modèle","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}},"contextWindow":{"type":"number","title":"Taille de contexte (tokens, surcharge)","description":"Laissez vide pour utiliser la valeur rapportée par le fournisseur, ou 32000 si le fournisseur ne rapporte rien.","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/contextWindow","errorMessage":{}},"inputPricePerMillion":{"type":"number","title":"Prix d'entrée (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/inputPricePerMillion","errorMessage":{}},"cachedInputPricePerMillion":{"type":"number","title":"Prix d'entrée en cache (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/cachedInputPricePerMillion","errorMessage":{}},"cacheWritePricePerMillion":{"type":"number","title":"Prix d'écriture en cache (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/cacheWritePricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Prix de sortie (par million de tokens)","minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models","errorMessage":{}},"moderation":{"type":"object","title":"Modération des entrées","layout":{"if":"parent.data.providers?.length"},"default":{"enabled":false,"categories":["anonymous","external"]},"required":["enabled","categories"],"additionalProperties":false,"properties":{"enabled":{"type":"boolean","title":"Activer la modération des entrées","description":"Si activé, le dernier message utilisateur de chaque requête provenant d'une catégorie modérée est classé avant la réponse du modèle.","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/enabled","errorMessage":{}},"categories":{"type":"array","uniqueItems":true,"default":["anonymous","external"],"title":"Catégories d'utilisateurs modérées","description":"Catégories d'utilisateurs dont les requêtes sont vérifiées par le filtre lorsque la modération est activée.","items":{"type":"string","oneOf":[{"const":"anonymous","title":"Anonyme"},{"const":"external","title":"Externe"},{"const":"user","title":"Utilisateur"},{"const":"contrib","title":"Contributeur"},{"const":"admin","title":"Administrateur"}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items","errorMessage":{"oneOf":"choisissez une valeur"}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation","errorMessage":{"required":{"enabled":"information obligatoire","categories":"information obligatoire"}}},"compaction":{"type":"object","title":"Compaction de l'historique","layout":{"if":"parent.data.providers?.length"},"default":{"percent":70},"required":["percent"],"additionalProperties":false,"properties":{"percent":{"type":"number","title":"Compacter au-delà de cette part de la fenêtre de contexte (%)","description":"L'historique de conversation est résumé dès qu'il dépasse ce pourcentage de la fenêtre de contexte du modèle assistant. Plus la valeur est élevée, plus la compaction est rare, meilleure est la réutilisation du cache, et plus de contexte est conservé.","default":70,"minimum":10,"maximum":100,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/compaction/properties/percent","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/compaction","errorMessage":{"required":{"percent":"information obligatoire"}}},"quotas":{"type":"object","title":"Quotas par rôle","layout":{"title":null,"if":"parent.data.providers?.length","children":[{"key":"global","cols":{"sm":6,"md":4}},{"key":"admin","cols":{"sm":6,"md":4}},{"key":"contrib","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"user","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"external","cols":{"sm":6,"md":4}},{"key":"anonymous","cols":{"sm":6,"md":4}},{"key":"untrusted","cols":{"sm":6,"md":4}}]},"required":["global","admin","contrib","user","external","anonymous"],"default":{"global":{"unlimited":false,"monthlyLimit":10},"admin":{"unlimited":true,"monthlyLimit":0},"contrib":{"unlimited":false,"monthlyLimit":0},"user":{"unlimited":false,"monthlyLimit":0},"external":{"unlimited":false,"monthlyLimit":0},"anonymous":{"unlimited":false,"monthlyLimit":0},"untrusted":{"unlimited":false,"monthlyLimit":0}},"properties":{"global":{"$ref":"#/definitions/RoleQuota","title":"Quotas globaux","default":{"unlimited":false,"monthlyLimit":10},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/global","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"admin":{"$ref":"#/definitions/RoleQuota","title":"Quotas administrateur","default":{"unlimited":true,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/admin","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"contrib":{"$ref":"#/definitions/RoleQuota","title":"Quotas contributeur","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/contrib","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"user":{"$ref":"#/definitions/RoleQuota","title":"Quotas utilisateur simple","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/user","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"external":{"$ref":"#/definitions/RoleQuota","title":"Quotas utilisateur externe","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/external","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"anonymous":{"$ref":"#/definitions/RoleQuota","title":"Quotas utilisateur anonyme","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/anonymous","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"untrusted":{"$ref":"#/definitions/RoleQuota","title":"Réserve anonyme + externe","description":"Plafond agrégé partagé par l'ensemble des usages anonymes et externes, afin que le trafic non fiable ne puisse pas consommer tout le budget du compte. 0 = pas de plafond de réserve.","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/untrusted","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas","errorMessage":{"required":{"global":"information obligatoire","admin":"information obligatoire","contrib":"information obligatoire","user":"information obligatoire","external":"information obligatoire","anonymous":"information obligatoire"}}}},"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"__pointer":"https://github.com/data-fair/agents/settings-put#","errorMessage":{"required":{"providers":"information obligatoire"}}};
const schema28 = {"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":{"pure":false,"type":"js-tpl","dataAlias":"value","expr":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}","ref":18},"itemsResults":{"pure":true,"type":"js-eval","dataAlias":"body","expr":"data.results","ref":21},"itemTitle":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","ref":19},"itemKey":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"item.id","ref":20},"returnObjects":true}},"properties":{"id":{"type":"string","title":"Model ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id","errorMessage":{}},"name":{"type":"string","title":"Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name","errorMessage":{}},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type","errorMessage":{}},"name":{"type":"string","title":"Provider Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name","errorMessage":{}},"id":{"type":"string","title":"Provider ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider","errorMessage":{"required":{"type":"information obligatoire","name":"information obligatoire","id":"information obligatoire"}}},"contextWindow":{"type":"number","title":"Context window","readOnly":true,"description":"Taille totale du contexte en tokens, telle que rapportée par le fournisseur lors de la sélection du modèle.","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/contextWindow","errorMessage":{}},"cachedInputPricePerMillion":{"type":"number","title":"Cached input price (per 1M tokens)","readOnly":true,"description":"Rapporté par le fournisseur lors de la sélection du modèle.","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cachedInputPricePerMillion","errorMessage":{}},"cacheWritePricePerMillion":{"type":"number","title":"Cache write price (per 1M tokens)","readOnly":true,"description":"Rapporté par le fournisseur lors de la sélection du modèle.","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cacheWritePricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}};
const schema33 = {"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Illimité","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited","errorMessage":{}},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Limite mensuelle","description":"Limite hebdomadaire = mensuelle / 2, limite journalière = mensuelle / 4","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}};
const func1 = Object.prototype.hasOwnProperty;
const formats0 = fullFormats["date-time"];

function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://github.com/data-fair/agents/settings-put" */;
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
if(!(func1.call(schema27.properties, key0))){
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
if(data.createdAt !== undefined){
let data0 = data.createdAt;
if(typeof data0 === "string"){
if(!(formats0.validate(data0))){
const err2 = {instancePath:instancePath+"/createdAt",schemaPath:"#/properties/createdAt/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\"",schema:"date-time",parentSchema:schema27.properties.createdAt,data:data0};
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
const err3 = {instancePath:instancePath+"/createdAt",schemaPath:"#/properties/createdAt/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.createdAt.type,parentSchema:schema27.properties.createdAt,data:data0};
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
const err5 = {instancePath:instancePath+"/updatedAt",schemaPath:"#/properties/updatedAt/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\"",schema:"date-time",parentSchema:schema27.properties.updatedAt,data:data1};
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
const err6 = {instancePath:instancePath+"/updatedAt",schemaPath:"#/properties/updatedAt/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.updatedAt.type,parentSchema:schema27.properties.updatedAt,data:data1};
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
if(data.storeTraces !== undefined){
let data2 = data.storeTraces;
if(typeof data2 !== "boolean"){
const err8 = {instancePath:instancePath+"/storeTraces",schemaPath:"#/properties/storeTraces/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.storeTraces.type,parentSchema:schema27.properties.storeTraces,data:data2};
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
if(data.owner !== undefined){
let data3 = data.owner;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.type === undefined){
const err10 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.owner.required,parentSchema:schema27.properties.owner,data:data3};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data3.id === undefined){
const err11 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.owner.required,parentSchema:schema27.properties.owner,data:data3};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
for(const key1 in data3){
if(!((((key1 === "type") || (key1 === "id")) || (key1 === "name")) || (key1 === "department"))){
const err12 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.owner,data:data3};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data3.type !== undefined){
let data4 = data3.type;
if(typeof data4 !== "string"){
const err13 = {instancePath:instancePath+"/owner/type",schemaPath:"#/properties/owner/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.type.type,parentSchema:schema27.properties.owner.properties.type,data:data4};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!((data4 === "user") || (data4 === "organization"))){
const err14 = {instancePath:instancePath+"/owner/type",schemaPath:"#/properties/owner/properties/type/enum",keyword:"enum",params:{allowedValues: schema27.properties.owner.properties.type.enum},message:"must be equal to one of the allowed values",schema:schema27.properties.owner.properties.type.enum,parentSchema:schema27.properties.owner.properties.type,data:data4};
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
if(data3.id !== undefined){
let data5 = data3.id;
if(typeof data5 !== "string"){
const err16 = {instancePath:instancePath+"/owner/id",schemaPath:"#/properties/owner/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.id.type,parentSchema:schema27.properties.owner.properties.id,data:data5};
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
if(data3.name !== undefined){
let data6 = data3.name;
if(typeof data6 !== "string"){
const err18 = {instancePath:instancePath+"/owner/name",schemaPath:"#/properties/owner/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.name.type,parentSchema:schema27.properties.owner.properties.name,data:data6};
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
if(data3.department !== undefined){
let data7 = data3.department;
if(typeof data7 !== "string"){
const err20 = {instancePath:instancePath+"/owner/department",schemaPath:"#/properties/owner/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.department.type,parentSchema:schema27.properties.owner.properties.department,data:data7};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(errors > 0){
const emErrs6 = [];
for(const err21 of vErrors){
if(!err21.emUsed){
emErrs6.push(err21);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
}
else {
const err22 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.owner.type,parentSchema:schema27.properties.owner,data:data3};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"type":[],"id":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err23 of vErrors){
if((((((err23.keyword !== "errorMessage") && (!err23.emUsed)) && (err23.instancePath === instancePath+"/owner")) && (err23.keyword in emErrors0)) && (err23.schemaPath.indexOf("#/properties/owner") === 0)) && (/^\/[^\/]*$/.test(err23.schemaPath.slice(18)))){
emPropParams0 = obj0[err23.keyword];
emParamsErrors0 = emErrors0[err23.keyword][err23.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err23);
err23.emUsed = true;
}
}
}
for(const key2 in emErrors0){
for(const keyProp0 in emErrors0[key2]){
emParamsErrors0 = emErrors0[key2][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key2] && templates0[key2][keyProp0];
const err24 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.owner.errorMessage[key2][keyProp0],schema:schema27.properties.owner.errorMessage,parentSchema:schema27.properties.owner,data:data3};
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
const emErrs7 = [];
for(const err25 of vErrors){
if(!err25.emUsed){
emErrs7.push(err25);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data.providers !== undefined){
let data8 = data.providers;
if(Array.isArray(data8)){
const len0 = data8.length;
for(let i0=0; i0<len0; i0++){
let data9 = data8[i0];
const _errs23 = errors;
let valid4 = false;
let passing0 = null;
const _errs24 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err26 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data9};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data9.name === undefined){
const err27 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data9};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data9.id === undefined){
const err28 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data9};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data9.enabled === undefined){
const err29 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data9};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data9.type !== undefined){
let data10 = data9.type;
if(typeof data10 !== "string"){
const err30 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.type,data:data10};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if("openai" !== data10){
const err31 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema27.properties.providers.items.oneOf[0].properties.type,data:data10};
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
const err33 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.id,data:data11};
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
const err35 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.name,data:data12};
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
if(data9.enabled !== undefined){
let data13 = data9.enabled;
if(typeof data13 !== "boolean"){
const err37 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[0].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.enabled,data:data13};
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
if(data9.apiKey !== undefined){
let data14 = data9.apiKey;
if(typeof data14 !== "string"){
const err39 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.apiKey,data:data14};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err40 of vErrors){
if(!err40.emUsed){
emErrs12.push(err40);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
}
else {
const err41 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[0].type,parentSchema:schema27.properties.providers.items.oneOf[0],data:data9};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err42 of vErrors){
if((((((err42.keyword !== "errorMessage") && (!err42.emUsed)) && (err42.instancePath === instancePath+"/providers/" + i0)) && (err42.keyword in emErrors1)) && (err42.schemaPath.indexOf("#/properties/providers/items/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err42.schemaPath.slice(36)))){
emPropParams1 = obj0[err42.keyword];
emParamsErrors1 = emErrors1[err42.keyword][err42.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err42);
err42.emUsed = true;
}
}
}
for(const key3 in emErrors1){
for(const keyProp1 in emErrors1[key3]){
emParamsErrors1 = emErrors1[key3][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key3] && templates1[key3][keyProp1];
const err43 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.properties.providers.items.oneOf[0].errorMessage[key3][keyProp1],schema:schema27.properties.providers.items.oneOf[0].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[0],data:data9};
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
const emErrs13 = [];
for(const err44 of vErrors){
if(!err44.emUsed){
emErrs13.push(err44);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
var _valid0 = _errs24 === errors;
if(_valid0){
valid4 = true;
passing0 = 0;
var props0 = {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
const _errs36 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err45 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data9};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data9.name === undefined){
const err46 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data9};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(data9.id === undefined){
const err47 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data9};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data9.enabled === undefined){
const err48 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data9};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data9.type !== undefined){
let data15 = data9.type;
if(typeof data15 !== "string"){
const err49 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.type,data:data15};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if("anthropic" !== data15){
const err50 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant",schema:"anthropic",parentSchema:schema27.properties.providers.items.oneOf[1].properties.type,data:data15};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(errors > 0){
const emErrs14 = [];
for(const err51 of vErrors){
if(!err51.emUsed){
emErrs14.push(err51);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
if(data9.id !== undefined){
let data16 = data9.id;
if(typeof data16 !== "string"){
const err52 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.id,data:data16};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(errors > 0){
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
if(data9.name !== undefined){
let data17 = data9.name;
if(typeof data17 !== "string"){
const err54 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.name,data:data17};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err55 of vErrors){
if(!err55.emUsed){
emErrs16.push(err55);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
if(data9.enabled !== undefined){
let data18 = data9.enabled;
if(typeof data18 !== "boolean"){
const err56 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[1].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.enabled,data:data18};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(errors > 0){
const emErrs17 = [];
for(const err57 of vErrors){
if(!err57.emUsed){
emErrs17.push(err57);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
}
if(data9.apiKey !== undefined){
let data19 = data9.apiKey;
if(typeof data19 !== "string"){
const err58 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.apiKey,data:data19};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(errors > 0){
const emErrs18 = [];
for(const err59 of vErrors){
if(!err59.emUsed){
emErrs18.push(err59);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
}
}
else {
const err60 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[1].type,parentSchema:schema27.properties.providers.items.oneOf[1],data:data9};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates2 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err61 of vErrors){
if((((((err61.keyword !== "errorMessage") && (!err61.emUsed)) && (err61.instancePath === instancePath+"/providers/" + i0)) && (err61.keyword in emErrors2)) && (err61.schemaPath.indexOf("#/properties/providers/items/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err61.schemaPath.slice(36)))){
emPropParams2 = obj0[err61.keyword];
emParamsErrors2 = emErrors2[err61.keyword][err61.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err61);
err61.emUsed = true;
}
}
}
for(const key4 in emErrors2){
for(const keyProp2 in emErrors2[key4]){
emParamsErrors2 = emErrors2[key4][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates2[key4] && templates2[key4][keyProp2];
const err62 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema27.properties.providers.items.oneOf[1].errorMessage[key4][keyProp2],schema:schema27.properties.providers.items.oneOf[1].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[1],data:data9};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
}
const emErrs19 = [];
for(const err63 of vErrors){
if(!err63.emUsed){
emErrs19.push(err63);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
var _valid0 = _errs36 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid4 = true;
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
const _errs48 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err64 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data9};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(data9.name === undefined){
const err65 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data9};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(data9.id === undefined){
const err66 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data9};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(data9.enabled === undefined){
const err67 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data9};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(data9.type !== undefined){
let data20 = data9.type;
if(typeof data20 !== "string"){
const err68 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.type,data:data20};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if("google" !== data20){
const err69 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant",schema:"google",parentSchema:schema27.properties.providers.items.oneOf[2].properties.type,data:data20};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err70 of vErrors){
if(!err70.emUsed){
emErrs20.push(err70);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
if(data9.id !== undefined){
let data21 = data9.id;
if(typeof data21 !== "string"){
const err71 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.id,data:data21};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(errors > 0){
const emErrs21 = [];
for(const err72 of vErrors){
if(!err72.emUsed){
emErrs21.push(err72);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
if(data9.name !== undefined){
let data22 = data9.name;
if(typeof data22 !== "string"){
const err73 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.name,data:data22};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if(errors > 0){
const emErrs22 = [];
for(const err74 of vErrors){
if(!err74.emUsed){
emErrs22.push(err74);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
}
if(data9.enabled !== undefined){
let data23 = data9.enabled;
if(typeof data23 !== "boolean"){
const err75 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[2].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.enabled,data:data23};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if(errors > 0){
const emErrs23 = [];
for(const err76 of vErrors){
if(!err76.emUsed){
emErrs23.push(err76);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
}
if(data9.apiKey !== undefined){
let data24 = data9.apiKey;
if(typeof data24 !== "string"){
const err77 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.apiKey,data:data24};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(errors > 0){
const emErrs24 = [];
for(const err78 of vErrors){
if(!err78.emUsed){
emErrs24.push(err78);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
}
else {
const err79 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[2].type,parentSchema:schema27.properties.providers.items.oneOf[2],data:data9};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(errors > 0){
const emErrors3 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates3 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err80 of vErrors){
if((((((err80.keyword !== "errorMessage") && (!err80.emUsed)) && (err80.instancePath === instancePath+"/providers/" + i0)) && (err80.keyword in emErrors3)) && (err80.schemaPath.indexOf("#/properties/providers/items/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err80.schemaPath.slice(36)))){
emPropParams3 = obj0[err80.keyword];
emParamsErrors3 = emErrors3[err80.keyword][err80.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err80);
err80.emUsed = true;
}
}
}
for(const key5 in emErrors3){
for(const keyProp3 in emErrors3[key5]){
emParamsErrors3 = emErrors3[key5][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates3[key5] && templates3[key5][keyProp3];
const err81 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema27.properties.providers.items.oneOf[2].errorMessage[key5][keyProp3],schema:schema27.properties.providers.items.oneOf[2].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[2],data:data9};
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
const emErrs25 = [];
for(const err82 of vErrors){
if(!err82.emUsed){
emErrs25.push(err82);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
var _valid0 = _errs48 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid4 = true;
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
const _errs60 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err83 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data9};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(data9.name === undefined){
const err84 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data9};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(data9.id === undefined){
const err85 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data9};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
if(data9.enabled === undefined){
const err86 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data9};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
if(data9.type !== undefined){
let data25 = data9.type;
if(typeof data25 !== "string"){
const err87 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.type,data:data25};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
if("mistral" !== data25){
const err88 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant",schema:"mistral",parentSchema:schema27.properties.providers.items.oneOf[3].properties.type,data:data25};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err89 of vErrors){
if(!err89.emUsed){
emErrs26.push(err89);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
if(data9.id !== undefined){
let data26 = data9.id;
if(typeof data26 !== "string"){
const err90 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.id,data:data26};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
if(errors > 0){
const emErrs27 = [];
for(const err91 of vErrors){
if(!err91.emUsed){
emErrs27.push(err91);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
}
if(data9.name !== undefined){
let data27 = data9.name;
if(typeof data27 !== "string"){
const err92 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.name,data:data27};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
if(errors > 0){
const emErrs28 = [];
for(const err93 of vErrors){
if(!err93.emUsed){
emErrs28.push(err93);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
}
if(data9.enabled !== undefined){
let data28 = data9.enabled;
if(typeof data28 !== "boolean"){
const err94 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[3].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.enabled,data:data28};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
if(errors > 0){
const emErrs29 = [];
for(const err95 of vErrors){
if(!err95.emUsed){
emErrs29.push(err95);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
}
if(data9.apiKey !== undefined){
let data29 = data9.apiKey;
if(typeof data29 !== "string"){
const err96 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.apiKey,data:data29};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(errors > 0){
const emErrs30 = [];
for(const err97 of vErrors){
if(!err97.emUsed){
emErrs30.push(err97);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
}
}
else {
const err98 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[3].type,parentSchema:schema27.properties.providers.items.oneOf[3],data:data9};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(errors > 0){
const emErrors4 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates4 = {required:{}};
let emPropParams4;
let emParamsErrors4;
for(const err99 of vErrors){
if((((((err99.keyword !== "errorMessage") && (!err99.emUsed)) && (err99.instancePath === instancePath+"/providers/" + i0)) && (err99.keyword in emErrors4)) && (err99.schemaPath.indexOf("#/properties/providers/items/oneOf/3") === 0)) && (/^\/[^\/]*$/.test(err99.schemaPath.slice(36)))){
emPropParams4 = obj0[err99.keyword];
emParamsErrors4 = emErrors4[err99.keyword][err99.params[emPropParams4]];
if(emParamsErrors4){
emParamsErrors4.push(err99);
err99.emUsed = true;
}
}
}
for(const key6 in emErrors4){
for(const keyProp4 in emErrors4[key6]){
emParamsErrors4 = emErrors4[key6][keyProp4];
if(emParamsErrors4.length){
const tmpl4 = templates4[key6] && templates4[key6][keyProp4];
const err100 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema27.properties.providers.items.oneOf[3].errorMessage[key6][keyProp4],schema:schema27.properties.providers.items.oneOf[3].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[3],data:data9};
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
const emErrs31 = [];
for(const err101 of vErrors){
if(!err101.emUsed){
emErrs31.push(err101);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
var _valid0 = _errs60 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid4 = true;
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
const _errs72 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err102 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data9};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
if(data9.name === undefined){
const err103 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data9};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
if(data9.id === undefined){
const err104 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data9};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
if(data9.enabled === undefined){
const err105 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data9};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if(data9.type !== undefined){
let data30 = data9.type;
if(typeof data30 !== "string"){
const err106 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.type,data:data30};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
if("openrouter" !== data30){
const err107 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant",schema:"openrouter",parentSchema:schema27.properties.providers.items.oneOf[4].properties.type,data:data30};
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
if(data9.id !== undefined){
let data31 = data9.id;
if(typeof data31 !== "string"){
const err109 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.id,data:data31};
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
if(data9.name !== undefined){
let data32 = data9.name;
if(typeof data32 !== "string"){
const err111 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.name,data:data32};
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
if(data9.enabled !== undefined){
let data33 = data9.enabled;
if(typeof data33 !== "boolean"){
const err113 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[4].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.enabled,data:data33};
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
if(data9.apiKey !== undefined){
let data34 = data9.apiKey;
if(typeof data34 !== "string"){
const err115 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.apiKey,data:data34};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
if(errors > 0){
const emErrs36 = [];
for(const err116 of vErrors){
if(!err116.emUsed){
emErrs36.push(err116);
}
}
vErrors = emErrs36;
errors = emErrs36.length;
}
}
}
else {
const err117 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[4].type,parentSchema:schema27.properties.providers.items.oneOf[4],data:data9};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
if(errors > 0){
const emErrors5 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates5 = {required:{}};
let emPropParams5;
let emParamsErrors5;
for(const err118 of vErrors){
if((((((err118.keyword !== "errorMessage") && (!err118.emUsed)) && (err118.instancePath === instancePath+"/providers/" + i0)) && (err118.keyword in emErrors5)) && (err118.schemaPath.indexOf("#/properties/providers/items/oneOf/4") === 0)) && (/^\/[^\/]*$/.test(err118.schemaPath.slice(36)))){
emPropParams5 = obj0[err118.keyword];
emParamsErrors5 = emErrors5[err118.keyword][err118.params[emPropParams5]];
if(emParamsErrors5){
emParamsErrors5.push(err118);
err118.emUsed = true;
}
}
}
for(const key7 in emErrors5){
for(const keyProp5 in emErrors5[key7]){
emParamsErrors5 = emErrors5[key7][keyProp5];
if(emParamsErrors5.length){
const tmpl5 = templates5[key7] && templates5[key7][keyProp5];
const err119 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors5},message:tmpl5 ? tmpl5() : schema27.properties.providers.items.oneOf[4].errorMessage[key7][keyProp5],schema:schema27.properties.providers.items.oneOf[4].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[4],data:data9};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
}
}
const emErrs37 = [];
for(const err120 of vErrors){
if(!err120.emUsed){
emErrs37.push(err120);
}
}
vErrors = emErrs37;
errors = emErrs37.length;
}
var _valid0 = _errs72 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid4 = true;
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
const _errs84 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err121 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data9};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if(data9.name === undefined){
const err122 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data9};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
if(data9.id === undefined){
const err123 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data9};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
if(data9.enabled === undefined){
const err124 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data9};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
if(data9.baseURL === undefined){
const err125 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data9};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
if(data9.type !== undefined){
let data35 = data9.type;
if(typeof data35 !== "string"){
const err126 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.type,data:data35};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
if("ollama" !== data35){
const err127 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant",schema:"ollama",parentSchema:schema27.properties.providers.items.oneOf[5].properties.type,data:data35};
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
if(data9.id !== undefined){
let data36 = data9.id;
if(typeof data36 !== "string"){
const err129 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.id,data:data36};
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
if(data9.name !== undefined){
let data37 = data9.name;
if(typeof data37 !== "string"){
const err131 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.name,data:data37};
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
if(data9.enabled !== undefined){
let data38 = data9.enabled;
if(typeof data38 !== "boolean"){
const err133 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[5].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.enabled,data:data38};
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
if(data9.apiKey !== undefined){
let data39 = data9.apiKey;
if(typeof data39 !== "string"){
const err135 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.apiKey,data:data39};
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
if(data9.baseURL !== undefined){
let data40 = data9.baseURL;
if(typeof data40 !== "string"){
const err137 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.baseURL.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.baseURL,data:data40};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
if(errors > 0){
const emErrs43 = [];
for(const err138 of vErrors){
if(!err138.emUsed){
emErrs43.push(err138);
}
}
vErrors = emErrs43;
errors = emErrs43.length;
}
}
}
else {
const err139 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[5].type,parentSchema:schema27.properties.providers.items.oneOf[5],data:data9};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
if(errors > 0){
const emErrors6 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"baseURL":[]}};
const templates6 = {required:{}};
let emPropParams6;
let emParamsErrors6;
for(const err140 of vErrors){
if((((((err140.keyword !== "errorMessage") && (!err140.emUsed)) && (err140.instancePath === instancePath+"/providers/" + i0)) && (err140.keyword in emErrors6)) && (err140.schemaPath.indexOf("#/properties/providers/items/oneOf/5") === 0)) && (/^\/[^\/]*$/.test(err140.schemaPath.slice(36)))){
emPropParams6 = obj0[err140.keyword];
emParamsErrors6 = emErrors6[err140.keyword][err140.params[emPropParams6]];
if(emParamsErrors6){
emParamsErrors6.push(err140);
err140.emUsed = true;
}
}
}
for(const key8 in emErrors6){
for(const keyProp6 in emErrors6[key8]){
emParamsErrors6 = emErrors6[key8][keyProp6];
if(emParamsErrors6.length){
const tmpl6 = templates6[key8] && templates6[key8][keyProp6];
const err141 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema27.properties.providers.items.oneOf[5].errorMessage[key8][keyProp6],schema:schema27.properties.providers.items.oneOf[5].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[5],data:data9};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
}
}
const emErrs44 = [];
for(const err142 of vErrors){
if(!err142.emUsed){
emErrs44.push(err142);
}
}
vErrors = emErrs44;
errors = emErrs44.length;
}
var _valid0 = _errs84 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 5];
}
else {
if(_valid0){
valid4 = true;
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
const _errs98 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err143 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data9};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
if(data9.name === undefined){
const err144 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data9};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
if(data9.id === undefined){
const err145 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data9};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
if(data9.enabled === undefined){
const err146 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data9};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
if(data9.apiKey === undefined){
const err147 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "apiKey"},message:"must have required property '"+"apiKey"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data9};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
if(data9.type !== undefined){
let data41 = data9.type;
if(typeof data41 !== "string"){
const err148 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.type,data:data41};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
if("scaleway" !== data41){
const err149 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "scaleway"},message:"must be equal to constant",schema:"scaleway",parentSchema:schema27.properties.providers.items.oneOf[6].properties.type,data:data41};
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
if(data9.id !== undefined){
let data42 = data9.id;
if(typeof data42 !== "string"){
const err151 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.id,data:data42};
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
if(data9.name !== undefined){
let data43 = data9.name;
if(typeof data43 !== "string"){
const err153 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.name,data:data43};
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
if(data9.enabled !== undefined){
let data44 = data9.enabled;
if(typeof data44 !== "boolean"){
const err155 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[6].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.enabled,data:data44};
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
if(data9.apiKey !== undefined){
let data45 = data9.apiKey;
if(typeof data45 !== "string"){
const err157 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/6/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.apiKey,data:data45};
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
if(data9.projectId !== undefined){
let data46 = data9.projectId;
if(typeof data46 !== "string"){
const err159 = {instancePath:instancePath+"/providers/" + i0+"/projectId",schemaPath:"#/properties/providers/items/oneOf/6/properties/projectId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.projectId.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.projectId,data:data46};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
if(errors > 0){
const emErrs50 = [];
for(const err160 of vErrors){
if(!err160.emUsed){
emErrs50.push(err160);
}
}
vErrors = emErrs50;
errors = emErrs50.length;
}
}
}
else {
const err161 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[6].type,parentSchema:schema27.properties.providers.items.oneOf[6],data:data9};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
if(errors > 0){
const emErrors7 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"apiKey":[]}};
const templates7 = {required:{}};
let emPropParams7;
let emParamsErrors7;
for(const err162 of vErrors){
if((((((err162.keyword !== "errorMessage") && (!err162.emUsed)) && (err162.instancePath === instancePath+"/providers/" + i0)) && (err162.keyword in emErrors7)) && (err162.schemaPath.indexOf("#/properties/providers/items/oneOf/6") === 0)) && (/^\/[^\/]*$/.test(err162.schemaPath.slice(36)))){
emPropParams7 = obj0[err162.keyword];
emParamsErrors7 = emErrors7[err162.keyword][err162.params[emPropParams7]];
if(emParamsErrors7){
emParamsErrors7.push(err162);
err162.emUsed = true;
}
}
}
for(const key9 in emErrors7){
for(const keyProp7 in emErrors7[key9]){
emParamsErrors7 = emErrors7[key9][keyProp7];
if(emParamsErrors7.length){
const tmpl7 = templates7[key9] && templates7[key9][keyProp7];
const err163 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors7},message:tmpl7 ? tmpl7() : schema27.properties.providers.items.oneOf[6].errorMessage[key9][keyProp7],schema:schema27.properties.providers.items.oneOf[6].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[6],data:data9};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
}
}
const emErrs51 = [];
for(const err164 of vErrors){
if(!err164.emUsed){
emErrs51.push(err164);
}
}
vErrors = emErrs51;
errors = emErrs51.length;
}
var _valid0 = _errs98 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 6];
}
else {
if(_valid0){
valid4 = true;
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
const _errs112 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err165 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
if(data9.name === undefined){
const err166 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
if(data9.id === undefined){
const err167 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
if(data9.enabled === undefined){
const err168 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
if(data9.baseURL === undefined){
const err169 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
if(data9.type !== undefined){
let data47 = data9.type;
if(typeof data47 !== "string"){
const err170 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/7/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.type,data:data47};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
if("openai-compatible" !== data47){
const err171 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue: "openai-compatible"},message:"must be equal to constant",schema:"openai-compatible",parentSchema:schema27.properties.providers.items.oneOf[7].properties.type,data:data47};
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
if(data9.id !== undefined){
let data48 = data9.id;
if(typeof data48 !== "string"){
const err173 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/7/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.id,data:data48};
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
if(data9.name !== undefined){
let data49 = data9.name;
if(typeof data49 !== "string"){
const err175 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/7/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.name,data:data49};
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
if(data9.enabled !== undefined){
let data50 = data9.enabled;
if(typeof data50 !== "boolean"){
const err177 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/7/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[7].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.enabled,data:data50};
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
if(data9.baseURL !== undefined){
let data51 = data9.baseURL;
if(typeof data51 !== "string"){
const err179 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/oneOf/7/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.baseURL.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.baseURL,data:data51};
if(vErrors === null){
vErrors = [err179];
}
else {
vErrors.push(err179);
}
errors++;
}
if(errors > 0){
const emErrs56 = [];
for(const err180 of vErrors){
if(!err180.emUsed){
emErrs56.push(err180);
}
}
vErrors = emErrs56;
errors = emErrs56.length;
}
}
if(data9.apiKey !== undefined){
let data52 = data9.apiKey;
if(typeof data52 !== "string"){
const err181 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/7/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.apiKey,data:data52};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
if(errors > 0){
const emErrs57 = [];
for(const err182 of vErrors){
if(!err182.emUsed){
emErrs57.push(err182);
}
}
vErrors = emErrs57;
errors = emErrs57.length;
}
}
if(data9.compatibility !== undefined){
let data53 = data9.compatibility;
if(typeof data53 !== "string"){
const err183 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/oneOf/7/properties/compatibility/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.compatibility.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.compatibility,data:data53};
if(vErrors === null){
vErrors = [err183];
}
else {
vErrors.push(err183);
}
errors++;
}
if(!((data53 === "default") || (data53 === "compatible"))){
const err184 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/oneOf/7/properties/compatibility/enum",keyword:"enum",params:{allowedValues: schema27.properties.providers.items.oneOf[7].properties.compatibility.enum},message:"must be equal to one of the allowed values",schema:schema27.properties.providers.items.oneOf[7].properties.compatibility.enum,parentSchema:schema27.properties.providers.items.oneOf[7].properties.compatibility,data:data53};
if(vErrors === null){
vErrors = [err184];
}
else {
vErrors.push(err184);
}
errors++;
}
if(errors > 0){
const emErrs58 = [];
for(const err185 of vErrors){
if(!err185.emUsed){
emErrs58.push(err185);
}
}
vErrors = emErrs58;
errors = emErrs58.length;
}
}
}
else {
const err186 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[7].type,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
if(vErrors === null){
vErrors = [err186];
}
else {
vErrors.push(err186);
}
errors++;
}
if(errors > 0){
const emErrors8 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"baseURL":[]}};
const templates8 = {required:{}};
let emPropParams8;
let emParamsErrors8;
for(const err187 of vErrors){
if((((((err187.keyword !== "errorMessage") && (!err187.emUsed)) && (err187.instancePath === instancePath+"/providers/" + i0)) && (err187.keyword in emErrors8)) && (err187.schemaPath.indexOf("#/properties/providers/items/oneOf/7") === 0)) && (/^\/[^\/]*$/.test(err187.schemaPath.slice(36)))){
emPropParams8 = obj0[err187.keyword];
emParamsErrors8 = emErrors8[err187.keyword][err187.params[emPropParams8]];
if(emParamsErrors8){
emParamsErrors8.push(err187);
err187.emUsed = true;
}
}
}
for(const key10 in emErrors8){
for(const keyProp8 in emErrors8[key10]){
emParamsErrors8 = emErrors8[key10][keyProp8];
if(emParamsErrors8.length){
const tmpl8 = templates8[key10] && templates8[key10][keyProp8];
const err188 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors8},message:tmpl8 ? tmpl8() : schema27.properties.providers.items.oneOf[7].errorMessage[key10][keyProp8],schema:schema27.properties.providers.items.oneOf[7].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
if(vErrors === null){
vErrors = [err188];
}
else {
vErrors.push(err188);
}
errors++;
}
}
}
const emErrs59 = [];
for(const err189 of vErrors){
if(!err189.emUsed){
emErrs59.push(err189);
}
}
vErrors = emErrs59;
errors = emErrs59.length;
}
var _valid0 = _errs112 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 7];
}
else {
if(_valid0){
valid4 = true;
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
const _errs128 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err190 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data9};
if(vErrors === null){
vErrors = [err190];
}
else {
vErrors.push(err190);
}
errors++;
}
if(data9.name === undefined){
const err191 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data9};
if(vErrors === null){
vErrors = [err191];
}
else {
vErrors.push(err191);
}
errors++;
}
if(data9.id === undefined){
const err192 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data9};
if(vErrors === null){
vErrors = [err192];
}
else {
vErrors.push(err192);
}
errors++;
}
if(data9.enabled === undefined){
const err193 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data9};
if(vErrors === null){
vErrors = [err193];
}
else {
vErrors.push(err193);
}
errors++;
}
if(data9.type !== undefined){
let data54 = data9.type;
if(typeof data54 !== "string"){
const err194 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/8/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[8].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.type,data:data54};
if(vErrors === null){
vErrors = [err194];
}
else {
vErrors.push(err194);
}
errors++;
}
if("mock" !== data54){
const err195 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema27.properties.providers.items.oneOf[8].properties.type,data:data54};
if(vErrors === null){
vErrors = [err195];
}
else {
vErrors.push(err195);
}
errors++;
}
if(errors > 0){
const emErrs60 = [];
for(const err196 of vErrors){
if(!err196.emUsed){
emErrs60.push(err196);
}
}
vErrors = emErrs60;
errors = emErrs60.length;
}
}
if(data9.id !== undefined){
let data55 = data9.id;
if(typeof data55 !== "string"){
const err197 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/8/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[8].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.id,data:data55};
if(vErrors === null){
vErrors = [err197];
}
else {
vErrors.push(err197);
}
errors++;
}
if(errors > 0){
const emErrs61 = [];
for(const err198 of vErrors){
if(!err198.emUsed){
emErrs61.push(err198);
}
}
vErrors = emErrs61;
errors = emErrs61.length;
}
}
if(data9.name !== undefined){
let data56 = data9.name;
if(typeof data56 !== "string"){
const err199 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/8/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[8].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.name,data:data56};
if(vErrors === null){
vErrors = [err199];
}
else {
vErrors.push(err199);
}
errors++;
}
if(errors > 0){
const emErrs62 = [];
for(const err200 of vErrors){
if(!err200.emUsed){
emErrs62.push(err200);
}
}
vErrors = emErrs62;
errors = emErrs62.length;
}
}
if(data9.enabled !== undefined){
let data57 = data9.enabled;
if(typeof data57 !== "boolean"){
const err201 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/8/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[8].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.enabled,data:data57};
if(vErrors === null){
vErrors = [err201];
}
else {
vErrors.push(err201);
}
errors++;
}
if(errors > 0){
const emErrs63 = [];
for(const err202 of vErrors){
if(!err202.emUsed){
emErrs63.push(err202);
}
}
vErrors = emErrs63;
errors = emErrs63.length;
}
}
}
else {
const err203 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[8].type,parentSchema:schema27.properties.providers.items.oneOf[8],data:data9};
if(vErrors === null){
vErrors = [err203];
}
else {
vErrors.push(err203);
}
errors++;
}
if(errors > 0){
const emErrors9 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates9 = {required:{}};
let emPropParams9;
let emParamsErrors9;
for(const err204 of vErrors){
if((((((err204.keyword !== "errorMessage") && (!err204.emUsed)) && (err204.instancePath === instancePath+"/providers/" + i0)) && (err204.keyword in emErrors9)) && (err204.schemaPath.indexOf("#/properties/providers/items/oneOf/8") === 0)) && (/^\/[^\/]*$/.test(err204.schemaPath.slice(36)))){
emPropParams9 = obj0[err204.keyword];
emParamsErrors9 = emErrors9[err204.keyword][err204.params[emPropParams9]];
if(emParamsErrors9){
emParamsErrors9.push(err204);
err204.emUsed = true;
}
}
}
for(const key11 in emErrors9){
for(const keyProp9 in emErrors9[key11]){
emParamsErrors9 = emErrors9[key11][keyProp9];
if(emParamsErrors9.length){
const tmpl9 = templates9[key11] && templates9[key11][keyProp9];
const err205 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors9},message:tmpl9 ? tmpl9() : schema27.properties.providers.items.oneOf[8].errorMessage[key11][keyProp9],schema:schema27.properties.providers.items.oneOf[8].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[8],data:data9};
if(vErrors === null){
vErrors = [err205];
}
else {
vErrors.push(err205);
}
errors++;
}
}
}
const emErrs64 = [];
for(const err206 of vErrors){
if(!err206.emUsed){
emErrs64.push(err206);
}
}
vErrors = emErrs64;
errors = emErrs64.length;
}
var _valid0 = _errs128 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 8];
}
else {
if(_valid0){
valid4 = true;
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
if(!valid4){
const err207 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema27.properties.providers.items.oneOf,parentSchema:schema27.properties.providers.items,data:data9};
if(vErrors === null){
vErrors = [err207];
}
else {
vErrors.push(err207);
}
errors++;
}
else {
errors = _errs23;
if(vErrors !== null){
if(_errs23){
vErrors.length = _errs23;
}
else {
vErrors = null;
}
}
}
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(props0 !== true){
for(const key12 in data9){
if(!props0 || !props0[key12]){
const err208 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/unevaluatedProperties",keyword:"unevaluatedProperties",params:{unevaluatedProperty: key12},message:"must NOT have unevaluated properties",schema:false,parentSchema:schema27.properties.providers.items,data:data9};
if(vErrors === null){
vErrors = [err208];
}
else {
vErrors.push(err208);
}
errors++;
}
}
}
}
else {
const err209 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.type,parentSchema:schema27.properties.providers.items,data:data9};
if(vErrors === null){
vErrors = [err209];
}
else {
vErrors.push(err209);
}
errors++;
}
if(errors > 0){
const emErrors10 = {"oneOf":[]};
const templates10 = {};
for(const err210 of vErrors){
if((((((err210.keyword !== "errorMessage") && (!err210.emUsed)) && (err210.instancePath === instancePath+"/providers/" + i0)) && (err210.keyword in emErrors10)) && (err210.schemaPath.indexOf("#/properties/providers/items") === 0)) && (/^\/[^\/]*$/.test(err210.schemaPath.slice(28)))){
emErrors10[err210.keyword].push(err210);
err210.emUsed = true;
}
}
for(const key13 in emErrors10){
if(emErrors10[key13].length){
const err211 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors10[key13]},message:key13 in templates10 ? templates10[key13]() : schema27.properties.providers.items.errorMessage[key13],schema:schema27.properties.providers.items.errorMessage,parentSchema:schema27.properties.providers.items,data:data9};
if(vErrors === null){
vErrors = [err211];
}
else {
vErrors.push(err211);
}
errors++;
}
}
const emErrs65 = [];
for(const err212 of vErrors){
if(!err212.emUsed){
emErrs65.push(err212);
}
}
vErrors = emErrs65;
errors = emErrs65.length;
}
}
}
else {
const err213 = {instancePath:instancePath+"/providers",schemaPath:"#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.providers.type,parentSchema:schema27.properties.providers,data:data8};
if(vErrors === null){
vErrors = [err213];
}
else {
vErrors.push(err213);
}
errors++;
}
if(errors > 0){
const emErrs66 = [];
for(const err214 of vErrors){
if(!err214.emUsed){
emErrs66.push(err214);
}
}
vErrors = emErrs66;
errors = emErrs66.length;
}
}
if(data.models !== undefined){
let data58 = data.models;
if(data58 && typeof data58 == "object" && !Array.isArray(data58)){
if(data58.assistant !== undefined){
let data59 = data58.assistant;
if(data59 && typeof data59 == "object" && !Array.isArray(data59)){
if(data59.model !== undefined){
let data60 = data59.model;
if(data60 && typeof data60 == "object" && !Array.isArray(data60)){
if(data60.id === undefined){
const err215 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data60};
if(vErrors === null){
vErrors = [err215];
}
else {
vErrors.push(err215);
}
errors++;
}
if(data60.name === undefined){
const err216 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data60};
if(vErrors === null){
vErrors = [err216];
}
else {
vErrors.push(err216);
}
errors++;
}
if(data60.provider === undefined){
const err217 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data60};
if(vErrors === null){
vErrors = [err217];
}
else {
vErrors.push(err217);
}
errors++;
}
if(data60.id !== undefined){
let data61 = data60.id;
if(typeof data61 !== "string"){
const err218 = {instancePath:instancePath+"/models/assistant/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data61};
if(vErrors === null){
vErrors = [err218];
}
else {
vErrors.push(err218);
}
errors++;
}
if(errors > 0){
const emErrs67 = [];
for(const err219 of vErrors){
if(!err219.emUsed){
emErrs67.push(err219);
}
}
vErrors = emErrs67;
errors = emErrs67.length;
}
}
if(data60.name !== undefined){
let data62 = data60.name;
if(typeof data62 !== "string"){
const err220 = {instancePath:instancePath+"/models/assistant/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data62};
if(vErrors === null){
vErrors = [err220];
}
else {
vErrors.push(err220);
}
errors++;
}
if(errors > 0){
const emErrs68 = [];
for(const err221 of vErrors){
if(!err221.emUsed){
emErrs68.push(err221);
}
}
vErrors = emErrs68;
errors = emErrs68.length;
}
}
if(data60.provider !== undefined){
let data63 = data60.provider;
if(data63 && typeof data63 == "object" && !Array.isArray(data63)){
if(data63.type === undefined){
const err222 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data63};
if(vErrors === null){
vErrors = [err222];
}
else {
vErrors.push(err222);
}
errors++;
}
if(data63.name === undefined){
const err223 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data63};
if(vErrors === null){
vErrors = [err223];
}
else {
vErrors.push(err223);
}
errors++;
}
if(data63.id === undefined){
const err224 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data63};
if(vErrors === null){
vErrors = [err224];
}
else {
vErrors.push(err224);
}
errors++;
}
if(data63.type !== undefined){
let data64 = data63.type;
if(typeof data64 !== "string"){
const err225 = {instancePath:instancePath+"/models/assistant/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data64};
if(vErrors === null){
vErrors = [err225];
}
else {
vErrors.push(err225);
}
errors++;
}
if(errors > 0){
const emErrs69 = [];
for(const err226 of vErrors){
if(!err226.emUsed){
emErrs69.push(err226);
}
}
vErrors = emErrs69;
errors = emErrs69.length;
}
}
if(data63.name !== undefined){
let data65 = data63.name;
if(typeof data65 !== "string"){
const err227 = {instancePath:instancePath+"/models/assistant/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data65};
if(vErrors === null){
vErrors = [err227];
}
else {
vErrors.push(err227);
}
errors++;
}
if(errors > 0){
const emErrs70 = [];
for(const err228 of vErrors){
if(!err228.emUsed){
emErrs70.push(err228);
}
}
vErrors = emErrs70;
errors = emErrs70.length;
}
}
if(data63.id !== undefined){
let data66 = data63.id;
if(typeof data66 !== "string"){
const err229 = {instancePath:instancePath+"/models/assistant/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data66};
if(vErrors === null){
vErrors = [err229];
}
else {
vErrors.push(err229);
}
errors++;
}
if(errors > 0){
const emErrs71 = [];
for(const err230 of vErrors){
if(!err230.emUsed){
emErrs71.push(err230);
}
}
vErrors = emErrs71;
errors = emErrs71.length;
}
}
}
else {
const err231 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data63};
if(vErrors === null){
vErrors = [err231];
}
else {
vErrors.push(err231);
}
errors++;
}
if(errors > 0){
const emErrors11 = {"required":{"type":[],"name":[],"id":[]}};
const templates11 = {required:{}};
let emPropParams10;
let emParamsErrors10;
for(const err232 of vErrors){
if((((((err232.keyword !== "errorMessage") && (!err232.emUsed)) && (err232.instancePath === instancePath+"/models/assistant/model/provider")) && (err232.keyword in emErrors11)) && (err232.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err232.schemaPath.slice(39)))){
emPropParams10 = obj0[err232.keyword];
emParamsErrors10 = emErrors11[err232.keyword][err232.params[emPropParams10]];
if(emParamsErrors10){
emParamsErrors10.push(err232);
err232.emUsed = true;
}
}
}
for(const key14 in emErrors11){
for(const keyProp10 in emErrors11[key14]){
emParamsErrors10 = emErrors11[key14][keyProp10];
if(emParamsErrors10.length){
const tmpl10 = templates11[key14] && templates11[key14][keyProp10];
const err233 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors10},message:tmpl10 ? tmpl10() : schema28.properties.provider.errorMessage[key14][keyProp10],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data63};
if(vErrors === null){
vErrors = [err233];
}
else {
vErrors.push(err233);
}
errors++;
}
}
}
const emErrs72 = [];
for(const err234 of vErrors){
if(!err234.emUsed){
emErrs72.push(err234);
}
}
vErrors = emErrs72;
errors = emErrs72.length;
}
}
if(data60.contextWindow !== undefined){
let data67 = data60.contextWindow;
if(!(typeof data67 == "number")){
const err235 = {instancePath:instancePath+"/models/assistant/model/contextWindow",schemaPath:"#/definitions/Model/properties/contextWindow/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.contextWindow.type,parentSchema:schema28.properties.contextWindow,data:data67};
if(vErrors === null){
vErrors = [err235];
}
else {
vErrors.push(err235);
}
errors++;
}
if(errors > 0){
const emErrs73 = [];
for(const err236 of vErrors){
if(!err236.emUsed){
emErrs73.push(err236);
}
}
vErrors = emErrs73;
errors = emErrs73.length;
}
}
if(data60.cachedInputPricePerMillion !== undefined){
let data68 = data60.cachedInputPricePerMillion;
if(!(typeof data68 == "number")){
const err237 = {instancePath:instancePath+"/models/assistant/model/cachedInputPricePerMillion",schemaPath:"#/definitions/Model/properties/cachedInputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.cachedInputPricePerMillion.type,parentSchema:schema28.properties.cachedInputPricePerMillion,data:data68};
if(vErrors === null){
vErrors = [err237];
}
else {
vErrors.push(err237);
}
errors++;
}
if(errors > 0){
const emErrs74 = [];
for(const err238 of vErrors){
if(!err238.emUsed){
emErrs74.push(err238);
}
}
vErrors = emErrs74;
errors = emErrs74.length;
}
}
if(data60.cacheWritePricePerMillion !== undefined){
let data69 = data60.cacheWritePricePerMillion;
if(!(typeof data69 == "number")){
const err239 = {instancePath:instancePath+"/models/assistant/model/cacheWritePricePerMillion",schemaPath:"#/definitions/Model/properties/cacheWritePricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.cacheWritePricePerMillion.type,parentSchema:schema28.properties.cacheWritePricePerMillion,data:data69};
if(vErrors === null){
vErrors = [err239];
}
else {
vErrors.push(err239);
}
errors++;
}
if(errors > 0){
const emErrs75 = [];
for(const err240 of vErrors){
if(!err240.emUsed){
emErrs75.push(err240);
}
}
vErrors = emErrs75;
errors = emErrs75.length;
}
}
}
else {
const err241 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data60};
if(vErrors === null){
vErrors = [err241];
}
else {
vErrors.push(err241);
}
errors++;
}
if(errors > 0){
const emErrors12 = {"required":{"id":[],"name":[],"provider":[]}};
const templates12 = {required:{}};
let emPropParams11;
let emParamsErrors11;
for(const err242 of vErrors){
if((((((err242.keyword !== "errorMessage") && (!err242.emUsed)) && (err242.instancePath === instancePath+"/models/assistant/model")) && (err242.keyword in emErrors12)) && (err242.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err242.schemaPath.slice(19)))){
emPropParams11 = obj0[err242.keyword];
emParamsErrors11 = emErrors12[err242.keyword][err242.params[emPropParams11]];
if(emParamsErrors11){
emParamsErrors11.push(err242);
err242.emUsed = true;
}
}
}
for(const key15 in emErrors12){
for(const keyProp11 in emErrors12[key15]){
emParamsErrors11 = emErrors12[key15][keyProp11];
if(emParamsErrors11.length){
const tmpl11 = templates12[key15] && templates12[key15][keyProp11];
const err243 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors11},message:tmpl11 ? tmpl11() : schema28.errorMessage[key15][keyProp11],schema:schema28.errorMessage,parentSchema:schema28,data:data60};
if(vErrors === null){
vErrors = [err243];
}
else {
vErrors.push(err243);
}
errors++;
}
}
}
const emErrs76 = [];
for(const err244 of vErrors){
if(!err244.emUsed){
emErrs76.push(err244);
}
}
vErrors = emErrs76;
errors = emErrs76.length;
}
if(errors > 0){
const emErrors13 = {"required":{"id":[],"name":[],"provider":[]}};
const templates13 = {required:{}};
let emPropParams12;
let emParamsErrors12;
for(const err245 of vErrors){
if((((((err245.keyword !== "errorMessage") && (!err245.emUsed)) && (err245.instancePath === instancePath+"/models/assistant/model")) && (err245.keyword in emErrors13)) && (err245.schemaPath.indexOf("#/properties/models/properties/assistant/properties/model") === 0)) && (/^\/[^\/]*$/.test(err245.schemaPath.slice(57)))){
emPropParams12 = obj0[err245.keyword];
emParamsErrors12 = emErrors13[err245.keyword][err245.params[emPropParams12]];
if(emParamsErrors12){
emParamsErrors12.push(err245);
err245.emUsed = true;
}
}
}
for(const key16 in emErrors13){
for(const keyProp12 in emErrors13[key16]){
emParamsErrors12 = emErrors13[key16][keyProp12];
if(emParamsErrors12.length){
const tmpl12 = templates13[key16] && templates13[key16][keyProp12];
const err246 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/properties/models/properties/assistant/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors12},message:tmpl12 ? tmpl12() : schema27.properties.models.properties.assistant.properties.model.errorMessage[key16][keyProp12],schema:schema27.properties.models.properties.assistant.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.assistant.properties.model,data:data60};
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
const emErrs77 = [];
for(const err247 of vErrors){
if(!err247.emUsed){
emErrs77.push(err247);
}
}
vErrors = emErrs77;
errors = emErrs77.length;
}
}
if(data59.contextWindow !== undefined){
let data70 = data59.contextWindow;
if(typeof data70 == "number"){
if(data70 < 0 || isNaN(data70)){
const err248 = {instancePath:instancePath+"/models/assistant/contextWindow",schemaPath:"#/properties/models/properties/assistant/properties/contextWindow/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.assistant.properties.contextWindow,data:data70};
if(vErrors === null){
vErrors = [err248];
}
else {
vErrors.push(err248);
}
errors++;
}
}
else {
const err249 = {instancePath:instancePath+"/models/assistant/contextWindow",schemaPath:"#/properties/models/properties/assistant/properties/contextWindow/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.assistant.properties.contextWindow.type,parentSchema:schema27.properties.models.properties.assistant.properties.contextWindow,data:data70};
if(vErrors === null){
vErrors = [err249];
}
else {
vErrors.push(err249);
}
errors++;
}
if(errors > 0){
const emErrs78 = [];
for(const err250 of vErrors){
if(!err250.emUsed){
emErrs78.push(err250);
}
}
vErrors = emErrs78;
errors = emErrs78.length;
}
}
if(data59.inputPricePerMillion !== undefined){
let data71 = data59.inputPricePerMillion;
if(typeof data71 == "number"){
if(data71 < 0 || isNaN(data71)){
const err251 = {instancePath:instancePath+"/models/assistant/inputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.assistant.properties.inputPricePerMillion,data:data71};
if(vErrors === null){
vErrors = [err251];
}
else {
vErrors.push(err251);
}
errors++;
}
}
else {
const err252 = {instancePath:instancePath+"/models/assistant/inputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.assistant.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.assistant.properties.inputPricePerMillion,data:data71};
if(vErrors === null){
vErrors = [err252];
}
else {
vErrors.push(err252);
}
errors++;
}
if(errors > 0){
const emErrs79 = [];
for(const err253 of vErrors){
if(!err253.emUsed){
emErrs79.push(err253);
}
}
vErrors = emErrs79;
errors = emErrs79.length;
}
}
if(data59.cachedInputPricePerMillion !== undefined){
let data72 = data59.cachedInputPricePerMillion;
if(typeof data72 == "number"){
if(data72 < 0 || isNaN(data72)){
const err254 = {instancePath:instancePath+"/models/assistant/cachedInputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/cachedInputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.assistant.properties.cachedInputPricePerMillion,data:data72};
if(vErrors === null){
vErrors = [err254];
}
else {
vErrors.push(err254);
}
errors++;
}
}
else {
const err255 = {instancePath:instancePath+"/models/assistant/cachedInputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/cachedInputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.assistant.properties.cachedInputPricePerMillion.type,parentSchema:schema27.properties.models.properties.assistant.properties.cachedInputPricePerMillion,data:data72};
if(vErrors === null){
vErrors = [err255];
}
else {
vErrors.push(err255);
}
errors++;
}
if(errors > 0){
const emErrs80 = [];
for(const err256 of vErrors){
if(!err256.emUsed){
emErrs80.push(err256);
}
}
vErrors = emErrs80;
errors = emErrs80.length;
}
}
if(data59.cacheWritePricePerMillion !== undefined){
let data73 = data59.cacheWritePricePerMillion;
if(typeof data73 == "number"){
if(data73 < 0 || isNaN(data73)){
const err257 = {instancePath:instancePath+"/models/assistant/cacheWritePricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/cacheWritePricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.assistant.properties.cacheWritePricePerMillion,data:data73};
if(vErrors === null){
vErrors = [err257];
}
else {
vErrors.push(err257);
}
errors++;
}
}
else {
const err258 = {instancePath:instancePath+"/models/assistant/cacheWritePricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/cacheWritePricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.assistant.properties.cacheWritePricePerMillion.type,parentSchema:schema27.properties.models.properties.assistant.properties.cacheWritePricePerMillion,data:data73};
if(vErrors === null){
vErrors = [err258];
}
else {
vErrors.push(err258);
}
errors++;
}
if(errors > 0){
const emErrs81 = [];
for(const err259 of vErrors){
if(!err259.emUsed){
emErrs81.push(err259);
}
}
vErrors = emErrs81;
errors = emErrs81.length;
}
}
if(data59.outputPricePerMillion !== undefined){
let data74 = data59.outputPricePerMillion;
if(typeof data74 == "number"){
if(data74 < 0 || isNaN(data74)){
const err260 = {instancePath:instancePath+"/models/assistant/outputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.assistant.properties.outputPricePerMillion,data:data74};
if(vErrors === null){
vErrors = [err260];
}
else {
vErrors.push(err260);
}
errors++;
}
}
else {
const err261 = {instancePath:instancePath+"/models/assistant/outputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.assistant.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.assistant.properties.outputPricePerMillion,data:data74};
if(vErrors === null){
vErrors = [err261];
}
else {
vErrors.push(err261);
}
errors++;
}
if(errors > 0){
const emErrs82 = [];
for(const err262 of vErrors){
if(!err262.emUsed){
emErrs82.push(err262);
}
}
vErrors = emErrs82;
errors = emErrs82.length;
}
}
}
else {
const err263 = {instancePath:instancePath+"/models/assistant",schemaPath:"#/properties/models/properties/assistant/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.assistant.type,parentSchema:schema27.properties.models.properties.assistant,data:data59};
if(vErrors === null){
vErrors = [err263];
}
else {
vErrors.push(err263);
}
errors++;
}
if(errors > 0){
const emErrs83 = [];
for(const err264 of vErrors){
if(!err264.emUsed){
emErrs83.push(err264);
}
}
vErrors = emErrs83;
errors = emErrs83.length;
}
}
if(data58.tools !== undefined){
let data75 = data58.tools;
if(data75 && typeof data75 == "object" && !Array.isArray(data75)){
if(data75.model !== undefined){
let data76 = data75.model;
if(data76 && typeof data76 == "object" && !Array.isArray(data76)){
if(data76.id === undefined){
const err265 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data76};
if(vErrors === null){
vErrors = [err265];
}
else {
vErrors.push(err265);
}
errors++;
}
if(data76.name === undefined){
const err266 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data76};
if(vErrors === null){
vErrors = [err266];
}
else {
vErrors.push(err266);
}
errors++;
}
if(data76.provider === undefined){
const err267 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data76};
if(vErrors === null){
vErrors = [err267];
}
else {
vErrors.push(err267);
}
errors++;
}
if(data76.id !== undefined){
let data77 = data76.id;
if(typeof data77 !== "string"){
const err268 = {instancePath:instancePath+"/models/tools/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data77};
if(vErrors === null){
vErrors = [err268];
}
else {
vErrors.push(err268);
}
errors++;
}
if(errors > 0){
const emErrs84 = [];
for(const err269 of vErrors){
if(!err269.emUsed){
emErrs84.push(err269);
}
}
vErrors = emErrs84;
errors = emErrs84.length;
}
}
if(data76.name !== undefined){
let data78 = data76.name;
if(typeof data78 !== "string"){
const err270 = {instancePath:instancePath+"/models/tools/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data78};
if(vErrors === null){
vErrors = [err270];
}
else {
vErrors.push(err270);
}
errors++;
}
if(errors > 0){
const emErrs85 = [];
for(const err271 of vErrors){
if(!err271.emUsed){
emErrs85.push(err271);
}
}
vErrors = emErrs85;
errors = emErrs85.length;
}
}
if(data76.provider !== undefined){
let data79 = data76.provider;
if(data79 && typeof data79 == "object" && !Array.isArray(data79)){
if(data79.type === undefined){
const err272 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data79};
if(vErrors === null){
vErrors = [err272];
}
else {
vErrors.push(err272);
}
errors++;
}
if(data79.name === undefined){
const err273 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data79};
if(vErrors === null){
vErrors = [err273];
}
else {
vErrors.push(err273);
}
errors++;
}
if(data79.id === undefined){
const err274 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data79};
if(vErrors === null){
vErrors = [err274];
}
else {
vErrors.push(err274);
}
errors++;
}
if(data79.type !== undefined){
let data80 = data79.type;
if(typeof data80 !== "string"){
const err275 = {instancePath:instancePath+"/models/tools/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data80};
if(vErrors === null){
vErrors = [err275];
}
else {
vErrors.push(err275);
}
errors++;
}
if(errors > 0){
const emErrs86 = [];
for(const err276 of vErrors){
if(!err276.emUsed){
emErrs86.push(err276);
}
}
vErrors = emErrs86;
errors = emErrs86.length;
}
}
if(data79.name !== undefined){
let data81 = data79.name;
if(typeof data81 !== "string"){
const err277 = {instancePath:instancePath+"/models/tools/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data81};
if(vErrors === null){
vErrors = [err277];
}
else {
vErrors.push(err277);
}
errors++;
}
if(errors > 0){
const emErrs87 = [];
for(const err278 of vErrors){
if(!err278.emUsed){
emErrs87.push(err278);
}
}
vErrors = emErrs87;
errors = emErrs87.length;
}
}
if(data79.id !== undefined){
let data82 = data79.id;
if(typeof data82 !== "string"){
const err279 = {instancePath:instancePath+"/models/tools/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data82};
if(vErrors === null){
vErrors = [err279];
}
else {
vErrors.push(err279);
}
errors++;
}
if(errors > 0){
const emErrs88 = [];
for(const err280 of vErrors){
if(!err280.emUsed){
emErrs88.push(err280);
}
}
vErrors = emErrs88;
errors = emErrs88.length;
}
}
}
else {
const err281 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data79};
if(vErrors === null){
vErrors = [err281];
}
else {
vErrors.push(err281);
}
errors++;
}
if(errors > 0){
const emErrors14 = {"required":{"type":[],"name":[],"id":[]}};
const templates14 = {required:{}};
let emPropParams13;
let emParamsErrors13;
for(const err282 of vErrors){
if((((((err282.keyword !== "errorMessage") && (!err282.emUsed)) && (err282.instancePath === instancePath+"/models/tools/model/provider")) && (err282.keyword in emErrors14)) && (err282.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err282.schemaPath.slice(39)))){
emPropParams13 = obj0[err282.keyword];
emParamsErrors13 = emErrors14[err282.keyword][err282.params[emPropParams13]];
if(emParamsErrors13){
emParamsErrors13.push(err282);
err282.emUsed = true;
}
}
}
for(const key17 in emErrors14){
for(const keyProp13 in emErrors14[key17]){
emParamsErrors13 = emErrors14[key17][keyProp13];
if(emParamsErrors13.length){
const tmpl13 = templates14[key17] && templates14[key17][keyProp13];
const err283 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors13},message:tmpl13 ? tmpl13() : schema28.properties.provider.errorMessage[key17][keyProp13],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data79};
if(vErrors === null){
vErrors = [err283];
}
else {
vErrors.push(err283);
}
errors++;
}
}
}
const emErrs89 = [];
for(const err284 of vErrors){
if(!err284.emUsed){
emErrs89.push(err284);
}
}
vErrors = emErrs89;
errors = emErrs89.length;
}
}
if(data76.contextWindow !== undefined){
let data83 = data76.contextWindow;
if(!(typeof data83 == "number")){
const err285 = {instancePath:instancePath+"/models/tools/model/contextWindow",schemaPath:"#/definitions/Model/properties/contextWindow/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.contextWindow.type,parentSchema:schema28.properties.contextWindow,data:data83};
if(vErrors === null){
vErrors = [err285];
}
else {
vErrors.push(err285);
}
errors++;
}
if(errors > 0){
const emErrs90 = [];
for(const err286 of vErrors){
if(!err286.emUsed){
emErrs90.push(err286);
}
}
vErrors = emErrs90;
errors = emErrs90.length;
}
}
if(data76.cachedInputPricePerMillion !== undefined){
let data84 = data76.cachedInputPricePerMillion;
if(!(typeof data84 == "number")){
const err287 = {instancePath:instancePath+"/models/tools/model/cachedInputPricePerMillion",schemaPath:"#/definitions/Model/properties/cachedInputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.cachedInputPricePerMillion.type,parentSchema:schema28.properties.cachedInputPricePerMillion,data:data84};
if(vErrors === null){
vErrors = [err287];
}
else {
vErrors.push(err287);
}
errors++;
}
if(errors > 0){
const emErrs91 = [];
for(const err288 of vErrors){
if(!err288.emUsed){
emErrs91.push(err288);
}
}
vErrors = emErrs91;
errors = emErrs91.length;
}
}
if(data76.cacheWritePricePerMillion !== undefined){
let data85 = data76.cacheWritePricePerMillion;
if(!(typeof data85 == "number")){
const err289 = {instancePath:instancePath+"/models/tools/model/cacheWritePricePerMillion",schemaPath:"#/definitions/Model/properties/cacheWritePricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.cacheWritePricePerMillion.type,parentSchema:schema28.properties.cacheWritePricePerMillion,data:data85};
if(vErrors === null){
vErrors = [err289];
}
else {
vErrors.push(err289);
}
errors++;
}
if(errors > 0){
const emErrs92 = [];
for(const err290 of vErrors){
if(!err290.emUsed){
emErrs92.push(err290);
}
}
vErrors = emErrs92;
errors = emErrs92.length;
}
}
}
else {
const err291 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data76};
if(vErrors === null){
vErrors = [err291];
}
else {
vErrors.push(err291);
}
errors++;
}
if(errors > 0){
const emErrors15 = {"required":{"id":[],"name":[],"provider":[]}};
const templates15 = {required:{}};
let emPropParams14;
let emParamsErrors14;
for(const err292 of vErrors){
if((((((err292.keyword !== "errorMessage") && (!err292.emUsed)) && (err292.instancePath === instancePath+"/models/tools/model")) && (err292.keyword in emErrors15)) && (err292.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err292.schemaPath.slice(19)))){
emPropParams14 = obj0[err292.keyword];
emParamsErrors14 = emErrors15[err292.keyword][err292.params[emPropParams14]];
if(emParamsErrors14){
emParamsErrors14.push(err292);
err292.emUsed = true;
}
}
}
for(const key18 in emErrors15){
for(const keyProp14 in emErrors15[key18]){
emParamsErrors14 = emErrors15[key18][keyProp14];
if(emParamsErrors14.length){
const tmpl14 = templates15[key18] && templates15[key18][keyProp14];
const err293 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors14},message:tmpl14 ? tmpl14() : schema28.errorMessage[key18][keyProp14],schema:schema28.errorMessage,parentSchema:schema28,data:data76};
if(vErrors === null){
vErrors = [err293];
}
else {
vErrors.push(err293);
}
errors++;
}
}
}
const emErrs93 = [];
for(const err294 of vErrors){
if(!err294.emUsed){
emErrs93.push(err294);
}
}
vErrors = emErrs93;
errors = emErrs93.length;
}
if(errors > 0){
const emErrors16 = {"required":{"id":[],"name":[],"provider":[]}};
const templates16 = {required:{}};
let emPropParams15;
let emParamsErrors15;
for(const err295 of vErrors){
if((((((err295.keyword !== "errorMessage") && (!err295.emUsed)) && (err295.instancePath === instancePath+"/models/tools/model")) && (err295.keyword in emErrors16)) && (err295.schemaPath.indexOf("#/properties/models/properties/tools/properties/model") === 0)) && (/^\/[^\/]*$/.test(err295.schemaPath.slice(53)))){
emPropParams15 = obj0[err295.keyword];
emParamsErrors15 = emErrors16[err295.keyword][err295.params[emPropParams15]];
if(emParamsErrors15){
emParamsErrors15.push(err295);
err295.emUsed = true;
}
}
}
for(const key19 in emErrors16){
for(const keyProp15 in emErrors16[key19]){
emParamsErrors15 = emErrors16[key19][keyProp15];
if(emParamsErrors15.length){
const tmpl15 = templates16[key19] && templates16[key19][keyProp15];
const err296 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/properties/models/properties/tools/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors15},message:tmpl15 ? tmpl15() : schema27.properties.models.properties.tools.properties.model.errorMessage[key19][keyProp15],schema:schema27.properties.models.properties.tools.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.tools.properties.model,data:data76};
if(vErrors === null){
vErrors = [err296];
}
else {
vErrors.push(err296);
}
errors++;
}
}
}
const emErrs94 = [];
for(const err297 of vErrors){
if(!err297.emUsed){
emErrs94.push(err297);
}
}
vErrors = emErrs94;
errors = emErrs94.length;
}
}
if(data75.contextWindow !== undefined){
let data86 = data75.contextWindow;
if(typeof data86 == "number"){
if(data86 < 0 || isNaN(data86)){
const err298 = {instancePath:instancePath+"/models/tools/contextWindow",schemaPath:"#/properties/models/properties/tools/properties/contextWindow/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.tools.properties.contextWindow,data:data86};
if(vErrors === null){
vErrors = [err298];
}
else {
vErrors.push(err298);
}
errors++;
}
}
else {
const err299 = {instancePath:instancePath+"/models/tools/contextWindow",schemaPath:"#/properties/models/properties/tools/properties/contextWindow/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.tools.properties.contextWindow.type,parentSchema:schema27.properties.models.properties.tools.properties.contextWindow,data:data86};
if(vErrors === null){
vErrors = [err299];
}
else {
vErrors.push(err299);
}
errors++;
}
if(errors > 0){
const emErrs95 = [];
for(const err300 of vErrors){
if(!err300.emUsed){
emErrs95.push(err300);
}
}
vErrors = emErrs95;
errors = emErrs95.length;
}
}
if(data75.inputPricePerMillion !== undefined){
let data87 = data75.inputPricePerMillion;
if(typeof data87 == "number"){
if(data87 < 0 || isNaN(data87)){
const err301 = {instancePath:instancePath+"/models/tools/inputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.tools.properties.inputPricePerMillion,data:data87};
if(vErrors === null){
vErrors = [err301];
}
else {
vErrors.push(err301);
}
errors++;
}
}
else {
const err302 = {instancePath:instancePath+"/models/tools/inputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.tools.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.tools.properties.inputPricePerMillion,data:data87};
if(vErrors === null){
vErrors = [err302];
}
else {
vErrors.push(err302);
}
errors++;
}
if(errors > 0){
const emErrs96 = [];
for(const err303 of vErrors){
if(!err303.emUsed){
emErrs96.push(err303);
}
}
vErrors = emErrs96;
errors = emErrs96.length;
}
}
if(data75.cachedInputPricePerMillion !== undefined){
let data88 = data75.cachedInputPricePerMillion;
if(typeof data88 == "number"){
if(data88 < 0 || isNaN(data88)){
const err304 = {instancePath:instancePath+"/models/tools/cachedInputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/cachedInputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.tools.properties.cachedInputPricePerMillion,data:data88};
if(vErrors === null){
vErrors = [err304];
}
else {
vErrors.push(err304);
}
errors++;
}
}
else {
const err305 = {instancePath:instancePath+"/models/tools/cachedInputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/cachedInputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.tools.properties.cachedInputPricePerMillion.type,parentSchema:schema27.properties.models.properties.tools.properties.cachedInputPricePerMillion,data:data88};
if(vErrors === null){
vErrors = [err305];
}
else {
vErrors.push(err305);
}
errors++;
}
if(errors > 0){
const emErrs97 = [];
for(const err306 of vErrors){
if(!err306.emUsed){
emErrs97.push(err306);
}
}
vErrors = emErrs97;
errors = emErrs97.length;
}
}
if(data75.cacheWritePricePerMillion !== undefined){
let data89 = data75.cacheWritePricePerMillion;
if(typeof data89 == "number"){
if(data89 < 0 || isNaN(data89)){
const err307 = {instancePath:instancePath+"/models/tools/cacheWritePricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/cacheWritePricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.tools.properties.cacheWritePricePerMillion,data:data89};
if(vErrors === null){
vErrors = [err307];
}
else {
vErrors.push(err307);
}
errors++;
}
}
else {
const err308 = {instancePath:instancePath+"/models/tools/cacheWritePricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/cacheWritePricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.tools.properties.cacheWritePricePerMillion.type,parentSchema:schema27.properties.models.properties.tools.properties.cacheWritePricePerMillion,data:data89};
if(vErrors === null){
vErrors = [err308];
}
else {
vErrors.push(err308);
}
errors++;
}
if(errors > 0){
const emErrs98 = [];
for(const err309 of vErrors){
if(!err309.emUsed){
emErrs98.push(err309);
}
}
vErrors = emErrs98;
errors = emErrs98.length;
}
}
if(data75.outputPricePerMillion !== undefined){
let data90 = data75.outputPricePerMillion;
if(typeof data90 == "number"){
if(data90 < 0 || isNaN(data90)){
const err310 = {instancePath:instancePath+"/models/tools/outputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.tools.properties.outputPricePerMillion,data:data90};
if(vErrors === null){
vErrors = [err310];
}
else {
vErrors.push(err310);
}
errors++;
}
}
else {
const err311 = {instancePath:instancePath+"/models/tools/outputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.tools.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.tools.properties.outputPricePerMillion,data:data90};
if(vErrors === null){
vErrors = [err311];
}
else {
vErrors.push(err311);
}
errors++;
}
if(errors > 0){
const emErrs99 = [];
for(const err312 of vErrors){
if(!err312.emUsed){
emErrs99.push(err312);
}
}
vErrors = emErrs99;
errors = emErrs99.length;
}
}
}
else {
const err313 = {instancePath:instancePath+"/models/tools",schemaPath:"#/properties/models/properties/tools/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.tools.type,parentSchema:schema27.properties.models.properties.tools,data:data75};
if(vErrors === null){
vErrors = [err313];
}
else {
vErrors.push(err313);
}
errors++;
}
if(errors > 0){
const emErrs100 = [];
for(const err314 of vErrors){
if(!err314.emUsed){
emErrs100.push(err314);
}
}
vErrors = emErrs100;
errors = emErrs100.length;
}
}
if(data58.summarizer !== undefined){
let data91 = data58.summarizer;
if(data91 && typeof data91 == "object" && !Array.isArray(data91)){
if(data91.model !== undefined){
let data92 = data91.model;
if(data92 && typeof data92 == "object" && !Array.isArray(data92)){
if(data92.id === undefined){
const err315 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data92};
if(vErrors === null){
vErrors = [err315];
}
else {
vErrors.push(err315);
}
errors++;
}
if(data92.name === undefined){
const err316 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data92};
if(vErrors === null){
vErrors = [err316];
}
else {
vErrors.push(err316);
}
errors++;
}
if(data92.provider === undefined){
const err317 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data92};
if(vErrors === null){
vErrors = [err317];
}
else {
vErrors.push(err317);
}
errors++;
}
if(data92.id !== undefined){
let data93 = data92.id;
if(typeof data93 !== "string"){
const err318 = {instancePath:instancePath+"/models/summarizer/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data93};
if(vErrors === null){
vErrors = [err318];
}
else {
vErrors.push(err318);
}
errors++;
}
if(errors > 0){
const emErrs101 = [];
for(const err319 of vErrors){
if(!err319.emUsed){
emErrs101.push(err319);
}
}
vErrors = emErrs101;
errors = emErrs101.length;
}
}
if(data92.name !== undefined){
let data94 = data92.name;
if(typeof data94 !== "string"){
const err320 = {instancePath:instancePath+"/models/summarizer/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data94};
if(vErrors === null){
vErrors = [err320];
}
else {
vErrors.push(err320);
}
errors++;
}
if(errors > 0){
const emErrs102 = [];
for(const err321 of vErrors){
if(!err321.emUsed){
emErrs102.push(err321);
}
}
vErrors = emErrs102;
errors = emErrs102.length;
}
}
if(data92.provider !== undefined){
let data95 = data92.provider;
if(data95 && typeof data95 == "object" && !Array.isArray(data95)){
if(data95.type === undefined){
const err322 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data95};
if(vErrors === null){
vErrors = [err322];
}
else {
vErrors.push(err322);
}
errors++;
}
if(data95.name === undefined){
const err323 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data95};
if(vErrors === null){
vErrors = [err323];
}
else {
vErrors.push(err323);
}
errors++;
}
if(data95.id === undefined){
const err324 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data95};
if(vErrors === null){
vErrors = [err324];
}
else {
vErrors.push(err324);
}
errors++;
}
if(data95.type !== undefined){
let data96 = data95.type;
if(typeof data96 !== "string"){
const err325 = {instancePath:instancePath+"/models/summarizer/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data96};
if(vErrors === null){
vErrors = [err325];
}
else {
vErrors.push(err325);
}
errors++;
}
if(errors > 0){
const emErrs103 = [];
for(const err326 of vErrors){
if(!err326.emUsed){
emErrs103.push(err326);
}
}
vErrors = emErrs103;
errors = emErrs103.length;
}
}
if(data95.name !== undefined){
let data97 = data95.name;
if(typeof data97 !== "string"){
const err327 = {instancePath:instancePath+"/models/summarizer/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data97};
if(vErrors === null){
vErrors = [err327];
}
else {
vErrors.push(err327);
}
errors++;
}
if(errors > 0){
const emErrs104 = [];
for(const err328 of vErrors){
if(!err328.emUsed){
emErrs104.push(err328);
}
}
vErrors = emErrs104;
errors = emErrs104.length;
}
}
if(data95.id !== undefined){
let data98 = data95.id;
if(typeof data98 !== "string"){
const err329 = {instancePath:instancePath+"/models/summarizer/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data98};
if(vErrors === null){
vErrors = [err329];
}
else {
vErrors.push(err329);
}
errors++;
}
if(errors > 0){
const emErrs105 = [];
for(const err330 of vErrors){
if(!err330.emUsed){
emErrs105.push(err330);
}
}
vErrors = emErrs105;
errors = emErrs105.length;
}
}
}
else {
const err331 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data95};
if(vErrors === null){
vErrors = [err331];
}
else {
vErrors.push(err331);
}
errors++;
}
if(errors > 0){
const emErrors17 = {"required":{"type":[],"name":[],"id":[]}};
const templates17 = {required:{}};
let emPropParams16;
let emParamsErrors16;
for(const err332 of vErrors){
if((((((err332.keyword !== "errorMessage") && (!err332.emUsed)) && (err332.instancePath === instancePath+"/models/summarizer/model/provider")) && (err332.keyword in emErrors17)) && (err332.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err332.schemaPath.slice(39)))){
emPropParams16 = obj0[err332.keyword];
emParamsErrors16 = emErrors17[err332.keyword][err332.params[emPropParams16]];
if(emParamsErrors16){
emParamsErrors16.push(err332);
err332.emUsed = true;
}
}
}
for(const key20 in emErrors17){
for(const keyProp16 in emErrors17[key20]){
emParamsErrors16 = emErrors17[key20][keyProp16];
if(emParamsErrors16.length){
const tmpl16 = templates17[key20] && templates17[key20][keyProp16];
const err333 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors16},message:tmpl16 ? tmpl16() : schema28.properties.provider.errorMessage[key20][keyProp16],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data95};
if(vErrors === null){
vErrors = [err333];
}
else {
vErrors.push(err333);
}
errors++;
}
}
}
const emErrs106 = [];
for(const err334 of vErrors){
if(!err334.emUsed){
emErrs106.push(err334);
}
}
vErrors = emErrs106;
errors = emErrs106.length;
}
}
if(data92.contextWindow !== undefined){
let data99 = data92.contextWindow;
if(!(typeof data99 == "number")){
const err335 = {instancePath:instancePath+"/models/summarizer/model/contextWindow",schemaPath:"#/definitions/Model/properties/contextWindow/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.contextWindow.type,parentSchema:schema28.properties.contextWindow,data:data99};
if(vErrors === null){
vErrors = [err335];
}
else {
vErrors.push(err335);
}
errors++;
}
if(errors > 0){
const emErrs107 = [];
for(const err336 of vErrors){
if(!err336.emUsed){
emErrs107.push(err336);
}
}
vErrors = emErrs107;
errors = emErrs107.length;
}
}
if(data92.cachedInputPricePerMillion !== undefined){
let data100 = data92.cachedInputPricePerMillion;
if(!(typeof data100 == "number")){
const err337 = {instancePath:instancePath+"/models/summarizer/model/cachedInputPricePerMillion",schemaPath:"#/definitions/Model/properties/cachedInputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.cachedInputPricePerMillion.type,parentSchema:schema28.properties.cachedInputPricePerMillion,data:data100};
if(vErrors === null){
vErrors = [err337];
}
else {
vErrors.push(err337);
}
errors++;
}
if(errors > 0){
const emErrs108 = [];
for(const err338 of vErrors){
if(!err338.emUsed){
emErrs108.push(err338);
}
}
vErrors = emErrs108;
errors = emErrs108.length;
}
}
if(data92.cacheWritePricePerMillion !== undefined){
let data101 = data92.cacheWritePricePerMillion;
if(!(typeof data101 == "number")){
const err339 = {instancePath:instancePath+"/models/summarizer/model/cacheWritePricePerMillion",schemaPath:"#/definitions/Model/properties/cacheWritePricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.cacheWritePricePerMillion.type,parentSchema:schema28.properties.cacheWritePricePerMillion,data:data101};
if(vErrors === null){
vErrors = [err339];
}
else {
vErrors.push(err339);
}
errors++;
}
if(errors > 0){
const emErrs109 = [];
for(const err340 of vErrors){
if(!err340.emUsed){
emErrs109.push(err340);
}
}
vErrors = emErrs109;
errors = emErrs109.length;
}
}
}
else {
const err341 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data92};
if(vErrors === null){
vErrors = [err341];
}
else {
vErrors.push(err341);
}
errors++;
}
if(errors > 0){
const emErrors18 = {"required":{"id":[],"name":[],"provider":[]}};
const templates18 = {required:{}};
let emPropParams17;
let emParamsErrors17;
for(const err342 of vErrors){
if((((((err342.keyword !== "errorMessage") && (!err342.emUsed)) && (err342.instancePath === instancePath+"/models/summarizer/model")) && (err342.keyword in emErrors18)) && (err342.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err342.schemaPath.slice(19)))){
emPropParams17 = obj0[err342.keyword];
emParamsErrors17 = emErrors18[err342.keyword][err342.params[emPropParams17]];
if(emParamsErrors17){
emParamsErrors17.push(err342);
err342.emUsed = true;
}
}
}
for(const key21 in emErrors18){
for(const keyProp17 in emErrors18[key21]){
emParamsErrors17 = emErrors18[key21][keyProp17];
if(emParamsErrors17.length){
const tmpl17 = templates18[key21] && templates18[key21][keyProp17];
const err343 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors17},message:tmpl17 ? tmpl17() : schema28.errorMessage[key21][keyProp17],schema:schema28.errorMessage,parentSchema:schema28,data:data92};
if(vErrors === null){
vErrors = [err343];
}
else {
vErrors.push(err343);
}
errors++;
}
}
}
const emErrs110 = [];
for(const err344 of vErrors){
if(!err344.emUsed){
emErrs110.push(err344);
}
}
vErrors = emErrs110;
errors = emErrs110.length;
}
if(errors > 0){
const emErrors19 = {"required":{"id":[],"name":[],"provider":[]}};
const templates19 = {required:{}};
let emPropParams18;
let emParamsErrors18;
for(const err345 of vErrors){
if((((((err345.keyword !== "errorMessage") && (!err345.emUsed)) && (err345.instancePath === instancePath+"/models/summarizer/model")) && (err345.keyword in emErrors19)) && (err345.schemaPath.indexOf("#/properties/models/properties/summarizer/properties/model") === 0)) && (/^\/[^\/]*$/.test(err345.schemaPath.slice(58)))){
emPropParams18 = obj0[err345.keyword];
emParamsErrors18 = emErrors19[err345.keyword][err345.params[emPropParams18]];
if(emParamsErrors18){
emParamsErrors18.push(err345);
err345.emUsed = true;
}
}
}
for(const key22 in emErrors19){
for(const keyProp18 in emErrors19[key22]){
emParamsErrors18 = emErrors19[key22][keyProp18];
if(emParamsErrors18.length){
const tmpl18 = templates19[key22] && templates19[key22][keyProp18];
const err346 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/properties/models/properties/summarizer/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors18},message:tmpl18 ? tmpl18() : schema27.properties.models.properties.summarizer.properties.model.errorMessage[key22][keyProp18],schema:schema27.properties.models.properties.summarizer.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.summarizer.properties.model,data:data92};
if(vErrors === null){
vErrors = [err346];
}
else {
vErrors.push(err346);
}
errors++;
}
}
}
const emErrs111 = [];
for(const err347 of vErrors){
if(!err347.emUsed){
emErrs111.push(err347);
}
}
vErrors = emErrs111;
errors = emErrs111.length;
}
}
if(data91.contextWindow !== undefined){
let data102 = data91.contextWindow;
if(typeof data102 == "number"){
if(data102 < 0 || isNaN(data102)){
const err348 = {instancePath:instancePath+"/models/summarizer/contextWindow",schemaPath:"#/properties/models/properties/summarizer/properties/contextWindow/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.summarizer.properties.contextWindow,data:data102};
if(vErrors === null){
vErrors = [err348];
}
else {
vErrors.push(err348);
}
errors++;
}
}
else {
const err349 = {instancePath:instancePath+"/models/summarizer/contextWindow",schemaPath:"#/properties/models/properties/summarizer/properties/contextWindow/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.summarizer.properties.contextWindow.type,parentSchema:schema27.properties.models.properties.summarizer.properties.contextWindow,data:data102};
if(vErrors === null){
vErrors = [err349];
}
else {
vErrors.push(err349);
}
errors++;
}
if(errors > 0){
const emErrs112 = [];
for(const err350 of vErrors){
if(!err350.emUsed){
emErrs112.push(err350);
}
}
vErrors = emErrs112;
errors = emErrs112.length;
}
}
if(data91.inputPricePerMillion !== undefined){
let data103 = data91.inputPricePerMillion;
if(typeof data103 == "number"){
if(data103 < 0 || isNaN(data103)){
const err351 = {instancePath:instancePath+"/models/summarizer/inputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.summarizer.properties.inputPricePerMillion,data:data103};
if(vErrors === null){
vErrors = [err351];
}
else {
vErrors.push(err351);
}
errors++;
}
}
else {
const err352 = {instancePath:instancePath+"/models/summarizer/inputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.summarizer.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.summarizer.properties.inputPricePerMillion,data:data103};
if(vErrors === null){
vErrors = [err352];
}
else {
vErrors.push(err352);
}
errors++;
}
if(errors > 0){
const emErrs113 = [];
for(const err353 of vErrors){
if(!err353.emUsed){
emErrs113.push(err353);
}
}
vErrors = emErrs113;
errors = emErrs113.length;
}
}
if(data91.cachedInputPricePerMillion !== undefined){
let data104 = data91.cachedInputPricePerMillion;
if(typeof data104 == "number"){
if(data104 < 0 || isNaN(data104)){
const err354 = {instancePath:instancePath+"/models/summarizer/cachedInputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/cachedInputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.summarizer.properties.cachedInputPricePerMillion,data:data104};
if(vErrors === null){
vErrors = [err354];
}
else {
vErrors.push(err354);
}
errors++;
}
}
else {
const err355 = {instancePath:instancePath+"/models/summarizer/cachedInputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/cachedInputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.summarizer.properties.cachedInputPricePerMillion.type,parentSchema:schema27.properties.models.properties.summarizer.properties.cachedInputPricePerMillion,data:data104};
if(vErrors === null){
vErrors = [err355];
}
else {
vErrors.push(err355);
}
errors++;
}
if(errors > 0){
const emErrs114 = [];
for(const err356 of vErrors){
if(!err356.emUsed){
emErrs114.push(err356);
}
}
vErrors = emErrs114;
errors = emErrs114.length;
}
}
if(data91.cacheWritePricePerMillion !== undefined){
let data105 = data91.cacheWritePricePerMillion;
if(typeof data105 == "number"){
if(data105 < 0 || isNaN(data105)){
const err357 = {instancePath:instancePath+"/models/summarizer/cacheWritePricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/cacheWritePricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.summarizer.properties.cacheWritePricePerMillion,data:data105};
if(vErrors === null){
vErrors = [err357];
}
else {
vErrors.push(err357);
}
errors++;
}
}
else {
const err358 = {instancePath:instancePath+"/models/summarizer/cacheWritePricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/cacheWritePricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.summarizer.properties.cacheWritePricePerMillion.type,parentSchema:schema27.properties.models.properties.summarizer.properties.cacheWritePricePerMillion,data:data105};
if(vErrors === null){
vErrors = [err358];
}
else {
vErrors.push(err358);
}
errors++;
}
if(errors > 0){
const emErrs115 = [];
for(const err359 of vErrors){
if(!err359.emUsed){
emErrs115.push(err359);
}
}
vErrors = emErrs115;
errors = emErrs115.length;
}
}
if(data91.outputPricePerMillion !== undefined){
let data106 = data91.outputPricePerMillion;
if(typeof data106 == "number"){
if(data106 < 0 || isNaN(data106)){
const err360 = {instancePath:instancePath+"/models/summarizer/outputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.summarizer.properties.outputPricePerMillion,data:data106};
if(vErrors === null){
vErrors = [err360];
}
else {
vErrors.push(err360);
}
errors++;
}
}
else {
const err361 = {instancePath:instancePath+"/models/summarizer/outputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.summarizer.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.summarizer.properties.outputPricePerMillion,data:data106};
if(vErrors === null){
vErrors = [err361];
}
else {
vErrors.push(err361);
}
errors++;
}
if(errors > 0){
const emErrs116 = [];
for(const err362 of vErrors){
if(!err362.emUsed){
emErrs116.push(err362);
}
}
vErrors = emErrs116;
errors = emErrs116.length;
}
}
}
else {
const err363 = {instancePath:instancePath+"/models/summarizer",schemaPath:"#/properties/models/properties/summarizer/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.summarizer.type,parentSchema:schema27.properties.models.properties.summarizer,data:data91};
if(vErrors === null){
vErrors = [err363];
}
else {
vErrors.push(err363);
}
errors++;
}
if(errors > 0){
const emErrs117 = [];
for(const err364 of vErrors){
if(!err364.emUsed){
emErrs117.push(err364);
}
}
vErrors = emErrs117;
errors = emErrs117.length;
}
}
if(data58.evaluator !== undefined){
let data107 = data58.evaluator;
if(data107 && typeof data107 == "object" && !Array.isArray(data107)){
if(data107.model !== undefined){
let data108 = data107.model;
if(data108 && typeof data108 == "object" && !Array.isArray(data108)){
if(data108.id === undefined){
const err365 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data108};
if(vErrors === null){
vErrors = [err365];
}
else {
vErrors.push(err365);
}
errors++;
}
if(data108.name === undefined){
const err366 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data108};
if(vErrors === null){
vErrors = [err366];
}
else {
vErrors.push(err366);
}
errors++;
}
if(data108.provider === undefined){
const err367 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data108};
if(vErrors === null){
vErrors = [err367];
}
else {
vErrors.push(err367);
}
errors++;
}
if(data108.id !== undefined){
let data109 = data108.id;
if(typeof data109 !== "string"){
const err368 = {instancePath:instancePath+"/models/evaluator/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data109};
if(vErrors === null){
vErrors = [err368];
}
else {
vErrors.push(err368);
}
errors++;
}
if(errors > 0){
const emErrs118 = [];
for(const err369 of vErrors){
if(!err369.emUsed){
emErrs118.push(err369);
}
}
vErrors = emErrs118;
errors = emErrs118.length;
}
}
if(data108.name !== undefined){
let data110 = data108.name;
if(typeof data110 !== "string"){
const err370 = {instancePath:instancePath+"/models/evaluator/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data110};
if(vErrors === null){
vErrors = [err370];
}
else {
vErrors.push(err370);
}
errors++;
}
if(errors > 0){
const emErrs119 = [];
for(const err371 of vErrors){
if(!err371.emUsed){
emErrs119.push(err371);
}
}
vErrors = emErrs119;
errors = emErrs119.length;
}
}
if(data108.provider !== undefined){
let data111 = data108.provider;
if(data111 && typeof data111 == "object" && !Array.isArray(data111)){
if(data111.type === undefined){
const err372 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data111};
if(vErrors === null){
vErrors = [err372];
}
else {
vErrors.push(err372);
}
errors++;
}
if(data111.name === undefined){
const err373 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data111};
if(vErrors === null){
vErrors = [err373];
}
else {
vErrors.push(err373);
}
errors++;
}
if(data111.id === undefined){
const err374 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data111};
if(vErrors === null){
vErrors = [err374];
}
else {
vErrors.push(err374);
}
errors++;
}
if(data111.type !== undefined){
let data112 = data111.type;
if(typeof data112 !== "string"){
const err375 = {instancePath:instancePath+"/models/evaluator/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data112};
if(vErrors === null){
vErrors = [err375];
}
else {
vErrors.push(err375);
}
errors++;
}
if(errors > 0){
const emErrs120 = [];
for(const err376 of vErrors){
if(!err376.emUsed){
emErrs120.push(err376);
}
}
vErrors = emErrs120;
errors = emErrs120.length;
}
}
if(data111.name !== undefined){
let data113 = data111.name;
if(typeof data113 !== "string"){
const err377 = {instancePath:instancePath+"/models/evaluator/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data113};
if(vErrors === null){
vErrors = [err377];
}
else {
vErrors.push(err377);
}
errors++;
}
if(errors > 0){
const emErrs121 = [];
for(const err378 of vErrors){
if(!err378.emUsed){
emErrs121.push(err378);
}
}
vErrors = emErrs121;
errors = emErrs121.length;
}
}
if(data111.id !== undefined){
let data114 = data111.id;
if(typeof data114 !== "string"){
const err379 = {instancePath:instancePath+"/models/evaluator/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data114};
if(vErrors === null){
vErrors = [err379];
}
else {
vErrors.push(err379);
}
errors++;
}
if(errors > 0){
const emErrs122 = [];
for(const err380 of vErrors){
if(!err380.emUsed){
emErrs122.push(err380);
}
}
vErrors = emErrs122;
errors = emErrs122.length;
}
}
}
else {
const err381 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data111};
if(vErrors === null){
vErrors = [err381];
}
else {
vErrors.push(err381);
}
errors++;
}
if(errors > 0){
const emErrors20 = {"required":{"type":[],"name":[],"id":[]}};
const templates20 = {required:{}};
let emPropParams19;
let emParamsErrors19;
for(const err382 of vErrors){
if((((((err382.keyword !== "errorMessage") && (!err382.emUsed)) && (err382.instancePath === instancePath+"/models/evaluator/model/provider")) && (err382.keyword in emErrors20)) && (err382.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err382.schemaPath.slice(39)))){
emPropParams19 = obj0[err382.keyword];
emParamsErrors19 = emErrors20[err382.keyword][err382.params[emPropParams19]];
if(emParamsErrors19){
emParamsErrors19.push(err382);
err382.emUsed = true;
}
}
}
for(const key23 in emErrors20){
for(const keyProp19 in emErrors20[key23]){
emParamsErrors19 = emErrors20[key23][keyProp19];
if(emParamsErrors19.length){
const tmpl19 = templates20[key23] && templates20[key23][keyProp19];
const err383 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors19},message:tmpl19 ? tmpl19() : schema28.properties.provider.errorMessage[key23][keyProp19],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data111};
if(vErrors === null){
vErrors = [err383];
}
else {
vErrors.push(err383);
}
errors++;
}
}
}
const emErrs123 = [];
for(const err384 of vErrors){
if(!err384.emUsed){
emErrs123.push(err384);
}
}
vErrors = emErrs123;
errors = emErrs123.length;
}
}
if(data108.contextWindow !== undefined){
let data115 = data108.contextWindow;
if(!(typeof data115 == "number")){
const err385 = {instancePath:instancePath+"/models/evaluator/model/contextWindow",schemaPath:"#/definitions/Model/properties/contextWindow/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.contextWindow.type,parentSchema:schema28.properties.contextWindow,data:data115};
if(vErrors === null){
vErrors = [err385];
}
else {
vErrors.push(err385);
}
errors++;
}
if(errors > 0){
const emErrs124 = [];
for(const err386 of vErrors){
if(!err386.emUsed){
emErrs124.push(err386);
}
}
vErrors = emErrs124;
errors = emErrs124.length;
}
}
if(data108.cachedInputPricePerMillion !== undefined){
let data116 = data108.cachedInputPricePerMillion;
if(!(typeof data116 == "number")){
const err387 = {instancePath:instancePath+"/models/evaluator/model/cachedInputPricePerMillion",schemaPath:"#/definitions/Model/properties/cachedInputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.cachedInputPricePerMillion.type,parentSchema:schema28.properties.cachedInputPricePerMillion,data:data116};
if(vErrors === null){
vErrors = [err387];
}
else {
vErrors.push(err387);
}
errors++;
}
if(errors > 0){
const emErrs125 = [];
for(const err388 of vErrors){
if(!err388.emUsed){
emErrs125.push(err388);
}
}
vErrors = emErrs125;
errors = emErrs125.length;
}
}
if(data108.cacheWritePricePerMillion !== undefined){
let data117 = data108.cacheWritePricePerMillion;
if(!(typeof data117 == "number")){
const err389 = {instancePath:instancePath+"/models/evaluator/model/cacheWritePricePerMillion",schemaPath:"#/definitions/Model/properties/cacheWritePricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.cacheWritePricePerMillion.type,parentSchema:schema28.properties.cacheWritePricePerMillion,data:data117};
if(vErrors === null){
vErrors = [err389];
}
else {
vErrors.push(err389);
}
errors++;
}
if(errors > 0){
const emErrs126 = [];
for(const err390 of vErrors){
if(!err390.emUsed){
emErrs126.push(err390);
}
}
vErrors = emErrs126;
errors = emErrs126.length;
}
}
}
else {
const err391 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data108};
if(vErrors === null){
vErrors = [err391];
}
else {
vErrors.push(err391);
}
errors++;
}
if(errors > 0){
const emErrors21 = {"required":{"id":[],"name":[],"provider":[]}};
const templates21 = {required:{}};
let emPropParams20;
let emParamsErrors20;
for(const err392 of vErrors){
if((((((err392.keyword !== "errorMessage") && (!err392.emUsed)) && (err392.instancePath === instancePath+"/models/evaluator/model")) && (err392.keyword in emErrors21)) && (err392.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err392.schemaPath.slice(19)))){
emPropParams20 = obj0[err392.keyword];
emParamsErrors20 = emErrors21[err392.keyword][err392.params[emPropParams20]];
if(emParamsErrors20){
emParamsErrors20.push(err392);
err392.emUsed = true;
}
}
}
for(const key24 in emErrors21){
for(const keyProp20 in emErrors21[key24]){
emParamsErrors20 = emErrors21[key24][keyProp20];
if(emParamsErrors20.length){
const tmpl20 = templates21[key24] && templates21[key24][keyProp20];
const err393 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors20},message:tmpl20 ? tmpl20() : schema28.errorMessage[key24][keyProp20],schema:schema28.errorMessage,parentSchema:schema28,data:data108};
if(vErrors === null){
vErrors = [err393];
}
else {
vErrors.push(err393);
}
errors++;
}
}
}
const emErrs127 = [];
for(const err394 of vErrors){
if(!err394.emUsed){
emErrs127.push(err394);
}
}
vErrors = emErrs127;
errors = emErrs127.length;
}
if(errors > 0){
const emErrors22 = {"required":{"id":[],"name":[],"provider":[]}};
const templates22 = {required:{}};
let emPropParams21;
let emParamsErrors21;
for(const err395 of vErrors){
if((((((err395.keyword !== "errorMessage") && (!err395.emUsed)) && (err395.instancePath === instancePath+"/models/evaluator/model")) && (err395.keyword in emErrors22)) && (err395.schemaPath.indexOf("#/properties/models/properties/evaluator/properties/model") === 0)) && (/^\/[^\/]*$/.test(err395.schemaPath.slice(57)))){
emPropParams21 = obj0[err395.keyword];
emParamsErrors21 = emErrors22[err395.keyword][err395.params[emPropParams21]];
if(emParamsErrors21){
emParamsErrors21.push(err395);
err395.emUsed = true;
}
}
}
for(const key25 in emErrors22){
for(const keyProp21 in emErrors22[key25]){
emParamsErrors21 = emErrors22[key25][keyProp21];
if(emParamsErrors21.length){
const tmpl21 = templates22[key25] && templates22[key25][keyProp21];
const err396 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/properties/models/properties/evaluator/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors21},message:tmpl21 ? tmpl21() : schema27.properties.models.properties.evaluator.properties.model.errorMessage[key25][keyProp21],schema:schema27.properties.models.properties.evaluator.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.evaluator.properties.model,data:data108};
if(vErrors === null){
vErrors = [err396];
}
else {
vErrors.push(err396);
}
errors++;
}
}
}
const emErrs128 = [];
for(const err397 of vErrors){
if(!err397.emUsed){
emErrs128.push(err397);
}
}
vErrors = emErrs128;
errors = emErrs128.length;
}
}
if(data107.contextWindow !== undefined){
let data118 = data107.contextWindow;
if(typeof data118 == "number"){
if(data118 < 0 || isNaN(data118)){
const err398 = {instancePath:instancePath+"/models/evaluator/contextWindow",schemaPath:"#/properties/models/properties/evaluator/properties/contextWindow/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.evaluator.properties.contextWindow,data:data118};
if(vErrors === null){
vErrors = [err398];
}
else {
vErrors.push(err398);
}
errors++;
}
}
else {
const err399 = {instancePath:instancePath+"/models/evaluator/contextWindow",schemaPath:"#/properties/models/properties/evaluator/properties/contextWindow/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.evaluator.properties.contextWindow.type,parentSchema:schema27.properties.models.properties.evaluator.properties.contextWindow,data:data118};
if(vErrors === null){
vErrors = [err399];
}
else {
vErrors.push(err399);
}
errors++;
}
if(errors > 0){
const emErrs129 = [];
for(const err400 of vErrors){
if(!err400.emUsed){
emErrs129.push(err400);
}
}
vErrors = emErrs129;
errors = emErrs129.length;
}
}
if(data107.inputPricePerMillion !== undefined){
let data119 = data107.inputPricePerMillion;
if(typeof data119 == "number"){
if(data119 < 0 || isNaN(data119)){
const err401 = {instancePath:instancePath+"/models/evaluator/inputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.evaluator.properties.inputPricePerMillion,data:data119};
if(vErrors === null){
vErrors = [err401];
}
else {
vErrors.push(err401);
}
errors++;
}
}
else {
const err402 = {instancePath:instancePath+"/models/evaluator/inputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.evaluator.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.evaluator.properties.inputPricePerMillion,data:data119};
if(vErrors === null){
vErrors = [err402];
}
else {
vErrors.push(err402);
}
errors++;
}
if(errors > 0){
const emErrs130 = [];
for(const err403 of vErrors){
if(!err403.emUsed){
emErrs130.push(err403);
}
}
vErrors = emErrs130;
errors = emErrs130.length;
}
}
if(data107.cachedInputPricePerMillion !== undefined){
let data120 = data107.cachedInputPricePerMillion;
if(typeof data120 == "number"){
if(data120 < 0 || isNaN(data120)){
const err404 = {instancePath:instancePath+"/models/evaluator/cachedInputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/cachedInputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.evaluator.properties.cachedInputPricePerMillion,data:data120};
if(vErrors === null){
vErrors = [err404];
}
else {
vErrors.push(err404);
}
errors++;
}
}
else {
const err405 = {instancePath:instancePath+"/models/evaluator/cachedInputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/cachedInputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.evaluator.properties.cachedInputPricePerMillion.type,parentSchema:schema27.properties.models.properties.evaluator.properties.cachedInputPricePerMillion,data:data120};
if(vErrors === null){
vErrors = [err405];
}
else {
vErrors.push(err405);
}
errors++;
}
if(errors > 0){
const emErrs131 = [];
for(const err406 of vErrors){
if(!err406.emUsed){
emErrs131.push(err406);
}
}
vErrors = emErrs131;
errors = emErrs131.length;
}
}
if(data107.cacheWritePricePerMillion !== undefined){
let data121 = data107.cacheWritePricePerMillion;
if(typeof data121 == "number"){
if(data121 < 0 || isNaN(data121)){
const err407 = {instancePath:instancePath+"/models/evaluator/cacheWritePricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/cacheWritePricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.evaluator.properties.cacheWritePricePerMillion,data:data121};
if(vErrors === null){
vErrors = [err407];
}
else {
vErrors.push(err407);
}
errors++;
}
}
else {
const err408 = {instancePath:instancePath+"/models/evaluator/cacheWritePricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/cacheWritePricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.evaluator.properties.cacheWritePricePerMillion.type,parentSchema:schema27.properties.models.properties.evaluator.properties.cacheWritePricePerMillion,data:data121};
if(vErrors === null){
vErrors = [err408];
}
else {
vErrors.push(err408);
}
errors++;
}
if(errors > 0){
const emErrs132 = [];
for(const err409 of vErrors){
if(!err409.emUsed){
emErrs132.push(err409);
}
}
vErrors = emErrs132;
errors = emErrs132.length;
}
}
if(data107.outputPricePerMillion !== undefined){
let data122 = data107.outputPricePerMillion;
if(typeof data122 == "number"){
if(data122 < 0 || isNaN(data122)){
const err410 = {instancePath:instancePath+"/models/evaluator/outputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.evaluator.properties.outputPricePerMillion,data:data122};
if(vErrors === null){
vErrors = [err410];
}
else {
vErrors.push(err410);
}
errors++;
}
}
else {
const err411 = {instancePath:instancePath+"/models/evaluator/outputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.evaluator.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.evaluator.properties.outputPricePerMillion,data:data122};
if(vErrors === null){
vErrors = [err411];
}
else {
vErrors.push(err411);
}
errors++;
}
if(errors > 0){
const emErrs133 = [];
for(const err412 of vErrors){
if(!err412.emUsed){
emErrs133.push(err412);
}
}
vErrors = emErrs133;
errors = emErrs133.length;
}
}
}
else {
const err413 = {instancePath:instancePath+"/models/evaluator",schemaPath:"#/properties/models/properties/evaluator/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.evaluator.type,parentSchema:schema27.properties.models.properties.evaluator,data:data107};
if(vErrors === null){
vErrors = [err413];
}
else {
vErrors.push(err413);
}
errors++;
}
if(errors > 0){
const emErrs134 = [];
for(const err414 of vErrors){
if(!err414.emUsed){
emErrs134.push(err414);
}
}
vErrors = emErrs134;
errors = emErrs134.length;
}
}
if(data58.moderator !== undefined){
let data123 = data58.moderator;
if(data123 && typeof data123 == "object" && !Array.isArray(data123)){
if(data123.model !== undefined){
let data124 = data123.model;
if(data124 && typeof data124 == "object" && !Array.isArray(data124)){
if(data124.id === undefined){
const err415 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data124};
if(vErrors === null){
vErrors = [err415];
}
else {
vErrors.push(err415);
}
errors++;
}
if(data124.name === undefined){
const err416 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data124};
if(vErrors === null){
vErrors = [err416];
}
else {
vErrors.push(err416);
}
errors++;
}
if(data124.provider === undefined){
const err417 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data124};
if(vErrors === null){
vErrors = [err417];
}
else {
vErrors.push(err417);
}
errors++;
}
if(data124.id !== undefined){
let data125 = data124.id;
if(typeof data125 !== "string"){
const err418 = {instancePath:instancePath+"/models/moderator/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data125};
if(vErrors === null){
vErrors = [err418];
}
else {
vErrors.push(err418);
}
errors++;
}
if(errors > 0){
const emErrs135 = [];
for(const err419 of vErrors){
if(!err419.emUsed){
emErrs135.push(err419);
}
}
vErrors = emErrs135;
errors = emErrs135.length;
}
}
if(data124.name !== undefined){
let data126 = data124.name;
if(typeof data126 !== "string"){
const err420 = {instancePath:instancePath+"/models/moderator/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data126};
if(vErrors === null){
vErrors = [err420];
}
else {
vErrors.push(err420);
}
errors++;
}
if(errors > 0){
const emErrs136 = [];
for(const err421 of vErrors){
if(!err421.emUsed){
emErrs136.push(err421);
}
}
vErrors = emErrs136;
errors = emErrs136.length;
}
}
if(data124.provider !== undefined){
let data127 = data124.provider;
if(data127 && typeof data127 == "object" && !Array.isArray(data127)){
if(data127.type === undefined){
const err422 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data127};
if(vErrors === null){
vErrors = [err422];
}
else {
vErrors.push(err422);
}
errors++;
}
if(data127.name === undefined){
const err423 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data127};
if(vErrors === null){
vErrors = [err423];
}
else {
vErrors.push(err423);
}
errors++;
}
if(data127.id === undefined){
const err424 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data127};
if(vErrors === null){
vErrors = [err424];
}
else {
vErrors.push(err424);
}
errors++;
}
if(data127.type !== undefined){
let data128 = data127.type;
if(typeof data128 !== "string"){
const err425 = {instancePath:instancePath+"/models/moderator/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data128};
if(vErrors === null){
vErrors = [err425];
}
else {
vErrors.push(err425);
}
errors++;
}
if(errors > 0){
const emErrs137 = [];
for(const err426 of vErrors){
if(!err426.emUsed){
emErrs137.push(err426);
}
}
vErrors = emErrs137;
errors = emErrs137.length;
}
}
if(data127.name !== undefined){
let data129 = data127.name;
if(typeof data129 !== "string"){
const err427 = {instancePath:instancePath+"/models/moderator/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data129};
if(vErrors === null){
vErrors = [err427];
}
else {
vErrors.push(err427);
}
errors++;
}
if(errors > 0){
const emErrs138 = [];
for(const err428 of vErrors){
if(!err428.emUsed){
emErrs138.push(err428);
}
}
vErrors = emErrs138;
errors = emErrs138.length;
}
}
if(data127.id !== undefined){
let data130 = data127.id;
if(typeof data130 !== "string"){
const err429 = {instancePath:instancePath+"/models/moderator/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data130};
if(vErrors === null){
vErrors = [err429];
}
else {
vErrors.push(err429);
}
errors++;
}
if(errors > 0){
const emErrs139 = [];
for(const err430 of vErrors){
if(!err430.emUsed){
emErrs139.push(err430);
}
}
vErrors = emErrs139;
errors = emErrs139.length;
}
}
}
else {
const err431 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data127};
if(vErrors === null){
vErrors = [err431];
}
else {
vErrors.push(err431);
}
errors++;
}
if(errors > 0){
const emErrors23 = {"required":{"type":[],"name":[],"id":[]}};
const templates23 = {required:{}};
let emPropParams22;
let emParamsErrors22;
for(const err432 of vErrors){
if((((((err432.keyword !== "errorMessage") && (!err432.emUsed)) && (err432.instancePath === instancePath+"/models/moderator/model/provider")) && (err432.keyword in emErrors23)) && (err432.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err432.schemaPath.slice(39)))){
emPropParams22 = obj0[err432.keyword];
emParamsErrors22 = emErrors23[err432.keyword][err432.params[emPropParams22]];
if(emParamsErrors22){
emParamsErrors22.push(err432);
err432.emUsed = true;
}
}
}
for(const key26 in emErrors23){
for(const keyProp22 in emErrors23[key26]){
emParamsErrors22 = emErrors23[key26][keyProp22];
if(emParamsErrors22.length){
const tmpl22 = templates23[key26] && templates23[key26][keyProp22];
const err433 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors22},message:tmpl22 ? tmpl22() : schema28.properties.provider.errorMessage[key26][keyProp22],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data127};
if(vErrors === null){
vErrors = [err433];
}
else {
vErrors.push(err433);
}
errors++;
}
}
}
const emErrs140 = [];
for(const err434 of vErrors){
if(!err434.emUsed){
emErrs140.push(err434);
}
}
vErrors = emErrs140;
errors = emErrs140.length;
}
}
if(data124.contextWindow !== undefined){
let data131 = data124.contextWindow;
if(!(typeof data131 == "number")){
const err435 = {instancePath:instancePath+"/models/moderator/model/contextWindow",schemaPath:"#/definitions/Model/properties/contextWindow/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.contextWindow.type,parentSchema:schema28.properties.contextWindow,data:data131};
if(vErrors === null){
vErrors = [err435];
}
else {
vErrors.push(err435);
}
errors++;
}
if(errors > 0){
const emErrs141 = [];
for(const err436 of vErrors){
if(!err436.emUsed){
emErrs141.push(err436);
}
}
vErrors = emErrs141;
errors = emErrs141.length;
}
}
if(data124.cachedInputPricePerMillion !== undefined){
let data132 = data124.cachedInputPricePerMillion;
if(!(typeof data132 == "number")){
const err437 = {instancePath:instancePath+"/models/moderator/model/cachedInputPricePerMillion",schemaPath:"#/definitions/Model/properties/cachedInputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.cachedInputPricePerMillion.type,parentSchema:schema28.properties.cachedInputPricePerMillion,data:data132};
if(vErrors === null){
vErrors = [err437];
}
else {
vErrors.push(err437);
}
errors++;
}
if(errors > 0){
const emErrs142 = [];
for(const err438 of vErrors){
if(!err438.emUsed){
emErrs142.push(err438);
}
}
vErrors = emErrs142;
errors = emErrs142.length;
}
}
if(data124.cacheWritePricePerMillion !== undefined){
let data133 = data124.cacheWritePricePerMillion;
if(!(typeof data133 == "number")){
const err439 = {instancePath:instancePath+"/models/moderator/model/cacheWritePricePerMillion",schemaPath:"#/definitions/Model/properties/cacheWritePricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.cacheWritePricePerMillion.type,parentSchema:schema28.properties.cacheWritePricePerMillion,data:data133};
if(vErrors === null){
vErrors = [err439];
}
else {
vErrors.push(err439);
}
errors++;
}
if(errors > 0){
const emErrs143 = [];
for(const err440 of vErrors){
if(!err440.emUsed){
emErrs143.push(err440);
}
}
vErrors = emErrs143;
errors = emErrs143.length;
}
}
}
else {
const err441 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data124};
if(vErrors === null){
vErrors = [err441];
}
else {
vErrors.push(err441);
}
errors++;
}
if(errors > 0){
const emErrors24 = {"required":{"id":[],"name":[],"provider":[]}};
const templates24 = {required:{}};
let emPropParams23;
let emParamsErrors23;
for(const err442 of vErrors){
if((((((err442.keyword !== "errorMessage") && (!err442.emUsed)) && (err442.instancePath === instancePath+"/models/moderator/model")) && (err442.keyword in emErrors24)) && (err442.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err442.schemaPath.slice(19)))){
emPropParams23 = obj0[err442.keyword];
emParamsErrors23 = emErrors24[err442.keyword][err442.params[emPropParams23]];
if(emParamsErrors23){
emParamsErrors23.push(err442);
err442.emUsed = true;
}
}
}
for(const key27 in emErrors24){
for(const keyProp23 in emErrors24[key27]){
emParamsErrors23 = emErrors24[key27][keyProp23];
if(emParamsErrors23.length){
const tmpl23 = templates24[key27] && templates24[key27][keyProp23];
const err443 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors23},message:tmpl23 ? tmpl23() : schema28.errorMessage[key27][keyProp23],schema:schema28.errorMessage,parentSchema:schema28,data:data124};
if(vErrors === null){
vErrors = [err443];
}
else {
vErrors.push(err443);
}
errors++;
}
}
}
const emErrs144 = [];
for(const err444 of vErrors){
if(!err444.emUsed){
emErrs144.push(err444);
}
}
vErrors = emErrs144;
errors = emErrs144.length;
}
if(errors > 0){
const emErrors25 = {"required":{"id":[],"name":[],"provider":[]}};
const templates25 = {required:{}};
let emPropParams24;
let emParamsErrors24;
for(const err445 of vErrors){
if((((((err445.keyword !== "errorMessage") && (!err445.emUsed)) && (err445.instancePath === instancePath+"/models/moderator/model")) && (err445.keyword in emErrors25)) && (err445.schemaPath.indexOf("#/properties/models/properties/moderator/properties/model") === 0)) && (/^\/[^\/]*$/.test(err445.schemaPath.slice(57)))){
emPropParams24 = obj0[err445.keyword];
emParamsErrors24 = emErrors25[err445.keyword][err445.params[emPropParams24]];
if(emParamsErrors24){
emParamsErrors24.push(err445);
err445.emUsed = true;
}
}
}
for(const key28 in emErrors25){
for(const keyProp24 in emErrors25[key28]){
emParamsErrors24 = emErrors25[key28][keyProp24];
if(emParamsErrors24.length){
const tmpl24 = templates25[key28] && templates25[key28][keyProp24];
const err446 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/properties/models/properties/moderator/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors24},message:tmpl24 ? tmpl24() : schema27.properties.models.properties.moderator.properties.model.errorMessage[key28][keyProp24],schema:schema27.properties.models.properties.moderator.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.moderator.properties.model,data:data124};
if(vErrors === null){
vErrors = [err446];
}
else {
vErrors.push(err446);
}
errors++;
}
}
}
const emErrs145 = [];
for(const err447 of vErrors){
if(!err447.emUsed){
emErrs145.push(err447);
}
}
vErrors = emErrs145;
errors = emErrs145.length;
}
}
if(data123.contextWindow !== undefined){
let data134 = data123.contextWindow;
if(typeof data134 == "number"){
if(data134 < 0 || isNaN(data134)){
const err448 = {instancePath:instancePath+"/models/moderator/contextWindow",schemaPath:"#/properties/models/properties/moderator/properties/contextWindow/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.moderator.properties.contextWindow,data:data134};
if(vErrors === null){
vErrors = [err448];
}
else {
vErrors.push(err448);
}
errors++;
}
}
else {
const err449 = {instancePath:instancePath+"/models/moderator/contextWindow",schemaPath:"#/properties/models/properties/moderator/properties/contextWindow/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.moderator.properties.contextWindow.type,parentSchema:schema27.properties.models.properties.moderator.properties.contextWindow,data:data134};
if(vErrors === null){
vErrors = [err449];
}
else {
vErrors.push(err449);
}
errors++;
}
if(errors > 0){
const emErrs146 = [];
for(const err450 of vErrors){
if(!err450.emUsed){
emErrs146.push(err450);
}
}
vErrors = emErrs146;
errors = emErrs146.length;
}
}
if(data123.inputPricePerMillion !== undefined){
let data135 = data123.inputPricePerMillion;
if(typeof data135 == "number"){
if(data135 < 0 || isNaN(data135)){
const err451 = {instancePath:instancePath+"/models/moderator/inputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.moderator.properties.inputPricePerMillion,data:data135};
if(vErrors === null){
vErrors = [err451];
}
else {
vErrors.push(err451);
}
errors++;
}
}
else {
const err452 = {instancePath:instancePath+"/models/moderator/inputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.moderator.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.moderator.properties.inputPricePerMillion,data:data135};
if(vErrors === null){
vErrors = [err452];
}
else {
vErrors.push(err452);
}
errors++;
}
if(errors > 0){
const emErrs147 = [];
for(const err453 of vErrors){
if(!err453.emUsed){
emErrs147.push(err453);
}
}
vErrors = emErrs147;
errors = emErrs147.length;
}
}
if(data123.cachedInputPricePerMillion !== undefined){
let data136 = data123.cachedInputPricePerMillion;
if(typeof data136 == "number"){
if(data136 < 0 || isNaN(data136)){
const err454 = {instancePath:instancePath+"/models/moderator/cachedInputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/cachedInputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.moderator.properties.cachedInputPricePerMillion,data:data136};
if(vErrors === null){
vErrors = [err454];
}
else {
vErrors.push(err454);
}
errors++;
}
}
else {
const err455 = {instancePath:instancePath+"/models/moderator/cachedInputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/cachedInputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.moderator.properties.cachedInputPricePerMillion.type,parentSchema:schema27.properties.models.properties.moderator.properties.cachedInputPricePerMillion,data:data136};
if(vErrors === null){
vErrors = [err455];
}
else {
vErrors.push(err455);
}
errors++;
}
if(errors > 0){
const emErrs148 = [];
for(const err456 of vErrors){
if(!err456.emUsed){
emErrs148.push(err456);
}
}
vErrors = emErrs148;
errors = emErrs148.length;
}
}
if(data123.cacheWritePricePerMillion !== undefined){
let data137 = data123.cacheWritePricePerMillion;
if(typeof data137 == "number"){
if(data137 < 0 || isNaN(data137)){
const err457 = {instancePath:instancePath+"/models/moderator/cacheWritePricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/cacheWritePricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.moderator.properties.cacheWritePricePerMillion,data:data137};
if(vErrors === null){
vErrors = [err457];
}
else {
vErrors.push(err457);
}
errors++;
}
}
else {
const err458 = {instancePath:instancePath+"/models/moderator/cacheWritePricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/cacheWritePricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.moderator.properties.cacheWritePricePerMillion.type,parentSchema:schema27.properties.models.properties.moderator.properties.cacheWritePricePerMillion,data:data137};
if(vErrors === null){
vErrors = [err458];
}
else {
vErrors.push(err458);
}
errors++;
}
if(errors > 0){
const emErrs149 = [];
for(const err459 of vErrors){
if(!err459.emUsed){
emErrs149.push(err459);
}
}
vErrors = emErrs149;
errors = emErrs149.length;
}
}
if(data123.outputPricePerMillion !== undefined){
let data138 = data123.outputPricePerMillion;
if(typeof data138 == "number"){
if(data138 < 0 || isNaN(data138)){
const err460 = {instancePath:instancePath+"/models/moderator/outputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.moderator.properties.outputPricePerMillion,data:data138};
if(vErrors === null){
vErrors = [err460];
}
else {
vErrors.push(err460);
}
errors++;
}
}
else {
const err461 = {instancePath:instancePath+"/models/moderator/outputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.moderator.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.moderator.properties.outputPricePerMillion,data:data138};
if(vErrors === null){
vErrors = [err461];
}
else {
vErrors.push(err461);
}
errors++;
}
if(errors > 0){
const emErrs150 = [];
for(const err462 of vErrors){
if(!err462.emUsed){
emErrs150.push(err462);
}
}
vErrors = emErrs150;
errors = emErrs150.length;
}
}
}
else {
const err463 = {instancePath:instancePath+"/models/moderator",schemaPath:"#/properties/models/properties/moderator/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.moderator.type,parentSchema:schema27.properties.models.properties.moderator,data:data123};
if(vErrors === null){
vErrors = [err463];
}
else {
vErrors.push(err463);
}
errors++;
}
if(errors > 0){
const emErrs151 = [];
for(const err464 of vErrors){
if(!err464.emUsed){
emErrs151.push(err464);
}
}
vErrors = emErrs151;
errors = emErrs151.length;
}
}
}
else {
const err465 = {instancePath:instancePath+"/models",schemaPath:"#/properties/models/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.type,parentSchema:schema27.properties.models,data:data58};
if(vErrors === null){
vErrors = [err465];
}
else {
vErrors.push(err465);
}
errors++;
}
if(errors > 0){
const emErrs152 = [];
for(const err466 of vErrors){
if(!err466.emUsed){
emErrs152.push(err466);
}
}
vErrors = emErrs152;
errors = emErrs152.length;
}
}
if(data.moderation !== undefined){
let data139 = data.moderation;
if(data139 && typeof data139 == "object" && !Array.isArray(data139)){
if(data139.enabled === undefined){
const err467 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.moderation.required,parentSchema:schema27.properties.moderation,data:data139};
if(vErrors === null){
vErrors = [err467];
}
else {
vErrors.push(err467);
}
errors++;
}
if(data139.categories === undefined){
const err468 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/required",keyword:"required",params:{missingProperty: "categories"},message:"must have required property '"+"categories"+"'",schema:schema27.properties.moderation.required,parentSchema:schema27.properties.moderation,data:data139};
if(vErrors === null){
vErrors = [err468];
}
else {
vErrors.push(err468);
}
errors++;
}
for(const key29 in data139){
if(!((key29 === "enabled") || (key29 === "categories"))){
const err469 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key29},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.moderation,data:data139};
if(vErrors === null){
vErrors = [err469];
}
else {
vErrors.push(err469);
}
errors++;
}
}
if(data139.enabled !== undefined){
let data140 = data139.enabled;
if(typeof data140 !== "boolean"){
const err470 = {instancePath:instancePath+"/moderation/enabled",schemaPath:"#/properties/moderation/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.moderation.properties.enabled.type,parentSchema:schema27.properties.moderation.properties.enabled,data:data140};
if(vErrors === null){
vErrors = [err470];
}
else {
vErrors.push(err470);
}
errors++;
}
if(errors > 0){
const emErrs153 = [];
for(const err471 of vErrors){
if(!err471.emUsed){
emErrs153.push(err471);
}
}
vErrors = emErrs153;
errors = emErrs153.length;
}
}
if(data139.categories !== undefined){
let data141 = data139.categories;
if(Array.isArray(data141)){
const len1 = data141.length;
for(let i1=0; i1<len1; i1++){
let data142 = data141[i1];
if(typeof data142 !== "string"){
const err472 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.moderation.properties.categories.items.type,parentSchema:schema27.properties.moderation.properties.categories.items,data:data142};
if(vErrors === null){
vErrors = [err472];
}
else {
vErrors.push(err472);
}
errors++;
}
const _errs315 = errors;
let valid38 = false;
let passing1 = null;
const _errs316 = errors;
if("anonymous" !== data142){
const err473 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/0/const",keyword:"const",params:{allowedValue: "anonymous"},message:"must be equal to constant",schema:"anonymous",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[0],data:data142};
if(vErrors === null){
vErrors = [err473];
}
else {
vErrors.push(err473);
}
errors++;
}
var _valid1 = _errs316 === errors;
if(_valid1){
valid38 = true;
passing1 = 0;
}
const _errs317 = errors;
if("external" !== data142){
const err474 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/1/const",keyword:"const",params:{allowedValue: "external"},message:"must be equal to constant",schema:"external",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[1],data:data142};
if(vErrors === null){
vErrors = [err474];
}
else {
vErrors.push(err474);
}
errors++;
}
var _valid1 = _errs317 === errors;
if(_valid1 && valid38){
valid38 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid38 = true;
passing1 = 1;
}
const _errs318 = errors;
if("user" !== data142){
const err475 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/2/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[2],data:data142};
if(vErrors === null){
vErrors = [err475];
}
else {
vErrors.push(err475);
}
errors++;
}
var _valid1 = _errs318 === errors;
if(_valid1 && valid38){
valid38 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid38 = true;
passing1 = 2;
}
const _errs319 = errors;
if("contrib" !== data142){
const err476 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/3/const",keyword:"const",params:{allowedValue: "contrib"},message:"must be equal to constant",schema:"contrib",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[3],data:data142};
if(vErrors === null){
vErrors = [err476];
}
else {
vErrors.push(err476);
}
errors++;
}
var _valid1 = _errs319 === errors;
if(_valid1 && valid38){
valid38 = false;
passing1 = [passing1, 3];
}
else {
if(_valid1){
valid38 = true;
passing1 = 3;
}
const _errs320 = errors;
if("admin" !== data142){
const err477 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/4/const",keyword:"const",params:{allowedValue: "admin"},message:"must be equal to constant",schema:"admin",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[4],data:data142};
if(vErrors === null){
vErrors = [err477];
}
else {
vErrors.push(err477);
}
errors++;
}
var _valid1 = _errs320 === errors;
if(_valid1 && valid38){
valid38 = false;
passing1 = [passing1, 4];
}
else {
if(_valid1){
valid38 = true;
passing1 = 4;
}
}
}
}
}
if(!valid38){
const err478 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf",schema:schema27.properties.moderation.properties.categories.items.oneOf,parentSchema:schema27.properties.moderation.properties.categories.items,data:data142};
if(vErrors === null){
vErrors = [err478];
}
else {
vErrors.push(err478);
}
errors++;
}
else {
errors = _errs315;
if(vErrors !== null){
if(_errs315){
vErrors.length = _errs315;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors26 = {"oneOf":[]};
const templates26 = {};
for(const err479 of vErrors){
if((((((err479.keyword !== "errorMessage") && (!err479.emUsed)) && (err479.instancePath === instancePath+"/moderation/categories/" + i1)) && (err479.keyword in emErrors26)) && (err479.schemaPath.indexOf("#/properties/moderation/properties/categories/items") === 0)) && (/^\/[^\/]*$/.test(err479.schemaPath.slice(51)))){
emErrors26[err479.keyword].push(err479);
err479.emUsed = true;
}
}
for(const key30 in emErrors26){
if(emErrors26[key30].length){
const err480 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors26[key30]},message:key30 in templates26 ? templates26[key30]() : schema27.properties.moderation.properties.categories.items.errorMessage[key30],schema:schema27.properties.moderation.properties.categories.items.errorMessage,parentSchema:schema27.properties.moderation.properties.categories.items,data:data142};
if(vErrors === null){
vErrors = [err480];
}
else {
vErrors.push(err480);
}
errors++;
}
}
const emErrs154 = [];
for(const err481 of vErrors){
if(!err481.emUsed){
emErrs154.push(err481);
}
}
vErrors = emErrs154;
errors = emErrs154.length;
}
}
let i2 = data141.length;
let j0;
if(i2 > 1){
const indices0 = {};
for(;i2--;){
let item0 = data141[i2];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err482 = {instancePath:instancePath+"/moderation/categories",schemaPath:"#/properties/moderation/properties/categories/uniqueItems",keyword:"uniqueItems",params:{i: i2, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i2+" are identical)",schema:true,parentSchema:schema27.properties.moderation.properties.categories,data:data141};
if(vErrors === null){
vErrors = [err482];
}
else {
vErrors.push(err482);
}
errors++;
break;
}
indices0[item0] = i2;
}
}
}
else {
const err483 = {instancePath:instancePath+"/moderation/categories",schemaPath:"#/properties/moderation/properties/categories/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.moderation.properties.categories.type,parentSchema:schema27.properties.moderation.properties.categories,data:data141};
if(vErrors === null){
vErrors = [err483];
}
else {
vErrors.push(err483);
}
errors++;
}
if(errors > 0){
const emErrs155 = [];
for(const err484 of vErrors){
if(!err484.emUsed){
emErrs155.push(err484);
}
}
vErrors = emErrs155;
errors = emErrs155.length;
}
}
}
else {
const err485 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.moderation.type,parentSchema:schema27.properties.moderation,data:data139};
if(vErrors === null){
vErrors = [err485];
}
else {
vErrors.push(err485);
}
errors++;
}
if(errors > 0){
const emErrors27 = {"required":{"enabled":[],"categories":[]}};
const templates27 = {required:{}};
let emPropParams25;
let emParamsErrors25;
for(const err486 of vErrors){
if((((((err486.keyword !== "errorMessage") && (!err486.emUsed)) && (err486.instancePath === instancePath+"/moderation")) && (err486.keyword in emErrors27)) && (err486.schemaPath.indexOf("#/properties/moderation") === 0)) && (/^\/[^\/]*$/.test(err486.schemaPath.slice(23)))){
emPropParams25 = obj0[err486.keyword];
emParamsErrors25 = emErrors27[err486.keyword][err486.params[emPropParams25]];
if(emParamsErrors25){
emParamsErrors25.push(err486);
err486.emUsed = true;
}
}
}
for(const key31 in emErrors27){
for(const keyProp25 in emErrors27[key31]){
emParamsErrors25 = emErrors27[key31][keyProp25];
if(emParamsErrors25.length){
const tmpl25 = templates27[key31] && templates27[key31][keyProp25];
const err487 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors25},message:tmpl25 ? tmpl25() : schema27.properties.moderation.errorMessage[key31][keyProp25],schema:schema27.properties.moderation.errorMessage,parentSchema:schema27.properties.moderation,data:data139};
if(vErrors === null){
vErrors = [err487];
}
else {
vErrors.push(err487);
}
errors++;
}
}
}
const emErrs156 = [];
for(const err488 of vErrors){
if(!err488.emUsed){
emErrs156.push(err488);
}
}
vErrors = emErrs156;
errors = emErrs156.length;
}
}
if(data.compaction !== undefined){
let data143 = data.compaction;
if(data143 && typeof data143 == "object" && !Array.isArray(data143)){
if(data143.percent === undefined){
const err489 = {instancePath:instancePath+"/compaction",schemaPath:"#/properties/compaction/required",keyword:"required",params:{missingProperty: "percent"},message:"must have required property '"+"percent"+"'",schema:schema27.properties.compaction.required,parentSchema:schema27.properties.compaction,data:data143};
if(vErrors === null){
vErrors = [err489];
}
else {
vErrors.push(err489);
}
errors++;
}
for(const key32 in data143){
if(!(key32 === "percent")){
const err490 = {instancePath:instancePath+"/compaction",schemaPath:"#/properties/compaction/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key32},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.compaction,data:data143};
if(vErrors === null){
vErrors = [err490];
}
else {
vErrors.push(err490);
}
errors++;
}
}
if(data143.percent !== undefined){
let data144 = data143.percent;
if(typeof data144 == "number"){
if(data144 > 100 || isNaN(data144)){
const err491 = {instancePath:instancePath+"/compaction/percent",schemaPath:"#/properties/compaction/properties/percent/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100",schema:100,parentSchema:schema27.properties.compaction.properties.percent,data:data144};
if(vErrors === null){
vErrors = [err491];
}
else {
vErrors.push(err491);
}
errors++;
}
if(data144 < 10 || isNaN(data144)){
const err492 = {instancePath:instancePath+"/compaction/percent",schemaPath:"#/properties/compaction/properties/percent/minimum",keyword:"minimum",params:{comparison: ">=", limit: 10},message:"must be >= 10",schema:10,parentSchema:schema27.properties.compaction.properties.percent,data:data144};
if(vErrors === null){
vErrors = [err492];
}
else {
vErrors.push(err492);
}
errors++;
}
}
else {
const err493 = {instancePath:instancePath+"/compaction/percent",schemaPath:"#/properties/compaction/properties/percent/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.compaction.properties.percent.type,parentSchema:schema27.properties.compaction.properties.percent,data:data144};
if(vErrors === null){
vErrors = [err493];
}
else {
vErrors.push(err493);
}
errors++;
}
if(errors > 0){
const emErrs157 = [];
for(const err494 of vErrors){
if(!err494.emUsed){
emErrs157.push(err494);
}
}
vErrors = emErrs157;
errors = emErrs157.length;
}
}
}
else {
const err495 = {instancePath:instancePath+"/compaction",schemaPath:"#/properties/compaction/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.compaction.type,parentSchema:schema27.properties.compaction,data:data143};
if(vErrors === null){
vErrors = [err495];
}
else {
vErrors.push(err495);
}
errors++;
}
if(errors > 0){
const emErrors28 = {"required":{"percent":[]}};
const templates28 = {required:{}};
let emPropParams26;
let emParamsErrors26;
for(const err496 of vErrors){
if((((((err496.keyword !== "errorMessage") && (!err496.emUsed)) && (err496.instancePath === instancePath+"/compaction")) && (err496.keyword in emErrors28)) && (err496.schemaPath.indexOf("#/properties/compaction") === 0)) && (/^\/[^\/]*$/.test(err496.schemaPath.slice(23)))){
emPropParams26 = obj0[err496.keyword];
emParamsErrors26 = emErrors28[err496.keyword][err496.params[emPropParams26]];
if(emParamsErrors26){
emParamsErrors26.push(err496);
err496.emUsed = true;
}
}
}
for(const key33 in emErrors28){
for(const keyProp26 in emErrors28[key33]){
emParamsErrors26 = emErrors28[key33][keyProp26];
if(emParamsErrors26.length){
const tmpl26 = templates28[key33] && templates28[key33][keyProp26];
const err497 = {instancePath:instancePath+"/compaction",schemaPath:"#/properties/compaction/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors26},message:tmpl26 ? tmpl26() : schema27.properties.compaction.errorMessage[key33][keyProp26],schema:schema27.properties.compaction.errorMessage,parentSchema:schema27.properties.compaction,data:data143};
if(vErrors === null){
vErrors = [err497];
}
else {
vErrors.push(err497);
}
errors++;
}
}
}
const emErrs158 = [];
for(const err498 of vErrors){
if(!err498.emUsed){
emErrs158.push(err498);
}
}
vErrors = emErrs158;
errors = emErrs158.length;
}
}
if(data.quotas !== undefined){
let data145 = data.quotas;
if(data145 && typeof data145 == "object" && !Array.isArray(data145)){
if(data145.global === undefined){
const err499 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "global"},message:"must have required property '"+"global"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data145};
if(vErrors === null){
vErrors = [err499];
}
else {
vErrors.push(err499);
}
errors++;
}
if(data145.admin === undefined){
const err500 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "admin"},message:"must have required property '"+"admin"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data145};
if(vErrors === null){
vErrors = [err500];
}
else {
vErrors.push(err500);
}
errors++;
}
if(data145.contrib === undefined){
const err501 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "contrib"},message:"must have required property '"+"contrib"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data145};
if(vErrors === null){
vErrors = [err501];
}
else {
vErrors.push(err501);
}
errors++;
}
if(data145.user === undefined){
const err502 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "user"},message:"must have required property '"+"user"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data145};
if(vErrors === null){
vErrors = [err502];
}
else {
vErrors.push(err502);
}
errors++;
}
if(data145.external === undefined){
const err503 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "external"},message:"must have required property '"+"external"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data145};
if(vErrors === null){
vErrors = [err503];
}
else {
vErrors.push(err503);
}
errors++;
}
if(data145.anonymous === undefined){
const err504 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "anonymous"},message:"must have required property '"+"anonymous"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data145};
if(vErrors === null){
vErrors = [err504];
}
else {
vErrors.push(err504);
}
errors++;
}
if(data145.global !== undefined){
let data146 = data145.global;
if(data146 && typeof data146 == "object" && !Array.isArray(data146)){
if(data146.unlimited === undefined){
const err505 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data146};
if(vErrors === null){
vErrors = [err505];
}
else {
vErrors.push(err505);
}
errors++;
}
if(data146.monthlyLimit === undefined){
const err506 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data146};
if(vErrors === null){
vErrors = [err506];
}
else {
vErrors.push(err506);
}
errors++;
}
if(data146.unlimited !== undefined){
let data147 = data146.unlimited;
if(typeof data147 !== "boolean"){
const err507 = {instancePath:instancePath+"/quotas/global/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data147};
if(vErrors === null){
vErrors = [err507];
}
else {
vErrors.push(err507);
}
errors++;
}
if(errors > 0){
const emErrs159 = [];
for(const err508 of vErrors){
if(!err508.emUsed){
emErrs159.push(err508);
}
}
vErrors = emErrs159;
errors = emErrs159.length;
}
}
if(data146.monthlyLimit !== undefined){
let data148 = data146.monthlyLimit;
if(typeof data148 == "number"){
if(data148 < 0 || isNaN(data148)){
const err509 = {instancePath:instancePath+"/quotas/global/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data148};
if(vErrors === null){
vErrors = [err509];
}
else {
vErrors.push(err509);
}
errors++;
}
}
else {
const err510 = {instancePath:instancePath+"/quotas/global/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data148};
if(vErrors === null){
vErrors = [err510];
}
else {
vErrors.push(err510);
}
errors++;
}
if(errors > 0){
const emErrs160 = [];
for(const err511 of vErrors){
if(!err511.emUsed){
emErrs160.push(err511);
}
}
vErrors = emErrs160;
errors = emErrs160.length;
}
}
}
else {
const err512 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data146};
if(vErrors === null){
vErrors = [err512];
}
else {
vErrors.push(err512);
}
errors++;
}
if(errors > 0){
const emErrors29 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates29 = {required:{}};
let emPropParams27;
let emParamsErrors27;
for(const err513 of vErrors){
if((((((err513.keyword !== "errorMessage") && (!err513.emUsed)) && (err513.instancePath === instancePath+"/quotas/global")) && (err513.keyword in emErrors29)) && (err513.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err513.schemaPath.slice(23)))){
emPropParams27 = obj0[err513.keyword];
emParamsErrors27 = emErrors29[err513.keyword][err513.params[emPropParams27]];
if(emParamsErrors27){
emParamsErrors27.push(err513);
err513.emUsed = true;
}
}
}
for(const key34 in emErrors29){
for(const keyProp27 in emErrors29[key34]){
emParamsErrors27 = emErrors29[key34][keyProp27];
if(emParamsErrors27.length){
const tmpl27 = templates29[key34] && templates29[key34][keyProp27];
const err514 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors27},message:tmpl27 ? tmpl27() : schema33.errorMessage[key34][keyProp27],schema:schema33.errorMessage,parentSchema:schema33,data:data146};
if(vErrors === null){
vErrors = [err514];
}
else {
vErrors.push(err514);
}
errors++;
}
}
}
const emErrs161 = [];
for(const err515 of vErrors){
if(!err515.emUsed){
emErrs161.push(err515);
}
}
vErrors = emErrs161;
errors = emErrs161.length;
}
if(errors > 0){
const emErrors30 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates30 = {required:{}};
let emPropParams28;
let emParamsErrors28;
for(const err516 of vErrors){
if((((((err516.keyword !== "errorMessage") && (!err516.emUsed)) && (err516.instancePath === instancePath+"/quotas/global")) && (err516.keyword in emErrors30)) && (err516.schemaPath.indexOf("#/properties/quotas/properties/global") === 0)) && (/^\/[^\/]*$/.test(err516.schemaPath.slice(37)))){
emPropParams28 = obj0[err516.keyword];
emParamsErrors28 = emErrors30[err516.keyword][err516.params[emPropParams28]];
if(emParamsErrors28){
emParamsErrors28.push(err516);
err516.emUsed = true;
}
}
}
for(const key35 in emErrors30){
for(const keyProp28 in emErrors30[key35]){
emParamsErrors28 = emErrors30[key35][keyProp28];
if(emParamsErrors28.length){
const tmpl28 = templates30[key35] && templates30[key35][keyProp28];
const err517 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/properties/quotas/properties/global/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors28},message:tmpl28 ? tmpl28() : schema27.properties.quotas.properties.global.errorMessage[key35][keyProp28],schema:schema27.properties.quotas.properties.global.errorMessage,parentSchema:schema27.properties.quotas.properties.global,data:data146};
if(vErrors === null){
vErrors = [err517];
}
else {
vErrors.push(err517);
}
errors++;
}
}
}
const emErrs162 = [];
for(const err518 of vErrors){
if(!err518.emUsed){
emErrs162.push(err518);
}
}
vErrors = emErrs162;
errors = emErrs162.length;
}
}
if(data145.admin !== undefined){
let data149 = data145.admin;
if(data149 && typeof data149 == "object" && !Array.isArray(data149)){
if(data149.unlimited === undefined){
const err519 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data149};
if(vErrors === null){
vErrors = [err519];
}
else {
vErrors.push(err519);
}
errors++;
}
if(data149.monthlyLimit === undefined){
const err520 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data149};
if(vErrors === null){
vErrors = [err520];
}
else {
vErrors.push(err520);
}
errors++;
}
if(data149.unlimited !== undefined){
let data150 = data149.unlimited;
if(typeof data150 !== "boolean"){
const err521 = {instancePath:instancePath+"/quotas/admin/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data150};
if(vErrors === null){
vErrors = [err521];
}
else {
vErrors.push(err521);
}
errors++;
}
if(errors > 0){
const emErrs163 = [];
for(const err522 of vErrors){
if(!err522.emUsed){
emErrs163.push(err522);
}
}
vErrors = emErrs163;
errors = emErrs163.length;
}
}
if(data149.monthlyLimit !== undefined){
let data151 = data149.monthlyLimit;
if(typeof data151 == "number"){
if(data151 < 0 || isNaN(data151)){
const err523 = {instancePath:instancePath+"/quotas/admin/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data151};
if(vErrors === null){
vErrors = [err523];
}
else {
vErrors.push(err523);
}
errors++;
}
}
else {
const err524 = {instancePath:instancePath+"/quotas/admin/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data151};
if(vErrors === null){
vErrors = [err524];
}
else {
vErrors.push(err524);
}
errors++;
}
if(errors > 0){
const emErrs164 = [];
for(const err525 of vErrors){
if(!err525.emUsed){
emErrs164.push(err525);
}
}
vErrors = emErrs164;
errors = emErrs164.length;
}
}
}
else {
const err526 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data149};
if(vErrors === null){
vErrors = [err526];
}
else {
vErrors.push(err526);
}
errors++;
}
if(errors > 0){
const emErrors31 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates31 = {required:{}};
let emPropParams29;
let emParamsErrors29;
for(const err527 of vErrors){
if((((((err527.keyword !== "errorMessage") && (!err527.emUsed)) && (err527.instancePath === instancePath+"/quotas/admin")) && (err527.keyword in emErrors31)) && (err527.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err527.schemaPath.slice(23)))){
emPropParams29 = obj0[err527.keyword];
emParamsErrors29 = emErrors31[err527.keyword][err527.params[emPropParams29]];
if(emParamsErrors29){
emParamsErrors29.push(err527);
err527.emUsed = true;
}
}
}
for(const key36 in emErrors31){
for(const keyProp29 in emErrors31[key36]){
emParamsErrors29 = emErrors31[key36][keyProp29];
if(emParamsErrors29.length){
const tmpl29 = templates31[key36] && templates31[key36][keyProp29];
const err528 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors29},message:tmpl29 ? tmpl29() : schema33.errorMessage[key36][keyProp29],schema:schema33.errorMessage,parentSchema:schema33,data:data149};
if(vErrors === null){
vErrors = [err528];
}
else {
vErrors.push(err528);
}
errors++;
}
}
}
const emErrs165 = [];
for(const err529 of vErrors){
if(!err529.emUsed){
emErrs165.push(err529);
}
}
vErrors = emErrs165;
errors = emErrs165.length;
}
if(errors > 0){
const emErrors32 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates32 = {required:{}};
let emPropParams30;
let emParamsErrors30;
for(const err530 of vErrors){
if((((((err530.keyword !== "errorMessage") && (!err530.emUsed)) && (err530.instancePath === instancePath+"/quotas/admin")) && (err530.keyword in emErrors32)) && (err530.schemaPath.indexOf("#/properties/quotas/properties/admin") === 0)) && (/^\/[^\/]*$/.test(err530.schemaPath.slice(36)))){
emPropParams30 = obj0[err530.keyword];
emParamsErrors30 = emErrors32[err530.keyword][err530.params[emPropParams30]];
if(emParamsErrors30){
emParamsErrors30.push(err530);
err530.emUsed = true;
}
}
}
for(const key37 in emErrors32){
for(const keyProp30 in emErrors32[key37]){
emParamsErrors30 = emErrors32[key37][keyProp30];
if(emParamsErrors30.length){
const tmpl30 = templates32[key37] && templates32[key37][keyProp30];
const err531 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/properties/quotas/properties/admin/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors30},message:tmpl30 ? tmpl30() : schema27.properties.quotas.properties.admin.errorMessage[key37][keyProp30],schema:schema27.properties.quotas.properties.admin.errorMessage,parentSchema:schema27.properties.quotas.properties.admin,data:data149};
if(vErrors === null){
vErrors = [err531];
}
else {
vErrors.push(err531);
}
errors++;
}
}
}
const emErrs166 = [];
for(const err532 of vErrors){
if(!err532.emUsed){
emErrs166.push(err532);
}
}
vErrors = emErrs166;
errors = emErrs166.length;
}
}
if(data145.contrib !== undefined){
let data152 = data145.contrib;
if(data152 && typeof data152 == "object" && !Array.isArray(data152)){
if(data152.unlimited === undefined){
const err533 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data152};
if(vErrors === null){
vErrors = [err533];
}
else {
vErrors.push(err533);
}
errors++;
}
if(data152.monthlyLimit === undefined){
const err534 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data152};
if(vErrors === null){
vErrors = [err534];
}
else {
vErrors.push(err534);
}
errors++;
}
if(data152.unlimited !== undefined){
let data153 = data152.unlimited;
if(typeof data153 !== "boolean"){
const err535 = {instancePath:instancePath+"/quotas/contrib/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data153};
if(vErrors === null){
vErrors = [err535];
}
else {
vErrors.push(err535);
}
errors++;
}
if(errors > 0){
const emErrs167 = [];
for(const err536 of vErrors){
if(!err536.emUsed){
emErrs167.push(err536);
}
}
vErrors = emErrs167;
errors = emErrs167.length;
}
}
if(data152.monthlyLimit !== undefined){
let data154 = data152.monthlyLimit;
if(typeof data154 == "number"){
if(data154 < 0 || isNaN(data154)){
const err537 = {instancePath:instancePath+"/quotas/contrib/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data154};
if(vErrors === null){
vErrors = [err537];
}
else {
vErrors.push(err537);
}
errors++;
}
}
else {
const err538 = {instancePath:instancePath+"/quotas/contrib/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data154};
if(vErrors === null){
vErrors = [err538];
}
else {
vErrors.push(err538);
}
errors++;
}
if(errors > 0){
const emErrs168 = [];
for(const err539 of vErrors){
if(!err539.emUsed){
emErrs168.push(err539);
}
}
vErrors = emErrs168;
errors = emErrs168.length;
}
}
}
else {
const err540 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data152};
if(vErrors === null){
vErrors = [err540];
}
else {
vErrors.push(err540);
}
errors++;
}
if(errors > 0){
const emErrors33 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates33 = {required:{}};
let emPropParams31;
let emParamsErrors31;
for(const err541 of vErrors){
if((((((err541.keyword !== "errorMessage") && (!err541.emUsed)) && (err541.instancePath === instancePath+"/quotas/contrib")) && (err541.keyword in emErrors33)) && (err541.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err541.schemaPath.slice(23)))){
emPropParams31 = obj0[err541.keyword];
emParamsErrors31 = emErrors33[err541.keyword][err541.params[emPropParams31]];
if(emParamsErrors31){
emParamsErrors31.push(err541);
err541.emUsed = true;
}
}
}
for(const key38 in emErrors33){
for(const keyProp31 in emErrors33[key38]){
emParamsErrors31 = emErrors33[key38][keyProp31];
if(emParamsErrors31.length){
const tmpl31 = templates33[key38] && templates33[key38][keyProp31];
const err542 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors31},message:tmpl31 ? tmpl31() : schema33.errorMessage[key38][keyProp31],schema:schema33.errorMessage,parentSchema:schema33,data:data152};
if(vErrors === null){
vErrors = [err542];
}
else {
vErrors.push(err542);
}
errors++;
}
}
}
const emErrs169 = [];
for(const err543 of vErrors){
if(!err543.emUsed){
emErrs169.push(err543);
}
}
vErrors = emErrs169;
errors = emErrs169.length;
}
if(errors > 0){
const emErrors34 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates34 = {required:{}};
let emPropParams32;
let emParamsErrors32;
for(const err544 of vErrors){
if((((((err544.keyword !== "errorMessage") && (!err544.emUsed)) && (err544.instancePath === instancePath+"/quotas/contrib")) && (err544.keyword in emErrors34)) && (err544.schemaPath.indexOf("#/properties/quotas/properties/contrib") === 0)) && (/^\/[^\/]*$/.test(err544.schemaPath.slice(38)))){
emPropParams32 = obj0[err544.keyword];
emParamsErrors32 = emErrors34[err544.keyword][err544.params[emPropParams32]];
if(emParamsErrors32){
emParamsErrors32.push(err544);
err544.emUsed = true;
}
}
}
for(const key39 in emErrors34){
for(const keyProp32 in emErrors34[key39]){
emParamsErrors32 = emErrors34[key39][keyProp32];
if(emParamsErrors32.length){
const tmpl32 = templates34[key39] && templates34[key39][keyProp32];
const err545 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/properties/quotas/properties/contrib/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors32},message:tmpl32 ? tmpl32() : schema27.properties.quotas.properties.contrib.errorMessage[key39][keyProp32],schema:schema27.properties.quotas.properties.contrib.errorMessage,parentSchema:schema27.properties.quotas.properties.contrib,data:data152};
if(vErrors === null){
vErrors = [err545];
}
else {
vErrors.push(err545);
}
errors++;
}
}
}
const emErrs170 = [];
for(const err546 of vErrors){
if(!err546.emUsed){
emErrs170.push(err546);
}
}
vErrors = emErrs170;
errors = emErrs170.length;
}
}
if(data145.user !== undefined){
let data155 = data145.user;
if(data155 && typeof data155 == "object" && !Array.isArray(data155)){
if(data155.unlimited === undefined){
const err547 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data155};
if(vErrors === null){
vErrors = [err547];
}
else {
vErrors.push(err547);
}
errors++;
}
if(data155.monthlyLimit === undefined){
const err548 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data155};
if(vErrors === null){
vErrors = [err548];
}
else {
vErrors.push(err548);
}
errors++;
}
if(data155.unlimited !== undefined){
let data156 = data155.unlimited;
if(typeof data156 !== "boolean"){
const err549 = {instancePath:instancePath+"/quotas/user/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data156};
if(vErrors === null){
vErrors = [err549];
}
else {
vErrors.push(err549);
}
errors++;
}
if(errors > 0){
const emErrs171 = [];
for(const err550 of vErrors){
if(!err550.emUsed){
emErrs171.push(err550);
}
}
vErrors = emErrs171;
errors = emErrs171.length;
}
}
if(data155.monthlyLimit !== undefined){
let data157 = data155.monthlyLimit;
if(typeof data157 == "number"){
if(data157 < 0 || isNaN(data157)){
const err551 = {instancePath:instancePath+"/quotas/user/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data157};
if(vErrors === null){
vErrors = [err551];
}
else {
vErrors.push(err551);
}
errors++;
}
}
else {
const err552 = {instancePath:instancePath+"/quotas/user/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data157};
if(vErrors === null){
vErrors = [err552];
}
else {
vErrors.push(err552);
}
errors++;
}
if(errors > 0){
const emErrs172 = [];
for(const err553 of vErrors){
if(!err553.emUsed){
emErrs172.push(err553);
}
}
vErrors = emErrs172;
errors = emErrs172.length;
}
}
}
else {
const err554 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data155};
if(vErrors === null){
vErrors = [err554];
}
else {
vErrors.push(err554);
}
errors++;
}
if(errors > 0){
const emErrors35 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates35 = {required:{}};
let emPropParams33;
let emParamsErrors33;
for(const err555 of vErrors){
if((((((err555.keyword !== "errorMessage") && (!err555.emUsed)) && (err555.instancePath === instancePath+"/quotas/user")) && (err555.keyword in emErrors35)) && (err555.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err555.schemaPath.slice(23)))){
emPropParams33 = obj0[err555.keyword];
emParamsErrors33 = emErrors35[err555.keyword][err555.params[emPropParams33]];
if(emParamsErrors33){
emParamsErrors33.push(err555);
err555.emUsed = true;
}
}
}
for(const key40 in emErrors35){
for(const keyProp33 in emErrors35[key40]){
emParamsErrors33 = emErrors35[key40][keyProp33];
if(emParamsErrors33.length){
const tmpl33 = templates35[key40] && templates35[key40][keyProp33];
const err556 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors33},message:tmpl33 ? tmpl33() : schema33.errorMessage[key40][keyProp33],schema:schema33.errorMessage,parentSchema:schema33,data:data155};
if(vErrors === null){
vErrors = [err556];
}
else {
vErrors.push(err556);
}
errors++;
}
}
}
const emErrs173 = [];
for(const err557 of vErrors){
if(!err557.emUsed){
emErrs173.push(err557);
}
}
vErrors = emErrs173;
errors = emErrs173.length;
}
if(errors > 0){
const emErrors36 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates36 = {required:{}};
let emPropParams34;
let emParamsErrors34;
for(const err558 of vErrors){
if((((((err558.keyword !== "errorMessage") && (!err558.emUsed)) && (err558.instancePath === instancePath+"/quotas/user")) && (err558.keyword in emErrors36)) && (err558.schemaPath.indexOf("#/properties/quotas/properties/user") === 0)) && (/^\/[^\/]*$/.test(err558.schemaPath.slice(35)))){
emPropParams34 = obj0[err558.keyword];
emParamsErrors34 = emErrors36[err558.keyword][err558.params[emPropParams34]];
if(emParamsErrors34){
emParamsErrors34.push(err558);
err558.emUsed = true;
}
}
}
for(const key41 in emErrors36){
for(const keyProp34 in emErrors36[key41]){
emParamsErrors34 = emErrors36[key41][keyProp34];
if(emParamsErrors34.length){
const tmpl34 = templates36[key41] && templates36[key41][keyProp34];
const err559 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/properties/quotas/properties/user/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors34},message:tmpl34 ? tmpl34() : schema27.properties.quotas.properties.user.errorMessage[key41][keyProp34],schema:schema27.properties.quotas.properties.user.errorMessage,parentSchema:schema27.properties.quotas.properties.user,data:data155};
if(vErrors === null){
vErrors = [err559];
}
else {
vErrors.push(err559);
}
errors++;
}
}
}
const emErrs174 = [];
for(const err560 of vErrors){
if(!err560.emUsed){
emErrs174.push(err560);
}
}
vErrors = emErrs174;
errors = emErrs174.length;
}
}
if(data145.external !== undefined){
let data158 = data145.external;
if(data158 && typeof data158 == "object" && !Array.isArray(data158)){
if(data158.unlimited === undefined){
const err561 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data158};
if(vErrors === null){
vErrors = [err561];
}
else {
vErrors.push(err561);
}
errors++;
}
if(data158.monthlyLimit === undefined){
const err562 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data158};
if(vErrors === null){
vErrors = [err562];
}
else {
vErrors.push(err562);
}
errors++;
}
if(data158.unlimited !== undefined){
let data159 = data158.unlimited;
if(typeof data159 !== "boolean"){
const err563 = {instancePath:instancePath+"/quotas/external/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data159};
if(vErrors === null){
vErrors = [err563];
}
else {
vErrors.push(err563);
}
errors++;
}
if(errors > 0){
const emErrs175 = [];
for(const err564 of vErrors){
if(!err564.emUsed){
emErrs175.push(err564);
}
}
vErrors = emErrs175;
errors = emErrs175.length;
}
}
if(data158.monthlyLimit !== undefined){
let data160 = data158.monthlyLimit;
if(typeof data160 == "number"){
if(data160 < 0 || isNaN(data160)){
const err565 = {instancePath:instancePath+"/quotas/external/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data160};
if(vErrors === null){
vErrors = [err565];
}
else {
vErrors.push(err565);
}
errors++;
}
}
else {
const err566 = {instancePath:instancePath+"/quotas/external/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data160};
if(vErrors === null){
vErrors = [err566];
}
else {
vErrors.push(err566);
}
errors++;
}
if(errors > 0){
const emErrs176 = [];
for(const err567 of vErrors){
if(!err567.emUsed){
emErrs176.push(err567);
}
}
vErrors = emErrs176;
errors = emErrs176.length;
}
}
}
else {
const err568 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data158};
if(vErrors === null){
vErrors = [err568];
}
else {
vErrors.push(err568);
}
errors++;
}
if(errors > 0){
const emErrors37 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates37 = {required:{}};
let emPropParams35;
let emParamsErrors35;
for(const err569 of vErrors){
if((((((err569.keyword !== "errorMessage") && (!err569.emUsed)) && (err569.instancePath === instancePath+"/quotas/external")) && (err569.keyword in emErrors37)) && (err569.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err569.schemaPath.slice(23)))){
emPropParams35 = obj0[err569.keyword];
emParamsErrors35 = emErrors37[err569.keyword][err569.params[emPropParams35]];
if(emParamsErrors35){
emParamsErrors35.push(err569);
err569.emUsed = true;
}
}
}
for(const key42 in emErrors37){
for(const keyProp35 in emErrors37[key42]){
emParamsErrors35 = emErrors37[key42][keyProp35];
if(emParamsErrors35.length){
const tmpl35 = templates37[key42] && templates37[key42][keyProp35];
const err570 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors35},message:tmpl35 ? tmpl35() : schema33.errorMessage[key42][keyProp35],schema:schema33.errorMessage,parentSchema:schema33,data:data158};
if(vErrors === null){
vErrors = [err570];
}
else {
vErrors.push(err570);
}
errors++;
}
}
}
const emErrs177 = [];
for(const err571 of vErrors){
if(!err571.emUsed){
emErrs177.push(err571);
}
}
vErrors = emErrs177;
errors = emErrs177.length;
}
if(errors > 0){
const emErrors38 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates38 = {required:{}};
let emPropParams36;
let emParamsErrors36;
for(const err572 of vErrors){
if((((((err572.keyword !== "errorMessage") && (!err572.emUsed)) && (err572.instancePath === instancePath+"/quotas/external")) && (err572.keyword in emErrors38)) && (err572.schemaPath.indexOf("#/properties/quotas/properties/external") === 0)) && (/^\/[^\/]*$/.test(err572.schemaPath.slice(39)))){
emPropParams36 = obj0[err572.keyword];
emParamsErrors36 = emErrors38[err572.keyword][err572.params[emPropParams36]];
if(emParamsErrors36){
emParamsErrors36.push(err572);
err572.emUsed = true;
}
}
}
for(const key43 in emErrors38){
for(const keyProp36 in emErrors38[key43]){
emParamsErrors36 = emErrors38[key43][keyProp36];
if(emParamsErrors36.length){
const tmpl36 = templates38[key43] && templates38[key43][keyProp36];
const err573 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/properties/quotas/properties/external/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors36},message:tmpl36 ? tmpl36() : schema27.properties.quotas.properties.external.errorMessage[key43][keyProp36],schema:schema27.properties.quotas.properties.external.errorMessage,parentSchema:schema27.properties.quotas.properties.external,data:data158};
if(vErrors === null){
vErrors = [err573];
}
else {
vErrors.push(err573);
}
errors++;
}
}
}
const emErrs178 = [];
for(const err574 of vErrors){
if(!err574.emUsed){
emErrs178.push(err574);
}
}
vErrors = emErrs178;
errors = emErrs178.length;
}
}
if(data145.anonymous !== undefined){
let data161 = data145.anonymous;
if(data161 && typeof data161 == "object" && !Array.isArray(data161)){
if(data161.unlimited === undefined){
const err575 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data161};
if(vErrors === null){
vErrors = [err575];
}
else {
vErrors.push(err575);
}
errors++;
}
if(data161.monthlyLimit === undefined){
const err576 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data161};
if(vErrors === null){
vErrors = [err576];
}
else {
vErrors.push(err576);
}
errors++;
}
if(data161.unlimited !== undefined){
let data162 = data161.unlimited;
if(typeof data162 !== "boolean"){
const err577 = {instancePath:instancePath+"/quotas/anonymous/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data162};
if(vErrors === null){
vErrors = [err577];
}
else {
vErrors.push(err577);
}
errors++;
}
if(errors > 0){
const emErrs179 = [];
for(const err578 of vErrors){
if(!err578.emUsed){
emErrs179.push(err578);
}
}
vErrors = emErrs179;
errors = emErrs179.length;
}
}
if(data161.monthlyLimit !== undefined){
let data163 = data161.monthlyLimit;
if(typeof data163 == "number"){
if(data163 < 0 || isNaN(data163)){
const err579 = {instancePath:instancePath+"/quotas/anonymous/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data163};
if(vErrors === null){
vErrors = [err579];
}
else {
vErrors.push(err579);
}
errors++;
}
}
else {
const err580 = {instancePath:instancePath+"/quotas/anonymous/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data163};
if(vErrors === null){
vErrors = [err580];
}
else {
vErrors.push(err580);
}
errors++;
}
if(errors > 0){
const emErrs180 = [];
for(const err581 of vErrors){
if(!err581.emUsed){
emErrs180.push(err581);
}
}
vErrors = emErrs180;
errors = emErrs180.length;
}
}
}
else {
const err582 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data161};
if(vErrors === null){
vErrors = [err582];
}
else {
vErrors.push(err582);
}
errors++;
}
if(errors > 0){
const emErrors39 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates39 = {required:{}};
let emPropParams37;
let emParamsErrors37;
for(const err583 of vErrors){
if((((((err583.keyword !== "errorMessage") && (!err583.emUsed)) && (err583.instancePath === instancePath+"/quotas/anonymous")) && (err583.keyword in emErrors39)) && (err583.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err583.schemaPath.slice(23)))){
emPropParams37 = obj0[err583.keyword];
emParamsErrors37 = emErrors39[err583.keyword][err583.params[emPropParams37]];
if(emParamsErrors37){
emParamsErrors37.push(err583);
err583.emUsed = true;
}
}
}
for(const key44 in emErrors39){
for(const keyProp37 in emErrors39[key44]){
emParamsErrors37 = emErrors39[key44][keyProp37];
if(emParamsErrors37.length){
const tmpl37 = templates39[key44] && templates39[key44][keyProp37];
const err584 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors37},message:tmpl37 ? tmpl37() : schema33.errorMessage[key44][keyProp37],schema:schema33.errorMessage,parentSchema:schema33,data:data161};
if(vErrors === null){
vErrors = [err584];
}
else {
vErrors.push(err584);
}
errors++;
}
}
}
const emErrs181 = [];
for(const err585 of vErrors){
if(!err585.emUsed){
emErrs181.push(err585);
}
}
vErrors = emErrs181;
errors = emErrs181.length;
}
if(errors > 0){
const emErrors40 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates40 = {required:{}};
let emPropParams38;
let emParamsErrors38;
for(const err586 of vErrors){
if((((((err586.keyword !== "errorMessage") && (!err586.emUsed)) && (err586.instancePath === instancePath+"/quotas/anonymous")) && (err586.keyword in emErrors40)) && (err586.schemaPath.indexOf("#/properties/quotas/properties/anonymous") === 0)) && (/^\/[^\/]*$/.test(err586.schemaPath.slice(40)))){
emPropParams38 = obj0[err586.keyword];
emParamsErrors38 = emErrors40[err586.keyword][err586.params[emPropParams38]];
if(emParamsErrors38){
emParamsErrors38.push(err586);
err586.emUsed = true;
}
}
}
for(const key45 in emErrors40){
for(const keyProp38 in emErrors40[key45]){
emParamsErrors38 = emErrors40[key45][keyProp38];
if(emParamsErrors38.length){
const tmpl38 = templates40[key45] && templates40[key45][keyProp38];
const err587 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/properties/quotas/properties/anonymous/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors38},message:tmpl38 ? tmpl38() : schema27.properties.quotas.properties.anonymous.errorMessage[key45][keyProp38],schema:schema27.properties.quotas.properties.anonymous.errorMessage,parentSchema:schema27.properties.quotas.properties.anonymous,data:data161};
if(vErrors === null){
vErrors = [err587];
}
else {
vErrors.push(err587);
}
errors++;
}
}
}
const emErrs182 = [];
for(const err588 of vErrors){
if(!err588.emUsed){
emErrs182.push(err588);
}
}
vErrors = emErrs182;
errors = emErrs182.length;
}
}
if(data145.untrusted !== undefined){
let data164 = data145.untrusted;
if(data164 && typeof data164 == "object" && !Array.isArray(data164)){
if(data164.unlimited === undefined){
const err589 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data164};
if(vErrors === null){
vErrors = [err589];
}
else {
vErrors.push(err589);
}
errors++;
}
if(data164.monthlyLimit === undefined){
const err590 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data164};
if(vErrors === null){
vErrors = [err590];
}
else {
vErrors.push(err590);
}
errors++;
}
if(data164.unlimited !== undefined){
let data165 = data164.unlimited;
if(typeof data165 !== "boolean"){
const err591 = {instancePath:instancePath+"/quotas/untrusted/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data165};
if(vErrors === null){
vErrors = [err591];
}
else {
vErrors.push(err591);
}
errors++;
}
if(errors > 0){
const emErrs183 = [];
for(const err592 of vErrors){
if(!err592.emUsed){
emErrs183.push(err592);
}
}
vErrors = emErrs183;
errors = emErrs183.length;
}
}
if(data164.monthlyLimit !== undefined){
let data166 = data164.monthlyLimit;
if(typeof data166 == "number"){
if(data166 < 0 || isNaN(data166)){
const err593 = {instancePath:instancePath+"/quotas/untrusted/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data166};
if(vErrors === null){
vErrors = [err593];
}
else {
vErrors.push(err593);
}
errors++;
}
}
else {
const err594 = {instancePath:instancePath+"/quotas/untrusted/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data166};
if(vErrors === null){
vErrors = [err594];
}
else {
vErrors.push(err594);
}
errors++;
}
if(errors > 0){
const emErrs184 = [];
for(const err595 of vErrors){
if(!err595.emUsed){
emErrs184.push(err595);
}
}
vErrors = emErrs184;
errors = emErrs184.length;
}
}
}
else {
const err596 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data164};
if(vErrors === null){
vErrors = [err596];
}
else {
vErrors.push(err596);
}
errors++;
}
if(errors > 0){
const emErrors41 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates41 = {required:{}};
let emPropParams39;
let emParamsErrors39;
for(const err597 of vErrors){
if((((((err597.keyword !== "errorMessage") && (!err597.emUsed)) && (err597.instancePath === instancePath+"/quotas/untrusted")) && (err597.keyword in emErrors41)) && (err597.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err597.schemaPath.slice(23)))){
emPropParams39 = obj0[err597.keyword];
emParamsErrors39 = emErrors41[err597.keyword][err597.params[emPropParams39]];
if(emParamsErrors39){
emParamsErrors39.push(err597);
err597.emUsed = true;
}
}
}
for(const key46 in emErrors41){
for(const keyProp39 in emErrors41[key46]){
emParamsErrors39 = emErrors41[key46][keyProp39];
if(emParamsErrors39.length){
const tmpl39 = templates41[key46] && templates41[key46][keyProp39];
const err598 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors39},message:tmpl39 ? tmpl39() : schema33.errorMessage[key46][keyProp39],schema:schema33.errorMessage,parentSchema:schema33,data:data164};
if(vErrors === null){
vErrors = [err598];
}
else {
vErrors.push(err598);
}
errors++;
}
}
}
const emErrs185 = [];
for(const err599 of vErrors){
if(!err599.emUsed){
emErrs185.push(err599);
}
}
vErrors = emErrs185;
errors = emErrs185.length;
}
if(errors > 0){
const emErrors42 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates42 = {required:{}};
let emPropParams40;
let emParamsErrors40;
for(const err600 of vErrors){
if((((((err600.keyword !== "errorMessage") && (!err600.emUsed)) && (err600.instancePath === instancePath+"/quotas/untrusted")) && (err600.keyword in emErrors42)) && (err600.schemaPath.indexOf("#/properties/quotas/properties/untrusted") === 0)) && (/^\/[^\/]*$/.test(err600.schemaPath.slice(40)))){
emPropParams40 = obj0[err600.keyword];
emParamsErrors40 = emErrors42[err600.keyword][err600.params[emPropParams40]];
if(emParamsErrors40){
emParamsErrors40.push(err600);
err600.emUsed = true;
}
}
}
for(const key47 in emErrors42){
for(const keyProp40 in emErrors42[key47]){
emParamsErrors40 = emErrors42[key47][keyProp40];
if(emParamsErrors40.length){
const tmpl40 = templates42[key47] && templates42[key47][keyProp40];
const err601 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/properties/quotas/properties/untrusted/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors40},message:tmpl40 ? tmpl40() : schema27.properties.quotas.properties.untrusted.errorMessage[key47][keyProp40],schema:schema27.properties.quotas.properties.untrusted.errorMessage,parentSchema:schema27.properties.quotas.properties.untrusted,data:data164};
if(vErrors === null){
vErrors = [err601];
}
else {
vErrors.push(err601);
}
errors++;
}
}
}
const emErrs186 = [];
for(const err602 of vErrors){
if(!err602.emUsed){
emErrs186.push(err602);
}
}
vErrors = emErrs186;
errors = emErrs186.length;
}
}
}
else {
const err603 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.quotas.type,parentSchema:schema27.properties.quotas,data:data145};
if(vErrors === null){
vErrors = [err603];
}
else {
vErrors.push(err603);
}
errors++;
}
if(errors > 0){
const emErrors43 = {"required":{"global":[],"admin":[],"contrib":[],"user":[],"external":[],"anonymous":[]}};
const templates43 = {required:{}};
let emPropParams41;
let emParamsErrors41;
for(const err604 of vErrors){
if((((((err604.keyword !== "errorMessage") && (!err604.emUsed)) && (err604.instancePath === instancePath+"/quotas")) && (err604.keyword in emErrors43)) && (err604.schemaPath.indexOf("#/properties/quotas") === 0)) && (/^\/[^\/]*$/.test(err604.schemaPath.slice(19)))){
emPropParams41 = obj0[err604.keyword];
emParamsErrors41 = emErrors43[err604.keyword][err604.params[emPropParams41]];
if(emParamsErrors41){
emParamsErrors41.push(err604);
err604.emUsed = true;
}
}
}
for(const key48 in emErrors43){
for(const keyProp41 in emErrors43[key48]){
emParamsErrors41 = emErrors43[key48][keyProp41];
if(emParamsErrors41.length){
const tmpl41 = templates43[key48] && templates43[key48][keyProp41];
const err605 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors41},message:tmpl41 ? tmpl41() : schema27.properties.quotas.errorMessage[key48][keyProp41],schema:schema27.properties.quotas.errorMessage,parentSchema:schema27.properties.quotas,data:data145};
if(vErrors === null){
vErrors = [err605];
}
else {
vErrors.push(err605);
}
errors++;
}
}
}
const emErrs187 = [];
for(const err606 of vErrors){
if(!err606.emUsed){
emErrs187.push(err606);
}
}
vErrors = emErrs187;
errors = emErrs187.length;
}
}
}
else {
const err607 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err607];
}
else {
vErrors.push(err607);
}
errors++;
}
if(errors > 0){
const emErrors44 = {"required":{"providers":[]}};
const templates44 = {required:{}};
let emPropParams42;
let emParamsErrors42;
for(const err608 of vErrors){
if((((((err608.keyword !== "errorMessage") && (!err608.emUsed)) && (err608.instancePath === instancePath)) && (err608.keyword in emErrors44)) && (err608.schemaPath.indexOf("#") === 0)) && (/^\/[^\/]*$/.test(err608.schemaPath.slice(1)))){
emPropParams42 = obj0[err608.keyword];
emParamsErrors42 = emErrors44[err608.keyword][err608.params[emPropParams42]];
if(emParamsErrors42){
emParamsErrors42.push(err608);
err608.emUsed = true;
}
}
}
for(const key49 in emErrors44){
for(const keyProp42 in emErrors44[key49]){
emParamsErrors42 = emErrors44[key49][keyProp42];
if(emParamsErrors42.length){
const tmpl42 = templates44[key49] && templates44[key49][keyProp42];
const err609 = {instancePath,schemaPath:"#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors42},message:tmpl42 ? tmpl42() : schema27.errorMessage[key49][keyProp42],schema:schema27.errorMessage,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err609];
}
else {
vErrors.push(err609);
}
errors++;
}
}
}
const emErrs188 = [];
for(const err610 of vErrors){
if(!err610.emUsed){
emErrs188.push(err610);
}
}
vErrors = emErrs188;
errors = emErrs188.length;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(!(validate23(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
validate34.errors = vErrors;
return errors === 0;
}
validate34.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
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
return (item ? `${item.name || ""} - ${item.id.slice(0, 8)}` : "")
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
}function expression8(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Anthropic")
}function expression9(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Google")
}function expression10(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Mistral")
}function expression11(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("OpenRouter")
}function expression12(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Ollama")
}function expression13(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Scaleway")
}function expression14(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("OpenAI Compatible")
}function expression15(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ([{"key":"default","title":"default","value":"default"},{"key":"compatible","title":"compatible","value":"compatible"}])
}function expression16(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Mock")
}function expression17(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return (parent.data.providers?.length)
}function expression18(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return `${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(",")}`
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
return ([{"const":"anonymous","title":"Anonyme","key":"anonymous","value":"anonymous"},{"const":"external","title":"Externe","key":"external","value":"external"},{"const":"user","title":"Utilisateur","key":"user","value":"user"},{"const":"contrib","title":"Contributeur","key":"contrib","value":"contrib"},{"const":"admin","title":"Administrateur","key":"admin","value":"admin"}])
}function expression23(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (context.accountType === "organization")
}function expression24(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return (!parent.data.unlimited)
}
const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/settings-put#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/settings-put#": {
      title: "Paramètres",
      root: "https://github.com/data-fair/agents/settings-put#",
      refPointer: "https://github.com/data-fair/agents/settings-put#",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items": {
      title: "Fournisseur",
      root: "https://github.com/data-fair/agents/settings-put#/properties/providers/items",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0": {
      title: "Open AI",
      root: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0",
      discriminatorValue: "openai"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1": {
      title: "Anthropic",
      root: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1",
      discriminatorValue: "anthropic"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2": {
      title: "Google",
      root: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2",
      discriminatorValue: "google"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3": {
      title: "Mistral",
      root: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3",
      discriminatorValue: "mistral"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4": {
      title: "OpenRouter",
      root: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4",
      discriminatorValue: "openrouter"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5": {
      title: "Ollama",
      root: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5",
      discriminatorValue: "ollama"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6": {
      title: "Scaleway",
      root: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6",
      discriminatorValue: "scaleway"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7": {
      title: "Compatible OpenAI",
      root: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7",
      discriminatorValue: "openai-compatible"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8": {
      title: "Mock",
      root: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8",
      discriminatorValue: "mock"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items": {
      title: "",
      root: "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/settings-put#": {
      title: "Paramètres",
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#",
      refPointer: "https://github.com/data-fair/agents/settings-put#",
      pure: false,

      propertyKeys: [
        "createdAt",
        "updatedAt",
        "storeTraces",
        "owner",
        "providers",
        "models",
        "moderation",
        "compaction",
        "quotas"
      ],

      roPropertyKeys: [
        "createdAt",
        "updatedAt",
        "owner"
      ],

      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/createdAt",
        "https://github.com/data-fair/agents/settings-put#/properties/updatedAt",
        "https://github.com/data-fair/agents/settings-put#/properties/storeTraces",
        "https://github.com/data-fair/agents/settings-put#/properties/owner",
        "https://github.com/data-fair/agents/settings-put#/properties/providers",
        "https://github.com/data-fair/agents/settings-put#/properties/models",
        "https://github.com/data-fair/agents/settings-put#/properties/moderation",
        "https://github.com/data-fair/agents/settings-put#/properties/compaction",
        "https://github.com/data-fair/agents/settings-put#/properties/quotas"
      ]
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

    "https://github.com/data-fair/agents/settings-put#/properties/storeTraces": {
      title: "Enregistrer les traces de conversation",
      key: "storeTraces",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/storeTraces",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/storeTraces",
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

      propertyKeys: [
        "type",
        "id",
        "name",
        "department"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/type",
        "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/id",
        "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/name",
        "https://github.com/data-fair/agents/settings-put#/properties/owner/properties/department"
      ]
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
      title: "Fournisseurs IA",
      key: "providers",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      childrenTrees: [
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items": {
      title: "Fournisseur",
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items",
      pure: true,

      propertyKeys: [
        "type",
        "id",
        "name",
        "enabled",
        "apiKey",
        "baseURL",
        "projectId",
        "compatibility"
      ],

      roPropertyKeys: ["id"],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0",
      pure: true,

      propertyKeys: [
        "type",
        "id",
        "name",
        "enabled",
        "apiKey"
      ],

      roPropertyKeys: ["id"],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey"
      ]
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
      title: "ID du fournisseur",
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
      title: "Nom d'affichage",
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
      title: "Activé",
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
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1",
      pure: true,

      propertyKeys: [
        "type",
        "id",
        "name",
        "enabled",
        "apiKey"
      ],

      roPropertyKeys: ["id"],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2",
      pure: true,

      propertyKeys: [
        "type",
        "id",
        "name",
        "enabled",
        "apiKey"
      ],

      roPropertyKeys: ["id"],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3",
      pure: true,

      propertyKeys: [
        "type",
        "id",
        "name",
        "enabled",
        "apiKey"
      ],

      roPropertyKeys: ["id"],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4",
      pure: true,

      propertyKeys: [
        "type",
        "id",
        "name",
        "enabled",
        "apiKey"
      ],

      roPropertyKeys: ["id"],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5",
      pure: true,

      propertyKeys: [
        "type",
        "id",
        "name",
        "enabled",
        "apiKey",
        "baseURL"
      ],

      roPropertyKeys: ["id"],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL": {
      title: "URL de base",
      key: "baseURL",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6",
      pure: true,

      propertyKeys: [
        "type",
        "id",
        "name",
        "enabled",
        "apiKey",
        "projectId"
      ],

      roPropertyKeys: ["id"],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/projectId"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/projectId": {
      title: "ID du projet",
      key: "projectId",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/projectId",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/projectId",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7",
      pure: true,

      propertyKeys: [
        "type",
        "id",
        "name",
        "enabled",
        "baseURL",
        "apiKey",
        "compatibility"
      ],

      roPropertyKeys: ["id"],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/compatibility"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL": {
      title: "URL de base",
      key: "baseURL",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey": {
      title: "Clé API",
      key: "apiKey",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/compatibility": {
      title: "Mode de compatibilité",
      key: "compatibility",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/compatibility",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/compatibility",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id": {
      title: "ID du fournisseur",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name": {
      title: "Nom d'affichage",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled": {
      title: "Activé",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf": {
      key: "$oneOf",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf",

      childrenTrees: [
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7",
        "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8"
      ],

      discriminator: "type",
      pure: true,

      propertyKeys: [
        "type",
        "id",
        "name",
        "enabled",
        "apiKey",
        "baseURL",
        "projectId",
        "compatibility"
      ],

      roPropertyKeys: ["id"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models": {
      title: "Modèles",
      key: "models",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models",
      pure: false,

      propertyKeys: [
        "assistant",
        "tools",
        "summarizer",
        "evaluator",
        "moderator"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant": {
      title: "Assistant",
      key: "assistant",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant",
      pure: false,

      propertyKeys: [
        "model",
        "contextWindow",
        "inputPricePerMillion",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion",
        "outputPricePerMillion"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/contextWindow",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/inputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/cachedInputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/cacheWritePricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/outputPricePerMillion"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model": {
      title: "Modèle",
      key: "model",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model",
      pure: false,

      propertyKeys: [
        "id",
        "name",
        "provider",
        "contextWindow",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion"
      ],

      roPropertyKeys: [
        "contextWindow",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion"
      ],

      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/contextWindow",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cachedInputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cacheWritePricePerMillion"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id": {
      title: "Model ID",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name": {
      title: "Name",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider": {
      title: undefined,
      key: "provider",
      pointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider",
      pure: true,
      propertyKeys: ["type", "name", "id"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type": {
      title: "Provider Type",
      key: "type",
      pointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name": {
      title: "Provider Name",
      key: "name",
      pointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id": {
      title: "Provider ID",
      key: "id",
      pointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/contextWindow": {
      title: "Context window",
      key: "contextWindow",
      pointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/contextWindow",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/contextWindow",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cachedInputPricePerMillion": {
      title: "Cached input price (per 1M tokens)",
      key: "cachedInputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cachedInputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cachedInputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cacheWritePricePerMillion": {
      title: "Cache write price (per 1M tokens)",
      key: "cacheWritePricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cacheWritePricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cacheWritePricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/contextWindow": {
      title: "Taille de contexte (tokens, surcharge)",
      key: "contextWindow",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/contextWindow",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/contextWindow",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/inputPricePerMillion": {
      title: "Prix d'entrée (par million de tokens)",
      key: "inputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/inputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/inputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/cachedInputPricePerMillion": {
      title: "Prix d'entrée en cache (par million de tokens)",
      key: "cachedInputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/cachedInputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/cachedInputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/cacheWritePricePerMillion": {
      title: "Prix d'écriture en cache (par million de tokens)",
      key: "cacheWritePricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/cacheWritePricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/cacheWritePricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/outputPricePerMillion": {
      title: "Prix de sortie (par million de tokens)",
      key: "outputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/outputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/outputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools": {
      title: "Outils",
      key: "tools",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools",
      pure: false,

      propertyKeys: [
        "model",
        "contextWindow",
        "inputPricePerMillion",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion",
        "outputPricePerMillion"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/model",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/contextWindow",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/inputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/cachedInputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/cacheWritePricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/outputPricePerMillion"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/model": {
      title: "Modèle",
      key: "model",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/model",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model",
      pure: false,

      propertyKeys: [
        "id",
        "name",
        "provider",
        "contextWindow",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion"
      ],

      roPropertyKeys: [
        "contextWindow",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion"
      ],

      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/contextWindow",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cachedInputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cacheWritePricePerMillion"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/contextWindow": {
      title: "Taille de contexte (tokens, surcharge)",
      key: "contextWindow",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/contextWindow",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/contextWindow",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/inputPricePerMillion": {
      title: "Prix d'entrée (par million de tokens)",
      key: "inputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/inputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/inputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/cachedInputPricePerMillion": {
      title: "Prix d'entrée en cache (par million de tokens)",
      key: "cachedInputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/cachedInputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/cachedInputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/cacheWritePricePerMillion": {
      title: "Prix d'écriture en cache (par million de tokens)",
      key: "cacheWritePricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/cacheWritePricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/cacheWritePricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/outputPricePerMillion": {
      title: "Prix de sortie (par million de tokens)",
      key: "outputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/outputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/outputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer": {
      title: "Résumeur",
      key: "summarizer",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer",
      pure: false,

      propertyKeys: [
        "model",
        "contextWindow",
        "inputPricePerMillion",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion",
        "outputPricePerMillion"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/contextWindow",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/inputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/cachedInputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/cacheWritePricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/outputPricePerMillion"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model": {
      title: "Modèle",
      key: "model",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model",
      pure: false,

      propertyKeys: [
        "id",
        "name",
        "provider",
        "contextWindow",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion"
      ],

      roPropertyKeys: [
        "contextWindow",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion"
      ],

      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/contextWindow",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cachedInputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cacheWritePricePerMillion"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/contextWindow": {
      title: "Taille de contexte (tokens, surcharge)",
      key: "contextWindow",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/contextWindow",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/contextWindow",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/inputPricePerMillion": {
      title: "Prix d'entrée (par million de tokens)",
      key: "inputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/inputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/inputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/cachedInputPricePerMillion": {
      title: "Prix d'entrée en cache (par million de tokens)",
      key: "cachedInputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/cachedInputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/cachedInputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/cacheWritePricePerMillion": {
      title: "Prix d'écriture en cache (par million de tokens)",
      key: "cacheWritePricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/cacheWritePricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/cacheWritePricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/outputPricePerMillion": {
      title: "Prix de sortie (par million de tokens)",
      key: "outputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/outputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/outputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator": {
      title: "Évaluateur",
      key: "evaluator",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator",
      pure: false,

      propertyKeys: [
        "model",
        "contextWindow",
        "inputPricePerMillion",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion",
        "outputPricePerMillion"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/model",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/contextWindow",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/inputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/cachedInputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/cacheWritePricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/outputPricePerMillion"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/model": {
      title: "Modèle",
      key: "model",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/model",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model",
      pure: false,

      propertyKeys: [
        "id",
        "name",
        "provider",
        "contextWindow",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion"
      ],

      roPropertyKeys: [
        "contextWindow",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion"
      ],

      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/contextWindow",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cachedInputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cacheWritePricePerMillion"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/contextWindow": {
      title: "Taille de contexte (tokens, surcharge)",
      key: "contextWindow",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/contextWindow",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/contextWindow",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/inputPricePerMillion": {
      title: "Prix d'entrée (par million de tokens)",
      key: "inputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/inputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/inputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/cachedInputPricePerMillion": {
      title: "Prix d'entrée en cache (par million de tokens)",
      key: "cachedInputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/cachedInputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/cachedInputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/cacheWritePricePerMillion": {
      title: "Prix d'écriture en cache (par million de tokens)",
      key: "cacheWritePricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/cacheWritePricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/cacheWritePricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/outputPricePerMillion": {
      title: "Prix de sortie (par million de tokens)",
      key: "outputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/outputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/outputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator": {
      title: "Modérateur",
      key: "moderator",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator",
      pure: false,

      propertyKeys: [
        "model",
        "contextWindow",
        "inputPricePerMillion",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion",
        "outputPricePerMillion"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/model",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/contextWindow",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/inputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/cachedInputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/cacheWritePricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/outputPricePerMillion"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/model": {
      title: "Modèle",
      key: "model",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/model",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model",
      pure: false,

      propertyKeys: [
        "id",
        "name",
        "provider",
        "contextWindow",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion"
      ],

      roPropertyKeys: [
        "contextWindow",
        "cachedInputPricePerMillion",
        "cacheWritePricePerMillion"
      ],

      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/contextWindow",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cachedInputPricePerMillion",
        "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cacheWritePricePerMillion"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/contextWindow": {
      title: "Taille de contexte (tokens, surcharge)",
      key: "contextWindow",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/contextWindow",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/contextWindow",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/inputPricePerMillion": {
      title: "Prix d'entrée (par million de tokens)",
      key: "inputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/inputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/inputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/cachedInputPricePerMillion": {
      title: "Prix d'entrée en cache (par million de tokens)",
      key: "cachedInputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/cachedInputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/cachedInputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/cacheWritePricePerMillion": {
      title: "Prix d'écriture en cache (par million de tokens)",
      key: "cacheWritePricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/cacheWritePricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/cacheWritePricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/outputPricePerMillion": {
      title: "Prix de sortie (par million de tokens)",
      key: "outputPricePerMillion",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/outputPricePerMillion",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/outputPricePerMillion",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/moderation": {
      title: "Modération des entrées",
      key: "moderation",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/moderation",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/moderation",
      pure: false,
      propertyKeys: ["enabled", "categories"],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/enabled",
        "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/enabled": {
      title: "Activer la modération des entrées",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories": {
      title: "Catégories d'utilisateurs modérées",
      key: "categories",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      childrenTrees: [
        "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/compaction": {
      title: "Compaction de l'historique",
      key: "compaction",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/compaction",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/compaction",
      pure: false,
      propertyKeys: ["percent"],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/compaction/properties/percent"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/compaction/properties/percent": {
      title: "Compacter au-delà de cette part de la fenêtre de contexte (%)",
      key: "percent",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/compaction/properties/percent",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/compaction/properties/percent",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas": {
      title: "Quotas par rôle",
      key: "quotas",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas",
      pure: false,

      propertyKeys: [
        "global",
        "admin",
        "contrib",
        "user",
        "external",
        "anonymous",
        "untrusted"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/global",
        "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/admin",
        "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/contrib",
        "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/user",
        "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/external",
        "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/anonymous",
        "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/untrusted"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/global": {
      title: "Quotas globaux",
      key: "global",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/global",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited",
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited": {
      title: "Illimité",
      key: "unlimited",
      pointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit": {
      title: "Limite mensuelle",
      key: "monthlyLimit",
      pointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit",
      pure: false,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/admin": {
      title: "Quotas administrateur",
      key: "admin",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/admin",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited",
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/contrib": {
      title: "Quotas contributeur",
      key: "contrib",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/contrib",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited",
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/user": {
      title: "Quotas utilisateur simple",
      key: "user",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/user",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited",
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/external": {
      title: "Quotas utilisateur externe",
      key: "external",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/external",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited",
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/anonymous": {
      title: "Quotas utilisateur anonyme",
      key: "anonymous",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/anonymous",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited",
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"
      ]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/untrusted": {
      title: "Réserve anonyme + externe",
      key: "untrusted",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/untrusted",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited",
        "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"
      ]
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
        key: "storeTraces"
      }, {
        key: "owner"
      }, {
        key: "providers"
      }, {
        key: "models"
      }, {
        key: "moderation"
      }, {
        key: "compaction"
      }, {
        key: "quotas"
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

    "https://github.com/data-fair/agents/settings-put#/properties/storeTraces": {
      comp: "checkbox",
      label: "Enregistrer les traces de conversation",
      help: "<p>Si activé, les conversations des utilisateurs consentants sont enregistrées sur le serveur pendant 30 jours pour relecture par un administrateur. Chaque utilisateur doit explicitement accepter.</p>",
      defaultData: false,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
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
        expr: "item ? `${item.name || \"\"} - ${item.id.slice(0, 8)}` : \"\"",
        pure: true,
        dataAlias: "item",
        ref: 3
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
        title: "Fournisseur",
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

        title: "Fournisseur",
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

      label: "ID du fournisseur",

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
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type": {
      comp: "none",
      constData: "anthropic",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 6
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id": {
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
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Anthropic\"",
        pure: true,
        dataAlias: "value",
        ref: 8
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type": {
      comp: "none",
      constData: "google",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 6
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id": {
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
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Google\"",
        pure: true,
        dataAlias: "value",
        ref: 9
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type": {
      comp: "none",
      constData: "mistral",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 6
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id": {
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
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Mistral\"",
        pure: true,
        dataAlias: "value",
        ref: 10
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type": {
      comp: "none",
      constData: "openrouter",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 6
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id": {
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
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"OpenRouter\"",
        pure: true,
        dataAlias: "value",
        ref: 11
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type": {
      comp: "none",
      constData: "ollama",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 6
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id": {
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
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Ollama\"",
        pure: true,
        dataAlias: "value",
        ref: 12
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type": {
      comp: "none",
      constData: "scaleway",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 6
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id": {
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
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Scaleway\"",
        pure: true,
        dataAlias: "value",
        ref: 13
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/projectId": {
      comp: "text-field",
      label: "ID du projet",
      help: "<p>Optionnel. L&#39;ID du Projet Scaleway (UUID) auquel la clé API est liée. Requis lorsque la clé n&#39;a accès qu&#39;à un projet spécifique, sinon le listing des modèles et l&#39;inférence renvoient une erreur 403.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type": {
      comp: "none",
      constData: "openai-compatible",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 6
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id": {
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
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"OpenAI Compatible\"",
        pure: true,
        dataAlias: "value",
        ref: 14
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL": {
      comp: "text-field",
      label: "URL de base"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey": {
      comp: "text-field",
      label: "Clé API"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/compatibility": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"key\":\"default\",\"title\":\"default\",\"value\":\"default\"},{\"key\":\"compatible\",\"title\":\"compatible\",\"value\":\"compatible\"}]",
        immutable: true,
        ref: 15
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type": {
      comp: "none",
      constData: "mock",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 6
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id": {
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
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Mock\"",
        pure: true,
        dataAlias: "value",
        ref: 16
      },

      comp: "text-field",
      label: "Nom d'affichage"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/models": {
      title: null,

      if: {
        type: "js-eval",
        expr: "parent.data.providers?.length",
        pure: false,
        dataAlias: "value",
        ref: 17
      },

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

      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant": {
      comp: "card",

      children: [{
        key: "model"
      }, {
        key: "contextWindow",

        cols: {
          xs: 12,
          sm: 6
        }
      }, {
        key: "inputPricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "cachedInputPricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "cacheWritePricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "outputPricePerMillion",

        cols: {
          xs: 12,
          sm: 6
        }
      }],

      cols: {
        xs: 12,
        sm: 6
      },

      title: "Assistant",
      subtitle: "<p>L&#39;interface conversationnelle principale. Équilibré pour le raisonnement, le suivi d&#39;instructions et l&#39;interaction naturelle. Ce modèle gère le flux de haut niveau et délègue les tâches complexes aux sous-agents.</p>\n<p>Recommandations : GPT-5.4, Claude 4.5 Sonnet, Kimi K2, Mistral Large 3, etc.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model": {
      comp: "autocomplete",

      getItems: {
        url: {
          pure: false,
          type: "js-tpl",
          dataAlias: "value",
          expr: "${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}",
          ref: 18
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 21
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 19
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 20
        },

        returnObjects: true
      },

      label: "Modèle"
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id": {
      comp: "text-field",
      label: "Model ID"
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name": {
      comp: "text-field",
      label: "Name"
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider": {
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

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type": {
      comp: "text-field",
      label: "Provider Type"
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name": {
      comp: "text-field",
      label: "Provider Name"
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id": {
      comp: "text-field",
      label: "Provider ID"
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/contextWindow": {
      comp: "number-field",

      options: {
        readOnly: true
      },

      label: "Context window",
      help: "<p>Taille totale du contexte en tokens, telle que rapportée par le fournisseur lors de la sélection du modèle.</p>",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cachedInputPricePerMillion": {
      comp: "number-field",

      options: {
        readOnly: true
      },

      label: "Cached input price (per 1M tokens)",
      help: "<p>Rapporté par le fournisseur lors de la sélection du modèle.</p>",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/cacheWritePricePerMillion": {
      comp: "number-field",

      options: {
        readOnly: true
      },

      label: "Cache write price (per 1M tokens)",
      help: "<p>Rapporté par le fournisseur lors de la sélection du modèle.</p>",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/contextWindow": {
      comp: "number-field",
      min: 0,
      label: "Taille de contexte (tokens, surcharge)",
      help: "<p>Laissez vide pour utiliser la valeur rapportée par le fournisseur, ou 32000 si le fournisseur ne rapporte rien.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/cachedInputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée en cache (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/cacheWritePricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'écriture en cache (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/outputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix de sortie (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools": {
      comp: "card",

      children: [{
        key: "model"
      }, {
        key: "contextWindow",

        cols: {
          xs: 12,
          sm: 6
        }
      }, {
        key: "inputPricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "cachedInputPricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "cacheWritePricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "outputPricePerMillion",

        cols: {
          xs: 12,
          sm: 6
        }
      }],

      cols: {
        xs: 12,
        sm: 6
      },

      title: "Outils",
      subtitle: "<p>Le « technicien ». Spécialisé dans les données structurées et l&#39;interaction avec les API. Il excelle à enchaîner plusieurs appels d&#39;outils sans remplissage conversationnel, garantissant une haute fiabilité dans les workflows automatisés.</p>\n<p>Recommandations : GPT-5.4 Mini, Mistral DevStral, Claude 4.5 Sonnet (Computer Use), MiMo-V2-Flash, etc.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/model": {
      comp: "autocomplete",

      getItems: {
        url: {
          pure: false,
          type: "js-tpl",
          dataAlias: "value",
          expr: "${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}",
          ref: 18
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 21
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 19
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 20
        },

        returnObjects: true
      },

      label: "Modèle"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/contextWindow": {
      comp: "number-field",
      min: 0,
      label: "Taille de contexte (tokens, surcharge)",
      help: "<p>Laissez vide pour utiliser la valeur rapportée par le fournisseur, ou 32000 si le fournisseur ne rapporte rien.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/cachedInputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée en cache (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/cacheWritePricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'écriture en cache (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/outputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix de sortie (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer": {
      comp: "card",

      children: [{
        key: "model"
      }, {
        key: "contextWindow",

        cols: {
          xs: 12,
          sm: 6
        }
      }, {
        key: "inputPricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "cachedInputPricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "cacheWritePricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "outputPricePerMillion",

        cols: {
          xs: 12,
          sm: 6
        }
      }],

      cols: {
        xs: 12,
        sm: 6
      },

      title: "Résumeur",
      subtitle: "<p>Un spécialiste de la « synthèse ». Optimisé pour extraire rapidement les points clés de blocs de texte petits à moyens. Il privilégie la densité d&#39;information et la concision pour garder les fenêtres de contexte légères et les coûts bas.</p>\n<p>Recommandations : GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Qwen3 (8B), etc.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model": {
      comp: "autocomplete",

      getItems: {
        url: {
          pure: false,
          type: "js-tpl",
          dataAlias: "value",
          expr: "${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}",
          ref: 18
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 21
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 19
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 20
        },

        returnObjects: true
      },

      label: "Modèle"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/contextWindow": {
      comp: "number-field",
      min: 0,
      label: "Taille de contexte (tokens, surcharge)",
      help: "<p>Laissez vide pour utiliser la valeur rapportée par le fournisseur, ou 32000 si le fournisseur ne rapporte rien.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/cachedInputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée en cache (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/cacheWritePricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'écriture en cache (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/outputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix de sortie (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator": {
      comp: "card",

      children: [{
        key: "model"
      }, {
        key: "contextWindow",

        cols: {
          xs: 12,
          sm: 6
        }
      }, {
        key: "inputPricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "cachedInputPricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "cacheWritePricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "outputPricePerMillion",

        cols: {
          xs: 12,
          sm: 6
        }
      }],

      cols: {
        xs: 12,
        sm: 6
      },

      title: "Évaluateur",
      subtitle: "<p>Le « contrôleur qualité ». Analyse la logique de l&#39;assistant et les sorties des outils pour vérifier la précision et la sécurité. Il nécessite les capacités de raisonnement les plus élevées pour servir de référence fiable pour les performances du système.</p>\n<p>Recommandations : Claude Opus 4.6, GPT-5.4 (Reasoning), DeepSeek-R1, Pharia-1-LLM, etc.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/model": {
      comp: "autocomplete",

      getItems: {
        url: {
          pure: false,
          type: "js-tpl",
          dataAlias: "value",
          expr: "${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}",
          ref: 18
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 21
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 19
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 20
        },

        returnObjects: true
      },

      label: "Modèle"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/contextWindow": {
      comp: "number-field",
      min: 0,
      label: "Taille de contexte (tokens, surcharge)",
      help: "<p>Laissez vide pour utiliser la valeur rapportée par le fournisseur, ou 32000 si le fournisseur ne rapporte rien.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/cachedInputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée en cache (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/cacheWritePricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'écriture en cache (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/outputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix de sortie (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator": {
      comp: "card",

      children: [{
        key: "model"
      }, {
        key: "contextWindow",

        cols: {
          xs: 12,
          sm: 6
        }
      }, {
        key: "inputPricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "cachedInputPricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "cacheWritePricePerMillion",

        cols: {
          xs: 12,
          sm: 4
        }
      }, {
        key: "outputPricePerMillion",

        cols: {
          xs: 12,
          sm: 6
        }
      }],

      cols: {
        xs: 12,
        sm: 6
      },

      title: "Modérateur",
      subtitle: "<p>Le « gardien ». Classe chaque nouveau message utilisateur (grossièretés, injection de prompt, usurpation de persona, demandes hors périmètre). Doit être rapide et peu coûteux — il se trouve sur le chemin critique vers le premier token de réponse.</p>\n<p>Recommandations : un modèle généraliste petit et rapide avec support de sortie structurée (JSON), par ex. Claude 4.5 Haiku, GPT-5.4 Mini, Mistral Small 4, Qwen3 (4B). Les classifieurs de modération dédiés (Llama Guard, API de modération) ne sont pas compatibles : leurs taxonomies et formats de sortie fixes ne peuvent pas exprimer la politique spécifique de cette plateforme.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/model": {
      comp: "autocomplete",

      getItems: {
        url: {
          pure: false,
          type: "js-tpl",
          dataAlias: "value",
          expr: "${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}",
          ref: 18
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 21
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 19
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 20
        },

        returnObjects: true
      },

      label: "Modèle"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/contextWindow": {
      comp: "number-field",
      min: 0,
      label: "Taille de contexte (tokens, surcharge)",
      help: "<p>Laissez vide pour utiliser la valeur rapportée par le fournisseur, ou 32000 si le fournisseur ne rapporte rien.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/cachedInputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée en cache (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/cacheWritePricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'écriture en cache (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/outputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix de sortie (par million de tokens)"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/moderation": {
      if: {
        type: "js-eval",
        expr: "parent.data.providers?.length",
        pure: false,
        dataAlias: "value",
        ref: 17
      },

      comp: "section",

      children: [{
        key: "enabled"
      }, {
        key: "categories"
      }],

      title: "Modération des entrées",

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

    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/enabled": {
      comp: "checkbox",
      label: "Activer la modération des entrées",
      help: "<p>Si activé, le dernier message utilisateur de chaque requête provenant d&#39;une catégorie modérée est classé avant la réponse du modèle.</p>",
      defaultData: false,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"anonymous\",\"title\":\"Anonyme\",\"key\":\"anonymous\",\"value\":\"anonymous\"},{\"const\":\"external\",\"title\":\"Externe\",\"key\":\"external\",\"value\":\"external\"},{\"const\":\"user\",\"title\":\"Utilisateur\",\"key\":\"user\",\"value\":\"user\"},{\"const\":\"contrib\",\"title\":\"Contributeur\",\"key\":\"contrib\",\"value\":\"contrib\"},{\"const\":\"admin\",\"title\":\"Administrateur\",\"key\":\"admin\",\"value\":\"admin\"}]",
        immutable: true,
        ref: 22
      },

      multiple: true,
      label: "Catégories d'utilisateurs modérées",
      help: "<p>Catégories d&#39;utilisateurs dont les requêtes sont vérifiées par le filtre lorsque la modération est activée.</p>",
      defaultData: ["anonymous", "external"],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"anonymous\",\"title\":\"Anonyme\",\"key\":\"anonymous\",\"value\":\"anonymous\"},{\"const\":\"external\",\"title\":\"Externe\",\"key\":\"external\",\"value\":\"external\"},{\"const\":\"user\",\"title\":\"Utilisateur\",\"key\":\"user\",\"value\":\"user\"},{\"const\":\"contrib\",\"title\":\"Contributeur\",\"key\":\"contrib\",\"value\":\"contrib\"},{\"const\":\"admin\",\"title\":\"Administrateur\",\"key\":\"admin\",\"value\":\"admin\"}]",
        immutable: true,
        ref: 22
      },

      label: "",
      nullable: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/compaction": {
      if: {
        type: "js-eval",
        expr: "parent.data.providers?.length",
        pure: false,
        dataAlias: "value",
        ref: 17
      },

      comp: "section",

      children: [{
        key: "percent"
      }],

      title: "Compaction de l'historique",

      defaultData: {
        percent: 70
      },

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/compaction/properties/percent": {
      comp: "number-field",
      min: 10,
      max: 100,
      label: "Compacter au-delà de cette part de la fenêtre de contexte (%)",
      help: "<p>L&#39;historique de conversation est résumé dès qu&#39;il dépasse ce pourcentage de la fenêtre de contexte du modèle assistant. Plus la valeur est élevée, plus la compaction est rare, meilleure est la réutilisation du cache, et plus de contexte est conservé.</p>",
      defaultData: 70,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas": {
      title: null,

      if: {
        type: "js-eval",
        expr: "parent.data.providers?.length",
        pure: false,
        dataAlias: "value",
        ref: 17
      },

      children: [{
        key: "global",

        cols: {
          xs: 12,
          sm: 6,
          md: 4
        }
      }, {
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
          ref: 23
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
          ref: 23
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
        global: {
          unlimited: false,
          monthlyLimit: 10
        },

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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/global": {
      comp: "card",

      children: [{
        key: "unlimited"
      }, {
        key: "monthlyLimit"
      }],

      title: "Quotas globaux",

      defaultData: {
        unlimited: false,
        monthlyLimit: 10
      },

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited": {
      comp: "checkbox",
      label: "Illimité",
      defaultData: false,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit": {
      if: {
        type: "js-eval",
        expr: "!parent.data.unlimited",
        pure: false,
        dataAlias: "value",
        ref: 24
      },

      comp: "number-field",
      min: 0,
      label: "Limite mensuelle",
      help: "<p>Limite hebdomadaire = mensuelle / 2, limite journalière = mensuelle / 4</p>",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/admin": {
      comp: "card",

      children: [{
        key: "unlimited"
      }, {
        key: "monthlyLimit"
      }],

      title: "Quotas administrateur",

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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/contrib": {
      comp: "card",

      children: [{
        key: "unlimited"
      }, {
        key: "monthlyLimit"
      }],

      title: "Quotas contributeur",

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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/user": {
      comp: "card",

      children: [{
        key: "unlimited"
      }, {
        key: "monthlyLimit"
      }],

      title: "Quotas utilisateur simple",

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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/external": {
      comp: "card",

      children: [{
        key: "unlimited"
      }, {
        key: "monthlyLimit"
      }],

      title: "Quotas utilisateur externe",

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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/anonymous": {
      comp: "card",

      children: [{
        key: "unlimited"
      }, {
        key: "monthlyLimit"
      }],

      title: "Quotas utilisateur anonyme",

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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/untrusted": {
      comp: "card",

      children: [{
        key: "unlimited"
      }, {
        key: "monthlyLimit"
      }],

      title: "Réserve anonyme + externe",
      subtitle: "<p>Plafond agrégé partagé par l&#39;ensemble des usages anonymes et externes, afin que le trafic non fiable ne puisse pas consommer tout le budget du compte. 0 = pas de plafond de réserve.</p>",

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
    }
  },

  validates: {
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0": export0,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1": export1,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2": export2,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3": export3,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4": export4,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5": export5,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6": export6,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7": export7,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8": export8,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items": export9,
    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items": export10,
    "https://github.com/data-fair/agents/settings-put#": export11
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
    expression14,
    expression15,
    expression16,
    expression17,
    expression18,
    expression19,
    expression20,
    expression21,
    expression22,
    expression23,
    expression24
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
  
  "date-time-picker": datetimepickerNode,
  
  "checkbox": checkboxNode,
  
  "select": selectNode,
  
  "text-field": textfieldNode,
  
  "list": listNode,
  
  "one-of-select": oneofselectNode,
  
  "card": cardNode,
  
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