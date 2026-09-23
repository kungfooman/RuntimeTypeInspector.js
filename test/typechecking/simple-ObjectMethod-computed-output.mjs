function VecAxis(axis = 'x', value = 0) {
  if (!inspectType(axis, {
    "type": "string",
    "optional": true
  }, 'VecAxis', 'axis')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(value, {
    "type": "number",
    "optional": true
  }, 'VecAxis', 'value')) {
    youCanAddABreakpointHere();
  }
  return {
    x: 0,
    y: 0,
    z: 0,
    [axis]: value
  };
}
const vec = VecAxis('y', 10);
console.log('vec', vec);
