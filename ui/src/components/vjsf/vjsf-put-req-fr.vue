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

const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items"};
const schema40 = {"type":"string","oneOf":[{"const":"anonymous","title":"Anonyme"},{"const":"external","title":"Externe"},{"const":"user","title":"Utilisateur"},{"const":"contrib","title":"Contributeur"},{"const":"admin","title":"Administrateur"}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items","errorMessage":{"oneOf":"choisissez une valeur"}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema40.type,parentSchema:schema40,data};
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
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/oneOf/0/const",keyword:"const",params:{allowedValue: "anonymous"},message:"must be equal to constant",schema:"anonymous",parentSchema:schema40.oneOf[0],data};
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
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/oneOf/1/const",keyword:"const",params:{allowedValue: "external"},message:"must be equal to constant",schema:"external",parentSchema:schema40.oneOf[1],data};
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
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/oneOf/2/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema40.oneOf[2],data};
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
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/oneOf/3/const",keyword:"const",params:{allowedValue: "contrib"},message:"must be equal to constant",schema:"contrib",parentSchema:schema40.oneOf[3],data};
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
const err5 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/oneOf/4/const",keyword:"const",params:{allowedValue: "admin"},message:"must be equal to constant",schema:"admin",parentSchema:schema40.oneOf[4],data};
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
const err6 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema40.oneOf,parentSchema:schema40,data};
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
const err8 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors0[key0]},message:key0 in templates0 ? templates0[key0]() : schema40.errorMessage[key0],schema:schema40.errorMessage,parentSchema:schema40,data};
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

const schema41 = {"$id":"export1","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0"};
const schema42 = {"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};
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
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema42.required,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema42.required,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema42.required,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema42.required,parentSchema:schema42,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.type.type,parentSchema:schema42.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openai" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema42.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.id.type,parentSchema:schema42.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.name.type,parentSchema:schema42.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema42.properties.enabled.type,parentSchema:schema42.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.apiKey.type,parentSchema:schema42.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema42.type,parentSchema:schema42,data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema42.errorMessage[key0][keyProp0],schema:schema42.errorMessage,parentSchema:schema42,data};
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

const schema43 = {"$id":"export2","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1"};
const schema44 = {"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema44.required,parentSchema:schema44,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema44.required,parentSchema:schema44,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema44.required,parentSchema:schema44,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema44.required,parentSchema:schema44,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.properties.type.type,parentSchema:schema44.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("anthropic" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant",schema:"anthropic",parentSchema:schema44.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.properties.id.type,parentSchema:schema44.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.properties.name.type,parentSchema:schema44.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema44.properties.enabled.type,parentSchema:schema44.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.properties.apiKey.type,parentSchema:schema44.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema44.type,parentSchema:schema44,data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema44.errorMessage[key0][keyProp0],schema:schema44.errorMessage,parentSchema:schema44,data};
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

const schema45 = {"$id":"export3","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2"};
const schema46 = {"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema46.required,parentSchema:schema46,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema46.required,parentSchema:schema46,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema46.required,parentSchema:schema46,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema46.required,parentSchema:schema46,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.type.type,parentSchema:schema46.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("google" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant",schema:"google",parentSchema:schema46.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.id.type,parentSchema:schema46.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.name.type,parentSchema:schema46.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema46.properties.enabled.type,parentSchema:schema46.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.apiKey.type,parentSchema:schema46.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema46.type,parentSchema:schema46,data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema46.errorMessage[key0][keyProp0],schema:schema46.errorMessage,parentSchema:schema46,data};
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

const schema47 = {"$id":"export4","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3"};
const schema48 = {"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema48.required,parentSchema:schema48,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema48.required,parentSchema:schema48,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema48.required,parentSchema:schema48,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema48.required,parentSchema:schema48,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema48.properties.type.type,parentSchema:schema48.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("mistral" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant",schema:"mistral",parentSchema:schema48.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema48.properties.id.type,parentSchema:schema48.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema48.properties.name.type,parentSchema:schema48.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema48.properties.enabled.type,parentSchema:schema48.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema48.properties.apiKey.type,parentSchema:schema48.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema48.type,parentSchema:schema48,data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema48.errorMessage[key0][keyProp0],schema:schema48.errorMessage,parentSchema:schema48,data};
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

const schema49 = {"$id":"export5","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4"};
const schema50 = {"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema50.required,parentSchema:schema50,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema50.required,parentSchema:schema50,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema50.required,parentSchema:schema50,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema50.required,parentSchema:schema50,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema50.properties.type.type,parentSchema:schema50.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openrouter" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant",schema:"openrouter",parentSchema:schema50.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema50.properties.id.type,parentSchema:schema50.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema50.properties.name.type,parentSchema:schema50.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema50.properties.enabled.type,parentSchema:schema50.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema50.properties.apiKey.type,parentSchema:schema50.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema50.type,parentSchema:schema50,data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema50.errorMessage[key0][keyProp0],schema:schema50.errorMessage,parentSchema:schema50,data};
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
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"apiKey":true},"dynamicProps":false,"dynamicItems":false};

const schema51 = {"$id":"export6","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5"};
const schema52 = {"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema52.required,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema52.required,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema52.required,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema52.required,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.baseURL === undefined){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema52.required,parentSchema:schema52,data};
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
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.properties.type.type,parentSchema:schema52.properties.type,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("ollama" !== data0){
const err6 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant",schema:"ollama",parentSchema:schema52.properties.type,data:data0};
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
const err8 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.properties.id.type,parentSchema:schema52.properties.id,data:data1};
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
const err10 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.properties.name.type,parentSchema:schema52.properties.name,data:data2};
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
const err12 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema52.properties.enabled.type,parentSchema:schema52.properties.enabled,data:data3};
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
const err14 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.properties.apiKey.type,parentSchema:schema52.properties.apiKey,data:data4};
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
const err16 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.properties.baseURL.type,parentSchema:schema52.properties.baseURL,data:data5};
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
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema52.type,parentSchema:schema52,data};
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
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema52.errorMessage[key0][keyProp0],schema:schema52.errorMessage,parentSchema:schema52,data};
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
validate29.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"apiKey":true,"baseURL":true},"dynamicProps":false,"dynamicItems":false};

const schema53 = {"$id":"export7","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6"};
const schema54 = {"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Scaleway\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","apiKey":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema54.required,parentSchema:schema54,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema54.required,parentSchema:schema54,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema54.required,parentSchema:schema54,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema54.required,parentSchema:schema54,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.apiKey === undefined){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "apiKey"},message:"must have required property '"+"apiKey"+"'",schema:schema54.required,parentSchema:schema54,data};
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
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema54.properties.type.type,parentSchema:schema54.properties.type,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("scaleway" !== data0){
const err6 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "scaleway"},message:"must be equal to constant",schema:"scaleway",parentSchema:schema54.properties.type,data:data0};
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
const err8 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema54.properties.id.type,parentSchema:schema54.properties.id,data:data1};
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
const err10 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema54.properties.name.type,parentSchema:schema54.properties.name,data:data2};
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
const err12 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema54.properties.enabled.type,parentSchema:schema54.properties.enabled,data:data3};
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
const err14 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema54.properties.apiKey.type,parentSchema:schema54.properties.apiKey,data:data4};
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
}
else {
const err16 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema54.type,parentSchema:schema54,data};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"apiKey":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err17 of vErrors){
if((((((err17.keyword !== "errorMessage") && (!err17.emUsed)) && (err17.instancePath === instancePath)) && (err17.keyword in emErrors0)) && (err17.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6") === 0)) && (/^\/[^\/]*$/.test(err17.schemaPath.slice(84)))){
emPropParams0 = obj0[err17.keyword];
emParamsErrors0 = emErrors0[err17.keyword][err17.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err17);
err17.emUsed = true;
}
}
}
for(const key0 in emErrors0){
for(const keyProp0 in emErrors0[key0]){
emParamsErrors0 = emErrors0[key0][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key0] && templates0[key0][keyProp0];
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema54.errorMessage[key0][keyProp0],schema:schema54.errorMessage,parentSchema:schema54,data};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
}
const emErrs5 = [];
for(const err19 of vErrors){
if(!err19.emUsed){
emErrs5.push(err19);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
validate30.errors = vErrors;
return errors === 0;
}
validate30.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"apiKey":true},"dynamicProps":false,"dynamicItems":false};

const schema55 = {"$id":"export8","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7"};
const schema56 = {"required":["type","name","id","enabled","baseURL"],"title":"Compatible OpenAI","description":"Fournisseur générique pour tout endpoint compatible OpenAI (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). La clé API est optionnelle pour les serveurs locaux sans authentification.","properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenAI Compatible\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema56.required,parentSchema:schema56,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema56.required,parentSchema:schema56,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema56.required,parentSchema:schema56,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema56.required,parentSchema:schema56,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.baseURL === undefined){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema56.required,parentSchema:schema56,data};
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
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema56.properties.type.type,parentSchema:schema56.properties.type,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("openai-compatible" !== data0){
const err6 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue: "openai-compatible"},message:"must be equal to constant",schema:"openai-compatible",parentSchema:schema56.properties.type,data:data0};
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
const err8 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema56.properties.id.type,parentSchema:schema56.properties.id,data:data1};
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
const err10 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema56.properties.name.type,parentSchema:schema56.properties.name,data:data2};
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
const err12 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema56.properties.enabled.type,parentSchema:schema56.properties.enabled,data:data3};
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
const err14 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema56.properties.baseURL.type,parentSchema:schema56.properties.baseURL,data:data4};
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
const err16 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema56.properties.apiKey.type,parentSchema:schema56.properties.apiKey,data:data5};
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
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema56.type,parentSchema:schema56,data};
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
if((((((err19.keyword !== "errorMessage") && (!err19.emUsed)) && (err19.instancePath === instancePath)) && (err19.keyword in emErrors0)) && (err19.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7") === 0)) && (/^\/[^\/]*$/.test(err19.schemaPath.slice(84)))){
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
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema56.errorMessage[key0][keyProp0],schema:schema56.errorMessage,parentSchema:schema56,data};
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
validate31.errors = vErrors;
return errors === 0;
}
validate31.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"baseURL":true,"apiKey":true},"dynamicProps":false,"dynamicItems":false};

const schema57 = {"$id":"export9","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8"};
const schema58 = {"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}};

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
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema58.required,parentSchema:schema58,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema58.required,parentSchema:schema58,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema58.required,parentSchema:schema58,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema58.required,parentSchema:schema58,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.properties.type.type,parentSchema:schema58.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("mock" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema58.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.properties.id.type,parentSchema:schema58.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.properties.name.type,parentSchema:schema58.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema58.properties.enabled.type,parentSchema:schema58.properties.enabled,data:data3};
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
const err13 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.type,parentSchema:schema58,data};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema58.errorMessage[key0][keyProp0],schema:schema58.errorMessage,parentSchema:schema58,data};
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
validate32.errors = vErrors;
return errors === 0;
}
validate32.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true},"dynamicProps":false,"dynamicItems":false};

const schema59 = {"$id":"export10","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items"};
const schema60 = {"type":"object","title":"Fournisseur","unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}},{"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Scaleway\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","apiKey":"information obligatoire"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Compatible OpenAI","description":"Fournisseur générique pour tout endpoint compatible OpenAI (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). La clé API est optionnelle pour les serveurs locaux sans authentification.","properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenAI Compatible\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items","errorMessage":{"oneOf":"choisissez une valeur"}};

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
const _errs2 = errors;
let valid1 = false;
let passing0 = null;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema60.oneOf[0].required,parentSchema:schema60.oneOf[0],data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema60.oneOf[0].required,parentSchema:schema60.oneOf[0],data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema60.oneOf[0].required,parentSchema:schema60.oneOf[0],data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema60.oneOf[0].required,parentSchema:schema60.oneOf[0],data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[0].properties.type.type,parentSchema:schema60.oneOf[0].properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openai" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema60.oneOf[0].properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[0].properties.id.type,parentSchema:schema60.oneOf[0].properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[0].properties.name.type,parentSchema:schema60.oneOf[0].properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema60.oneOf[0].properties.enabled.type,parentSchema:schema60.oneOf[0].properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[0].properties.apiKey.type,parentSchema:schema60.oneOf[0].properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema60.oneOf[0].type,parentSchema:schema60.oneOf[0],data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema60.oneOf[0].errorMessage[key0][keyProp0],schema:schema60.oneOf[0].errorMessage,parentSchema:schema60.oneOf[0],data};
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
const err19 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema60.oneOf[1].required,parentSchema:schema60.oneOf[1],data};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data.name === undefined){
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema60.oneOf[1].required,parentSchema:schema60.oneOf[1],data};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data.id === undefined){
const err21 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema60.oneOf[1].required,parentSchema:schema60.oneOf[1],data};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data.enabled === undefined){
const err22 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema60.oneOf[1].required,parentSchema:schema60.oneOf[1],data};
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
const err23 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[1].properties.type.type,parentSchema:schema60.oneOf[1].properties.type,data:data5};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if("anthropic" !== data5){
const err24 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant",schema:"anthropic",parentSchema:schema60.oneOf[1].properties.type,data:data5};
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
const err26 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[1].properties.id.type,parentSchema:schema60.oneOf[1].properties.id,data:data6};
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
const err28 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[1].properties.name.type,parentSchema:schema60.oneOf[1].properties.name,data:data7};
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
const err30 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema60.oneOf[1].properties.enabled.type,parentSchema:schema60.oneOf[1].properties.enabled,data:data8};
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
const err32 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[1].properties.apiKey.type,parentSchema:schema60.oneOf[1].properties.apiKey,data:data9};
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
const err34 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema60.oneOf[1].type,parentSchema:schema60.oneOf[1],data};
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
const err36 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema60.oneOf[1].errorMessage[key1][keyProp1],schema:schema60.oneOf[1].errorMessage,parentSchema:schema60.oneOf[1],data};
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
const err38 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema60.oneOf[2].required,parentSchema:schema60.oneOf[2],data};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data.name === undefined){
const err39 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema60.oneOf[2].required,parentSchema:schema60.oneOf[2],data};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data.id === undefined){
const err40 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema60.oneOf[2].required,parentSchema:schema60.oneOf[2],data};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data.enabled === undefined){
const err41 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema60.oneOf[2].required,parentSchema:schema60.oneOf[2],data};
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
const err42 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[2].properties.type.type,parentSchema:schema60.oneOf[2].properties.type,data:data10};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if("google" !== data10){
const err43 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant",schema:"google",parentSchema:schema60.oneOf[2].properties.type,data:data10};
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
const err45 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[2].properties.id.type,parentSchema:schema60.oneOf[2].properties.id,data:data11};
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
const err47 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[2].properties.name.type,parentSchema:schema60.oneOf[2].properties.name,data:data12};
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
const err49 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema60.oneOf[2].properties.enabled.type,parentSchema:schema60.oneOf[2].properties.enabled,data:data13};
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
const err51 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[2].properties.apiKey.type,parentSchema:schema60.oneOf[2].properties.apiKey,data:data14};
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
const err53 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema60.oneOf[2].type,parentSchema:schema60.oneOf[2],data};
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
const err55 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema60.oneOf[2].errorMessage[key2][keyProp2],schema:schema60.oneOf[2].errorMessage,parentSchema:schema60.oneOf[2],data};
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
const err57 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema60.oneOf[3].required,parentSchema:schema60.oneOf[3],data};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data.name === undefined){
const err58 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema60.oneOf[3].required,parentSchema:schema60.oneOf[3],data};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data.id === undefined){
const err59 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema60.oneOf[3].required,parentSchema:schema60.oneOf[3],data};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data.enabled === undefined){
const err60 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema60.oneOf[3].required,parentSchema:schema60.oneOf[3],data};
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
const err61 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[3].properties.type.type,parentSchema:schema60.oneOf[3].properties.type,data:data15};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if("mistral" !== data15){
const err62 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant",schema:"mistral",parentSchema:schema60.oneOf[3].properties.type,data:data15};
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
const err64 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[3].properties.id.type,parentSchema:schema60.oneOf[3].properties.id,data:data16};
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
const err66 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[3].properties.name.type,parentSchema:schema60.oneOf[3].properties.name,data:data17};
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
const err68 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema60.oneOf[3].properties.enabled.type,parentSchema:schema60.oneOf[3].properties.enabled,data:data18};
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
const err70 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[3].properties.apiKey.type,parentSchema:schema60.oneOf[3].properties.apiKey,data:data19};
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
const err72 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema60.oneOf[3].type,parentSchema:schema60.oneOf[3],data};
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
const err74 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema60.oneOf[3].errorMessage[key3][keyProp3],schema:schema60.oneOf[3].errorMessage,parentSchema:schema60.oneOf[3],data};
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
const err76 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema60.oneOf[4].required,parentSchema:schema60.oneOf[4],data};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
if(data.name === undefined){
const err77 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema60.oneOf[4].required,parentSchema:schema60.oneOf[4],data};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(data.id === undefined){
const err78 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema60.oneOf[4].required,parentSchema:schema60.oneOf[4],data};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if(data.enabled === undefined){
const err79 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema60.oneOf[4].required,parentSchema:schema60.oneOf[4],data};
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
const err80 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[4].properties.type.type,parentSchema:schema60.oneOf[4].properties.type,data:data20};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if("openrouter" !== data20){
const err81 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant",schema:"openrouter",parentSchema:schema60.oneOf[4].properties.type,data:data20};
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
const err83 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[4].properties.id.type,parentSchema:schema60.oneOf[4].properties.id,data:data21};
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
const err85 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[4].properties.name.type,parentSchema:schema60.oneOf[4].properties.name,data:data22};
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
const err87 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema60.oneOf[4].properties.enabled.type,parentSchema:schema60.oneOf[4].properties.enabled,data:data23};
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
const err89 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[4].properties.apiKey.type,parentSchema:schema60.oneOf[4].properties.apiKey,data:data24};
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
const err91 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema60.oneOf[4].type,parentSchema:schema60.oneOf[4],data};
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
const err93 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema60.oneOf[4].errorMessage[key4][keyProp4],schema:schema60.oneOf[4].errorMessage,parentSchema:schema60.oneOf[4],data};
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
const err95 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema60.oneOf[5].required,parentSchema:schema60.oneOf[5],data};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
if(data.name === undefined){
const err96 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema60.oneOf[5].required,parentSchema:schema60.oneOf[5],data};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(data.id === undefined){
const err97 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema60.oneOf[5].required,parentSchema:schema60.oneOf[5],data};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
if(data.enabled === undefined){
const err98 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema60.oneOf[5].required,parentSchema:schema60.oneOf[5],data};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(data.baseURL === undefined){
const err99 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema60.oneOf[5].required,parentSchema:schema60.oneOf[5],data};
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
const err100 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[5].properties.type.type,parentSchema:schema60.oneOf[5].properties.type,data:data25};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
if("ollama" !== data25){
const err101 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant",schema:"ollama",parentSchema:schema60.oneOf[5].properties.type,data:data25};
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
const err103 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[5].properties.id.type,parentSchema:schema60.oneOf[5].properties.id,data:data26};
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
const err105 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[5].properties.name.type,parentSchema:schema60.oneOf[5].properties.name,data:data27};
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
const err107 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema60.oneOf[5].properties.enabled.type,parentSchema:schema60.oneOf[5].properties.enabled,data:data28};
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
const err109 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[5].properties.apiKey.type,parentSchema:schema60.oneOf[5].properties.apiKey,data:data29};
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
const err111 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[5].properties.baseURL.type,parentSchema:schema60.oneOf[5].properties.baseURL,data:data30};
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
const err113 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema60.oneOf[5].type,parentSchema:schema60.oneOf[5],data};
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
const err115 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors5},message:tmpl5 ? tmpl5() : schema60.oneOf[5].errorMessage[key5][keyProp5],schema:schema60.oneOf[5].errorMessage,parentSchema:schema60.oneOf[5],data};
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
const err117 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema60.oneOf[6].required,parentSchema:schema60.oneOf[6],data};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
if(data.name === undefined){
const err118 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema60.oneOf[6].required,parentSchema:schema60.oneOf[6],data};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if(data.id === undefined){
const err119 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema60.oneOf[6].required,parentSchema:schema60.oneOf[6],data};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
if(data.enabled === undefined){
const err120 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema60.oneOf[6].required,parentSchema:schema60.oneOf[6],data};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
if(data.apiKey === undefined){
const err121 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "apiKey"},message:"must have required property '"+"apiKey"+"'",schema:schema60.oneOf[6].required,parentSchema:schema60.oneOf[6],data};
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
const err122 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[6].properties.type.type,parentSchema:schema60.oneOf[6].properties.type,data:data31};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
if("scaleway" !== data31){
const err123 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "scaleway"},message:"must be equal to constant",schema:"scaleway",parentSchema:schema60.oneOf[6].properties.type,data:data31};
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
const err125 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[6].properties.id.type,parentSchema:schema60.oneOf[6].properties.id,data:data32};
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
const err127 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[6].properties.name.type,parentSchema:schema60.oneOf[6].properties.name,data:data33};
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
const err129 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema60.oneOf[6].properties.enabled.type,parentSchema:schema60.oneOf[6].properties.enabled,data:data34};
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
const err131 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[6].properties.apiKey.type,parentSchema:schema60.oneOf[6].properties.apiKey,data:data35};
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
}
else {
const err133 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema60.oneOf[6].type,parentSchema:schema60.oneOf[6],data};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
if(errors > 0){
const emErrors6 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"apiKey":[]}};
const templates6 = {required:{}};
let emPropParams6;
let emParamsErrors6;
for(const err134 of vErrors){
if((((((err134.keyword !== "errorMessage") && (!err134.emUsed)) && (err134.instancePath === instancePath)) && (err134.keyword in emErrors6)) && (err134.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6") === 0)) && (/^\/[^\/]*$/.test(err134.schemaPath.slice(84)))){
emPropParams6 = obj0[err134.keyword];
emParamsErrors6 = emErrors6[err134.keyword][err134.params[emPropParams6]];
if(emParamsErrors6){
emParamsErrors6.push(err134);
err134.emUsed = true;
}
}
}
for(const key6 in emErrors6){
for(const keyProp6 in emErrors6[key6]){
emParamsErrors6 = emErrors6[key6][keyProp6];
if(emParamsErrors6.length){
const tmpl6 = templates6[key6] && templates6[key6][keyProp6];
const err135 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema60.oneOf[6].errorMessage[key6][keyProp6],schema:schema60.oneOf[6].errorMessage,parentSchema:schema60.oneOf[6],data};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
}
}
const emErrs42 = [];
for(const err136 of vErrors){
if(!err136.emUsed){
emErrs42.push(err136);
}
}
vErrors = emErrs42;
errors = emErrs42.length;
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
}
}
const _errs89 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err137 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema60.oneOf[7].required,parentSchema:schema60.oneOf[7],data};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
if(data.name === undefined){
const err138 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema60.oneOf[7].required,parentSchema:schema60.oneOf[7],data};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
if(data.id === undefined){
const err139 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema60.oneOf[7].required,parentSchema:schema60.oneOf[7],data};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
if(data.enabled === undefined){
const err140 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema60.oneOf[7].required,parentSchema:schema60.oneOf[7],data};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
if(data.baseURL === undefined){
const err141 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema60.oneOf[7].required,parentSchema:schema60.oneOf[7],data};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
if(data.type !== undefined){
let data36 = data.type;
if(typeof data36 !== "string"){
const err142 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[7].properties.type.type,parentSchema:schema60.oneOf[7].properties.type,data:data36};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
if("openai-compatible" !== data36){
const err143 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue: "openai-compatible"},message:"must be equal to constant",schema:"openai-compatible",parentSchema:schema60.oneOf[7].properties.type,data:data36};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
if(errors > 0){
const emErrs43 = [];
for(const err144 of vErrors){
if(!err144.emUsed){
emErrs43.push(err144);
}
}
vErrors = emErrs43;
errors = emErrs43.length;
}
}
if(data.id !== undefined){
let data37 = data.id;
if(typeof data37 !== "string"){
const err145 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[7].properties.id.type,parentSchema:schema60.oneOf[7].properties.id,data:data37};
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
if(data.name !== undefined){
let data38 = data.name;
if(typeof data38 !== "string"){
const err147 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[7].properties.name.type,parentSchema:schema60.oneOf[7].properties.name,data:data38};
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
if(data.enabled !== undefined){
let data39 = data.enabled;
if(typeof data39 !== "boolean"){
const err149 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema60.oneOf[7].properties.enabled.type,parentSchema:schema60.oneOf[7].properties.enabled,data:data39};
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
if(data.baseURL !== undefined){
let data40 = data.baseURL;
if(typeof data40 !== "string"){
const err151 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[7].properties.baseURL.type,parentSchema:schema60.oneOf[7].properties.baseURL,data:data40};
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
if(data.apiKey !== undefined){
let data41 = data.apiKey;
if(typeof data41 !== "string"){
const err153 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[7].properties.apiKey.type,parentSchema:schema60.oneOf[7].properties.apiKey,data:data41};
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
}
else {
const err155 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema60.oneOf[7].type,parentSchema:schema60.oneOf[7],data};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
if(errors > 0){
const emErrors7 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"baseURL":[]}};
const templates7 = {required:{}};
let emPropParams7;
let emParamsErrors7;
for(const err156 of vErrors){
if((((((err156.keyword !== "errorMessage") && (!err156.emUsed)) && (err156.instancePath === instancePath)) && (err156.keyword in emErrors7)) && (err156.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7") === 0)) && (/^\/[^\/]*$/.test(err156.schemaPath.slice(84)))){
emPropParams7 = obj0[err156.keyword];
emParamsErrors7 = emErrors7[err156.keyword][err156.params[emPropParams7]];
if(emParamsErrors7){
emParamsErrors7.push(err156);
err156.emUsed = true;
}
}
}
for(const key7 in emErrors7){
for(const keyProp7 in emErrors7[key7]){
emParamsErrors7 = emErrors7[key7][keyProp7];
if(emParamsErrors7.length){
const tmpl7 = templates7[key7] && templates7[key7][keyProp7];
const err157 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors7},message:tmpl7 ? tmpl7() : schema60.oneOf[7].errorMessage[key7][keyProp7],schema:schema60.oneOf[7].errorMessage,parentSchema:schema60.oneOf[7],data};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
}
}
const emErrs49 = [];
for(const err158 of vErrors){
if(!err158.emUsed){
emErrs49.push(err158);
}
}
vErrors = emErrs49;
errors = emErrs49.length;
}
var _valid0 = _errs89 === errors;
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
}
}
const _errs103 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err159 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema60.oneOf[8].required,parentSchema:schema60.oneOf[8],data};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
if(data.name === undefined){
const err160 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema60.oneOf[8].required,parentSchema:schema60.oneOf[8],data};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
if(data.id === undefined){
const err161 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema60.oneOf[8].required,parentSchema:schema60.oneOf[8],data};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
if(data.enabled === undefined){
const err162 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema60.oneOf[8].required,parentSchema:schema60.oneOf[8],data};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
if(data.type !== undefined){
let data42 = data.type;
if(typeof data42 !== "string"){
const err163 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[8].properties.type.type,parentSchema:schema60.oneOf[8].properties.type,data:data42};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
if("mock" !== data42){
const err164 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema60.oneOf[8].properties.type,data:data42};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
if(errors > 0){
const emErrs50 = [];
for(const err165 of vErrors){
if(!err165.emUsed){
emErrs50.push(err165);
}
}
vErrors = emErrs50;
errors = emErrs50.length;
}
}
if(data.id !== undefined){
let data43 = data.id;
if(typeof data43 !== "string"){
const err166 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[8].properties.id.type,parentSchema:schema60.oneOf[8].properties.id,data:data43};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
if(errors > 0){
const emErrs51 = [];
for(const err167 of vErrors){
if(!err167.emUsed){
emErrs51.push(err167);
}
}
vErrors = emErrs51;
errors = emErrs51.length;
}
}
if(data.name !== undefined){
let data44 = data.name;
if(typeof data44 !== "string"){
const err168 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema60.oneOf[8].properties.name.type,parentSchema:schema60.oneOf[8].properties.name,data:data44};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
if(errors > 0){
const emErrs52 = [];
for(const err169 of vErrors){
if(!err169.emUsed){
emErrs52.push(err169);
}
}
vErrors = emErrs52;
errors = emErrs52.length;
}
}
if(data.enabled !== undefined){
let data45 = data.enabled;
if(typeof data45 !== "boolean"){
const err170 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema60.oneOf[8].properties.enabled.type,parentSchema:schema60.oneOf[8].properties.enabled,data:data45};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
if(errors > 0){
const emErrs53 = [];
for(const err171 of vErrors){
if(!err171.emUsed){
emErrs53.push(err171);
}
}
vErrors = emErrs53;
errors = emErrs53.length;
}
}
}
else {
const err172 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema60.oneOf[8].type,parentSchema:schema60.oneOf[8],data};
if(vErrors === null){
vErrors = [err172];
}
else {
vErrors.push(err172);
}
errors++;
}
if(errors > 0){
const emErrors8 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates8 = {required:{}};
let emPropParams8;
let emParamsErrors8;
for(const err173 of vErrors){
if((((((err173.keyword !== "errorMessage") && (!err173.emUsed)) && (err173.instancePath === instancePath)) && (err173.keyword in emErrors8)) && (err173.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8") === 0)) && (/^\/[^\/]*$/.test(err173.schemaPath.slice(84)))){
emPropParams8 = obj0[err173.keyword];
emParamsErrors8 = emErrors8[err173.keyword][err173.params[emPropParams8]];
if(emParamsErrors8){
emParamsErrors8.push(err173);
err173.emUsed = true;
}
}
}
for(const key8 in emErrors8){
for(const keyProp8 in emErrors8[key8]){
emParamsErrors8 = emErrors8[key8][keyProp8];
if(emParamsErrors8.length){
const tmpl8 = templates8[key8] && templates8[key8][keyProp8];
const err174 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors8},message:tmpl8 ? tmpl8() : schema60.oneOf[8].errorMessage[key8][keyProp8],schema:schema60.oneOf[8].errorMessage,parentSchema:schema60.oneOf[8],data};
if(vErrors === null){
vErrors = [err174];
}
else {
vErrors.push(err174);
}
errors++;
}
}
}
const emErrs54 = [];
for(const err175 of vErrors){
if(!err175.emUsed){
emErrs54.push(err175);
}
}
vErrors = emErrs54;
errors = emErrs54.length;
}
var _valid0 = _errs103 === errors;
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
const err176 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema60.oneOf,parentSchema:schema60,data};
if(vErrors === null){
vErrors = [err176];
}
else {
vErrors.push(err176);
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
const err177 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/unevaluatedProperties",keyword:"unevaluatedProperties",params:{unevaluatedProperty: key9},message:"must NOT have unevaluated properties",schema:false,parentSchema:schema60,data};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
}
}
}
}
else {
const err178 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema60.type,parentSchema:schema60,data};
if(vErrors === null){
vErrors = [err178];
}
else {
vErrors.push(err178);
}
errors++;
}
if(errors > 0){
const emErrors9 = {"oneOf":[]};
const templates9 = {};
for(const err179 of vErrors){
if((((((err179.keyword !== "errorMessage") && (!err179.emUsed)) && (err179.instancePath === instancePath)) && (err179.keyword in emErrors9)) && (err179.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items") === 0)) && (/^\/[^\/]*$/.test(err179.schemaPath.slice(76)))){
emErrors9[err179.keyword].push(err179);
err179.emUsed = true;
}
}
for(const key10 in emErrors9){
if(emErrors9[key10].length){
const err180 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors9[key10]},message:key10 in templates9 ? templates9[key10]() : schema60.errorMessage[key10],schema:schema60.errorMessage,parentSchema:schema60,data};
if(vErrors === null){
vErrors = [err180];
}
else {
vErrors.push(err180);
}
errors++;
}
}
const emErrs55 = [];
for(const err181 of vErrors){
if(!err181.emUsed){
emErrs55.push(err181);
}
}
vErrors = emErrs55;
errors = emErrs55.length;
}
validate33.errors = vErrors;
return errors === 0;
}
validate33.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema61 = {"$id":"export11","$ref":"https://github.com/data-fair/agents/settings-put#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/settings-put","x-exports":["validate","types","vjsf"],"title":"Paramètres","layout":{"title":null},"definitions":{"RoleQuota":{"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Illimité","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited","errorMessage":{}},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Limite mensuelle","description":"Limite hebdomadaire = mensuelle / 2, limite journalière = mensuelle / 4","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"Model":{"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":{"pure":false,"type":"js-tpl","dataAlias":"value","expr":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}","ref":18},"itemsResults":{"pure":true,"type":"js-eval","dataAlias":"body","expr":"data.results","ref":21},"itemTitle":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","ref":19},"itemKey":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"item.id","ref":20},"returnObjects":true}},"properties":{"id":{"type":"string","title":"Model ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id","errorMessage":{}},"name":{"type":"string","title":"Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name","errorMessage":{}},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type","errorMessage":{}},"name":{"type":"string","title":"Provider Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name","errorMessage":{}},"id":{"type":"string","title":"Provider ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider","errorMessage":{"required":{"type":"information obligatoire","name":"information obligatoire","id":"information obligatoire"}}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}}},"type":"object","additionalProperties":false,"required":["providers"],"properties":{"createdAt":{"type":"string","format":"date-time","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/createdAt","errorMessage":{}},"updatedAt":{"type":"string","format":"date-time","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/updatedAt","errorMessage":{}},"storeTraces":{"type":"boolean","title":"Enregistrer les traces de conversation","description":"Si activé, les conversations des utilisateurs consentants sont enregistrées sur le serveur pendant 30 jours pour relecture par un administrateur. Chaque utilisateur doit explicitement accepter.","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/storeTraces","errorMessage":{}},"moderation":{"type":"object","title":"Modération des entrées","layout":{"if":"parent.data.providers?.length"},"default":{"enabled":false,"categories":["anonymous","external"]},"required":["enabled","categories"],"additionalProperties":false,"properties":{"enabled":{"type":"boolean","title":"Activer la modération des entrées","description":"Si activé, le dernier message utilisateur de chaque requête provenant d'une catégorie modérée est classé avant la réponse du modèle.","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/enabled","errorMessage":{}},"categories":{"type":"array","uniqueItems":true,"default":["anonymous","external"],"title":"Catégories d'utilisateurs modérées","description":"Catégories d'utilisateurs dont les requêtes sont vérifiées par le filtre lorsque la modération est activée.","items":{"type":"string","oneOf":[{"const":"anonymous","title":"Anonyme"},{"const":"external","title":"Externe"},{"const":"user","title":"Utilisateur"},{"const":"contrib","title":"Contributeur"},{"const":"admin","title":"Administrateur"}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items","errorMessage":{"oneOf":"choisissez une valeur"}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation","errorMessage":{"required":{"enabled":"information obligatoire","categories":"information obligatoire"}}},"owner":{"type":"object","additionalProperties":false,"required":["type","id"],"readOnly":true,"properties":{"type":{"type":"string","enum":["user","organization"],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/type","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/name","errorMessage":{}},"department":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/department","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire"}}},"providers":{"type":"array","title":"Fournisseurs IA","layout":{"itemTitle":"item ? `${item.name || \"\"} - ${item.id.slice(0, 8)}` : \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","title":"Fournisseur","unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}},{"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Scaleway\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","apiKey":"information obligatoire"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Compatible OpenAI","description":"Fournisseur générique pour tout endpoint compatible OpenAI (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). La clé API est optionnelle pour les serveurs locaux sans authentification.","properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"OpenAI Compatible\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled","errorMessage":{}},"baseURL":{"type":"string","title":"URL de base","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"Clé API","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire","baseURL":"information obligatoire"}}},{"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type","errorMessage":{}},"id":{"type":"string","title":"ID du fournisseur","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id","errorMessage":{}},"name":{"type":"string","title":"Nom d'affichage","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Activé","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8","errorMessage":{"required":{"type":"information obligatoire","id":"information obligatoire","name":"information obligatoire","enabled":"information obligatoire"}}}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items","errorMessage":{"oneOf":"choisissez une valeur"}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers","errorMessage":{}},"models":{"type":"object","title":"Modèles","layout":{"title":null,"if":"parent.data.providers?.length"},"default":{},"properties":{"assistant":{"type":"object","title":"Assistant","description":"L'interface conversationnelle principale. Équilibré pour le raisonnement, le suivi d'instructions et l'interaction naturelle. Ce modèle gère le flux de haut niveau et délègue les tâches complexes aux sous-agents.\n\nRecommandations : GPT-5.4, Claude 4.5 Sonnet, Kimi K2, Mistral Large 3, etc.","layout":{"comp":"card","children":[{"key":"model"},{"key":"inputPricePerMillion","cols":6},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Modèle","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}},"inputPricePerMillion":{"type":"number","title":"Prix d'entrée (par million de tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/inputPricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Prix de sortie (par million de tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant","errorMessage":{}},"tools":{"type":"object","title":"Outils","description":"Le « technicien ». Spécialisé dans les données structurées et l'interaction avec les API. Il excelle à enchaîner plusieurs appels d'outils sans remplissage conversationnel, garantissant une haute fiabilité dans les workflows automatisés.\n\nRecommandations : GPT-5.4 Mini, Mistral DevStral, Claude 4.5 Sonnet (Computer Use), MiMo-V2-Flash, etc.","layout":{"comp":"card","children":[{"key":"model"},{"key":"inputPricePerMillion","cols":6},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Modèle","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}},"inputPricePerMillion":{"type":"number","title":"Prix d'entrée (par million de tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/inputPricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Prix de sortie (par million de tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools","errorMessage":{}},"summarizer":{"type":"object","title":"Résumeur","description":"Un spécialiste de la « synthèse ». Optimisé pour extraire rapidement les points clés de blocs de texte petits à moyens. Il privilégie la densité d'information et la concision pour garder les fenêtres de contexte légères et les coûts bas.\n\nRecommandations : GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Qwen3 (8B), etc.","layout":{"comp":"card","children":[{"key":"model"},{"key":"inputPricePerMillion","cols":6},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Modèle","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}},"inputPricePerMillion":{"type":"number","title":"Prix d'entrée (par million de tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/inputPricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Prix de sortie (par million de tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer","errorMessage":{}},"evaluator":{"type":"object","title":"Évaluateur","description":"Le « contrôleur qualité ». Analyse la logique de l'assistant et les sorties des outils pour vérifier la précision et la sécurité. Il nécessite les capacités de raisonnement les plus élevées pour servir de référence fiable pour les performances du système.\n\nRecommandations : Claude Opus 4.6, GPT-5.4 (Reasoning), DeepSeek-R1, Pharia-1-LLM, etc.","layout":{"comp":"card","children":[{"key":"model"},{"key":"inputPricePerMillion","cols":6},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Modèle","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}},"inputPricePerMillion":{"type":"number","title":"Prix d'entrée (par million de tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/inputPricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Prix de sortie (par million de tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator","errorMessage":{}},"moderator":{"type":"object","title":"Modérateur","description":"Le « gardien ». Classe chaque nouveau message utilisateur (grossièretés, injection de prompt, usurpation de persona, demandes hors périmètre). Doit être rapide et peu coûteux — il se trouve sur le chemin critique vers le premier token de réponse.\n\nRecommandations : un modèle généraliste petit et rapide avec support de sortie structurée (JSON), par ex. Claude 4.5 Haiku, GPT-5.4 Mini, Mistral Small 4, Qwen3 (4B). Les classifieurs de modération dédiés (Llama Guard, API de modération) ne sont pas compatibles : leurs taxonomies et formats de sortie fixes ne peuvent pas exprimer la politique spécifique de cette plateforme.","layout":{"comp":"card","children":[{"key":"model"},{"key":"inputPricePerMillion","cols":6},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Modèle","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}},"inputPricePerMillion":{"type":"number","title":"Prix d'entrée (par million de tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/inputPricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Prix de sortie (par million de tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models","errorMessage":{}},"quotas":{"type":"object","title":"Quotas par rôle","layout":{"title":null,"if":"parent.data.providers?.length","children":[{"key":"global","cols":{"sm":6,"md":4}},{"key":"admin","cols":{"sm":6,"md":4}},{"key":"contrib","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"user","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"external","cols":{"sm":6,"md":4}},{"key":"anonymous","cols":{"sm":6,"md":4}},{"key":"untrusted","cols":{"sm":6,"md":4}}]},"required":["global","admin","contrib","user","external","anonymous"],"default":{"global":{"unlimited":false,"monthlyLimit":10},"admin":{"unlimited":true,"monthlyLimit":0},"contrib":{"unlimited":false,"monthlyLimit":0},"user":{"unlimited":false,"monthlyLimit":0},"external":{"unlimited":false,"monthlyLimit":0},"anonymous":{"unlimited":false,"monthlyLimit":0},"untrusted":{"unlimited":false,"monthlyLimit":0}},"properties":{"global":{"$ref":"#/definitions/RoleQuota","title":"Quotas globaux","default":{"unlimited":false,"monthlyLimit":10},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/global","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"admin":{"$ref":"#/definitions/RoleQuota","title":"Quotas administrateur","default":{"unlimited":true,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/admin","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"contrib":{"$ref":"#/definitions/RoleQuota","title":"Quotas contributeur","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/contrib","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"user":{"$ref":"#/definitions/RoleQuota","title":"Quotas utilisateur simple","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/user","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"external":{"$ref":"#/definitions/RoleQuota","title":"Quotas utilisateur externe","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/external","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"anonymous":{"$ref":"#/definitions/RoleQuota","title":"Quotas utilisateur anonyme","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/anonymous","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}},"untrusted":{"$ref":"#/definitions/RoleQuota","title":"Réserve anonyme + externe","description":"Plafond agrégé partagé par l'ensemble des usages anonymes et externes, afin que le trafic non fiable ne puisse pas consommer tout le budget du compte. 0 = pas de plafond de réserve.","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/untrusted","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas","errorMessage":{"required":{"global":"information obligatoire","admin":"information obligatoire","contrib":"information obligatoire","user":"information obligatoire","external":"information obligatoire","anonymous":"information obligatoire"}}}},"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"__pointer":"https://github.com/data-fair/agents/settings-put#","errorMessage":{"required":{"providers":"information obligatoire"}}};
const schema28 = {"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":{"pure":false,"type":"js-tpl","dataAlias":"value","expr":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}","ref":18},"itemsResults":{"pure":true,"type":"js-eval","dataAlias":"body","expr":"data.results","ref":21},"itemTitle":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","ref":19},"itemKey":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"item.id","ref":20},"returnObjects":true}},"properties":{"id":{"type":"string","title":"Model ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id","errorMessage":{}},"name":{"type":"string","title":"Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name","errorMessage":{}},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type","errorMessage":{}},"name":{"type":"string","title":"Provider Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name","errorMessage":{}},"id":{"type":"string","title":"Provider ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider","errorMessage":{"required":{"type":"information obligatoire","name":"information obligatoire","id":"information obligatoire"}}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model","errorMessage":{"required":{"id":"information obligatoire","name":"information obligatoire","provider":"information obligatoire"}}};
const schema33 = {"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Illimité","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited","errorMessage":{}},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Limite mensuelle","description":"Limite hebdomadaire = mensuelle / 2, limite journalière = mensuelle / 4","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota","errorMessage":{"required":{"unlimited":"information obligatoire","monthlyLimit":"information obligatoire"}}};
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
if(!((((((((key0 === "createdAt") || (key0 === "updatedAt")) || (key0 === "storeTraces")) || (key0 === "moderation")) || (key0 === "owner")) || (key0 === "providers")) || (key0 === "models")) || (key0 === "quotas"))){
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
if(data.moderation !== undefined){
let data3 = data.moderation;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.enabled === undefined){
const err10 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.moderation.required,parentSchema:schema27.properties.moderation,data:data3};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data3.categories === undefined){
const err11 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/required",keyword:"required",params:{missingProperty: "categories"},message:"must have required property '"+"categories"+"'",schema:schema27.properties.moderation.required,parentSchema:schema27.properties.moderation,data:data3};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
for(const key1 in data3){
if(!((key1 === "enabled") || (key1 === "categories"))){
const err12 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.moderation,data:data3};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data3.enabled !== undefined){
let data4 = data3.enabled;
if(typeof data4 !== "boolean"){
const err13 = {instancePath:instancePath+"/moderation/enabled",schemaPath:"#/properties/moderation/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.moderation.properties.enabled.type,parentSchema:schema27.properties.moderation.properties.enabled,data:data4};
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
if(data3.categories !== undefined){
let data5 = data3.categories;
if(Array.isArray(data5)){
const len0 = data5.length;
for(let i0=0; i0<len0; i0++){
let data6 = data5[i0];
if(typeof data6 !== "string"){
const err15 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.moderation.properties.categories.items.type,parentSchema:schema27.properties.moderation.properties.categories.items,data:data6};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
const _errs17 = errors;
let valid4 = false;
let passing0 = null;
const _errs18 = errors;
if("anonymous" !== data6){
const err16 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/0/const",keyword:"const",params:{allowedValue: "anonymous"},message:"must be equal to constant",schema:"anonymous",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[0],data:data6};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
var _valid0 = _errs18 === errors;
if(_valid0){
valid4 = true;
passing0 = 0;
}
const _errs19 = errors;
if("external" !== data6){
const err17 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/1/const",keyword:"const",params:{allowedValue: "external"},message:"must be equal to constant",schema:"external",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[1],data:data6};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
var _valid0 = _errs19 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid4 = true;
passing0 = 1;
}
const _errs20 = errors;
if("user" !== data6){
const err18 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/2/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[2],data:data6};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
var _valid0 = _errs20 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid4 = true;
passing0 = 2;
}
const _errs21 = errors;
if("contrib" !== data6){
const err19 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/3/const",keyword:"const",params:{allowedValue: "contrib"},message:"must be equal to constant",schema:"contrib",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[3],data:data6};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
var _valid0 = _errs21 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid4 = true;
passing0 = 3;
}
const _errs22 = errors;
if("admin" !== data6){
const err20 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/4/const",keyword:"const",params:{allowedValue: "admin"},message:"must be equal to constant",schema:"admin",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[4],data:data6};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
var _valid0 = _errs22 === errors;
if(_valid0 && valid4){
valid4 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid4 = true;
passing0 = 4;
}
}
}
}
}
if(!valid4){
const err21 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema27.properties.moderation.properties.categories.items.oneOf,parentSchema:schema27.properties.moderation.properties.categories.items,data:data6};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
else {
errors = _errs17;
if(vErrors !== null){
if(_errs17){
vErrors.length = _errs17;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors0 = {"oneOf":[]};
const templates0 = {};
for(const err22 of vErrors){
if((((((err22.keyword !== "errorMessage") && (!err22.emUsed)) && (err22.instancePath === instancePath+"/moderation/categories/" + i0)) && (err22.keyword in emErrors0)) && (err22.schemaPath.indexOf("#/properties/moderation/properties/categories/items") === 0)) && (/^\/[^\/]*$/.test(err22.schemaPath.slice(51)))){
emErrors0[err22.keyword].push(err22);
err22.emUsed = true;
}
}
for(const key2 in emErrors0){
if(emErrors0[key2].length){
const err23 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"#/properties/moderation/properties/categories/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors0[key2]},message:key2 in templates0 ? templates0[key2]() : schema27.properties.moderation.properties.categories.items.errorMessage[key2],schema:schema27.properties.moderation.properties.categories.items.errorMessage,parentSchema:schema27.properties.moderation.properties.categories.items,data:data6};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
const emErrs4 = [];
for(const err24 of vErrors){
if(!err24.emUsed){
emErrs4.push(err24);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
let i1 = data5.length;
let j0;
if(i1 > 1){
const indices0 = {};
for(;i1--;){
let item0 = data5[i1];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err25 = {instancePath:instancePath+"/moderation/categories",schemaPath:"#/properties/moderation/properties/categories/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)",schema:true,parentSchema:schema27.properties.moderation.properties.categories,data:data5};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err26 = {instancePath:instancePath+"/moderation/categories",schemaPath:"#/properties/moderation/properties/categories/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.moderation.properties.categories.type,parentSchema:schema27.properties.moderation.properties.categories,data:data5};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err27 of vErrors){
if(!err27.emUsed){
emErrs5.push(err27);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
}
else {
const err28 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.moderation.type,parentSchema:schema27.properties.moderation,data:data3};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"enabled":[],"categories":[]}};
const templates1 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err29 of vErrors){
if((((((err29.keyword !== "errorMessage") && (!err29.emUsed)) && (err29.instancePath === instancePath+"/moderation")) && (err29.keyword in emErrors1)) && (err29.schemaPath.indexOf("#/properties/moderation") === 0)) && (/^\/[^\/]*$/.test(err29.schemaPath.slice(23)))){
emPropParams0 = obj0[err29.keyword];
emParamsErrors0 = emErrors1[err29.keyword][err29.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err29);
err29.emUsed = true;
}
}
}
for(const key3 in emErrors1){
for(const keyProp0 in emErrors1[key3]){
emParamsErrors0 = emErrors1[key3][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates1[key3] && templates1[key3][keyProp0];
const err30 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.moderation.errorMessage[key3][keyProp0],schema:schema27.properties.moderation.errorMessage,parentSchema:schema27.properties.moderation,data:data3};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
}
const emErrs6 = [];
for(const err31 of vErrors){
if(!err31.emUsed){
emErrs6.push(err31);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
if(data.owner !== undefined){
let data7 = data.owner;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.type === undefined){
const err32 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.owner.required,parentSchema:schema27.properties.owner,data:data7};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(data7.id === undefined){
const err33 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.owner.required,parentSchema:schema27.properties.owner,data:data7};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
for(const key4 in data7){
if(!((((key4 === "type") || (key4 === "id")) || (key4 === "name")) || (key4 === "department"))){
const err34 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.owner,data:data7};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data7.type !== undefined){
let data8 = data7.type;
if(typeof data8 !== "string"){
const err35 = {instancePath:instancePath+"/owner/type",schemaPath:"#/properties/owner/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.type.type,parentSchema:schema27.properties.owner.properties.type,data:data8};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(!((data8 === "user") || (data8 === "organization"))){
const err36 = {instancePath:instancePath+"/owner/type",schemaPath:"#/properties/owner/properties/type/enum",keyword:"enum",params:{allowedValues: schema27.properties.owner.properties.type.enum},message:"must be equal to one of the allowed values",schema:schema27.properties.owner.properties.type.enum,parentSchema:schema27.properties.owner.properties.type,data:data8};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err37 of vErrors){
if(!err37.emUsed){
emErrs7.push(err37);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data7.id !== undefined){
let data9 = data7.id;
if(typeof data9 !== "string"){
const err38 = {instancePath:instancePath+"/owner/id",schemaPath:"#/properties/owner/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.id.type,parentSchema:schema27.properties.owner.properties.id,data:data9};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err39 of vErrors){
if(!err39.emUsed){
emErrs8.push(err39);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
if(data7.name !== undefined){
let data10 = data7.name;
if(typeof data10 !== "string"){
const err40 = {instancePath:instancePath+"/owner/name",schemaPath:"#/properties/owner/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.name.type,parentSchema:schema27.properties.owner.properties.name,data:data10};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err41 of vErrors){
if(!err41.emUsed){
emErrs9.push(err41);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
if(data7.department !== undefined){
let data11 = data7.department;
if(typeof data11 !== "string"){
const err42 = {instancePath:instancePath+"/owner/department",schemaPath:"#/properties/owner/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.department.type,parentSchema:schema27.properties.owner.properties.department,data:data11};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err43 of vErrors){
if(!err43.emUsed){
emErrs10.push(err43);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
}
else {
const err44 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.owner.type,parentSchema:schema27.properties.owner,data:data7};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"type":[],"id":[]}};
const templates2 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err45 of vErrors){
if((((((err45.keyword !== "errorMessage") && (!err45.emUsed)) && (err45.instancePath === instancePath+"/owner")) && (err45.keyword in emErrors2)) && (err45.schemaPath.indexOf("#/properties/owner") === 0)) && (/^\/[^\/]*$/.test(err45.schemaPath.slice(18)))){
emPropParams1 = obj0[err45.keyword];
emParamsErrors1 = emErrors2[err45.keyword][err45.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err45);
err45.emUsed = true;
}
}
}
for(const key5 in emErrors2){
for(const keyProp1 in emErrors2[key5]){
emParamsErrors1 = emErrors2[key5][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates2[key5] && templates2[key5][keyProp1];
const err46 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.properties.owner.errorMessage[key5][keyProp1],schema:schema27.properties.owner.errorMessage,parentSchema:schema27.properties.owner,data:data7};
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
const emErrs11 = [];
for(const err47 of vErrors){
if(!err47.emUsed){
emErrs11.push(err47);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
}
if(data.providers !== undefined){
let data12 = data.providers;
if(Array.isArray(data12)){
const len1 = data12.length;
for(let i2=0; i2<len1; i2++){
let data13 = data12[i2];
const _errs38 = errors;
let valid9 = false;
let passing1 = null;
const _errs39 = errors;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.type === undefined){
const err48 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data13};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data13.name === undefined){
const err49 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data13};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(data13.id === undefined){
const err50 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data13};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(data13.enabled === undefined){
const err51 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data13};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(data13.type !== undefined){
let data14 = data13.type;
if(typeof data14 !== "string"){
const err52 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.type,data:data14};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if("openai" !== data14){
const err53 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema27.properties.providers.items.oneOf[0].properties.type,data:data14};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err54 of vErrors){
if(!err54.emUsed){
emErrs12.push(err54);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
if(data13.id !== undefined){
let data15 = data13.id;
if(typeof data15 !== "string"){
const err55 = {instancePath:instancePath+"/providers/" + i2+"/id",schemaPath:"#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.id,data:data15};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err56 of vErrors){
if(!err56.emUsed){
emErrs13.push(err56);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
if(data13.name !== undefined){
let data16 = data13.name;
if(typeof data16 !== "string"){
const err57 = {instancePath:instancePath+"/providers/" + i2+"/name",schemaPath:"#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.name,data:data16};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(errors > 0){
const emErrs14 = [];
for(const err58 of vErrors){
if(!err58.emUsed){
emErrs14.push(err58);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
if(data13.enabled !== undefined){
let data17 = data13.enabled;
if(typeof data17 !== "boolean"){
const err59 = {instancePath:instancePath+"/providers/" + i2+"/enabled",schemaPath:"#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[0].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.enabled,data:data17};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(errors > 0){
const emErrs15 = [];
for(const err60 of vErrors){
if(!err60.emUsed){
emErrs15.push(err60);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
if(data13.apiKey !== undefined){
let data18 = data13.apiKey;
if(typeof data18 !== "string"){
const err61 = {instancePath:instancePath+"/providers/" + i2+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.apiKey,data:data18};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err62 of vErrors){
if(!err62.emUsed){
emErrs16.push(err62);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
}
else {
const err63 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[0].type,parentSchema:schema27.properties.providers.items.oneOf[0],data:data13};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(errors > 0){
const emErrors3 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates3 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err64 of vErrors){
if((((((err64.keyword !== "errorMessage") && (!err64.emUsed)) && (err64.instancePath === instancePath+"/providers/" + i2)) && (err64.keyword in emErrors3)) && (err64.schemaPath.indexOf("#/properties/providers/items/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err64.schemaPath.slice(36)))){
emPropParams2 = obj0[err64.keyword];
emParamsErrors2 = emErrors3[err64.keyword][err64.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err64);
err64.emUsed = true;
}
}
}
for(const key6 in emErrors3){
for(const keyProp2 in emErrors3[key6]){
emParamsErrors2 = emErrors3[key6][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates3[key6] && templates3[key6][keyProp2];
const err65 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema27.properties.providers.items.oneOf[0].errorMessage[key6][keyProp2],schema:schema27.properties.providers.items.oneOf[0].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[0],data:data13};
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
const emErrs17 = [];
for(const err66 of vErrors){
if(!err66.emUsed){
emErrs17.push(err66);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
var _valid1 = _errs39 === errors;
if(_valid1){
valid9 = true;
passing1 = 0;
var props0 = {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
const _errs51 = errors;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.type === undefined){
const err67 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data13};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(data13.name === undefined){
const err68 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data13};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(data13.id === undefined){
const err69 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data13};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(data13.enabled === undefined){
const err70 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data13};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(data13.type !== undefined){
let data19 = data13.type;
if(typeof data19 !== "string"){
const err71 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.type,data:data19};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if("anthropic" !== data19){
const err72 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant",schema:"anthropic",parentSchema:schema27.properties.providers.items.oneOf[1].properties.type,data:data19};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(errors > 0){
const emErrs18 = [];
for(const err73 of vErrors){
if(!err73.emUsed){
emErrs18.push(err73);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
}
if(data13.id !== undefined){
let data20 = data13.id;
if(typeof data20 !== "string"){
const err74 = {instancePath:instancePath+"/providers/" + i2+"/id",schemaPath:"#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.id,data:data20};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(errors > 0){
const emErrs19 = [];
for(const err75 of vErrors){
if(!err75.emUsed){
emErrs19.push(err75);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
}
if(data13.name !== undefined){
let data21 = data13.name;
if(typeof data21 !== "string"){
const err76 = {instancePath:instancePath+"/providers/" + i2+"/name",schemaPath:"#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.name,data:data21};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err77 of vErrors){
if(!err77.emUsed){
emErrs20.push(err77);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
if(data13.enabled !== undefined){
let data22 = data13.enabled;
if(typeof data22 !== "boolean"){
const err78 = {instancePath:instancePath+"/providers/" + i2+"/enabled",schemaPath:"#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[1].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.enabled,data:data22};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if(errors > 0){
const emErrs21 = [];
for(const err79 of vErrors){
if(!err79.emUsed){
emErrs21.push(err79);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
if(data13.apiKey !== undefined){
let data23 = data13.apiKey;
if(typeof data23 !== "string"){
const err80 = {instancePath:instancePath+"/providers/" + i2+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.apiKey,data:data23};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(errors > 0){
const emErrs22 = [];
for(const err81 of vErrors){
if(!err81.emUsed){
emErrs22.push(err81);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
}
}
else {
const err82 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[1].type,parentSchema:schema27.properties.providers.items.oneOf[1],data:data13};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if(errors > 0){
const emErrors4 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates4 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err83 of vErrors){
if((((((err83.keyword !== "errorMessage") && (!err83.emUsed)) && (err83.instancePath === instancePath+"/providers/" + i2)) && (err83.keyword in emErrors4)) && (err83.schemaPath.indexOf("#/properties/providers/items/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err83.schemaPath.slice(36)))){
emPropParams3 = obj0[err83.keyword];
emParamsErrors3 = emErrors4[err83.keyword][err83.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err83);
err83.emUsed = true;
}
}
}
for(const key7 in emErrors4){
for(const keyProp3 in emErrors4[key7]){
emParamsErrors3 = emErrors4[key7][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates4[key7] && templates4[key7][keyProp3];
const err84 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema27.properties.providers.items.oneOf[1].errorMessage[key7][keyProp3],schema:schema27.properties.providers.items.oneOf[1].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[1],data:data13};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
}
const emErrs23 = [];
for(const err85 of vErrors){
if(!err85.emUsed){
emErrs23.push(err85);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
var _valid1 = _errs51 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid9 = true;
passing1 = 1;
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
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.type === undefined){
const err86 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data13};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
if(data13.name === undefined){
const err87 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data13};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
if(data13.id === undefined){
const err88 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data13};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if(data13.enabled === undefined){
const err89 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data13};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if(data13.type !== undefined){
let data24 = data13.type;
if(typeof data24 !== "string"){
const err90 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.type,data:data24};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
if("google" !== data24){
const err91 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant",schema:"google",parentSchema:schema27.properties.providers.items.oneOf[2].properties.type,data:data24};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if(errors > 0){
const emErrs24 = [];
for(const err92 of vErrors){
if(!err92.emUsed){
emErrs24.push(err92);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
if(data13.id !== undefined){
let data25 = data13.id;
if(typeof data25 !== "string"){
const err93 = {instancePath:instancePath+"/providers/" + i2+"/id",schemaPath:"#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.id,data:data25};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err94 of vErrors){
if(!err94.emUsed){
emErrs25.push(err94);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
if(data13.name !== undefined){
let data26 = data13.name;
if(typeof data26 !== "string"){
const err95 = {instancePath:instancePath+"/providers/" + i2+"/name",schemaPath:"#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.name,data:data26};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err96 of vErrors){
if(!err96.emUsed){
emErrs26.push(err96);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
if(data13.enabled !== undefined){
let data27 = data13.enabled;
if(typeof data27 !== "boolean"){
const err97 = {instancePath:instancePath+"/providers/" + i2+"/enabled",schemaPath:"#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[2].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.enabled,data:data27};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
if(errors > 0){
const emErrs27 = [];
for(const err98 of vErrors){
if(!err98.emUsed){
emErrs27.push(err98);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
}
if(data13.apiKey !== undefined){
let data28 = data13.apiKey;
if(typeof data28 !== "string"){
const err99 = {instancePath:instancePath+"/providers/" + i2+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.apiKey,data:data28};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
if(errors > 0){
const emErrs28 = [];
for(const err100 of vErrors){
if(!err100.emUsed){
emErrs28.push(err100);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
}
}
else {
const err101 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[2].type,parentSchema:schema27.properties.providers.items.oneOf[2],data:data13};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
if(errors > 0){
const emErrors5 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates5 = {required:{}};
let emPropParams4;
let emParamsErrors4;
for(const err102 of vErrors){
if((((((err102.keyword !== "errorMessage") && (!err102.emUsed)) && (err102.instancePath === instancePath+"/providers/" + i2)) && (err102.keyword in emErrors5)) && (err102.schemaPath.indexOf("#/properties/providers/items/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err102.schemaPath.slice(36)))){
emPropParams4 = obj0[err102.keyword];
emParamsErrors4 = emErrors5[err102.keyword][err102.params[emPropParams4]];
if(emParamsErrors4){
emParamsErrors4.push(err102);
err102.emUsed = true;
}
}
}
for(const key8 in emErrors5){
for(const keyProp4 in emErrors5[key8]){
emParamsErrors4 = emErrors5[key8][keyProp4];
if(emParamsErrors4.length){
const tmpl4 = templates5[key8] && templates5[key8][keyProp4];
const err103 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema27.properties.providers.items.oneOf[2].errorMessage[key8][keyProp4],schema:schema27.properties.providers.items.oneOf[2].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[2],data:data13};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
}
const emErrs29 = [];
for(const err104 of vErrors){
if(!err104.emUsed){
emErrs29.push(err104);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
var _valid1 = _errs63 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid9 = true;
passing1 = 2;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
}
const _errs75 = errors;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.type === undefined){
const err105 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data13};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if(data13.name === undefined){
const err106 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data13};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
if(data13.id === undefined){
const err107 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data13};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(data13.enabled === undefined){
const err108 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data13};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
if(data13.type !== undefined){
let data29 = data13.type;
if(typeof data29 !== "string"){
const err109 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.type,data:data29};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if("mistral" !== data29){
const err110 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant",schema:"mistral",parentSchema:schema27.properties.providers.items.oneOf[3].properties.type,data:data29};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
if(errors > 0){
const emErrs30 = [];
for(const err111 of vErrors){
if(!err111.emUsed){
emErrs30.push(err111);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
}
if(data13.id !== undefined){
let data30 = data13.id;
if(typeof data30 !== "string"){
const err112 = {instancePath:instancePath+"/providers/" + i2+"/id",schemaPath:"#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.id,data:data30};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
if(errors > 0){
const emErrs31 = [];
for(const err113 of vErrors){
if(!err113.emUsed){
emErrs31.push(err113);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
}
if(data13.name !== undefined){
let data31 = data13.name;
if(typeof data31 !== "string"){
const err114 = {instancePath:instancePath+"/providers/" + i2+"/name",schemaPath:"#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.name,data:data31};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
if(errors > 0){
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
if(data13.enabled !== undefined){
let data32 = data13.enabled;
if(typeof data32 !== "boolean"){
const err116 = {instancePath:instancePath+"/providers/" + i2+"/enabled",schemaPath:"#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[3].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.enabled,data:data32};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
if(errors > 0){
const emErrs33 = [];
for(const err117 of vErrors){
if(!err117.emUsed){
emErrs33.push(err117);
}
}
vErrors = emErrs33;
errors = emErrs33.length;
}
}
if(data13.apiKey !== undefined){
let data33 = data13.apiKey;
if(typeof data33 !== "string"){
const err118 = {instancePath:instancePath+"/providers/" + i2+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.apiKey,data:data33};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if(errors > 0){
const emErrs34 = [];
for(const err119 of vErrors){
if(!err119.emUsed){
emErrs34.push(err119);
}
}
vErrors = emErrs34;
errors = emErrs34.length;
}
}
}
else {
const err120 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[3].type,parentSchema:schema27.properties.providers.items.oneOf[3],data:data13};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
if(errors > 0){
const emErrors6 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates6 = {required:{}};
let emPropParams5;
let emParamsErrors5;
for(const err121 of vErrors){
if((((((err121.keyword !== "errorMessage") && (!err121.emUsed)) && (err121.instancePath === instancePath+"/providers/" + i2)) && (err121.keyword in emErrors6)) && (err121.schemaPath.indexOf("#/properties/providers/items/oneOf/3") === 0)) && (/^\/[^\/]*$/.test(err121.schemaPath.slice(36)))){
emPropParams5 = obj0[err121.keyword];
emParamsErrors5 = emErrors6[err121.keyword][err121.params[emPropParams5]];
if(emParamsErrors5){
emParamsErrors5.push(err121);
err121.emUsed = true;
}
}
}
for(const key9 in emErrors6){
for(const keyProp5 in emErrors6[key9]){
emParamsErrors5 = emErrors6[key9][keyProp5];
if(emParamsErrors5.length){
const tmpl5 = templates6[key9] && templates6[key9][keyProp5];
const err122 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors5},message:tmpl5 ? tmpl5() : schema27.properties.providers.items.oneOf[3].errorMessage[key9][keyProp5],schema:schema27.properties.providers.items.oneOf[3].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[3],data:data13};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
}
}
const emErrs35 = [];
for(const err123 of vErrors){
if(!err123.emUsed){
emErrs35.push(err123);
}
}
vErrors = emErrs35;
errors = emErrs35.length;
}
var _valid1 = _errs75 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 3];
}
else {
if(_valid1){
valid9 = true;
passing1 = 3;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
}
const _errs87 = errors;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.type === undefined){
const err124 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data13};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
if(data13.name === undefined){
const err125 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data13};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
if(data13.id === undefined){
const err126 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data13};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
if(data13.enabled === undefined){
const err127 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data13};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
if(data13.type !== undefined){
let data34 = data13.type;
if(typeof data34 !== "string"){
const err128 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.type,data:data34};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
if("openrouter" !== data34){
const err129 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant",schema:"openrouter",parentSchema:schema27.properties.providers.items.oneOf[4].properties.type,data:data34};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
if(errors > 0){
const emErrs36 = [];
for(const err130 of vErrors){
if(!err130.emUsed){
emErrs36.push(err130);
}
}
vErrors = emErrs36;
errors = emErrs36.length;
}
}
if(data13.id !== undefined){
let data35 = data13.id;
if(typeof data35 !== "string"){
const err131 = {instancePath:instancePath+"/providers/" + i2+"/id",schemaPath:"#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.id,data:data35};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
if(errors > 0){
const emErrs37 = [];
for(const err132 of vErrors){
if(!err132.emUsed){
emErrs37.push(err132);
}
}
vErrors = emErrs37;
errors = emErrs37.length;
}
}
if(data13.name !== undefined){
let data36 = data13.name;
if(typeof data36 !== "string"){
const err133 = {instancePath:instancePath+"/providers/" + i2+"/name",schemaPath:"#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.name,data:data36};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
if(errors > 0){
const emErrs38 = [];
for(const err134 of vErrors){
if(!err134.emUsed){
emErrs38.push(err134);
}
}
vErrors = emErrs38;
errors = emErrs38.length;
}
}
if(data13.enabled !== undefined){
let data37 = data13.enabled;
if(typeof data37 !== "boolean"){
const err135 = {instancePath:instancePath+"/providers/" + i2+"/enabled",schemaPath:"#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[4].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.enabled,data:data37};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
if(errors > 0){
const emErrs39 = [];
for(const err136 of vErrors){
if(!err136.emUsed){
emErrs39.push(err136);
}
}
vErrors = emErrs39;
errors = emErrs39.length;
}
}
if(data13.apiKey !== undefined){
let data38 = data13.apiKey;
if(typeof data38 !== "string"){
const err137 = {instancePath:instancePath+"/providers/" + i2+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.apiKey,data:data38};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
if(errors > 0){
const emErrs40 = [];
for(const err138 of vErrors){
if(!err138.emUsed){
emErrs40.push(err138);
}
}
vErrors = emErrs40;
errors = emErrs40.length;
}
}
}
else {
const err139 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[4].type,parentSchema:schema27.properties.providers.items.oneOf[4],data:data13};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
if(errors > 0){
const emErrors7 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates7 = {required:{}};
let emPropParams6;
let emParamsErrors6;
for(const err140 of vErrors){
if((((((err140.keyword !== "errorMessage") && (!err140.emUsed)) && (err140.instancePath === instancePath+"/providers/" + i2)) && (err140.keyword in emErrors7)) && (err140.schemaPath.indexOf("#/properties/providers/items/oneOf/4") === 0)) && (/^\/[^\/]*$/.test(err140.schemaPath.slice(36)))){
emPropParams6 = obj0[err140.keyword];
emParamsErrors6 = emErrors7[err140.keyword][err140.params[emPropParams6]];
if(emParamsErrors6){
emParamsErrors6.push(err140);
err140.emUsed = true;
}
}
}
for(const key10 in emErrors7){
for(const keyProp6 in emErrors7[key10]){
emParamsErrors6 = emErrors7[key10][keyProp6];
if(emParamsErrors6.length){
const tmpl6 = templates7[key10] && templates7[key10][keyProp6];
const err141 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/4/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema27.properties.providers.items.oneOf[4].errorMessage[key10][keyProp6],schema:schema27.properties.providers.items.oneOf[4].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[4],data:data13};
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
const emErrs41 = [];
for(const err142 of vErrors){
if(!err142.emUsed){
emErrs41.push(err142);
}
}
vErrors = emErrs41;
errors = emErrs41.length;
}
var _valid1 = _errs87 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 4];
}
else {
if(_valid1){
valid9 = true;
passing1 = 4;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
}
const _errs99 = errors;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.type === undefined){
const err143 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data13};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
if(data13.name === undefined){
const err144 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data13};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
if(data13.id === undefined){
const err145 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data13};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
if(data13.enabled === undefined){
const err146 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data13};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
if(data13.baseURL === undefined){
const err147 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data13};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
if(data13.type !== undefined){
let data39 = data13.type;
if(typeof data39 !== "string"){
const err148 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.type,data:data39};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
if("ollama" !== data39){
const err149 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant",schema:"ollama",parentSchema:schema27.properties.providers.items.oneOf[5].properties.type,data:data39};
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
if(data13.id !== undefined){
let data40 = data13.id;
if(typeof data40 !== "string"){
const err151 = {instancePath:instancePath+"/providers/" + i2+"/id",schemaPath:"#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.id,data:data40};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
if(errors > 0){
const emErrs43 = [];
for(const err152 of vErrors){
if(!err152.emUsed){
emErrs43.push(err152);
}
}
vErrors = emErrs43;
errors = emErrs43.length;
}
}
if(data13.name !== undefined){
let data41 = data13.name;
if(typeof data41 !== "string"){
const err153 = {instancePath:instancePath+"/providers/" + i2+"/name",schemaPath:"#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.name,data:data41};
if(vErrors === null){
vErrors = [err153];
}
else {
vErrors.push(err153);
}
errors++;
}
if(errors > 0){
const emErrs44 = [];
for(const err154 of vErrors){
if(!err154.emUsed){
emErrs44.push(err154);
}
}
vErrors = emErrs44;
errors = emErrs44.length;
}
}
if(data13.enabled !== undefined){
let data42 = data13.enabled;
if(typeof data42 !== "boolean"){
const err155 = {instancePath:instancePath+"/providers/" + i2+"/enabled",schemaPath:"#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[5].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.enabled,data:data42};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
if(errors > 0){
const emErrs45 = [];
for(const err156 of vErrors){
if(!err156.emUsed){
emErrs45.push(err156);
}
}
vErrors = emErrs45;
errors = emErrs45.length;
}
}
if(data13.apiKey !== undefined){
let data43 = data13.apiKey;
if(typeof data43 !== "string"){
const err157 = {instancePath:instancePath+"/providers/" + i2+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.apiKey,data:data43};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
if(errors > 0){
const emErrs46 = [];
for(const err158 of vErrors){
if(!err158.emUsed){
emErrs46.push(err158);
}
}
vErrors = emErrs46;
errors = emErrs46.length;
}
}
if(data13.baseURL !== undefined){
let data44 = data13.baseURL;
if(typeof data44 !== "string"){
const err159 = {instancePath:instancePath+"/providers/" + i2+"/baseURL",schemaPath:"#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.baseURL.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.baseURL,data:data44};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
if(errors > 0){
const emErrs47 = [];
for(const err160 of vErrors){
if(!err160.emUsed){
emErrs47.push(err160);
}
}
vErrors = emErrs47;
errors = emErrs47.length;
}
}
}
else {
const err161 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[5].type,parentSchema:schema27.properties.providers.items.oneOf[5],data:data13};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
if(errors > 0){
const emErrors8 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"baseURL":[]}};
const templates8 = {required:{}};
let emPropParams7;
let emParamsErrors7;
for(const err162 of vErrors){
if((((((err162.keyword !== "errorMessage") && (!err162.emUsed)) && (err162.instancePath === instancePath+"/providers/" + i2)) && (err162.keyword in emErrors8)) && (err162.schemaPath.indexOf("#/properties/providers/items/oneOf/5") === 0)) && (/^\/[^\/]*$/.test(err162.schemaPath.slice(36)))){
emPropParams7 = obj0[err162.keyword];
emParamsErrors7 = emErrors8[err162.keyword][err162.params[emPropParams7]];
if(emParamsErrors7){
emParamsErrors7.push(err162);
err162.emUsed = true;
}
}
}
for(const key11 in emErrors8){
for(const keyProp7 in emErrors8[key11]){
emParamsErrors7 = emErrors8[key11][keyProp7];
if(emParamsErrors7.length){
const tmpl7 = templates8[key11] && templates8[key11][keyProp7];
const err163 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/5/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors7},message:tmpl7 ? tmpl7() : schema27.properties.providers.items.oneOf[5].errorMessage[key11][keyProp7],schema:schema27.properties.providers.items.oneOf[5].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[5],data:data13};
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
const emErrs48 = [];
for(const err164 of vErrors){
if(!err164.emUsed){
emErrs48.push(err164);
}
}
vErrors = emErrs48;
errors = emErrs48.length;
}
var _valid1 = _errs99 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 5];
}
else {
if(_valid1){
valid9 = true;
passing1 = 5;
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
const _errs113 = errors;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.type === undefined){
const err165 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data13};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
if(data13.name === undefined){
const err166 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data13};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
if(data13.id === undefined){
const err167 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data13};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
if(data13.enabled === undefined){
const err168 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data13};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
if(data13.apiKey === undefined){
const err169 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "apiKey"},message:"must have required property '"+"apiKey"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data13};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
if(data13.type !== undefined){
let data45 = data13.type;
if(typeof data45 !== "string"){
const err170 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.type,data:data45};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
if("scaleway" !== data45){
const err171 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "scaleway"},message:"must be equal to constant",schema:"scaleway",parentSchema:schema27.properties.providers.items.oneOf[6].properties.type,data:data45};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
if(errors > 0){
const emErrs49 = [];
for(const err172 of vErrors){
if(!err172.emUsed){
emErrs49.push(err172);
}
}
vErrors = emErrs49;
errors = emErrs49.length;
}
}
if(data13.id !== undefined){
let data46 = data13.id;
if(typeof data46 !== "string"){
const err173 = {instancePath:instancePath+"/providers/" + i2+"/id",schemaPath:"#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.id,data:data46};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
}
errors++;
}
if(errors > 0){
const emErrs50 = [];
for(const err174 of vErrors){
if(!err174.emUsed){
emErrs50.push(err174);
}
}
vErrors = emErrs50;
errors = emErrs50.length;
}
}
if(data13.name !== undefined){
let data47 = data13.name;
if(typeof data47 !== "string"){
const err175 = {instancePath:instancePath+"/providers/" + i2+"/name",schemaPath:"#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.name,data:data47};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
if(errors > 0){
const emErrs51 = [];
for(const err176 of vErrors){
if(!err176.emUsed){
emErrs51.push(err176);
}
}
vErrors = emErrs51;
errors = emErrs51.length;
}
}
if(data13.enabled !== undefined){
let data48 = data13.enabled;
if(typeof data48 !== "boolean"){
const err177 = {instancePath:instancePath+"/providers/" + i2+"/enabled",schemaPath:"#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[6].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.enabled,data:data48};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
}
if(errors > 0){
const emErrs52 = [];
for(const err178 of vErrors){
if(!err178.emUsed){
emErrs52.push(err178);
}
}
vErrors = emErrs52;
errors = emErrs52.length;
}
}
if(data13.apiKey !== undefined){
let data49 = data13.apiKey;
if(typeof data49 !== "string"){
const err179 = {instancePath:instancePath+"/providers/" + i2+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/6/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.apiKey,data:data49};
if(vErrors === null){
vErrors = [err179];
}
else {
vErrors.push(err179);
}
errors++;
}
if(errors > 0){
const emErrs53 = [];
for(const err180 of vErrors){
if(!err180.emUsed){
emErrs53.push(err180);
}
}
vErrors = emErrs53;
errors = emErrs53.length;
}
}
}
else {
const err181 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[6].type,parentSchema:schema27.properties.providers.items.oneOf[6],data:data13};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
if(errors > 0){
const emErrors9 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"apiKey":[]}};
const templates9 = {required:{}};
let emPropParams8;
let emParamsErrors8;
for(const err182 of vErrors){
if((((((err182.keyword !== "errorMessage") && (!err182.emUsed)) && (err182.instancePath === instancePath+"/providers/" + i2)) && (err182.keyword in emErrors9)) && (err182.schemaPath.indexOf("#/properties/providers/items/oneOf/6") === 0)) && (/^\/[^\/]*$/.test(err182.schemaPath.slice(36)))){
emPropParams8 = obj0[err182.keyword];
emParamsErrors8 = emErrors9[err182.keyword][err182.params[emPropParams8]];
if(emParamsErrors8){
emParamsErrors8.push(err182);
err182.emUsed = true;
}
}
}
for(const key12 in emErrors9){
for(const keyProp8 in emErrors9[key12]){
emParamsErrors8 = emErrors9[key12][keyProp8];
if(emParamsErrors8.length){
const tmpl8 = templates9[key12] && templates9[key12][keyProp8];
const err183 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors8},message:tmpl8 ? tmpl8() : schema27.properties.providers.items.oneOf[6].errorMessage[key12][keyProp8],schema:schema27.properties.providers.items.oneOf[6].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[6],data:data13};
if(vErrors === null){
vErrors = [err183];
}
else {
vErrors.push(err183);
}
errors++;
}
}
}
const emErrs54 = [];
for(const err184 of vErrors){
if(!err184.emUsed){
emErrs54.push(err184);
}
}
vErrors = emErrs54;
errors = emErrs54.length;
}
var _valid1 = _errs113 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 6];
}
else {
if(_valid1){
valid9 = true;
passing1 = 6;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.apiKey = true;
}
}
const _errs125 = errors;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.type === undefined){
const err185 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data13};
if(vErrors === null){
vErrors = [err185];
}
else {
vErrors.push(err185);
}
errors++;
}
if(data13.name === undefined){
const err186 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data13};
if(vErrors === null){
vErrors = [err186];
}
else {
vErrors.push(err186);
}
errors++;
}
if(data13.id === undefined){
const err187 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data13};
if(vErrors === null){
vErrors = [err187];
}
else {
vErrors.push(err187);
}
errors++;
}
if(data13.enabled === undefined){
const err188 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data13};
if(vErrors === null){
vErrors = [err188];
}
else {
vErrors.push(err188);
}
errors++;
}
if(data13.baseURL === undefined){
const err189 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data13};
if(vErrors === null){
vErrors = [err189];
}
else {
vErrors.push(err189);
}
errors++;
}
if(data13.type !== undefined){
let data50 = data13.type;
if(typeof data50 !== "string"){
const err190 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/7/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.type,data:data50};
if(vErrors === null){
vErrors = [err190];
}
else {
vErrors.push(err190);
}
errors++;
}
if("openai-compatible" !== data50){
const err191 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue: "openai-compatible"},message:"must be equal to constant",schema:"openai-compatible",parentSchema:schema27.properties.providers.items.oneOf[7].properties.type,data:data50};
if(vErrors === null){
vErrors = [err191];
}
else {
vErrors.push(err191);
}
errors++;
}
if(errors > 0){
const emErrs55 = [];
for(const err192 of vErrors){
if(!err192.emUsed){
emErrs55.push(err192);
}
}
vErrors = emErrs55;
errors = emErrs55.length;
}
}
if(data13.id !== undefined){
let data51 = data13.id;
if(typeof data51 !== "string"){
const err193 = {instancePath:instancePath+"/providers/" + i2+"/id",schemaPath:"#/properties/providers/items/oneOf/7/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.id,data:data51};
if(vErrors === null){
vErrors = [err193];
}
else {
vErrors.push(err193);
}
errors++;
}
if(errors > 0){
const emErrs56 = [];
for(const err194 of vErrors){
if(!err194.emUsed){
emErrs56.push(err194);
}
}
vErrors = emErrs56;
errors = emErrs56.length;
}
}
if(data13.name !== undefined){
let data52 = data13.name;
if(typeof data52 !== "string"){
const err195 = {instancePath:instancePath+"/providers/" + i2+"/name",schemaPath:"#/properties/providers/items/oneOf/7/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.name,data:data52};
if(vErrors === null){
vErrors = [err195];
}
else {
vErrors.push(err195);
}
errors++;
}
if(errors > 0){
const emErrs57 = [];
for(const err196 of vErrors){
if(!err196.emUsed){
emErrs57.push(err196);
}
}
vErrors = emErrs57;
errors = emErrs57.length;
}
}
if(data13.enabled !== undefined){
let data53 = data13.enabled;
if(typeof data53 !== "boolean"){
const err197 = {instancePath:instancePath+"/providers/" + i2+"/enabled",schemaPath:"#/properties/providers/items/oneOf/7/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[7].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.enabled,data:data53};
if(vErrors === null){
vErrors = [err197];
}
else {
vErrors.push(err197);
}
errors++;
}
if(errors > 0){
const emErrs58 = [];
for(const err198 of vErrors){
if(!err198.emUsed){
emErrs58.push(err198);
}
}
vErrors = emErrs58;
errors = emErrs58.length;
}
}
if(data13.baseURL !== undefined){
let data54 = data13.baseURL;
if(typeof data54 !== "string"){
const err199 = {instancePath:instancePath+"/providers/" + i2+"/baseURL",schemaPath:"#/properties/providers/items/oneOf/7/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.baseURL.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.baseURL,data:data54};
if(vErrors === null){
vErrors = [err199];
}
else {
vErrors.push(err199);
}
errors++;
}
if(errors > 0){
const emErrs59 = [];
for(const err200 of vErrors){
if(!err200.emUsed){
emErrs59.push(err200);
}
}
vErrors = emErrs59;
errors = emErrs59.length;
}
}
if(data13.apiKey !== undefined){
let data55 = data13.apiKey;
if(typeof data55 !== "string"){
const err201 = {instancePath:instancePath+"/providers/" + i2+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/7/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.apiKey,data:data55};
if(vErrors === null){
vErrors = [err201];
}
else {
vErrors.push(err201);
}
errors++;
}
if(errors > 0){
const emErrs60 = [];
for(const err202 of vErrors){
if(!err202.emUsed){
emErrs60.push(err202);
}
}
vErrors = emErrs60;
errors = emErrs60.length;
}
}
}
else {
const err203 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[7].type,parentSchema:schema27.properties.providers.items.oneOf[7],data:data13};
if(vErrors === null){
vErrors = [err203];
}
else {
vErrors.push(err203);
}
errors++;
}
if(errors > 0){
const emErrors10 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"baseURL":[]}};
const templates10 = {required:{}};
let emPropParams9;
let emParamsErrors9;
for(const err204 of vErrors){
if((((((err204.keyword !== "errorMessage") && (!err204.emUsed)) && (err204.instancePath === instancePath+"/providers/" + i2)) && (err204.keyword in emErrors10)) && (err204.schemaPath.indexOf("#/properties/providers/items/oneOf/7") === 0)) && (/^\/[^\/]*$/.test(err204.schemaPath.slice(36)))){
emPropParams9 = obj0[err204.keyword];
emParamsErrors9 = emErrors10[err204.keyword][err204.params[emPropParams9]];
if(emParamsErrors9){
emParamsErrors9.push(err204);
err204.emUsed = true;
}
}
}
for(const key13 in emErrors10){
for(const keyProp9 in emErrors10[key13]){
emParamsErrors9 = emErrors10[key13][keyProp9];
if(emParamsErrors9.length){
const tmpl9 = templates10[key13] && templates10[key13][keyProp9];
const err205 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/7/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors9},message:tmpl9 ? tmpl9() : schema27.properties.providers.items.oneOf[7].errorMessage[key13][keyProp9],schema:schema27.properties.providers.items.oneOf[7].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[7],data:data13};
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
const emErrs61 = [];
for(const err206 of vErrors){
if(!err206.emUsed){
emErrs61.push(err206);
}
}
vErrors = emErrs61;
errors = emErrs61.length;
}
var _valid1 = _errs125 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 7];
}
else {
if(_valid1){
valid9 = true;
passing1 = 7;
if(props0 !== true){
props0 = props0 || {};
props0.type = true;
props0.id = true;
props0.name = true;
props0.enabled = true;
props0.baseURL = true;
props0.apiKey = true;
}
}
const _errs139 = errors;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.type === undefined){
const err207 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data13};
if(vErrors === null){
vErrors = [err207];
}
else {
vErrors.push(err207);
}
errors++;
}
if(data13.name === undefined){
const err208 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data13};
if(vErrors === null){
vErrors = [err208];
}
else {
vErrors.push(err208);
}
errors++;
}
if(data13.id === undefined){
const err209 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data13};
if(vErrors === null){
vErrors = [err209];
}
else {
vErrors.push(err209);
}
errors++;
}
if(data13.enabled === undefined){
const err210 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data13};
if(vErrors === null){
vErrors = [err210];
}
else {
vErrors.push(err210);
}
errors++;
}
if(data13.type !== undefined){
let data56 = data13.type;
if(typeof data56 !== "string"){
const err211 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/8/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[8].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.type,data:data56};
if(vErrors === null){
vErrors = [err211];
}
else {
vErrors.push(err211);
}
errors++;
}
if("mock" !== data56){
const err212 = {instancePath:instancePath+"/providers/" + i2+"/type",schemaPath:"#/properties/providers/items/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema27.properties.providers.items.oneOf[8].properties.type,data:data56};
if(vErrors === null){
vErrors = [err212];
}
else {
vErrors.push(err212);
}
errors++;
}
if(errors > 0){
const emErrs62 = [];
for(const err213 of vErrors){
if(!err213.emUsed){
emErrs62.push(err213);
}
}
vErrors = emErrs62;
errors = emErrs62.length;
}
}
if(data13.id !== undefined){
let data57 = data13.id;
if(typeof data57 !== "string"){
const err214 = {instancePath:instancePath+"/providers/" + i2+"/id",schemaPath:"#/properties/providers/items/oneOf/8/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[8].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.id,data:data57};
if(vErrors === null){
vErrors = [err214];
}
else {
vErrors.push(err214);
}
errors++;
}
if(errors > 0){
const emErrs63 = [];
for(const err215 of vErrors){
if(!err215.emUsed){
emErrs63.push(err215);
}
}
vErrors = emErrs63;
errors = emErrs63.length;
}
}
if(data13.name !== undefined){
let data58 = data13.name;
if(typeof data58 !== "string"){
const err216 = {instancePath:instancePath+"/providers/" + i2+"/name",schemaPath:"#/properties/providers/items/oneOf/8/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[8].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.name,data:data58};
if(vErrors === null){
vErrors = [err216];
}
else {
vErrors.push(err216);
}
errors++;
}
if(errors > 0){
const emErrs64 = [];
for(const err217 of vErrors){
if(!err217.emUsed){
emErrs64.push(err217);
}
}
vErrors = emErrs64;
errors = emErrs64.length;
}
}
if(data13.enabled !== undefined){
let data59 = data13.enabled;
if(typeof data59 !== "boolean"){
const err218 = {instancePath:instancePath+"/providers/" + i2+"/enabled",schemaPath:"#/properties/providers/items/oneOf/8/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[8].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.enabled,data:data59};
if(vErrors === null){
vErrors = [err218];
}
else {
vErrors.push(err218);
}
errors++;
}
if(errors > 0){
const emErrs65 = [];
for(const err219 of vErrors){
if(!err219.emUsed){
emErrs65.push(err219);
}
}
vErrors = emErrs65;
errors = emErrs65.length;
}
}
}
else {
const err220 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/8/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[8].type,parentSchema:schema27.properties.providers.items.oneOf[8],data:data13};
if(vErrors === null){
vErrors = [err220];
}
else {
vErrors.push(err220);
}
errors++;
}
if(errors > 0){
const emErrors11 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates11 = {required:{}};
let emPropParams10;
let emParamsErrors10;
for(const err221 of vErrors){
if((((((err221.keyword !== "errorMessage") && (!err221.emUsed)) && (err221.instancePath === instancePath+"/providers/" + i2)) && (err221.keyword in emErrors11)) && (err221.schemaPath.indexOf("#/properties/providers/items/oneOf/8") === 0)) && (/^\/[^\/]*$/.test(err221.schemaPath.slice(36)))){
emPropParams10 = obj0[err221.keyword];
emParamsErrors10 = emErrors11[err221.keyword][err221.params[emPropParams10]];
if(emParamsErrors10){
emParamsErrors10.push(err221);
err221.emUsed = true;
}
}
}
for(const key14 in emErrors11){
for(const keyProp10 in emErrors11[key14]){
emParamsErrors10 = emErrors11[key14][keyProp10];
if(emParamsErrors10.length){
const tmpl10 = templates11[key14] && templates11[key14][keyProp10];
const err222 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf/8/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors10},message:tmpl10 ? tmpl10() : schema27.properties.providers.items.oneOf[8].errorMessage[key14][keyProp10],schema:schema27.properties.providers.items.oneOf[8].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[8],data:data13};
if(vErrors === null){
vErrors = [err222];
}
else {
vErrors.push(err222);
}
errors++;
}
}
}
const emErrs66 = [];
for(const err223 of vErrors){
if(!err223.emUsed){
emErrs66.push(err223);
}
}
vErrors = emErrs66;
errors = emErrs66.length;
}
var _valid1 = _errs139 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 8];
}
else {
if(_valid1){
valid9 = true;
passing1 = 8;
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
if(!valid9){
const err224 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf",schema:schema27.properties.providers.items.oneOf,parentSchema:schema27.properties.providers.items,data:data13};
if(vErrors === null){
vErrors = [err224];
}
else {
vErrors.push(err224);
}
errors++;
}
else {
errors = _errs38;
if(vErrors !== null){
if(_errs38){
vErrors.length = _errs38;
}
else {
vErrors = null;
}
}
}
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(props0 !== true){
for(const key15 in data13){
if(!props0 || !props0[key15]){
const err225 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/unevaluatedProperties",keyword:"unevaluatedProperties",params:{unevaluatedProperty: key15},message:"must NOT have unevaluated properties",schema:false,parentSchema:schema27.properties.providers.items,data:data13};
if(vErrors === null){
vErrors = [err225];
}
else {
vErrors.push(err225);
}
errors++;
}
}
}
}
else {
const err226 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.type,parentSchema:schema27.properties.providers.items,data:data13};
if(vErrors === null){
vErrors = [err226];
}
else {
vErrors.push(err226);
}
errors++;
}
if(errors > 0){
const emErrors12 = {"oneOf":[]};
const templates12 = {};
for(const err227 of vErrors){
if((((((err227.keyword !== "errorMessage") && (!err227.emUsed)) && (err227.instancePath === instancePath+"/providers/" + i2)) && (err227.keyword in emErrors12)) && (err227.schemaPath.indexOf("#/properties/providers/items") === 0)) && (/^\/[^\/]*$/.test(err227.schemaPath.slice(28)))){
emErrors12[err227.keyword].push(err227);
err227.emUsed = true;
}
}
for(const key16 in emErrors12){
if(emErrors12[key16].length){
const err228 = {instancePath:instancePath+"/providers/" + i2,schemaPath:"#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors12[key16]},message:key16 in templates12 ? templates12[key16]() : schema27.properties.providers.items.errorMessage[key16],schema:schema27.properties.providers.items.errorMessage,parentSchema:schema27.properties.providers.items,data:data13};
if(vErrors === null){
vErrors = [err228];
}
else {
vErrors.push(err228);
}
errors++;
}
}
const emErrs67 = [];
for(const err229 of vErrors){
if(!err229.emUsed){
emErrs67.push(err229);
}
}
vErrors = emErrs67;
errors = emErrs67.length;
}
}
}
else {
const err230 = {instancePath:instancePath+"/providers",schemaPath:"#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.providers.type,parentSchema:schema27.properties.providers,data:data12};
if(vErrors === null){
vErrors = [err230];
}
else {
vErrors.push(err230);
}
errors++;
}
if(errors > 0){
const emErrs68 = [];
for(const err231 of vErrors){
if(!err231.emUsed){
emErrs68.push(err231);
}
}
vErrors = emErrs68;
errors = emErrs68.length;
}
}
if(data.models !== undefined){
let data60 = data.models;
if(data60 && typeof data60 == "object" && !Array.isArray(data60)){
if(data60.assistant !== undefined){
let data61 = data60.assistant;
if(data61 && typeof data61 == "object" && !Array.isArray(data61)){
if(data61.model !== undefined){
let data62 = data61.model;
if(data62 && typeof data62 == "object" && !Array.isArray(data62)){
if(data62.id === undefined){
const err232 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data62};
if(vErrors === null){
vErrors = [err232];
}
else {
vErrors.push(err232);
}
errors++;
}
if(data62.name === undefined){
const err233 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data62};
if(vErrors === null){
vErrors = [err233];
}
else {
vErrors.push(err233);
}
errors++;
}
if(data62.provider === undefined){
const err234 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data62};
if(vErrors === null){
vErrors = [err234];
}
else {
vErrors.push(err234);
}
errors++;
}
if(data62.id !== undefined){
let data63 = data62.id;
if(typeof data63 !== "string"){
const err235 = {instancePath:instancePath+"/models/assistant/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data63};
if(vErrors === null){
vErrors = [err235];
}
else {
vErrors.push(err235);
}
errors++;
}
if(errors > 0){
const emErrs69 = [];
for(const err236 of vErrors){
if(!err236.emUsed){
emErrs69.push(err236);
}
}
vErrors = emErrs69;
errors = emErrs69.length;
}
}
if(data62.name !== undefined){
let data64 = data62.name;
if(typeof data64 !== "string"){
const err237 = {instancePath:instancePath+"/models/assistant/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data64};
if(vErrors === null){
vErrors = [err237];
}
else {
vErrors.push(err237);
}
errors++;
}
if(errors > 0){
const emErrs70 = [];
for(const err238 of vErrors){
if(!err238.emUsed){
emErrs70.push(err238);
}
}
vErrors = emErrs70;
errors = emErrs70.length;
}
}
if(data62.provider !== undefined){
let data65 = data62.provider;
if(data65 && typeof data65 == "object" && !Array.isArray(data65)){
if(data65.type === undefined){
const err239 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data65};
if(vErrors === null){
vErrors = [err239];
}
else {
vErrors.push(err239);
}
errors++;
}
if(data65.name === undefined){
const err240 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data65};
if(vErrors === null){
vErrors = [err240];
}
else {
vErrors.push(err240);
}
errors++;
}
if(data65.id === undefined){
const err241 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data65};
if(vErrors === null){
vErrors = [err241];
}
else {
vErrors.push(err241);
}
errors++;
}
if(data65.type !== undefined){
let data66 = data65.type;
if(typeof data66 !== "string"){
const err242 = {instancePath:instancePath+"/models/assistant/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data66};
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
if(data65.name !== undefined){
let data67 = data65.name;
if(typeof data67 !== "string"){
const err244 = {instancePath:instancePath+"/models/assistant/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data67};
if(vErrors === null){
vErrors = [err244];
}
else {
vErrors.push(err244);
}
errors++;
}
if(errors > 0){
const emErrs72 = [];
for(const err245 of vErrors){
if(!err245.emUsed){
emErrs72.push(err245);
}
}
vErrors = emErrs72;
errors = emErrs72.length;
}
}
if(data65.id !== undefined){
let data68 = data65.id;
if(typeof data68 !== "string"){
const err246 = {instancePath:instancePath+"/models/assistant/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data68};
if(vErrors === null){
vErrors = [err246];
}
else {
vErrors.push(err246);
}
errors++;
}
if(errors > 0){
const emErrs73 = [];
for(const err247 of vErrors){
if(!err247.emUsed){
emErrs73.push(err247);
}
}
vErrors = emErrs73;
errors = emErrs73.length;
}
}
}
else {
const err248 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data65};
if(vErrors === null){
vErrors = [err248];
}
else {
vErrors.push(err248);
}
errors++;
}
if(errors > 0){
const emErrors13 = {"required":{"type":[],"name":[],"id":[]}};
const templates13 = {required:{}};
let emPropParams11;
let emParamsErrors11;
for(const err249 of vErrors){
if((((((err249.keyword !== "errorMessage") && (!err249.emUsed)) && (err249.instancePath === instancePath+"/models/assistant/model/provider")) && (err249.keyword in emErrors13)) && (err249.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err249.schemaPath.slice(39)))){
emPropParams11 = obj0[err249.keyword];
emParamsErrors11 = emErrors13[err249.keyword][err249.params[emPropParams11]];
if(emParamsErrors11){
emParamsErrors11.push(err249);
err249.emUsed = true;
}
}
}
for(const key17 in emErrors13){
for(const keyProp11 in emErrors13[key17]){
emParamsErrors11 = emErrors13[key17][keyProp11];
if(emParamsErrors11.length){
const tmpl11 = templates13[key17] && templates13[key17][keyProp11];
const err250 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors11},message:tmpl11 ? tmpl11() : schema28.properties.provider.errorMessage[key17][keyProp11],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data65};
if(vErrors === null){
vErrors = [err250];
}
else {
vErrors.push(err250);
}
errors++;
}
}
}
const emErrs74 = [];
for(const err251 of vErrors){
if(!err251.emUsed){
emErrs74.push(err251);
}
}
vErrors = emErrs74;
errors = emErrs74.length;
}
}
}
else {
const err252 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data62};
if(vErrors === null){
vErrors = [err252];
}
else {
vErrors.push(err252);
}
errors++;
}
if(errors > 0){
const emErrors14 = {"required":{"id":[],"name":[],"provider":[]}};
const templates14 = {required:{}};
let emPropParams12;
let emParamsErrors12;
for(const err253 of vErrors){
if((((((err253.keyword !== "errorMessage") && (!err253.emUsed)) && (err253.instancePath === instancePath+"/models/assistant/model")) && (err253.keyword in emErrors14)) && (err253.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err253.schemaPath.slice(19)))){
emPropParams12 = obj0[err253.keyword];
emParamsErrors12 = emErrors14[err253.keyword][err253.params[emPropParams12]];
if(emParamsErrors12){
emParamsErrors12.push(err253);
err253.emUsed = true;
}
}
}
for(const key18 in emErrors14){
for(const keyProp12 in emErrors14[key18]){
emParamsErrors12 = emErrors14[key18][keyProp12];
if(emParamsErrors12.length){
const tmpl12 = templates14[key18] && templates14[key18][keyProp12];
const err254 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors12},message:tmpl12 ? tmpl12() : schema28.errorMessage[key18][keyProp12],schema:schema28.errorMessage,parentSchema:schema28,data:data62};
if(vErrors === null){
vErrors = [err254];
}
else {
vErrors.push(err254);
}
errors++;
}
}
}
const emErrs75 = [];
for(const err255 of vErrors){
if(!err255.emUsed){
emErrs75.push(err255);
}
}
vErrors = emErrs75;
errors = emErrs75.length;
}
if(errors > 0){
const emErrors15 = {"required":{"id":[],"name":[],"provider":[]}};
const templates15 = {required:{}};
let emPropParams13;
let emParamsErrors13;
for(const err256 of vErrors){
if((((((err256.keyword !== "errorMessage") && (!err256.emUsed)) && (err256.instancePath === instancePath+"/models/assistant/model")) && (err256.keyword in emErrors15)) && (err256.schemaPath.indexOf("#/properties/models/properties/assistant/properties/model") === 0)) && (/^\/[^\/]*$/.test(err256.schemaPath.slice(57)))){
emPropParams13 = obj0[err256.keyword];
emParamsErrors13 = emErrors15[err256.keyword][err256.params[emPropParams13]];
if(emParamsErrors13){
emParamsErrors13.push(err256);
err256.emUsed = true;
}
}
}
for(const key19 in emErrors15){
for(const keyProp13 in emErrors15[key19]){
emParamsErrors13 = emErrors15[key19][keyProp13];
if(emParamsErrors13.length){
const tmpl13 = templates15[key19] && templates15[key19][keyProp13];
const err257 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/properties/models/properties/assistant/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors13},message:tmpl13 ? tmpl13() : schema27.properties.models.properties.assistant.properties.model.errorMessage[key19][keyProp13],schema:schema27.properties.models.properties.assistant.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.assistant.properties.model,data:data62};
if(vErrors === null){
vErrors = [err257];
}
else {
vErrors.push(err257);
}
errors++;
}
}
}
const emErrs76 = [];
for(const err258 of vErrors){
if(!err258.emUsed){
emErrs76.push(err258);
}
}
vErrors = emErrs76;
errors = emErrs76.length;
}
}
if(data61.inputPricePerMillion !== undefined){
let data69 = data61.inputPricePerMillion;
if(typeof data69 == "number"){
if(data69 < 0 || isNaN(data69)){
const err259 = {instancePath:instancePath+"/models/assistant/inputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.assistant.properties.inputPricePerMillion,data:data69};
if(vErrors === null){
vErrors = [err259];
}
else {
vErrors.push(err259);
}
errors++;
}
}
else {
const err260 = {instancePath:instancePath+"/models/assistant/inputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.assistant.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.assistant.properties.inputPricePerMillion,data:data69};
if(vErrors === null){
vErrors = [err260];
}
else {
vErrors.push(err260);
}
errors++;
}
if(errors > 0){
const emErrs77 = [];
for(const err261 of vErrors){
if(!err261.emUsed){
emErrs77.push(err261);
}
}
vErrors = emErrs77;
errors = emErrs77.length;
}
}
if(data61.outputPricePerMillion !== undefined){
let data70 = data61.outputPricePerMillion;
if(typeof data70 == "number"){
if(data70 < 0 || isNaN(data70)){
const err262 = {instancePath:instancePath+"/models/assistant/outputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.assistant.properties.outputPricePerMillion,data:data70};
if(vErrors === null){
vErrors = [err262];
}
else {
vErrors.push(err262);
}
errors++;
}
}
else {
const err263 = {instancePath:instancePath+"/models/assistant/outputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.assistant.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.assistant.properties.outputPricePerMillion,data:data70};
if(vErrors === null){
vErrors = [err263];
}
else {
vErrors.push(err263);
}
errors++;
}
if(errors > 0){
const emErrs78 = [];
for(const err264 of vErrors){
if(!err264.emUsed){
emErrs78.push(err264);
}
}
vErrors = emErrs78;
errors = emErrs78.length;
}
}
}
else {
const err265 = {instancePath:instancePath+"/models/assistant",schemaPath:"#/properties/models/properties/assistant/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.assistant.type,parentSchema:schema27.properties.models.properties.assistant,data:data61};
if(vErrors === null){
vErrors = [err265];
}
else {
vErrors.push(err265);
}
errors++;
}
if(errors > 0){
const emErrs79 = [];
for(const err266 of vErrors){
if(!err266.emUsed){
emErrs79.push(err266);
}
}
vErrors = emErrs79;
errors = emErrs79.length;
}
}
if(data60.tools !== undefined){
let data71 = data60.tools;
if(data71 && typeof data71 == "object" && !Array.isArray(data71)){
if(data71.model !== undefined){
let data72 = data71.model;
if(data72 && typeof data72 == "object" && !Array.isArray(data72)){
if(data72.id === undefined){
const err267 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data72};
if(vErrors === null){
vErrors = [err267];
}
else {
vErrors.push(err267);
}
errors++;
}
if(data72.name === undefined){
const err268 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data72};
if(vErrors === null){
vErrors = [err268];
}
else {
vErrors.push(err268);
}
errors++;
}
if(data72.provider === undefined){
const err269 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data72};
if(vErrors === null){
vErrors = [err269];
}
else {
vErrors.push(err269);
}
errors++;
}
if(data72.id !== undefined){
let data73 = data72.id;
if(typeof data73 !== "string"){
const err270 = {instancePath:instancePath+"/models/tools/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data73};
if(vErrors === null){
vErrors = [err270];
}
else {
vErrors.push(err270);
}
errors++;
}
if(errors > 0){
const emErrs80 = [];
for(const err271 of vErrors){
if(!err271.emUsed){
emErrs80.push(err271);
}
}
vErrors = emErrs80;
errors = emErrs80.length;
}
}
if(data72.name !== undefined){
let data74 = data72.name;
if(typeof data74 !== "string"){
const err272 = {instancePath:instancePath+"/models/tools/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data74};
if(vErrors === null){
vErrors = [err272];
}
else {
vErrors.push(err272);
}
errors++;
}
if(errors > 0){
const emErrs81 = [];
for(const err273 of vErrors){
if(!err273.emUsed){
emErrs81.push(err273);
}
}
vErrors = emErrs81;
errors = emErrs81.length;
}
}
if(data72.provider !== undefined){
let data75 = data72.provider;
if(data75 && typeof data75 == "object" && !Array.isArray(data75)){
if(data75.type === undefined){
const err274 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data75};
if(vErrors === null){
vErrors = [err274];
}
else {
vErrors.push(err274);
}
errors++;
}
if(data75.name === undefined){
const err275 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data75};
if(vErrors === null){
vErrors = [err275];
}
else {
vErrors.push(err275);
}
errors++;
}
if(data75.id === undefined){
const err276 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data75};
if(vErrors === null){
vErrors = [err276];
}
else {
vErrors.push(err276);
}
errors++;
}
if(data75.type !== undefined){
let data76 = data75.type;
if(typeof data76 !== "string"){
const err277 = {instancePath:instancePath+"/models/tools/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data76};
if(vErrors === null){
vErrors = [err277];
}
else {
vErrors.push(err277);
}
errors++;
}
if(errors > 0){
const emErrs82 = [];
for(const err278 of vErrors){
if(!err278.emUsed){
emErrs82.push(err278);
}
}
vErrors = emErrs82;
errors = emErrs82.length;
}
}
if(data75.name !== undefined){
let data77 = data75.name;
if(typeof data77 !== "string"){
const err279 = {instancePath:instancePath+"/models/tools/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data77};
if(vErrors === null){
vErrors = [err279];
}
else {
vErrors.push(err279);
}
errors++;
}
if(errors > 0){
const emErrs83 = [];
for(const err280 of vErrors){
if(!err280.emUsed){
emErrs83.push(err280);
}
}
vErrors = emErrs83;
errors = emErrs83.length;
}
}
if(data75.id !== undefined){
let data78 = data75.id;
if(typeof data78 !== "string"){
const err281 = {instancePath:instancePath+"/models/tools/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data78};
if(vErrors === null){
vErrors = [err281];
}
else {
vErrors.push(err281);
}
errors++;
}
if(errors > 0){
const emErrs84 = [];
for(const err282 of vErrors){
if(!err282.emUsed){
emErrs84.push(err282);
}
}
vErrors = emErrs84;
errors = emErrs84.length;
}
}
}
else {
const err283 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data75};
if(vErrors === null){
vErrors = [err283];
}
else {
vErrors.push(err283);
}
errors++;
}
if(errors > 0){
const emErrors16 = {"required":{"type":[],"name":[],"id":[]}};
const templates16 = {required:{}};
let emPropParams14;
let emParamsErrors14;
for(const err284 of vErrors){
if((((((err284.keyword !== "errorMessage") && (!err284.emUsed)) && (err284.instancePath === instancePath+"/models/tools/model/provider")) && (err284.keyword in emErrors16)) && (err284.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err284.schemaPath.slice(39)))){
emPropParams14 = obj0[err284.keyword];
emParamsErrors14 = emErrors16[err284.keyword][err284.params[emPropParams14]];
if(emParamsErrors14){
emParamsErrors14.push(err284);
err284.emUsed = true;
}
}
}
for(const key20 in emErrors16){
for(const keyProp14 in emErrors16[key20]){
emParamsErrors14 = emErrors16[key20][keyProp14];
if(emParamsErrors14.length){
const tmpl14 = templates16[key20] && templates16[key20][keyProp14];
const err285 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors14},message:tmpl14 ? tmpl14() : schema28.properties.provider.errorMessage[key20][keyProp14],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data75};
if(vErrors === null){
vErrors = [err285];
}
else {
vErrors.push(err285);
}
errors++;
}
}
}
const emErrs85 = [];
for(const err286 of vErrors){
if(!err286.emUsed){
emErrs85.push(err286);
}
}
vErrors = emErrs85;
errors = emErrs85.length;
}
}
}
else {
const err287 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data72};
if(vErrors === null){
vErrors = [err287];
}
else {
vErrors.push(err287);
}
errors++;
}
if(errors > 0){
const emErrors17 = {"required":{"id":[],"name":[],"provider":[]}};
const templates17 = {required:{}};
let emPropParams15;
let emParamsErrors15;
for(const err288 of vErrors){
if((((((err288.keyword !== "errorMessage") && (!err288.emUsed)) && (err288.instancePath === instancePath+"/models/tools/model")) && (err288.keyword in emErrors17)) && (err288.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err288.schemaPath.slice(19)))){
emPropParams15 = obj0[err288.keyword];
emParamsErrors15 = emErrors17[err288.keyword][err288.params[emPropParams15]];
if(emParamsErrors15){
emParamsErrors15.push(err288);
err288.emUsed = true;
}
}
}
for(const key21 in emErrors17){
for(const keyProp15 in emErrors17[key21]){
emParamsErrors15 = emErrors17[key21][keyProp15];
if(emParamsErrors15.length){
const tmpl15 = templates17[key21] && templates17[key21][keyProp15];
const err289 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors15},message:tmpl15 ? tmpl15() : schema28.errorMessage[key21][keyProp15],schema:schema28.errorMessage,parentSchema:schema28,data:data72};
if(vErrors === null){
vErrors = [err289];
}
else {
vErrors.push(err289);
}
errors++;
}
}
}
const emErrs86 = [];
for(const err290 of vErrors){
if(!err290.emUsed){
emErrs86.push(err290);
}
}
vErrors = emErrs86;
errors = emErrs86.length;
}
if(errors > 0){
const emErrors18 = {"required":{"id":[],"name":[],"provider":[]}};
const templates18 = {required:{}};
let emPropParams16;
let emParamsErrors16;
for(const err291 of vErrors){
if((((((err291.keyword !== "errorMessage") && (!err291.emUsed)) && (err291.instancePath === instancePath+"/models/tools/model")) && (err291.keyword in emErrors18)) && (err291.schemaPath.indexOf("#/properties/models/properties/tools/properties/model") === 0)) && (/^\/[^\/]*$/.test(err291.schemaPath.slice(53)))){
emPropParams16 = obj0[err291.keyword];
emParamsErrors16 = emErrors18[err291.keyword][err291.params[emPropParams16]];
if(emParamsErrors16){
emParamsErrors16.push(err291);
err291.emUsed = true;
}
}
}
for(const key22 in emErrors18){
for(const keyProp16 in emErrors18[key22]){
emParamsErrors16 = emErrors18[key22][keyProp16];
if(emParamsErrors16.length){
const tmpl16 = templates18[key22] && templates18[key22][keyProp16];
const err292 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/properties/models/properties/tools/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors16},message:tmpl16 ? tmpl16() : schema27.properties.models.properties.tools.properties.model.errorMessage[key22][keyProp16],schema:schema27.properties.models.properties.tools.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.tools.properties.model,data:data72};
if(vErrors === null){
vErrors = [err292];
}
else {
vErrors.push(err292);
}
errors++;
}
}
}
const emErrs87 = [];
for(const err293 of vErrors){
if(!err293.emUsed){
emErrs87.push(err293);
}
}
vErrors = emErrs87;
errors = emErrs87.length;
}
}
if(data71.inputPricePerMillion !== undefined){
let data79 = data71.inputPricePerMillion;
if(typeof data79 == "number"){
if(data79 < 0 || isNaN(data79)){
const err294 = {instancePath:instancePath+"/models/tools/inputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.tools.properties.inputPricePerMillion,data:data79};
if(vErrors === null){
vErrors = [err294];
}
else {
vErrors.push(err294);
}
errors++;
}
}
else {
const err295 = {instancePath:instancePath+"/models/tools/inputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.tools.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.tools.properties.inputPricePerMillion,data:data79};
if(vErrors === null){
vErrors = [err295];
}
else {
vErrors.push(err295);
}
errors++;
}
if(errors > 0){
const emErrs88 = [];
for(const err296 of vErrors){
if(!err296.emUsed){
emErrs88.push(err296);
}
}
vErrors = emErrs88;
errors = emErrs88.length;
}
}
if(data71.outputPricePerMillion !== undefined){
let data80 = data71.outputPricePerMillion;
if(typeof data80 == "number"){
if(data80 < 0 || isNaN(data80)){
const err297 = {instancePath:instancePath+"/models/tools/outputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.tools.properties.outputPricePerMillion,data:data80};
if(vErrors === null){
vErrors = [err297];
}
else {
vErrors.push(err297);
}
errors++;
}
}
else {
const err298 = {instancePath:instancePath+"/models/tools/outputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.tools.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.tools.properties.outputPricePerMillion,data:data80};
if(vErrors === null){
vErrors = [err298];
}
else {
vErrors.push(err298);
}
errors++;
}
if(errors > 0){
const emErrs89 = [];
for(const err299 of vErrors){
if(!err299.emUsed){
emErrs89.push(err299);
}
}
vErrors = emErrs89;
errors = emErrs89.length;
}
}
}
else {
const err300 = {instancePath:instancePath+"/models/tools",schemaPath:"#/properties/models/properties/tools/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.tools.type,parentSchema:schema27.properties.models.properties.tools,data:data71};
if(vErrors === null){
vErrors = [err300];
}
else {
vErrors.push(err300);
}
errors++;
}
if(errors > 0){
const emErrs90 = [];
for(const err301 of vErrors){
if(!err301.emUsed){
emErrs90.push(err301);
}
}
vErrors = emErrs90;
errors = emErrs90.length;
}
}
if(data60.summarizer !== undefined){
let data81 = data60.summarizer;
if(data81 && typeof data81 == "object" && !Array.isArray(data81)){
if(data81.model !== undefined){
let data82 = data81.model;
if(data82 && typeof data82 == "object" && !Array.isArray(data82)){
if(data82.id === undefined){
const err302 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data82};
if(vErrors === null){
vErrors = [err302];
}
else {
vErrors.push(err302);
}
errors++;
}
if(data82.name === undefined){
const err303 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data82};
if(vErrors === null){
vErrors = [err303];
}
else {
vErrors.push(err303);
}
errors++;
}
if(data82.provider === undefined){
const err304 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data82};
if(vErrors === null){
vErrors = [err304];
}
else {
vErrors.push(err304);
}
errors++;
}
if(data82.id !== undefined){
let data83 = data82.id;
if(typeof data83 !== "string"){
const err305 = {instancePath:instancePath+"/models/summarizer/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data83};
if(vErrors === null){
vErrors = [err305];
}
else {
vErrors.push(err305);
}
errors++;
}
if(errors > 0){
const emErrs91 = [];
for(const err306 of vErrors){
if(!err306.emUsed){
emErrs91.push(err306);
}
}
vErrors = emErrs91;
errors = emErrs91.length;
}
}
if(data82.name !== undefined){
let data84 = data82.name;
if(typeof data84 !== "string"){
const err307 = {instancePath:instancePath+"/models/summarizer/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data84};
if(vErrors === null){
vErrors = [err307];
}
else {
vErrors.push(err307);
}
errors++;
}
if(errors > 0){
const emErrs92 = [];
for(const err308 of vErrors){
if(!err308.emUsed){
emErrs92.push(err308);
}
}
vErrors = emErrs92;
errors = emErrs92.length;
}
}
if(data82.provider !== undefined){
let data85 = data82.provider;
if(data85 && typeof data85 == "object" && !Array.isArray(data85)){
if(data85.type === undefined){
const err309 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data85};
if(vErrors === null){
vErrors = [err309];
}
else {
vErrors.push(err309);
}
errors++;
}
if(data85.name === undefined){
const err310 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data85};
if(vErrors === null){
vErrors = [err310];
}
else {
vErrors.push(err310);
}
errors++;
}
if(data85.id === undefined){
const err311 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data85};
if(vErrors === null){
vErrors = [err311];
}
else {
vErrors.push(err311);
}
errors++;
}
if(data85.type !== undefined){
let data86 = data85.type;
if(typeof data86 !== "string"){
const err312 = {instancePath:instancePath+"/models/summarizer/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data86};
if(vErrors === null){
vErrors = [err312];
}
else {
vErrors.push(err312);
}
errors++;
}
if(errors > 0){
const emErrs93 = [];
for(const err313 of vErrors){
if(!err313.emUsed){
emErrs93.push(err313);
}
}
vErrors = emErrs93;
errors = emErrs93.length;
}
}
if(data85.name !== undefined){
let data87 = data85.name;
if(typeof data87 !== "string"){
const err314 = {instancePath:instancePath+"/models/summarizer/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data87};
if(vErrors === null){
vErrors = [err314];
}
else {
vErrors.push(err314);
}
errors++;
}
if(errors > 0){
const emErrs94 = [];
for(const err315 of vErrors){
if(!err315.emUsed){
emErrs94.push(err315);
}
}
vErrors = emErrs94;
errors = emErrs94.length;
}
}
if(data85.id !== undefined){
let data88 = data85.id;
if(typeof data88 !== "string"){
const err316 = {instancePath:instancePath+"/models/summarizer/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data88};
if(vErrors === null){
vErrors = [err316];
}
else {
vErrors.push(err316);
}
errors++;
}
if(errors > 0){
const emErrs95 = [];
for(const err317 of vErrors){
if(!err317.emUsed){
emErrs95.push(err317);
}
}
vErrors = emErrs95;
errors = emErrs95.length;
}
}
}
else {
const err318 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data85};
if(vErrors === null){
vErrors = [err318];
}
else {
vErrors.push(err318);
}
errors++;
}
if(errors > 0){
const emErrors19 = {"required":{"type":[],"name":[],"id":[]}};
const templates19 = {required:{}};
let emPropParams17;
let emParamsErrors17;
for(const err319 of vErrors){
if((((((err319.keyword !== "errorMessage") && (!err319.emUsed)) && (err319.instancePath === instancePath+"/models/summarizer/model/provider")) && (err319.keyword in emErrors19)) && (err319.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err319.schemaPath.slice(39)))){
emPropParams17 = obj0[err319.keyword];
emParamsErrors17 = emErrors19[err319.keyword][err319.params[emPropParams17]];
if(emParamsErrors17){
emParamsErrors17.push(err319);
err319.emUsed = true;
}
}
}
for(const key23 in emErrors19){
for(const keyProp17 in emErrors19[key23]){
emParamsErrors17 = emErrors19[key23][keyProp17];
if(emParamsErrors17.length){
const tmpl17 = templates19[key23] && templates19[key23][keyProp17];
const err320 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors17},message:tmpl17 ? tmpl17() : schema28.properties.provider.errorMessage[key23][keyProp17],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data85};
if(vErrors === null){
vErrors = [err320];
}
else {
vErrors.push(err320);
}
errors++;
}
}
}
const emErrs96 = [];
for(const err321 of vErrors){
if(!err321.emUsed){
emErrs96.push(err321);
}
}
vErrors = emErrs96;
errors = emErrs96.length;
}
}
}
else {
const err322 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data82};
if(vErrors === null){
vErrors = [err322];
}
else {
vErrors.push(err322);
}
errors++;
}
if(errors > 0){
const emErrors20 = {"required":{"id":[],"name":[],"provider":[]}};
const templates20 = {required:{}};
let emPropParams18;
let emParamsErrors18;
for(const err323 of vErrors){
if((((((err323.keyword !== "errorMessage") && (!err323.emUsed)) && (err323.instancePath === instancePath+"/models/summarizer/model")) && (err323.keyword in emErrors20)) && (err323.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err323.schemaPath.slice(19)))){
emPropParams18 = obj0[err323.keyword];
emParamsErrors18 = emErrors20[err323.keyword][err323.params[emPropParams18]];
if(emParamsErrors18){
emParamsErrors18.push(err323);
err323.emUsed = true;
}
}
}
for(const key24 in emErrors20){
for(const keyProp18 in emErrors20[key24]){
emParamsErrors18 = emErrors20[key24][keyProp18];
if(emParamsErrors18.length){
const tmpl18 = templates20[key24] && templates20[key24][keyProp18];
const err324 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors18},message:tmpl18 ? tmpl18() : schema28.errorMessage[key24][keyProp18],schema:schema28.errorMessage,parentSchema:schema28,data:data82};
if(vErrors === null){
vErrors = [err324];
}
else {
vErrors.push(err324);
}
errors++;
}
}
}
const emErrs97 = [];
for(const err325 of vErrors){
if(!err325.emUsed){
emErrs97.push(err325);
}
}
vErrors = emErrs97;
errors = emErrs97.length;
}
if(errors > 0){
const emErrors21 = {"required":{"id":[],"name":[],"provider":[]}};
const templates21 = {required:{}};
let emPropParams19;
let emParamsErrors19;
for(const err326 of vErrors){
if((((((err326.keyword !== "errorMessage") && (!err326.emUsed)) && (err326.instancePath === instancePath+"/models/summarizer/model")) && (err326.keyword in emErrors21)) && (err326.schemaPath.indexOf("#/properties/models/properties/summarizer/properties/model") === 0)) && (/^\/[^\/]*$/.test(err326.schemaPath.slice(58)))){
emPropParams19 = obj0[err326.keyword];
emParamsErrors19 = emErrors21[err326.keyword][err326.params[emPropParams19]];
if(emParamsErrors19){
emParamsErrors19.push(err326);
err326.emUsed = true;
}
}
}
for(const key25 in emErrors21){
for(const keyProp19 in emErrors21[key25]){
emParamsErrors19 = emErrors21[key25][keyProp19];
if(emParamsErrors19.length){
const tmpl19 = templates21[key25] && templates21[key25][keyProp19];
const err327 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/properties/models/properties/summarizer/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors19},message:tmpl19 ? tmpl19() : schema27.properties.models.properties.summarizer.properties.model.errorMessage[key25][keyProp19],schema:schema27.properties.models.properties.summarizer.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.summarizer.properties.model,data:data82};
if(vErrors === null){
vErrors = [err327];
}
else {
vErrors.push(err327);
}
errors++;
}
}
}
const emErrs98 = [];
for(const err328 of vErrors){
if(!err328.emUsed){
emErrs98.push(err328);
}
}
vErrors = emErrs98;
errors = emErrs98.length;
}
}
if(data81.inputPricePerMillion !== undefined){
let data89 = data81.inputPricePerMillion;
if(typeof data89 == "number"){
if(data89 < 0 || isNaN(data89)){
const err329 = {instancePath:instancePath+"/models/summarizer/inputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.summarizer.properties.inputPricePerMillion,data:data89};
if(vErrors === null){
vErrors = [err329];
}
else {
vErrors.push(err329);
}
errors++;
}
}
else {
const err330 = {instancePath:instancePath+"/models/summarizer/inputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.summarizer.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.summarizer.properties.inputPricePerMillion,data:data89};
if(vErrors === null){
vErrors = [err330];
}
else {
vErrors.push(err330);
}
errors++;
}
if(errors > 0){
const emErrs99 = [];
for(const err331 of vErrors){
if(!err331.emUsed){
emErrs99.push(err331);
}
}
vErrors = emErrs99;
errors = emErrs99.length;
}
}
if(data81.outputPricePerMillion !== undefined){
let data90 = data81.outputPricePerMillion;
if(typeof data90 == "number"){
if(data90 < 0 || isNaN(data90)){
const err332 = {instancePath:instancePath+"/models/summarizer/outputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.summarizer.properties.outputPricePerMillion,data:data90};
if(vErrors === null){
vErrors = [err332];
}
else {
vErrors.push(err332);
}
errors++;
}
}
else {
const err333 = {instancePath:instancePath+"/models/summarizer/outputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.summarizer.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.summarizer.properties.outputPricePerMillion,data:data90};
if(vErrors === null){
vErrors = [err333];
}
else {
vErrors.push(err333);
}
errors++;
}
if(errors > 0){
const emErrs100 = [];
for(const err334 of vErrors){
if(!err334.emUsed){
emErrs100.push(err334);
}
}
vErrors = emErrs100;
errors = emErrs100.length;
}
}
}
else {
const err335 = {instancePath:instancePath+"/models/summarizer",schemaPath:"#/properties/models/properties/summarizer/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.summarizer.type,parentSchema:schema27.properties.models.properties.summarizer,data:data81};
if(vErrors === null){
vErrors = [err335];
}
else {
vErrors.push(err335);
}
errors++;
}
if(errors > 0){
const emErrs101 = [];
for(const err336 of vErrors){
if(!err336.emUsed){
emErrs101.push(err336);
}
}
vErrors = emErrs101;
errors = emErrs101.length;
}
}
if(data60.evaluator !== undefined){
let data91 = data60.evaluator;
if(data91 && typeof data91 == "object" && !Array.isArray(data91)){
if(data91.model !== undefined){
let data92 = data91.model;
if(data92 && typeof data92 == "object" && !Array.isArray(data92)){
if(data92.id === undefined){
const err337 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data92};
if(vErrors === null){
vErrors = [err337];
}
else {
vErrors.push(err337);
}
errors++;
}
if(data92.name === undefined){
const err338 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data92};
if(vErrors === null){
vErrors = [err338];
}
else {
vErrors.push(err338);
}
errors++;
}
if(data92.provider === undefined){
const err339 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data92};
if(vErrors === null){
vErrors = [err339];
}
else {
vErrors.push(err339);
}
errors++;
}
if(data92.id !== undefined){
let data93 = data92.id;
if(typeof data93 !== "string"){
const err340 = {instancePath:instancePath+"/models/evaluator/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data93};
if(vErrors === null){
vErrors = [err340];
}
else {
vErrors.push(err340);
}
errors++;
}
if(errors > 0){
const emErrs102 = [];
for(const err341 of vErrors){
if(!err341.emUsed){
emErrs102.push(err341);
}
}
vErrors = emErrs102;
errors = emErrs102.length;
}
}
if(data92.name !== undefined){
let data94 = data92.name;
if(typeof data94 !== "string"){
const err342 = {instancePath:instancePath+"/models/evaluator/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data94};
if(vErrors === null){
vErrors = [err342];
}
else {
vErrors.push(err342);
}
errors++;
}
if(errors > 0){
const emErrs103 = [];
for(const err343 of vErrors){
if(!err343.emUsed){
emErrs103.push(err343);
}
}
vErrors = emErrs103;
errors = emErrs103.length;
}
}
if(data92.provider !== undefined){
let data95 = data92.provider;
if(data95 && typeof data95 == "object" && !Array.isArray(data95)){
if(data95.type === undefined){
const err344 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data95};
if(vErrors === null){
vErrors = [err344];
}
else {
vErrors.push(err344);
}
errors++;
}
if(data95.name === undefined){
const err345 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data95};
if(vErrors === null){
vErrors = [err345];
}
else {
vErrors.push(err345);
}
errors++;
}
if(data95.id === undefined){
const err346 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data95};
if(vErrors === null){
vErrors = [err346];
}
else {
vErrors.push(err346);
}
errors++;
}
if(data95.type !== undefined){
let data96 = data95.type;
if(typeof data96 !== "string"){
const err347 = {instancePath:instancePath+"/models/evaluator/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data96};
if(vErrors === null){
vErrors = [err347];
}
else {
vErrors.push(err347);
}
errors++;
}
if(errors > 0){
const emErrs104 = [];
for(const err348 of vErrors){
if(!err348.emUsed){
emErrs104.push(err348);
}
}
vErrors = emErrs104;
errors = emErrs104.length;
}
}
if(data95.name !== undefined){
let data97 = data95.name;
if(typeof data97 !== "string"){
const err349 = {instancePath:instancePath+"/models/evaluator/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data97};
if(vErrors === null){
vErrors = [err349];
}
else {
vErrors.push(err349);
}
errors++;
}
if(errors > 0){
const emErrs105 = [];
for(const err350 of vErrors){
if(!err350.emUsed){
emErrs105.push(err350);
}
}
vErrors = emErrs105;
errors = emErrs105.length;
}
}
if(data95.id !== undefined){
let data98 = data95.id;
if(typeof data98 !== "string"){
const err351 = {instancePath:instancePath+"/models/evaluator/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data98};
if(vErrors === null){
vErrors = [err351];
}
else {
vErrors.push(err351);
}
errors++;
}
if(errors > 0){
const emErrs106 = [];
for(const err352 of vErrors){
if(!err352.emUsed){
emErrs106.push(err352);
}
}
vErrors = emErrs106;
errors = emErrs106.length;
}
}
}
else {
const err353 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data95};
if(vErrors === null){
vErrors = [err353];
}
else {
vErrors.push(err353);
}
errors++;
}
if(errors > 0){
const emErrors22 = {"required":{"type":[],"name":[],"id":[]}};
const templates22 = {required:{}};
let emPropParams20;
let emParamsErrors20;
for(const err354 of vErrors){
if((((((err354.keyword !== "errorMessage") && (!err354.emUsed)) && (err354.instancePath === instancePath+"/models/evaluator/model/provider")) && (err354.keyword in emErrors22)) && (err354.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err354.schemaPath.slice(39)))){
emPropParams20 = obj0[err354.keyword];
emParamsErrors20 = emErrors22[err354.keyword][err354.params[emPropParams20]];
if(emParamsErrors20){
emParamsErrors20.push(err354);
err354.emUsed = true;
}
}
}
for(const key26 in emErrors22){
for(const keyProp20 in emErrors22[key26]){
emParamsErrors20 = emErrors22[key26][keyProp20];
if(emParamsErrors20.length){
const tmpl20 = templates22[key26] && templates22[key26][keyProp20];
const err355 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors20},message:tmpl20 ? tmpl20() : schema28.properties.provider.errorMessage[key26][keyProp20],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data95};
if(vErrors === null){
vErrors = [err355];
}
else {
vErrors.push(err355);
}
errors++;
}
}
}
const emErrs107 = [];
for(const err356 of vErrors){
if(!err356.emUsed){
emErrs107.push(err356);
}
}
vErrors = emErrs107;
errors = emErrs107.length;
}
}
}
else {
const err357 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data92};
if(vErrors === null){
vErrors = [err357];
}
else {
vErrors.push(err357);
}
errors++;
}
if(errors > 0){
const emErrors23 = {"required":{"id":[],"name":[],"provider":[]}};
const templates23 = {required:{}};
let emPropParams21;
let emParamsErrors21;
for(const err358 of vErrors){
if((((((err358.keyword !== "errorMessage") && (!err358.emUsed)) && (err358.instancePath === instancePath+"/models/evaluator/model")) && (err358.keyword in emErrors23)) && (err358.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err358.schemaPath.slice(19)))){
emPropParams21 = obj0[err358.keyword];
emParamsErrors21 = emErrors23[err358.keyword][err358.params[emPropParams21]];
if(emParamsErrors21){
emParamsErrors21.push(err358);
err358.emUsed = true;
}
}
}
for(const key27 in emErrors23){
for(const keyProp21 in emErrors23[key27]){
emParamsErrors21 = emErrors23[key27][keyProp21];
if(emParamsErrors21.length){
const tmpl21 = templates23[key27] && templates23[key27][keyProp21];
const err359 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors21},message:tmpl21 ? tmpl21() : schema28.errorMessage[key27][keyProp21],schema:schema28.errorMessage,parentSchema:schema28,data:data92};
if(vErrors === null){
vErrors = [err359];
}
else {
vErrors.push(err359);
}
errors++;
}
}
}
const emErrs108 = [];
for(const err360 of vErrors){
if(!err360.emUsed){
emErrs108.push(err360);
}
}
vErrors = emErrs108;
errors = emErrs108.length;
}
if(errors > 0){
const emErrors24 = {"required":{"id":[],"name":[],"provider":[]}};
const templates24 = {required:{}};
let emPropParams22;
let emParamsErrors22;
for(const err361 of vErrors){
if((((((err361.keyword !== "errorMessage") && (!err361.emUsed)) && (err361.instancePath === instancePath+"/models/evaluator/model")) && (err361.keyword in emErrors24)) && (err361.schemaPath.indexOf("#/properties/models/properties/evaluator/properties/model") === 0)) && (/^\/[^\/]*$/.test(err361.schemaPath.slice(57)))){
emPropParams22 = obj0[err361.keyword];
emParamsErrors22 = emErrors24[err361.keyword][err361.params[emPropParams22]];
if(emParamsErrors22){
emParamsErrors22.push(err361);
err361.emUsed = true;
}
}
}
for(const key28 in emErrors24){
for(const keyProp22 in emErrors24[key28]){
emParamsErrors22 = emErrors24[key28][keyProp22];
if(emParamsErrors22.length){
const tmpl22 = templates24[key28] && templates24[key28][keyProp22];
const err362 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/properties/models/properties/evaluator/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors22},message:tmpl22 ? tmpl22() : schema27.properties.models.properties.evaluator.properties.model.errorMessage[key28][keyProp22],schema:schema27.properties.models.properties.evaluator.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.evaluator.properties.model,data:data92};
if(vErrors === null){
vErrors = [err362];
}
else {
vErrors.push(err362);
}
errors++;
}
}
}
const emErrs109 = [];
for(const err363 of vErrors){
if(!err363.emUsed){
emErrs109.push(err363);
}
}
vErrors = emErrs109;
errors = emErrs109.length;
}
}
if(data91.inputPricePerMillion !== undefined){
let data99 = data91.inputPricePerMillion;
if(typeof data99 == "number"){
if(data99 < 0 || isNaN(data99)){
const err364 = {instancePath:instancePath+"/models/evaluator/inputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.evaluator.properties.inputPricePerMillion,data:data99};
if(vErrors === null){
vErrors = [err364];
}
else {
vErrors.push(err364);
}
errors++;
}
}
else {
const err365 = {instancePath:instancePath+"/models/evaluator/inputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.evaluator.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.evaluator.properties.inputPricePerMillion,data:data99};
if(vErrors === null){
vErrors = [err365];
}
else {
vErrors.push(err365);
}
errors++;
}
if(errors > 0){
const emErrs110 = [];
for(const err366 of vErrors){
if(!err366.emUsed){
emErrs110.push(err366);
}
}
vErrors = emErrs110;
errors = emErrs110.length;
}
}
if(data91.outputPricePerMillion !== undefined){
let data100 = data91.outputPricePerMillion;
if(typeof data100 == "number"){
if(data100 < 0 || isNaN(data100)){
const err367 = {instancePath:instancePath+"/models/evaluator/outputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.evaluator.properties.outputPricePerMillion,data:data100};
if(vErrors === null){
vErrors = [err367];
}
else {
vErrors.push(err367);
}
errors++;
}
}
else {
const err368 = {instancePath:instancePath+"/models/evaluator/outputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.evaluator.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.evaluator.properties.outputPricePerMillion,data:data100};
if(vErrors === null){
vErrors = [err368];
}
else {
vErrors.push(err368);
}
errors++;
}
if(errors > 0){
const emErrs111 = [];
for(const err369 of vErrors){
if(!err369.emUsed){
emErrs111.push(err369);
}
}
vErrors = emErrs111;
errors = emErrs111.length;
}
}
}
else {
const err370 = {instancePath:instancePath+"/models/evaluator",schemaPath:"#/properties/models/properties/evaluator/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.evaluator.type,parentSchema:schema27.properties.models.properties.evaluator,data:data91};
if(vErrors === null){
vErrors = [err370];
}
else {
vErrors.push(err370);
}
errors++;
}
if(errors > 0){
const emErrs112 = [];
for(const err371 of vErrors){
if(!err371.emUsed){
emErrs112.push(err371);
}
}
vErrors = emErrs112;
errors = emErrs112.length;
}
}
if(data60.moderator !== undefined){
let data101 = data60.moderator;
if(data101 && typeof data101 == "object" && !Array.isArray(data101)){
if(data101.model !== undefined){
let data102 = data101.model;
if(data102 && typeof data102 == "object" && !Array.isArray(data102)){
if(data102.id === undefined){
const err372 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data102};
if(vErrors === null){
vErrors = [err372];
}
else {
vErrors.push(err372);
}
errors++;
}
if(data102.name === undefined){
const err373 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data102};
if(vErrors === null){
vErrors = [err373];
}
else {
vErrors.push(err373);
}
errors++;
}
if(data102.provider === undefined){
const err374 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data102};
if(vErrors === null){
vErrors = [err374];
}
else {
vErrors.push(err374);
}
errors++;
}
if(data102.id !== undefined){
let data103 = data102.id;
if(typeof data103 !== "string"){
const err375 = {instancePath:instancePath+"/models/moderator/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data103};
if(vErrors === null){
vErrors = [err375];
}
else {
vErrors.push(err375);
}
errors++;
}
if(errors > 0){
const emErrs113 = [];
for(const err376 of vErrors){
if(!err376.emUsed){
emErrs113.push(err376);
}
}
vErrors = emErrs113;
errors = emErrs113.length;
}
}
if(data102.name !== undefined){
let data104 = data102.name;
if(typeof data104 !== "string"){
const err377 = {instancePath:instancePath+"/models/moderator/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data104};
if(vErrors === null){
vErrors = [err377];
}
else {
vErrors.push(err377);
}
errors++;
}
if(errors > 0){
const emErrs114 = [];
for(const err378 of vErrors){
if(!err378.emUsed){
emErrs114.push(err378);
}
}
vErrors = emErrs114;
errors = emErrs114.length;
}
}
if(data102.provider !== undefined){
let data105 = data102.provider;
if(data105 && typeof data105 == "object" && !Array.isArray(data105)){
if(data105.type === undefined){
const err379 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data105};
if(vErrors === null){
vErrors = [err379];
}
else {
vErrors.push(err379);
}
errors++;
}
if(data105.name === undefined){
const err380 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data105};
if(vErrors === null){
vErrors = [err380];
}
else {
vErrors.push(err380);
}
errors++;
}
if(data105.id === undefined){
const err381 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data105};
if(vErrors === null){
vErrors = [err381];
}
else {
vErrors.push(err381);
}
errors++;
}
if(data105.type !== undefined){
let data106 = data105.type;
if(typeof data106 !== "string"){
const err382 = {instancePath:instancePath+"/models/moderator/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data106};
if(vErrors === null){
vErrors = [err382];
}
else {
vErrors.push(err382);
}
errors++;
}
if(errors > 0){
const emErrs115 = [];
for(const err383 of vErrors){
if(!err383.emUsed){
emErrs115.push(err383);
}
}
vErrors = emErrs115;
errors = emErrs115.length;
}
}
if(data105.name !== undefined){
let data107 = data105.name;
if(typeof data107 !== "string"){
const err384 = {instancePath:instancePath+"/models/moderator/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data107};
if(vErrors === null){
vErrors = [err384];
}
else {
vErrors.push(err384);
}
errors++;
}
if(errors > 0){
const emErrs116 = [];
for(const err385 of vErrors){
if(!err385.emUsed){
emErrs116.push(err385);
}
}
vErrors = emErrs116;
errors = emErrs116.length;
}
}
if(data105.id !== undefined){
let data108 = data105.id;
if(typeof data108 !== "string"){
const err386 = {instancePath:instancePath+"/models/moderator/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data108};
if(vErrors === null){
vErrors = [err386];
}
else {
vErrors.push(err386);
}
errors++;
}
if(errors > 0){
const emErrs117 = [];
for(const err387 of vErrors){
if(!err387.emUsed){
emErrs117.push(err387);
}
}
vErrors = emErrs117;
errors = emErrs117.length;
}
}
}
else {
const err388 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data105};
if(vErrors === null){
vErrors = [err388];
}
else {
vErrors.push(err388);
}
errors++;
}
if(errors > 0){
const emErrors25 = {"required":{"type":[],"name":[],"id":[]}};
const templates25 = {required:{}};
let emPropParams23;
let emParamsErrors23;
for(const err389 of vErrors){
if((((((err389.keyword !== "errorMessage") && (!err389.emUsed)) && (err389.instancePath === instancePath+"/models/moderator/model/provider")) && (err389.keyword in emErrors25)) && (err389.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err389.schemaPath.slice(39)))){
emPropParams23 = obj0[err389.keyword];
emParamsErrors23 = emErrors25[err389.keyword][err389.params[emPropParams23]];
if(emParamsErrors23){
emParamsErrors23.push(err389);
err389.emUsed = true;
}
}
}
for(const key29 in emErrors25){
for(const keyProp23 in emErrors25[key29]){
emParamsErrors23 = emErrors25[key29][keyProp23];
if(emParamsErrors23.length){
const tmpl23 = templates25[key29] && templates25[key29][keyProp23];
const err390 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors23},message:tmpl23 ? tmpl23() : schema28.properties.provider.errorMessage[key29][keyProp23],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data105};
if(vErrors === null){
vErrors = [err390];
}
else {
vErrors.push(err390);
}
errors++;
}
}
}
const emErrs118 = [];
for(const err391 of vErrors){
if(!err391.emUsed){
emErrs118.push(err391);
}
}
vErrors = emErrs118;
errors = emErrs118.length;
}
}
}
else {
const err392 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data102};
if(vErrors === null){
vErrors = [err392];
}
else {
vErrors.push(err392);
}
errors++;
}
if(errors > 0){
const emErrors26 = {"required":{"id":[],"name":[],"provider":[]}};
const templates26 = {required:{}};
let emPropParams24;
let emParamsErrors24;
for(const err393 of vErrors){
if((((((err393.keyword !== "errorMessage") && (!err393.emUsed)) && (err393.instancePath === instancePath+"/models/moderator/model")) && (err393.keyword in emErrors26)) && (err393.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err393.schemaPath.slice(19)))){
emPropParams24 = obj0[err393.keyword];
emParamsErrors24 = emErrors26[err393.keyword][err393.params[emPropParams24]];
if(emParamsErrors24){
emParamsErrors24.push(err393);
err393.emUsed = true;
}
}
}
for(const key30 in emErrors26){
for(const keyProp24 in emErrors26[key30]){
emParamsErrors24 = emErrors26[key30][keyProp24];
if(emParamsErrors24.length){
const tmpl24 = templates26[key30] && templates26[key30][keyProp24];
const err394 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors24},message:tmpl24 ? tmpl24() : schema28.errorMessage[key30][keyProp24],schema:schema28.errorMessage,parentSchema:schema28,data:data102};
if(vErrors === null){
vErrors = [err394];
}
else {
vErrors.push(err394);
}
errors++;
}
}
}
const emErrs119 = [];
for(const err395 of vErrors){
if(!err395.emUsed){
emErrs119.push(err395);
}
}
vErrors = emErrs119;
errors = emErrs119.length;
}
if(errors > 0){
const emErrors27 = {"required":{"id":[],"name":[],"provider":[]}};
const templates27 = {required:{}};
let emPropParams25;
let emParamsErrors25;
for(const err396 of vErrors){
if((((((err396.keyword !== "errorMessage") && (!err396.emUsed)) && (err396.instancePath === instancePath+"/models/moderator/model")) && (err396.keyword in emErrors27)) && (err396.schemaPath.indexOf("#/properties/models/properties/moderator/properties/model") === 0)) && (/^\/[^\/]*$/.test(err396.schemaPath.slice(57)))){
emPropParams25 = obj0[err396.keyword];
emParamsErrors25 = emErrors27[err396.keyword][err396.params[emPropParams25]];
if(emParamsErrors25){
emParamsErrors25.push(err396);
err396.emUsed = true;
}
}
}
for(const key31 in emErrors27){
for(const keyProp25 in emErrors27[key31]){
emParamsErrors25 = emErrors27[key31][keyProp25];
if(emParamsErrors25.length){
const tmpl25 = templates27[key31] && templates27[key31][keyProp25];
const err397 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/properties/models/properties/moderator/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors25},message:tmpl25 ? tmpl25() : schema27.properties.models.properties.moderator.properties.model.errorMessage[key31][keyProp25],schema:schema27.properties.models.properties.moderator.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.moderator.properties.model,data:data102};
if(vErrors === null){
vErrors = [err397];
}
else {
vErrors.push(err397);
}
errors++;
}
}
}
const emErrs120 = [];
for(const err398 of vErrors){
if(!err398.emUsed){
emErrs120.push(err398);
}
}
vErrors = emErrs120;
errors = emErrs120.length;
}
}
if(data101.inputPricePerMillion !== undefined){
let data109 = data101.inputPricePerMillion;
if(typeof data109 == "number"){
if(data109 < 0 || isNaN(data109)){
const err399 = {instancePath:instancePath+"/models/moderator/inputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.moderator.properties.inputPricePerMillion,data:data109};
if(vErrors === null){
vErrors = [err399];
}
else {
vErrors.push(err399);
}
errors++;
}
}
else {
const err400 = {instancePath:instancePath+"/models/moderator/inputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.moderator.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.moderator.properties.inputPricePerMillion,data:data109};
if(vErrors === null){
vErrors = [err400];
}
else {
vErrors.push(err400);
}
errors++;
}
if(errors > 0){
const emErrs121 = [];
for(const err401 of vErrors){
if(!err401.emUsed){
emErrs121.push(err401);
}
}
vErrors = emErrs121;
errors = emErrs121.length;
}
}
if(data101.outputPricePerMillion !== undefined){
let data110 = data101.outputPricePerMillion;
if(typeof data110 == "number"){
if(data110 < 0 || isNaN(data110)){
const err402 = {instancePath:instancePath+"/models/moderator/outputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.moderator.properties.outputPricePerMillion,data:data110};
if(vErrors === null){
vErrors = [err402];
}
else {
vErrors.push(err402);
}
errors++;
}
}
else {
const err403 = {instancePath:instancePath+"/models/moderator/outputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.moderator.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.moderator.properties.outputPricePerMillion,data:data110};
if(vErrors === null){
vErrors = [err403];
}
else {
vErrors.push(err403);
}
errors++;
}
if(errors > 0){
const emErrs122 = [];
for(const err404 of vErrors){
if(!err404.emUsed){
emErrs122.push(err404);
}
}
vErrors = emErrs122;
errors = emErrs122.length;
}
}
}
else {
const err405 = {instancePath:instancePath+"/models/moderator",schemaPath:"#/properties/models/properties/moderator/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.moderator.type,parentSchema:schema27.properties.models.properties.moderator,data:data101};
if(vErrors === null){
vErrors = [err405];
}
else {
vErrors.push(err405);
}
errors++;
}
if(errors > 0){
const emErrs123 = [];
for(const err406 of vErrors){
if(!err406.emUsed){
emErrs123.push(err406);
}
}
vErrors = emErrs123;
errors = emErrs123.length;
}
}
}
else {
const err407 = {instancePath:instancePath+"/models",schemaPath:"#/properties/models/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.type,parentSchema:schema27.properties.models,data:data60};
if(vErrors === null){
vErrors = [err407];
}
else {
vErrors.push(err407);
}
errors++;
}
if(errors > 0){
const emErrs124 = [];
for(const err408 of vErrors){
if(!err408.emUsed){
emErrs124.push(err408);
}
}
vErrors = emErrs124;
errors = emErrs124.length;
}
}
if(data.quotas !== undefined){
let data111 = data.quotas;
if(data111 && typeof data111 == "object" && !Array.isArray(data111)){
if(data111.global === undefined){
const err409 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "global"},message:"must have required property '"+"global"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data111};
if(vErrors === null){
vErrors = [err409];
}
else {
vErrors.push(err409);
}
errors++;
}
if(data111.admin === undefined){
const err410 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "admin"},message:"must have required property '"+"admin"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data111};
if(vErrors === null){
vErrors = [err410];
}
else {
vErrors.push(err410);
}
errors++;
}
if(data111.contrib === undefined){
const err411 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "contrib"},message:"must have required property '"+"contrib"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data111};
if(vErrors === null){
vErrors = [err411];
}
else {
vErrors.push(err411);
}
errors++;
}
if(data111.user === undefined){
const err412 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "user"},message:"must have required property '"+"user"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data111};
if(vErrors === null){
vErrors = [err412];
}
else {
vErrors.push(err412);
}
errors++;
}
if(data111.external === undefined){
const err413 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "external"},message:"must have required property '"+"external"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data111};
if(vErrors === null){
vErrors = [err413];
}
else {
vErrors.push(err413);
}
errors++;
}
if(data111.anonymous === undefined){
const err414 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "anonymous"},message:"must have required property '"+"anonymous"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data111};
if(vErrors === null){
vErrors = [err414];
}
else {
vErrors.push(err414);
}
errors++;
}
if(data111.global !== undefined){
let data112 = data111.global;
if(data112 && typeof data112 == "object" && !Array.isArray(data112)){
if(data112.unlimited === undefined){
const err415 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data112};
if(vErrors === null){
vErrors = [err415];
}
else {
vErrors.push(err415);
}
errors++;
}
if(data112.monthlyLimit === undefined){
const err416 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data112};
if(vErrors === null){
vErrors = [err416];
}
else {
vErrors.push(err416);
}
errors++;
}
if(data112.unlimited !== undefined){
let data113 = data112.unlimited;
if(typeof data113 !== "boolean"){
const err417 = {instancePath:instancePath+"/quotas/global/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data113};
if(vErrors === null){
vErrors = [err417];
}
else {
vErrors.push(err417);
}
errors++;
}
if(errors > 0){
const emErrs125 = [];
for(const err418 of vErrors){
if(!err418.emUsed){
emErrs125.push(err418);
}
}
vErrors = emErrs125;
errors = emErrs125.length;
}
}
if(data112.monthlyLimit !== undefined){
let data114 = data112.monthlyLimit;
if(typeof data114 == "number"){
if(data114 < 0 || isNaN(data114)){
const err419 = {instancePath:instancePath+"/quotas/global/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data114};
if(vErrors === null){
vErrors = [err419];
}
else {
vErrors.push(err419);
}
errors++;
}
}
else {
const err420 = {instancePath:instancePath+"/quotas/global/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data114};
if(vErrors === null){
vErrors = [err420];
}
else {
vErrors.push(err420);
}
errors++;
}
if(errors > 0){
const emErrs126 = [];
for(const err421 of vErrors){
if(!err421.emUsed){
emErrs126.push(err421);
}
}
vErrors = emErrs126;
errors = emErrs126.length;
}
}
}
else {
const err422 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data112};
if(vErrors === null){
vErrors = [err422];
}
else {
vErrors.push(err422);
}
errors++;
}
if(errors > 0){
const emErrors28 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates28 = {required:{}};
let emPropParams26;
let emParamsErrors26;
for(const err423 of vErrors){
if((((((err423.keyword !== "errorMessage") && (!err423.emUsed)) && (err423.instancePath === instancePath+"/quotas/global")) && (err423.keyword in emErrors28)) && (err423.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err423.schemaPath.slice(23)))){
emPropParams26 = obj0[err423.keyword];
emParamsErrors26 = emErrors28[err423.keyword][err423.params[emPropParams26]];
if(emParamsErrors26){
emParamsErrors26.push(err423);
err423.emUsed = true;
}
}
}
for(const key32 in emErrors28){
for(const keyProp26 in emErrors28[key32]){
emParamsErrors26 = emErrors28[key32][keyProp26];
if(emParamsErrors26.length){
const tmpl26 = templates28[key32] && templates28[key32][keyProp26];
const err424 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors26},message:tmpl26 ? tmpl26() : schema33.errorMessage[key32][keyProp26],schema:schema33.errorMessage,parentSchema:schema33,data:data112};
if(vErrors === null){
vErrors = [err424];
}
else {
vErrors.push(err424);
}
errors++;
}
}
}
const emErrs127 = [];
for(const err425 of vErrors){
if(!err425.emUsed){
emErrs127.push(err425);
}
}
vErrors = emErrs127;
errors = emErrs127.length;
}
if(errors > 0){
const emErrors29 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates29 = {required:{}};
let emPropParams27;
let emParamsErrors27;
for(const err426 of vErrors){
if((((((err426.keyword !== "errorMessage") && (!err426.emUsed)) && (err426.instancePath === instancePath+"/quotas/global")) && (err426.keyword in emErrors29)) && (err426.schemaPath.indexOf("#/properties/quotas/properties/global") === 0)) && (/^\/[^\/]*$/.test(err426.schemaPath.slice(37)))){
emPropParams27 = obj0[err426.keyword];
emParamsErrors27 = emErrors29[err426.keyword][err426.params[emPropParams27]];
if(emParamsErrors27){
emParamsErrors27.push(err426);
err426.emUsed = true;
}
}
}
for(const key33 in emErrors29){
for(const keyProp27 in emErrors29[key33]){
emParamsErrors27 = emErrors29[key33][keyProp27];
if(emParamsErrors27.length){
const tmpl27 = templates29[key33] && templates29[key33][keyProp27];
const err427 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/properties/quotas/properties/global/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors27},message:tmpl27 ? tmpl27() : schema27.properties.quotas.properties.global.errorMessage[key33][keyProp27],schema:schema27.properties.quotas.properties.global.errorMessage,parentSchema:schema27.properties.quotas.properties.global,data:data112};
if(vErrors === null){
vErrors = [err427];
}
else {
vErrors.push(err427);
}
errors++;
}
}
}
const emErrs128 = [];
for(const err428 of vErrors){
if(!err428.emUsed){
emErrs128.push(err428);
}
}
vErrors = emErrs128;
errors = emErrs128.length;
}
}
if(data111.admin !== undefined){
let data115 = data111.admin;
if(data115 && typeof data115 == "object" && !Array.isArray(data115)){
if(data115.unlimited === undefined){
const err429 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data115};
if(vErrors === null){
vErrors = [err429];
}
else {
vErrors.push(err429);
}
errors++;
}
if(data115.monthlyLimit === undefined){
const err430 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data115};
if(vErrors === null){
vErrors = [err430];
}
else {
vErrors.push(err430);
}
errors++;
}
if(data115.unlimited !== undefined){
let data116 = data115.unlimited;
if(typeof data116 !== "boolean"){
const err431 = {instancePath:instancePath+"/quotas/admin/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data116};
if(vErrors === null){
vErrors = [err431];
}
else {
vErrors.push(err431);
}
errors++;
}
if(errors > 0){
const emErrs129 = [];
for(const err432 of vErrors){
if(!err432.emUsed){
emErrs129.push(err432);
}
}
vErrors = emErrs129;
errors = emErrs129.length;
}
}
if(data115.monthlyLimit !== undefined){
let data117 = data115.monthlyLimit;
if(typeof data117 == "number"){
if(data117 < 0 || isNaN(data117)){
const err433 = {instancePath:instancePath+"/quotas/admin/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data117};
if(vErrors === null){
vErrors = [err433];
}
else {
vErrors.push(err433);
}
errors++;
}
}
else {
const err434 = {instancePath:instancePath+"/quotas/admin/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data117};
if(vErrors === null){
vErrors = [err434];
}
else {
vErrors.push(err434);
}
errors++;
}
if(errors > 0){
const emErrs130 = [];
for(const err435 of vErrors){
if(!err435.emUsed){
emErrs130.push(err435);
}
}
vErrors = emErrs130;
errors = emErrs130.length;
}
}
}
else {
const err436 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data115};
if(vErrors === null){
vErrors = [err436];
}
else {
vErrors.push(err436);
}
errors++;
}
if(errors > 0){
const emErrors30 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates30 = {required:{}};
let emPropParams28;
let emParamsErrors28;
for(const err437 of vErrors){
if((((((err437.keyword !== "errorMessage") && (!err437.emUsed)) && (err437.instancePath === instancePath+"/quotas/admin")) && (err437.keyword in emErrors30)) && (err437.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err437.schemaPath.slice(23)))){
emPropParams28 = obj0[err437.keyword];
emParamsErrors28 = emErrors30[err437.keyword][err437.params[emPropParams28]];
if(emParamsErrors28){
emParamsErrors28.push(err437);
err437.emUsed = true;
}
}
}
for(const key34 in emErrors30){
for(const keyProp28 in emErrors30[key34]){
emParamsErrors28 = emErrors30[key34][keyProp28];
if(emParamsErrors28.length){
const tmpl28 = templates30[key34] && templates30[key34][keyProp28];
const err438 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors28},message:tmpl28 ? tmpl28() : schema33.errorMessage[key34][keyProp28],schema:schema33.errorMessage,parentSchema:schema33,data:data115};
if(vErrors === null){
vErrors = [err438];
}
else {
vErrors.push(err438);
}
errors++;
}
}
}
const emErrs131 = [];
for(const err439 of vErrors){
if(!err439.emUsed){
emErrs131.push(err439);
}
}
vErrors = emErrs131;
errors = emErrs131.length;
}
if(errors > 0){
const emErrors31 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates31 = {required:{}};
let emPropParams29;
let emParamsErrors29;
for(const err440 of vErrors){
if((((((err440.keyword !== "errorMessage") && (!err440.emUsed)) && (err440.instancePath === instancePath+"/quotas/admin")) && (err440.keyword in emErrors31)) && (err440.schemaPath.indexOf("#/properties/quotas/properties/admin") === 0)) && (/^\/[^\/]*$/.test(err440.schemaPath.slice(36)))){
emPropParams29 = obj0[err440.keyword];
emParamsErrors29 = emErrors31[err440.keyword][err440.params[emPropParams29]];
if(emParamsErrors29){
emParamsErrors29.push(err440);
err440.emUsed = true;
}
}
}
for(const key35 in emErrors31){
for(const keyProp29 in emErrors31[key35]){
emParamsErrors29 = emErrors31[key35][keyProp29];
if(emParamsErrors29.length){
const tmpl29 = templates31[key35] && templates31[key35][keyProp29];
const err441 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/properties/quotas/properties/admin/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors29},message:tmpl29 ? tmpl29() : schema27.properties.quotas.properties.admin.errorMessage[key35][keyProp29],schema:schema27.properties.quotas.properties.admin.errorMessage,parentSchema:schema27.properties.quotas.properties.admin,data:data115};
if(vErrors === null){
vErrors = [err441];
}
else {
vErrors.push(err441);
}
errors++;
}
}
}
const emErrs132 = [];
for(const err442 of vErrors){
if(!err442.emUsed){
emErrs132.push(err442);
}
}
vErrors = emErrs132;
errors = emErrs132.length;
}
}
if(data111.contrib !== undefined){
let data118 = data111.contrib;
if(data118 && typeof data118 == "object" && !Array.isArray(data118)){
if(data118.unlimited === undefined){
const err443 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data118};
if(vErrors === null){
vErrors = [err443];
}
else {
vErrors.push(err443);
}
errors++;
}
if(data118.monthlyLimit === undefined){
const err444 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data118};
if(vErrors === null){
vErrors = [err444];
}
else {
vErrors.push(err444);
}
errors++;
}
if(data118.unlimited !== undefined){
let data119 = data118.unlimited;
if(typeof data119 !== "boolean"){
const err445 = {instancePath:instancePath+"/quotas/contrib/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data119};
if(vErrors === null){
vErrors = [err445];
}
else {
vErrors.push(err445);
}
errors++;
}
if(errors > 0){
const emErrs133 = [];
for(const err446 of vErrors){
if(!err446.emUsed){
emErrs133.push(err446);
}
}
vErrors = emErrs133;
errors = emErrs133.length;
}
}
if(data118.monthlyLimit !== undefined){
let data120 = data118.monthlyLimit;
if(typeof data120 == "number"){
if(data120 < 0 || isNaN(data120)){
const err447 = {instancePath:instancePath+"/quotas/contrib/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data120};
if(vErrors === null){
vErrors = [err447];
}
else {
vErrors.push(err447);
}
errors++;
}
}
else {
const err448 = {instancePath:instancePath+"/quotas/contrib/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data120};
if(vErrors === null){
vErrors = [err448];
}
else {
vErrors.push(err448);
}
errors++;
}
if(errors > 0){
const emErrs134 = [];
for(const err449 of vErrors){
if(!err449.emUsed){
emErrs134.push(err449);
}
}
vErrors = emErrs134;
errors = emErrs134.length;
}
}
}
else {
const err450 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data118};
if(vErrors === null){
vErrors = [err450];
}
else {
vErrors.push(err450);
}
errors++;
}
if(errors > 0){
const emErrors32 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates32 = {required:{}};
let emPropParams30;
let emParamsErrors30;
for(const err451 of vErrors){
if((((((err451.keyword !== "errorMessage") && (!err451.emUsed)) && (err451.instancePath === instancePath+"/quotas/contrib")) && (err451.keyword in emErrors32)) && (err451.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err451.schemaPath.slice(23)))){
emPropParams30 = obj0[err451.keyword];
emParamsErrors30 = emErrors32[err451.keyword][err451.params[emPropParams30]];
if(emParamsErrors30){
emParamsErrors30.push(err451);
err451.emUsed = true;
}
}
}
for(const key36 in emErrors32){
for(const keyProp30 in emErrors32[key36]){
emParamsErrors30 = emErrors32[key36][keyProp30];
if(emParamsErrors30.length){
const tmpl30 = templates32[key36] && templates32[key36][keyProp30];
const err452 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors30},message:tmpl30 ? tmpl30() : schema33.errorMessage[key36][keyProp30],schema:schema33.errorMessage,parentSchema:schema33,data:data118};
if(vErrors === null){
vErrors = [err452];
}
else {
vErrors.push(err452);
}
errors++;
}
}
}
const emErrs135 = [];
for(const err453 of vErrors){
if(!err453.emUsed){
emErrs135.push(err453);
}
}
vErrors = emErrs135;
errors = emErrs135.length;
}
if(errors > 0){
const emErrors33 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates33 = {required:{}};
let emPropParams31;
let emParamsErrors31;
for(const err454 of vErrors){
if((((((err454.keyword !== "errorMessage") && (!err454.emUsed)) && (err454.instancePath === instancePath+"/quotas/contrib")) && (err454.keyword in emErrors33)) && (err454.schemaPath.indexOf("#/properties/quotas/properties/contrib") === 0)) && (/^\/[^\/]*$/.test(err454.schemaPath.slice(38)))){
emPropParams31 = obj0[err454.keyword];
emParamsErrors31 = emErrors33[err454.keyword][err454.params[emPropParams31]];
if(emParamsErrors31){
emParamsErrors31.push(err454);
err454.emUsed = true;
}
}
}
for(const key37 in emErrors33){
for(const keyProp31 in emErrors33[key37]){
emParamsErrors31 = emErrors33[key37][keyProp31];
if(emParamsErrors31.length){
const tmpl31 = templates33[key37] && templates33[key37][keyProp31];
const err455 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/properties/quotas/properties/contrib/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors31},message:tmpl31 ? tmpl31() : schema27.properties.quotas.properties.contrib.errorMessage[key37][keyProp31],schema:schema27.properties.quotas.properties.contrib.errorMessage,parentSchema:schema27.properties.quotas.properties.contrib,data:data118};
if(vErrors === null){
vErrors = [err455];
}
else {
vErrors.push(err455);
}
errors++;
}
}
}
const emErrs136 = [];
for(const err456 of vErrors){
if(!err456.emUsed){
emErrs136.push(err456);
}
}
vErrors = emErrs136;
errors = emErrs136.length;
}
}
if(data111.user !== undefined){
let data121 = data111.user;
if(data121 && typeof data121 == "object" && !Array.isArray(data121)){
if(data121.unlimited === undefined){
const err457 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data121};
if(vErrors === null){
vErrors = [err457];
}
else {
vErrors.push(err457);
}
errors++;
}
if(data121.monthlyLimit === undefined){
const err458 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data121};
if(vErrors === null){
vErrors = [err458];
}
else {
vErrors.push(err458);
}
errors++;
}
if(data121.unlimited !== undefined){
let data122 = data121.unlimited;
if(typeof data122 !== "boolean"){
const err459 = {instancePath:instancePath+"/quotas/user/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data122};
if(vErrors === null){
vErrors = [err459];
}
else {
vErrors.push(err459);
}
errors++;
}
if(errors > 0){
const emErrs137 = [];
for(const err460 of vErrors){
if(!err460.emUsed){
emErrs137.push(err460);
}
}
vErrors = emErrs137;
errors = emErrs137.length;
}
}
if(data121.monthlyLimit !== undefined){
let data123 = data121.monthlyLimit;
if(typeof data123 == "number"){
if(data123 < 0 || isNaN(data123)){
const err461 = {instancePath:instancePath+"/quotas/user/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data123};
if(vErrors === null){
vErrors = [err461];
}
else {
vErrors.push(err461);
}
errors++;
}
}
else {
const err462 = {instancePath:instancePath+"/quotas/user/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data123};
if(vErrors === null){
vErrors = [err462];
}
else {
vErrors.push(err462);
}
errors++;
}
if(errors > 0){
const emErrs138 = [];
for(const err463 of vErrors){
if(!err463.emUsed){
emErrs138.push(err463);
}
}
vErrors = emErrs138;
errors = emErrs138.length;
}
}
}
else {
const err464 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data121};
if(vErrors === null){
vErrors = [err464];
}
else {
vErrors.push(err464);
}
errors++;
}
if(errors > 0){
const emErrors34 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates34 = {required:{}};
let emPropParams32;
let emParamsErrors32;
for(const err465 of vErrors){
if((((((err465.keyword !== "errorMessage") && (!err465.emUsed)) && (err465.instancePath === instancePath+"/quotas/user")) && (err465.keyword in emErrors34)) && (err465.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err465.schemaPath.slice(23)))){
emPropParams32 = obj0[err465.keyword];
emParamsErrors32 = emErrors34[err465.keyword][err465.params[emPropParams32]];
if(emParamsErrors32){
emParamsErrors32.push(err465);
err465.emUsed = true;
}
}
}
for(const key38 in emErrors34){
for(const keyProp32 in emErrors34[key38]){
emParamsErrors32 = emErrors34[key38][keyProp32];
if(emParamsErrors32.length){
const tmpl32 = templates34[key38] && templates34[key38][keyProp32];
const err466 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors32},message:tmpl32 ? tmpl32() : schema33.errorMessage[key38][keyProp32],schema:schema33.errorMessage,parentSchema:schema33,data:data121};
if(vErrors === null){
vErrors = [err466];
}
else {
vErrors.push(err466);
}
errors++;
}
}
}
const emErrs139 = [];
for(const err467 of vErrors){
if(!err467.emUsed){
emErrs139.push(err467);
}
}
vErrors = emErrs139;
errors = emErrs139.length;
}
if(errors > 0){
const emErrors35 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates35 = {required:{}};
let emPropParams33;
let emParamsErrors33;
for(const err468 of vErrors){
if((((((err468.keyword !== "errorMessage") && (!err468.emUsed)) && (err468.instancePath === instancePath+"/quotas/user")) && (err468.keyword in emErrors35)) && (err468.schemaPath.indexOf("#/properties/quotas/properties/user") === 0)) && (/^\/[^\/]*$/.test(err468.schemaPath.slice(35)))){
emPropParams33 = obj0[err468.keyword];
emParamsErrors33 = emErrors35[err468.keyword][err468.params[emPropParams33]];
if(emParamsErrors33){
emParamsErrors33.push(err468);
err468.emUsed = true;
}
}
}
for(const key39 in emErrors35){
for(const keyProp33 in emErrors35[key39]){
emParamsErrors33 = emErrors35[key39][keyProp33];
if(emParamsErrors33.length){
const tmpl33 = templates35[key39] && templates35[key39][keyProp33];
const err469 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/properties/quotas/properties/user/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors33},message:tmpl33 ? tmpl33() : schema27.properties.quotas.properties.user.errorMessage[key39][keyProp33],schema:schema27.properties.quotas.properties.user.errorMessage,parentSchema:schema27.properties.quotas.properties.user,data:data121};
if(vErrors === null){
vErrors = [err469];
}
else {
vErrors.push(err469);
}
errors++;
}
}
}
const emErrs140 = [];
for(const err470 of vErrors){
if(!err470.emUsed){
emErrs140.push(err470);
}
}
vErrors = emErrs140;
errors = emErrs140.length;
}
}
if(data111.external !== undefined){
let data124 = data111.external;
if(data124 && typeof data124 == "object" && !Array.isArray(data124)){
if(data124.unlimited === undefined){
const err471 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data124};
if(vErrors === null){
vErrors = [err471];
}
else {
vErrors.push(err471);
}
errors++;
}
if(data124.monthlyLimit === undefined){
const err472 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data124};
if(vErrors === null){
vErrors = [err472];
}
else {
vErrors.push(err472);
}
errors++;
}
if(data124.unlimited !== undefined){
let data125 = data124.unlimited;
if(typeof data125 !== "boolean"){
const err473 = {instancePath:instancePath+"/quotas/external/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data125};
if(vErrors === null){
vErrors = [err473];
}
else {
vErrors.push(err473);
}
errors++;
}
if(errors > 0){
const emErrs141 = [];
for(const err474 of vErrors){
if(!err474.emUsed){
emErrs141.push(err474);
}
}
vErrors = emErrs141;
errors = emErrs141.length;
}
}
if(data124.monthlyLimit !== undefined){
let data126 = data124.monthlyLimit;
if(typeof data126 == "number"){
if(data126 < 0 || isNaN(data126)){
const err475 = {instancePath:instancePath+"/quotas/external/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data126};
if(vErrors === null){
vErrors = [err475];
}
else {
vErrors.push(err475);
}
errors++;
}
}
else {
const err476 = {instancePath:instancePath+"/quotas/external/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data126};
if(vErrors === null){
vErrors = [err476];
}
else {
vErrors.push(err476);
}
errors++;
}
if(errors > 0){
const emErrs142 = [];
for(const err477 of vErrors){
if(!err477.emUsed){
emErrs142.push(err477);
}
}
vErrors = emErrs142;
errors = emErrs142.length;
}
}
}
else {
const err478 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data124};
if(vErrors === null){
vErrors = [err478];
}
else {
vErrors.push(err478);
}
errors++;
}
if(errors > 0){
const emErrors36 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates36 = {required:{}};
let emPropParams34;
let emParamsErrors34;
for(const err479 of vErrors){
if((((((err479.keyword !== "errorMessage") && (!err479.emUsed)) && (err479.instancePath === instancePath+"/quotas/external")) && (err479.keyword in emErrors36)) && (err479.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err479.schemaPath.slice(23)))){
emPropParams34 = obj0[err479.keyword];
emParamsErrors34 = emErrors36[err479.keyword][err479.params[emPropParams34]];
if(emParamsErrors34){
emParamsErrors34.push(err479);
err479.emUsed = true;
}
}
}
for(const key40 in emErrors36){
for(const keyProp34 in emErrors36[key40]){
emParamsErrors34 = emErrors36[key40][keyProp34];
if(emParamsErrors34.length){
const tmpl34 = templates36[key40] && templates36[key40][keyProp34];
const err480 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors34},message:tmpl34 ? tmpl34() : schema33.errorMessage[key40][keyProp34],schema:schema33.errorMessage,parentSchema:schema33,data:data124};
if(vErrors === null){
vErrors = [err480];
}
else {
vErrors.push(err480);
}
errors++;
}
}
}
const emErrs143 = [];
for(const err481 of vErrors){
if(!err481.emUsed){
emErrs143.push(err481);
}
}
vErrors = emErrs143;
errors = emErrs143.length;
}
if(errors > 0){
const emErrors37 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates37 = {required:{}};
let emPropParams35;
let emParamsErrors35;
for(const err482 of vErrors){
if((((((err482.keyword !== "errorMessage") && (!err482.emUsed)) && (err482.instancePath === instancePath+"/quotas/external")) && (err482.keyword in emErrors37)) && (err482.schemaPath.indexOf("#/properties/quotas/properties/external") === 0)) && (/^\/[^\/]*$/.test(err482.schemaPath.slice(39)))){
emPropParams35 = obj0[err482.keyword];
emParamsErrors35 = emErrors37[err482.keyword][err482.params[emPropParams35]];
if(emParamsErrors35){
emParamsErrors35.push(err482);
err482.emUsed = true;
}
}
}
for(const key41 in emErrors37){
for(const keyProp35 in emErrors37[key41]){
emParamsErrors35 = emErrors37[key41][keyProp35];
if(emParamsErrors35.length){
const tmpl35 = templates37[key41] && templates37[key41][keyProp35];
const err483 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/properties/quotas/properties/external/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors35},message:tmpl35 ? tmpl35() : schema27.properties.quotas.properties.external.errorMessage[key41][keyProp35],schema:schema27.properties.quotas.properties.external.errorMessage,parentSchema:schema27.properties.quotas.properties.external,data:data124};
if(vErrors === null){
vErrors = [err483];
}
else {
vErrors.push(err483);
}
errors++;
}
}
}
const emErrs144 = [];
for(const err484 of vErrors){
if(!err484.emUsed){
emErrs144.push(err484);
}
}
vErrors = emErrs144;
errors = emErrs144.length;
}
}
if(data111.anonymous !== undefined){
let data127 = data111.anonymous;
if(data127 && typeof data127 == "object" && !Array.isArray(data127)){
if(data127.unlimited === undefined){
const err485 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data127};
if(vErrors === null){
vErrors = [err485];
}
else {
vErrors.push(err485);
}
errors++;
}
if(data127.monthlyLimit === undefined){
const err486 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data127};
if(vErrors === null){
vErrors = [err486];
}
else {
vErrors.push(err486);
}
errors++;
}
if(data127.unlimited !== undefined){
let data128 = data127.unlimited;
if(typeof data128 !== "boolean"){
const err487 = {instancePath:instancePath+"/quotas/anonymous/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data128};
if(vErrors === null){
vErrors = [err487];
}
else {
vErrors.push(err487);
}
errors++;
}
if(errors > 0){
const emErrs145 = [];
for(const err488 of vErrors){
if(!err488.emUsed){
emErrs145.push(err488);
}
}
vErrors = emErrs145;
errors = emErrs145.length;
}
}
if(data127.monthlyLimit !== undefined){
let data129 = data127.monthlyLimit;
if(typeof data129 == "number"){
if(data129 < 0 || isNaN(data129)){
const err489 = {instancePath:instancePath+"/quotas/anonymous/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data129};
if(vErrors === null){
vErrors = [err489];
}
else {
vErrors.push(err489);
}
errors++;
}
}
else {
const err490 = {instancePath:instancePath+"/quotas/anonymous/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data129};
if(vErrors === null){
vErrors = [err490];
}
else {
vErrors.push(err490);
}
errors++;
}
if(errors > 0){
const emErrs146 = [];
for(const err491 of vErrors){
if(!err491.emUsed){
emErrs146.push(err491);
}
}
vErrors = emErrs146;
errors = emErrs146.length;
}
}
}
else {
const err492 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data127};
if(vErrors === null){
vErrors = [err492];
}
else {
vErrors.push(err492);
}
errors++;
}
if(errors > 0){
const emErrors38 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates38 = {required:{}};
let emPropParams36;
let emParamsErrors36;
for(const err493 of vErrors){
if((((((err493.keyword !== "errorMessage") && (!err493.emUsed)) && (err493.instancePath === instancePath+"/quotas/anonymous")) && (err493.keyword in emErrors38)) && (err493.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err493.schemaPath.slice(23)))){
emPropParams36 = obj0[err493.keyword];
emParamsErrors36 = emErrors38[err493.keyword][err493.params[emPropParams36]];
if(emParamsErrors36){
emParamsErrors36.push(err493);
err493.emUsed = true;
}
}
}
for(const key42 in emErrors38){
for(const keyProp36 in emErrors38[key42]){
emParamsErrors36 = emErrors38[key42][keyProp36];
if(emParamsErrors36.length){
const tmpl36 = templates38[key42] && templates38[key42][keyProp36];
const err494 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors36},message:tmpl36 ? tmpl36() : schema33.errorMessage[key42][keyProp36],schema:schema33.errorMessage,parentSchema:schema33,data:data127};
if(vErrors === null){
vErrors = [err494];
}
else {
vErrors.push(err494);
}
errors++;
}
}
}
const emErrs147 = [];
for(const err495 of vErrors){
if(!err495.emUsed){
emErrs147.push(err495);
}
}
vErrors = emErrs147;
errors = emErrs147.length;
}
if(errors > 0){
const emErrors39 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates39 = {required:{}};
let emPropParams37;
let emParamsErrors37;
for(const err496 of vErrors){
if((((((err496.keyword !== "errorMessage") && (!err496.emUsed)) && (err496.instancePath === instancePath+"/quotas/anonymous")) && (err496.keyword in emErrors39)) && (err496.schemaPath.indexOf("#/properties/quotas/properties/anonymous") === 0)) && (/^\/[^\/]*$/.test(err496.schemaPath.slice(40)))){
emPropParams37 = obj0[err496.keyword];
emParamsErrors37 = emErrors39[err496.keyword][err496.params[emPropParams37]];
if(emParamsErrors37){
emParamsErrors37.push(err496);
err496.emUsed = true;
}
}
}
for(const key43 in emErrors39){
for(const keyProp37 in emErrors39[key43]){
emParamsErrors37 = emErrors39[key43][keyProp37];
if(emParamsErrors37.length){
const tmpl37 = templates39[key43] && templates39[key43][keyProp37];
const err497 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/properties/quotas/properties/anonymous/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors37},message:tmpl37 ? tmpl37() : schema27.properties.quotas.properties.anonymous.errorMessage[key43][keyProp37],schema:schema27.properties.quotas.properties.anonymous.errorMessage,parentSchema:schema27.properties.quotas.properties.anonymous,data:data127};
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
const emErrs148 = [];
for(const err498 of vErrors){
if(!err498.emUsed){
emErrs148.push(err498);
}
}
vErrors = emErrs148;
errors = emErrs148.length;
}
}
if(data111.untrusted !== undefined){
let data130 = data111.untrusted;
if(data130 && typeof data130 == "object" && !Array.isArray(data130)){
if(data130.unlimited === undefined){
const err499 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema33.required,parentSchema:schema33,data:data130};
if(vErrors === null){
vErrors = [err499];
}
else {
vErrors.push(err499);
}
errors++;
}
if(data130.monthlyLimit === undefined){
const err500 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema33.required,parentSchema:schema33,data:data130};
if(vErrors === null){
vErrors = [err500];
}
else {
vErrors.push(err500);
}
errors++;
}
if(data130.unlimited !== undefined){
let data131 = data130.unlimited;
if(typeof data131 !== "boolean"){
const err501 = {instancePath:instancePath+"/quotas/untrusted/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema33.properties.unlimited.type,parentSchema:schema33.properties.unlimited,data:data131};
if(vErrors === null){
vErrors = [err501];
}
else {
vErrors.push(err501);
}
errors++;
}
if(errors > 0){
const emErrs149 = [];
for(const err502 of vErrors){
if(!err502.emUsed){
emErrs149.push(err502);
}
}
vErrors = emErrs149;
errors = emErrs149.length;
}
}
if(data130.monthlyLimit !== undefined){
let data132 = data130.monthlyLimit;
if(typeof data132 == "number"){
if(data132 < 0 || isNaN(data132)){
const err503 = {instancePath:instancePath+"/quotas/untrusted/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema33.properties.monthlyLimit,data:data132};
if(vErrors === null){
vErrors = [err503];
}
else {
vErrors.push(err503);
}
errors++;
}
}
else {
const err504 = {instancePath:instancePath+"/quotas/untrusted/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema33.properties.monthlyLimit.type,parentSchema:schema33.properties.monthlyLimit,data:data132};
if(vErrors === null){
vErrors = [err504];
}
else {
vErrors.push(err504);
}
errors++;
}
if(errors > 0){
const emErrs150 = [];
for(const err505 of vErrors){
if(!err505.emUsed){
emErrs150.push(err505);
}
}
vErrors = emErrs150;
errors = emErrs150.length;
}
}
}
else {
const err506 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data:data130};
if(vErrors === null){
vErrors = [err506];
}
else {
vErrors.push(err506);
}
errors++;
}
if(errors > 0){
const emErrors40 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates40 = {required:{}};
let emPropParams38;
let emParamsErrors38;
for(const err507 of vErrors){
if((((((err507.keyword !== "errorMessage") && (!err507.emUsed)) && (err507.instancePath === instancePath+"/quotas/untrusted")) && (err507.keyword in emErrors40)) && (err507.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err507.schemaPath.slice(23)))){
emPropParams38 = obj0[err507.keyword];
emParamsErrors38 = emErrors40[err507.keyword][err507.params[emPropParams38]];
if(emParamsErrors38){
emParamsErrors38.push(err507);
err507.emUsed = true;
}
}
}
for(const key44 in emErrors40){
for(const keyProp38 in emErrors40[key44]){
emParamsErrors38 = emErrors40[key44][keyProp38];
if(emParamsErrors38.length){
const tmpl38 = templates40[key44] && templates40[key44][keyProp38];
const err508 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors38},message:tmpl38 ? tmpl38() : schema33.errorMessage[key44][keyProp38],schema:schema33.errorMessage,parentSchema:schema33,data:data130};
if(vErrors === null){
vErrors = [err508];
}
else {
vErrors.push(err508);
}
errors++;
}
}
}
const emErrs151 = [];
for(const err509 of vErrors){
if(!err509.emUsed){
emErrs151.push(err509);
}
}
vErrors = emErrs151;
errors = emErrs151.length;
}
if(errors > 0){
const emErrors41 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates41 = {required:{}};
let emPropParams39;
let emParamsErrors39;
for(const err510 of vErrors){
if((((((err510.keyword !== "errorMessage") && (!err510.emUsed)) && (err510.instancePath === instancePath+"/quotas/untrusted")) && (err510.keyword in emErrors41)) && (err510.schemaPath.indexOf("#/properties/quotas/properties/untrusted") === 0)) && (/^\/[^\/]*$/.test(err510.schemaPath.slice(40)))){
emPropParams39 = obj0[err510.keyword];
emParamsErrors39 = emErrors41[err510.keyword][err510.params[emPropParams39]];
if(emParamsErrors39){
emParamsErrors39.push(err510);
err510.emUsed = true;
}
}
}
for(const key45 in emErrors41){
for(const keyProp39 in emErrors41[key45]){
emParamsErrors39 = emErrors41[key45][keyProp39];
if(emParamsErrors39.length){
const tmpl39 = templates41[key45] && templates41[key45][keyProp39];
const err511 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/properties/quotas/properties/untrusted/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors39},message:tmpl39 ? tmpl39() : schema27.properties.quotas.properties.untrusted.errorMessage[key45][keyProp39],schema:schema27.properties.quotas.properties.untrusted.errorMessage,parentSchema:schema27.properties.quotas.properties.untrusted,data:data130};
if(vErrors === null){
vErrors = [err511];
}
else {
vErrors.push(err511);
}
errors++;
}
}
}
const emErrs152 = [];
for(const err512 of vErrors){
if(!err512.emUsed){
emErrs152.push(err512);
}
}
vErrors = emErrs152;
errors = emErrs152.length;
}
}
}
else {
const err513 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.quotas.type,parentSchema:schema27.properties.quotas,data:data111};
if(vErrors === null){
vErrors = [err513];
}
else {
vErrors.push(err513);
}
errors++;
}
if(errors > 0){
const emErrors42 = {"required":{"global":[],"admin":[],"contrib":[],"user":[],"external":[],"anonymous":[]}};
const templates42 = {required:{}};
let emPropParams40;
let emParamsErrors40;
for(const err514 of vErrors){
if((((((err514.keyword !== "errorMessage") && (!err514.emUsed)) && (err514.instancePath === instancePath+"/quotas")) && (err514.keyword in emErrors42)) && (err514.schemaPath.indexOf("#/properties/quotas") === 0)) && (/^\/[^\/]*$/.test(err514.schemaPath.slice(19)))){
emPropParams40 = obj0[err514.keyword];
emParamsErrors40 = emErrors42[err514.keyword][err514.params[emPropParams40]];
if(emParamsErrors40){
emParamsErrors40.push(err514);
err514.emUsed = true;
}
}
}
for(const key46 in emErrors42){
for(const keyProp40 in emErrors42[key46]){
emParamsErrors40 = emErrors42[key46][keyProp40];
if(emParamsErrors40.length){
const tmpl40 = templates42[key46] && templates42[key46][keyProp40];
const err515 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors40},message:tmpl40 ? tmpl40() : schema27.properties.quotas.errorMessage[key46][keyProp40],schema:schema27.properties.quotas.errorMessage,parentSchema:schema27.properties.quotas,data:data111};
if(vErrors === null){
vErrors = [err515];
}
else {
vErrors.push(err515);
}
errors++;
}
}
}
const emErrs153 = [];
for(const err516 of vErrors){
if(!err516.emUsed){
emErrs153.push(err516);
}
}
vErrors = emErrs153;
errors = emErrs153.length;
}
}
}
else {
const err517 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err517];
}
else {
vErrors.push(err517);
}
errors++;
}
if(errors > 0){
const emErrors43 = {"required":{"providers":[]}};
const templates43 = {required:{}};
let emPropParams41;
let emParamsErrors41;
for(const err518 of vErrors){
if((((((err518.keyword !== "errorMessage") && (!err518.emUsed)) && (err518.instancePath === instancePath)) && (err518.keyword in emErrors43)) && (err518.schemaPath.indexOf("#") === 0)) && (/^\/[^\/]*$/.test(err518.schemaPath.slice(1)))){
emPropParams41 = obj0[err518.keyword];
emParamsErrors41 = emErrors43[err518.keyword][err518.params[emPropParams41]];
if(emParamsErrors41){
emParamsErrors41.push(err518);
err518.emUsed = true;
}
}
}
for(const key47 in emErrors43){
for(const keyProp41 in emErrors43[key47]){
emParamsErrors41 = emErrors43[key47][keyProp41];
if(emParamsErrors41.length){
const tmpl41 = templates43[key47] && templates43[key47][keyProp41];
const err519 = {instancePath,schemaPath:"#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors41},message:tmpl41 ? tmpl41() : schema27.errorMessage[key47][keyProp41],schema:schema27.errorMessage,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err519];
}
else {
vErrors.push(err519);
}
errors++;
}
}
}
const emErrs154 = [];
for(const err520 of vErrors){
if(!err520.emUsed){
emErrs154.push(err520);
}
}
vErrors = emErrs154;
errors = emErrs154.length;
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
}function expression2(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return (parent.data.providers?.length)
}function expression3(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ([{"const":"anonymous","title":"Anonyme","key":"anonymous","value":"anonymous"},{"const":"external","title":"Externe","key":"external","value":"external"},{"const":"user","title":"Utilisateur","key":"user","value":"user"},{"const":"contrib","title":"Contributeur","key":"contrib","value":"contrib"},{"const":"admin","title":"Administrateur","key":"admin","value":"admin"}])
}function expression4(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ([{"key":"user","title":"user","value":"user"},{"key":"organization","title":"organization","value":"organization"}])
}function expression5(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item ? `${item.name || ""} - ${item.id.slice(0, 8)}` : "")
}function expression6(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (summary)
}function expression7(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ({ id: crypto.randomUUID() })
}function expression8(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.constData)
}function expression9(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Open AI")
}function expression10(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Anthropic")
}function expression11(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Google")
}function expression12(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Mistral")
}function expression13(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("OpenRouter")
}function expression14(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Ollama")
}function expression15(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Scaleway")
}function expression16(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("OpenAI Compatible")
}function expression17(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ("Mock")
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
return (context.accountType === "organization")
}function expression23(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
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

    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items": {
      title: "",
      root: "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items",
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
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/settings-put#": {
      title: "Paramètres",
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#",
      refPointer: "https://github.com/data-fair/agents/settings-put#",
      pure: false,
      propertyKeys: ["createdAt", "updatedAt", "storeTraces", "moderation", "owner", "providers", "models", "quotas"],
      roPropertyKeys: ["createdAt", "updatedAt", "owner"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/createdAt", "https://github.com/data-fair/agents/settings-put#/properties/updatedAt", "https://github.com/data-fair/agents/settings-put#/properties/storeTraces", "https://github.com/data-fair/agents/settings-put#/properties/moderation", "https://github.com/data-fair/agents/settings-put#/properties/owner", "https://github.com/data-fair/agents/settings-put#/properties/providers", "https://github.com/data-fair/agents/settings-put#/properties/models", "https://github.com/data-fair/agents/settings-put#/properties/quotas"]
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
      children: ["https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/enabled", "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories"]
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
      childrenTrees: ["https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items"]
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
      title: "Fournisseurs IA",
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
      title: "Fournisseur",
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey", "baseURL"],
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
      propertyKeys: ["type", "id", "name", "enabled", "apiKey"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey"]
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
      propertyKeys: ["type", "id", "name", "enabled", "apiKey"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey"]
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
      propertyKeys: ["type", "id", "name", "enabled", "apiKey"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey"]
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
      propertyKeys: ["type", "id", "name", "enabled", "apiKey"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey"]
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
      propertyKeys: ["type", "id", "name", "enabled", "apiKey", "baseURL"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL"]
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
      propertyKeys: ["type", "id", "name", "enabled", "apiKey"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey"]
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "baseURL", "apiKey"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey"]
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8": {
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled"]
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
      childrenTrees: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8"],
      discriminator: "type",
      pure: true,
      propertyKeys: ["type", "id", "name", "enabled", "apiKey", "baseURL"],
      roPropertyKeys: ["id"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models": {
      title: "Modèles",
      key: "models",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models",
      pure: false,
      propertyKeys: ["assistant", "tools", "summarizer", "evaluator", "moderator"],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant": {
      title: "Assistant",
      key: "assistant",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant",
      pure: false,
      propertyKeys: ["model", "inputPricePerMillion", "outputPricePerMillion"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/inputPricePerMillion", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/outputPricePerMillion"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model": {
      title: "Modèle",
      key: "model",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model",
      pure: false,
      propertyKeys: ["id", "name", "provider"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id", "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name", "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider"]
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
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type", "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name", "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id"]
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
      propertyKeys: ["model", "inputPricePerMillion", "outputPricePerMillion"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/model", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/inputPricePerMillion", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/outputPricePerMillion"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/model": {
      title: "Modèle",
      key: "model",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/model",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model",
      pure: false,
      propertyKeys: ["id", "name", "provider"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id", "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name", "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider"]
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
      propertyKeys: ["model", "inputPricePerMillion", "outputPricePerMillion"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/inputPricePerMillion", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/outputPricePerMillion"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model": {
      title: "Modèle",
      key: "model",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model",
      pure: false,
      propertyKeys: ["id", "name", "provider"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id", "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name", "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider"]
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
      propertyKeys: ["model", "inputPricePerMillion", "outputPricePerMillion"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/model", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/inputPricePerMillion", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/outputPricePerMillion"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/model": {
      title: "Modèle",
      key: "model",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/model",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model",
      pure: false,
      propertyKeys: ["id", "name", "provider"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id", "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name", "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider"]
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
      propertyKeys: ["model", "inputPricePerMillion", "outputPricePerMillion"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/model", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/inputPricePerMillion", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/outputPricePerMillion"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/model": {
      title: "Modèle",
      key: "model",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/model",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/Model",
      pure: false,
      propertyKeys: ["id", "name", "provider"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id", "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name", "https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider"]
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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas": {
      title: "Quotas par rôle",
      key: "quotas",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas",
      pure: false,
      propertyKeys: ["global", "admin", "contrib", "user", "external", "anonymous", "untrusted"],
      roPropertyKeys: [],
      nullable: false,
      required: false,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/global", "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/admin", "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/contrib", "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/user", "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/external", "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/anonymous", "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/untrusted"]
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
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"]
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
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"]
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
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"]
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
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"]
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
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"]
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
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"]
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
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit"]
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
        key: "moderation"
      }, {
        key: "owner"
      }, {
        key: "providers"
      }, {
        key: "models"
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

    "https://github.com/data-fair/agents/settings-put#/properties/moderation": {
      if: {
        type: "js-eval",
        expr: "parent.data.providers?.length",
        pure: false,
        dataAlias: "value",
        ref: 2
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
        ref: 3
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
        ref: 3
      },

      label: "",
      nullable: true
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
        ref: 4
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
        ref: 5
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
          ref: 7
        },

        if: {
          type: "js-eval",
          expr: "summary",
          pure: true,
          dataAlias: "value",
          ref: 6
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
          ref: 7
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
        ref: 8
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
        ref: 9
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
        ref: 8
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
        ref: 10
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
        ref: 8
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
        ref: 11
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
        ref: 8
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
        ref: 12
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
        ref: 8
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
        ref: 13
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
        ref: 8
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
        ref: 14
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
      }],

      title: "Scaleway",
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
        ref: 8
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
        ref: 15
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
        ref: 8
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
        ref: 16
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
        ref: 8
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
        ref: 17
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
        ref: 2
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
        key: "inputPricePerMillion",

        cols: {
          xs: 12,
          sm: 6
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

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée (par million de tokens)",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/outputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix de sortie (par million de tokens)",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools": {
      comp: "card",

      children: [{
        key: "model"
      }, {
        key: "inputPricePerMillion",

        cols: {
          xs: 12,
          sm: 6
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

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée (par million de tokens)",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/outputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix de sortie (par million de tokens)",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer": {
      comp: "card",

      children: [{
        key: "model"
      }, {
        key: "inputPricePerMillion",

        cols: {
          xs: 12,
          sm: 6
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

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée (par million de tokens)",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/outputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix de sortie (par million de tokens)",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator": {
      comp: "card",

      children: [{
        key: "model"
      }, {
        key: "inputPricePerMillion",

        cols: {
          xs: 12,
          sm: 6
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

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée (par million de tokens)",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/outputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix de sortie (par million de tokens)",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator": {
      comp: "card",

      children: [{
        key: "model"
      }, {
        key: "inputPricePerMillion",

        cols: {
          xs: 12,
          sm: 6
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

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix d'entrée (par million de tokens)",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/outputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Prix de sortie (par million de tokens)",
      defaultData: 0,

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
        ref: 2
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
          ref: 22
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
          ref: 22
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
        ref: 23
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
    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items": validate22,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0": validate24,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1": validate25,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2": validate26,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3": validate27,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4": validate28,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5": validate29,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6": validate30,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7": validate31,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8": validate32,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items": validate33,
    "https://github.com/data-fair/agents/settings-put#": validate34
  },

  validationErrors: {},
  expressions: [expression0, expression1, expression2, expression3, expression4, expression5, expression6, expression7, expression8, expression9, expression10, expression11, expression12, expression13, expression14, expression15, expression16, expression17, expression18, expression19, expression20, expression21, expression22, expression23],
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