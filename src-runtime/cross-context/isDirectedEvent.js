/**
 * True for traffic bound at one named destination of one named bus:
 * the unhardcoded core behind `isUiEvent`/`isWorkerEvent`, so other
 * projects reuse the same shape check with their own tag and lanes.
 * Foreign traffic sometimes posts without any payload, so the check
 * tolerates missing shapes and only addressed mail proceeds.
 * @param {*} event - The message event from a worker, iframe or window.
 * @param {string} tag - The bus tag, e.g. `my-app`.
 * @param {string} destination - The destination, e.g. `ui` or `worker`.
 * @returns {boolean} True when the event carries addressed bus mail.
 * @example isDirectedEvent({data: {type: 'my-app', destination: 'ui'}}, 'my-app', 'ui') // true
 */
function isDirectedEvent(event, tag, destination) {
  if (event === null || event === undefined) {
    return false;
  }
  const {data} = event;
  if (data === null || data === undefined) {
    return false;
  }
  if (data.type !== tag) {
    return false;
  }
  if (data.destination !== destination) {
    return false;
  }
  return true;
}
export {isDirectedEvent};
