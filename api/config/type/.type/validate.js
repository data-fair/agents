/* eslint-disable */
// @ts-nocheck

"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/api/config","x-exports":["types","validate"],"x-ajv":{"coerceTypes":"array"},"type":"object","title":"Api config","additionalProperties":false,"required":["privateDirectoryUrl","mongoUrl","port","tmpDir","observer","secretKeys"],"properties":{"mongoUrl":{"type":"string"},"port":{"type":"number"},"tmpDir":{"type":"string"},"privateDirectoryUrl":{"type":"string","pattern":"^https?://"},"privateEventsUrl":{"type":"string"},"secretKeys":{"type":"object","additionalProperties":false,"required":["admin"],"properties":{"admin":{"type":"string"},"events":{"type":"string"}}},"observer":{"type":"object","properties":{"active":{"type":"boolean"},"port":{"type":"number"}}},"upgradeRoot":{"type":"string"},"util":{},"get":{},"has":{}}};
const func2 = Object.prototype.hasOwnProperty;
const pattern0 = new RegExp("^https?://", "u");

function validate14(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/agents/api/config" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.privateDirectoryUrl === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "privateDirectoryUrl"},message:"must have required property '"+"privateDirectoryUrl"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.mongoUrl === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mongoUrl"},message:"must have required property '"+"mongoUrl"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.port === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "port"},message:"must have required property '"+"port"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.tmpDir === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "tmpDir"},message:"must have required property '"+"tmpDir"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.observer === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observer"},message:"must have required property '"+"observer"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.secretKeys === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "secretKeys"},message:"must have required property '"+"secretKeys"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 in data){
if(!(func2.call(schema16.properties, key0))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.mongoUrl !== undefined){
let data0 = data.mongoUrl;
if(typeof data0 !== "string"){
let dataType0 = typeof data0;
let coerced0 = undefined;
if(dataType0 == 'object' && Array.isArray(data0) && data0.length == 1){
data0 = data0[0];
dataType0 = typeof data0;
if(typeof data0 === "string"){
coerced0 = data0;
}
}
if(!(coerced0 !== undefined)){
if(dataType0 == "number" || dataType0 == "boolean"){
coerced0 = "" + data0;
}
else if(data0 === null){
coerced0 = "";
}
else {
const err7 = {instancePath:instancePath+"/mongoUrl",schemaPath:"#/properties/mongoUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(coerced0 !== undefined){
data0 = coerced0;
if(data !== undefined){
data["mongoUrl"] = coerced0;
}
}
}
}
if(data.port !== undefined){
let data1 = data.port;
if(!(typeof data1 == "number")){
let dataType1 = typeof data1;
let coerced1 = undefined;
if(dataType1 == 'object' && Array.isArray(data1) && data1.length == 1){
data1 = data1[0];
dataType1 = typeof data1;
if(typeof data1 == "number"){
coerced1 = data1;
}
}
if(!(coerced1 !== undefined)){
if(dataType1 == "boolean" || data1 === null
              || (dataType1 == "string" && data1 && data1 == +data1)){
coerced1 = +data1;
}
else {
const err8 = {instancePath:instancePath+"/port",schemaPath:"#/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(coerced1 !== undefined){
data1 = coerced1;
if(data !== undefined){
data["port"] = coerced1;
}
}
}
}
if(data.tmpDir !== undefined){
let data2 = data.tmpDir;
if(typeof data2 !== "string"){
let dataType2 = typeof data2;
let coerced2 = undefined;
if(dataType2 == 'object' && Array.isArray(data2) && data2.length == 1){
data2 = data2[0];
dataType2 = typeof data2;
if(typeof data2 === "string"){
coerced2 = data2;
}
}
if(!(coerced2 !== undefined)){
if(dataType2 == "number" || dataType2 == "boolean"){
coerced2 = "" + data2;
}
else if(data2 === null){
coerced2 = "";
}
else {
const err9 = {instancePath:instancePath+"/tmpDir",schemaPath:"#/properties/tmpDir/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(coerced2 !== undefined){
data2 = coerced2;
if(data !== undefined){
data["tmpDir"] = coerced2;
}
}
}
}
if(data.privateDirectoryUrl !== undefined){
let data3 = data.privateDirectoryUrl;
if(typeof data3 !== "string"){
let dataType3 = typeof data3;
let coerced3 = undefined;
if(dataType3 == 'object' && Array.isArray(data3) && data3.length == 1){
data3 = data3[0];
dataType3 = typeof data3;
if(typeof data3 === "string"){
coerced3 = data3;
}
}
if(!(coerced3 !== undefined)){
if(dataType3 == "number" || dataType3 == "boolean"){
coerced3 = "" + data3;
}
else if(data3 === null){
coerced3 = "";
}
else {
const err10 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(coerced3 !== undefined){
data3 = coerced3;
if(data !== undefined){
data["privateDirectoryUrl"] = coerced3;
}
}
}
if(typeof data3 === "string"){
if(!pattern0.test(data3)){
const err11 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/pattern",keyword:"pattern",params:{pattern: "^https?://"},message:"must match pattern \""+"^https?://"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
if(data.privateEventsUrl !== undefined){
let data4 = data.privateEventsUrl;
if(typeof data4 !== "string"){
let dataType4 = typeof data4;
let coerced4 = undefined;
if(dataType4 == 'object' && Array.isArray(data4) && data4.length == 1){
data4 = data4[0];
dataType4 = typeof data4;
if(typeof data4 === "string"){
coerced4 = data4;
}
}
if(!(coerced4 !== undefined)){
if(dataType4 == "number" || dataType4 == "boolean"){
coerced4 = "" + data4;
}
else if(data4 === null){
coerced4 = "";
}
else {
const err12 = {instancePath:instancePath+"/privateEventsUrl",schemaPath:"#/properties/privateEventsUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(coerced4 !== undefined){
data4 = coerced4;
if(data !== undefined){
data["privateEventsUrl"] = coerced4;
}
}
}
}
if(data.secretKeys !== undefined){
let data5 = data.secretKeys;
if(data5 && typeof data5 == "object" && !Array.isArray(data5)){
if(data5.admin === undefined){
const err13 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/required",keyword:"required",params:{missingProperty: "admin"},message:"must have required property '"+"admin"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
for(const key1 in data5){
if(!((key1 === "admin") || (key1 === "events"))){
const err14 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data5.admin !== undefined){
let data6 = data5.admin;
if(typeof data6 !== "string"){
let dataType5 = typeof data6;
let coerced5 = undefined;
if(dataType5 == 'object' && Array.isArray(data6) && data6.length == 1){
data6 = data6[0];
dataType5 = typeof data6;
if(typeof data6 === "string"){
coerced5 = data6;
}
}
if(!(coerced5 !== undefined)){
if(dataType5 == "number" || dataType5 == "boolean"){
coerced5 = "" + data6;
}
else if(data6 === null){
coerced5 = "";
}
else {
const err15 = {instancePath:instancePath+"/secretKeys/admin",schemaPath:"#/properties/secretKeys/properties/admin/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(coerced5 !== undefined){
data6 = coerced5;
if(data5 !== undefined){
data5["admin"] = coerced5;
}
}
}
}
if(data5.events !== undefined){
let data7 = data5.events;
if(typeof data7 !== "string"){
let dataType6 = typeof data7;
let coerced6 = undefined;
if(dataType6 == 'object' && Array.isArray(data7) && data7.length == 1){
data7 = data7[0];
dataType6 = typeof data7;
if(typeof data7 === "string"){
coerced6 = data7;
}
}
if(!(coerced6 !== undefined)){
if(dataType6 == "number" || dataType6 == "boolean"){
coerced6 = "" + data7;
}
else if(data7 === null){
coerced6 = "";
}
else {
const err16 = {instancePath:instancePath+"/secretKeys/events",schemaPath:"#/properties/secretKeys/properties/events/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(coerced6 !== undefined){
data7 = coerced6;
if(data5 !== undefined){
data5["events"] = coerced6;
}
}
}
}
}
else {
const err17 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.observer !== undefined){
let data8 = data.observer;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.active !== undefined){
let data9 = data8.active;
if(typeof data9 !== "boolean"){
let dataType7 = typeof data9;
let coerced7 = undefined;
if(dataType7 == 'object' && Array.isArray(data9) && data9.length == 1){
data9 = data9[0];
dataType7 = typeof data9;
if(typeof data9 === "boolean"){
coerced7 = data9;
}
}
if(!(coerced7 !== undefined)){
if(data9 === "false" || data9 === 0 || data9 === null){
coerced7 = false;
}
else if(data9 === "true" || data9 === 1){
coerced7 = true;
}
else {
const err18 = {instancePath:instancePath+"/observer/active",schemaPath:"#/properties/observer/properties/active/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(coerced7 !== undefined){
data9 = coerced7;
if(data8 !== undefined){
data8["active"] = coerced7;
}
}
}
}
if(data8.port !== undefined){
let data10 = data8.port;
if(!(typeof data10 == "number")){
let dataType8 = typeof data10;
let coerced8 = undefined;
if(dataType8 == 'object' && Array.isArray(data10) && data10.length == 1){
data10 = data10[0];
dataType8 = typeof data10;
if(typeof data10 == "number"){
coerced8 = data10;
}
}
if(!(coerced8 !== undefined)){
if(dataType8 == "boolean" || data10 === null
              || (dataType8 == "string" && data10 && data10 == +data10)){
coerced8 = +data10;
}
else {
const err19 = {instancePath:instancePath+"/observer/port",schemaPath:"#/properties/observer/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(coerced8 !== undefined){
data10 = coerced8;
if(data8 !== undefined){
data8["port"] = coerced8;
}
}
}
}
}
else {
const err20 = {instancePath:instancePath+"/observer",schemaPath:"#/properties/observer/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.upgradeRoot !== undefined){
let data11 = data.upgradeRoot;
if(typeof data11 !== "string"){
let dataType9 = typeof data11;
let coerced9 = undefined;
if(dataType9 == 'object' && Array.isArray(data11) && data11.length == 1){
data11 = data11[0];
dataType9 = typeof data11;
if(typeof data11 === "string"){
coerced9 = data11;
}
}
if(!(coerced9 !== undefined)){
if(dataType9 == "number" || dataType9 == "boolean"){
coerced9 = "" + data11;
}
else if(data11 === null){
coerced9 = "";
}
else {
const err21 = {instancePath:instancePath+"/upgradeRoot",schemaPath:"#/properties/upgradeRoot/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(coerced9 !== undefined){
data11 = coerced9;
if(data !== undefined){
data["upgradeRoot"] = coerced9;
}
}
}
}
}
else {
const err22 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
