/**
 * Generic inference parity, including the logData regression: template T
 * pinned by the first argument selects the second argument's branch.
 * @template T
 * @param {T} x - Wrapped value.
 * @returns {void}
 */
function checkIdentity(x) {
}
/**
 * @template {boolean} T
 * @param {T} isVerbose - Verbose flag.
 * @param {T extends true ? string[] : string} payload - Payload.
 * @returns {void}
 */
function checkVerbosePayload(isVerbose, payload) {
}
checkIdentity(1);
checkVerbosePayload(true, ["Error 1", "Error 2"]);
checkVerbosePayload(false, "Single Error");
checkVerbosePayload(true, "Single Error");
checkVerbosePayload(false, ["Error 1"]);
