/**
 * Stamps one envelope with the id of the peer that sent it, so
 * receivers can attribute mail to the context that sent it. A
 * caller set stamp always wins, so tests and forwarders keep
 * theirs. The stamp mutates in place: structured clone snapshots
 * the message at post time, so callers must not reuse the object
 * after posting anyway.
 * @param {object} message - The envelope to stamp.
 * @param {string} net - Network tag, e.g. `my-app`.
 * @param {string} id - This peer's id on the network.
 * @param {string} [sourceKey] - Stamp field, `from` by default.
 * @returns {object} The same message, stamped when it was unstamped.
 * @example
 * stampEnvelope({net: 'my-app'}, 'my-app', 'abc'); // {net: 'my-app', from: 'abc'}
 */
function stampEnvelope(message, net, id, sourceKey = 'from') {
  if (message === null || message === undefined) {
    return message;
  }
  if (typeof message !== 'object') {
    return message;
  }
  if (message.net !== net) {
    return message;
  }
  if (message[sourceKey] !== undefined) {
    return message;
  }
  message[sourceKey] = id;
  return message;
}
export {stampEnvelope};
