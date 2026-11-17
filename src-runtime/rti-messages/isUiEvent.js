import {isDirectedEvent} from '../cross-context/isDirectedEvent.js';
/**
 * True for panel bound traffic: RTI messages addressed at the user
 * interface. Foreign traffic (analytics, devtools, other libs) posts
 * onto the same bus, sometimes without any payload, so the check
 * tolerates missing shapes and only `rti` addressed mail proceeds.
 * @param {*} event - The message event from a worker, iframe or window.
 * @returns {boolean} True when the event carries a UI bound RTI message.
 * @example isUiEvent({data: {type: 'rti', destination: 'ui'}}) // true
 */
function isUiEvent(event) {
  return isDirectedEvent(event, 'rti', 'ui');
}
export {isUiEvent};
