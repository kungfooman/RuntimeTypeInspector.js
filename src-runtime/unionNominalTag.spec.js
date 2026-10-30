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
  try {
    return unionNominalTag({r: 1, $type: 'TagBox'}, ['TagBox', {type: 'array', elementType: 'number'}]) === true;
  } finally {
    unprepare();
  }
}
// Wrapped members unwrap first: `Readonly<TagBox>` nominates `TagBox`,
// mirroring what the validator resolves before checking.
function testWrappedMemberUnwraps() {
  prepare();
  try {
    const wrapped = {type: 'reference', name: 'Readonly', args: ['TagBox']};
    return unionNominalTag({r: 1, $type: 'TagBox'}, [wrapped, 'number']) === true;
  } finally {
    unprepare();
  }
}
// A registered subclass tag satisfies the parent member through the
// identity walk, the same rule `snapshotMatches` enforces.
function testSubclassTagSatisfiesParent() {
  prepare();
  try {
    return unionNominalTag({r: 1, $type: 'TagSubBox'}, ['TagBox']) === true;
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
    const plain = unionNominalTag({r: 1}, ['TagBox']) === false;
    const stranger = unionNominalTag({r: 1, $type: 'TagGizmo'}, ['TagBox']) === false;
    const shaped = unionNominalTag({r: 1, $type: 'TagBox'}, [{type: 'object', properties: {r: 'number'}}]) === false;
    const opaque = unionNominalTag({r: 1, $type: 'TagBox'}, [{type: 'reference', name: 'Partial', args: ['TagBox']}]) === false;
    const empty = unionNominalTag({r: 1, $type: 'TagBox'}, []) === false;
    return plain && stranger && shaped && opaque && empty;
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
