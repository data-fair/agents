/* eslint-disable */
// @ts-nocheck

"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/settings/post-req-resolved","title":"Post settings req","x-exports":["validate","types","resolvedSchemaJson","vjsf"],"type":"object","required":["body","query"],"properties":{"body":{"x-exports":["types"],"title":"Settings post","type":"object","additionalProperties":false,"required":["owner","providers"],"properties":{"owner":{"type":"object","additionalProperties":false,"required":["type","id"],"properties":{"type":{"type":"string","enum":["user","organization"]},"id":{"type":"string"},"name":{"type":"string"},"department":{"type":"string"}}},"globalPrompt":{"type":"string","title":"Global Prompt","description":"This prompt will be injected into all AI agents for this account"},"providers":{"type":"array","title":"AI Providers","items":{"type":"object","title":"Provider","additionalProperties":false,"required":["type"],"properties":{"id":{"type":"string","title":"Provider ID"},"type":{"type":"string","title":"Provider Type","enum":["openai","anthropic","google","mistral","openrouter","ollama","custom"]},"name":{"type":"string","title":"Display Name"},"enabled":{"type":"boolean","title":"Enabled","default":true},"openai":{"type":"object","title":"OpenAI Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"organization":{"type":"string","title":"Organization ID"},"project":{"type":"string","title":"Project ID"},"defaultModel":{"type":"string","title":"Default Model"}}},"anthropic":{"type":"object","title":"Anthropic Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"defaultModel":{"type":"string","title":"Default Model"}}},"google":{"type":"object","title":"Google AI Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"project":{"type":"string","title":"Project ID"},"location":{"type":"string","title":"Location","default":"us-central1"},"defaultModel":{"type":"string","title":"Default Model"}}},"mistral":{"type":"object","title":"Mistral AI Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"defaultModel":{"type":"string","title":"Default Model"}}},"openrouter":{"type":"object","title":"OpenRouter Configuration","properties":{"apiKey":{"type":"string","title":"API Key"},"defaultModel":{"type":"string","title":"Default Model"}}},"ollama":{"type":"object","title":"Ollama Configuration","properties":{"baseURL":{"type":"string","title":"Base URL","default":"http://localhost:11434"},"defaultModel":{"type":"string","title":"Default Model"}}},"custom":{"type":"object","title":"Custom Provider","properties":{"name":{"type":"string","title":"Provider Name"},"baseURL":{"type":"string","title":"Base URL"},"apiKey":{"type":"string","title":"API Key"},"defaultModel":{"type":"string","title":"Default Model"}},"required":["name","baseURL"]}}}}}},"query":{"type":"object","additionalProperties":false,"properties":{}}},"x-vjsf":{"xI18n":true},"x-vjsf-locales":["en","fr","it","de","pt","es"]};
const func2 = Object.prototype.hasOwnProperty;

function validate14(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/agents/settings/post-req-resolved" */;
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
if(data0.owner === undefined){
const err2 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/required",keyword:"required",params:{missingProperty: "owner"},message:"must have required property '"+"owner"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data0.providers === undefined){
const err3 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/required",keyword:"required",params:{missingProperty: "providers"},message:"must have required property '"+"providers"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data0){
if(!(((key0 === "owner") || (key0 === "globalPrompt")) || (key0 === "providers"))){
const err4 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data0.owner !== undefined){
let data1 = data0.owner;
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
if(data1.type === undefined){
const err5 = {instancePath:instancePath+"/body/owner",schemaPath:"#/properties/body/properties/owner/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data1.id === undefined){
const err6 = {instancePath:instancePath+"/body/owner",schemaPath:"#/properties/body/properties/owner/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key1 in data1){
if(!((((key1 === "type") || (key1 === "id")) || (key1 === "name")) || (key1 === "department"))){
const err7 = {instancePath:instancePath+"/body/owner",schemaPath:"#/properties/body/properties/owner/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data1.type !== undefined){
let data2 = data1.type;
if(typeof data2 !== "string"){
const err8 = {instancePath:instancePath+"/body/owner/type",schemaPath:"#/properties/body/properties/owner/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!((data2 === "user") || (data2 === "organization"))){
const err9 = {instancePath:instancePath+"/body/owner/type",schemaPath:"#/properties/body/properties/owner/properties/type/enum",keyword:"enum",params:{allowedValues: schema16.properties.body.properties.owner.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data1.id !== undefined){
if(typeof data1.id !== "string"){
const err10 = {instancePath:instancePath+"/body/owner/id",schemaPath:"#/properties/body/properties/owner/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data1.name !== undefined){
if(typeof data1.name !== "string"){
const err11 = {instancePath:instancePath+"/body/owner/name",schemaPath:"#/properties/body/properties/owner/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data1.department !== undefined){
if(typeof data1.department !== "string"){
const err12 = {instancePath:instancePath+"/body/owner/department",schemaPath:"#/properties/body/properties/owner/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
else {
const err13 = {instancePath:instancePath+"/body/owner",schemaPath:"#/properties/body/properties/owner/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data0.globalPrompt !== undefined){
if(typeof data0.globalPrompt !== "string"){
const err14 = {instancePath:instancePath+"/body/globalPrompt",schemaPath:"#/properties/body/properties/globalPrompt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data0.providers !== undefined){
let data7 = data0.providers;
if(Array.isArray(data7)){
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
let data8 = data7[i0];
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.type === undefined){
const err15 = {instancePath:instancePath+"/body/providers/" + i0,schemaPath:"#/properties/body/properties/providers/items/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
for(const key2 in data8){
if(!(func2.call(schema16.properties.body.properties.providers.items.properties, key2))){
const err16 = {instancePath:instancePath+"/body/providers/" + i0,schemaPath:"#/properties/body/properties/providers/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data8.id !== undefined){
if(typeof data8.id !== "string"){
const err17 = {instancePath:instancePath+"/body/providers/" + i0+"/id",schemaPath:"#/properties/body/properties/providers/items/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data8.type !== undefined){
let data10 = data8.type;
if(typeof data10 !== "string"){
const err18 = {instancePath:instancePath+"/body/providers/" + i0+"/type",schemaPath:"#/properties/body/properties/providers/items/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(!(((((((data10 === "openai") || (data10 === "anthropic")) || (data10 === "google")) || (data10 === "mistral")) || (data10 === "openrouter")) || (data10 === "ollama")) || (data10 === "custom"))){
const err19 = {instancePath:instancePath+"/body/providers/" + i0+"/type",schemaPath:"#/properties/body/properties/providers/items/properties/type/enum",keyword:"enum",params:{allowedValues: schema16.properties.body.properties.providers.items.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data8.name !== undefined){
if(typeof data8.name !== "string"){
const err20 = {instancePath:instancePath+"/body/providers/" + i0+"/name",schemaPath:"#/properties/body/properties/providers/items/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data8.enabled !== undefined){
if(typeof data8.enabled !== "boolean"){
const err21 = {instancePath:instancePath+"/body/providers/" + i0+"/enabled",schemaPath:"#/properties/body/properties/providers/items/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data8.openai !== undefined){
let data13 = data8.openai;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.apiKey !== undefined){
if(typeof data13.apiKey !== "string"){
const err22 = {instancePath:instancePath+"/body/providers/" + i0+"/openai/apiKey",schemaPath:"#/properties/body/properties/providers/items/properties/openai/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data13.organization !== undefined){
if(typeof data13.organization !== "string"){
const err23 = {instancePath:instancePath+"/body/providers/" + i0+"/openai/organization",schemaPath:"#/properties/body/properties/providers/items/properties/openai/properties/organization/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data13.project !== undefined){
if(typeof data13.project !== "string"){
const err24 = {instancePath:instancePath+"/body/providers/" + i0+"/openai/project",schemaPath:"#/properties/body/properties/providers/items/properties/openai/properties/project/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data13.defaultModel !== undefined){
if(typeof data13.defaultModel !== "string"){
const err25 = {instancePath:instancePath+"/body/providers/" + i0+"/openai/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/openai/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
else {
const err26 = {instancePath:instancePath+"/body/providers/" + i0+"/openai",schemaPath:"#/properties/body/properties/providers/items/properties/openai/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data8.anthropic !== undefined){
let data18 = data8.anthropic;
if(data18 && typeof data18 == "object" && !Array.isArray(data18)){
if(data18.apiKey !== undefined){
if(typeof data18.apiKey !== "string"){
const err27 = {instancePath:instancePath+"/body/providers/" + i0+"/anthropic/apiKey",schemaPath:"#/properties/body/properties/providers/items/properties/anthropic/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data18.defaultModel !== undefined){
if(typeof data18.defaultModel !== "string"){
const err28 = {instancePath:instancePath+"/body/providers/" + i0+"/anthropic/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/anthropic/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
}
else {
const err29 = {instancePath:instancePath+"/body/providers/" + i0+"/anthropic",schemaPath:"#/properties/body/properties/providers/items/properties/anthropic/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data8.google !== undefined){
let data21 = data8.google;
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(data21.apiKey !== undefined){
if(typeof data21.apiKey !== "string"){
const err30 = {instancePath:instancePath+"/body/providers/" + i0+"/google/apiKey",schemaPath:"#/properties/body/properties/providers/items/properties/google/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data21.project !== undefined){
if(typeof data21.project !== "string"){
const err31 = {instancePath:instancePath+"/body/providers/" + i0+"/google/project",schemaPath:"#/properties/body/properties/providers/items/properties/google/properties/project/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data21.location !== undefined){
if(typeof data21.location !== "string"){
const err32 = {instancePath:instancePath+"/body/providers/" + i0+"/google/location",schemaPath:"#/properties/body/properties/providers/items/properties/google/properties/location/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data21.defaultModel !== undefined){
if(typeof data21.defaultModel !== "string"){
const err33 = {instancePath:instancePath+"/body/providers/" + i0+"/google/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/google/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
}
else {
const err34 = {instancePath:instancePath+"/body/providers/" + i0+"/google",schemaPath:"#/properties/body/properties/providers/items/properties/google/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data8.mistral !== undefined){
let data26 = data8.mistral;
if(data26 && typeof data26 == "object" && !Array.isArray(data26)){
if(data26.apiKey !== undefined){
if(typeof data26.apiKey !== "string"){
const err35 = {instancePath:instancePath+"/body/providers/" + i0+"/mistral/apiKey",schemaPath:"#/properties/body/properties/providers/items/properties/mistral/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data26.defaultModel !== undefined){
if(typeof data26.defaultModel !== "string"){
const err36 = {instancePath:instancePath+"/body/providers/" + i0+"/mistral/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/mistral/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err37 = {instancePath:instancePath+"/body/providers/" + i0+"/mistral",schemaPath:"#/properties/body/properties/providers/items/properties/mistral/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data8.openrouter !== undefined){
let data29 = data8.openrouter;
if(data29 && typeof data29 == "object" && !Array.isArray(data29)){
if(data29.apiKey !== undefined){
if(typeof data29.apiKey !== "string"){
const err38 = {instancePath:instancePath+"/body/providers/" + i0+"/openrouter/apiKey",schemaPath:"#/properties/body/properties/providers/items/properties/openrouter/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data29.defaultModel !== undefined){
if(typeof data29.defaultModel !== "string"){
const err39 = {instancePath:instancePath+"/body/providers/" + i0+"/openrouter/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/openrouter/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err40 = {instancePath:instancePath+"/body/providers/" + i0+"/openrouter",schemaPath:"#/properties/body/properties/providers/items/properties/openrouter/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data8.ollama !== undefined){
let data32 = data8.ollama;
if(data32 && typeof data32 == "object" && !Array.isArray(data32)){
if(data32.baseURL !== undefined){
if(typeof data32.baseURL !== "string"){
const err41 = {instancePath:instancePath+"/body/providers/" + i0+"/ollama/baseURL",schemaPath:"#/properties/body/properties/providers/items/properties/ollama/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data32.defaultModel !== undefined){
if(typeof data32.defaultModel !== "string"){
const err42 = {instancePath:instancePath+"/body/providers/" + i0+"/ollama/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/ollama/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err43 = {instancePath:instancePath+"/body/providers/" + i0+"/ollama",schemaPath:"#/properties/body/properties/providers/items/properties/ollama/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data8.custom !== undefined){
let data35 = data8.custom;
if(data35 && typeof data35 == "object" && !Array.isArray(data35)){
if(data35.name === undefined){
const err44 = {instancePath:instancePath+"/body/providers/" + i0+"/custom",schemaPath:"#/properties/body/properties/providers/items/properties/custom/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data35.baseURL === undefined){
const err45 = {instancePath:instancePath+"/body/providers/" + i0+"/custom",schemaPath:"#/properties/body/properties/providers/items/properties/custom/required",keyword:"required",params:{missingProperty: "baseURL"},message:"must have required property '"+"baseURL"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data35.name !== undefined){
if(typeof data35.name !== "string"){
const err46 = {instancePath:instancePath+"/body/providers/" + i0+"/custom/name",schemaPath:"#/properties/body/properties/providers/items/properties/custom/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data35.baseURL !== undefined){
if(typeof data35.baseURL !== "string"){
const err47 = {instancePath:instancePath+"/body/providers/" + i0+"/custom/baseURL",schemaPath:"#/properties/body/properties/providers/items/properties/custom/properties/baseURL/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data35.apiKey !== undefined){
if(typeof data35.apiKey !== "string"){
const err48 = {instancePath:instancePath+"/body/providers/" + i0+"/custom/apiKey",schemaPath:"#/properties/body/properties/providers/items/properties/custom/properties/apiKey/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data35.defaultModel !== undefined){
if(typeof data35.defaultModel !== "string"){
const err49 = {instancePath:instancePath+"/body/providers/" + i0+"/custom/defaultModel",schemaPath:"#/properties/body/properties/providers/items/properties/custom/properties/defaultModel/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err50 = {instancePath:instancePath+"/body/providers/" + i0+"/custom",schemaPath:"#/properties/body/properties/providers/items/properties/custom/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err51 = {instancePath:instancePath+"/body/providers/" + i0,schemaPath:"#/properties/body/properties/providers/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
}
else {
const err52 = {instancePath:instancePath+"/body/providers",schemaPath:"#/properties/body/properties/providers/type",keyword:"type",params:{type: "array"},message:"must be array"};
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
else {
const err53 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
if(data.query !== undefined){
let data40 = data.query;
if(data40 && typeof data40 == "object" && !Array.isArray(data40)){
for(const key3 in data40){
const err54 = {instancePath:instancePath+"/query",schemaPath:"#/properties/query/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
else {
const err55 = {instancePath:instancePath+"/query",schemaPath:"#/properties/query/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err56 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
