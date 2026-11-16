import {isWorkerEvent} from './isWorkerEvent.js';
/**
 * Applies one worker bound RTI command to the checking side state:
 * breakpoint arms, enable switches and option values. Unknown shapes
 * stay untouched, so the caller can warn once instead of throwing mid
 * dispatch and taking down the whole bus.
 * @param {*} event - The message event from the panel.
 * @param {object} deps - Checking side state the command mutates.
 * @param {Set<string>} deps.breakpoints - Armed `loc-name` keys.
 * @param {object} deps.options - Runtime options to patch.
 * @returns {boolean} True when a known command applied.
 * @example
 * applyWorkerCommand({data: {type: 'rti', destination: 'worker', action: 'enable'}}, {breakpoints, options});
 */
function applyWorkerCommand(event, {breakpoints, options}) {
  if (!isWorkerEvent(event)) {
    return false;
  }
  const {data} = event;
  const {action} = data;
  if (action === 'addError') {
    console.warn('We are not keeping track of errors in workers at all.');
    return true;
  }
  if (action === 'deleteBreakpoint') {
    breakpoints.delete(data.key);
    return true;
  }
  if (action === 'addBreakpoint') {
    breakpoints.add(data.key);
    return true;
  }
  if (action === 'enable') {
    options.enabled = true;
    return true;
  }
  if (action === 'disable') {
    options.enabled = false;
    return true;
  }
  if (action === 'strictNullChecks') {
    options.strictNullChecks = data.value !== false;
    return true;
  }
  if (action === 'checkInfinity') {
    options.checkInfinity = data.value !== false;
    return true;
  }
  if (action === 'exactObjects') {
    options.exactObjects = data.value === true;
    return true;
  }
  if (action === 'windowedChecks') {
    options.windowedChecks = data.value !== false;
    return true;
  }
  if (action === 'mapCheckWindowCap') {
    const cap = Math.floor(Number(data.value));
    if (Number.isFinite(cap) && cap >= 1) {
      options.mapCheckWindowCap = cap;
      return true;
    }
    return false;
  }
  if (action === 'mapCheckWindowMinTotalMs') {
    const min = Number(data.value);
    if (Number.isFinite(min) && min >= 0) {
      options.mapCheckWindowMinTotalMs = min;
      return true;
    }
    return false;
  }
  if (action === 'checkStats') {
    options.checkStats = data.value !== false;
    return true;
  }
  return false;
}
export {applyWorkerCommand};
