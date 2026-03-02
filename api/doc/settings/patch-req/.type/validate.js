/* eslint-disable */
// @ts-nocheck

"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/settings/patch-req-resolved","title":"Patch settings req","x-exports":["validate","types","resolvedSchemaJson","vjsf"],"type":"object","required":["body","query"],"properties":{"body":{"x-exports":["types"],"title":"Settings patch","type":"object","additionalProperties":false,"required":["providers"],"properties":{"globalPrompt":{"type":"string","title":"Global Prompt","description":"This prompt will be injected into all AI agents for this account"},"providers":{"type":"array","title":"AI Providers","items":{"type":"object","title":"Provider","additionalProperties":false,"required":["type"],"properties":{"id":{"type":"string","title":"Provider ID"},"type":{"type":"string","title":"Provider Type","enum":["openai","anthropic","google","mistral","openrouter","ollama","custom"]},"name":{"type":"string","title":"Display Name"},"enabled":{"type":"boolean","title":"Enabled","default":true},"openai":{"type":"object","title":"OpenAI Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"organization":{"type":"string","title":"Organization ID"},"project":{"type":"string","title":"Project ID"},"defaultModel":{"type":"string","title":"Default Model"}}},"anthropic":{"type":"object","title":"Anthropic Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"defaultModel":{"type":"string","title":"Default Model"}}},"google":{"type":"object","title":"Google AI Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"project":{"type":"string","title":"Project ID"},"location":{"type":"string","title":"Location","default":"us-central1"},"defaultModel":{"type":"string","title":"Default Model"}}},"mistral":{"type":"object","title":"Mistral AI Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"defaultModel":{"type":"string","title":"Default Model"}}},"openrouter":{"type":"object","title":"OpenRouter Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"defaultModel":{"type":"string","title":"Default Model"}}},"ollama":{"type":"object","title":"Ollama Configuration","properties":{"baseURL":{"type":"string","title":"Base URL","default":"http://localhost:11434"},"defaultModel":{"type":"string","title":"Default Model"}}},"custom":{"type":"object","title":"Custom Provider","properties":{"name":{"type":"string","title":"Provider Name"},"baseURL":{"type":"string","title":"Base URL"},"apiKey":{"type":"string","title":"API Key"},"defaultModel":{"type":"string","title":"Default Model"}},"required":["name","baseURL"]}}}}}},"query":{"type":"object","additionalProperties":false,"properties":{}}},"x-vjsf":{"xI18n":true},"x-vjsf-locales":["en","fr","it","de","pt","es"]};
const func2 = Object.prototype.hasOwnProperty;

function validate14(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/agents/settings/patch-req-resolved" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.body === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "body"},message:"must have required property '"+"body"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.query === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query"},message:"must have required property '"+"query"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.body !== undefined){
let data0 = data.body;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.providers === undefined){
const err2 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/required",keyword:"required",params:{missingProperty: "providers"},message:"must have required property '"+"providers"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data0){
if(!((key0 === "globalPrompt") || (key0 === "providers"))){
const err3 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data0.globalPrompt !== undefined){
if(typeof data0.globalPrompt !== "string"){
const err4 = {instancePath:instancePath+"/body/globalPrompt",schemaPath:"#/properties/body/properties/globalPrompt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data0.providers !== undefined){
let data2 = data0.providers;
if(Array.isArray(data2)){
const len0 = data2.length;
for(let i0=0; i0<len0; i0++){
let data3 = data2[i0];
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.type === undefined){
const err5 = {instancePath:instancePath+"/body/providers/" + i0,schemaPath:"#/properties/body/properties/providers/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key1 in data3){
if(!(func2.call(schema16.properties.body.properties.providers.items.properties, key1))){
const err6 = {instancePath:instancePath+"/body/providers/" + i0,schemaPath:"#/properties/body/properties/providers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data3.id !== undefined){
if(typeof data3.id !== "string"){
const err7 = {instancePath:instancePath+"/body/providers/" + i0+"/id",schemaPath:"#/properties/body/properties/providers/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data3.type !== undefined){
let data5 = data3.type;
if(typeof data5 !== "string"){
const err8 = {instancePath:instancePath+"/body/providers/" + i0+"/type",schemaPath:"#/properties/body/properties/providers/items/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!(((((((data5 === "openai") || (data5 === "anthropic")) || (data5 === "google")) || (data5 === "mistral")) || (data5 === "openrouter")) || (data5 === "ollama")) || (data5 === "custom"))){
const err9 = {instancePath:instancePath+"/body/providers/" + i0+"/type",schemaPath:"#/properties/body/properties/providers/items/properties/type/enum",keyword:"enum",params:{allowedValues: schema16.properties.body.properties.providers.items.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data3.name !== undefined){
if(typeof data3.name !== "string"){
const err10 = {instancePath:instancePath+"/body/providers/" + i0+"/name",schemaPath:"#/properties/body/properties/providers/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data3.enabled !== undefined){
if(typeof data3.enabled !== "boolean"){
const err11 = {instancePath:instancePath+"/body/providers/" + i0+"/enabled",schemaPath:"#/properties/body/properties/providers/items/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data3.openai !== undefined){
let data8 = data3.openai;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.apiKey !== undefined){
if(typeof data8.apiKey !== "string"){
const err12 = {instancePath:instancePath+"/body/providers/" + i0+"/openai/apiKey",schemaPath:"#/properties/body/properties/providers/items/properties/openai/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data8.organization !== undefined){
if(typeof data8.organization !== "string"){
const err13 = {instancePath:instancePath+"/body/providers/" + i0+"/openai/organization",schemaPath:"#/properties/body/properties/providers/items/properties/openai/properties/organization/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data8.project !== undefined){
if(typeof data8.project !== "string"){
const err14 = {instancePath:instancePath+"/body/providers/" + i0+"/openai/project",schemaPath:"#/properties/body/properties/providers/items/properties/openai/properties/project/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data8.defaultModel !== undefined){
if(typeof data8.defaultModel !== "string"){
const err15 = {instancePath:instancePath+"/body/providers/" + i0+"/openai/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/openai/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err16 = {instancePath:instancePath+"/body/providers/" + i0+"/openai",schemaPath:"#/properties/body/properties/providers/items/properties/openai/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data3.anthropic !== undefined){
let data13 = data3.anthropic;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.apiKey !== undefined){
if(typeof data13.apiKey !== "string"){
const err17 = {instancePath:instancePath+"/body/providers/" + i0+"/anthropic/apiKey",schemaPath:"#/properties/body/properties/providers/items/properties/anthropic/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data13.defaultModel !== undefined){
if(typeof data13.defaultModel !== "string"){
const err18 = {instancePath:instancePath+"/body/providers/" + i0+"/anthropic/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/anthropic/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err19 = {instancePath:instancePath+"/body/providers/" + i0+"/anthropic",schemaPath:"#/properties/body/properties/providers/items/properties/anthropic/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data3.google !== undefined){
let data16 = data3.google;
if(data16 && typeof data16 == "object" && !Array.isArray(data16)){
if(data16.apiKey !== undefined){
if(typeof data16.apiKey !== "string"){
const err20 = {instancePath:instancePath+"/body/providers/" + i0+"/google/apiKey",schemaPath:"#/properties/body/properties/providers/items/properties/google/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data16.project !== undefined){
if(typeof data16.project !== "string"){
const err21 = {instancePath:instancePath+"/body/providers/" + i0+"/google/project",schemaPath:"#/properties/body/properties/providers/items/properties/google/properties/project/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data16.location !== undefined){
if(typeof data16.location !== "string"){
const err22 = {instancePath:instancePath+"/body/providers/" + i0+"/google/location",schemaPath:"#/properties/body/properties/providers/items/properties/google/properties/location/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data16.defaultModel !== undefined){
if(typeof data16.defaultModel !== "string"){
const err23 = {instancePath:instancePath+"/body/providers/" + i0+"/google/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/google/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err24 = {instancePath:instancePath+"/body/providers/" + i0+"/google",schemaPath:"#/properties/body/properties/providers/items/properties/google/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data3.mistral !== undefined){
let data21 = data3.mistral;
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(data21.apiKey !== undefined){
if(typeof data21.apiKey !== "string"){
const err25 = {instancePath:instancePath+"/body/providers/" + i0+"/mistral/apiKey",schemaPath:"#/properties/body/properties/providers/items/properties/mistral/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data21.defaultModel !== undefined){
if(typeof data21.defaultModel !== "string"){
const err26 = {instancePath:instancePath+"/body/providers/" + i0+"/mistral/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/mistral/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
else {
const err27 = {instancePath:instancePath+"/body/providers/" + i0+"/mistral",schemaPath:"#/properties/body/properties/providers/items/properties/mistral/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data3.openrouter !== undefined){
let data24 = data3.openrouter;
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
if(data24.apiKey !== undefined){
if(typeof data24.apiKey !== "string"){
const err28 = {instancePath:instancePath+"/body/providers/" + i0+"/openrouter/apiKey",schemaPath:"#/properties/body/properties/providers/items/properties/openrouter/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data24.defaultModel !== undefined){
if(typeof data24.defaultModel !== "string"){
const err29 = {instancePath:instancePath+"/body/providers/" + i0+"/openrouter/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/openrouter/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err30 = {instancePath:instancePath+"/body/providers/" + i0+"/openrouter",schemaPath:"#/properties/body/properties/providers/items/properties/openrouter/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data3.ollama !== undefined){
let data27 = data3.ollama;
if(data27 && typeof data27 == "object" && !Array.isArray(data27)){
if(data27.baseURL !== undefined){
if(typeof data27.baseURL !== "string"){
const err31 = {instancePath:instancePath+"/body/providers/" + i0+"/ollama/baseURL",schemaPath:"#/properties/body/properties/providers/items/properties/ollama/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data27.defaultModel !== undefined){
if(typeof data27.defaultModel !== "string"){
const err32 = {instancePath:instancePath+"/body/providers/" + i0+"/ollama/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/ollama/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err33 = {instancePath:instancePath+"/body/providers/" + i0+"/ollama",schemaPath:"#/properties/body/properties/providers/items/properties/ollama/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data3.custom !== undefined){
let data30 = data3.custom;
if(data30 && typeof data30 == "object" && !Array.isArray(data30)){
if(data30.name === undefined){
const err34 = {instancePath:instancePath+"/body/providers/" + i0+"/custom",schemaPath:"#/properties/body/properties/providers/items/properties/custom/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data30.baseURL === undefined){
const err35 = {instancePath:instancePath+"/body/providers/" + i0+"/custom",schemaPath:"#/properties/body/properties/providers/items/properties/custom/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(data30.name !== undefined){
if(typeof data30.name !== "string"){
const err36 = {instancePath:instancePath+"/body/providers/" + i0+"/custom/name",schemaPath:"#/properties/body/properties/providers/items/properties/custom/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data30.baseURL !== undefined){
if(typeof data30.baseURL !== "string"){
const err37 = {instancePath:instancePath+"/body/providers/" + i0+"/custom/baseURL",schemaPath:"#/properties/body/properties/providers/items/properties/custom/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data30.apiKey !== undefined){
if(typeof data30.apiKey !== "string"){
const err38 = {instancePath:instancePath+"/body/providers/" + i0+"/custom/apiKey",schemaPath:"#/properties/body/properties/providers/items/properties/custom/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data30.defaultModel !== undefined){
if(typeof data30.defaultModel !== "string"){
const err39 = {instancePath:instancePath+"/body/providers/" + i0+"/custom/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/custom/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
}
else {
const err40 = {instancePath:instancePath+"/body/providers/" + i0+"/custom",schemaPath:"#/properties/body/properties/providers/items/properties/custom/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err41 = {instancePath:instancePath+"/body/providers/" + i0,schemaPath:"#/properties/body/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err42 = {instancePath:instancePath+"/body/providers",schemaPath:"#/properties/body/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
}
else {
const err43 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data.query !== undefined){
let data35 = data.query;
if(data35 && typeof data35 == "object" && !Array.isArray(data35)){
for(const key2 in data35){
const err44 = {instancePath:instancePath+"/query",schemaPath:"#/properties/query/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
else {
const err45 = {instancePath:instancePath+"/query",schemaPath:"#/properties/query/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
}
else {
const err46 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
