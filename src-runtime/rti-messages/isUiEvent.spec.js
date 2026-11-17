import {isUiEvent} from './isUiEvent.js';
function testUiRtiPasses() {
  // Panel bound RTI mail proceeds: the whole addError world lives here.
  const data = {
    type: 'rti',
    destination: 'ui',
    action: 'addError',
  };
  const event = {data};
  const out = isUiEvent(event);
  const expected = true;
  return out === expected;
}
function testWorkerMailRejected() {
  // Checking side mail never lands in the panel inbox, even when the
  // host forwards it onto the window bus.
  const data = {
    type: 'rti',
    destination: 'worker',
    action: 'enable',
  };
  const event = {data};
  const out = isUiEvent(event);
  const expected = false;
  return out === expected;
}
function testForeignMailRejected() {
  // Analytics, devtools and other libs share the bus: only rti mail
  // proceeds, and missing payloads degrade instead of throwing.
  const data = {
    type: 'other',
    destination: 'ui',
  };
  const otherEvent = {data};
  const otherOut = isUiEvent(otherEvent);
  const noDataEvent = {
    data: null,
  };
  const noPayloadEvent = {};
  const noDataOut = isUiEvent(noDataEvent);
  const noPayloadOut = isUiEvent(noPayloadEvent);
  const noEventOut = isUiEvent(null);
  const expected = false;
  return (
    otherOut === expected &&
    noDataOut === expected &&
    noPayloadOut === expected &&
    noEventOut === expected
  );
}
export const tests = [
  testUiRtiPasses,
  testWorkerMailRejected,
  testForeignMailRejected,
];
