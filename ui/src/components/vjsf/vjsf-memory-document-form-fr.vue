<script setup>
// @ts-nocheck

import { StatefulLayout } from '@json-layout/core/state'
import { ref, shallowRef, getCurrentInstance, useSlots, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

import Tree from '@koumoul/vjsf/components/tree.vue'
import { useVjsf, emits } from '@koumoul/vjsf/composables/use-vjsf.js'
import '@koumoul/vjsf/styles/vjsf.css'


import sectionNode from '@koumoul/vjsf/components/nodes/section.vue'

import textareaNode from '@koumoul/vjsf/components/nodes/textarea.vue'

import markdownNode from '@koumoul/vjsf-markdown/node.vue'


import localizeErrors from "ajv-i18n/localize/fr/index.js";

const export0 = validate22;
const schema26 = {"$id":"export0","$ref":"https://github.com/data-fair/agents/memory/document-form#"};
const schema27 = {"$id":"https://github.com/data-fair/agents/memory/document-form","x-exports":["vjsf"],"x-vjsf":{"xI18n":true,"pluginsImports":["@koumoul/vjsf-markdown"]},"x-vjsf-locales":["en","fr"],"type":"object","additionalProperties":false,"layout":{"title":null},"properties":{"description":{"type":"string","title":"Description","description":"Une ligne disant ce que contient le document : l'agent la voit dans l'index de sa mémoire et ne lit le document que lorsqu'il est pertinent.","layout":{"comp":"textarea","props":{"rows":2,"autoGrow":true}},"__pointer":"https://github.com/data-fair/agents/memory/document-form#/properties/description","errorMessage":{}},"content":{"type":"string","title":"Contenu","layout":"markdown","__pointer":"https://github.com/data-fair/agents/memory/document-form#/properties/content","errorMessage":{}}},"__pointer":"https://github.com/data-fair/agents/memory/document-form#","errorMessage":{}};

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
if(!((key0 === "description") || (key0 === "content"))){
const err0 = {instancePath,schemaPath:"https://github.com/data-fair/agents/memory/document-form#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
if(data.description !== undefined){
let data0 = data.description;
if(typeof data0 !== "string"){
const err1 = {instancePath:instancePath+"/description",schemaPath:"https://github.com/data-fair/agents/memory/document-form#/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.description.type,parentSchema:schema27.properties.description,data:data0};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(errors > 0){
const emErrs0 = [];
for(const err2 of vErrors){
if(!err2.emUsed){
emErrs0.push(err2);
}
}
vErrors = emErrs0;
errors = emErrs0.length;
}
}
if(data.content !== undefined){
let data1 = data.content;
if(typeof data1 !== "string"){
const err3 = {instancePath:instancePath+"/content",schemaPath:"https://github.com/data-fair/agents/memory/document-form#/properties/content/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.content.type,parentSchema:schema27.properties.content,data:data1};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(errors > 0){
const emErrs1 = [];
for(const err4 of vErrors){
if(!err4.emUsed){
emErrs1.push(err4);
}
}
vErrors = emErrs1;
errors = emErrs1.length;
}
}
}
else {
const err5 = {instancePath,schemaPath:"https://github.com/data-fair/agents/memory/document-form#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(errors > 0){
const emErrs2 = [];
for(const err6 of vErrors){
if(!err6.emUsed){
emErrs2.push(err6);
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
}function expression1(data,value,options,context,display,layout,readOnly,summary,validates
) {
return (layout.props)
}
const compiledLayout = {
  mainTree: "https://github.com/data-fair/agents/memory/document-form#",
  agentGuide: undefined,

  skeletonTrees: {
    "https://github.com/data-fair/agents/memory/document-form#": {
      title: "main",
      root: "https://github.com/data-fair/agents/memory/document-form#",
      refPointer: "https://github.com/data-fair/agents/memory/document-form#",
      discriminatorValue: undefined
    }
  },

  skeletonNodes: {
    "https://github.com/data-fair/agents/memory/document-form#": {
      title: undefined,
      key: "",
      pointer: "https://github.com/data-fair/agents/memory/document-form#",
      refPointer: "https://github.com/data-fair/agents/memory/document-form#",
      pure: true,
      propertyKeys: ["description", "content"],
      roPropertyKeys: [],
      nullable: false,
      required: true,

      children: [
        "https://github.com/data-fair/agents/memory/document-form#/properties/description",
        "https://github.com/data-fair/agents/memory/document-form#/properties/content"
      ]
    },

    "https://github.com/data-fair/agents/memory/document-form#/properties/description": {
      title: "Description",
      key: "description",
      pointer: "https://github.com/data-fair/agents/memory/document-form#/properties/description",
      refPointer: "https://github.com/data-fair/agents/memory/document-form#/properties/description",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    },

    "https://github.com/data-fair/agents/memory/document-form#/properties/content": {
      title: "Contenu",
      key: "content",
      pointer: "https://github.com/data-fair/agents/memory/document-form#/properties/content",
      refPointer: "https://github.com/data-fair/agents/memory/document-form#/properties/content",
      pure: true,
      propertyKeys: [],
      roPropertyKeys: [],
      nullable: false,
      required: undefined
    }
  },

  normalizedLayouts: {
    "https://github.com/data-fair/agents/memory/document-form#": {
      title: null,
      comp: "section",

      children: [{
        key: "description"
      }, {
        key: "content"
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

    "https://github.com/data-fair/agents/memory/document-form#/properties/description": {
      comp: "textarea",

      props: {
        rows: 2,
        autoGrow: true
      },

      label: "Description",
      help: "<p>Une ligne disant ce que contient le document : l&#39;agent la voit dans l&#39;index de sa mémoire et ne lit le document que lorsqu&#39;il est pertinent.</p>",

      getProps: {
        type: "js-eval",
        expr: "layout.props",
        pure: true,
        dataAlias: "value",
        ref: 1
      }
    },

    "https://github.com/data-fair/agents/memory/document-form#/properties/content": {
      comp: "markdown",
      label: "Contenu"
    }
  },

  validates: {
    "https://github.com/data-fair/agents/memory/document-form#": export0
  },

  validationErrors: {},
  expressions: [expression0, expression1],
  locale: "fr",

  messages: {
    errorOneOf: "choisissez une valeur",
    errorRequired: "information obligatoire",
    addItem: "Ajouter un élément",
    delete: "Supprimer",
    edit: "Éditer",
    confirm: "Confirmer",
    close: "Fermer",
    actions: "Actions",
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
  
  "textarea": textareaNode,
  
  "markdown": markdownNode,
    
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
  computed(() => ({...props.options, components: {"markdown":{"name":"markdown","shouldDebounce":true,"emitsBlur":true,"focusable":true}}})),
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