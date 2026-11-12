import {registerClass, classes} from './registerClass.js';
import {registerTypedef, typedefs} from './registerTypedef.js';
import {snapshotNominalMatch} from './snapshotNominalMatch.js';
class MatchBox {
  constructor() {
    this.w = 1;
  }
  spin() {
    return this.w;
  }
}
class MatchSubBox extends MatchBox {}
function prepare() {
  registerClass(MatchBox);
  registerClass(MatchSubBox);
}
function unprepare() {
  delete classes.MatchBox;
  delete classes.MatchSubBox;
}
// A tagged snapshot names its class even after the name materialized
// into a shape: methods stripped in transit read as transport, not defect.
function testTaggedSnapshotMatchesBareName() {
  prepare();
  const snapshot = {
    w: 1,
    $type: 'MatchBox',
  };
  try {
    return snapshotNominalMatch(snapshot, 'MatchBox') === true;
  } finally {
    unprepare();
  }
}
// Untagged values stay strict: without a recorded constructor there is
// no nominal claim, so methods still count.
function testUntaggedValueStaysStrict() {
  prepare();
  const plain = {
    w: 1,
  };
  try {
    return snapshotNominalMatch(plain, 'MatchBox') === false;
  } finally {
    unprepare();
  }
}
// A stranger tag never matches, and a subclass tag satisfies its parent
// through the registry identity walk.
function testStrangerFailsSubclassPasses() {
  prepare();
  try {
    registerTypedef('MatchAlias', {
      type: 'object',
      properties: {
        w: 'number',
      },
    });
    const strangerValue = {
      w: 1,
      $type: 'Gadget',
    };
    const stranger = snapshotNominalMatch(strangerValue, 'MatchBox') === false;
    const subValue = {
      w: 1,
      $type: 'MatchSubBox',
    };
    const sub = snapshotNominalMatch(subValue, 'MatchBox') === true;
    delete typedefs.MatchAlias;
    return stranger && sub;
  } finally {
    unprepare();
    delete typedefs.MatchAlias;
  }
}
export const tests = [
  testTaggedSnapshotMatchesBareName,
  testUntaggedValueStaysStrict,
  testStrangerFailsSubclassPasses,
];
