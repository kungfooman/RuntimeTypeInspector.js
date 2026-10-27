function test(bool = false) {
  if (!inspectType(bool, {
    "type": "atom",
    "atomType": "boolean",
    "optional": true
  }, 'test', 'bool')) {
    youCanAddABreakpointHere();
  }
  return /** @type {number} */ (bool ? 1 : 2);
}
