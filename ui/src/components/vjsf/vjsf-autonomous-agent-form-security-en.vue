<script setup>
// @ts-nocheck

import { StatefulLayout } from '@json-layout/core/state'
import { ref, shallowRef, getCurrentInstance, useSlots, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

import Tree from '@koumoul/vjsf/components/tree.vue'
import { useVjsf, emits } from '@koumoul/vjsf/composables/use-vjsf.js'
import '@koumoul/vjsf/styles/vjsf.css'


import sectionNode from '@koumoul/vjsf/components/nodes/section.vue'

import radiogroupNode from '@koumoul/vjsf/components/nodes/radio-group.vue'

import listNode from '@koumoul/vjsf/components/nodes/list.vue'

import oneofselectNode from '@koumoul/vjsf/components/nodes/one-of-select.vue'

import selectNode from '@koumoul/vjsf/components/nodes/select.vue'

import textfieldNode from '@koumoul/vjsf/components/nodes/text-field.vue'


import localizeErrors from "ajv-i18n/localize/en/index.js";
import equal from "ajv/dist/runtime/equal.js";

const export0 = validate22;
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/lib/access-ref#/oneOf/0"};
const schema28 = {"title":"An organization member","layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode","errorMessage":{}},"type":{"type":"string","const":"user","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"Member","layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}/members","pure":true,"dataAlias":"value","ref":4},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":8},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":5},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":6},"itemIcon":{"type":"js-eval","expr":"`/simple-directory/api/avatars/user/${item.id}/avatar.png`","pure":true,"dataAlias":"item","ref":7}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0","errorMessage":{"required":{"mode":"required information","type":"required information","id":"required information"}}};
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
if(data.mode === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema28.required,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.required,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.required,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "mode") || (key0 === "type")) || (key0 === "id"))){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.mode !== undefined){
let data0 = data.mode;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.mode.type,parentSchema:schema28.properties.mode,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("member" !== data0){
const err5 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema28.properties.mode,data:data0};
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
if(data.type !== undefined){
let data1 = data.type;
if(typeof data1 !== "string"){
const err7 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.type.type,parentSchema:schema28.properties.type,data:data1};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if("user" !== data1){
const err8 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema28.properties.type,data:data1};
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
if(data.id !== undefined){
let data2 = data.id;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.id.type,parentSchema:schema28.properties.id,data:data2};
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
}
else {
const err12 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"mode":[],"type":[],"id":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err13 of vErrors){
if((((((err13.keyword !== "errorMessage") && (!err13.emUsed)) && (err13.instancePath === instancePath)) && (err13.keyword in emErrors0)) && (err13.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref#/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err13.schemaPath.slice(52)))){
emPropParams0 = obj0[err13.keyword];
emParamsErrors0 = emErrors0[err13.keyword][err13.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err13);
err13.emUsed = true;
}
}
}
for(const key1 in emErrors0){
for(const keyProp0 in emErrors0[key1]){
emParamsErrors0 = emErrors0[key1][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key1] && templates0[key1][keyProp0];
const err14 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema28.errorMessage[key1][keyProp0],schema:schema28.errorMessage,parentSchema:schema28,data};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
}
const emErrs3 = [];
for(const err15 of vErrors){
if(!err15.emUsed){
emErrs3.push(err15);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export1 = validate24;
const schema29 = {"$id":"export1","$ref":"https://github.com/data-fair/lib/access-ref#/oneOf/1"};
const schema30 = {"title":"An email","required":["mode","type","email"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode","errorMessage":{}},"type":{"type":"string","const":"user","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type","errorMessage":{}},"email":{"type":"string","format":"email","title":"Email address","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1","errorMessage":{"required":{"mode":"required information","type":"required information","email":"required information"}}};
const formats0 = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

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
if(data.mode === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema30.required,parentSchema:schema30,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema30.required,parentSchema:schema30,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.email === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/required",keyword:"required",params:{missingProperty: "email"},message:"must have required property '"+"email"+"'",schema:schema30.required,parentSchema:schema30,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "mode") || (key0 === "type")) || (key0 === "email"))){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema30,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.mode !== undefined){
let data0 = data.mode;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.properties.mode.type,parentSchema:schema30.properties.mode,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("member" !== data0){
const err5 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema30.properties.mode,data:data0};
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
if(data.type !== undefined){
let data1 = data.type;
if(typeof data1 !== "string"){
const err7 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.properties.type.type,parentSchema:schema30.properties.type,data:data1};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if("user" !== data1){
const err8 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema30.properties.type,data:data1};
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
if(data.email !== undefined){
let data2 = data.email;
if(typeof data2 === "string"){
if(!(formats0.test(data2))){
const err10 = {instancePath:instancePath+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email/format",keyword:"format",params:{format: "email"},message:"must match format \""+"email"+"\"",schema:"email",parentSchema:schema30.properties.email,data:data2};
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
const err11 = {instancePath:instancePath+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.properties.email.type,parentSchema:schema30.properties.email,data:data2};
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
}
else {
const err13 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema30.type,parentSchema:schema30,data};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"mode":[],"type":[],"email":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err14 of vErrors){
if((((((err14.keyword !== "errorMessage") && (!err14.emUsed)) && (err14.instancePath === instancePath)) && (err14.keyword in emErrors0)) && (err14.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref#/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err14.schemaPath.slice(52)))){
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema30.errorMessage[key1][keyProp0],schema:schema30.errorMessage,parentSchema:schema30,data};
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
const emErrs3 = [];
for(const err16 of vErrors){
if(!err16.emUsed){
emErrs3.push(err16);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export2 = validate25;
const schema31 = {"$id":"export2","$ref":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items"};
const schema32 = {"type":"string","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items","errorMessage":{}};

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
if(typeof data !== "string"){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema32.type,parentSchema:schema32,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err1 of vErrors){
if(!err1.emUsed){
emErrs0.push(err1);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"dynamicProps":false,"dynamicItems":false};

const export3 = validate26;
const schema33 = {"$id":"export3","$ref":"https://github.com/data-fair/lib/access-ref#/oneOf/2"};
const schema34 = {"title":"A partner organization","layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode","errorMessage":{}},"type":{"type":"string","const":"organization","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type","errorMessage":{}},"department":{"type":"string","const":"*","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department","errorMessage":{}},"roles":{"type":"array","const":[],"items":{"type":"string","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles","errorMessage":{}},"id":{"type":"string","title":"Partner","layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}","pure":true,"dataAlias":"value","ref":9},"itemsResults":{"type":"js-eval","expr":"data.partners","pure":true,"dataAlias":"body","ref":11},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":5},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":6},"itemIcon":{"type":"js-eval","expr":"`/simple-directory/api/avatars/organization/${item.id}/avatar.png`","pure":true,"dataAlias":"item","ref":10}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/id","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2","errorMessage":{"required":{"mode":"required information","type":"required information","id":"required information"}}};
const func0 = equal;

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
if(data.mode === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema34.required,parentSchema:schema34,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema34.required,parentSchema:schema34,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema34.required,parentSchema:schema34,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "mode") || (key0 === "type")) || (key0 === "department")) || (key0 === "roles")) || (key0 === "id"))){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema34,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.mode !== undefined){
let data0 = data.mode;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema34.properties.mode.type,parentSchema:schema34.properties.mode,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("member" !== data0){
const err5 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema34.properties.mode,data:data0};
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
if(data.type !== undefined){
let data1 = data.type;
if(typeof data1 !== "string"){
const err7 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema34.properties.type.type,parentSchema:schema34.properties.type,data:data1};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if("organization" !== data1){
const err8 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant",schema:"organization",parentSchema:schema34.properties.type,data:data1};
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
if(data.department !== undefined){
let data2 = data.department;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema34.properties.department.type,parentSchema:schema34.properties.department,data:data2};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if("*" !== data2){
const err11 = {instancePath:instancePath+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema34.properties.department,data:data2};
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
if(data.roles !== undefined){
let data3 = data.roles;
if(!func0(data3, schema34.properties.roles.const)){
const err13 = {instancePath:instancePath+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/const",keyword:"const",params:{allowedValue: schema34.properties.roles.const},message:"must be equal to constant",schema:schema34.properties.roles.const,parentSchema:schema34.properties.roles,data:data3};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
let data4 = data3[i0];
if(typeof data4 !== "string"){
const err14 = {instancePath:instancePath+"/roles/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema34.properties.roles.items.type,parentSchema:schema34.properties.roles.items,data:data4};
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
}
else {
const err16 = {instancePath:instancePath+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema34.properties.roles.type,parentSchema:schema34.properties.roles,data:data3};
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
if(data.id !== undefined){
let data5 = data.id;
if(typeof data5 !== "string"){
const err18 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema34.properties.id.type,parentSchema:schema34.properties.id,data:data5};
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
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema34.type,parentSchema:schema34,data};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"mode":[],"type":[],"id":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err21 of vErrors){
if((((((err21.keyword !== "errorMessage") && (!err21.emUsed)) && (err21.instancePath === instancePath)) && (err21.keyword in emErrors0)) && (err21.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref#/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err21.schemaPath.slice(52)))){
emPropParams0 = obj0[err21.keyword];
emParamsErrors0 = emErrors0[err21.keyword][err21.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err21);
err21.emUsed = true;
}
}
}
for(const key1 in emErrors0){
for(const keyProp0 in emErrors0[key1]){
emParamsErrors0 = emErrors0[key1][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key1] && templates0[key1][keyProp0];
const err22 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema34.errorMessage[key1][keyProp0],schema:schema34.errorMessage,parentSchema:schema34,data};
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
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export4 = validate27;
const schema35 = {"$id":"export4","$ref":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items"};
const schema36 = {"type":"string","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items","errorMessage":{}};

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
if(typeof data !== "string"){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema36.type,parentSchema:schema36,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err1 of vErrors){
if(!err1.emUsed){
emErrs0.push(err1);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
validate27.errors = vErrors;
return errors === 0;
}
validate27.evaluated = {"dynamicProps":false,"dynamicItems":false};

const export5 = validate28;
const schema37 = {"$id":"export5","$ref":"https://github.com/data-fair/lib/access-ref#/oneOf/3"};
const schema38 = {"title":"A role or department of my organization","layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"internal","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode","errorMessage":{}},"type":{"type":"string","const":"organization","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","layout":{"comp":"none","getConstData":"context.owner.id"},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/id","errorMessage":{}},"department":{"type":"string","title":"Department","layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}","pure":true,"dataAlias":"value","ref":9},"itemsResults":{"type":"js-eval","expr":"[...(data.departments || []), {id: \"*\", name: \"Tous les départements\"}, {id: \"-\", name: \"Racine de l'organisation uniquement\"}]","pure":true,"dataAlias":"body","ref":12},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":5},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":6}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/department","errorMessage":{}},"roles":{"type":"array","title":"Roles","items":{"type":"string","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items","errorMessage":{}},"layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}","pure":true,"dataAlias":"value","ref":9},"itemsResults":{"type":"js-eval","expr":"data.roles","pure":true,"dataAlias":"body","ref":13}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3","errorMessage":{"required":{"mode":"required information","type":"required information","id":"required information"}}};

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
if(data.mode === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema38.required,parentSchema:schema38,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema38.required,parentSchema:schema38,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema38.required,parentSchema:schema38,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "mode") || (key0 === "type")) || (key0 === "id")) || (key0 === "department")) || (key0 === "roles"))){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema38,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.mode !== undefined){
let data0 = data.mode;
if(typeof data0 !== "string"){
const err4 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema38.properties.mode.type,parentSchema:schema38.properties.mode,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("internal" !== data0){
const err5 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode/const",keyword:"const",params:{allowedValue: "internal"},message:"must be equal to constant",schema:"internal",parentSchema:schema38.properties.mode,data:data0};
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
if(data.type !== undefined){
let data1 = data.type;
if(typeof data1 !== "string"){
const err7 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema38.properties.type.type,parentSchema:schema38.properties.type,data:data1};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if("organization" !== data1){
const err8 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant",schema:"organization",parentSchema:schema38.properties.type,data:data1};
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
if(data.id !== undefined){
let data2 = data.id;
if(typeof data2 !== "string"){
const err10 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema38.properties.id.type,parentSchema:schema38.properties.id,data:data2};
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
if(data.department !== undefined){
let data3 = data.department;
if(typeof data3 !== "string"){
const err12 = {instancePath:instancePath+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema38.properties.department.type,parentSchema:schema38.properties.department,data:data3};
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
if(data.roles !== undefined){
let data4 = data.roles;
if(Array.isArray(data4)){
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
let data5 = data4[i0];
if(typeof data5 !== "string"){
const err14 = {instancePath:instancePath+"/roles/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema38.properties.roles.items.type,parentSchema:schema38.properties.roles.items,data:data5};
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
const err16 = {instancePath:instancePath+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema38.properties.roles.type,parentSchema:schema38.properties.roles,data:data4};
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
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema38.type,parentSchema:schema38,data};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"mode":[],"type":[],"id":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err19 of vErrors){
if((((((err19.keyword !== "errorMessage") && (!err19.emUsed)) && (err19.instancePath === instancePath)) && (err19.keyword in emErrors0)) && (err19.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref#/oneOf/3") === 0)) && (/^\/[^\/]*$/.test(err19.schemaPath.slice(52)))){
emPropParams0 = obj0[err19.keyword];
emParamsErrors0 = emErrors0[err19.keyword][err19.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err19);
err19.emUsed = true;
}
}
}
for(const key1 in emErrors0){
for(const keyProp0 in emErrors0[key1]){
emParamsErrors0 = emErrors0[key1][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key1] && templates0[key1][keyProp0];
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema38.errorMessage[key1][keyProp0],schema:schema38.errorMessage,parentSchema:schema38,data};
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
validate28.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export6 = validate29;
const schema39 = {"$id":"export6","$ref":"https://github.com/data-fair/lib/access-ref#"};
const schema27 = {"$id":"https://github.com/data-fair/lib/access-ref","x-exports":["types","validate"],"title":"Access Ref","type":"object","discriminator":{"propertyName":"mode"},"oneOfLayout":{"emptyData":true},"oneOf":[{"title":"An organization member","layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode","errorMessage":{}},"type":{"type":"string","const":"user","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"Member","layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}/members","pure":true,"dataAlias":"value","ref":4},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":8},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":5},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":6},"itemIcon":{"type":"js-eval","expr":"`/simple-directory/api/avatars/user/${item.id}/avatar.png`","pure":true,"dataAlias":"item","ref":7}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0","errorMessage":{"required":{"mode":"required information","type":"required information","id":"required information"}}},{"title":"An email","required":["mode","type","email"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode","errorMessage":{}},"type":{"type":"string","const":"user","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type","errorMessage":{}},"email":{"type":"string","format":"email","title":"Email address","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1","errorMessage":{"required":{"mode":"required information","type":"required information","email":"required information"}}},{"title":"A partner organization","layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode","errorMessage":{}},"type":{"type":"string","const":"organization","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type","errorMessage":{}},"department":{"type":"string","const":"*","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department","errorMessage":{}},"roles":{"type":"array","const":[],"items":{"type":"string","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles","errorMessage":{}},"id":{"type":"string","title":"Partner","layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}","pure":true,"dataAlias":"value","ref":9},"itemsResults":{"type":"js-eval","expr":"data.partners","pure":true,"dataAlias":"body","ref":11},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":5},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":6},"itemIcon":{"type":"js-eval","expr":"`/simple-directory/api/avatars/organization/${item.id}/avatar.png`","pure":true,"dataAlias":"item","ref":10}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/id","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2","errorMessage":{"required":{"mode":"required information","type":"required information","id":"required information"}}},{"title":"A role or department of my organization","layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"internal","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode","errorMessage":{}},"type":{"type":"string","const":"organization","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","layout":{"comp":"none","getConstData":"context.owner.id"},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/id","errorMessage":{}},"department":{"type":"string","title":"Department","layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}","pure":true,"dataAlias":"value","ref":9},"itemsResults":{"type":"js-eval","expr":"[...(data.departments || []), {id: \"*\", name: \"Tous les départements\"}, {id: \"-\", name: \"Racine de l'organisation uniquement\"}]","pure":true,"dataAlias":"body","ref":12},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":5},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":6}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/department","errorMessage":{}},"roles":{"type":"array","title":"Roles","items":{"type":"string","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items","errorMessage":{}},"layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}","pure":true,"dataAlias":"value","ref":9},"itemsResults":{"type":"js-eval","expr":"data.roles","pure":true,"dataAlias":"body","ref":13}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3","errorMessage":{"required":{"mode":"required information","type":"required information","id":"required information"}}}],"__pointer":"https://github.com/data-fair/lib/access-ref","errorMessage":{"oneOf":"chose one"}};

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
if(!(data && typeof data == "object" && !Array.isArray(data))){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
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
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.mode === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema27.oneOf[0].required,parentSchema:schema27.oneOf[0],data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.type === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.oneOf[0].required,parentSchema:schema27.oneOf[0],data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.id === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.oneOf[0].required,parentSchema:schema27.oneOf[0],data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "mode") || (key0 === "type")) || (key0 === "id"))){
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27.oneOf[0],data};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.mode !== undefined){
let data0 = data.mode;
if(typeof data0 !== "string"){
const err5 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[0].properties.mode.type,parentSchema:schema27.oneOf[0].properties.mode,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("member" !== data0){
const err6 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema27.oneOf[0].properties.mode,data:data0};
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
if(data.type !== undefined){
let data1 = data.type;
if(typeof data1 !== "string"){
const err8 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[0].properties.type.type,parentSchema:schema27.oneOf[0].properties.type,data:data1};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if("user" !== data1){
const err9 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema27.oneOf[0].properties.type,data:data1};
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
if(data.id !== undefined){
let data2 = data.id;
if(typeof data2 !== "string"){
const err11 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[0].properties.id.type,parentSchema:schema27.oneOf[0].properties.id,data:data2};
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
}
else {
const err13 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.oneOf[0].type,parentSchema:schema27.oneOf[0],data};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"mode":[],"type":[],"id":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err14 of vErrors){
if((((((err14.keyword !== "errorMessage") && (!err14.emUsed)) && (err14.instancePath === instancePath)) && (err14.keyword in emErrors0)) && (err14.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref#/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err14.schemaPath.slice(52)))){
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.oneOf[0].errorMessage[key1][keyProp0],schema:schema27.oneOf[0].errorMessage,parentSchema:schema27.oneOf[0],data};
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
const emErrs3 = [];
for(const err16 of vErrors){
if(!err16.emUsed){
emErrs3.push(err16);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
var _valid0 = _errs3 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
var props0 = true;
}
const _errs12 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.mode === undefined){
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema27.oneOf[1].required,parentSchema:schema27.oneOf[1],data};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.type === undefined){
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.oneOf[1].required,parentSchema:schema27.oneOf[1],data};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.email === undefined){
const err19 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/required",keyword:"required",params:{missingProperty: "email"},message:"must have required property '"+"email"+"'",schema:schema27.oneOf[1].required,parentSchema:schema27.oneOf[1],data};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
for(const key2 in data){
if(!(((key2 === "mode") || (key2 === "type")) || (key2 === "email"))){
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties",schema:false,parentSchema:schema27.oneOf[1],data};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.mode !== undefined){
let data3 = data.mode;
if(typeof data3 !== "string"){
const err21 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[1].properties.mode.type,parentSchema:schema27.oneOf[1].properties.mode,data:data3};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if("member" !== data3){
const err22 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema27.oneOf[1].properties.mode,data:data3};
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
if(data.type !== undefined){
let data4 = data.type;
if(typeof data4 !== "string"){
const err24 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[1].properties.type.type,parentSchema:schema27.oneOf[1].properties.type,data:data4};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if("user" !== data4){
const err25 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema27.oneOf[1].properties.type,data:data4};
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
if(data.email !== undefined){
let data5 = data.email;
if(typeof data5 === "string"){
if(!(formats0.test(data5))){
const err27 = {instancePath:instancePath+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email/format",keyword:"format",params:{format: "email"},message:"must match format \""+"email"+"\"",schema:"email",parentSchema:schema27.oneOf[1].properties.email,data:data5};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
else {
const err28 = {instancePath:instancePath+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[1].properties.email.type,parentSchema:schema27.oneOf[1].properties.email,data:data5};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(errors > 0){
const emErrs6 = [];
for(const err29 of vErrors){
if(!err29.emUsed){
emErrs6.push(err29);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
}
else {
const err30 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.oneOf[1].type,parentSchema:schema27.oneOf[1],data};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"mode":[],"type":[],"email":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err31 of vErrors){
if((((((err31.keyword !== "errorMessage") && (!err31.emUsed)) && (err31.instancePath === instancePath)) && (err31.keyword in emErrors1)) && (err31.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref#/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err31.schemaPath.slice(52)))){
emPropParams1 = obj0[err31.keyword];
emParamsErrors1 = emErrors1[err31.keyword][err31.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err31);
err31.emUsed = true;
}
}
}
for(const key3 in emErrors1){
for(const keyProp1 in emErrors1[key3]){
emParamsErrors1 = emErrors1[key3][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key3] && templates1[key3][keyProp1];
const err32 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.oneOf[1].errorMessage[key3][keyProp1],schema:schema27.oneOf[1].errorMessage,parentSchema:schema27.oneOf[1],data};
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
var _valid0 = _errs12 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs21 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.mode === undefined){
const err34 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema27.oneOf[2].required,parentSchema:schema27.oneOf[2],data};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data.type === undefined){
const err35 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.oneOf[2].required,parentSchema:schema27.oneOf[2],data};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data.id === undefined){
const err36 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.oneOf[2].required,parentSchema:schema27.oneOf[2],data};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
for(const key4 in data){
if(!(((((key4 === "mode") || (key4 === "type")) || (key4 === "department")) || (key4 === "roles")) || (key4 === "id"))){
const err37 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties",schema:false,parentSchema:schema27.oneOf[2],data};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data.mode !== undefined){
let data6 = data.mode;
if(typeof data6 !== "string"){
const err38 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[2].properties.mode.type,parentSchema:schema27.oneOf[2].properties.mode,data:data6};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if("member" !== data6){
const err39 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema27.oneOf[2].properties.mode,data:data6};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(errors > 0){
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
if(data.type !== undefined){
let data7 = data.type;
if(typeof data7 !== "string"){
const err41 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[2].properties.type.type,parentSchema:schema27.oneOf[2].properties.type,data:data7};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if("organization" !== data7){
const err42 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant",schema:"organization",parentSchema:schema27.oneOf[2].properties.type,data:data7};
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
if(data.department !== undefined){
let data8 = data.department;
if(typeof data8 !== "string"){
const err44 = {instancePath:instancePath+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[2].properties.department.type,parentSchema:schema27.oneOf[2].properties.department,data:data8};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if("*" !== data8){
const err45 = {instancePath:instancePath+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema27.oneOf[2].properties.department,data:data8};
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
if(data.roles !== undefined){
let data9 = data.roles;
if(!func0(data9, schema27.oneOf[2].properties.roles.const)){
const err47 = {instancePath:instancePath+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/const",keyword:"const",params:{allowedValue: schema27.oneOf[2].properties.roles.const},message:"must be equal to constant",schema:schema27.oneOf[2].properties.roles.const,parentSchema:schema27.oneOf[2].properties.roles,data:data9};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(Array.isArray(data9)){
const len0 = data9.length;
for(let i0=0; i0<len0; i0++){
let data10 = data9[i0];
if(typeof data10 !== "string"){
const err48 = {instancePath:instancePath+"/roles/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[2].properties.roles.items.type,parentSchema:schema27.oneOf[2].properties.roles.items,data:data10};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(errors > 0){
const emErrs11 = [];
for(const err49 of vErrors){
if(!err49.emUsed){
emErrs11.push(err49);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
}
}
else {
const err50 = {instancePath:instancePath+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.oneOf[2].properties.roles.type,parentSchema:schema27.oneOf[2].properties.roles,data:data9};
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
if(data.id !== undefined){
let data11 = data.id;
if(typeof data11 !== "string"){
const err52 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[2].properties.id.type,parentSchema:schema27.oneOf[2].properties.id,data:data11};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err53 of vErrors){
if(!err53.emUsed){
emErrs13.push(err53);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
}
else {
const err54 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.oneOf[2].type,parentSchema:schema27.oneOf[2],data};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"mode":[],"type":[],"id":[]}};
const templates2 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err55 of vErrors){
if((((((err55.keyword !== "errorMessage") && (!err55.emUsed)) && (err55.instancePath === instancePath)) && (err55.keyword in emErrors2)) && (err55.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref#/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err55.schemaPath.slice(52)))){
emPropParams2 = obj0[err55.keyword];
emParamsErrors2 = emErrors2[err55.keyword][err55.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err55);
err55.emUsed = true;
}
}
}
for(const key5 in emErrors2){
for(const keyProp2 in emErrors2[key5]){
emParamsErrors2 = emErrors2[key5][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates2[key5] && templates2[key5][keyProp2];
const err56 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema27.oneOf[2].errorMessage[key5][keyProp2],schema:schema27.oneOf[2].errorMessage,parentSchema:schema27.oneOf[2],data};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
}
const emErrs14 = [];
for(const err57 of vErrors){
if(!err57.emUsed){
emErrs14.push(err57);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
var _valid0 = _errs21 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid1 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
const _errs36 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.mode === undefined){
const err58 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema27.oneOf[3].required,parentSchema:schema27.oneOf[3],data};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data.type === undefined){
const err59 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.oneOf[3].required,parentSchema:schema27.oneOf[3],data};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data.id === undefined){
const err60 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.oneOf[3].required,parentSchema:schema27.oneOf[3],data};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
for(const key6 in data){
if(!(((((key6 === "mode") || (key6 === "type")) || (key6 === "id")) || (key6 === "department")) || (key6 === "roles"))){
const err61 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties",schema:false,parentSchema:schema27.oneOf[3],data};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data.mode !== undefined){
let data12 = data.mode;
if(typeof data12 !== "string"){
const err62 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[3].properties.mode.type,parentSchema:schema27.oneOf[3].properties.mode,data:data12};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if("internal" !== data12){
const err63 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode/const",keyword:"const",params:{allowedValue: "internal"},message:"must be equal to constant",schema:"internal",parentSchema:schema27.oneOf[3].properties.mode,data:data12};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(errors > 0){
const emErrs15 = [];
for(const err64 of vErrors){
if(!err64.emUsed){
emErrs15.push(err64);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
if(data.type !== undefined){
let data13 = data.type;
if(typeof data13 !== "string"){
const err65 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[3].properties.type.type,parentSchema:schema27.oneOf[3].properties.type,data:data13};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if("organization" !== data13){
const err66 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant",schema:"organization",parentSchema:schema27.oneOf[3].properties.type,data:data13};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err67 of vErrors){
if(!err67.emUsed){
emErrs16.push(err67);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
if(data.id !== undefined){
let data14 = data.id;
if(typeof data14 !== "string"){
const err68 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[3].properties.id.type,parentSchema:schema27.oneOf[3].properties.id,data:data14};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(errors > 0){
const emErrs17 = [];
for(const err69 of vErrors){
if(!err69.emUsed){
emErrs17.push(err69);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
}
if(data.department !== undefined){
let data15 = data.department;
if(typeof data15 !== "string"){
const err70 = {instancePath:instancePath+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[3].properties.department.type,parentSchema:schema27.oneOf[3].properties.department,data:data15};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(errors > 0){
const emErrs18 = [];
for(const err71 of vErrors){
if(!err71.emUsed){
emErrs18.push(err71);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
}
if(data.roles !== undefined){
let data16 = data.roles;
if(Array.isArray(data16)){
const len1 = data16.length;
for(let i1=0; i1<len1; i1++){
let data17 = data16[i1];
if(typeof data17 !== "string"){
const err72 = {instancePath:instancePath+"/roles/" + i1,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[3].properties.roles.items.type,parentSchema:schema27.oneOf[3].properties.roles.items,data:data17};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(errors > 0){
const emErrs19 = [];
for(const err73 of vErrors){
if(!err73.emUsed){
emErrs19.push(err73);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
}
}
else {
const err74 = {instancePath:instancePath+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.oneOf[3].properties.roles.type,parentSchema:schema27.oneOf[3].properties.roles,data:data16};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err75 of vErrors){
if(!err75.emUsed){
emErrs20.push(err75);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
}
else {
const err76 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.oneOf[3].type,parentSchema:schema27.oneOf[3],data};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
if(errors > 0){
const emErrors3 = {"required":{"mode":[],"type":[],"id":[]}};
const templates3 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err77 of vErrors){
if((((((err77.keyword !== "errorMessage") && (!err77.emUsed)) && (err77.instancePath === instancePath)) && (err77.keyword in emErrors3)) && (err77.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref#/oneOf/3") === 0)) && (/^\/[^\/]*$/.test(err77.schemaPath.slice(52)))){
emPropParams3 = obj0[err77.keyword];
emParamsErrors3 = emErrors3[err77.keyword][err77.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err77);
err77.emUsed = true;
}
}
}
for(const key7 in emErrors3){
for(const keyProp3 in emErrors3[key7]){
emParamsErrors3 = emErrors3[key7][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates3[key7] && templates3[key7][keyProp3];
const err78 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema27.oneOf[3].errorMessage[key7][keyProp3],schema:schema27.oneOf[3].errorMessage,parentSchema:schema27.oneOf[3],data};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
}
const emErrs21 = [];
for(const err79 of vErrors){
if(!err79.emUsed){
emErrs21.push(err79);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
var _valid0 = _errs36 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid1 = true;
passing0 = 3;
if(props0 !== true){
props0 = true;
}
}
}
}
}
if(!valid1){
const err80 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema27.oneOf,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
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
const emErrors4 = {"oneOf":[]};
const templates4 = {};
for(const err81 of vErrors){
if((((((err81.keyword !== "errorMessage") && (!err81.emUsed)) && (err81.instancePath === instancePath)) && (err81.keyword in emErrors4)) && (err81.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref#") === 0)) && (/^\/[^\/]*$/.test(err81.schemaPath.slice(44)))){
emErrors4[err81.keyword].push(err81);
err81.emUsed = true;
}
}
for(const key8 in emErrors4){
if(emErrors4[key8].length){
const err82 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/errorMessage",keyword:"errorMessage",params:{errors: emErrors4[key8]},message:key8 in templates4 ? templates4[key8]() : schema27.errorMessage[key8],schema:schema27.errorMessage,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
const emErrs22 = [];
for(const err83 of vErrors){
if(!err83.emUsed){
emErrs22.push(err83);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
validate29.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate29.evaluated = {"dynamicProps":true,"dynamicItems":false};

const export7 = validate30;
const schema41 = {"$id":"export7","$ref":"https://github.com/data-fair/agents/autonomous-agent/form-security#"};
const schema42 = {"$id":"https://github.com/data-fair/agents/autonomous-agent/form-security","x-exports":["vjsf"],"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"required":[],"layout":{"title":null},"properties":{"approvalLevel":{"type":"string","default":"destructive","layout":"radio-group","title":"Ask for approval for","description":"A planned task has nobody to approve: tools that need approval are not offered to it.","oneOf":[{"const":"write","title":"Every operation that makes changes"},{"const":"destructive","title":"Only operations marked as particularly destructive"},{"const":"none","title":"None (the agent is fully autonomous in its tool calls)"}],"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/approvalLevel","errorMessage":{"oneOf":"chose one"}},"instructors":{"type":"array","default":[],"title":"Who may instruct","description":"Admins of the owning organization are always allowed. Anyone matched here borrows this autonomous agent's permissions.","items":{"$ref":"https://github.com/data-fair/lib/access-ref","__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/instructors/items","errorMessage":{"oneOf":"chose one"}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/instructors","errorMessage":{}},"role":{"type":"string","default":"user","title":"Role in the organization","description":"What the agent can do in the platform's services, like a member with this role.","layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}/roles","pure":true,"dataAlias":"value","ref":14}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/role","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-security#","errorMessage":{}};

function validate31(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://github.com/data-fair/agents/autonomous-agent/form-security" */;
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
for(const key0 in data){
if(!(((key0 === "approvalLevel") || (key0 === "instructors")) || (key0 === "role"))){
const err0 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
if(data.approvalLevel !== undefined){
let data0 = data.approvalLevel;
if(typeof data0 !== "string"){
const err1 = {instancePath:instancePath+"/approvalLevel",schemaPath:"#/properties/approvalLevel/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.approvalLevel.type,parentSchema:schema42.properties.approvalLevel,data:data0};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
const _errs4 = errors;
let valid1 = false;
let passing0 = null;
const _errs5 = errors;
if("write" !== data0){
const err2 = {instancePath:instancePath+"/approvalLevel",schemaPath:"#/properties/approvalLevel/oneOf/0/const",keyword:"const",params:{allowedValue: "write"},message:"must be equal to constant",schema:"write",parentSchema:schema42.properties.approvalLevel.oneOf[0],data:data0};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
var _valid0 = _errs5 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
}
const _errs6 = errors;
if("destructive" !== data0){
const err3 = {instancePath:instancePath+"/approvalLevel",schemaPath:"#/properties/approvalLevel/oneOf/1/const",keyword:"const",params:{allowedValue: "destructive"},message:"must be equal to constant",schema:"destructive",parentSchema:schema42.properties.approvalLevel.oneOf[1],data:data0};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
var _valid0 = _errs6 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
}
const _errs7 = errors;
if("none" !== data0){
const err4 = {instancePath:instancePath+"/approvalLevel",schemaPath:"#/properties/approvalLevel/oneOf/2/const",keyword:"const",params:{allowedValue: "none"},message:"must be equal to constant",schema:"none",parentSchema:schema42.properties.approvalLevel.oneOf[2],data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
var _valid0 = _errs7 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid1 = true;
passing0 = 2;
}
}
}
if(!valid1){
const err5 = {instancePath:instancePath+"/approvalLevel",schemaPath:"#/properties/approvalLevel/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema42.properties.approvalLevel.oneOf,parentSchema:schema42.properties.approvalLevel,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
else {
errors = _errs4;
if(vErrors !== null){
if(_errs4){
vErrors.length = _errs4;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors0 = {"oneOf":[]};
const templates0 = {};
for(const err6 of vErrors){
if((((((err6.keyword !== "errorMessage") && (!err6.emUsed)) && (err6.instancePath === instancePath+"/approvalLevel")) && (err6.keyword in emErrors0)) && (err6.schemaPath.indexOf("#/properties/approvalLevel") === 0)) && (/^\/[^\/]*$/.test(err6.schemaPath.slice(26)))){
emErrors0[err6.keyword].push(err6);
err6.emUsed = true;
}
}
for(const key1 in emErrors0){
if(emErrors0[key1].length){
const err7 = {instancePath:instancePath+"/approvalLevel",schemaPath:"#/properties/approvalLevel/errorMessage",keyword:"errorMessage",params:{errors: emErrors0[key1]},message:key1 in templates0 ? templates0[key1]() : schema42.properties.approvalLevel.errorMessage[key1],schema:schema42.properties.approvalLevel.errorMessage,parentSchema:schema42.properties.approvalLevel,data:data0};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
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
if(data.instructors !== undefined){
let data1 = data.instructors;
if(Array.isArray(data1)){
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(!(data2 && typeof data2 == "object" && !Array.isArray(data2))){
const err9 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data:data2};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
const _errs13 = errors;
let valid5 = false;
let passing1 = null;
const _errs14 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.mode === undefined){
const err10 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema27.oneOf[0].required,parentSchema:schema27.oneOf[0],data:data2};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data2.type === undefined){
const err11 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.oneOf[0].required,parentSchema:schema27.oneOf[0],data:data2};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data2.id === undefined){
const err12 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.oneOf[0].required,parentSchema:schema27.oneOf[0],data:data2};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key2 in data2){
if(!(((key2 === "mode") || (key2 === "type")) || (key2 === "id"))){
const err13 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties",schema:false,parentSchema:schema27.oneOf[0],data:data2};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data2.mode !== undefined){
let data3 = data2.mode;
if(typeof data3 !== "string"){
const err14 = {instancePath:instancePath+"/instructors/" + i0+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[0].properties.mode.type,parentSchema:schema27.oneOf[0].properties.mode,data:data3};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if("member" !== data3){
const err15 = {instancePath:instancePath+"/instructors/" + i0+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema27.oneOf[0].properties.mode,data:data3};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err16 of vErrors){
if(!err16.emUsed){
emErrs1.push(err16);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data2.type !== undefined){
let data4 = data2.type;
if(typeof data4 !== "string"){
const err17 = {instancePath:instancePath+"/instructors/" + i0+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[0].properties.type.type,parentSchema:schema27.oneOf[0].properties.type,data:data4};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if("user" !== data4){
const err18 = {instancePath:instancePath+"/instructors/" + i0+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema27.oneOf[0].properties.type,data:data4};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err19 of vErrors){
if(!err19.emUsed){
emErrs2.push(err19);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data2.id !== undefined){
let data5 = data2.id;
if(typeof data5 !== "string"){
const err20 = {instancePath:instancePath+"/instructors/" + i0+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[0].properties.id.type,parentSchema:schema27.oneOf[0].properties.id,data:data5};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(errors > 0){
const emErrs3 = [];
for(const err21 of vErrors){
if(!err21.emUsed){
emErrs3.push(err21);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
}
else {
const err22 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.oneOf[0].type,parentSchema:schema27.oneOf[0],data:data2};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"mode":[],"type":[],"id":[]}};
const templates1 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err23 of vErrors){
if((((((err23.keyword !== "errorMessage") && (!err23.emUsed)) && (err23.instancePath === instancePath+"/instructors/" + i0)) && (err23.keyword in emErrors1)) && (err23.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err23.schemaPath.slice(51)))){
emPropParams0 = obj0[err23.keyword];
emParamsErrors0 = emErrors1[err23.keyword][err23.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err23);
err23.emUsed = true;
}
}
}
for(const key3 in emErrors1){
for(const keyProp0 in emErrors1[key3]){
emParamsErrors0 = emErrors1[key3][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates1[key3] && templates1[key3][keyProp0];
const err24 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.oneOf[0].errorMessage[key3][keyProp0],schema:schema27.oneOf[0].errorMessage,parentSchema:schema27.oneOf[0],data:data2};
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
const emErrs4 = [];
for(const err25 of vErrors){
if(!err25.emUsed){
emErrs4.push(err25);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
var _valid1 = _errs14 === errors;
if(_valid1){
valid5 = true;
passing1 = 0;
var props0 = true;
}
const _errs23 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.mode === undefined){
const err26 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema27.oneOf[1].required,parentSchema:schema27.oneOf[1],data:data2};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data2.type === undefined){
const err27 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.oneOf[1].required,parentSchema:schema27.oneOf[1],data:data2};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data2.email === undefined){
const err28 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/required",keyword:"required",params:{missingProperty: "email"},message:"must have required property '"+"email"+"'",schema:schema27.oneOf[1].required,parentSchema:schema27.oneOf[1],data:data2};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
for(const key4 in data2){
if(!(((key4 === "mode") || (key4 === "type")) || (key4 === "email"))){
const err29 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties",schema:false,parentSchema:schema27.oneOf[1],data:data2};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data2.mode !== undefined){
let data6 = data2.mode;
if(typeof data6 !== "string"){
const err30 = {instancePath:instancePath+"/instructors/" + i0+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[1].properties.mode.type,parentSchema:schema27.oneOf[1].properties.mode,data:data6};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if("member" !== data6){
const err31 = {instancePath:instancePath+"/instructors/" + i0+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema27.oneOf[1].properties.mode,data:data6};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err32 of vErrors){
if(!err32.emUsed){
emErrs5.push(err32);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
if(data2.type !== undefined){
let data7 = data2.type;
if(typeof data7 !== "string"){
const err33 = {instancePath:instancePath+"/instructors/" + i0+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[1].properties.type.type,parentSchema:schema27.oneOf[1].properties.type,data:data7};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if("user" !== data7){
const err34 = {instancePath:instancePath+"/instructors/" + i0+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema27.oneOf[1].properties.type,data:data7};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(errors > 0){
const emErrs6 = [];
for(const err35 of vErrors){
if(!err35.emUsed){
emErrs6.push(err35);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
if(data2.email !== undefined){
let data8 = data2.email;
if(typeof data8 === "string"){
if(!(formats0.test(data8))){
const err36 = {instancePath:instancePath+"/instructors/" + i0+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/email/format",keyword:"format",params:{format: "email"},message:"must match format \""+"email"+"\"",schema:"email",parentSchema:schema27.oneOf[1].properties.email,data:data8};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
else {
const err37 = {instancePath:instancePath+"/instructors/" + i0+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/email/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[1].properties.email.type,parentSchema:schema27.oneOf[1].properties.email,data:data8};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err38 of vErrors){
if(!err38.emUsed){
emErrs7.push(err38);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
}
else {
const err39 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.oneOf[1].type,parentSchema:schema27.oneOf[1],data:data2};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"mode":[],"type":[],"email":[]}};
const templates2 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err40 of vErrors){
if((((((err40.keyword !== "errorMessage") && (!err40.emUsed)) && (err40.instancePath === instancePath+"/instructors/" + i0)) && (err40.keyword in emErrors2)) && (err40.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err40.schemaPath.slice(51)))){
emPropParams1 = obj0[err40.keyword];
emParamsErrors1 = emErrors2[err40.keyword][err40.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err40);
err40.emUsed = true;
}
}
}
for(const key5 in emErrors2){
for(const keyProp1 in emErrors2[key5]){
emParamsErrors1 = emErrors2[key5][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates2[key5] && templates2[key5][keyProp1];
const err41 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.oneOf[1].errorMessage[key5][keyProp1],schema:schema27.oneOf[1].errorMessage,parentSchema:schema27.oneOf[1],data:data2};
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
const emErrs8 = [];
for(const err42 of vErrors){
if(!err42.emUsed){
emErrs8.push(err42);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
var _valid1 = _errs23 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid5 = true;
passing1 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs32 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.mode === undefined){
const err43 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema27.oneOf[2].required,parentSchema:schema27.oneOf[2],data:data2};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(data2.type === undefined){
const err44 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.oneOf[2].required,parentSchema:schema27.oneOf[2],data:data2};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data2.id === undefined){
const err45 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.oneOf[2].required,parentSchema:schema27.oneOf[2],data:data2};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
for(const key6 in data2){
if(!(((((key6 === "mode") || (key6 === "type")) || (key6 === "department")) || (key6 === "roles")) || (key6 === "id"))){
const err46 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties",schema:false,parentSchema:schema27.oneOf[2],data:data2};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data2.mode !== undefined){
let data9 = data2.mode;
if(typeof data9 !== "string"){
const err47 = {instancePath:instancePath+"/instructors/" + i0+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[2].properties.mode.type,parentSchema:schema27.oneOf[2].properties.mode,data:data9};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if("member" !== data9){
const err48 = {instancePath:instancePath+"/instructors/" + i0+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema27.oneOf[2].properties.mode,data:data9};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err49 of vErrors){
if(!err49.emUsed){
emErrs9.push(err49);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
if(data2.type !== undefined){
let data10 = data2.type;
if(typeof data10 !== "string"){
const err50 = {instancePath:instancePath+"/instructors/" + i0+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[2].properties.type.type,parentSchema:schema27.oneOf[2].properties.type,data:data10};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if("organization" !== data10){
const err51 = {instancePath:instancePath+"/instructors/" + i0+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant",schema:"organization",parentSchema:schema27.oneOf[2].properties.type,data:data10};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err52 of vErrors){
if(!err52.emUsed){
emErrs10.push(err52);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
if(data2.department !== undefined){
let data11 = data2.department;
if(typeof data11 !== "string"){
const err53 = {instancePath:instancePath+"/instructors/" + i0+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[2].properties.department.type,parentSchema:schema27.oneOf[2].properties.department,data:data11};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if("*" !== data11){
const err54 = {instancePath:instancePath+"/instructors/" + i0+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/department/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema27.oneOf[2].properties.department,data:data11};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(errors > 0){
const emErrs11 = [];
for(const err55 of vErrors){
if(!err55.emUsed){
emErrs11.push(err55);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
}
if(data2.roles !== undefined){
let data12 = data2.roles;
if(!func0(data12, schema27.oneOf[2].properties.roles.const)){
const err56 = {instancePath:instancePath+"/instructors/" + i0+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/roles/const",keyword:"const",params:{allowedValue: schema27.oneOf[2].properties.roles.const},message:"must be equal to constant",schema:schema27.oneOf[2].properties.roles.const,parentSchema:schema27.oneOf[2].properties.roles,data:data12};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(Array.isArray(data12)){
const len1 = data12.length;
for(let i1=0; i1<len1; i1++){
let data13 = data12[i1];
if(typeof data13 !== "string"){
const err57 = {instancePath:instancePath+"/instructors/" + i0+"/roles/" + i1,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[2].properties.roles.items.type,parentSchema:schema27.oneOf[2].properties.roles.items,data:data13};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err58 of vErrors){
if(!err58.emUsed){
emErrs12.push(err58);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
}
else {
const err59 = {instancePath:instancePath+"/instructors/" + i0+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.oneOf[2].properties.roles.type,parentSchema:schema27.oneOf[2].properties.roles,data:data12};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err60 of vErrors){
if(!err60.emUsed){
emErrs13.push(err60);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
if(data2.id !== undefined){
let data14 = data2.id;
if(typeof data14 !== "string"){
const err61 = {instancePath:instancePath+"/instructors/" + i0+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[2].properties.id.type,parentSchema:schema27.oneOf[2].properties.id,data:data14};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(errors > 0){
const emErrs14 = [];
for(const err62 of vErrors){
if(!err62.emUsed){
emErrs14.push(err62);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
}
else {
const err63 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.oneOf[2].type,parentSchema:schema27.oneOf[2],data:data2};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(errors > 0){
const emErrors3 = {"required":{"mode":[],"type":[],"id":[]}};
const templates3 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err64 of vErrors){
if((((((err64.keyword !== "errorMessage") && (!err64.emUsed)) && (err64.instancePath === instancePath+"/instructors/" + i0)) && (err64.keyword in emErrors3)) && (err64.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err64.schemaPath.slice(51)))){
emPropParams2 = obj0[err64.keyword];
emParamsErrors2 = emErrors3[err64.keyword][err64.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err64);
err64.emUsed = true;
}
}
}
for(const key7 in emErrors3){
for(const keyProp2 in emErrors3[key7]){
emParamsErrors2 = emErrors3[key7][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates3[key7] && templates3[key7][keyProp2];
const err65 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema27.oneOf[2].errorMessage[key7][keyProp2],schema:schema27.oneOf[2].errorMessage,parentSchema:schema27.oneOf[2],data:data2};
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
const emErrs15 = [];
for(const err66 of vErrors){
if(!err66.emUsed){
emErrs15.push(err66);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
var _valid1 = _errs32 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid5 = true;
passing1 = 2;
if(props0 !== true){
props0 = true;
}
}
const _errs47 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.mode === undefined){
const err67 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema27.oneOf[3].required,parentSchema:schema27.oneOf[3],data:data2};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(data2.type === undefined){
const err68 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.oneOf[3].required,parentSchema:schema27.oneOf[3],data:data2};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(data2.id === undefined){
const err69 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema27.oneOf[3].required,parentSchema:schema27.oneOf[3],data:data2};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
for(const key8 in data2){
if(!(((((key8 === "mode") || (key8 === "type")) || (key8 === "id")) || (key8 === "department")) || (key8 === "roles"))){
const err70 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties",schema:false,parentSchema:schema27.oneOf[3],data:data2};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data2.mode !== undefined){
let data15 = data2.mode;
if(typeof data15 !== "string"){
const err71 = {instancePath:instancePath+"/instructors/" + i0+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[3].properties.mode.type,parentSchema:schema27.oneOf[3].properties.mode,data:data15};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if("internal" !== data15){
const err72 = {instancePath:instancePath+"/instructors/" + i0+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/mode/const",keyword:"const",params:{allowedValue: "internal"},message:"must be equal to constant",schema:"internal",parentSchema:schema27.oneOf[3].properties.mode,data:data15};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err73 of vErrors){
if(!err73.emUsed){
emErrs16.push(err73);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
if(data2.type !== undefined){
let data16 = data2.type;
if(typeof data16 !== "string"){
const err74 = {instancePath:instancePath+"/instructors/" + i0+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[3].properties.type.type,parentSchema:schema27.oneOf[3].properties.type,data:data16};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if("organization" !== data16){
const err75 = {instancePath:instancePath+"/instructors/" + i0+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant",schema:"organization",parentSchema:schema27.oneOf[3].properties.type,data:data16};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if(errors > 0){
const emErrs17 = [];
for(const err76 of vErrors){
if(!err76.emUsed){
emErrs17.push(err76);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
}
if(data2.id !== undefined){
let data17 = data2.id;
if(typeof data17 !== "string"){
const err77 = {instancePath:instancePath+"/instructors/" + i0+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[3].properties.id.type,parentSchema:schema27.oneOf[3].properties.id,data:data17};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(errors > 0){
const emErrs18 = [];
for(const err78 of vErrors){
if(!err78.emUsed){
emErrs18.push(err78);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
}
if(data2.department !== undefined){
let data18 = data2.department;
if(typeof data18 !== "string"){
const err79 = {instancePath:instancePath+"/instructors/" + i0+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[3].properties.department.type,parentSchema:schema27.oneOf[3].properties.department,data:data18};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(errors > 0){
const emErrs19 = [];
for(const err80 of vErrors){
if(!err80.emUsed){
emErrs19.push(err80);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
}
if(data2.roles !== undefined){
let data19 = data2.roles;
if(Array.isArray(data19)){
const len2 = data19.length;
for(let i2=0; i2<len2; i2++){
let data20 = data19[i2];
if(typeof data20 !== "string"){
const err81 = {instancePath:instancePath+"/instructors/" + i0+"/roles/" + i2,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.oneOf[3].properties.roles.items.type,parentSchema:schema27.oneOf[3].properties.roles.items,data:data20};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err82 of vErrors){
if(!err82.emUsed){
emErrs20.push(err82);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
}
else {
const err83 = {instancePath:instancePath+"/instructors/" + i0+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.oneOf[3].properties.roles.type,parentSchema:schema27.oneOf[3].properties.roles,data:data19};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(errors > 0){
const emErrs21 = [];
for(const err84 of vErrors){
if(!err84.emUsed){
emErrs21.push(err84);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
}
else {
const err85 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.oneOf[3].type,parentSchema:schema27.oneOf[3],data:data2};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
if(errors > 0){
const emErrors4 = {"required":{"mode":[],"type":[],"id":[]}};
const templates4 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err86 of vErrors){
if((((((err86.keyword !== "errorMessage") && (!err86.emUsed)) && (err86.instancePath === instancePath+"/instructors/" + i0)) && (err86.keyword in emErrors4)) && (err86.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref/oneOf/3") === 0)) && (/^\/[^\/]*$/.test(err86.schemaPath.slice(51)))){
emPropParams3 = obj0[err86.keyword];
emParamsErrors3 = emErrors4[err86.keyword][err86.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err86);
err86.emUsed = true;
}
}
}
for(const key9 in emErrors4){
for(const keyProp3 in emErrors4[key9]){
emParamsErrors3 = emErrors4[key9][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates4[key9] && templates4[key9][keyProp3];
const err87 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema27.oneOf[3].errorMessage[key9][keyProp3],schema:schema27.oneOf[3].errorMessage,parentSchema:schema27.oneOf[3],data:data2};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
}
const emErrs22 = [];
for(const err88 of vErrors){
if(!err88.emUsed){
emErrs22.push(err88);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
var _valid1 = _errs47 === errors;
if(_valid1 && valid5){
valid5 = false;
passing1 = [passing1, 3];
}
else {
if(_valid1){
valid5 = true;
passing1 = 3;
if(props0 !== true){
props0 = true;
}
}
}
}
}
if(!valid5){
const err89 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf",schema:schema27.oneOf,parentSchema:schema27,data:data2};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
else {
errors = _errs13;
if(vErrors !== null){
if(_errs13){
vErrors.length = _errs13;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors5 = {"oneOf":[]};
const templates5 = {};
for(const err90 of vErrors){
if((((((err90.keyword !== "errorMessage") && (!err90.emUsed)) && (err90.instancePath === instancePath+"/instructors/" + i0)) && (err90.keyword in emErrors5)) && (err90.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref") === 0)) && (/^\/[^\/]*$/.test(err90.schemaPath.slice(43)))){
emErrors5[err90.keyword].push(err90);
err90.emUsed = true;
}
}
for(const key10 in emErrors5){
if(emErrors5[key10].length){
const err91 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref/errorMessage",keyword:"errorMessage",params:{errors: emErrors5[key10]},message:key10 in templates5 ? templates5[key10]() : schema27.errorMessage[key10],schema:schema27.errorMessage,parentSchema:schema27,data:data2};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
const emErrs23 = [];
for(const err92 of vErrors){
if(!err92.emUsed){
emErrs23.push(err92);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
if(errors > 0){
const emErrors6 = {"oneOf":[]};
const templates6 = {};
for(const err93 of vErrors){
if((((((err93.keyword !== "errorMessage") && (!err93.emUsed)) && (err93.instancePath === instancePath+"/instructors/" + i0)) && (err93.keyword in emErrors6)) && (err93.schemaPath.indexOf("#/properties/instructors/items") === 0)) && (/^\/[^\/]*$/.test(err93.schemaPath.slice(30)))){
emErrors6[err93.keyword].push(err93);
err93.emUsed = true;
}
}
for(const key11 in emErrors6){
if(emErrors6[key11].length){
const err94 = {instancePath:instancePath+"/instructors/" + i0,schemaPath:"#/properties/instructors/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors6[key11]},message:key11 in templates6 ? templates6[key11]() : schema42.properties.instructors.items.errorMessage[key11],schema:schema42.properties.instructors.items.errorMessage,parentSchema:schema42.properties.instructors.items,data:data2};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
const emErrs24 = [];
for(const err95 of vErrors){
if(!err95.emUsed){
emErrs24.push(err95);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
}
else {
const err96 = {instancePath:instancePath+"/instructors",schemaPath:"#/properties/instructors/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema42.properties.instructors.type,parentSchema:schema42.properties.instructors,data:data1};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err97 of vErrors){
if(!err97.emUsed){
emErrs25.push(err97);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
if(data.role !== undefined){
let data21 = data.role;
if(typeof data21 !== "string"){
const err98 = {instancePath:instancePath+"/role",schemaPath:"#/properties/role/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.role.type,parentSchema:schema42.properties.role,data:data21};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err99 of vErrors){
if(!err99.emUsed){
emErrs26.push(err99);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
}
else {
const err100 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema42.type,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
if(errors > 0){
const emErrs27 = [];
for(const err101 of vErrors){
if(!err101.emUsed){
emErrs27.push(err101);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
validate31.errors = vErrors;
return errors === 0;
}
validate31.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(!(validate31(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate31.errors : vErrors.concat(validate31.errors);
errors = vErrors.length;
}
validate30.errors = vErrors;
return errors === 0;
}
validate30.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
function expression0(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.defaultData)
}function expression1(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ([{"const":"write","title":"Every operation that makes changes","key":"write","value":"write"},{"const":"destructive","title":"Only operations marked as particularly destructive","key":"destructive","value":"destructive"},{"const":"none","title":"None (the agent is fully autonomous in its tool calls)","key":"none","value":"none"}])
}function expression2(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (context.owner.type === 'organization')
}function expression3(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.constData)
}function expression4(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `/simple-directory/api/organizations/${context.owner.id}/members`
}function expression5(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item.name)
}function expression6(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item.id)
}function expression7(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (`/simple-directory/api/avatars/user/${item.id}/avatar.png`)
}function expression8(data,body,options,context,display,layout,readOnly,summary,validates
) {
return (data.results)
}function expression9(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `/simple-directory/api/organizations/${context.owner.id}`
}function expression10(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (`/simple-directory/api/avatars/organization/${item.id}/avatar.png`)
}function expression11(data,body,options,context,display,layout,readOnly,summary,validates
) {
return (data.partners)
}function expression12(data,body,options,context,display,layout,readOnly,summary,validates
) {
return ([...(data.departments || []), {id: "*", name: "Tous les départements"}, {id: "-", name: "Racine de l'organisation uniquement"}])
}function expression13(data,body,options,context,display,layout,readOnly,summary,validates
) {
return (data.roles)
}function expression14(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `/simple-directory/api/organizations/${context.owner.id}/roles`
}
const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/autonomous-agent/form-security#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/autonomous-agent/form-security#": {
      title: "main",
      root: "https://github.com/data-fair/agents/autonomous-agent/form-security#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-security#",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/instructors/items": {
      title: "Access Ref",
      root: "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/instructors/items",
      refPointer: "https://github.com/data-fair/lib/access-ref#",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/0": {
      title: "An organization member",
      root: "https://github.com/data-fair/lib/access-ref#/oneOf/0",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/0",
      discriminatorValue: "member"
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/1": {
      title: "An email",
      root: "https://github.com/data-fair/lib/access-ref#/oneOf/1",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/1",
      discriminatorValue: "member"
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2": {
      title: "A partner organization",
      root: "https://github.com/data-fair/lib/access-ref#/oneOf/2",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2",
      discriminatorValue: "member"
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items": {
      title: "",
      root: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3": {
      title: "A role or department of my organization",
      root: "https://github.com/data-fair/lib/access-ref#/oneOf/3",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3",
      discriminatorValue: "internal"
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items": {
      title: "",
      root: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/autonomous-agent/form-security#": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-security#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-security#",
      pure: true,

      propertyKeys: [
        "approvalLevel",
        "instructors",
        "role"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/approvalLevel",
        "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/instructors",
        "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/role"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/approvalLevel": {
      title: "Ask for approval for",
      key: "approvalLevel",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/approvalLevel",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/approvalLevel",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/instructors": {
      title: "Who may instruct",
      key: "instructors",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/instructors",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/instructors",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/instructors/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/instructors/items": {
      title: "Access Ref",
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/instructors/items",
      refPointer: "https://github.com/data-fair/lib/access-ref#",
      pure: true,

      propertyKeys: [
        "mode",
        "type",
        "id",
        "email",
        "department",
        "roles"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/lib/access-ref#/oneOf"
      ]
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/0": {
      key: "",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/0",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/0",
      pure: true,
      propertyKeys: ["mode", "type", "id"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode",
        "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type",
        "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id"
      ]
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode": {
      title: undefined,
      key: "mode",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type": {
      title: undefined,
      key: "type",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id": {
      title: "Member",
      key: "id",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/1": {
      key: "",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/1",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/1",
      pure: true,
      propertyKeys: ["mode", "type", "email"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode",
        "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type",
        "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email"
      ]
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode": {
      title: undefined,
      key: "mode",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type": {
      title: undefined,
      key: "type",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email": {
      title: "Email address",
      key: "email",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2": {
      key: "",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2",
      pure: true,

      propertyKeys: [
        "mode",
        "type",
        "department",
        "roles",
        "id"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode",
        "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type",
        "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department",
        "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles",
        "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/id"
      ]
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode": {
      title: undefined,
      key: "mode",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type": {
      title: undefined,
      key: "type",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department": {
      title: undefined,
      key: "department",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles": {
      title: undefined,
      key: "roles",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      childrenTrees: [
        "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items"
      ]
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/id": {
      title: "Partner",
      key: "id",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/id",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3": {
      key: "",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3",
      pure: true,

      propertyKeys: [
        "mode",
        "type",
        "id",
        "department",
        "roles"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode",
        "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type",
        "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/id",
        "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/department",
        "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles"
      ]
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode": {
      title: undefined,
      key: "mode",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type": {
      title: undefined,
      key: "type",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/id": {
      title: undefined,
      key: "id",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/id",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/id",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/department": {
      title: "Department",
      key: "department",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/department",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/department",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles": {
      title: "Roles",
      key: "roles",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      childrenTrees: [
        "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items"
      ]
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf": {
      key: "$oneOf",
      pointer: "https://github.com/data-fair/lib/access-ref#/oneOf",
      refPointer: "https://github.com/data-fair/lib/access-ref#/oneOf",

      childrenTrees: [
        "https://github.com/data-fair/lib/access-ref#/oneOf/0",
        "https://github.com/data-fair/lib/access-ref#/oneOf/1",
        "https://github.com/data-fair/lib/access-ref#/oneOf/2",
        "https://github.com/data-fair/lib/access-ref#/oneOf/3"
      ],

      discriminator: "mode",
      pure: true,

      propertyKeys: [
        "mode",
        "type",
        "id",
        "email",
        "department",
        "roles"
      ],

      roPropertyKeys: []
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/role": {
      title: "Role in the organization",
      key: "role",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/role",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/role",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/autonomous-agent/form-security#": {
      title: null,
      comp: "section",

      children: [{
        key: "approvalLevel"
      }, {
        key: "instructors"
      }, {
        key: "role"
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

    "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/approvalLevel": {
      comp: "radio-group",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"write\",\"title\":\"Every operation that makes changes\",\"key\":\"write\",\"value\":\"write\"},{\"const\":\"destructive\",\"title\":\"Only operations marked as particularly destructive\",\"key\":\"destructive\",\"value\":\"destructive\"},{\"const\":\"none\",\"title\":\"None (the agent is fully autonomous in its tool calls)\",\"key\":\"none\",\"value\":\"none\"}]",
        immutable: true,
        ref: 1
      },

      label: "Ask for approval for",
      help: "<p>A planned task has nobody to approve: tools that need approval are not offered to it.</p>",
      defaultData: "destructive",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/instructors": {
      comp: "list",
      title: "Who may instruct",
      listEditMode: "inline-single",

      listActions: [
        "add",
        "edit",
        "delete",
        "sort",
        "duplicate"
      ],

      help: "<p>Admins of the owning organization are always allowed. Anyone matched here borrows this autonomous agent&#39;s permissions.</p>",
      defaultData: [],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/instructors/items": {
      comp: "section",

      children: [{
        key: "$oneOf"
      }],

      title: "Access Ref",
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

    "https://github.com/data-fair/lib/access-ref#/oneOf": {
      emptyData: true,
      comp: "one-of-select",

      oneOfItems: [{
        key: 0,
        title: "An organization member"
      }, {
        key: 1,
        title: "An email"
      }, {
        key: 2,
        title: "A partner organization"
      }, {
        key: 3,
        title: "A role or department of my organization"
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

    "https://github.com/data-fair/lib/access-ref#/oneOf/0": {
      if: {
        type: "js-eval",
        expr: "context.owner.type === 'organization'",
        pure: true,
        dataAlias: "value",
        ref: 2
      },

      comp: "section",

      children: [{
        key: "mode"
      }, {
        key: "type"
      }, {
        key: "id"
      }],

      title: "An organization member",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode": {
      comp: "none",
      constData: "member",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type": {
      comp: "none",
      constData: "user",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id": {
      getItems: {
        url: {
          type: "js-tpl",
          expr: "/simple-directory/api/organizations/${context.owner.id}/members",
          pure: true,
          dataAlias: "value",
          ref: 4
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.results",
          pure: true,
          dataAlias: "body",
          ref: 8
        },

        itemTitle: {
          type: "js-eval",
          expr: "item.name",
          pure: true,
          dataAlias: "item",
          ref: 5
        },

        itemValue: {
          type: "js-eval",
          expr: "item.id",
          pure: true,
          dataAlias: "item",
          ref: 6
        },

        itemIcon: {
          type: "js-eval",
          expr: "`/simple-directory/api/avatars/user/${item.id}/avatar.png`",
          pure: true,
          dataAlias: "item",
          ref: 7
        }
      },

      comp: "select",
      label: "Member"
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/1": {
      comp: "section",

      children: [{
        key: "mode"
      }, {
        key: "type"
      }, {
        key: "email"
      }],

      title: "An email",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode": {
      comp: "none",
      constData: "member",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type": {
      comp: "none",
      constData: "user",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email": {
      comp: "text-field",
      label: "Email address"
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2": {
      if: {
        type: "js-eval",
        expr: "context.owner.type === 'organization'",
        pure: true,
        dataAlias: "value",
        ref: 2
      },

      comp: "section",

      children: [{
        key: "mode"
      }, {
        key: "type"
      }, {
        key: "department"
      }, {
        key: "roles"
      }, {
        key: "id"
      }],

      title: "A partner organization",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode": {
      comp: "none",
      constData: "member",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type": {
      comp: "none",
      constData: "organization",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department": {
      comp: "none",
      constData: "*",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles": {
      comp: "none",
      constData: [],

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items": {
      comp: "text-field",
      label: "",
      nullable: true
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/id": {
      getItems: {
        url: {
          type: "js-tpl",
          expr: "/simple-directory/api/organizations/${context.owner.id}",
          pure: true,
          dataAlias: "value",
          ref: 9
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.partners",
          pure: true,
          dataAlias: "body",
          ref: 11
        },

        itemTitle: {
          type: "js-eval",
          expr: "item.name",
          pure: true,
          dataAlias: "item",
          ref: 5
        },

        itemValue: {
          type: "js-eval",
          expr: "item.id",
          pure: true,
          dataAlias: "item",
          ref: 6
        },

        itemIcon: {
          type: "js-eval",
          expr: "`/simple-directory/api/avatars/organization/${item.id}/avatar.png`",
          pure: true,
          dataAlias: "item",
          ref: 10
        }
      },

      comp: "select",
      label: "Partner"
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3": {
      if: {
        type: "js-eval",
        expr: "context.owner.type === 'organization'",
        pure: true,
        dataAlias: "value",
        ref: 2
      },

      comp: "section",

      children: [{
        key: "mode"
      }, {
        key: "type"
      }, {
        key: "id"
      }, {
        key: "department"
      }, {
        key: "roles"
      }],

      title: "A role or department of my organization",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode": {
      comp: "none",
      constData: "internal",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type": {
      comp: "none",
      constData: "organization",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 3
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/id": {
      comp: "none"
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/department": {
      getItems: {
        url: {
          type: "js-tpl",
          expr: "/simple-directory/api/organizations/${context.owner.id}",
          pure: true,
          dataAlias: "value",
          ref: 9
        },

        itemsResults: {
          type: "js-eval",
          expr: "[...(data.departments || []), {id: \"*\", name: \"Tous les départements\"}, {id: \"-\", name: \"Racine de l'organisation uniquement\"}]",
          pure: true,
          dataAlias: "body",
          ref: 12
        },

        itemTitle: {
          type: "js-eval",
          expr: "item.name",
          pure: true,
          dataAlias: "item",
          ref: 5
        },

        itemValue: {
          type: "js-eval",
          expr: "item.id",
          pure: true,
          dataAlias: "item",
          ref: 6
        }
      },

      comp: "select",
      label: "Department"
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles": {
      getItems: {
        url: {
          type: "js-tpl",
          expr: "/simple-directory/api/organizations/${context.owner.id}",
          pure: true,
          dataAlias: "value",
          ref: 9
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.roles",
          pure: true,
          dataAlias: "body",
          ref: 13
        }
      },

      comp: "select",
      multiple: true,
      label: "Roles"
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items": {
      comp: "text-field",
      label: "",
      nullable: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-security#/properties/role": {
      getItems: {
        url: {
          type: "js-tpl",
          expr: "/simple-directory/api/organizations/${context.owner.id}/roles",
          pure: true,
          dataAlias: "value",
          ref: 14
        }
      },

      comp: "select",
      label: "Role in the organization",
      help: "<p>What the agent can do in the platform&#39;s services, like a member with this role.</p>",
      defaultData: "user",

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
    "https://github.com/data-fair/lib/access-ref#/oneOf/0": export0,
    "https://github.com/data-fair/lib/access-ref#/oneOf/1": export1,
    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items": export2,
    "https://github.com/data-fair/lib/access-ref#/oneOf/2": export3,
    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items": export4,
    "https://github.com/data-fair/lib/access-ref#/oneOf/3": export5,
    "https://github.com/data-fair/lib/access-ref#": export6,
    "https://github.com/data-fair/agents/autonomous-agent/form-security#": export7
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
  
  "radio-group": radiogroupNode,
  
  "list": listNode,
  
  "one-of-select": oneofselectNode,
  
  "select": selectNode,
  
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