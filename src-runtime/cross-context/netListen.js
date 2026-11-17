import {bestEffort} from './bestEffort.js';
import {netMatch  } from './netMatch.js';
/**
 * Subscribes one verb table to a network channel: every matching
 * event runs its verb handler, unknown verbs warn instead of
 * throwing and taking down the whole dispatch. Returns the
 * unsubscribe closure, so short lived contexts never leak a
 * listener after teardown. Handlers receive the envelope plus the
 * raw event, so replies can target `data.from` without a lookup.
 * @param {*} host - The bus host carrying `addEventListener`, if any.
 * @param {string} net - Network tag, e.g. `my-app`.
 * @param {string} channel - Channel, e.g. `checks`.
 * @param {string} id - Our peer id on this network.
 * @param {Map<string, Function>|object} verbs - Verb to handler.
 * @param {Function} warn - Called with the unknown verb payload.
 * @returns {Function} Unsubscribe closure (removes the listener).
 * @example netListen(self, 'my-app', 'checks', 'a', {frame() {}}, console.warn) // () => ...
 */
function netListen(host, net, channel, id, verbs, warn) {
  const get = typeof verbs.get === 'function' ? (key) => verbs.get(key) : (key) => verbs[key];
  const onMessage = (event) => {
    if (!netMatch(event, net, channel, id)) {
      return;
    }
    const {verb} = event.data ?? {};
    const handler = get(verb);
    if (typeof handler !== 'function') {
      warn({verb});
      return;
    }
    handler(event.data, event);
  };
  bestEffort(() => host?.addEventListener?.('message', onMessage));
  return () => {
    bestEffort(() => host?.removeEventListener?.('message', onMessage));
  };
}
export {netListen};
