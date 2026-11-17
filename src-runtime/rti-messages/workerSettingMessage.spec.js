import {workerSettingMessage} from './workerSettingMessage.js';
function testBuildsSetting() {
  // Option traffic fans out worker bound: the checking side applies it
  // keyed by action, with the value riding along.
  const message = workerSettingMessage('windowedChecks', true);
  return (
    message.type === 'rti' &&
    message.destination === 'worker' &&
    message.action === 'windowedChecks' &&
    message.value === true
  );
}
export const tests = [
  testBuildsSetting,
];
