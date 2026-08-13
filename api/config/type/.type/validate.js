/* eslint-disable */
// @ts-nocheck

"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/api/config","x-exports":["types","validate"],"x-ajv":{"coerceTypes":"array"},"type":"object","title":"Api config","additionalProperties":false,"required":["privateDirectoryUrl","mongoUrl","port","tmpDir","observer","secretKeys","cipherPassword","requireAnonymousActionToken","outputTokenWeight","defaultLimits"],"$defs":{"modelRef":{"type":"object","additionalProperties":false,"required":["provider","id"],"properties":{"provider":{"type":"string"},"id":{"type":"string"}}}},"properties":{"mongoUrl":{"type":"string"},"port":{"type":"number"},"tmpDir":{"type":"string"},"privateDirectoryUrl":{"type":"string","pattern":"^https?://"},"privateEventsUrl":{"type":"string"},"secretKeys":{"type":"object","additionalProperties":false,"properties":{"events":{"type":"string"},"limits":{"type":"string"}}},"providers":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["type","id","name"],"properties":{"type":{"type":"string","enum":["openai","anthropic","google","mistral","openrouter","ollama","scaleway","openai-compatible","mock"]},"id":{"type":"string"},"name":{"type":"string"},"enabled":{"type":"boolean","default":true},"apiKey":{"type":"string"},"baseURL":{"type":"string"},"projectId":{"type":"string"},"compatibility":{"type":"string","enum":["default","compatible"]}}}},"models":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["id","name","provider","usage"],"properties":{"id":{"type":"string"},"name":{"type":"string"},"provider":{"type":"string"},"usage":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string","enum":["assistant","tools","summarizer","evaluator","moderator"]}},"multiplier":{"type":"number","minimum":0,"default":1}}}},"defaultModels":{"type":"object","additionalProperties":false,"default":{},"properties":{"assistant":{"$ref":"#/$defs/modelRef"},"tools":{"$ref":"#/$defs/modelRef"},"summarizer":{"$ref":"#/$defs/modelRef"},"evaluator":{"$ref":"#/$defs/modelRef"},"moderator":{"$ref":"#/$defs/modelRef"}}},"outputTokenWeight":{"type":"number","minimum":0,"default":4},"defaultLimits":{"type":"object","additionalProperties":false,"default":{"credits":-1},"properties":{"credits":{"type":"number","default":-1}}},"observer":{"type":"object","properties":{"active":{"type":"boolean"},"port":{"type":"number"}}},"upgradeRoot":{"type":"string"},"cipherPassword":{"type":"string"},"requireAnonymousActionToken":{"type":"boolean","default":true},"evaluatorAccount":{"type":["object","null"],"default":null,"additionalProperties":false,"required":["type","id"],"properties":{"type":{"type":"string","enum":["user","organization"]},"id":{"type":"string"}}},"github":{"type":"object","additionalProperties":false,"properties":{"token":{"type":"string"}}},"util":{},"get":{},"has":{}}};
const schema17 = {"type":"object","additionalProperties":false,"required":["provider","id"],"properties":{"provider":{"type":"string"},"id":{"type":"string"}}};
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
if(data.cipherPassword === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cipherPassword"},message:"must have required property '"+"cipherPassword"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.requireAnonymousActionToken === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "requireAnonymousActionToken"},message:"must have required property '"+"requireAnonymousActionToken"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.outputTokenWeight === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "outputTokenWeight"},message:"must have required property '"+"outputTokenWeight"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.defaultLimits === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "defaultLimits"},message:"must have required property '"+"defaultLimits"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 in data){
if(!(func2.call(schema16.properties, key0))){
const err10 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
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
const err11 = {instancePath:instancePath+"/mongoUrl",schemaPath:"#/properties/mongoUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
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
const err12 = {instancePath:instancePath+"/port",schemaPath:"#/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
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
const err13 = {instancePath:instancePath+"/tmpDir",schemaPath:"#/properties/tmpDir/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
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
const err14 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
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
const err15 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/pattern",keyword:"pattern",params:{pattern: "^https?://"},message:"must match pattern \""+"^https?://"+"\""};
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
const err16 = {instancePath:instancePath+"/privateEventsUrl",schemaPath:"#/properties/privateEventsUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
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
for(const key1 in data5){
if(!((key1 === "events") || (key1 === "limits"))){
const err17 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data5.events !== undefined){
let data6 = data5.events;
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
const err18 = {instancePath:instancePath+"/secretKeys/events",schemaPath:"#/properties/secretKeys/properties/events/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(coerced5 !== undefined){
data6 = coerced5;
if(data5 !== undefined){
data5["events"] = coerced5;
}
}
}
}
if(data5.limits !== undefined){
let data7 = data5.limits;
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
const err19 = {instancePath:instancePath+"/secretKeys/limits",schemaPath:"#/properties/secretKeys/properties/limits/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(coerced6 !== undefined){
data7 = coerced6;
if(data5 !== undefined){
data5["limits"] = coerced6;
}
}
}
}
}
else {
const err20 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.providers !== undefined){
let data8 = data.providers;
if(!(Array.isArray(data8))){
let dataType7 = typeof data8;
let coerced7 = undefined;
if(dataType7 == 'object' && Array.isArray(data8) && data8.length == 1){
data8 = data8[0];
dataType7 = typeof data8;
if(Array.isArray(data8)){
coerced7 = data8;
}
}
if(!(coerced7 !== undefined)){
if(dataType7 === "string" || dataType7 === "number"
              || dataType7 === "boolean" || data8 === null){
coerced7 = [data8];
}
else {
const err21 = {instancePath:instancePath+"/providers",schemaPath:"#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(coerced7 !== undefined){
data8 = coerced7;
if(data !== undefined){
data["providers"] = coerced7;
}
}
}
if(Array.isArray(data8)){
const len0 = data8.length;
for(let i0=0; i0<len0; i0++){
let data9 = data8[i0];
if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
if(data9.type === undefined){
const err22 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data9.id === undefined){
const err23 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data9.name === undefined){
const err24 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
for(const key2 in data9){
if(!((((((((key2 === "type") || (key2 === "id")) || (key2 === "name")) || (key2 === "enabled")) || (key2 === "apiKey")) || (key2 === "baseURL")) || (key2 === "projectId")) || (key2 === "compatibility"))){
const err25 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data9.type !== undefined){
let data10 = data9.type;
if(typeof data10 !== "string"){
let dataType8 = typeof data10;
let coerced8 = undefined;
if(dataType8 == 'object' && Array.isArray(data10) && data10.length == 1){
data10 = data10[0];
dataType8 = typeof data10;
if(typeof data10 === "string"){
coerced8 = data10;
}
}
if(!(coerced8 !== undefined)){
if(dataType8 == "number" || dataType8 == "boolean"){
coerced8 = "" + data10;
}
else if(data10 === null){
coerced8 = "";
}
else {
const err26 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(coerced8 !== undefined){
data10 = coerced8;
if(data9 !== undefined){
data9["type"] = coerced8;
}
}
}
if(!(((((((((data10 === "openai") || (data10 === "anthropic")) || (data10 === "google")) || (data10 === "mistral")) || (data10 === "openrouter")) || (data10 === "ollama")) || (data10 === "scaleway")) || (data10 === "openai-compatible")) || (data10 === "mock"))){
const err27 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/properties/type/enum",keyword:"enum",params:{allowedValues: schema16.properties.providers.items.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data9.id !== undefined){
let data11 = data9.id;
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
const err28 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(coerced9 !== undefined){
data11 = coerced9;
if(data9 !== undefined){
data9["id"] = coerced9;
}
}
}
}
if(data9.name !== undefined){
let data12 = data9.name;
if(typeof data12 !== "string"){
let dataType10 = typeof data12;
let coerced10 = undefined;
if(dataType10 == 'object' && Array.isArray(data12) && data12.length == 1){
data12 = data12[0];
dataType10 = typeof data12;
if(typeof data12 === "string"){
coerced10 = data12;
}
}
if(!(coerced10 !== undefined)){
if(dataType10 == "number" || dataType10 == "boolean"){
coerced10 = "" + data12;
}
else if(data12 === null){
coerced10 = "";
}
else {
const err29 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(coerced10 !== undefined){
data12 = coerced10;
if(data9 !== undefined){
data9["name"] = coerced10;
}
}
}
}
if(data9.enabled !== undefined){
let data13 = data9.enabled;
if(typeof data13 !== "boolean"){
let dataType11 = typeof data13;
let coerced11 = undefined;
if(dataType11 == 'object' && Array.isArray(data13) && data13.length == 1){
data13 = data13[0];
dataType11 = typeof data13;
if(typeof data13 === "boolean"){
coerced11 = data13;
}
}
if(!(coerced11 !== undefined)){
if(data13 === "false" || data13 === 0 || data13 === null){
coerced11 = false;
}
else if(data13 === "true" || data13 === 1){
coerced11 = true;
}
else {
const err30 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(coerced11 !== undefined){
data13 = coerced11;
if(data9 !== undefined){
data9["enabled"] = coerced11;
}
}
}
}
if(data9.apiKey !== undefined){
let data14 = data9.apiKey;
if(typeof data14 !== "string"){
let dataType12 = typeof data14;
let coerced12 = undefined;
if(dataType12 == 'object' && Array.isArray(data14) && data14.length == 1){
data14 = data14[0];
dataType12 = typeof data14;
if(typeof data14 === "string"){
coerced12 = data14;
}
}
if(!(coerced12 !== undefined)){
if(dataType12 == "number" || dataType12 == "boolean"){
coerced12 = "" + data14;
}
else if(data14 === null){
coerced12 = "";
}
else {
const err31 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(coerced12 !== undefined){
data14 = coerced12;
if(data9 !== undefined){
data9["apiKey"] = coerced12;
}
}
}
}
if(data9.baseURL !== undefined){
let data15 = data9.baseURL;
if(typeof data15 !== "string"){
let dataType13 = typeof data15;
let coerced13 = undefined;
if(dataType13 == 'object' && Array.isArray(data15) && data15.length == 1){
data15 = data15[0];
dataType13 = typeof data15;
if(typeof data15 === "string"){
coerced13 = data15;
}
}
if(!(coerced13 !== undefined)){
if(dataType13 == "number" || dataType13 == "boolean"){
coerced13 = "" + data15;
}
else if(data15 === null){
coerced13 = "";
}
else {
const err32 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(coerced13 !== undefined){
data15 = coerced13;
if(data9 !== undefined){
data9["baseURL"] = coerced13;
}
}
}
}
if(data9.projectId !== undefined){
let data16 = data9.projectId;
if(typeof data16 !== "string"){
let dataType14 = typeof data16;
let coerced14 = undefined;
if(dataType14 == 'object' && Array.isArray(data16) && data16.length == 1){
data16 = data16[0];
dataType14 = typeof data16;
if(typeof data16 === "string"){
coerced14 = data16;
}
}
if(!(coerced14 !== undefined)){
if(dataType14 == "number" || dataType14 == "boolean"){
coerced14 = "" + data16;
}
else if(data16 === null){
coerced14 = "";
}
else {
const err33 = {instancePath:instancePath+"/providers/" + i0+"/projectId",schemaPath:"#/properties/providers/items/properties/projectId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(coerced14 !== undefined){
data16 = coerced14;
if(data9 !== undefined){
data9["projectId"] = coerced14;
}
}
}
}
if(data9.compatibility !== undefined){
let data17 = data9.compatibility;
if(typeof data17 !== "string"){
let dataType15 = typeof data17;
let coerced15 = undefined;
if(dataType15 == 'object' && Array.isArray(data17) && data17.length == 1){
data17 = data17[0];
dataType15 = typeof data17;
if(typeof data17 === "string"){
coerced15 = data17;
}
}
if(!(coerced15 !== undefined)){
if(dataType15 == "number" || dataType15 == "boolean"){
coerced15 = "" + data17;
}
else if(data17 === null){
coerced15 = "";
}
else {
const err34 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/properties/compatibility/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(coerced15 !== undefined){
data17 = coerced15;
if(data9 !== undefined){
data9["compatibility"] = coerced15;
}
}
}
if(!((data17 === "default") || (data17 === "compatible"))){
const err35 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/properties/compatibility/enum",keyword:"enum",params:{allowedValues: schema16.properties.providers.items.properties.compatibility.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
}
else {
const err36 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
}
if(data.models !== undefined){
let data18 = data.models;
if(!(Array.isArray(data18))){
let dataType16 = typeof data18;
let coerced16 = undefined;
if(dataType16 == 'object' && Array.isArray(data18) && data18.length == 1){
data18 = data18[0];
dataType16 = typeof data18;
if(Array.isArray(data18)){
coerced16 = data18;
}
}
if(!(coerced16 !== undefined)){
if(dataType16 === "string" || dataType16 === "number"
              || dataType16 === "boolean" || data18 === null){
coerced16 = [data18];
}
else {
const err37 = {instancePath:instancePath+"/models",schemaPath:"#/properties/models/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(coerced16 !== undefined){
data18 = coerced16;
if(data !== undefined){
data["models"] = coerced16;
}
}
}
if(Array.isArray(data18)){
const len1 = data18.length;
for(let i1=0; i1<len1; i1++){
let data19 = data18[i1];
if(data19 && typeof data19 == "object" && !Array.isArray(data19)){
if(data19.id === undefined){
const err38 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data19.name === undefined){
const err39 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data19.provider === undefined){
const err40 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data19.usage === undefined){
const err41 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "usage"},message:"must have required property '"+"usage"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
for(const key3 in data19){
if(!(((((key3 === "id") || (key3 === "name")) || (key3 === "provider")) || (key3 === "usage")) || (key3 === "multiplier"))){
const err42 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data19.id !== undefined){
let data20 = data19.id;
if(typeof data20 !== "string"){
let dataType17 = typeof data20;
let coerced17 = undefined;
if(dataType17 == 'object' && Array.isArray(data20) && data20.length == 1){
data20 = data20[0];
dataType17 = typeof data20;
if(typeof data20 === "string"){
coerced17 = data20;
}
}
if(!(coerced17 !== undefined)){
if(dataType17 == "number" || dataType17 == "boolean"){
coerced17 = "" + data20;
}
else if(data20 === null){
coerced17 = "";
}
else {
const err43 = {instancePath:instancePath+"/models/" + i1+"/id",schemaPath:"#/properties/models/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(coerced17 !== undefined){
data20 = coerced17;
if(data19 !== undefined){
data19["id"] = coerced17;
}
}
}
}
if(data19.name !== undefined){
let data21 = data19.name;
if(typeof data21 !== "string"){
let dataType18 = typeof data21;
let coerced18 = undefined;
if(dataType18 == 'object' && Array.isArray(data21) && data21.length == 1){
data21 = data21[0];
dataType18 = typeof data21;
if(typeof data21 === "string"){
coerced18 = data21;
}
}
if(!(coerced18 !== undefined)){
if(dataType18 == "number" || dataType18 == "boolean"){
coerced18 = "" + data21;
}
else if(data21 === null){
coerced18 = "";
}
else {
const err44 = {instancePath:instancePath+"/models/" + i1+"/name",schemaPath:"#/properties/models/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(coerced18 !== undefined){
data21 = coerced18;
if(data19 !== undefined){
data19["name"] = coerced18;
}
}
}
}
if(data19.provider !== undefined){
let data22 = data19.provider;
if(typeof data22 !== "string"){
let dataType19 = typeof data22;
let coerced19 = undefined;
if(dataType19 == 'object' && Array.isArray(data22) && data22.length == 1){
data22 = data22[0];
dataType19 = typeof data22;
if(typeof data22 === "string"){
coerced19 = data22;
}
}
if(!(coerced19 !== undefined)){
if(dataType19 == "number" || dataType19 == "boolean"){
coerced19 = "" + data22;
}
else if(data22 === null){
coerced19 = "";
}
else {
const err45 = {instancePath:instancePath+"/models/" + i1+"/provider",schemaPath:"#/properties/models/items/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(coerced19 !== undefined){
data22 = coerced19;
if(data19 !== undefined){
data19["provider"] = coerced19;
}
}
}
}
if(data19.usage !== undefined){
let data23 = data19.usage;
if(!(Array.isArray(data23))){
let dataType20 = typeof data23;
let coerced20 = undefined;
if(dataType20 == 'object' && Array.isArray(data23) && data23.length == 1){
data23 = data23[0];
dataType20 = typeof data23;
if(Array.isArray(data23)){
coerced20 = data23;
}
}
if(!(coerced20 !== undefined)){
if(dataType20 === "string" || dataType20 === "number"
              || dataType20 === "boolean" || data23 === null){
coerced20 = [data23];
}
else {
const err46 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(coerced20 !== undefined){
data23 = coerced20;
if(data19 !== undefined){
data19["usage"] = coerced20;
}
}
}
if(Array.isArray(data23)){
if(data23.length < 1){
const err47 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
const len2 = data23.length;
for(let i2=0; i2<len2; i2++){
let data24 = data23[i2];
if(typeof data24 !== "string"){
let dataType21 = typeof data24;
let coerced21 = undefined;
if(dataType21 == 'object' && Array.isArray(data24) && data24.length == 1){
data24 = data24[0];
dataType21 = typeof data24;
if(typeof data24 === "string"){
coerced21 = data24;
}
}
if(!(coerced21 !== undefined)){
if(dataType21 == "number" || dataType21 == "boolean"){
coerced21 = "" + data24;
}
else if(data24 === null){
coerced21 = "";
}
else {
const err48 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(coerced21 !== undefined){
data24 = coerced21;
if(data23 !== undefined){
data23[i2] = coerced21;
}
}
}
if(!(((((data24 === "assistant") || (data24 === "tools")) || (data24 === "summarizer")) || (data24 === "evaluator")) || (data24 === "moderator"))){
const err49 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/enum",keyword:"enum",params:{allowedValues: schema16.properties.models.items.properties.usage.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
let i3 = data23.length;
let j0;
if(i3 > 1){
const indices0 = {};
for(;i3--;){
let item0 = data23[i3];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err50 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
break;
}
indices0[item0] = i3;
}
}
}
}
if(data19.multiplier !== undefined){
let data25 = data19.multiplier;
if(!(typeof data25 == "number")){
let dataType22 = typeof data25;
let coerced22 = undefined;
if(dataType22 == 'object' && Array.isArray(data25) && data25.length == 1){
data25 = data25[0];
dataType22 = typeof data25;
if(typeof data25 == "number"){
coerced22 = data25;
}
}
if(!(coerced22 !== undefined)){
if(dataType22 == "boolean" || data25 === null
              || (dataType22 == "string" && data25 && data25 == +data25)){
coerced22 = +data25;
}
else {
const err51 = {instancePath:instancePath+"/models/" + i1+"/multiplier",schemaPath:"#/properties/models/items/properties/multiplier/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(coerced22 !== undefined){
data25 = coerced22;
if(data19 !== undefined){
data19["multiplier"] = coerced22;
}
}
}
if(typeof data25 == "number"){
if(data25 < 0 || isNaN(data25)){
const err52 = {instancePath:instancePath+"/models/" + i1+"/multiplier",schemaPath:"#/properties/models/items/properties/multiplier/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
}
}
else {
const err53 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
}
}
if(data.defaultModels !== undefined){
let data26 = data.defaultModels;
if(data26 && typeof data26 == "object" && !Array.isArray(data26)){
for(const key4 in data26){
if(!(((((key4 === "assistant") || (key4 === "tools")) || (key4 === "summarizer")) || (key4 === "evaluator")) || (key4 === "moderator"))){
const err54 = {instancePath:instancePath+"/defaultModels",schemaPath:"#/properties/defaultModels/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data26.assistant !== undefined){
let data27 = data26.assistant;
if(data27 && typeof data27 == "object" && !Array.isArray(data27)){
if(data27.provider === undefined){
const err55 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(data27.id === undefined){
const err56 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
for(const key5 in data27){
if(!((key5 === "provider") || (key5 === "id"))){
const err57 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
if(data27.provider !== undefined){
let data28 = data27.provider;
if(typeof data28 !== "string"){
let dataType23 = typeof data28;
let coerced23 = undefined;
if(dataType23 == 'object' && Array.isArray(data28) && data28.length == 1){
data28 = data28[0];
dataType23 = typeof data28;
if(typeof data28 === "string"){
coerced23 = data28;
}
}
if(!(coerced23 !== undefined)){
if(dataType23 == "number" || dataType23 == "boolean"){
coerced23 = "" + data28;
}
else if(data28 === null){
coerced23 = "";
}
else {
const err58 = {instancePath:instancePath+"/defaultModels/assistant/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(coerced23 !== undefined){
data28 = coerced23;
if(data27 !== undefined){
data27["provider"] = coerced23;
}
}
}
}
if(data27.id !== undefined){
let data29 = data27.id;
if(typeof data29 !== "string"){
let dataType24 = typeof data29;
let coerced24 = undefined;
if(dataType24 == 'object' && Array.isArray(data29) && data29.length == 1){
data29 = data29[0];
dataType24 = typeof data29;
if(typeof data29 === "string"){
coerced24 = data29;
}
}
if(!(coerced24 !== undefined)){
if(dataType24 == "number" || dataType24 == "boolean"){
coerced24 = "" + data29;
}
else if(data29 === null){
coerced24 = "";
}
else {
const err59 = {instancePath:instancePath+"/defaultModels/assistant/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(coerced24 !== undefined){
data29 = coerced24;
if(data27 !== undefined){
data27["id"] = coerced24;
}
}
}
}
}
else {
const err60 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
if(data26.tools !== undefined){
let data30 = data26.tools;
if(data30 && typeof data30 == "object" && !Array.isArray(data30)){
if(data30.provider === undefined){
const err61 = {instancePath:instancePath+"/defaultModels/tools",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(data30.id === undefined){
const err62 = {instancePath:instancePath+"/defaultModels/tools",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
for(const key6 in data30){
if(!((key6 === "provider") || (key6 === "id"))){
const err63 = {instancePath:instancePath+"/defaultModels/tools",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data30.provider !== undefined){
let data31 = data30.provider;
if(typeof data31 !== "string"){
let dataType25 = typeof data31;
let coerced25 = undefined;
if(dataType25 == 'object' && Array.isArray(data31) && data31.length == 1){
data31 = data31[0];
dataType25 = typeof data31;
if(typeof data31 === "string"){
coerced25 = data31;
}
}
if(!(coerced25 !== undefined)){
if(dataType25 == "number" || dataType25 == "boolean"){
coerced25 = "" + data31;
}
else if(data31 === null){
coerced25 = "";
}
else {
const err64 = {instancePath:instancePath+"/defaultModels/tools/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(coerced25 !== undefined){
data31 = coerced25;
if(data30 !== undefined){
data30["provider"] = coerced25;
}
}
}
}
if(data30.id !== undefined){
let data32 = data30.id;
if(typeof data32 !== "string"){
let dataType26 = typeof data32;
let coerced26 = undefined;
if(dataType26 == 'object' && Array.isArray(data32) && data32.length == 1){
data32 = data32[0];
dataType26 = typeof data32;
if(typeof data32 === "string"){
coerced26 = data32;
}
}
if(!(coerced26 !== undefined)){
if(dataType26 == "number" || dataType26 == "boolean"){
coerced26 = "" + data32;
}
else if(data32 === null){
coerced26 = "";
}
else {
const err65 = {instancePath:instancePath+"/defaultModels/tools/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
if(coerced26 !== undefined){
data32 = coerced26;
if(data30 !== undefined){
data30["id"] = coerced26;
}
}
}
}
}
else {
const err66 = {instancePath:instancePath+"/defaultModels/tools",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data26.summarizer !== undefined){
let data33 = data26.summarizer;
if(data33 && typeof data33 == "object" && !Array.isArray(data33)){
if(data33.provider === undefined){
const err67 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(data33.id === undefined){
const err68 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
for(const key7 in data33){
if(!((key7 === "provider") || (key7 === "id"))){
const err69 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(data33.provider !== undefined){
let data34 = data33.provider;
if(typeof data34 !== "string"){
let dataType27 = typeof data34;
let coerced27 = undefined;
if(dataType27 == 'object' && Array.isArray(data34) && data34.length == 1){
data34 = data34[0];
dataType27 = typeof data34;
if(typeof data34 === "string"){
coerced27 = data34;
}
}
if(!(coerced27 !== undefined)){
if(dataType27 == "number" || dataType27 == "boolean"){
coerced27 = "" + data34;
}
else if(data34 === null){
coerced27 = "";
}
else {
const err70 = {instancePath:instancePath+"/defaultModels/summarizer/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(coerced27 !== undefined){
data34 = coerced27;
if(data33 !== undefined){
data33["provider"] = coerced27;
}
}
}
}
if(data33.id !== undefined){
let data35 = data33.id;
if(typeof data35 !== "string"){
let dataType28 = typeof data35;
let coerced28 = undefined;
if(dataType28 == 'object' && Array.isArray(data35) && data35.length == 1){
data35 = data35[0];
dataType28 = typeof data35;
if(typeof data35 === "string"){
coerced28 = data35;
}
}
if(!(coerced28 !== undefined)){
if(dataType28 == "number" || dataType28 == "boolean"){
coerced28 = "" + data35;
}
else if(data35 === null){
coerced28 = "";
}
else {
const err71 = {instancePath:instancePath+"/defaultModels/summarizer/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(coerced28 !== undefined){
data35 = coerced28;
if(data33 !== undefined){
data33["id"] = coerced28;
}
}
}
}
}
else {
const err72 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(data26.evaluator !== undefined){
let data36 = data26.evaluator;
if(data36 && typeof data36 == "object" && !Array.isArray(data36)){
if(data36.provider === undefined){
const err73 = {instancePath:instancePath+"/defaultModels/evaluator",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if(data36.id === undefined){
const err74 = {instancePath:instancePath+"/defaultModels/evaluator",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
for(const key8 in data36){
if(!((key8 === "provider") || (key8 === "id"))){
const err75 = {instancePath:instancePath+"/defaultModels/evaluator",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
if(data36.provider !== undefined){
let data37 = data36.provider;
if(typeof data37 !== "string"){
let dataType29 = typeof data37;
let coerced29 = undefined;
if(dataType29 == 'object' && Array.isArray(data37) && data37.length == 1){
data37 = data37[0];
dataType29 = typeof data37;
if(typeof data37 === "string"){
coerced29 = data37;
}
}
if(!(coerced29 !== undefined)){
if(dataType29 == "number" || dataType29 == "boolean"){
coerced29 = "" + data37;
}
else if(data37 === null){
coerced29 = "";
}
else {
const err76 = {instancePath:instancePath+"/defaultModels/evaluator/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(coerced29 !== undefined){
data37 = coerced29;
if(data36 !== undefined){
data36["provider"] = coerced29;
}
}
}
}
if(data36.id !== undefined){
let data38 = data36.id;
if(typeof data38 !== "string"){
let dataType30 = typeof data38;
let coerced30 = undefined;
if(dataType30 == 'object' && Array.isArray(data38) && data38.length == 1){
data38 = data38[0];
dataType30 = typeof data38;
if(typeof data38 === "string"){
coerced30 = data38;
}
}
if(!(coerced30 !== undefined)){
if(dataType30 == "number" || dataType30 == "boolean"){
coerced30 = "" + data38;
}
else if(data38 === null){
coerced30 = "";
}
else {
const err77 = {instancePath:instancePath+"/defaultModels/evaluator/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(coerced30 !== undefined){
data38 = coerced30;
if(data36 !== undefined){
data36["id"] = coerced30;
}
}
}
}
}
else {
const err78 = {instancePath:instancePath+"/defaultModels/evaluator",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data26.moderator !== undefined){
let data39 = data26.moderator;
if(data39 && typeof data39 == "object" && !Array.isArray(data39)){
if(data39.provider === undefined){
const err79 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(data39.id === undefined){
const err80 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
for(const key9 in data39){
if(!((key9 === "provider") || (key9 === "id"))){
const err81 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
if(data39.provider !== undefined){
let data40 = data39.provider;
if(typeof data40 !== "string"){
let dataType31 = typeof data40;
let coerced31 = undefined;
if(dataType31 == 'object' && Array.isArray(data40) && data40.length == 1){
data40 = data40[0];
dataType31 = typeof data40;
if(typeof data40 === "string"){
coerced31 = data40;
}
}
if(!(coerced31 !== undefined)){
if(dataType31 == "number" || dataType31 == "boolean"){
coerced31 = "" + data40;
}
else if(data40 === null){
coerced31 = "";
}
else {
const err82 = {instancePath:instancePath+"/defaultModels/moderator/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
if(coerced31 !== undefined){
data40 = coerced31;
if(data39 !== undefined){
data39["provider"] = coerced31;
}
}
}
}
if(data39.id !== undefined){
let data41 = data39.id;
if(typeof data41 !== "string"){
let dataType32 = typeof data41;
let coerced32 = undefined;
if(dataType32 == 'object' && Array.isArray(data41) && data41.length == 1){
data41 = data41[0];
dataType32 = typeof data41;
if(typeof data41 === "string"){
coerced32 = data41;
}
}
if(!(coerced32 !== undefined)){
if(dataType32 == "number" || dataType32 == "boolean"){
coerced32 = "" + data41;
}
else if(data41 === null){
coerced32 = "";
}
else {
const err83 = {instancePath:instancePath+"/defaultModels/moderator/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
}
if(coerced32 !== undefined){
data41 = coerced32;
if(data39 !== undefined){
data39["id"] = coerced32;
}
}
}
}
}
else {
const err84 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err85 = {instancePath:instancePath+"/defaultModels",schemaPath:"#/properties/defaultModels/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(data.outputTokenWeight !== undefined){
let data42 = data.outputTokenWeight;
if(!(typeof data42 == "number")){
let dataType33 = typeof data42;
let coerced33 = undefined;
if(dataType33 == 'object' && Array.isArray(data42) && data42.length == 1){
data42 = data42[0];
dataType33 = typeof data42;
if(typeof data42 == "number"){
coerced33 = data42;
}
}
if(!(coerced33 !== undefined)){
if(dataType33 == "boolean" || data42 === null
              || (dataType33 == "string" && data42 && data42 == +data42)){
coerced33 = +data42;
}
else {
const err86 = {instancePath:instancePath+"/outputTokenWeight",schemaPath:"#/properties/outputTokenWeight/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(coerced33 !== undefined){
data42 = coerced33;
if(data !== undefined){
data["outputTokenWeight"] = coerced33;
}
}
}
if(typeof data42 == "number"){
if(data42 < 0 || isNaN(data42)){
const err87 = {instancePath:instancePath+"/outputTokenWeight",schemaPath:"#/properties/outputTokenWeight/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.defaultLimits !== undefined){
let data43 = data.defaultLimits;
if(data43 && typeof data43 == "object" && !Array.isArray(data43)){
for(const key10 in data43){
if(!(key10 === "credits")){
const err88 = {instancePath:instancePath+"/defaultLimits",schemaPath:"#/properties/defaultLimits/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key10},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
if(data43.credits !== undefined){
let data44 = data43.credits;
if(!(typeof data44 == "number")){
let dataType34 = typeof data44;
let coerced34 = undefined;
if(dataType34 == 'object' && Array.isArray(data44) && data44.length == 1){
data44 = data44[0];
dataType34 = typeof data44;
if(typeof data44 == "number"){
coerced34 = data44;
}
}
if(!(coerced34 !== undefined)){
if(dataType34 == "boolean" || data44 === null
              || (dataType34 == "string" && data44 && data44 == +data44)){
coerced34 = +data44;
}
else {
const err89 = {instancePath:instancePath+"/defaultLimits/credits",schemaPath:"#/properties/defaultLimits/properties/credits/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
if(coerced34 !== undefined){
data44 = coerced34;
if(data43 !== undefined){
data43["credits"] = coerced34;
}
}
}
}
}
else {
const err90 = {instancePath:instancePath+"/defaultLimits",schemaPath:"#/properties/defaultLimits/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
if(data.observer !== undefined){
let data45 = data.observer;
if(data45 && typeof data45 == "object" && !Array.isArray(data45)){
if(data45.active !== undefined){
let data46 = data45.active;
if(typeof data46 !== "boolean"){
let dataType35 = typeof data46;
let coerced35 = undefined;
if(dataType35 == 'object' && Array.isArray(data46) && data46.length == 1){
data46 = data46[0];
dataType35 = typeof data46;
if(typeof data46 === "boolean"){
coerced35 = data46;
}
}
if(!(coerced35 !== undefined)){
if(data46 === "false" || data46 === 0 || data46 === null){
coerced35 = false;
}
else if(data46 === "true" || data46 === 1){
coerced35 = true;
}
else {
const err91 = {instancePath:instancePath+"/observer/active",schemaPath:"#/properties/observer/properties/active/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
if(coerced35 !== undefined){
data46 = coerced35;
if(data45 !== undefined){
data45["active"] = coerced35;
}
}
}
}
if(data45.port !== undefined){
let data47 = data45.port;
if(!(typeof data47 == "number")){
let dataType36 = typeof data47;
let coerced36 = undefined;
if(dataType36 == 'object' && Array.isArray(data47) && data47.length == 1){
data47 = data47[0];
dataType36 = typeof data47;
if(typeof data47 == "number"){
coerced36 = data47;
}
}
if(!(coerced36 !== undefined)){
if(dataType36 == "boolean" || data47 === null
              || (dataType36 == "string" && data47 && data47 == +data47)){
coerced36 = +data47;
}
else {
const err92 = {instancePath:instancePath+"/observer/port",schemaPath:"#/properties/observer/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
if(coerced36 !== undefined){
data47 = coerced36;
if(data45 !== undefined){
data45["port"] = coerced36;
}
}
}
}
}
else {
const err93 = {instancePath:instancePath+"/observer",schemaPath:"#/properties/observer/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
}
if(data.upgradeRoot !== undefined){
let data48 = data.upgradeRoot;
if(typeof data48 !== "string"){
let dataType37 = typeof data48;
let coerced37 = undefined;
if(dataType37 == 'object' && Array.isArray(data48) && data48.length == 1){
data48 = data48[0];
dataType37 = typeof data48;
if(typeof data48 === "string"){
coerced37 = data48;
}
}
if(!(coerced37 !== undefined)){
if(dataType37 == "number" || dataType37 == "boolean"){
coerced37 = "" + data48;
}
else if(data48 === null){
coerced37 = "";
}
else {
const err94 = {instancePath:instancePath+"/upgradeRoot",schemaPath:"#/properties/upgradeRoot/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
if(coerced37 !== undefined){
data48 = coerced37;
if(data !== undefined){
data["upgradeRoot"] = coerced37;
}
}
}
}
if(data.cipherPassword !== undefined){
let data49 = data.cipherPassword;
if(typeof data49 !== "string"){
let dataType38 = typeof data49;
let coerced38 = undefined;
if(dataType38 == 'object' && Array.isArray(data49) && data49.length == 1){
data49 = data49[0];
dataType38 = typeof data49;
if(typeof data49 === "string"){
coerced38 = data49;
}
}
if(!(coerced38 !== undefined)){
if(dataType38 == "number" || dataType38 == "boolean"){
coerced38 = "" + data49;
}
else if(data49 === null){
coerced38 = "";
}
else {
const err95 = {instancePath:instancePath+"/cipherPassword",schemaPath:"#/properties/cipherPassword/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
if(coerced38 !== undefined){
data49 = coerced38;
if(data !== undefined){
data["cipherPassword"] = coerced38;
}
}
}
}
if(data.requireAnonymousActionToken !== undefined){
let data50 = data.requireAnonymousActionToken;
if(typeof data50 !== "boolean"){
let dataType39 = typeof data50;
let coerced39 = undefined;
if(dataType39 == 'object' && Array.isArray(data50) && data50.length == 1){
data50 = data50[0];
dataType39 = typeof data50;
if(typeof data50 === "boolean"){
coerced39 = data50;
}
}
if(!(coerced39 !== undefined)){
if(data50 === "false" || data50 === 0 || data50 === null){
coerced39 = false;
}
else if(data50 === "true" || data50 === 1){
coerced39 = true;
}
else {
const err96 = {instancePath:instancePath+"/requireAnonymousActionToken",schemaPath:"#/properties/requireAnonymousActionToken/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
}
if(coerced39 !== undefined){
data50 = coerced39;
if(data !== undefined){
data["requireAnonymousActionToken"] = coerced39;
}
}
}
}
if(data.evaluatorAccount !== undefined){
let data51 = data.evaluatorAccount;
if((!(data51 && typeof data51 == "object" && !Array.isArray(data51))) && (data51 !== null)){
let dataType40 = typeof data51;
let coerced40 = undefined;
if(dataType40 == 'object' && Array.isArray(data51) && data51.length == 1){
data51 = data51[0];
dataType40 = typeof data51;
if((data51 && typeof data51 == "object" && !Array.isArray(data51)) && (data51 === null)){
coerced40 = data51;
}
}
if(!(coerced40 !== undefined)){
if(data51 === "" || data51 === 0 || data51 === false){
coerced40 = null;
}
else {
const err97 = {instancePath:instancePath+"/evaluatorAccount",schemaPath:"#/properties/evaluatorAccount/type",keyword:"type",params:{type: schema16.properties.evaluatorAccount.type},message:"must be object,null"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
if(coerced40 !== undefined){
data51 = coerced40;
if(data !== undefined){
data["evaluatorAccount"] = coerced40;
}
}
}
if(data51 && typeof data51 == "object" && !Array.isArray(data51)){
if(data51.type === undefined){
const err98 = {instancePath:instancePath+"/evaluatorAccount",schemaPath:"#/properties/evaluatorAccount/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
if(data51.id === undefined){
const err99 = {instancePath:instancePath+"/evaluatorAccount",schemaPath:"#/properties/evaluatorAccount/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
for(const key11 in data51){
if(!((key11 === "type") || (key11 === "id"))){
const err100 = {instancePath:instancePath+"/evaluatorAccount",schemaPath:"#/properties/evaluatorAccount/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key11},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
if(data51.type !== undefined){
let data52 = data51.type;
if(typeof data52 !== "string"){
let dataType41 = typeof data52;
let coerced41 = undefined;
if(dataType41 == 'object' && Array.isArray(data52) && data52.length == 1){
data52 = data52[0];
dataType41 = typeof data52;
if(typeof data52 === "string"){
coerced41 = data52;
}
}
if(!(coerced41 !== undefined)){
if(dataType41 == "number" || dataType41 == "boolean"){
coerced41 = "" + data52;
}
else if(data52 === null){
coerced41 = "";
}
else {
const err101 = {instancePath:instancePath+"/evaluatorAccount/type",schemaPath:"#/properties/evaluatorAccount/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
}
if(coerced41 !== undefined){
data52 = coerced41;
if(data51 !== undefined){
data51["type"] = coerced41;
}
}
}
if(!((data52 === "user") || (data52 === "organization"))){
const err102 = {instancePath:instancePath+"/evaluatorAccount/type",schemaPath:"#/properties/evaluatorAccount/properties/type/enum",keyword:"enum",params:{allowedValues: schema16.properties.evaluatorAccount.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
}
if(data51.id !== undefined){
let data53 = data51.id;
if(typeof data53 !== "string"){
let dataType42 = typeof data53;
let coerced42 = undefined;
if(dataType42 == 'object' && Array.isArray(data53) && data53.length == 1){
data53 = data53[0];
dataType42 = typeof data53;
if(typeof data53 === "string"){
coerced42 = data53;
}
}
if(!(coerced42 !== undefined)){
if(dataType42 == "number" || dataType42 == "boolean"){
coerced42 = "" + data53;
}
else if(data53 === null){
coerced42 = "";
}
else {
const err103 = {instancePath:instancePath+"/evaluatorAccount/id",schemaPath:"#/properties/evaluatorAccount/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
if(coerced42 !== undefined){
data53 = coerced42;
if(data51 !== undefined){
data51["id"] = coerced42;
}
}
}
}
}
}
if(data.github !== undefined){
let data54 = data.github;
if(data54 && typeof data54 == "object" && !Array.isArray(data54)){
for(const key12 in data54){
if(!(key12 === "token")){
const err104 = {instancePath:instancePath+"/github",schemaPath:"#/properties/github/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key12},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
}
if(data54.token !== undefined){
let data55 = data54.token;
if(typeof data55 !== "string"){
let dataType43 = typeof data55;
let coerced43 = undefined;
if(dataType43 == 'object' && Array.isArray(data55) && data55.length == 1){
data55 = data55[0];
dataType43 = typeof data55;
if(typeof data55 === "string"){
coerced43 = data55;
}
}
if(!(coerced43 !== undefined)){
if(dataType43 == "number" || dataType43 == "boolean"){
coerced43 = "" + data55;
}
else if(data55 === null){
coerced43 = "";
}
else {
const err105 = {instancePath:instancePath+"/github/token",schemaPath:"#/properties/github/properties/token/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
}
if(coerced43 !== undefined){
data55 = coerced43;
if(data54 !== undefined){
data54["token"] = coerced43;
}
}
}
}
}
else {
const err106 = {instancePath:instancePath+"/github",schemaPath:"#/properties/github/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
}
}
else {
const err107 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
