<script setup>
// @ts-nocheck

import { StatefulLayout } from '@json-layout/core/state'
import { ref, shallowRef, getCurrentInstance, useSlots, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

import Tree from '@koumoul/vjsf/components/tree.vue'
import { useVjsf, emits } from '@koumoul/vjsf/composables/use-vjsf.js'
import '@koumoul/vjsf/styles/vjsf.css'


import sectionNode from '@koumoul/vjsf/components/nodes/section.vue'

import cardNode from '@koumoul/vjsf/components/nodes/card.vue'

import checkboxNode from '@koumoul/vjsf/components/nodes/checkbox.vue'

import numberfieldNode from '@koumoul/vjsf/components/nodes/number-field.vue'


import localizeErrors from "ajv-i18n/localize/en/index.js";

const export0 = validate22;
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/settings/org-form-quotas#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/settings/org-form-quotas","x-exports":["vjsf"],"x-vjsf":{"xI18n":true},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"layout":{"title":null},"definitions":{"RoleQuota":{"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Unlimited","default":false,"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/unlimited","errorMessage":{}},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Monthly Limit","description":"Weekly limit = monthly / 2, daily limit = monthly / 4","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/monthlyLimit","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}}},"properties":{"quotas":{"type":"object","title":"Role Quotas","layout":{"title":null,"children":[{"key":"admin","cols":{"sm":6,"md":4}},{"key":"contrib","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"user","cols":{"sm":6,"md":4},"if":"context.accountType === \"organization\""},{"key":"external","cols":{"sm":6,"md":4}},{"key":"anonymous","cols":{"sm":6,"md":4}},{"key":"untrusted","cols":{"sm":6,"md":4}}]},"required":["admin","contrib","user","external","anonymous"],"default":{"admin":{"unlimited":true,"monthlyLimit":0},"contrib":{"unlimited":false,"monthlyLimit":0},"user":{"unlimited":false,"monthlyLimit":0},"external":{"unlimited":false,"monthlyLimit":0},"anonymous":{"unlimited":false,"monthlyLimit":0},"untrusted":{"unlimited":false,"monthlyLimit":0}},"properties":{"admin":{"$ref":"#/definitions/RoleQuota","title":"Admin quotas","default":{"unlimited":true,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/admin","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"contrib":{"$ref":"#/definitions/RoleQuota","title":"Contributor quotas","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/contrib","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"user":{"$ref":"#/definitions/RoleQuota","title":"Simple user Quotas","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/user","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"external":{"$ref":"#/definitions/RoleQuota","title":"External user quotas","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/external","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"anonymous":{"$ref":"#/definitions/RoleQuota","title":"Anonymous user quotas","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/anonymous","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}},"untrusted":{"$ref":"#/definitions/RoleQuota","title":"Anonymous + external pool","description":"Aggregate cap shared by all anonymous and external usage combined, so untrusted traffic cannot consume the whole account budget. 0 = no pool cap.","default":{"unlimited":false,"monthlyLimit":0},"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/untrusted","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas","errorMessage":{"required":{"admin":"required information","contrib":"required information","user":"required information","external":"required information","anonymous":"required information"}}}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#","errorMessage":{}};
const schema28 = {"type":"object","layout":"card","required":["unlimited","monthlyLimit"],"properties":{"unlimited":{"type":"boolean","title":"Unlimited","default":false,"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/unlimited","errorMessage":{}},"monthlyLimit":{"layout":{"if":"!parent.data.unlimited"},"type":"number","title":"Monthly Limit","description":"Weekly limit = monthly / 2, daily limit = monthly / 4","default":0,"minimum":0,"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/monthlyLimit","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota","errorMessage":{"required":{"unlimited":"required information","monthlyLimit":"required information"}}};
const obj0 = {"required":"missingProperty","dependencies":"property","dependentRequired":"property"};

function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://github.com/data-fair/agents/settings/org-form-quotas" */;
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
if(!(key0 === "quotas")){
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
if(data.quotas !== undefined){
let data0 = data.quotas;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.admin === undefined){
const err1 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "admin"},message:"must have required property '"+"admin"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data0};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data0.contrib === undefined){
const err2 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "contrib"},message:"must have required property '"+"contrib"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data0};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data0.user === undefined){
const err3 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "user"},message:"must have required property '"+"user"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data0};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data0.external === undefined){
const err4 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "external"},message:"must have required property '"+"external"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data0.anonymous === undefined){
const err5 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/required",keyword:"required",params:{missingProperty: "anonymous"},message:"must have required property '"+"anonymous"+"'",schema:schema27.properties.quotas.required,parentSchema:schema27.properties.quotas,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data0.admin !== undefined){
let data1 = data0.admin;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.unlimited === undefined){
const err6 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema28.required,parentSchema:schema28,data:data1};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data1.monthlyLimit === undefined){
const err7 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema28.required,parentSchema:schema28,data:data1};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data1.unlimited !== undefined){
let data2 = data1.unlimited;
if(typeof data2 !== "boolean"){
const err8 = {instancePath:instancePath+"/quotas/admin/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.unlimited.type,parentSchema:schema28.properties.unlimited,data:data2};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err9 of vErrors){
if(!err9.emUsed){
emErrs0.push(err9);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data1.monthlyLimit !== undefined){
let data3 = data1.monthlyLimit;
if(typeof data3 == "number"){
if(data3 < 0 || isNaN(data3)){
const err10 = {instancePath:instancePath+"/quotas/admin/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28.properties.monthlyLimit,data:data3};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
else {
const err11 = {instancePath:instancePath+"/quotas/admin/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.monthlyLimit.type,parentSchema:schema28.properties.monthlyLimit,data:data3};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err12 of vErrors){
if(!err12.emUsed){
emErrs1.push(err12);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
}
else {
const err13 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data1};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err14 of vErrors){
if((((((err14.keyword !== "errorMessage") && (!err14.emUsed)) && (err14.instancePath === instancePath+"/quotas/admin")) && (err14.keyword in emErrors0)) && (err14.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err14.schemaPath.slice(23)))){
emPropParams0 = obj0[err14.keyword];
emParamsErrors0 = emErrors0[err14.keyword][err14.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err14);
err14.emUsed = true;
}
}
}
for(const key1 in emErrors0){
for(const keyProp0 in emErrors0[key1]){
emParamsErrors0 = emErrors0[key1][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key1] && templates0[key1][keyProp0];
const err15 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema28.errorMessage[key1][keyProp0],schema:schema28.errorMessage,parentSchema:schema28,data:data1};
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
const emErrs2 = [];
for(const err16 of vErrors){
if(!err16.emUsed){
emErrs2.push(err16);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
if(errors > 0){
const emErrors1 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err17 of vErrors){
if((((((err17.keyword !== "errorMessage") && (!err17.emUsed)) && (err17.instancePath === instancePath+"/quotas/admin")) && (err17.keyword in emErrors1)) && (err17.schemaPath.indexOf("#/properties/quotas/properties/admin") === 0)) && (/^\/[^\/]*$/.test(err17.schemaPath.slice(36)))){
emPropParams1 = obj0[err17.keyword];
emParamsErrors1 = emErrors1[err17.keyword][err17.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err17);
err17.emUsed = true;
}
}
}
for(const key2 in emErrors1){
for(const keyProp1 in emErrors1[key2]){
emParamsErrors1 = emErrors1[key2][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key2] && templates1[key2][keyProp1];
const err18 = {instancePath:instancePath+"/quotas/admin",schemaPath:"#/properties/quotas/properties/admin/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.properties.quotas.properties.admin.errorMessage[key2][keyProp1],schema:schema27.properties.quotas.properties.admin.errorMessage,parentSchema:schema27.properties.quotas.properties.admin,data:data1};
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
const emErrs3 = [];
for(const err19 of vErrors){
if(!err19.emUsed){
emErrs3.push(err19);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data0.contrib !== undefined){
let data4 = data0.contrib;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.unlimited === undefined){
const err20 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema28.required,parentSchema:schema28,data:data4};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data4.monthlyLimit === undefined){
const err21 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema28.required,parentSchema:schema28,data:data4};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data4.unlimited !== undefined){
let data5 = data4.unlimited;
if(typeof data5 !== "boolean"){
const err22 = {instancePath:instancePath+"/quotas/contrib/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.unlimited.type,parentSchema:schema28.properties.unlimited,data:data5};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err23 of vErrors){
if(!err23.emUsed){
emErrs4.push(err23);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
if(data4.monthlyLimit !== undefined){
let data6 = data4.monthlyLimit;
if(typeof data6 == "number"){
if(data6 < 0 || isNaN(data6)){
const err24 = {instancePath:instancePath+"/quotas/contrib/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28.properties.monthlyLimit,data:data6};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
else {
const err25 = {instancePath:instancePath+"/quotas/contrib/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.monthlyLimit.type,parentSchema:schema28.properties.monthlyLimit,data:data6};
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
}
}
else {
const err27 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data4};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates2 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err28 of vErrors){
if((((((err28.keyword !== "errorMessage") && (!err28.emUsed)) && (err28.instancePath === instancePath+"/quotas/contrib")) && (err28.keyword in emErrors2)) && (err28.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err28.schemaPath.slice(23)))){
emPropParams2 = obj0[err28.keyword];
emParamsErrors2 = emErrors2[err28.keyword][err28.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err28);
err28.emUsed = true;
}
}
}
for(const key3 in emErrors2){
for(const keyProp2 in emErrors2[key3]){
emParamsErrors2 = emErrors2[key3][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates2[key3] && templates2[key3][keyProp2];
const err29 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema28.errorMessage[key3][keyProp2],schema:schema28.errorMessage,parentSchema:schema28,data:data4};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
}
const emErrs6 = [];
for(const err30 of vErrors){
if(!err30.emUsed){
emErrs6.push(err30);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
if(errors > 0){
const emErrors3 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates3 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err31 of vErrors){
if((((((err31.keyword !== "errorMessage") && (!err31.emUsed)) && (err31.instancePath === instancePath+"/quotas/contrib")) && (err31.keyword in emErrors3)) && (err31.schemaPath.indexOf("#/properties/quotas/properties/contrib") === 0)) && (/^\/[^\/]*$/.test(err31.schemaPath.slice(38)))){
emPropParams3 = obj0[err31.keyword];
emParamsErrors3 = emErrors3[err31.keyword][err31.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err31);
err31.emUsed = true;
}
}
}
for(const key4 in emErrors3){
for(const keyProp3 in emErrors3[key4]){
emParamsErrors3 = emErrors3[key4][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates3[key4] && templates3[key4][keyProp3];
const err32 = {instancePath:instancePath+"/quotas/contrib",schemaPath:"#/properties/quotas/properties/contrib/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema27.properties.quotas.properties.contrib.errorMessage[key4][keyProp3],schema:schema27.properties.quotas.properties.contrib.errorMessage,parentSchema:schema27.properties.quotas.properties.contrib,data:data4};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
}
const emErrs7 = [];
for(const err33 of vErrors){
if(!err33.emUsed){
emErrs7.push(err33);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data0.user !== undefined){
let data7 = data0.user;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.unlimited === undefined){
const err34 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema28.required,parentSchema:schema28,data:data7};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data7.monthlyLimit === undefined){
const err35 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema28.required,parentSchema:schema28,data:data7};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data7.unlimited !== undefined){
let data8 = data7.unlimited;
if(typeof data8 !== "boolean"){
const err36 = {instancePath:instancePath+"/quotas/user/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.unlimited.type,parentSchema:schema28.properties.unlimited,data:data8};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err37 of vErrors){
if(!err37.emUsed){
emErrs8.push(err37);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
if(data7.monthlyLimit !== undefined){
let data9 = data7.monthlyLimit;
if(typeof data9 == "number"){
if(data9 < 0 || isNaN(data9)){
const err38 = {instancePath:instancePath+"/quotas/user/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28.properties.monthlyLimit,data:data9};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
else {
const err39 = {instancePath:instancePath+"/quotas/user/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.monthlyLimit.type,parentSchema:schema28.properties.monthlyLimit,data:data9};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err40 of vErrors){
if(!err40.emUsed){
emErrs9.push(err40);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
}
else {
const err41 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data7};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(errors > 0){
const emErrors4 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates4 = {required:{}};
let emPropParams4;
let emParamsErrors4;
for(const err42 of vErrors){
if((((((err42.keyword !== "errorMessage") && (!err42.emUsed)) && (err42.instancePath === instancePath+"/quotas/user")) && (err42.keyword in emErrors4)) && (err42.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err42.schemaPath.slice(23)))){
emPropParams4 = obj0[err42.keyword];
emParamsErrors4 = emErrors4[err42.keyword][err42.params[emPropParams4]];
if(emParamsErrors4){
emParamsErrors4.push(err42);
err42.emUsed = true;
}
}
}
for(const key5 in emErrors4){
for(const keyProp4 in emErrors4[key5]){
emParamsErrors4 = emErrors4[key5][keyProp4];
if(emParamsErrors4.length){
const tmpl4 = templates4[key5] && templates4[key5][keyProp4];
const err43 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema28.errorMessage[key5][keyProp4],schema:schema28.errorMessage,parentSchema:schema28,data:data7};
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
const emErrs10 = [];
for(const err44 of vErrors){
if(!err44.emUsed){
emErrs10.push(err44);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
if(errors > 0){
const emErrors5 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates5 = {required:{}};
let emPropParams5;
let emParamsErrors5;
for(const err45 of vErrors){
if((((((err45.keyword !== "errorMessage") && (!err45.emUsed)) && (err45.instancePath === instancePath+"/quotas/user")) && (err45.keyword in emErrors5)) && (err45.schemaPath.indexOf("#/properties/quotas/properties/user") === 0)) && (/^\/[^\/]*$/.test(err45.schemaPath.slice(35)))){
emPropParams5 = obj0[err45.keyword];
emParamsErrors5 = emErrors5[err45.keyword][err45.params[emPropParams5]];
if(emParamsErrors5){
emParamsErrors5.push(err45);
err45.emUsed = true;
}
}
}
for(const key6 in emErrors5){
for(const keyProp5 in emErrors5[key6]){
emParamsErrors5 = emErrors5[key6][keyProp5];
if(emParamsErrors5.length){
const tmpl5 = templates5[key6] && templates5[key6][keyProp5];
const err46 = {instancePath:instancePath+"/quotas/user",schemaPath:"#/properties/quotas/properties/user/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors5},message:tmpl5 ? tmpl5() : schema27.properties.quotas.properties.user.errorMessage[key6][keyProp5],schema:schema27.properties.quotas.properties.user.errorMessage,parentSchema:schema27.properties.quotas.properties.user,data:data7};
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
if(data0.external !== undefined){
let data10 = data0.external;
if(data10 && typeof data10 == "object" && !Array.isArray(data10)){
if(data10.unlimited === undefined){
const err48 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema28.required,parentSchema:schema28,data:data10};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data10.monthlyLimit === undefined){
const err49 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema28.required,parentSchema:schema28,data:data10};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(data10.unlimited !== undefined){
let data11 = data10.unlimited;
if(typeof data11 !== "boolean"){
const err50 = {instancePath:instancePath+"/quotas/external/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.unlimited.type,parentSchema:schema28.properties.unlimited,data:data11};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err51 of vErrors){
if(!err51.emUsed){
emErrs12.push(err51);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
if(data10.monthlyLimit !== undefined){
let data12 = data10.monthlyLimit;
if(typeof data12 == "number"){
if(data12 < 0 || isNaN(data12)){
const err52 = {instancePath:instancePath+"/quotas/external/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28.properties.monthlyLimit,data:data12};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
else {
const err53 = {instancePath:instancePath+"/quotas/external/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.monthlyLimit.type,parentSchema:schema28.properties.monthlyLimit,data:data12};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err54 of vErrors){
if(!err54.emUsed){
emErrs13.push(err54);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
}
else {
const err55 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data10};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(errors > 0){
const emErrors6 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates6 = {required:{}};
let emPropParams6;
let emParamsErrors6;
for(const err56 of vErrors){
if((((((err56.keyword !== "errorMessage") && (!err56.emUsed)) && (err56.instancePath === instancePath+"/quotas/external")) && (err56.keyword in emErrors6)) && (err56.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err56.schemaPath.slice(23)))){
emPropParams6 = obj0[err56.keyword];
emParamsErrors6 = emErrors6[err56.keyword][err56.params[emPropParams6]];
if(emParamsErrors6){
emParamsErrors6.push(err56);
err56.emUsed = true;
}
}
}
for(const key7 in emErrors6){
for(const keyProp6 in emErrors6[key7]){
emParamsErrors6 = emErrors6[key7][keyProp6];
if(emParamsErrors6.length){
const tmpl6 = templates6[key7] && templates6[key7][keyProp6];
const err57 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema28.errorMessage[key7][keyProp6],schema:schema28.errorMessage,parentSchema:schema28,data:data10};
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
const emErrs14 = [];
for(const err58 of vErrors){
if(!err58.emUsed){
emErrs14.push(err58);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
if(errors > 0){
const emErrors7 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates7 = {required:{}};
let emPropParams7;
let emParamsErrors7;
for(const err59 of vErrors){
if((((((err59.keyword !== "errorMessage") && (!err59.emUsed)) && (err59.instancePath === instancePath+"/quotas/external")) && (err59.keyword in emErrors7)) && (err59.schemaPath.indexOf("#/properties/quotas/properties/external") === 0)) && (/^\/[^\/]*$/.test(err59.schemaPath.slice(39)))){
emPropParams7 = obj0[err59.keyword];
emParamsErrors7 = emErrors7[err59.keyword][err59.params[emPropParams7]];
if(emParamsErrors7){
emParamsErrors7.push(err59);
err59.emUsed = true;
}
}
}
for(const key8 in emErrors7){
for(const keyProp7 in emErrors7[key8]){
emParamsErrors7 = emErrors7[key8][keyProp7];
if(emParamsErrors7.length){
const tmpl7 = templates7[key8] && templates7[key8][keyProp7];
const err60 = {instancePath:instancePath+"/quotas/external",schemaPath:"#/properties/quotas/properties/external/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors7},message:tmpl7 ? tmpl7() : schema27.properties.quotas.properties.external.errorMessage[key8][keyProp7],schema:schema27.properties.quotas.properties.external.errorMessage,parentSchema:schema27.properties.quotas.properties.external,data:data10};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
}
const emErrs15 = [];
for(const err61 of vErrors){
if(!err61.emUsed){
emErrs15.push(err61);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
if(data0.anonymous !== undefined){
let data13 = data0.anonymous;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.unlimited === undefined){
const err62 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema28.required,parentSchema:schema28,data:data13};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(data13.monthlyLimit === undefined){
const err63 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema28.required,parentSchema:schema28,data:data13};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(data13.unlimited !== undefined){
let data14 = data13.unlimited;
if(typeof data14 !== "boolean"){
const err64 = {instancePath:instancePath+"/quotas/anonymous/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.unlimited.type,parentSchema:schema28.properties.unlimited,data:data14};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err65 of vErrors){
if(!err65.emUsed){
emErrs16.push(err65);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
if(data13.monthlyLimit !== undefined){
let data15 = data13.monthlyLimit;
if(typeof data15 == "number"){
if(data15 < 0 || isNaN(data15)){
const err66 = {instancePath:instancePath+"/quotas/anonymous/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28.properties.monthlyLimit,data:data15};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
else {
const err67 = {instancePath:instancePath+"/quotas/anonymous/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.monthlyLimit.type,parentSchema:schema28.properties.monthlyLimit,data:data15};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(errors > 0){
const emErrs17 = [];
for(const err68 of vErrors){
if(!err68.emUsed){
emErrs17.push(err68);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
}
}
else {
const err69 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data13};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(errors > 0){
const emErrors8 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates8 = {required:{}};
let emPropParams8;
let emParamsErrors8;
for(const err70 of vErrors){
if((((((err70.keyword !== "errorMessage") && (!err70.emUsed)) && (err70.instancePath === instancePath+"/quotas/anonymous")) && (err70.keyword in emErrors8)) && (err70.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err70.schemaPath.slice(23)))){
emPropParams8 = obj0[err70.keyword];
emParamsErrors8 = emErrors8[err70.keyword][err70.params[emPropParams8]];
if(emParamsErrors8){
emParamsErrors8.push(err70);
err70.emUsed = true;
}
}
}
for(const key9 in emErrors8){
for(const keyProp8 in emErrors8[key9]){
emParamsErrors8 = emErrors8[key9][keyProp8];
if(emParamsErrors8.length){
const tmpl8 = templates8[key9] && templates8[key9][keyProp8];
const err71 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors8},message:tmpl8 ? tmpl8() : schema28.errorMessage[key9][keyProp8],schema:schema28.errorMessage,parentSchema:schema28,data:data13};
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
const emErrs18 = [];
for(const err72 of vErrors){
if(!err72.emUsed){
emErrs18.push(err72);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
if(errors > 0){
const emErrors9 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates9 = {required:{}};
let emPropParams9;
let emParamsErrors9;
for(const err73 of vErrors){
if((((((err73.keyword !== "errorMessage") && (!err73.emUsed)) && (err73.instancePath === instancePath+"/quotas/anonymous")) && (err73.keyword in emErrors9)) && (err73.schemaPath.indexOf("#/properties/quotas/properties/anonymous") === 0)) && (/^\/[^\/]*$/.test(err73.schemaPath.slice(40)))){
emPropParams9 = obj0[err73.keyword];
emParamsErrors9 = emErrors9[err73.keyword][err73.params[emPropParams9]];
if(emParamsErrors9){
emParamsErrors9.push(err73);
err73.emUsed = true;
}
}
}
for(const key10 in emErrors9){
for(const keyProp9 in emErrors9[key10]){
emParamsErrors9 = emErrors9[key10][keyProp9];
if(emParamsErrors9.length){
const tmpl9 = templates9[key10] && templates9[key10][keyProp9];
const err74 = {instancePath:instancePath+"/quotas/anonymous",schemaPath:"#/properties/quotas/properties/anonymous/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors9},message:tmpl9 ? tmpl9() : schema27.properties.quotas.properties.anonymous.errorMessage[key10][keyProp9],schema:schema27.properties.quotas.properties.anonymous.errorMessage,parentSchema:schema27.properties.quotas.properties.anonymous,data:data13};
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
if(data0.untrusted !== undefined){
let data16 = data0.untrusted;
if(data16 && typeof data16 == "object" && !Array.isArray(data16)){
if(data16.unlimited === undefined){
const err76 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "unlimited"},message:"must have required property '"+"unlimited"+"'",schema:schema28.required,parentSchema:schema28,data:data16};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
if(data16.monthlyLimit === undefined){
const err77 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/required",keyword:"required",params:{missingProperty: "monthlyLimit"},message:"must have required property '"+"monthlyLimit"+"'",schema:schema28.required,parentSchema:schema28,data:data16};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(data16.unlimited !== undefined){
let data17 = data16.unlimited;
if(typeof data17 !== "boolean"){
const err78 = {instancePath:instancePath+"/quotas/untrusted/unlimited",schemaPath:"#/definitions/RoleQuota/properties/unlimited/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema28.properties.unlimited.type,parentSchema:schema28.properties.unlimited,data:data17};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err79 of vErrors){
if(!err79.emUsed){
emErrs20.push(err79);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
if(data16.monthlyLimit !== undefined){
let data18 = data16.monthlyLimit;
if(typeof data18 == "number"){
if(data18 < 0 || isNaN(data18)){
const err80 = {instancePath:instancePath+"/quotas/untrusted/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28.properties.monthlyLimit,data:data18};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
}
else {
const err81 = {instancePath:instancePath+"/quotas/untrusted/monthlyLimit",schemaPath:"#/definitions/RoleQuota/properties/monthlyLimit/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.properties.monthlyLimit.type,parentSchema:schema28.properties.monthlyLimit,data:data18};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(errors > 0){
const emErrs21 = [];
for(const err82 of vErrors){
if(!err82.emUsed){
emErrs21.push(err82);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
}
else {
const err83 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data16};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(errors > 0){
const emErrors10 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates10 = {required:{}};
let emPropParams10;
let emParamsErrors10;
for(const err84 of vErrors){
if((((((err84.keyword !== "errorMessage") && (!err84.emUsed)) && (err84.instancePath === instancePath+"/quotas/untrusted")) && (err84.keyword in emErrors10)) && (err84.schemaPath.indexOf("#/definitions/RoleQuota") === 0)) && (/^\/[^\/]*$/.test(err84.schemaPath.slice(23)))){
emPropParams10 = obj0[err84.keyword];
emParamsErrors10 = emErrors10[err84.keyword][err84.params[emPropParams10]];
if(emParamsErrors10){
emParamsErrors10.push(err84);
err84.emUsed = true;
}
}
}
for(const key11 in emErrors10){
for(const keyProp10 in emErrors10[key11]){
emParamsErrors10 = emErrors10[key11][keyProp10];
if(emParamsErrors10.length){
const tmpl10 = templates10[key11] && templates10[key11][keyProp10];
const err85 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/definitions/RoleQuota/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors10},message:tmpl10 ? tmpl10() : schema28.errorMessage[key11][keyProp10],schema:schema28.errorMessage,parentSchema:schema28,data:data16};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
}
const emErrs22 = [];
for(const err86 of vErrors){
if(!err86.emUsed){
emErrs22.push(err86);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
if(errors > 0){
const emErrors11 = {"required":{"unlimited":[],"monthlyLimit":[]}};
const templates11 = {required:{}};
let emPropParams11;
let emParamsErrors11;
for(const err87 of vErrors){
if((((((err87.keyword !== "errorMessage") && (!err87.emUsed)) && (err87.instancePath === instancePath+"/quotas/untrusted")) && (err87.keyword in emErrors11)) && (err87.schemaPath.indexOf("#/properties/quotas/properties/untrusted") === 0)) && (/^\/[^\/]*$/.test(err87.schemaPath.slice(40)))){
emPropParams11 = obj0[err87.keyword];
emParamsErrors11 = emErrors11[err87.keyword][err87.params[emPropParams11]];
if(emParamsErrors11){
emParamsErrors11.push(err87);
err87.emUsed = true;
}
}
}
for(const key12 in emErrors11){
for(const keyProp11 in emErrors11[key12]){
emParamsErrors11 = emErrors11[key12][keyProp11];
if(emParamsErrors11.length){
const tmpl11 = templates11[key12] && templates11[key12][keyProp11];
const err88 = {instancePath:instancePath+"/quotas/untrusted",schemaPath:"#/properties/quotas/properties/untrusted/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors11},message:tmpl11 ? tmpl11() : schema27.properties.quotas.properties.untrusted.errorMessage[key12][keyProp11],schema:schema27.properties.quotas.properties.untrusted.errorMessage,parentSchema:schema27.properties.quotas.properties.untrusted,data:data16};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
}
const emErrs23 = [];
for(const err89 of vErrors){
if(!err89.emUsed){
emErrs23.push(err89);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
}
}
else {
const err90 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.quotas.type,parentSchema:schema27.properties.quotas,data:data0};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
if(errors > 0){
const emErrors12 = {"required":{"admin":[],"contrib":[],"user":[],"external":[],"anonymous":[]}};
const templates12 = {required:{}};
let emPropParams12;
let emParamsErrors12;
for(const err91 of vErrors){
if((((((err91.keyword !== "errorMessage") && (!err91.emUsed)) && (err91.instancePath === instancePath+"/quotas")) && (err91.keyword in emErrors12)) && (err91.schemaPath.indexOf("#/properties/quotas") === 0)) && (/^\/[^\/]*$/.test(err91.schemaPath.slice(19)))){
emPropParams12 = obj0[err91.keyword];
emParamsErrors12 = emErrors12[err91.keyword][err91.params[emPropParams12]];
if(emParamsErrors12){
emParamsErrors12.push(err91);
err91.emUsed = true;
}
}
}
for(const key13 in emErrors12){
for(const keyProp12 in emErrors12[key13]){
emParamsErrors12 = emErrors12[key13][keyProp12];
if(emParamsErrors12.length){
const tmpl12 = templates12[key13] && templates12[key13][keyProp12];
const err92 = {instancePath:instancePath+"/quotas",schemaPath:"#/properties/quotas/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors12},message:tmpl12 ? tmpl12() : schema27.properties.quotas.errorMessage[key13][keyProp12],schema:schema27.properties.quotas.errorMessage,parentSchema:schema27.properties.quotas,data:data0};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
}
const emErrs24 = [];
for(const err93 of vErrors){
if(!err93.emUsed){
emErrs24.push(err93);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
}
else {
const err94 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err95 of vErrors){
if(!err95.emUsed){
emErrs25.push(err95);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(!(validate23(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
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
return (context.accountType === "organization")
}function expression2(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return (!parent.data.unlimited)
}
const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/settings/org-form-quotas#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/settings/org-form-quotas#": {
      title: "main",
      root: "https://github.com/data-fair/agents/settings/org-form-quotas#",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-quotas#",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/settings/org-form-quotas#": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/settings/org-form-quotas#",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-quotas#",
      pure: false,
      propertyKeys: ["quotas"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas": {
      title: "Role Quotas",
      key: "quotas",
      pointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas",
      pure: false,

      propertyKeys: [
        "admin",
        "contrib",
        "user",
        "external",
        "anonymous",
        "untrusted"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: undefined,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/admin",
        "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/contrib",
        "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/user",
        "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/external",
        "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/anonymous",
        "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/untrusted"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/admin": {
      title: "Admin quotas",
      key: "admin",
      pointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/admin",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/unlimited",
        "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/monthlyLimit"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/unlimited": {
      title: "Unlimited",
      key: "unlimited",
      pointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/unlimited",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/unlimited",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/monthlyLimit": {
      title: "Monthly Limit",
      key: "monthlyLimit",
      pointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/monthlyLimit",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/monthlyLimit",
      pure: false,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/contrib": {
      title: "Contributor quotas",
      key: "contrib",
      pointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/contrib",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/unlimited",
        "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/monthlyLimit"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/user": {
      title: "Simple user Quotas",
      key: "user",
      pointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/user",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/unlimited",
        "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/monthlyLimit"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/external": {
      title: "External user quotas",
      key: "external",
      pointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/external",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/unlimited",
        "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/monthlyLimit"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/anonymous": {
      title: "Anonymous user quotas",
      key: "anonymous",
      pointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/anonymous",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/unlimited",
        "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/monthlyLimit"
      ]
    },

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/untrusted": {
      title: "Anonymous + external pool",
      key: "untrusted",
      pointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/untrusted",
      refPointer: "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota",
      pure: false,
      propertyKeys: ["unlimited", "monthlyLimit"],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/unlimited",
        "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/monthlyLimit"
      ]
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/settings/org-form-quotas#": {
      title: null,
      comp: "section",

      children: [{
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

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas": {
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
          ref: 1
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
          ref: 1
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

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/admin": {
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

    "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/unlimited": {
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

    "https://github.com/data-fair/agents/settings/org-form-quotas#/definitions/RoleQuota/properties/monthlyLimit": {
      if: {
        type: "js-eval",
        expr: "!parent.data.unlimited",
        pure: false,
        dataAlias: "value",
        ref: 2
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

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/contrib": {
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

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/user": {
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

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/external": {
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

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/anonymous": {
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

    "https://github.com/data-fair/agents/settings/org-form-quotas#/properties/quotas/properties/untrusted": {
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
    "https://github.com/data-fair/agents/settings/org-form-quotas#": export0
  },

  validationErrors: {},

  expressions: [
    expression0,
    expression1,
    expression2
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
  
  "card": cardNode,
  
  "checkbox": checkboxNode,
  
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