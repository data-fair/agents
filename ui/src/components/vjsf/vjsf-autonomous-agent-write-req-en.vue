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

import textareaNode from '@koumoul/vjsf/components/nodes/textarea.vue'

import listNode from '@koumoul/vjsf/components/nodes/list.vue'

import autocompleteNode from '@koumoul/vjsf/components/nodes/autocomplete.vue'

import comboboxNode from '@koumoul/vjsf/components/nodes/combobox.vue'

import oneofselectNode from '@koumoul/vjsf/components/nodes/one-of-select.vue'

import selectNode from '@koumoul/vjsf/components/nodes/select.vue'

import checkboxNode from '@koumoul/vjsf/components/nodes/checkbox.vue'


import localizeErrors from "ajv-i18n/localize/en/index.js";
import equal from "ajv/dist/runtime/equal.js";
import ucs2length from "ajv/dist/runtime/ucs2length.js";

const export0 = validate22;
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items"};
const schema29 = {"type":"string","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items","errorMessage":{}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema29.type,parentSchema:schema29,data};
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
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"dynamicProps":false,"dynamicItems":false};

const export1 = validate24;
const schema30 = {"$id":"export1","$ref":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items"};
const schema31 = {"type":"string","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items","errorMessage":{}};

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
if(typeof data !== "string"){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema31.type,parentSchema:schema31,data};
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
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"dynamicProps":false,"dynamicItems":false};

const export2 = validate25;
const schema32 = {"$id":"export2","$ref":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items"};
const schema33 = {"type":"object","additionalProperties":false,"required":["serverId"],"properties":{"serverId":{"type":"string","title":"Server","layout":{"comp":"autocomplete","getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers","pure":true,"dataAlias":"value","ref":2},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":5},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":3},"itemKey":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId","errorMessage":{}},"profiles":{"type":"array","title":"Profiles","description":"What this server lets the agent do, by profile.","layout":{"if":"context.profiledServers?.includes(parent.data?.serverId)","slots":{"component":{"name":"mcp-profiles"}}},"items":{"type":"string","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles","errorMessage":{}},"toolFilter":{"type":"array","layout":{"if":"!context.profiledServers?.includes(parent.data?.serverId)"},"title":"Only these tools","description":"Leave empty to expose every tool this server offers.","items":{"type":"string","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items","errorMessage":{"required":{"serverId":"required information"}}};
const obj0 = {"required":"missingProperty","dependencies":"property","dependentRequired":"property"};

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
if(data.serverId === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "serverId"},message:"must have required property '"+"serverId"+"'",schema:schema33.required,parentSchema:schema33,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "serverId") || (key0 === "profiles")) || (key0 === "toolFilter"))){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema33,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.serverId !== undefined){
let data0 = data.serverId;
if(typeof data0 !== "string"){
const err2 = {instancePath:instancePath+"/serverId",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema33.properties.serverId.type,parentSchema:schema33.properties.serverId,data:data0};
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
if(data.profiles !== undefined){
let data1 = data.profiles;
if(Array.isArray(data1)){
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(typeof data2 !== "string"){
const err4 = {instancePath:instancePath+"/profiles/" + i0,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema33.properties.profiles.items.type,parentSchema:schema33.properties.profiles.items,data:data2};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err5 of vErrors){
if(!err5.emUsed){
emErrs1.push(err5);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
}
else {
const err6 = {instancePath:instancePath+"/profiles",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema33.properties.profiles.type,parentSchema:schema33.properties.profiles,data:data1};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err7 of vErrors){
if(!err7.emUsed){
emErrs2.push(err7);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data.toolFilter !== undefined){
let data3 = data.toolFilter;
if(Array.isArray(data3)){
const len1 = data3.length;
for(let i1=0; i1<len1; i1++){
let data4 = data3[i1];
if(typeof data4 !== "string"){
const err8 = {instancePath:instancePath+"/toolFilter/" + i1,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema33.properties.toolFilter.items.type,parentSchema:schema33.properties.toolFilter.items,data:data4};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(errors > 0){
const emErrs3 = [];
for(const err9 of vErrors){
if(!err9.emUsed){
emErrs3.push(err9);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
}
else {
const err10 = {instancePath:instancePath+"/toolFilter",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema33.properties.toolFilter.type,parentSchema:schema33.properties.toolFilter,data:data3};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err11 of vErrors){
if(!err11.emUsed){
emErrs4.push(err11);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
}
else {
const err12 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"serverId":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err13 of vErrors){
if((((((err13.keyword !== "errorMessage") && (!err13.emUsed)) && (err13.instancePath === instancePath)) && (err13.keyword in emErrors0)) && (err13.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items") === 0)) && (/^\/[^\/]*$/.test(err13.schemaPath.slice(91)))){
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
const err14 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema33.errorMessage[key1][keyProp0],schema:schema33.errorMessage,parentSchema:schema33,data};
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
const emErrs5 = [];
for(const err15 of vErrors){
if(!err15.emUsed){
emErrs5.push(err15);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export3 = validate26;
const schema34 = {"$id":"export3","$ref":"https://github.com/data-fair/lib/access-ref#/oneOf/0"};
const schema36 = {"title":"An organization member","layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode","errorMessage":{}},"type":{"type":"string","const":"user","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"Member","layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}/members","pure":true,"dataAlias":"value","ref":11},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":5},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":3},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4},"itemIcon":{"type":"js-eval","expr":"`/simple-directory/api/avatars/user/${item.id}/avatar.png`","pure":true,"dataAlias":"item","ref":12}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0","errorMessage":{"required":{"mode":"required information","type":"required information","id":"required information"}}};

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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema36.required,parentSchema:schema36,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema36.required,parentSchema:schema36,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema36.required,parentSchema:schema36,data};
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
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema36,data};
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
const err4 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema36.properties.mode.type,parentSchema:schema36.properties.mode,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("member" !== data0){
const err5 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema36.properties.mode,data:data0};
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
const err7 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema36.properties.type.type,parentSchema:schema36.properties.type,data:data1};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if("user" !== data1){
const err8 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema36.properties.type,data:data1};
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
const err10 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema36.properties.id.type,parentSchema:schema36.properties.id,data:data2};
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
const err12 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema36.type,parentSchema:schema36,data};
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
const err14 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema36.errorMessage[key1][keyProp0],schema:schema36.errorMessage,parentSchema:schema36,data};
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
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export4 = validate28;
const schema37 = {"$id":"export4","$ref":"https://github.com/data-fair/lib/access-ref#/oneOf/1"};
const schema38 = {"title":"An email","required":["mode","type","email"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode","errorMessage":{}},"type":{"type":"string","const":"user","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type","errorMessage":{}},"email":{"type":"string","format":"email","title":"Email address","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1","errorMessage":{"required":{"mode":"required information","type":"required information","email":"required information"}}};
const formats0 = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

function validate28(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export4" */;
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
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema38.required,parentSchema:schema38,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema38.required,parentSchema:schema38,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.email === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/required",keyword:"required",params:{missingProperty: "email"},message:"must have required property '"+"email"+"'",schema:schema38.required,parentSchema:schema38,data};
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
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema38,data};
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
const err4 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema38.properties.mode.type,parentSchema:schema38.properties.mode,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("member" !== data0){
const err5 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema38.properties.mode,data:data0};
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
const err7 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema38.properties.type.type,parentSchema:schema38.properties.type,data:data1};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if("user" !== data1){
const err8 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema38.properties.type,data:data1};
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
const err10 = {instancePath:instancePath+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email/format",keyword:"format",params:{format: "email"},message:"must match format \""+"email"+"\"",schema:"email",parentSchema:schema38.properties.email,data:data2};
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
const err11 = {instancePath:instancePath+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema38.properties.email.type,parentSchema:schema38.properties.email,data:data2};
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
const err13 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema38.type,parentSchema:schema38,data};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema38.errorMessage[key1][keyProp0],schema:schema38.errorMessage,parentSchema:schema38,data};
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
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export5 = validate29;
const schema39 = {"$id":"export5","$ref":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items"};
const schema40 = {"type":"string","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items","errorMessage":{}};

function validate29(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export5" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate29.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data !== "string"){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema40.type,parentSchema:schema40,data};
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
validate29.errors = vErrors;
return errors === 0;
}
validate29.evaluated = {"dynamicProps":false,"dynamicItems":false};

const export6 = validate30;
const schema41 = {"$id":"export6","$ref":"https://github.com/data-fair/lib/access-ref#/oneOf/2"};
const schema42 = {"title":"A partner organization","layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode","errorMessage":{}},"type":{"type":"string","const":"organization","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type","errorMessage":{}},"department":{"type":"string","const":"*","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department","errorMessage":{}},"roles":{"type":"array","const":[],"items":{"type":"string","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles","errorMessage":{}},"id":{"type":"string","title":"Partner","layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}","pure":true,"dataAlias":"value","ref":13},"itemsResults":{"type":"js-eval","expr":"data.partners","pure":true,"dataAlias":"body","ref":15},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":3},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4},"itemIcon":{"type":"js-eval","expr":"`/simple-directory/api/avatars/organization/${item.id}/avatar.png`","pure":true,"dataAlias":"item","ref":14}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/id","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2","errorMessage":{"required":{"mode":"required information","type":"required information","id":"required information"}}};
const func0 = equal;

function validate30(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export6" */;
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
if(data.mode === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema42.required,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema42.required,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema42.required,parentSchema:schema42,data};
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
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema42,data};
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
const err4 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.mode.type,parentSchema:schema42.properties.mode,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("member" !== data0){
const err5 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema42.properties.mode,data:data0};
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
const err7 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.type.type,parentSchema:schema42.properties.type,data:data1};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if("organization" !== data1){
const err8 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant",schema:"organization",parentSchema:schema42.properties.type,data:data1};
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
const err10 = {instancePath:instancePath+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.department.type,parentSchema:schema42.properties.department,data:data2};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if("*" !== data2){
const err11 = {instancePath:instancePath+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema42.properties.department,data:data2};
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
if(!func0(data3, schema42.properties.roles.const)){
const err13 = {instancePath:instancePath+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/const",keyword:"const",params:{allowedValue: schema42.properties.roles.const},message:"must be equal to constant",schema:schema42.properties.roles.const,parentSchema:schema42.properties.roles,data:data3};
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
const err14 = {instancePath:instancePath+"/roles/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.roles.items.type,parentSchema:schema42.properties.roles.items,data:data4};
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
const err16 = {instancePath:instancePath+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema42.properties.roles.type,parentSchema:schema42.properties.roles,data:data3};
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
const err18 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema42.properties.id.type,parentSchema:schema42.properties.id,data:data5};
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
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema42.type,parentSchema:schema42,data};
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
const err22 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema42.errorMessage[key1][keyProp0],schema:schema42.errorMessage,parentSchema:schema42,data};
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
validate30.errors = vErrors;
return errors === 0;
}
validate30.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export7 = validate31;
const schema43 = {"$id":"export7","$ref":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items"};
const schema44 = {"type":"string","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items","errorMessage":{}};

function validate31(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export7" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate31.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data !== "string"){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.type,parentSchema:schema44,data};
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
validate31.errors = vErrors;
return errors === 0;
}
validate31.evaluated = {"dynamicProps":false,"dynamicItems":false};

const export8 = validate32;
const schema45 = {"$id":"export8","$ref":"https://github.com/data-fair/lib/access-ref#/oneOf/3"};
const schema46 = {"title":"A role or department of my organization","layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"internal","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode","errorMessage":{}},"type":{"type":"string","const":"organization","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","layout":{"comp":"none","getConstData":"context.owner.id"},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/id","errorMessage":{}},"department":{"type":"string","title":"Department","layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}","pure":true,"dataAlias":"value","ref":13},"itemsResults":{"type":"js-eval","expr":"[...(data.departments || []), {id: \"*\", name: \"Tous les départements\"}, {id: \"-\", name: \"Racine de l'organisation uniquement\"}]","pure":true,"dataAlias":"body","ref":16},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":3},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/department","errorMessage":{}},"roles":{"type":"array","title":"Roles","items":{"type":"string","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items","errorMessage":{}},"layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}","pure":true,"dataAlias":"value","ref":13},"itemsResults":{"type":"js-eval","expr":"data.roles","pure":true,"dataAlias":"body","ref":17}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3","errorMessage":{"required":{"mode":"required information","type":"required information","id":"required information"}}};

function validate32(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export8" */;
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
if(data.mode === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema46.required,parentSchema:schema46,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema46.required,parentSchema:schema46,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.id === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema46.required,parentSchema:schema46,data};
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
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema46,data};
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
const err4 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.mode.type,parentSchema:schema46.properties.mode,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if("internal" !== data0){
const err5 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode/const",keyword:"const",params:{allowedValue: "internal"},message:"must be equal to constant",schema:"internal",parentSchema:schema46.properties.mode,data:data0};
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
const err7 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.type.type,parentSchema:schema46.properties.type,data:data1};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if("organization" !== data1){
const err8 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant",schema:"organization",parentSchema:schema46.properties.type,data:data1};
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
const err10 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.id.type,parentSchema:schema46.properties.id,data:data2};
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
const err12 = {instancePath:instancePath+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.department.type,parentSchema:schema46.properties.department,data:data3};
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
const err14 = {instancePath:instancePath+"/roles/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema46.properties.roles.items.type,parentSchema:schema46.properties.roles.items,data:data5};
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
const err16 = {instancePath:instancePath+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema46.properties.roles.type,parentSchema:schema46.properties.roles,data:data4};
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
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema46.type,parentSchema:schema46,data};
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
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema46.errorMessage[key1][keyProp0],schema:schema46.errorMessage,parentSchema:schema46,data};
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
validate32.errors = vErrors;
return errors === 0;
}
validate32.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export9 = validate33;
const schema47 = {"$id":"export9","$ref":"https://github.com/data-fair/lib/access-ref#"};
const schema28 = {"$id":"https://github.com/data-fair/lib/access-ref","x-exports":["types","validate"],"title":"Access Ref","type":"object","discriminator":{"propertyName":"mode"},"oneOfLayout":{"emptyData":true},"oneOf":[{"title":"An organization member","layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode","errorMessage":{}},"type":{"type":"string","const":"user","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type","errorMessage":{}},"id":{"type":"string","title":"Member","layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}/members","pure":true,"dataAlias":"value","ref":11},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":5},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":3},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4},"itemIcon":{"type":"js-eval","expr":"`/simple-directory/api/avatars/user/${item.id}/avatar.png`","pure":true,"dataAlias":"item","ref":12}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/0","errorMessage":{"required":{"mode":"required information","type":"required information","id":"required information"}}},{"title":"An email","required":["mode","type","email"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode","errorMessage":{}},"type":{"type":"string","const":"user","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type","errorMessage":{}},"email":{"type":"string","format":"email","title":"Email address","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/1","errorMessage":{"required":{"mode":"required information","type":"required information","email":"required information"}}},{"title":"A partner organization","layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"member","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode","errorMessage":{}},"type":{"type":"string","const":"organization","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type","errorMessage":{}},"department":{"type":"string","const":"*","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department","errorMessage":{}},"roles":{"type":"array","const":[],"items":{"type":"string","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles","errorMessage":{}},"id":{"type":"string","title":"Partner","layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}","pure":true,"dataAlias":"value","ref":13},"itemsResults":{"type":"js-eval","expr":"data.partners","pure":true,"dataAlias":"body","ref":15},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":3},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4},"itemIcon":{"type":"js-eval","expr":"`/simple-directory/api/avatars/organization/${item.id}/avatar.png`","pure":true,"dataAlias":"item","ref":14}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/id","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/2","errorMessage":{"required":{"mode":"required information","type":"required information","id":"required information"}}},{"title":"A role or department of my organization","layout":{"if":"context.owner.type === 'organization'"},"required":["mode","type","id"],"additionalProperties":false,"properties":{"mode":{"type":"string","const":"internal","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode","errorMessage":{}},"type":{"type":"string","const":"organization","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type","errorMessage":{}},"id":{"type":"string","layout":{"comp":"none","getConstData":"context.owner.id"},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/id","errorMessage":{}},"department":{"type":"string","title":"Department","layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}","pure":true,"dataAlias":"value","ref":13},"itemsResults":{"type":"js-eval","expr":"[...(data.departments || []), {id: \"*\", name: \"Tous les départements\"}, {id: \"-\", name: \"Racine de l'organisation uniquement\"}]","pure":true,"dataAlias":"body","ref":16},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":3},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/department","errorMessage":{}},"roles":{"type":"array","title":"Roles","items":{"type":"string","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items","errorMessage":{}},"layout":{"getItems":{"url":{"type":"js-tpl","expr":"/simple-directory/api/organizations/${context.owner.id}","pure":true,"dataAlias":"value","ref":13},"itemsResults":{"type":"js-eval","expr":"data.roles","pure":true,"dataAlias":"body","ref":17}}},"__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/lib/access-ref#/oneOf/3","errorMessage":{"required":{"mode":"required information","type":"required information","id":"required information"}}}],"__pointer":"https://github.com/data-fair/lib/access-ref","errorMessage":{"oneOf":"chose one"}};

function validate33(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export9" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate33.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(data && typeof data == "object" && !Array.isArray(data))){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data};
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
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema28.oneOf[0].required,parentSchema:schema28.oneOf[0],data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.type === undefined){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.oneOf[0].required,parentSchema:schema28.oneOf[0],data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.id === undefined){
const err3 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.oneOf[0].required,parentSchema:schema28.oneOf[0],data};
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
const err4 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema28.oneOf[0],data};
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
const err5 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[0].properties.mode.type,parentSchema:schema28.oneOf[0].properties.mode,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if("member" !== data0){
const err6 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema28.oneOf[0].properties.mode,data:data0};
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
const err8 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[0].properties.type.type,parentSchema:schema28.oneOf[0].properties.type,data:data1};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if("user" !== data1){
const err9 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema28.oneOf[0].properties.type,data:data1};
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
const err11 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[0].properties.id.type,parentSchema:schema28.oneOf[0].properties.id,data:data2};
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
const err13 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.oneOf[0].type,parentSchema:schema28.oneOf[0],data};
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
const err15 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema28.oneOf[0].errorMessage[key1][keyProp0],schema:schema28.oneOf[0].errorMessage,parentSchema:schema28.oneOf[0],data};
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
const err17 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema28.oneOf[1].required,parentSchema:schema28.oneOf[1],data};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.type === undefined){
const err18 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.oneOf[1].required,parentSchema:schema28.oneOf[1],data};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.email === undefined){
const err19 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/required",keyword:"required",params:{missingProperty: "email"},message:"must have required property '"+"email"+"'",schema:schema28.oneOf[1].required,parentSchema:schema28.oneOf[1],data};
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
const err20 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties",schema:false,parentSchema:schema28.oneOf[1],data};
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
const err21 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[1].properties.mode.type,parentSchema:schema28.oneOf[1].properties.mode,data:data3};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if("member" !== data3){
const err22 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema28.oneOf[1].properties.mode,data:data3};
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
const err24 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[1].properties.type.type,parentSchema:schema28.oneOf[1].properties.type,data:data4};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if("user" !== data4){
const err25 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema28.oneOf[1].properties.type,data:data4};
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
const err27 = {instancePath:instancePath+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email/format",keyword:"format",params:{format: "email"},message:"must match format \""+"email"+"\"",schema:"email",parentSchema:schema28.oneOf[1].properties.email,data:data5};
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
const err28 = {instancePath:instancePath+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/properties/email/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[1].properties.email.type,parentSchema:schema28.oneOf[1].properties.email,data:data5};
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
const err30 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.oneOf[1].type,parentSchema:schema28.oneOf[1],data};
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
const err32 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema28.oneOf[1].errorMessage[key3][keyProp1],schema:schema28.oneOf[1].errorMessage,parentSchema:schema28.oneOf[1],data};
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
const err34 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema28.oneOf[2].required,parentSchema:schema28.oneOf[2],data};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data.type === undefined){
const err35 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.oneOf[2].required,parentSchema:schema28.oneOf[2],data};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data.id === undefined){
const err36 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.oneOf[2].required,parentSchema:schema28.oneOf[2],data};
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
const err37 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties",schema:false,parentSchema:schema28.oneOf[2],data};
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
const err38 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[2].properties.mode.type,parentSchema:schema28.oneOf[2].properties.mode,data:data6};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if("member" !== data6){
const err39 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema28.oneOf[2].properties.mode,data:data6};
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
const err41 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[2].properties.type.type,parentSchema:schema28.oneOf[2].properties.type,data:data7};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if("organization" !== data7){
const err42 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant",schema:"organization",parentSchema:schema28.oneOf[2].properties.type,data:data7};
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
const err44 = {instancePath:instancePath+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[2].properties.department.type,parentSchema:schema28.oneOf[2].properties.department,data:data8};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if("*" !== data8){
const err45 = {instancePath:instancePath+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/department/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema28.oneOf[2].properties.department,data:data8};
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
if(!func0(data9, schema28.oneOf[2].properties.roles.const)){
const err47 = {instancePath:instancePath+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/const",keyword:"const",params:{allowedValue: schema28.oneOf[2].properties.roles.const},message:"must be equal to constant",schema:schema28.oneOf[2].properties.roles.const,parentSchema:schema28.oneOf[2].properties.roles,data:data9};
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
const err48 = {instancePath:instancePath+"/roles/" + i0,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[2].properties.roles.items.type,parentSchema:schema28.oneOf[2].properties.roles.items,data:data10};
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
const err50 = {instancePath:instancePath+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema28.oneOf[2].properties.roles.type,parentSchema:schema28.oneOf[2].properties.roles,data:data9};
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
const err52 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[2].properties.id.type,parentSchema:schema28.oneOf[2].properties.id,data:data11};
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
const err54 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.oneOf[2].type,parentSchema:schema28.oneOf[2],data};
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
const err56 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema28.oneOf[2].errorMessage[key5][keyProp2],schema:schema28.oneOf[2].errorMessage,parentSchema:schema28.oneOf[2],data};
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
const err58 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema28.oneOf[3].required,parentSchema:schema28.oneOf[3],data};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if(data.type === undefined){
const err59 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.oneOf[3].required,parentSchema:schema28.oneOf[3],data};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data.id === undefined){
const err60 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.oneOf[3].required,parentSchema:schema28.oneOf[3],data};
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
const err61 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties",schema:false,parentSchema:schema28.oneOf[3],data};
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
const err62 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[3].properties.mode.type,parentSchema:schema28.oneOf[3].properties.mode,data:data12};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if("internal" !== data12){
const err63 = {instancePath:instancePath+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/mode/const",keyword:"const",params:{allowedValue: "internal"},message:"must be equal to constant",schema:"internal",parentSchema:schema28.oneOf[3].properties.mode,data:data12};
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
const err65 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[3].properties.type.type,parentSchema:schema28.oneOf[3].properties.type,data:data13};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if("organization" !== data13){
const err66 = {instancePath:instancePath+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant",schema:"organization",parentSchema:schema28.oneOf[3].properties.type,data:data13};
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
const err68 = {instancePath:instancePath+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[3].properties.id.type,parentSchema:schema28.oneOf[3].properties.id,data:data14};
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
const err70 = {instancePath:instancePath+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[3].properties.department.type,parentSchema:schema28.oneOf[3].properties.department,data:data15};
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
const err72 = {instancePath:instancePath+"/roles/" + i1,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[3].properties.roles.items.type,parentSchema:schema28.oneOf[3].properties.roles.items,data:data17};
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
const err74 = {instancePath:instancePath+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema28.oneOf[3].properties.roles.type,parentSchema:schema28.oneOf[3].properties.roles,data:data16};
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
const err76 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.oneOf[3].type,parentSchema:schema28.oneOf[3],data};
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
const err78 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema28.oneOf[3].errorMessage[key7][keyProp3],schema:schema28.oneOf[3].errorMessage,parentSchema:schema28.oneOf[3],data};
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
const err80 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema28.oneOf,parentSchema:schema28,data};
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
const err82 = {instancePath,schemaPath:"https://github.com/data-fair/lib/access-ref#/errorMessage",keyword:"errorMessage",params:{errors: emErrors4[key8]},message:key8 in templates4 ? templates4[key8]() : schema28.errorMessage[key8],schema:schema28.errorMessage,parentSchema:schema28,data};
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
validate33.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate33.evaluated = {"dynamicProps":true,"dynamicItems":false};

const export10 = validate34;
const schema49 = {"$id":"export10","$ref":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items"};
const schema50 = {"type":"string","minLength":1,"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items","errorMessage":{}};
const func2 = ucs2length.default;

function validate34(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export10" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate34.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func2(data) < 1){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters",schema:1,parentSchema:schema50,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
else {
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema50.type,parentSchema:schema50,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err2 of vErrors){
if(!err2.emUsed){
emErrs0.push(err2);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
validate34.errors = vErrors;
return errors === 0;
}
validate34.evaluated = {"dynamicProps":false,"dynamicItems":false};

const export11 = validate35;
const schema51 = {"$id":"export11","$ref":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items"};
const schema52 = {"type":"object","additionalProperties":false,"required":["url"],"properties":{"url":{"type":"string","minLength":1,"title":"URL","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items/properties/url","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items","errorMessage":{"required":{"url":"required information"}}};

function validate35(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export11" */;
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
if(data.url === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items/required",keyword:"required",params:{missingProperty: "url"},message:"must have required property '"+"url"+"'",schema:schema52.required,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(key0 === "url")){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.url !== undefined){
let data0 = data.url;
if(typeof data0 === "string"){
if(func2(data0) < 1){
const err2 = {instancePath:instancePath+"/url",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items/properties/url/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters",schema:1,parentSchema:schema52.properties.url,data:data0};
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
const err3 = {instancePath:instancePath+"/url",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items/properties/url/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema52.properties.url.type,parentSchema:schema52.properties.url,data:data0};
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
}
else {
const err5 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema52.type,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"url":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err6 of vErrors){
if((((((err6.keyword !== "errorMessage") && (!err6.emUsed)) && (err6.instancePath === instancePath)) && (err6.keyword in emErrors0)) && (err6.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items") === 0)) && (/^\/[^\/]*$/.test(err6.schemaPath.slice(99)))){
emPropParams0 = obj0[err6.keyword];
emParamsErrors0 = emErrors0[err6.keyword][err6.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err6);
err6.emUsed = true;
}
}
}
for(const key1 in emErrors0){
for(const keyProp0 in emErrors0[key1]){
emParamsErrors0 = emErrors0[key1][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key1] && templates0[key1][keyProp0];
const err7 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema52.errorMessage[key1][keyProp0],schema:schema52.errorMessage,parentSchema:schema52,data};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
const emErrs1 = [];
for(const err8 of vErrors){
if(!err8.emUsed){
emErrs1.push(err8);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
validate35.errors = vErrors;
return errors === 0;
}
validate35.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export12 = validate36;
const schema53 = {"$id":"export12","$ref":"https://github.com/data-fair/agents/autonomous-agent/write-req#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/autonomous-agent/write-req","title":"Autonomous agent","x-exports":["validate","types","vjsf"],"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"required":["title","persona","mcpServers","enabled"],"layout":{"title":null},"properties":{"title":{"type":"string","title":"Name","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/title","errorMessage":{}},"persona":{"type":"string","layout":"textarea","title":"Persona","description":"Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/persona","errorMessage":{}},"instructions":{"type":"string","layout":"textarea","title":"Instructions","description":"How it should work: procedures, constraints, what to do when unsure.","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructions","errorMessage":{}},"mcpServers":{"type":"array","default":[],"title":"MCP servers","description":"Picked from the servers configured for this deployment.","layout":{"itemTitle":"item?.serverId || \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","additionalProperties":false,"required":["serverId"],"properties":{"serverId":{"type":"string","title":"Server","layout":{"comp":"autocomplete","getItems":{"url":{"type":"js-tpl","expr":"${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers","pure":true,"dataAlias":"value","ref":2},"itemsResults":{"type":"js-eval","expr":"data.results","pure":true,"dataAlias":"body","ref":5},"itemTitle":{"type":"js-eval","expr":"item.name","pure":true,"dataAlias":"item","ref":3},"itemKey":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4},"itemValue":{"type":"js-eval","expr":"item.id","pure":true,"dataAlias":"item","ref":4}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId","errorMessage":{}},"profiles":{"type":"array","title":"Profiles","description":"What this server lets the agent do, by profile.","layout":{"if":"context.profiledServers?.includes(parent.data?.serverId)","slots":{"component":{"name":"mcp-profiles"}}},"items":{"type":"string","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles","errorMessage":{}},"toolFilter":{"type":"array","layout":{"if":"!context.profiledServers?.includes(parent.data?.serverId)"},"title":"Only these tools","description":"Leave empty to expose every tool this server offers.","items":{"type":"string","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items","errorMessage":{"required":{"serverId":"required information"}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers","errorMessage":{}},"nhi":{"type":"object","additionalProperties":false,"required":["clientId"],"title":"Non-human identity","properties":{"clientId":{"type":"string","minLength":1,"title":"Client id","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId","errorMessage":{}},"siteUrl":{"type":"string","readOnly":true,"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/siteUrl","errorMessage":{}},"issuer":{"type":"string","readOnly":true,"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/issuer","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi","errorMessage":{"required":{"clientId":"required information"}}},"instructors":{"type":"array","default":[],"title":"Who may instruct","description":"Admins of the owning organization are always allowed. Anyone matched here borrows this autonomous agent's permissions.","items":{"$ref":"https://github.com/data-fair/lib/access-ref","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items","errorMessage":{"oneOf":"chose one"}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors","errorMessage":{}},"approvals":{"type":"object","additionalProperties":false,"title":"Approvals","description":"What happens when this autonomous agent calls a tool, by the kind of action the tool declares. \"Approve\" stops the turn until the person in the chat approves the call; a scheduled task never gets such a tool. Tools that declare nothing count as writing.","properties":{"readOnly":{"type":"string","title":"Reading","default":"allow","oneOf":[{"const":"allow","title":"Allow"},{"const":"approve","title":"Approve each call"},{"const":"deny","title":"Never offer"}],"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/readOnly","errorMessage":{"oneOf":"chose one"}},"write":{"type":"string","title":"Writing","default":"allow","oneOf":[{"const":"allow","title":"Allow"},{"const":"approve","title":"Approve each call"},{"const":"deny","title":"Never offer"}],"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/write","errorMessage":{"oneOf":"chose one"}},"destructive":{"type":"string","title":"Destructive","default":"approve","oneOf":[{"const":"allow","title":"Allow"},{"const":"approve","title":"Approve each call"},{"const":"deny","title":"Never offer"}],"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/destructive","errorMessage":{"oneOf":"chose one"}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals","errorMessage":{}},"memory":{"type":"object","additionalProperties":false,"required":["enabled"],"title":"Memory","properties":{"enabled":{"type":"boolean","default":false,"title":"Keep a memory across conversations","description":"The agent keeps notes it reuses in every later conversation, and tidies them once a day from what people told it. Administrators can read, edit and restore this memory. Memory writes are not subject to the approval settings: every change is versioned and can be restored.","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/memory/properties/enabled","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/memory","errorMessage":{"required":{"enabled":"required information"}}},"web":{"type":"object","additionalProperties":false,"required":["enabled"],"title":"Web access","description":"Pages under the allowed URLs are read by the agent as text, and text can contain instructions: their authors can in effect instruct this agent, with its identity and all its tools, and make it send information out. Enable this only on agents with very restricted write and administration capabilities.","properties":{"enabled":{"type":"boolean","default":false,"title":"Read web pages","description":"The agent can read pages, feeds and sitemaps under the allowed URLs, and ask an administrator of the organization, in a conversation, to allow more.","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/enabled","errorMessage":{}},"allowedUrls":{"type":"array","maxItems":100,"default":[],"title":"Allowed URLs","description":"An address can be read when it starts with one of these: \"https://github.com/data-fair\" allows the repositories of that organization only, \"https://www.data.gouv.fr/\" the whole site. A site's robots.txt, sitemaps and search description are readable as soon as one of its addresses is allowed.","layout":{"if":"parent.data?.enabled"},"items":{"type":"string","minLength":1,"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items","errorMessage":{}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web","errorMessage":{"required":{"enabled":"required information"}}},"externalMcpServers":{"type":"array","maxItems":50,"default":[],"title":"External MCP servers","description":"Public MCP servers the agent uses anonymously — another data portal, on this platform or elsewhere. Their authors write the descriptions the agent reads, and what it sends them leaves the platform: like web access, this lets them in effect instruct the agent.","layout":{"itemTitle":"item?.url || \"\"","listActions":["add","edit","delete"]},"items":{"type":"object","additionalProperties":false,"required":["url"],"properties":{"url":{"type":"string","minLength":1,"title":"URL","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items/properties/url","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items","errorMessage":{"required":{"url":"required information"}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers","errorMessage":{}},"enabled":{"type":"boolean","default":true,"title":"Enabled","__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/enabled","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/write-req#","errorMessage":{"required":{"title":"required information","persona":"required information","mcpServers":"required information","enabled":"required information"}}};
const func1 = Object.prototype.hasOwnProperty;

function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://github.com/data-fair/agents/autonomous-agent/write-req" */;
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
if(data.title === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.persona === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "persona"},message:"must have required property '"+"persona"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.mcpServers === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mcpServers"},message:"must have required property '"+"mcpServers"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.enabled === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema27.properties, key0))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.title !== undefined){
let data0 = data.title;
if(typeof data0 !== "string"){
const err5 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.title.type,parentSchema:schema27.properties.title,data:data0};
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
if(data.persona !== undefined){
let data1 = data.persona;
if(typeof data1 !== "string"){
const err7 = {instancePath:instancePath+"/persona",schemaPath:"#/properties/persona/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.persona.type,parentSchema:schema27.properties.persona,data:data1};
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
if(data.instructions !== undefined){
let data2 = data.instructions;
if(typeof data2 !== "string"){
const err9 = {instancePath:instancePath+"/instructions",schemaPath:"#/properties/instructions/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.instructions.type,parentSchema:schema27.properties.instructions,data:data2};
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
if(data.mcpServers !== undefined){
let data3 = data.mcpServers;
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
let data4 = data3[i0];
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.serverId === undefined){
const err11 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "serverId"},message:"must have required property '"+"serverId"+"'",schema:schema27.properties.mcpServers.items.required,parentSchema:schema27.properties.mcpServers.items,data:data4};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
for(const key1 in data4){
if(!(((key1 === "serverId") || (key1 === "profiles")) || (key1 === "toolFilter"))){
const err12 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"#/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.mcpServers.items,data:data4};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data4.serverId !== undefined){
let data5 = data4.serverId;
if(typeof data5 !== "string"){
const err13 = {instancePath:instancePath+"/mcpServers/" + i0+"/serverId",schemaPath:"#/properties/mcpServers/items/properties/serverId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.mcpServers.items.properties.serverId.type,parentSchema:schema27.properties.mcpServers.items.properties.serverId,data:data5};
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
if(data4.profiles !== undefined){
let data6 = data4.profiles;
if(Array.isArray(data6)){
const len1 = data6.length;
for(let i1=0; i1<len1; i1++){
let data7 = data6[i1];
if(typeof data7 !== "string"){
const err15 = {instancePath:instancePath+"/mcpServers/" + i0+"/profiles/" + i1,schemaPath:"#/properties/mcpServers/items/properties/profiles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.mcpServers.items.properties.profiles.items.type,parentSchema:schema27.properties.mcpServers.items.properties.profiles.items,data:data7};
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
const err17 = {instancePath:instancePath+"/mcpServers/" + i0+"/profiles",schemaPath:"#/properties/mcpServers/items/properties/profiles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.mcpServers.items.properties.profiles.type,parentSchema:schema27.properties.mcpServers.items.properties.profiles,data:data6};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(errors > 0){
const emErrs5 = [];
for(const err18 of vErrors){
if(!err18.emUsed){
emErrs5.push(err18);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
if(data4.toolFilter !== undefined){
let data8 = data4.toolFilter;
if(Array.isArray(data8)){
const len2 = data8.length;
for(let i2=0; i2<len2; i2++){
let data9 = data8[i2];
if(typeof data9 !== "string"){
const err19 = {instancePath:instancePath+"/mcpServers/" + i0+"/toolFilter/" + i2,schemaPath:"#/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.mcpServers.items.properties.toolFilter.items.type,parentSchema:schema27.properties.mcpServers.items.properties.toolFilter.items,data:data9};
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
const err21 = {instancePath:instancePath+"/mcpServers/" + i0+"/toolFilter",schemaPath:"#/properties/mcpServers/items/properties/toolFilter/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.mcpServers.items.properties.toolFilter.type,parentSchema:schema27.properties.mcpServers.items.properties.toolFilter,data:data8};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(errors > 0){
const emErrs7 = [];
for(const err22 of vErrors){
if(!err22.emUsed){
emErrs7.push(err22);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
}
else {
const err23 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"#/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.mcpServers.items.type,parentSchema:schema27.properties.mcpServers.items,data:data4};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"serverId":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err24 of vErrors){
if((((((err24.keyword !== "errorMessage") && (!err24.emUsed)) && (err24.instancePath === instancePath+"/mcpServers/" + i0)) && (err24.keyword in emErrors0)) && (err24.schemaPath.indexOf("#/properties/mcpServers/items") === 0)) && (/^\/[^\/]*$/.test(err24.schemaPath.slice(29)))){
emPropParams0 = obj0[err24.keyword];
emParamsErrors0 = emErrors0[err24.keyword][err24.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err24);
err24.emUsed = true;
}
}
}
for(const key2 in emErrors0){
for(const keyProp0 in emErrors0[key2]){
emParamsErrors0 = emErrors0[key2][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key2] && templates0[key2][keyProp0];
const err25 = {instancePath:instancePath+"/mcpServers/" + i0,schemaPath:"#/properties/mcpServers/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.mcpServers.items.errorMessage[key2][keyProp0],schema:schema27.properties.mcpServers.items.errorMessage,parentSchema:schema27.properties.mcpServers.items,data:data4};
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
const emErrs8 = [];
for(const err26 of vErrors){
if(!err26.emUsed){
emErrs8.push(err26);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
}
else {
const err27 = {instancePath:instancePath+"/mcpServers",schemaPath:"#/properties/mcpServers/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.mcpServers.type,parentSchema:schema27.properties.mcpServers,data:data3};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err28 of vErrors){
if(!err28.emUsed){
emErrs9.push(err28);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
if(data.nhi !== undefined){
let data10 = data.nhi;
if(data10 && typeof data10 == "object" && !Array.isArray(data10)){
if(data10.clientId === undefined){
const err29 = {instancePath:instancePath+"/nhi",schemaPath:"#/properties/nhi/required",keyword:"required",params:{missingProperty: "clientId"},message:"must have required property '"+"clientId"+"'",schema:schema27.properties.nhi.required,parentSchema:schema27.properties.nhi,data:data10};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
for(const key3 in data10){
if(!(((key3 === "clientId") || (key3 === "siteUrl")) || (key3 === "issuer"))){
const err30 = {instancePath:instancePath+"/nhi",schemaPath:"#/properties/nhi/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.nhi,data:data10};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data10.clientId !== undefined){
let data11 = data10.clientId;
if(typeof data11 === "string"){
if(func2(data11) < 1){
const err31 = {instancePath:instancePath+"/nhi/clientId",schemaPath:"#/properties/nhi/properties/clientId/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters",schema:1,parentSchema:schema27.properties.nhi.properties.clientId,data:data11};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
else {
const err32 = {instancePath:instancePath+"/nhi/clientId",schemaPath:"#/properties/nhi/properties/clientId/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.nhi.properties.clientId.type,parentSchema:schema27.properties.nhi.properties.clientId,data:data11};
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
if(data10.siteUrl !== undefined){
let data12 = data10.siteUrl;
if(typeof data12 !== "string"){
const err34 = {instancePath:instancePath+"/nhi/siteUrl",schemaPath:"#/properties/nhi/properties/siteUrl/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.nhi.properties.siteUrl.type,parentSchema:schema27.properties.nhi.properties.siteUrl,data:data12};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(errors > 0){
const emErrs11 = [];
for(const err35 of vErrors){
if(!err35.emUsed){
emErrs11.push(err35);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
}
if(data10.issuer !== undefined){
let data13 = data10.issuer;
if(typeof data13 !== "string"){
const err36 = {instancePath:instancePath+"/nhi/issuer",schemaPath:"#/properties/nhi/properties/issuer/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.nhi.properties.issuer.type,parentSchema:schema27.properties.nhi.properties.issuer,data:data13};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err37 of vErrors){
if(!err37.emUsed){
emErrs12.push(err37);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
}
else {
const err38 = {instancePath:instancePath+"/nhi",schemaPath:"#/properties/nhi/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.nhi.type,parentSchema:schema27.properties.nhi,data:data10};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"required":{"clientId":[]}};
const templates1 = {required:{}};
let emPropParams1;
let emParamsErrors1;
for(const err39 of vErrors){
if((((((err39.keyword !== "errorMessage") && (!err39.emUsed)) && (err39.instancePath === instancePath+"/nhi")) && (err39.keyword in emErrors1)) && (err39.schemaPath.indexOf("#/properties/nhi") === 0)) && (/^\/[^\/]*$/.test(err39.schemaPath.slice(16)))){
emPropParams1 = obj0[err39.keyword];
emParamsErrors1 = emErrors1[err39.keyword][err39.params[emPropParams1]];
if(emParamsErrors1){
emParamsErrors1.push(err39);
err39.emUsed = true;
}
}
}
for(const key4 in emErrors1){
for(const keyProp1 in emErrors1[key4]){
emParamsErrors1 = emErrors1[key4][keyProp1];
if(emParamsErrors1.length){
const tmpl1 = templates1[key4] && templates1[key4][keyProp1];
const err40 = {instancePath:instancePath+"/nhi",schemaPath:"#/properties/nhi/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors1},message:tmpl1 ? tmpl1() : schema27.properties.nhi.errorMessage[key4][keyProp1],schema:schema27.properties.nhi.errorMessage,parentSchema:schema27.properties.nhi,data:data10};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
}
const emErrs13 = [];
for(const err41 of vErrors){
if(!err41.emUsed){
emErrs13.push(err41);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
if(data.instructors !== undefined){
let data14 = data.instructors;
if(Array.isArray(data14)){
const len3 = data14.length;
for(let i3=0; i3<len3; i3++){
let data15 = data14[i3];
if(!(data15 && typeof data15 == "object" && !Array.isArray(data15))){
const err42 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data15};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
const _errs37 = errors;
let valid12 = false;
let passing0 = null;
const _errs38 = errors;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.mode === undefined){
const err43 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema28.oneOf[0].required,parentSchema:schema28.oneOf[0],data:data15};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(data15.type === undefined){
const err44 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.oneOf[0].required,parentSchema:schema28.oneOf[0],data:data15};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data15.id === undefined){
const err45 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.oneOf[0].required,parentSchema:schema28.oneOf[0],data:data15};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
for(const key5 in data15){
if(!(((key5 === "mode") || (key5 === "type")) || (key5 === "id"))){
const err46 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties",schema:false,parentSchema:schema28.oneOf[0],data:data15};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data15.mode !== undefined){
let data16 = data15.mode;
if(typeof data16 !== "string"){
const err47 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[0].properties.mode.type,parentSchema:schema28.oneOf[0].properties.mode,data:data16};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if("member" !== data16){
const err48 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema28.oneOf[0].properties.mode,data:data16};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(errors > 0){
const emErrs14 = [];
for(const err49 of vErrors){
if(!err49.emUsed){
emErrs14.push(err49);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
if(data15.type !== undefined){
let data17 = data15.type;
if(typeof data17 !== "string"){
const err50 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[0].properties.type.type,parentSchema:schema28.oneOf[0].properties.type,data:data17};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if("user" !== data17){
const err51 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema28.oneOf[0].properties.type,data:data17};
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
if(data15.id !== undefined){
let data18 = data15.id;
if(typeof data18 !== "string"){
const err53 = {instancePath:instancePath+"/instructors/" + i3+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[0].properties.id.type,parentSchema:schema28.oneOf[0].properties.id,data:data18};
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
const err55 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.oneOf[0].type,parentSchema:schema28.oneOf[0],data:data15};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"mode":[],"type":[],"id":[]}};
const templates2 = {required:{}};
let emPropParams2;
let emParamsErrors2;
for(const err56 of vErrors){
if((((((err56.keyword !== "errorMessage") && (!err56.emUsed)) && (err56.instancePath === instancePath+"/instructors/" + i3)) && (err56.keyword in emErrors2)) && (err56.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref/oneOf/0") === 0)) && (/^\/[^\/]*$/.test(err56.schemaPath.slice(51)))){
emPropParams2 = obj0[err56.keyword];
emParamsErrors2 = emErrors2[err56.keyword][err56.params[emPropParams2]];
if(emParamsErrors2){
emParamsErrors2.push(err56);
err56.emUsed = true;
}
}
}
for(const key6 in emErrors2){
for(const keyProp2 in emErrors2[key6]){
emParamsErrors2 = emErrors2[key6][keyProp2];
if(emParamsErrors2.length){
const tmpl2 = templates2[key6] && templates2[key6][keyProp2];
const err57 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/0/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors2},message:tmpl2 ? tmpl2() : schema28.oneOf[0].errorMessage[key6][keyProp2],schema:schema28.oneOf[0].errorMessage,parentSchema:schema28.oneOf[0],data:data15};
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
var _valid0 = _errs38 === errors;
if(_valid0){
valid12 = true;
passing0 = 0;
var props0 = true;
}
const _errs47 = errors;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.mode === undefined){
const err59 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema28.oneOf[1].required,parentSchema:schema28.oneOf[1],data:data15};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(data15.type === undefined){
const err60 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.oneOf[1].required,parentSchema:schema28.oneOf[1],data:data15};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data15.email === undefined){
const err61 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/required",keyword:"required",params:{missingProperty: "email"},message:"must have required property '"+"email"+"'",schema:schema28.oneOf[1].required,parentSchema:schema28.oneOf[1],data:data15};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
for(const key7 in data15){
if(!(((key7 === "mode") || (key7 === "type")) || (key7 === "email"))){
const err62 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties",schema:false,parentSchema:schema28.oneOf[1],data:data15};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
if(data15.mode !== undefined){
let data19 = data15.mode;
if(typeof data19 !== "string"){
const err63 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[1].properties.mode.type,parentSchema:schema28.oneOf[1].properties.mode,data:data19};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if("member" !== data19){
const err64 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema28.oneOf[1].properties.mode,data:data19};
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
if(data15.type !== undefined){
let data20 = data15.type;
if(typeof data20 !== "string"){
const err66 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[1].properties.type.type,parentSchema:schema28.oneOf[1].properties.type,data:data20};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if("user" !== data20){
const err67 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "user"},message:"must be equal to constant",schema:"user",parentSchema:schema28.oneOf[1].properties.type,data:data20};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(errors > 0){
const emErrs19 = [];
for(const err68 of vErrors){
if(!err68.emUsed){
emErrs19.push(err68);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
}
if(data15.email !== undefined){
let data21 = data15.email;
if(typeof data21 === "string"){
if(!(formats0.test(data21))){
const err69 = {instancePath:instancePath+"/instructors/" + i3+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/email/format",keyword:"format",params:{format: "email"},message:"must match format \""+"email"+"\"",schema:"email",parentSchema:schema28.oneOf[1].properties.email,data:data21};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
else {
const err70 = {instancePath:instancePath+"/instructors/" + i3+"/email",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/properties/email/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[1].properties.email.type,parentSchema:schema28.oneOf[1].properties.email,data:data21};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err71 of vErrors){
if(!err71.emUsed){
emErrs20.push(err71);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
}
}
else {
const err72 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.oneOf[1].type,parentSchema:schema28.oneOf[1],data:data15};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(errors > 0){
const emErrors3 = {"required":{"mode":[],"type":[],"email":[]}};
const templates3 = {required:{}};
let emPropParams3;
let emParamsErrors3;
for(const err73 of vErrors){
if((((((err73.keyword !== "errorMessage") && (!err73.emUsed)) && (err73.instancePath === instancePath+"/instructors/" + i3)) && (err73.keyword in emErrors3)) && (err73.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref/oneOf/1") === 0)) && (/^\/[^\/]*$/.test(err73.schemaPath.slice(51)))){
emPropParams3 = obj0[err73.keyword];
emParamsErrors3 = emErrors3[err73.keyword][err73.params[emPropParams3]];
if(emParamsErrors3){
emParamsErrors3.push(err73);
err73.emUsed = true;
}
}
}
for(const key8 in emErrors3){
for(const keyProp3 in emErrors3[key8]){
emParamsErrors3 = emErrors3[key8][keyProp3];
if(emParamsErrors3.length){
const tmpl3 = templates3[key8] && templates3[key8][keyProp3];
const err74 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/1/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors3},message:tmpl3 ? tmpl3() : schema28.oneOf[1].errorMessage[key8][keyProp3],schema:schema28.oneOf[1].errorMessage,parentSchema:schema28.oneOf[1],data:data15};
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
const emErrs21 = [];
for(const err75 of vErrors){
if(!err75.emUsed){
emErrs21.push(err75);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
var _valid0 = _errs47 === errors;
if(_valid0 && valid12){
valid12 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid12 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs56 = errors;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.mode === undefined){
const err76 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema28.oneOf[2].required,parentSchema:schema28.oneOf[2],data:data15};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
if(data15.type === undefined){
const err77 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.oneOf[2].required,parentSchema:schema28.oneOf[2],data:data15};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(data15.id === undefined){
const err78 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.oneOf[2].required,parentSchema:schema28.oneOf[2],data:data15};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
for(const key9 in data15){
if(!(((((key9 === "mode") || (key9 === "type")) || (key9 === "department")) || (key9 === "roles")) || (key9 === "id"))){
const err79 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties",schema:false,parentSchema:schema28.oneOf[2],data:data15};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
if(data15.mode !== undefined){
let data22 = data15.mode;
if(typeof data22 !== "string"){
const err80 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[2].properties.mode.type,parentSchema:schema28.oneOf[2].properties.mode,data:data22};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if("member" !== data22){
const err81 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/mode/const",keyword:"const",params:{allowedValue: "member"},message:"must be equal to constant",schema:"member",parentSchema:schema28.oneOf[2].properties.mode,data:data22};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(errors > 0){
const emErrs22 = [];
for(const err82 of vErrors){
if(!err82.emUsed){
emErrs22.push(err82);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
}
if(data15.type !== undefined){
let data23 = data15.type;
if(typeof data23 !== "string"){
const err83 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[2].properties.type.type,parentSchema:schema28.oneOf[2].properties.type,data:data23};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if("organization" !== data23){
const err84 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant",schema:"organization",parentSchema:schema28.oneOf[2].properties.type,data:data23};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(errors > 0){
const emErrs23 = [];
for(const err85 of vErrors){
if(!err85.emUsed){
emErrs23.push(err85);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
}
if(data15.department !== undefined){
let data24 = data15.department;
if(typeof data24 !== "string"){
const err86 = {instancePath:instancePath+"/instructors/" + i3+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[2].properties.department.type,parentSchema:schema28.oneOf[2].properties.department,data:data24};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
if("*" !== data24){
const err87 = {instancePath:instancePath+"/instructors/" + i3+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/department/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema28.oneOf[2].properties.department,data:data24};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
if(errors > 0){
const emErrs24 = [];
for(const err88 of vErrors){
if(!err88.emUsed){
emErrs24.push(err88);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
if(data15.roles !== undefined){
let data25 = data15.roles;
if(!func0(data25, schema28.oneOf[2].properties.roles.const)){
const err89 = {instancePath:instancePath+"/instructors/" + i3+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/roles/const",keyword:"const",params:{allowedValue: schema28.oneOf[2].properties.roles.const},message:"must be equal to constant",schema:schema28.oneOf[2].properties.roles.const,parentSchema:schema28.oneOf[2].properties.roles,data:data25};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if(Array.isArray(data25)){
const len4 = data25.length;
for(let i4=0; i4<len4; i4++){
let data26 = data25[i4];
if(typeof data26 !== "string"){
const err90 = {instancePath:instancePath+"/instructors/" + i3+"/roles/" + i4,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[2].properties.roles.items.type,parentSchema:schema28.oneOf[2].properties.roles.items,data:data26};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err91 of vErrors){
if(!err91.emUsed){
emErrs25.push(err91);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
}
else {
const err92 = {instancePath:instancePath+"/instructors/" + i3+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema28.oneOf[2].properties.roles.type,parentSchema:schema28.oneOf[2].properties.roles,data:data25};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err93 of vErrors){
if(!err93.emUsed){
emErrs26.push(err93);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
if(data15.id !== undefined){
let data27 = data15.id;
if(typeof data27 !== "string"){
const err94 = {instancePath:instancePath+"/instructors/" + i3+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[2].properties.id.type,parentSchema:schema28.oneOf[2].properties.id,data:data27};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
if(errors > 0){
const emErrs27 = [];
for(const err95 of vErrors){
if(!err95.emUsed){
emErrs27.push(err95);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
}
}
else {
const err96 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.oneOf[2].type,parentSchema:schema28.oneOf[2],data:data15};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(errors > 0){
const emErrors4 = {"required":{"mode":[],"type":[],"id":[]}};
const templates4 = {required:{}};
let emPropParams4;
let emParamsErrors4;
for(const err97 of vErrors){
if((((((err97.keyword !== "errorMessage") && (!err97.emUsed)) && (err97.instancePath === instancePath+"/instructors/" + i3)) && (err97.keyword in emErrors4)) && (err97.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref/oneOf/2") === 0)) && (/^\/[^\/]*$/.test(err97.schemaPath.slice(51)))){
emPropParams4 = obj0[err97.keyword];
emParamsErrors4 = emErrors4[err97.keyword][err97.params[emPropParams4]];
if(emParamsErrors4){
emParamsErrors4.push(err97);
err97.emUsed = true;
}
}
}
for(const key10 in emErrors4){
for(const keyProp4 in emErrors4[key10]){
emParamsErrors4 = emErrors4[key10][keyProp4];
if(emParamsErrors4.length){
const tmpl4 = templates4[key10] && templates4[key10][keyProp4];
const err98 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/2/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors4},message:tmpl4 ? tmpl4() : schema28.oneOf[2].errorMessage[key10][keyProp4],schema:schema28.oneOf[2].errorMessage,parentSchema:schema28.oneOf[2],data:data15};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
}
const emErrs28 = [];
for(const err99 of vErrors){
if(!err99.emUsed){
emErrs28.push(err99);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
var _valid0 = _errs56 === errors;
if(_valid0 && valid12){
valid12 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid12 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
const _errs71 = errors;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.mode === undefined){
const err100 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'",schema:schema28.oneOf[3].required,parentSchema:schema28.oneOf[3],data:data15};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
if(data15.type === undefined){
const err101 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema28.oneOf[3].required,parentSchema:schema28.oneOf[3],data:data15};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
if(data15.id === undefined){
const err102 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'",schema:schema28.oneOf[3].required,parentSchema:schema28.oneOf[3],data:data15};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
for(const key11 in data15){
if(!(((((key11 === "mode") || (key11 === "type")) || (key11 === "id")) || (key11 === "department")) || (key11 === "roles"))){
const err103 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key11},message:"must NOT have additional properties",schema:false,parentSchema:schema28.oneOf[3],data:data15};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
if(data15.mode !== undefined){
let data28 = data15.mode;
if(typeof data28 !== "string"){
const err104 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/mode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[3].properties.mode.type,parentSchema:schema28.oneOf[3].properties.mode,data:data28};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
if("internal" !== data28){
const err105 = {instancePath:instancePath+"/instructors/" + i3+"/mode",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/mode/const",keyword:"const",params:{allowedValue: "internal"},message:"must be equal to constant",schema:"internal",parentSchema:schema28.oneOf[3].properties.mode,data:data28};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if(errors > 0){
const emErrs29 = [];
for(const err106 of vErrors){
if(!err106.emUsed){
emErrs29.push(err106);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
}
if(data15.type !== undefined){
let data29 = data15.type;
if(typeof data29 !== "string"){
const err107 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[3].properties.type.type,parentSchema:schema28.oneOf[3].properties.type,data:data29};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if("organization" !== data29){
const err108 = {instancePath:instancePath+"/instructors/" + i3+"/type",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "organization"},message:"must be equal to constant",schema:"organization",parentSchema:schema28.oneOf[3].properties.type,data:data29};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
if(errors > 0){
const emErrs30 = [];
for(const err109 of vErrors){
if(!err109.emUsed){
emErrs30.push(err109);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
}
if(data15.id !== undefined){
let data30 = data15.id;
if(typeof data30 !== "string"){
const err110 = {instancePath:instancePath+"/instructors/" + i3+"/id",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[3].properties.id.type,parentSchema:schema28.oneOf[3].properties.id,data:data30};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
if(errors > 0){
const emErrs31 = [];
for(const err111 of vErrors){
if(!err111.emUsed){
emErrs31.push(err111);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
}
if(data15.department !== undefined){
let data31 = data15.department;
if(typeof data31 !== "string"){
const err112 = {instancePath:instancePath+"/instructors/" + i3+"/department",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[3].properties.department.type,parentSchema:schema28.oneOf[3].properties.department,data:data31};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
if(errors > 0){
const emErrs32 = [];
for(const err113 of vErrors){
if(!err113.emUsed){
emErrs32.push(err113);
}
}
vErrors = emErrs32;
errors = emErrs32.length;
}
}
if(data15.roles !== undefined){
let data32 = data15.roles;
if(Array.isArray(data32)){
const len5 = data32.length;
for(let i5=0; i5<len5; i5++){
let data33 = data32[i5];
if(typeof data33 !== "string"){
const err114 = {instancePath:instancePath+"/instructors/" + i3+"/roles/" + i5,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/roles/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.oneOf[3].properties.roles.items.type,parentSchema:schema28.oneOf[3].properties.roles.items,data:data33};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
if(errors > 0){
const emErrs33 = [];
for(const err115 of vErrors){
if(!err115.emUsed){
emErrs33.push(err115);
}
}
vErrors = emErrs33;
errors = emErrs33.length;
}
}
}
else {
const err116 = {instancePath:instancePath+"/instructors/" + i3+"/roles",schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/properties/roles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema28.oneOf[3].properties.roles.type,parentSchema:schema28.oneOf[3].properties.roles,data:data32};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
if(errors > 0){
const emErrs34 = [];
for(const err117 of vErrors){
if(!err117.emUsed){
emErrs34.push(err117);
}
}
vErrors = emErrs34;
errors = emErrs34.length;
}
}
}
else {
const err118 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.oneOf[3].type,parentSchema:schema28.oneOf[3],data:data15};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if(errors > 0){
const emErrors5 = {"required":{"mode":[],"type":[],"id":[]}};
const templates5 = {required:{}};
let emPropParams5;
let emParamsErrors5;
for(const err119 of vErrors){
if((((((err119.keyword !== "errorMessage") && (!err119.emUsed)) && (err119.instancePath === instancePath+"/instructors/" + i3)) && (err119.keyword in emErrors5)) && (err119.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref/oneOf/3") === 0)) && (/^\/[^\/]*$/.test(err119.schemaPath.slice(51)))){
emPropParams5 = obj0[err119.keyword];
emParamsErrors5 = emErrors5[err119.keyword][err119.params[emPropParams5]];
if(emParamsErrors5){
emParamsErrors5.push(err119);
err119.emUsed = true;
}
}
}
for(const key12 in emErrors5){
for(const keyProp5 in emErrors5[key12]){
emParamsErrors5 = emErrors5[key12][keyProp5];
if(emParamsErrors5.length){
const tmpl5 = templates5[key12] && templates5[key12][keyProp5];
const err120 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf/3/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors5},message:tmpl5 ? tmpl5() : schema28.oneOf[3].errorMessage[key12][keyProp5],schema:schema28.oneOf[3].errorMessage,parentSchema:schema28.oneOf[3],data:data15};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
}
}
const emErrs35 = [];
for(const err121 of vErrors){
if(!err121.emUsed){
emErrs35.push(err121);
}
}
vErrors = emErrs35;
errors = emErrs35.length;
}
var _valid0 = _errs71 === errors;
if(_valid0 && valid12){
valid12 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid12 = true;
passing0 = 3;
if(props0 !== true){
props0 = true;
}
}
}
}
}
if(!valid12){
const err122 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema28.oneOf,parentSchema:schema28,data:data15};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
else {
errors = _errs37;
if(vErrors !== null){
if(_errs37){
vErrors.length = _errs37;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors6 = {"oneOf":[]};
const templates6 = {};
for(const err123 of vErrors){
if((((((err123.keyword !== "errorMessage") && (!err123.emUsed)) && (err123.instancePath === instancePath+"/instructors/" + i3)) && (err123.keyword in emErrors6)) && (err123.schemaPath.indexOf("https://github.com/data-fair/lib/access-ref") === 0)) && (/^\/[^\/]*$/.test(err123.schemaPath.slice(43)))){
emErrors6[err123.keyword].push(err123);
err123.emUsed = true;
}
}
for(const key13 in emErrors6){
if(emErrors6[key13].length){
const err124 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"https://github.com/data-fair/lib/access-ref/errorMessage",keyword:"errorMessage",params:{errors: emErrors6[key13]},message:key13 in templates6 ? templates6[key13]() : schema28.errorMessage[key13],schema:schema28.errorMessage,parentSchema:schema28,data:data15};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
}
const emErrs36 = [];
for(const err125 of vErrors){
if(!err125.emUsed){
emErrs36.push(err125);
}
}
vErrors = emErrs36;
errors = emErrs36.length;
}
if(errors > 0){
const emErrors7 = {"oneOf":[]};
const templates7 = {};
for(const err126 of vErrors){
if((((((err126.keyword !== "errorMessage") && (!err126.emUsed)) && (err126.instancePath === instancePath+"/instructors/" + i3)) && (err126.keyword in emErrors7)) && (err126.schemaPath.indexOf("#/properties/instructors/items") === 0)) && (/^\/[^\/]*$/.test(err126.schemaPath.slice(30)))){
emErrors7[err126.keyword].push(err126);
err126.emUsed = true;
}
}
for(const key14 in emErrors7){
if(emErrors7[key14].length){
const err127 = {instancePath:instancePath+"/instructors/" + i3,schemaPath:"#/properties/instructors/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors7[key14]},message:key14 in templates7 ? templates7[key14]() : schema27.properties.instructors.items.errorMessage[key14],schema:schema27.properties.instructors.items.errorMessage,parentSchema:schema27.properties.instructors.items,data:data15};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
}
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
}
else {
const err129 = {instancePath:instancePath+"/instructors",schemaPath:"#/properties/instructors/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.instructors.type,parentSchema:schema27.properties.instructors,data:data14};
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
if(data.approvals !== undefined){
let data34 = data.approvals;
if(data34 && typeof data34 == "object" && !Array.isArray(data34)){
for(const key15 in data34){
if(!(((key15 === "readOnly") || (key15 === "write")) || (key15 === "destructive"))){
const err131 = {instancePath:instancePath+"/approvals",schemaPath:"#/properties/approvals/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key15},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.approvals,data:data34};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
if(data34.readOnly !== undefined){
let data35 = data34.readOnly;
if(typeof data35 !== "string"){
const err132 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.approvals.properties.readOnly.type,parentSchema:schema27.properties.approvals.properties.readOnly,data:data35};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
const _errs91 = errors;
let valid22 = false;
let passing1 = null;
const _errs92 = errors;
if("allow" !== data35){
const err133 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/oneOf/0/const",keyword:"const",params:{allowedValue: "allow"},message:"must be equal to constant",schema:"allow",parentSchema:schema27.properties.approvals.properties.readOnly.oneOf[0],data:data35};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
var _valid1 = _errs92 === errors;
if(_valid1){
valid22 = true;
passing1 = 0;
}
const _errs93 = errors;
if("approve" !== data35){
const err134 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/oneOf/1/const",keyword:"const",params:{allowedValue: "approve"},message:"must be equal to constant",schema:"approve",parentSchema:schema27.properties.approvals.properties.readOnly.oneOf[1],data:data35};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
var _valid1 = _errs93 === errors;
if(_valid1 && valid22){
valid22 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid22 = true;
passing1 = 1;
}
const _errs94 = errors;
if("deny" !== data35){
const err135 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/oneOf/2/const",keyword:"const",params:{allowedValue: "deny"},message:"must be equal to constant",schema:"deny",parentSchema:schema27.properties.approvals.properties.readOnly.oneOf[2],data:data35};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
var _valid1 = _errs94 === errors;
if(_valid1 && valid22){
valid22 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid22 = true;
passing1 = 2;
}
}
}
if(!valid22){
const err136 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf",schema:schema27.properties.approvals.properties.readOnly.oneOf,parentSchema:schema27.properties.approvals.properties.readOnly,data:data35};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
else {
errors = _errs91;
if(vErrors !== null){
if(_errs91){
vErrors.length = _errs91;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors8 = {"oneOf":[]};
const templates8 = {};
for(const err137 of vErrors){
if((((((err137.keyword !== "errorMessage") && (!err137.emUsed)) && (err137.instancePath === instancePath+"/approvals/readOnly")) && (err137.keyword in emErrors8)) && (err137.schemaPath.indexOf("#/properties/approvals/properties/readOnly") === 0)) && (/^\/[^\/]*$/.test(err137.schemaPath.slice(42)))){
emErrors8[err137.keyword].push(err137);
err137.emUsed = true;
}
}
for(const key16 in emErrors8){
if(emErrors8[key16].length){
const err138 = {instancePath:instancePath+"/approvals/readOnly",schemaPath:"#/properties/approvals/properties/readOnly/errorMessage",keyword:"errorMessage",params:{errors: emErrors8[key16]},message:key16 in templates8 ? templates8[key16]() : schema27.properties.approvals.properties.readOnly.errorMessage[key16],schema:schema27.properties.approvals.properties.readOnly.errorMessage,parentSchema:schema27.properties.approvals.properties.readOnly,data:data35};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
}
const emErrs39 = [];
for(const err139 of vErrors){
if(!err139.emUsed){
emErrs39.push(err139);
}
}
vErrors = emErrs39;
errors = emErrs39.length;
}
}
if(data34.write !== undefined){
let data36 = data34.write;
if(typeof data36 !== "string"){
const err140 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.approvals.properties.write.type,parentSchema:schema27.properties.approvals.properties.write,data:data36};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
const _errs97 = errors;
let valid23 = false;
let passing2 = null;
const _errs98 = errors;
if("allow" !== data36){
const err141 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/oneOf/0/const",keyword:"const",params:{allowedValue: "allow"},message:"must be equal to constant",schema:"allow",parentSchema:schema27.properties.approvals.properties.write.oneOf[0],data:data36};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
var _valid2 = _errs98 === errors;
if(_valid2){
valid23 = true;
passing2 = 0;
}
const _errs99 = errors;
if("approve" !== data36){
const err142 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/oneOf/1/const",keyword:"const",params:{allowedValue: "approve"},message:"must be equal to constant",schema:"approve",parentSchema:schema27.properties.approvals.properties.write.oneOf[1],data:data36};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
var _valid2 = _errs99 === errors;
if(_valid2 && valid23){
valid23 = false;
passing2 = [passing2, 1];
}
else {
if(_valid2){
valid23 = true;
passing2 = 1;
}
const _errs100 = errors;
if("deny" !== data36){
const err143 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/oneOf/2/const",keyword:"const",params:{allowedValue: "deny"},message:"must be equal to constant",schema:"deny",parentSchema:schema27.properties.approvals.properties.write.oneOf[2],data:data36};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
var _valid2 = _errs100 === errors;
if(_valid2 && valid23){
valid23 = false;
passing2 = [passing2, 2];
}
else {
if(_valid2){
valid23 = true;
passing2 = 2;
}
}
}
if(!valid23){
const err144 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/oneOf",keyword:"oneOf",params:{passingSchemas: passing2},message:"must match exactly one schema in oneOf",schema:schema27.properties.approvals.properties.write.oneOf,parentSchema:schema27.properties.approvals.properties.write,data:data36};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
else {
errors = _errs97;
if(vErrors !== null){
if(_errs97){
vErrors.length = _errs97;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors9 = {"oneOf":[]};
const templates9 = {};
for(const err145 of vErrors){
if((((((err145.keyword !== "errorMessage") && (!err145.emUsed)) && (err145.instancePath === instancePath+"/approvals/write")) && (err145.keyword in emErrors9)) && (err145.schemaPath.indexOf("#/properties/approvals/properties/write") === 0)) && (/^\/[^\/]*$/.test(err145.schemaPath.slice(39)))){
emErrors9[err145.keyword].push(err145);
err145.emUsed = true;
}
}
for(const key17 in emErrors9){
if(emErrors9[key17].length){
const err146 = {instancePath:instancePath+"/approvals/write",schemaPath:"#/properties/approvals/properties/write/errorMessage",keyword:"errorMessage",params:{errors: emErrors9[key17]},message:key17 in templates9 ? templates9[key17]() : schema27.properties.approvals.properties.write.errorMessage[key17],schema:schema27.properties.approvals.properties.write.errorMessage,parentSchema:schema27.properties.approvals.properties.write,data:data36};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
}
const emErrs40 = [];
for(const err147 of vErrors){
if(!err147.emUsed){
emErrs40.push(err147);
}
}
vErrors = emErrs40;
errors = emErrs40.length;
}
}
if(data34.destructive !== undefined){
let data37 = data34.destructive;
if(typeof data37 !== "string"){
const err148 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.approvals.properties.destructive.type,parentSchema:schema27.properties.approvals.properties.destructive,data:data37};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
const _errs103 = errors;
let valid24 = false;
let passing3 = null;
const _errs104 = errors;
if("allow" !== data37){
const err149 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/oneOf/0/const",keyword:"const",params:{allowedValue: "allow"},message:"must be equal to constant",schema:"allow",parentSchema:schema27.properties.approvals.properties.destructive.oneOf[0],data:data37};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
var _valid3 = _errs104 === errors;
if(_valid3){
valid24 = true;
passing3 = 0;
}
const _errs105 = errors;
if("approve" !== data37){
const err150 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/oneOf/1/const",keyword:"const",params:{allowedValue: "approve"},message:"must be equal to constant",schema:"approve",parentSchema:schema27.properties.approvals.properties.destructive.oneOf[1],data:data37};
if(vErrors === null){
vErrors = [err150];
}
else {
vErrors.push(err150);
}
errors++;
}
var _valid3 = _errs105 === errors;
if(_valid3 && valid24){
valid24 = false;
passing3 = [passing3, 1];
}
else {
if(_valid3){
valid24 = true;
passing3 = 1;
}
const _errs106 = errors;
if("deny" !== data37){
const err151 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/oneOf/2/const",keyword:"const",params:{allowedValue: "deny"},message:"must be equal to constant",schema:"deny",parentSchema:schema27.properties.approvals.properties.destructive.oneOf[2],data:data37};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
var _valid3 = _errs106 === errors;
if(_valid3 && valid24){
valid24 = false;
passing3 = [passing3, 2];
}
else {
if(_valid3){
valid24 = true;
passing3 = 2;
}
}
}
if(!valid24){
const err152 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/oneOf",keyword:"oneOf",params:{passingSchemas: passing3},message:"must match exactly one schema in oneOf",schema:schema27.properties.approvals.properties.destructive.oneOf,parentSchema:schema27.properties.approvals.properties.destructive,data:data37};
if(vErrors === null){
vErrors = [err152];
}
else {
vErrors.push(err152);
}
errors++;
}
else {
errors = _errs103;
if(vErrors !== null){
if(_errs103){
vErrors.length = _errs103;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors10 = {"oneOf":[]};
const templates10 = {};
for(const err153 of vErrors){
if((((((err153.keyword !== "errorMessage") && (!err153.emUsed)) && (err153.instancePath === instancePath+"/approvals/destructive")) && (err153.keyword in emErrors10)) && (err153.schemaPath.indexOf("#/properties/approvals/properties/destructive") === 0)) && (/^\/[^\/]*$/.test(err153.schemaPath.slice(45)))){
emErrors10[err153.keyword].push(err153);
err153.emUsed = true;
}
}
for(const key18 in emErrors10){
if(emErrors10[key18].length){
const err154 = {instancePath:instancePath+"/approvals/destructive",schemaPath:"#/properties/approvals/properties/destructive/errorMessage",keyword:"errorMessage",params:{errors: emErrors10[key18]},message:key18 in templates10 ? templates10[key18]() : schema27.properties.approvals.properties.destructive.errorMessage[key18],schema:schema27.properties.approvals.properties.destructive.errorMessage,parentSchema:schema27.properties.approvals.properties.destructive,data:data37};
if(vErrors === null){
vErrors = [err154];
}
else {
vErrors.push(err154);
}
errors++;
}
}
const emErrs41 = [];
for(const err155 of vErrors){
if(!err155.emUsed){
emErrs41.push(err155);
}
}
vErrors = emErrs41;
errors = emErrs41.length;
}
}
}
else {
const err156 = {instancePath:instancePath+"/approvals",schemaPath:"#/properties/approvals/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.approvals.type,parentSchema:schema27.properties.approvals,data:data34};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
if(errors > 0){
const emErrs42 = [];
for(const err157 of vErrors){
if(!err157.emUsed){
emErrs42.push(err157);
}
}
vErrors = emErrs42;
errors = emErrs42.length;
}
}
if(data.memory !== undefined){
let data38 = data.memory;
if(data38 && typeof data38 == "object" && !Array.isArray(data38)){
if(data38.enabled === undefined){
const err158 = {instancePath:instancePath+"/memory",schemaPath:"#/properties/memory/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.memory.required,parentSchema:schema27.properties.memory,data:data38};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
for(const key19 in data38){
if(!(key19 === "enabled")){
const err159 = {instancePath:instancePath+"/memory",schemaPath:"#/properties/memory/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key19},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.memory,data:data38};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
}
if(data38.enabled !== undefined){
let data39 = data38.enabled;
if(typeof data39 !== "boolean"){
const err160 = {instancePath:instancePath+"/memory/enabled",schemaPath:"#/properties/memory/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.memory.properties.enabled.type,parentSchema:schema27.properties.memory.properties.enabled,data:data39};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
if(errors > 0){
const emErrs43 = [];
for(const err161 of vErrors){
if(!err161.emUsed){
emErrs43.push(err161);
}
}
vErrors = emErrs43;
errors = emErrs43.length;
}
}
}
else {
const err162 = {instancePath:instancePath+"/memory",schemaPath:"#/properties/memory/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.memory.type,parentSchema:schema27.properties.memory,data:data38};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
if(errors > 0){
const emErrors11 = {"required":{"enabled":[]}};
const templates11 = {required:{}};
let emPropParams6;
let emParamsErrors6;
for(const err163 of vErrors){
if((((((err163.keyword !== "errorMessage") && (!err163.emUsed)) && (err163.instancePath === instancePath+"/memory")) && (err163.keyword in emErrors11)) && (err163.schemaPath.indexOf("#/properties/memory") === 0)) && (/^\/[^\/]*$/.test(err163.schemaPath.slice(19)))){
emPropParams6 = obj0[err163.keyword];
emParamsErrors6 = emErrors11[err163.keyword][err163.params[emPropParams6]];
if(emParamsErrors6){
emParamsErrors6.push(err163);
err163.emUsed = true;
}
}
}
for(const key20 in emErrors11){
for(const keyProp6 in emErrors11[key20]){
emParamsErrors6 = emErrors11[key20][keyProp6];
if(emParamsErrors6.length){
const tmpl6 = templates11[key20] && templates11[key20][keyProp6];
const err164 = {instancePath:instancePath+"/memory",schemaPath:"#/properties/memory/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors6},message:tmpl6 ? tmpl6() : schema27.properties.memory.errorMessage[key20][keyProp6],schema:schema27.properties.memory.errorMessage,parentSchema:schema27.properties.memory,data:data38};
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
const emErrs44 = [];
for(const err165 of vErrors){
if(!err165.emUsed){
emErrs44.push(err165);
}
}
vErrors = emErrs44;
errors = emErrs44.length;
}
}
if(data.web !== undefined){
let data40 = data.web;
if(data40 && typeof data40 == "object" && !Array.isArray(data40)){
if(data40.enabled === undefined){
const err166 = {instancePath:instancePath+"/web",schemaPath:"#/properties/web/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.web.required,parentSchema:schema27.properties.web,data:data40};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
for(const key21 in data40){
if(!((key21 === "enabled") || (key21 === "allowedUrls"))){
const err167 = {instancePath:instancePath+"/web",schemaPath:"#/properties/web/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key21},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.web,data:data40};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
}
if(data40.enabled !== undefined){
let data41 = data40.enabled;
if(typeof data41 !== "boolean"){
const err168 = {instancePath:instancePath+"/web/enabled",schemaPath:"#/properties/web/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.web.properties.enabled.type,parentSchema:schema27.properties.web.properties.enabled,data:data41};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
if(errors > 0){
const emErrs45 = [];
for(const err169 of vErrors){
if(!err169.emUsed){
emErrs45.push(err169);
}
}
vErrors = emErrs45;
errors = emErrs45.length;
}
}
if(data40.allowedUrls !== undefined){
let data42 = data40.allowedUrls;
if(Array.isArray(data42)){
if(data42.length > 100){
const err170 = {instancePath:instancePath+"/web/allowedUrls",schemaPath:"#/properties/web/properties/allowedUrls/maxItems",keyword:"maxItems",params:{limit: 100},message:"must NOT have more than 100 items",schema:100,parentSchema:schema27.properties.web.properties.allowedUrls,data:data42};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
const len6 = data42.length;
for(let i6=0; i6<len6; i6++){
let data43 = data42[i6];
if(typeof data43 === "string"){
if(func2(data43) < 1){
const err171 = {instancePath:instancePath+"/web/allowedUrls/" + i6,schemaPath:"#/properties/web/properties/allowedUrls/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters",schema:1,parentSchema:schema27.properties.web.properties.allowedUrls.items,data:data43};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
}
else {
const err172 = {instancePath:instancePath+"/web/allowedUrls/" + i6,schemaPath:"#/properties/web/properties/allowedUrls/items/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.web.properties.allowedUrls.items.type,parentSchema:schema27.properties.web.properties.allowedUrls.items,data:data43};
if(vErrors === null){
vErrors = [err172];
}
else {
vErrors.push(err172);
}
errors++;
}
if(errors > 0){
const emErrs46 = [];
for(const err173 of vErrors){
if(!err173.emUsed){
emErrs46.push(err173);
}
}
vErrors = emErrs46;
errors = emErrs46.length;
}
}
}
else {
const err174 = {instancePath:instancePath+"/web/allowedUrls",schemaPath:"#/properties/web/properties/allowedUrls/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.web.properties.allowedUrls.type,parentSchema:schema27.properties.web.properties.allowedUrls,data:data42};
if(vErrors === null){
vErrors = [err174];
}
else {
vErrors.push(err174);
}
errors++;
}
if(errors > 0){
const emErrs47 = [];
for(const err175 of vErrors){
if(!err175.emUsed){
emErrs47.push(err175);
}
}
vErrors = emErrs47;
errors = emErrs47.length;
}
}
}
else {
const err176 = {instancePath:instancePath+"/web",schemaPath:"#/properties/web/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.web.type,parentSchema:schema27.properties.web,data:data40};
if(vErrors === null){
vErrors = [err176];
}
else {
vErrors.push(err176);
}
errors++;
}
if(errors > 0){
const emErrors12 = {"required":{"enabled":[]}};
const templates12 = {required:{}};
let emPropParams7;
let emParamsErrors7;
for(const err177 of vErrors){
if((((((err177.keyword !== "errorMessage") && (!err177.emUsed)) && (err177.instancePath === instancePath+"/web")) && (err177.keyword in emErrors12)) && (err177.schemaPath.indexOf("#/properties/web") === 0)) && (/^\/[^\/]*$/.test(err177.schemaPath.slice(16)))){
emPropParams7 = obj0[err177.keyword];
emParamsErrors7 = emErrors12[err177.keyword][err177.params[emPropParams7]];
if(emParamsErrors7){
emParamsErrors7.push(err177);
err177.emUsed = true;
}
}
}
for(const key22 in emErrors12){
for(const keyProp7 in emErrors12[key22]){
emParamsErrors7 = emErrors12[key22][keyProp7];
if(emParamsErrors7.length){
const tmpl7 = templates12[key22] && templates12[key22][keyProp7];
const err178 = {instancePath:instancePath+"/web",schemaPath:"#/properties/web/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors7},message:tmpl7 ? tmpl7() : schema27.properties.web.errorMessage[key22][keyProp7],schema:schema27.properties.web.errorMessage,parentSchema:schema27.properties.web,data:data40};
if(vErrors === null){
vErrors = [err178];
}
else {
vErrors.push(err178);
}
errors++;
}
}
}
const emErrs48 = [];
for(const err179 of vErrors){
if(!err179.emUsed){
emErrs48.push(err179);
}
}
vErrors = emErrs48;
errors = emErrs48.length;
}
}
if(data.externalMcpServers !== undefined){
let data44 = data.externalMcpServers;
if(Array.isArray(data44)){
if(data44.length > 50){
const err180 = {instancePath:instancePath+"/externalMcpServers",schemaPath:"#/properties/externalMcpServers/maxItems",keyword:"maxItems",params:{limit: 50},message:"must NOT have more than 50 items",schema:50,parentSchema:schema27.properties.externalMcpServers,data:data44};
if(vErrors === null){
vErrors = [err180];
}
else {
vErrors.push(err180);
}
errors++;
}
const len7 = data44.length;
for(let i7=0; i7<len7; i7++){
let data45 = data44[i7];
if(data45 && typeof data45 == "object" && !Array.isArray(data45)){
if(data45.url === undefined){
const err181 = {instancePath:instancePath+"/externalMcpServers/" + i7,schemaPath:"#/properties/externalMcpServers/items/required",keyword:"required",params:{missingProperty: "url"},message:"must have required property '"+"url"+"'",schema:schema27.properties.externalMcpServers.items.required,parentSchema:schema27.properties.externalMcpServers.items,data:data45};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
for(const key23 in data45){
if(!(key23 === "url")){
const err182 = {instancePath:instancePath+"/externalMcpServers/" + i7,schemaPath:"#/properties/externalMcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key23},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.externalMcpServers.items,data:data45};
if(vErrors === null){
vErrors = [err182];
}
else {
vErrors.push(err182);
}
errors++;
}
}
if(data45.url !== undefined){
let data46 = data45.url;
if(typeof data46 === "string"){
if(func2(data46) < 1){
const err183 = {instancePath:instancePath+"/externalMcpServers/" + i7+"/url",schemaPath:"#/properties/externalMcpServers/items/properties/url/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters",schema:1,parentSchema:schema27.properties.externalMcpServers.items.properties.url,data:data46};
if(vErrors === null){
vErrors = [err183];
}
else {
vErrors.push(err183);
}
errors++;
}
}
else {
const err184 = {instancePath:instancePath+"/externalMcpServers/" + i7+"/url",schemaPath:"#/properties/externalMcpServers/items/properties/url/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.externalMcpServers.items.properties.url.type,parentSchema:schema27.properties.externalMcpServers.items.properties.url,data:data46};
if(vErrors === null){
vErrors = [err184];
}
else {
vErrors.push(err184);
}
errors++;
}
if(errors > 0){
const emErrs49 = [];
for(const err185 of vErrors){
if(!err185.emUsed){
emErrs49.push(err185);
}
}
vErrors = emErrs49;
errors = emErrs49.length;
}
}
}
else {
const err186 = {instancePath:instancePath+"/externalMcpServers/" + i7,schemaPath:"#/properties/externalMcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.externalMcpServers.items.type,parentSchema:schema27.properties.externalMcpServers.items,data:data45};
if(vErrors === null){
vErrors = [err186];
}
else {
vErrors.push(err186);
}
errors++;
}
if(errors > 0){
const emErrors13 = {"required":{"url":[]}};
const templates13 = {required:{}};
let emPropParams8;
let emParamsErrors8;
for(const err187 of vErrors){
if((((((err187.keyword !== "errorMessage") && (!err187.emUsed)) && (err187.instancePath === instancePath+"/externalMcpServers/" + i7)) && (err187.keyword in emErrors13)) && (err187.schemaPath.indexOf("#/properties/externalMcpServers/items") === 0)) && (/^\/[^\/]*$/.test(err187.schemaPath.slice(37)))){
emPropParams8 = obj0[err187.keyword];
emParamsErrors8 = emErrors13[err187.keyword][err187.params[emPropParams8]];
if(emParamsErrors8){
emParamsErrors8.push(err187);
err187.emUsed = true;
}
}
}
for(const key24 in emErrors13){
for(const keyProp8 in emErrors13[key24]){
emParamsErrors8 = emErrors13[key24][keyProp8];
if(emParamsErrors8.length){
const tmpl8 = templates13[key24] && templates13[key24][keyProp8];
const err188 = {instancePath:instancePath+"/externalMcpServers/" + i7,schemaPath:"#/properties/externalMcpServers/items/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors8},message:tmpl8 ? tmpl8() : schema27.properties.externalMcpServers.items.errorMessage[key24][keyProp8],schema:schema27.properties.externalMcpServers.items.errorMessage,parentSchema:schema27.properties.externalMcpServers.items,data:data45};
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
const emErrs50 = [];
for(const err189 of vErrors){
if(!err189.emUsed){
emErrs50.push(err189);
}
}
vErrors = emErrs50;
errors = emErrs50.length;
}
}
}
else {
const err190 = {instancePath:instancePath+"/externalMcpServers",schemaPath:"#/properties/externalMcpServers/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.externalMcpServers.type,parentSchema:schema27.properties.externalMcpServers,data:data44};
if(vErrors === null){
vErrors = [err190];
}
else {
vErrors.push(err190);
}
errors++;
}
if(errors > 0){
const emErrs51 = [];
for(const err191 of vErrors){
if(!err191.emUsed){
emErrs51.push(err191);
}
}
vErrors = emErrs51;
errors = emErrs51.length;
}
}
if(data.enabled !== undefined){
let data47 = data.enabled;
if(typeof data47 !== "boolean"){
const err192 = {instancePath:instancePath+"/enabled",schemaPath:"#/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.enabled.type,parentSchema:schema27.properties.enabled,data:data47};
if(vErrors === null){
vErrors = [err192];
}
else {
vErrors.push(err192);
}
errors++;
}
if(errors > 0){
const emErrs52 = [];
for(const err193 of vErrors){
if(!err193.emUsed){
emErrs52.push(err193);
}
}
vErrors = emErrs52;
errors = emErrs52.length;
}
}
}
else {
const err194 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err194];
}
else {
vErrors.push(err194);
}
errors++;
}
if(errors > 0){
const emErrors14 = {"required":{"title":[],"persona":[],"mcpServers":[],"enabled":[]}};
const templates14 = {required:{}};
let emPropParams9;
let emParamsErrors9;
for(const err195 of vErrors){
if((((((err195.keyword !== "errorMessage") && (!err195.emUsed)) && (err195.instancePath === instancePath)) && (err195.keyword in emErrors14)) && (err195.schemaPath.indexOf("#") === 0)) && (/^\/[^\/]*$/.test(err195.schemaPath.slice(1)))){
emPropParams9 = obj0[err195.keyword];
emParamsErrors9 = emErrors14[err195.keyword][err195.params[emPropParams9]];
if(emParamsErrors9){
emParamsErrors9.push(err195);
err195.emUsed = true;
}
}
}
for(const key25 in emErrors14){
for(const keyProp9 in emErrors14[key25]){
emParamsErrors9 = emErrors14[key25][keyProp9];
if(emParamsErrors9.length){
const tmpl9 = templates14[key25] && templates14[key25][keyProp9];
const err196 = {instancePath,schemaPath:"#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors9},message:tmpl9 ? tmpl9() : schema27.errorMessage[key25][keyProp9],schema:schema27.errorMessage,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err196];
}
else {
vErrors.push(err196);
}
errors++;
}
}
}
const emErrs53 = [];
for(const err197 of vErrors){
if(!err197.emUsed){
emErrs53.push(err197);
}
}
vErrors = emErrs53;
errors = emErrs53.length;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate36(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export12" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate36.evaluated;
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
validate36.errors = vErrors;
return errors === 0;
}
validate36.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
function expression0(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.defaultData)
}function expression1(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item?.serverId || "")
}function expression2(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers`
}function expression3(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item.name)
}function expression4(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item.id)
}function expression5(data,body,options,context,display,layout,readOnly,summary,validates
) {
return (data.results)
}function expression6(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return (context.profiledServers?.includes(parent.data?.serverId))
}function expression7(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return (!context.profiledServers?.includes(parent.data?.serverId))
}function expression8(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.options)
}function expression9(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (context.owner.type === 'organization')
}function expression10(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.constData)
}function expression11(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `/simple-directory/api/organizations/${context.owner.id}/members`
}function expression12(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (`/simple-directory/api/avatars/user/${item.id}/avatar.png`)
}function expression13(data,value,options,context,display,layout,readOnly,summary,validates
) {
return `/simple-directory/api/organizations/${context.owner.id}`
}function expression14(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (`/simple-directory/api/avatars/organization/${item.id}/avatar.png`)
}function expression15(data,body,options,context,display,layout,readOnly,summary,validates
) {
return (data.partners)
}function expression16(data,body,options,context,display,layout,readOnly,summary,validates
) {
return ([...(data.departments || []), {id: "*", name: "Tous les départements"}, {id: "-", name: "Racine de l'organisation uniquement"}])
}function expression17(data,body,options,context,display,layout,readOnly,summary,validates
) {
return (data.roles)
}function expression18(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ([{"const":"allow","title":"Allow","key":"allow","value":"allow"},{"const":"approve","title":"Approve each call","key":"approve","value":"approve"},{"const":"deny","title":"Never offer","key":"deny","value":"deny"}])
}function expression19(data,value,options,context,display,layout,readOnly,summary,validates,rootData,parent
) {
return (parent.data?.enabled)
}function expression20(data,item,options,context,display,layout,readOnly,summary,validates
) {
return (item?.url || "")
}
const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/autonomous-agent/write-req#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/autonomous-agent/write-req#": {
      title: "Autonomous agent",
      root: "https://github.com/data-fair/agents/autonomous-agent/write-req#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items": {
      title: "",
      root: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items": {
      title: "",
      root: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items": {
      title: "",
      root: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items": {
      title: "Access Ref",
      root: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items",
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
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items": {
      title: "",
      root: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items": {
      title: "",
      root: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/autonomous-agent/write-req#": {
      title: "Autonomous agent",
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#",
      pure: false,

      propertyKeys: [
        "title",
        "persona",
        "instructions",
        "mcpServers",
        "nhi",
        "instructors",
        "approvals",
        "memory",
        "web",
        "externalMcpServers",
        "enabled"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/title",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/persona",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructions",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/memory",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/enabled"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/title": {
      title: "Name",
      key: "title",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/title",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/title",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/persona": {
      title: "Persona",
      key: "persona",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/persona",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/persona",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructions": {
      title: "Instructions",
      key: "instructions",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructions",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructions",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers": {
      title: "MCP servers",
      key: "mcpServers",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers",
      pure: false,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items",
      pure: false,

      propertyKeys: [
        "serverId",
        "profiles",
        "toolFilter"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId": {
      title: "Server",
      key: "serverId",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles": {
      title: "Profiles",
      key: "profiles",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles",
      pure: false,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter": {
      title: "Only these tools",
      key: "toolFilter",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter",
      pure: false,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi": {
      title: "Non-human identity",
      key: "nhi",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi",
      pure: true,
      propertyKeys: ["clientId", "siteUrl", "issuer"],
      roPropertyKeys: ["siteUrl", "issuer"],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/siteUrl",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/issuer"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId": {
      title: "Client id",
      key: "clientId",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/siteUrl": {
      title: undefined,
      key: "siteUrl",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/siteUrl",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/siteUrl",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/issuer": {
      title: undefined,
      key: "issuer",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/issuer",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/issuer",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors": {
      title: "Who may instruct",
      key: "instructors",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items": {
      title: "Access Ref",
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items",
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

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals": {
      title: "Approvals",
      key: "approvals",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals",
      pure: true,

      propertyKeys: [
        "readOnly",
        "write",
        "destructive"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/readOnly",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/write",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/destructive"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/readOnly": {
      title: "Reading",
      key: "readOnly",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/readOnly",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/readOnly",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/write": {
      title: "Writing",
      key: "write",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/write",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/write",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/destructive": {
      title: "Destructive",
      key: "destructive",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/destructive",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/destructive",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/memory": {
      title: "Memory",
      key: "memory",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/memory",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/memory",
      pure: true,
      propertyKeys: ["enabled"],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/memory/properties/enabled"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/memory/properties/enabled": {
      title: "Keep a memory across conversations",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/memory/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/memory/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web": {
      title: "Web access",
      key: "web",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web",
      pure: false,
      propertyKeys: ["enabled", "allowedUrls"],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/enabled",
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/enabled": {
      title: "Read web pages",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls": {
      title: "Allowed URLs",
      key: "allowedUrls",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls",
      pure: false,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers": {
      title: "External MCP servers",
      key: "externalMcpServers",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items",
      pure: true,
      propertyKeys: ["url"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items/properties/url"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items/properties/url": {
      title: "URL",
      key: "url",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items/properties/url",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items/properties/url",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/enabled": {
      title: "Enabled",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/autonomous-agent/write-req#": {
      title: null,
      comp: "section",

      children: [{
        key: "title"
      }, {
        key: "persona"
      }, {
        key: "instructions"
      }, {
        key: "mcpServers"
      }, {
        key: "nhi"
      }, {
        key: "instructors"
      }, {
        key: "approvals"
      }, {
        key: "memory"
      }, {
        key: "web"
      }, {
        key: "externalMcpServers"
      }, {
        key: "enabled"
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

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/title": {
      comp: "text-field",
      label: "Name"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/persona": {
      comp: "textarea",
      label: "Persona",
      help: "<p>Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.</p>"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructions": {
      comp: "textarea",
      label: "Instructions",
      help: "<p>How it should work: procedures, constraints, what to do when unsure.</p>"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers": {
      itemTitle: {
        type: "js-eval",
        expr: "item?.serverId || \"\"",
        pure: true,
        dataAlias: "item",
        ref: 1
      },

      listActions: ["add", "edit", "delete"],
      comp: "list",
      title: "MCP servers",
      listEditMode: "inline-single",
      help: "<p>Picked from the servers configured for this deployment.</p>",
      defaultData: [],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items": {
      comp: "section",

      children: [{
        key: "serverId"
      }, {
        key: "profiles"
      }, {
        key: "toolFilter"
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

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/serverId": {
      comp: "autocomplete",

      getItems: {
        url: {
          type: "js-tpl",
          expr: "${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers",
          pure: true,
          dataAlias: "value",
          ref: 2
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.results",
          pure: true,
          dataAlias: "body",
          ref: 5
        },

        itemTitle: {
          type: "js-eval",
          expr: "item.name",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemKey: {
          type: "js-eval",
          expr: "item.id",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        itemValue: {
          type: "js-eval",
          expr: "item.id",
          pure: true,
          dataAlias: "item",
          ref: 4
        }
      },

      label: "Server"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles": {
      if: {
        type: "js-eval",
        expr: "context.profiledServers?.includes(parent.data?.serverId)",
        pure: false,
        dataAlias: "value",
        ref: 6
      },

      slots: {
        component: {
          name: "mcp-profiles",
          props: undefined
        }
      },

      comp: "slot",
      help: "<p>What this server lets the agent do, by profile.</p>"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items": {
      comp: "text-field",
      label: "",
      nullable: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter": {
      if: {
        type: "js-eval",
        expr: "!context.profiledServers?.includes(parent.data?.serverId)",
        pure: false,
        dataAlias: "value",
        ref: 7
      },

      comp: "combobox",
      multiple: true,
      label: "Only these tools",
      help: "<p>Leave empty to expose every tool this server offers.</p>"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items": {
      comp: "text-field",
      label: "",
      nullable: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi": {
      comp: "section",

      children: [{
        key: "clientId"
      }, {
        key: "siteUrl"
      }, {
        key: "issuer"
      }],

      title: "Non-human identity"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/clientId": {
      comp: "text-field",
      label: "Client id"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/siteUrl": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "siteUrl",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 8
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/nhi/properties/issuer": {
      comp: "text-field",

      options: {
        readOnly: true
      },

      label: "issuer",

      getOptions: {
        type: "js-eval",
        expr: "layout.options",
        pure: true,
        dataAlias: "value",
        ref: 8
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors": {
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

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/instructors/items": {
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
        ref: 9
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
        ref: 10
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
        ref: 10
      }
    },

    "https://github.com/data-fair/lib/access-ref#/oneOf/0/properties/id": {
      getItems: {
        url: {
          type: "js-tpl",
          expr: "/simple-directory/api/organizations/${context.owner.id}/members",
          pure: true,
          dataAlias: "value",
          ref: 11
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.results",
          pure: true,
          dataAlias: "body",
          ref: 5
        },

        itemTitle: {
          type: "js-eval",
          expr: "item.name",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemValue: {
          type: "js-eval",
          expr: "item.id",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        itemIcon: {
          type: "js-eval",
          expr: "`/simple-directory/api/avatars/user/${item.id}/avatar.png`",
          pure: true,
          dataAlias: "item",
          ref: 12
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
        ref: 10
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
        ref: 10
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
        ref: 9
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
        ref: 10
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
        ref: 10
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
        ref: 10
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
        ref: 10
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
          ref: 13
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.partners",
          pure: true,
          dataAlias: "body",
          ref: 15
        },

        itemTitle: {
          type: "js-eval",
          expr: "item.name",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemValue: {
          type: "js-eval",
          expr: "item.id",
          pure: true,
          dataAlias: "item",
          ref: 4
        },

        itemIcon: {
          type: "js-eval",
          expr: "`/simple-directory/api/avatars/organization/${item.id}/avatar.png`",
          pure: true,
          dataAlias: "item",
          ref: 14
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
        ref: 9
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
        ref: 10
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
        ref: 10
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
          ref: 13
        },

        itemsResults: {
          type: "js-eval",
          expr: "[...(data.departments || []), {id: \"*\", name: \"Tous les départements\"}, {id: \"-\", name: \"Racine de l'organisation uniquement\"}]",
          pure: true,
          dataAlias: "body",
          ref: 16
        },

        itemTitle: {
          type: "js-eval",
          expr: "item.name",
          pure: true,
          dataAlias: "item",
          ref: 3
        },

        itemValue: {
          type: "js-eval",
          expr: "item.id",
          pure: true,
          dataAlias: "item",
          ref: 4
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
          ref: 13
        },

        itemsResults: {
          type: "js-eval",
          expr: "data.roles",
          pure: true,
          dataAlias: "body",
          ref: 17
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

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals": {
      comp: "section",

      children: [{
        key: "readOnly"
      }, {
        key: "write"
      }, {
        key: "destructive"
      }],

      title: "Approvals",
      subtitle: "<p>What happens when this autonomous agent calls a tool, by the kind of action the tool declares. &quot;Approve&quot; stops the turn until the person in the chat approves the call; a scheduled task never gets such a tool. Tools that declare nothing count as writing.</p>"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/readOnly": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"allow\",\"title\":\"Allow\",\"key\":\"allow\",\"value\":\"allow\"},{\"const\":\"approve\",\"title\":\"Approve each call\",\"key\":\"approve\",\"value\":\"approve\"},{\"const\":\"deny\",\"title\":\"Never offer\",\"key\":\"deny\",\"value\":\"deny\"}]",
        immutable: true,
        ref: 18
      },

      label: "Reading",
      defaultData: "allow",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/write": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"allow\",\"title\":\"Allow\",\"key\":\"allow\",\"value\":\"allow\"},{\"const\":\"approve\",\"title\":\"Approve each call\",\"key\":\"approve\",\"value\":\"approve\"},{\"const\":\"deny\",\"title\":\"Never offer\",\"key\":\"deny\",\"value\":\"deny\"}]",
        immutable: true,
        ref: 18
      },

      label: "Writing",
      defaultData: "allow",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/approvals/properties/destructive": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"allow\",\"title\":\"Allow\",\"key\":\"allow\",\"value\":\"allow\"},{\"const\":\"approve\",\"title\":\"Approve each call\",\"key\":\"approve\",\"value\":\"approve\"},{\"const\":\"deny\",\"title\":\"Never offer\",\"key\":\"deny\",\"value\":\"deny\"}]",
        immutable: true,
        ref: 18
      },

      label: "Destructive",
      defaultData: "approve",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/memory": {
      comp: "section",

      children: [{
        key: "enabled"
      }],

      title: "Memory"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/memory/properties/enabled": {
      comp: "checkbox",
      label: "Keep a memory across conversations",
      help: "<p>The agent keeps notes it reuses in every later conversation, and tidies them once a day from what people told it. Administrators can read, edit and restore this memory. Memory writes are not subject to the approval settings: every change is versioned and can be restored.</p>",
      defaultData: false,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web": {
      comp: "section",

      children: [{
        key: "enabled"
      }, {
        key: "allowedUrls"
      }],

      title: "Web access",
      subtitle: "<p>Pages under the allowed URLs are read by the agent as text, and text can contain instructions: their authors can in effect instruct this agent, with its identity and all its tools, and make it send information out. Enable this only on agents with very restricted write and administration capabilities.</p>"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/enabled": {
      comp: "checkbox",
      label: "Read web pages",
      help: "<p>The agent can read pages, feeds and sitemaps under the allowed URLs, and ask an administrator of the organization, in a conversation, to allow more.</p>",
      defaultData: false,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls": {
      if: {
        type: "js-eval",
        expr: "parent.data?.enabled",
        pure: false,
        dataAlias: "value",
        ref: 19
      },

      comp: "combobox",
      multiple: true,
      label: "Allowed URLs",
      help: "<p>An address can be read when it starts with one of these: &quot;<a href=\"https://github.com/data-fair\">https://github.com/data-fair</a>&quot; allows the repositories of that organization only, &quot;<a href=\"https://www.data.gouv.fr/\">https://www.data.gouv.fr/</a>&quot; the whole site. A site&#39;s robots.txt, sitemaps and search description are readable as soon as one of its addresses is allowed.</p>",
      defaultData: [],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items": {
      comp: "text-field",
      label: "",
      nullable: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers": {
      itemTitle: {
        type: "js-eval",
        expr: "item?.url || \"\"",
        pure: true,
        dataAlias: "item",
        ref: 20
      },

      listActions: ["add", "edit", "delete"],
      comp: "list",
      title: "External MCP servers",
      listEditMode: "inline-single",
      help: "<p>Public MCP servers the agent uses anonymously — another data portal, on this platform or elsewhere. Their authors write the descriptions the agent reads, and what it sends them leaves the platform: like web access, this lets them in effect instruct the agent.</p>",
      defaultData: [],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items": {
      comp: "section",

      children: [{
        key: "url"
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

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items/properties/url": {
      comp: "text-field",
      label: "URL"
    },

    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/enabled": {
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
    }
  },

  validates: {
    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/profiles/items": export0,
    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items/properties/toolFilter/items": export1,
    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/mcpServers/items": export2,
    "https://github.com/data-fair/lib/access-ref#/oneOf/0": export3,
    "https://github.com/data-fair/lib/access-ref#/oneOf/1": export4,
    "https://github.com/data-fair/lib/access-ref#/oneOf/2/properties/roles/items": export5,
    "https://github.com/data-fair/lib/access-ref#/oneOf/2": export6,
    "https://github.com/data-fair/lib/access-ref#/oneOf/3/properties/roles/items": export7,
    "https://github.com/data-fair/lib/access-ref#/oneOf/3": export8,
    "https://github.com/data-fair/lib/access-ref#": export9,
    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/web/properties/allowedUrls/items": export10,
    "https://github.com/data-fair/agents/autonomous-agent/write-req#/properties/externalMcpServers/items": export11,
    "https://github.com/data-fair/agents/autonomous-agent/write-req#": export12
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
    expression20
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
  
  "text-field": textfieldNode,
  
  "textarea": textareaNode,
  
  "list": listNode,
  
  "autocomplete": autocompleteNode,
  
  "combobox": comboboxNode,
  
  "one-of-select": oneofselectNode,
  
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