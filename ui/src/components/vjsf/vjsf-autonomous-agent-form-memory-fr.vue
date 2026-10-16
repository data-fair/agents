<script setup>
// @ts-nocheck

import { StatefulLayout } from '@json-layout/core/state'
import { ref, shallowRef, getCurrentInstance, useSlots, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

import Tree from '@koumoul/vjsf/components/tree.vue'
import { useVjsf, emits } from '@koumoul/vjsf/composables/use-vjsf.js'
import '@koumoul/vjsf/styles/vjsf.css'


import sectionNode from '@koumoul/vjsf/components/nodes/section.vue'

import checkboxNode from '@koumoul/vjsf/components/nodes/checkbox.vue'


import localizeErrors from "ajv-i18n/localize/fr/index.js";

const export0 = validate22;
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/autonomous-agent/form-memory#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/autonomous-agent/form-memory","x-exports":["vjsf"],"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"required":[],"layout":{"title":null},"properties":{"memory":{"type":"object","additionalProperties":false,"required":["enabled"],"title":"Mémoire","properties":{"enabled":{"type":"boolean","default":false,"title":"Conserver une mémoire entre les conversations","description":"L'agent conserve des notes qu'il réutilise dans toutes ses conversations suivantes, et les remet en ordre une fois par jour à partir de ce qu'on lui a dit. Les administrateurs peuvent lire, modifier et restaurer cette mémoire. Les écritures en mémoire ne sont pas soumises aux réglages d'approbation : chaque modification est versionnée et peut être restaurée.","__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory/properties/enabled","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory","errorMessage":{"required":{"enabled":"information obligatoire"}}}},"__pointer":"https://github.com/data-fair/agents/autonomous-agent/form-memory#","errorMessage":{}};
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
for(const key0 in data){
if(!(key0 === "memory")){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-memory#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
if(data.memory !== undefined){
let data0 = data.memory;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.enabled === undefined){
const err1 = {instancePath:instancePath+"/memory",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema27.properties.memory.required,parentSchema:schema27.properties.memory,data:data0};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key1 in data0){
if(!(key1 === "enabled")){
const err2 = {instancePath:instancePath+"/memory",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema27.properties.memory,data:data0};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data0.enabled !== undefined){
let data1 = data0.enabled;
if(typeof data1 !== "boolean"){
const err3 = {instancePath:instancePath+"/memory/enabled",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory/properties/enabled/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.memory.properties.enabled.type,parentSchema:schema27.properties.memory.properties.enabled,data:data1};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err4 of vErrors){
if(!err4.emUsed){
emErrs0.push(err4);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
}
else {
const err5 = {instancePath:instancePath+"/memory",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.properties.memory.type,parentSchema:schema27.properties.memory,data:data0};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrors0 = {"required":{"enabled":[]}};
const templates0 = {required:{}};
let emPropParams0;
let emParamsErrors0;
for(const err6 of vErrors){
if((((((err6.keyword !== "errorMessage") && (!err6.emUsed)) && (err6.instancePath === instancePath+"/memory")) && (err6.keyword in emErrors0)) && (err6.schemaPath.indexOf("https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory") === 0)) && (/^\/[^\/]*$/.test(err6.schemaPath.slice(83)))){
emPropParams0 = obj0[err6.keyword];
emParamsErrors0 = emErrors0[err6.keyword][err6.params[emPropParams0]];
if(emParamsErrors0){
emParamsErrors0.push(err6);
err6.emUsed = true;
}
}
}
for(const key2 in emErrors0){
for(const keyProp0 in emErrors0[key2]){
emParamsErrors0 = emErrors0[key2][keyProp0];
if(emParamsErrors0.length){
const tmpl0 = templates0[key2] && templates0[key2][keyProp0];
const err7 = {instancePath:instancePath+"/memory",schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory/errorMessage",keyword:"errorMessage",params:{errors: emParamsErrors0},message:tmpl0 ? tmpl0() : schema27.properties.memory.errorMessage[key2][keyProp0],schema:schema27.properties.memory.errorMessage,parentSchema:schema27.properties.memory,data:data0};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
const emErrs1 = [];
for(const err8 of vErrors){
if(!err8.emUsed){
emErrs1.push(err8);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
}
else {
const err9 = {instancePath,schemaPath:"https://github.com/data-fair/agents/autonomous-agent/form-memory#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err10 of vErrors){
if(!err10.emUsed){
emErrs2.push(err10);
}
}
vErrors = emErrs2;
errors = emErrs2.length;
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
  mainTree: "https://github.com/data-fair/agents/autonomous-agent/form-memory#",

  skeletonTrees: {
    "https://github.com/data-fair/agents/autonomous-agent/form-memory#": {
      title: "main",
      root: "https://github.com/data-fair/agents/autonomous-agent/form-memory#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-memory#",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/autonomous-agent/form-memory#": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-memory#",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-memory#",
      pure: true,
      propertyKeys: ["memory"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory": {
      title: "Mémoire",
      key: "memory",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory",
      pure: true,
      propertyKeys: ["enabled"],
      roPropertyKeys: [],
      nullable: false,
      required: false,

      children: [
        "https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory/properties/enabled"
      ]
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory/properties/enabled": {
      title: "Conserver une mémoire entre les conversations",
      key: "enabled",
      pointer: "https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory/properties/enabled",
      refPointer: "https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory/properties/enabled",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: true
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/autonomous-agent/form-memory#": {
      title: null,
      comp: "section",

      children: [{
        key: "memory"
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

    "https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory": {
      comp: "section",

      children: [{
        key: "enabled"
      }],

      title: "Mémoire"
    },

    "https://github.com/data-fair/agents/autonomous-agent/form-memory#/properties/memory/properties/enabled": {
      comp: "checkbox",
      label: "Conserver une mémoire entre les conversations",
      help: "<p>L&#39;agent conserve des notes qu&#39;il réutilise dans toutes ses conversations suivantes, et les remet en ordre une fois par jour à partir de ce qu&#39;on lui a dit. Les administrateurs peuvent lire, modifier et restaurer cette mémoire. Les écritures en mémoire ne sont pas soumises aux réglages d&#39;approbation : chaque modification est versionnée et peut être restaurée.</p>",
      defaultData: false,

      getDefaultData: {
        type: "js-eval",
        expr: "layout.defaultData",
        pure: true,
        dataAlias: "value",
        ref: 0
      }
    }
  },

  validates: {
    "https://github.com/data-fair/agents/autonomous-agent/form-memory#": export0
  },

  validationErrors: {},
  expressions: [expression0],
  locale: "fr",

  messages: {
    errorOneOf: "choisissez une valeur",
    errorRequired: "information obligatoire",
    addItem: "Ajouter un élément",
    delete: "Supprimer",
    edit: "Éditer",
    confirm: "Confirmer",
    close: "Fermer",
    duplicate: "Dupliquer",
    insertAfter: "Insérer après",
    copy: "Copier",
    paste: "Coller",
    sort: "Trier",
    up: "Décaler vers le haut",
    down: "Décaler vers le bas",
    showHelp: "Afficher un message d'aide",
    default: "défaut : ",
    name: "nom : ",
    examples: "Exemples : ",
    deprecated: "Attention, cette information est obsolète.",
    keyboardDate: "JJ/MM/AAAA",
    keyboardDateTime: "JJ/MM/AAAA HH:mm"
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
  
  "checkbox": checkboxNode,
    
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