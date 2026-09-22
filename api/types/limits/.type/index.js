/* eslint-disable */


import validate from './validate.js'
import { assertValid as assertValidGeneric } from '@data-fair/lib-validation'

export const schemaExports = [
  "types",
  "validate"
]

export { validate } from './validate.js'
export function assertValid(data, options) {
  assertValidGeneric(validate, data, options)
}
export function returnValid(data, options) {
  assertValid(data, options)
  return data
}
