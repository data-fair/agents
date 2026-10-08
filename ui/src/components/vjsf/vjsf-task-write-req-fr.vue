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

import oneofselectNode from '@koumoul/vjsf/components/nodes/one-of-select.vue'

import numberfieldNode from '@koumoul/vjsf/components/nodes/number-field.vue'

import checkboxNode from '@koumoul/vjsf/components/nodes/checkbox.vue'

import selectNode from '@koumoul/vjsf/components/nodes/select.vue'


import localizeErrors from "ajv-i18n/localize/fr/index.js";
import ucs2length from "ajv/dist/runtime/ucs2length.js";

const export0 = validate22;
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0"};
const schema39 = {"title":"Mensuel","additionalProperties":false,"properties":{"type":{"const":"monthly","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/type","errorMessage":{}},"month":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/month","errorMessage":{}},"dayOfWeek":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfWeek","errorMessage":{}},"dayOfMonth":{"type":"integer","minimum":1,"maximum":28,"default":1,"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfMonth","errorMessage":{}},"lastDayOfMonth":{"type":"boolean","default":false,"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/lastDayOfMonth","errorMessage":{}},"hour":{"$ref":"#/$defs/hour","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/hour","errorMessage":{}},"minute":{"$ref":"#/$defs/minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/minute","errorMessage":{}},"timeZone":{"$ref":"#/$defs/timeZone","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/timeZone","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0","errorMessage":{}};
const schema28 = {"type":"integer","minimum":0,"maximum":23,"default":0,"title":"Heure","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/hour","errorMessage":{}};
const schema29 = {"type":"integer","minimum":0,"maximum":59,"default":0,"title":"Minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/minute","errorMessage":{}};
const schema30 = {"type":"string","default":"Europe/Paris","title":"Fuseau horaire","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/timeZone","errorMessage":{}};

function validate24(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
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
if(!((((((((key0 === "type") || (key0 === "month")) || (key0 === "dayOfWeek")) || (key0 === "dayOfMonth")) || (key0 === "lastDayOfMonth")) || (key0 === "hour")) || (key0 === "minute")) || (key0 === "timeZone"))){
const err0 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema39,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
if(data.type !== undefined){
let data0 = data.type;
if("monthly" !== data0){
const err1 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "monthly"},message:"must be equal to constant",schema:"monthly",parentSchema:schema39.properties.type,data:data0};
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
}
if(data.month !== undefined){
let data1 = data.month;
if("*" !== data1){
const err3 = {instancePath:instancePath+"/month",schemaPath:"#/properties/month/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema39.properties.month,data:data1};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err4 of vErrors){
if(!err4.emUsed){
emErrs1.push(err4);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.dayOfWeek !== undefined){
let data2 = data.dayOfWeek;
if("*" !== data2){
const err5 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/properties/dayOfWeek/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema39.properties.dayOfWeek,data:data2};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err6 of vErrors){
if(!err6.emUsed){
emErrs2.push(err6);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data.dayOfMonth !== undefined){
let data3 = data.dayOfMonth;
if(!((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3)))){
const err7 = {instancePath:instancePath+"/dayOfMonth",schemaPath:"#/properties/dayOfMonth/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema39.properties.dayOfMonth.type,parentSchema:schema39.properties.dayOfMonth,data:data3};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(typeof data3 == "number"){
if(data3 > 28 || isNaN(data3)){
const err8 = {instancePath:instancePath+"/dayOfMonth",schemaPath:"#/properties/dayOfMonth/maximum",keyword:"maximum",params:{comparison: "<=", limit: 28},message:"must be <= 28",schema:28,parentSchema:schema39.properties.dayOfMonth,data:data3};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data3 < 1 || isNaN(data3)){
const err9 = {instancePath:instancePath+"/dayOfMonth",schemaPath:"#/properties/dayOfMonth/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1",schema:1,parentSchema:schema39.properties.dayOfMonth,data:data3};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(errors > 0){
const emErrs3 = [];
for(const err10 of vErrors){
if(!err10.emUsed){
emErrs3.push(err10);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data.lastDayOfMonth !== undefined){
let data4 = data.lastDayOfMonth;
if(typeof data4 !== "boolean"){
const err11 = {instancePath:instancePath+"/lastDayOfMonth",schemaPath:"#/properties/lastDayOfMonth/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema39.properties.lastDayOfMonth.type,parentSchema:schema39.properties.lastDayOfMonth,data:data4};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err12 of vErrors){
if(!err12.emUsed){
emErrs4.push(err12);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
if(data.hour !== undefined){
let data5 = data.hour;
if(!((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5)))){
const err13 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema28.type,parentSchema:schema28,data:data5};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(typeof data5 == "number"){
if(data5 > 23 || isNaN(data5)){
const err14 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/maximum",keyword:"maximum",params:{comparison: "<=", limit: 23},message:"must be <= 23",schema:23,parentSchema:schema28,data:data5};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data5 < 0 || isNaN(data5)){
const err15 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28,data:data5};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(errors > 0){
const emErrs5 = [];
for(const err16 of vErrors){
if(!err16.emUsed){
emErrs5.push(err16);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
if(errors > 0){
const emErrs6 = [];
for(const err17 of vErrors){
if(!err17.emUsed){
emErrs6.push(err17);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
if(data.minute !== undefined){
let data6 = data.minute;
if(!((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6)))){
const err18 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema29.type,parentSchema:schema29,data:data6};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(typeof data6 == "number"){
if(data6 > 59 || isNaN(data6)){
const err19 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/maximum",keyword:"maximum",params:{comparison: "<=", limit: 59},message:"must be <= 59",schema:59,parentSchema:schema29,data:data6};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data6 < 0 || isNaN(data6)){
const err20 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema29,data:data6};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(errors > 0){
const emErrs7 = [];
for(const err21 of vErrors){
if(!err21.emUsed){
emErrs7.push(err21);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
if(errors > 0){
const emErrs8 = [];
for(const err22 of vErrors){
if(!err22.emUsed){
emErrs8.push(err22);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
if(data.timeZone !== undefined){
let data7 = data.timeZone;
if(typeof data7 !== "string"){
const err23 = {instancePath:instancePath+"/timeZone",schemaPath:"#/$defs/timeZone/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.type,parentSchema:schema30,data:data7};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err24 of vErrors){
if(!err24.emUsed){
emErrs9.push(err24);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
if(errors > 0){
const emErrs10 = [];
for(const err25 of vErrors){
if(!err25.emUsed){
emErrs10.push(err25);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
}
else {
const err26 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema39.type,parentSchema:schema39,data};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(errors > 0){
const emErrs11 = [];
for(const err27 of vErrors){
if(!err27.emUsed){
emErrs11.push(err27);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


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
if(!(validate24(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
errors = vErrors.length;
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export1 = validate26;
const schema43 = {"$id":"export1","$ref":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1"};
const schema44 = {"title":"Hebdomadaire","additionalProperties":false,"properties":{"type":{"const":"weekly","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/type","errorMessage":{}},"month":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/month","errorMessage":{}},"dayOfMonth":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfMonth","errorMessage":{}},"dayOfWeek":{"type":"string","default":"1","oneOf":[{"const":"1","title":"1"},{"const":"2","title":"2"},{"const":"3","title":"3"},{"const":"4","title":"4"},{"const":"5","title":"5"},{"const":"6","title":"6"},{"const":"0","title":"0"}],"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfWeek","errorMessage":{"oneOf":"choisissez une valeur"}},"hour":{"$ref":"#/$defs/hour","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/hour","errorMessage":{}},"minute":{"$ref":"#/$defs/minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/minute","errorMessage":{}},"timeZone":{"$ref":"#/$defs/timeZone","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/timeZone","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1","errorMessage":{}};

function validate27(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
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
for(const key0 in data){
if(!(((((((key0 === "type") || (key0 === "month")) || (key0 === "dayOfMonth")) || (key0 === "dayOfWeek")) || (key0 === "hour")) || (key0 === "minute")) || (key0 === "timeZone"))){
const err0 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema44,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
if(data.type !== undefined){
let data0 = data.type;
if("weekly" !== data0){
const err1 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "weekly"},message:"must be equal to constant",schema:"weekly",parentSchema:schema44.properties.type,data:data0};
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
}
if(data.month !== undefined){
let data1 = data.month;
if("*" !== data1){
const err3 = {instancePath:instancePath+"/month",schemaPath:"#/properties/month/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema44.properties.month,data:data1};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err4 of vErrors){
if(!err4.emUsed){
emErrs1.push(err4);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.dayOfMonth !== undefined){
let data2 = data.dayOfMonth;
if("*" !== data2){
const err5 = {instancePath:instancePath+"/dayOfMonth",schemaPath:"#/properties/dayOfMonth/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema44.properties.dayOfMonth,data:data2};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err6 of vErrors){
if(!err6.emUsed){
emErrs2.push(err6);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data.dayOfWeek !== undefined){
let data3 = data.dayOfWeek;
if(typeof data3 !== "string"){
const err7 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/properties/dayOfWeek/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema44.properties.dayOfWeek.type,parentSchema:schema44.properties.dayOfWeek,data:data3};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
const _errs7 = errors;
let valid1 = false;
let passing0 = null;
const _errs8 = errors;
if("1" !== data3){
const err8 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/properties/dayOfWeek/oneOf/0/const",keyword:"const",params:{allowedValue: "1"},message:"must be equal to constant",schema:"1",parentSchema:schema44.properties.dayOfWeek.oneOf[0],data:data3};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
var _valid0 = _errs8 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
}
const _errs9 = errors;
if("2" !== data3){
const err9 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/properties/dayOfWeek/oneOf/1/const",keyword:"const",params:{allowedValue: "2"},message:"must be equal to constant",schema:"2",parentSchema:schema44.properties.dayOfWeek.oneOf[1],data:data3};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid0 = _errs9 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
}
const _errs10 = errors;
if("3" !== data3){
const err10 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/properties/dayOfWeek/oneOf/2/const",keyword:"const",params:{allowedValue: "3"},message:"must be equal to constant",schema:"3",parentSchema:schema44.properties.dayOfWeek.oneOf[2],data:data3};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid0 = _errs10 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid1 = true;
passing0 = 2;
}
const _errs11 = errors;
if("4" !== data3){
const err11 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/properties/dayOfWeek/oneOf/3/const",keyword:"const",params:{allowedValue: "4"},message:"must be equal to constant",schema:"4",parentSchema:schema44.properties.dayOfWeek.oneOf[3],data:data3};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid0 = _errs11 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid1 = true;
passing0 = 3;
}
const _errs12 = errors;
if("5" !== data3){
const err12 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/properties/dayOfWeek/oneOf/4/const",keyword:"const",params:{allowedValue: "5"},message:"must be equal to constant",schema:"5",parentSchema:schema44.properties.dayOfWeek.oneOf[4],data:data3};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
var _valid0 = _errs12 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid1 = true;
passing0 = 4;
}
const _errs13 = errors;
if("6" !== data3){
const err13 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/properties/dayOfWeek/oneOf/5/const",keyword:"const",params:{allowedValue: "6"},message:"must be equal to constant",schema:"6",parentSchema:schema44.properties.dayOfWeek.oneOf[5],data:data3};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
var _valid0 = _errs13 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 5];
}
else {
if(_valid0){
valid1 = true;
passing0 = 5;
}
const _errs14 = errors;
if("0" !== data3){
const err14 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/properties/dayOfWeek/oneOf/6/const",keyword:"const",params:{allowedValue: "0"},message:"must be equal to constant",schema:"0",parentSchema:schema44.properties.dayOfWeek.oneOf[6],data:data3};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
var _valid0 = _errs14 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 6];
}
else {
if(_valid0){
valid1 = true;
passing0 = 6;
}
}
}
}
}
}
}
if(!valid1){
const err15 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/properties/dayOfWeek/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema44.properties.dayOfWeek.oneOf,parentSchema:schema44.properties.dayOfWeek,data:data3};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
else {
errors = _errs7;
if(vErrors !== null){
if(_errs7){
vErrors.length = _errs7;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors0 = {"oneOf":[]};
const templates0 = {};
for(const err16 of vErrors){
if((((((err16.keyword !== "errorMessage") && (!err16.emUsed)) && (err16.instancePath === instancePath+"/dayOfWeek")) && (err16.keyword in emErrors0)) && (err16.schemaPath.indexOf("#/properties/dayOfWeek") === 0)) && (/^\/[^\/]*$/.test(err16.schemaPath.slice(22)))){
emErrors0[err16.keyword].push(err16);
err16.emUsed = true;
}
}
for(const key1 in emErrors0){
if(emErrors0[key1].length){
const err17 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/properties/dayOfWeek/errorMessage",keyword:"errorMessage",params:{errors: emErrors0[key1]},message:key1 in templates0 ? templates0[key1]() : schema44.properties.dayOfWeek.errorMessage[key1],schema:schema44.properties.dayOfWeek.errorMessage,parentSchema:schema44.properties.dayOfWeek,data:data3};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
const emErrs3 = [];
for(const err18 of vErrors){
if(!err18.emUsed){
emErrs3.push(err18);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data.hour !== undefined){
let data4 = data.hour;
if(!((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4)))){
const err19 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema28.type,parentSchema:schema28,data:data4};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(typeof data4 == "number"){
if(data4 > 23 || isNaN(data4)){
const err20 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/maximum",keyword:"maximum",params:{comparison: "<=", limit: 23},message:"must be <= 23",schema:23,parentSchema:schema28,data:data4};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err21 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28,data:data4};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(errors > 0){
const emErrs4 = [];
for(const err22 of vErrors){
if(!err22.emUsed){
emErrs4.push(err22);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
if(errors > 0){
const emErrs5 = [];
for(const err23 of vErrors){
if(!err23.emUsed){
emErrs5.push(err23);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
if(data.minute !== undefined){
let data5 = data.minute;
if(!((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5)))){
const err24 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema29.type,parentSchema:schema29,data:data5};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(typeof data5 == "number"){
if(data5 > 59 || isNaN(data5)){
const err25 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/maximum",keyword:"maximum",params:{comparison: "<=", limit: 59},message:"must be <= 59",schema:59,parentSchema:schema29,data:data5};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data5 < 0 || isNaN(data5)){
const err26 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema29,data:data5};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
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
if(errors > 0){
const emErrs7 = [];
for(const err28 of vErrors){
if(!err28.emUsed){
emErrs7.push(err28);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data.timeZone !== undefined){
let data6 = data.timeZone;
if(typeof data6 !== "string"){
const err29 = {instancePath:instancePath+"/timeZone",schemaPath:"#/$defs/timeZone/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.type,parentSchema:schema30,data:data6};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err30 of vErrors){
if(!err30.emUsed){
emErrs8.push(err30);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
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
}
else {
const err32 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema44.type,parentSchema:schema44,data};
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
validate27.errors = vErrors;
return errors === 0;
}
validate27.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate26(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export1" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate26.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate27(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
errors = vErrors.length;
}
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export2 = validate29;
const schema48 = {"$id":"export2","$ref":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2"};
const schema49 = {"title":"Quotidien","additionalProperties":false,"properties":{"type":{"const":"daily","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/type","errorMessage":{}},"month":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/month","errorMessage":{}},"dayOfMonth":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfMonth","errorMessage":{}},"dayOfWeek":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfWeek","errorMessage":{}},"hour":{"$ref":"#/$defs/hour","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/hour","errorMessage":{}},"minute":{"$ref":"#/$defs/minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/minute","errorMessage":{}},"timeZone":{"$ref":"#/$defs/timeZone","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/timeZone","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2","errorMessage":{}};

function validate30(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
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
for(const key0 in data){
if(!(((((((key0 === "type") || (key0 === "month")) || (key0 === "dayOfMonth")) || (key0 === "dayOfWeek")) || (key0 === "hour")) || (key0 === "minute")) || (key0 === "timeZone"))){
const err0 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema49,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
if(data.type !== undefined){
let data0 = data.type;
if("daily" !== data0){
const err1 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "daily"},message:"must be equal to constant",schema:"daily",parentSchema:schema49.properties.type,data:data0};
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
}
if(data.month !== undefined){
let data1 = data.month;
if("*" !== data1){
const err3 = {instancePath:instancePath+"/month",schemaPath:"#/properties/month/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema49.properties.month,data:data1};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err4 of vErrors){
if(!err4.emUsed){
emErrs1.push(err4);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.dayOfMonth !== undefined){
let data2 = data.dayOfMonth;
if("*" !== data2){
const err5 = {instancePath:instancePath+"/dayOfMonth",schemaPath:"#/properties/dayOfMonth/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema49.properties.dayOfMonth,data:data2};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err6 of vErrors){
if(!err6.emUsed){
emErrs2.push(err6);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data.dayOfWeek !== undefined){
let data3 = data.dayOfWeek;
if("*" !== data3){
const err7 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/properties/dayOfWeek/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema49.properties.dayOfWeek,data:data3};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(errors > 0){
const emErrs3 = [];
for(const err8 of vErrors){
if(!err8.emUsed){
emErrs3.push(err8);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data.hour !== undefined){
let data4 = data.hour;
if(!((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4)))){
const err9 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema28.type,parentSchema:schema28,data:data4};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(typeof data4 == "number"){
if(data4 > 23 || isNaN(data4)){
const err10 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/maximum",keyword:"maximum",params:{comparison: "<=", limit: 23},message:"must be <= 23",schema:23,parentSchema:schema28,data:data4};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err11 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28,data:data4};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(errors > 0){
const emErrs4 = [];
for(const err12 of vErrors){
if(!err12.emUsed){
emErrs4.push(err12);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
if(errors > 0){
const emErrs5 = [];
for(const err13 of vErrors){
if(!err13.emUsed){
emErrs5.push(err13);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
if(data.minute !== undefined){
let data5 = data.minute;
if(!((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5)))){
const err14 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema29.type,parentSchema:schema29,data:data5};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(typeof data5 == "number"){
if(data5 > 59 || isNaN(data5)){
const err15 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/maximum",keyword:"maximum",params:{comparison: "<=", limit: 59},message:"must be <= 59",schema:59,parentSchema:schema29,data:data5};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data5 < 0 || isNaN(data5)){
const err16 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema29,data:data5};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(errors > 0){
const emErrs6 = [];
for(const err17 of vErrors){
if(!err17.emUsed){
emErrs6.push(err17);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
if(errors > 0){
const emErrs7 = [];
for(const err18 of vErrors){
if(!err18.emUsed){
emErrs7.push(err18);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data.timeZone !== undefined){
let data6 = data.timeZone;
if(typeof data6 !== "string"){
const err19 = {instancePath:instancePath+"/timeZone",schemaPath:"#/$defs/timeZone/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.type,parentSchema:schema30,data:data6};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err20 of vErrors){
if(!err20.emUsed){
emErrs8.push(err20);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
if(errors > 0){
const emErrs9 = [];
for(const err21 of vErrors){
if(!err21.emUsed){
emErrs9.push(err21);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
}
else {
const err22 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema49.type,parentSchema:schema49,data};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err23 of vErrors){
if(!err23.emUsed){
emErrs10.push(err23);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
validate30.errors = vErrors;
return errors === 0;
}
validate30.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate29(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export2" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate29.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate30(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate30.errors : vErrors.concat(validate30.errors);
errors = vErrors.length;
}
validate29.errors = vErrors;
return errors === 0;
}
validate29.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export3 = validate32;
const schema53 = {"$id":"export3","$ref":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3"};
const schema54 = {"title":"Toutes les N heures","additionalProperties":false,"properties":{"type":{"const":"hours","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/type","errorMessage":{}},"month":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/month","errorMessage":{}},"dayOfMonth":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfMonth","errorMessage":{}},"dayOfWeek":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfWeek","errorMessage":{}},"hour":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hour","errorMessage":{}},"hourStep":{"type":"integer","minimum":1,"maximum":12,"default":1,"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hourStep","errorMessage":{}},"minute":{"$ref":"#/$defs/minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/minute","errorMessage":{}},"timeZone":{"$ref":"#/$defs/timeZone","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/timeZone","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3","errorMessage":{}};

function validate33(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate33.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key0 in data){
if(!((((((((key0 === "type") || (key0 === "month")) || (key0 === "dayOfMonth")) || (key0 === "dayOfWeek")) || (key0 === "hour")) || (key0 === "hourStep")) || (key0 === "minute")) || (key0 === "timeZone"))){
const err0 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema54,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
if(data.type !== undefined){
let data0 = data.type;
if("hours" !== data0){
const err1 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "hours"},message:"must be equal to constant",schema:"hours",parentSchema:schema54.properties.type,data:data0};
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
}
if(data.month !== undefined){
let data1 = data.month;
if("*" !== data1){
const err3 = {instancePath:instancePath+"/month",schemaPath:"#/properties/month/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema54.properties.month,data:data1};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err4 of vErrors){
if(!err4.emUsed){
emErrs1.push(err4);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.dayOfMonth !== undefined){
let data2 = data.dayOfMonth;
if("*" !== data2){
const err5 = {instancePath:instancePath+"/dayOfMonth",schemaPath:"#/properties/dayOfMonth/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema54.properties.dayOfMonth,data:data2};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err6 of vErrors){
if(!err6.emUsed){
emErrs2.push(err6);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data.dayOfWeek !== undefined){
let data3 = data.dayOfWeek;
if("*" !== data3){
const err7 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/properties/dayOfWeek/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema54.properties.dayOfWeek,data:data3};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(errors > 0){
const emErrs3 = [];
for(const err8 of vErrors){
if(!err8.emUsed){
emErrs3.push(err8);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data.hour !== undefined){
let data4 = data.hour;
if("*" !== data4){
const err9 = {instancePath:instancePath+"/hour",schemaPath:"#/properties/hour/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema54.properties.hour,data:data4};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err10 of vErrors){
if(!err10.emUsed){
emErrs4.push(err10);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
if(data.hourStep !== undefined){
let data5 = data.hourStep;
if(!((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5)))){
const err11 = {instancePath:instancePath+"/hourStep",schemaPath:"#/properties/hourStep/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema54.properties.hourStep.type,parentSchema:schema54.properties.hourStep,data:data5};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(typeof data5 == "number"){
if(data5 > 12 || isNaN(data5)){
const err12 = {instancePath:instancePath+"/hourStep",schemaPath:"#/properties/hourStep/maximum",keyword:"maximum",params:{comparison: "<=", limit: 12},message:"must be <= 12",schema:12,parentSchema:schema54.properties.hourStep,data:data5};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data5 < 1 || isNaN(data5)){
const err13 = {instancePath:instancePath+"/hourStep",schemaPath:"#/properties/hourStep/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1",schema:1,parentSchema:schema54.properties.hourStep,data:data5};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(errors > 0){
const emErrs5 = [];
for(const err14 of vErrors){
if(!err14.emUsed){
emErrs5.push(err14);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
}
if(data.minute !== undefined){
let data6 = data.minute;
if(!((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6)))){
const err15 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema29.type,parentSchema:schema29,data:data6};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(typeof data6 == "number"){
if(data6 > 59 || isNaN(data6)){
const err16 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/maximum",keyword:"maximum",params:{comparison: "<=", limit: 59},message:"must be <= 59",schema:59,parentSchema:schema29,data:data6};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data6 < 0 || isNaN(data6)){
const err17 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema29,data:data6};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(errors > 0){
const emErrs6 = [];
for(const err18 of vErrors){
if(!err18.emUsed){
emErrs6.push(err18);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
if(errors > 0){
const emErrs7 = [];
for(const err19 of vErrors){
if(!err19.emUsed){
emErrs7.push(err19);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
}
if(data.timeZone !== undefined){
let data7 = data.timeZone;
if(typeof data7 !== "string"){
const err20 = {instancePath:instancePath+"/timeZone",schemaPath:"#/$defs/timeZone/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.type,parentSchema:schema30,data:data7};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(errors > 0){
const emErrs8 = [];
for(const err21 of vErrors){
if(!err21.emUsed){
emErrs8.push(err21);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
if(errors > 0){
const emErrs9 = [];
for(const err22 of vErrors){
if(!err22.emUsed){
emErrs9.push(err22);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
}
}
else {
const err23 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema54.type,parentSchema:schema54,data};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(errors > 0){
const emErrs10 = [];
for(const err24 of vErrors){
if(!err24.emUsed){
emErrs10.push(err24);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
validate33.errors = vErrors;
return errors === 0;
}
validate33.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate32(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export3" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate32.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate33(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate33.errors : vErrors.concat(validate33.errors);
errors = vErrors.length;
}
validate32.errors = vErrors;
return errors === 0;
}
validate32.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const export4 = validate35;
const schema57 = {"$id":"export4","$ref":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items"};
const schema58 = {"type":"object","required":["type","month","dayOfWeek","dayOfMonth","hour","minute"],"oneOfLayout":{"emptyData":true},"oneOf":[{"title":"Mensuel","additionalProperties":false,"properties":{"type":{"const":"monthly","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/type","errorMessage":{}},"month":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/month","errorMessage":{}},"dayOfWeek":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfWeek","errorMessage":{}},"dayOfMonth":{"type":"integer","minimum":1,"maximum":28,"default":1,"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfMonth","errorMessage":{}},"lastDayOfMonth":{"type":"boolean","default":false,"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/lastDayOfMonth","errorMessage":{}},"hour":{"$ref":"#/$defs/hour","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/hour","errorMessage":{}},"minute":{"$ref":"#/$defs/minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/minute","errorMessage":{}},"timeZone":{"$ref":"#/$defs/timeZone","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/timeZone","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0","errorMessage":{}},{"title":"Hebdomadaire","additionalProperties":false,"properties":{"type":{"const":"weekly","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/type","errorMessage":{}},"month":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/month","errorMessage":{}},"dayOfMonth":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfMonth","errorMessage":{}},"dayOfWeek":{"type":"string","default":"1","oneOf":[{"const":"1","title":"1"},{"const":"2","title":"2"},{"const":"3","title":"3"},{"const":"4","title":"4"},{"const":"5","title":"5"},{"const":"6","title":"6"},{"const":"0","title":"0"}],"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfWeek","errorMessage":{"oneOf":"choisissez une valeur"}},"hour":{"$ref":"#/$defs/hour","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/hour","errorMessage":{}},"minute":{"$ref":"#/$defs/minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/minute","errorMessage":{}},"timeZone":{"$ref":"#/$defs/timeZone","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/timeZone","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1","errorMessage":{}},{"title":"Quotidien","additionalProperties":false,"properties":{"type":{"const":"daily","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/type","errorMessage":{}},"month":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/month","errorMessage":{}},"dayOfMonth":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfMonth","errorMessage":{}},"dayOfWeek":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfWeek","errorMessage":{}},"hour":{"$ref":"#/$defs/hour","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/hour","errorMessage":{}},"minute":{"$ref":"#/$defs/minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/minute","errorMessage":{}},"timeZone":{"$ref":"#/$defs/timeZone","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/timeZone","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2","errorMessage":{}},{"title":"Toutes les N heures","additionalProperties":false,"properties":{"type":{"const":"hours","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/type","errorMessage":{}},"month":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/month","errorMessage":{}},"dayOfMonth":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfMonth","errorMessage":{}},"dayOfWeek":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfWeek","errorMessage":{}},"hour":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hour","errorMessage":{}},"hourStep":{"type":"integer","minimum":1,"maximum":12,"default":1,"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hourStep","errorMessage":{}},"minute":{"$ref":"#/$defs/minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/minute","errorMessage":{}},"timeZone":{"$ref":"#/$defs/timeZone","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/timeZone","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3","errorMessage":{}}],"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items","errorMessage":{"oneOf":"choisissez une valeur"}};

function validate36(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate36.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs1 = errors;
let valid0 = false;
let passing0 = null;
const _errs2 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key0 in data){
if(!((((((((key0 === "type") || (key0 === "month")) || (key0 === "dayOfWeek")) || (key0 === "dayOfMonth")) || (key0 === "lastDayOfMonth")) || (key0 === "hour")) || (key0 === "minute")) || (key0 === "timeZone"))){
const err0 = {instancePath,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema58.oneOf[0],data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
if(data.type !== undefined){
let data0 = data.type;
if("monthly" !== data0){
const err1 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "monthly"},message:"must be equal to constant",schema:"monthly",parentSchema:schema58.oneOf[0].properties.type,data:data0};
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
}
if(data.month !== undefined){
let data1 = data.month;
if("*" !== data1){
const err3 = {instancePath:instancePath+"/month",schemaPath:"#/oneOf/0/properties/month/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema58.oneOf[0].properties.month,data:data1};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err4 of vErrors){
if(!err4.emUsed){
emErrs1.push(err4);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.dayOfWeek !== undefined){
let data2 = data.dayOfWeek;
if("*" !== data2){
const err5 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/oneOf/0/properties/dayOfWeek/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema58.oneOf[0].properties.dayOfWeek,data:data2};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err6 of vErrors){
if(!err6.emUsed){
emErrs2.push(err6);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
if(data.dayOfMonth !== undefined){
let data3 = data.dayOfMonth;
if(!((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3)))){
const err7 = {instancePath:instancePath+"/dayOfMonth",schemaPath:"#/oneOf/0/properties/dayOfMonth/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema58.oneOf[0].properties.dayOfMonth.type,parentSchema:schema58.oneOf[0].properties.dayOfMonth,data:data3};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(typeof data3 == "number"){
if(data3 > 28 || isNaN(data3)){
const err8 = {instancePath:instancePath+"/dayOfMonth",schemaPath:"#/oneOf/0/properties/dayOfMonth/maximum",keyword:"maximum",params:{comparison: "<=", limit: 28},message:"must be <= 28",schema:28,parentSchema:schema58.oneOf[0].properties.dayOfMonth,data:data3};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data3 < 1 || isNaN(data3)){
const err9 = {instancePath:instancePath+"/dayOfMonth",schemaPath:"#/oneOf/0/properties/dayOfMonth/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1",schema:1,parentSchema:schema58.oneOf[0].properties.dayOfMonth,data:data3};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(errors > 0){
const emErrs3 = [];
for(const err10 of vErrors){
if(!err10.emUsed){
emErrs3.push(err10);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
}
if(data.lastDayOfMonth !== undefined){
let data4 = data.lastDayOfMonth;
if(typeof data4 !== "boolean"){
const err11 = {instancePath:instancePath+"/lastDayOfMonth",schemaPath:"#/oneOf/0/properties/lastDayOfMonth/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema58.oneOf[0].properties.lastDayOfMonth.type,parentSchema:schema58.oneOf[0].properties.lastDayOfMonth,data:data4};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(errors > 0){
const emErrs4 = [];
for(const err12 of vErrors){
if(!err12.emUsed){
emErrs4.push(err12);
}
}
vErrors = emErrs4;
errors = emErrs4.length;
}
}
if(data.hour !== undefined){
let data5 = data.hour;
if(!((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5)))){
const err13 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema28.type,parentSchema:schema28,data:data5};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(typeof data5 == "number"){
if(data5 > 23 || isNaN(data5)){
const err14 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/maximum",keyword:"maximum",params:{comparison: "<=", limit: 23},message:"must be <= 23",schema:23,parentSchema:schema28,data:data5};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data5 < 0 || isNaN(data5)){
const err15 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28,data:data5};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(errors > 0){
const emErrs5 = [];
for(const err16 of vErrors){
if(!err16.emUsed){
emErrs5.push(err16);
}
}
vErrors = emErrs5;
errors = emErrs5.length;
}
if(errors > 0){
const emErrs6 = [];
for(const err17 of vErrors){
if(!err17.emUsed){
emErrs6.push(err17);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
if(data.minute !== undefined){
let data6 = data.minute;
if(!((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6)))){
const err18 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema29.type,parentSchema:schema29,data:data6};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(typeof data6 == "number"){
if(data6 > 59 || isNaN(data6)){
const err19 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/maximum",keyword:"maximum",params:{comparison: "<=", limit: 59},message:"must be <= 59",schema:59,parentSchema:schema29,data:data6};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data6 < 0 || isNaN(data6)){
const err20 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema29,data:data6};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(errors > 0){
const emErrs7 = [];
for(const err21 of vErrors){
if(!err21.emUsed){
emErrs7.push(err21);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
}
if(errors > 0){
const emErrs8 = [];
for(const err22 of vErrors){
if(!err22.emUsed){
emErrs8.push(err22);
}
}
vErrors = emErrs8;
errors = emErrs8.length;
}
}
if(data.timeZone !== undefined){
let data7 = data.timeZone;
if(typeof data7 !== "string"){
const err23 = {instancePath:instancePath+"/timeZone",schemaPath:"#/$defs/timeZone/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.type,parentSchema:schema30,data:data7};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(errors > 0){
const emErrs9 = [];
for(const err24 of vErrors){
if(!err24.emUsed){
emErrs9.push(err24);
}
}
vErrors = emErrs9;
errors = emErrs9.length;
}
if(errors > 0){
const emErrs10 = [];
for(const err25 of vErrors){
if(!err25.emUsed){
emErrs10.push(err25);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
}
else {
const err26 = {instancePath,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[0].type,parentSchema:schema58.oneOf[0],data};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(errors > 0){
const emErrs11 = [];
for(const err27 of vErrors){
if(!err27.emUsed){
emErrs11.push(err27);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
}
var _valid0 = _errs2 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs21 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key1 in data){
if(!(((((((key1 === "type") || (key1 === "month")) || (key1 === "dayOfMonth")) || (key1 === "dayOfWeek")) || (key1 === "hour")) || (key1 === "minute")) || (key1 === "timeZone"))){
const err28 = {instancePath,schemaPath:"#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema58.oneOf[1],data};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data.type !== undefined){
let data8 = data.type;
if("weekly" !== data8){
const err29 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "weekly"},message:"must be equal to constant",schema:"weekly",parentSchema:schema58.oneOf[1].properties.type,data:data8};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(errors > 0){
const emErrs12 = [];
for(const err30 of vErrors){
if(!err30.emUsed){
emErrs12.push(err30);
}
}
vErrors = emErrs12;
errors = emErrs12.length;
}
}
if(data.month !== undefined){
let data9 = data.month;
if("*" !== data9){
const err31 = {instancePath:instancePath+"/month",schemaPath:"#/oneOf/1/properties/month/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema58.oneOf[1].properties.month,data:data9};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err32 of vErrors){
if(!err32.emUsed){
emErrs13.push(err32);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
}
if(data.dayOfMonth !== undefined){
let data10 = data.dayOfMonth;
if("*" !== data10){
const err33 = {instancePath:instancePath+"/dayOfMonth",schemaPath:"#/oneOf/1/properties/dayOfMonth/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema58.oneOf[1].properties.dayOfMonth,data:data10};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(errors > 0){
const emErrs14 = [];
for(const err34 of vErrors){
if(!err34.emUsed){
emErrs14.push(err34);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
if(data.dayOfWeek !== undefined){
let data11 = data.dayOfWeek;
if(typeof data11 !== "string"){
const err35 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/oneOf/1/properties/dayOfWeek/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema58.oneOf[1].properties.dayOfWeek.type,parentSchema:schema58.oneOf[1].properties.dayOfWeek,data:data11};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
const _errs29 = errors;
let valid6 = false;
let passing1 = null;
const _errs30 = errors;
if("1" !== data11){
const err36 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/oneOf/1/properties/dayOfWeek/oneOf/0/const",keyword:"const",params:{allowedValue: "1"},message:"must be equal to constant",schema:"1",parentSchema:schema58.oneOf[1].properties.dayOfWeek.oneOf[0],data:data11};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
var _valid1 = _errs30 === errors;
if(_valid1){
valid6 = true;
passing1 = 0;
}
const _errs31 = errors;
if("2" !== data11){
const err37 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/oneOf/1/properties/dayOfWeek/oneOf/1/const",keyword:"const",params:{allowedValue: "2"},message:"must be equal to constant",schema:"2",parentSchema:schema58.oneOf[1].properties.dayOfWeek.oneOf[1],data:data11};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
var _valid1 = _errs31 === errors;
if(_valid1 && valid6){
valid6 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid6 = true;
passing1 = 1;
}
const _errs32 = errors;
if("3" !== data11){
const err38 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/oneOf/1/properties/dayOfWeek/oneOf/2/const",keyword:"const",params:{allowedValue: "3"},message:"must be equal to constant",schema:"3",parentSchema:schema58.oneOf[1].properties.dayOfWeek.oneOf[2],data:data11};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
var _valid1 = _errs32 === errors;
if(_valid1 && valid6){
valid6 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid6 = true;
passing1 = 2;
}
const _errs33 = errors;
if("4" !== data11){
const err39 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/oneOf/1/properties/dayOfWeek/oneOf/3/const",keyword:"const",params:{allowedValue: "4"},message:"must be equal to constant",schema:"4",parentSchema:schema58.oneOf[1].properties.dayOfWeek.oneOf[3],data:data11};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
var _valid1 = _errs33 === errors;
if(_valid1 && valid6){
valid6 = false;
passing1 = [passing1, 3];
}
else {
if(_valid1){
valid6 = true;
passing1 = 3;
}
const _errs34 = errors;
if("5" !== data11){
const err40 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/oneOf/1/properties/dayOfWeek/oneOf/4/const",keyword:"const",params:{allowedValue: "5"},message:"must be equal to constant",schema:"5",parentSchema:schema58.oneOf[1].properties.dayOfWeek.oneOf[4],data:data11};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
var _valid1 = _errs34 === errors;
if(_valid1 && valid6){
valid6 = false;
passing1 = [passing1, 4];
}
else {
if(_valid1){
valid6 = true;
passing1 = 4;
}
const _errs35 = errors;
if("6" !== data11){
const err41 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/oneOf/1/properties/dayOfWeek/oneOf/5/const",keyword:"const",params:{allowedValue: "6"},message:"must be equal to constant",schema:"6",parentSchema:schema58.oneOf[1].properties.dayOfWeek.oneOf[5],data:data11};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
var _valid1 = _errs35 === errors;
if(_valid1 && valid6){
valid6 = false;
passing1 = [passing1, 5];
}
else {
if(_valid1){
valid6 = true;
passing1 = 5;
}
const _errs36 = errors;
if("0" !== data11){
const err42 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/oneOf/1/properties/dayOfWeek/oneOf/6/const",keyword:"const",params:{allowedValue: "0"},message:"must be equal to constant",schema:"0",parentSchema:schema58.oneOf[1].properties.dayOfWeek.oneOf[6],data:data11};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
var _valid1 = _errs36 === errors;
if(_valid1 && valid6){
valid6 = false;
passing1 = [passing1, 6];
}
else {
if(_valid1){
valid6 = true;
passing1 = 6;
}
}
}
}
}
}
}
if(!valid6){
const err43 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/oneOf/1/properties/dayOfWeek/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf",schema:schema58.oneOf[1].properties.dayOfWeek.oneOf,parentSchema:schema58.oneOf[1].properties.dayOfWeek,data:data11};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
else {
errors = _errs29;
if(vErrors !== null){
if(_errs29){
vErrors.length = _errs29;
}
else {
vErrors = null;
}
}
}
if(errors > 0){
const emErrors0 = {"oneOf":[]};
const templates0 = {};
for(const err44 of vErrors){
if((((((err44.keyword !== "errorMessage") && (!err44.emUsed)) && (err44.instancePath === instancePath+"/dayOfWeek")) && (err44.keyword in emErrors0)) && (err44.schemaPath.indexOf("#/oneOf/1/properties/dayOfWeek") === 0)) && (/^\/[^\/]*$/.test(err44.schemaPath.slice(30)))){
emErrors0[err44.keyword].push(err44);
err44.emUsed = true;
}
}
for(const key2 in emErrors0){
if(emErrors0[key2].length){
const err45 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/oneOf/1/properties/dayOfWeek/errorMessage",keyword:"errorMessage",params:{errors: emErrors0[key2]},message:key2 in templates0 ? templates0[key2]() : schema58.oneOf[1].properties.dayOfWeek.errorMessage[key2],schema:schema58.oneOf[1].properties.dayOfWeek.errorMessage,parentSchema:schema58.oneOf[1].properties.dayOfWeek,data:data11};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
const emErrs15 = [];
for(const err46 of vErrors){
if(!err46.emUsed){
emErrs15.push(err46);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
if(data.hour !== undefined){
let data12 = data.hour;
if(!((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12)))){
const err47 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema28.type,parentSchema:schema28,data:data12};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(typeof data12 == "number"){
if(data12 > 23 || isNaN(data12)){
const err48 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/maximum",keyword:"maximum",params:{comparison: "<=", limit: 23},message:"must be <= 23",schema:23,parentSchema:schema28,data:data12};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data12 < 0 || isNaN(data12)){
const err49 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28,data:data12};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(errors > 0){
const emErrs16 = [];
for(const err50 of vErrors){
if(!err50.emUsed){
emErrs16.push(err50);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
if(errors > 0){
const emErrs17 = [];
for(const err51 of vErrors){
if(!err51.emUsed){
emErrs17.push(err51);
}
}
vErrors = emErrs17;
errors = emErrs17.length;
}
}
if(data.minute !== undefined){
let data13 = data.minute;
if(!((typeof data13 == "number") && (!(data13 % 1) && !isNaN(data13)))){
const err52 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema29.type,parentSchema:schema29,data:data13};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(typeof data13 == "number"){
if(data13 > 59 || isNaN(data13)){
const err53 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/maximum",keyword:"maximum",params:{comparison: "<=", limit: 59},message:"must be <= 59",schema:59,parentSchema:schema29,data:data13};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(data13 < 0 || isNaN(data13)){
const err54 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema29,data:data13};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(errors > 0){
const emErrs18 = [];
for(const err55 of vErrors){
if(!err55.emUsed){
emErrs18.push(err55);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
if(errors > 0){
const emErrs19 = [];
for(const err56 of vErrors){
if(!err56.emUsed){
emErrs19.push(err56);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
}
if(data.timeZone !== undefined){
let data14 = data.timeZone;
if(typeof data14 !== "string"){
const err57 = {instancePath:instancePath+"/timeZone",schemaPath:"#/$defs/timeZone/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.type,parentSchema:schema30,data:data14};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(errors > 0){
const emErrs20 = [];
for(const err58 of vErrors){
if(!err58.emUsed){
emErrs20.push(err58);
}
}
vErrors = emErrs20;
errors = emErrs20.length;
}
if(errors > 0){
const emErrs21 = [];
for(const err59 of vErrors){
if(!err59.emUsed){
emErrs21.push(err59);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
}
else {
const err60 = {instancePath,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[1].type,parentSchema:schema58.oneOf[1],data};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(errors > 0){
const emErrs22 = [];
for(const err61 of vErrors){
if(!err61.emUsed){
emErrs22.push(err61);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
var _valid0 = _errs21 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs46 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key3 in data){
if(!(((((((key3 === "type") || (key3 === "month")) || (key3 === "dayOfMonth")) || (key3 === "dayOfWeek")) || (key3 === "hour")) || (key3 === "minute")) || (key3 === "timeZone"))){
const err62 = {instancePath,schemaPath:"#/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties",schema:false,parentSchema:schema58.oneOf[2],data};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
if(data.type !== undefined){
let data15 = data.type;
if("daily" !== data15){
const err63 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "daily"},message:"must be equal to constant",schema:"daily",parentSchema:schema58.oneOf[2].properties.type,data:data15};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(errors > 0){
const emErrs23 = [];
for(const err64 of vErrors){
if(!err64.emUsed){
emErrs23.push(err64);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
}
if(data.month !== undefined){
let data16 = data.month;
if("*" !== data16){
const err65 = {instancePath:instancePath+"/month",schemaPath:"#/oneOf/2/properties/month/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema58.oneOf[2].properties.month,data:data16};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(errors > 0){
const emErrs24 = [];
for(const err66 of vErrors){
if(!err66.emUsed){
emErrs24.push(err66);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
}
if(data.dayOfMonth !== undefined){
let data17 = data.dayOfMonth;
if("*" !== data17){
const err67 = {instancePath:instancePath+"/dayOfMonth",schemaPath:"#/oneOf/2/properties/dayOfMonth/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema58.oneOf[2].properties.dayOfMonth,data:data17};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err68 of vErrors){
if(!err68.emUsed){
emErrs25.push(err68);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
if(data.dayOfWeek !== undefined){
let data18 = data.dayOfWeek;
if("*" !== data18){
const err69 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/oneOf/2/properties/dayOfWeek/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema58.oneOf[2].properties.dayOfWeek,data:data18};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err70 of vErrors){
if(!err70.emUsed){
emErrs26.push(err70);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
if(data.hour !== undefined){
let data19 = data.hour;
if(!((typeof data19 == "number") && (!(data19 % 1) && !isNaN(data19)))){
const err71 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema28.type,parentSchema:schema28,data:data19};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(typeof data19 == "number"){
if(data19 > 23 || isNaN(data19)){
const err72 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/maximum",keyword:"maximum",params:{comparison: "<=", limit: 23},message:"must be <= 23",schema:23,parentSchema:schema28,data:data19};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(data19 < 0 || isNaN(data19)){
const err73 = {instancePath:instancePath+"/hour",schemaPath:"#/$defs/hour/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28,data:data19};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(errors > 0){
const emErrs27 = [];
for(const err74 of vErrors){
if(!err74.emUsed){
emErrs27.push(err74);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
if(errors > 0){
const emErrs28 = [];
for(const err75 of vErrors){
if(!err75.emUsed){
emErrs28.push(err75);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
}
if(data.minute !== undefined){
let data20 = data.minute;
if(!((typeof data20 == "number") && (!(data20 % 1) && !isNaN(data20)))){
const err76 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema29.type,parentSchema:schema29,data:data20};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
if(typeof data20 == "number"){
if(data20 > 59 || isNaN(data20)){
const err77 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/maximum",keyword:"maximum",params:{comparison: "<=", limit: 59},message:"must be <= 59",schema:59,parentSchema:schema29,data:data20};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(data20 < 0 || isNaN(data20)){
const err78 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema29,data:data20};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(errors > 0){
const emErrs29 = [];
for(const err79 of vErrors){
if(!err79.emUsed){
emErrs29.push(err79);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
if(errors > 0){
const emErrs30 = [];
for(const err80 of vErrors){
if(!err80.emUsed){
emErrs30.push(err80);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
}
if(data.timeZone !== undefined){
let data21 = data.timeZone;
if(typeof data21 !== "string"){
const err81 = {instancePath:instancePath+"/timeZone",schemaPath:"#/$defs/timeZone/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.type,parentSchema:schema30,data:data21};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(errors > 0){
const emErrs31 = [];
for(const err82 of vErrors){
if(!err82.emUsed){
emErrs31.push(err82);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
if(errors > 0){
const emErrs32 = [];
for(const err83 of vErrors){
if(!err83.emUsed){
emErrs32.push(err83);
}
}
vErrors = emErrs32;
errors = emErrs32.length;
}
}
}
else {
const err84 = {instancePath,schemaPath:"#/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[2].type,parentSchema:schema58.oneOf[2],data};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(errors > 0){
const emErrs33 = [];
for(const err85 of vErrors){
if(!err85.emUsed){
emErrs33.push(err85);
}
}
vErrors = emErrs33;
errors = emErrs33.length;
}
var _valid0 = _errs46 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid0 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
const _errs62 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
for(const key4 in data){
if(!((((((((key4 === "type") || (key4 === "month")) || (key4 === "dayOfMonth")) || (key4 === "dayOfWeek")) || (key4 === "hour")) || (key4 === "hourStep")) || (key4 === "minute")) || (key4 === "timeZone"))){
const err86 = {instancePath,schemaPath:"#/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties",schema:false,parentSchema:schema58.oneOf[3],data};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(data.type !== undefined){
let data22 = data.type;
if("hours" !== data22){
const err87 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "hours"},message:"must be equal to constant",schema:"hours",parentSchema:schema58.oneOf[3].properties.type,data:data22};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
if(errors > 0){
const emErrs34 = [];
for(const err88 of vErrors){
if(!err88.emUsed){
emErrs34.push(err88);
}
}
vErrors = emErrs34;
errors = emErrs34.length;
}
}
if(data.month !== undefined){
let data23 = data.month;
if("*" !== data23){
const err89 = {instancePath:instancePath+"/month",schemaPath:"#/oneOf/3/properties/month/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema58.oneOf[3].properties.month,data:data23};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if(errors > 0){
const emErrs35 = [];
for(const err90 of vErrors){
if(!err90.emUsed){
emErrs35.push(err90);
}
}
vErrors = emErrs35;
errors = emErrs35.length;
}
}
if(data.dayOfMonth !== undefined){
let data24 = data.dayOfMonth;
if("*" !== data24){
const err91 = {instancePath:instancePath+"/dayOfMonth",schemaPath:"#/oneOf/3/properties/dayOfMonth/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema58.oneOf[3].properties.dayOfMonth,data:data24};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if(errors > 0){
const emErrs36 = [];
for(const err92 of vErrors){
if(!err92.emUsed){
emErrs36.push(err92);
}
}
vErrors = emErrs36;
errors = emErrs36.length;
}
}
if(data.dayOfWeek !== undefined){
let data25 = data.dayOfWeek;
if("*" !== data25){
const err93 = {instancePath:instancePath+"/dayOfWeek",schemaPath:"#/oneOf/3/properties/dayOfWeek/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema58.oneOf[3].properties.dayOfWeek,data:data25};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
if(errors > 0){
const emErrs37 = [];
for(const err94 of vErrors){
if(!err94.emUsed){
emErrs37.push(err94);
}
}
vErrors = emErrs37;
errors = emErrs37.length;
}
}
if(data.hour !== undefined){
let data26 = data.hour;
if("*" !== data26){
const err95 = {instancePath:instancePath+"/hour",schemaPath:"#/oneOf/3/properties/hour/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema58.oneOf[3].properties.hour,data:data26};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
if(errors > 0){
const emErrs38 = [];
for(const err96 of vErrors){
if(!err96.emUsed){
emErrs38.push(err96);
}
}
vErrors = emErrs38;
errors = emErrs38.length;
}
}
if(data.hourStep !== undefined){
let data27 = data.hourStep;
if(!((typeof data27 == "number") && (!(data27 % 1) && !isNaN(data27)))){
const err97 = {instancePath:instancePath+"/hourStep",schemaPath:"#/oneOf/3/properties/hourStep/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema58.oneOf[3].properties.hourStep.type,parentSchema:schema58.oneOf[3].properties.hourStep,data:data27};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
if(typeof data27 == "number"){
if(data27 > 12 || isNaN(data27)){
const err98 = {instancePath:instancePath+"/hourStep",schemaPath:"#/oneOf/3/properties/hourStep/maximum",keyword:"maximum",params:{comparison: "<=", limit: 12},message:"must be <= 12",schema:12,parentSchema:schema58.oneOf[3].properties.hourStep,data:data27};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(data27 < 1 || isNaN(data27)){
const err99 = {instancePath:instancePath+"/hourStep",schemaPath:"#/oneOf/3/properties/hourStep/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1",schema:1,parentSchema:schema58.oneOf[3].properties.hourStep,data:data27};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
}
if(errors > 0){
const emErrs39 = [];
for(const err100 of vErrors){
if(!err100.emUsed){
emErrs39.push(err100);
}
}
vErrors = emErrs39;
errors = emErrs39.length;
}
}
if(data.minute !== undefined){
let data28 = data.minute;
if(!((typeof data28 == "number") && (!(data28 % 1) && !isNaN(data28)))){
const err101 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema29.type,parentSchema:schema29,data:data28};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
if(typeof data28 == "number"){
if(data28 > 59 || isNaN(data28)){
const err102 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/maximum",keyword:"maximum",params:{comparison: "<=", limit: 59},message:"must be <= 59",schema:59,parentSchema:schema29,data:data28};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
if(data28 < 0 || isNaN(data28)){
const err103 = {instancePath:instancePath+"/minute",schemaPath:"#/$defs/minute/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema29,data:data28};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
if(errors > 0){
const emErrs40 = [];
for(const err104 of vErrors){
if(!err104.emUsed){
emErrs40.push(err104);
}
}
vErrors = emErrs40;
errors = emErrs40.length;
}
if(errors > 0){
const emErrs41 = [];
for(const err105 of vErrors){
if(!err105.emUsed){
emErrs41.push(err105);
}
}
vErrors = emErrs41;
errors = emErrs41.length;
}
}
if(data.timeZone !== undefined){
let data29 = data.timeZone;
if(typeof data29 !== "string"){
const err106 = {instancePath:instancePath+"/timeZone",schemaPath:"#/$defs/timeZone/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.type,parentSchema:schema30,data:data29};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
if(errors > 0){
const emErrs42 = [];
for(const err107 of vErrors){
if(!err107.emUsed){
emErrs42.push(err107);
}
}
vErrors = emErrs42;
errors = emErrs42.length;
}
if(errors > 0){
const emErrs43 = [];
for(const err108 of vErrors){
if(!err108.emUsed){
emErrs43.push(err108);
}
}
vErrors = emErrs43;
errors = emErrs43.length;
}
}
}
else {
const err109 = {instancePath,schemaPath:"#/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.oneOf[3].type,parentSchema:schema58.oneOf[3],data};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if(errors > 0){
const emErrs44 = [];
for(const err110 of vErrors){
if(!err110.emUsed){
emErrs44.push(err110);
}
}
vErrors = emErrs44;
errors = emErrs44.length;
}
var _valid0 = _errs62 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid0 = true;
passing0 = 3;
if(props0 !== true){
props0 = true;
}
}
}
}
}
if(!valid0){
const err111 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema58.oneOf,parentSchema:schema58,data};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
else {
errors = _errs1;
if(vErrors !== null){
if(_errs1){
vErrors.length = _errs1;
}
else {
vErrors = null;
}
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err112 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema58.required,parentSchema:schema58,data};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
if(data.month === undefined){
const err113 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "month"},message:"must have required property '"+"month"+"'",schema:schema58.required,parentSchema:schema58,data};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
if(data.dayOfWeek === undefined){
const err114 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "dayOfWeek"},message:"must have required property '"+"dayOfWeek"+"'",schema:schema58.required,parentSchema:schema58,data};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
if(data.dayOfMonth === undefined){
const err115 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "dayOfMonth"},message:"must have required property '"+"dayOfMonth"+"'",schema:schema58.required,parentSchema:schema58,data};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
if(data.hour === undefined){
const err116 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "hour"},message:"must have required property '"+"hour"+"'",schema:schema58.required,parentSchema:schema58,data};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
if(data.minute === undefined){
const err117 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "minute"},message:"must have required property '"+"minute"+"'",schema:schema58.required,parentSchema:schema58,data};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
else {
const err118 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema58.type,parentSchema:schema58,data};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"oneOf":[]};
const templates1 = {};
for(const err119 of vErrors){
if((((((err119.keyword !== "errorMessage") && (!err119.emUsed)) && (err119.instancePath === instancePath)) && (err119.keyword in emErrors1)) && (err119.schemaPath.indexOf("#") === 0)) && (/^\/[^\/]*$/.test(err119.schemaPath.slice(1)))){
emErrors1[err119.keyword].push(err119);
err119.emUsed = true;
}
}
for(const key5 in emErrors1){
if(emErrors1[key5].length){
const err120 = {instancePath,schemaPath:"#/errorMessage",keyword:"errorMessage",params:{errors: emErrors1[key5]},message:key5 in templates1 ? templates1[key5]() : schema58.errorMessage[key5],schema:schema58.errorMessage,parentSchema:schema58,data};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
}
const emErrs45 = [];
for(const err121 of vErrors){
if(!err121.emUsed){
emErrs45.push(err121);
}
}
vErrors = emErrs45;
errors = emErrs45.length;
}
validate36.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate36.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate35(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export4" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate35.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(validate36(data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate36.errors : vErrors.concat(validate36.errors);
errors = vErrors.length;
}
else {
var props0 = validate36.evaluated.props;
}
validate35.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate35.evaluated = {"dynamicProps":true,"dynamicItems":false};

const export5 = validate38;
const schema70 = {"$id":"export5","$ref":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/autonomous-agent-task/write-req","title":"Tâche planifiée","x-exports":["validate","types","vjsf"],"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"required":["title","prompt","scheduling"],"$defs":{"hour":{"type":"integer","minimum":0,"maximum":23,"default":0,"title":"Heure","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/hour","errorMessage":{}},"minute":{"type":"integer","minimum":0,"maximum":59,"default":0,"title":"Minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/minute","errorMessage":{}},"timeZone":{"type":"string","default":"Europe/Paris","title":"Fuseau horaire","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/timeZone","errorMessage":{}}},"properties":{"title":{"type":"string","maxLength":200,"title":"Titre","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/title","errorMessage":{}},"prompt":{"type":"string","maxLength":20000,"layout":"textarea","title":"Consigne","description":"Ce qu'il est demandé à l'agent de faire à chaque exécution.","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/prompt","errorMessage":{}},"scheduling":{"type":"array","minItems":1,"maxItems":10,"title":"Planification","items":{"type":"object","required":["type","month","dayOfWeek","dayOfMonth","hour","minute"],"oneOfLayout":{"emptyData":true},"oneOf":[{"title":"Mensuel","additionalProperties":false,"properties":{"type":{"const":"monthly","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/type","errorMessage":{}},"month":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/month","errorMessage":{}},"dayOfWeek":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfWeek","errorMessage":{}},"dayOfMonth":{"type":"integer","minimum":1,"maximum":28,"default":1,"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfMonth","errorMessage":{}},"lastDayOfMonth":{"type":"boolean","default":false,"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/lastDayOfMonth","errorMessage":{}},"hour":{"$ref":"#/$defs/hour","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/hour","errorMessage":{}},"minute":{"$ref":"#/$defs/minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/minute","errorMessage":{}},"timeZone":{"$ref":"#/$defs/timeZone","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/timeZone","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0","errorMessage":{}},{"title":"Hebdomadaire","additionalProperties":false,"properties":{"type":{"const":"weekly","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/type","errorMessage":{}},"month":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/month","errorMessage":{}},"dayOfMonth":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfMonth","errorMessage":{}},"dayOfWeek":{"type":"string","default":"1","oneOf":[{"const":"1","title":"1"},{"const":"2","title":"2"},{"const":"3","title":"3"},{"const":"4","title":"4"},{"const":"5","title":"5"},{"const":"6","title":"6"},{"const":"0","title":"0"}],"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfWeek","errorMessage":{"oneOf":"choisissez une valeur"}},"hour":{"$ref":"#/$defs/hour","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/hour","errorMessage":{}},"minute":{"$ref":"#/$defs/minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/minute","errorMessage":{}},"timeZone":{"$ref":"#/$defs/timeZone","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/timeZone","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1","errorMessage":{}},{"title":"Quotidien","additionalProperties":false,"properties":{"type":{"const":"daily","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/type","errorMessage":{}},"month":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/month","errorMessage":{}},"dayOfMonth":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfMonth","errorMessage":{}},"dayOfWeek":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfWeek","errorMessage":{}},"hour":{"$ref":"#/$defs/hour","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/hour","errorMessage":{}},"minute":{"$ref":"#/$defs/minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/minute","errorMessage":{}},"timeZone":{"$ref":"#/$defs/timeZone","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/timeZone","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2","errorMessage":{}},{"title":"Toutes les N heures","additionalProperties":false,"properties":{"type":{"const":"hours","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/type","errorMessage":{}},"month":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/month","errorMessage":{}},"dayOfMonth":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfMonth","errorMessage":{}},"dayOfWeek":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfWeek","errorMessage":{}},"hour":{"const":"*","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hour","errorMessage":{}},"hourStep":{"type":"integer","minimum":1,"maximum":12,"default":1,"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hourStep","errorMessage":{}},"minute":{"$ref":"#/$defs/minute","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/minute","errorMessage":{}},"timeZone":{"$ref":"#/$defs/timeZone","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/timeZone","errorMessage":{}}},"type":"object","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3","errorMessage":{}}],"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items","errorMessage":{"oneOf":"choisissez une valeur"}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling","errorMessage":{}},"enabled":{"type":"boolean","default":true,"title":"Activée","__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/enabled","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent-task/write-req#","errorMessage":{"required":{"title":"information obligatoire","prompt":"information obligatoire","scheduling":"information obligatoire"}}};
const func1 = ucs2length.default;
const obj0 = {"required":"missingProperty","dependencies":"property","dependentRequired":"property"};

function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://github.com/data-fair/agents/autonomous-agent-task/write-req" */;
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
if(data.prompt === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "prompt"},message:"must have required property '"+"prompt"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.scheduling === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scheduling"},message:"must have required property '"+"scheduling"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "title") || (key0 === "prompt")) || (key0 === "scheduling")) || (key0 === "enabled"))){
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
if(data.title !== undefined){
let data0 = data.title;
if(typeof data0 === "string"){
if(func1(data0) > 200){
const err4 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/maxLength",keyword:"maxLength",params:{limit: 200},message:"must NOT have more than 200 characters",schema:200,parentSchema:schema27.properties.title,data:data0};
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
if(data.prompt !== undefined){
let data1 = data.prompt;
if(typeof data1 === "string"){
if(func1(data1) > 20000){
const err7 = {instancePath:instancePath+"/prompt",schemaPath:"#/properties/prompt/maxLength",keyword:"maxLength",params:{limit: 20000},message:"must NOT have more than 20000 characters",schema:20000,parentSchema:schema27.properties.prompt,data:data1};
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
const err8 = {instancePath:instancePath+"/prompt",schemaPath:"#/properties/prompt/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.prompt.type,parentSchema:schema27.properties.prompt,data:data1};
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
if(data.scheduling !== undefined){
let data2 = data.scheduling;
if(Array.isArray(data2)){
if(data2.length > 10){
const err10 = {instancePath:instancePath+"/scheduling",schemaPath:"#/properties/scheduling/maxItems",keyword:"maxItems",params:{limit: 10},message:"must NOT have more than 10 items",schema:10,parentSchema:schema27.properties.scheduling,data:data2};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data2.length < 1){
const err11 = {instancePath:instancePath+"/scheduling",schemaPath:"#/properties/scheduling/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items",schema:1,parentSchema:schema27.properties.scheduling,data:data2};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
const _errs10 = errors;
let valid3 = false;
let passing0 = null;
const _errs11 = errors;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
for(const key1 in data3){
if(!((((((((key1 === "type") || (key1 === "month")) || (key1 === "dayOfWeek")) || (key1 === "dayOfMonth")) || (key1 === "lastDayOfMonth")) || (key1 === "hour")) || (key1 === "minute")) || (key1 === "timeZone"))){
const err12 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.scheduling.items.oneOf[0],data:data3};
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
if("monthly" !== data4){
const err13 = {instancePath:instancePath+"/scheduling/" + i0+"/type",schemaPath:"#/properties/scheduling/items/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "monthly"},message:"must be equal to constant",schema:"monthly",parentSchema:schema27.properties.scheduling.items.oneOf[0].properties.type,data:data4};
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
if(data3.month !== undefined){
let data5 = data3.month;
if("*" !== data5){
const err15 = {instancePath:instancePath+"/scheduling/" + i0+"/month",schemaPath:"#/properties/scheduling/items/oneOf/0/properties/month/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema27.properties.scheduling.items.oneOf[0].properties.month,data:data5};
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
if(data3.dayOfWeek !== undefined){
let data6 = data3.dayOfWeek;
if("*" !== data6){
const err17 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfWeek",schemaPath:"#/properties/scheduling/items/oneOf/0/properties/dayOfWeek/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema27.properties.scheduling.items.oneOf[0].properties.dayOfWeek,data:data6};
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
if(data3.dayOfMonth !== undefined){
let data7 = data3.dayOfMonth;
if(!((typeof data7 == "number") && (!(data7 % 1) && !isNaN(data7)))){
const err19 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfMonth",schemaPath:"#/properties/scheduling/items/oneOf/0/properties/dayOfMonth/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema27.properties.scheduling.items.oneOf[0].properties.dayOfMonth.type,parentSchema:schema27.properties.scheduling.items.oneOf[0].properties.dayOfMonth,data:data7};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(typeof data7 == "number"){
if(data7 > 28 || isNaN(data7)){
const err20 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfMonth",schemaPath:"#/properties/scheduling/items/oneOf/0/properties/dayOfMonth/maximum",keyword:"maximum",params:{comparison: "<=", limit: 28},message:"must be <= 28",schema:28,parentSchema:schema27.properties.scheduling.items.oneOf[0].properties.dayOfMonth,data:data7};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data7 < 1 || isNaN(data7)){
const err21 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfMonth",schemaPath:"#/properties/scheduling/items/oneOf/0/properties/dayOfMonth/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1",schema:1,parentSchema:schema27.properties.scheduling.items.oneOf[0].properties.dayOfMonth,data:data7};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(errors > 0){
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
if(data3.lastDayOfMonth !== undefined){
let data8 = data3.lastDayOfMonth;
if(typeof data8 !== "boolean"){
const err23 = {instancePath:instancePath+"/scheduling/" + i0+"/lastDayOfMonth",schemaPath:"#/properties/scheduling/items/oneOf/0/properties/lastDayOfMonth/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.scheduling.items.oneOf[0].properties.lastDayOfMonth.type,parentSchema:schema27.properties.scheduling.items.oneOf[0].properties.lastDayOfMonth,data:data8};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(errors > 0){
const emErrs6 = [];
for(const err24 of vErrors){
if(!err24.emUsed){
emErrs6.push(err24);
}
}
vErrors = emErrs6;
errors = emErrs6.length;
}
}
if(data3.hour !== undefined){
let data9 = data3.hour;
if(!((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9)))){
const err25 = {instancePath:instancePath+"/scheduling/" + i0+"/hour",schemaPath:"#/$defs/hour/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema28.type,parentSchema:schema28,data:data9};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(typeof data9 == "number"){
if(data9 > 23 || isNaN(data9)){
const err26 = {instancePath:instancePath+"/scheduling/" + i0+"/hour",schemaPath:"#/$defs/hour/maximum",keyword:"maximum",params:{comparison: "<=", limit: 23},message:"must be <= 23",schema:23,parentSchema:schema28,data:data9};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data9 < 0 || isNaN(data9)){
const err27 = {instancePath:instancePath+"/scheduling/" + i0+"/hour",schemaPath:"#/$defs/hour/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28,data:data9};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(errors > 0){
const emErrs7 = [];
for(const err28 of vErrors){
if(!err28.emUsed){
emErrs7.push(err28);
}
}
vErrors = emErrs7;
errors = emErrs7.length;
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
if(data3.minute !== undefined){
let data10 = data3.minute;
if(!((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10)))){
const err30 = {instancePath:instancePath+"/scheduling/" + i0+"/minute",schemaPath:"#/$defs/minute/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema29.type,parentSchema:schema29,data:data10};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(typeof data10 == "number"){
if(data10 > 59 || isNaN(data10)){
const err31 = {instancePath:instancePath+"/scheduling/" + i0+"/minute",schemaPath:"#/$defs/minute/maximum",keyword:"maximum",params:{comparison: "<=", limit: 59},message:"must be <= 59",schema:59,parentSchema:schema29,data:data10};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(data10 < 0 || isNaN(data10)){
const err32 = {instancePath:instancePath+"/scheduling/" + i0+"/minute",schemaPath:"#/$defs/minute/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema29,data:data10};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
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
if(errors > 0){
const emErrs10 = [];
for(const err34 of vErrors){
if(!err34.emUsed){
emErrs10.push(err34);
}
}
vErrors = emErrs10;
errors = emErrs10.length;
}
}
if(data3.timeZone !== undefined){
let data11 = data3.timeZone;
if(typeof data11 !== "string"){
const err35 = {instancePath:instancePath+"/scheduling/" + i0+"/timeZone",schemaPath:"#/$defs/timeZone/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.type,parentSchema:schema30,data:data11};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(errors > 0){
const emErrs11 = [];
for(const err36 of vErrors){
if(!err36.emUsed){
emErrs11.push(err36);
}
}
vErrors = emErrs11;
errors = emErrs11.length;
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
const err38 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.scheduling.items.oneOf[0].type,parentSchema:schema27.properties.scheduling.items.oneOf[0],data:data3};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(errors > 0){
const emErrs13 = [];
for(const err39 of vErrors){
if(!err39.emUsed){
emErrs13.push(err39);
}
}
vErrors = emErrs13;
errors = emErrs13.length;
}
var _valid0 = _errs11 === errors;
if(_valid0){
valid3 = true;
passing0 = 0;
var props0 = true;
}
const _errs30 = errors;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
for(const key2 in data3){
if(!(((((((key2 === "type") || (key2 === "month")) || (key2 === "dayOfMonth")) || (key2 === "dayOfWeek")) || (key2 === "hour")) || (key2 === "minute")) || (key2 === "timeZone"))){
const err40 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.scheduling.items.oneOf[1],data:data3};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data3.type !== undefined){
let data12 = data3.type;
if("weekly" !== data12){
const err41 = {instancePath:instancePath+"/scheduling/" + i0+"/type",schemaPath:"#/properties/scheduling/items/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "weekly"},message:"must be equal to constant",schema:"weekly",parentSchema:schema27.properties.scheduling.items.oneOf[1].properties.type,data:data12};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(errors > 0){
const emErrs14 = [];
for(const err42 of vErrors){
if(!err42.emUsed){
emErrs14.push(err42);
}
}
vErrors = emErrs14;
errors = emErrs14.length;
}
}
if(data3.month !== undefined){
let data13 = data3.month;
if("*" !== data13){
const err43 = {instancePath:instancePath+"/scheduling/" + i0+"/month",schemaPath:"#/properties/scheduling/items/oneOf/1/properties/month/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema27.properties.scheduling.items.oneOf[1].properties.month,data:data13};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(errors > 0){
const emErrs15 = [];
for(const err44 of vErrors){
if(!err44.emUsed){
emErrs15.push(err44);
}
}
vErrors = emErrs15;
errors = emErrs15.length;
}
}
if(data3.dayOfMonth !== undefined){
let data14 = data3.dayOfMonth;
if("*" !== data14){
const err45 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfMonth",schemaPath:"#/properties/scheduling/items/oneOf/1/properties/dayOfMonth/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfMonth,data:data14};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(errors > 0){
const emErrs16 = [];
for(const err46 of vErrors){
if(!err46.emUsed){
emErrs16.push(err46);
}
}
vErrors = emErrs16;
errors = emErrs16.length;
}
}
if(data3.dayOfWeek !== undefined){
let data15 = data3.dayOfWeek;
if(typeof data15 !== "string"){
const err47 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfWeek",schemaPath:"#/properties/scheduling/items/oneOf/1/properties/dayOfWeek/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek.type,parentSchema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek,data:data15};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
const _errs38 = errors;
let valid9 = false;
let passing1 = null;
const _errs39 = errors;
if("1" !== data15){
const err48 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfWeek",schemaPath:"#/properties/scheduling/items/oneOf/1/properties/dayOfWeek/oneOf/0/const",keyword:"const",params:{allowedValue: "1"},message:"must be equal to constant",schema:"1",parentSchema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek.oneOf[0],data:data15};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
var _valid1 = _errs39 === errors;
if(_valid1){
valid9 = true;
passing1 = 0;
}
const _errs40 = errors;
if("2" !== data15){
const err49 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfWeek",schemaPath:"#/properties/scheduling/items/oneOf/1/properties/dayOfWeek/oneOf/1/const",keyword:"const",params:{allowedValue: "2"},message:"must be equal to constant",schema:"2",parentSchema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek.oneOf[1],data:data15};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
var _valid1 = _errs40 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 1];
}
else {
if(_valid1){
valid9 = true;
passing1 = 1;
}
const _errs41 = errors;
if("3" !== data15){
const err50 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfWeek",schemaPath:"#/properties/scheduling/items/oneOf/1/properties/dayOfWeek/oneOf/2/const",keyword:"const",params:{allowedValue: "3"},message:"must be equal to constant",schema:"3",parentSchema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek.oneOf[2],data:data15};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
var _valid1 = _errs41 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 2];
}
else {
if(_valid1){
valid9 = true;
passing1 = 2;
}
const _errs42 = errors;
if("4" !== data15){
const err51 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfWeek",schemaPath:"#/properties/scheduling/items/oneOf/1/properties/dayOfWeek/oneOf/3/const",keyword:"const",params:{allowedValue: "4"},message:"must be equal to constant",schema:"4",parentSchema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek.oneOf[3],data:data15};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
var _valid1 = _errs42 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 3];
}
else {
if(_valid1){
valid9 = true;
passing1 = 3;
}
const _errs43 = errors;
if("5" !== data15){
const err52 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfWeek",schemaPath:"#/properties/scheduling/items/oneOf/1/properties/dayOfWeek/oneOf/4/const",keyword:"const",params:{allowedValue: "5"},message:"must be equal to constant",schema:"5",parentSchema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek.oneOf[4],data:data15};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
var _valid1 = _errs43 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 4];
}
else {
if(_valid1){
valid9 = true;
passing1 = 4;
}
const _errs44 = errors;
if("6" !== data15){
const err53 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfWeek",schemaPath:"#/properties/scheduling/items/oneOf/1/properties/dayOfWeek/oneOf/5/const",keyword:"const",params:{allowedValue: "6"},message:"must be equal to constant",schema:"6",parentSchema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek.oneOf[5],data:data15};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
var _valid1 = _errs44 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 5];
}
else {
if(_valid1){
valid9 = true;
passing1 = 5;
}
const _errs45 = errors;
if("0" !== data15){
const err54 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfWeek",schemaPath:"#/properties/scheduling/items/oneOf/1/properties/dayOfWeek/oneOf/6/const",keyword:"const",params:{allowedValue: "0"},message:"must be equal to constant",schema:"0",parentSchema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek.oneOf[6],data:data15};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
var _valid1 = _errs45 === errors;
if(_valid1 && valid9){
valid9 = false;
passing1 = [passing1, 6];
}
else {
if(_valid1){
valid9 = true;
passing1 = 6;
}
}
}
}
}
}
}
if(!valid9){
const err55 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfWeek",schemaPath:"#/properties/scheduling/items/oneOf/1/properties/dayOfWeek/oneOf",keyword:"oneOf",params:{passingSchemas: passing1},message:"must match exactly one schema in oneOf",schema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek.oneOf,parentSchema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek,data:data15};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
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
if(errors > 0){
const emErrors0 = {"oneOf":[]};
const templates0 = {};
for(const err56 of vErrors){
if((((((err56.keyword !== "errorMessage") && (!err56.emUsed)) && (err56.instancePath === instancePath+"/scheduling/" + i0+"/dayOfWeek")) && (err56.keyword in emErrors0)) && (err56.schemaPath.indexOf("#/properties/scheduling/items/oneOf/1/properties/dayOfWeek") === 0)) && (/^\/[^\/]*$/.test(err56.schemaPath.slice(58)))){
emErrors0[err56.keyword].push(err56);
err56.emUsed = true;
}
}
for(const key3 in emErrors0){
if(emErrors0[key3].length){
const err57 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfWeek",schemaPath:"#/properties/scheduling/items/oneOf/1/properties/dayOfWeek/errorMessage",keyword:"errorMessage",params:{errors: emErrors0[key3]},message:key3 in templates0 ? templates0[key3]() : schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek.errorMessage[key3],schema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek.errorMessage,parentSchema:schema27.properties.scheduling.items.oneOf[1].properties.dayOfWeek,data:data15};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
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
}
if(data3.hour !== undefined){
let data16 = data3.hour;
if(!((typeof data16 == "number") && (!(data16 % 1) && !isNaN(data16)))){
const err59 = {instancePath:instancePath+"/scheduling/" + i0+"/hour",schemaPath:"#/$defs/hour/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema28.type,parentSchema:schema28,data:data16};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(typeof data16 == "number"){
if(data16 > 23 || isNaN(data16)){
const err60 = {instancePath:instancePath+"/scheduling/" + i0+"/hour",schemaPath:"#/$defs/hour/maximum",keyword:"maximum",params:{comparison: "<=", limit: 23},message:"must be <= 23",schema:23,parentSchema:schema28,data:data16};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data16 < 0 || isNaN(data16)){
const err61 = {instancePath:instancePath+"/scheduling/" + i0+"/hour",schemaPath:"#/$defs/hour/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28,data:data16};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(errors > 0){
const emErrs18 = [];
for(const err62 of vErrors){
if(!err62.emUsed){
emErrs18.push(err62);
}
}
vErrors = emErrs18;
errors = emErrs18.length;
}
if(errors > 0){
const emErrs19 = [];
for(const err63 of vErrors){
if(!err63.emUsed){
emErrs19.push(err63);
}
}
vErrors = emErrs19;
errors = emErrs19.length;
}
}
if(data3.minute !== undefined){
let data17 = data3.minute;
if(!((typeof data17 == "number") && (!(data17 % 1) && !isNaN(data17)))){
const err64 = {instancePath:instancePath+"/scheduling/" + i0+"/minute",schemaPath:"#/$defs/minute/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema29.type,parentSchema:schema29,data:data17};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(typeof data17 == "number"){
if(data17 > 59 || isNaN(data17)){
const err65 = {instancePath:instancePath+"/scheduling/" + i0+"/minute",schemaPath:"#/$defs/minute/maximum",keyword:"maximum",params:{comparison: "<=", limit: 59},message:"must be <= 59",schema:59,parentSchema:schema29,data:data17};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(data17 < 0 || isNaN(data17)){
const err66 = {instancePath:instancePath+"/scheduling/" + i0+"/minute",schemaPath:"#/$defs/minute/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema29,data:data17};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
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
if(errors > 0){
const emErrs21 = [];
for(const err68 of vErrors){
if(!err68.emUsed){
emErrs21.push(err68);
}
}
vErrors = emErrs21;
errors = emErrs21.length;
}
}
if(data3.timeZone !== undefined){
let data18 = data3.timeZone;
if(typeof data18 !== "string"){
const err69 = {instancePath:instancePath+"/scheduling/" + i0+"/timeZone",schemaPath:"#/$defs/timeZone/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.type,parentSchema:schema30,data:data18};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
if(errors > 0){
const emErrs22 = [];
for(const err70 of vErrors){
if(!err70.emUsed){
emErrs22.push(err70);
}
}
vErrors = emErrs22;
errors = emErrs22.length;
}
if(errors > 0){
const emErrs23 = [];
for(const err71 of vErrors){
if(!err71.emUsed){
emErrs23.push(err71);
}
}
vErrors = emErrs23;
errors = emErrs23.length;
}
}
}
else {
const err72 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.scheduling.items.oneOf[1].type,parentSchema:schema27.properties.scheduling.items.oneOf[1],data:data3};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(errors > 0){
const emErrs24 = [];
for(const err73 of vErrors){
if(!err73.emUsed){
emErrs24.push(err73);
}
}
vErrors = emErrs24;
errors = emErrs24.length;
}
var _valid0 = _errs30 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid3 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs55 = errors;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
for(const key4 in data3){
if(!(((((((key4 === "type") || (key4 === "month")) || (key4 === "dayOfMonth")) || (key4 === "dayOfWeek")) || (key4 === "hour")) || (key4 === "minute")) || (key4 === "timeZone"))){
const err74 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.scheduling.items.oneOf[2],data:data3};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(data3.type !== undefined){
let data19 = data3.type;
if("daily" !== data19){
const err75 = {instancePath:instancePath+"/scheduling/" + i0+"/type",schemaPath:"#/properties/scheduling/items/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue: "daily"},message:"must be equal to constant",schema:"daily",parentSchema:schema27.properties.scheduling.items.oneOf[2].properties.type,data:data19};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if(errors > 0){
const emErrs25 = [];
for(const err76 of vErrors){
if(!err76.emUsed){
emErrs25.push(err76);
}
}
vErrors = emErrs25;
errors = emErrs25.length;
}
}
if(data3.month !== undefined){
let data20 = data3.month;
if("*" !== data20){
const err77 = {instancePath:instancePath+"/scheduling/" + i0+"/month",schemaPath:"#/properties/scheduling/items/oneOf/2/properties/month/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema27.properties.scheduling.items.oneOf[2].properties.month,data:data20};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
if(errors > 0){
const emErrs26 = [];
for(const err78 of vErrors){
if(!err78.emUsed){
emErrs26.push(err78);
}
}
vErrors = emErrs26;
errors = emErrs26.length;
}
}
if(data3.dayOfMonth !== undefined){
let data21 = data3.dayOfMonth;
if("*" !== data21){
const err79 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfMonth",schemaPath:"#/properties/scheduling/items/oneOf/2/properties/dayOfMonth/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema27.properties.scheduling.items.oneOf[2].properties.dayOfMonth,data:data21};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(errors > 0){
const emErrs27 = [];
for(const err80 of vErrors){
if(!err80.emUsed){
emErrs27.push(err80);
}
}
vErrors = emErrs27;
errors = emErrs27.length;
}
}
if(data3.dayOfWeek !== undefined){
let data22 = data3.dayOfWeek;
if("*" !== data22){
const err81 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfWeek",schemaPath:"#/properties/scheduling/items/oneOf/2/properties/dayOfWeek/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema27.properties.scheduling.items.oneOf[2].properties.dayOfWeek,data:data22};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(errors > 0){
const emErrs28 = [];
for(const err82 of vErrors){
if(!err82.emUsed){
emErrs28.push(err82);
}
}
vErrors = emErrs28;
errors = emErrs28.length;
}
}
if(data3.hour !== undefined){
let data23 = data3.hour;
if(!((typeof data23 == "number") && (!(data23 % 1) && !isNaN(data23)))){
const err83 = {instancePath:instancePath+"/scheduling/" + i0+"/hour",schemaPath:"#/$defs/hour/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema28.type,parentSchema:schema28,data:data23};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(typeof data23 == "number"){
if(data23 > 23 || isNaN(data23)){
const err84 = {instancePath:instancePath+"/scheduling/" + i0+"/hour",schemaPath:"#/$defs/hour/maximum",keyword:"maximum",params:{comparison: "<=", limit: 23},message:"must be <= 23",schema:23,parentSchema:schema28,data:data23};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(data23 < 0 || isNaN(data23)){
const err85 = {instancePath:instancePath+"/scheduling/" + i0+"/hour",schemaPath:"#/$defs/hour/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema28,data:data23};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(errors > 0){
const emErrs29 = [];
for(const err86 of vErrors){
if(!err86.emUsed){
emErrs29.push(err86);
}
}
vErrors = emErrs29;
errors = emErrs29.length;
}
if(errors > 0){
const emErrs30 = [];
for(const err87 of vErrors){
if(!err87.emUsed){
emErrs30.push(err87);
}
}
vErrors = emErrs30;
errors = emErrs30.length;
}
}
if(data3.minute !== undefined){
let data24 = data3.minute;
if(!((typeof data24 == "number") && (!(data24 % 1) && !isNaN(data24)))){
const err88 = {instancePath:instancePath+"/scheduling/" + i0+"/minute",schemaPath:"#/$defs/minute/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema29.type,parentSchema:schema29,data:data24};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if(typeof data24 == "number"){
if(data24 > 59 || isNaN(data24)){
const err89 = {instancePath:instancePath+"/scheduling/" + i0+"/minute",schemaPath:"#/$defs/minute/maximum",keyword:"maximum",params:{comparison: "<=", limit: 59},message:"must be <= 59",schema:59,parentSchema:schema29,data:data24};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if(data24 < 0 || isNaN(data24)){
const err90 = {instancePath:instancePath+"/scheduling/" + i0+"/minute",schemaPath:"#/$defs/minute/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema29,data:data24};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
if(errors > 0){
const emErrs31 = [];
for(const err91 of vErrors){
if(!err91.emUsed){
emErrs31.push(err91);
}
}
vErrors = emErrs31;
errors = emErrs31.length;
}
if(errors > 0){
const emErrs32 = [];
for(const err92 of vErrors){
if(!err92.emUsed){
emErrs32.push(err92);
}
}
vErrors = emErrs32;
errors = emErrs32.length;
}
}
if(data3.timeZone !== undefined){
let data25 = data3.timeZone;
if(typeof data25 !== "string"){
const err93 = {instancePath:instancePath+"/scheduling/" + i0+"/timeZone",schemaPath:"#/$defs/timeZone/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.type,parentSchema:schema30,data:data25};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
if(errors > 0){
const emErrs33 = [];
for(const err94 of vErrors){
if(!err94.emUsed){
emErrs33.push(err94);
}
}
vErrors = emErrs33;
errors = emErrs33.length;
}
if(errors > 0){
const emErrs34 = [];
for(const err95 of vErrors){
if(!err95.emUsed){
emErrs34.push(err95);
}
}
vErrors = emErrs34;
errors = emErrs34.length;
}
}
}
else {
const err96 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.scheduling.items.oneOf[2].type,parentSchema:schema27.properties.scheduling.items.oneOf[2],data:data3};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(errors > 0){
const emErrs35 = [];
for(const err97 of vErrors){
if(!err97.emUsed){
emErrs35.push(err97);
}
}
vErrors = emErrs35;
errors = emErrs35.length;
}
var _valid0 = _errs55 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid3 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
const _errs71 = errors;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
for(const key5 in data3){
if(!((((((((key5 === "type") || (key5 === "month")) || (key5 === "dayOfMonth")) || (key5 === "dayOfWeek")) || (key5 === "hour")) || (key5 === "hourStep")) || (key5 === "minute")) || (key5 === "timeZone"))){
const err98 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.scheduling.items.oneOf[3],data:data3};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
if(data3.type !== undefined){
let data26 = data3.type;
if("hours" !== data26){
const err99 = {instancePath:instancePath+"/scheduling/" + i0+"/type",schemaPath:"#/properties/scheduling/items/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue: "hours"},message:"must be equal to constant",schema:"hours",parentSchema:schema27.properties.scheduling.items.oneOf[3].properties.type,data:data26};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
if(errors > 0){
const emErrs36 = [];
for(const err100 of vErrors){
if(!err100.emUsed){
emErrs36.push(err100);
}
}
vErrors = emErrs36;
errors = emErrs36.length;
}
}
if(data3.month !== undefined){
let data27 = data3.month;
if("*" !== data27){
const err101 = {instancePath:instancePath+"/scheduling/" + i0+"/month",schemaPath:"#/properties/scheduling/items/oneOf/3/properties/month/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema27.properties.scheduling.items.oneOf[3].properties.month,data:data27};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
if(errors > 0){
const emErrs37 = [];
for(const err102 of vErrors){
if(!err102.emUsed){
emErrs37.push(err102);
}
}
vErrors = emErrs37;
errors = emErrs37.length;
}
}
if(data3.dayOfMonth !== undefined){
let data28 = data3.dayOfMonth;
if("*" !== data28){
const err103 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfMonth",schemaPath:"#/properties/scheduling/items/oneOf/3/properties/dayOfMonth/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema27.properties.scheduling.items.oneOf[3].properties.dayOfMonth,data:data28};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
if(errors > 0){
const emErrs38 = [];
for(const err104 of vErrors){
if(!err104.emUsed){
emErrs38.push(err104);
}
}
vErrors = emErrs38;
errors = emErrs38.length;
}
}
if(data3.dayOfWeek !== undefined){
let data29 = data3.dayOfWeek;
if("*" !== data29){
const err105 = {instancePath:instancePath+"/scheduling/" + i0+"/dayOfWeek",schemaPath:"#/properties/scheduling/items/oneOf/3/properties/dayOfWeek/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema27.properties.scheduling.items.oneOf[3].properties.dayOfWeek,data:data29};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
if(errors > 0){
const emErrs39 = [];
for(const err106 of vErrors){
if(!err106.emUsed){
emErrs39.push(err106);
}
}
vErrors = emErrs39;
errors = emErrs39.length;
}
}
if(data3.hour !== undefined){
let data30 = data3.hour;
if("*" !== data30){
const err107 = {instancePath:instancePath+"/scheduling/" + i0+"/hour",schemaPath:"#/properties/scheduling/items/oneOf/3/properties/hour/const",keyword:"const",params:{allowedValue: "*"},message:"must be equal to constant",schema:"*",parentSchema:schema27.properties.scheduling.items.oneOf[3].properties.hour,data:data30};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(errors > 0){
const emErrs40 = [];
for(const err108 of vErrors){
if(!err108.emUsed){
emErrs40.push(err108);
}
}
vErrors = emErrs40;
errors = emErrs40.length;
}
}
if(data3.hourStep !== undefined){
let data31 = data3.hourStep;
if(!((typeof data31 == "number") && (!(data31 % 1) && !isNaN(data31)))){
const err109 = {instancePath:instancePath+"/scheduling/" + i0+"/hourStep",schemaPath:"#/properties/scheduling/items/oneOf/3/properties/hourStep/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema27.properties.scheduling.items.oneOf[3].properties.hourStep.type,parentSchema:schema27.properties.scheduling.items.oneOf[3].properties.hourStep,data:data31};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
if(typeof data31 == "number"){
if(data31 > 12 || isNaN(data31)){
const err110 = {instancePath:instancePath+"/scheduling/" + i0+"/hourStep",schemaPath:"#/properties/scheduling/items/oneOf/3/properties/hourStep/maximum",keyword:"maximum",params:{comparison: "<=", limit: 12},message:"must be <= 12",schema:12,parentSchema:schema27.properties.scheduling.items.oneOf[3].properties.hourStep,data:data31};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
if(data31 < 1 || isNaN(data31)){
const err111 = {instancePath:instancePath+"/scheduling/" + i0+"/hourStep",schemaPath:"#/properties/scheduling/items/oneOf/3/properties/hourStep/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1",schema:1,parentSchema:schema27.properties.scheduling.items.oneOf[3].properties.hourStep,data:data31};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
}
if(errors > 0){
const emErrs41 = [];
for(const err112 of vErrors){
if(!err112.emUsed){
emErrs41.push(err112);
}
}
vErrors = emErrs41;
errors = emErrs41.length;
}
}
if(data3.minute !== undefined){
let data32 = data3.minute;
if(!((typeof data32 == "number") && (!(data32 % 1) && !isNaN(data32)))){
const err113 = {instancePath:instancePath+"/scheduling/" + i0+"/minute",schemaPath:"#/$defs/minute/type",keyword:"type",params:{type: "integer"},message:"must be integer",schema:schema29.type,parentSchema:schema29,data:data32};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
if(typeof data32 == "number"){
if(data32 > 59 || isNaN(data32)){
const err114 = {instancePath:instancePath+"/scheduling/" + i0+"/minute",schemaPath:"#/$defs/minute/maximum",keyword:"maximum",params:{comparison: "<=", limit: 59},message:"must be <= 59",schema:59,parentSchema:schema29,data:data32};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
if(data32 < 0 || isNaN(data32)){
const err115 = {instancePath:instancePath+"/scheduling/" + i0+"/minute",schemaPath:"#/$defs/minute/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0",schema:0,parentSchema:schema29,data:data32};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
}
if(errors > 0){
const emErrs42 = [];
for(const err116 of vErrors){
if(!err116.emUsed){
emErrs42.push(err116);
}
}
vErrors = emErrs42;
errors = emErrs42.length;
}
if(errors > 0){
const emErrs43 = [];
for(const err117 of vErrors){
if(!err117.emUsed){
emErrs43.push(err117);
}
}
vErrors = emErrs43;
errors = emErrs43.length;
}
}
if(data3.timeZone !== undefined){
let data33 = data3.timeZone;
if(typeof data33 !== "string"){
const err118 = {instancePath:instancePath+"/scheduling/" + i0+"/timeZone",schemaPath:"#/$defs/timeZone/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.type,parentSchema:schema30,data:data33};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if(errors > 0){
const emErrs44 = [];
for(const err119 of vErrors){
if(!err119.emUsed){
emErrs44.push(err119);
}
}
vErrors = emErrs44;
errors = emErrs44.length;
}
if(errors > 0){
const emErrs45 = [];
for(const err120 of vErrors){
if(!err120.emUsed){
emErrs45.push(err120);
}
}
vErrors = emErrs45;
errors = emErrs45.length;
}
}
}
else {
const err121 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.scheduling.items.oneOf[3].type,parentSchema:schema27.properties.scheduling.items.oneOf[3],data:data3};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if(errors > 0){
const emErrs46 = [];
for(const err122 of vErrors){
if(!err122.emUsed){
emErrs46.push(err122);
}
}
vErrors = emErrs46;
errors = emErrs46.length;
}
var _valid0 = _errs71 === errors;
if(_valid0 && valid3){
valid3 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid3 = true;
passing0 = 3;
if(props0 !== true){
props0 = true;
}
}
}
}
}
if(!valid3){
const err123 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema27.properties.scheduling.items.oneOf,parentSchema:schema27.properties.scheduling.items,data:data3};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
else {
errors = _errs10;
if(vErrors !== null){
if(_errs10){
vErrors.length = _errs10;
}
else {
vErrors = null;
}
}
}
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.type === undefined){
const err124 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'",schema:schema27.properties.scheduling.items.required,parentSchema:schema27.properties.scheduling.items,data:data3};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
if(data3.month === undefined){
const err125 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/required",keyword:"required",params:{missingProperty: "month"},message:"must have required property '"+"month"+"'",schema:schema27.properties.scheduling.items.required,parentSchema:schema27.properties.scheduling.items,data:data3};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
if(data3.dayOfWeek === undefined){
const err126 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/required",keyword:"required",params:{missingProperty: "dayOfWeek"},message:"must have required property '"+"dayOfWeek"+"'",schema:schema27.properties.scheduling.items.required,parentSchema:schema27.properties.scheduling.items,data:data3};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
if(data3.dayOfMonth === undefined){
const err127 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/required",keyword:"required",params:{missingProperty: "dayOfMonth"},message:"must have required property '"+"dayOfMonth"+"'",schema:schema27.properties.scheduling.items.required,parentSchema:schema27.properties.scheduling.items,data:data3};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
if(data3.hour === undefined){
const err128 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/required",keyword:"required",params:{missingProperty: "hour"},message:"must have required property '"+"hour"+"'",schema:schema27.properties.scheduling.items.required,parentSchema:schema27.properties.scheduling.items,data:data3};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
if(data3.minute === undefined){
const err129 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/required",keyword:"required",params:{missingProperty: "minute"},message:"must have required property '"+"minute"+"'",schema:schema27.properties.scheduling.items.required,parentSchema:schema27.properties.scheduling.items,data:data3};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
}
else {
const err130 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.scheduling.items.type,parentSchema:schema27.properties.scheduling.items,data:data3};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
if(errors > 0){
const emErrors1 = {"oneOf":[]};
const templates1 = {};
for(const err131 of vErrors){
if((((((err131.keyword !== "errorMessage") && (!err131.emUsed)) && (err131.instancePath === instancePath+"/scheduling/" + i0)) && (err131.keyword in emErrors1)) && (err131.schemaPath.indexOf("#/properties/scheduling/items") === 0)) && (/^\/[^\/]*$/.test(err131.schemaPath.slice(29)))){
emErrors1[err131.keyword].push(err131);
err131.emUsed = true;
}
}
for(const key6 in emErrors1){
if(emErrors1[key6].length){
const err132 = {instancePath:instancePath+"/scheduling/" + i0,schemaPath:"#/properties/scheduling/items/errorMessage",keyword:"errorMessage",params:{errors: emErrors1[key6]},message:key6 in templates1 ? templates1[key6]() : schema27.properties.scheduling.items.errorMessage[key6],schema:schema27.properties.scheduling.items.errorMessage,parentSchema:schema27.properties.scheduling.items,data:data3};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
}
const emErrs47 = [];
for(const err133 of vErrors){
if(!err133.emUsed){
emErrs47.push(err133);
}
}
vErrors = emErrs47;
errors = emErrs47.length;
}
}
}
else {
const err134 = {instancePath:instancePath+"/scheduling",schemaPath:"#/properties/scheduling/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema27.properties.scheduling.type,parentSchema:schema27.properties.scheduling,data:data2};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
if(errors > 0){
const emErrs48 = [];
for(const err135 of vErrors){
if(!err135.emUsed){
emErrs48.push(err135);
}
}
vErrors = emErrs48;
errors = emErrs48.length;
}
}
if(data.enabled !== undefined){
let data34 = data.enabled;
if(typeof data34 !== "boolean"){
const err136 = {instancePath:instancePath+"/enabled",schemaPath:"#/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.enabled.type,parentSchema:schema27.properties.enabled,data:data34};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
if(errors > 0){
const emErrs49 = [];
for(const err137 of vErrors){
if(!err137.emUsed){
emErrs49.push(err137);
}
}
vErrors = emErrs49;
errors = emErrs49.length;
}
}
}
else {
const err138 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
if(errors > 0){
const emErrors2 = {"required":{"title":[],"prompt":[],"scheduling":[]}};
const templates2 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err139 of vErrors){
if((((((err139.keyword !== "errorMessage") && (!err139.emUsed)) && (err139.instancePath === instancePath)) && (err139.keyword in emErrors2)) && (err139.schemaPath.indexOf("#") === 0)) && (/^\/[^\/]*$/.test(err139.schemaPath.slice(1)))){
emPropParams0 = obj0[err139.keyword];
emParamsErrors0 = emErrors2[err139.keyword][err139.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err139);
err139.emUsed = true;
}
}
}
for(const key7 in emErrors2){
for(const keyProp0 in emErrors2[key7]){
emParamsErrors0 = emErrors2[key7][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates2[key7] && templates2[key7][keyProp0];
const err140 = {instancePath,schemaPath:"#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.errorMessage[key7][keyProp0],schema:schema27.errorMessage,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
}
}
const emErrs50 = [];
for(const err141 of vErrors){
if(!err141.emUsed){
emErrs50.push(err141);
}
}
vErrors = emErrs50;
errors = emErrs50.length;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate38(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export5" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate38.evaluated;
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
validate38.errors = vErrors;
return errors === 0;
}
validate38.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
function expression0(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.defaultData)
}function expression1(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.constData)
}function expression2(data,value,options,context,display,layout,readOnly,summary,validates
) {
return ([{"const":"1","title":"1","key":"1","value":"1"},{"const":"2","title":"2","key":"2","value":"2"},{"const":"3","title":"3","key":"3","value":"3"},{"const":"4","title":"4","key":"4","value":"4"},{"const":"5","title":"5","key":"5","value":"5"},{"const":"6","title":"6","key":"6","value":"6"},{"const":"0","title":"0","key":"0","value":"0"}])
}
const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#": {
      title: "Tâche planifiée",
      root: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items": {
      title: "",
      root: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items",
      discriminatorValue: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0": {
      title: "Mensuel",
      root: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0",
      discriminatorValue: "monthly"
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1": {
      title: "Hebdomadaire",
      root: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1",
      discriminatorValue: "weekly"
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2": {
      title: "Quotidien",
      root: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2",
      discriminatorValue: "daily"
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3": {
      title: "Toutes les N heures",
      root: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3",
      discriminatorValue: "hours"
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#": {
      title: "Tâche planifiée",
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#",
      pure: true,

      propertyKeys: [
        "title",
        "prompt",
        "scheduling",
        "enabled"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/title",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/prompt",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/enabled"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/title": {
      title: "Titre",
      key: "title",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/title",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/title",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/prompt": {
      title: "Consigne",
      key: "prompt",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/prompt",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/prompt",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling": {
      title: "Planification",
      key: "scheduling",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items",
      pure: true,

      propertyKeys: [
        "type",
        "month",
        "dayOfWeek",
        "dayOfMonth",
        "lastDayOfMonth",
        "hour",
        "minute",
        "timeZone",
        "hourStep"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0": {
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0",
      pure: true,

      propertyKeys: [
        "type",
        "month",
        "dayOfWeek",
        "dayOfMonth",
        "lastDayOfMonth",
        "hour",
        "minute",
        "timeZone"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/type",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/month",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfWeek",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfMonth",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/lastDayOfMonth",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/hour",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/minute",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/timeZone"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/type": {
      title: undefined,
      key: "type",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/type",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/month": {
      title: undefined,
      key: "month",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/month",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/month",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfWeek": {
      title: undefined,
      key: "dayOfWeek",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfWeek",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfWeek",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfMonth": {
      title: undefined,
      key: "dayOfMonth",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfMonth",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfMonth",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/lastDayOfMonth": {
      title: undefined,
      key: "lastDayOfMonth",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/lastDayOfMonth",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/lastDayOfMonth",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/hour": {
      title: "Heure",
      key: "hour",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/hour",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/hour",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/minute": {
      title: "Minute",
      key: "minute",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/minute",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/minute",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/timeZone": {
      title: "Fuseau horaire",
      key: "timeZone",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/timeZone",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/timeZone",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1": {
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1",
      pure: true,

      propertyKeys: [
        "type",
        "month",
        "dayOfMonth",
        "dayOfWeek",
        "hour",
        "minute",
        "timeZone"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/type",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/month",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfMonth",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfWeek",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/hour",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/minute",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/timeZone"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/type": {
      title: undefined,
      key: "type",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/type",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/month": {
      title: undefined,
      key: "month",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/month",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/month",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfMonth": {
      title: undefined,
      key: "dayOfMonth",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfMonth",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfMonth",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfWeek": {
      title: undefined,
      key: "dayOfWeek",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfWeek",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfWeek",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/hour": {
      title: "Heure",
      key: "hour",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/hour",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/hour",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/minute": {
      title: "Minute",
      key: "minute",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/minute",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/minute",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/timeZone": {
      title: "Fuseau horaire",
      key: "timeZone",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/timeZone",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/timeZone",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2": {
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2",
      pure: true,

      propertyKeys: [
        "type",
        "month",
        "dayOfMonth",
        "dayOfWeek",
        "hour",
        "minute",
        "timeZone"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/type",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/month",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfMonth",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfWeek",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/hour",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/minute",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/timeZone"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/type": {
      title: undefined,
      key: "type",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/type",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/month": {
      title: undefined,
      key: "month",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/month",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/month",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfMonth": {
      title: undefined,
      key: "dayOfMonth",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfMonth",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfMonth",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfWeek": {
      title: undefined,
      key: "dayOfWeek",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfWeek",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfWeek",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/hour": {
      title: "Heure",
      key: "hour",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/hour",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/hour",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/minute": {
      title: "Minute",
      key: "minute",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/minute",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/minute",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/timeZone": {
      title: "Fuseau horaire",
      key: "timeZone",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/timeZone",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/timeZone",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3": {
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3",
      pure: true,

      propertyKeys: [
        "type",
        "month",
        "dayOfMonth",
        "dayOfWeek",
        "hour",
        "hourStep",
        "minute",
        "timeZone"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/type",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/month",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfMonth",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfWeek",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hour",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hourStep",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/minute",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/timeZone"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/type": {
      title: undefined,
      key: "type",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/type",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/type",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/month": {
      title: undefined,
      key: "month",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/month",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/month",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfMonth": {
      title: undefined,
      key: "dayOfMonth",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfMonth",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfMonth",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfWeek": {
      title: undefined,
      key: "dayOfWeek",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfWeek",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfWeek",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hour": {
      title: undefined,
      key: "hour",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hour",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hour",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hourStep": {
      title: undefined,
      key: "hourStep",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hourStep",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hourStep",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/minute": {
      title: "Minute",
      key: "minute",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/minute",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/minute",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/timeZone": {
      title: "Fuseau horaire",
      key: "timeZone",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/timeZone",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/$defs/timeZone",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf": {
      key: "$oneOf",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf",

      childrenTrees: [
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2",
        "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3"
      ],

      discriminator: "type",
      pure: true,

      propertyKeys: [
        "type",
        "month",
        "dayOfWeek",
        "dayOfMonth",
        "lastDayOfMonth",
        "hour",
        "minute",
        "timeZone",
        "hourStep"
      ],

      roPropertyKeys: []
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/enabled": {
      title: "Activée",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#": {
      comp: "section",

      children: [{
        key: "title"
      }, {
        key: "prompt"
      }, {
        key: "scheduling"
      }, {
        key: "enabled"
      }],

      title: "Tâche planifiée",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/title": {
      comp: "text-field",
      label: "Titre"
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/prompt": {
      comp: "textarea",
      label: "Consigne",
      help: "<p>Ce qu&#39;il est demandé à l&#39;agent de faire à chaque exécution.</p>"
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling": {
      comp: "list",
      title: "Planification",
      listEditMode: "inline-single",

      listActions: [
        "add",
        "edit",
        "delete",
        "sort",
        "duplicate"
      ],

      defaultData: [],

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items": {
      comp: "section",

      children: [{
        key: "$oneOf"
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

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf": {
      emptyData: true,
      comp: "one-of-select",

      oneOfItems: [{
        key: 0,
        title: "Mensuel"
      }, {
        key: 1,
        title: "Hebdomadaire"
      }, {
        key: 2,
        title: "Quotidien"
      }, {
        key: 3,
        title: "Toutes les N heures"
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

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "month"
      }, {
        key: "dayOfWeek"
      }, {
        key: "dayOfMonth"
      }, {
        key: "lastDayOfMonth"
      }, {
        key: "hour"
      }, {
        key: "minute"
      }, {
        key: "timeZone"
      }],

      title: "Mensuel",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/type": {
      comp: "none",
      constData: "monthly",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/month": {
      comp: "none",
      constData: "*",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfWeek": {
      comp: "none",
      constData: "*",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/dayOfMonth": {
      comp: "number-field",
      step: 1,
      min: 1,
      max: 28,
      precision: 0,
      label: "dayOfMonth",
      defaultData: 1,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/lastDayOfMonth": {
      comp: "checkbox",
      label: "lastDayOfMonth",
      defaultData: false,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/hour": {
      comp: "number-field",
      step: 1,
      min: 0,
      max: 23,
      precision: 0,
      label: "Heure",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/minute": {
      comp: "number-field",
      step: 1,
      min: 0,
      max: 59,
      precision: 0,
      label: "Minute",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0/properties/timeZone": {
      comp: "text-field",
      label: "Fuseau horaire",
      defaultData: "Europe/Paris",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "month"
      }, {
        key: "dayOfMonth"
      }, {
        key: "dayOfWeek"
      }, {
        key: "hour"
      }, {
        key: "minute"
      }, {
        key: "timeZone"
      }],

      title: "Hebdomadaire",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/type": {
      comp: "none",
      constData: "weekly",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/month": {
      comp: "none",
      constData: "*",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfMonth": {
      comp: "none",
      constData: "*",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/dayOfWeek": {
      comp: "select",

      getItems: {
        pure: true,
        type: "js-eval",
        dataAlias: "value",
        expr: "[{\"const\":\"1\",\"title\":\"1\",\"key\":\"1\",\"value\":\"1\"},{\"const\":\"2\",\"title\":\"2\",\"key\":\"2\",\"value\":\"2\"},{\"const\":\"3\",\"title\":\"3\",\"key\":\"3\",\"value\":\"3\"},{\"const\":\"4\",\"title\":\"4\",\"key\":\"4\",\"value\":\"4\"},{\"const\":\"5\",\"title\":\"5\",\"key\":\"5\",\"value\":\"5\"},{\"const\":\"6\",\"title\":\"6\",\"key\":\"6\",\"value\":\"6\"},{\"const\":\"0\",\"title\":\"0\",\"key\":\"0\",\"value\":\"0\"}]",
        immutable: true,
        ref: 2
      },

      label: "dayOfWeek",
      defaultData: "1",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/hour": {
      comp: "number-field",
      step: 1,
      min: 0,
      max: 23,
      precision: 0,
      label: "Heure",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/minute": {
      comp: "number-field",
      step: 1,
      min: 0,
      max: 59,
      precision: 0,
      label: "Minute",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1/properties/timeZone": {
      comp: "text-field",
      label: "Fuseau horaire",
      defaultData: "Europe/Paris",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "month"
      }, {
        key: "dayOfMonth"
      }, {
        key: "dayOfWeek"
      }, {
        key: "hour"
      }, {
        key: "minute"
      }, {
        key: "timeZone"
      }],

      title: "Quotidien",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/type": {
      comp: "none",
      constData: "daily",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/month": {
      comp: "none",
      constData: "*",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfMonth": {
      comp: "none",
      constData: "*",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/dayOfWeek": {
      comp: "none",
      constData: "*",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/hour": {
      comp: "number-field",
      step: 1,
      min: 0,
      max: 23,
      precision: 0,
      label: "Heure",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/minute": {
      comp: "number-field",
      step: 1,
      min: 0,
      max: 59,
      precision: 0,
      label: "Minute",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2/properties/timeZone": {
      comp: "text-field",
      label: "Fuseau horaire",
      defaultData: "Europe/Paris",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3": {
      comp: "section",

      children: [{
        key: "type"
      }, {
        key: "month"
      }, {
        key: "dayOfMonth"
      }, {
        key: "dayOfWeek"
      }, {
        key: "hour"
      }, {
        key: "hourStep"
      }, {
        key: "minute"
      }, {
        key: "timeZone"
      }],

      title: "Toutes les N heures",
      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/type": {
      comp: "none",
      constData: "hours",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/month": {
      comp: "none",
      constData: "*",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfMonth": {
      comp: "none",
      constData: "*",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/dayOfWeek": {
      comp: "none",
      constData: "*",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hour": {
      comp: "none",
      constData: "*",

      getConstData: {
        type: "js-eval",
        expr: "layout.constData",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/hourStep": {
      comp: "number-field",
      step: 1,
      min: 1,
      max: 12,
      precision: 0,
      label: "hourStep",
      defaultData: 1,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/minute": {
      comp: "number-field",
      step: 1,
      min: 0,
      max: 59,
      precision: 0,
      label: "Minute",
      defaultData: 0,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3/properties/timeZone": {
      comp: "text-field",
      label: "Fuseau horaire",
      defaultData: "Europe/Paris",

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/enabled": {
      comp: "checkbox",
      label: "Activée",
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
    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/0": export0,
    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/1": export1,
    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/2": export2,
    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items/oneOf/3": export3,
    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#/properties/scheduling/items": export4,
    "https://github.com/data-fair/agents/autonomous-agent-task/write-req#": export5
  },

  validationErrors: {},

  expressions: [
    expression0,
    expression1,
    expression2
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
  
  "text-field": textfieldNode,
  
  "textarea": textareaNode,
  
  "list": listNode,
  
  "one-of-select": oneofselectNode,
  
  "number-field": numberfieldNode,
  
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