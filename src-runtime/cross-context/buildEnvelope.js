/**
 * Builds one message envelope for a named bus: the tag plus the
 * destination stay fixed, every payload field rides along untouched.
 * The unhardcoded core behind `buildMessage`, so other projects reuse
 * the same envelope with their own tag (`my-app`, `editor`, ...).
 * @param {string} tag - The bus tag, e.g. `rti` or `my-app`.
 * @param {string} action - The action, e.g. `addError` or `enable`.
 * @param {string} destination - The destination, `ui` or `worker`.
 * @param {object} [payload] - Extra message fields.
 * @returns {object} The message envelope.
 * @example buildEnvelope('my-app', 'ping', 'ui', {n: 1}) // {type: 'my-app', ...}
 */
function buildEnvelope(tag, action, destination, payload = {}) {
  return {
    type: tag,
    action,
    destination,
    ...payload,
  };
}
export {buildEnvelope};
