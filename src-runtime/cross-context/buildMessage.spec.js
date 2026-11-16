import {buildMessage} from './buildMessage.js';
function testBuildsEnvelope() {
  // The envelope carries type plus destination; the payload rides along.
  const message = buildMessage('enable', 'worker', {
    value: true,
  });
  return (
    message.type === 'rti' &&
    message.action === 'enable' &&
    message.destination === 'worker' &&
    message.value === true
  );
}
function testPayloadDefaultsEmpty() {
  // Option toggles without values still build a valid envelope.
  const message = buildMessage('disable', 'worker');
  return (
    message.type === 'rti' &&
    message.action === 'disable' &&
    message.destination === 'worker'
  );
}
export const tests = [
  testBuildsEnvelope,
  testPayloadDefaultsEmpty,
];
