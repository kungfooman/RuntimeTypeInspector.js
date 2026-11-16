import {dispatchUiAction} from './dispatchUiAction.js';
function testDispatchesByAction() {
  // The handler runs with the event: no `this[action]` lookup on a class.
  let got;
  const handlers = new Map([
    ['clear', (event) => {
      got = event;
    }],
  ]);
  const event = {
    data: {
      type: 'rti',
      destination: 'ui',
      action: 'clear',
    },
  };
  const out = dispatchUiAction(event, handlers, () => {});
  return out === true && got === event;
}
function testUnknownWarns() {
  // A miswired sender (worker destined settings forwarded to the panel)
  // diagnoses instead of crashing the dispatch.
  const warns = [];
  const handlers = new Map();
  const event = {
    data: {
      type: 'rti',
      destination: 'ui',
      action: 'bogus',
    },
  };
  const out = dispatchUiAction(event, handlers, ({action}) => warns.push(action));
  return out === false && warns.length === 1 && warns[0] === 'bogus';
}
function testNonUiIgnored() {
  // Worker bound mail never runs panel handlers, even on the same bus.
  let ran = false;
  const handlers = new Map([
    ['enable', () => {
      ran = true;
    }],
  ]);
  const event = {
    data: {
      type: 'rti',
      destination: 'worker',
      action: 'enable',
    },
  };
  const out = dispatchUiAction(event, handlers, () => {});
  return out === false && ran === false;
}
export const tests = [
  testDispatchesByAction,
  testUnknownWarns,
  testNonUiIgnored,
];
