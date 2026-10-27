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
function case01(options) {
}
/**
 * @param {{readonly label?: string}} options - Readonly optional.
 * @returns {void}
 */
function case02(options) {
}
/**
 * @param {{count?: number | string}} options - Optional union.
 * @returns {void}
 */
function case03(options) {
}
/**
 * @param {{mode?: "a" | "b"}} options - Optional literal union.
 * @returns {void}
 */
function case04(options) {
}
/**
 * @param {{[k: string]: number}} lookup - Index signature.
 * @returns {void}
 */
function case05(lookup) {
}
/**
 * @param {{nested?: {enabled: boolean}}} options - Optional object.
 * @returns {void}
 */
function case06(options) {
}
case01({});
case01({fov: 60});
case01({fov: "60"});
case01({});
case02({});
case02({label: "x"});
case02({label: 1});
case03({});
case03({count: 1});
case03({count: "s"});
case03({count: true});
case04({});
case04({mode: "a"});
case04({mode: "c"});
case05({a: 1});
case05({a: "x"});
case05({});
case06({});
case06({nested: {enabled: true}});
case06({nested: {enabled: 1}});
case06({nested: {}});
