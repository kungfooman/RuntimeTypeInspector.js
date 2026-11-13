import {registerClass, classes} from './registerClass.js';
import {unionNominalTag} from './unionNominalTag.js';
class TagBox {}
class TagGizmo {}
class TagSubBox extends TagBox {}
function prepare() {
  registerClass(TagBox);
  registerClass(TagGizmo);
  registerClass(TagSubBox);
}
function unprepare() {
  delete classes.TagBox;
  delete classes.TagGizmo;
  delete classes.TagSubBox;
}
// A tagged snapshot matching a bare member name accepts outright,
// without consulting the registry or the shape behind the name.
function testBareNameMatchSkipsRegistry() {
  prepare();
  const snapshot = {
    r: 1,
    $type: 'TagBox',
  };
  const members = ['TagBox', {
    type: 'array',
    elementType: 'number',
  }];
  try {
    return unionNominalTag(snapshot, members) === true;
  } finally {
    unprepare();
  }
}
// Wrapped members unwrap first: `Readonly<TagBox>` nominates `TagBox`,
// mirroring what the validator resolves before checking.
function testWrappedMemberUnwraps() {
  prepare();
  try {
    const wrapped = {
      type: 'reference',
      name: 'Readonly',
      args: ['TagBox'],
    };
    const snapshot = {
      r: 1,
      $type: 'TagBox',
    };
    return unionNominalTag(snapshot, [wrapped, 'number']) === true;
  } finally {
    unprepare();
  }
}
// A registered subclass tag satisfies the parent member through the
// identity walk, the same rule `snapshotMatches` enforces.
function testSubclassTagSatisfiesParent() {
  prepare();
  const snapshot = {
    r: 1,
    $type: 'TagSubBox',
  };
  try {
    return unionNominalTag(snapshot, ['TagBox']) === true;
  } finally {
    unprepare();
  }
}
// Anything else declines: untagged values, stranger tags, non-string
// members, and non-transparent wrappers all fall through to structural
// diffing instead of vanishing a row.
function testNonMatchesDecline() {
  prepare();
  try {
    const untagged = {
      r: 1,
    };
    const plain = unionNominalTag(untagged, ['TagBox']) === false;
    const strangerValue = {
      r: 1,
      $type: 'TagGizmo',
    };
    const stranger = unionNominalTag(strangerValue, ['TagBox']) === false;
    const snapshot = {
      r: 1,
      $type: 'TagBox',
    };
    const shapedExpect = [{
      type: 'object',
      properties: {
        r: 'number',
      },
    }];
    const shaped = unionNominalTag(snapshot, shapedExpect) === false;
    const opaqueExpect = [{
      type: 'reference',
      name: 'Partial',
      args: ['TagBox'],
    }];
    const opaque = unionNominalTag(snapshot, opaqueExpect) === false;
    const empty = unionNominalTag(snapshot, []) === false;
    return (
      plain &&
      stranger &&
      shaped &&
      opaque &&
      empty
    );
  } finally {
    unprepare();
  }
}
export const tests = [
  testBareNameMatchSkipsRegistry,
  testWrappedMemberUnwraps,
  testSubclassTagSatisfiesParent,
  testNonMatchesDecline,
];
