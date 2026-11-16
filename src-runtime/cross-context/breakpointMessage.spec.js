import {breakpointMessage} from './breakpointMessage.js';
function testArmAndDisarm() {
  // Arms travel over the bus for cross context registries, so the checker
  // that owns the bare key traps the next failure.
  const arm = breakpointMessage('L1-a', true);
  const disarm = breakpointMessage('L1-a', false);
  return (
    arm.type === 'rti' &&
    arm.action === 'addBreakpoint' &&
    arm.destination === 'worker' &&
    arm.key === 'L1-a' &&
    disarm.action === 'deleteBreakpoint' &&
    disarm.key === 'L1-a'
  );
}
export const tests = [
  testArmAndDisarm,
];
