/**
 * True when a network envelope belongs to this listener: same
 * network tag, same channel, and addressed to us (or broadcast).
 * Broadcasts carry `to: null`, point to point mail names our id.
 * Missing shapes degrade to false instead of throwing, so foreign
 * traffic on the shared bus (analytics, devtools, other libs) stays
 * deaf without a `try` at every call site.
 * @param {*} event - The message event from a worker, iframe or window.
 * @param {string} net - Network tag, e.g. `my-app`.
 * @param {string} channel - Channel, e.g. `checks`.
 * @param {string} id - Our peer id on this network.
 * @returns {boolean} True when the event is our mail.
 * @example netMatch({data: {net: 'my-app', channel: 'checks', to: null}}, 'my-app', 'checks', 'a') // true
 */
function netMatch(event, net, channel, id) {
  if (event === null || event === undefined) {
    return false;
  }
  const {data} = event;
  if (data === null || data === undefined) {
    return false;
  }
  if (data.net !== net) {
    return false;
  }
  if (data.channel !== channel) {
    return false;
  }
  if (data.to === null || data.to === undefined) {
    return true;
  }
  return data.to === id;
}
export {netMatch};
