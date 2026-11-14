/**
 * @name pc
 * @todo rename, but needs more changes to template
 * @namespace
 * @description Root namespace for the RTI Transpiler.
 */
export * from './addTypeChecks.js';
export * from './Asserter.js';
export * from './arrowArity.js';
export * from './arrowInferredName.js';
export * from './ast2json.js';
export * from './ast2jsonForComparison.js';
export * from './capitalize.js';
export * from './code2ast2code.js';
export * from './compareAST.js';
export * from './dummyArityHead.js';
export * from './eraseIgnoredOverloadParams.js';
export * from './freshKeyName.js';
export * from './freshName.js';
export * from './overloadArity.js';
export * from './overloadIgnoreSet.js';
export * from './overloadInspectionArgs.js';
export * from './overloadNameKey.js';
export * from './overloadSignatures.js';
export * from './overloadToTuple.js';
export * from './expandType.js';
export * from './expandTypeBabelTS.js';
export * from './expandTypeDepFree.js';
export * from './extractCurlyContent.js';
export * from './noneUnchecked.js';
export * from './markTypeofRequirements.js';
export * from './ignoredParamsIn.js';
export * from './runtimeImportNames.js';
export * from './JSDocAnnotator.js';
export * from './jsdoc-parsing-depfree/index.js';
export * from './jsdoc-parsing-ts/index.js';
export * from './nodeChildren.js';
export * from './nodeIsFunctionLike.js';
export * from './findUnhandledNodeTypes.js';
export * from './escapeName.js';
export * from './parserOptions.js';
export * from './annotateOptional.js';
export * from './isExpandedObject.js';
export * from './isIndexSignatureNode.js';
export * from './isUnionNode.js';
export * from './isArrayNode.js';
export * from './isObjectNode.js';
export * from './simplifyType.js';
export * from './simplifyTypeToSource.js';
export * from './Stringifier.js';
export * from './trimEndSpaces.js';
export * from './WATConverter.js';
export * from './ts2js.js';
