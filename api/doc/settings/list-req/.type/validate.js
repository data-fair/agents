/* eslint-disable */
// @ts-nocheck

import { fullFormats } from "ajv-formats/dist/formats.js";
"use strict";
export const validate = validate14;
export default validate14;
const schema16 = {"$id":"https://github.com/data-fair/agents/settings/list-req","title":"List settings req","x-exports":["validate","types"],"type":"object","required":["query"],"properties":{"query":{"type":"object","additionalProperties":false,"properties":{"_id":{"type":"string"},"createdAt":{"type":"string","format":"date-time"},"updatedAt":{"type":"string","format":"date-time"},"owner":{"type":"object","additionalProperties":false,"properties":{"type":{"type":"string","enum":["user","organization"]},"id":{"type":"string"},"name":{"type":"string"},"department":{"type":"string"}}},"globalPrompt":{"type":"string"}}}}};
const formats0 = fullFormats["date-time"];

function validate14(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="https://github.com/data-fair/agents/settings/list-req" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.query === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "query"},message:"must have required property '"+"query"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.query !== undefined){
let data0 = data.query;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
for(const key0 in data0){
if(!(((((key0 === "_id") || (key0 === "createdAt")) || (key0 === "updatedAt")) || (key0 === "owner")) || (key0 === "globalPrompt"))){
const err1 = {instancePath:instancePath+"/query",schemaPath:"#/properties/query/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data0._id !== undefined){
if(typeof data0._id !== "string"){
const err2 = {instancePath:instancePath+"/query/_id",schemaPath:"#/properties/query/properties/_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data0.createdAt !== undefined){
let data2 = data0.createdAt;
if(typeof data2 === "string"){
if(!(formats0.validate(data2))){
const err3 = {instancePath:instancePath+"/query/createdAt",schemaPath:"#/properties/query/properties/createdAt/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
else {
const err4 = {instancePath:instancePath+"/query/createdAt",schemaPath:"#/properties/query/properties/createdAt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data0.updatedAt !== undefined){
let data3 = data0.updatedAt;
if(typeof data3 === "string"){
if(!(formats0.validate(data3))){
const err5 = {instancePath:instancePath+"/query/updatedAt",schemaPath:"#/properties/query/properties/updatedAt/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/query/updatedAt",schemaPath:"#/properties/query/properties/updatedAt/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data0.owner !== undefined){
let data4 = data0.owner;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
for(const key1 in data4){
if(!((((key1 === "type") || (key1 === "id")) || (key1 === "name")) || (key1 === "department"))){
const err7 = {instancePath:instancePath+"/query/owner",schemaPath:"#/properties/query/properties/owner/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data4.type !== undefined){
let data5 = data4.type;
if(typeof data5 !== "string"){
const err8 = {instancePath:instancePath+"/query/owner/type",schemaPath:"#/properties/query/properties/owner/properties/type/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!((data5 === "user") || (data5 === "organization"))){
const err9 = {instancePath:instancePath+"/query/owner/type",schemaPath:"#/properties/query/properties/owner/properties/type/enum",keyword:"enum",params:{allowedValues: schema16.properties.query.properties.owner.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data4.id !== undefined){
if(typeof data4.id !== "string"){
const err10 = {instancePath:instancePath+"/query/owner/id",schemaPath:"#/properties/query/properties/owner/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data4.name !== undefined){
if(typeof data4.name !== "string"){
const err11 = {instancePath:instancePath+"/query/owner/name",schemaPath:"#/properties/query/properties/owner/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data4.department !== undefined){
if(typeof data4.department !== "string"){
const err12 = {instancePath:instancePath+"/query/owner/department",schemaPath:"#/properties/query/properties/owner/properties/department/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err13 = {instancePath:instancePath+"/query/owner",schemaPath:"#/properties/query/properties/owner/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
const err14 = {instancePath:instancePath+"/query/globalPrompt",schemaPath:"#/properties/query/properties/globalPrompt/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err15 = {instancePath:instancePath+"/query",schemaPath:"#/properties/query/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
const err16 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
validate14.errors = vErrors;
return errors === 0;
}
