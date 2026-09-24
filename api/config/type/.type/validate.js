/* eslint-disable */
// @ts-nocheck

"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/api/config","x-exports":["types","validate"],"x-ajv":{"coerceTypes":"array"},"type":"object","title":"Api config","additionalProperties":false,"required":["privateDirectoryUrl","mongoUrl","port","tmpDir","observer","secretKeys","cipherPassword","requireAnonymousActionToken","eurosPerCredit","defaultLimits","compactionPercent"],"$defs":{"modelRef":{"type":"object","additionalProperties":false,"required":["provider","id"],"properties":{"provider":{"type":"string"},"id":{"type":"string"}}}},"properties":{"mongoUrl":{"type":"string"},"port":{"type":"number"},"tmpDir":{"type":"string"},"privateDirectoryUrl":{"type":"string","pattern":"^https?://"},"privateEventsUrl":{"type":"string"},"secretKeys":{"type":"object","additionalProperties":false,"properties":{"events":{"type":"string"},"limits":{"type":"string"}}},"providers":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["type","id","name"],"properties":{"type":{"type":"string","enum":["openai","anthropic","google","mistral","openrouter","ollama","scaleway","openai-compatible","mock"]},"id":{"type":"string"},"name":{"type":"string"},"enabled":{"type":"boolean","default":true},"apiKey":{"type":"string"},"baseURL":{"type":"string"},"projectId":{"type":"string"},"compatibility":{"type":"string","enum":["default","compatible"]}}}},"models":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["id","name","provider","usage","inputPricePerMillion","outputPricePerMillion"],"properties":{"id":{"type":"string"},"name":{"type":"string"},"provider":{"type":"string"},"usage":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string","enum":["assistant","tools","summarizer","evaluator","moderator"]}},"contextWindow":{"type":"number","minimum":0},"inputPricePerMillion":{"type":"number","minimum":0},"outputPricePerMillion":{"type":"number","minimum":0},"cachedInputPricePerMillion":{"type":"number","minimum":0}}}},"mcpServers":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["id","name","url","auth"],"properties":{"id":{"type":"string"},"name":{"type":"string"},"description":{"type":"string"},"url":{"type":"string"},"auth":{"type":"string","enum":["nhi-session","none","apiKey"]},"apiKeyHeader":{"type":"string"},"apiKey":{"type":"string"}}}},"autonomousAgentsRequireAdminMode":{"type":"boolean","default":true},"nhiSigningKey":{"type":"object","required":["kty","crv","x","y","d","kid"],"properties":{"kty":{"type":"string"},"crv":{"type":"string"},"x":{"type":"string"},"y":{"type":"string"},"d":{"type":"string"},"kid":{"type":"string"},"alg":{"type":"string"}}},"defaultModels":{"type":"object","additionalProperties":false,"default":{},"properties":{"assistant":{"$ref":"#/$defs/modelRef"},"tools":{"$ref":"#/$defs/modelRef"},"summarizer":{"$ref":"#/$defs/modelRef"},"evaluator":{"$ref":"#/$defs/modelRef"},"moderator":{"$ref":"#/$defs/modelRef"}}},"eurosPerCredit":{"type":"number","exclusiveMinimum":0,"default":0.008},"defaultLimits":{"type":"object","additionalProperties":false,"default":{"credits":0},"properties":{"credits":{"type":"number","default":0}}},"observer":{"type":"object","properties":{"active":{"type":"boolean"},"port":{"type":"number"}}},"upgradeRoot":{"type":"string"},"cipherPassword":{"type":"string"},"requireAnonymousActionToken":{"type":"boolean","default":true},"evaluatorAccount":{"type":["object","null"],"default":null,"additionalProperties":false,"required":["type","id"],"properties":{"type":{"type":"string","enum":["user","organization"]},"id":{"type":"string"}}},"github":{"type":"object","additionalProperties":false,"properties":{"token":{"type":"string"}}},"util":{},"get":{},"has":{},"compactionPercent":{"type":"number","title":"Compaction percent","description":"Share of the assistant model's context window above which conversation history is compacted.","default":70,"minimum":10,"maximum":100}}};
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
if(data.eurosPerCredit === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "eurosPerCredit"},message:"must have required property '"+"eurosPerCredit"+"'"};
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
if(data.compactionPercent === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "compactionPercent"},message:"must have required property '"+"compactionPercent"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 in data){
if(!(func2.call(schema16.properties, key0))){
const err11 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
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
const err12 = {instancePath:instancePath+"/mongoUrl",schemaPath:"#/properties/mongoUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
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
const err13 = {instancePath:instancePath+"/port",schemaPath:"#/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
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
const err14 = {instancePath:instancePath+"/tmpDir",schemaPath:"#/properties/tmpDir/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
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
const err15 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
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
const err16 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/pattern",keyword:"pattern",params:{pattern: "^https?://"},message:"must match pattern \""+"^https?://"+"\""};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
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
const err17 = {instancePath:instancePath+"/privateEventsUrl",schemaPath:"#/properties/privateEventsUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
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
const err18 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
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
const err19 = {instancePath:instancePath+"/secretKeys/events",schemaPath:"#/properties/secretKeys/properties/events/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
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
const err20 = {instancePath:instancePath+"/secretKeys/limits",schemaPath:"#/properties/secretKeys/properties/limits/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
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
const err21 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
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
const err22 = {instancePath:instancePath+"/providers",schemaPath:"#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
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
const err23 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data9.id === undefined){
const err24 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data9.name === undefined){
const err25 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
for(const key2 in data9){
if(!((((((((key2 === "type") || (key2 === "id")) || (key2 === "name")) || (key2 === "enabled")) || (key2 === "apiKey")) || (key2 === "baseURL")) || (key2 === "projectId")) || (key2 === "compatibility"))){
const err26 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
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
const err27 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
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
const err28 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/properties/type/enum",keyword:"enum",params:{allowedValues: schema16.properties.providers.items.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
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
const err29 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
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
const err30 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
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
const err31 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
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
const err32 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
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
const err33 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
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
const err34 = {instancePath:instancePath+"/providers/" + i0+"/projectId",schemaPath:"#/properties/providers/items/properties/projectId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
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
const err35 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/properties/compatibility/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
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
const err36 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/properties/compatibility/enum",keyword:"enum",params:{allowedValues: schema16.properties.providers.items.properties.compatibility.enum},message:"must be equal to one of the allowed values"};
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
else {
const err37 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
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
const err38 = {instancePath:instancePath+"/models",schemaPath:"#/properties/models/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
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
const err39 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data19.name === undefined){
const err40 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data19.provider === undefined){
const err41 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data19.usage === undefined){
const err42 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "usage"},message:"must have required property '"+"usage"+"'"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(data19.inputPricePerMillion === undefined){
const err43 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "inputPricePerMillion"},message:"must have required property '"+"inputPricePerMillion"+"'"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(data19.outputPricePerMillion === undefined){
const err44 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "outputPricePerMillion"},message:"must have required property '"+"outputPricePerMillion"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
for(const key3 in data19){
if(!((((((((key3 === "id") || (key3 === "name")) || (key3 === "provider")) || (key3 === "usage")) || (key3 === "contextWindow")) || (key3 === "inputPricePerMillion")) || (key3 === "outputPricePerMillion")) || (key3 === "cachedInputPricePerMillion"))){
const err45 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
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
const err46 = {instancePath:instancePath+"/models/" + i1+"/id",schemaPath:"#/properties/models/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
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
const err47 = {instancePath:instancePath+"/models/" + i1+"/name",schemaPath:"#/properties/models/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
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
const err48 = {instancePath:instancePath+"/models/" + i1+"/provider",schemaPath:"#/properties/models/items/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
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
const err49 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
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
const err50 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
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
const err51 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
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
const err52 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/enum",keyword:"enum",params:{allowedValues: schema16.properties.models.items.properties.usage.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
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
const err53 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
break;
}
indices0[item0] = i3;
}
}
}
}
if(data19.contextWindow !== undefined){
let data25 = data19.contextWindow;
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
const err54 = {instancePath:instancePath+"/models/" + i1+"/contextWindow",schemaPath:"#/properties/models/items/properties/contextWindow/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(coerced22 !== undefined){
data25 = coerced22;
if(data19 !== undefined){
data19["contextWindow"] = coerced22;
}
}
}
if(typeof data25 == "number"){
if(data25 < 0 || isNaN(data25)){
const err55 = {instancePath:instancePath+"/models/" + i1+"/contextWindow",schemaPath:"#/properties/models/items/properties/contextWindow/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data19.inputPricePerMillion !== undefined){
let data26 = data19.inputPricePerMillion;
if(!(typeof data26 == "number")){
let dataType23 = typeof data26;
let coerced23 = undefined;
if(dataType23 == 'object' && Array.isArray(data26) && data26.length == 1){
data26 = data26[0];
dataType23 = typeof data26;
if(typeof data26 == "number"){
coerced23 = data26;
}
}
if(!(coerced23 !== undefined)){
if(dataType23 == "boolean" || data26 === null
              || (dataType23 == "string" && data26 && data26 == +data26)){
coerced23 = +data26;
}
else {
const err56 = {instancePath:instancePath+"/models/" + i1+"/inputPricePerMillion",schemaPath:"#/properties/models/items/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(coerced23 !== undefined){
data26 = coerced23;
if(data19 !== undefined){
data19["inputPricePerMillion"] = coerced23;
}
}
}
if(typeof data26 == "number"){
if(data26 < 0 || isNaN(data26)){
const err57 = {instancePath:instancePath+"/models/" + i1+"/inputPricePerMillion",schemaPath:"#/properties/models/items/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data19.outputPricePerMillion !== undefined){
let data27 = data19.outputPricePerMillion;
if(!(typeof data27 == "number")){
let dataType24 = typeof data27;
let coerced24 = undefined;
if(dataType24 == 'object' && Array.isArray(data27) && data27.length == 1){
data27 = data27[0];
dataType24 = typeof data27;
if(typeof data27 == "number"){
coerced24 = data27;
}
}
if(!(coerced24 !== undefined)){
if(dataType24 == "boolean" || data27 === null
              || (dataType24 == "string" && data27 && data27 == +data27)){
coerced24 = +data27;
}
else {
const err58 = {instancePath:instancePath+"/models/" + i1+"/outputPricePerMillion",schemaPath:"#/properties/models/items/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(coerced24 !== undefined){
data27 = coerced24;
if(data19 !== undefined){
data19["outputPricePerMillion"] = coerced24;
}
}
}
if(typeof data27 == "number"){
if(data27 < 0 || isNaN(data27)){
const err59 = {instancePath:instancePath+"/models/" + i1+"/outputPricePerMillion",schemaPath:"#/properties/models/items/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
}
if(data19.cachedInputPricePerMillion !== undefined){
let data28 = data19.cachedInputPricePerMillion;
if(!(typeof data28 == "number")){
let dataType25 = typeof data28;
let coerced25 = undefined;
if(dataType25 == 'object' && Array.isArray(data28) && data28.length == 1){
data28 = data28[0];
dataType25 = typeof data28;
if(typeof data28 == "number"){
coerced25 = data28;
}
}
if(!(coerced25 !== undefined)){
if(dataType25 == "boolean" || data28 === null
              || (dataType25 == "string" && data28 && data28 == +data28)){
coerced25 = +data28;
}
else {
const err60 = {instancePath:instancePath+"/models/" + i1+"/cachedInputPricePerMillion",schemaPath:"#/properties/models/items/properties/cachedInputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
if(coerced25 !== undefined){
data28 = coerced25;
if(data19 !== undefined){
data19["cachedInputPricePerMillion"] = coerced25;
}
}
}
if(typeof data28 == "number"){
if(data28 < 0 || isNaN(data28)){
const err61 = {instancePath:instancePath+"/models/" + i1+"/cachedInputPricePerMillion",schemaPath:"#/properties/models/items/properties/cachedInputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
}
}
else {
const err62 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
}
if(data.mcpServers !== undefined){
let data29 = data.mcpServers;
if(!(Array.isArray(data29))){
let dataType26 = typeof data29;
let coerced26 = undefined;
if(dataType26 == 'object' && Array.isArray(data29) && data29.length == 1){
data29 = data29[0];
dataType26 = typeof data29;
if(Array.isArray(data29)){
coerced26 = data29;
}
}
if(!(coerced26 !== undefined)){
if(dataType26 === "string" || dataType26 === "number"
              || dataType26 === "boolean" || data29 === null){
coerced26 = [data29];
}
else {
const err63 = {instancePath:instancePath+"/mcpServers",schemaPath:"#/properties/mcpServers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(coerced26 !== undefined){
data29 = coerced26;
if(data !== undefined){
data["mcpServers"] = coerced26;
}
}
}
if(Array.isArray(data29)){
const len3 = data29.length;
for(let i4=0; i4<len3; i4++){
let data30 = data29[i4];
if(data30 && typeof data30 == "object" && !Array.isArray(data30)){
if(data30.id === undefined){
const err64 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(data30.name === undefined){
const err65 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(data30.url === undefined){
const err66 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "url"},message:"must have required property '"+"url"+"'"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(data30.auth === undefined){
const err67 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "auth"},message:"must have required property '"+"auth"+"'"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
for(const key4 in data30){
if(!(((((((key4 === "id") || (key4 === "name")) || (key4 === "description")) || (key4 === "url")) || (key4 === "auth")) || (key4 === "apiKeyHeader")) || (key4 === "apiKey"))){
const err68 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
if(data30.id !== undefined){
let data31 = data30.id;
if(typeof data31 !== "string"){
let dataType27 = typeof data31;
let coerced27 = undefined;
if(dataType27 == 'object' && Array.isArray(data31) && data31.length == 1){
data31 = data31[0];
dataType27 = typeof data31;
if(typeof data31 === "string"){
coerced27 = data31;
}
}
if(!(coerced27 !== undefined)){
if(dataType27 == "number" || dataType27 == "boolean"){
coerced27 = "" + data31;
}
else if(data31 === null){
coerced27 = "";
}
else {
const err69 = {instancePath:instancePath+"/mcpServers/" + i4+"/id",schemaPath:"#/properties/mcpServers/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(coerced27 !== undefined){
data31 = coerced27;
if(data30 !== undefined){
data30["id"] = coerced27;
}
}
}
}
if(data30.name !== undefined){
let data32 = data30.name;
if(typeof data32 !== "string"){
let dataType28 = typeof data32;
let coerced28 = undefined;
if(dataType28 == 'object' && Array.isArray(data32) && data32.length == 1){
data32 = data32[0];
dataType28 = typeof data32;
if(typeof data32 === "string"){
coerced28 = data32;
}
}
if(!(coerced28 !== undefined)){
if(dataType28 == "number" || dataType28 == "boolean"){
coerced28 = "" + data32;
}
else if(data32 === null){
coerced28 = "";
}
else {
const err70 = {instancePath:instancePath+"/mcpServers/" + i4+"/name",schemaPath:"#/properties/mcpServers/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(coerced28 !== undefined){
data32 = coerced28;
if(data30 !== undefined){
data30["name"] = coerced28;
}
}
}
}
if(data30.description !== undefined){
let data33 = data30.description;
if(typeof data33 !== "string"){
let dataType29 = typeof data33;
let coerced29 = undefined;
if(dataType29 == 'object' && Array.isArray(data33) && data33.length == 1){
data33 = data33[0];
dataType29 = typeof data33;
if(typeof data33 === "string"){
coerced29 = data33;
}
}
if(!(coerced29 !== undefined)){
if(dataType29 == "number" || dataType29 == "boolean"){
coerced29 = "" + data33;
}
else if(data33 === null){
coerced29 = "";
}
else {
const err71 = {instancePath:instancePath+"/mcpServers/" + i4+"/description",schemaPath:"#/properties/mcpServers/items/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(coerced29 !== undefined){
data33 = coerced29;
if(data30 !== undefined){
data30["description"] = coerced29;
}
}
}
}
if(data30.url !== undefined){
let data34 = data30.url;
if(typeof data34 !== "string"){
let dataType30 = typeof data34;
let coerced30 = undefined;
if(dataType30 == 'object' && Array.isArray(data34) && data34.length == 1){
data34 = data34[0];
dataType30 = typeof data34;
if(typeof data34 === "string"){
coerced30 = data34;
}
}
if(!(coerced30 !== undefined)){
if(dataType30 == "number" || dataType30 == "boolean"){
coerced30 = "" + data34;
}
else if(data34 === null){
coerced30 = "";
}
else {
const err72 = {instancePath:instancePath+"/mcpServers/" + i4+"/url",schemaPath:"#/properties/mcpServers/items/properties/url/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(coerced30 !== undefined){
data34 = coerced30;
if(data30 !== undefined){
data30["url"] = coerced30;
}
}
}
}
if(data30.auth !== undefined){
let data35 = data30.auth;
if(typeof data35 !== "string"){
let dataType31 = typeof data35;
let coerced31 = undefined;
if(dataType31 == 'object' && Array.isArray(data35) && data35.length == 1){
data35 = data35[0];
dataType31 = typeof data35;
if(typeof data35 === "string"){
coerced31 = data35;
}
}
if(!(coerced31 !== undefined)){
if(dataType31 == "number" || dataType31 == "boolean"){
coerced31 = "" + data35;
}
else if(data35 === null){
coerced31 = "";
}
else {
const err73 = {instancePath:instancePath+"/mcpServers/" + i4+"/auth",schemaPath:"#/properties/mcpServers/items/properties/auth/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(coerced31 !== undefined){
data35 = coerced31;
if(data30 !== undefined){
data30["auth"] = coerced31;
}
}
}
if(!(((data35 === "nhi-session") || (data35 === "none")) || (data35 === "apiKey"))){
const err74 = {instancePath:instancePath+"/mcpServers/" + i4+"/auth",schemaPath:"#/properties/mcpServers/items/properties/auth/enum",keyword:"enum",params:{allowedValues: schema16.properties.mcpServers.items.properties.auth.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(data30.apiKeyHeader !== undefined){
let data36 = data30.apiKeyHeader;
if(typeof data36 !== "string"){
let dataType32 = typeof data36;
let coerced32 = undefined;
if(dataType32 == 'object' && Array.isArray(data36) && data36.length == 1){
data36 = data36[0];
dataType32 = typeof data36;
if(typeof data36 === "string"){
coerced32 = data36;
}
}
if(!(coerced32 !== undefined)){
if(dataType32 == "number" || dataType32 == "boolean"){
coerced32 = "" + data36;
}
else if(data36 === null){
coerced32 = "";
}
else {
const err75 = {instancePath:instancePath+"/mcpServers/" + i4+"/apiKeyHeader",schemaPath:"#/properties/mcpServers/items/properties/apiKeyHeader/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
if(coerced32 !== undefined){
data36 = coerced32;
if(data30 !== undefined){
data30["apiKeyHeader"] = coerced32;
}
}
}
}
if(data30.apiKey !== undefined){
let data37 = data30.apiKey;
if(typeof data37 !== "string"){
let dataType33 = typeof data37;
let coerced33 = undefined;
if(dataType33 == 'object' && Array.isArray(data37) && data37.length == 1){
data37 = data37[0];
dataType33 = typeof data37;
if(typeof data37 === "string"){
coerced33 = data37;
}
}
if(!(coerced33 !== undefined)){
if(dataType33 == "number" || dataType33 == "boolean"){
coerced33 = "" + data37;
}
else if(data37 === null){
coerced33 = "";
}
else {
const err76 = {instancePath:instancePath+"/mcpServers/" + i4+"/apiKey",schemaPath:"#/properties/mcpServers/items/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(coerced33 !== undefined){
data37 = coerced33;
if(data30 !== undefined){
data30["apiKey"] = coerced33;
}
}
}
}
}
else {
const err77 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
}
}
if(data.autonomousAgentsRequireAdminMode !== undefined){
let data38 = data.autonomousAgentsRequireAdminMode;
if(typeof data38 !== "boolean"){
let dataType34 = typeof data38;
let coerced34 = undefined;
if(dataType34 == 'object' && Array.isArray(data38) && data38.length == 1){
data38 = data38[0];
dataType34 = typeof data38;
if(typeof data38 === "boolean"){
coerced34 = data38;
}
}
if(!(coerced34 !== undefined)){
if(data38 === "false" || data38 === 0 || data38 === null){
coerced34 = false;
}
else if(data38 === "true" || data38 === 1){
coerced34 = true;
}
else {
const err78 = {instancePath:instancePath+"/autonomousAgentsRequireAdminMode",schemaPath:"#/properties/autonomousAgentsRequireAdminMode/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(coerced34 !== undefined){
data38 = coerced34;
if(data !== undefined){
data["autonomousAgentsRequireAdminMode"] = coerced34;
}
}
}
}
if(data.nhiSigningKey !== undefined){
let data39 = data.nhiSigningKey;
if(data39 && typeof data39 == "object" && !Array.isArray(data39)){
if(data39.kty === undefined){
const err79 = {instancePath:instancePath+"/nhiSigningKey",schemaPath:"#/properties/nhiSigningKey/required",keyword:"required",params:{missingProperty: "kty"},message:"must have required property '"+"kty"+"'"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(data39.crv === undefined){
const err80 = {instancePath:instancePath+"/nhiSigningKey",schemaPath:"#/properties/nhiSigningKey/required",keyword:"required",params:{missingProperty: "crv"},message:"must have required property '"+"crv"+"'"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(data39.x === undefined){
const err81 = {instancePath:instancePath+"/nhiSigningKey",schemaPath:"#/properties/nhiSigningKey/required",keyword:"required",params:{missingProperty: "x"},message:"must have required property '"+"x"+"'"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(data39.y === undefined){
const err82 = {instancePath:instancePath+"/nhiSigningKey",schemaPath:"#/properties/nhiSigningKey/required",keyword:"required",params:{missingProperty: "y"},message:"must have required property '"+"y"+"'"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if(data39.d === undefined){
const err83 = {instancePath:instancePath+"/nhiSigningKey",schemaPath:"#/properties/nhiSigningKey/required",keyword:"required",params:{missingProperty: "d"},message:"must have required property '"+"d"+"'"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(data39.kid === undefined){
const err84 = {instancePath:instancePath+"/nhiSigningKey",schemaPath:"#/properties/nhiSigningKey/required",keyword:"required",params:{missingProperty: "kid"},message:"must have required property '"+"kid"+"'"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(data39.kty !== undefined){
let data40 = data39.kty;
if(typeof data40 !== "string"){
let dataType35 = typeof data40;
let coerced35 = undefined;
if(dataType35 == 'object' && Array.isArray(data40) && data40.length == 1){
data40 = data40[0];
dataType35 = typeof data40;
if(typeof data40 === "string"){
coerced35 = data40;
}
}
if(!(coerced35 !== undefined)){
if(dataType35 == "number" || dataType35 == "boolean"){
coerced35 = "" + data40;
}
else if(data40 === null){
coerced35 = "";
}
else {
const err85 = {instancePath:instancePath+"/nhiSigningKey/kty",schemaPath:"#/properties/nhiSigningKey/properties/kty/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(coerced35 !== undefined){
data40 = coerced35;
if(data39 !== undefined){
data39["kty"] = coerced35;
}
}
}
}
if(data39.crv !== undefined){
let data41 = data39.crv;
if(typeof data41 !== "string"){
let dataType36 = typeof data41;
let coerced36 = undefined;
if(dataType36 == 'object' && Array.isArray(data41) && data41.length == 1){
data41 = data41[0];
dataType36 = typeof data41;
if(typeof data41 === "string"){
coerced36 = data41;
}
}
if(!(coerced36 !== undefined)){
if(dataType36 == "number" || dataType36 == "boolean"){
coerced36 = "" + data41;
}
else if(data41 === null){
coerced36 = "";
}
else {
const err86 = {instancePath:instancePath+"/nhiSigningKey/crv",schemaPath:"#/properties/nhiSigningKey/properties/crv/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(coerced36 !== undefined){
data41 = coerced36;
if(data39 !== undefined){
data39["crv"] = coerced36;
}
}
}
}
if(data39.x !== undefined){
let data42 = data39.x;
if(typeof data42 !== "string"){
let dataType37 = typeof data42;
let coerced37 = undefined;
if(dataType37 == 'object' && Array.isArray(data42) && data42.length == 1){
data42 = data42[0];
dataType37 = typeof data42;
if(typeof data42 === "string"){
coerced37 = data42;
}
}
if(!(coerced37 !== undefined)){
if(dataType37 == "number" || dataType37 == "boolean"){
coerced37 = "" + data42;
}
else if(data42 === null){
coerced37 = "";
}
else {
const err87 = {instancePath:instancePath+"/nhiSigningKey/x",schemaPath:"#/properties/nhiSigningKey/properties/x/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
if(coerced37 !== undefined){
data42 = coerced37;
if(data39 !== undefined){
data39["x"] = coerced37;
}
}
}
}
if(data39.y !== undefined){
let data43 = data39.y;
if(typeof data43 !== "string"){
let dataType38 = typeof data43;
let coerced38 = undefined;
if(dataType38 == 'object' && Array.isArray(data43) && data43.length == 1){
data43 = data43[0];
dataType38 = typeof data43;
if(typeof data43 === "string"){
coerced38 = data43;
}
}
if(!(coerced38 !== undefined)){
if(dataType38 == "number" || dataType38 == "boolean"){
coerced38 = "" + data43;
}
else if(data43 === null){
coerced38 = "";
}
else {
const err88 = {instancePath:instancePath+"/nhiSigningKey/y",schemaPath:"#/properties/nhiSigningKey/properties/y/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
if(coerced38 !== undefined){
data43 = coerced38;
if(data39 !== undefined){
data39["y"] = coerced38;
}
}
}
}
if(data39.d !== undefined){
let data44 = data39.d;
if(typeof data44 !== "string"){
let dataType39 = typeof data44;
let coerced39 = undefined;
if(dataType39 == 'object' && Array.isArray(data44) && data44.length == 1){
data44 = data44[0];
dataType39 = typeof data44;
if(typeof data44 === "string"){
coerced39 = data44;
}
}
if(!(coerced39 !== undefined)){
if(dataType39 == "number" || dataType39 == "boolean"){
coerced39 = "" + data44;
}
else if(data44 === null){
coerced39 = "";
}
else {
const err89 = {instancePath:instancePath+"/nhiSigningKey/d",schemaPath:"#/properties/nhiSigningKey/properties/d/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
if(coerced39 !== undefined){
data44 = coerced39;
if(data39 !== undefined){
data39["d"] = coerced39;
}
}
}
}
if(data39.kid !== undefined){
let data45 = data39.kid;
if(typeof data45 !== "string"){
let dataType40 = typeof data45;
let coerced40 = undefined;
if(dataType40 == 'object' && Array.isArray(data45) && data45.length == 1){
data45 = data45[0];
dataType40 = typeof data45;
if(typeof data45 === "string"){
coerced40 = data45;
}
}
if(!(coerced40 !== undefined)){
if(dataType40 == "number" || dataType40 == "boolean"){
coerced40 = "" + data45;
}
else if(data45 === null){
coerced40 = "";
}
else {
const err90 = {instancePath:instancePath+"/nhiSigningKey/kid",schemaPath:"#/properties/nhiSigningKey/properties/kid/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
if(coerced40 !== undefined){
data45 = coerced40;
if(data39 !== undefined){
data39["kid"] = coerced40;
}
}
}
}
if(data39.alg !== undefined){
let data46 = data39.alg;
if(typeof data46 !== "string"){
let dataType41 = typeof data46;
let coerced41 = undefined;
if(dataType41 == 'object' && Array.isArray(data46) && data46.length == 1){
data46 = data46[0];
dataType41 = typeof data46;
if(typeof data46 === "string"){
coerced41 = data46;
}
}
if(!(coerced41 !== undefined)){
if(dataType41 == "number" || dataType41 == "boolean"){
coerced41 = "" + data46;
}
else if(data46 === null){
coerced41 = "";
}
else {
const err91 = {instancePath:instancePath+"/nhiSigningKey/alg",schemaPath:"#/properties/nhiSigningKey/properties/alg/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
if(coerced41 !== undefined){
data46 = coerced41;
if(data39 !== undefined){
data39["alg"] = coerced41;
}
}
}
}
}
else {
const err92 = {instancePath:instancePath+"/nhiSigningKey",schemaPath:"#/properties/nhiSigningKey/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
if(data.defaultModels !== undefined){
let data47 = data.defaultModels;
if(data47 && typeof data47 == "object" && !Array.isArray(data47)){
for(const key5 in data47){
if(!(((((key5 === "assistant") || (key5 === "tools")) || (key5 === "summarizer")) || (key5 === "evaluator")) || (key5 === "moderator"))){
const err93 = {instancePath:instancePath+"/defaultModels",schemaPath:"#/properties/defaultModels/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
}
if(data47.assistant !== undefined){
let data48 = data47.assistant;
if(data48 && typeof data48 == "object" && !Array.isArray(data48)){
if(data48.provider === undefined){
const err94 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
if(data48.id === undefined){
const err95 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
for(const key6 in data48){
if(!((key6 === "provider") || (key6 === "id"))){
const err96 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
}
if(data48.provider !== undefined){
let data49 = data48.provider;
if(typeof data49 !== "string"){
let dataType42 = typeof data49;
let coerced42 = undefined;
if(dataType42 == 'object' && Array.isArray(data49) && data49.length == 1){
data49 = data49[0];
dataType42 = typeof data49;
if(typeof data49 === "string"){
coerced42 = data49;
}
}
if(!(coerced42 !== undefined)){
if(dataType42 == "number" || dataType42 == "boolean"){
coerced42 = "" + data49;
}
else if(data49 === null){
coerced42 = "";
}
else {
const err97 = {instancePath:instancePath+"/defaultModels/assistant/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
if(coerced42 !== undefined){
data49 = coerced42;
if(data48 !== undefined){
data48["provider"] = coerced42;
}
}
}
}
if(data48.id !== undefined){
let data50 = data48.id;
if(typeof data50 !== "string"){
let dataType43 = typeof data50;
let coerced43 = undefined;
if(dataType43 == 'object' && Array.isArray(data50) && data50.length == 1){
data50 = data50[0];
dataType43 = typeof data50;
if(typeof data50 === "string"){
coerced43 = data50;
}
}
if(!(coerced43 !== undefined)){
if(dataType43 == "number" || dataType43 == "boolean"){
coerced43 = "" + data50;
}
else if(data50 === null){
coerced43 = "";
}
else {
const err98 = {instancePath:instancePath+"/defaultModels/assistant/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
if(coerced43 !== undefined){
data50 = coerced43;
if(data48 !== undefined){
data48["id"] = coerced43;
}
}
}
}
}
else {
const err99 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
}
if(data47.tools !== undefined){
let data51 = data47.tools;
if(data51 && typeof data51 == "object" && !Array.isArray(data51)){
if(data51.provider === undefined){
const err100 = {instancePath:instancePath+"/defaultModels/tools",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
if(data51.id === undefined){
const err101 = {instancePath:instancePath+"/defaultModels/tools",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
for(const key7 in data51){
if(!((key7 === "provider") || (key7 === "id"))){
const err102 = {instancePath:instancePath+"/defaultModels/tools",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
}
if(data51.provider !== undefined){
let data52 = data51.provider;
if(typeof data52 !== "string"){
let dataType44 = typeof data52;
let coerced44 = undefined;
if(dataType44 == 'object' && Array.isArray(data52) && data52.length == 1){
data52 = data52[0];
dataType44 = typeof data52;
if(typeof data52 === "string"){
coerced44 = data52;
}
}
if(!(coerced44 !== undefined)){
if(dataType44 == "number" || dataType44 == "boolean"){
coerced44 = "" + data52;
}
else if(data52 === null){
coerced44 = "";
}
else {
const err103 = {instancePath:instancePath+"/defaultModels/tools/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
if(coerced44 !== undefined){
data52 = coerced44;
if(data51 !== undefined){
data51["provider"] = coerced44;
}
}
}
}
if(data51.id !== undefined){
let data53 = data51.id;
if(typeof data53 !== "string"){
let dataType45 = typeof data53;
let coerced45 = undefined;
if(dataType45 == 'object' && Array.isArray(data53) && data53.length == 1){
data53 = data53[0];
dataType45 = typeof data53;
if(typeof data53 === "string"){
coerced45 = data53;
}
}
if(!(coerced45 !== undefined)){
if(dataType45 == "number" || dataType45 == "boolean"){
coerced45 = "" + data53;
}
else if(data53 === null){
coerced45 = "";
}
else {
const err104 = {instancePath:instancePath+"/defaultModels/tools/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
}
if(coerced45 !== undefined){
data53 = coerced45;
if(data51 !== undefined){
data51["id"] = coerced45;
}
}
}
}
}
else {
const err105 = {instancePath:instancePath+"/defaultModels/tools",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
}
if(data47.summarizer !== undefined){
let data54 = data47.summarizer;
if(data54 && typeof data54 == "object" && !Array.isArray(data54)){
if(data54.provider === undefined){
const err106 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
if(data54.id === undefined){
const err107 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
for(const key8 in data54){
if(!((key8 === "provider") || (key8 === "id"))){
const err108 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
}
if(data54.provider !== undefined){
let data55 = data54.provider;
if(typeof data55 !== "string"){
let dataType46 = typeof data55;
let coerced46 = undefined;
if(dataType46 == 'object' && Array.isArray(data55) && data55.length == 1){
data55 = data55[0];
dataType46 = typeof data55;
if(typeof data55 === "string"){
coerced46 = data55;
}
}
if(!(coerced46 !== undefined)){
if(dataType46 == "number" || dataType46 == "boolean"){
coerced46 = "" + data55;
}
else if(data55 === null){
coerced46 = "";
}
else {
const err109 = {instancePath:instancePath+"/defaultModels/summarizer/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
}
if(coerced46 !== undefined){
data55 = coerced46;
if(data54 !== undefined){
data54["provider"] = coerced46;
}
}
}
}
if(data54.id !== undefined){
let data56 = data54.id;
if(typeof data56 !== "string"){
let dataType47 = typeof data56;
let coerced47 = undefined;
if(dataType47 == 'object' && Array.isArray(data56) && data56.length == 1){
data56 = data56[0];
dataType47 = typeof data56;
if(typeof data56 === "string"){
coerced47 = data56;
}
}
if(!(coerced47 !== undefined)){
if(dataType47 == "number" || dataType47 == "boolean"){
coerced47 = "" + data56;
}
else if(data56 === null){
coerced47 = "";
}
else {
const err110 = {instancePath:instancePath+"/defaultModels/summarizer/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
}
if(coerced47 !== undefined){
data56 = coerced47;
if(data54 !== undefined){
data54["id"] = coerced47;
}
}
}
}
}
else {
const err111 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
}
if(data47.evaluator !== undefined){
let data57 = data47.evaluator;
if(data57 && typeof data57 == "object" && !Array.isArray(data57)){
if(data57.provider === undefined){
const err112 = {instancePath:instancePath+"/defaultModels/evaluator",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
if(data57.id === undefined){
const err113 = {instancePath:instancePath+"/defaultModels/evaluator",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
for(const key9 in data57){
if(!((key9 === "provider") || (key9 === "id"))){
const err114 = {instancePath:instancePath+"/defaultModels/evaluator",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
}
if(data57.provider !== undefined){
let data58 = data57.provider;
if(typeof data58 !== "string"){
let dataType48 = typeof data58;
let coerced48 = undefined;
if(dataType48 == 'object' && Array.isArray(data58) && data58.length == 1){
data58 = data58[0];
dataType48 = typeof data58;
if(typeof data58 === "string"){
coerced48 = data58;
}
}
if(!(coerced48 !== undefined)){
if(dataType48 == "number" || dataType48 == "boolean"){
coerced48 = "" + data58;
}
else if(data58 === null){
coerced48 = "";
}
else {
const err115 = {instancePath:instancePath+"/defaultModels/evaluator/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
}
if(coerced48 !== undefined){
data58 = coerced48;
if(data57 !== undefined){
data57["provider"] = coerced48;
}
}
}
}
if(data57.id !== undefined){
let data59 = data57.id;
if(typeof data59 !== "string"){
let dataType49 = typeof data59;
let coerced49 = undefined;
if(dataType49 == 'object' && Array.isArray(data59) && data59.length == 1){
data59 = data59[0];
dataType49 = typeof data59;
if(typeof data59 === "string"){
coerced49 = data59;
}
}
if(!(coerced49 !== undefined)){
if(dataType49 == "number" || dataType49 == "boolean"){
coerced49 = "" + data59;
}
else if(data59 === null){
coerced49 = "";
}
else {
const err116 = {instancePath:instancePath+"/defaultModels/evaluator/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
}
if(coerced49 !== undefined){
data59 = coerced49;
if(data57 !== undefined){
data57["id"] = coerced49;
}
}
}
}
}
else {
const err117 = {instancePath:instancePath+"/defaultModels/evaluator",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
if(data47.moderator !== undefined){
let data60 = data47.moderator;
if(data60 && typeof data60 == "object" && !Array.isArray(data60)){
if(data60.provider === undefined){
const err118 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if(data60.id === undefined){
const err119 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
for(const key10 in data60){
if(!((key10 === "provider") || (key10 === "id"))){
const err120 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key10},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
}
if(data60.provider !== undefined){
let data61 = data60.provider;
if(typeof data61 !== "string"){
let dataType50 = typeof data61;
let coerced50 = undefined;
if(dataType50 == 'object' && Array.isArray(data61) && data61.length == 1){
data61 = data61[0];
dataType50 = typeof data61;
if(typeof data61 === "string"){
coerced50 = data61;
}
}
if(!(coerced50 !== undefined)){
if(dataType50 == "number" || dataType50 == "boolean"){
coerced50 = "" + data61;
}
else if(data61 === null){
coerced50 = "";
}
else {
const err121 = {instancePath:instancePath+"/defaultModels/moderator/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
}
if(coerced50 !== undefined){
data61 = coerced50;
if(data60 !== undefined){
data60["provider"] = coerced50;
}
}
}
}
if(data60.id !== undefined){
let data62 = data60.id;
if(typeof data62 !== "string"){
let dataType51 = typeof data62;
let coerced51 = undefined;
if(dataType51 == 'object' && Array.isArray(data62) && data62.length == 1){
data62 = data62[0];
dataType51 = typeof data62;
if(typeof data62 === "string"){
coerced51 = data62;
}
}
if(!(coerced51 !== undefined)){
if(dataType51 == "number" || dataType51 == "boolean"){
coerced51 = "" + data62;
}
else if(data62 === null){
coerced51 = "";
}
else {
const err122 = {instancePath:instancePath+"/defaultModels/moderator/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
}
if(coerced51 !== undefined){
data62 = coerced51;
if(data60 !== undefined){
data60["id"] = coerced51;
}
}
}
}
}
else {
const err123 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
}
}
else {
const err124 = {instancePath:instancePath+"/defaultModels",schemaPath:"#/properties/defaultModels/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
}
if(data.eurosPerCredit !== undefined){
let data63 = data.eurosPerCredit;
if(!(typeof data63 == "number")){
let dataType52 = typeof data63;
let coerced52 = undefined;
if(dataType52 == 'object' && Array.isArray(data63) && data63.length == 1){
data63 = data63[0];
dataType52 = typeof data63;
if(typeof data63 == "number"){
coerced52 = data63;
}
}
if(!(coerced52 !== undefined)){
if(dataType52 == "boolean" || data63 === null
              || (dataType52 == "string" && data63 && data63 == +data63)){
coerced52 = +data63;
}
else {
const err125 = {instancePath:instancePath+"/eurosPerCredit",schemaPath:"#/properties/eurosPerCredit/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
}
if(coerced52 !== undefined){
data63 = coerced52;
if(data !== undefined){
data["eurosPerCredit"] = coerced52;
}
}
}
if(typeof data63 == "number"){
if(data63 <= 0 || isNaN(data63)){
const err126 = {instancePath:instancePath+"/eurosPerCredit",schemaPath:"#/properties/eurosPerCredit/exclusiveMinimum",keyword:"exclusiveMinimum",params:{comparison: ">", limit: 0},message:"must be > 0"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
}
}
if(data.defaultLimits !== undefined){
let data64 = data.defaultLimits;
if(data64 && typeof data64 == "object" && !Array.isArray(data64)){
for(const key11 in data64){
if(!(key11 === "credits")){
const err127 = {instancePath:instancePath+"/defaultLimits",schemaPath:"#/properties/defaultLimits/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key11},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
}
if(data64.credits !== undefined){
let data65 = data64.credits;
if(!(typeof data65 == "number")){
let dataType53 = typeof data65;
let coerced53 = undefined;
if(dataType53 == 'object' && Array.isArray(data65) && data65.length == 1){
data65 = data65[0];
dataType53 = typeof data65;
if(typeof data65 == "number"){
coerced53 = data65;
}
}
if(!(coerced53 !== undefined)){
if(dataType53 == "boolean" || data65 === null
              || (dataType53 == "string" && data65 && data65 == +data65)){
coerced53 = +data65;
}
else {
const err128 = {instancePath:instancePath+"/defaultLimits/credits",schemaPath:"#/properties/defaultLimits/properties/credits/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
}
if(coerced53 !== undefined){
data65 = coerced53;
if(data64 !== undefined){
data64["credits"] = coerced53;
}
}
}
}
}
else {
const err129 = {instancePath:instancePath+"/defaultLimits",schemaPath:"#/properties/defaultLimits/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
}
if(data.observer !== undefined){
let data66 = data.observer;
if(data66 && typeof data66 == "object" && !Array.isArray(data66)){
if(data66.active !== undefined){
let data67 = data66.active;
if(typeof data67 !== "boolean"){
let dataType54 = typeof data67;
let coerced54 = undefined;
if(dataType54 == 'object' && Array.isArray(data67) && data67.length == 1){
data67 = data67[0];
dataType54 = typeof data67;
if(typeof data67 === "boolean"){
coerced54 = data67;
}
}
if(!(coerced54 !== undefined)){
if(data67 === "false" || data67 === 0 || data67 === null){
coerced54 = false;
}
else if(data67 === "true" || data67 === 1){
coerced54 = true;
}
else {
const err130 = {instancePath:instancePath+"/observer/active",schemaPath:"#/properties/observer/properties/active/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
}
if(coerced54 !== undefined){
data67 = coerced54;
if(data66 !== undefined){
data66["active"] = coerced54;
}
}
}
}
if(data66.port !== undefined){
let data68 = data66.port;
if(!(typeof data68 == "number")){
let dataType55 = typeof data68;
let coerced55 = undefined;
if(dataType55 == 'object' && Array.isArray(data68) && data68.length == 1){
data68 = data68[0];
dataType55 = typeof data68;
if(typeof data68 == "number"){
coerced55 = data68;
}
}
if(!(coerced55 !== undefined)){
if(dataType55 == "boolean" || data68 === null
              || (dataType55 == "string" && data68 && data68 == +data68)){
coerced55 = +data68;
}
else {
const err131 = {instancePath:instancePath+"/observer/port",schemaPath:"#/properties/observer/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
if(coerced55 !== undefined){
data68 = coerced55;
if(data66 !== undefined){
data66["port"] = coerced55;
}
}
}
}
}
else {
const err132 = {instancePath:instancePath+"/observer",schemaPath:"#/properties/observer/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
}
if(data.upgradeRoot !== undefined){
let data69 = data.upgradeRoot;
if(typeof data69 !== "string"){
let dataType56 = typeof data69;
let coerced56 = undefined;
if(dataType56 == 'object' && Array.isArray(data69) && data69.length == 1){
data69 = data69[0];
dataType56 = typeof data69;
if(typeof data69 === "string"){
coerced56 = data69;
}
}
if(!(coerced56 !== undefined)){
if(dataType56 == "number" || dataType56 == "boolean"){
coerced56 = "" + data69;
}
else if(data69 === null){
coerced56 = "";
}
else {
const err133 = {instancePath:instancePath+"/upgradeRoot",schemaPath:"#/properties/upgradeRoot/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
}
if(coerced56 !== undefined){
data69 = coerced56;
if(data !== undefined){
data["upgradeRoot"] = coerced56;
}
}
}
}
if(data.cipherPassword !== undefined){
let data70 = data.cipherPassword;
if(typeof data70 !== "string"){
let dataType57 = typeof data70;
let coerced57 = undefined;
if(dataType57 == 'object' && Array.isArray(data70) && data70.length == 1){
data70 = data70[0];
dataType57 = typeof data70;
if(typeof data70 === "string"){
coerced57 = data70;
}
}
if(!(coerced57 !== undefined)){
if(dataType57 == "number" || dataType57 == "boolean"){
coerced57 = "" + data70;
}
else if(data70 === null){
coerced57 = "";
}
else {
const err134 = {instancePath:instancePath+"/cipherPassword",schemaPath:"#/properties/cipherPassword/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
}
if(coerced57 !== undefined){
data70 = coerced57;
if(data !== undefined){
data["cipherPassword"] = coerced57;
}
}
}
}
if(data.requireAnonymousActionToken !== undefined){
let data71 = data.requireAnonymousActionToken;
if(typeof data71 !== "boolean"){
let dataType58 = typeof data71;
let coerced58 = undefined;
if(dataType58 == 'object' && Array.isArray(data71) && data71.length == 1){
data71 = data71[0];
dataType58 = typeof data71;
if(typeof data71 === "boolean"){
coerced58 = data71;
}
}
if(!(coerced58 !== undefined)){
if(data71 === "false" || data71 === 0 || data71 === null){
coerced58 = false;
}
else if(data71 === "true" || data71 === 1){
coerced58 = true;
}
else {
const err135 = {instancePath:instancePath+"/requireAnonymousActionToken",schemaPath:"#/properties/requireAnonymousActionToken/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
}
if(coerced58 !== undefined){
data71 = coerced58;
if(data !== undefined){
data["requireAnonymousActionToken"] = coerced58;
}
}
}
}
if(data.evaluatorAccount !== undefined){
let data72 = data.evaluatorAccount;
if((!(data72 && typeof data72 == "object" && !Array.isArray(data72))) && (data72 !== null)){
let dataType59 = typeof data72;
let coerced59 = undefined;
if(dataType59 == 'object' && Array.isArray(data72) && data72.length == 1){
data72 = data72[0];
dataType59 = typeof data72;
if((data72 && typeof data72 == "object" && !Array.isArray(data72)) && (data72 === null)){
coerced59 = data72;
}
}
if(!(coerced59 !== undefined)){
if(data72 === "" || data72 === 0 || data72 === false){
coerced59 = null;
}
else {
const err136 = {instancePath:instancePath+"/evaluatorAccount",schemaPath:"#/properties/evaluatorAccount/type",keyword:"type",params:{type: schema16.properties.evaluatorAccount.type},message:"must be object,null"};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
}
if(coerced59 !== undefined){
data72 = coerced59;
if(data !== undefined){
data["evaluatorAccount"] = coerced59;
}
}
}
if(data72 && typeof data72 == "object" && !Array.isArray(data72)){
if(data72.type === undefined){
const err137 = {instancePath:instancePath+"/evaluatorAccount",schemaPath:"#/properties/evaluatorAccount/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
if(data72.id === undefined){
const err138 = {instancePath:instancePath+"/evaluatorAccount",schemaPath:"#/properties/evaluatorAccount/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
for(const key12 in data72){
if(!((key12 === "type") || (key12 === "id"))){
const err139 = {instancePath:instancePath+"/evaluatorAccount",schemaPath:"#/properties/evaluatorAccount/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key12},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
}
if(data72.type !== undefined){
let data73 = data72.type;
if(typeof data73 !== "string"){
let dataType60 = typeof data73;
let coerced60 = undefined;
if(dataType60 == 'object' && Array.isArray(data73) && data73.length == 1){
data73 = data73[0];
dataType60 = typeof data73;
if(typeof data73 === "string"){
coerced60 = data73;
}
}
if(!(coerced60 !== undefined)){
if(dataType60 == "number" || dataType60 == "boolean"){
coerced60 = "" + data73;
}
else if(data73 === null){
coerced60 = "";
}
else {
const err140 = {instancePath:instancePath+"/evaluatorAccount/type",schemaPath:"#/properties/evaluatorAccount/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
}
if(coerced60 !== undefined){
data73 = coerced60;
if(data72 !== undefined){
data72["type"] = coerced60;
}
}
}
if(!((data73 === "user") || (data73 === "organization"))){
const err141 = {instancePath:instancePath+"/evaluatorAccount/type",schemaPath:"#/properties/evaluatorAccount/properties/type/enum",keyword:"enum",params:{allowedValues: schema16.properties.evaluatorAccount.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
}
if(data72.id !== undefined){
let data74 = data72.id;
if(typeof data74 !== "string"){
let dataType61 = typeof data74;
let coerced61 = undefined;
if(dataType61 == 'object' && Array.isArray(data74) && data74.length == 1){
data74 = data74[0];
dataType61 = typeof data74;
if(typeof data74 === "string"){
coerced61 = data74;
}
}
if(!(coerced61 !== undefined)){
if(dataType61 == "number" || dataType61 == "boolean"){
coerced61 = "" + data74;
}
else if(data74 === null){
coerced61 = "";
}
else {
const err142 = {instancePath:instancePath+"/evaluatorAccount/id",schemaPath:"#/properties/evaluatorAccount/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
}
if(coerced61 !== undefined){
data74 = coerced61;
if(data72 !== undefined){
data72["id"] = coerced61;
}
}
}
}
}
}
if(data.github !== undefined){
let data75 = data.github;
if(data75 && typeof data75 == "object" && !Array.isArray(data75)){
for(const key13 in data75){
if(!(key13 === "token")){
const err143 = {instancePath:instancePath+"/github",schemaPath:"#/properties/github/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key13},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
}
if(data75.token !== undefined){
let data76 = data75.token;
if(typeof data76 !== "string"){
let dataType62 = typeof data76;
let coerced62 = undefined;
if(dataType62 == 'object' && Array.isArray(data76) && data76.length == 1){
data76 = data76[0];
dataType62 = typeof data76;
if(typeof data76 === "string"){
coerced62 = data76;
}
}
if(!(coerced62 !== undefined)){
if(dataType62 == "number" || dataType62 == "boolean"){
coerced62 = "" + data76;
}
else if(data76 === null){
coerced62 = "";
}
else {
const err144 = {instancePath:instancePath+"/github/token",schemaPath:"#/properties/github/properties/token/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
}
if(coerced62 !== undefined){
data76 = coerced62;
if(data75 !== undefined){
data75["token"] = coerced62;
}
}
}
}
}
else {
const err145 = {instancePath:instancePath+"/github",schemaPath:"#/properties/github/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
}
if(data.compactionPercent !== undefined){
let data77 = data.compactionPercent;
if(!(typeof data77 == "number")){
let dataType63 = typeof data77;
let coerced63 = undefined;
if(dataType63 == 'object' && Array.isArray(data77) && data77.length == 1){
data77 = data77[0];
dataType63 = typeof data77;
if(typeof data77 == "number"){
coerced63 = data77;
}
}
if(!(coerced63 !== undefined)){
if(dataType63 == "boolean" || data77 === null
              || (dataType63 == "string" && data77 && data77 == +data77)){
coerced63 = +data77;
}
else {
const err146 = {instancePath:instancePath+"/compactionPercent",schemaPath:"#/properties/compactionPercent/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
}
if(coerced63 !== undefined){
data77 = coerced63;
if(data !== undefined){
data["compactionPercent"] = coerced63;
}
}
}
if(typeof data77 == "number"){
if(data77 > 100 || isNaN(data77)){
const err147 = {instancePath:instancePath+"/compactionPercent",schemaPath:"#/properties/compactionPercent/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
if(data77 < 10 || isNaN(data77)){
const err148 = {instancePath:instancePath+"/compactionPercent",schemaPath:"#/properties/compactionPercent/minimum",keyword:"minimum",params:{comparison: ">=", limit: 10},message:"must be >= 10"};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
}
}
}
else {
const err149 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
