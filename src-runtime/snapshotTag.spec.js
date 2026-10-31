import vm from 'node:vm';
import {snapshotTag} from './snapshotTag.js';
// A snapshot shared live across an iframe boundary keeps its home realm's
// Object.prototype: the tag must still read, or every nominal path in the
// differ goes blind and prints phantom union rows for values the checker
// passed. Before the realm-safe gate this returned undefined.
function testForeignSnapshotTagged() {
  const foreign = vm.runInNewContext('({r: 0.95, $type: "Color"})');
  return (foreign instanceof Array) === false &&
    Object.getPrototypeOf(foreign) !== Object.prototype &&
    snapshotTag(foreign) === 'Color';
}
// Class instances stay untagged in every realm: nominal trust is for
// transported snapshots, never for live objects with methods.
function testForeignInstanceUntagged() {
  const foreign = vm.runInNewContext('new (class Bar { constructor() { this.r = 1; } })()');
  return snapshotTag(foreign) === undefined && snapshotTag(new (class Bar {
    constructor() {
      this.r = 1;
    }
  })()) === undefined;
}
// Plain data, arrays, null-protos and lowercase tags behave as before.
function testNonSnapshotsUntagged() {
  const bare = Object.assign(Object.create(null), {$type: 'Color'});
  return snapshotTag({r: 1}) === undefined &&
    snapshotTag(vm.runInNewContext('[1, 2]')) === undefined &&
    snapshotTag({$type: 'color'}) === undefined &&
    snapshotTag(bare) === 'Color';
}
const tests = [
  testForeignSnapshotTagged,
  testForeignInstanceUntagged,
  testNonSnapshotsUntagged,
];
export {tests};
