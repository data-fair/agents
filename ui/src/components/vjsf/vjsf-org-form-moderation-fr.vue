<script setup>
// @ts-nocheck

import { StatefulLayout } from '@json-layout/core/state'
import { ref, shallowRef, getCurrentInstance, useSlots, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

import Tree from '@koumoul/vjsf/components/tree.vue'
import { useVjsf, emits } from '@koumoul/vjsf/composables/use-vjsf.js'
import '@koumoul/vjsf/styles/vjsf.css'


import sectionNode from '@koumoul/vjsf/components/nodes/section.vue'

import checkboxNode from '@koumoul/vjsf/components/nodes/checkbox.vue'

import selectNode from '@koumoul/vjsf/components/nodes/select.vue'


import localizeErrors from "ajv-i18n/localize/fr/index.js";

const export0 = validate22;
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items"};
const schema28 = {"type":"string","oneOf":[{"const":"anonymous","title":"Anonyme"},{"const":"external","title":"Externe"},{"const":"user","title":"Utilisateur"},{"const":"contrib","title":"Contributeur"},{"const":"admin","title":"Administrateur"}],"__pointer":"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items","errorMessage":{"oneOf":"choisissez une valeur"}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.type,parentSchema:schema28,data};
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
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/oneOf/0/const",keyword:"const",params:{allowedValue: "anonymous"},message:"must be equal to constant",schema:"anonymous",parentSchema:schema28.oneOf[0],data};
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
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/oneOf/1/const",keyword:"const",params:{allowedValue: "external"},message:"must be equal to constant",schema:"external",parentSchema:schema28.oneOf[1],data};
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
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/oneOf/2/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema28.oneOf[2],data};
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
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/oneOf/3/const",keyword:"const",params:{allowedValue: "contrib"},message:"must be equal to constant",schema:"contrib",parentSchema:schema28.oneOf[3],data};
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
const err5 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/oneOf/4/const",keyword:"const",params:{allowedValue: "admin"},message:"must be equal to constant",schema:"admin",parentSchema:schema28.oneOf[4],data};
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
const err6 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema28.oneOf,parentSchema:schema28,data};
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
if((((((err7.keyword !== "errorMessage") && (!err7.emUsed)) && (err7.instancePath === instancePath)) && (err7.keyword in emErrors0)) && (err7.schemaPath.indexOf("https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items") === 0)) && (/^\/[^\/]*$/.test(err7.schemaPath.slice(115)))){
emErrors0[err7.keyword].push(err7);
err7.emUsed = true;
}
}
for(const key0 in emErrors0){
if(emErrors0[key0].length){
const err8 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors0[key0]},message:key0 in templates0 ? templates0[key0]() : schema28.errorMessage[key0],schema:schema28.errorMessage,parentSchema:schema28,data};
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

const export1 = validate24;
const schema29 = {"$id":"export1","$ref":"https://github.com/data-fair/agents/settings/org-form-moderation#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/settings/org-form-moderation","x-exports":["vjsf"],"x-vjsf":{"xI18n":true},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"layout":{"title":null},"definitions":{"RoleQuota":{"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Illimité","default":false},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Limite mensuelle","description":"Limite hebdomadaire = mensuelle / 2, limite journalière = mensuelle / 4","default":0,"minimum":0}}}},"properties":{"moderation":{"type":"object","title":"Modération des entrées","layout":{"title":null},"default":{"enabled":false,"categories":["anonymous","external"]},"required":["enabled","categories"],"additionalProperties":false,"properties":{"enabled":{"type":"boolean","title":"Activer la modération des entrées","description":"Si activé, le dernier message utilisateur de chaque requête provenant d'une catégorie modérée est classé avant la réponse du modèle.","default":false,"__pointer":"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/enabled","errorMessage":{}},"categories":{"type":"array","uniqueItems":true,"default":["anonymous","external"],"title":"Catégories d'utilisateurs modérées","description":"Catégories d'utilisateurs dont les requêtes sont vérifiées par le filtre lorsque la modération est activée.","items":{"type":"string","oneOf":[{"const":"anonymous","title":"Anonyme"},{"const":"external","title":"Externe"},{"const":"user","title":"Utilisateur"},{"const":"contrib","title":"Contributeur"},{"const":"admin","title":"Administrateur"}],"__pointer":"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items","errorMessage":{"oneOf":"choisissez une valeur"}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation","errorMessage":{"required":{"enabled":"information obligatoire","categories":"information obligatoire"}}},"storeTraces":{"type":"boolean","title":"Enregistrer les traces de conversation","description":"Si activé, les conversations des utilisateurs consentants sont enregistrées sur le serveur pendant 30 jours pour relecture par un administrateur. Chaque utilisateur doit explicitement accepter.","default":false,"__pointer":"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/storeTraces","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-moderation#","errorMessage":{}};
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
for(const key0 in data){
if(!((key0 === "moderation") || (key0 === "storeTraces"))){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
if(data.moderation !== undefined){
let data0 = data.moderation;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.enabled === undefined){
const err1 = {instancePath:instancePath+"/moderation",schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.moderation.required,parentSchema:schema27.properties.moderation,data:data0};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data0.categories === undefined){
const err2 = {instancePath:instancePath+"/moderation",schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/required",keyword:"required",params:{missingProperty: "categories"},message:"must have required property '"+"categories"+"'",schema:schema27.properties.moderation.required,parentSchema:schema27.properties.moderation,data:data0};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key1 in data0){
if(!((key1 === "enabled") || (key1 === "categories"))){
const err3 = {instancePath:instancePath+"/moderation",schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.moderation,data:data0};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data0.enabled !== undefined){
let data1 = data0.enabled;
if(typeof data1 !== "boolean"){
const err4 = {instancePath:instancePath+"/moderation/enabled",schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.moderation.properties.enabled.type,parentSchema:schema27.properties.moderation.properties.enabled,data:data1};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err5 of vErrors){
if(!err5.emUsed){
emErrs0.push(err5);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data0.categories !== undefined){
let data2 = data0.categories;
if(Array.isArray(data2)){
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
if(typeof data3 !== "string"){
const err6 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.moderation.properties.categories.items.type,parentSchema:schema27.properties.moderation.properties.categories.items,data:data3};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
const _errs12 = errors;
let valid5 = false;
let passing0 = null;
const _errs13 = errors;
if("anonymous" !== data3){
const err7 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/oneOf/0/const",keyword:"const",params:{allowedValue: "anonymous"},message:"must be equal to constant",schema:"anonymous",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[0],data:data3};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
var _valid0 = _errs13 === errors;
if(_valid0){
valid5 = true;
passing0 = 0;
}
const _errs14 = errors;
if("external" !== data3){
const err8 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/oneOf/1/const",keyword:"const",params:{allowedValue: "external"},message:"must be equal to constant",schema:"external",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[1],data:data3};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
var _valid0 = _errs14 === errors;
if(_valid0 && valid5){
valid5 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid5 = true;
passing0 = 1;
}
const _errs15 = errors;
if("user" !== data3){
const err9 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/oneOf/2/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[2],data:data3};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid0 = _errs15 === errors;
if(_valid0 && valid5){
valid5 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid5 = true;
passing0 = 2;
}
const _errs16 = errors;
if("contrib" !== data3){
const err10 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/oneOf/3/const",keyword:"const",params:{allowedValue: "contrib"},message:"must be equal to constant",schema:"contrib",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[3],data:data3};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid0 = _errs16 === errors;
if(_valid0 && valid5){
valid5 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid5 = true;
passing0 = 3;
}
const _errs17 = errors;
if("admin" !== data3){
const err11 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/oneOf/4/const",keyword:"const",params:{allowedValue: "admin"},message:"must be equal to constant",schema:"admin",parentSchema:schema27.properties.moderation.properties.categories.items.oneOf[4],data:data3};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid0 = _errs17 === errors;
if(_valid0 && valid5){
valid5 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid5 = true;
passing0 = 4;
}
}
}
}
}
if(!valid5){
const err12 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema27.properties.moderation.properties.categories.items.oneOf,parentSchema:schema27.properties.moderation.properties.categories.items,data:data3};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
else {
errors = _errs12;
if(vErrors !== null){
if(_errs12){
vErrors.length = _errs12;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors0 = {"oneOf":[]};
const templates0 = {};
for(const err13 of vErrors){
if((((((err13.keyword !== "errorMessage") && (!err13.emUsed)) && (err13.instancePath === instancePath+"/moderation/categories/" + i0)) && (err13.keyword in emErrors0)) && (err13.schemaPath.indexOf("https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items") === 0)) && (/^\/[^\/]*$/.test(err13.schemaPath.slice(115)))){
emErrors0[err13.keyword].push(err13);
err13.emUsed = true;
}
}
for(const key2 in emErrors0){
if(emErrors0[key2].length){
const err14 = {instancePath:instancePath+"/moderation/categories/" + i0,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors0[key2]},message:key2 in templates0 ? templates0[key2]() : schema27.properties.moderation.properties.categories.items.errorMessage[key2],schema:schema27.properties.moderation.properties.categories.items.errorMessage,parentSchema:schema27.properties.moderation.properties.categories.items,data:data3};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
const emErrs1 = [];
for(const err15 of vErrors){
if(!err15.emUsed){
emErrs1.push(err15);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
let i1 = data2.length;
let j0;
if(i1 > 1){
const indices0 = {};
for(;i1--;){
let item0 = data2[i1];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err16 = {instancePath:instancePath+"/moderation/categories",schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)",schema:true,parentSchema:schema27.properties.moderation.properties.categories,data:data2};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err17 = {instancePath:instancePath+"/moderation/categories",schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.moderation.properties.categories.type,parentSchema:schema27.properties.moderation.properties.categories,data:data2};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err18 of vErrors){
if(!err18.emUsed){
emErrs2.push(err18);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
}
else {
const err19 = {instancePath:instancePath+"/moderation",schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.moderation.type,parentSchema:schema27.properties.moderation,data:data0};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"enabled":[],"categories":[]}};
const templates1 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err20 of vErrors){
if((((((err20.keyword !== "errorMessage") && (!err20.emUsed)) && (err20.instancePath === instancePath+"/moderation")) && (err20.keyword in emErrors1)) && (err20.schemaPath.indexOf("https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation") === 0)) && (/^\/[^\/]*$/.test(err20.schemaPath.slice(87)))){
emPropParams0 = obj0[err20.keyword];
emParamsErrors0 = emErrors1[err20.keyword][err20.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err20);
err20.emUsed = true;
}
}
}
for(const key3 in emErrors1){
for(const keyProp0 in emErrors1[key3]){
emParamsErrors0 = emErrors1[key3][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates1[key3] && templates1[key3][keyProp0];
const err21 = {instancePath:instancePath+"/moderation",schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.moderation.errorMessage[key3][keyProp0],schema:schema27.properties.moderation.errorMessage,parentSchema:schema27.properties.moderation,data:data0};
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
const emErrs3 = [];
for(const err22 of vErrors){
if(!err22.emUsed){
emErrs3.push(err22);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data.storeTraces !== undefined){
let data4 = data.storeTraces;
if(typeof data4 !== "boolean"){
const err23 = {instancePath:instancePath+"/storeTraces",schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/properties/storeTraces/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.storeTraces.type,parentSchema:schema27.properties.storeTraces,data:data4};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(errors > 0){
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
}
else {
const err25 = {instancePath,schemaPath:"https://github.com/data-fair/agents/settings/org-form-moderation#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err26 of vErrors){
if(!err26.emUsed){
emErrs5.push(err26);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
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
return ([{"const":"anonymous","title":"Anonyme","key":"anonymous","value":"anonymous"},{"const":"external","title":"Externe","key":"external","value":"external"},{"const":"user","title":"Utilisateur","key":"user","value":"user"},{"const":"contrib","title":"Contributeur","key":"contrib","value":"contrib"},{"const":"admin","title":"Administrateur","key":"admin","value":"admin"}])
}
const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/settings/org-form-moderation#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/settings/org-form-moderation#": {
      title: "main",
      root: "https://github.com/data-fair/agents/settings/org-form-moderation#",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-moderation#",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items": {
      title: "",
      root: "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/settings/org-form-moderation#": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/org-form-moderation#",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-moderation#",
      pure: true,
      propertyKeys: ["moderation", "storeTraces"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation",
        "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/storeTraces"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation": {
      title: "Modération des entrées",
      key: "moderation",
      pointer: "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation",
      pure: true,
      propertyKeys: ["enabled", "categories"],
      roPropertyKeys: [],
      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/enabled",
        "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/enabled": {
      title: "Activer la modération des entrées",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories": {
      title: "Catégories d'utilisateurs modérées",
      key: "categories",
      pointer: "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      childrenTrees: [
        "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/storeTraces": {
      title: "Enregistrer les traces de conversation",
      key: "storeTraces",
      pointer: "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/storeTraces",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/storeTraces",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/settings/org-form-moderation#": {
      title: null,
      comp: "section",

      children: [{
        key: "moderation"
      }, {
        key: "storeTraces"
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

    "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation": {
      title: null,
      comp: "section",

      children: [{
        key: "enabled"
      }, {
        key: "categories"
      }],

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

    "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/enabled": {
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

    "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"anonymous\",\"title\":\"Anonyme\",\"key\":\"anonymous\",\"value\":\"anonymous\"},{\"const\":\"external\",\"title\":\"Externe\",\"key\":\"external\",\"value\":\"external\"},{\"const\":\"user\",\"title\":\"Utilisateur\",\"key\":\"user\",\"value\":\"user\"},{\"const\":\"contrib\",\"title\":\"Contributeur\",\"key\":\"contrib\",\"value\":\"contrib\"},{\"const\":\"admin\",\"title\":\"Administrateur\",\"key\":\"admin\",\"value\":\"admin\"}]",
        immutable: true,
        ref: 1
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

    "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"anonymous\",\"title\":\"Anonyme\",\"key\":\"anonymous\",\"value\":\"anonymous\"},{\"const\":\"external\",\"title\":\"Externe\",\"key\":\"external\",\"value\":\"external\"},{\"const\":\"user\",\"title\":\"Utilisateur\",\"key\":\"user\",\"value\":\"user\"},{\"const\":\"contrib\",\"title\":\"Contributeur\",\"key\":\"contrib\",\"value\":\"contrib\"},{\"const\":\"admin\",\"title\":\"Administrateur\",\"key\":\"admin\",\"value\":\"admin\"}]",
        immutable: true,
        ref: 1
      },

      label: "",
      nullable: true
    },

    "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/storeTraces": {
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
    }
  },

  validates: {
    "https://github.com/data-fair/agents/settings/org-form-moderation#/properties/moderation/properties/categories/items": export0,
    "https://github.com/data-fair/agents/settings/org-form-moderation#": export1
  },

  validationErrors: {},
  expressions: [expression0, expression1],
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
    }
  },

  localizeErrors: localizeErrors
}

const nodeComponents = {
  
  "section": sectionNode,
  
  "checkbox": checkboxNode,
  
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