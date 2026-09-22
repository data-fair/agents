/* eslint-disable */
// @ts-nocheck

import { fullFormats } from "ajv-formats/dist/formats.js";
"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/limits/post-req","title":"Post limits req","x-exports":["validate","types"],"type":"object","required":["body"],"properties":{"body":{"x-exports":["types","validate"],"title":"Limits post","type":"object","additionalProperties":false,"required":["lastUpdate"],"properties":{"type":{"type":"string"},"id":{"type":"string"},"name":{"type":"string"},"lastUpdate":{"type":"string","format":"date-time"},"defaults":{"type":"boolean","title":"these limits were defined using default values only, not specifically defined"},"consumptionMonth":{"type":"string","title":"YYYY-MM month the consumption counter belongs to, used to reset defaults docs monthly"},"ai_credits":{"type":"object","additionalProperties":false,"properties":{"limit":{"type":"number"},"consumption":{"type":"number"}}}}}}};
const formats0 = fullFormats["date-time"];

function validate14(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/agents/limits/post-req" */;
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
if(data.body !== undefined){
let data0 = data.body;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.lastUpdate === undefined){
const err1 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/required",keyword:"required",params:{missingProperty: "lastUpdate"},message:"must have required property '"+"lastUpdate"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data0){
if(!(((((((key0 === "type") || (key0 === "id")) || (key0 === "name")) || (key0 === "lastUpdate")) || (key0 === "defaults")) || (key0 === "consumptionMonth")) || (key0 === "ai_credits"))){
const err2 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data0.type !== undefined){
if(typeof data0.type !== "string"){
const err3 = {instancePath:instancePath+"/body/type",schemaPath:"#/properties/body/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data0.id !== undefined){
if(typeof data0.id !== "string"){
const err4 = {instancePath:instancePath+"/body/id",schemaPath:"#/properties/body/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data0.name !== undefined){
if(typeof data0.name !== "string"){
const err5 = {instancePath:instancePath+"/body/name",schemaPath:"#/properties/body/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data0.lastUpdate !== undefined){
let data4 = data0.lastUpdate;
if(typeof data4 === "string"){
if(!(formats0.validate(data4))){
const err6 = {instancePath:instancePath+"/body/lastUpdate",schemaPath:"#/properties/body/properties/lastUpdate/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/body/lastUpdate",schemaPath:"#/properties/body/properties/lastUpdate/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data0.defaults !== undefined){
if(typeof data0.defaults !== "boolean"){
const err8 = {instancePath:instancePath+"/body/defaults",schemaPath:"#/properties/body/properties/defaults/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data0.consumptionMonth !== undefined){
if(typeof data0.consumptionMonth !== "string"){
const err9 = {instancePath:instancePath+"/body/consumptionMonth",schemaPath:"#/properties/body/properties/consumptionMonth/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data0.ai_credits !== undefined){
let data7 = data0.ai_credits;
if(data7 && typeof data7 == "object" && !Array.isArray(data7)){
for(const key1 in data7){
if(!((key1 === "limit") || (key1 === "consumption"))){
const err10 = {instancePath:instancePath+"/body/ai_credits",schemaPath:"#/properties/body/properties/ai_credits/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data7.limit !== undefined){
if(!(typeof data7.limit == "number")){
const err11 = {instancePath:instancePath+"/body/ai_credits/limit",schemaPath:"#/properties/body/properties/ai_credits/properties/limit/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data7.consumption !== undefined){
if(!(typeof data7.consumption == "number")){
const err12 = {instancePath:instancePath+"/body/ai_credits/consumption",schemaPath:"#/properties/body/properties/ai_credits/properties/consumption/type",keyword:"type",params:{type: "number"},message:"must be number"};
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
const err13 = {instancePath:instancePath+"/body/ai_credits",schemaPath:"#/properties/body/properties/ai_credits/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
const err14 = {instancePath:instancePath+"/body",schemaPath:"#/properties/body/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
else {
const err15 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
