import {rtiBus} from './rtiBus.js';
function testBindsRtiNet() {
  // RTI binds the generic peer with its own tag and id: same class,
  // same shapes, just RTI's words on the envelope.
  const bus = rtiBus('abc');
  const message = bus.message('ui', 'addError');
  return (
    bus.net === 'rti' &&
    bus.id === 'abc' &&
    message.net === 'rti' &&
    message.channel === 'ui' &&
    message.verb === 'addError' &&
    message.from === 'abc' &&
    message.to === null
  );
}
export const tests = [
  testBindsRtiNet,
];
