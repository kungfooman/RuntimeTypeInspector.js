import {snapshotMatches} from './snapshotMatches.js';
import {validateType} from './validateType.js';
import {registerClass} from './registerClass.js';
class Widget {}
class SpecialWidget extends Widget {}
class Gadget {}
const silent = () => undefined;
function prepare() {
  registerClass(Widget);
  registerClass(SpecialWidget);
  registerClass(Gadget);
}
// We want: a live instance to fail here, because instances carry no tag:
// the caller tries `instanceof` first and only consults the tag fallback
// for transported plain data.
function testLiveInstanceSkipped() {
  prepare();
  return snapshotMatches(new SpecialWidget(), 'SpecialWidget') === false;
}
// We want: a tagged snapshot to pass nominally, because prototypes do not
// survive messaging and the tag records the constructor that did.
function testTaggedSnapshotPasses() {
  prepare();
  return snapshotMatches({w: 1, $type: 'SpecialWidget'}, 'SpecialWidget') === true;
}
// We want: a subclass snapshot to satisfy its parent, because the walk
// follows the registered chain by identity.
function testSubclassSnapshotSatisfiesParent() {
  prepare();
  return snapshotMatches({w: 1, $type: 'SpecialWidget'}, 'Widget') === true;
}
// We want: a stranger snapshot to fail, because the tag names a class
// outside the expected hierarchy.
function testStrangerSnapshotFails() {
  prepare();
  return snapshotMatches({w: 1, $type: 'Gadget'}, 'Widget') === false;
}
// We want: untagged values to fail, because without a recorded constructor
// there is no nominal claim to check.
function testUntaggedFails() {
  prepare();
  return snapshotMatches({w: 1}, 'Widget') === false &&
    snapshotMatches(null, 'Widget') === false &&
    snapshotMatches('Widget', 'Widget') === false;
}
// We want: an unknown expected class to fail closed, because a missing
// registry entry decides nothing.
function testUnknownClassFails() {
  prepare();
  return snapshotMatches({w: 1, $type: 'Widget'}, 'Missing') === false;
}
// We want: a tagged snapshot to validate against the bare class name,
// because union members arrive as strings and take the `validateType`
// class branch, not the `validateReference` one.
function testTaggedSnapshotValidatesBareName() {
  prepare();
  return validateType({w: 1, $type: 'SpecialWidget'}, 'SpecialWidget', 'loc', 'name', true, silent, 0) === true;
}
// We want: a stranger snapshot to fail the bare class name, because the
// tag names a class outside the expected hierarchy.
function testStrangerSnapshotFailsBareName() {
  prepare();
  return validateType({w: 1, $type: 'Gadget'}, 'Widget', 'loc', 'name', true, silent, 0) === false;
}
// We want: a live instance to keep passing the bare class name by
// `instanceof`, because the tag fallback must not disturb the primary path.
function testLiveInstancePassesBareName() {
  prepare();
  return validateType(new SpecialWidget(), 'SpecialWidget', 'loc', 'name', true, silent, 0) === true;
}
const tests = [
  testLiveInstanceSkipped,
  testTaggedSnapshotPasses,
  testSubclassSnapshotSatisfiesParent,
  testStrangerSnapshotFails,
  testUntaggedFails,
  testUnknownClassFails,
  testTaggedSnapshotValidatesBareName,
  testStrangerSnapshotFailsBareName,
  testLiveInstancePassesBareName,
];
export {tests};
