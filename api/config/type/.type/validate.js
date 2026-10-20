/* eslint-disable */
// @ts-nocheck

import ucs2length from "ajv/dist/runtime/ucs2length.js";
"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/api/config","x-exports":["types","validate"],"x-ajv":{"coerceTypes":"array"},"type":"object","title":"Api config","additionalProperties":false,"required":["privateDirectoryUrl","mongoUrl","port","tmpDir","observer","secretKeys","cipherPassword","requireAnonymousActionToken","eurosPerCredit","defaultLimits","compactionPercent","turnCredits","liveTurnsPerCaller","turnTimeoutSeconds","shutdownGraceSeconds","taskTimeoutSeconds","codeModeMaxWorkers","tasks"],"$defs":{"modelRef":{"type":"object","additionalProperties":false,"required":["provider","id"],"properties":{"provider":{"type":"string"},"id":{"type":"string"}}}},"properties":{"mongoUrl":{"type":"string"},"port":{"type":"number"},"tmpDir":{"type":"string"},"privateDirectoryUrl":{"type":"string","pattern":"^https?://"},"privateEventsUrl":{"type":"string"},"secretKeys":{"type":"object","additionalProperties":false,"properties":{"events":{"type":"string"},"limits":{"type":"string"}}},"providers":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["type","id","name"],"properties":{"type":{"type":"string","enum":["openai","anthropic","google","mistral","openrouter","ollama","scaleway","openai-compatible","mock"]},"id":{"type":"string"},"name":{"type":"string"},"enabled":{"type":"boolean","default":true},"apiKey":{"type":"string"},"baseURL":{"type":"string"},"projectId":{"type":"string"},"compatibility":{"type":"string","enum":["default","compatible"]}}}},"models":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["id","name","provider","usage","inputPricePerMillion","outputPricePerMillion"],"properties":{"id":{"type":"string"},"name":{"type":"string"},"provider":{"type":"string"},"usage":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string","enum":["assistant","tools","summarizer","moderator"]}},"contextWindow":{"type":"number","minimum":0},"inputPricePerMillion":{"type":"number","minimum":0},"outputPricePerMillion":{"type":"number","minimum":0},"cachedInputPricePerMillion":{"type":"number","minimum":0}}}},"mcpServers":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["id","name","url","auth"],"properties":{"id":{"type":"string"},"name":{"type":"string"},"description":{"type":"string"},"url":{"type":"string"},"auth":{"type":"string","enum":["nhi-session","none","apiKey"]},"apiKeyHeader":{"type":"string"},"apiKey":{"type":"string"}}}},"personalAssistants":{"type":"object","additionalProperties":false,"description":"The servers of each built-in personal assistant: references into mcpServers, like a configured agent's. Unset: no catalog servers.","default":{},"properties":{"portal":{"type":"object","additionalProperties":false,"properties":{"mcpServers":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["serverId"],"properties":{"serverId":{"type":"string"},"toolFilter":{"type":"array","items":{"type":"string"}}}}}}},"backOffice":{"type":"object","additionalProperties":false,"properties":{"mcpServers":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["serverId"],"properties":{"serverId":{"type":"string"},"toolFilter":{"type":"array","items":{"type":"string"}}}}}}}}},"autonomousAgentsRequireAdminMode":{"type":"boolean","default":true},"tasks":{"type":"object","additionalProperties":false,"required":["minIntervalSeconds","maxPerAgent","pollSeconds","maxConsecutiveFailures"],"properties":{"minIntervalSeconds":{"type":"integer","minimum":60,"default":3600,"description":"A task schedule may not fire more often than this."},"maxPerAgent":{"type":"integer","minimum":1,"default":20,"description":"Planned tasks one autonomous agent may hold."},"pollSeconds":{"type":"integer","minimum":1,"default":10,"description":"How often the scheduler looks for due tasks."},"maxConsecutiveFailures":{"type":"integer","minimum":1,"default":5,"description":"Failed runs in a row after which a task is paused."}}},"files":{"type":"object","additionalProperties":false,"required":["storage","secret","publicUrl"],"description":"The file store of autonomous agents (docs/architecture/agent-files.md). Unset: files are off.","properties":{"storage":{"type":"string","enum":["fs","s3"]},"dataDir":{"type":"string","description":"fs: a directory on a volume shared by every node when the service is scaled."},"s3":{"type":"object","additionalProperties":false,"properties":{"region":{"type":"string"},"endpoint":{"type":"string"},"bucket":{"type":"string"},"credentials":{"type":"object","additionalProperties":false,"properties":{"accessKeyId":{"type":"string"},"secretAccessKey":{"type":"string"}}},"forcePathStyle":{"type":"boolean"}}},"secret":{"type":"string","minLength":32,"description":"Signs the file URLs MCP servers fetch."},"publicUrl":{"type":"string","pattern":"^https?://","description":"The agents API base URL as MCP servers reach it: what they configure as FILE_URL_PREFIXES."}}},"defaultModels":{"type":"object","additionalProperties":false,"default":{},"properties":{"assistant":{"$ref":"#/$defs/modelRef"},"tools":{"$ref":"#/$defs/modelRef"},"summarizer":{"$ref":"#/$defs/modelRef"},"moderator":{"$ref":"#/$defs/modelRef"}}},"eurosPerCredit":{"type":"number","exclusiveMinimum":0,"default":0.008},"defaultLimits":{"type":"object","additionalProperties":false,"default":{"credits":0},"properties":{"credits":{"type":"number","default":0}}},"observer":{"type":"object","properties":{"active":{"type":"boolean"},"port":{"type":"number"}}},"upgradeRoot":{"type":"string"},"cipherPassword":{"type":"string"},"requireAnonymousActionToken":{"type":"boolean","default":true},"util":{},"get":{},"has":{},"compactionPercent":{"type":"number","title":"Compaction percent","description":"Share of the assistant model's context window above which conversation history is compacted.","default":70,"minimum":10,"maximum":100},"turnCredits":{"type":"number","title":"Turn credit budget","description":"Credits one turn may spend before it is stopped — any turn, the chat's as well as an autonomous agent's. The account credit cap still applies on top of this.","default":5,"minimum":0},"liveTurnsPerCaller":{"type":"integer","title":"Turns at once per caller","description":"How many chat turns one person — or one anonymous visitor's address — may have running at once. A further prompt is refused (429) until one ends. Quotas are re-checked between steps, so this bounds how far turns started together can overshoot one.","default":5,"minimum":1},"turnTimeoutSeconds":{"type":"number","title":"Turn timeout (seconds)","description":"Wall-clock ceiling for one chat turn, so a hanging model or MCP server cannot hold a conversation's lock. A planned task run has its own, taskTimeoutSeconds.","default":300,"minimum":10},"taskTimeoutSeconds":{"type":"integer","minimum":10,"default":1800,"description":"Wall-clock ceiling of one planned task's run. Longer than a chat turn's: nobody waits on it, and code mode and files make long runs the normal case."},"codeModeMaxWorkers":{"type":"integer","minimum":1,"default":4,"description":"How many code_mode scripts this process runs at once (one QuickJS worker each, up to 64 MiB). A script started while all are busy is refused, not queued."},"shutdownGraceSeconds":{"type":"number","title":"Shutdown grace (seconds)","description":"On SIGTERM, how long running turns are given to finish before they are stopped as 'the server restarted'. The pod's terminationGracePeriodSeconds must exceed it.","default":90,"minimum":0}}};
const schema17 = {"type":"object","additionalProperties":false,"required":["provider","id"],"properties":{"provider":{"type":"string"},"id":{"type":"string"}}};
const func2 = Object.prototype.hasOwnProperty;
const func3 = ucs2length.default;
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
if(data.turnCredits === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "turnCredits"},message:"must have required property '"+"turnCredits"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.liveTurnsPerCaller === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "liveTurnsPerCaller"},message:"must have required property '"+"liveTurnsPerCaller"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.turnTimeoutSeconds === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "turnTimeoutSeconds"},message:"must have required property '"+"turnTimeoutSeconds"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.shutdownGraceSeconds === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "shutdownGraceSeconds"},message:"must have required property '"+"shutdownGraceSeconds"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.taskTimeoutSeconds === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "taskTimeoutSeconds"},message:"must have required property '"+"taskTimeoutSeconds"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.codeModeMaxWorkers === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "codeModeMaxWorkers"},message:"must have required property '"+"codeModeMaxWorkers"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.tasks === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "tasks"},message:"must have required property '"+"tasks"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key0 in data){
if(!(func2.call(schema16.properties, key0))){
const err18 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
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
const err19 = {instancePath:instancePath+"/mongoUrl",schemaPath:"#/properties/mongoUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
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
const err20 = {instancePath:instancePath+"/port",schemaPath:"#/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
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
const err21 = {instancePath:instancePath+"/tmpDir",schemaPath:"#/properties/tmpDir/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
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
const err22 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
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
const err23 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/pattern",keyword:"pattern",params:{pattern: "^https?://"},message:"must match pattern \""+"^https?://"+"\""};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
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
const err24 = {instancePath:instancePath+"/privateEventsUrl",schemaPath:"#/properties/privateEventsUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
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
const err25 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
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
const err26 = {instancePath:instancePath+"/secretKeys/events",schemaPath:"#/properties/secretKeys/properties/events/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
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
const err27 = {instancePath:instancePath+"/secretKeys/limits",schemaPath:"#/properties/secretKeys/properties/limits/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
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
const err28 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
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
const err29 = {instancePath:instancePath+"/providers",schemaPath:"#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
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
const err30 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data9.id === undefined){
const err31 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(data9.name === undefined){
const err32 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
for(const key2 in data9){
if(!((((((((key2 === "type") || (key2 === "id")) || (key2 === "name")) || (key2 === "enabled")) || (key2 === "apiKey")) || (key2 === "baseURL")) || (key2 === "projectId")) || (key2 === "compatibility"))){
const err33 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
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
const err34 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
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
const err35 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/properties/type/enum",keyword:"enum",params:{allowedValues: schema16.properties.providers.items.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
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
const err36 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
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
const err37 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
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
const err38 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
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
const err39 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
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
const err40 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
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
const err41 = {instancePath:instancePath+"/providers/" + i0+"/projectId",schemaPath:"#/properties/providers/items/properties/projectId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
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
const err42 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/properties/compatibility/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
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
const err43 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/properties/compatibility/enum",keyword:"enum",params:{allowedValues: schema16.properties.providers.items.properties.compatibility.enum},message:"must be equal to one of the allowed values"};
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
else {
const err44 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
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
const err45 = {instancePath:instancePath+"/models",schemaPath:"#/properties/models/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
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
const err46 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
if(data19.name === undefined){
const err47 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data19.provider === undefined){
const err48 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data19.usage === undefined){
const err49 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "usage"},message:"must have required property '"+"usage"+"'"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(data19.inputPricePerMillion === undefined){
const err50 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "inputPricePerMillion"},message:"must have required property '"+"inputPricePerMillion"+"'"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(data19.outputPricePerMillion === undefined){
const err51 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "outputPricePerMillion"},message:"must have required property '"+"outputPricePerMillion"+"'"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
for(const key3 in data19){
if(!((((((((key3 === "id") || (key3 === "name")) || (key3 === "provider")) || (key3 === "usage")) || (key3 === "contextWindow")) || (key3 === "inputPricePerMillion")) || (key3 === "outputPricePerMillion")) || (key3 === "cachedInputPricePerMillion"))){
const err52 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
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
const err53 = {instancePath:instancePath+"/models/" + i1+"/id",schemaPath:"#/properties/models/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
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
const err54 = {instancePath:instancePath+"/models/" + i1+"/name",schemaPath:"#/properties/models/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
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
const err55 = {instancePath:instancePath+"/models/" + i1+"/provider",schemaPath:"#/properties/models/items/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
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
const err56 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
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
const err57 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
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
const err58 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
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
if(!((((data24 === "assistant") || (data24 === "tools")) || (data24 === "summarizer")) || (data24 === "moderator"))){
const err59 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/enum",keyword:"enum",params:{allowedValues: schema16.properties.models.items.properties.usage.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
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
const err60 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
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
const err61 = {instancePath:instancePath+"/models/" + i1+"/contextWindow",schemaPath:"#/properties/models/items/properties/contextWindow/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
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
const err62 = {instancePath:instancePath+"/models/" + i1+"/contextWindow",schemaPath:"#/properties/models/items/properties/contextWindow/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
const err63 = {instancePath:instancePath+"/models/" + i1+"/inputPricePerMillion",schemaPath:"#/properties/models/items/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
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
const err64 = {instancePath:instancePath+"/models/" + i1+"/inputPricePerMillion",schemaPath:"#/properties/models/items/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
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
const err65 = {instancePath:instancePath+"/models/" + i1+"/outputPricePerMillion",schemaPath:"#/properties/models/items/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
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
const err66 = {instancePath:instancePath+"/models/" + i1+"/outputPricePerMillion",schemaPath:"#/properties/models/items/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
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
const err67 = {instancePath:instancePath+"/models/" + i1+"/cachedInputPricePerMillion",schemaPath:"#/properties/models/items/properties/cachedInputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
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
const err68 = {instancePath:instancePath+"/models/" + i1+"/cachedInputPricePerMillion",schemaPath:"#/properties/models/items/properties/cachedInputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
}
}
else {
const err69 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
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
const err70 = {instancePath:instancePath+"/mcpServers",schemaPath:"#/properties/mcpServers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
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
const err71 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(data30.name === undefined){
const err72 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if(data30.url === undefined){
const err73 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "url"},message:"must have required property '"+"url"+"'"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if(data30.auth === undefined){
const err74 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "auth"},message:"must have required property '"+"auth"+"'"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
for(const key4 in data30){
if(!(((((((key4 === "id") || (key4 === "name")) || (key4 === "description")) || (key4 === "url")) || (key4 === "auth")) || (key4 === "apiKeyHeader")) || (key4 === "apiKey"))){
const err75 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
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
const err76 = {instancePath:instancePath+"/mcpServers/" + i4+"/id",schemaPath:"#/properties/mcpServers/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
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
const err77 = {instancePath:instancePath+"/mcpServers/" + i4+"/name",schemaPath:"#/properties/mcpServers/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
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
const err78 = {instancePath:instancePath+"/mcpServers/" + i4+"/description",schemaPath:"#/properties/mcpServers/items/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
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
const err79 = {instancePath:instancePath+"/mcpServers/" + i4+"/url",schemaPath:"#/properties/mcpServers/items/properties/url/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
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
const err80 = {instancePath:instancePath+"/mcpServers/" + i4+"/auth",schemaPath:"#/properties/mcpServers/items/properties/auth/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
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
const err81 = {instancePath:instancePath+"/mcpServers/" + i4+"/auth",schemaPath:"#/properties/mcpServers/items/properties/auth/enum",keyword:"enum",params:{allowedValues: schema16.properties.mcpServers.items.properties.auth.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
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
const err82 = {instancePath:instancePath+"/mcpServers/" + i4+"/apiKeyHeader",schemaPath:"#/properties/mcpServers/items/properties/apiKeyHeader/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
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
const err83 = {instancePath:instancePath+"/mcpServers/" + i4+"/apiKey",schemaPath:"#/properties/mcpServers/items/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
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
const err84 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
}
if(data.personalAssistants !== undefined){
let data38 = data.personalAssistants;
if(data38 && typeof data38 == "object" && !Array.isArray(data38)){
for(const key5 in data38){
if(!((key5 === "portal") || (key5 === "backOffice"))){
const err85 = {instancePath:instancePath+"/personalAssistants",schemaPath:"#/properties/personalAssistants/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(data38.portal !== undefined){
let data39 = data38.portal;
if(data39 && typeof data39 == "object" && !Array.isArray(data39)){
for(const key6 in data39){
if(!(key6 === "mcpServers")){
const err86 = {instancePath:instancePath+"/personalAssistants/portal",schemaPath:"#/properties/personalAssistants/properties/portal/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(data39.mcpServers !== undefined){
let data40 = data39.mcpServers;
if(!(Array.isArray(data40))){
let dataType34 = typeof data40;
let coerced34 = undefined;
if(dataType34 == 'object' && Array.isArray(data40) && data40.length == 1){
data40 = data40[0];
dataType34 = typeof data40;
if(Array.isArray(data40)){
coerced34 = data40;
}
}
if(!(coerced34 !== undefined)){
if(dataType34 === "string" || dataType34 === "number"
              || dataType34 === "boolean" || data40 === null){
coerced34 = [data40];
}
else {
const err87 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers",schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
if(coerced34 !== undefined){
data40 = coerced34;
if(data39 !== undefined){
data39["mcpServers"] = coerced34;
}
}
}
if(Array.isArray(data40)){
const len4 = data40.length;
for(let i5=0; i5<len4; i5++){
let data41 = data40[i5];
if(data41 && typeof data41 == "object" && !Array.isArray(data41)){
if(data41.serverId === undefined){
const err88 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers/" + i5,schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "serverId"},message:"must have required property '"+"serverId"+"'"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
for(const key7 in data41){
if(!((key7 === "serverId") || (key7 === "toolFilter"))){
const err89 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers/" + i5,schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
if(data41.serverId !== undefined){
let data42 = data41.serverId;
if(typeof data42 !== "string"){
let dataType35 = typeof data42;
let coerced35 = undefined;
if(dataType35 == 'object' && Array.isArray(data42) && data42.length == 1){
data42 = data42[0];
dataType35 = typeof data42;
if(typeof data42 === "string"){
coerced35 = data42;
}
}
if(!(coerced35 !== undefined)){
if(dataType35 == "number" || dataType35 == "boolean"){
coerced35 = "" + data42;
}
else if(data42 === null){
coerced35 = "";
}
else {
const err90 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers/" + i5+"/serverId",schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/items/properties/serverId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
if(coerced35 !== undefined){
data42 = coerced35;
if(data41 !== undefined){
data41["serverId"] = coerced35;
}
}
}
}
if(data41.toolFilter !== undefined){
let data43 = data41.toolFilter;
if(!(Array.isArray(data43))){
let dataType36 = typeof data43;
let coerced36 = undefined;
if(dataType36 == 'object' && Array.isArray(data43) && data43.length == 1){
data43 = data43[0];
dataType36 = typeof data43;
if(Array.isArray(data43)){
coerced36 = data43;
}
}
if(!(coerced36 !== undefined)){
if(dataType36 === "string" || dataType36 === "number"
              || dataType36 === "boolean" || data43 === null){
coerced36 = [data43];
}
else {
const err91 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers/" + i5+"/toolFilter",schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/items/properties/toolFilter/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
if(coerced36 !== undefined){
data43 = coerced36;
if(data41 !== undefined){
data41["toolFilter"] = coerced36;
}
}
}
if(Array.isArray(data43)){
const len5 = data43.length;
for(let i6=0; i6<len5; i6++){
let data44 = data43[i6];
if(typeof data44 !== "string"){
let dataType37 = typeof data44;
let coerced37 = undefined;
if(dataType37 == 'object' && Array.isArray(data44) && data44.length == 1){
data44 = data44[0];
dataType37 = typeof data44;
if(typeof data44 === "string"){
coerced37 = data44;
}
}
if(!(coerced37 !== undefined)){
if(dataType37 == "number" || dataType37 == "boolean"){
coerced37 = "" + data44;
}
else if(data44 === null){
coerced37 = "";
}
else {
const err92 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers/" + i5+"/toolFilter/" + i6,schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
if(coerced37 !== undefined){
data44 = coerced37;
if(data43 !== undefined){
data43[i6] = coerced37;
}
}
}
}
}
}
}
else {
const err93 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers/" + i5,schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
}
}
else {
const err94 = {instancePath:instancePath+"/personalAssistants/portal",schemaPath:"#/properties/personalAssistants/properties/portal/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
if(data38.backOffice !== undefined){
let data45 = data38.backOffice;
if(data45 && typeof data45 == "object" && !Array.isArray(data45)){
for(const key8 in data45){
if(!(key8 === "mcpServers")){
const err95 = {instancePath:instancePath+"/personalAssistants/backOffice",schemaPath:"#/properties/personalAssistants/properties/backOffice/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
if(data45.mcpServers !== undefined){
let data46 = data45.mcpServers;
if(!(Array.isArray(data46))){
let dataType38 = typeof data46;
let coerced38 = undefined;
if(dataType38 == 'object' && Array.isArray(data46) && data46.length == 1){
data46 = data46[0];
dataType38 = typeof data46;
if(Array.isArray(data46)){
coerced38 = data46;
}
}
if(!(coerced38 !== undefined)){
if(dataType38 === "string" || dataType38 === "number"
              || dataType38 === "boolean" || data46 === null){
coerced38 = [data46];
}
else {
const err96 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers",schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
}
if(coerced38 !== undefined){
data46 = coerced38;
if(data45 !== undefined){
data45["mcpServers"] = coerced38;
}
}
}
if(Array.isArray(data46)){
const len6 = data46.length;
for(let i7=0; i7<len6; i7++){
let data47 = data46[i7];
if(data47 && typeof data47 == "object" && !Array.isArray(data47)){
if(data47.serverId === undefined){
const err97 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers/" + i7,schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "serverId"},message:"must have required property '"+"serverId"+"'"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
for(const key9 in data47){
if(!((key9 === "serverId") || (key9 === "toolFilter"))){
const err98 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers/" + i7,schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
if(data47.serverId !== undefined){
let data48 = data47.serverId;
if(typeof data48 !== "string"){
let dataType39 = typeof data48;
let coerced39 = undefined;
if(dataType39 == 'object' && Array.isArray(data48) && data48.length == 1){
data48 = data48[0];
dataType39 = typeof data48;
if(typeof data48 === "string"){
coerced39 = data48;
}
}
if(!(coerced39 !== undefined)){
if(dataType39 == "number" || dataType39 == "boolean"){
coerced39 = "" + data48;
}
else if(data48 === null){
coerced39 = "";
}
else {
const err99 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers/" + i7+"/serverId",schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/items/properties/serverId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
}
if(coerced39 !== undefined){
data48 = coerced39;
if(data47 !== undefined){
data47["serverId"] = coerced39;
}
}
}
}
if(data47.toolFilter !== undefined){
let data49 = data47.toolFilter;
if(!(Array.isArray(data49))){
let dataType40 = typeof data49;
let coerced40 = undefined;
if(dataType40 == 'object' && Array.isArray(data49) && data49.length == 1){
data49 = data49[0];
dataType40 = typeof data49;
if(Array.isArray(data49)){
coerced40 = data49;
}
}
if(!(coerced40 !== undefined)){
if(dataType40 === "string" || dataType40 === "number"
              || dataType40 === "boolean" || data49 === null){
coerced40 = [data49];
}
else {
const err100 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers/" + i7+"/toolFilter",schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/items/properties/toolFilter/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
if(coerced40 !== undefined){
data49 = coerced40;
if(data47 !== undefined){
data47["toolFilter"] = coerced40;
}
}
}
if(Array.isArray(data49)){
const len7 = data49.length;
for(let i8=0; i8<len7; i8++){
let data50 = data49[i8];
if(typeof data50 !== "string"){
let dataType41 = typeof data50;
let coerced41 = undefined;
if(dataType41 == 'object' && Array.isArray(data50) && data50.length == 1){
data50 = data50[0];
dataType41 = typeof data50;
if(typeof data50 === "string"){
coerced41 = data50;
}
}
if(!(coerced41 !== undefined)){
if(dataType41 == "number" || dataType41 == "boolean"){
coerced41 = "" + data50;
}
else if(data50 === null){
coerced41 = "";
}
else {
const err101 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers/" + i7+"/toolFilter/" + i8,schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
data50 = coerced41;
if(data49 !== undefined){
data49[i8] = coerced41;
}
}
}
}
}
}
}
else {
const err102 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers/" + i7,schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
}
}
}
}
else {
const err103 = {instancePath:instancePath+"/personalAssistants/backOffice",schemaPath:"#/properties/personalAssistants/properties/backOffice/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
}
else {
const err104 = {instancePath:instancePath+"/personalAssistants",schemaPath:"#/properties/personalAssistants/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
}
if(data.autonomousAgentsRequireAdminMode !== undefined){
let data51 = data.autonomousAgentsRequireAdminMode;
if(typeof data51 !== "boolean"){
let dataType42 = typeof data51;
let coerced42 = undefined;
if(dataType42 == 'object' && Array.isArray(data51) && data51.length == 1){
data51 = data51[0];
dataType42 = typeof data51;
if(typeof data51 === "boolean"){
coerced42 = data51;
}
}
if(!(coerced42 !== undefined)){
if(data51 === "false" || data51 === 0 || data51 === null){
coerced42 = false;
}
else if(data51 === "true" || data51 === 1){
coerced42 = true;
}
else {
const err105 = {instancePath:instancePath+"/autonomousAgentsRequireAdminMode",schemaPath:"#/properties/autonomousAgentsRequireAdminMode/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
}
if(coerced42 !== undefined){
data51 = coerced42;
if(data !== undefined){
data["autonomousAgentsRequireAdminMode"] = coerced42;
}
}
}
}
if(data.tasks !== undefined){
let data52 = data.tasks;
if(data52 && typeof data52 == "object" && !Array.isArray(data52)){
if(data52.minIntervalSeconds === undefined){
const err106 = {instancePath:instancePath+"/tasks",schemaPath:"#/properties/tasks/required",keyword:"required",params:{missingProperty: "minIntervalSeconds"},message:"must have required property '"+"minIntervalSeconds"+"'"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
if(data52.maxPerAgent === undefined){
const err107 = {instancePath:instancePath+"/tasks",schemaPath:"#/properties/tasks/required",keyword:"required",params:{missingProperty: "maxPerAgent"},message:"must have required property '"+"maxPerAgent"+"'"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if(data52.pollSeconds === undefined){
const err108 = {instancePath:instancePath+"/tasks",schemaPath:"#/properties/tasks/required",keyword:"required",params:{missingProperty: "pollSeconds"},message:"must have required property '"+"pollSeconds"+"'"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
if(data52.maxConsecutiveFailures === undefined){
const err109 = {instancePath:instancePath+"/tasks",schemaPath:"#/properties/tasks/required",keyword:"required",params:{missingProperty: "maxConsecutiveFailures"},message:"must have required property '"+"maxConsecutiveFailures"+"'"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
for(const key10 in data52){
if(!((((key10 === "minIntervalSeconds") || (key10 === "maxPerAgent")) || (key10 === "pollSeconds")) || (key10 === "maxConsecutiveFailures"))){
const err110 = {instancePath:instancePath+"/tasks",schemaPath:"#/properties/tasks/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key10},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
}
if(data52.minIntervalSeconds !== undefined){
let data53 = data52.minIntervalSeconds;
if(!((typeof data53 == "number") && (!(data53 % 1) && !isNaN(data53)))){
let dataType43 = typeof data53;
let coerced43 = undefined;
if(dataType43 == 'object' && Array.isArray(data53) && data53.length == 1){
data53 = data53[0];
dataType43 = typeof data53;
if((typeof data53 == "number") && (!(data53 % 1) && !isNaN(data53))){
coerced43 = data53;
}
}
if(!(coerced43 !== undefined)){
if(dataType43 === "boolean" || data53 === null
              || (dataType43 === "string" && data53 && data53 == +data53 && !(data53 % 1))){
coerced43 = +data53;
}
else {
const err111 = {instancePath:instancePath+"/tasks/minIntervalSeconds",schemaPath:"#/properties/tasks/properties/minIntervalSeconds/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
}
if(coerced43 !== undefined){
data53 = coerced43;
if(data52 !== undefined){
data52["minIntervalSeconds"] = coerced43;
}
}
}
if(typeof data53 == "number"){
if(data53 < 60 || isNaN(data53)){
const err112 = {instancePath:instancePath+"/tasks/minIntervalSeconds",schemaPath:"#/properties/tasks/properties/minIntervalSeconds/minimum",keyword:"minimum",params:{comparison: ">=", limit: 60},message:"must be >= 60"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
}
}
if(data52.maxPerAgent !== undefined){
let data54 = data52.maxPerAgent;
if(!((typeof data54 == "number") && (!(data54 % 1) && !isNaN(data54)))){
let dataType44 = typeof data54;
let coerced44 = undefined;
if(dataType44 == 'object' && Array.isArray(data54) && data54.length == 1){
data54 = data54[0];
dataType44 = typeof data54;
if((typeof data54 == "number") && (!(data54 % 1) && !isNaN(data54))){
coerced44 = data54;
}
}
if(!(coerced44 !== undefined)){
if(dataType44 === "boolean" || data54 === null
              || (dataType44 === "string" && data54 && data54 == +data54 && !(data54 % 1))){
coerced44 = +data54;
}
else {
const err113 = {instancePath:instancePath+"/tasks/maxPerAgent",schemaPath:"#/properties/tasks/properties/maxPerAgent/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
}
if(coerced44 !== undefined){
data54 = coerced44;
if(data52 !== undefined){
data52["maxPerAgent"] = coerced44;
}
}
}
if(typeof data54 == "number"){
if(data54 < 1 || isNaN(data54)){
const err114 = {instancePath:instancePath+"/tasks/maxPerAgent",schemaPath:"#/properties/tasks/properties/maxPerAgent/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
}
}
if(data52.pollSeconds !== undefined){
let data55 = data52.pollSeconds;
if(!((typeof data55 == "number") && (!(data55 % 1) && !isNaN(data55)))){
let dataType45 = typeof data55;
let coerced45 = undefined;
if(dataType45 == 'object' && Array.isArray(data55) && data55.length == 1){
data55 = data55[0];
dataType45 = typeof data55;
if((typeof data55 == "number") && (!(data55 % 1) && !isNaN(data55))){
coerced45 = data55;
}
}
if(!(coerced45 !== undefined)){
if(dataType45 === "boolean" || data55 === null
              || (dataType45 === "string" && data55 && data55 == +data55 && !(data55 % 1))){
coerced45 = +data55;
}
else {
const err115 = {instancePath:instancePath+"/tasks/pollSeconds",schemaPath:"#/properties/tasks/properties/pollSeconds/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
}
if(coerced45 !== undefined){
data55 = coerced45;
if(data52 !== undefined){
data52["pollSeconds"] = coerced45;
}
}
}
if(typeof data55 == "number"){
if(data55 < 1 || isNaN(data55)){
const err116 = {instancePath:instancePath+"/tasks/pollSeconds",schemaPath:"#/properties/tasks/properties/pollSeconds/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
}
}
if(data52.maxConsecutiveFailures !== undefined){
let data56 = data52.maxConsecutiveFailures;
if(!((typeof data56 == "number") && (!(data56 % 1) && !isNaN(data56)))){
let dataType46 = typeof data56;
let coerced46 = undefined;
if(dataType46 == 'object' && Array.isArray(data56) && data56.length == 1){
data56 = data56[0];
dataType46 = typeof data56;
if((typeof data56 == "number") && (!(data56 % 1) && !isNaN(data56))){
coerced46 = data56;
}
}
if(!(coerced46 !== undefined)){
if(dataType46 === "boolean" || data56 === null
              || (dataType46 === "string" && data56 && data56 == +data56 && !(data56 % 1))){
coerced46 = +data56;
}
else {
const err117 = {instancePath:instancePath+"/tasks/maxConsecutiveFailures",schemaPath:"#/properties/tasks/properties/maxConsecutiveFailures/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
if(coerced46 !== undefined){
data56 = coerced46;
if(data52 !== undefined){
data52["maxConsecutiveFailures"] = coerced46;
}
}
}
if(typeof data56 == "number"){
if(data56 < 1 || isNaN(data56)){
const err118 = {instancePath:instancePath+"/tasks/maxConsecutiveFailures",schemaPath:"#/properties/tasks/properties/maxConsecutiveFailures/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
}
}
}
else {
const err119 = {instancePath:instancePath+"/tasks",schemaPath:"#/properties/tasks/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
}
if(data.files !== undefined){
let data57 = data.files;
if(data57 && typeof data57 == "object" && !Array.isArray(data57)){
if(data57.storage === undefined){
const err120 = {instancePath:instancePath+"/files",schemaPath:"#/properties/files/required",keyword:"required",params:{missingProperty: "storage"},message:"must have required property '"+"storage"+"'"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
if(data57.secret === undefined){
const err121 = {instancePath:instancePath+"/files",schemaPath:"#/properties/files/required",keyword:"required",params:{missingProperty: "secret"},message:"must have required property '"+"secret"+"'"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if(data57.publicUrl === undefined){
const err122 = {instancePath:instancePath+"/files",schemaPath:"#/properties/files/required",keyword:"required",params:{missingProperty: "publicUrl"},message:"must have required property '"+"publicUrl"+"'"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
for(const key11 in data57){
if(!(((((key11 === "storage") || (key11 === "dataDir")) || (key11 === "s3")) || (key11 === "secret")) || (key11 === "publicUrl"))){
const err123 = {instancePath:instancePath+"/files",schemaPath:"#/properties/files/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key11},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
}
if(data57.storage !== undefined){
let data58 = data57.storage;
if(typeof data58 !== "string"){
let dataType47 = typeof data58;
let coerced47 = undefined;
if(dataType47 == 'object' && Array.isArray(data58) && data58.length == 1){
data58 = data58[0];
dataType47 = typeof data58;
if(typeof data58 === "string"){
coerced47 = data58;
}
}
if(!(coerced47 !== undefined)){
if(dataType47 == "number" || dataType47 == "boolean"){
coerced47 = "" + data58;
}
else if(data58 === null){
coerced47 = "";
}
else {
const err124 = {instancePath:instancePath+"/files/storage",schemaPath:"#/properties/files/properties/storage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
}
if(coerced47 !== undefined){
data58 = coerced47;
if(data57 !== undefined){
data57["storage"] = coerced47;
}
}
}
if(!((data58 === "fs") || (data58 === "s3"))){
const err125 = {instancePath:instancePath+"/files/storage",schemaPath:"#/properties/files/properties/storage/enum",keyword:"enum",params:{allowedValues: schema16.properties.files.properties.storage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
}
if(data57.dataDir !== undefined){
let data59 = data57.dataDir;
if(typeof data59 !== "string"){
let dataType48 = typeof data59;
let coerced48 = undefined;
if(dataType48 == 'object' && Array.isArray(data59) && data59.length == 1){
data59 = data59[0];
dataType48 = typeof data59;
if(typeof data59 === "string"){
coerced48 = data59;
}
}
if(!(coerced48 !== undefined)){
if(dataType48 == "number" || dataType48 == "boolean"){
coerced48 = "" + data59;
}
else if(data59 === null){
coerced48 = "";
}
else {
const err126 = {instancePath:instancePath+"/files/dataDir",schemaPath:"#/properties/files/properties/dataDir/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
}
if(coerced48 !== undefined){
data59 = coerced48;
if(data57 !== undefined){
data57["dataDir"] = coerced48;
}
}
}
}
if(data57.s3 !== undefined){
let data60 = data57.s3;
if(data60 && typeof data60 == "object" && !Array.isArray(data60)){
for(const key12 in data60){
if(!(((((key12 === "region") || (key12 === "endpoint")) || (key12 === "bucket")) || (key12 === "credentials")) || (key12 === "forcePathStyle"))){
const err127 = {instancePath:instancePath+"/files/s3",schemaPath:"#/properties/files/properties/s3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key12},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
}
if(data60.region !== undefined){
let data61 = data60.region;
if(typeof data61 !== "string"){
let dataType49 = typeof data61;
let coerced49 = undefined;
if(dataType49 == 'object' && Array.isArray(data61) && data61.length == 1){
data61 = data61[0];
dataType49 = typeof data61;
if(typeof data61 === "string"){
coerced49 = data61;
}
}
if(!(coerced49 !== undefined)){
if(dataType49 == "number" || dataType49 == "boolean"){
coerced49 = "" + data61;
}
else if(data61 === null){
coerced49 = "";
}
else {
const err128 = {instancePath:instancePath+"/files/s3/region",schemaPath:"#/properties/files/properties/s3/properties/region/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
}
if(coerced49 !== undefined){
data61 = coerced49;
if(data60 !== undefined){
data60["region"] = coerced49;
}
}
}
}
if(data60.endpoint !== undefined){
let data62 = data60.endpoint;
if(typeof data62 !== "string"){
let dataType50 = typeof data62;
let coerced50 = undefined;
if(dataType50 == 'object' && Array.isArray(data62) && data62.length == 1){
data62 = data62[0];
dataType50 = typeof data62;
if(typeof data62 === "string"){
coerced50 = data62;
}
}
if(!(coerced50 !== undefined)){
if(dataType50 == "number" || dataType50 == "boolean"){
coerced50 = "" + data62;
}
else if(data62 === null){
coerced50 = "";
}
else {
const err129 = {instancePath:instancePath+"/files/s3/endpoint",schemaPath:"#/properties/files/properties/s3/properties/endpoint/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
}
if(coerced50 !== undefined){
data62 = coerced50;
if(data60 !== undefined){
data60["endpoint"] = coerced50;
}
}
}
}
if(data60.bucket !== undefined){
let data63 = data60.bucket;
if(typeof data63 !== "string"){
let dataType51 = typeof data63;
let coerced51 = undefined;
if(dataType51 == 'object' && Array.isArray(data63) && data63.length == 1){
data63 = data63[0];
dataType51 = typeof data63;
if(typeof data63 === "string"){
coerced51 = data63;
}
}
if(!(coerced51 !== undefined)){
if(dataType51 == "number" || dataType51 == "boolean"){
coerced51 = "" + data63;
}
else if(data63 === null){
coerced51 = "";
}
else {
const err130 = {instancePath:instancePath+"/files/s3/bucket",schemaPath:"#/properties/files/properties/s3/properties/bucket/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
}
if(coerced51 !== undefined){
data63 = coerced51;
if(data60 !== undefined){
data60["bucket"] = coerced51;
}
}
}
}
if(data60.credentials !== undefined){
let data64 = data60.credentials;
if(data64 && typeof data64 == "object" && !Array.isArray(data64)){
for(const key13 in data64){
if(!((key13 === "accessKeyId") || (key13 === "secretAccessKey"))){
const err131 = {instancePath:instancePath+"/files/s3/credentials",schemaPath:"#/properties/files/properties/s3/properties/credentials/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key13},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
if(data64.accessKeyId !== undefined){
let data65 = data64.accessKeyId;
if(typeof data65 !== "string"){
let dataType52 = typeof data65;
let coerced52 = undefined;
if(dataType52 == 'object' && Array.isArray(data65) && data65.length == 1){
data65 = data65[0];
dataType52 = typeof data65;
if(typeof data65 === "string"){
coerced52 = data65;
}
}
if(!(coerced52 !== undefined)){
if(dataType52 == "number" || dataType52 == "boolean"){
coerced52 = "" + data65;
}
else if(data65 === null){
coerced52 = "";
}
else {
const err132 = {instancePath:instancePath+"/files/s3/credentials/accessKeyId",schemaPath:"#/properties/files/properties/s3/properties/credentials/properties/accessKeyId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
}
if(coerced52 !== undefined){
data65 = coerced52;
if(data64 !== undefined){
data64["accessKeyId"] = coerced52;
}
}
}
}
if(data64.secretAccessKey !== undefined){
let data66 = data64.secretAccessKey;
if(typeof data66 !== "string"){
let dataType53 = typeof data66;
let coerced53 = undefined;
if(dataType53 == 'object' && Array.isArray(data66) && data66.length == 1){
data66 = data66[0];
dataType53 = typeof data66;
if(typeof data66 === "string"){
coerced53 = data66;
}
}
if(!(coerced53 !== undefined)){
if(dataType53 == "number" || dataType53 == "boolean"){
coerced53 = "" + data66;
}
else if(data66 === null){
coerced53 = "";
}
else {
const err133 = {instancePath:instancePath+"/files/s3/credentials/secretAccessKey",schemaPath:"#/properties/files/properties/s3/properties/credentials/properties/secretAccessKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
}
if(coerced53 !== undefined){
data66 = coerced53;
if(data64 !== undefined){
data64["secretAccessKey"] = coerced53;
}
}
}
}
}
else {
const err134 = {instancePath:instancePath+"/files/s3/credentials",schemaPath:"#/properties/files/properties/s3/properties/credentials/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
}
if(data60.forcePathStyle !== undefined){
let data67 = data60.forcePathStyle;
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
const err135 = {instancePath:instancePath+"/files/s3/forcePathStyle",schemaPath:"#/properties/files/properties/s3/properties/forcePathStyle/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
}
if(coerced54 !== undefined){
data67 = coerced54;
if(data60 !== undefined){
data60["forcePathStyle"] = coerced54;
}
}
}
}
}
else {
const err136 = {instancePath:instancePath+"/files/s3",schemaPath:"#/properties/files/properties/s3/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
}
if(data57.secret !== undefined){
let data68 = data57.secret;
if(typeof data68 !== "string"){
let dataType55 = typeof data68;
let coerced55 = undefined;
if(dataType55 == 'object' && Array.isArray(data68) && data68.length == 1){
data68 = data68[0];
dataType55 = typeof data68;
if(typeof data68 === "string"){
coerced55 = data68;
}
}
if(!(coerced55 !== undefined)){
if(dataType55 == "number" || dataType55 == "boolean"){
coerced55 = "" + data68;
}
else if(data68 === null){
coerced55 = "";
}
else {
const err137 = {instancePath:instancePath+"/files/secret",schemaPath:"#/properties/files/properties/secret/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
}
if(coerced55 !== undefined){
data68 = coerced55;
if(data57 !== undefined){
data57["secret"] = coerced55;
}
}
}
if(typeof data68 === "string"){
if(func3(data68) < 32){
const err138 = {instancePath:instancePath+"/files/secret",schemaPath:"#/properties/files/properties/secret/minLength",keyword:"minLength",params:{limit: 32},message:"must NOT have fewer than 32 characters"};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
}
}
if(data57.publicUrl !== undefined){
let data69 = data57.publicUrl;
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
const err139 = {instancePath:instancePath+"/files/publicUrl",schemaPath:"#/properties/files/properties/publicUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
}
if(coerced56 !== undefined){
data69 = coerced56;
if(data57 !== undefined){
data57["publicUrl"] = coerced56;
}
}
}
if(typeof data69 === "string"){
if(!pattern0.test(data69)){
const err140 = {instancePath:instancePath+"/files/publicUrl",schemaPath:"#/properties/files/properties/publicUrl/pattern",keyword:"pattern",params:{pattern: "^https?://"},message:"must match pattern \""+"^https?://"+"\""};
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
}
else {
const err141 = {instancePath:instancePath+"/files",schemaPath:"#/properties/files/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
}
if(data.defaultModels !== undefined){
let data70 = data.defaultModels;
if(data70 && typeof data70 == "object" && !Array.isArray(data70)){
for(const key14 in data70){
if(!((((key14 === "assistant") || (key14 === "tools")) || (key14 === "summarizer")) || (key14 === "moderator"))){
const err142 = {instancePath:instancePath+"/defaultModels",schemaPath:"#/properties/defaultModels/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key14},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
}
if(data70.assistant !== undefined){
let data71 = data70.assistant;
if(data71 && typeof data71 == "object" && !Array.isArray(data71)){
if(data71.provider === undefined){
const err143 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
if(data71.id === undefined){
const err144 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
for(const key15 in data71){
if(!((key15 === "provider") || (key15 === "id"))){
const err145 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key15},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
}
if(data71.provider !== undefined){
let data72 = data71.provider;
if(typeof data72 !== "string"){
let dataType57 = typeof data72;
let coerced57 = undefined;
if(dataType57 == 'object' && Array.isArray(data72) && data72.length == 1){
data72 = data72[0];
dataType57 = typeof data72;
if(typeof data72 === "string"){
coerced57 = data72;
}
}
if(!(coerced57 !== undefined)){
if(dataType57 == "number" || dataType57 == "boolean"){
coerced57 = "" + data72;
}
else if(data72 === null){
coerced57 = "";
}
else {
const err146 = {instancePath:instancePath+"/defaultModels/assistant/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
}
if(coerced57 !== undefined){
data72 = coerced57;
if(data71 !== undefined){
data71["provider"] = coerced57;
}
}
}
}
if(data71.id !== undefined){
let data73 = data71.id;
if(typeof data73 !== "string"){
let dataType58 = typeof data73;
let coerced58 = undefined;
if(dataType58 == 'object' && Array.isArray(data73) && data73.length == 1){
data73 = data73[0];
dataType58 = typeof data73;
if(typeof data73 === "string"){
coerced58 = data73;
}
}
if(!(coerced58 !== undefined)){
if(dataType58 == "number" || dataType58 == "boolean"){
coerced58 = "" + data73;
}
else if(data73 === null){
coerced58 = "";
}
else {
const err147 = {instancePath:instancePath+"/defaultModels/assistant/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
}
if(coerced58 !== undefined){
data73 = coerced58;
if(data71 !== undefined){
data71["id"] = coerced58;
}
}
}
}
}
else {
const err148 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
}
if(data70.tools !== undefined){
let data74 = data70.tools;
if(data74 && typeof data74 == "object" && !Array.isArray(data74)){
if(data74.provider === undefined){
const err149 = {instancePath:instancePath+"/defaultModels/tools",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
if(data74.id === undefined){
const err150 = {instancePath:instancePath+"/defaultModels/tools",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err150];
}
else {
vErrors.push(err150);
}
errors++;
}
for(const key16 in data74){
if(!((key16 === "provider") || (key16 === "id"))){
const err151 = {instancePath:instancePath+"/defaultModels/tools",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key16},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
}
if(data74.provider !== undefined){
let data75 = data74.provider;
if(typeof data75 !== "string"){
let dataType59 = typeof data75;
let coerced59 = undefined;
if(dataType59 == 'object' && Array.isArray(data75) && data75.length == 1){
data75 = data75[0];
dataType59 = typeof data75;
if(typeof data75 === "string"){
coerced59 = data75;
}
}
if(!(coerced59 !== undefined)){
if(dataType59 == "number" || dataType59 == "boolean"){
coerced59 = "" + data75;
}
else if(data75 === null){
coerced59 = "";
}
else {
const err152 = {instancePath:instancePath+"/defaultModels/tools/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err152];
}
else {
vErrors.push(err152);
}
errors++;
}
}
if(coerced59 !== undefined){
data75 = coerced59;
if(data74 !== undefined){
data74["provider"] = coerced59;
}
}
}
}
if(data74.id !== undefined){
let data76 = data74.id;
if(typeof data76 !== "string"){
let dataType60 = typeof data76;
let coerced60 = undefined;
if(dataType60 == 'object' && Array.isArray(data76) && data76.length == 1){
data76 = data76[0];
dataType60 = typeof data76;
if(typeof data76 === "string"){
coerced60 = data76;
}
}
if(!(coerced60 !== undefined)){
if(dataType60 == "number" || dataType60 == "boolean"){
coerced60 = "" + data76;
}
else if(data76 === null){
coerced60 = "";
}
else {
const err153 = {instancePath:instancePath+"/defaultModels/tools/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err153];
}
else {
vErrors.push(err153);
}
errors++;
}
}
if(coerced60 !== undefined){
data76 = coerced60;
if(data74 !== undefined){
data74["id"] = coerced60;
}
}
}
}
}
else {
const err154 = {instancePath:instancePath+"/defaultModels/tools",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err154];
}
else {
vErrors.push(err154);
}
errors++;
}
}
if(data70.summarizer !== undefined){
let data77 = data70.summarizer;
if(data77 && typeof data77 == "object" && !Array.isArray(data77)){
if(data77.provider === undefined){
const err155 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
if(data77.id === undefined){
const err156 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
for(const key17 in data77){
if(!((key17 === "provider") || (key17 === "id"))){
const err157 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key17},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
}
if(data77.provider !== undefined){
let data78 = data77.provider;
if(typeof data78 !== "string"){
let dataType61 = typeof data78;
let coerced61 = undefined;
if(dataType61 == 'object' && Array.isArray(data78) && data78.length == 1){
data78 = data78[0];
dataType61 = typeof data78;
if(typeof data78 === "string"){
coerced61 = data78;
}
}
if(!(coerced61 !== undefined)){
if(dataType61 == "number" || dataType61 == "boolean"){
coerced61 = "" + data78;
}
else if(data78 === null){
coerced61 = "";
}
else {
const err158 = {instancePath:instancePath+"/defaultModels/summarizer/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
}
if(coerced61 !== undefined){
data78 = coerced61;
if(data77 !== undefined){
data77["provider"] = coerced61;
}
}
}
}
if(data77.id !== undefined){
let data79 = data77.id;
if(typeof data79 !== "string"){
let dataType62 = typeof data79;
let coerced62 = undefined;
if(dataType62 == 'object' && Array.isArray(data79) && data79.length == 1){
data79 = data79[0];
dataType62 = typeof data79;
if(typeof data79 === "string"){
coerced62 = data79;
}
}
if(!(coerced62 !== undefined)){
if(dataType62 == "number" || dataType62 == "boolean"){
coerced62 = "" + data79;
}
else if(data79 === null){
coerced62 = "";
}
else {
const err159 = {instancePath:instancePath+"/defaultModels/summarizer/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
}
if(coerced62 !== undefined){
data79 = coerced62;
if(data77 !== undefined){
data77["id"] = coerced62;
}
}
}
}
}
else {
const err160 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
}
if(data70.moderator !== undefined){
let data80 = data70.moderator;
if(data80 && typeof data80 == "object" && !Array.isArray(data80)){
if(data80.provider === undefined){
const err161 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
if(data80.id === undefined){
const err162 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
for(const key18 in data80){
if(!((key18 === "provider") || (key18 === "id"))){
const err163 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key18},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
}
if(data80.provider !== undefined){
let data81 = data80.provider;
if(typeof data81 !== "string"){
let dataType63 = typeof data81;
let coerced63 = undefined;
if(dataType63 == 'object' && Array.isArray(data81) && data81.length == 1){
data81 = data81[0];
dataType63 = typeof data81;
if(typeof data81 === "string"){
coerced63 = data81;
}
}
if(!(coerced63 !== undefined)){
if(dataType63 == "number" || dataType63 == "boolean"){
coerced63 = "" + data81;
}
else if(data81 === null){
coerced63 = "";
}
else {
const err164 = {instancePath:instancePath+"/defaultModels/moderator/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
}
if(coerced63 !== undefined){
data81 = coerced63;
if(data80 !== undefined){
data80["provider"] = coerced63;
}
}
}
}
if(data80.id !== undefined){
let data82 = data80.id;
if(typeof data82 !== "string"){
let dataType64 = typeof data82;
let coerced64 = undefined;
if(dataType64 == 'object' && Array.isArray(data82) && data82.length == 1){
data82 = data82[0];
dataType64 = typeof data82;
if(typeof data82 === "string"){
coerced64 = data82;
}
}
if(!(coerced64 !== undefined)){
if(dataType64 == "number" || dataType64 == "boolean"){
coerced64 = "" + data82;
}
else if(data82 === null){
coerced64 = "";
}
else {
const err165 = {instancePath:instancePath+"/defaultModels/moderator/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
}
if(coerced64 !== undefined){
data82 = coerced64;
if(data80 !== undefined){
data80["id"] = coerced64;
}
}
}
}
}
else {
const err166 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
}
}
else {
const err167 = {instancePath:instancePath+"/defaultModels",schemaPath:"#/properties/defaultModels/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
}
if(data.eurosPerCredit !== undefined){
let data83 = data.eurosPerCredit;
if(!(typeof data83 == "number")){
let dataType65 = typeof data83;
let coerced65 = undefined;
if(dataType65 == 'object' && Array.isArray(data83) && data83.length == 1){
data83 = data83[0];
dataType65 = typeof data83;
if(typeof data83 == "number"){
coerced65 = data83;
}
}
if(!(coerced65 !== undefined)){
if(dataType65 == "boolean" || data83 === null
              || (dataType65 == "string" && data83 && data83 == +data83)){
coerced65 = +data83;
}
else {
const err168 = {instancePath:instancePath+"/eurosPerCredit",schemaPath:"#/properties/eurosPerCredit/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
}
if(coerced65 !== undefined){
data83 = coerced65;
if(data !== undefined){
data["eurosPerCredit"] = coerced65;
}
}
}
if(typeof data83 == "number"){
if(data83 <= 0 || isNaN(data83)){
const err169 = {instancePath:instancePath+"/eurosPerCredit",schemaPath:"#/properties/eurosPerCredit/exclusiveMinimum",keyword:"exclusiveMinimum",params:{comparison: ">", limit: 0},message:"must be > 0"};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
}
}
if(data.defaultLimits !== undefined){
let data84 = data.defaultLimits;
if(data84 && typeof data84 == "object" && !Array.isArray(data84)){
for(const key19 in data84){
if(!(key19 === "credits")){
const err170 = {instancePath:instancePath+"/defaultLimits",schemaPath:"#/properties/defaultLimits/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key19},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
}
if(data84.credits !== undefined){
let data85 = data84.credits;
if(!(typeof data85 == "number")){
let dataType66 = typeof data85;
let coerced66 = undefined;
if(dataType66 == 'object' && Array.isArray(data85) && data85.length == 1){
data85 = data85[0];
dataType66 = typeof data85;
if(typeof data85 == "number"){
coerced66 = data85;
}
}
if(!(coerced66 !== undefined)){
if(dataType66 == "boolean" || data85 === null
              || (dataType66 == "string" && data85 && data85 == +data85)){
coerced66 = +data85;
}
else {
const err171 = {instancePath:instancePath+"/defaultLimits/credits",schemaPath:"#/properties/defaultLimits/properties/credits/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
}
if(coerced66 !== undefined){
data85 = coerced66;
if(data84 !== undefined){
data84["credits"] = coerced66;
}
}
}
}
}
else {
const err172 = {instancePath:instancePath+"/defaultLimits",schemaPath:"#/properties/defaultLimits/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err172];
}
else {
vErrors.push(err172);
}
errors++;
}
}
if(data.observer !== undefined){
let data86 = data.observer;
if(data86 && typeof data86 == "object" && !Array.isArray(data86)){
if(data86.active !== undefined){
let data87 = data86.active;
if(typeof data87 !== "boolean"){
let dataType67 = typeof data87;
let coerced67 = undefined;
if(dataType67 == 'object' && Array.isArray(data87) && data87.length == 1){
data87 = data87[0];
dataType67 = typeof data87;
if(typeof data87 === "boolean"){
coerced67 = data87;
}
}
if(!(coerced67 !== undefined)){
if(data87 === "false" || data87 === 0 || data87 === null){
coerced67 = false;
}
else if(data87 === "true" || data87 === 1){
coerced67 = true;
}
else {
const err173 = {instancePath:instancePath+"/observer/active",schemaPath:"#/properties/observer/properties/active/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
}
errors++;
}
}
if(coerced67 !== undefined){
data87 = coerced67;
if(data86 !== undefined){
data86["active"] = coerced67;
}
}
}
}
if(data86.port !== undefined){
let data88 = data86.port;
if(!(typeof data88 == "number")){
let dataType68 = typeof data88;
let coerced68 = undefined;
if(dataType68 == 'object' && Array.isArray(data88) && data88.length == 1){
data88 = data88[0];
dataType68 = typeof data88;
if(typeof data88 == "number"){
coerced68 = data88;
}
}
if(!(coerced68 !== undefined)){
if(dataType68 == "boolean" || data88 === null
              || (dataType68 == "string" && data88 && data88 == +data88)){
coerced68 = +data88;
}
else {
const err174 = {instancePath:instancePath+"/observer/port",schemaPath:"#/properties/observer/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err174];
}
else {
vErrors.push(err174);
}
errors++;
}
}
if(coerced68 !== undefined){
data88 = coerced68;
if(data86 !== undefined){
data86["port"] = coerced68;
}
}
}
}
}
else {
const err175 = {instancePath:instancePath+"/observer",schemaPath:"#/properties/observer/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
}
if(data.upgradeRoot !== undefined){
let data89 = data.upgradeRoot;
if(typeof data89 !== "string"){
let dataType69 = typeof data89;
let coerced69 = undefined;
if(dataType69 == 'object' && Array.isArray(data89) && data89.length == 1){
data89 = data89[0];
dataType69 = typeof data89;
if(typeof data89 === "string"){
coerced69 = data89;
}
}
if(!(coerced69 !== undefined)){
if(dataType69 == "number" || dataType69 == "boolean"){
coerced69 = "" + data89;
}
else if(data89 === null){
coerced69 = "";
}
else {
const err176 = {instancePath:instancePath+"/upgradeRoot",schemaPath:"#/properties/upgradeRoot/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err176];
}
else {
vErrors.push(err176);
}
errors++;
}
}
if(coerced69 !== undefined){
data89 = coerced69;
if(data !== undefined){
data["upgradeRoot"] = coerced69;
}
}
}
}
if(data.cipherPassword !== undefined){
let data90 = data.cipherPassword;
if(typeof data90 !== "string"){
let dataType70 = typeof data90;
let coerced70 = undefined;
if(dataType70 == 'object' && Array.isArray(data90) && data90.length == 1){
data90 = data90[0];
dataType70 = typeof data90;
if(typeof data90 === "string"){
coerced70 = data90;
}
}
if(!(coerced70 !== undefined)){
if(dataType70 == "number" || dataType70 == "boolean"){
coerced70 = "" + data90;
}
else if(data90 === null){
coerced70 = "";
}
else {
const err177 = {instancePath:instancePath+"/cipherPassword",schemaPath:"#/properties/cipherPassword/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
}
}
if(coerced70 !== undefined){
data90 = coerced70;
if(data !== undefined){
data["cipherPassword"] = coerced70;
}
}
}
}
if(data.requireAnonymousActionToken !== undefined){
let data91 = data.requireAnonymousActionToken;
if(typeof data91 !== "boolean"){
let dataType71 = typeof data91;
let coerced71 = undefined;
if(dataType71 == 'object' && Array.isArray(data91) && data91.length == 1){
data91 = data91[0];
dataType71 = typeof data91;
if(typeof data91 === "boolean"){
coerced71 = data91;
}
}
if(!(coerced71 !== undefined)){
if(data91 === "false" || data91 === 0 || data91 === null){
coerced71 = false;
}
else if(data91 === "true" || data91 === 1){
coerced71 = true;
}
else {
const err178 = {instancePath:instancePath+"/requireAnonymousActionToken",schemaPath:"#/properties/requireAnonymousActionToken/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err178];
}
else {
vErrors.push(err178);
}
errors++;
}
}
if(coerced71 !== undefined){
data91 = coerced71;
if(data !== undefined){
data["requireAnonymousActionToken"] = coerced71;
}
}
}
}
if(data.compactionPercent !== undefined){
let data92 = data.compactionPercent;
if(!(typeof data92 == "number")){
let dataType72 = typeof data92;
let coerced72 = undefined;
if(dataType72 == 'object' && Array.isArray(data92) && data92.length == 1){
data92 = data92[0];
dataType72 = typeof data92;
if(typeof data92 == "number"){
coerced72 = data92;
}
}
if(!(coerced72 !== undefined)){
if(dataType72 == "boolean" || data92 === null
              || (dataType72 == "string" && data92 && data92 == +data92)){
coerced72 = +data92;
}
else {
const err179 = {instancePath:instancePath+"/compactionPercent",schemaPath:"#/properties/compactionPercent/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err179];
}
else {
vErrors.push(err179);
}
errors++;
}
}
if(coerced72 !== undefined){
data92 = coerced72;
if(data !== undefined){
data["compactionPercent"] = coerced72;
}
}
}
if(typeof data92 == "number"){
if(data92 > 100 || isNaN(data92)){
const err180 = {instancePath:instancePath+"/compactionPercent",schemaPath:"#/properties/compactionPercent/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err180];
}
else {
vErrors.push(err180);
}
errors++;
}
if(data92 < 10 || isNaN(data92)){
const err181 = {instancePath:instancePath+"/compactionPercent",schemaPath:"#/properties/compactionPercent/minimum",keyword:"minimum",params:{comparison: ">=", limit: 10},message:"must be >= 10"};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
}
}
if(data.turnCredits !== undefined){
let data93 = data.turnCredits;
if(!(typeof data93 == "number")){
let dataType73 = typeof data93;
let coerced73 = undefined;
if(dataType73 == 'object' && Array.isArray(data93) && data93.length == 1){
data93 = data93[0];
dataType73 = typeof data93;
if(typeof data93 == "number"){
coerced73 = data93;
}
}
if(!(coerced73 !== undefined)){
if(dataType73 == "boolean" || data93 === null
              || (dataType73 == "string" && data93 && data93 == +data93)){
coerced73 = +data93;
}
else {
const err182 = {instancePath:instancePath+"/turnCredits",schemaPath:"#/properties/turnCredits/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err182];
}
else {
vErrors.push(err182);
}
errors++;
}
}
if(coerced73 !== undefined){
data93 = coerced73;
if(data !== undefined){
data["turnCredits"] = coerced73;
}
}
}
if(typeof data93 == "number"){
if(data93 < 0 || isNaN(data93)){
const err183 = {instancePath:instancePath+"/turnCredits",schemaPath:"#/properties/turnCredits/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.liveTurnsPerCaller !== undefined){
let data94 = data.liveTurnsPerCaller;
if(!((typeof data94 == "number") && (!(data94 % 1) && !isNaN(data94)))){
let dataType74 = typeof data94;
let coerced74 = undefined;
if(dataType74 == 'object' && Array.isArray(data94) && data94.length == 1){
data94 = data94[0];
dataType74 = typeof data94;
if((typeof data94 == "number") && (!(data94 % 1) && !isNaN(data94))){
coerced74 = data94;
}
}
if(!(coerced74 !== undefined)){
if(dataType74 === "boolean" || data94 === null
              || (dataType74 === "string" && data94 && data94 == +data94 && !(data94 % 1))){
coerced74 = +data94;
}
else {
const err184 = {instancePath:instancePath+"/liveTurnsPerCaller",schemaPath:"#/properties/liveTurnsPerCaller/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err184];
}
else {
vErrors.push(err184);
}
errors++;
}
}
if(coerced74 !== undefined){
data94 = coerced74;
if(data !== undefined){
data["liveTurnsPerCaller"] = coerced74;
}
}
}
if(typeof data94 == "number"){
if(data94 < 1 || isNaN(data94)){
const err185 = {instancePath:instancePath+"/liveTurnsPerCaller",schemaPath:"#/properties/liveTurnsPerCaller/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err185];
}
else {
vErrors.push(err185);
}
errors++;
}
}
}
if(data.turnTimeoutSeconds !== undefined){
let data95 = data.turnTimeoutSeconds;
if(!(typeof data95 == "number")){
let dataType75 = typeof data95;
let coerced75 = undefined;
if(dataType75 == 'object' && Array.isArray(data95) && data95.length == 1){
data95 = data95[0];
dataType75 = typeof data95;
if(typeof data95 == "number"){
coerced75 = data95;
}
}
if(!(coerced75 !== undefined)){
if(dataType75 == "boolean" || data95 === null
              || (dataType75 == "string" && data95 && data95 == +data95)){
coerced75 = +data95;
}
else {
const err186 = {instancePath:instancePath+"/turnTimeoutSeconds",schemaPath:"#/properties/turnTimeoutSeconds/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err186];
}
else {
vErrors.push(err186);
}
errors++;
}
}
if(coerced75 !== undefined){
data95 = coerced75;
if(data !== undefined){
data["turnTimeoutSeconds"] = coerced75;
}
}
}
if(typeof data95 == "number"){
if(data95 < 10 || isNaN(data95)){
const err187 = {instancePath:instancePath+"/turnTimeoutSeconds",schemaPath:"#/properties/turnTimeoutSeconds/minimum",keyword:"minimum",params:{comparison: ">=", limit: 10},message:"must be >= 10"};
if(vErrors === null){
vErrors = [err187];
}
else {
vErrors.push(err187);
}
errors++;
}
}
}
if(data.taskTimeoutSeconds !== undefined){
let data96 = data.taskTimeoutSeconds;
if(!((typeof data96 == "number") && (!(data96 % 1) && !isNaN(data96)))){
let dataType76 = typeof data96;
let coerced76 = undefined;
if(dataType76 == 'object' && Array.isArray(data96) && data96.length == 1){
data96 = data96[0];
dataType76 = typeof data96;
if((typeof data96 == "number") && (!(data96 % 1) && !isNaN(data96))){
coerced76 = data96;
}
}
if(!(coerced76 !== undefined)){
if(dataType76 === "boolean" || data96 === null
              || (dataType76 === "string" && data96 && data96 == +data96 && !(data96 % 1))){
coerced76 = +data96;
}
else {
const err188 = {instancePath:instancePath+"/taskTimeoutSeconds",schemaPath:"#/properties/taskTimeoutSeconds/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err188];
}
else {
vErrors.push(err188);
}
errors++;
}
}
if(coerced76 !== undefined){
data96 = coerced76;
if(data !== undefined){
data["taskTimeoutSeconds"] = coerced76;
}
}
}
if(typeof data96 == "number"){
if(data96 < 10 || isNaN(data96)){
const err189 = {instancePath:instancePath+"/taskTimeoutSeconds",schemaPath:"#/properties/taskTimeoutSeconds/minimum",keyword:"minimum",params:{comparison: ">=", limit: 10},message:"must be >= 10"};
if(vErrors === null){
vErrors = [err189];
}
else {
vErrors.push(err189);
}
errors++;
}
}
}
if(data.codeModeMaxWorkers !== undefined){
let data97 = data.codeModeMaxWorkers;
if(!((typeof data97 == "number") && (!(data97 % 1) && !isNaN(data97)))){
let dataType77 = typeof data97;
let coerced77 = undefined;
if(dataType77 == 'object' && Array.isArray(data97) && data97.length == 1){
data97 = data97[0];
dataType77 = typeof data97;
if((typeof data97 == "number") && (!(data97 % 1) && !isNaN(data97))){
coerced77 = data97;
}
}
if(!(coerced77 !== undefined)){
if(dataType77 === "boolean" || data97 === null
              || (dataType77 === "string" && data97 && data97 == +data97 && !(data97 % 1))){
coerced77 = +data97;
}
else {
const err190 = {instancePath:instancePath+"/codeModeMaxWorkers",schemaPath:"#/properties/codeModeMaxWorkers/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err190];
}
else {
vErrors.push(err190);
}
errors++;
}
}
if(coerced77 !== undefined){
data97 = coerced77;
if(data !== undefined){
data["codeModeMaxWorkers"] = coerced77;
}
}
}
if(typeof data97 == "number"){
if(data97 < 1 || isNaN(data97)){
const err191 = {instancePath:instancePath+"/codeModeMaxWorkers",schemaPath:"#/properties/codeModeMaxWorkers/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err191];
}
else {
vErrors.push(err191);
}
errors++;
}
}
}
if(data.shutdownGraceSeconds !== undefined){
let data98 = data.shutdownGraceSeconds;
if(!(typeof data98 == "number")){
let dataType78 = typeof data98;
let coerced78 = undefined;
if(dataType78 == 'object' && Array.isArray(data98) && data98.length == 1){
data98 = data98[0];
dataType78 = typeof data98;
if(typeof data98 == "number"){
coerced78 = data98;
}
}
if(!(coerced78 !== undefined)){
if(dataType78 == "boolean" || data98 === null
              || (dataType78 == "string" && data98 && data98 == +data98)){
coerced78 = +data98;
}
else {
const err192 = {instancePath:instancePath+"/shutdownGraceSeconds",schemaPath:"#/properties/shutdownGraceSeconds/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err192];
}
else {
vErrors.push(err192);
}
errors++;
}
}
if(coerced78 !== undefined){
data98 = coerced78;
if(data !== undefined){
data["shutdownGraceSeconds"] = coerced78;
}
}
}
if(typeof data98 == "number"){
if(data98 < 0 || isNaN(data98)){
const err193 = {instancePath:instancePath+"/shutdownGraceSeconds",schemaPath:"#/properties/shutdownGraceSeconds/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
}
else {
const err194 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err194];
}
else {
vErrors.push(err194);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
