import {isUiEvent} from './isUiEvent.js';
/**
 * Dispatches one UI bound RTI message to its panel handler by action:
 * the handler table maps names to methods, so unknown actions warn
 * instead of throwing `handler[action] is not a function` and taking
 * down the whole dispatch (e.g. worker destined settings forwarded by
 * a host onto the panel bus).
 * @param {*} event - The message event from a worker, iframe or window.
 * @param {Map<string, Function>|object} handlers - Action name to handler.
 * @param {Function} warn - Called with the unknown action payload.
 * @returns {boolean} True when a handler ran.
 * @example dispatchUiAction({data: {type: 'rti', destination: 'ui', action: 'clear'}}, {clear() {}}, console.warn);
 */
function dispatchUiAction(event, handlers, warn) {
  if (!isUiEvent(event)) {
    return false;
  }
  const {action} = event.data ?? {};
  const get = typeof handlers.get === 'function' ? (key) => handlers.get(key) : (key) => handlers[key];
  const handler = get(action);
  if (typeof handler !== 'function') {
    warn({action});
    return false;
  }
  if (typeof handlers.get === 'function') {
    handler(event);
  } else {
    handler.call(handlers, event);
  }
  return true;
}
export {dispatchUiAction};
