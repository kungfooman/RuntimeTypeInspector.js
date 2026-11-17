import {repeatDeltaMessage} from './repeatDeltaMessage.js';
function testBuildsDelta() {
  // One message per key per turn carries the delta, so the inbox and the
  // panel rebuilds stay bounded while hit counts stay exact.
  const message = repeatDeltaMessage('L1-a', 41);
  return (
    message.type === 'rti' &&
    message.action === 'addError' &&
    message.destination === 'ui' &&
    message.key === 'L1-a' &&
    message.repeat === true &&
    message.ticks === 41
  );
}
export const tests = [
  testBuildsDelta,
];
