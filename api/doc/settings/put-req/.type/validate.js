/* eslint-disable */
// @ts-nocheck

"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"x-exports":["validate","types","vjsf"],"title":"Settings put","type":"object","additionalProperties":false,"required":["providers"],"properties":{"globalPrompt":{"type":"string","title":"Global Prompt","description":"This prompt will be injected into all AI agents for this account"},"providers":{"type":"array","title":"AI Providers","items":{"type":"object","title":"Provider","additionalProperties":false,"required":["type"],"properties":{"id":{"type":"string","title":"Provider ID"},"type":{"type":"string","title":"Provider Type","enum":["openai","anthropic","google","mistral","openrouter","ollama","custom"]},"name":{"type":"string","title":"Display Name"},"enabled":{"type":"boolean","title":"Enabled","default":true},"openai":{"type":"object","title":"OpenAI Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"organization":{"type":"string","title":"Organization ID"},"project":{"type":"string","title":"Project ID"},"defaultModel":{"type":"string","title":"Default Model"}}},"anthropic":{"type":"object","title":"Anthropic Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"defaultModel":{"type":"string","title":"Default Model"}}},"google":{"type":"object","title":"Google AI Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"project":{"type":"string","title":"Project ID"},"location":{"type":"string","title":"Location","default":"us-central1"},"defaultModel":{"type":"string","title":"Default Model"}}},"mistral":{"type":"object","title":"Mistral AI Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"defaultModel":{"type":"string","title":"Default Model"}}},"openrouter":{"type":"object","title":"OpenRouter Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"defaultModel":{"type":"string","title":"Default Model"}}},"ollama":{"type":"object","title":"Ollama Configuration","properties":{"baseURL":{"type":"string","title":"Base URL","default":"http://localhost:11434"},"defaultModel":{"type":"string","title":"Default Model"}}},"custom":{"type":"object","title":"Custom Provider","properties":{"name":{"type":"string","title":"Provider Name"},"baseURL":{"type":"string","title":"Base URL"},"apiKey":{"type":"string","title":"API Key"},"defaultModel":{"type":"string","title":"Default Model"}},"required":["name","baseURL"]}}}}},"$id":"https://github.com/data-fair/agents/settings/put-req","x-vjsf":{"xI18n":true},"x-vjsf-locales":["en","fr"]};
const func2 = Object.prototype.hasOwnProperty;

function validate14(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/agents/settings/put-req" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.providers === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "providers"},message:"must have required property '"+"providers"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!((key0 === "globalPrompt") || (key0 === "providers"))){
const err1 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.globalPrompt !== undefined){
if(typeof data.globalPrompt !== "string"){
const err2 = {instancePath:instancePath+"/globalPrompt",schemaPath:"#/properties/globalPrompt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.providers !== undefined){
let data1 = data.providers;
if(Array.isArray(data1)){
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.type === undefined){
const err3 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key1 in data2){
if(!(func2.call(schema16.properties.providers.items.properties, key1))){
const err4 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data2.id !== undefined){
if(typeof data2.id !== "string"){
const err5 = {instancePath:instancePath+"/providers/" + i0+"/id",schemaPath:"#/properties/providers/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data2.type !== undefined){
let data4 = data2.type;
if(typeof data4 !== "string"){
const err6 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!(((((((data4 === "openai") || (data4 === "anthropic")) || (data4 === "google")) || (data4 === "mistral")) || (data4 === "openrouter")) || (data4 === "ollama")) || (data4 === "custom"))){
const err7 = {instancePath:instancePath+"/providers/" + i0+"/type",schemaPath:"#/properties/providers/items/properties/type/enum",keyword:"enum",params:{allowedValues: schema16.properties.providers.items.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data2.name !== undefined){
if(typeof data2.name !== "string"){
const err8 = {instancePath:instancePath+"/providers/" + i0+"/name",schemaPath:"#/properties/providers/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data2.enabled !== undefined){
if(typeof data2.enabled !== "boolean"){
const err9 = {instancePath:instancePath+"/providers/" + i0+"/enabled",schemaPath:"#/properties/providers/items/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data2.openai !== undefined){
let data7 = data2.openai;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
if(data7.apiKey !== undefined){
if(typeof data7.apiKey !== "string"){
const err10 = {instancePath:instancePath+"/providers/" + i0+"/openai/apiKey",schemaPath:"#/properties/providers/items/properties/openai/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data7.organization !== undefined){
if(typeof data7.organization !== "string"){
const err11 = {instancePath:instancePath+"/providers/" + i0+"/openai/organization",schemaPath:"#/properties/providers/items/properties/openai/properties/organization/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data7.project !== undefined){
if(typeof data7.project !== "string"){
const err12 = {instancePath:instancePath+"/providers/" + i0+"/openai/project",schemaPath:"#/properties/providers/items/properties/openai/properties/project/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data7.defaultModel !== undefined){
if(typeof data7.defaultModel !== "string"){
const err13 = {instancePath:instancePath+"/providers/" + i0+"/openai/defaultModel",schemaPath:"#/properties/providers/items/properties/openai/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
else {
const err14 = {instancePath:instancePath+"/providers/" + i0+"/openai",schemaPath:"#/properties/providers/items/properties/openai/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data2.anthropic !== undefined){
let data12 = data2.anthropic;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.apiKey !== undefined){
if(typeof data12.apiKey !== "string"){
const err15 = {instancePath:instancePath+"/providers/" + i0+"/anthropic/apiKey",schemaPath:"#/properties/providers/items/properties/anthropic/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data12.defaultModel !== undefined){
if(typeof data12.defaultModel !== "string"){
const err16 = {instancePath:instancePath+"/providers/" + i0+"/anthropic/defaultModel",schemaPath:"#/properties/providers/items/properties/anthropic/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err17 = {instancePath:instancePath+"/providers/" + i0+"/anthropic",schemaPath:"#/properties/providers/items/properties/anthropic/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data2.google !== undefined){
let data15 = data2.google;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.apiKey !== undefined){
if(typeof data15.apiKey !== "string"){
const err18 = {instancePath:instancePath+"/providers/" + i0+"/google/apiKey",schemaPath:"#/properties/providers/items/properties/google/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data15.project !== undefined){
if(typeof data15.project !== "string"){
const err19 = {instancePath:instancePath+"/providers/" + i0+"/google/project",schemaPath:"#/properties/providers/items/properties/google/properties/project/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data15.location !== undefined){
if(typeof data15.location !== "string"){
const err20 = {instancePath:instancePath+"/providers/" + i0+"/google/location",schemaPath:"#/properties/providers/items/properties/google/properties/location/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data15.defaultModel !== undefined){
if(typeof data15.defaultModel !== "string"){
const err21 = {instancePath:instancePath+"/providers/" + i0+"/google/defaultModel",schemaPath:"#/properties/providers/items/properties/google/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
}
else {
const err22 = {instancePath:instancePath+"/providers/" + i0+"/google",schemaPath:"#/properties/providers/items/properties/google/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data2.mistral !== undefined){
let data20 = data2.mistral;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.apiKey !== undefined){
if(typeof data20.apiKey !== "string"){
const err23 = {instancePath:instancePath+"/providers/" + i0+"/mistral/apiKey",schemaPath:"#/properties/providers/items/properties/mistral/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data20.defaultModel !== undefined){
if(typeof data20.defaultModel !== "string"){
const err24 = {instancePath:instancePath+"/providers/" + i0+"/mistral/defaultModel",schemaPath:"#/properties/providers/items/properties/mistral/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err25 = {instancePath:instancePath+"/providers/" + i0+"/mistral",schemaPath:"#/properties/providers/items/properties/mistral/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data2.openrouter !== undefined){
let data23 = data2.openrouter;
if(data23 && typeof data23 == "object" && !Array.isArray(data23)){
if(data23.apiKey !== undefined){
if(typeof data23.apiKey !== "string"){
const err26 = {instancePath:instancePath+"/providers/" + i0+"/openrouter/apiKey",schemaPath:"#/properties/providers/items/properties/openrouter/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data23.defaultModel !== undefined){
if(typeof data23.defaultModel !== "string"){
const err27 = {instancePath:instancePath+"/providers/" + i0+"/openrouter/defaultModel",schemaPath:"#/properties/providers/items/properties/openrouter/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err28 = {instancePath:instancePath+"/providers/" + i0+"/openrouter",schemaPath:"#/properties/providers/items/properties/openrouter/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data2.ollama !== undefined){
let data26 = data2.ollama;
if(data26 && typeof data26 == "object" && !Array.isArray(data26)){
if(data26.baseURL !== undefined){
if(typeof data26.baseURL !== "string"){
const err29 = {instancePath:instancePath+"/providers/" + i0+"/ollama/baseURL",schemaPath:"#/properties/providers/items/properties/ollama/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data26.defaultModel !== undefined){
if(typeof data26.defaultModel !== "string"){
const err30 = {instancePath:instancePath+"/providers/" + i0+"/ollama/defaultModel",schemaPath:"#/properties/providers/items/properties/ollama/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err31 = {instancePath:instancePath+"/providers/" + i0+"/ollama",schemaPath:"#/properties/providers/items/properties/ollama/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data2.custom !== undefined){
let data29 = data2.custom;
if(data29 && typeof data29 == "object" && !Array.isArray(data29)){
if(data29.name === undefined){
const err32 = {instancePath:instancePath+"/providers/" + i0+"/custom",schemaPath:"#/properties/providers/items/properties/custom/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(data29.baseURL === undefined){
const err33 = {instancePath:instancePath+"/providers/" + i0+"/custom",schemaPath:"#/properties/providers/items/properties/custom/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data29.name !== undefined){
if(typeof data29.name !== "string"){
const err34 = {instancePath:instancePath+"/providers/" + i0+"/custom/name",schemaPath:"#/properties/providers/items/properties/custom/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data29.baseURL !== undefined){
if(typeof data29.baseURL !== "string"){
const err35 = {instancePath:instancePath+"/providers/" + i0+"/custom/baseURL",schemaPath:"#/properties/providers/items/properties/custom/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data29.apiKey !== undefined){
if(typeof data29.apiKey !== "string"){
const err36 = {instancePath:instancePath+"/providers/" + i0+"/custom/apiKey",schemaPath:"#/properties/providers/items/properties/custom/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data29.defaultModel !== undefined){
if(typeof data29.defaultModel !== "string"){
const err37 = {instancePath:instancePath+"/providers/" + i0+"/custom/defaultModel",schemaPath:"#/properties/providers/items/properties/custom/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err38 = {instancePath:instancePath+"/providers/" + i0+"/custom",schemaPath:"#/properties/providers/items/properties/custom/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
}
else {
const err39 = {instancePath:instancePath+"/providers/" + i0,schemaPath:"#/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
const err40 = {instancePath:instancePath+"/providers",schemaPath:"#/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
const err41 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
