/**
 * @typedef {object} CanonicalParam
 * @property {string} name - Validated bind name (empty when the tag binds
 * nothing, like tsc's empty name).
 * @property {boolean} bracketed - Whether the name was bracketed (`[name]`).
 * @property {string} type - Raw brace text for the row.
 * @property {boolean} dropped - Whether the row binds nothing (misplaced
 * rest, empty name). Shape agrees, binding does not, and the flag is data.
 * @property {boolean} merged - Whether tsc folds the row into a container
 * (dotted sub-params). The pipeline keeps the row; the flag is data.
 */
/**
 * @typedef {object} CanonicalOverload
 * @property {CanonicalParam[]} params - One row per signature parameter.
 * @property {string} returns - Brace text of the signature return.
 */
/**
 * @typedef {object} CanonicalCallback
 * @property {string} name - Callback name.
 * @property {CanonicalParam[]} params - Rows nested in the signature.
 */
/**
 * Canonical JSDoc document schema. Both readers produce this shape and
 * nothing else: JSON-serializable data, no positions, no TS nodes. The
 * compare is structural (key-sorted, absent-vs-false blind), so field
 * order never matters.
 * @typedef {object} CanonicalDoc
 * @property {{name: string, constraint: string, default: string}[]} templates - Template bindings in order.
 * @property {CanonicalOverload[]} overloads - One entry per `@overload` section.
 * @property {CanonicalParam[]} params - Flat rows (implementation signature or plain comment).
 * @property {string} returns - Flat return brace text (empty when absent).
 * @property {CanonicalCallback[]} callbacks - Callback signatures.
 */
export {};
