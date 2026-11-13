/* eslint-disable */
// @ts-nocheck

import ucs2length from "ajv/dist/runtime/ucs2length.js";
"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/api/config","x-exports":["types","validate"],"x-ajv":{"coerceTypes":"array"},"type":"object","title":"Api config","additionalProperties":false,"required":["privateDirectoryUrl","mcpPath","mongoUrl","port","tmpDir","observer","secretKeys","cipherPassword","requireAnonymousActionToken","eurosPerCredit","defaultLimits","compactionPercent","turnCredits","liveTurnsPerCaller","turnTimeoutSeconds","shutdownGraceSeconds","taskTimeoutSeconds","codeModeMaxWorkers","approvalReview","tasks"],"$defs":{"modelRef":{"type":"object","additionalProperties":false,"required":["provider","id"],"properties":{"provider":{"type":"string"},"id":{"type":"string"}}}},"properties":{"mongoUrl":{"type":"string"},"port":{"type":"number"},"tmpDir":{"type":"string"},"privateDirectoryUrl":{"type":"string","pattern":"^https?://"},"mcpPath":{"type":"string","pattern":"^/"},"privateEventsUrl":{"type":"string"},"privateMcpUrl":{"type":"string","pattern":"^https?://","description":"data-fair's MCP endpoint, built into every autonomous agent with an identity. Unset: none."},"secretKeys":{"type":"object","additionalProperties":false,"properties":{"events":{"type":"string"},"limits":{"type":"string"}}},"providers":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["type","id","name"],"properties":{"type":{"type":"string","enum":["openai","anthropic","google","mistral","openrouter","ollama","scaleway","openai-compatible","mock"]},"id":{"type":"string"},"name":{"type":"string"},"enabled":{"type":"boolean","default":true},"apiKey":{"type":"string"},"baseURL":{"type":"string"},"projectId":{"type":"string"},"compatibility":{"type":"string","enum":["default","compatible"]}}}},"models":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["id","name","provider","usage","inputPricePerMillion","outputPricePerMillion"],"properties":{"id":{"type":"string"},"name":{"type":"string"},"provider":{"type":"string"},"usage":{"type":"array","minItems":1,"uniqueItems":true,"items":{"type":"string","enum":["assistant","summarizer","moderator"]}},"contextWindow":{"type":"number","minimum":0},"imageInput":{"type":"boolean"},"inputPricePerMillion":{"type":"number","minimum":0},"outputPricePerMillion":{"type":"number","minimum":0},"cachedInputPricePerMillion":{"type":"number","minimum":0}}}},"mcpServers":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["id","name","url","auth"],"properties":{"id":{"type":"string"},"name":{"type":"string"},"description":{"type":"string"},"url":{"type":"string"},"auth":{"type":"string","enum":["nhi-session","none","apiKey"]},"apiKeyHeader":{"type":"string"},"apiKey":{"type":"string"}}}},"personalAssistants":{"type":"object","additionalProperties":false,"description":"The servers of each built-in personal assistant: references into mcpServers, like a configured agent's. Unset: no catalog servers.","default":{},"properties":{"portal":{"type":"object","additionalProperties":false,"properties":{"mcpServers":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["serverId"],"properties":{"serverId":{"type":"string"},"toolFilter":{"type":"array","items":{"type":"string"}}}}}}},"backOffice":{"type":"object","additionalProperties":false,"properties":{"mcpServers":{"type":"array","default":[],"items":{"type":"object","additionalProperties":false,"required":["serverId"],"properties":{"serverId":{"type":"string"},"toolFilter":{"type":"array","items":{"type":"string"}}}}}}}}},"autonomousAgentsRequireAdminMode":{"type":"boolean","default":true},"tasks":{"type":"object","additionalProperties":false,"required":["minIntervalSeconds","maxPerAgent","pollSeconds","maxConsecutiveFailures"],"properties":{"minIntervalSeconds":{"type":"integer","minimum":60,"default":3600,"description":"A task schedule may not fire more often than this."},"maxPerAgent":{"type":"integer","minimum":1,"default":20,"description":"Planned tasks one autonomous agent may hold."},"pollSeconds":{"type":"integer","minimum":1,"default":10,"description":"How often the scheduler looks for due tasks."},"maxConsecutiveFailures":{"type":"integer","minimum":1,"default":5,"description":"Failed runs in a row after which a task is paused."}}},"files":{"type":"object","additionalProperties":false,"required":["storage","secret","publicUrl"],"description":"The file store of autonomous agents (docs/architecture/agent-files.md). Unset: files are off.","properties":{"storage":{"type":"string","enum":["fs","s3"]},"dataDir":{"type":"string","description":"fs: a directory on a volume shared by every node when the service is scaled."},"s3":{"type":"object","additionalProperties":false,"properties":{"region":{"type":"string"},"endpoint":{"type":"string"},"bucket":{"type":"string"},"credentials":{"type":"object","additionalProperties":false,"properties":{"accessKeyId":{"type":"string"},"secretAccessKey":{"type":"string"}}},"forcePathStyle":{"type":"boolean"}}},"secret":{"type":"string","minLength":32,"description":"Signs the file URLs MCP servers fetch."},"publicUrl":{"type":"string","pattern":"^https?://","description":"The agents API base URL as MCP servers reach it: what they configure as FILE_URL_PREFIXES."}}},"defaultModels":{"type":"object","additionalProperties":false,"default":{},"properties":{"assistant":{"$ref":"#/$defs/modelRef"},"summarizer":{"$ref":"#/$defs/modelRef"},"moderator":{"$ref":"#/$defs/modelRef"}}},"eurosPerCredit":{"type":"number","exclusiveMinimum":0,"default":0.008},"defaultLimits":{"type":"object","additionalProperties":false,"default":{"credits":0},"properties":{"credits":{"type":"number","default":0}}},"observer":{"type":"object","properties":{"active":{"type":"boolean"},"port":{"type":"number"}}},"upgradeRoot":{"type":"string"},"cipherPassword":{"type":"string"},"requireAnonymousActionToken":{"type":"boolean","default":true},"util":{},"get":{},"has":{},"compactionPercent":{"type":"number","title":"Compaction percent","description":"Share of the assistant model's context window above which conversation history is compacted.","default":70,"minimum":10,"maximum":100},"turnCredits":{"type":"number","title":"Turn credit budget","description":"Credits one turn may spend before it is stopped — any turn, the chat's as well as an autonomous agent's. The account credit cap still applies on top of this.","default":5,"minimum":0},"liveTurnsPerCaller":{"type":"integer","title":"Turns at once per caller","description":"How many chat turns one person — or one anonymous visitor's address — may have running at once. A further prompt is refused (429) until one ends. Quotas are re-checked between steps, so this bounds how far turns started together can overshoot one.","default":5,"minimum":1},"turnTimeoutSeconds":{"type":"number","title":"Turn timeout (seconds)","description":"Wall-clock ceiling for one chat turn, so a hanging model or MCP server cannot hold a conversation's lock. A planned task run has its own, taskTimeoutSeconds.","default":300,"minimum":10},"taskTimeoutSeconds":{"type":"integer","minimum":10,"default":1800,"description":"Wall-clock ceiling of one planned task's run. Longer than a chat turn's: nobody waits on it, and code mode and files make long runs the normal case."},"tripwire":{"type":"object","additionalProperties":false,"properties":{"enabled":{"type":"boolean","default":true,"description":"Classify outside tool results for prompt injection before the model sees them (docs/architecture/moderation.md)."}}},"approvalReview":{"type":"object","additionalProperties":false,"required":["stage1TimeoutMs"],"properties":{"stage1TimeoutMs":{"type":"integer","minimum":100,"default":5000,"description":"Hard timeout of the approval reviewer's stage 1 (docs/architecture/moderation.md). A timeout leaves the call unsure, so it becomes an approval card: raise it where the model is slow (the dev bridge)."}}},"codeModeMaxWorkers":{"type":"integer","minimum":1,"default":4,"description":"How many code_mode scripts this process runs at once (one QuickJS worker each, up to 64 MiB). A script started while all are busy is refused, not queued."},"shutdownGraceSeconds":{"type":"number","title":"Shutdown grace (seconds)","description":"On SIGTERM, how long running turns are given to finish before they are stopped as 'the server restarted'. The pod's terminationGracePeriodSeconds must exceed it.","default":90,"minimum":0}}};
const schema17 = {"type":"object","additionalProperties":false,"required":["provider","id"],"properties":{"provider":{"type":"string"},"id":{"type":"string"}}};
const func2 = Object.prototype.hasOwnProperty;
const func4 = ucs2length.default;
const pattern0 = new RegExp("^https?://", "u");
const pattern1 = new RegExp("^/", "u");

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
if(data.mcpPath === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mcpPath"},message:"must have required property '"+"mcpPath"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.mongoUrl === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mongoUrl"},message:"must have required property '"+"mongoUrl"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.port === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "port"},message:"must have required property '"+"port"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.tmpDir === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "tmpDir"},message:"must have required property '"+"tmpDir"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.observer === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observer"},message:"must have required property '"+"observer"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.secretKeys === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "secretKeys"},message:"must have required property '"+"secretKeys"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.cipherPassword === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cipherPassword"},message:"must have required property '"+"cipherPassword"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.requireAnonymousActionToken === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "requireAnonymousActionToken"},message:"must have required property '"+"requireAnonymousActionToken"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.eurosPerCredit === undefined){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "eurosPerCredit"},message:"must have required property '"+"eurosPerCredit"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data.defaultLimits === undefined){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "defaultLimits"},message:"must have required property '"+"defaultLimits"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data.compactionPercent === undefined){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "compactionPercent"},message:"must have required property '"+"compactionPercent"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(data.turnCredits === undefined){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "turnCredits"},message:"must have required property '"+"turnCredits"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.liveTurnsPerCaller === undefined){
const err13 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "liveTurnsPerCaller"},message:"must have required property '"+"liveTurnsPerCaller"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.turnTimeoutSeconds === undefined){
const err14 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "turnTimeoutSeconds"},message:"must have required property '"+"turnTimeoutSeconds"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.shutdownGraceSeconds === undefined){
const err15 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "shutdownGraceSeconds"},message:"must have required property '"+"shutdownGraceSeconds"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.taskTimeoutSeconds === undefined){
const err16 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "taskTimeoutSeconds"},message:"must have required property '"+"taskTimeoutSeconds"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.codeModeMaxWorkers === undefined){
const err17 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "codeModeMaxWorkers"},message:"must have required property '"+"codeModeMaxWorkers"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.approvalReview === undefined){
const err18 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "approvalReview"},message:"must have required property '"+"approvalReview"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.tasks === undefined){
const err19 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "tasks"},message:"must have required property '"+"tasks"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
for(const key0 in data){
if(!(func2.call(schema16.properties, key0))){
const err20 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
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
const err21 = {instancePath:instancePath+"/mongoUrl",schemaPath:"#/properties/mongoUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
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
const err22 = {instancePath:instancePath+"/port",schemaPath:"#/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
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
const err23 = {instancePath:instancePath+"/tmpDir",schemaPath:"#/properties/tmpDir/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
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
const err24 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
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
const err25 = {instancePath:instancePath+"/privateDirectoryUrl",schemaPath:"#/properties/privateDirectoryUrl/pattern",keyword:"pattern",params:{pattern: "^https?://"},message:"must match pattern \""+"^https?://"+"\""};
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
if(data.mcpPath !== undefined){
let data4 = data.mcpPath;
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
const err26 = {instancePath:instancePath+"/mcpPath",schemaPath:"#/properties/mcpPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(coerced4 !== undefined){
data4 = coerced4;
if(data !== undefined){
data["mcpPath"] = coerced4;
}
}
}
if(typeof data4 === "string"){
if(!pattern1.test(data4)){
const err27 = {instancePath:instancePath+"/mcpPath",schemaPath:"#/properties/mcpPath/pattern",keyword:"pattern",params:{pattern: "^/"},message:"must match pattern \""+"^/"+"\""};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
}
if(data.privateEventsUrl !== undefined){
let data5 = data.privateEventsUrl;
if(typeof data5 !== "string"){
let dataType5 = typeof data5;
let coerced5 = undefined;
if(dataType5 == 'object' && Array.isArray(data5) && data5.length == 1){
data5 = data5[0];
dataType5 = typeof data5;
if(typeof data5 === "string"){
coerced5 = data5;
}
}
if(!(coerced5 !== undefined)){
if(dataType5 == "number" || dataType5 == "boolean"){
coerced5 = "" + data5;
}
else if(data5 === null){
coerced5 = "";
}
else {
const err28 = {instancePath:instancePath+"/privateEventsUrl",schemaPath:"#/properties/privateEventsUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(coerced5 !== undefined){
data5 = coerced5;
if(data !== undefined){
data["privateEventsUrl"] = coerced5;
}
}
}
}
if(data.privateMcpUrl !== undefined){
let data6 = data.privateMcpUrl;
if(typeof data6 !== "string"){
let dataType6 = typeof data6;
let coerced6 = undefined;
if(dataType6 == 'object' && Array.isArray(data6) && data6.length == 1){
data6 = data6[0];
dataType6 = typeof data6;
if(typeof data6 === "string"){
coerced6 = data6;
}
}
if(!(coerced6 !== undefined)){
if(dataType6 == "number" || dataType6 == "boolean"){
coerced6 = "" + data6;
}
else if(data6 === null){
coerced6 = "";
}
else {
const err29 = {instancePath:instancePath+"/privateMcpUrl",schemaPath:"#/properties/privateMcpUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(coerced6 !== undefined){
data6 = coerced6;
if(data !== undefined){
data["privateMcpUrl"] = coerced6;
}
}
}
if(typeof data6 === "string"){
if(!pattern0.test(data6)){
const err30 = {instancePath:instancePath+"/privateMcpUrl",schemaPath:"#/properties/privateMcpUrl/pattern",keyword:"pattern",params:{pattern: "^https?://"},message:"must match pattern \""+"^https?://"+"\""};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
}
if(data.secretKeys !== undefined){
let data7 = data.secretKeys;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
for(const key1 in data7){
if(!((key1 === "events") || (key1 === "limits"))){
const err31 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data7.events !== undefined){
let data8 = data7.events;
if(typeof data8 !== "string"){
let dataType7 = typeof data8;
let coerced7 = undefined;
if(dataType7 == 'object' && Array.isArray(data8) && data8.length == 1){
data8 = data8[0];
dataType7 = typeof data8;
if(typeof data8 === "string"){
coerced7 = data8;
}
}
if(!(coerced7 !== undefined)){
if(dataType7 == "number" || dataType7 == "boolean"){
coerced7 = "" + data8;
}
else if(data8 === null){
coerced7 = "";
}
else {
const err32 = {instancePath:instancePath+"/secretKeys/events",schemaPath:"#/properties/secretKeys/properties/events/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(coerced7 !== undefined){
data8 = coerced7;
if(data7 !== undefined){
data7["events"] = coerced7;
}
}
}
}
if(data7.limits !== undefined){
let data9 = data7.limits;
if(typeof data9 !== "string"){
let dataType8 = typeof data9;
let coerced8 = undefined;
if(dataType8 == 'object' && Array.isArray(data9) && data9.length == 1){
data9 = data9[0];
dataType8 = typeof data9;
if(typeof data9 === "string"){
coerced8 = data9;
}
}
if(!(coerced8 !== undefined)){
if(dataType8 == "number" || dataType8 == "boolean"){
coerced8 = "" + data9;
}
else if(data9 === null){
coerced8 = "";
}
else {
const err33 = {instancePath:instancePath+"/secretKeys/limits",schemaPath:"#/properties/secretKeys/properties/limits/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(coerced8 !== undefined){
data9 = coerced8;
if(data7 !== undefined){
data7["limits"] = coerced8;
}
}
}
}
}
else {
const err34 = {instancePath:instancePath+"/secretKeys",schemaPath:"#/properties/secretKeys/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data.providers !== undefined){
let data10 = data.providers;
if(!(Array.isArray(data10))){
let dataType9 = typeof data10;
let coerced9 = undefined;
if(dataType9 == 'object' && Array.isArray(data10) && data10.length == 1){
data10 = data10[0];
dataType9 = typeof data10;
if(Array.isArray(data10)){
coerced9 = data10;
}
}
if(!(coerced9 !== undefined)){
if(dataType9 === "string" || dataType9 === "number"
              || dataType9 === "boolean" || data10 === null){
coerced9 = [data10];
}
else {
const err35 = {instancePath:instancePath+"/providers",schemaPath:"#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(coerced9 !== undefined){
data10 = coerced9;
if(data !== undefined){
data["providers"] = coerced9;
}
}
}
if(Array.isArray(data10)){
const len0 = data10.length;
for(let i0=0; i0<len0; i0++){
let data11 = data10[i0];
if(data11 && typeof data11 == "object" && !Array.isArray(data11)){
if(data11.type === undefined){
const err36 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data11.id === undefined){
const err37 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data11.name === undefined){
const err38 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
for(const key2 in data11){
if(!((((((((key2 === "type") || (key2 === "id")) || (key2 === "name")) || (key2 === "enabled")) || (key2 === "apiKey")) || (key2 === "baseURL")) || (key2 === "projectId")) || (key2 === "compatibility"))){
const err39 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data11.type !== undefined){
let data12 = data11.type;
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
const err40 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(coerced10 !== undefined){
data12 = coerced10;
if(data11 !== undefined){
data11["type"] = coerced10;
}
}
}
if(!(((((((((data12 === "openai") || (data12 === "anthropic")) || (data12 === "google")) || (data12 === "mistral")) || (data12 === "openrouter")) || (data12 === "ollama")) || (data12 === "scaleway")) || (data12 === "openai-compatible")) || (data12 === "mock"))){
const err41 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/properties/type/enum",keyword:"enum",params:{allowedValues: schema16.properties.providers.items.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data11.id !== undefined){
let data13 = data11.id;
if(typeof data13 !== "string"){
let dataType11 = typeof data13;
let coerced11 = undefined;
if(dataType11 == 'object' && Array.isArray(data13) && data13.length == 1){
data13 = data13[0];
dataType11 = typeof data13;
if(typeof data13 === "string"){
coerced11 = data13;
}
}
if(!(coerced11 !== undefined)){
if(dataType11 == "number" || dataType11 == "boolean"){
coerced11 = "" + data13;
}
else if(data13 === null){
coerced11 = "";
}
else {
const err42 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(coerced11 !== undefined){
data13 = coerced11;
if(data11 !== undefined){
data11["id"] = coerced11;
}
}
}
}
if(data11.name !== undefined){
let data14 = data11.name;
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
const err43 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(coerced12 !== undefined){
data14 = coerced12;
if(data11 !== undefined){
data11["name"] = coerced12;
}
}
}
}
if(data11.enabled !== undefined){
let data15 = data11.enabled;
if(typeof data15 !== "boolean"){
let dataType13 = typeof data15;
let coerced13 = undefined;
if(dataType13 == 'object' && Array.isArray(data15) && data15.length == 1){
data15 = data15[0];
dataType13 = typeof data15;
if(typeof data15 === "boolean"){
coerced13 = data15;
}
}
if(!(coerced13 !== undefined)){
if(data15 === "false" || data15 === 0 || data15 === null){
coerced13 = false;
}
else if(data15 === "true" || data15 === 1){
coerced13 = true;
}
else {
const err44 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(coerced13 !== undefined){
data15 = coerced13;
if(data11 !== undefined){
data11["enabled"] = coerced13;
}
}
}
}
if(data11.apiKey !== undefined){
let data16 = data11.apiKey;
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
const err45 = {instancePath:instancePath+"/providers/" + i0+"/apiKey",schemaPath:"#/properties/providers/items/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(coerced14 !== undefined){
data16 = coerced14;
if(data11 !== undefined){
data11["apiKey"] = coerced14;
}
}
}
}
if(data11.baseURL !== undefined){
let data17 = data11.baseURL;
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
const err46 = {instancePath:instancePath+"/providers/" + i0+"/baseURL",schemaPath:"#/properties/providers/items/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(coerced15 !== undefined){
data17 = coerced15;
if(data11 !== undefined){
data11["baseURL"] = coerced15;
}
}
}
}
if(data11.projectId !== undefined){
let data18 = data11.projectId;
if(typeof data18 !== "string"){
let dataType16 = typeof data18;
let coerced16 = undefined;
if(dataType16 == 'object' && Array.isArray(data18) && data18.length == 1){
data18 = data18[0];
dataType16 = typeof data18;
if(typeof data18 === "string"){
coerced16 = data18;
}
}
if(!(coerced16 !== undefined)){
if(dataType16 == "number" || dataType16 == "boolean"){
coerced16 = "" + data18;
}
else if(data18 === null){
coerced16 = "";
}
else {
const err47 = {instancePath:instancePath+"/providers/" + i0+"/projectId",schemaPath:"#/properties/providers/items/properties/projectId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(coerced16 !== undefined){
data18 = coerced16;
if(data11 !== undefined){
data11["projectId"] = coerced16;
}
}
}
}
if(data11.compatibility !== undefined){
let data19 = data11.compatibility;
if(typeof data19 !== "string"){
let dataType17 = typeof data19;
let coerced17 = undefined;
if(dataType17 == 'object' && Array.isArray(data19) && data19.length == 1){
data19 = data19[0];
dataType17 = typeof data19;
if(typeof data19 === "string"){
coerced17 = data19;
}
}
if(!(coerced17 !== undefined)){
if(dataType17 == "number" || dataType17 == "boolean"){
coerced17 = "" + data19;
}
else if(data19 === null){
coerced17 = "";
}
else {
const err48 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/properties/compatibility/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(coerced17 !== undefined){
data19 = coerced17;
if(data11 !== undefined){
data11["compatibility"] = coerced17;
}
}
}
if(!((data19 === "default") || (data19 === "compatible"))){
const err49 = {instancePath:instancePath+"/providers/" + i0+"/compatibility",schemaPath:"#/properties/providers/items/properties/compatibility/enum",keyword:"enum",params:{allowedValues: schema16.properties.providers.items.properties.compatibility.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
}
else {
const err50 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
}
}
if(data.models !== undefined){
let data20 = data.models;
if(!(Array.isArray(data20))){
let dataType18 = typeof data20;
let coerced18 = undefined;
if(dataType18 == 'object' && Array.isArray(data20) && data20.length == 1){
data20 = data20[0];
dataType18 = typeof data20;
if(Array.isArray(data20)){
coerced18 = data20;
}
}
if(!(coerced18 !== undefined)){
if(dataType18 === "string" || dataType18 === "number"
              || dataType18 === "boolean" || data20 === null){
coerced18 = [data20];
}
else {
const err51 = {instancePath:instancePath+"/models",schemaPath:"#/properties/models/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(coerced18 !== undefined){
data20 = coerced18;
if(data !== undefined){
data["models"] = coerced18;
}
}
}
if(Array.isArray(data20)){
const len1 = data20.length;
for(let i1=0; i1<len1; i1++){
let data21 = data20[i1];
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(data21.id === undefined){
const err52 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(data21.name === undefined){
const err53 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(data21.provider === undefined){
const err54 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(data21.usage === undefined){
const err55 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "usage"},message:"must have required property '"+"usage"+"'"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(data21.inputPricePerMillion === undefined){
const err56 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "inputPricePerMillion"},message:"must have required property '"+"inputPricePerMillion"+"'"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data21.outputPricePerMillion === undefined){
const err57 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/required",keyword:"required",params:{missingProperty: "outputPricePerMillion"},message:"must have required property '"+"outputPricePerMillion"+"'"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
for(const key3 in data21){
if(!(func2.call(schema16.properties.models.items.properties, key3))){
const err58 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data21.id !== undefined){
let data22 = data21.id;
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
const err59 = {instancePath:instancePath+"/models/" + i1+"/id",schemaPath:"#/properties/models/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(coerced19 !== undefined){
data22 = coerced19;
if(data21 !== undefined){
data21["id"] = coerced19;
}
}
}
}
if(data21.name !== undefined){
let data23 = data21.name;
if(typeof data23 !== "string"){
let dataType20 = typeof data23;
let coerced20 = undefined;
if(dataType20 == 'object' && Array.isArray(data23) && data23.length == 1){
data23 = data23[0];
dataType20 = typeof data23;
if(typeof data23 === "string"){
coerced20 = data23;
}
}
if(!(coerced20 !== undefined)){
if(dataType20 == "number" || dataType20 == "boolean"){
coerced20 = "" + data23;
}
else if(data23 === null){
coerced20 = "";
}
else {
const err60 = {instancePath:instancePath+"/models/" + i1+"/name",schemaPath:"#/properties/models/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
if(coerced20 !== undefined){
data23 = coerced20;
if(data21 !== undefined){
data21["name"] = coerced20;
}
}
}
}
if(data21.provider !== undefined){
let data24 = data21.provider;
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
const err61 = {instancePath:instancePath+"/models/" + i1+"/provider",schemaPath:"#/properties/models/items/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(coerced21 !== undefined){
data24 = coerced21;
if(data21 !== undefined){
data21["provider"] = coerced21;
}
}
}
}
if(data21.usage !== undefined){
let data25 = data21.usage;
if(!(Array.isArray(data25))){
let dataType22 = typeof data25;
let coerced22 = undefined;
if(dataType22 == 'object' && Array.isArray(data25) && data25.length == 1){
data25 = data25[0];
dataType22 = typeof data25;
if(Array.isArray(data25)){
coerced22 = data25;
}
}
if(!(coerced22 !== undefined)){
if(dataType22 === "string" || dataType22 === "number"
              || dataType22 === "boolean" || data25 === null){
coerced22 = [data25];
}
else {
const err62 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
if(coerced22 !== undefined){
data25 = coerced22;
if(data21 !== undefined){
data21["usage"] = coerced22;
}
}
}
if(Array.isArray(data25)){
if(data25.length < 1){
const err63 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
const len2 = data25.length;
for(let i2=0; i2<len2; i2++){
let data26 = data25[i2];
if(typeof data26 !== "string"){
let dataType23 = typeof data26;
let coerced23 = undefined;
if(dataType23 == 'object' && Array.isArray(data26) && data26.length == 1){
data26 = data26[0];
dataType23 = typeof data26;
if(typeof data26 === "string"){
coerced23 = data26;
}
}
if(!(coerced23 !== undefined)){
if(dataType23 == "number" || dataType23 == "boolean"){
coerced23 = "" + data26;
}
else if(data26 === null){
coerced23 = "";
}
else {
const err64 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
if(coerced23 !== undefined){
data26 = coerced23;
if(data25 !== undefined){
data25[i2] = coerced23;
}
}
}
if(!(((data26 === "assistant") || (data26 === "summarizer")) || (data26 === "moderator"))){
const err65 = {instancePath:instancePath+"/models/" + i1+"/usage/" + i2,schemaPath:"#/properties/models/items/properties/usage/items/enum",keyword:"enum",params:{allowedValues: schema16.properties.models.items.properties.usage.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
let i3 = data25.length;
let j0;
if(i3 > 1){
const indices0 = {};
for(;i3--;){
let item0 = data25[i3];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err66 = {instancePath:instancePath+"/models/" + i1+"/usage",schemaPath:"#/properties/models/items/properties/usage/uniqueItems",keyword:"uniqueItems",params:{i: i3, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i3+" are identical)"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
break;
}
indices0[item0] = i3;
}
}
}
}
if(data21.contextWindow !== undefined){
let data27 = data21.contextWindow;
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
const err67 = {instancePath:instancePath+"/models/" + i1+"/contextWindow",schemaPath:"#/properties/models/items/properties/contextWindow/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(coerced24 !== undefined){
data27 = coerced24;
if(data21 !== undefined){
data21["contextWindow"] = coerced24;
}
}
}
if(typeof data27 == "number"){
if(data27 < 0 || isNaN(data27)){
const err68 = {instancePath:instancePath+"/models/" + i1+"/contextWindow",schemaPath:"#/properties/models/items/properties/contextWindow/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data21.imageInput !== undefined){
let data28 = data21.imageInput;
if(typeof data28 !== "boolean"){
let dataType25 = typeof data28;
let coerced25 = undefined;
if(dataType25 == 'object' && Array.isArray(data28) && data28.length == 1){
data28 = data28[0];
dataType25 = typeof data28;
if(typeof data28 === "boolean"){
coerced25 = data28;
}
}
if(!(coerced25 !== undefined)){
if(data28 === "false" || data28 === 0 || data28 === null){
coerced25 = false;
}
else if(data28 === "true" || data28 === 1){
coerced25 = true;
}
else {
const err69 = {instancePath:instancePath+"/models/" + i1+"/imageInput",schemaPath:"#/properties/models/items/properties/imageInput/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(coerced25 !== undefined){
data28 = coerced25;
if(data21 !== undefined){
data21["imageInput"] = coerced25;
}
}
}
}
if(data21.inputPricePerMillion !== undefined){
let data29 = data21.inputPricePerMillion;
if(!(typeof data29 == "number")){
let dataType26 = typeof data29;
let coerced26 = undefined;
if(dataType26 == 'object' && Array.isArray(data29) && data29.length == 1){
data29 = data29[0];
dataType26 = typeof data29;
if(typeof data29 == "number"){
coerced26 = data29;
}
}
if(!(coerced26 !== undefined)){
if(dataType26 == "boolean" || data29 === null
              || (dataType26 == "string" && data29 && data29 == +data29)){
coerced26 = +data29;
}
else {
const err70 = {instancePath:instancePath+"/models/" + i1+"/inputPricePerMillion",schemaPath:"#/properties/models/items/properties/inputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number"};
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
if(data21 !== undefined){
data21["inputPricePerMillion"] = coerced26;
}
}
}
if(typeof data29 == "number"){
if(data29 < 0 || isNaN(data29)){
const err71 = {instancePath:instancePath+"/models/" + i1+"/inputPricePerMillion",schemaPath:"#/properties/models/items/properties/inputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data21.outputPricePerMillion !== undefined){
let data30 = data21.outputPricePerMillion;
if(!(typeof data30 == "number")){
let dataType27 = typeof data30;
let coerced27 = undefined;
if(dataType27 == 'object' && Array.isArray(data30) && data30.length == 1){
data30 = data30[0];
dataType27 = typeof data30;
if(typeof data30 == "number"){
coerced27 = data30;
}
}
if(!(coerced27 !== undefined)){
if(dataType27 == "boolean" || data30 === null
              || (dataType27 == "string" && data30 && data30 == +data30)){
coerced27 = +data30;
}
else {
const err72 = {instancePath:instancePath+"/models/" + i1+"/outputPricePerMillion",schemaPath:"#/properties/models/items/properties/outputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(coerced27 !== undefined){
data30 = coerced27;
if(data21 !== undefined){
data21["outputPricePerMillion"] = coerced27;
}
}
}
if(typeof data30 == "number"){
if(data30 < 0 || isNaN(data30)){
const err73 = {instancePath:instancePath+"/models/" + i1+"/outputPricePerMillion",schemaPath:"#/properties/models/items/properties/outputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
}
if(data21.cachedInputPricePerMillion !== undefined){
let data31 = data21.cachedInputPricePerMillion;
if(!(typeof data31 == "number")){
let dataType28 = typeof data31;
let coerced28 = undefined;
if(dataType28 == 'object' && Array.isArray(data31) && data31.length == 1){
data31 = data31[0];
dataType28 = typeof data31;
if(typeof data31 == "number"){
coerced28 = data31;
}
}
if(!(coerced28 !== undefined)){
if(dataType28 == "boolean" || data31 === null
              || (dataType28 == "string" && data31 && data31 == +data31)){
coerced28 = +data31;
}
else {
const err74 = {instancePath:instancePath+"/models/" + i1+"/cachedInputPricePerMillion",schemaPath:"#/properties/models/items/properties/cachedInputPricePerMillion/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
if(coerced28 !== undefined){
data31 = coerced28;
if(data21 !== undefined){
data21["cachedInputPricePerMillion"] = coerced28;
}
}
}
if(typeof data31 == "number"){
if(data31 < 0 || isNaN(data31)){
const err75 = {instancePath:instancePath+"/models/" + i1+"/cachedInputPricePerMillion",schemaPath:"#/properties/models/items/properties/cachedInputPricePerMillion/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
}
}
else {
const err76 = {instancePath:instancePath+"/models/" + i1,schemaPath:"#/properties/models/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
}
}
if(data.mcpServers !== undefined){
let data32 = data.mcpServers;
if(!(Array.isArray(data32))){
let dataType29 = typeof data32;
let coerced29 = undefined;
if(dataType29 == 'object' && Array.isArray(data32) && data32.length == 1){
data32 = data32[0];
dataType29 = typeof data32;
if(Array.isArray(data32)){
coerced29 = data32;
}
}
if(!(coerced29 !== undefined)){
if(dataType29 === "string" || dataType29 === "number"
              || dataType29 === "boolean" || data32 === null){
coerced29 = [data32];
}
else {
const err77 = {instancePath:instancePath+"/mcpServers",schemaPath:"#/properties/mcpServers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(coerced29 !== undefined){
data32 = coerced29;
if(data !== undefined){
data["mcpServers"] = coerced29;
}
}
}
if(Array.isArray(data32)){
const len3 = data32.length;
for(let i4=0; i4<len3; i4++){
let data33 = data32[i4];
if(data33 && typeof data33 == "object" && !Array.isArray(data33)){
if(data33.id === undefined){
const err78 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
if(data33.name === undefined){
const err79 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(data33.url === undefined){
const err80 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "url"},message:"must have required property '"+"url"+"'"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if(data33.auth === undefined){
const err81 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "auth"},message:"must have required property '"+"auth"+"'"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
for(const key4 in data33){
if(!(((((((key4 === "id") || (key4 === "name")) || (key4 === "description")) || (key4 === "url")) || (key4 === "auth")) || (key4 === "apiKeyHeader")) || (key4 === "apiKey"))){
const err82 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
if(data33.id !== undefined){
let data34 = data33.id;
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
const err83 = {instancePath:instancePath+"/mcpServers/" + i4+"/id",schemaPath:"#/properties/mcpServers/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
}
if(coerced30 !== undefined){
data34 = coerced30;
if(data33 !== undefined){
data33["id"] = coerced30;
}
}
}
}
if(data33.name !== undefined){
let data35 = data33.name;
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
const err84 = {instancePath:instancePath+"/mcpServers/" + i4+"/name",schemaPath:"#/properties/mcpServers/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
if(coerced31 !== undefined){
data35 = coerced31;
if(data33 !== undefined){
data33["name"] = coerced31;
}
}
}
}
if(data33.description !== undefined){
let data36 = data33.description;
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
const err85 = {instancePath:instancePath+"/mcpServers/" + i4+"/description",schemaPath:"#/properties/mcpServers/items/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(coerced32 !== undefined){
data36 = coerced32;
if(data33 !== undefined){
data33["description"] = coerced32;
}
}
}
}
if(data33.url !== undefined){
let data37 = data33.url;
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
const err86 = {instancePath:instancePath+"/mcpServers/" + i4+"/url",schemaPath:"#/properties/mcpServers/items/properties/url/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
data37 = coerced33;
if(data33 !== undefined){
data33["url"] = coerced33;
}
}
}
}
if(data33.auth !== undefined){
let data38 = data33.auth;
if(typeof data38 !== "string"){
let dataType34 = typeof data38;
let coerced34 = undefined;
if(dataType34 == 'object' && Array.isArray(data38) && data38.length == 1){
data38 = data38[0];
dataType34 = typeof data38;
if(typeof data38 === "string"){
coerced34 = data38;
}
}
if(!(coerced34 !== undefined)){
if(dataType34 == "number" || dataType34 == "boolean"){
coerced34 = "" + data38;
}
else if(data38 === null){
coerced34 = "";
}
else {
const err87 = {instancePath:instancePath+"/mcpServers/" + i4+"/auth",schemaPath:"#/properties/mcpServers/items/properties/auth/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
data38 = coerced34;
if(data33 !== undefined){
data33["auth"] = coerced34;
}
}
}
if(!(((data38 === "nhi-session") || (data38 === "none")) || (data38 === "apiKey"))){
const err88 = {instancePath:instancePath+"/mcpServers/" + i4+"/auth",schemaPath:"#/properties/mcpServers/items/properties/auth/enum",keyword:"enum",params:{allowedValues: schema16.properties.mcpServers.items.properties.auth.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
if(data33.apiKeyHeader !== undefined){
let data39 = data33.apiKeyHeader;
if(typeof data39 !== "string"){
let dataType35 = typeof data39;
let coerced35 = undefined;
if(dataType35 == 'object' && Array.isArray(data39) && data39.length == 1){
data39 = data39[0];
dataType35 = typeof data39;
if(typeof data39 === "string"){
coerced35 = data39;
}
}
if(!(coerced35 !== undefined)){
if(dataType35 == "number" || dataType35 == "boolean"){
coerced35 = "" + data39;
}
else if(data39 === null){
coerced35 = "";
}
else {
const err89 = {instancePath:instancePath+"/mcpServers/" + i4+"/apiKeyHeader",schemaPath:"#/properties/mcpServers/items/properties/apiKeyHeader/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
if(coerced35 !== undefined){
data39 = coerced35;
if(data33 !== undefined){
data33["apiKeyHeader"] = coerced35;
}
}
}
}
if(data33.apiKey !== undefined){
let data40 = data33.apiKey;
if(typeof data40 !== "string"){
let dataType36 = typeof data40;
let coerced36 = undefined;
if(dataType36 == 'object' && Array.isArray(data40) && data40.length == 1){
data40 = data40[0];
dataType36 = typeof data40;
if(typeof data40 === "string"){
coerced36 = data40;
}
}
if(!(coerced36 !== undefined)){
if(dataType36 == "number" || dataType36 == "boolean"){
coerced36 = "" + data40;
}
else if(data40 === null){
coerced36 = "";
}
else {
const err90 = {instancePath:instancePath+"/mcpServers/" + i4+"/apiKey",schemaPath:"#/properties/mcpServers/items/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
if(coerced36 !== undefined){
data40 = coerced36;
if(data33 !== undefined){
data33["apiKey"] = coerced36;
}
}
}
}
}
else {
const err91 = {instancePath:instancePath+"/mcpServers/" + i4,schemaPath:"#/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
}
}
if(data.personalAssistants !== undefined){
let data41 = data.personalAssistants;
if(data41 && typeof data41 == "object" && !Array.isArray(data41)){
for(const key5 in data41){
if(!((key5 === "portal") || (key5 === "backOffice"))){
const err92 = {instancePath:instancePath+"/personalAssistants",schemaPath:"#/properties/personalAssistants/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
if(data41.portal !== undefined){
let data42 = data41.portal;
if(data42 && typeof data42 == "object" && !Array.isArray(data42)){
for(const key6 in data42){
if(!(key6 === "mcpServers")){
const err93 = {instancePath:instancePath+"/personalAssistants/portal",schemaPath:"#/properties/personalAssistants/properties/portal/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
}
if(data42.mcpServers !== undefined){
let data43 = data42.mcpServers;
if(!(Array.isArray(data43))){
let dataType37 = typeof data43;
let coerced37 = undefined;
if(dataType37 == 'object' && Array.isArray(data43) && data43.length == 1){
data43 = data43[0];
dataType37 = typeof data43;
if(Array.isArray(data43)){
coerced37 = data43;
}
}
if(!(coerced37 !== undefined)){
if(dataType37 === "string" || dataType37 === "number"
              || dataType37 === "boolean" || data43 === null){
coerced37 = [data43];
}
else {
const err94 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers",schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
data43 = coerced37;
if(data42 !== undefined){
data42["mcpServers"] = coerced37;
}
}
}
if(Array.isArray(data43)){
const len4 = data43.length;
for(let i5=0; i5<len4; i5++){
let data44 = data43[i5];
if(data44 && typeof data44 == "object" && !Array.isArray(data44)){
if(data44.serverId === undefined){
const err95 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers/" + i5,schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "serverId"},message:"must have required property '"+"serverId"+"'"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
for(const key7 in data44){
if(!((key7 === "serverId") || (key7 === "toolFilter"))){
const err96 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers/" + i5,schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
}
if(data44.serverId !== undefined){
let data45 = data44.serverId;
if(typeof data45 !== "string"){
let dataType38 = typeof data45;
let coerced38 = undefined;
if(dataType38 == 'object' && Array.isArray(data45) && data45.length == 1){
data45 = data45[0];
dataType38 = typeof data45;
if(typeof data45 === "string"){
coerced38 = data45;
}
}
if(!(coerced38 !== undefined)){
if(dataType38 == "number" || dataType38 == "boolean"){
coerced38 = "" + data45;
}
else if(data45 === null){
coerced38 = "";
}
else {
const err97 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers/" + i5+"/serverId",schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/items/properties/serverId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
if(coerced38 !== undefined){
data45 = coerced38;
if(data44 !== undefined){
data44["serverId"] = coerced38;
}
}
}
}
if(data44.toolFilter !== undefined){
let data46 = data44.toolFilter;
if(!(Array.isArray(data46))){
let dataType39 = typeof data46;
let coerced39 = undefined;
if(dataType39 == 'object' && Array.isArray(data46) && data46.length == 1){
data46 = data46[0];
dataType39 = typeof data46;
if(Array.isArray(data46)){
coerced39 = data46;
}
}
if(!(coerced39 !== undefined)){
if(dataType39 === "string" || dataType39 === "number"
              || dataType39 === "boolean" || data46 === null){
coerced39 = [data46];
}
else {
const err98 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers/" + i5+"/toolFilter",schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/items/properties/toolFilter/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
if(coerced39 !== undefined){
data46 = coerced39;
if(data44 !== undefined){
data44["toolFilter"] = coerced39;
}
}
}
if(Array.isArray(data46)){
const len5 = data46.length;
for(let i6=0; i6<len5; i6++){
let data47 = data46[i6];
if(typeof data47 !== "string"){
let dataType40 = typeof data47;
let coerced40 = undefined;
if(dataType40 == 'object' && Array.isArray(data47) && data47.length == 1){
data47 = data47[0];
dataType40 = typeof data47;
if(typeof data47 === "string"){
coerced40 = data47;
}
}
if(!(coerced40 !== undefined)){
if(dataType40 == "number" || dataType40 == "boolean"){
coerced40 = "" + data47;
}
else if(data47 === null){
coerced40 = "";
}
else {
const err99 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers/" + i5+"/toolFilter/" + i6,schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
}
if(coerced40 !== undefined){
data47 = coerced40;
if(data46 !== undefined){
data46[i6] = coerced40;
}
}
}
}
}
}
}
else {
const err100 = {instancePath:instancePath+"/personalAssistants/portal/mcpServers/" + i5,schemaPath:"#/properties/personalAssistants/properties/portal/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
}
}
else {
const err101 = {instancePath:instancePath+"/personalAssistants/portal",schemaPath:"#/properties/personalAssistants/properties/portal/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
}
if(data41.backOffice !== undefined){
let data48 = data41.backOffice;
if(data48 && typeof data48 == "object" && !Array.isArray(data48)){
for(const key8 in data48){
if(!(key8 === "mcpServers")){
const err102 = {instancePath:instancePath+"/personalAssistants/backOffice",schemaPath:"#/properties/personalAssistants/properties/backOffice/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
}
if(data48.mcpServers !== undefined){
let data49 = data48.mcpServers;
if(!(Array.isArray(data49))){
let dataType41 = typeof data49;
let coerced41 = undefined;
if(dataType41 == 'object' && Array.isArray(data49) && data49.length == 1){
data49 = data49[0];
dataType41 = typeof data49;
if(Array.isArray(data49)){
coerced41 = data49;
}
}
if(!(coerced41 !== undefined)){
if(dataType41 === "string" || dataType41 === "number"
              || dataType41 === "boolean" || data49 === null){
coerced41 = [data49];
}
else {
const err103 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers",schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
if(coerced41 !== undefined){
data49 = coerced41;
if(data48 !== undefined){
data48["mcpServers"] = coerced41;
}
}
}
if(Array.isArray(data49)){
const len6 = data49.length;
for(let i7=0; i7<len6; i7++){
let data50 = data49[i7];
if(data50 && typeof data50 == "object" && !Array.isArray(data50)){
if(data50.serverId === undefined){
const err104 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers/" + i7,schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/items/required",keyword:"required",params:{missingProperty: "serverId"},message:"must have required property '"+"serverId"+"'"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
for(const key9 in data50){
if(!((key9 === "serverId") || (key9 === "toolFilter"))){
const err105 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers/" + i7,schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
}
if(data50.serverId !== undefined){
let data51 = data50.serverId;
if(typeof data51 !== "string"){
let dataType42 = typeof data51;
let coerced42 = undefined;
if(dataType42 == 'object' && Array.isArray(data51) && data51.length == 1){
data51 = data51[0];
dataType42 = typeof data51;
if(typeof data51 === "string"){
coerced42 = data51;
}
}
if(!(coerced42 !== undefined)){
if(dataType42 == "number" || dataType42 == "boolean"){
coerced42 = "" + data51;
}
else if(data51 === null){
coerced42 = "";
}
else {
const err106 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers/" + i7+"/serverId",schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/items/properties/serverId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
}
if(coerced42 !== undefined){
data51 = coerced42;
if(data50 !== undefined){
data50["serverId"] = coerced42;
}
}
}
}
if(data50.toolFilter !== undefined){
let data52 = data50.toolFilter;
if(!(Array.isArray(data52))){
let dataType43 = typeof data52;
let coerced43 = undefined;
if(dataType43 == 'object' && Array.isArray(data52) && data52.length == 1){
data52 = data52[0];
dataType43 = typeof data52;
if(Array.isArray(data52)){
coerced43 = data52;
}
}
if(!(coerced43 !== undefined)){
if(dataType43 === "string" || dataType43 === "number"
              || dataType43 === "boolean" || data52 === null){
coerced43 = [data52];
}
else {
const err107 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers/" + i7+"/toolFilter",schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/items/properties/toolFilter/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
}
if(coerced43 !== undefined){
data52 = coerced43;
if(data50 !== undefined){
data50["toolFilter"] = coerced43;
}
}
}
if(Array.isArray(data52)){
const len7 = data52.length;
for(let i8=0; i8<len7; i8++){
let data53 = data52[i8];
if(typeof data53 !== "string"){
let dataType44 = typeof data53;
let coerced44 = undefined;
if(dataType44 == 'object' && Array.isArray(data53) && data53.length == 1){
data53 = data53[0];
dataType44 = typeof data53;
if(typeof data53 === "string"){
coerced44 = data53;
}
}
if(!(coerced44 !== undefined)){
if(dataType44 == "number" || dataType44 == "boolean"){
coerced44 = "" + data53;
}
else if(data53 === null){
coerced44 = "";
}
else {
const err108 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers/" + i7+"/toolFilter/" + i8,schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/items/properties/toolFilter/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
}
if(coerced44 !== undefined){
data53 = coerced44;
if(data52 !== undefined){
data52[i8] = coerced44;
}
}
}
}
}
}
}
else {
const err109 = {instancePath:instancePath+"/personalAssistants/backOffice/mcpServers/" + i7,schemaPath:"#/properties/personalAssistants/properties/backOffice/properties/mcpServers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
}
}
}
}
else {
const err110 = {instancePath:instancePath+"/personalAssistants/backOffice",schemaPath:"#/properties/personalAssistants/properties/backOffice/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
}
}
else {
const err111 = {instancePath:instancePath+"/personalAssistants",schemaPath:"#/properties/personalAssistants/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
}
if(data.autonomousAgentsRequireAdminMode !== undefined){
let data54 = data.autonomousAgentsRequireAdminMode;
if(typeof data54 !== "boolean"){
let dataType45 = typeof data54;
let coerced45 = undefined;
if(dataType45 == 'object' && Array.isArray(data54) && data54.length == 1){
data54 = data54[0];
dataType45 = typeof data54;
if(typeof data54 === "boolean"){
coerced45 = data54;
}
}
if(!(coerced45 !== undefined)){
if(data54 === "false" || data54 === 0 || data54 === null){
coerced45 = false;
}
else if(data54 === "true" || data54 === 1){
coerced45 = true;
}
else {
const err112 = {instancePath:instancePath+"/autonomousAgentsRequireAdminMode",schemaPath:"#/properties/autonomousAgentsRequireAdminMode/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
}
if(coerced45 !== undefined){
data54 = coerced45;
if(data !== undefined){
data["autonomousAgentsRequireAdminMode"] = coerced45;
}
}
}
}
if(data.tasks !== undefined){
let data55 = data.tasks;
if(data55 && typeof data55 == "object" && !Array.isArray(data55)){
if(data55.minIntervalSeconds === undefined){
const err113 = {instancePath:instancePath+"/tasks",schemaPath:"#/properties/tasks/required",keyword:"required",params:{missingProperty: "minIntervalSeconds"},message:"must have required property '"+"minIntervalSeconds"+"'"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
if(data55.maxPerAgent === undefined){
const err114 = {instancePath:instancePath+"/tasks",schemaPath:"#/properties/tasks/required",keyword:"required",params:{missingProperty: "maxPerAgent"},message:"must have required property '"+"maxPerAgent"+"'"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
if(data55.pollSeconds === undefined){
const err115 = {instancePath:instancePath+"/tasks",schemaPath:"#/properties/tasks/required",keyword:"required",params:{missingProperty: "pollSeconds"},message:"must have required property '"+"pollSeconds"+"'"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
if(data55.maxConsecutiveFailures === undefined){
const err116 = {instancePath:instancePath+"/tasks",schemaPath:"#/properties/tasks/required",keyword:"required",params:{missingProperty: "maxConsecutiveFailures"},message:"must have required property '"+"maxConsecutiveFailures"+"'"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
for(const key10 in data55){
if(!((((key10 === "minIntervalSeconds") || (key10 === "maxPerAgent")) || (key10 === "pollSeconds")) || (key10 === "maxConsecutiveFailures"))){
const err117 = {instancePath:instancePath+"/tasks",schemaPath:"#/properties/tasks/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key10},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
if(data55.minIntervalSeconds !== undefined){
let data56 = data55.minIntervalSeconds;
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
const err118 = {instancePath:instancePath+"/tasks/minIntervalSeconds",schemaPath:"#/properties/tasks/properties/minIntervalSeconds/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
}
if(coerced46 !== undefined){
data56 = coerced46;
if(data55 !== undefined){
data55["minIntervalSeconds"] = coerced46;
}
}
}
if(typeof data56 == "number"){
if(data56 < 60 || isNaN(data56)){
const err119 = {instancePath:instancePath+"/tasks/minIntervalSeconds",schemaPath:"#/properties/tasks/properties/minIntervalSeconds/minimum",keyword:"minimum",params:{comparison: ">=", limit: 60},message:"must be >= 60"};
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
if(data55.maxPerAgent !== undefined){
let data57 = data55.maxPerAgent;
if(!((typeof data57 == "number") && (!(data57 % 1) && !isNaN(data57)))){
let dataType47 = typeof data57;
let coerced47 = undefined;
if(dataType47 == 'object' && Array.isArray(data57) && data57.length == 1){
data57 = data57[0];
dataType47 = typeof data57;
if((typeof data57 == "number") && (!(data57 % 1) && !isNaN(data57))){
coerced47 = data57;
}
}
if(!(coerced47 !== undefined)){
if(dataType47 === "boolean" || data57 === null
              || (dataType47 === "string" && data57 && data57 == +data57 && !(data57 % 1))){
coerced47 = +data57;
}
else {
const err120 = {instancePath:instancePath+"/tasks/maxPerAgent",schemaPath:"#/properties/tasks/properties/maxPerAgent/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
}
if(coerced47 !== undefined){
data57 = coerced47;
if(data55 !== undefined){
data55["maxPerAgent"] = coerced47;
}
}
}
if(typeof data57 == "number"){
if(data57 < 1 || isNaN(data57)){
const err121 = {instancePath:instancePath+"/tasks/maxPerAgent",schemaPath:"#/properties/tasks/properties/maxPerAgent/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
}
}
if(data55.pollSeconds !== undefined){
let data58 = data55.pollSeconds;
if(!((typeof data58 == "number") && (!(data58 % 1) && !isNaN(data58)))){
let dataType48 = typeof data58;
let coerced48 = undefined;
if(dataType48 == 'object' && Array.isArray(data58) && data58.length == 1){
data58 = data58[0];
dataType48 = typeof data58;
if((typeof data58 == "number") && (!(data58 % 1) && !isNaN(data58))){
coerced48 = data58;
}
}
if(!(coerced48 !== undefined)){
if(dataType48 === "boolean" || data58 === null
              || (dataType48 === "string" && data58 && data58 == +data58 && !(data58 % 1))){
coerced48 = +data58;
}
else {
const err122 = {instancePath:instancePath+"/tasks/pollSeconds",schemaPath:"#/properties/tasks/properties/pollSeconds/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
}
if(coerced48 !== undefined){
data58 = coerced48;
if(data55 !== undefined){
data55["pollSeconds"] = coerced48;
}
}
}
if(typeof data58 == "number"){
if(data58 < 1 || isNaN(data58)){
const err123 = {instancePath:instancePath+"/tasks/pollSeconds",schemaPath:"#/properties/tasks/properties/pollSeconds/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data55.maxConsecutiveFailures !== undefined){
let data59 = data55.maxConsecutiveFailures;
if(!((typeof data59 == "number") && (!(data59 % 1) && !isNaN(data59)))){
let dataType49 = typeof data59;
let coerced49 = undefined;
if(dataType49 == 'object' && Array.isArray(data59) && data59.length == 1){
data59 = data59[0];
dataType49 = typeof data59;
if((typeof data59 == "number") && (!(data59 % 1) && !isNaN(data59))){
coerced49 = data59;
}
}
if(!(coerced49 !== undefined)){
if(dataType49 === "boolean" || data59 === null
              || (dataType49 === "string" && data59 && data59 == +data59 && !(data59 % 1))){
coerced49 = +data59;
}
else {
const err124 = {instancePath:instancePath+"/tasks/maxConsecutiveFailures",schemaPath:"#/properties/tasks/properties/maxConsecutiveFailures/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
}
if(coerced49 !== undefined){
data59 = coerced49;
if(data55 !== undefined){
data55["maxConsecutiveFailures"] = coerced49;
}
}
}
if(typeof data59 == "number"){
if(data59 < 1 || isNaN(data59)){
const err125 = {instancePath:instancePath+"/tasks/maxConsecutiveFailures",schemaPath:"#/properties/tasks/properties/maxConsecutiveFailures/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
}
}
}
else {
const err126 = {instancePath:instancePath+"/tasks",schemaPath:"#/properties/tasks/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
}
if(data.files !== undefined){
let data60 = data.files;
if(data60 && typeof data60 == "object" && !Array.isArray(data60)){
if(data60.storage === undefined){
const err127 = {instancePath:instancePath+"/files",schemaPath:"#/properties/files/required",keyword:"required",params:{missingProperty: "storage"},message:"must have required property '"+"storage"+"'"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
if(data60.secret === undefined){
const err128 = {instancePath:instancePath+"/files",schemaPath:"#/properties/files/required",keyword:"required",params:{missingProperty: "secret"},message:"must have required property '"+"secret"+"'"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
if(data60.publicUrl === undefined){
const err129 = {instancePath:instancePath+"/files",schemaPath:"#/properties/files/required",keyword:"required",params:{missingProperty: "publicUrl"},message:"must have required property '"+"publicUrl"+"'"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
for(const key11 in data60){
if(!(((((key11 === "storage") || (key11 === "dataDir")) || (key11 === "s3")) || (key11 === "secret")) || (key11 === "publicUrl"))){
const err130 = {instancePath:instancePath+"/files",schemaPath:"#/properties/files/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key11},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
}
if(data60.storage !== undefined){
let data61 = data60.storage;
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
const err131 = {instancePath:instancePath+"/files/storage",schemaPath:"#/properties/files/properties/storage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
if(coerced50 !== undefined){
data61 = coerced50;
if(data60 !== undefined){
data60["storage"] = coerced50;
}
}
}
if(!((data61 === "fs") || (data61 === "s3"))){
const err132 = {instancePath:instancePath+"/files/storage",schemaPath:"#/properties/files/properties/storage/enum",keyword:"enum",params:{allowedValues: schema16.properties.files.properties.storage.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
}
if(data60.dataDir !== undefined){
let data62 = data60.dataDir;
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
const err133 = {instancePath:instancePath+"/files/dataDir",schemaPath:"#/properties/files/properties/dataDir/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
}
if(coerced51 !== undefined){
data62 = coerced51;
if(data60 !== undefined){
data60["dataDir"] = coerced51;
}
}
}
}
if(data60.s3 !== undefined){
let data63 = data60.s3;
if(data63 && typeof data63 == "object" && !Array.isArray(data63)){
for(const key12 in data63){
if(!(((((key12 === "region") || (key12 === "endpoint")) || (key12 === "bucket")) || (key12 === "credentials")) || (key12 === "forcePathStyle"))){
const err134 = {instancePath:instancePath+"/files/s3",schemaPath:"#/properties/files/properties/s3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key12},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
}
if(data63.region !== undefined){
let data64 = data63.region;
if(typeof data64 !== "string"){
let dataType52 = typeof data64;
let coerced52 = undefined;
if(dataType52 == 'object' && Array.isArray(data64) && data64.length == 1){
data64 = data64[0];
dataType52 = typeof data64;
if(typeof data64 === "string"){
coerced52 = data64;
}
}
if(!(coerced52 !== undefined)){
if(dataType52 == "number" || dataType52 == "boolean"){
coerced52 = "" + data64;
}
else if(data64 === null){
coerced52 = "";
}
else {
const err135 = {instancePath:instancePath+"/files/s3/region",schemaPath:"#/properties/files/properties/s3/properties/region/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
}
if(coerced52 !== undefined){
data64 = coerced52;
if(data63 !== undefined){
data63["region"] = coerced52;
}
}
}
}
if(data63.endpoint !== undefined){
let data65 = data63.endpoint;
if(typeof data65 !== "string"){
let dataType53 = typeof data65;
let coerced53 = undefined;
if(dataType53 == 'object' && Array.isArray(data65) && data65.length == 1){
data65 = data65[0];
dataType53 = typeof data65;
if(typeof data65 === "string"){
coerced53 = data65;
}
}
if(!(coerced53 !== undefined)){
if(dataType53 == "number" || dataType53 == "boolean"){
coerced53 = "" + data65;
}
else if(data65 === null){
coerced53 = "";
}
else {
const err136 = {instancePath:instancePath+"/files/s3/endpoint",schemaPath:"#/properties/files/properties/s3/properties/endpoint/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
}
if(coerced53 !== undefined){
data65 = coerced53;
if(data63 !== undefined){
data63["endpoint"] = coerced53;
}
}
}
}
if(data63.bucket !== undefined){
let data66 = data63.bucket;
if(typeof data66 !== "string"){
let dataType54 = typeof data66;
let coerced54 = undefined;
if(dataType54 == 'object' && Array.isArray(data66) && data66.length == 1){
data66 = data66[0];
dataType54 = typeof data66;
if(typeof data66 === "string"){
coerced54 = data66;
}
}
if(!(coerced54 !== undefined)){
if(dataType54 == "number" || dataType54 == "boolean"){
coerced54 = "" + data66;
}
else if(data66 === null){
coerced54 = "";
}
else {
const err137 = {instancePath:instancePath+"/files/s3/bucket",schemaPath:"#/properties/files/properties/s3/properties/bucket/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
}
if(coerced54 !== undefined){
data66 = coerced54;
if(data63 !== undefined){
data63["bucket"] = coerced54;
}
}
}
}
if(data63.credentials !== undefined){
let data67 = data63.credentials;
if(data67 && typeof data67 == "object" && !Array.isArray(data67)){
for(const key13 in data67){
if(!((key13 === "accessKeyId") || (key13 === "secretAccessKey"))){
const err138 = {instancePath:instancePath+"/files/s3/credentials",schemaPath:"#/properties/files/properties/s3/properties/credentials/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key13},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
}
if(data67.accessKeyId !== undefined){
let data68 = data67.accessKeyId;
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
const err139 = {instancePath:instancePath+"/files/s3/credentials/accessKeyId",schemaPath:"#/properties/files/properties/s3/properties/credentials/properties/accessKeyId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
}
if(coerced55 !== undefined){
data68 = coerced55;
if(data67 !== undefined){
data67["accessKeyId"] = coerced55;
}
}
}
}
if(data67.secretAccessKey !== undefined){
let data69 = data67.secretAccessKey;
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
const err140 = {instancePath:instancePath+"/files/s3/credentials/secretAccessKey",schemaPath:"#/properties/files/properties/s3/properties/credentials/properties/secretAccessKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
}
if(coerced56 !== undefined){
data69 = coerced56;
if(data67 !== undefined){
data67["secretAccessKey"] = coerced56;
}
}
}
}
}
else {
const err141 = {instancePath:instancePath+"/files/s3/credentials",schemaPath:"#/properties/files/properties/s3/properties/credentials/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
}
if(data63.forcePathStyle !== undefined){
let data70 = data63.forcePathStyle;
if(typeof data70 !== "boolean"){
let dataType57 = typeof data70;
let coerced57 = undefined;
if(dataType57 == 'object' && Array.isArray(data70) && data70.length == 1){
data70 = data70[0];
dataType57 = typeof data70;
if(typeof data70 === "boolean"){
coerced57 = data70;
}
}
if(!(coerced57 !== undefined)){
if(data70 === "false" || data70 === 0 || data70 === null){
coerced57 = false;
}
else if(data70 === "true" || data70 === 1){
coerced57 = true;
}
else {
const err142 = {instancePath:instancePath+"/files/s3/forcePathStyle",schemaPath:"#/properties/files/properties/s3/properties/forcePathStyle/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
}
}
if(coerced57 !== undefined){
data70 = coerced57;
if(data63 !== undefined){
data63["forcePathStyle"] = coerced57;
}
}
}
}
}
else {
const err143 = {instancePath:instancePath+"/files/s3",schemaPath:"#/properties/files/properties/s3/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
}
if(data60.secret !== undefined){
let data71 = data60.secret;
if(typeof data71 !== "string"){
let dataType58 = typeof data71;
let coerced58 = undefined;
if(dataType58 == 'object' && Array.isArray(data71) && data71.length == 1){
data71 = data71[0];
dataType58 = typeof data71;
if(typeof data71 === "string"){
coerced58 = data71;
}
}
if(!(coerced58 !== undefined)){
if(dataType58 == "number" || dataType58 == "boolean"){
coerced58 = "" + data71;
}
else if(data71 === null){
coerced58 = "";
}
else {
const err144 = {instancePath:instancePath+"/files/secret",schemaPath:"#/properties/files/properties/secret/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
}
if(coerced58 !== undefined){
data71 = coerced58;
if(data60 !== undefined){
data60["secret"] = coerced58;
}
}
}
if(typeof data71 === "string"){
if(func4(data71) < 32){
const err145 = {instancePath:instancePath+"/files/secret",schemaPath:"#/properties/files/properties/secret/minLength",keyword:"minLength",params:{limit: 32},message:"must NOT have fewer than 32 characters"};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
}
}
if(data60.publicUrl !== undefined){
let data72 = data60.publicUrl;
if(typeof data72 !== "string"){
let dataType59 = typeof data72;
let coerced59 = undefined;
if(dataType59 == 'object' && Array.isArray(data72) && data72.length == 1){
data72 = data72[0];
dataType59 = typeof data72;
if(typeof data72 === "string"){
coerced59 = data72;
}
}
if(!(coerced59 !== undefined)){
if(dataType59 == "number" || dataType59 == "boolean"){
coerced59 = "" + data72;
}
else if(data72 === null){
coerced59 = "";
}
else {
const err146 = {instancePath:instancePath+"/files/publicUrl",schemaPath:"#/properties/files/properties/publicUrl/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
}
if(coerced59 !== undefined){
data72 = coerced59;
if(data60 !== undefined){
data60["publicUrl"] = coerced59;
}
}
}
if(typeof data72 === "string"){
if(!pattern0.test(data72)){
const err147 = {instancePath:instancePath+"/files/publicUrl",schemaPath:"#/properties/files/properties/publicUrl/pattern",keyword:"pattern",params:{pattern: "^https?://"},message:"must match pattern \""+"^https?://"+"\""};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
}
}
}
else {
const err148 = {instancePath:instancePath+"/files",schemaPath:"#/properties/files/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
}
if(data.defaultModels !== undefined){
let data73 = data.defaultModels;
if(data73 && typeof data73 == "object" && !Array.isArray(data73)){
for(const key14 in data73){
if(!(((key14 === "assistant") || (key14 === "summarizer")) || (key14 === "moderator"))){
const err149 = {instancePath:instancePath+"/defaultModels",schemaPath:"#/properties/defaultModels/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key14},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
}
if(data73.assistant !== undefined){
let data74 = data73.assistant;
if(data74 && typeof data74 == "object" && !Array.isArray(data74)){
if(data74.provider === undefined){
const err150 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err150];
}
else {
vErrors.push(err150);
}
errors++;
}
if(data74.id === undefined){
const err151 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
for(const key15 in data74){
if(!((key15 === "provider") || (key15 === "id"))){
const err152 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key15},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err152];
}
else {
vErrors.push(err152);
}
errors++;
}
}
if(data74.provider !== undefined){
let data75 = data74.provider;
if(typeof data75 !== "string"){
let dataType60 = typeof data75;
let coerced60 = undefined;
if(dataType60 == 'object' && Array.isArray(data75) && data75.length == 1){
data75 = data75[0];
dataType60 = typeof data75;
if(typeof data75 === "string"){
coerced60 = data75;
}
}
if(!(coerced60 !== undefined)){
if(dataType60 == "number" || dataType60 == "boolean"){
coerced60 = "" + data75;
}
else if(data75 === null){
coerced60 = "";
}
else {
const err153 = {instancePath:instancePath+"/defaultModels/assistant/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
data75 = coerced60;
if(data74 !== undefined){
data74["provider"] = coerced60;
}
}
}
}
if(data74.id !== undefined){
let data76 = data74.id;
if(typeof data76 !== "string"){
let dataType61 = typeof data76;
let coerced61 = undefined;
if(dataType61 == 'object' && Array.isArray(data76) && data76.length == 1){
data76 = data76[0];
dataType61 = typeof data76;
if(typeof data76 === "string"){
coerced61 = data76;
}
}
if(!(coerced61 !== undefined)){
if(dataType61 == "number" || dataType61 == "boolean"){
coerced61 = "" + data76;
}
else if(data76 === null){
coerced61 = "";
}
else {
const err154 = {instancePath:instancePath+"/defaultModels/assistant/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err154];
}
else {
vErrors.push(err154);
}
errors++;
}
}
if(coerced61 !== undefined){
data76 = coerced61;
if(data74 !== undefined){
data74["id"] = coerced61;
}
}
}
}
}
else {
const err155 = {instancePath:instancePath+"/defaultModels/assistant",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
}
if(data73.summarizer !== undefined){
let data77 = data73.summarizer;
if(data77 && typeof data77 == "object" && !Array.isArray(data77)){
if(data77.provider === undefined){
const err156 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
if(data77.id === undefined){
const err157 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
for(const key16 in data77){
if(!((key16 === "provider") || (key16 === "id"))){
const err158 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key16},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
}
if(data77.provider !== undefined){
let data78 = data77.provider;
if(typeof data78 !== "string"){
let dataType62 = typeof data78;
let coerced62 = undefined;
if(dataType62 == 'object' && Array.isArray(data78) && data78.length == 1){
data78 = data78[0];
dataType62 = typeof data78;
if(typeof data78 === "string"){
coerced62 = data78;
}
}
if(!(coerced62 !== undefined)){
if(dataType62 == "number" || dataType62 == "boolean"){
coerced62 = "" + data78;
}
else if(data78 === null){
coerced62 = "";
}
else {
const err159 = {instancePath:instancePath+"/defaultModels/summarizer/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
data78 = coerced62;
if(data77 !== undefined){
data77["provider"] = coerced62;
}
}
}
}
if(data77.id !== undefined){
let data79 = data77.id;
if(typeof data79 !== "string"){
let dataType63 = typeof data79;
let coerced63 = undefined;
if(dataType63 == 'object' && Array.isArray(data79) && data79.length == 1){
data79 = data79[0];
dataType63 = typeof data79;
if(typeof data79 === "string"){
coerced63 = data79;
}
}
if(!(coerced63 !== undefined)){
if(dataType63 == "number" || dataType63 == "boolean"){
coerced63 = "" + data79;
}
else if(data79 === null){
coerced63 = "";
}
else {
const err160 = {instancePath:instancePath+"/defaultModels/summarizer/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
}
if(coerced63 !== undefined){
data79 = coerced63;
if(data77 !== undefined){
data77["id"] = coerced63;
}
}
}
}
}
else {
const err161 = {instancePath:instancePath+"/defaultModels/summarizer",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
}
if(data73.moderator !== undefined){
let data80 = data73.moderator;
if(data80 && typeof data80 == "object" && !Array.isArray(data80)){
if(data80.provider === undefined){
const err162 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "provider"},message:"must have required property '"+"provider"+"'"};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
if(data80.id === undefined){
const err163 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
for(const key17 in data80){
if(!((key17 === "provider") || (key17 === "id"))){
const err164 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key17},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
}
if(data80.provider !== undefined){
let data81 = data80.provider;
if(typeof data81 !== "string"){
let dataType64 = typeof data81;
let coerced64 = undefined;
if(dataType64 == 'object' && Array.isArray(data81) && data81.length == 1){
data81 = data81[0];
dataType64 = typeof data81;
if(typeof data81 === "string"){
coerced64 = data81;
}
}
if(!(coerced64 !== undefined)){
if(dataType64 == "number" || dataType64 == "boolean"){
coerced64 = "" + data81;
}
else if(data81 === null){
coerced64 = "";
}
else {
const err165 = {instancePath:instancePath+"/defaultModels/moderator/provider",schemaPath:"#/$defs/modelRef/properties/provider/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
data81 = coerced64;
if(data80 !== undefined){
data80["provider"] = coerced64;
}
}
}
}
if(data80.id !== undefined){
let data82 = data80.id;
if(typeof data82 !== "string"){
let dataType65 = typeof data82;
let coerced65 = undefined;
if(dataType65 == 'object' && Array.isArray(data82) && data82.length == 1){
data82 = data82[0];
dataType65 = typeof data82;
if(typeof data82 === "string"){
coerced65 = data82;
}
}
if(!(coerced65 !== undefined)){
if(dataType65 == "number" || dataType65 == "boolean"){
coerced65 = "" + data82;
}
else if(data82 === null){
coerced65 = "";
}
else {
const err166 = {instancePath:instancePath+"/defaultModels/moderator/id",schemaPath:"#/$defs/modelRef/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
}
if(coerced65 !== undefined){
data82 = coerced65;
if(data80 !== undefined){
data80["id"] = coerced65;
}
}
}
}
}
else {
const err167 = {instancePath:instancePath+"/defaultModels/moderator",schemaPath:"#/$defs/modelRef/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
}
}
else {
const err168 = {instancePath:instancePath+"/defaultModels",schemaPath:"#/properties/defaultModels/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
}
if(data.eurosPerCredit !== undefined){
let data83 = data.eurosPerCredit;
if(!(typeof data83 == "number")){
let dataType66 = typeof data83;
let coerced66 = undefined;
if(dataType66 == 'object' && Array.isArray(data83) && data83.length == 1){
data83 = data83[0];
dataType66 = typeof data83;
if(typeof data83 == "number"){
coerced66 = data83;
}
}
if(!(coerced66 !== undefined)){
if(dataType66 == "boolean" || data83 === null
              || (dataType66 == "string" && data83 && data83 == +data83)){
coerced66 = +data83;
}
else {
const err169 = {instancePath:instancePath+"/eurosPerCredit",schemaPath:"#/properties/eurosPerCredit/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
}
if(coerced66 !== undefined){
data83 = coerced66;
if(data !== undefined){
data["eurosPerCredit"] = coerced66;
}
}
}
if(typeof data83 == "number"){
if(data83 <= 0 || isNaN(data83)){
const err170 = {instancePath:instancePath+"/eurosPerCredit",schemaPath:"#/properties/eurosPerCredit/exclusiveMinimum",keyword:"exclusiveMinimum",params:{comparison: ">", limit: 0},message:"must be > 0"};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
}
}
if(data.defaultLimits !== undefined){
let data84 = data.defaultLimits;
if(data84 && typeof data84 == "object" && !Array.isArray(data84)){
for(const key18 in data84){
if(!(key18 === "credits")){
const err171 = {instancePath:instancePath+"/defaultLimits",schemaPath:"#/properties/defaultLimits/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key18},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
}
if(data84.credits !== undefined){
let data85 = data84.credits;
if(!(typeof data85 == "number")){
let dataType67 = typeof data85;
let coerced67 = undefined;
if(dataType67 == 'object' && Array.isArray(data85) && data85.length == 1){
data85 = data85[0];
dataType67 = typeof data85;
if(typeof data85 == "number"){
coerced67 = data85;
}
}
if(!(coerced67 !== undefined)){
if(dataType67 == "boolean" || data85 === null
              || (dataType67 == "string" && data85 && data85 == +data85)){
coerced67 = +data85;
}
else {
const err172 = {instancePath:instancePath+"/defaultLimits/credits",schemaPath:"#/properties/defaultLimits/properties/credits/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err172];
}
else {
vErrors.push(err172);
}
errors++;
}
}
if(coerced67 !== undefined){
data85 = coerced67;
if(data84 !== undefined){
data84["credits"] = coerced67;
}
}
}
}
}
else {
const err173 = {instancePath:instancePath+"/defaultLimits",schemaPath:"#/properties/defaultLimits/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
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
let dataType68 = typeof data87;
let coerced68 = undefined;
if(dataType68 == 'object' && Array.isArray(data87) && data87.length == 1){
data87 = data87[0];
dataType68 = typeof data87;
if(typeof data87 === "boolean"){
coerced68 = data87;
}
}
if(!(coerced68 !== undefined)){
if(data87 === "false" || data87 === 0 || data87 === null){
coerced68 = false;
}
else if(data87 === "true" || data87 === 1){
coerced68 = true;
}
else {
const err174 = {instancePath:instancePath+"/observer/active",schemaPath:"#/properties/observer/properties/active/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
data87 = coerced68;
if(data86 !== undefined){
data86["active"] = coerced68;
}
}
}
}
if(data86.port !== undefined){
let data88 = data86.port;
if(!(typeof data88 == "number")){
let dataType69 = typeof data88;
let coerced69 = undefined;
if(dataType69 == 'object' && Array.isArray(data88) && data88.length == 1){
data88 = data88[0];
dataType69 = typeof data88;
if(typeof data88 == "number"){
coerced69 = data88;
}
}
if(!(coerced69 !== undefined)){
if(dataType69 == "boolean" || data88 === null
              || (dataType69 == "string" && data88 && data88 == +data88)){
coerced69 = +data88;
}
else {
const err175 = {instancePath:instancePath+"/observer/port",schemaPath:"#/properties/observer/properties/port/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
}
if(coerced69 !== undefined){
data88 = coerced69;
if(data86 !== undefined){
data86["port"] = coerced69;
}
}
}
}
}
else {
const err176 = {instancePath:instancePath+"/observer",schemaPath:"#/properties/observer/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err176];
}
else {
vErrors.push(err176);
}
errors++;
}
}
if(data.upgradeRoot !== undefined){
let data89 = data.upgradeRoot;
if(typeof data89 !== "string"){
let dataType70 = typeof data89;
let coerced70 = undefined;
if(dataType70 == 'object' && Array.isArray(data89) && data89.length == 1){
data89 = data89[0];
dataType70 = typeof data89;
if(typeof data89 === "string"){
coerced70 = data89;
}
}
if(!(coerced70 !== undefined)){
if(dataType70 == "number" || dataType70 == "boolean"){
coerced70 = "" + data89;
}
else if(data89 === null){
coerced70 = "";
}
else {
const err177 = {instancePath:instancePath+"/upgradeRoot",schemaPath:"#/properties/upgradeRoot/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
data89 = coerced70;
if(data !== undefined){
data["upgradeRoot"] = coerced70;
}
}
}
}
if(data.cipherPassword !== undefined){
let data90 = data.cipherPassword;
if(typeof data90 !== "string"){
let dataType71 = typeof data90;
let coerced71 = undefined;
if(dataType71 == 'object' && Array.isArray(data90) && data90.length == 1){
data90 = data90[0];
dataType71 = typeof data90;
if(typeof data90 === "string"){
coerced71 = data90;
}
}
if(!(coerced71 !== undefined)){
if(dataType71 == "number" || dataType71 == "boolean"){
coerced71 = "" + data90;
}
else if(data90 === null){
coerced71 = "";
}
else {
const err178 = {instancePath:instancePath+"/cipherPassword",schemaPath:"#/properties/cipherPassword/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
data90 = coerced71;
if(data !== undefined){
data["cipherPassword"] = coerced71;
}
}
}
}
if(data.requireAnonymousActionToken !== undefined){
let data91 = data.requireAnonymousActionToken;
if(typeof data91 !== "boolean"){
let dataType72 = typeof data91;
let coerced72 = undefined;
if(dataType72 == 'object' && Array.isArray(data91) && data91.length == 1){
data91 = data91[0];
dataType72 = typeof data91;
if(typeof data91 === "boolean"){
coerced72 = data91;
}
}
if(!(coerced72 !== undefined)){
if(data91 === "false" || data91 === 0 || data91 === null){
coerced72 = false;
}
else if(data91 === "true" || data91 === 1){
coerced72 = true;
}
else {
const err179 = {instancePath:instancePath+"/requireAnonymousActionToken",schemaPath:"#/properties/requireAnonymousActionToken/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
data91 = coerced72;
if(data !== undefined){
data["requireAnonymousActionToken"] = coerced72;
}
}
}
}
if(data.compactionPercent !== undefined){
let data92 = data.compactionPercent;
if(!(typeof data92 == "number")){
let dataType73 = typeof data92;
let coerced73 = undefined;
if(dataType73 == 'object' && Array.isArray(data92) && data92.length == 1){
data92 = data92[0];
dataType73 = typeof data92;
if(typeof data92 == "number"){
coerced73 = data92;
}
}
if(!(coerced73 !== undefined)){
if(dataType73 == "boolean" || data92 === null
              || (dataType73 == "string" && data92 && data92 == +data92)){
coerced73 = +data92;
}
else {
const err180 = {instancePath:instancePath+"/compactionPercent",schemaPath:"#/properties/compactionPercent/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err180];
}
else {
vErrors.push(err180);
}
errors++;
}
}
if(coerced73 !== undefined){
data92 = coerced73;
if(data !== undefined){
data["compactionPercent"] = coerced73;
}
}
}
if(typeof data92 == "number"){
if(data92 > 100 || isNaN(data92)){
const err181 = {instancePath:instancePath+"/compactionPercent",schemaPath:"#/properties/compactionPercent/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
if(data92 < 10 || isNaN(data92)){
const err182 = {instancePath:instancePath+"/compactionPercent",schemaPath:"#/properties/compactionPercent/minimum",keyword:"minimum",params:{comparison: ">=", limit: 10},message:"must be >= 10"};
if(vErrors === null){
vErrors = [err182];
}
else {
vErrors.push(err182);
}
errors++;
}
}
}
if(data.turnCredits !== undefined){
let data93 = data.turnCredits;
if(!(typeof data93 == "number")){
let dataType74 = typeof data93;
let coerced74 = undefined;
if(dataType74 == 'object' && Array.isArray(data93) && data93.length == 1){
data93 = data93[0];
dataType74 = typeof data93;
if(typeof data93 == "number"){
coerced74 = data93;
}
}
if(!(coerced74 !== undefined)){
if(dataType74 == "boolean" || data93 === null
              || (dataType74 == "string" && data93 && data93 == +data93)){
coerced74 = +data93;
}
else {
const err183 = {instancePath:instancePath+"/turnCredits",schemaPath:"#/properties/turnCredits/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err183];
}
else {
vErrors.push(err183);
}
errors++;
}
}
if(coerced74 !== undefined){
data93 = coerced74;
if(data !== undefined){
data["turnCredits"] = coerced74;
}
}
}
if(typeof data93 == "number"){
if(data93 < 0 || isNaN(data93)){
const err184 = {instancePath:instancePath+"/turnCredits",schemaPath:"#/properties/turnCredits/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err184];
}
else {
vErrors.push(err184);
}
errors++;
}
}
}
if(data.liveTurnsPerCaller !== undefined){
let data94 = data.liveTurnsPerCaller;
if(!((typeof data94 == "number") && (!(data94 % 1) && !isNaN(data94)))){
let dataType75 = typeof data94;
let coerced75 = undefined;
if(dataType75 == 'object' && Array.isArray(data94) && data94.length == 1){
data94 = data94[0];
dataType75 = typeof data94;
if((typeof data94 == "number") && (!(data94 % 1) && !isNaN(data94))){
coerced75 = data94;
}
}
if(!(coerced75 !== undefined)){
if(dataType75 === "boolean" || data94 === null
              || (dataType75 === "string" && data94 && data94 == +data94 && !(data94 % 1))){
coerced75 = +data94;
}
else {
const err185 = {instancePath:instancePath+"/liveTurnsPerCaller",schemaPath:"#/properties/liveTurnsPerCaller/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err185];
}
else {
vErrors.push(err185);
}
errors++;
}
}
if(coerced75 !== undefined){
data94 = coerced75;
if(data !== undefined){
data["liveTurnsPerCaller"] = coerced75;
}
}
}
if(typeof data94 == "number"){
if(data94 < 1 || isNaN(data94)){
const err186 = {instancePath:instancePath+"/liveTurnsPerCaller",schemaPath:"#/properties/liveTurnsPerCaller/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
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
if(data.turnTimeoutSeconds !== undefined){
let data95 = data.turnTimeoutSeconds;
if(!(typeof data95 == "number")){
let dataType76 = typeof data95;
let coerced76 = undefined;
if(dataType76 == 'object' && Array.isArray(data95) && data95.length == 1){
data95 = data95[0];
dataType76 = typeof data95;
if(typeof data95 == "number"){
coerced76 = data95;
}
}
if(!(coerced76 !== undefined)){
if(dataType76 == "boolean" || data95 === null
              || (dataType76 == "string" && data95 && data95 == +data95)){
coerced76 = +data95;
}
else {
const err187 = {instancePath:instancePath+"/turnTimeoutSeconds",schemaPath:"#/properties/turnTimeoutSeconds/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err187];
}
else {
vErrors.push(err187);
}
errors++;
}
}
if(coerced76 !== undefined){
data95 = coerced76;
if(data !== undefined){
data["turnTimeoutSeconds"] = coerced76;
}
}
}
if(typeof data95 == "number"){
if(data95 < 10 || isNaN(data95)){
const err188 = {instancePath:instancePath+"/turnTimeoutSeconds",schemaPath:"#/properties/turnTimeoutSeconds/minimum",keyword:"minimum",params:{comparison: ">=", limit: 10},message:"must be >= 10"};
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
if(data.taskTimeoutSeconds !== undefined){
let data96 = data.taskTimeoutSeconds;
if(!((typeof data96 == "number") && (!(data96 % 1) && !isNaN(data96)))){
let dataType77 = typeof data96;
let coerced77 = undefined;
if(dataType77 == 'object' && Array.isArray(data96) && data96.length == 1){
data96 = data96[0];
dataType77 = typeof data96;
if((typeof data96 == "number") && (!(data96 % 1) && !isNaN(data96))){
coerced77 = data96;
}
}
if(!(coerced77 !== undefined)){
if(dataType77 === "boolean" || data96 === null
              || (dataType77 === "string" && data96 && data96 == +data96 && !(data96 % 1))){
coerced77 = +data96;
}
else {
const err189 = {instancePath:instancePath+"/taskTimeoutSeconds",schemaPath:"#/properties/taskTimeoutSeconds/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err189];
}
else {
vErrors.push(err189);
}
errors++;
}
}
if(coerced77 !== undefined){
data96 = coerced77;
if(data !== undefined){
data["taskTimeoutSeconds"] = coerced77;
}
}
}
if(typeof data96 == "number"){
if(data96 < 10 || isNaN(data96)){
const err190 = {instancePath:instancePath+"/taskTimeoutSeconds",schemaPath:"#/properties/taskTimeoutSeconds/minimum",keyword:"minimum",params:{comparison: ">=", limit: 10},message:"must be >= 10"};
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
if(data.tripwire !== undefined){
let data97 = data.tripwire;
if(data97 && typeof data97 == "object" && !Array.isArray(data97)){
for(const key19 in data97){
if(!(key19 === "enabled")){
const err191 = {instancePath:instancePath+"/tripwire",schemaPath:"#/properties/tripwire/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key19},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err191];
}
else {
vErrors.push(err191);
}
errors++;
}
}
if(data97.enabled !== undefined){
let data98 = data97.enabled;
if(typeof data98 !== "boolean"){
let dataType78 = typeof data98;
let coerced78 = undefined;
if(dataType78 == 'object' && Array.isArray(data98) && data98.length == 1){
data98 = data98[0];
dataType78 = typeof data98;
if(typeof data98 === "boolean"){
coerced78 = data98;
}
}
if(!(coerced78 !== undefined)){
if(data98 === "false" || data98 === 0 || data98 === null){
coerced78 = false;
}
else if(data98 === "true" || data98 === 1){
coerced78 = true;
}
else {
const err192 = {instancePath:instancePath+"/tripwire/enabled",schemaPath:"#/properties/tripwire/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
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
if(data97 !== undefined){
data97["enabled"] = coerced78;
}
}
}
}
}
else {
const err193 = {instancePath:instancePath+"/tripwire",schemaPath:"#/properties/tripwire/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err193];
}
else {
vErrors.push(err193);
}
errors++;
}
}
if(data.approvalReview !== undefined){
let data99 = data.approvalReview;
if(data99 && typeof data99 == "object" && !Array.isArray(data99)){
if(data99.stage1TimeoutMs === undefined){
const err194 = {instancePath:instancePath+"/approvalReview",schemaPath:"#/properties/approvalReview/required",keyword:"required",params:{missingProperty: "stage1TimeoutMs"},message:"must have required property '"+"stage1TimeoutMs"+"'"};
if(vErrors === null){
vErrors = [err194];
}
else {
vErrors.push(err194);
}
errors++;
}
for(const key20 in data99){
if(!(key20 === "stage1TimeoutMs")){
const err195 = {instancePath:instancePath+"/approvalReview",schemaPath:"#/properties/approvalReview/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key20},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err195];
}
else {
vErrors.push(err195);
}
errors++;
}
}
if(data99.stage1TimeoutMs !== undefined){
let data100 = data99.stage1TimeoutMs;
if(!((typeof data100 == "number") && (!(data100 % 1) && !isNaN(data100)))){
let dataType79 = typeof data100;
let coerced79 = undefined;
if(dataType79 == 'object' && Array.isArray(data100) && data100.length == 1){
data100 = data100[0];
dataType79 = typeof data100;
if((typeof data100 == "number") && (!(data100 % 1) && !isNaN(data100))){
coerced79 = data100;
}
}
if(!(coerced79 !== undefined)){
if(dataType79 === "boolean" || data100 === null
              || (dataType79 === "string" && data100 && data100 == +data100 && !(data100 % 1))){
coerced79 = +data100;
}
else {
const err196 = {instancePath:instancePath+"/approvalReview/stage1TimeoutMs",schemaPath:"#/properties/approvalReview/properties/stage1TimeoutMs/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err196];
}
else {
vErrors.push(err196);
}
errors++;
}
}
if(coerced79 !== undefined){
data100 = coerced79;
if(data99 !== undefined){
data99["stage1TimeoutMs"] = coerced79;
}
}
}
if(typeof data100 == "number"){
if(data100 < 100 || isNaN(data100)){
const err197 = {instancePath:instancePath+"/approvalReview/stage1TimeoutMs",schemaPath:"#/properties/approvalReview/properties/stage1TimeoutMs/minimum",keyword:"minimum",params:{comparison: ">=", limit: 100},message:"must be >= 100"};
if(vErrors === null){
vErrors = [err197];
}
else {
vErrors.push(err197);
}
errors++;
}
}
}
}
else {
const err198 = {instancePath:instancePath+"/approvalReview",schemaPath:"#/properties/approvalReview/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err198];
}
else {
vErrors.push(err198);
}
errors++;
}
}
if(data.codeModeMaxWorkers !== undefined){
let data101 = data.codeModeMaxWorkers;
if(!((typeof data101 == "number") && (!(data101 % 1) && !isNaN(data101)))){
let dataType80 = typeof data101;
let coerced80 = undefined;
if(dataType80 == 'object' && Array.isArray(data101) && data101.length == 1){
data101 = data101[0];
dataType80 = typeof data101;
if((typeof data101 == "number") && (!(data101 % 1) && !isNaN(data101))){
coerced80 = data101;
}
}
if(!(coerced80 !== undefined)){
if(dataType80 === "boolean" || data101 === null
              || (dataType80 === "string" && data101 && data101 == +data101 && !(data101 % 1))){
coerced80 = +data101;
}
else {
const err199 = {instancePath:instancePath+"/codeModeMaxWorkers",schemaPath:"#/properties/codeModeMaxWorkers/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err199];
}
else {
vErrors.push(err199);
}
errors++;
}
}
if(coerced80 !== undefined){
data101 = coerced80;
if(data !== undefined){
data["codeModeMaxWorkers"] = coerced80;
}
}
}
if(typeof data101 == "number"){
if(data101 < 1 || isNaN(data101)){
const err200 = {instancePath:instancePath+"/codeModeMaxWorkers",schemaPath:"#/properties/codeModeMaxWorkers/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err200];
}
else {
vErrors.push(err200);
}
errors++;
}
}
}
if(data.shutdownGraceSeconds !== undefined){
let data102 = data.shutdownGraceSeconds;
if(!(typeof data102 == "number")){
let dataType81 = typeof data102;
let coerced81 = undefined;
if(dataType81 == 'object' && Array.isArray(data102) && data102.length == 1){
data102 = data102[0];
dataType81 = typeof data102;
if(typeof data102 == "number"){
coerced81 = data102;
}
}
if(!(coerced81 !== undefined)){
if(dataType81 == "boolean" || data102 === null
              || (dataType81 == "string" && data102 && data102 == +data102)){
coerced81 = +data102;
}
else {
const err201 = {instancePath:instancePath+"/shutdownGraceSeconds",schemaPath:"#/properties/shutdownGraceSeconds/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err201];
}
else {
vErrors.push(err201);
}
errors++;
}
}
if(coerced81 !== undefined){
data102 = coerced81;
if(data !== undefined){
data["shutdownGraceSeconds"] = coerced81;
}
}
}
if(typeof data102 == "number"){
if(data102 < 0 || isNaN(data102)){
const err202 = {instancePath:instancePath+"/shutdownGraceSeconds",schemaPath:"#/properties/shutdownGraceSeconds/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err202];
}
else {
vErrors.push(err202);
}
errors++;
}
}
}
}
else {
const err203 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err203];
}
else {
vErrors.push(err203);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
