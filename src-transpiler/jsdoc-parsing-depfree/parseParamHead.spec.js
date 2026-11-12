import {parseParamHead} from './parseParamHead.js';
// A bracketed head with a default strips to the name and marks optional.
function testHeadStripsDefault() {
  const {name, optional, valid} = parseParamHead('[kwargs={}] rest');
  return (
    name === 'kwargs' &&
    optional === true &&
    valid === true
  );
}
// A dotted path scans into segments.
function testHeadScansPath() {
  const {name, segments, valid} = parseParamHead('options.stats[].unitsName rest');
  return (
    name === 'options.stats[].unitsName' &&
    valid === true &&
    segments.length === 3 &&
    segments[1].array === true
  );
}
// Stray furniture binds nothing: the name empties, matching tsc.
function testHeadRejectsFurniture() {
  const {name, valid} = parseParamHead('*value');
  return name === '' && valid === false;
}
// A description containing brackets does not leak into the name: the
// bracket reader consumes exactly to the matching closer.
function testHeadToleratesArtifact() {
  const {name, valid} = parseParamHead('[nodes] - Defaults to [].');
  return name === 'nodes' && valid === true;
}
// An unscannable path binds nothing.
function testHeadFailsClosed() {
  const {name, valid} = parseParamHead('stats[0 rest');
  return name === '' && valid === false;
}
// The misplaced-rest marker passes through for the caller's flag.
function testHeadPassesRest() {
  const {name, valid} = parseParamHead('...values trailing');
  return name === '...values' && valid === true;
}
export const tests = [
  testHeadStripsDefault,
  testHeadScansPath,
  testHeadRejectsFurniture,
  testHeadToleratesArtifact,
  testHeadFailsClosed,
  testHeadPassesRest,
];
