/**
 * Shared JSDoc typedefs for the three type string expanders
 * (`expandType` in `./expandType.js`, `expandTypeBabelTS` in
 * `./expandTypeBabelTS.js`, `expandTypeDepFree` in
 * `./expandTypeDepFree.js`). Each expander parses a type string into the
 * same intermediate representation: a bare type string (keywords, literals
 * kept as strings), a normalized literal (`true`/`false` become booleans,
 * numeric literals become numbers), or one of the node shapes below.
 * Per the one function per file rule, node knowledge that needs code lives
 * next to its function; this module holds only the shared shape vocabulary.
 * Import it for its types wherever expanded types are consumed:
 * `import './expandedType.js';`
 * `'transpiler-error'` is an explicit fallback member: the TS parser
 * already returns it on a mapped miss, so the type says so instead of
 * leaving a hole.
 * @typedef {string | number | boolean | 'transpiler-error' | ExpandArrayNode | ExpandRecordNode | ExpandMapNode | ExpandSetNode | ExpandUnionNode | ExpandIntersectionNode | ExpandTupleNode | ExpandObjectNode | ExpandPromiseNode | ExpandTypeofNode | ExpandKeyofNode | ExpandIndexedAccessNode | ExpandConditionNode | ExpandMappingNode | ExpandReferenceNode | ExpandFunctionNode | ExpandNewNode | ExpandRestNode | ExpandTupleMemberNode | ExpandBigintNode | ExpandTemplateLiteralNode | ExpandIndexSignatureNode | ExpandParameterNode} ExpandedType
 */
/**
 * @typedef {object} ExpandArrayNode
 * @property {'array'} type - The type.
 * @property {ExpandedType} elementType - The element type.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandRecordNode
 * @property {'record'} type - The type.
 * @property {ExpandedType} key - The key type.
 * @property {ExpandedType} val - The value type.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandMapNode
 * @property {'map'} type - The type.
 * @property {ExpandedType} key - The key type.
 * @property {ExpandedType} val - The value type.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandSetNode
 * @property {'set'} type - The type.
 * @property {ExpandedType} elementType - The element type.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandUnionNode
 * @property {'union'} type - The type.
 * @property {ExpandedType[]} members - The members.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandIntersectionNode
 * @property {'intersection'} type - The type.
 * @property {ExpandedType[]} members - The members.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandTupleNode
 * @property {'tuple'} type - The type.
 * @property {ExpandedType[]} elements - The elements.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandObjectNode
 * @property {'object'} type - The type.
 * @property {Object<string, ExpandedType>} [properties] - The properties, absent for bare `{}`.
 * @property {ExpandIndexSignatureNode[]} [indexSignatures] - The index signatures.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandPromiseNode
 * @property {'promise'} type - The type.
 * @property {ExpandedType} elementType - The element type.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandTypeofNode
 * @property {'typeof'} type - The type.
 * @property {ExpandedType} argument - The queried expression.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandKeyofNode
 * @property {'keyof'} type - The type.
 * @property {ExpandedType} argument - The target type.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandIndexedAccessNode
 * @property {'indexedAccess'} type - The type.
 * @property {ExpandedType} object - The object type.
 * @property {ExpandedType} index - The index type.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandConditionNode
 * @property {'condition'} type - The type.
 * @property {ExpandedType} checkType - The checked type.
 * @property {ExpandedType} extendsType - The constraint type.
 * @property {ExpandedType} trueType - The true branch.
 * @property {ExpandedType} falseType - The false branch.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandMappingNode
 * @property {'mapping'} type - The type.
 * @property {ExpandedType} iterable - The iterated type.
 * @property {string} element - The bound key name.
 * @property {ExpandedType} result - The result type.
 * @property {ExpandedType} [nameType] - The `as` remap type.
 * @property {'-' | '+' | '?' | 'readonly'} [question] - The optionality modifier.
 * @property {'-' | '+' | 'readonly'} [readonly] - The readonly modifier.
 */
/**
 * @typedef {object} ExpandReferenceNode
 * @property {'reference'} type - The type.
 * @property {string} name - The referenced name.
 * @property {ExpandedType[]} args - The type arguments.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandParameterNode
 * @property {ExpandedType} type - The parameter type.
 * @property {ExpandedType} name - The parameter name.
 */
/**
 * @typedef {object} ExpandFunctionNode
 * @property {'function'} type - The type.
 * @property {ExpandedType[]} parameters - The parameters, usually `{type, name}`
 * parameter nodes; a rest parameter is an array node wrapping one.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandNewNode
 * @property {'new'} type - The type.
 * @property {ExpandedType[]} parameters - The parameters, usually `{type, name}`
 * parameter nodes; a rest parameter is an array node wrapping one.
 * @property {ExpandedType} [ret] - The return type.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandRestNode
 * @property {'rest'} type - The type.
 * @property {ExpandedType} annotation - The rest element type.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandTupleMemberNode
 * @property {'tupleMember'} type - The type.
 * @property {string} name - The label.
 * @property {ExpandedType} elementType - The element type.
 * @property {boolean} [optional] - Whether the member may be absent.
 * @property {boolean} [dotDot] - Whether this is a named rest (`...b: T[]`).
 */
/**
 * @typedef {object} ExpandBigintNode
 * @property {'bigint'} type - The type.
 * @property {string} [literal] - The literal digits without the `n` suffix.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandTemplateLiteralNode
 * @property {'templateLiteral'} type - The type.
 * @property {string[]} quasis - The literal chunks.
 * @property {ExpandedType[]} types - The interpolated types.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * @typedef {object} ExpandIndexSignatureNode
 * @property {'indexSignature'} type - The type.
 * @property {ExpandedType} indexType - The value type.
 * @property {ExpandedType[]} indexParameters - The index parameters.
 * @property {boolean} [optional] - Whether the type may be absent.
 * @property {boolean} [readonly] - Whether the type is readonly.
 */
/**
 * Raw mapped type parts, before `iterable`/`result`/`nameType` are expanded.
 * @typedef {object} ExpandMappedRaw
 * @property {string} element - The bound key name.
 * @property {string} iterableRaw - The raw iterated type.
 * @property {string | undefined} nameRaw - The raw `as` remap type.
 * @property {string} resultRaw - The raw result type.
 * @property {('-' | '+' | '?') | undefined} question - The optionality modifier.
 * @property {('-' | '+' | 'readonly') | undefined} readonly - The readonly modifier.
 */
export {};
