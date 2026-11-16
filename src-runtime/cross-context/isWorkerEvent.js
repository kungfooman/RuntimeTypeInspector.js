/**
 * True for checking side traffic: RTI messages addressed at a worker,
 * iframe or any other runtime running checks. The panel fans option
 * and breakpoint traffic out under this destination.
 * @param {*} event - The message event from the panel.
 * @returns {boolean} True when the event carries worker bound RTI mail.
 * @example isWorkerEvent({data: {type: 'rti', destination: 'worker'}}) // true
 */
function isWorkerEvent(event) {
  if (event === null || event === undefined) {
    return false;
  }
  const {data} = event;
  if (data === null || data === undefined) {
    return false;
  }
  if (data.type !== 'rti') {
    return false;
  }
  if (data.destination !== 'worker') {
    return false;
  }
  return true;
}
export {isWorkerEvent};
