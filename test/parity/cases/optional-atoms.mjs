/**
 * Optional properties, readonly, index signatures, and literal/union
 * payloads: the shapes whose printing lost a fast path in the atom-tagging
 * migration (dead code deleted) and whose checking flows through the same
 * tagged nodes. tsc is the oracle: error counts per case must agree.
 */
/**
 * @param {{fov?: number}} options - Optional prop.
 * @returns {void}
 */
function checkOptionalFov(options) {
}
/**
 * @param {{readonly label?: string}} options - Readonly optional.
 * @returns {void}
 */
function checkReadonlyLabel(options) {
}
/**
 * @param {{count?: number | string}} options - Optional union.
 * @returns {void}
 */
function checkOptionalCount(options) {
}
/**
 * @param {{mode?: "a" | "b"}} options - Optional literal union.
 * @returns {void}
 */
function checkOptionalMode(options) {
}
/**
 * @param {{[k: string]: number}} lookup - Index signature.
 * @returns {void}
 */
function checkNumberLookup(lookup) {
}
/**
 * @param {{nested?: {enabled: boolean}}} options - Optional object.
 * @returns {void}
 */
function checkOptionalNested(options) {
}
checkOptionalFov({});
checkOptionalFov({fov: 60});
checkOptionalFov({fov: "60"});
checkOptionalFov({});
checkReadonlyLabel({});
checkReadonlyLabel({label: "x"});
checkReadonlyLabel({label: 1});
checkOptionalCount({});
checkOptionalCount({count: 1});
checkOptionalCount({count: "s"});
checkOptionalCount({count: true});
checkOptionalMode({});
checkOptionalMode({mode: "a"});
checkOptionalMode({mode: "c"});
checkNumberLookup({a: 1});
checkNumberLookup({a: "x"});
checkNumberLookup({});
checkOptionalNested({});
checkOptionalNested({nested: {enabled: true}});
checkOptionalNested({nested: {enabled: 1}});
checkOptionalNested({nested: {}});
