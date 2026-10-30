<script setup>
// @ts-nocheck

import { StatefulLayout } from '@json-layout/core/state'
import { ref, shallowRef, getCurrentInstance, useSlots, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

import Tree from '@koumoul/vjsf/components/tree.vue'
import { useVjsf, emits } from '@koumoul/vjsf/composables/use-vjsf.js'
import '@koumoul/vjsf/styles/vjsf.css'


import sectionNode from '@koumoul/vjsf/components/nodes/section.vue'

import textfieldNode from '@koumoul/vjsf/components/nodes/text-field.vue'

import textareaNode from '@koumoul/vjsf/components/nodes/textarea.vue'


import localizeErrors from "ajv-i18n/localize/en/index.js";
import ucs2length from "ajv/dist/runtime/ucs2length.js";

const export0 = validate22;
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/autonomous-agent/form-mission#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/autonomous-agent/form-mission","x-exports":["vjsf"],"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"required":["title","persona"],"layout":{"title":null},"properties":{"title":{"type":"string","maxLength":131,"title":"Name","__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/title","errorMessage":{}},"persona":{"type":"string","layout":"textarea","title":"Persona","description":"Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.","__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/persona","errorMessage":{}},"instructions":{"type":"string","layout":"textarea","title":"Instructions","description":"How it should work: procedures, constraints, what to do when unsure.","__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/instructions","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-mission#","errorMessage":{"required":{"title":"required information","persona":"required information"}}};
const func1 = ucs2length.default;
const obj0 = {"required":"missingProperty","dependencies":"property","dependentRequired":"property"};

function validate22(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="export0" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate22.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.title === undefined){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-mission#/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.persona === undefined){
const err1 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-mission#/required",keyword:"required",params:{missingProperty: "persona"},message:"must have required property '"+"persona"+"'",schema:schema27.required,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "title") || (key0 === "persona")) || (key0 === "instructions"))){
const err2 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-mission#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.title !== undefined){
let data0 = data.title;
if(typeof data0 === "string"){
if(func1(data0) > 131){
const err3 = {instancePath:instancePath+"/title",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/title/maxLength",keyword:"maxLength",params:{limit: 131},message:"must NOT have more than 131 characters",schema:131,parentSchema:schema27.properties.title,data:data0};
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
const err4 = {instancePath:instancePath+"/title",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.title.type,parentSchema:schema27.properties.title,data:data0};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err5 of vErrors){
if(!err5.emUsed){
emErrs0.push(err5);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.persona !== undefined){
let data1 = data.persona;
if(typeof data1 !== "string"){
const err6 = {instancePath:instancePath+"/persona",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/persona/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.persona.type,parentSchema:schema27.properties.persona,data:data1};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err7 of vErrors){
if(!err7.emUsed){
emErrs1.push(err7);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
if(data.instructions !== undefined){
let data2 = data.instructions;
if(typeof data2 !== "string"){
const err8 = {instancePath:instancePath+"/instructions",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/instructions/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.instructions.type,parentSchema:schema27.properties.instructions,data:data2};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err9 of vErrors){
if(!err9.emUsed){
emErrs2.push(err9);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
}
}
}
else {
const err10 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-mission#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"title":[],"persona":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err11 of vErrors){
if((((((err11.keyword !== "errorMessage") && (!err11.emUsed)) && (err11.instancePath === instancePath)) && (err11.keyword in emErrors0)) && (err11.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/form-mission#") === 0)) && (/^\/[^\/]*$/.test(err11.schemaPath.slice(66)))){
emPropParams0 = obj0[err11.keyword];
emParamsErrors0 = emErrors0[err11.keyword][err11.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err11);
err11.emUsed = true;
}
}
}
for(const key1 in emErrors0){
for(const keyProp0 in emErrors0[key1]){
emParamsErrors0 = emErrors0[key1][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key1] && templates0[key1][keyProp0];
const err12 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-mission#/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.errorMessage[key1][keyProp0],schema:schema27.errorMessage,parentSchema:schema27,data};
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
const emErrs3 = [];
for(const err13 of vErrors){
if(!err13.emUsed){
emErrs3.push(err13);
}
}
vErrors = emErrs3;
errors = emErrs3.length;
}
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
function expression0(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.defaultData)
}
const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/autonomous-agent/form-mission#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/autonomous-agent/form-mission#": {
      title: "main",
      root: "https://github.com/data-fair/agents/autonomous-agent/form-mission#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-mission#",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/autonomous-agent/form-mission#": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-mission#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-mission#",
      pure: true,

      propertyKeys: [
        "title",
        "persona",
        "instructions"
      ],

      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/title",
        "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/persona",
        "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/instructions"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/title": {
      title: "Name",
      key: "title",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/title",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/title",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/persona": {
      title: "Persona",
      key: "persona",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/persona",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/persona",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/instructions": {
      title: "Instructions",
      key: "instructions",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/instructions",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/instructions",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: false
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/autonomous-agent/form-mission#": {
      title: null,
      comp: "section",

      children: [{
        key: "title"
      }, {
        key: "persona"
      }, {
        key: "instructions"
      }],

      defaultData: {},

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/title": {
      comp: "text-field",
      label: "Name"
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/persona": {
      comp: "textarea",
      label: "Persona",
      help: "<p>Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.</p>"
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-mission#/properties/instructions": {
      comp: "textarea",
      label: "Instructions",
      help: "<p>How it should work: procedures, constraints, what to do when unsure.</p>"
    }
  },

  validates: {
    "https://github.com/data-fair/agents/autonomous-agent/form-mission#": export0
  },

  validationErrors: {},
  expressions: [expression0],
  locale: "en",

  messages: {
    errorOneOf: "chose one",
    errorRequired: "required information",
    addItem: "Add item",
    delete: "Delete",
    edit: "Edit",
    confirm: "Confirm",
    close: "Close",
    duplicate: "Duplicate",
    insertAfter: "Insert after",
    copy: "Copy",
    paste: "Paste",
    sort: "Sort",
    up: "Move up",
    down: "Move down",
    showHelp: "Show a help message",
    default: "default: ",
    name: "name: ",
    examples: "Examples: ",
    deprecated: "Warning, this information is deprecated.",
    keyboardDate: "MM/DD/YYYY",
    keyboardDateTime: "MM/DD/YYYY HH:mm"
  },

  components: {
    none: {
      name: "none"
    },

    slot: {
      name: "slot"
    },

    "composite-slot": {
      name: "composite-slot",
      composite: true
    },

    section: {
      name: "section",
      composite: true
    },

    tabs: {
      name: "tabs",
      composite: true
    },

    "vertical-tabs": {
      name: "vertical-tabs",
      composite: true
    },

    "expansion-panels": {
      name: "expansion-panels",
      composite: true
    },

    stepper: {
      name: "stepper",
      composite: true
    },

    card: {
      name: "card",
      composite: true
    },

    list: {
      name: "list",
      itemsBased: true,

      schema: {
        required: ["listEditMode", "listActions"],

        properties: {
          title: {
            type: "string"
          },

          listEditMode: {
            type: "string",

            enum: [
              "inline",
              "inline-single",
              "menu",
              "dialog"
            ]
          },

          listActions: {
            type: "array",

            items: {
              type: "string",

              enum: [
                "add",
                "edit",
                "delete",
                "sort",
                "duplicate",
                "insertAfter",
                "copy",
                "paste"
              ]
            }
          },

          clipboardKey: {
            type: "string"
          },

          itemTitle: {
            $ref: "https://json-layout.github.io/normalized-layout-keyword#/$defs/expression"
          },

          itemSubtitle: {
            $ref: "https://json-layout.github.io/normalized-layout-keyword#/$defs/expression"
          },

          itemCopy: {
            $ref: "https://json-layout.github.io/normalized-layout-keyword#/$defs/expression"
          },

          indexed: {
            type: "array",

            items: {
              type: "string"
            }
          },

          messages: {
            type: "object",
            additionalProperties: false,

            properties: {
              addItem: {
                type: "string"
              },

              delete: {
                type: "string"
              },

              edit: {
                type: "string"
              },

              duplicate: {
                type: "string"
              },

              insertAfter: {
                type: "string"
              },

              sort: {
                type: "string"
              }
            }
          }
        }
      }
    },

    "text-field": {
      name: "text-field",
      shouldDebounce: true,
      focusable: true,
      emitsBlur: true,

      schema: {
        properties: {
          placeholder: {
            type: "string"
          }
        }
      }
    },

    textarea: {
      name: "textarea",
      shouldDebounce: true,
      focusable: true,
      emitsBlur: true,

      schema: {
        properties: {
          placeholder: {
            type: "string"
          },

          rows: {
            type: "number"
          }
        }
      }
    },

    "number-field": {
      name: "number-field",
      shouldDebounce: true,
      focusable: true,

      schema: {
        properties: {
          step: {
            type: "number"
          },

          min: {
            type: "number"
          },

          max: {
            type: "number"
          },

          precision: {
            type: "number"
          },

          placeholder: {
            type: "string"
          }
        }
      }
    },

    checkbox: {
      name: "checkbox"
    },

    switch: {
      name: "switch"
    },

    slider: {
      name: "slider",
      shouldDebounce: true,

      schema: {
        properties: {
          step: {
            type: "number"
          },

          min: {
            type: "number"
          },

          max: {
            type: "number"
          }
        }
      }
    },

    "date-picker": {
      name: "date-picker",

      schema: {
        properties: {
          min: {
            type: "string",
            format: "date"
          },

          max: {
            type: "string",
            format: "date"
          },

          format: {
            type: "string",
            enum: ["date", "date-time"],
            default: "date"
          }
        }
      }
    },

    "date-time-picker": {
      name: "date-time-picker",

      schema: {
        properties: {
          min: {
            type: "string",
            format: "date-time"
          },

          max: {
            type: "string",
            format: "date-time"
          }
        }
      }
    },

    "time-picker": {
      name: "time-picker",

      schema: {
        properties: {
          min: {
            type: "string",
            format: "time"
          },

          max: {
            type: "string",
            format: "time"
          }
        }
      }
    },

    "color-picker": {
      name: "color-picker",
      shouldDebounce: true
    },

    select: {
      name: "select",
      focusable: true,
      itemsBased: true,
      multipleCompat: true,

      schema: {
        properties: {
          placeholder: {
            type: "string"
          }
        }
      }
    },

    autocomplete: {
      name: "autocomplete",
      focusable: true,
      itemsBased: true,
      multipleCompat: true,

      schema: {
        properties: {
          placeholder: {
            type: "string"
          }
        }
      }
    },

    combobox: {
      name: "combobox",
      focusable: true,
      itemsBased: true,
      multipleCompat: true,

      schema: {
        properties: {
          placeholder: {
            type: "string"
          }
        }
      }
    },

    "number-combobox": {
      name: "number-combobox",
      focusable: true,
      itemsBased: true,
      multipleCompat: true,

      schema: {
        properties: {
          placeholder: {
            type: "string"
          },

          step: {
            type: "number"
          },

          min: {
            type: "number"
          },

          max: {
            type: "number"
          }
        }
      }
    },

    "checkbox-group": {
      name: "checkbox-group",
      itemsBased: true,
      multipleCompat: true
    },

    "switch-group": {
      name: "switch-group",
      itemsBased: true,
      multipleCompat: true
    },

    "radio-group": {
      name: "radio-group",
      itemsBased: true
    },

    "file-input": {
      name: "file-input",
      focusable: true,
      multipleCompat: true,
      isFileInput: true,

      schema: {
        properties: {
          accept: {
            type: "string"
          },

          placeholder: {
            type: "string"
          }
        }
      }
    },

    "one-of-select": {
      name: "one-of-select",

      schema: {
        required: ["oneOfItems"],

        properties: {
          emptyData: {
            type: "boolean"
          },

          autocomplete: {
            type: "boolean"
          },

          oneOfItems: {
            type: "array",

            items: {
              $ref: "https://json-layout.github.io/normalized-layout-keyword#/$defs/one-of-item"
            }
          }
        }
      }
    },

    markdown: {
      name: "markdown",
      shouldDebounce: true,
      emitsBlur: true,
      focusable: true
    }
  },

  localizeErrors: localizeErrors
}

const nodeComponents = {
  
  "section": sectionNode,
  
  "text-field": textfieldNode,
  
  "textarea": textareaNode,
    
}

const props = defineProps({
  modelValue: {
    type: null,
    default: null
  },
  options: {
    /** @type import('vue').PropType<import('@koumoul/vjsf/types.js').PartialVjsfOptions | null> */
    type: Object,
    default: null
  }
})

const emit = defineEmits(emits)

const { el, statefulLayout, stateTree } = useVjsf(
  null,
  computed(() => props.modelValue),
  computed(() => ({...props.options, components: {}})),
  nodeComponents,
  emit,
  null,
  null,
  computed(() => compiledLayout)
)

</script>

<template>
  <div
    ref="el"
    class="vjsf"
  >
    <tree
      v-if="statefulLayout && stateTree"
      :model-value="stateTree"
      :stateful-layout="statefulLayout"
    />
  </div>
</template>