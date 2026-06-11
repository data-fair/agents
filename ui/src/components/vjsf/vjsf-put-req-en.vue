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


import localizeErrors from "ajv-i18n/localize/en/index.js";
import { fullFormats } from "ajv-formats/dist/formats.js";

const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0"};
const schema40 = {"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}};
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

const schema41 = {"$id":"export1","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1"};
const schema42 = {"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}};

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

const schema43 = {"$id":"export2","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2"};
const schema44 = {"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}};

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

const schema45 = {"$id":"export3","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3"};
const schema46 = {"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}};

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

const schema47 = {"$id":"export4","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4"};
const schema48 = {"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}};

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

const schema49 = {"$id":"export5","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5"};
const schema50 = {"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"Base URL","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information","baseURL":"required information"}}};

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

const schema51 = {"$id":"export6","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6"};
const schema52 = {"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Scaleway\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information","apiKey":"required information"}}};

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
}
else {
const err16 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema52.type,parentSchema:schema52,data};
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
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema52.errorMessage[key0][keyProp0],schema:schema52.errorMessage,parentSchema:schema52,data};
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
validate29.errors = vErrors;
return errors === 0;
}
validate29.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"apiKey":true},"dynamicProps":false,"dynamicItems":false};

const schema53 = {"$id":"export7","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7"};
const schema54 = {"required":["type","name","id","enabled","baseURL"],"title":"OpenAI Compatible","description":"Generic provider for any OpenAI-compatible endpoint (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). API Key is optional for unauthenticated local servers.","properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"OpenAI Compatible\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled","errorMessage":{}},"baseURL":{"type":"string","title":"Base URL","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information","baseURL":"required information"}}};

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
}
else {
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema54.type,parentSchema:schema54,data};
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
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema54.errorMessage[key0][keyProp0],schema:schema54.errorMessage,parentSchema:schema54,data};
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
validate30.errors = vErrors;
return errors === 0;
}
validate30.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true,"baseURL":true,"apiKey":true},"dynamicProps":false,"dynamicItems":false};

const schema55 = {"$id":"export8","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8"};
const schema56 = {"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}};

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

const schema57 = {"$id":"export9","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items"};
const schema58 = {"type":"object","title":"Provider","unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"Base URL","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information","baseURL":"required information"}}},{"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Scaleway\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information","apiKey":"required information"}}},{"required":["type","name","id","enabled","baseURL"],"title":"OpenAI Compatible","description":"Generic provider for any OpenAI-compatible endpoint (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). API Key is optional for unauthenticated local servers.","properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"OpenAI Compatible\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled","errorMessage":{}},"baseURL":{"type":"string","title":"Base URL","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information","baseURL":"required information"}}},{"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items","errorMessage":{"oneOf":"chose one"}};

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
}
else {
const err133 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[6].type,parentSchema:schema58.oneOf[6],data};
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
const err135 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema58.oneOf[6].errorMessage[key6][keyProp6],schema:schema58.oneOf[6].errorMessage,parentSchema:schema58.oneOf[6],data};
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
const err137 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema58.oneOf[7].required,parentSchema:schema58.oneOf[7],data};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
if(data.name === undefined){
const err138 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema58.oneOf[7].required,parentSchema:schema58.oneOf[7],data};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
if(data.id === undefined){
const err139 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema58.oneOf[7].required,parentSchema:schema58.oneOf[7],data};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
if(data.enabled === undefined){
const err140 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema58.oneOf[7].required,parentSchema:schema58.oneOf[7],data};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
if(data.baseURL === undefined){
const err141 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema58.oneOf[7].required,parentSchema:schema58.oneOf[7],data};
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
const err142 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[7].properties.type.type,parentSchema:schema58.oneOf[7].properties.type,data:data36};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
if("openai-compatible" !== data36){
const err143 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue: "openai-compatible"},message:"must be equal to constant",schema:"openai-compatible",parentSchema:schema58.oneOf[7].properties.type,data:data36};
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
const err145 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[7].properties.id.type,parentSchema:schema58.oneOf[7].properties.id,data:data37};
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
const err147 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[7].properties.name.type,parentSchema:schema58.oneOf[7].properties.name,data:data38};
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
const err149 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema58.oneOf[7].properties.enabled.type,parentSchema:schema58.oneOf[7].properties.enabled,data:data39};
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
const err151 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[7].properties.baseURL.type,parentSchema:schema58.oneOf[7].properties.baseURL,data:data40};
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
const err153 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[7].properties.apiKey.type,parentSchema:schema58.oneOf[7].properties.apiKey,data:data41};
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
const err155 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[7].type,parentSchema:schema58.oneOf[7],data};
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
const err157 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors7},message:tmpl7 ? tmpl7() : schema58.oneOf[7].errorMessage[key7][keyProp7],schema:schema58.oneOf[7].errorMessage,parentSchema:schema58.oneOf[7],data};
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
const err159 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema58.oneOf[8].required,parentSchema:schema58.oneOf[8],data};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
if(data.name === undefined){
const err160 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema58.oneOf[8].required,parentSchema:schema58.oneOf[8],data};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
if(data.id === undefined){
const err161 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema58.oneOf[8].required,parentSchema:schema58.oneOf[8],data};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
if(data.enabled === undefined){
const err162 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema58.oneOf[8].required,parentSchema:schema58.oneOf[8],data};
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
const err163 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[8].properties.type.type,parentSchema:schema58.oneOf[8].properties.type,data:data42};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
if("mock" !== data42){
const err164 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema58.oneOf[8].properties.type,data:data42};
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
const err166 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[8].properties.id.type,parentSchema:schema58.oneOf[8].properties.id,data:data43};
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
const err168 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[8].properties.name.type,parentSchema:schema58.oneOf[8].properties.name,data:data44};
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
const err170 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema58.oneOf[8].properties.enabled.type,parentSchema:schema58.oneOf[8].properties.enabled,data:data45};
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
const err172 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[8].type,parentSchema:schema58.oneOf[8],data};
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
const err174 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors8},message:tmpl8 ? tmpl8() : schema58.oneOf[8].errorMessage[key8][keyProp8],schema:schema58.oneOf[8].errorMessage,parentSchema:schema58.oneOf[8],data};
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
const err176 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema58.oneOf,parentSchema:schema58,data};
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
const err177 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/unevaluatedProperties",keyword:"unevaluatedProperties",params:{unevaluatedProperty: key9},message:"must NOT have unevaluated properties",schema:false,parentSchema:schema58,data};
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
const err178 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.type,parentSchema:schema58,data};
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
const err180 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors9[key10]},message:key10 in templates9 ? templates9[key10]() : schema58.errorMessage[key10],schema:schema58.errorMessage,parentSchema:schema58,data};
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
validate32.errors = vErrors;
return errors === 0;
}
validate32.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema59 = {"$id":"export10","$ref":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items"};
const schema60 = {"type":"string","oneOf":[{"const":"anonymous","title":"Anonymous"},{"const":"external","title":"External"},{"const":"user","title":"User"},{"const":"contrib","title":"Contributor"},{"const":"admin","title":"Admin"}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items","errorMessage":{"oneOf":"chose one"}};

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

const schema61 = {"$id":"export11","$ref":"https://github.com/data-fair/agents/settings-put#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/settings-put","x-exports":["validate","types","vjsf"],"title":"Settings","layout":{"title":null},"definitions":{"RoleQuota":{"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Unlimited","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited","errorMessage":{}},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Monthly Limit","description":"Weekly limit = monthly / 2, daily limit = monthly / 4","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"Model":{"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":{"pure":false,"type":"js-tpl","dataAlias":"value","expr":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}","ref":17},"itemsResults":{"pure":true,"type":"js-eval","dataAlias":"body","expr":"data.results","ref":20},"itemTitle":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","ref":18},"itemKey":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"item.id","ref":19},"returnObjects":true}},"properties":{"id":{"type":"string","title":"Model ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id","errorMessage":{}},"name":{"type":"string","title":"Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name","errorMessage":{}},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type","errorMessage":{}},"name":{"type":"string","title":"Provider Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name","errorMessage":{}},"id":{"type":"string","title":"Provider ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider","errorMessage":{"required":{"type":"required information","name":"required information","id":"required information"}}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model","errorMessage":{"required":{"id":"required information","name":"required information","provider":"required information"}}}},"type":"object","additionalProperties":false,"required":["providers"],"properties":{"createdAt":{"type":"string","format":"date-time","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/createdAt","errorMessage":{}},"updatedAt":{"type":"string","format":"date-time","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/updatedAt","errorMessage":{}},"storeTraces":{"type":"boolean","title":"Store conversation traces","description":"When enabled, conversations of consenting users are stored on the server for 30 days for admin review. Each user must explicitly accept.","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/storeTraces","errorMessage":{}},"owner":{"type":"object","additionalProperties":false,"required":["type","id"],"readOnly":true,"properties":{"type":{"type":"string","enum":["user","organization"],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/type","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/name","errorMessage":{}},"department":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/department","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner","errorMessage":{"required":{"type":"required information","id":"required information"}}},"providers":{"type":"array","title":"AI Providers","layout":{"itemTitle":"item ? `${item.name || \"\"} - ${item.id.slice(0, 8)}` : \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","title":"Provider","unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"Base URL","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information","baseURL":"required information"}}},{"required":["type","name","id","enabled","apiKey"],"title":"Scaleway","properties":{"type":{"type":"string","title":"Provider Type","const":"scaleway","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Scaleway\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information","apiKey":"required information"}}},{"required":["type","name","id","enabled","baseURL"],"title":"OpenAI Compatible","description":"Generic provider for any OpenAI-compatible endpoint (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). API Key is optional for unauthenticated local servers.","properties":{"type":{"type":"string","title":"Provider Type","const":"openai-compatible","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"OpenAI Compatible\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled","errorMessage":{}},"baseURL":{"type":"string","title":"Base URL","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information","baseURL":"required information"}}},{"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items","errorMessage":{"oneOf":"chose one"}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers","errorMessage":{}},"models":{"type":"object","title":"Models","layout":{"title":null,"if":"parent.data.providers?.length"},"default":{},"properties":{"assistant":{"type":"object","title":"Assistant","description":"The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.\n\nRecommendations: GPT-5.4, Claude 4.5 Sonnet, Kimi K2, Mistral Large 3, etc.","layout":{"comp":"card","children":[{"key":"model"},{"key":"inputPricePerMillion","cols":6},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model","errorMessage":{"required":{"id":"required information","name":"required information","provider":"required information"}}},"inputPricePerMillion":{"type":"number","title":"Input price (per 1M tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/inputPricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Output price (per 1M tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant","errorMessage":{}},"tools":{"type":"object","title":"Tools","description":"The \"technician.\" Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.\n\nRecommendations: GPT-5.4 Mini, Mistral DevStral, Claude 4.5 Sonnet (Computer Use), MiMo-V2-Flash, etc.","layout":{"comp":"card","children":[{"key":"model"},{"key":"inputPricePerMillion","cols":6},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/model","errorMessage":{"required":{"id":"required information","name":"required information","provider":"required information"}}},"inputPricePerMillion":{"type":"number","title":"Input price (per 1M tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/inputPricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Output price (per 1M tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools","errorMessage":{}},"summarizer":{"type":"object","title":"Summarizer","description":"A \"shorthand\" specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.\n\nRecommendations: GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Qwen3 (8B), etc.","layout":{"comp":"card","children":[{"key":"model"},{"key":"inputPricePerMillion","cols":6},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model","errorMessage":{"required":{"id":"required information","name":"required information","provider":"required information"}}},"inputPricePerMillion":{"type":"number","title":"Input price (per 1M tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/inputPricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Output price (per 1M tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer","errorMessage":{}},"evaluator":{"type":"object","title":"Evaluator","description":"The \"quality controller.\" Analyzes the assistant's logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.\n\nRecommendations: Claude Opus 4.6, GPT-5.4 (Reasoning), DeepSeek-R1, Pharia-1-LLM, etc.","layout":{"comp":"card","children":[{"key":"model"},{"key":"inputPricePerMillion","cols":6},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/model","errorMessage":{"required":{"id":"required information","name":"required information","provider":"required information"}}},"inputPricePerMillion":{"type":"number","title":"Input price (per 1M tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/inputPricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Output price (per 1M tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator","errorMessage":{}},"moderator":{"type":"object","title":"Moderator","description":"The \"gatekeeper.\" Classifies each new user message for profanity, prompt-injection, persona override, and out-of-scope requests. Should be fast and cheap — it sits on the critical path to the first response token.\n\nRecommendations: a small/fast general-purpose model with structured (JSON) output support, e.g. Claude 4.5 Haiku, GPT-5.4 Mini, Mistral Small 4, Qwen3 (4B). Dedicated moderation classifiers (Llama Guard, moderation APIs) are not compatible: they use fixed taxonomies and output formats that cannot express this platform's custom policy.","layout":{"comp":"card","children":[{"key":"model"},{"key":"inputPricePerMillion","cols":6},{"key":"outputPricePerMillion","cols":6}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/model","errorMessage":{"required":{"id":"required information","name":"required information","provider":"required information"}}},"inputPricePerMillion":{"type":"number","title":"Input price (per 1M tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/inputPricePerMillion","errorMessage":{}},"outputPricePerMillion":{"type":"number","title":"Output price (per 1M tokens)","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/outputPricePerMillion","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models","errorMessage":{}},"moderation":{"type":"object","title":"Input moderation","layout":{"if":"parent.data.providers?.length"},"default":{"enabled":false,"categories":["anonymous","external"]},"required":["enabled","categories"],"additionalProperties":false,"properties":{"enabled":{"type":"boolean","title":"Enable input moderation","description":"When enabled, the last user message of each request from a moderated category is classified before the model responds.","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/enabled","errorMessage":{}},"categories":{"type":"array","uniqueItems":true,"default":["anonymous","external"],"title":"Moderated user categories","description":"User categories whose requests are checked by the gate when moderation is enabled.","items":{"type":"string","oneOf":[{"const":"anonymous","title":"Anonymous"},{"const":"external","title":"External"},{"const":"user","title":"User"},{"const":"contrib","title":"Contributor"},{"const":"admin","title":"Admin"}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items","errorMessage":{"oneOf":"chose one"}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/moderation","errorMessage":{"required":{"enabled":"required information","categories":"required information"}}},"quotas":{"type":"object","title":"Role Quotas","layout":{"title":null,"if":"parent.data.providers?.length","children":[{"key":"global","cols":{"sm":6,"md":4}},{"key":"admin","cols":{"sm":6,"md":4}},{"key":"contrib","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"user","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"external","cols":{"sm":6,"md":4}},{"key":"anonymous","cols":{"sm":6,"md":4}},{"key":"untrusted","cols":{"sm":6,"md":4}}]},"required":["global","admin","contrib","user","external","anonymous"],"default":{"global":{"unlimited":false,"monthlyLimit":10},"admin":{"unlimited":true,"monthlyLimit":0},"contrib":{"unlimited":false,"monthlyLimit":0},"user":{"unlimited":false,"monthlyLimit":0},"external":{"unlimited":false,"monthlyLimit":0},"anonymous":{"unlimited":false,"monthlyLimit":0},"untrusted":{"unlimited":false,"monthlyLimit":0}},"properties":{"global":{"$ref":"#/definitions/RoleQuota","title":"Global quotas","default":{"unlimited":false,"monthlyLimit":10},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/global","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"admin":{"$ref":"#/definitions/RoleQuota","title":"Admin quotas","default":{"unlimited":true,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/admin","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"contrib":{"$ref":"#/definitions/RoleQuota","title":"Contributor quotas","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/contrib","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"user":{"$ref":"#/definitions/RoleQuota","title":"Simple user Quotas","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/user","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"external":{"$ref":"#/definitions/RoleQuota","title":"External user quotas","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/external","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"anonymous":{"$ref":"#/definitions/RoleQuota","title":"Anonymous user quotas","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/anonymous","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"untrusted":{"$ref":"#/definitions/RoleQuota","title":"Anonymous + external pool","description":"Aggregate cap shared by all anonymous and external usage combined, so untrusted traffic cannot consume the whole account budget. 0 = no pool cap.","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/untrusted","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas","errorMessage":{"required":{"global":"required information","admin":"required information","contrib":"required information","user":"required information","external":"required information","anonymous":"required information"}}}},"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"__pointer":"https://github.com/data-fair/agents/settings-put#","errorMessage":{"required":{"providers":"required information"}}};
const schema28 = {"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":{"pure":false,"type":"js-tpl","dataAlias":"value","expr":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}","ref":17},"itemsResults":{"pure":true,"type":"js-eval","dataAlias":"body","expr":"data.results","ref":20},"itemTitle":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","ref":18},"itemKey":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"item.id","ref":19},"returnObjects":true}},"properties":{"id":{"type":"string","title":"Model ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id","errorMessage":{}},"name":{"type":"string","title":"Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name","errorMessage":{}},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type","errorMessage":{}},"name":{"type":"string","title":"Provider Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name","errorMessage":{}},"id":{"type":"string","title":"Provider ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider","errorMessage":{"required":{"type":"required information","name":"required information","id":"required information"}}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model","errorMessage":{"required":{"id":"required information","name":"required information","provider":"required information"}}};
const schema33 = {"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Unlimited","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited","errorMessage":{}},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Monthly Limit","description":"Weekly limit = monthly / 2, daily limit = monthly / 4","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyLimit","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}};
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
if(!((((((((key0 === "createdAt") || (key0 === "updatedAt")) || (key0 === "storeTraces")) || (key0 === "owner")) || (key0 === "providers")) || (key0 === "models")) || (key0 === "moderation")) || (key0 === "quotas"))){
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
}
else {
const err159 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[6].type,parentSchema:schema27.properties.providers.items.oneOf[6],data:data9};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
if(errors > 0){
const emErrors7 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"apiKey":[]}};
const templates7 = {required:{}};
let emPropParams7;
let emParamsErrors7;
for(const err160 of vErrors){
if((((((err160.keyword !== "errorMessage") && (!err160.emUsed)) && (err160.instancePath === instancePath+"/providers/" + i0)) && (err160.keyword in emErrors7)) && (err160.schemaPath.indexOf("#/properties/providers/items/oneOf/6") === 0)) && (/^\/[^\/]*$/.test(err160.schemaPath.slice(36)))){
emPropParams7 = obj0[err160.keyword];
emParamsErrors7 = emErrors7[err160.keyword][err160.params[emPropParams7]];
if(emParamsErrors7){
emParamsErrors7.push(err160);
err160.emUsed = true;
}
}
}
for(const key9 in emErrors7){
for(const keyProp7 in emErrors7[key9]){
emParamsErrors7 = emErrors7[key9][keyProp7];
if(emParamsErrors7.length){
const tmpl7 = templates7[key9] && templates7[key9][keyProp7];
const err161 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors7},message:tmpl7 ? tmpl7() : schema27.properties.providers.items.oneOf[6].errorMessage[key9][keyProp7],schema:schema27.properties.providers.items.oneOf[6].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[6],data:data9};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
}
}
const emErrs50 = [];
for(const err162 of vErrors){
if(!err162.emUsed){
emErrs50.push(err162);
}
}
vErrors = emErrs50;
errors = emErrs50.length;
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
}
}
const _errs110 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err163 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
if(data9.name === undefined){
const err164 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
if(data9.id === undefined){
const err165 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
if(data9.enabled === undefined){
const err166 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
if(data9.baseURL === undefined){
const err167 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema27.properties.providers.items.oneOf[7].required,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
if(data9.type !== undefined){
let data46 = data9.type;
if(typeof data46 !== "string"){
const err168 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/7/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.type,data:data46};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
if("openai-compatible" !== data46){
const err169 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue: "openai-compatible"},message:"must be equal to constant",schema:"openai-compatible",parentSchema:schema27.properties.providers.items.oneOf[7].properties.type,data:data46};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
if(errors > 0){
const emErrs51 = [];
for(const err170 of vErrors){
if(!err170.emUsed){
emErrs51.push(err170);
}
}
vErrors = emErrs51;
errors = emErrs51.length;
}
}
if(data9.id !== undefined){
let data47 = data9.id;
if(typeof data47 !== "string"){
const err171 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/7/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.id,data:data47};
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
if(data9.name !== undefined){
let data48 = data9.name;
if(typeof data48 !== "string"){
const err173 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/7/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.name,data:data48};
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
if(data9.enabled !== undefined){
let data49 = data9.enabled;
if(typeof data49 !== "boolean"){
const err175 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/7/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[7].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.enabled,data:data49};
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
if(data9.baseURL !== undefined){
let data50 = data9.baseURL;
if(typeof data50 !== "string"){
const err177 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/oneOf/7/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.baseURL.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.baseURL,data:data50};
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
if(data9.apiKey !== undefined){
let data51 = data9.apiKey;
if(typeof data51 !== "string"){
const err179 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/7/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[7].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[7].properties.apiKey,data:data51};
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
}
else {
const err181 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[7].type,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
if(errors > 0){
const emErrors8 = {"required":{"type":[],"id":[],"name":[],"enabled":[],"baseURL":[]}};
const templates8 = {required:{}};
let emPropParams8;
let emParamsErrors8;
for(const err182 of vErrors){
if((((((err182.keyword !== "errorMessage") && (!err182.emUsed)) && (err182.instancePath === instancePath+"/providers/" + i0)) && (err182.keyword in emErrors8)) && (err182.schemaPath.indexOf("#/properties/providers/items/oneOf/7") === 0)) && (/^\/[^\/]*$/.test(err182.schemaPath.slice(36)))){
emPropParams8 = obj0[err182.keyword];
emParamsErrors8 = emErrors8[err182.keyword][err182.params[emPropParams8]];
if(emParamsErrors8){
emParamsErrors8.push(err182);
err182.emUsed = true;
}
}
}
for(const key10 in emErrors8){
for(const keyProp8 in emErrors8[key10]){
emParamsErrors8 = emErrors8[key10][keyProp8];
if(emParamsErrors8.length){
const tmpl8 = templates8[key10] && templates8[key10][keyProp8];
const err183 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/7/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors8},message:tmpl8 ? tmpl8() : schema27.properties.providers.items.oneOf[7].errorMessage[key10][keyProp8],schema:schema27.properties.providers.items.oneOf[7].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[7],data:data9};
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
const emErrs57 = [];
for(const err184 of vErrors){
if(!err184.emUsed){
emErrs57.push(err184);
}
}
vErrors = emErrs57;
errors = emErrs57.length;
}
var _valid0 = _errs110 === errors;
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
}
}
const _errs124 = errors;
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err185 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data9};
if(vErrors === null){
vErrors = [err185];
}
else {
vErrors.push(err185);
}
errors++;
}
if(data9.name === undefined){
const err186 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data9};
if(vErrors === null){
vErrors = [err186];
}
else {
vErrors.push(err186);
}
errors++;
}
if(data9.id === undefined){
const err187 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data9};
if(vErrors === null){
vErrors = [err187];
}
else {
vErrors.push(err187);
}
errors++;
}
if(data9.enabled === undefined){
const err188 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[8].required,parentSchema:schema27.properties.providers.items.oneOf[8],data:data9};
if(vErrors === null){
vErrors = [err188];
}
else {
vErrors.push(err188);
}
errors++;
}
if(data9.type !== undefined){
let data52 = data9.type;
if(typeof data52 !== "string"){
const err189 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/8/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[8].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.type,data:data52};
if(vErrors === null){
vErrors = [err189];
}
else {
vErrors.push(err189);
}
errors++;
}
if("mock" !== data52){
const err190 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema27.properties.providers.items.oneOf[8].properties.type,data:data52};
if(vErrors === null){
vErrors = [err190];
}
else {
vErrors.push(err190);
}
errors++;
}
if(errors > 0){
const emErrs58 = [];
for(const err191 of vErrors){
if(!err191.emUsed){
emErrs58.push(err191);
}
}
vErrors = emErrs58;
errors = emErrs58.length;
}
}
if(data9.id !== undefined){
let data53 = data9.id;
if(typeof data53 !== "string"){
const err192 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/8/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[8].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.id,data:data53};
if(vErrors === null){
vErrors = [err192];
}
else {
vErrors.push(err192);
}
errors++;
}
if(errors > 0){
const emErrs59 = [];
for(const err193 of vErrors){
if(!err193.emUsed){
emErrs59.push(err193);
}
}
vErrors = emErrs59;
errors = emErrs59.length;
}
}
if(data9.name !== undefined){
let data54 = data9.name;
if(typeof data54 !== "string"){
const err194 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/8/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[8].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.name,data:data54};
if(vErrors === null){
vErrors = [err194];
}
else {
vErrors.push(err194);
}
errors++;
}
if(errors > 0){
const emErrs60 = [];
for(const err195 of vErrors){
if(!err195.emUsed){
emErrs60.push(err195);
}
}
vErrors = emErrs60;
errors = emErrs60.length;
}
}
if(data9.enabled !== undefined){
let data55 = data9.enabled;
if(typeof data55 !== "boolean"){
const err196 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/8/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[8].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[8].properties.enabled,data:data55};
if(vErrors === null){
vErrors = [err196];
}
else {
vErrors.push(err196);
}
errors++;
}
if(errors > 0){
const emErrs61 = [];
for(const err197 of vErrors){
if(!err197.emUsed){
emErrs61.push(err197);
}
}
vErrors = emErrs61;
errors = emErrs61.length;
}
}
}
else {
const err198 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[8].type,parentSchema:schema27.properties.providers.items.oneOf[8],data:data9};
if(vErrors === null){
vErrors = [err198];
}
else {
vErrors.push(err198);
}
errors++;
}
if(errors > 0){
const emErrors9 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates9 = {required:{}};
let emPropParams9;
let emParamsErrors9;
for(const err199 of vErrors){
if((((((err199.keyword !== "errorMessage") && (!err199.emUsed)) && (err199.instancePath === instancePath+"/providers/" + i0)) && (err199.keyword in emErrors9)) && (err199.schemaPath.indexOf("#/properties/providers/items/oneOf/8") === 0)) && (/^\/[^\/]*$/.test(err199.schemaPath.slice(36)))){
emPropParams9 = obj0[err199.keyword];
emParamsErrors9 = emErrors9[err199.keyword][err199.params[emPropParams9]];
if(emParamsErrors9){
emParamsErrors9.push(err199);
err199.emUsed = true;
}
}
}
for(const key11 in emErrors9){
for(const keyProp9 in emErrors9[key11]){
emParamsErrors9 = emErrors9[key11][keyProp9];
if(emParamsErrors9.length){
const tmpl9 = templates9[key11] && templates9[key11][keyProp9];
const err200 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/8/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors9},message:tmpl9 ? tmpl9() : schema27.properties.providers.items.oneOf[8].errorMessage[key11][keyProp9],schema:schema27.properties.providers.items.oneOf[8].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[8],data:data9};
if(vErrors === null){
vErrors = [err200];
}
else {
vErrors.push(err200);
}
errors++;
}
}
}
const emErrs62 = [];
for(const err201 of vErrors){
if(!err201.emUsed){
emErrs62.push(err201);
}
}
vErrors = emErrs62;
errors = emErrs62.length;
}
var _valid0 = _errs124 === errors;
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
const err202 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema27.properties.providers.items.oneOf,parentSchema:schema27.properties.providers.items,data:data9};
if(vErrors === null){
vErrors = [err202];
}
else {
vErrors.push(err202);
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
const err203 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/unevaluatedProperties",keyword:"unevaluatedProperties",params:{unevaluatedProperty: key12},message:"must NOT have unevaluated properties",schema:false,parentSchema:schema27.properties.providers.items,data:data9};
if(vErrors === null){
vErrors = [err203];
}
else {
vErrors.push(err203);
}
errors++;
}
}
}
}
else {
const err204 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.type,parentSchema:schema27.properties.providers.items,data:data9};
if(vErrors === null){
vErrors = [err204];
}
else {
vErrors.push(err204);
}
errors++;
}
if(errors > 0){
const emErrors10 = {"oneOf":[]};
const templates10 = {};
for(const err205 of vErrors){
if((((((err205.keyword !== "errorMessage") && (!err205.emUsed)) && (err205.instancePath === instancePath+"/providers/" + i0)) && (err205.keyword in emErrors10)) && (err205.schemaPath.indexOf("#/properties/providers/items") === 0)) && (/^\/[^\/]*$/.test(err205.schemaPath.slice(28)))){
emErrors10[err205.keyword].push(err205);
err205.emUsed = true;
}
}
for(const key13 in emErrors10){
if(emErrors10[key13].length){
const err206 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors10[key13]},message:key13 in templates10 ? templates10[key13]() : schema27.properties.providers.items.errorMessage[key13],schema:schema27.properties.providers.items.errorMessage,parentSchema:schema27.properties.providers.items,data:data9};
if(vErrors === null){
vErrors = [err206];
}
else {
vErrors.push(err206);
}
errors++;
}
}
const emErrs63 = [];
for(const err207 of vErrors){
if(!err207.emUsed){
emErrs63.push(err207);
}
}
vErrors = emErrs63;
errors = emErrs63.length;
}
}
}
else {
const err208 = {instancePath:instancePath+"/providers",schemaPath:"#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.providers.type,parentSchema:schema27.properties.providers,data:data8};
if(vErrors === null){
vErrors = [err208];
}
else {
vErrors.push(err208);
}
errors++;
}
if(errors > 0){
const emErrs64 = [];
for(const err209 of vErrors){
if(!err209.emUsed){
emErrs64.push(err209);
}
}
vErrors = emErrs64;
errors = emErrs64.length;
}
}
if(data.models !== undefined){
let data56 = data.models;
if(data56 && typeof data56 == "object" && !Array.isArray(data56)){
if(data56.assistant !== undefined){
let data57 = data56.assistant;
if(data57 && typeof data57 == "object" && !Array.isArray(data57)){
if(data57.model !== undefined){
let data58 = data57.model;
if(data58 && typeof data58 == "object" && !Array.isArray(data58)){
if(data58.id === undefined){
const err210 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data58};
if(vErrors === null){
vErrors = [err210];
}
else {
vErrors.push(err210);
}
errors++;
}
if(data58.name === undefined){
const err211 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data58};
if(vErrors === null){
vErrors = [err211];
}
else {
vErrors.push(err211);
}
errors++;
}
if(data58.provider === undefined){
const err212 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data58};
if(vErrors === null){
vErrors = [err212];
}
else {
vErrors.push(err212);
}
errors++;
}
if(data58.id !== undefined){
let data59 = data58.id;
if(typeof data59 !== "string"){
const err213 = {instancePath:instancePath+"/models/assistant/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data59};
if(vErrors === null){
vErrors = [err213];
}
else {
vErrors.push(err213);
}
errors++;
}
if(errors > 0){
const emErrs65 = [];
for(const err214 of vErrors){
if(!err214.emUsed){
emErrs65.push(err214);
}
}
vErrors = emErrs65;
errors = emErrs65.length;
}
}
if(data58.name !== undefined){
let data60 = data58.name;
if(typeof data60 !== "string"){
const err215 = {instancePath:instancePath+"/models/assistant/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data60};
if(vErrors === null){
vErrors = [err215];
}
else {
vErrors.push(err215);
}
errors++;
}
if(errors > 0){
const emErrs66 = [];
for(const err216 of vErrors){
if(!err216.emUsed){
emErrs66.push(err216);
}
}
vErrors = emErrs66;
errors = emErrs66.length;
}
}
if(data58.provider !== undefined){
let data61 = data58.provider;
if(data61 && typeof data61 == "object" && !Array.isArray(data61)){
if(data61.type === undefined){
const err217 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data61};
if(vErrors === null){
vErrors = [err217];
}
else {
vErrors.push(err217);
}
errors++;
}
if(data61.name === undefined){
const err218 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data61};
if(vErrors === null){
vErrors = [err218];
}
else {
vErrors.push(err218);
}
errors++;
}
if(data61.id === undefined){
const err219 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data61};
if(vErrors === null){
vErrors = [err219];
}
else {
vErrors.push(err219);
}
errors++;
}
if(data61.type !== undefined){
let data62 = data61.type;
if(typeof data62 !== "string"){
const err220 = {instancePath:instancePath+"/models/assistant/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data62};
if(vErrors === null){
vErrors = [err220];
}
else {
vErrors.push(err220);
}
errors++;
}
if(errors > 0){
const emErrs67 = [];
for(const err221 of vErrors){
if(!err221.emUsed){
emErrs67.push(err221);
}
}
vErrors = emErrs67;
errors = emErrs67.length;
}
}
if(data61.name !== undefined){
let data63 = data61.name;
if(typeof data63 !== "string"){
const err222 = {instancePath:instancePath+"/models/assistant/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data63};
if(vErrors === null){
vErrors = [err222];
}
else {
vErrors.push(err222);
}
errors++;
}
if(errors > 0){
const emErrs68 = [];
for(const err223 of vErrors){
if(!err223.emUsed){
emErrs68.push(err223);
}
}
vErrors = emErrs68;
errors = emErrs68.length;
}
}
if(data61.id !== undefined){
let data64 = data61.id;
if(typeof data64 !== "string"){
const err224 = {instancePath:instancePath+"/models/assistant/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data64};
if(vErrors === null){
vErrors = [err224];
}
else {
vErrors.push(err224);
}
errors++;
}
if(errors > 0){
const emErrs69 = [];
for(const err225 of vErrors){
if(!err225.emUsed){
emErrs69.push(err225);
}
}
vErrors = emErrs69;
errors = emErrs69.length;
}
}
}
else {
const err226 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data61};
if(vErrors === null){
vErrors = [err226];
}
else {
vErrors.push(err226);
}
errors++;
}
if(errors > 0){
const emErrors11 = {"required":{"type":[],"name":[],"id":[]}};
const templates11 = {required:{}};
let emPropParams10;
let emParamsErrors10;
for(const err227 of vErrors){
if((((((err227.keyword !== "errorMessage") && (!err227.emUsed)) && (err227.instancePath === instancePath+"/models/assistant/model/provider")) && (err227.keyword in emErrors11)) && (err227.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err227.schemaPath.slice(39)))){
emPropParams10 = obj0[err227.keyword];
emParamsErrors10 = emErrors11[err227.keyword][err227.params[emPropParams10]];
if(emParamsErrors10){
emParamsErrors10.push(err227);
err227.emUsed = true;
}
}
}
for(const key14 in emErrors11){
for(const keyProp10 in emErrors11[key14]){
emParamsErrors10 = emErrors11[key14][keyProp10];
if(emParamsErrors10.length){
const tmpl10 = templates11[key14] && templates11[key14][keyProp10];
const err228 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors10},message:tmpl10 ? tmpl10() : schema28.properties.provider.errorMessage[key14][keyProp10],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data61};
if(vErrors === null){
vErrors = [err228];
}
else {
vErrors.push(err228);
}
errors++;
}
}
}
const emErrs70 = [];
for(const err229 of vErrors){
if(!err229.emUsed){
emErrs70.push(err229);
}
}
vErrors = emErrs70;
errors = emErrs70.length;
}
}
}
else {
const err230 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data58};
if(vErrors === null){
vErrors = [err230];
}
else {
vErrors.push(err230);
}
errors++;
}
if(errors > 0){
const emErrors12 = {"required":{"id":[],"name":[],"provider":[]}};
const templates12 = {required:{}};
let emPropParams11;
let emParamsErrors11;
for(const err231 of vErrors){
if((((((err231.keyword !== "errorMessage") && (!err231.emUsed)) && (err231.instancePath === instancePath+"/models/assistant/model")) && (err231.keyword in emErrors12)) && (err231.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err231.schemaPath.slice(19)))){
emPropParams11 = obj0[err231.keyword];
emParamsErrors11 = emErrors12[err231.keyword][err231.params[emPropParams11]];
if(emParamsErrors11){
emParamsErrors11.push(err231);
err231.emUsed = true;
}
}
}
for(const key15 in emErrors12){
for(const keyProp11 in emErrors12[key15]){
emParamsErrors11 = emErrors12[key15][keyProp11];
if(emParamsErrors11.length){
const tmpl11 = templates12[key15] && templates12[key15][keyProp11];
const err232 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors11},message:tmpl11 ? tmpl11() : schema28.errorMessage[key15][keyProp11],schema:schema28.errorMessage,parentSchema:schema28,data:data58};
if(vErrors === null){
vErrors = [err232];
}
else {
vErrors.push(err232);
}
errors++;
}
}
}
const emErrs71 = [];
for(const err233 of vErrors){
if(!err233.emUsed){
emErrs71.push(err233);
}
}
vErrors = emErrs71;
errors = emErrs71.length;
}
if(errors > 0){
const emErrors13 = {"required":{"id":[],"name":[],"provider":[]}};
const templates13 = {required:{}};
let emPropParams12;
let emParamsErrors12;
for(const err234 of vErrors){
if((((((err234.keyword !== "errorMessage") && (!err234.emUsed)) && (err234.instancePath === instancePath+"/models/assistant/model")) && (err234.keyword in emErrors13)) && (err234.schemaPath.indexOf("#/properties/models/properties/assistant/properties/model") === 0)) && (/^\/[^\/]*$/.test(err234.schemaPath.slice(57)))){
emPropParams12 = obj0[err234.keyword];
emParamsErrors12 = emErrors13[err234.keyword][err234.params[emPropParams12]];
if(emParamsErrors12){
emParamsErrors12.push(err234);
err234.emUsed = true;
}
}
}
for(const key16 in emErrors13){
for(const keyProp12 in emErrors13[key16]){
emParamsErrors12 = emErrors13[key16][keyProp12];
if(emParamsErrors12.length){
const tmpl12 = templates13[key16] && templates13[key16][keyProp12];
const err235 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/properties/models/properties/assistant/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors12},message:tmpl12 ? tmpl12() : schema27.properties.models.properties.assistant.properties.model.errorMessage[key16][keyProp12],schema:schema27.properties.models.properties.assistant.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.assistant.properties.model,data:data58};
if(vErrors === null){
vErrors = [err235];
}
else {
vErrors.push(err235);
}
errors++;
}
}
}
const emErrs72 = [];
for(const err236 of vErrors){
if(!err236.emUsed){
emErrs72.push(err236);
}
}
vErrors = emErrs72;
errors = emErrs72.length;
}
}
if(data57.inputPricePerMillion !== undefined){
let data65 = data57.inputPricePerMillion;
if(typeof data65 == "number"){
if(data65 < 0 || isNaN(data65)){
const err237 = {instancePath:instancePath+"/models/assistant/inputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.assistant.properties.inputPricePerMillion,data:data65};
if(vErrors === null){
vErrors = [err237];
}
else {
vErrors.push(err237);
}
errors++;
}
}
else {
const err238 = {instancePath:instancePath+"/models/assistant/inputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.assistant.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.assistant.properties.inputPricePerMillion,data:data65};
if(vErrors === null){
vErrors = [err238];
}
else {
vErrors.push(err238);
}
errors++;
}
if(errors > 0){
const emErrs73 = [];
for(const err239 of vErrors){
if(!err239.emUsed){
emErrs73.push(err239);
}
}
vErrors = emErrs73;
errors = emErrs73.length;
}
}
if(data57.outputPricePerMillion !== undefined){
let data66 = data57.outputPricePerMillion;
if(typeof data66 == "number"){
if(data66 < 0 || isNaN(data66)){
const err240 = {instancePath:instancePath+"/models/assistant/outputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.assistant.properties.outputPricePerMillion,data:data66};
if(vErrors === null){
vErrors = [err240];
}
else {
vErrors.push(err240);
}
errors++;
}
}
else {
const err241 = {instancePath:instancePath+"/models/assistant/outputPricePerMillion",schemaPath:"#/properties/models/properties/assistant/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.assistant.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.assistant.properties.outputPricePerMillion,data:data66};
if(vErrors === null){
vErrors = [err241];
}
else {
vErrors.push(err241);
}
errors++;
}
if(errors > 0){
const emErrs74 = [];
for(const err242 of vErrors){
if(!err242.emUsed){
emErrs74.push(err242);
}
}
vErrors = emErrs74;
errors = emErrs74.length;
}
}
}
else {
const err243 = {instancePath:instancePath+"/models/assistant",schemaPath:"#/properties/models/properties/assistant/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.assistant.type,parentSchema:schema27.properties.models.properties.assistant,data:data57};
if(vErrors === null){
vErrors = [err243];
}
else {
vErrors.push(err243);
}
errors++;
}
if(errors > 0){
const emErrs75 = [];
for(const err244 of vErrors){
if(!err244.emUsed){
emErrs75.push(err244);
}
}
vErrors = emErrs75;
errors = emErrs75.length;
}
}
if(data56.tools !== undefined){
let data67 = data56.tools;
if(data67 && typeof data67 == "object" && !Array.isArray(data67)){
if(data67.model !== undefined){
let data68 = data67.model;
if(data68 && typeof data68 == "object" && !Array.isArray(data68)){
if(data68.id === undefined){
const err245 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data68};
if(vErrors === null){
vErrors = [err245];
}
else {
vErrors.push(err245);
}
errors++;
}
if(data68.name === undefined){
const err246 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data68};
if(vErrors === null){
vErrors = [err246];
}
else {
vErrors.push(err246);
}
errors++;
}
if(data68.provider === undefined){
const err247 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data68};
if(vErrors === null){
vErrors = [err247];
}
else {
vErrors.push(err247);
}
errors++;
}
if(data68.id !== undefined){
let data69 = data68.id;
if(typeof data69 !== "string"){
const err248 = {instancePath:instancePath+"/models/tools/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data69};
if(vErrors === null){
vErrors = [err248];
}
else {
vErrors.push(err248);
}
errors++;
}
if(errors > 0){
const emErrs76 = [];
for(const err249 of vErrors){
if(!err249.emUsed){
emErrs76.push(err249);
}
}
vErrors = emErrs76;
errors = emErrs76.length;
}
}
if(data68.name !== undefined){
let data70 = data68.name;
if(typeof data70 !== "string"){
const err250 = {instancePath:instancePath+"/models/tools/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data70};
if(vErrors === null){
vErrors = [err250];
}
else {
vErrors.push(err250);
}
errors++;
}
if(errors > 0){
const emErrs77 = [];
for(const err251 of vErrors){
if(!err251.emUsed){
emErrs77.push(err251);
}
}
vErrors = emErrs77;
errors = emErrs77.length;
}
}
if(data68.provider !== undefined){
let data71 = data68.provider;
if(data71 && typeof data71 == "object" && !Array.isArray(data71)){
if(data71.type === undefined){
const err252 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data71};
if(vErrors === null){
vErrors = [err252];
}
else {
vErrors.push(err252);
}
errors++;
}
if(data71.name === undefined){
const err253 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data71};
if(vErrors === null){
vErrors = [err253];
}
else {
vErrors.push(err253);
}
errors++;
}
if(data71.id === undefined){
const err254 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data71};
if(vErrors === null){
vErrors = [err254];
}
else {
vErrors.push(err254);
}
errors++;
}
if(data71.type !== undefined){
let data72 = data71.type;
if(typeof data72 !== "string"){
const err255 = {instancePath:instancePath+"/models/tools/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data72};
if(vErrors === null){
vErrors = [err255];
}
else {
vErrors.push(err255);
}
errors++;
}
if(errors > 0){
const emErrs78 = [];
for(const err256 of vErrors){
if(!err256.emUsed){
emErrs78.push(err256);
}
}
vErrors = emErrs78;
errors = emErrs78.length;
}
}
if(data71.name !== undefined){
let data73 = data71.name;
if(typeof data73 !== "string"){
const err257 = {instancePath:instancePath+"/models/tools/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data73};
if(vErrors === null){
vErrors = [err257];
}
else {
vErrors.push(err257);
}
errors++;
}
if(errors > 0){
const emErrs79 = [];
for(const err258 of vErrors){
if(!err258.emUsed){
emErrs79.push(err258);
}
}
vErrors = emErrs79;
errors = emErrs79.length;
}
}
if(data71.id !== undefined){
let data74 = data71.id;
if(typeof data74 !== "string"){
const err259 = {instancePath:instancePath+"/models/tools/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data74};
if(vErrors === null){
vErrors = [err259];
}
else {
vErrors.push(err259);
}
errors++;
}
if(errors > 0){
const emErrs80 = [];
for(const err260 of vErrors){
if(!err260.emUsed){
emErrs80.push(err260);
}
}
vErrors = emErrs80;
errors = emErrs80.length;
}
}
}
else {
const err261 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data71};
if(vErrors === null){
vErrors = [err261];
}
else {
vErrors.push(err261);
}
errors++;
}
if(errors > 0){
const emErrors14 = {"required":{"type":[],"name":[],"id":[]}};
const templates14 = {required:{}};
let emPropParams13;
let emParamsErrors13;
for(const err262 of vErrors){
if((((((err262.keyword !== "errorMessage") && (!err262.emUsed)) && (err262.instancePath === instancePath+"/models/tools/model/provider")) && (err262.keyword in emErrors14)) && (err262.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err262.schemaPath.slice(39)))){
emPropParams13 = obj0[err262.keyword];
emParamsErrors13 = emErrors14[err262.keyword][err262.params[emPropParams13]];
if(emParamsErrors13){
emParamsErrors13.push(err262);
err262.emUsed = true;
}
}
}
for(const key17 in emErrors14){
for(const keyProp13 in emErrors14[key17]){
emParamsErrors13 = emErrors14[key17][keyProp13];
if(emParamsErrors13.length){
const tmpl13 = templates14[key17] && templates14[key17][keyProp13];
const err263 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors13},message:tmpl13 ? tmpl13() : schema28.properties.provider.errorMessage[key17][keyProp13],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data71};
if(vErrors === null){
vErrors = [err263];
}
else {
vErrors.push(err263);
}
errors++;
}
}
}
const emErrs81 = [];
for(const err264 of vErrors){
if(!err264.emUsed){
emErrs81.push(err264);
}
}
vErrors = emErrs81;
errors = emErrs81.length;
}
}
}
else {
const err265 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data68};
if(vErrors === null){
vErrors = [err265];
}
else {
vErrors.push(err265);
}
errors++;
}
if(errors > 0){
const emErrors15 = {"required":{"id":[],"name":[],"provider":[]}};
const templates15 = {required:{}};
let emPropParams14;
let emParamsErrors14;
for(const err266 of vErrors){
if((((((err266.keyword !== "errorMessage") && (!err266.emUsed)) && (err266.instancePath === instancePath+"/models/tools/model")) && (err266.keyword in emErrors15)) && (err266.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err266.schemaPath.slice(19)))){
emPropParams14 = obj0[err266.keyword];
emParamsErrors14 = emErrors15[err266.keyword][err266.params[emPropParams14]];
if(emParamsErrors14){
emParamsErrors14.push(err266);
err266.emUsed = true;
}
}
}
for(const key18 in emErrors15){
for(const keyProp14 in emErrors15[key18]){
emParamsErrors14 = emErrors15[key18][keyProp14];
if(emParamsErrors14.length){
const tmpl14 = templates15[key18] && templates15[key18][keyProp14];
const err267 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors14},message:tmpl14 ? tmpl14() : schema28.errorMessage[key18][keyProp14],schema:schema28.errorMessage,parentSchema:schema28,data:data68};
if(vErrors === null){
vErrors = [err267];
}
else {
vErrors.push(err267);
}
errors++;
}
}
}
const emErrs82 = [];
for(const err268 of vErrors){
if(!err268.emUsed){
emErrs82.push(err268);
}
}
vErrors = emErrs82;
errors = emErrs82.length;
}
if(errors > 0){
const emErrors16 = {"required":{"id":[],"name":[],"provider":[]}};
const templates16 = {required:{}};
let emPropParams15;
let emParamsErrors15;
for(const err269 of vErrors){
if((((((err269.keyword !== "errorMessage") && (!err269.emUsed)) && (err269.instancePath === instancePath+"/models/tools/model")) && (err269.keyword in emErrors16)) && (err269.schemaPath.indexOf("#/properties/models/properties/tools/properties/model") === 0)) && (/^\/[^\/]*$/.test(err269.schemaPath.slice(53)))){
emPropParams15 = obj0[err269.keyword];
emParamsErrors15 = emErrors16[err269.keyword][err269.params[emPropParams15]];
if(emParamsErrors15){
emParamsErrors15.push(err269);
err269.emUsed = true;
}
}
}
for(const key19 in emErrors16){
for(const keyProp15 in emErrors16[key19]){
emParamsErrors15 = emErrors16[key19][keyProp15];
if(emParamsErrors15.length){
const tmpl15 = templates16[key19] && templates16[key19][keyProp15];
const err270 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/properties/models/properties/tools/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors15},message:tmpl15 ? tmpl15() : schema27.properties.models.properties.tools.properties.model.errorMessage[key19][keyProp15],schema:schema27.properties.models.properties.tools.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.tools.properties.model,data:data68};
if(vErrors === null){
vErrors = [err270];
}
else {
vErrors.push(err270);
}
errors++;
}
}
}
const emErrs83 = [];
for(const err271 of vErrors){
if(!err271.emUsed){
emErrs83.push(err271);
}
}
vErrors = emErrs83;
errors = emErrs83.length;
}
}
if(data67.inputPricePerMillion !== undefined){
let data75 = data67.inputPricePerMillion;
if(typeof data75 == "number"){
if(data75 < 0 || isNaN(data75)){
const err272 = {instancePath:instancePath+"/models/tools/inputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.tools.properties.inputPricePerMillion,data:data75};
if(vErrors === null){
vErrors = [err272];
}
else {
vErrors.push(err272);
}
errors++;
}
}
else {
const err273 = {instancePath:instancePath+"/models/tools/inputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.tools.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.tools.properties.inputPricePerMillion,data:data75};
if(vErrors === null){
vErrors = [err273];
}
else {
vErrors.push(err273);
}
errors++;
}
if(errors > 0){
const emErrs84 = [];
for(const err274 of vErrors){
if(!err274.emUsed){
emErrs84.push(err274);
}
}
vErrors = emErrs84;
errors = emErrs84.length;
}
}
if(data67.outputPricePerMillion !== undefined){
let data76 = data67.outputPricePerMillion;
if(typeof data76 == "number"){
if(data76 < 0 || isNaN(data76)){
const err275 = {instancePath:instancePath+"/models/tools/outputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.tools.properties.outputPricePerMillion,data:data76};
if(vErrors === null){
vErrors = [err275];
}
else {
vErrors.push(err275);
}
errors++;
}
}
else {
const err276 = {instancePath:instancePath+"/models/tools/outputPricePerMillion",schemaPath:"#/properties/models/properties/tools/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.tools.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.tools.properties.outputPricePerMillion,data:data76};
if(vErrors === null){
vErrors = [err276];
}
else {
vErrors.push(err276);
}
errors++;
}
if(errors > 0){
const emErrs85 = [];
for(const err277 of vErrors){
if(!err277.emUsed){
emErrs85.push(err277);
}
}
vErrors = emErrs85;
errors = emErrs85.length;
}
}
}
else {
const err278 = {instancePath:instancePath+"/models/tools",schemaPath:"#/properties/models/properties/tools/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.tools.type,parentSchema:schema27.properties.models.properties.tools,data:data67};
if(vErrors === null){
vErrors = [err278];
}
else {
vErrors.push(err278);
}
errors++;
}
if(errors > 0){
const emErrs86 = [];
for(const err279 of vErrors){
if(!err279.emUsed){
emErrs86.push(err279);
}
}
vErrors = emErrs86;
errors = emErrs86.length;
}
}
if(data56.summarizer !== undefined){
let data77 = data56.summarizer;
if(data77 && typeof data77 == "object" && !Array.isArray(data77)){
if(data77.model !== undefined){
let data78 = data77.model;
if(data78 && typeof data78 == "object" && !Array.isArray(data78)){
if(data78.id === undefined){
const err280 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data78};
if(vErrors === null){
vErrors = [err280];
}
else {
vErrors.push(err280);
}
errors++;
}
if(data78.name === undefined){
const err281 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data78};
if(vErrors === null){
vErrors = [err281];
}
else {
vErrors.push(err281);
}
errors++;
}
if(data78.provider === undefined){
const err282 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data78};
if(vErrors === null){
vErrors = [err282];
}
else {
vErrors.push(err282);
}
errors++;
}
if(data78.id !== undefined){
let data79 = data78.id;
if(typeof data79 !== "string"){
const err283 = {instancePath:instancePath+"/models/summarizer/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data79};
if(vErrors === null){
vErrors = [err283];
}
else {
vErrors.push(err283);
}
errors++;
}
if(errors > 0){
const emErrs87 = [];
for(const err284 of vErrors){
if(!err284.emUsed){
emErrs87.push(err284);
}
}
vErrors = emErrs87;
errors = emErrs87.length;
}
}
if(data78.name !== undefined){
let data80 = data78.name;
if(typeof data80 !== "string"){
const err285 = {instancePath:instancePath+"/models/summarizer/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data80};
if(vErrors === null){
vErrors = [err285];
}
else {
vErrors.push(err285);
}
errors++;
}
if(errors > 0){
const emErrs88 = [];
for(const err286 of vErrors){
if(!err286.emUsed){
emErrs88.push(err286);
}
}
vErrors = emErrs88;
errors = emErrs88.length;
}
}
if(data78.provider !== undefined){
let data81 = data78.provider;
if(data81 && typeof data81 == "object" && !Array.isArray(data81)){
if(data81.type === undefined){
const err287 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data81};
if(vErrors === null){
vErrors = [err287];
}
else {
vErrors.push(err287);
}
errors++;
}
if(data81.name === undefined){
const err288 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data81};
if(vErrors === null){
vErrors = [err288];
}
else {
vErrors.push(err288);
}
errors++;
}
if(data81.id === undefined){
const err289 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data81};
if(vErrors === null){
vErrors = [err289];
}
else {
vErrors.push(err289);
}
errors++;
}
if(data81.type !== undefined){
let data82 = data81.type;
if(typeof data82 !== "string"){
const err290 = {instancePath:instancePath+"/models/summarizer/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data82};
if(vErrors === null){
vErrors = [err290];
}
else {
vErrors.push(err290);
}
errors++;
}
if(errors > 0){
const emErrs89 = [];
for(const err291 of vErrors){
if(!err291.emUsed){
emErrs89.push(err291);
}
}
vErrors = emErrs89;
errors = emErrs89.length;
}
}
if(data81.name !== undefined){
let data83 = data81.name;
if(typeof data83 !== "string"){
const err292 = {instancePath:instancePath+"/models/summarizer/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data83};
if(vErrors === null){
vErrors = [err292];
}
else {
vErrors.push(err292);
}
errors++;
}
if(errors > 0){
const emErrs90 = [];
for(const err293 of vErrors){
if(!err293.emUsed){
emErrs90.push(err293);
}
}
vErrors = emErrs90;
errors = emErrs90.length;
}
}
if(data81.id !== undefined){
let data84 = data81.id;
if(typeof data84 !== "string"){
const err294 = {instancePath:instancePath+"/models/summarizer/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data84};
if(vErrors === null){
vErrors = [err294];
}
else {
vErrors.push(err294);
}
errors++;
}
if(errors > 0){
const emErrs91 = [];
for(const err295 of vErrors){
if(!err295.emUsed){
emErrs91.push(err295);
}
}
vErrors = emErrs91;
errors = emErrs91.length;
}
}
}
else {
const err296 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data81};
if(vErrors === null){
vErrors = [err296];
}
else {
vErrors.push(err296);
}
errors++;
}
if(errors > 0){
const emErrors17 = {"required":{"type":[],"name":[],"id":[]}};
const templates17 = {required:{}};
let emPropParams16;
let emParamsErrors16;
for(const err297 of vErrors){
if((((((err297.keyword !== "errorMessage") && (!err297.emUsed)) && (err297.instancePath === instancePath+"/models/summarizer/model/provider")) && (err297.keyword in emErrors17)) && (err297.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err297.schemaPath.slice(39)))){
emPropParams16 = obj0[err297.keyword];
emParamsErrors16 = emErrors17[err297.keyword][err297.params[emPropParams16]];
if(emParamsErrors16){
emParamsErrors16.push(err297);
err297.emUsed = true;
}
}
}
for(const key20 in emErrors17){
for(const keyProp16 in emErrors17[key20]){
emParamsErrors16 = emErrors17[key20][keyProp16];
if(emParamsErrors16.length){
const tmpl16 = templates17[key20] && templates17[key20][keyProp16];
const err298 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors16},message:tmpl16 ? tmpl16() : schema28.properties.provider.errorMessage[key20][keyProp16],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data81};
if(vErrors === null){
vErrors = [err298];
}
else {
vErrors.push(err298);
}
errors++;
}
}
}
const emErrs92 = [];
for(const err299 of vErrors){
if(!err299.emUsed){
emErrs92.push(err299);
}
}
vErrors = emErrs92;
errors = emErrs92.length;
}
}
}
else {
const err300 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data78};
if(vErrors === null){
vErrors = [err300];
}
else {
vErrors.push(err300);
}
errors++;
}
if(errors > 0){
const emErrors18 = {"required":{"id":[],"name":[],"provider":[]}};
const templates18 = {required:{}};
let emPropParams17;
let emParamsErrors17;
for(const err301 of vErrors){
if((((((err301.keyword !== "errorMessage") && (!err301.emUsed)) && (err301.instancePath === instancePath+"/models/summarizer/model")) && (err301.keyword in emErrors18)) && (err301.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err301.schemaPath.slice(19)))){
emPropParams17 = obj0[err301.keyword];
emParamsErrors17 = emErrors18[err301.keyword][err301.params[emPropParams17]];
if(emParamsErrors17){
emParamsErrors17.push(err301);
err301.emUsed = true;
}
}
}
for(const key21 in emErrors18){
for(const keyProp17 in emErrors18[key21]){
emParamsErrors17 = emErrors18[key21][keyProp17];
if(emParamsErrors17.length){
const tmpl17 = templates18[key21] && templates18[key21][keyProp17];
const err302 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors17},message:tmpl17 ? tmpl17() : schema28.errorMessage[key21][keyProp17],schema:schema28.errorMessage,parentSchema:schema28,data:data78};
if(vErrors === null){
vErrors = [err302];
}
else {
vErrors.push(err302);
}
errors++;
}
}
}
const emErrs93 = [];
for(const err303 of vErrors){
if(!err303.emUsed){
emErrs93.push(err303);
}
}
vErrors = emErrs93;
errors = emErrs93.length;
}
if(errors > 0){
const emErrors19 = {"required":{"id":[],"name":[],"provider":[]}};
const templates19 = {required:{}};
let emPropParams18;
let emParamsErrors18;
for(const err304 of vErrors){
if((((((err304.keyword !== "errorMessage") && (!err304.emUsed)) && (err304.instancePath === instancePath+"/models/summarizer/model")) && (err304.keyword in emErrors19)) && (err304.schemaPath.indexOf("#/properties/models/properties/summarizer/properties/model") === 0)) && (/^\/[^\/]*$/.test(err304.schemaPath.slice(58)))){
emPropParams18 = obj0[err304.keyword];
emParamsErrors18 = emErrors19[err304.keyword][err304.params[emPropParams18]];
if(emParamsErrors18){
emParamsErrors18.push(err304);
err304.emUsed = true;
}
}
}
for(const key22 in emErrors19){
for(const keyProp18 in emErrors19[key22]){
emParamsErrors18 = emErrors19[key22][keyProp18];
if(emParamsErrors18.length){
const tmpl18 = templates19[key22] && templates19[key22][keyProp18];
const err305 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/properties/models/properties/summarizer/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors18},message:tmpl18 ? tmpl18() : schema27.properties.models.properties.summarizer.properties.model.errorMessage[key22][keyProp18],schema:schema27.properties.models.properties.summarizer.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.summarizer.properties.model,data:data78};
if(vErrors === null){
vErrors = [err305];
}
else {
vErrors.push(err305);
}
errors++;
}
}
}
const emErrs94 = [];
for(const err306 of vErrors){
if(!err306.emUsed){
emErrs94.push(err306);
}
}
vErrors = emErrs94;
errors = emErrs94.length;
}
}
if(data77.inputPricePerMillion !== undefined){
let data85 = data77.inputPricePerMillion;
if(typeof data85 == "number"){
if(data85 < 0 || isNaN(data85)){
const err307 = {instancePath:instancePath+"/models/summarizer/inputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.summarizer.properties.inputPricePerMillion,data:data85};
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
const err308 = {instancePath:instancePath+"/models/summarizer/inputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.summarizer.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.summarizer.properties.inputPricePerMillion,data:data85};
if(vErrors === null){
vErrors = [err308];
}
else {
vErrors.push(err308);
}
errors++;
}
if(errors > 0){
const emErrs95 = [];
for(const err309 of vErrors){
if(!err309.emUsed){
emErrs95.push(err309);
}
}
vErrors = emErrs95;
errors = emErrs95.length;
}
}
if(data77.outputPricePerMillion !== undefined){
let data86 = data77.outputPricePerMillion;
if(typeof data86 == "number"){
if(data86 < 0 || isNaN(data86)){
const err310 = {instancePath:instancePath+"/models/summarizer/outputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.summarizer.properties.outputPricePerMillion,data:data86};
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
const err311 = {instancePath:instancePath+"/models/summarizer/outputPricePerMillion",schemaPath:"#/properties/models/properties/summarizer/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.summarizer.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.summarizer.properties.outputPricePerMillion,data:data86};
if(vErrors === null){
vErrors = [err311];
}
else {
vErrors.push(err311);
}
errors++;
}
if(errors > 0){
const emErrs96 = [];
for(const err312 of vErrors){
if(!err312.emUsed){
emErrs96.push(err312);
}
}
vErrors = emErrs96;
errors = emErrs96.length;
}
}
}
else {
const err313 = {instancePath:instancePath+"/models/summarizer",schemaPath:"#/properties/models/properties/summarizer/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.summarizer.type,parentSchema:schema27.properties.models.properties.summarizer,data:data77};
if(vErrors === null){
vErrors = [err313];
}
else {
vErrors.push(err313);
}
errors++;
}
if(errors > 0){
const emErrs97 = [];
for(const err314 of vErrors){
if(!err314.emUsed){
emErrs97.push(err314);
}
}
vErrors = emErrs97;
errors = emErrs97.length;
}
}
if(data56.evaluator !== undefined){
let data87 = data56.evaluator;
if(data87 && typeof data87 == "object" && !Array.isArray(data87)){
if(data87.model !== undefined){
let data88 = data87.model;
if(data88 && typeof data88 == "object" && !Array.isArray(data88)){
if(data88.id === undefined){
const err315 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data88};
if(vErrors === null){
vErrors = [err315];
}
else {
vErrors.push(err315);
}
errors++;
}
if(data88.name === undefined){
const err316 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data88};
if(vErrors === null){
vErrors = [err316];
}
else {
vErrors.push(err316);
}
errors++;
}
if(data88.provider === undefined){
const err317 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data88};
if(vErrors === null){
vErrors = [err317];
}
else {
vErrors.push(err317);
}
errors++;
}
if(data88.id !== undefined){
let data89 = data88.id;
if(typeof data89 !== "string"){
const err318 = {instancePath:instancePath+"/models/evaluator/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data89};
if(vErrors === null){
vErrors = [err318];
}
else {
vErrors.push(err318);
}
errors++;
}
if(errors > 0){
const emErrs98 = [];
for(const err319 of vErrors){
if(!err319.emUsed){
emErrs98.push(err319);
}
}
vErrors = emErrs98;
errors = emErrs98.length;
}
}
if(data88.name !== undefined){
let data90 = data88.name;
if(typeof data90 !== "string"){
const err320 = {instancePath:instancePath+"/models/evaluator/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data90};
if(vErrors === null){
vErrors = [err320];
}
else {
vErrors.push(err320);
}
errors++;
}
if(errors > 0){
const emErrs99 = [];
for(const err321 of vErrors){
if(!err321.emUsed){
emErrs99.push(err321);
}
}
vErrors = emErrs99;
errors = emErrs99.length;
}
}
if(data88.provider !== undefined){
let data91 = data88.provider;
if(data91 && typeof data91 == "object" && !Array.isArray(data91)){
if(data91.type === undefined){
const err322 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data91};
if(vErrors === null){
vErrors = [err322];
}
else {
vErrors.push(err322);
}
errors++;
}
if(data91.name === undefined){
const err323 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data91};
if(vErrors === null){
vErrors = [err323];
}
else {
vErrors.push(err323);
}
errors++;
}
if(data91.id === undefined){
const err324 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data91};
if(vErrors === null){
vErrors = [err324];
}
else {
vErrors.push(err324);
}
errors++;
}
if(data91.type !== undefined){
let data92 = data91.type;
if(typeof data92 !== "string"){
const err325 = {instancePath:instancePath+"/models/evaluator/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data92};
if(vErrors === null){
vErrors = [err325];
}
else {
vErrors.push(err325);
}
errors++;
}
if(errors > 0){
const emErrs100 = [];
for(const err326 of vErrors){
if(!err326.emUsed){
emErrs100.push(err326);
}
}
vErrors = emErrs100;
errors = emErrs100.length;
}
}
if(data91.name !== undefined){
let data93 = data91.name;
if(typeof data93 !== "string"){
const err327 = {instancePath:instancePath+"/models/evaluator/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data93};
if(vErrors === null){
vErrors = [err327];
}
else {
vErrors.push(err327);
}
errors++;
}
if(errors > 0){
const emErrs101 = [];
for(const err328 of vErrors){
if(!err328.emUsed){
emErrs101.push(err328);
}
}
vErrors = emErrs101;
errors = emErrs101.length;
}
}
if(data91.id !== undefined){
let data94 = data91.id;
if(typeof data94 !== "string"){
const err329 = {instancePath:instancePath+"/models/evaluator/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data94};
if(vErrors === null){
vErrors = [err329];
}
else {
vErrors.push(err329);
}
errors++;
}
if(errors > 0){
const emErrs102 = [];
for(const err330 of vErrors){
if(!err330.emUsed){
emErrs102.push(err330);
}
}
vErrors = emErrs102;
errors = emErrs102.length;
}
}
}
else {
const err331 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data91};
if(vErrors === null){
vErrors = [err331];
}
else {
vErrors.push(err331);
}
errors++;
}
if(errors > 0){
const emErrors20 = {"required":{"type":[],"name":[],"id":[]}};
const templates20 = {required:{}};
let emPropParams19;
let emParamsErrors19;
for(const err332 of vErrors){
if((((((err332.keyword !== "errorMessage") && (!err332.emUsed)) && (err332.instancePath === instancePath+"/models/evaluator/model/provider")) && (err332.keyword in emErrors20)) && (err332.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err332.schemaPath.slice(39)))){
emPropParams19 = obj0[err332.keyword];
emParamsErrors19 = emErrors20[err332.keyword][err332.params[emPropParams19]];
if(emParamsErrors19){
emParamsErrors19.push(err332);
err332.emUsed = true;
}
}
}
for(const key23 in emErrors20){
for(const keyProp19 in emErrors20[key23]){
emParamsErrors19 = emErrors20[key23][keyProp19];
if(emParamsErrors19.length){
const tmpl19 = templates20[key23] && templates20[key23][keyProp19];
const err333 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors19},message:tmpl19 ? tmpl19() : schema28.properties.provider.errorMessage[key23][keyProp19],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data91};
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
const emErrs103 = [];
for(const err334 of vErrors){
if(!err334.emUsed){
emErrs103.push(err334);
}
}
vErrors = emErrs103;
errors = emErrs103.length;
}
}
}
else {
const err335 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data88};
if(vErrors === null){
vErrors = [err335];
}
else {
vErrors.push(err335);
}
errors++;
}
if(errors > 0){
const emErrors21 = {"required":{"id":[],"name":[],"provider":[]}};
const templates21 = {required:{}};
let emPropParams20;
let emParamsErrors20;
for(const err336 of vErrors){
if((((((err336.keyword !== "errorMessage") && (!err336.emUsed)) && (err336.instancePath === instancePath+"/models/evaluator/model")) && (err336.keyword in emErrors21)) && (err336.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err336.schemaPath.slice(19)))){
emPropParams20 = obj0[err336.keyword];
emParamsErrors20 = emErrors21[err336.keyword][err336.params[emPropParams20]];
if(emParamsErrors20){
emParamsErrors20.push(err336);
err336.emUsed = true;
}
}
}
for(const key24 in emErrors21){
for(const keyProp20 in emErrors21[key24]){
emParamsErrors20 = emErrors21[key24][keyProp20];
if(emParamsErrors20.length){
const tmpl20 = templates21[key24] && templates21[key24][keyProp20];
const err337 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors20},message:tmpl20 ? tmpl20() : schema28.errorMessage[key24][keyProp20],schema:schema28.errorMessage,parentSchema:schema28,data:data88};
if(vErrors === null){
vErrors = [err337];
}
else {
vErrors.push(err337);
}
errors++;
}
}
}
const emErrs104 = [];
for(const err338 of vErrors){
if(!err338.emUsed){
emErrs104.push(err338);
}
}
vErrors = emErrs104;
errors = emErrs104.length;
}
if(errors > 0){
const emErrors22 = {"required":{"id":[],"name":[],"provider":[]}};
const templates22 = {required:{}};
let emPropParams21;
let emParamsErrors21;
for(const err339 of vErrors){
if((((((err339.keyword !== "errorMessage") && (!err339.emUsed)) && (err339.instancePath === instancePath+"/models/evaluator/model")) && (err339.keyword in emErrors22)) && (err339.schemaPath.indexOf("#/properties/models/properties/evaluator/properties/model") === 0)) && (/^\/[^\/]*$/.test(err339.schemaPath.slice(57)))){
emPropParams21 = obj0[err339.keyword];
emParamsErrors21 = emErrors22[err339.keyword][err339.params[emPropParams21]];
if(emParamsErrors21){
emParamsErrors21.push(err339);
err339.emUsed = true;
}
}
}
for(const key25 in emErrors22){
for(const keyProp21 in emErrors22[key25]){
emParamsErrors21 = emErrors22[key25][keyProp21];
if(emParamsErrors21.length){
const tmpl21 = templates22[key25] && templates22[key25][keyProp21];
const err340 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/properties/models/properties/evaluator/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors21},message:tmpl21 ? tmpl21() : schema27.properties.models.properties.evaluator.properties.model.errorMessage[key25][keyProp21],schema:schema27.properties.models.properties.evaluator.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.evaluator.properties.model,data:data88};
if(vErrors === null){
vErrors = [err340];
}
else {
vErrors.push(err340);
}
errors++;
}
}
}
const emErrs105 = [];
for(const err341 of vErrors){
if(!err341.emUsed){
emErrs105.push(err341);
}
}
vErrors = emErrs105;
errors = emErrs105.length;
}
}
if(data87.inputPricePerMillion !== undefined){
let data95 = data87.inputPricePerMillion;
if(typeof data95 == "number"){
if(data95 < 0 || isNaN(data95)){
const err342 = {instancePath:instancePath+"/models/evaluator/inputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.evaluator.properties.inputPricePerMillion,data:data95};
if(vErrors === null){
vErrors = [err342];
}
else {
vErrors.push(err342);
}
errors++;
}
}
else {
const err343 = {instancePath:instancePath+"/models/evaluator/inputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.evaluator.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.evaluator.properties.inputPricePerMillion,data:data95};
if(vErrors === null){
vErrors = [err343];
}
else {
vErrors.push(err343);
}
errors++;
}
if(errors > 0){
const emErrs106 = [];
for(const err344 of vErrors){
if(!err344.emUsed){
emErrs106.push(err344);
}
}
vErrors = emErrs106;
errors = emErrs106.length;
}
}
if(data87.outputPricePerMillion !== undefined){
let data96 = data87.outputPricePerMillion;
if(typeof data96 == "number"){
if(data96 < 0 || isNaN(data96)){
const err345 = {instancePath:instancePath+"/models/evaluator/outputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.evaluator.properties.outputPricePerMillion,data:data96};
if(vErrors === null){
vErrors = [err345];
}
else {
vErrors.push(err345);
}
errors++;
}
}
else {
const err346 = {instancePath:instancePath+"/models/evaluator/outputPricePerMillion",schemaPath:"#/properties/models/properties/evaluator/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.evaluator.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.evaluator.properties.outputPricePerMillion,data:data96};
if(vErrors === null){
vErrors = [err346];
}
else {
vErrors.push(err346);
}
errors++;
}
if(errors > 0){
const emErrs107 = [];
for(const err347 of vErrors){
if(!err347.emUsed){
emErrs107.push(err347);
}
}
vErrors = emErrs107;
errors = emErrs107.length;
}
}
}
else {
const err348 = {instancePath:instancePath+"/models/evaluator",schemaPath:"#/properties/models/properties/evaluator/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.evaluator.type,parentSchema:schema27.properties.models.properties.evaluator,data:data87};
if(vErrors === null){
vErrors = [err348];
}
else {
vErrors.push(err348);
}
errors++;
}
if(errors > 0){
const emErrs108 = [];
for(const err349 of vErrors){
if(!err349.emUsed){
emErrs108.push(err349);
}
}
vErrors = emErrs108;
errors = emErrs108.length;
}
}
if(data56.moderator !== undefined){
let data97 = data56.moderator;
if(data97 && typeof data97 == "object" && !Array.isArray(data97)){
if(data97.model !== undefined){
let data98 = data97.model;
if(data98 && typeof data98 == "object" && !Array.isArray(data98)){
if(data98.id === undefined){
const err350 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data98};
if(vErrors === null){
vErrors = [err350];
}
else {
vErrors.push(err350);
}
errors++;
}
if(data98.name === undefined){
const err351 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data98};
if(vErrors === null){
vErrors = [err351];
}
else {
vErrors.push(err351);
}
errors++;
}
if(data98.provider === undefined){
const err352 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data98};
if(vErrors === null){
vErrors = [err352];
}
else {
vErrors.push(err352);
}
errors++;
}
if(data98.id !== undefined){
let data99 = data98.id;
if(typeof data99 !== "string"){
const err353 = {instancePath:instancePath+"/models/moderator/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data99};
if(vErrors === null){
vErrors = [err353];
}
else {
vErrors.push(err353);
}
errors++;
}
if(errors > 0){
const emErrs109 = [];
for(const err354 of vErrors){
if(!err354.emUsed){
emErrs109.push(err354);
}
}
vErrors = emErrs109;
errors = emErrs109.length;
}
}
if(data98.name !== undefined){
let data100 = data98.name;
if(typeof data100 !== "string"){
const err355 = {instancePath:instancePath+"/models/moderator/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data100};
if(vErrors === null){
vErrors = [err355];
}
else {
vErrors.push(err355);
}
errors++;
}
if(errors > 0){
const emErrs110 = [];
for(const err356 of vErrors){
if(!err356.emUsed){
emErrs110.push(err356);
}
}
vErrors = emErrs110;
errors = emErrs110.length;
}
}
if(data98.provider !== undefined){
let data101 = data98.provider;
if(data101 && typeof data101 == "object" && !Array.isArray(data101)){
if(data101.type === undefined){
const err357 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data101};
if(vErrors === null){
vErrors = [err357];
}
else {
vErrors.push(err357);
}
errors++;
}
if(data101.name === undefined){
const err358 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data101};
if(vErrors === null){
vErrors = [err358];
}
else {
vErrors.push(err358);
}
errors++;
}
if(data101.id === undefined){
const err359 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data101};
if(vErrors === null){
vErrors = [err359];
}
else {
vErrors.push(err359);
}
errors++;
}
if(data101.type !== undefined){
let data102 = data101.type;
if(typeof data102 !== "string"){
const err360 = {instancePath:instancePath+"/models/moderator/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data102};
if(vErrors === null){
vErrors = [err360];
}
else {
vErrors.push(err360);
}
errors++;
}
if(errors > 0){
const emErrs111 = [];
for(const err361 of vErrors){
if(!err361.emUsed){
emErrs111.push(err361);
}
}
vErrors = emErrs111;
errors = emErrs111.length;
}
}
if(data101.name !== undefined){
let data103 = data101.name;
if(typeof data103 !== "string"){
const err362 = {instancePath:instancePath+"/models/moderator/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data103};
if(vErrors === null){
vErrors = [err362];
}
else {
vErrors.push(err362);
}
errors++;
}
if(errors > 0){
const emErrs112 = [];
for(const err363 of vErrors){
if(!err363.emUsed){
emErrs112.push(err363);
}
}
vErrors = emErrs112;
errors = emErrs112.length;
}
}
if(data101.id !== undefined){
let data104 = data101.id;
if(typeof data104 !== "string"){
const err364 = {instancePath:instancePath+"/models/moderator/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data104};
if(vErrors === null){
vErrors = [err364];
}
else {
vErrors.push(err364);
}
errors++;
}
if(errors > 0){
const emErrs113 = [];
for(const err365 of vErrors){
if(!err365.emUsed){
emErrs113.push(err365);
}
}
vErrors = emErrs113;
errors = emErrs113.length;
}
}
}
else {
const err366 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data101};
if(vErrors === null){
vErrors = [err366];
}
else {
vErrors.push(err366);
}
errors++;
}
if(errors > 0){
const emErrors23 = {"required":{"type":[],"name":[],"id":[]}};
const templates23 = {required:{}};
let emPropParams22;
let emParamsErrors22;
for(const err367 of vErrors){
if((((((err367.keyword !== "errorMessage") && (!err367.emUsed)) && (err367.instancePath === instancePath+"/models/moderator/model/provider")) && (err367.keyword in emErrors23)) && (err367.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err367.schemaPath.slice(39)))){
emPropParams22 = obj0[err367.keyword];
emParamsErrors22 = emErrors23[err367.keyword][err367.params[emPropParams22]];
if(emParamsErrors22){
emParamsErrors22.push(err367);
err367.emUsed = true;
}
}
}
for(const key26 in emErrors23){
for(const keyProp22 in emErrors23[key26]){
emParamsErrors22 = emErrors23[key26][keyProp22];
if(emParamsErrors22.length){
const tmpl22 = templates23[key26] && templates23[key26][keyProp22];
const err368 = {instancePath:instancePath+"/models/moderator/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors22},message:tmpl22 ? tmpl22() : schema28.properties.provider.errorMessage[key26][keyProp22],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data101};
if(vErrors === null){
vErrors = [err368];
}
else {
vErrors.push(err368);
}
errors++;
}
}
}
const emErrs114 = [];
for(const err369 of vErrors){
if(!err369.emUsed){
emErrs114.push(err369);
}
}
vErrors = emErrs114;
errors = emErrs114.length;
}
}
}
else {
const err370 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data98};
if(vErrors === null){
vErrors = [err370];
}
else {
vErrors.push(err370);
}
errors++;
}
if(errors > 0){
const emErrors24 = {"required":{"id":[],"name":[],"provider":[]}};
const templates24 = {required:{}};
let emPropParams23;
let emParamsErrors23;
for(const err371 of vErrors){
if((((((err371.keyword !== "errorMessage") && (!err371.emUsed)) && (err371.instancePath === instancePath+"/models/moderator/model")) && (err371.keyword in emErrors24)) && (err371.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err371.schemaPath.slice(19)))){
emPropParams23 = obj0[err371.keyword];
emParamsErrors23 = emErrors24[err371.keyword][err371.params[emPropParams23]];
if(emParamsErrors23){
emParamsErrors23.push(err371);
err371.emUsed = true;
}
}
}
for(const key27 in emErrors24){
for(const keyProp23 in emErrors24[key27]){
emParamsErrors23 = emErrors24[key27][keyProp23];
if(emParamsErrors23.length){
const tmpl23 = templates24[key27] && templates24[key27][keyProp23];
const err372 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors23},message:tmpl23 ? tmpl23() : schema28.errorMessage[key27][keyProp23],schema:schema28.errorMessage,parentSchema:schema28,data:data98};
if(vErrors === null){
vErrors = [err372];
}
else {
vErrors.push(err372);
}
errors++;
}
}
}
const emErrs115 = [];
for(const err373 of vErrors){
if(!err373.emUsed){
emErrs115.push(err373);
}
}
vErrors = emErrs115;
errors = emErrs115.length;
}
if(errors > 0){
const emErrors25 = {"required":{"id":[],"name":[],"provider":[]}};
const templates25 = {required:{}};
let emPropParams24;
let emParamsErrors24;
for(const err374 of vErrors){
if((((((err374.keyword !== "errorMessage") && (!err374.emUsed)) && (err374.instancePath === instancePath+"/models/moderator/model")) && (err374.keyword in emErrors25)) && (err374.schemaPath.indexOf("#/properties/models/properties/moderator/properties/model") === 0)) && (/^\/[^\/]*$/.test(err374.schemaPath.slice(57)))){
emPropParams24 = obj0[err374.keyword];
emParamsErrors24 = emErrors25[err374.keyword][err374.params[emPropParams24]];
if(emParamsErrors24){
emParamsErrors24.push(err374);
err374.emUsed = true;
}
}
}
for(const key28 in emErrors25){
for(const keyProp24 in emErrors25[key28]){
emParamsErrors24 = emErrors25[key28][keyProp24];
if(emParamsErrors24.length){
const tmpl24 = templates25[key28] && templates25[key28][keyProp24];
const err375 = {instancePath:instancePath+"/models/moderator/model",schemaPath:"#/properties/models/properties/moderator/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors24},message:tmpl24 ? tmpl24() : schema27.properties.models.properties.moderator.properties.model.errorMessage[key28][keyProp24],schema:schema27.properties.models.properties.moderator.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.moderator.properties.model,data:data98};
if(vErrors === null){
vErrors = [err375];
}
else {
vErrors.push(err375);
}
errors++;
}
}
}
const emErrs116 = [];
for(const err376 of vErrors){
if(!err376.emUsed){
emErrs116.push(err376);
}
}
vErrors = emErrs116;
errors = emErrs116.length;
}
}
if(data97.inputPricePerMillion !== undefined){
let data105 = data97.inputPricePerMillion;
if(typeof data105 == "number"){
if(data105 < 0 || isNaN(data105)){
const err377 = {instancePath:instancePath+"/models/moderator/inputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.moderator.properties.inputPricePerMillion,data:data105};
if(vErrors === null){
vErrors = [err377];
}
else {
vErrors.push(err377);
}
errors++;
}
}
else {
const err378 = {instancePath:instancePath+"/models/moderator/inputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.moderator.properties.inputPricePerMillion.type,parentSchema:schema27.properties.models.properties.moderator.properties.inputPricePerMillion,data:data105};
if(vErrors === null){
vErrors = [err378];
}
else {
vErrors.push(err378);
}
errors++;
}
if(errors > 0){
const emErrs117 = [];
for(const err379 of vErrors){
if(!err379.emUsed){
emErrs117.push(err379);
}
}
vErrors = emErrs117;
errors = emErrs117.length;
}
}
if(data97.outputPricePerMillion !== undefined){
let data106 = data97.outputPricePerMillion;
if(typeof data106 == "number"){
if(data106 < 0 || isNaN(data106)){
const err380 = {instancePath:instancePath+"/models/moderator/outputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.moderator.properties.outputPricePerMillion,data:data106};
if(vErrors === null){
vErrors = [err380];
}
else {
vErrors.push(err380);
}
errors++;
}
}
else {
const err381 = {instancePath:instancePath+"/models/moderator/outputPricePerMillion",schemaPath:"#/properties/models/properties/moderator/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.moderator.properties.outputPricePerMillion.type,parentSchema:schema27.properties.models.properties.moderator.properties.outputPricePerMillion,data:data106};
if(vErrors === null){
vErrors = [err381];
}
else {
vErrors.push(err381);
}
errors++;
}
if(errors > 0){
const emErrs118 = [];
for(const err382 of vErrors){
if(!err382.emUsed){
emErrs118.push(err382);
}
}
vErrors = emErrs118;
errors = emErrs118.length;
}
}
}
else {
const err383 = {instancePath:instancePath+"/models/moderator",schemaPath:"#/properties/models/properties/moderator/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.moderator.type,parentSchema:schema27.properties.models.properties.moderator,data:data97};
if(vErrors === null){
vErrors = [err383];
}
else {
vErrors.push(err383);
}
errors++;
}
if(errors > 0){
const emErrs119 = [];
for(const err384 of vErrors){
if(!err384.emUsed){
emErrs119.push(err384);
}
}
vErrors = emErrs119;
errors = emErrs119.length;
}
}
}
else {
const err385 = {instancePath:instancePath+"/models",schemaPath:"#/properties/models/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.type,parentSchema:schema27.properties.models,data:data56};
if(vErrors === null){
vErrors = [err385];
}
else {
vErrors.push(err385);
}
errors++;
}
if(errors > 0){
const emErrs120 = [];
for(const err386 of vErrors){
if(!err386.emUsed){
emErrs120.push(err386);
}
}
vErrors = emErrs120;
errors = emErrs120.length;
}
}
if(data.moderation !== undefined){
let data107 = data.moderation;
if(data107 && typeof data107 == "object" && !Array.isArray(data107)){
if(data107.enabled === undefined){
const err387 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.moderation.required,parentSchema:schema27.properties.moderation,data:data107};
if(vErrors === null){
vErrors = [err387];
}
else {
vErrors.push(err387);
}
errors++;
}
if(data107.categories === undefined){
const err388 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/required",keyword:"required",params:{missingProperty: "categories"},message:"must have required property '"+"categories"+"'",schema:schema27.properties.moderation.required,parentSchema:schema27.properties.moderation,data:data107};
if(vErrors === null){
vErrors = [err388];
}
else {
vErrors.push(err388);
}
errors++;
}
for(const key29 in data107){
if(!((key29 === "enabled") || (key29 === "categories"))){
const err389 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key29},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.moderation,data:data107};
if(vErrors === null){
vErrors = [err389];
}
else {
vErrors.push(err389);
}
errors++;
}
}
if(data107.enabled !== undefined){
let data108 = data107.enabled;
if(typeof data108 !== "boolean"){
const err390 = {instancePath:instancePath+"/moderation/enabled",schemaPath:"#/properties/moderation/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.moderation.properties.enabled.type,parentSchema:schema27.properties.moderation.properties.enabled,data:data108};
if(vErrors === null){
vErrors = [err390];
}
else {
vErrors.push(err390);
}
errors++;
}
if(errors > 0){
const emErrs121 = [];
for(const err391 of vErrors){
if(!err391.emUsed){
emErrs121.push(err391);
}
}
vErrors = emErrs121;
errors = emErrs121.length;
}
}
if(data107.categories !== undefined){
let data109 = data107.categories;
if(Array.isArray(data109)){
const len1 = data109.length;
for(let i1=0; i1<len1; i1++){
let data110 = data109[i1];
if(typeof data110 !== "string"){
const err392 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.moderation.properties.categories.items.type,parentSchema:schema27.properties.moderation.properties.categories.items,data:data110};
if(vErrors === null){
vErrors = [err392];
}
else {
vErrors.push(err392);
}
errors++;
}
const _errs251 = errors;
let valid38 = false;
let passing1 = null;
const _errs252 = errors;
if("anonymous" !== data110){
const err393 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/0/const",keyword:"const",params:{allowedValue: "anonymous"},message:"must be equal to constant",schema:"anonymous",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[0],data:data110};
if(vErrors === null){
vErrors = [err393];
}
else {
vErrors.push(err393);
}
errors++;
}
var _valid1 = _errs252 === errors;
if(_valid1){
valid38 = true;
passing1 = 0;
}
const _errs253 = errors;
if("external" !== data110){
const err394 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/1/const",keyword:"const",params:{allowedValue: "external"},message:"must be equal to constant",schema:"external",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[1],data:data110};
if(vErrors === null){
vErrors = [err394];
}
else {
vErrors.push(err394);
}
errors++;
}
var _valid1 = _errs253 === errors;
if(_valid1 && valid38){
valid38 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid38 = true;
passing1 = 1;
}
const _errs254 = errors;
if("user" !== data110){
const err395 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/2/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[2],data:data110};
if(vErrors === null){
vErrors = [err395];
}
else {
vErrors.push(err395);
}
errors++;
}
var _valid1 = _errs254 === errors;
if(_valid1 && valid38){
valid38 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid38 = true;
passing1 = 2;
}
const _errs255 = errors;
if("contrib" !== data110){
const err396 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/3/const",keyword:"const",params:{allowedValue: "contrib"},message:"must be equal to constant",schema:"contrib",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[3],data:data110};
if(vErrors === null){
vErrors = [err396];
}
else {
vErrors.push(err396);
}
errors++;
}
var _valid1 = _errs255 === errors;
if(_valid1 && valid38){
valid38 = false;
passing1 = [passing1, 3];
}
else {
if(_valid1){
valid38 = true;
passing1 = 3;
}
const _errs256 = errors;
if("admin" !== data110){
const err397 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/oneOf/4/const",keyword:"const",params:{allowedValue: "admin"},message:"must be equal to constant",schema:"admin",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[4],data:data110};
if(vErrors === null){
vErrors = [err397];
}
else {
vErrors.push(err397);
}
errors++;
}
var _valid1 = _errs256 === errors;
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
const err398 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf",schema:schema27.properties.moderation.properties.categories.items.oneOf,parentSchema:schema27.properties.moderation.properties.categories.items,data:data110};
if(vErrors === null){
vErrors = [err398];
}
else {
vErrors.push(err398);
}
errors++;
}
else {
errors = _errs251;
if(vErrors !== null){
if(_errs251){
vErrors.length = _errs251;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors26 = {"oneOf":[]};
const templates26 = {};
for(const err399 of vErrors){
if((((((err399.keyword !== "errorMessage") && (!err399.emUsed)) && (err399.instancePath === instancePath+"/moderation/categories/" + i1)) && (err399.keyword in emErrors26)) && (err399.schemaPath.indexOf("#/properties/moderation/properties/categories/items") === 0)) && (/^\/[^\/]*$/.test(err399.schemaPath.slice(51)))){
emErrors26[err399.keyword].push(err399);
err399.emUsed = true;
}
}
for(const key30 in emErrors26){
if(emErrors26[key30].length){
const err400 = {instancePath:instancePath+"/moderation/categories/" + i1,schemaPath:"#/properties/moderation/properties/categories/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors26[key30]},message:key30 in templates26 ? templates26[key30]() : schema27.properties.moderation.properties.categories.items.errorMessage[key30],schema:schema27.properties.moderation.properties.categories.items.errorMessage,parentSchema:schema27.properties.moderation.properties.categories.items,data:data110};
if(vErrors === null){
vErrors = [err400];
}
else {
vErrors.push(err400);
}
errors++;
}
}
const emErrs122 = [];
for(const err401 of vErrors){
if(!err401.emUsed){
emErrs122.push(err401);
}
}
vErrors = emErrs122;
errors = emErrs122.length;
}
}
let i2 = data109.length;
let j0;
if(i2 > 1){
const indices0 = {};
for(;i2--;){
let item0 = data109[i2];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err402 = {instancePath:instancePath+"/moderation/categories",schemaPath:"#/properties/moderation/properties/categories/uniqueItems",keyword:"uniqueItems",params:{i: i2, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i2+" are identical)",schema:true,parentSchema:schema27.properties.moderation.properties.categories,data:data109};
if(vErrors === null){
vErrors = [err402];
}
else {
vErrors.push(err402);
}
errors++;
break;
}
indices0[item0] = i2;
}
}
}
else {
const err403 = {instancePath:instancePath+"/moderation/categories",schemaPath:"#/properties/moderation/properties/categories/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.moderation.properties.categories.type,parentSchema:schema27.properties.moderation.properties.categories,data:data109};
if(vErrors === null){
vErrors = [err403];
}
else {
vErrors.push(err403);
}
errors++;
}
if(errors > 0){
const emErrs123 = [];
for(const err404 of vErrors){
if(!err404.emUsed){
emErrs123.push(err404);
}
}
vErrors = emErrs123;
errors = emErrs123.length;
}
}
}
else {
const err405 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.moderation.type,parentSchema:schema27.properties.moderation,data:data107};
if(vErrors === null){
vErrors = [err405];
}
else {
vErrors.push(err405);
}
errors++;
}
if(errors > 0){
const emErrors27 = {"required":{"enabled":[],"categories":[]}};
const templates27 = {required:{}};
let emPropParams25;
let emParamsErrors25;
for(const err406 of vErrors){
if((((((err406.keyword !== "errorMessage") && (!err406.emUsed)) && (err406.instancePath === instancePath+"/moderation")) && (err406.keyword in emErrors27)) && (err406.schemaPath.indexOf("#/properties/moderation") === 0)) && (/^\/[^\/]*$/.test(err406.schemaPath.slice(23)))){
emPropParams25 = obj0[err406.keyword];
emParamsErrors25 = emErrors27[err406.keyword][err406.params[emPropParams25]];
if(emParamsErrors25){
emParamsErrors25.push(err406);
err406.emUsed = true;
}
}
}
for(const key31 in emErrors27){
for(const keyProp25 in emErrors27[key31]){
emParamsErrors25 = emErrors27[key31][keyProp25];
if(emParamsErrors25.length){
const tmpl25 = templates27[key31] && templates27[key31][keyProp25];
const err407 = {instancePath:instancePath+"/moderation",schemaPath:"#/properties/moderation/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors25},message:tmpl25 ? tmpl25() : schema27.properties.moderation.errorMessage[key31][keyProp25],schema:schema27.properties.moderation.errorMessage,parentSchema:schema27.properties.moderation,data:data107};
if(vErrors === null){
vErrors = [err407];
}
else {
vErrors.push(err407);
}
errors++;
}
}
}
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
return ("Mock")
}function expression16(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return (parent.data.providers?.length)
}function expression17(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return `${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(",")}`
}function expression18(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`)
}function expression19(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item.id)
}function expression20(data,body,options,context,display,layout,readOnly,summary,validates
) {
return (data.results)
}function expression21(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ([{"const":"anonymous","title":"Anonymous","key":"anonymous","value":"anonymous"},{"const":"external","title":"External","key":"external","value":"external"},{"const":"user","title":"User","key":"user","value":"user"},{"const":"contrib","title":"Contributor","key":"contrib","value":"contrib"},{"const":"admin","title":"Admin","key":"admin","value":"admin"}])
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
      title: "OpenAI Compatible",
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
      title: "Settings",
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#",
      refPointer: "https://github.com/data-fair/agents/settings-put#",
      pure: false,
      propertyKeys: ["createdAt", "updatedAt", "storeTraces", "owner", "providers", "models", "moderation", "quotas"],
      roPropertyKeys: ["createdAt", "updatedAt", "owner"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/createdAt", "https://github.com/data-fair/agents/settings-put#/properties/updatedAt", "https://github.com/data-fair/agents/settings-put#/properties/storeTraces", "https://github.com/data-fair/agents/settings-put#/properties/owner", "https://github.com/data-fair/agents/settings-put#/properties/providers", "https://github.com/data-fair/agents/settings-put#/properties/models", "https://github.com/data-fair/agents/settings-put#/properties/moderation", "https://github.com/data-fair/agents/settings-put#/properties/quotas"]
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
      title: "Store conversation traces",
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
      title: "Provider ID",
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
      title: "Display Name",
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
      title: "Enabled",
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
      title: "API Key",
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
      title: "Provider ID",
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
      title: "Display Name",
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
      title: "Enabled",
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
      title: "API Key",
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
      title: "Provider ID",
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
      title: "Display Name",
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
      title: "Enabled",
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
      title: "API Key",
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
      title: "Provider ID",
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
      title: "Display Name",
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
      title: "Enabled",
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
      title: "API Key",
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
      title: "Provider ID",
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
      title: "Display Name",
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
      title: "Enabled",
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
      title: "API Key",
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
      title: "Base URL",
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
      title: "Provider ID",
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
      title: "Display Name",
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
      title: "Enabled",
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
      title: "API Key",
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
      title: "Provider ID",
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
      title: "Display Name",
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
      title: "Enabled",
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
      title: "Base URL",
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
      title: "API Key",
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
      title: "Provider ID",
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
      title: "Display Name",
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
      title: "Enabled",
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
      title: "Models",
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
      title: "Model",
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
      title: "Input price (per 1M tokens)",
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
      title: "Output price (per 1M tokens)",
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
      title: "Tools",
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
      title: "Model",
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
      title: "Input price (per 1M tokens)",
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
      title: "Output price (per 1M tokens)",
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
      title: "Summarizer",
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
      title: "Model",
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
      title: "Input price (per 1M tokens)",
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
      title: "Output price (per 1M tokens)",
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
      title: "Evaluator",
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
      title: "Model",
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
      title: "Input price (per 1M tokens)",
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
      title: "Output price (per 1M tokens)",
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
      title: "Moderator",
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
      title: "Model",
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
      title: "Input price (per 1M tokens)",
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
      title: "Output price (per 1M tokens)",
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
      title: "Input moderation",
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
      title: "Enable input moderation",
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
      title: "Moderated user categories",
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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas": {
      title: "Role Quotas",
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
      title: "Global quotas",
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
      title: "Unlimited",
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
      title: "Monthly Limit",
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
      title: "Admin quotas",
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
      title: "Contributor quotas",
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
      title: "Simple user Quotas",
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
      title: "External user quotas",
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
      title: "Anonymous user quotas",
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
      title: "Anonymous + external pool",
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
        key: "owner"
      }, {
        key: "providers"
      }, {
        key: "models"
      }, {
        key: "moderation"
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
        title: "OpenAI Compatible"
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

      label: "Provider ID",

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
      label: "Display Name"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
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

      label: "Provider ID",

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
      label: "Display Name"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
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

      label: "Provider ID",

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
      label: "Display Name"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
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

      label: "Provider ID",

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
      label: "Display Name"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
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

      label: "Provider ID",

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
      label: "Display Name"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL": {
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
        ref: 6
      }
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name": {
      getDefaultData: {
        type: "js-eval",
        expr: "\"Scaleway\"",
        pure: true,
        dataAlias: "value",
        ref: 13
      },

      comp: "text-field",
      label: "Display Name"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
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

      title: "OpenAI Compatible",
      subtitle: "<p>Generic provider for any OpenAI-compatible endpoint (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). API Key is optional for unauthenticated local servers.</p>",
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

      label: "Provider ID",

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
      label: "Display Name"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/baseURL": {
      comp: "text-field",
      label: "Base URL"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7/properties/apiKey": {
      comp: "text-field",
      label: "API Key"
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

      label: "Provider ID",

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
        ref: 15
      },

      comp: "text-field",
      label: "Display Name"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/models": {
      title: null,

      if: {
        type: "js-eval",
        expr: "parent.data.providers?.length",
        pure: false,
        dataAlias: "value",
        ref: 16
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
      subtitle: "<p>The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.</p>\n<p>Recommendations: GPT-5.4, Claude 4.5 Sonnet, Kimi K2, Mistral Large 3, etc.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model": {
      comp: "autocomplete",

      getItems: {
        url: {
          pure: false,
          type: "js-tpl",
          dataAlias: "value",
          expr: "${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}",
          ref: 17
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 20
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 18
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 19
        },

        returnObjects: true
      },

      label: "Model"
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
      label: "Input price (per 1M tokens)",
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
      label: "Output price (per 1M tokens)",
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

      title: "Tools",
      subtitle: "<p>The &quot;technician.&quot; Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.</p>\n<p>Recommendations: GPT-5.4 Mini, Mistral DevStral, Claude 4.5 Sonnet (Computer Use), MiMo-V2-Flash, etc.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/model": {
      comp: "autocomplete",

      getItems: {
        url: {
          pure: false,
          type: "js-tpl",
          dataAlias: "value",
          expr: "${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}",
          ref: 17
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 20
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 18
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 19
        },

        returnObjects: true
      },

      label: "Model"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Input price (per 1M tokens)",
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
      label: "Output price (per 1M tokens)",
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

      title: "Summarizer",
      subtitle: "<p>A &quot;shorthand&quot; specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.</p>\n<p>Recommendations: GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Qwen3 (8B), etc.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model": {
      comp: "autocomplete",

      getItems: {
        url: {
          pure: false,
          type: "js-tpl",
          dataAlias: "value",
          expr: "${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}",
          ref: 17
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 20
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 18
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 19
        },

        returnObjects: true
      },

      label: "Model"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Input price (per 1M tokens)",
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
      label: "Output price (per 1M tokens)",
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

      title: "Evaluator",
      subtitle: "<p>The &quot;quality controller.&quot; Analyzes the assistant&#39;s logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.</p>\n<p>Recommendations: Claude Opus 4.6, GPT-5.4 (Reasoning), DeepSeek-R1, Pharia-1-LLM, etc.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/model": {
      comp: "autocomplete",

      getItems: {
        url: {
          pure: false,
          type: "js-tpl",
          dataAlias: "value",
          expr: "${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}",
          ref: 17
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 20
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 18
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 19
        },

        returnObjects: true
      },

      label: "Model"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Input price (per 1M tokens)",
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
      label: "Output price (per 1M tokens)",
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

      title: "Moderator",
      subtitle: "<p>The &quot;gatekeeper.&quot; Classifies each new user message for profanity, prompt-injection, persona override, and out-of-scope requests. Should be fast and cheap — it sits on the critical path to the first response token.</p>\n<p>Recommendations: a small/fast general-purpose model with structured (JSON) output support, e.g. Claude 4.5 Haiku, GPT-5.4 Mini, Mistral Small 4, Qwen3 (4B). Dedicated moderation classifiers (Llama Guard, moderation APIs) are not compatible: they use fixed taxonomies and output formats that cannot express this platform&#39;s custom policy.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/model": {
      comp: "autocomplete",

      getItems: {
        url: {
          pure: false,
          type: "js-tpl",
          dataAlias: "value",
          expr: "${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}",
          ref: 17
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 20
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 18
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 19
        },

        returnObjects: true
      },

      label: "Model"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/moderator/properties/inputPricePerMillion": {
      comp: "number-field",
      min: 0,
      label: "Input price (per 1M tokens)",
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
      label: "Output price (per 1M tokens)",
      defaultData: 0,

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
        ref: 16
      },

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

    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"anonymous\",\"title\":\"Anonymous\",\"key\":\"anonymous\",\"value\":\"anonymous\"},{\"const\":\"external\",\"title\":\"External\",\"key\":\"external\",\"value\":\"external\"},{\"const\":\"user\",\"title\":\"User\",\"key\":\"user\",\"value\":\"user\"},{\"const\":\"contrib\",\"title\":\"Contributor\",\"key\":\"contrib\",\"value\":\"contrib\"},{\"const\":\"admin\",\"title\":\"Admin\",\"key\":\"admin\",\"value\":\"admin\"}]",
        immutable: true,
        ref: 21
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

    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"anonymous\",\"title\":\"Anonymous\",\"key\":\"anonymous\",\"value\":\"anonymous\"},{\"const\":\"external\",\"title\":\"External\",\"key\":\"external\",\"value\":\"external\"},{\"const\":\"user\",\"title\":\"User\",\"key\":\"user\",\"value\":\"user\"},{\"const\":\"contrib\",\"title\":\"Contributor\",\"key\":\"contrib\",\"value\":\"contrib\"},{\"const\":\"admin\",\"title\":\"Admin\",\"key\":\"admin\",\"value\":\"admin\"}]",
        immutable: true,
        ref: 21
      },

      label: "",
      nullable: true
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas": {
      title: null,

      if: {
        type: "js-eval",
        expr: "parent.data.providers?.length",
        pure: false,
        dataAlias: "value",
        ref: 16
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

      title: "Global quotas",

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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/admin": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/contrib": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/user": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/external": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/anonymous": {
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

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/untrusted": {
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
    }
  },

  validates: {
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0": validate22,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1": validate24,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2": validate25,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3": validate26,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4": validate27,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5": validate28,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6": validate29,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/7": validate30,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/8": validate31,
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items": validate32,
    "https://github.com/data-fair/agents/settings-put#/properties/moderation/properties/categories/items": validate33,
    "https://github.com/data-fair/agents/settings-put#": validate34
  },

  validationErrors: {},
  expressions: [expression0, expression1, expression2, expression3, expression4, expression5, expression6, expression7, expression8, expression9, expression10, expression11, expression12, expression13, expression14, expression15, expression16, expression17, expression18, expression19, expression20, expression21, expression22, expression23],
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