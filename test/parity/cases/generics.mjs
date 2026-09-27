/**
 * Generic inference parity, including the logData regression: template T
 * pinned by the first argument selects the second argument's branch.
 * @template T
 * @param {T} x - Wrapped value.
 * @returns {void}
 */
function case01(x) {
}
/**
 * @template {boolean} T
 * @param {T} isVerbose - Verbose flag.
 * @param {T extends true ? string[] : string} payload - Payload.
 * @returns {void}
 */
function case02(isVerbose, payload) {
}
case01(1);
case02(true, ["Error 1", "Error 2"]);
case02(false, "Single Error");
case02(true, "Single Error");
case02(false, ["Error 1"]);
