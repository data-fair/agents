/* eslint-disable */
// @ts-nocheck

import { fullFormats } from "ajv-formats/dist/formats.js";
"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/limits","x-exports":["types","validate"],"title":"Limits","type":"object","additionalProperties":false,"required":["id","type","lastUpdate"],"properties":{"type":{"type":"string"},"id":{"type":"string"},"name":{"type":"string"},"lastUpdate":{"type":"string","format":"date-time"},"defaults":{"type":"boolean","title":"these limits were defined using default values only, not specifically defined"},"consumptionMonth":{"type":"string","title":"YYYY-MM month the consumption counter belongs to, used to reset defaults docs monthly"},"ai_credits":{"type":"object","additionalProperties":false,"properties":{"limit":{"type":"number"},"consumption":{"type":"number"}}}}};
const formats0 = fullFormats["date-time"];

function validate14(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/agents/limits" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.lastUpdate === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "lastUpdate"},message:"must have required property '"+"lastUpdate"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((((((key0 === "type") || (key0 === "id")) || (key0 === "name")) || (key0 === "lastUpdate")) || (key0 === "defaults")) || (key0 === "consumptionMonth")) || (key0 === "ai_credits"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.type !== undefined){
if(typeof data.type !== "string"){
const err4 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.id !== undefined){
if(typeof data.id !== "string"){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.name !== undefined){
if(typeof data.name !== "string"){
const err6 = {instancePath:instancePath+"/name",schemaPath:"#/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.lastUpdate !== undefined){
let data3 = data.lastUpdate;
if(typeof data3 === "string"){
if(!(formats0.validate(data3))){
const err7 = {instancePath:instancePath+"/lastUpdate",schemaPath:"#/properties/lastUpdate/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
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
const err8 = {instancePath:instancePath+"/lastUpdate",schemaPath:"#/properties/lastUpdate/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.defaults !== undefined){
if(typeof data.defaults !== "boolean"){
const err9 = {instancePath:instancePath+"/defaults",schemaPath:"#/properties/defaults/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.consumptionMonth !== undefined){
if(typeof data.consumptionMonth !== "string"){
const err10 = {instancePath:instancePath+"/consumptionMonth",schemaPath:"#/properties/consumptionMonth/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.ai_credits !== undefined){
let data6 = data.ai_credits;
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
for(const key1 in data6){
if(!((key1 === "limit") || (key1 === "consumption"))){
const err11 = {instancePath:instancePath+"/ai_credits",schemaPath:"#/properties/ai_credits/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data6.limit !== undefined){
if(!(typeof data6.limit == "number")){
const err12 = {instancePath:instancePath+"/ai_credits/limit",schemaPath:"#/properties/ai_credits/properties/limit/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data6.consumption !== undefined){
if(!(typeof data6.consumption == "number")){
const err13 = {instancePath:instancePath+"/ai_credits/consumption",schemaPath:"#/properties/ai_credits/properties/consumption/type",keyword:"type",params:{type: "number"},message:"must be number"};
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
const err14 = {instancePath:instancePath+"/ai_credits",schemaPath:"#/properties/ai_credits/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
