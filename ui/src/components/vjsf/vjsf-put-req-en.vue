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

import cardNode from '@koumoul/vjsf/components/nodes/card.vue'

import autocompleteNode from '@koumoul/vjsf/components/nodes/autocomplete.vue'

import numberfieldNode from '@koumoul/vjsf/components/nodes/number-field.vue'


import localizeErrors from "ajv-i18n/localize/en/index.js";
import { fullFormats } from "ajv-formats/dist/formats.js";

const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0"};
const schema38 = {"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}};
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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema38.required,parentSchema:schema38,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema38.required,parentSchema:schema38,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema38.required,parentSchema:schema38,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema38.required,parentSchema:schema38,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema38.properties.type.type,parentSchema:schema38.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openai" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema38.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema38.properties.id.type,parentSchema:schema38.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema38.properties.name.type,parentSchema:schema38.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema38.properties.enabled.type,parentSchema:schema38.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema38.properties.apiKey.type,parentSchema:schema38.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema38.type,parentSchema:schema38,data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema38.errorMessage[key0][keyProp0],schema:schema38.errorMessage,parentSchema:schema38,data};
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

const schema39 = {"$id":"export1","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1"};
const schema40 = {"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema40.required,parentSchema:schema40,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema40.required,parentSchema:schema40,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema40.required,parentSchema:schema40,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema40.required,parentSchema:schema40,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema40.properties.type.type,parentSchema:schema40.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("anthropic" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant",schema:"anthropic",parentSchema:schema40.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema40.properties.id.type,parentSchema:schema40.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema40.properties.name.type,parentSchema:schema40.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema40.properties.enabled.type,parentSchema:schema40.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema40.properties.apiKey.type,parentSchema:schema40.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema40.type,parentSchema:schema40,data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema40.errorMessage[key0][keyProp0],schema:schema40.errorMessage,parentSchema:schema40,data};
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

const schema41 = {"$id":"export2","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2"};
const schema42 = {"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema42.required,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema42.required,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema42.required,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema42.required,parentSchema:schema42,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.type.type,parentSchema:schema42.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("google" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant",schema:"google",parentSchema:schema42.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.id.type,parentSchema:schema42.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.name.type,parentSchema:schema42.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema42.properties.enabled.type,parentSchema:schema42.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.apiKey.type,parentSchema:schema42.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema42.type,parentSchema:schema42,data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema42.errorMessage[key0][keyProp0],schema:schema42.errorMessage,parentSchema:schema42,data};
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

const schema43 = {"$id":"export3","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3"};
const schema44 = {"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema44.required,parentSchema:schema44,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema44.required,parentSchema:schema44,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema44.required,parentSchema:schema44,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema44.required,parentSchema:schema44,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.properties.type.type,parentSchema:schema44.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("mistral" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant",schema:"mistral",parentSchema:schema44.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.properties.id.type,parentSchema:schema44.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.properties.name.type,parentSchema:schema44.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema44.properties.enabled.type,parentSchema:schema44.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.properties.apiKey.type,parentSchema:schema44.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema44.type,parentSchema:schema44,data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema44.errorMessage[key0][keyProp0],schema:schema44.errorMessage,parentSchema:schema44,data};
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

const schema45 = {"$id":"export4","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4"};
const schema46 = {"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema46.required,parentSchema:schema46,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema46.required,parentSchema:schema46,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema46.required,parentSchema:schema46,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema46.required,parentSchema:schema46,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.type.type,parentSchema:schema46.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openrouter" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant",schema:"openrouter",parentSchema:schema46.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.id.type,parentSchema:schema46.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.name.type,parentSchema:schema46.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema46.properties.enabled.type,parentSchema:schema46.properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.apiKey.type,parentSchema:schema46.properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema46.type,parentSchema:schema46,data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema46.errorMessage[key0][keyProp0],schema:schema46.errorMessage,parentSchema:schema46,data};
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

const schema47 = {"$id":"export5","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5"};
const schema48 = {"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"Base URL","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information","baseURL":"required information"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema48.required,parentSchema:schema48,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema48.required,parentSchema:schema48,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema48.required,parentSchema:schema48,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema48.required,parentSchema:schema48,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.baseURL === undefined){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema48.required,parentSchema:schema48,data};
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
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema48.properties.type.type,parentSchema:schema48.properties.type,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("ollama" !== data0){
const err6 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant",schema:"ollama",parentSchema:schema48.properties.type,data:data0};
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
const err8 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema48.properties.id.type,parentSchema:schema48.properties.id,data:data1};
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
const err10 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema48.properties.name.type,parentSchema:schema48.properties.name,data:data2};
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
const err12 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema48.properties.enabled.type,parentSchema:schema48.properties.enabled,data:data3};
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
const err14 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema48.properties.apiKey.type,parentSchema:schema48.properties.apiKey,data:data4};
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
const err16 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema48.properties.baseURL.type,parentSchema:schema48.properties.baseURL,data:data5};
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
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema48.type,parentSchema:schema48,data};
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
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema48.errorMessage[key0][keyProp0],schema:schema48.errorMessage,parentSchema:schema48,data};
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

const schema49 = {"$id":"export6","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6"};
const schema50 = {"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema50.required,parentSchema:schema50,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema50.required,parentSchema:schema50,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema50.required,parentSchema:schema50,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema50.required,parentSchema:schema50,data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema50.properties.type.type,parentSchema:schema50.properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("mock" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema50.properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema50.properties.id.type,parentSchema:schema50.properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema50.properties.name.type,parentSchema:schema50.properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema50.properties.enabled.type,parentSchema:schema50.properties.enabled,data:data3};
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
const err13 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema50.type,parentSchema:schema50,data};
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
if((((((err14.keyword !== "errorMessage") && (!err14.emUsed)) && (err14.instancePath === instancePath)) && (err14.keyword in emErrors0)) && (err14.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6") === 0)) && (/^\/[^\/]*$/.test(err14.schemaPath.slice(84)))){
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema50.errorMessage[key0][keyProp0],schema:schema50.errorMessage,parentSchema:schema50,data};
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
validate29.errors = vErrors;
return errors === 0;
}
validate29.evaluated = {"props":{"type":true,"id":true,"name":true,"enabled":true},"dynamicProps":false,"dynamicItems":false};

const schema51 = {"$id":"export7","$ref":"https://github.com/data-fair/agents/settings-put#/properties/providers/items"};
const schema52 = {"type":"object","title":"Provider","unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"Base URL","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information","baseURL":"required information"}}},{"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items","errorMessage":{"oneOf":"chose one"}};

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
const _errs2 = errors;
let valid1 = false;
let passing0 = null;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema52.oneOf[0].required,parentSchema:schema52.oneOf[0],data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema52.oneOf[0].required,parentSchema:schema52.oneOf[0],data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema52.oneOf[0].required,parentSchema:schema52.oneOf[0],data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema52.oneOf[0].required,parentSchema:schema52.oneOf[0],data};
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
const err4 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[0].properties.type.type,parentSchema:schema52.oneOf[0].properties.type,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("openai" !== data0){
const err5 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema52.oneOf[0].properties.type,data:data0};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[0].properties.id.type,parentSchema:schema52.oneOf[0].properties.id,data:data1};
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
const err9 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[0].properties.name.type,parentSchema:schema52.oneOf[0].properties.name,data:data2};
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
const err11 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema52.oneOf[0].properties.enabled.type,parentSchema:schema52.oneOf[0].properties.enabled,data:data3};
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
const err13 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[0].properties.apiKey.type,parentSchema:schema52.oneOf[0].properties.apiKey,data:data4};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema52.oneOf[0].type,parentSchema:schema52.oneOf[0],data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema52.oneOf[0].errorMessage[key0][keyProp0],schema:schema52.oneOf[0].errorMessage,parentSchema:schema52.oneOf[0],data};
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
const err19 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema52.oneOf[1].required,parentSchema:schema52.oneOf[1],data};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data.name === undefined){
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema52.oneOf[1].required,parentSchema:schema52.oneOf[1],data};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data.id === undefined){
const err21 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema52.oneOf[1].required,parentSchema:schema52.oneOf[1],data};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data.enabled === undefined){
const err22 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema52.oneOf[1].required,parentSchema:schema52.oneOf[1],data};
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
const err23 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[1].properties.type.type,parentSchema:schema52.oneOf[1].properties.type,data:data5};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if("anthropic" !== data5){
const err24 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant",schema:"anthropic",parentSchema:schema52.oneOf[1].properties.type,data:data5};
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
const err26 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[1].properties.id.type,parentSchema:schema52.oneOf[1].properties.id,data:data6};
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
const err28 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[1].properties.name.type,parentSchema:schema52.oneOf[1].properties.name,data:data7};
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
const err30 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema52.oneOf[1].properties.enabled.type,parentSchema:schema52.oneOf[1].properties.enabled,data:data8};
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
const err32 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[1].properties.apiKey.type,parentSchema:schema52.oneOf[1].properties.apiKey,data:data9};
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
const err34 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema52.oneOf[1].type,parentSchema:schema52.oneOf[1],data};
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
const err36 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema52.oneOf[1].errorMessage[key1][keyProp1],schema:schema52.oneOf[1].errorMessage,parentSchema:schema52.oneOf[1],data};
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
const err38 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema52.oneOf[2].required,parentSchema:schema52.oneOf[2],data};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data.name === undefined){
const err39 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema52.oneOf[2].required,parentSchema:schema52.oneOf[2],data};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data.id === undefined){
const err40 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema52.oneOf[2].required,parentSchema:schema52.oneOf[2],data};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data.enabled === undefined){
const err41 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema52.oneOf[2].required,parentSchema:schema52.oneOf[2],data};
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
const err42 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[2].properties.type.type,parentSchema:schema52.oneOf[2].properties.type,data:data10};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if("google" !== data10){
const err43 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant",schema:"google",parentSchema:schema52.oneOf[2].properties.type,data:data10};
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
const err45 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[2].properties.id.type,parentSchema:schema52.oneOf[2].properties.id,data:data11};
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
const err47 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[2].properties.name.type,parentSchema:schema52.oneOf[2].properties.name,data:data12};
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
const err49 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema52.oneOf[2].properties.enabled.type,parentSchema:schema52.oneOf[2].properties.enabled,data:data13};
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
const err51 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[2].properties.apiKey.type,parentSchema:schema52.oneOf[2].properties.apiKey,data:data14};
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
const err53 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema52.oneOf[2].type,parentSchema:schema52.oneOf[2],data};
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
const err55 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema52.oneOf[2].errorMessage[key2][keyProp2],schema:schema52.oneOf[2].errorMessage,parentSchema:schema52.oneOf[2],data};
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
const err57 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema52.oneOf[3].required,parentSchema:schema52.oneOf[3],data};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data.name === undefined){
const err58 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema52.oneOf[3].required,parentSchema:schema52.oneOf[3],data};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data.id === undefined){
const err59 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema52.oneOf[3].required,parentSchema:schema52.oneOf[3],data};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data.enabled === undefined){
const err60 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema52.oneOf[3].required,parentSchema:schema52.oneOf[3],data};
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
const err61 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[3].properties.type.type,parentSchema:schema52.oneOf[3].properties.type,data:data15};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if("mistral" !== data15){
const err62 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant",schema:"mistral",parentSchema:schema52.oneOf[3].properties.type,data:data15};
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
const err64 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[3].properties.id.type,parentSchema:schema52.oneOf[3].properties.id,data:data16};
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
const err66 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[3].properties.name.type,parentSchema:schema52.oneOf[3].properties.name,data:data17};
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
const err68 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema52.oneOf[3].properties.enabled.type,parentSchema:schema52.oneOf[3].properties.enabled,data:data18};
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
const err70 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[3].properties.apiKey.type,parentSchema:schema52.oneOf[3].properties.apiKey,data:data19};
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
const err72 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema52.oneOf[3].type,parentSchema:schema52.oneOf[3],data};
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
const err74 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema52.oneOf[3].errorMessage[key3][keyProp3],schema:schema52.oneOf[3].errorMessage,parentSchema:schema52.oneOf[3],data};
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
const err76 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema52.oneOf[4].required,parentSchema:schema52.oneOf[4],data};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
if(data.name === undefined){
const err77 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema52.oneOf[4].required,parentSchema:schema52.oneOf[4],data};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(data.id === undefined){
const err78 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema52.oneOf[4].required,parentSchema:schema52.oneOf[4],data};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if(data.enabled === undefined){
const err79 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema52.oneOf[4].required,parentSchema:schema52.oneOf[4],data};
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
const err80 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[4].properties.type.type,parentSchema:schema52.oneOf[4].properties.type,data:data20};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if("openrouter" !== data20){
const err81 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant",schema:"openrouter",parentSchema:schema52.oneOf[4].properties.type,data:data20};
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
const err83 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[4].properties.id.type,parentSchema:schema52.oneOf[4].properties.id,data:data21};
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
const err85 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[4].properties.name.type,parentSchema:schema52.oneOf[4].properties.name,data:data22};
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
const err87 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema52.oneOf[4].properties.enabled.type,parentSchema:schema52.oneOf[4].properties.enabled,data:data23};
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
const err89 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[4].properties.apiKey.type,parentSchema:schema52.oneOf[4].properties.apiKey,data:data24};
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
const err91 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema52.oneOf[4].type,parentSchema:schema52.oneOf[4],data};
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
const err93 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema52.oneOf[4].errorMessage[key4][keyProp4],schema:schema52.oneOf[4].errorMessage,parentSchema:schema52.oneOf[4],data};
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
const err95 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema52.oneOf[5].required,parentSchema:schema52.oneOf[5],data};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
if(data.name === undefined){
const err96 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema52.oneOf[5].required,parentSchema:schema52.oneOf[5],data};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(data.id === undefined){
const err97 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema52.oneOf[5].required,parentSchema:schema52.oneOf[5],data};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
if(data.enabled === undefined){
const err98 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema52.oneOf[5].required,parentSchema:schema52.oneOf[5],data};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(data.baseURL === undefined){
const err99 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema52.oneOf[5].required,parentSchema:schema52.oneOf[5],data};
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
const err100 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[5].properties.type.type,parentSchema:schema52.oneOf[5].properties.type,data:data25};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
if("ollama" !== data25){
const err101 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant",schema:"ollama",parentSchema:schema52.oneOf[5].properties.type,data:data25};
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
const err103 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[5].properties.id.type,parentSchema:schema52.oneOf[5].properties.id,data:data26};
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
const err105 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[5].properties.name.type,parentSchema:schema52.oneOf[5].properties.name,data:data27};
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
const err107 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema52.oneOf[5].properties.enabled.type,parentSchema:schema52.oneOf[5].properties.enabled,data:data28};
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
const err109 = {instancePath:instancePath+"/apiKey",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[5].properties.apiKey.type,parentSchema:schema52.oneOf[5].properties.apiKey,data:data29};
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
const err111 = {instancePath:instancePath+"/baseURL",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[5].properties.baseURL.type,parentSchema:schema52.oneOf[5].properties.baseURL,data:data30};
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
const err113 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema52.oneOf[5].type,parentSchema:schema52.oneOf[5],data};
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
const err115 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors5},message:tmpl5 ? tmpl5() : schema52.oneOf[5].errorMessage[key5][keyProp5],schema:schema52.oneOf[5].errorMessage,parentSchema:schema52.oneOf[5],data};
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
const err117 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema52.oneOf[6].required,parentSchema:schema52.oneOf[6],data};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
if(data.name === undefined){
const err118 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema52.oneOf[6].required,parentSchema:schema52.oneOf[6],data};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if(data.id === undefined){
const err119 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema52.oneOf[6].required,parentSchema:schema52.oneOf[6],data};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
if(data.enabled === undefined){
const err120 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema52.oneOf[6].required,parentSchema:schema52.oneOf[6],data};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
if(data.type !== undefined){
let data31 = data.type;
if(typeof data31 !== "string"){
const err121 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[6].properties.type.type,parentSchema:schema52.oneOf[6].properties.type,data:data31};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if("mock" !== data31){
const err122 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema52.oneOf[6].properties.type,data:data31};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
if(errors > 0){
const emErrs37 = [];
for(const err123 of vErrors){
if(!err123.emUsed){
emErrs37.push(err123);
}
}
vErrors = emErrs37;
errors = emErrs37.length;
}
}
if(data.id !== undefined){
let data32 = data.id;
if(typeof data32 !== "string"){
const err124 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[6].properties.id.type,parentSchema:schema52.oneOf[6].properties.id,data:data32};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
if(errors > 0){
const emErrs38 = [];
for(const err125 of vErrors){
if(!err125.emUsed){
emErrs38.push(err125);
}
}
vErrors = emErrs38;
errors = emErrs38.length;
}
}
if(data.name !== undefined){
let data33 = data.name;
if(typeof data33 !== "string"){
const err126 = {instancePath:instancePath+"/name",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.oneOf[6].properties.name.type,parentSchema:schema52.oneOf[6].properties.name,data:data33};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
if(errors > 0){
const emErrs39 = [];
for(const err127 of vErrors){
if(!err127.emUsed){
emErrs39.push(err127);
}
}
vErrors = emErrs39;
errors = emErrs39.length;
}
}
if(data.enabled !== undefined){
let data34 = data.enabled;
if(typeof data34 !== "boolean"){
const err128 = {instancePath:instancePath+"/enabled",schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema52.oneOf[6].properties.enabled.type,parentSchema:schema52.oneOf[6].properties.enabled,data:data34};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
if(errors > 0){
const emErrs40 = [];
for(const err129 of vErrors){
if(!err129.emUsed){
emErrs40.push(err129);
}
}
vErrors = emErrs40;
errors = emErrs40.length;
}
}
}
else {
const err130 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema52.oneOf[6].type,parentSchema:schema52.oneOf[6],data};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
if(errors > 0){
const emErrors6 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates6 = {required:{}};
let emPropParams6;
let emParamsErrors6;
for(const err131 of vErrors){
if((((((err131.keyword !== "errorMessage") && (!err131.emUsed)) && (err131.instancePath === instancePath)) && (err131.keyword in emErrors6)) && (err131.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6") === 0)) && (/^\/[^\/]*$/.test(err131.schemaPath.slice(84)))){
emPropParams6 = obj0[err131.keyword];
emParamsErrors6 = emErrors6[err131.keyword][err131.params[emPropParams6]];
if(emParamsErrors6){
emParamsErrors6.push(err131);
err131.emUsed = true;
}
}
}
for(const key6 in emErrors6){
for(const keyProp6 in emErrors6[key6]){
emParamsErrors6 = emErrors6[key6][keyProp6];
if(emParamsErrors6.length){
const tmpl6 = templates6[key6] && templates6[key6][keyProp6];
const err132 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema52.oneOf[6].errorMessage[key6][keyProp6],schema:schema52.oneOf[6].errorMessage,parentSchema:schema52.oneOf[6],data};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
}
}
const emErrs41 = [];
for(const err133 of vErrors){
if(!err133.emUsed){
emErrs41.push(err133);
}
}
vErrors = emErrs41;
errors = emErrs41.length;
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
}
}
}
}
}
}
}
}
if(!valid1){
const err134 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema52.oneOf,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
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
for(const key7 in data){
if(!props0 || !props0[key7]){
const err135 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/unevaluatedProperties",keyword:"unevaluatedProperties",params:{unevaluatedProperty: key7},message:"must NOT have unevaluated properties",schema:false,parentSchema:schema52,data};
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
}
else {
const err136 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema52.type,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
if(errors > 0){
const emErrors7 = {"oneOf":[]};
const templates7 = {};
for(const err137 of vErrors){
if((((((err137.keyword !== "errorMessage") && (!err137.emUsed)) && (err137.instancePath === instancePath)) && (err137.keyword in emErrors7)) && (err137.schemaPath.indexOf("https://github.com/data-fair/agents/settings-put#/properties/providers/items") === 0)) && (/^\/[^\/]*$/.test(err137.schemaPath.slice(76)))){
emErrors7[err137.keyword].push(err137);
err137.emUsed = true;
}
}
for(const key8 in emErrors7){
if(emErrors7[key8].length){
const err138 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings-put#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors7[key8]},message:key8 in templates7 ? templates7[key8]() : schema52.errorMessage[key8],schema:schema52.errorMessage,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
}
const emErrs42 = [];
for(const err139 of vErrors){
if(!err139.emUsed){
emErrs42.push(err139);
}
}
vErrors = emErrs42;
errors = emErrs42.length;
}
validate30.errors = vErrors;
return errors === 0;
}
validate30.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema53 = {"$id":"export8","$ref":"https://github.com/data-fair/agents/settings-put#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/settings-put","x-exports":["validate","types","vjsf"],"title":"Settings","layout":{"title":null},"definitions":{"RoleQuota":{"type":"object","layout":"card","required":["unlimited","dailyTokenLimit","monthlyTokenLimit"],"properties":{"unlimited":{"type":"boolean","title":"Unlimited","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited","errorMessage":{}},"dailyTokenLimit":{"layout":{"if":"!parent.data.unlimited","cols":6},"type":"integer","title":"Daily Token Limit","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/dailyTokenLimit","errorMessage":{}},"monthlyTokenLimit":{"layout":{"if":"!parent.data.unlimited","cols":6},"type":"integer","title":"Monthly Token Limit","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyTokenLimit","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota","errorMessage":{"required":{"unlimited":"required information","dailyTokenLimit":"required information","monthlyTokenLimit":"required information"}}},"Model":{"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":{"pure":false,"type":"js-tpl","dataAlias":"value","expr":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}","ref":15},"itemsResults":{"pure":true,"type":"js-eval","dataAlias":"body","expr":"data.results","ref":18},"itemTitle":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","ref":16},"itemKey":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"item.id","ref":17},"returnObjects":true}},"properties":{"id":{"type":"string","title":"Model ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id","errorMessage":{}},"name":{"type":"string","title":"Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name","errorMessage":{}},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type","errorMessage":{}},"name":{"type":"string","title":"Provider Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name","errorMessage":{}},"id":{"type":"string","title":"Provider ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider","errorMessage":{"required":{"type":"required information","name":"required information","id":"required information"}}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model","errorMessage":{"required":{"id":"required information","name":"required information","provider":"required information"}}}},"type":"object","additionalProperties":false,"required":["providers","models","quotas"],"properties":{"createdAt":{"type":"string","format":"date-time","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/createdAt","errorMessage":{}},"updatedAt":{"type":"string","format":"date-time","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/updatedAt","errorMessage":{}},"owner":{"type":"object","additionalProperties":false,"required":["type","id"],"readOnly":true,"properties":{"type":{"type":"string","enum":["user","organization"],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/type","errorMessage":{}},"id":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/id","errorMessage":{}},"name":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/name","errorMessage":{}},"department":{"type":"string","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner/properties/department","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/owner","errorMessage":{"required":{"type":"required information","id":"required information"}}},"providers":{"type":"array","title":"AI Providers","layout":{"itemTitle":"item ? `${item.name || \"\"} - ${item.id.slice(0, 8)}` : \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","title":"Provider","unevaluatedProperties":false,"oneOfLayout":{"emptyData":true},"discriminator":{"propertyName":"type"},"layout":{"getDefaultData":"{ id: crypto.randomUUID() }","switch":[{"if":"summary","children":[]}]},"oneOf":[{"required":["type","name","id","enabled"],"title":"Open AI","properties":{"type":{"type":"string","title":"Provider Type","const":"openai","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Open AI\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"Anthropic","properties":{"type":{"type":"string","title":"Provider Type","const":"anthropic","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Anthropic\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"Google","properties":{"type":{"type":"string","title":"Provider Type","const":"google","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Google\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"Mistral","properties":{"type":{"type":"string","title":"Provider Type","const":"mistral","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Mistral\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled"],"title":"OpenRouter","properties":{"type":{"type":"string","title":"Provider Type","const":"openrouter","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"OpenRouter\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4/properties/apiKey","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}},{"required":["type","name","id","enabled","baseURL"],"title":"Ollama","properties":{"type":{"type":"string","title":"Provider Type","const":"ollama","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Ollama\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/enabled","errorMessage":{}},"apiKey":{"type":"string","title":"API Key","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/apiKey","errorMessage":{}},"baseURL":{"type":"string","title":"Base URL","default":"http://localhost:11434","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5/properties/baseURL","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information","baseURL":"required information"}}},{"required":["type","name","id","enabled"],"title":"Mock","description":"To a message \"hello\" respond \"world\", to a message \"call tool ARG1 ARG2\" respond with a tool call, to anything else respond \"what do you mean ?\"","properties":{"type":{"type":"string","title":"Provider Type","const":"mock","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type","errorMessage":{}},"id":{"type":"string","title":"Provider ID","readOnly":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id","errorMessage":{}},"name":{"type":"string","title":"Display Name","layout":{"getDefaultData":"\"Mock\""},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name","errorMessage":{}},"enabled":{"type":"boolean","title":"Enabled","default":true,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6","errorMessage":{"required":{"type":"required information","id":"required information","name":"required information","enabled":"required information"}}}],"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers/items","errorMessage":{"oneOf":"chose one"}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/providers","errorMessage":{}},"models":{"type":"object","title":"Models","layout":{"title":null,"if":"parent.data.providers?.length"},"default":{},"properties":{"assistant":{"type":"object","title":"Assistant","description":"The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.\n\nRecommendations: GPT-5.4, Claude 4.5 Sonnet, Llama 4 Maverick, Mistral Large 3, etc.","layout":{"comp":"card","children":[{"key":"model","cols":8},{"key":"ratio","cols":4}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model","errorMessage":{"required":{"id":"required information","name":"required information","provider":"required information"}}},"ratio":{"type":"number","title":"Usage Ratio","description":"Multiplier applied to token usage for quota accounting (e.g. 1.0 = full cost, 0.5 = half cost)","default":1,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/ratio","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant","errorMessage":{}},"tools":{"type":"object","title":"Tools","description":"The \"technician.\" Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.\n\nRecommendations: GPT-5.4 Mini, Mistral DevStral, Claude 4.5 Sonnet (Computer Use), MiMo-V2-Flash, etc.","layout":{"comp":"card","children":[{"key":"model","cols":8},{"key":"ratio","cols":4}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/model","errorMessage":{"required":{"id":"required information","name":"required information","provider":"required information"}}},"ratio":{"type":"number","title":"Usage Ratio","description":"Multiplier applied to token usage for quota accounting","default":0.5,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/ratio","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools","errorMessage":{}},"summarizer":{"type":"object","title":"Summarizer","description":"A \"shorthand\" specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.\n\nRecommendations: GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Llama 4 (8B), etc.","layout":{"comp":"card","children":[{"key":"model","cols":8},{"key":"ratio","cols":4}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model","errorMessage":{"required":{"id":"required information","name":"required information","provider":"required information"}}},"ratio":{"type":"number","title":"Usage Ratio","description":"Multiplier applied to token usage for quota accounting (e.g. 0.5 for cheaper summarization)","default":0.5,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/ratio","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer","errorMessage":{}},"evaluator":{"type":"object","title":"Evaluator","description":"The \"quality controller.\" Analyzes the assistant's logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.\n\nRecommendations: Claude Opus 4.6, GPT-5.4 (Reasoning), DeepSeek-R1, Pharia-1-LLM, etc.","layout":{"comp":"card","children":[{"key":"model","cols":8},{"key":"ratio","cols":4}],"cols":6},"properties":{"model":{"$ref":"#/definitions/Model","title":"Model","__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/model","errorMessage":{"required":{"id":"required information","name":"required information","provider":"required information"}}},"ratio":{"type":"number","title":"Usage Ratio","description":"Multiplier applied to token usage for quota accounting","default":1,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/ratio","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/models","errorMessage":{}},"quotas":{"type":"object","title":"Role Quotas","layout":{"title":null,"if":"parent.data.providers?.length","children":[{"key":"global","cols":{"sm":6,"md":4}},{"key":"admin","cols":{"sm":6,"md":4}},{"key":"contrib","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"user","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"external","cols":{"sm":6,"md":4}},{"key":"anonymous","cols":{"sm":6,"md":4}}]},"required":["global","admin","contrib","user","external","anonymous"],"default":{"global":{"unlimited":false,"dailyTokenLimit":100000,"monthlyTokenLimit":1000000},"admin":{"unlimited":true,"dailyTokenLimit":0,"monthlyTokenLimit":0},"contrib":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0},"user":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0},"external":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0},"anonymous":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0}},"properties":{"global":{"$ref":"#/definitions/RoleQuota","title":"Global quotas","default":{"unlimited":false,"dailyTokenLimit":100000,"monthlyTokenLimit":1000000},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/global","errorMessage":{"required":{"unlimited":"required information","dailyTokenLimit":"required information","monthlyTokenLimit":"required information"}}},"admin":{"$ref":"#/definitions/RoleQuota","title":"Admin quotas","default":{"unlimited":true,"dailyTokenLimit":0,"monthlyTokenLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/admin","errorMessage":{"required":{"unlimited":"required information","dailyTokenLimit":"required information","monthlyTokenLimit":"required information"}}},"contrib":{"$ref":"#/definitions/RoleQuota","title":"Contributor quotas","default":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/contrib","errorMessage":{"required":{"unlimited":"required information","dailyTokenLimit":"required information","monthlyTokenLimit":"required information"}}},"user":{"$ref":"#/definitions/RoleQuota","title":"Simple user Quotas","default":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/user","errorMessage":{"required":{"unlimited":"required information","dailyTokenLimit":"required information","monthlyTokenLimit":"required information"}}},"external":{"$ref":"#/definitions/RoleQuota","title":"External user quotas","default":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/external","errorMessage":{"required":{"unlimited":"required information","dailyTokenLimit":"required information","monthlyTokenLimit":"required information"}}},"anonymous":{"$ref":"#/definitions/RoleQuota","title":"Anonymous user quotas","default":{"unlimited":false,"dailyTokenLimit":0,"monthlyTokenLimit":0},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/anonymous","errorMessage":{"required":{"unlimited":"required information","dailyTokenLimit":"required information","monthlyTokenLimit":"required information"}}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/properties/quotas","errorMessage":{"required":{"global":"required information","admin":"required information","contrib":"required information","user":"required information","external":"required information","anonymous":"required information"}}}},"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"__pointer":"https://github.com/data-fair/agents/settings-put#","errorMessage":{"required":{"providers":"required information","models":"required information","quotas":"required information"}}};
const schema28 = {"type":"object","required":["id","name","provider"],"layout":{"comp":"autocomplete","getItems":{"url":{"pure":false,"type":"js-tpl","dataAlias":"value","expr":"${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}","ref":15},"itemsResults":{"pure":true,"type":"js-eval","dataAlias":"body","expr":"data.results","ref":18},"itemTitle":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`","ref":16},"itemKey":{"pure":true,"type":"js-eval","dataAlias":"item","expr":"item.id","ref":17},"returnObjects":true}},"properties":{"id":{"type":"string","title":"Model ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/id","errorMessage":{}},"name":{"type":"string","title":"Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/name","errorMessage":{}},"provider":{"type":"object","required":["type","name","id"],"properties":{"type":{"type":"string","title":"Provider Type","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/type","errorMessage":{}},"name":{"type":"string","title":"Provider Name","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/name","errorMessage":{}},"id":{"type":"string","title":"Provider ID","__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider/properties/id","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model/properties/provider","errorMessage":{"required":{"type":"required information","name":"required information","id":"required information"}}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/Model","errorMessage":{"required":{"id":"required information","name":"required information","provider":"required information"}}};
const schema32 = {"type":"object","layout":"card","required":["unlimited","dailyTokenLimit","monthlyTokenLimit"],"properties":{"unlimited":{"type":"boolean","title":"Unlimited","default":false,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited","errorMessage":{}},"dailyTokenLimit":{"layout":{"if":"!parent.data.unlimited","cols":6},"type":"integer","title":"Daily Token Limit","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/dailyTokenLimit","errorMessage":{}},"monthlyTokenLimit":{"layout":{"if":"!parent.data.unlimited","cols":6},"type":"integer","title":"Monthly Token Limit","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyTokenLimit","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota","errorMessage":{"required":{"unlimited":"required information","dailyTokenLimit":"required information","monthlyTokenLimit":"required information"}}};
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
if(data.models === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "models"},message:"must have required property '"+"models"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.quotas === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "quotas"},message:"must have required property '"+"quotas"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "createdAt") || (key0 === "updatedAt")) || (key0 === "owner")) || (key0 === "providers")) || (key0 === "models")) || (key0 === "quotas"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.createdAt !== undefined){
let data0 = data.createdAt;
if(typeof data0 === "string"){
if(!(formats0.validate(data0))){
const err4 = {instancePath:instancePath+"/createdAt",schemaPath:"#/properties/createdAt/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\"",schema:"date-time",parentSchema:schema27.properties.createdAt,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
else {
const err5 = {instancePath:instancePath+"/createdAt",schemaPath:"#/properties/createdAt/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.createdAt.type,parentSchema:schema27.properties.createdAt,data:data0};
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
if(data.updatedAt !== undefined){
let data1 = data.updatedAt;
if(typeof data1 === "string"){
if(!(formats0.validate(data1))){
const err7 = {instancePath:instancePath+"/updatedAt",schemaPath:"#/properties/updatedAt/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\"",schema:"date-time",parentSchema:schema27.properties.updatedAt,data:data1};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
else {
const err8 = {instancePath:instancePath+"/updatedAt",schemaPath:"#/properties/updatedAt/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.updatedAt.type,parentSchema:schema27.properties.updatedAt,data:data1};
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
if(data.owner !== undefined){
let data2 = data.owner;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.type === undefined){
const err10 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.owner.required,parentSchema:schema27.properties.owner,data:data2};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data2.id === undefined){
const err11 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.owner.required,parentSchema:schema27.properties.owner,data:data2};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
for(const key1 in data2){
if(!((((key1 === "type") || (key1 === "id")) || (key1 === "name")) || (key1 === "department"))){
const err12 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.owner,data:data2};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data2.type !== undefined){
let data3 = data2.type;
if(typeof data3 !== "string"){
const err13 = {instancePath:instancePath+"/owner/type",schemaPath:"#/properties/owner/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.type.type,parentSchema:schema27.properties.owner.properties.type,data:data3};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!((data3 === "user") || (data3 === "organization"))){
const err14 = {instancePath:instancePath+"/owner/type",schemaPath:"#/properties/owner/properties/type/enum",keyword:"enum",params:{allowedValues: schema27.properties.owner.properties.type.enum},message:"must be equal to one of the allowed values",schema:schema27.properties.owner.properties.type.enum,parentSchema:schema27.properties.owner.properties.type,data:data3};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err15 of vErrors){
if(!err15.emUsed){
emErrs2.push(err15);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data2.id !== undefined){
let data4 = data2.id;
if(typeof data4 !== "string"){
const err16 = {instancePath:instancePath+"/owner/id",schemaPath:"#/properties/owner/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.id.type,parentSchema:schema27.properties.owner.properties.id,data:data4};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(errors > 0){
const emErrs3 = [];
for(const err17 of vErrors){
if(!err17.emUsed){
emErrs3.push(err17);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data2.name !== undefined){
let data5 = data2.name;
if(typeof data5 !== "string"){
const err18 = {instancePath:instancePath+"/owner/name",schemaPath:"#/properties/owner/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.name.type,parentSchema:schema27.properties.owner.properties.name,data:data5};
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
if(data2.department !== undefined){
let data6 = data2.department;
if(typeof data6 !== "string"){
const err20 = {instancePath:instancePath+"/owner/department",schemaPath:"#/properties/owner/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.owner.properties.department.type,parentSchema:schema27.properties.owner.properties.department,data:data6};
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
const err22 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.owner.type,parentSchema:schema27.properties.owner,data:data2};
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
const err24 = {instancePath:instancePath+"/owner",schemaPath:"#/properties/owner/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.owner.errorMessage[key2][keyProp0],schema:schema27.properties.owner.errorMessage,parentSchema:schema27.properties.owner,data:data2};
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
if(data.providers !== undefined){
let data7 = data.providers;
if(Array.isArray(data7)){
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
const _errs21 = errors;
let valid4 = false;
let passing0 = null;
const _errs22 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err26 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data8};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data8.name === undefined){
const err27 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data8};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data8.id === undefined){
const err28 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data8};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data8.enabled === undefined){
const err29 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[0].required,parentSchema:schema27.properties.providers.items.oneOf[0],data:data8};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data8.type !== undefined){
let data9 = data8.type;
if(typeof data9 !== "string"){
const err30 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.type,data:data9};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if("openai" !== data9){
const err31 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "openai"},message:"must be equal to constant",schema:"openai",parentSchema:schema27.properties.providers.items.oneOf[0].properties.type,data:data9};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err32 of vErrors){
if(!err32.emUsed){
emErrs7.push(err32);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data8.id !== undefined){
let data10 = data8.id;
if(typeof data10 !== "string"){
const err33 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.id,data:data10};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err34 of vErrors){
if(!err34.emUsed){
emErrs8.push(err34);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
if(data8.name !== undefined){
let data11 = data8.name;
if(typeof data11 !== "string"){
const err35 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/0/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.name,data:data11};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err36 of vErrors){
if(!err36.emUsed){
emErrs9.push(err36);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
if(data8.enabled !== undefined){
let data12 = data8.enabled;
if(typeof data12 !== "boolean"){
const err37 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/0/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[0].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.enabled,data:data12};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err38 of vErrors){
if(!err38.emUsed){
emErrs10.push(err38);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
if(data8.apiKey !== undefined){
let data13 = data8.apiKey;
if(typeof data13 !== "string"){
const err39 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/0/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[0].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[0].properties.apiKey,data:data13};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(errors > 0){
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
}
else {
const err41 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[0].type,parentSchema:schema27.properties.providers.items.oneOf[0],data:data8};
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
const err43 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.properties.providers.items.oneOf[0].errorMessage[key3][keyProp1],schema:schema27.properties.providers.items.oneOf[0].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[0],data:data8};
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
const emErrs12 = [];
for(const err44 of vErrors){
if(!err44.emUsed){
emErrs12.push(err44);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
var _valid0 = _errs22 === errors;
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
const _errs34 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err45 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data8};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data8.name === undefined){
const err46 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data8};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(data8.id === undefined){
const err47 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data8};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data8.enabled === undefined){
const err48 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[1].required,parentSchema:schema27.properties.providers.items.oneOf[1],data:data8};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data8.type !== undefined){
let data14 = data8.type;
if(typeof data14 !== "string"){
const err49 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.type,data:data14};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if("anthropic" !== data14){
const err50 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "anthropic"},message:"must be equal to constant",schema:"anthropic",parentSchema:schema27.properties.providers.items.oneOf[1].properties.type,data:data14};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err51 of vErrors){
if(!err51.emUsed){
emErrs13.push(err51);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
if(data8.id !== undefined){
let data15 = data8.id;
if(typeof data15 !== "string"){
const err52 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/1/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.id,data:data15};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(errors > 0){
const emErrs14 = [];
for(const err53 of vErrors){
if(!err53.emUsed){
emErrs14.push(err53);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
if(data8.name !== undefined){
let data16 = data8.name;
if(typeof data16 !== "string"){
const err54 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/1/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.name,data:data16};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(errors > 0){
const emErrs15 = [];
for(const err55 of vErrors){
if(!err55.emUsed){
emErrs15.push(err55);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
if(data8.enabled !== undefined){
let data17 = data8.enabled;
if(typeof data17 !== "boolean"){
const err56 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/1/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[1].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.enabled,data:data17};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err57 of vErrors){
if(!err57.emUsed){
emErrs16.push(err57);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
if(data8.apiKey !== undefined){
let data18 = data8.apiKey;
if(typeof data18 !== "string"){
const err58 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/1/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[1].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[1].properties.apiKey,data:data18};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(errors > 0){
const emErrs17 = [];
for(const err59 of vErrors){
if(!err59.emUsed){
emErrs17.push(err59);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
}
}
else {
const err60 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[1].type,parentSchema:schema27.properties.providers.items.oneOf[1],data:data8};
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
const err62 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema27.properties.providers.items.oneOf[1].errorMessage[key4][keyProp2],schema:schema27.properties.providers.items.oneOf[1].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[1],data:data8};
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
const emErrs18 = [];
for(const err63 of vErrors){
if(!err63.emUsed){
emErrs18.push(err63);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
var _valid0 = _errs34 === errors;
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
const _errs46 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err64 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data8};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(data8.name === undefined){
const err65 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data8};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(data8.id === undefined){
const err66 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data8};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(data8.enabled === undefined){
const err67 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[2].required,parentSchema:schema27.properties.providers.items.oneOf[2],data:data8};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(data8.type !== undefined){
let data19 = data8.type;
if(typeof data19 !== "string"){
const err68 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.type,data:data19};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if("google" !== data19){
const err69 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "google"},message:"must be equal to constant",schema:"google",parentSchema:schema27.properties.providers.items.oneOf[2].properties.type,data:data19};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(errors > 0){
const emErrs19 = [];
for(const err70 of vErrors){
if(!err70.emUsed){
emErrs19.push(err70);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
}
if(data8.id !== undefined){
let data20 = data8.id;
if(typeof data20 !== "string"){
const err71 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.id,data:data20};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err72 of vErrors){
if(!err72.emUsed){
emErrs20.push(err72);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
if(data8.name !== undefined){
let data21 = data8.name;
if(typeof data21 !== "string"){
const err73 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/2/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.name,data:data21};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if(errors > 0){
const emErrs21 = [];
for(const err74 of vErrors){
if(!err74.emUsed){
emErrs21.push(err74);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
if(data8.enabled !== undefined){
let data22 = data8.enabled;
if(typeof data22 !== "boolean"){
const err75 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/2/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[2].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.enabled,data:data22};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if(errors > 0){
const emErrs22 = [];
for(const err76 of vErrors){
if(!err76.emUsed){
emErrs22.push(err76);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
}
if(data8.apiKey !== undefined){
let data23 = data8.apiKey;
if(typeof data23 !== "string"){
const err77 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/2/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[2].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[2].properties.apiKey,data:data23};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(errors > 0){
const emErrs23 = [];
for(const err78 of vErrors){
if(!err78.emUsed){
emErrs23.push(err78);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
}
}
else {
const err79 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[2].type,parentSchema:schema27.properties.providers.items.oneOf[2],data:data8};
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
const err81 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema27.properties.providers.items.oneOf[2].errorMessage[key5][keyProp3],schema:schema27.properties.providers.items.oneOf[2].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[2],data:data8};
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
const emErrs24 = [];
for(const err82 of vErrors){
if(!err82.emUsed){
emErrs24.push(err82);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
var _valid0 = _errs46 === errors;
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
const _errs58 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err83 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data8};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(data8.name === undefined){
const err84 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data8};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(data8.id === undefined){
const err85 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data8};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
if(data8.enabled === undefined){
const err86 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[3].required,parentSchema:schema27.properties.providers.items.oneOf[3],data:data8};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
if(data8.type !== undefined){
let data24 = data8.type;
if(typeof data24 !== "string"){
const err87 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.type,data:data24};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
if("mistral" !== data24){
const err88 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "mistral"},message:"must be equal to constant",schema:"mistral",parentSchema:schema27.properties.providers.items.oneOf[3].properties.type,data:data24};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err89 of vErrors){
if(!err89.emUsed){
emErrs25.push(err89);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
if(data8.id !== undefined){
let data25 = data8.id;
if(typeof data25 !== "string"){
const err90 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.id,data:data25};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err91 of vErrors){
if(!err91.emUsed){
emErrs26.push(err91);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
if(data8.name !== undefined){
let data26 = data8.name;
if(typeof data26 !== "string"){
const err92 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/3/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.name,data:data26};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
if(errors > 0){
const emErrs27 = [];
for(const err93 of vErrors){
if(!err93.emUsed){
emErrs27.push(err93);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
}
if(data8.enabled !== undefined){
let data27 = data8.enabled;
if(typeof data27 !== "boolean"){
const err94 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/3/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[3].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.enabled,data:data27};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
if(errors > 0){
const emErrs28 = [];
for(const err95 of vErrors){
if(!err95.emUsed){
emErrs28.push(err95);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
}
if(data8.apiKey !== undefined){
let data28 = data8.apiKey;
if(typeof data28 !== "string"){
const err96 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/3/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[3].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[3].properties.apiKey,data:data28};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(errors > 0){
const emErrs29 = [];
for(const err97 of vErrors){
if(!err97.emUsed){
emErrs29.push(err97);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
}
}
else {
const err98 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[3].type,parentSchema:schema27.properties.providers.items.oneOf[3],data:data8};
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
const err100 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema27.properties.providers.items.oneOf[3].errorMessage[key6][keyProp4],schema:schema27.properties.providers.items.oneOf[3].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[3],data:data8};
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
const emErrs30 = [];
for(const err101 of vErrors){
if(!err101.emUsed){
emErrs30.push(err101);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
var _valid0 = _errs58 === errors;
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
const _errs70 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err102 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data8};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
if(data8.name === undefined){
const err103 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data8};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
if(data8.id === undefined){
const err104 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data8};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
if(data8.enabled === undefined){
const err105 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[4].required,parentSchema:schema27.properties.providers.items.oneOf[4],data:data8};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if(data8.type !== undefined){
let data29 = data8.type;
if(typeof data29 !== "string"){
const err106 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.type,data:data29};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
if("openrouter" !== data29){
const err107 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue: "openrouter"},message:"must be equal to constant",schema:"openrouter",parentSchema:schema27.properties.providers.items.oneOf[4].properties.type,data:data29};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(errors > 0){
const emErrs31 = [];
for(const err108 of vErrors){
if(!err108.emUsed){
emErrs31.push(err108);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
}
if(data8.id !== undefined){
let data30 = data8.id;
if(typeof data30 !== "string"){
const err109 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/4/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.id,data:data30};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if(errors > 0){
const emErrs32 = [];
for(const err110 of vErrors){
if(!err110.emUsed){
emErrs32.push(err110);
}
}
vErrors = emErrs32;
errors = emErrs32.length;
}
}
if(data8.name !== undefined){
let data31 = data8.name;
if(typeof data31 !== "string"){
const err111 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/4/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.name,data:data31};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
if(errors > 0){
const emErrs33 = [];
for(const err112 of vErrors){
if(!err112.emUsed){
emErrs33.push(err112);
}
}
vErrors = emErrs33;
errors = emErrs33.length;
}
}
if(data8.enabled !== undefined){
let data32 = data8.enabled;
if(typeof data32 !== "boolean"){
const err113 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/4/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[4].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.enabled,data:data32};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
if(errors > 0){
const emErrs34 = [];
for(const err114 of vErrors){
if(!err114.emUsed){
emErrs34.push(err114);
}
}
vErrors = emErrs34;
errors = emErrs34.length;
}
}
if(data8.apiKey !== undefined){
let data33 = data8.apiKey;
if(typeof data33 !== "string"){
const err115 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/4/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[4].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[4].properties.apiKey,data:data33};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
if(errors > 0){
const emErrs35 = [];
for(const err116 of vErrors){
if(!err116.emUsed){
emErrs35.push(err116);
}
}
vErrors = emErrs35;
errors = emErrs35.length;
}
}
}
else {
const err117 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[4].type,parentSchema:schema27.properties.providers.items.oneOf[4],data:data8};
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
const err119 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/4/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors5},message:tmpl5 ? tmpl5() : schema27.properties.providers.items.oneOf[4].errorMessage[key7][keyProp5],schema:schema27.properties.providers.items.oneOf[4].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[4],data:data8};
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
const emErrs36 = [];
for(const err120 of vErrors){
if(!err120.emUsed){
emErrs36.push(err120);
}
}
vErrors = emErrs36;
errors = emErrs36.length;
}
var _valid0 = _errs70 === errors;
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
const _errs82 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err121 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data8};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if(data8.name === undefined){
const err122 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data8};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
if(data8.id === undefined){
const err123 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data8};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
if(data8.enabled === undefined){
const err124 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data8};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
if(data8.baseURL === undefined){
const err125 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'",schema:schema27.properties.providers.items.oneOf[5].required,parentSchema:schema27.properties.providers.items.oneOf[5],data:data8};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
if(data8.type !== undefined){
let data34 = data8.type;
if(typeof data34 !== "string"){
const err126 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.type,data:data34};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
if("ollama" !== data34){
const err127 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue: "ollama"},message:"must be equal to constant",schema:"ollama",parentSchema:schema27.properties.providers.items.oneOf[5].properties.type,data:data34};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
if(errors > 0){
const emErrs37 = [];
for(const err128 of vErrors){
if(!err128.emUsed){
emErrs37.push(err128);
}
}
vErrors = emErrs37;
errors = emErrs37.length;
}
}
if(data8.id !== undefined){
let data35 = data8.id;
if(typeof data35 !== "string"){
const err129 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/5/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.id,data:data35};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
if(errors > 0){
const emErrs38 = [];
for(const err130 of vErrors){
if(!err130.emUsed){
emErrs38.push(err130);
}
}
vErrors = emErrs38;
errors = emErrs38.length;
}
}
if(data8.name !== undefined){
let data36 = data8.name;
if(typeof data36 !== "string"){
const err131 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/5/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.name,data:data36};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
if(errors > 0){
const emErrs39 = [];
for(const err132 of vErrors){
if(!err132.emUsed){
emErrs39.push(err132);
}
}
vErrors = emErrs39;
errors = emErrs39.length;
}
}
if(data8.enabled !== undefined){
let data37 = data8.enabled;
if(typeof data37 !== "boolean"){
const err133 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/5/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[5].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.enabled,data:data37};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
if(errors > 0){
const emErrs40 = [];
for(const err134 of vErrors){
if(!err134.emUsed){
emErrs40.push(err134);
}
}
vErrors = emErrs40;
errors = emErrs40.length;
}
}
if(data8.apiKey !== undefined){
let data38 = data8.apiKey;
if(typeof data38 !== "string"){
const err135 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/oneOf/5/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.apiKey.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.apiKey,data:data38};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
if(errors > 0){
const emErrs41 = [];
for(const err136 of vErrors){
if(!err136.emUsed){
emErrs41.push(err136);
}
}
vErrors = emErrs41;
errors = emErrs41.length;
}
}
if(data8.baseURL !== undefined){
let data39 = data8.baseURL;
if(typeof data39 !== "string"){
const err137 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/oneOf/5/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[5].properties.baseURL.type,parentSchema:schema27.properties.providers.items.oneOf[5].properties.baseURL,data:data39};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
if(errors > 0){
const emErrs42 = [];
for(const err138 of vErrors){
if(!err138.emUsed){
emErrs42.push(err138);
}
}
vErrors = emErrs42;
errors = emErrs42.length;
}
}
}
else {
const err139 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[5].type,parentSchema:schema27.properties.providers.items.oneOf[5],data:data8};
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
const err141 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/5/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema27.properties.providers.items.oneOf[5].errorMessage[key8][keyProp6],schema:schema27.properties.providers.items.oneOf[5].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[5],data:data8};
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
const emErrs43 = [];
for(const err142 of vErrors){
if(!err142.emUsed){
emErrs43.push(err142);
}
}
vErrors = emErrs43;
errors = emErrs43.length;
}
var _valid0 = _errs82 === errors;
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
const _errs96 = errors;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err143 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data8};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
if(data8.name === undefined){
const err144 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data8};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
if(data8.id === undefined){
const err145 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data8};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
if(data8.enabled === undefined){
const err146 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.providers.items.oneOf[6].required,parentSchema:schema27.properties.providers.items.oneOf[6],data:data8};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
if(data8.type !== undefined){
let data40 = data8.type;
if(typeof data40 !== "string"){
const err147 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.type.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.type,data:data40};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
if("mock" !== data40){
const err148 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue: "mock"},message:"must be equal to constant",schema:"mock",parentSchema:schema27.properties.providers.items.oneOf[6].properties.type,data:data40};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
if(errors > 0){
const emErrs44 = [];
for(const err149 of vErrors){
if(!err149.emUsed){
emErrs44.push(err149);
}
}
vErrors = emErrs44;
errors = emErrs44.length;
}
}
if(data8.id !== undefined){
let data41 = data8.id;
if(typeof data41 !== "string"){
const err150 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/oneOf/6/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.id.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.id,data:data41};
if(vErrors === null){
vErrors = [err150];
}
else {
vErrors.push(err150);
}
errors++;
}
if(errors > 0){
const emErrs45 = [];
for(const err151 of vErrors){
if(!err151.emUsed){
emErrs45.push(err151);
}
}
vErrors = emErrs45;
errors = emErrs45.length;
}
}
if(data8.name !== undefined){
let data42 = data8.name;
if(typeof data42 !== "string"){
const err152 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/oneOf/6/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.providers.items.oneOf[6].properties.name.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.name,data:data42};
if(vErrors === null){
vErrors = [err152];
}
else {
vErrors.push(err152);
}
errors++;
}
if(errors > 0){
const emErrs46 = [];
for(const err153 of vErrors){
if(!err153.emUsed){
emErrs46.push(err153);
}
}
vErrors = emErrs46;
errors = emErrs46.length;
}
}
if(data8.enabled !== undefined){
let data43 = data8.enabled;
if(typeof data43 !== "boolean"){
const err154 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/oneOf/6/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.providers.items.oneOf[6].properties.enabled.type,parentSchema:schema27.properties.providers.items.oneOf[6].properties.enabled,data:data43};
if(vErrors === null){
vErrors = [err154];
}
else {
vErrors.push(err154);
}
errors++;
}
if(errors > 0){
const emErrs47 = [];
for(const err155 of vErrors){
if(!err155.emUsed){
emErrs47.push(err155);
}
}
vErrors = emErrs47;
errors = emErrs47.length;
}
}
}
else {
const err156 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.oneOf[6].type,parentSchema:schema27.properties.providers.items.oneOf[6],data:data8};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
if(errors > 0){
const emErrors7 = {"required":{"type":[],"id":[],"name":[],"enabled":[]}};
const templates7 = {required:{}};
let emPropParams7;
let emParamsErrors7;
for(const err157 of vErrors){
if((((((err157.keyword !== "errorMessage") && (!err157.emUsed)) && (err157.instancePath === instancePath+"/providers/" + i0)) && (err157.keyword in emErrors7)) && (err157.schemaPath.indexOf("#/properties/providers/items/oneOf/6") === 0)) && (/^\/[^\/]*$/.test(err157.schemaPath.slice(36)))){
emPropParams7 = obj0[err157.keyword];
emParamsErrors7 = emErrors7[err157.keyword][err157.params[emPropParams7]];
if(emParamsErrors7){
emParamsErrors7.push(err157);
err157.emUsed = true;
}
}
}
for(const key9 in emErrors7){
for(const keyProp7 in emErrors7[key9]){
emParamsErrors7 = emErrors7[key9][keyProp7];
if(emParamsErrors7.length){
const tmpl7 = templates7[key9] && templates7[key9][keyProp7];
const err158 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf/6/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors7},message:tmpl7 ? tmpl7() : schema27.properties.providers.items.oneOf[6].errorMessage[key9][keyProp7],schema:schema27.properties.providers.items.oneOf[6].errorMessage,parentSchema:schema27.properties.providers.items.oneOf[6],data:data8};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
}
}
const emErrs48 = [];
for(const err159 of vErrors){
if(!err159.emUsed){
emErrs48.push(err159);
}
}
vErrors = emErrs48;
errors = emErrs48.length;
}
var _valid0 = _errs96 === errors;
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
}
}
}
}
}
}
}
}
if(!valid4){
const err160 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema27.properties.providers.items.oneOf,parentSchema:schema27.properties.providers.items,data:data8};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
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
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(props0 !== true){
for(const key10 in data8){
if(!props0 || !props0[key10]){
const err161 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/unevaluatedProperties",keyword:"unevaluatedProperties",params:{unevaluatedProperty: key10},message:"must NOT have unevaluated properties",schema:false,parentSchema:schema27.properties.providers.items,data:data8};
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
}
else {
const err162 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.providers.items.type,parentSchema:schema27.properties.providers.items,data:data8};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
if(errors > 0){
const emErrors8 = {"oneOf":[]};
const templates8 = {};
for(const err163 of vErrors){
if((((((err163.keyword !== "errorMessage") && (!err163.emUsed)) && (err163.instancePath === instancePath+"/providers/" + i0)) && (err163.keyword in emErrors8)) && (err163.schemaPath.indexOf("#/properties/providers/items") === 0)) && (/^\/[^\/]*$/.test(err163.schemaPath.slice(28)))){
emErrors8[err163.keyword].push(err163);
err163.emUsed = true;
}
}
for(const key11 in emErrors8){
if(emErrors8[key11].length){
const err164 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors8[key11]},message:key11 in templates8 ? templates8[key11]() : schema27.properties.providers.items.errorMessage[key11],schema:schema27.properties.providers.items.errorMessage,parentSchema:schema27.properties.providers.items,data:data8};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
}
const emErrs49 = [];
for(const err165 of vErrors){
if(!err165.emUsed){
emErrs49.push(err165);
}
}
vErrors = emErrs49;
errors = emErrs49.length;
}
}
}
else {
const err166 = {instancePath:instancePath+"/providers",schemaPath:"#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.providers.type,parentSchema:schema27.properties.providers,data:data7};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
if(errors > 0){
const emErrs50 = [];
for(const err167 of vErrors){
if(!err167.emUsed){
emErrs50.push(err167);
}
}
vErrors = emErrs50;
errors = emErrs50.length;
}
}
if(data.models !== undefined){
let data44 = data.models;
if(data44 && typeof data44 == "object" && !Array.isArray(data44)){
if(data44.assistant !== undefined){
let data45 = data44.assistant;
if(data45 && typeof data45 == "object" && !Array.isArray(data45)){
if(data45.model !== undefined){
let data46 = data45.model;
if(data46 && typeof data46 == "object" && !Array.isArray(data46)){
if(data46.id === undefined){
const err168 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data46};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
if(data46.name === undefined){
const err169 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data46};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
if(data46.provider === undefined){
const err170 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data46};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
if(data46.id !== undefined){
let data47 = data46.id;
if(typeof data47 !== "string"){
const err171 = {instancePath:instancePath+"/models/assistant/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data47};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
if(errors > 0){
const emErrs51 = [];
for(const err172 of vErrors){
if(!err172.emUsed){
emErrs51.push(err172);
}
}
vErrors = emErrs51;
errors = emErrs51.length;
}
}
if(data46.name !== undefined){
let data48 = data46.name;
if(typeof data48 !== "string"){
const err173 = {instancePath:instancePath+"/models/assistant/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data48};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
}
errors++;
}
if(errors > 0){
const emErrs52 = [];
for(const err174 of vErrors){
if(!err174.emUsed){
emErrs52.push(err174);
}
}
vErrors = emErrs52;
errors = emErrs52.length;
}
}
if(data46.provider !== undefined){
let data49 = data46.provider;
if(data49 && typeof data49 == "object" && !Array.isArray(data49)){
if(data49.type === undefined){
const err175 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data49};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
if(data49.name === undefined){
const err176 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data49};
if(vErrors === null){
vErrors = [err176];
}
else {
vErrors.push(err176);
}
errors++;
}
if(data49.id === undefined){
const err177 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data49};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
}
if(data49.type !== undefined){
let data50 = data49.type;
if(typeof data50 !== "string"){
const err178 = {instancePath:instancePath+"/models/assistant/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data50};
if(vErrors === null){
vErrors = [err178];
}
else {
vErrors.push(err178);
}
errors++;
}
if(errors > 0){
const emErrs53 = [];
for(const err179 of vErrors){
if(!err179.emUsed){
emErrs53.push(err179);
}
}
vErrors = emErrs53;
errors = emErrs53.length;
}
}
if(data49.name !== undefined){
let data51 = data49.name;
if(typeof data51 !== "string"){
const err180 = {instancePath:instancePath+"/models/assistant/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data51};
if(vErrors === null){
vErrors = [err180];
}
else {
vErrors.push(err180);
}
errors++;
}
if(errors > 0){
const emErrs54 = [];
for(const err181 of vErrors){
if(!err181.emUsed){
emErrs54.push(err181);
}
}
vErrors = emErrs54;
errors = emErrs54.length;
}
}
if(data49.id !== undefined){
let data52 = data49.id;
if(typeof data52 !== "string"){
const err182 = {instancePath:instancePath+"/models/assistant/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data52};
if(vErrors === null){
vErrors = [err182];
}
else {
vErrors.push(err182);
}
errors++;
}
if(errors > 0){
const emErrs55 = [];
for(const err183 of vErrors){
if(!err183.emUsed){
emErrs55.push(err183);
}
}
vErrors = emErrs55;
errors = emErrs55.length;
}
}
}
else {
const err184 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data49};
if(vErrors === null){
vErrors = [err184];
}
else {
vErrors.push(err184);
}
errors++;
}
if(errors > 0){
const emErrors9 = {"required":{"type":[],"name":[],"id":[]}};
const templates9 = {required:{}};
let emPropParams8;
let emParamsErrors8;
for(const err185 of vErrors){
if((((((err185.keyword !== "errorMessage") && (!err185.emUsed)) && (err185.instancePath === instancePath+"/models/assistant/model/provider")) && (err185.keyword in emErrors9)) && (err185.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err185.schemaPath.slice(39)))){
emPropParams8 = obj0[err185.keyword];
emParamsErrors8 = emErrors9[err185.keyword][err185.params[emPropParams8]];
if(emParamsErrors8){
emParamsErrors8.push(err185);
err185.emUsed = true;
}
}
}
for(const key12 in emErrors9){
for(const keyProp8 in emErrors9[key12]){
emParamsErrors8 = emErrors9[key12][keyProp8];
if(emParamsErrors8.length){
const tmpl8 = templates9[key12] && templates9[key12][keyProp8];
const err186 = {instancePath:instancePath+"/models/assistant/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors8},message:tmpl8 ? tmpl8() : schema28.properties.provider.errorMessage[key12][keyProp8],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data49};
if(vErrors === null){
vErrors = [err186];
}
else {
vErrors.push(err186);
}
errors++;
}
}
}
const emErrs56 = [];
for(const err187 of vErrors){
if(!err187.emUsed){
emErrs56.push(err187);
}
}
vErrors = emErrs56;
errors = emErrs56.length;
}
}
}
else {
const err188 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data46};
if(vErrors === null){
vErrors = [err188];
}
else {
vErrors.push(err188);
}
errors++;
}
if(errors > 0){
const emErrors10 = {"required":{"id":[],"name":[],"provider":[]}};
const templates10 = {required:{}};
let emPropParams9;
let emParamsErrors9;
for(const err189 of vErrors){
if((((((err189.keyword !== "errorMessage") && (!err189.emUsed)) && (err189.instancePath === instancePath+"/models/assistant/model")) && (err189.keyword in emErrors10)) && (err189.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err189.schemaPath.slice(19)))){
emPropParams9 = obj0[err189.keyword];
emParamsErrors9 = emErrors10[err189.keyword][err189.params[emPropParams9]];
if(emParamsErrors9){
emParamsErrors9.push(err189);
err189.emUsed = true;
}
}
}
for(const key13 in emErrors10){
for(const keyProp9 in emErrors10[key13]){
emParamsErrors9 = emErrors10[key13][keyProp9];
if(emParamsErrors9.length){
const tmpl9 = templates10[key13] && templates10[key13][keyProp9];
const err190 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors9},message:tmpl9 ? tmpl9() : schema28.errorMessage[key13][keyProp9],schema:schema28.errorMessage,parentSchema:schema28,data:data46};
if(vErrors === null){
vErrors = [err190];
}
else {
vErrors.push(err190);
}
errors++;
}
}
}
const emErrs57 = [];
for(const err191 of vErrors){
if(!err191.emUsed){
emErrs57.push(err191);
}
}
vErrors = emErrs57;
errors = emErrs57.length;
}
if(errors > 0){
const emErrors11 = {"required":{"id":[],"name":[],"provider":[]}};
const templates11 = {required:{}};
let emPropParams10;
let emParamsErrors10;
for(const err192 of vErrors){
if((((((err192.keyword !== "errorMessage") && (!err192.emUsed)) && (err192.instancePath === instancePath+"/models/assistant/model")) && (err192.keyword in emErrors11)) && (err192.schemaPath.indexOf("#/properties/models/properties/assistant/properties/model") === 0)) && (/^\/[^\/]*$/.test(err192.schemaPath.slice(57)))){
emPropParams10 = obj0[err192.keyword];
emParamsErrors10 = emErrors11[err192.keyword][err192.params[emPropParams10]];
if(emParamsErrors10){
emParamsErrors10.push(err192);
err192.emUsed = true;
}
}
}
for(const key14 in emErrors11){
for(const keyProp10 in emErrors11[key14]){
emParamsErrors10 = emErrors11[key14][keyProp10];
if(emParamsErrors10.length){
const tmpl10 = templates11[key14] && templates11[key14][keyProp10];
const err193 = {instancePath:instancePath+"/models/assistant/model",schemaPath:"#/properties/models/properties/assistant/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors10},message:tmpl10 ? tmpl10() : schema27.properties.models.properties.assistant.properties.model.errorMessage[key14][keyProp10],schema:schema27.properties.models.properties.assistant.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.assistant.properties.model,data:data46};
if(vErrors === null){
vErrors = [err193];
}
else {
vErrors.push(err193);
}
errors++;
}
}
}
const emErrs58 = [];
for(const err194 of vErrors){
if(!err194.emUsed){
emErrs58.push(err194);
}
}
vErrors = emErrs58;
errors = emErrs58.length;
}
}
if(data45.ratio !== undefined){
let data53 = data45.ratio;
if(typeof data53 == "number"){
if(data53 < 0 || isNaN(data53)){
const err195 = {instancePath:instancePath+"/models/assistant/ratio",schemaPath:"#/properties/models/properties/assistant/properties/ratio/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.assistant.properties.ratio,data:data53};
if(vErrors === null){
vErrors = [err195];
}
else {
vErrors.push(err195);
}
errors++;
}
}
else {
const err196 = {instancePath:instancePath+"/models/assistant/ratio",schemaPath:"#/properties/models/properties/assistant/properties/ratio/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.assistant.properties.ratio.type,parentSchema:schema27.properties.models.properties.assistant.properties.ratio,data:data53};
if(vErrors === null){
vErrors = [err196];
}
else {
vErrors.push(err196);
}
errors++;
}
if(errors > 0){
const emErrs59 = [];
for(const err197 of vErrors){
if(!err197.emUsed){
emErrs59.push(err197);
}
}
vErrors = emErrs59;
errors = emErrs59.length;
}
}
}
else {
const err198 = {instancePath:instancePath+"/models/assistant",schemaPath:"#/properties/models/properties/assistant/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.assistant.type,parentSchema:schema27.properties.models.properties.assistant,data:data45};
if(vErrors === null){
vErrors = [err198];
}
else {
vErrors.push(err198);
}
errors++;
}
if(errors > 0){
const emErrs60 = [];
for(const err199 of vErrors){
if(!err199.emUsed){
emErrs60.push(err199);
}
}
vErrors = emErrs60;
errors = emErrs60.length;
}
}
if(data44.tools !== undefined){
let data54 = data44.tools;
if(data54 && typeof data54 == "object" && !Array.isArray(data54)){
if(data54.model !== undefined){
let data55 = data54.model;
if(data55 && typeof data55 == "object" && !Array.isArray(data55)){
if(data55.id === undefined){
const err200 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data55};
if(vErrors === null){
vErrors = [err200];
}
else {
vErrors.push(err200);
}
errors++;
}
if(data55.name === undefined){
const err201 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data55};
if(vErrors === null){
vErrors = [err201];
}
else {
vErrors.push(err201);
}
errors++;
}
if(data55.provider === undefined){
const err202 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data55};
if(vErrors === null){
vErrors = [err202];
}
else {
vErrors.push(err202);
}
errors++;
}
if(data55.id !== undefined){
let data56 = data55.id;
if(typeof data56 !== "string"){
const err203 = {instancePath:instancePath+"/models/tools/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data56};
if(vErrors === null){
vErrors = [err203];
}
else {
vErrors.push(err203);
}
errors++;
}
if(errors > 0){
const emErrs61 = [];
for(const err204 of vErrors){
if(!err204.emUsed){
emErrs61.push(err204);
}
}
vErrors = emErrs61;
errors = emErrs61.length;
}
}
if(data55.name !== undefined){
let data57 = data55.name;
if(typeof data57 !== "string"){
const err205 = {instancePath:instancePath+"/models/tools/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data57};
if(vErrors === null){
vErrors = [err205];
}
else {
vErrors.push(err205);
}
errors++;
}
if(errors > 0){
const emErrs62 = [];
for(const err206 of vErrors){
if(!err206.emUsed){
emErrs62.push(err206);
}
}
vErrors = emErrs62;
errors = emErrs62.length;
}
}
if(data55.provider !== undefined){
let data58 = data55.provider;
if(data58 && typeof data58 == "object" && !Array.isArray(data58)){
if(data58.type === undefined){
const err207 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data58};
if(vErrors === null){
vErrors = [err207];
}
else {
vErrors.push(err207);
}
errors++;
}
if(data58.name === undefined){
const err208 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data58};
if(vErrors === null){
vErrors = [err208];
}
else {
vErrors.push(err208);
}
errors++;
}
if(data58.id === undefined){
const err209 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data58};
if(vErrors === null){
vErrors = [err209];
}
else {
vErrors.push(err209);
}
errors++;
}
if(data58.type !== undefined){
let data59 = data58.type;
if(typeof data59 !== "string"){
const err210 = {instancePath:instancePath+"/models/tools/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data59};
if(vErrors === null){
vErrors = [err210];
}
else {
vErrors.push(err210);
}
errors++;
}
if(errors > 0){
const emErrs63 = [];
for(const err211 of vErrors){
if(!err211.emUsed){
emErrs63.push(err211);
}
}
vErrors = emErrs63;
errors = emErrs63.length;
}
}
if(data58.name !== undefined){
let data60 = data58.name;
if(typeof data60 !== "string"){
const err212 = {instancePath:instancePath+"/models/tools/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data60};
if(vErrors === null){
vErrors = [err212];
}
else {
vErrors.push(err212);
}
errors++;
}
if(errors > 0){
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
if(data58.id !== undefined){
let data61 = data58.id;
if(typeof data61 !== "string"){
const err214 = {instancePath:instancePath+"/models/tools/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data61};
if(vErrors === null){
vErrors = [err214];
}
else {
vErrors.push(err214);
}
errors++;
}
if(errors > 0){
const emErrs65 = [];
for(const err215 of vErrors){
if(!err215.emUsed){
emErrs65.push(err215);
}
}
vErrors = emErrs65;
errors = emErrs65.length;
}
}
}
else {
const err216 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data58};
if(vErrors === null){
vErrors = [err216];
}
else {
vErrors.push(err216);
}
errors++;
}
if(errors > 0){
const emErrors12 = {"required":{"type":[],"name":[],"id":[]}};
const templates12 = {required:{}};
let emPropParams11;
let emParamsErrors11;
for(const err217 of vErrors){
if((((((err217.keyword !== "errorMessage") && (!err217.emUsed)) && (err217.instancePath === instancePath+"/models/tools/model/provider")) && (err217.keyword in emErrors12)) && (err217.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err217.schemaPath.slice(39)))){
emPropParams11 = obj0[err217.keyword];
emParamsErrors11 = emErrors12[err217.keyword][err217.params[emPropParams11]];
if(emParamsErrors11){
emParamsErrors11.push(err217);
err217.emUsed = true;
}
}
}
for(const key15 in emErrors12){
for(const keyProp11 in emErrors12[key15]){
emParamsErrors11 = emErrors12[key15][keyProp11];
if(emParamsErrors11.length){
const tmpl11 = templates12[key15] && templates12[key15][keyProp11];
const err218 = {instancePath:instancePath+"/models/tools/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors11},message:tmpl11 ? tmpl11() : schema28.properties.provider.errorMessage[key15][keyProp11],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data58};
if(vErrors === null){
vErrors = [err218];
}
else {
vErrors.push(err218);
}
errors++;
}
}
}
const emErrs66 = [];
for(const err219 of vErrors){
if(!err219.emUsed){
emErrs66.push(err219);
}
}
vErrors = emErrs66;
errors = emErrs66.length;
}
}
}
else {
const err220 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data55};
if(vErrors === null){
vErrors = [err220];
}
else {
vErrors.push(err220);
}
errors++;
}
if(errors > 0){
const emErrors13 = {"required":{"id":[],"name":[],"provider":[]}};
const templates13 = {required:{}};
let emPropParams12;
let emParamsErrors12;
for(const err221 of vErrors){
if((((((err221.keyword !== "errorMessage") && (!err221.emUsed)) && (err221.instancePath === instancePath+"/models/tools/model")) && (err221.keyword in emErrors13)) && (err221.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err221.schemaPath.slice(19)))){
emPropParams12 = obj0[err221.keyword];
emParamsErrors12 = emErrors13[err221.keyword][err221.params[emPropParams12]];
if(emParamsErrors12){
emParamsErrors12.push(err221);
err221.emUsed = true;
}
}
}
for(const key16 in emErrors13){
for(const keyProp12 in emErrors13[key16]){
emParamsErrors12 = emErrors13[key16][keyProp12];
if(emParamsErrors12.length){
const tmpl12 = templates13[key16] && templates13[key16][keyProp12];
const err222 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors12},message:tmpl12 ? tmpl12() : schema28.errorMessage[key16][keyProp12],schema:schema28.errorMessage,parentSchema:schema28,data:data55};
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
const emErrs67 = [];
for(const err223 of vErrors){
if(!err223.emUsed){
emErrs67.push(err223);
}
}
vErrors = emErrs67;
errors = emErrs67.length;
}
if(errors > 0){
const emErrors14 = {"required":{"id":[],"name":[],"provider":[]}};
const templates14 = {required:{}};
let emPropParams13;
let emParamsErrors13;
for(const err224 of vErrors){
if((((((err224.keyword !== "errorMessage") && (!err224.emUsed)) && (err224.instancePath === instancePath+"/models/tools/model")) && (err224.keyword in emErrors14)) && (err224.schemaPath.indexOf("#/properties/models/properties/tools/properties/model") === 0)) && (/^\/[^\/]*$/.test(err224.schemaPath.slice(53)))){
emPropParams13 = obj0[err224.keyword];
emParamsErrors13 = emErrors14[err224.keyword][err224.params[emPropParams13]];
if(emParamsErrors13){
emParamsErrors13.push(err224);
err224.emUsed = true;
}
}
}
for(const key17 in emErrors14){
for(const keyProp13 in emErrors14[key17]){
emParamsErrors13 = emErrors14[key17][keyProp13];
if(emParamsErrors13.length){
const tmpl13 = templates14[key17] && templates14[key17][keyProp13];
const err225 = {instancePath:instancePath+"/models/tools/model",schemaPath:"#/properties/models/properties/tools/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors13},message:tmpl13 ? tmpl13() : schema27.properties.models.properties.tools.properties.model.errorMessage[key17][keyProp13],schema:schema27.properties.models.properties.tools.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.tools.properties.model,data:data55};
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
const emErrs68 = [];
for(const err226 of vErrors){
if(!err226.emUsed){
emErrs68.push(err226);
}
}
vErrors = emErrs68;
errors = emErrs68.length;
}
}
if(data54.ratio !== undefined){
let data62 = data54.ratio;
if(typeof data62 == "number"){
if(data62 < 0 || isNaN(data62)){
const err227 = {instancePath:instancePath+"/models/tools/ratio",schemaPath:"#/properties/models/properties/tools/properties/ratio/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.tools.properties.ratio,data:data62};
if(vErrors === null){
vErrors = [err227];
}
else {
vErrors.push(err227);
}
errors++;
}
}
else {
const err228 = {instancePath:instancePath+"/models/tools/ratio",schemaPath:"#/properties/models/properties/tools/properties/ratio/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.tools.properties.ratio.type,parentSchema:schema27.properties.models.properties.tools.properties.ratio,data:data62};
if(vErrors === null){
vErrors = [err228];
}
else {
vErrors.push(err228);
}
errors++;
}
if(errors > 0){
const emErrs69 = [];
for(const err229 of vErrors){
if(!err229.emUsed){
emErrs69.push(err229);
}
}
vErrors = emErrs69;
errors = emErrs69.length;
}
}
}
else {
const err230 = {instancePath:instancePath+"/models/tools",schemaPath:"#/properties/models/properties/tools/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.tools.type,parentSchema:schema27.properties.models.properties.tools,data:data54};
if(vErrors === null){
vErrors = [err230];
}
else {
vErrors.push(err230);
}
errors++;
}
if(errors > 0){
const emErrs70 = [];
for(const err231 of vErrors){
if(!err231.emUsed){
emErrs70.push(err231);
}
}
vErrors = emErrs70;
errors = emErrs70.length;
}
}
if(data44.summarizer !== undefined){
let data63 = data44.summarizer;
if(data63 && typeof data63 == "object" && !Array.isArray(data63)){
if(data63.model !== undefined){
let data64 = data63.model;
if(data64 && typeof data64 == "object" && !Array.isArray(data64)){
if(data64.id === undefined){
const err232 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data64};
if(vErrors === null){
vErrors = [err232];
}
else {
vErrors.push(err232);
}
errors++;
}
if(data64.name === undefined){
const err233 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data64};
if(vErrors === null){
vErrors = [err233];
}
else {
vErrors.push(err233);
}
errors++;
}
if(data64.provider === undefined){
const err234 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data64};
if(vErrors === null){
vErrors = [err234];
}
else {
vErrors.push(err234);
}
errors++;
}
if(data64.id !== undefined){
let data65 = data64.id;
if(typeof data65 !== "string"){
const err235 = {instancePath:instancePath+"/models/summarizer/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data65};
if(vErrors === null){
vErrors = [err235];
}
else {
vErrors.push(err235);
}
errors++;
}
if(errors > 0){
const emErrs71 = [];
for(const err236 of vErrors){
if(!err236.emUsed){
emErrs71.push(err236);
}
}
vErrors = emErrs71;
errors = emErrs71.length;
}
}
if(data64.name !== undefined){
let data66 = data64.name;
if(typeof data66 !== "string"){
const err237 = {instancePath:instancePath+"/models/summarizer/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data66};
if(vErrors === null){
vErrors = [err237];
}
else {
vErrors.push(err237);
}
errors++;
}
if(errors > 0){
const emErrs72 = [];
for(const err238 of vErrors){
if(!err238.emUsed){
emErrs72.push(err238);
}
}
vErrors = emErrs72;
errors = emErrs72.length;
}
}
if(data64.provider !== undefined){
let data67 = data64.provider;
if(data67 && typeof data67 == "object" && !Array.isArray(data67)){
if(data67.type === undefined){
const err239 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data67};
if(vErrors === null){
vErrors = [err239];
}
else {
vErrors.push(err239);
}
errors++;
}
if(data67.name === undefined){
const err240 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data67};
if(vErrors === null){
vErrors = [err240];
}
else {
vErrors.push(err240);
}
errors++;
}
if(data67.id === undefined){
const err241 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data67};
if(vErrors === null){
vErrors = [err241];
}
else {
vErrors.push(err241);
}
errors++;
}
if(data67.type !== undefined){
let data68 = data67.type;
if(typeof data68 !== "string"){
const err242 = {instancePath:instancePath+"/models/summarizer/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data68};
if(vErrors === null){
vErrors = [err242];
}
else {
vErrors.push(err242);
}
errors++;
}
if(errors > 0){
const emErrs73 = [];
for(const err243 of vErrors){
if(!err243.emUsed){
emErrs73.push(err243);
}
}
vErrors = emErrs73;
errors = emErrs73.length;
}
}
if(data67.name !== undefined){
let data69 = data67.name;
if(typeof data69 !== "string"){
const err244 = {instancePath:instancePath+"/models/summarizer/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data69};
if(vErrors === null){
vErrors = [err244];
}
else {
vErrors.push(err244);
}
errors++;
}
if(errors > 0){
const emErrs74 = [];
for(const err245 of vErrors){
if(!err245.emUsed){
emErrs74.push(err245);
}
}
vErrors = emErrs74;
errors = emErrs74.length;
}
}
if(data67.id !== undefined){
let data70 = data67.id;
if(typeof data70 !== "string"){
const err246 = {instancePath:instancePath+"/models/summarizer/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data70};
if(vErrors === null){
vErrors = [err246];
}
else {
vErrors.push(err246);
}
errors++;
}
if(errors > 0){
const emErrs75 = [];
for(const err247 of vErrors){
if(!err247.emUsed){
emErrs75.push(err247);
}
}
vErrors = emErrs75;
errors = emErrs75.length;
}
}
}
else {
const err248 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data67};
if(vErrors === null){
vErrors = [err248];
}
else {
vErrors.push(err248);
}
errors++;
}
if(errors > 0){
const emErrors15 = {"required":{"type":[],"name":[],"id":[]}};
const templates15 = {required:{}};
let emPropParams14;
let emParamsErrors14;
for(const err249 of vErrors){
if((((((err249.keyword !== "errorMessage") && (!err249.emUsed)) && (err249.instancePath === instancePath+"/models/summarizer/model/provider")) && (err249.keyword in emErrors15)) && (err249.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err249.schemaPath.slice(39)))){
emPropParams14 = obj0[err249.keyword];
emParamsErrors14 = emErrors15[err249.keyword][err249.params[emPropParams14]];
if(emParamsErrors14){
emParamsErrors14.push(err249);
err249.emUsed = true;
}
}
}
for(const key18 in emErrors15){
for(const keyProp14 in emErrors15[key18]){
emParamsErrors14 = emErrors15[key18][keyProp14];
if(emParamsErrors14.length){
const tmpl14 = templates15[key18] && templates15[key18][keyProp14];
const err250 = {instancePath:instancePath+"/models/summarizer/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors14},message:tmpl14 ? tmpl14() : schema28.properties.provider.errorMessage[key18][keyProp14],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data67};
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
const emErrs76 = [];
for(const err251 of vErrors){
if(!err251.emUsed){
emErrs76.push(err251);
}
}
vErrors = emErrs76;
errors = emErrs76.length;
}
}
}
else {
const err252 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data64};
if(vErrors === null){
vErrors = [err252];
}
else {
vErrors.push(err252);
}
errors++;
}
if(errors > 0){
const emErrors16 = {"required":{"id":[],"name":[],"provider":[]}};
const templates16 = {required:{}};
let emPropParams15;
let emParamsErrors15;
for(const err253 of vErrors){
if((((((err253.keyword !== "errorMessage") && (!err253.emUsed)) && (err253.instancePath === instancePath+"/models/summarizer/model")) && (err253.keyword in emErrors16)) && (err253.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err253.schemaPath.slice(19)))){
emPropParams15 = obj0[err253.keyword];
emParamsErrors15 = emErrors16[err253.keyword][err253.params[emPropParams15]];
if(emParamsErrors15){
emParamsErrors15.push(err253);
err253.emUsed = true;
}
}
}
for(const key19 in emErrors16){
for(const keyProp15 in emErrors16[key19]){
emParamsErrors15 = emErrors16[key19][keyProp15];
if(emParamsErrors15.length){
const tmpl15 = templates16[key19] && templates16[key19][keyProp15];
const err254 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors15},message:tmpl15 ? tmpl15() : schema28.errorMessage[key19][keyProp15],schema:schema28.errorMessage,parentSchema:schema28,data:data64};
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
const emErrs77 = [];
for(const err255 of vErrors){
if(!err255.emUsed){
emErrs77.push(err255);
}
}
vErrors = emErrs77;
errors = emErrs77.length;
}
if(errors > 0){
const emErrors17 = {"required":{"id":[],"name":[],"provider":[]}};
const templates17 = {required:{}};
let emPropParams16;
let emParamsErrors16;
for(const err256 of vErrors){
if((((((err256.keyword !== "errorMessage") && (!err256.emUsed)) && (err256.instancePath === instancePath+"/models/summarizer/model")) && (err256.keyword in emErrors17)) && (err256.schemaPath.indexOf("#/properties/models/properties/summarizer/properties/model") === 0)) && (/^\/[^\/]*$/.test(err256.schemaPath.slice(58)))){
emPropParams16 = obj0[err256.keyword];
emParamsErrors16 = emErrors17[err256.keyword][err256.params[emPropParams16]];
if(emParamsErrors16){
emParamsErrors16.push(err256);
err256.emUsed = true;
}
}
}
for(const key20 in emErrors17){
for(const keyProp16 in emErrors17[key20]){
emParamsErrors16 = emErrors17[key20][keyProp16];
if(emParamsErrors16.length){
const tmpl16 = templates17[key20] && templates17[key20][keyProp16];
const err257 = {instancePath:instancePath+"/models/summarizer/model",schemaPath:"#/properties/models/properties/summarizer/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors16},message:tmpl16 ? tmpl16() : schema27.properties.models.properties.summarizer.properties.model.errorMessage[key20][keyProp16],schema:schema27.properties.models.properties.summarizer.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.summarizer.properties.model,data:data64};
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
const emErrs78 = [];
for(const err258 of vErrors){
if(!err258.emUsed){
emErrs78.push(err258);
}
}
vErrors = emErrs78;
errors = emErrs78.length;
}
}
if(data63.ratio !== undefined){
let data71 = data63.ratio;
if(typeof data71 == "number"){
if(data71 < 0 || isNaN(data71)){
const err259 = {instancePath:instancePath+"/models/summarizer/ratio",schemaPath:"#/properties/models/properties/summarizer/properties/ratio/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.summarizer.properties.ratio,data:data71};
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
const err260 = {instancePath:instancePath+"/models/summarizer/ratio",schemaPath:"#/properties/models/properties/summarizer/properties/ratio/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.summarizer.properties.ratio.type,parentSchema:schema27.properties.models.properties.summarizer.properties.ratio,data:data71};
if(vErrors === null){
vErrors = [err260];
}
else {
vErrors.push(err260);
}
errors++;
}
if(errors > 0){
const emErrs79 = [];
for(const err261 of vErrors){
if(!err261.emUsed){
emErrs79.push(err261);
}
}
vErrors = emErrs79;
errors = emErrs79.length;
}
}
}
else {
const err262 = {instancePath:instancePath+"/models/summarizer",schemaPath:"#/properties/models/properties/summarizer/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.summarizer.type,parentSchema:schema27.properties.models.properties.summarizer,data:data63};
if(vErrors === null){
vErrors = [err262];
}
else {
vErrors.push(err262);
}
errors++;
}
if(errors > 0){
const emErrs80 = [];
for(const err263 of vErrors){
if(!err263.emUsed){
emErrs80.push(err263);
}
}
vErrors = emErrs80;
errors = emErrs80.length;
}
}
if(data44.evaluator !== undefined){
let data72 = data44.evaluator;
if(data72 && typeof data72 == "object" && !Array.isArray(data72)){
if(data72.model !== undefined){
let data73 = data72.model;
if(data73 && typeof data73 == "object" && !Array.isArray(data73)){
if(data73.id === undefined){
const err264 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data:data73};
if(vErrors === null){
vErrors = [err264];
}
else {
vErrors.push(err264);
}
errors++;
}
if(data73.name === undefined){
const err265 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.required,parentSchema:schema28,data:data73};
if(vErrors === null){
vErrors = [err265];
}
else {
vErrors.push(err265);
}
errors++;
}
if(data73.provider === undefined){
const err266 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'",schema:schema28.required,parentSchema:schema28,data:data73};
if(vErrors === null){
vErrors = [err266];
}
else {
vErrors.push(err266);
}
errors++;
}
if(data73.id !== undefined){
let data74 = data73.id;
if(typeof data74 !== "string"){
const err267 = {instancePath:instancePath+"/models/evaluator/model/id",schemaPath:"#/definitions/Model/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data74};
if(vErrors === null){
vErrors = [err267];
}
else {
vErrors.push(err267);
}
errors++;
}
if(errors > 0){
const emErrs81 = [];
for(const err268 of vErrors){
if(!err268.emUsed){
emErrs81.push(err268);
}
}
vErrors = emErrs81;
errors = emErrs81.length;
}
}
if(data73.name !== undefined){
let data75 = data73.name;
if(typeof data75 !== "string"){
const err269 = {instancePath:instancePath+"/models/evaluator/model/name",schemaPath:"#/definitions/Model/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.name.type,parentSchema:schema28.properties.name,data:data75};
if(vErrors === null){
vErrors = [err269];
}
else {
vErrors.push(err269);
}
errors++;
}
if(errors > 0){
const emErrs82 = [];
for(const err270 of vErrors){
if(!err270.emUsed){
emErrs82.push(err270);
}
}
vErrors = emErrs82;
errors = emErrs82.length;
}
}
if(data73.provider !== undefined){
let data76 = data73.provider;
if(data76 && typeof data76 == "object" && !Array.isArray(data76)){
if(data76.type === undefined){
const err271 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data76};
if(vErrors === null){
vErrors = [err271];
}
else {
vErrors.push(err271);
}
errors++;
}
if(data76.name === undefined){
const err272 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data76};
if(vErrors === null){
vErrors = [err272];
}
else {
vErrors.push(err272);
}
errors++;
}
if(data76.id === undefined){
const err273 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.properties.provider.required,parentSchema:schema28.properties.provider,data:data76};
if(vErrors === null){
vErrors = [err273];
}
else {
vErrors.push(err273);
}
errors++;
}
if(data76.type !== undefined){
let data77 = data76.type;
if(typeof data77 !== "string"){
const err274 = {instancePath:instancePath+"/models/evaluator/model/provider/type",schemaPath:"#/definitions/Model/properties/provider/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.type.type,parentSchema:schema28.properties.provider.properties.type,data:data77};
if(vErrors === null){
vErrors = [err274];
}
else {
vErrors.push(err274);
}
errors++;
}
if(errors > 0){
const emErrs83 = [];
for(const err275 of vErrors){
if(!err275.emUsed){
emErrs83.push(err275);
}
}
vErrors = emErrs83;
errors = emErrs83.length;
}
}
if(data76.name !== undefined){
let data78 = data76.name;
if(typeof data78 !== "string"){
const err276 = {instancePath:instancePath+"/models/evaluator/model/provider/name",schemaPath:"#/definitions/Model/properties/provider/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.name.type,parentSchema:schema28.properties.provider.properties.name,data:data78};
if(vErrors === null){
vErrors = [err276];
}
else {
vErrors.push(err276);
}
errors++;
}
if(errors > 0){
const emErrs84 = [];
for(const err277 of vErrors){
if(!err277.emUsed){
emErrs84.push(err277);
}
}
vErrors = emErrs84;
errors = emErrs84.length;
}
}
if(data76.id !== undefined){
let data79 = data76.id;
if(typeof data79 !== "string"){
const err278 = {instancePath:instancePath+"/models/evaluator/model/provider/id",schemaPath:"#/definitions/Model/properties/provider/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.provider.properties.id.type,parentSchema:schema28.properties.provider.properties.id,data:data79};
if(vErrors === null){
vErrors = [err278];
}
else {
vErrors.push(err278);
}
errors++;
}
if(errors > 0){
const emErrs85 = [];
for(const err279 of vErrors){
if(!err279.emUsed){
emErrs85.push(err279);
}
}
vErrors = emErrs85;
errors = emErrs85.length;
}
}
}
else {
const err280 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.properties.provider.type,parentSchema:schema28.properties.provider,data:data76};
if(vErrors === null){
vErrors = [err280];
}
else {
vErrors.push(err280);
}
errors++;
}
if(errors > 0){
const emErrors18 = {"required":{"type":[],"name":[],"id":[]}};
const templates18 = {required:{}};
let emPropParams17;
let emParamsErrors17;
for(const err281 of vErrors){
if((((((err281.keyword !== "errorMessage") && (!err281.emUsed)) && (err281.instancePath === instancePath+"/models/evaluator/model/provider")) && (err281.keyword in emErrors18)) && (err281.schemaPath.indexOf("#/definitions/Model/properties/provider") === 0)) && (/^\/[^\/]*$/.test(err281.schemaPath.slice(39)))){
emPropParams17 = obj0[err281.keyword];
emParamsErrors17 = emErrors18[err281.keyword][err281.params[emPropParams17]];
if(emParamsErrors17){
emParamsErrors17.push(err281);
err281.emUsed = true;
}
}
}
for(const key21 in emErrors18){
for(const keyProp17 in emErrors18[key21]){
emParamsErrors17 = emErrors18[key21][keyProp17];
if(emParamsErrors17.length){
const tmpl17 = templates18[key21] && templates18[key21][keyProp17];
const err282 = {instancePath:instancePath+"/models/evaluator/model/provider",schemaPath:"#/definitions/Model/properties/provider/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors17},message:tmpl17 ? tmpl17() : schema28.properties.provider.errorMessage[key21][keyProp17],schema:schema28.properties.provider.errorMessage,parentSchema:schema28.properties.provider,data:data76};
if(vErrors === null){
vErrors = [err282];
}
else {
vErrors.push(err282);
}
errors++;
}
}
}
const emErrs86 = [];
for(const err283 of vErrors){
if(!err283.emUsed){
emErrs86.push(err283);
}
}
vErrors = emErrs86;
errors = emErrs86.length;
}
}
}
else {
const err284 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data73};
if(vErrors === null){
vErrors = [err284];
}
else {
vErrors.push(err284);
}
errors++;
}
if(errors > 0){
const emErrors19 = {"required":{"id":[],"name":[],"provider":[]}};
const templates19 = {required:{}};
let emPropParams18;
let emParamsErrors18;
for(const err285 of vErrors){
if((((((err285.keyword !== "errorMessage") && (!err285.emUsed)) && (err285.instancePath === instancePath+"/models/evaluator/model")) && (err285.keyword in emErrors19)) && (err285.schemaPath.indexOf("#/definitions/Model") === 0)) && (/^\/[^\/]*$/.test(err285.schemaPath.slice(19)))){
emPropParams18 = obj0[err285.keyword];
emParamsErrors18 = emErrors19[err285.keyword][err285.params[emPropParams18]];
if(emParamsErrors18){
emParamsErrors18.push(err285);
err285.emUsed = true;
}
}
}
for(const key22 in emErrors19){
for(const keyProp18 in emErrors19[key22]){
emParamsErrors18 = emErrors19[key22][keyProp18];
if(emParamsErrors18.length){
const tmpl18 = templates19[key22] && templates19[key22][keyProp18];
const err286 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/definitions/Model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors18},message:tmpl18 ? tmpl18() : schema28.errorMessage[key22][keyProp18],schema:schema28.errorMessage,parentSchema:schema28,data:data73};
if(vErrors === null){
vErrors = [err286];
}
else {
vErrors.push(err286);
}
errors++;
}
}
}
const emErrs87 = [];
for(const err287 of vErrors){
if(!err287.emUsed){
emErrs87.push(err287);
}
}
vErrors = emErrs87;
errors = emErrs87.length;
}
if(errors > 0){
const emErrors20 = {"required":{"id":[],"name":[],"provider":[]}};
const templates20 = {required:{}};
let emPropParams19;
let emParamsErrors19;
for(const err288 of vErrors){
if((((((err288.keyword !== "errorMessage") && (!err288.emUsed)) && (err288.instancePath === instancePath+"/models/evaluator/model")) && (err288.keyword in emErrors20)) && (err288.schemaPath.indexOf("#/properties/models/properties/evaluator/properties/model") === 0)) && (/^\/[^\/]*$/.test(err288.schemaPath.slice(57)))){
emPropParams19 = obj0[err288.keyword];
emParamsErrors19 = emErrors20[err288.keyword][err288.params[emPropParams19]];
if(emParamsErrors19){
emParamsErrors19.push(err288);
err288.emUsed = true;
}
}
}
for(const key23 in emErrors20){
for(const keyProp19 in emErrors20[key23]){
emParamsErrors19 = emErrors20[key23][keyProp19];
if(emParamsErrors19.length){
const tmpl19 = templates20[key23] && templates20[key23][keyProp19];
const err289 = {instancePath:instancePath+"/models/evaluator/model",schemaPath:"#/properties/models/properties/evaluator/properties/model/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors19},message:tmpl19 ? tmpl19() : schema27.properties.models.properties.evaluator.properties.model.errorMessage[key23][keyProp19],schema:schema27.properties.models.properties.evaluator.properties.model.errorMessage,parentSchema:schema27.properties.models.properties.evaluator.properties.model,data:data73};
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
const emErrs88 = [];
for(const err290 of vErrors){
if(!err290.emUsed){
emErrs88.push(err290);
}
}
vErrors = emErrs88;
errors = emErrs88.length;
}
}
if(data72.ratio !== undefined){
let data80 = data72.ratio;
if(typeof data80 == "number"){
if(data80 < 0 || isNaN(data80)){
const err291 = {instancePath:instancePath+"/models/evaluator/ratio",schemaPath:"#/properties/models/properties/evaluator/properties/ratio/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema27.properties.models.properties.evaluator.properties.ratio,data:data80};
if(vErrors === null){
vErrors = [err291];
}
else {
vErrors.push(err291);
}
errors++;
}
}
else {
const err292 = {instancePath:instancePath+"/models/evaluator/ratio",schemaPath:"#/properties/models/properties/evaluator/properties/ratio/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema27.properties.models.properties.evaluator.properties.ratio.type,parentSchema:schema27.properties.models.properties.evaluator.properties.ratio,data:data80};
if(vErrors === null){
vErrors = [err292];
}
else {
vErrors.push(err292);
}
errors++;
}
if(errors > 0){
const emErrs89 = [];
for(const err293 of vErrors){
if(!err293.emUsed){
emErrs89.push(err293);
}
}
vErrors = emErrs89;
errors = emErrs89.length;
}
}
}
else {
const err294 = {instancePath:instancePath+"/models/evaluator",schemaPath:"#/properties/models/properties/evaluator/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.properties.evaluator.type,parentSchema:schema27.properties.models.properties.evaluator,data:data72};
if(vErrors === null){
vErrors = [err294];
}
else {
vErrors.push(err294);
}
errors++;
}
if(errors > 0){
const emErrs90 = [];
for(const err295 of vErrors){
if(!err295.emUsed){
emErrs90.push(err295);
}
}
vErrors = emErrs90;
errors = emErrs90.length;
}
}
}
else {
const err296 = {instancePath:instancePath+"/models",schemaPath:"#/properties/models/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.models.type,parentSchema:schema27.properties.models,data:data44};
if(vErrors === null){
vErrors = [err296];
}
else {
vErrors.push(err296);
}
errors++;
}
if(errors > 0){
const emErrs91 = [];
for(const err297 of vErrors){
if(!err297.emUsed){
emErrs91.push(err297);
}
}
vErrors = emErrs91;
errors = emErrs91.length;
}
}
if(data.quotas !== undefined){
let data81 = data.quotas;
if(data81 && typeof data81 == "object" && !Array.isArray(data81)){
if(data81.global === undefined){
const err298 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "global"},message:"must have required property '"+"global"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data81};
if(vErrors === null){
vErrors = [err298];
}
else {
vErrors.push(err298);
}
errors++;
}
if(data81.admin === undefined){
const err299 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "admin"},message:"must have required property '"+"admin"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data81};
if(vErrors === null){
vErrors = [err299];
}
else {
vErrors.push(err299);
}
errors++;
}
if(data81.contrib === undefined){
const err300 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "contrib"},message:"must have required property '"+"contrib"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data81};
if(vErrors === null){
vErrors = [err300];
}
else {
vErrors.push(err300);
}
errors++;
}
if(data81.user === undefined){
const err301 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "user"},message:"must have required property '"+"user"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data81};
if(vErrors === null){
vErrors = [err301];
}
else {
vErrors.push(err301);
}
errors++;
}
if(data81.external === undefined){
const err302 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "external"},message:"must have required property '"+"external"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data81};
if(vErrors === null){
vErrors = [err302];
}
else {
vErrors.push(err302);
}
errors++;
}
if(data81.anonymous === undefined){
const err303 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "anonymous"},message:"must have required property '"+"anonymous"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data81};
if(vErrors === null){
vErrors = [err303];
}
else {
vErrors.push(err303);
}
errors++;
}
if(data81.global !== undefined){
let data82 = data81.global;
if(data82 && typeof data82 == "object" && !Array.isArray(data82)){
if(data82.unlimited === undefined){
const err304 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema32.required,parentSchema:schema32,data:data82};
if(vErrors === null){
vErrors = [err304];
}
else {
vErrors.push(err304);
}
errors++;
}
if(data82.dailyTokenLimit === undefined){
const err305 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "dailyTokenLimit"},message:"must have required property '"+"dailyTokenLimit"+"'",schema:schema32.required,parentSchema:schema32,data:data82};
if(vErrors === null){
vErrors = [err305];
}
else {
vErrors.push(err305);
}
errors++;
}
if(data82.monthlyTokenLimit === undefined){
const err306 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyTokenLimit"},message:"must have required property '"+"monthlyTokenLimit"+"'",schema:schema32.required,parentSchema:schema32,data:data82};
if(vErrors === null){
vErrors = [err306];
}
else {
vErrors.push(err306);
}
errors++;
}
if(data82.unlimited !== undefined){
let data83 = data82.unlimited;
if(typeof data83 !== "boolean"){
const err307 = {instancePath:instancePath+"/quotas/global/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema32.properties.unlimited.type,parentSchema:schema32.properties.unlimited,data:data83};
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
if(data82.dailyTokenLimit !== undefined){
let data84 = data82.dailyTokenLimit;
if(!((typeof data84 == "number") && (!(data84 % 1) && !isNaN(data84)))){
const err309 = {instancePath:instancePath+"/quotas/global/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema32.properties.dailyTokenLimit.type,parentSchema:schema32.properties.dailyTokenLimit,data:data84};
if(vErrors === null){
vErrors = [err309];
}
else {
vErrors.push(err309);
}
errors++;
}
if(typeof data84 == "number"){
if(data84 < 0 || isNaN(data84)){
const err310 = {instancePath:instancePath+"/quotas/global/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema32.properties.dailyTokenLimit,data:data84};
if(vErrors === null){
vErrors = [err310];
}
else {
vErrors.push(err310);
}
errors++;
}
}
if(errors > 0){
const emErrs93 = [];
for(const err311 of vErrors){
if(!err311.emUsed){
emErrs93.push(err311);
}
}
vErrors = emErrs93;
errors = emErrs93.length;
}
}
if(data82.monthlyTokenLimit !== undefined){
let data85 = data82.monthlyTokenLimit;
if(!((typeof data85 == "number") && (!(data85 % 1) && !isNaN(data85)))){
const err312 = {instancePath:instancePath+"/quotas/global/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema32.properties.monthlyTokenLimit.type,parentSchema:schema32.properties.monthlyTokenLimit,data:data85};
if(vErrors === null){
vErrors = [err312];
}
else {
vErrors.push(err312);
}
errors++;
}
if(typeof data85 == "number"){
if(data85 < 0 || isNaN(data85)){
const err313 = {instancePath:instancePath+"/quotas/global/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema32.properties.monthlyTokenLimit,data:data85};
if(vErrors === null){
vErrors = [err313];
}
else {
vErrors.push(err313);
}
errors++;
}
}
if(errors > 0){
const emErrs94 = [];
for(const err314 of vErrors){
if(!err314.emUsed){
emErrs94.push(err314);
}
}
vErrors = emErrs94;
errors = emErrs94.length;
}
}
}
else {
const err315 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema32.type,parentSchema:schema32,data:data82};
if(vErrors === null){
vErrors = [err315];
}
else {
vErrors.push(err315);
}
errors++;
}
if(errors > 0){
const emErrors21 = {"required":{"unlimited":[],"dailyTokenLimit":[],"monthlyTokenLimit":[]}};
const templates21 = {required:{}};
let emPropParams20;
let emParamsErrors20;
for(const err316 of vErrors){
if((((((err316.keyword !== "errorMessage") && (!err316.emUsed)) && (err316.instancePath === instancePath+"/quotas/global")) && (err316.keyword in emErrors21)) && (err316.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err316.schemaPath.slice(23)))){
emPropParams20 = obj0[err316.keyword];
emParamsErrors20 = emErrors21[err316.keyword][err316.params[emPropParams20]];
if(emParamsErrors20){
emParamsErrors20.push(err316);
err316.emUsed = true;
}
}
}
for(const key24 in emErrors21){
for(const keyProp20 in emErrors21[key24]){
emParamsErrors20 = emErrors21[key24][keyProp20];
if(emParamsErrors20.length){
const tmpl20 = templates21[key24] && templates21[key24][keyProp20];
const err317 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors20},message:tmpl20 ? tmpl20() : schema32.errorMessage[key24][keyProp20],schema:schema32.errorMessage,parentSchema:schema32,data:data82};
if(vErrors === null){
vErrors = [err317];
}
else {
vErrors.push(err317);
}
errors++;
}
}
}
const emErrs95 = [];
for(const err318 of vErrors){
if(!err318.emUsed){
emErrs95.push(err318);
}
}
vErrors = emErrs95;
errors = emErrs95.length;
}
if(errors > 0){
const emErrors22 = {"required":{"unlimited":[],"dailyTokenLimit":[],"monthlyTokenLimit":[]}};
const templates22 = {required:{}};
let emPropParams21;
let emParamsErrors21;
for(const err319 of vErrors){
if((((((err319.keyword !== "errorMessage") && (!err319.emUsed)) && (err319.instancePath === instancePath+"/quotas/global")) && (err319.keyword in emErrors22)) && (err319.schemaPath.indexOf("#/properties/quotas/properties/global") === 0)) && (/^\/[^\/]*$/.test(err319.schemaPath.slice(37)))){
emPropParams21 = obj0[err319.keyword];
emParamsErrors21 = emErrors22[err319.keyword][err319.params[emPropParams21]];
if(emParamsErrors21){
emParamsErrors21.push(err319);
err319.emUsed = true;
}
}
}
for(const key25 in emErrors22){
for(const keyProp21 in emErrors22[key25]){
emParamsErrors21 = emErrors22[key25][keyProp21];
if(emParamsErrors21.length){
const tmpl21 = templates22[key25] && templates22[key25][keyProp21];
const err320 = {instancePath:instancePath+"/quotas/global",schemaPath:"#/properties/quotas/properties/global/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors21},message:tmpl21 ? tmpl21() : schema27.properties.quotas.properties.global.errorMessage[key25][keyProp21],schema:schema27.properties.quotas.properties.global.errorMessage,parentSchema:schema27.properties.quotas.properties.global,data:data82};
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
if(data81.admin !== undefined){
let data86 = data81.admin;
if(data86 && typeof data86 == "object" && !Array.isArray(data86)){
if(data86.unlimited === undefined){
const err322 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema32.required,parentSchema:schema32,data:data86};
if(vErrors === null){
vErrors = [err322];
}
else {
vErrors.push(err322);
}
errors++;
}
if(data86.dailyTokenLimit === undefined){
const err323 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "dailyTokenLimit"},message:"must have required property '"+"dailyTokenLimit"+"'",schema:schema32.required,parentSchema:schema32,data:data86};
if(vErrors === null){
vErrors = [err323];
}
else {
vErrors.push(err323);
}
errors++;
}
if(data86.monthlyTokenLimit === undefined){
const err324 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyTokenLimit"},message:"must have required property '"+"monthlyTokenLimit"+"'",schema:schema32.required,parentSchema:schema32,data:data86};
if(vErrors === null){
vErrors = [err324];
}
else {
vErrors.push(err324);
}
errors++;
}
if(data86.unlimited !== undefined){
let data87 = data86.unlimited;
if(typeof data87 !== "boolean"){
const err325 = {instancePath:instancePath+"/quotas/admin/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema32.properties.unlimited.type,parentSchema:schema32.properties.unlimited,data:data87};
if(vErrors === null){
vErrors = [err325];
}
else {
vErrors.push(err325);
}
errors++;
}
if(errors > 0){
const emErrs97 = [];
for(const err326 of vErrors){
if(!err326.emUsed){
emErrs97.push(err326);
}
}
vErrors = emErrs97;
errors = emErrs97.length;
}
}
if(data86.dailyTokenLimit !== undefined){
let data88 = data86.dailyTokenLimit;
if(!((typeof data88 == "number") && (!(data88 % 1) && !isNaN(data88)))){
const err327 = {instancePath:instancePath+"/quotas/admin/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema32.properties.dailyTokenLimit.type,parentSchema:schema32.properties.dailyTokenLimit,data:data88};
if(vErrors === null){
vErrors = [err327];
}
else {
vErrors.push(err327);
}
errors++;
}
if(typeof data88 == "number"){
if(data88 < 0 || isNaN(data88)){
const err328 = {instancePath:instancePath+"/quotas/admin/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema32.properties.dailyTokenLimit,data:data88};
if(vErrors === null){
vErrors = [err328];
}
else {
vErrors.push(err328);
}
errors++;
}
}
if(errors > 0){
const emErrs98 = [];
for(const err329 of vErrors){
if(!err329.emUsed){
emErrs98.push(err329);
}
}
vErrors = emErrs98;
errors = emErrs98.length;
}
}
if(data86.monthlyTokenLimit !== undefined){
let data89 = data86.monthlyTokenLimit;
if(!((typeof data89 == "number") && (!(data89 % 1) && !isNaN(data89)))){
const err330 = {instancePath:instancePath+"/quotas/admin/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema32.properties.monthlyTokenLimit.type,parentSchema:schema32.properties.monthlyTokenLimit,data:data89};
if(vErrors === null){
vErrors = [err330];
}
else {
vErrors.push(err330);
}
errors++;
}
if(typeof data89 == "number"){
if(data89 < 0 || isNaN(data89)){
const err331 = {instancePath:instancePath+"/quotas/admin/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema32.properties.monthlyTokenLimit,data:data89};
if(vErrors === null){
vErrors = [err331];
}
else {
vErrors.push(err331);
}
errors++;
}
}
if(errors > 0){
const emErrs99 = [];
for(const err332 of vErrors){
if(!err332.emUsed){
emErrs99.push(err332);
}
}
vErrors = emErrs99;
errors = emErrs99.length;
}
}
}
else {
const err333 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema32.type,parentSchema:schema32,data:data86};
if(vErrors === null){
vErrors = [err333];
}
else {
vErrors.push(err333);
}
errors++;
}
if(errors > 0){
const emErrors23 = {"required":{"unlimited":[],"dailyTokenLimit":[],"monthlyTokenLimit":[]}};
const templates23 = {required:{}};
let emPropParams22;
let emParamsErrors22;
for(const err334 of vErrors){
if((((((err334.keyword !== "errorMessage") && (!err334.emUsed)) && (err334.instancePath === instancePath+"/quotas/admin")) && (err334.keyword in emErrors23)) && (err334.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err334.schemaPath.slice(23)))){
emPropParams22 = obj0[err334.keyword];
emParamsErrors22 = emErrors23[err334.keyword][err334.params[emPropParams22]];
if(emParamsErrors22){
emParamsErrors22.push(err334);
err334.emUsed = true;
}
}
}
for(const key26 in emErrors23){
for(const keyProp22 in emErrors23[key26]){
emParamsErrors22 = emErrors23[key26][keyProp22];
if(emParamsErrors22.length){
const tmpl22 = templates23[key26] && templates23[key26][keyProp22];
const err335 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors22},message:tmpl22 ? tmpl22() : schema32.errorMessage[key26][keyProp22],schema:schema32.errorMessage,parentSchema:schema32,data:data86};
if(vErrors === null){
vErrors = [err335];
}
else {
vErrors.push(err335);
}
errors++;
}
}
}
const emErrs100 = [];
for(const err336 of vErrors){
if(!err336.emUsed){
emErrs100.push(err336);
}
}
vErrors = emErrs100;
errors = emErrs100.length;
}
if(errors > 0){
const emErrors24 = {"required":{"unlimited":[],"dailyTokenLimit":[],"monthlyTokenLimit":[]}};
const templates24 = {required:{}};
let emPropParams23;
let emParamsErrors23;
for(const err337 of vErrors){
if((((((err337.keyword !== "errorMessage") && (!err337.emUsed)) && (err337.instancePath === instancePath+"/quotas/admin")) && (err337.keyword in emErrors24)) && (err337.schemaPath.indexOf("#/properties/quotas/properties/admin") === 0)) && (/^\/[^\/]*$/.test(err337.schemaPath.slice(36)))){
emPropParams23 = obj0[err337.keyword];
emParamsErrors23 = emErrors24[err337.keyword][err337.params[emPropParams23]];
if(emParamsErrors23){
emParamsErrors23.push(err337);
err337.emUsed = true;
}
}
}
for(const key27 in emErrors24){
for(const keyProp23 in emErrors24[key27]){
emParamsErrors23 = emErrors24[key27][keyProp23];
if(emParamsErrors23.length){
const tmpl23 = templates24[key27] && templates24[key27][keyProp23];
const err338 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/properties/quotas/properties/admin/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors23},message:tmpl23 ? tmpl23() : schema27.properties.quotas.properties.admin.errorMessage[key27][keyProp23],schema:schema27.properties.quotas.properties.admin.errorMessage,parentSchema:schema27.properties.quotas.properties.admin,data:data86};
if(vErrors === null){
vErrors = [err338];
}
else {
vErrors.push(err338);
}
errors++;
}
}
}
const emErrs101 = [];
for(const err339 of vErrors){
if(!err339.emUsed){
emErrs101.push(err339);
}
}
vErrors = emErrs101;
errors = emErrs101.length;
}
}
if(data81.contrib !== undefined){
let data90 = data81.contrib;
if(data90 && typeof data90 == "object" && !Array.isArray(data90)){
if(data90.unlimited === undefined){
const err340 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema32.required,parentSchema:schema32,data:data90};
if(vErrors === null){
vErrors = [err340];
}
else {
vErrors.push(err340);
}
errors++;
}
if(data90.dailyTokenLimit === undefined){
const err341 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "dailyTokenLimit"},message:"must have required property '"+"dailyTokenLimit"+"'",schema:schema32.required,parentSchema:schema32,data:data90};
if(vErrors === null){
vErrors = [err341];
}
else {
vErrors.push(err341);
}
errors++;
}
if(data90.monthlyTokenLimit === undefined){
const err342 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyTokenLimit"},message:"must have required property '"+"monthlyTokenLimit"+"'",schema:schema32.required,parentSchema:schema32,data:data90};
if(vErrors === null){
vErrors = [err342];
}
else {
vErrors.push(err342);
}
errors++;
}
if(data90.unlimited !== undefined){
let data91 = data90.unlimited;
if(typeof data91 !== "boolean"){
const err343 = {instancePath:instancePath+"/quotas/contrib/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema32.properties.unlimited.type,parentSchema:schema32.properties.unlimited,data:data91};
if(vErrors === null){
vErrors = [err343];
}
else {
vErrors.push(err343);
}
errors++;
}
if(errors > 0){
const emErrs102 = [];
for(const err344 of vErrors){
if(!err344.emUsed){
emErrs102.push(err344);
}
}
vErrors = emErrs102;
errors = emErrs102.length;
}
}
if(data90.dailyTokenLimit !== undefined){
let data92 = data90.dailyTokenLimit;
if(!((typeof data92 == "number") && (!(data92 % 1) && !isNaN(data92)))){
const err345 = {instancePath:instancePath+"/quotas/contrib/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema32.properties.dailyTokenLimit.type,parentSchema:schema32.properties.dailyTokenLimit,data:data92};
if(vErrors === null){
vErrors = [err345];
}
else {
vErrors.push(err345);
}
errors++;
}
if(typeof data92 == "number"){
if(data92 < 0 || isNaN(data92)){
const err346 = {instancePath:instancePath+"/quotas/contrib/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema32.properties.dailyTokenLimit,data:data92};
if(vErrors === null){
vErrors = [err346];
}
else {
vErrors.push(err346);
}
errors++;
}
}
if(errors > 0){
const emErrs103 = [];
for(const err347 of vErrors){
if(!err347.emUsed){
emErrs103.push(err347);
}
}
vErrors = emErrs103;
errors = emErrs103.length;
}
}
if(data90.monthlyTokenLimit !== undefined){
let data93 = data90.monthlyTokenLimit;
if(!((typeof data93 == "number") && (!(data93 % 1) && !isNaN(data93)))){
const err348 = {instancePath:instancePath+"/quotas/contrib/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema32.properties.monthlyTokenLimit.type,parentSchema:schema32.properties.monthlyTokenLimit,data:data93};
if(vErrors === null){
vErrors = [err348];
}
else {
vErrors.push(err348);
}
errors++;
}
if(typeof data93 == "number"){
if(data93 < 0 || isNaN(data93)){
const err349 = {instancePath:instancePath+"/quotas/contrib/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema32.properties.monthlyTokenLimit,data:data93};
if(vErrors === null){
vErrors = [err349];
}
else {
vErrors.push(err349);
}
errors++;
}
}
if(errors > 0){
const emErrs104 = [];
for(const err350 of vErrors){
if(!err350.emUsed){
emErrs104.push(err350);
}
}
vErrors = emErrs104;
errors = emErrs104.length;
}
}
}
else {
const err351 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema32.type,parentSchema:schema32,data:data90};
if(vErrors === null){
vErrors = [err351];
}
else {
vErrors.push(err351);
}
errors++;
}
if(errors > 0){
const emErrors25 = {"required":{"unlimited":[],"dailyTokenLimit":[],"monthlyTokenLimit":[]}};
const templates25 = {required:{}};
let emPropParams24;
let emParamsErrors24;
for(const err352 of vErrors){
if((((((err352.keyword !== "errorMessage") && (!err352.emUsed)) && (err352.instancePath === instancePath+"/quotas/contrib")) && (err352.keyword in emErrors25)) && (err352.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err352.schemaPath.slice(23)))){
emPropParams24 = obj0[err352.keyword];
emParamsErrors24 = emErrors25[err352.keyword][err352.params[emPropParams24]];
if(emParamsErrors24){
emParamsErrors24.push(err352);
err352.emUsed = true;
}
}
}
for(const key28 in emErrors25){
for(const keyProp24 in emErrors25[key28]){
emParamsErrors24 = emErrors25[key28][keyProp24];
if(emParamsErrors24.length){
const tmpl24 = templates25[key28] && templates25[key28][keyProp24];
const err353 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors24},message:tmpl24 ? tmpl24() : schema32.errorMessage[key28][keyProp24],schema:schema32.errorMessage,parentSchema:schema32,data:data90};
if(vErrors === null){
vErrors = [err353];
}
else {
vErrors.push(err353);
}
errors++;
}
}
}
const emErrs105 = [];
for(const err354 of vErrors){
if(!err354.emUsed){
emErrs105.push(err354);
}
}
vErrors = emErrs105;
errors = emErrs105.length;
}
if(errors > 0){
const emErrors26 = {"required":{"unlimited":[],"dailyTokenLimit":[],"monthlyTokenLimit":[]}};
const templates26 = {required:{}};
let emPropParams25;
let emParamsErrors25;
for(const err355 of vErrors){
if((((((err355.keyword !== "errorMessage") && (!err355.emUsed)) && (err355.instancePath === instancePath+"/quotas/contrib")) && (err355.keyword in emErrors26)) && (err355.schemaPath.indexOf("#/properties/quotas/properties/contrib") === 0)) && (/^\/[^\/]*$/.test(err355.schemaPath.slice(38)))){
emPropParams25 = obj0[err355.keyword];
emParamsErrors25 = emErrors26[err355.keyword][err355.params[emPropParams25]];
if(emParamsErrors25){
emParamsErrors25.push(err355);
err355.emUsed = true;
}
}
}
for(const key29 in emErrors26){
for(const keyProp25 in emErrors26[key29]){
emParamsErrors25 = emErrors26[key29][keyProp25];
if(emParamsErrors25.length){
const tmpl25 = templates26[key29] && templates26[key29][keyProp25];
const err356 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/properties/quotas/properties/contrib/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors25},message:tmpl25 ? tmpl25() : schema27.properties.quotas.properties.contrib.errorMessage[key29][keyProp25],schema:schema27.properties.quotas.properties.contrib.errorMessage,parentSchema:schema27.properties.quotas.properties.contrib,data:data90};
if(vErrors === null){
vErrors = [err356];
}
else {
vErrors.push(err356);
}
errors++;
}
}
}
const emErrs106 = [];
for(const err357 of vErrors){
if(!err357.emUsed){
emErrs106.push(err357);
}
}
vErrors = emErrs106;
errors = emErrs106.length;
}
}
if(data81.user !== undefined){
let data94 = data81.user;
if(data94 && typeof data94 == "object" && !Array.isArray(data94)){
if(data94.unlimited === undefined){
const err358 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema32.required,parentSchema:schema32,data:data94};
if(vErrors === null){
vErrors = [err358];
}
else {
vErrors.push(err358);
}
errors++;
}
if(data94.dailyTokenLimit === undefined){
const err359 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "dailyTokenLimit"},message:"must have required property '"+"dailyTokenLimit"+"'",schema:schema32.required,parentSchema:schema32,data:data94};
if(vErrors === null){
vErrors = [err359];
}
else {
vErrors.push(err359);
}
errors++;
}
if(data94.monthlyTokenLimit === undefined){
const err360 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyTokenLimit"},message:"must have required property '"+"monthlyTokenLimit"+"'",schema:schema32.required,parentSchema:schema32,data:data94};
if(vErrors === null){
vErrors = [err360];
}
else {
vErrors.push(err360);
}
errors++;
}
if(data94.unlimited !== undefined){
let data95 = data94.unlimited;
if(typeof data95 !== "boolean"){
const err361 = {instancePath:instancePath+"/quotas/user/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema32.properties.unlimited.type,parentSchema:schema32.properties.unlimited,data:data95};
if(vErrors === null){
vErrors = [err361];
}
else {
vErrors.push(err361);
}
errors++;
}
if(errors > 0){
const emErrs107 = [];
for(const err362 of vErrors){
if(!err362.emUsed){
emErrs107.push(err362);
}
}
vErrors = emErrs107;
errors = emErrs107.length;
}
}
if(data94.dailyTokenLimit !== undefined){
let data96 = data94.dailyTokenLimit;
if(!((typeof data96 == "number") && (!(data96 % 1) && !isNaN(data96)))){
const err363 = {instancePath:instancePath+"/quotas/user/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema32.properties.dailyTokenLimit.type,parentSchema:schema32.properties.dailyTokenLimit,data:data96};
if(vErrors === null){
vErrors = [err363];
}
else {
vErrors.push(err363);
}
errors++;
}
if(typeof data96 == "number"){
if(data96 < 0 || isNaN(data96)){
const err364 = {instancePath:instancePath+"/quotas/user/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema32.properties.dailyTokenLimit,data:data96};
if(vErrors === null){
vErrors = [err364];
}
else {
vErrors.push(err364);
}
errors++;
}
}
if(errors > 0){
const emErrs108 = [];
for(const err365 of vErrors){
if(!err365.emUsed){
emErrs108.push(err365);
}
}
vErrors = emErrs108;
errors = emErrs108.length;
}
}
if(data94.monthlyTokenLimit !== undefined){
let data97 = data94.monthlyTokenLimit;
if(!((typeof data97 == "number") && (!(data97 % 1) && !isNaN(data97)))){
const err366 = {instancePath:instancePath+"/quotas/user/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema32.properties.monthlyTokenLimit.type,parentSchema:schema32.properties.monthlyTokenLimit,data:data97};
if(vErrors === null){
vErrors = [err366];
}
else {
vErrors.push(err366);
}
errors++;
}
if(typeof data97 == "number"){
if(data97 < 0 || isNaN(data97)){
const err367 = {instancePath:instancePath+"/quotas/user/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema32.properties.monthlyTokenLimit,data:data97};
if(vErrors === null){
vErrors = [err367];
}
else {
vErrors.push(err367);
}
errors++;
}
}
if(errors > 0){
const emErrs109 = [];
for(const err368 of vErrors){
if(!err368.emUsed){
emErrs109.push(err368);
}
}
vErrors = emErrs109;
errors = emErrs109.length;
}
}
}
else {
const err369 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema32.type,parentSchema:schema32,data:data94};
if(vErrors === null){
vErrors = [err369];
}
else {
vErrors.push(err369);
}
errors++;
}
if(errors > 0){
const emErrors27 = {"required":{"unlimited":[],"dailyTokenLimit":[],"monthlyTokenLimit":[]}};
const templates27 = {required:{}};
let emPropParams26;
let emParamsErrors26;
for(const err370 of vErrors){
if((((((err370.keyword !== "errorMessage") && (!err370.emUsed)) && (err370.instancePath === instancePath+"/quotas/user")) && (err370.keyword in emErrors27)) && (err370.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err370.schemaPath.slice(23)))){
emPropParams26 = obj0[err370.keyword];
emParamsErrors26 = emErrors27[err370.keyword][err370.params[emPropParams26]];
if(emParamsErrors26){
emParamsErrors26.push(err370);
err370.emUsed = true;
}
}
}
for(const key30 in emErrors27){
for(const keyProp26 in emErrors27[key30]){
emParamsErrors26 = emErrors27[key30][keyProp26];
if(emParamsErrors26.length){
const tmpl26 = templates27[key30] && templates27[key30][keyProp26];
const err371 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors26},message:tmpl26 ? tmpl26() : schema32.errorMessage[key30][keyProp26],schema:schema32.errorMessage,parentSchema:schema32,data:data94};
if(vErrors === null){
vErrors = [err371];
}
else {
vErrors.push(err371);
}
errors++;
}
}
}
const emErrs110 = [];
for(const err372 of vErrors){
if(!err372.emUsed){
emErrs110.push(err372);
}
}
vErrors = emErrs110;
errors = emErrs110.length;
}
if(errors > 0){
const emErrors28 = {"required":{"unlimited":[],"dailyTokenLimit":[],"monthlyTokenLimit":[]}};
const templates28 = {required:{}};
let emPropParams27;
let emParamsErrors27;
for(const err373 of vErrors){
if((((((err373.keyword !== "errorMessage") && (!err373.emUsed)) && (err373.instancePath === instancePath+"/quotas/user")) && (err373.keyword in emErrors28)) && (err373.schemaPath.indexOf("#/properties/quotas/properties/user") === 0)) && (/^\/[^\/]*$/.test(err373.schemaPath.slice(35)))){
emPropParams27 = obj0[err373.keyword];
emParamsErrors27 = emErrors28[err373.keyword][err373.params[emPropParams27]];
if(emParamsErrors27){
emParamsErrors27.push(err373);
err373.emUsed = true;
}
}
}
for(const key31 in emErrors28){
for(const keyProp27 in emErrors28[key31]){
emParamsErrors27 = emErrors28[key31][keyProp27];
if(emParamsErrors27.length){
const tmpl27 = templates28[key31] && templates28[key31][keyProp27];
const err374 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/properties/quotas/properties/user/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors27},message:tmpl27 ? tmpl27() : schema27.properties.quotas.properties.user.errorMessage[key31][keyProp27],schema:schema27.properties.quotas.properties.user.errorMessage,parentSchema:schema27.properties.quotas.properties.user,data:data94};
if(vErrors === null){
vErrors = [err374];
}
else {
vErrors.push(err374);
}
errors++;
}
}
}
const emErrs111 = [];
for(const err375 of vErrors){
if(!err375.emUsed){
emErrs111.push(err375);
}
}
vErrors = emErrs111;
errors = emErrs111.length;
}
}
if(data81.external !== undefined){
let data98 = data81.external;
if(data98 && typeof data98 == "object" && !Array.isArray(data98)){
if(data98.unlimited === undefined){
const err376 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema32.required,parentSchema:schema32,data:data98};
if(vErrors === null){
vErrors = [err376];
}
else {
vErrors.push(err376);
}
errors++;
}
if(data98.dailyTokenLimit === undefined){
const err377 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "dailyTokenLimit"},message:"must have required property '"+"dailyTokenLimit"+"'",schema:schema32.required,parentSchema:schema32,data:data98};
if(vErrors === null){
vErrors = [err377];
}
else {
vErrors.push(err377);
}
errors++;
}
if(data98.monthlyTokenLimit === undefined){
const err378 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyTokenLimit"},message:"must have required property '"+"monthlyTokenLimit"+"'",schema:schema32.required,parentSchema:schema32,data:data98};
if(vErrors === null){
vErrors = [err378];
}
else {
vErrors.push(err378);
}
errors++;
}
if(data98.unlimited !== undefined){
let data99 = data98.unlimited;
if(typeof data99 !== "boolean"){
const err379 = {instancePath:instancePath+"/quotas/external/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema32.properties.unlimited.type,parentSchema:schema32.properties.unlimited,data:data99};
if(vErrors === null){
vErrors = [err379];
}
else {
vErrors.push(err379);
}
errors++;
}
if(errors > 0){
const emErrs112 = [];
for(const err380 of vErrors){
if(!err380.emUsed){
emErrs112.push(err380);
}
}
vErrors = emErrs112;
errors = emErrs112.length;
}
}
if(data98.dailyTokenLimit !== undefined){
let data100 = data98.dailyTokenLimit;
if(!((typeof data100 == "number") && (!(data100 % 1) && !isNaN(data100)))){
const err381 = {instancePath:instancePath+"/quotas/external/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema32.properties.dailyTokenLimit.type,parentSchema:schema32.properties.dailyTokenLimit,data:data100};
if(vErrors === null){
vErrors = [err381];
}
else {
vErrors.push(err381);
}
errors++;
}
if(typeof data100 == "number"){
if(data100 < 0 || isNaN(data100)){
const err382 = {instancePath:instancePath+"/quotas/external/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema32.properties.dailyTokenLimit,data:data100};
if(vErrors === null){
vErrors = [err382];
}
else {
vErrors.push(err382);
}
errors++;
}
}
if(errors > 0){
const emErrs113 = [];
for(const err383 of vErrors){
if(!err383.emUsed){
emErrs113.push(err383);
}
}
vErrors = emErrs113;
errors = emErrs113.length;
}
}
if(data98.monthlyTokenLimit !== undefined){
let data101 = data98.monthlyTokenLimit;
if(!((typeof data101 == "number") && (!(data101 % 1) && !isNaN(data101)))){
const err384 = {instancePath:instancePath+"/quotas/external/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema32.properties.monthlyTokenLimit.type,parentSchema:schema32.properties.monthlyTokenLimit,data:data101};
if(vErrors === null){
vErrors = [err384];
}
else {
vErrors.push(err384);
}
errors++;
}
if(typeof data101 == "number"){
if(data101 < 0 || isNaN(data101)){
const err385 = {instancePath:instancePath+"/quotas/external/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema32.properties.monthlyTokenLimit,data:data101};
if(vErrors === null){
vErrors = [err385];
}
else {
vErrors.push(err385);
}
errors++;
}
}
if(errors > 0){
const emErrs114 = [];
for(const err386 of vErrors){
if(!err386.emUsed){
emErrs114.push(err386);
}
}
vErrors = emErrs114;
errors = emErrs114.length;
}
}
}
else {
const err387 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema32.type,parentSchema:schema32,data:data98};
if(vErrors === null){
vErrors = [err387];
}
else {
vErrors.push(err387);
}
errors++;
}
if(errors > 0){
const emErrors29 = {"required":{"unlimited":[],"dailyTokenLimit":[],"monthlyTokenLimit":[]}};
const templates29 = {required:{}};
let emPropParams28;
let emParamsErrors28;
for(const err388 of vErrors){
if((((((err388.keyword !== "errorMessage") && (!err388.emUsed)) && (err388.instancePath === instancePath+"/quotas/external")) && (err388.keyword in emErrors29)) && (err388.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err388.schemaPath.slice(23)))){
emPropParams28 = obj0[err388.keyword];
emParamsErrors28 = emErrors29[err388.keyword][err388.params[emPropParams28]];
if(emParamsErrors28){
emParamsErrors28.push(err388);
err388.emUsed = true;
}
}
}
for(const key32 in emErrors29){
for(const keyProp28 in emErrors29[key32]){
emParamsErrors28 = emErrors29[key32][keyProp28];
if(emParamsErrors28.length){
const tmpl28 = templates29[key32] && templates29[key32][keyProp28];
const err389 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors28},message:tmpl28 ? tmpl28() : schema32.errorMessage[key32][keyProp28],schema:schema32.errorMessage,parentSchema:schema32,data:data98};
if(vErrors === null){
vErrors = [err389];
}
else {
vErrors.push(err389);
}
errors++;
}
}
}
const emErrs115 = [];
for(const err390 of vErrors){
if(!err390.emUsed){
emErrs115.push(err390);
}
}
vErrors = emErrs115;
errors = emErrs115.length;
}
if(errors > 0){
const emErrors30 = {"required":{"unlimited":[],"dailyTokenLimit":[],"monthlyTokenLimit":[]}};
const templates30 = {required:{}};
let emPropParams29;
let emParamsErrors29;
for(const err391 of vErrors){
if((((((err391.keyword !== "errorMessage") && (!err391.emUsed)) && (err391.instancePath === instancePath+"/quotas/external")) && (err391.keyword in emErrors30)) && (err391.schemaPath.indexOf("#/properties/quotas/properties/external") === 0)) && (/^\/[^\/]*$/.test(err391.schemaPath.slice(39)))){
emPropParams29 = obj0[err391.keyword];
emParamsErrors29 = emErrors30[err391.keyword][err391.params[emPropParams29]];
if(emParamsErrors29){
emParamsErrors29.push(err391);
err391.emUsed = true;
}
}
}
for(const key33 in emErrors30){
for(const keyProp29 in emErrors30[key33]){
emParamsErrors29 = emErrors30[key33][keyProp29];
if(emParamsErrors29.length){
const tmpl29 = templates30[key33] && templates30[key33][keyProp29];
const err392 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/properties/quotas/properties/external/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors29},message:tmpl29 ? tmpl29() : schema27.properties.quotas.properties.external.errorMessage[key33][keyProp29],schema:schema27.properties.quotas.properties.external.errorMessage,parentSchema:schema27.properties.quotas.properties.external,data:data98};
if(vErrors === null){
vErrors = [err392];
}
else {
vErrors.push(err392);
}
errors++;
}
}
}
const emErrs116 = [];
for(const err393 of vErrors){
if(!err393.emUsed){
emErrs116.push(err393);
}
}
vErrors = emErrs116;
errors = emErrs116.length;
}
}
if(data81.anonymous !== undefined){
let data102 = data81.anonymous;
if(data102 && typeof data102 == "object" && !Array.isArray(data102)){
if(data102.unlimited === undefined){
const err394 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema32.required,parentSchema:schema32,data:data102};
if(vErrors === null){
vErrors = [err394];
}
else {
vErrors.push(err394);
}
errors++;
}
if(data102.dailyTokenLimit === undefined){
const err395 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "dailyTokenLimit"},message:"must have required property '"+"dailyTokenLimit"+"'",schema:schema32.required,parentSchema:schema32,data:data102};
if(vErrors === null){
vErrors = [err395];
}
else {
vErrors.push(err395);
}
errors++;
}
if(data102.monthlyTokenLimit === undefined){
const err396 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyTokenLimit"},message:"must have required property '"+"monthlyTokenLimit"+"'",schema:schema32.required,parentSchema:schema32,data:data102};
if(vErrors === null){
vErrors = [err396];
}
else {
vErrors.push(err396);
}
errors++;
}
if(data102.unlimited !== undefined){
let data103 = data102.unlimited;
if(typeof data103 !== "boolean"){
const err397 = {instancePath:instancePath+"/quotas/anonymous/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema32.properties.unlimited.type,parentSchema:schema32.properties.unlimited,data:data103};
if(vErrors === null){
vErrors = [err397];
}
else {
vErrors.push(err397);
}
errors++;
}
if(errors > 0){
const emErrs117 = [];
for(const err398 of vErrors){
if(!err398.emUsed){
emErrs117.push(err398);
}
}
vErrors = emErrs117;
errors = emErrs117.length;
}
}
if(data102.dailyTokenLimit !== undefined){
let data104 = data102.dailyTokenLimit;
if(!((typeof data104 == "number") && (!(data104 % 1) && !isNaN(data104)))){
const err399 = {instancePath:instancePath+"/quotas/anonymous/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema32.properties.dailyTokenLimit.type,parentSchema:schema32.properties.dailyTokenLimit,data:data104};
if(vErrors === null){
vErrors = [err399];
}
else {
vErrors.push(err399);
}
errors++;
}
if(typeof data104 == "number"){
if(data104 < 0 || isNaN(data104)){
const err400 = {instancePath:instancePath+"/quotas/anonymous/dailyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/dailyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema32.properties.dailyTokenLimit,data:data104};
if(vErrors === null){
vErrors = [err400];
}
else {
vErrors.push(err400);
}
errors++;
}
}
if(errors > 0){
const emErrs118 = [];
for(const err401 of vErrors){
if(!err401.emUsed){
emErrs118.push(err401);
}
}
vErrors = emErrs118;
errors = emErrs118.length;
}
}
if(data102.monthlyTokenLimit !== undefined){
let data105 = data102.monthlyTokenLimit;
if(!((typeof data105 == "number") && (!(data105 % 1) && !isNaN(data105)))){
const err402 = {instancePath:instancePath+"/quotas/anonymous/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema32.properties.monthlyTokenLimit.type,parentSchema:schema32.properties.monthlyTokenLimit,data:data105};
if(vErrors === null){
vErrors = [err402];
}
else {
vErrors.push(err402);
}
errors++;
}
if(typeof data105 == "number"){
if(data105 < 0 || isNaN(data105)){
const err403 = {instancePath:instancePath+"/quotas/anonymous/monthlyTokenLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyTokenLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema32.properties.monthlyTokenLimit,data:data105};
if(vErrors === null){
vErrors = [err403];
}
else {
vErrors.push(err403);
}
errors++;
}
}
if(errors > 0){
const emErrs119 = [];
for(const err404 of vErrors){
if(!err404.emUsed){
emErrs119.push(err404);
}
}
vErrors = emErrs119;
errors = emErrs119.length;
}
}
}
else {
const err405 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema32.type,parentSchema:schema32,data:data102};
if(vErrors === null){
vErrors = [err405];
}
else {
vErrors.push(err405);
}
errors++;
}
if(errors > 0){
const emErrors31 = {"required":{"unlimited":[],"dailyTokenLimit":[],"monthlyTokenLimit":[]}};
const templates31 = {required:{}};
let emPropParams30;
let emParamsErrors30;
for(const err406 of vErrors){
if((((((err406.keyword !== "errorMessage") && (!err406.emUsed)) && (err406.instancePath === instancePath+"/quotas/anonymous")) && (err406.keyword in emErrors31)) && (err406.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err406.schemaPath.slice(23)))){
emPropParams30 = obj0[err406.keyword];
emParamsErrors30 = emErrors31[err406.keyword][err406.params[emPropParams30]];
if(emParamsErrors30){
emParamsErrors30.push(err406);
err406.emUsed = true;
}
}
}
for(const key34 in emErrors31){
for(const keyProp30 in emErrors31[key34]){
emParamsErrors30 = emErrors31[key34][keyProp30];
if(emParamsErrors30.length){
const tmpl30 = templates31[key34] && templates31[key34][keyProp30];
const err407 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors30},message:tmpl30 ? tmpl30() : schema32.errorMessage[key34][keyProp30],schema:schema32.errorMessage,parentSchema:schema32,data:data102};
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
const emErrs120 = [];
for(const err408 of vErrors){
if(!err408.emUsed){
emErrs120.push(err408);
}
}
vErrors = emErrs120;
errors = emErrs120.length;
}
if(errors > 0){
const emErrors32 = {"required":{"unlimited":[],"dailyTokenLimit":[],"monthlyTokenLimit":[]}};
const templates32 = {required:{}};
let emPropParams31;
let emParamsErrors31;
for(const err409 of vErrors){
if((((((err409.keyword !== "errorMessage") && (!err409.emUsed)) && (err409.instancePath === instancePath+"/quotas/anonymous")) && (err409.keyword in emErrors32)) && (err409.schemaPath.indexOf("#/properties/quotas/properties/anonymous") === 0)) && (/^\/[^\/]*$/.test(err409.schemaPath.slice(40)))){
emPropParams31 = obj0[err409.keyword];
emParamsErrors31 = emErrors32[err409.keyword][err409.params[emPropParams31]];
if(emParamsErrors31){
emParamsErrors31.push(err409);
err409.emUsed = true;
}
}
}
for(const key35 in emErrors32){
for(const keyProp31 in emErrors32[key35]){
emParamsErrors31 = emErrors32[key35][keyProp31];
if(emParamsErrors31.length){
const tmpl31 = templates32[key35] && templates32[key35][keyProp31];
const err410 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/properties/quotas/properties/anonymous/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors31},message:tmpl31 ? tmpl31() : schema27.properties.quotas.properties.anonymous.errorMessage[key35][keyProp31],schema:schema27.properties.quotas.properties.anonymous.errorMessage,parentSchema:schema27.properties.quotas.properties.anonymous,data:data102};
if(vErrors === null){
vErrors = [err410];
}
else {
vErrors.push(err410);
}
errors++;
}
}
}
const emErrs121 = [];
for(const err411 of vErrors){
if(!err411.emUsed){
emErrs121.push(err411);
}
}
vErrors = emErrs121;
errors = emErrs121.length;
}
}
}
else {
const err412 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.quotas.type,parentSchema:schema27.properties.quotas,data:data81};
if(vErrors === null){
vErrors = [err412];
}
else {
vErrors.push(err412);
}
errors++;
}
if(errors > 0){
const emErrors33 = {"required":{"global":[],"admin":[],"contrib":[],"user":[],"external":[],"anonymous":[]}};
const templates33 = {required:{}};
let emPropParams32;
let emParamsErrors32;
for(const err413 of vErrors){
if((((((err413.keyword !== "errorMessage") && (!err413.emUsed)) && (err413.instancePath === instancePath+"/quotas")) && (err413.keyword in emErrors33)) && (err413.schemaPath.indexOf("#/properties/quotas") === 0)) && (/^\/[^\/]*$/.test(err413.schemaPath.slice(19)))){
emPropParams32 = obj0[err413.keyword];
emParamsErrors32 = emErrors33[err413.keyword][err413.params[emPropParams32]];
if(emParamsErrors32){
emParamsErrors32.push(err413);
err413.emUsed = true;
}
}
}
for(const key36 in emErrors33){
for(const keyProp32 in emErrors33[key36]){
emParamsErrors32 = emErrors33[key36][keyProp32];
if(emParamsErrors32.length){
const tmpl32 = templates33[key36] && templates33[key36][keyProp32];
const err414 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors32},message:tmpl32 ? tmpl32() : schema27.properties.quotas.errorMessage[key36][keyProp32],schema:schema27.properties.quotas.errorMessage,parentSchema:schema27.properties.quotas,data:data81};
if(vErrors === null){
vErrors = [err414];
}
else {
vErrors.push(err414);
}
errors++;
}
}
}
const emErrs122 = [];
for(const err415 of vErrors){
if(!err415.emUsed){
emErrs122.push(err415);
}
}
vErrors = emErrs122;
errors = emErrs122.length;
}
}
}
else {
const err416 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err416];
}
else {
vErrors.push(err416);
}
errors++;
}
if(errors > 0){
const emErrors34 = {"required":{"providers":[],"models":[],"quotas":[]}};
const templates34 = {required:{}};
let emPropParams33;
let emParamsErrors33;
for(const err417 of vErrors){
if((((((err417.keyword !== "errorMessage") && (!err417.emUsed)) && (err417.instancePath === instancePath)) && (err417.keyword in emErrors34)) && (err417.schemaPath.indexOf("#") === 0)) && (/^\/[^\/]*$/.test(err417.schemaPath.slice(1)))){
emPropParams33 = obj0[err417.keyword];
emParamsErrors33 = emErrors34[err417.keyword][err417.params[emPropParams33]];
if(emParamsErrors33){
emParamsErrors33.push(err417);
err417.emUsed = true;
}
}
}
for(const key37 in emErrors34){
for(const keyProp33 in emErrors34[key37]){
emParamsErrors33 = emErrors34[key37][keyProp33];
if(emParamsErrors33.length){
const tmpl33 = templates34[key37] && templates34[key37][keyProp33];
const err418 = {instancePath,schemaPath:"#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors33},message:tmpl33 ? tmpl33() : schema27.errorMessage[key37][keyProp33],schema:schema27.errorMessage,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err418];
}
else {
vErrors.push(err418);
}
errors++;
}
}
}
const emErrs123 = [];
for(const err419 of vErrors){
if(!err419.emUsed){
emErrs123.push(err419);
}
}
vErrors = emErrs123;
errors = emErrs123.length;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(!(validate23(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
validate31.errors = vErrors;
return errors === 0;
}
validate31.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
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
return ("Mock")
}function expression14(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return (parent.data.providers?.length)
}function expression15(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return `${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(",")}`
}function expression16(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`)
}function expression17(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item.id)
}function expression18(data,body,options,context,display,layout,readOnly,summary,validates
) {
return (data.results)
}function expression19(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (context.accountType === "organization")
}function expression20(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
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
      title: "Mock",
      root: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6",
      discriminatorValue: "mock"
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/settings-put#": {
      title: "Settings",
      key: "",
      pointer: "https://github.com/data-fair/agents/settings-put#",
      refPointer: "https://github.com/data-fair/agents/settings-put#",
      pure: false,
      propertyKeys: ["createdAt", "updatedAt", "owner", "providers", "models", "quotas"],
      roPropertyKeys: ["createdAt", "updatedAt", "owner"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/createdAt", "https://github.com/data-fair/agents/settings-put#/properties/updatedAt", "https://github.com/data-fair/agents/settings-put#/properties/owner", "https://github.com/data-fair/agents/settings-put#/properties/providers", "https://github.com/data-fair/agents/settings-put#/properties/models", "https://github.com/data-fair/agents/settings-put#/properties/quotas"]
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
      propertyKeys: ["type", "id", "name", "enabled"],
      roPropertyKeys: ["id"],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/id", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/name", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/enabled"]
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf": {
      key: "$oneOf",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf",
      childrenTrees: ["https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/0", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/1", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/2", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/3", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/4", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/5", "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6"],
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
      propertyKeys: ["assistant", "tools", "summarizer", "evaluator"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant": {
      title: "Assistant",
      key: "assistant",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant",
      pure: false,
      propertyKeys: ["model", "ratio"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/ratio"]
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

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/ratio": {
      title: "Usage Ratio",
      key: "ratio",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/ratio",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/ratio",
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
      propertyKeys: ["model", "ratio"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/model", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/ratio"]
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

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/ratio": {
      title: "Usage Ratio",
      key: "ratio",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/ratio",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/ratio",
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
      propertyKeys: ["model", "ratio"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/ratio"]
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

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/ratio": {
      title: "Usage Ratio",
      key: "ratio",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/ratio",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/ratio",
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
      propertyKeys: ["model", "ratio"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/model", "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/ratio"]
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

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/ratio": {
      title: "Usage Ratio",
      key: "ratio",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/ratio",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/ratio",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas": {
      title: "Role Quotas",
      key: "quotas",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas",
      refPointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas",
      pure: false,
      propertyKeys: ["global", "admin", "contrib", "user", "external", "anonymous"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/global", "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/admin", "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/contrib", "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/user", "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/external", "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/anonymous"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/global": {
      title: "Global quotas",
      key: "global",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/global",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "dailyTokenLimit", "monthlyTokenLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/dailyTokenLimit", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyTokenLimit"]
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

    "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/dailyTokenLimit": {
      title: "Daily Token Limit",
      key: "dailyTokenLimit",
      pointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/dailyTokenLimit",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/dailyTokenLimit",
      pure: false,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyTokenLimit": {
      title: "Monthly Token Limit",
      key: "monthlyTokenLimit",
      pointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyTokenLimit",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyTokenLimit",
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
      propertyKeys: ["unlimited", "dailyTokenLimit", "monthlyTokenLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/dailyTokenLimit", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyTokenLimit"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/contrib": {
      title: "Contributor quotas",
      key: "contrib",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/contrib",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "dailyTokenLimit", "monthlyTokenLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/dailyTokenLimit", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyTokenLimit"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/user": {
      title: "Simple user Quotas",
      key: "user",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/user",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "dailyTokenLimit", "monthlyTokenLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/dailyTokenLimit", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyTokenLimit"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/external": {
      title: "External user quotas",
      key: "external",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/external",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "dailyTokenLimit", "monthlyTokenLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/dailyTokenLimit", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyTokenLimit"]
    },

    "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/anonymous": {
      title: "Anonymous user quotas",
      key: "anonymous",
      pointer: "https://github.com/data-fair/agents/settings-put#/properties/quotas/properties/anonymous",
      refPointer: "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "dailyTokenLimit", "monthlyTokenLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,
      children: ["https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/unlimited", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/dailyTokenLimit", "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyTokenLimit"]
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

    "https://github.com/data-fair/agents/settings-put#/properties/providers/items/oneOf/6/properties/type": {
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
        expr: "\"Mock\"",
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

    "https://github.com/data-fair/agents/settings-put#/properties/models": {
      title: null,

      if: {
        type: "js-eval",
        expr: "parent.data.providers?.length",
        pure: false,
        dataAlias: "value",
        ref: 14
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
        key: "model",

        cols: {
          xs: 12,
          sm: 8
        }
      }, {
        key: "ratio",

        cols: {
          xs: 12,
          sm: 4
        }
      }],

      cols: {
        xs: 12,
        sm: 6
      },

      title: "Assistant",
      subtitle: "<p>The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.</p>\n<p>Recommendations: GPT-5.4, Claude 4.5 Sonnet, Llama 4 Maverick, Mistral Large 3, etc.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/model": {
      comp: "autocomplete",

      getItems: {
        url: {
          pure: false,
          type: "js-tpl",
          dataAlias: "value",
          expr: "${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}",
          ref: 15
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 18
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 16
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 17
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

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/assistant/properties/ratio": {
      comp: "number-field",
      min: 0,
      label: "Usage Ratio",
      help: "<p>Multiplier applied to token usage for quota accounting (e.g. 1.0 = full cost, 0.5 = half cost)</p>",
      defaultData: 1,

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
        key: "model",

        cols: {
          xs: 12,
          sm: 8
        }
      }, {
        key: "ratio",

        cols: {
          xs: 12,
          sm: 4
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
          ref: 15
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 18
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 16
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 17
        },

        returnObjects: true
      },

      label: "Model"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/tools/properties/ratio": {
      comp: "number-field",
      min: 0,
      label: "Usage Ratio",
      help: "<p>Multiplier applied to token usage for quota accounting</p>",
      defaultData: 0.5,

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
        key: "model",

        cols: {
          xs: 12,
          sm: 8
        }
      }, {
        key: "ratio",

        cols: {
          xs: 12,
          sm: 4
        }
      }],

      cols: {
        xs: 12,
        sm: 6
      },

      title: "Summarizer",
      subtitle: "<p>A &quot;shorthand&quot; specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.</p>\n<p>Recommendations: GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Llama 4 (8B), etc.</p>"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/model": {
      comp: "autocomplete",

      getItems: {
        url: {
          pure: false,
          type: "js-tpl",
          dataAlias: "value",
          expr: "${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(\",\")}",
          ref: 15
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 18
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 16
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 17
        },

        returnObjects: true
      },

      label: "Model"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/summarizer/properties/ratio": {
      comp: "number-field",
      min: 0,
      label: "Usage Ratio",
      help: "<p>Multiplier applied to token usage for quota accounting (e.g. 0.5 for cheaper summarization)</p>",
      defaultData: 0.5,

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
        key: "model",

        cols: {
          xs: 12,
          sm: 8
        }
      }, {
        key: "ratio",

        cols: {
          xs: 12,
          sm: 4
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
          ref: 15
        },

        itemsResults: {
          pure: true,
          type: "js-eval",
          dataAlias: "body",
          expr: "data.results",
          ref: 18
        },

        itemTitle: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`",
          ref: 16
        },

        itemKey: {
          pure: true,
          type: "js-eval",
          dataAlias: "item",
          expr: "item.id",
          ref: 17
        },

        returnObjects: true
      },

      label: "Model"
    },

    "https://github.com/data-fair/agents/settings-put#/properties/models/properties/evaluator/properties/ratio": {
      comp: "number-field",
      min: 0,
      label: "Usage Ratio",
      help: "<p>Multiplier applied to token usage for quota accounting</p>",
      defaultData: 1,

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
        ref: 14
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
          ref: 19
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
          ref: 19
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
      }],

      comp: "section",

      defaultData: {
        global: {
          unlimited: false,
          dailyTokenLimit: 100000,
          monthlyTokenLimit: 1000000
        },

        admin: {
          unlimited: true,
          dailyTokenLimit: 0,
          monthlyTokenLimit: 0
        },

        contrib: {
          unlimited: false,
          dailyTokenLimit: 0,
          monthlyTokenLimit: 0
        },

        user: {
          unlimited: false,
          dailyTokenLimit: 0,
          monthlyTokenLimit: 0
        },

        external: {
          unlimited: false,
          dailyTokenLimit: 0,
          monthlyTokenLimit: 0
        },

        anonymous: {
          unlimited: false,
          dailyTokenLimit: 0,
          monthlyTokenLimit: 0
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
        key: "dailyTokenLimit"
      }, {
        key: "monthlyTokenLimit"
      }],

      title: "Global quotas",

      defaultData: {
        unlimited: false,
        dailyTokenLimit: 100000,
        monthlyTokenLimit: 1000000
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

    "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/dailyTokenLimit": {
      if: {
        type: "js-eval",
        expr: "!parent.data.unlimited",
        pure: false,
        dataAlias: "value",
        ref: 20
      },

      cols: {
        xs: 12,
        sm: 6
      },

      comp: "number-field",
      step: 1,
      min: 0,
      precision: 0,
      label: "Daily Token Limit",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/settings-put#/definitions/RoleQuota/properties/monthlyTokenLimit": {
      if: {
        type: "js-eval",
        expr: "!parent.data.unlimited",
        pure: false,
        dataAlias: "value",
        ref: 20
      },

      cols: {
        xs: 12,
        sm: 6
      },

      comp: "number-field",
      step: 1,
      min: 0,
      precision: 0,
      label: "Monthly Token Limit",
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
        key: "dailyTokenLimit"
      }, {
        key: "monthlyTokenLimit"
      }],

      title: "Admin quotas",

      defaultData: {
        unlimited: true,
        dailyTokenLimit: 0,
        monthlyTokenLimit: 0
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
        key: "dailyTokenLimit"
      }, {
        key: "monthlyTokenLimit"
      }],

      title: "Contributor quotas",

      defaultData: {
        unlimited: false,
        dailyTokenLimit: 0,
        monthlyTokenLimit: 0
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
        key: "dailyTokenLimit"
      }, {
        key: "monthlyTokenLimit"
      }],

      title: "Simple user Quotas",

      defaultData: {
        unlimited: false,
        dailyTokenLimit: 0,
        monthlyTokenLimit: 0
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
        key: "dailyTokenLimit"
      }, {
        key: "monthlyTokenLimit"
      }],

      title: "External user quotas",

      defaultData: {
        unlimited: false,
        dailyTokenLimit: 0,
        monthlyTokenLimit: 0
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
        key: "dailyTokenLimit"
      }, {
        key: "monthlyTokenLimit"
      }],

      title: "Anonymous user quotas",

      defaultData: {
        unlimited: false,
        dailyTokenLimit: 0,
        monthlyTokenLimit: 0
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
    "https://github.com/data-fair/agents/settings-put#/properties/providers/items": validate30,
    "https://github.com/data-fair/agents/settings-put#": validate31
  },

  validationErrors: {},
  expressions: [expression0, expression1, expression2, expression3, expression4, expression5, expression6, expression7, expression8, expression9, expression10, expression11, expression12, expression13, expression14, expression15, expression16, expression17, expression18, expression19, expression20],
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
  
  "select": selectNode,
  
  "text-field": textfieldNode,
  
  "list": listNode,
  
  "one-of-select": oneofselectNode,
  
  "checkbox": checkboxNode,
  
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