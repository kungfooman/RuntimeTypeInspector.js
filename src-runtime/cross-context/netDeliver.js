import {netMatch} from './netMatch.js';
/**
 * Delivers one event to a verb table without a bus host: the
 * testable half of `netListen` for in process nets and specs.
 * Matching plus unknown verb warn behave exactly like the
 * subscribed path, so unit tests exercise the real dispatch.
 * @param {*} event - The message event to deliver.
 * @param {string} net - Network tag, e.g. `my-app`.
 * @param {string} channel - Channel, e.g. `checks`.
 * @param {string} id - Our peer id on this network.
 * @param {Map<string, Function>|object} verbs - Verb to handler.
 * @param {Function} warn - Called with the unknown verb payload.
 * @returns {boolean} True when a handler ran.
 * @example netDeliver({data: {net: 'my-app', channel: 'checks', verb: 'ping', to: null}}, 'my-app', 'checks', 'a', {ping() {}}, console.warn) // true
 */
function netDeliver(event, net, channel, id, verbs, warn) {
  if (!netMatch(event, net, channel, id)) {
    return false;
  }
  const {verb} = event.data ?? {};
  const get = typeof verbs.get === 'function' ? (key) => verbs.get(key) : (key) => verbs[key];
  const handler = get(verb);
  if (typeof handler !== 'function') {
    warn({verb});
    return false;
  }
  handler(event.data, event);
  return true;
}
export {netDeliver};
