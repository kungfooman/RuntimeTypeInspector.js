import {isWorkerEvent} from './isWorkerEvent.js';
function testWorkerRtiPasses() {
  // Checking side mail proceeds: enables, options and breakpoint arms.
  const data = {
    type: 'rti',
    destination: 'worker',
    action: 'enable',
  };
  const event = {data};
  const out = isWorkerEvent(event);
  const expected = true;
  return out === expected;
}
function testUiMailRejected() {
  // Panel bound mail never runs checking side commands.
  const data = {
    type: 'rti',
    destination: 'ui',
    action: 'addError',
  };
  const event = {data};
  const out = isWorkerEvent(event);
  const expected = false;
  return out === expected;
}
function testForeignMailRejected() {
  // Missing payloads degrade instead of throwing mid dispatch.
  const data = {
    type: 'other',
    destination: 'worker',
  };
  const otherEvent = {data};
  const otherOut = isWorkerEvent(otherEvent);
  const noDataEvent = {
    data: null,
  };
  const noDataOut = isWorkerEvent(noDataEvent);
  const noEventOut = isWorkerEvent(null);
  const expected = false;
  return (
    otherOut === expected &&
    noDataOut === expected &&
    noEventOut === expected
  );
}
export const tests = [
  testWorkerRtiPasses,
  testUiMailRejected,
  testForeignMailRejected,
];
