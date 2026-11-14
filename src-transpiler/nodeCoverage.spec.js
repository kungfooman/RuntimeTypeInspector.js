import {producedNodeTypes, unhandledNodeType} from './findUnhandledNodeTypes.js';
function testStaticBlockParses() {
  // The issue repro must parse into a StaticBlock node: if Babel renames the
  // type on an update, this fails first and points at the new name.
  const src = `class Vec3 {
  static {
    console.log("once");
  }
}`;
  const types = producedNodeTypes(src);
  if (!types.has('StaticBlock')) {
    const actual = [...types].sort();
    console.warn('expected StaticBlock in produced types', {actual});
    return false;
  }
  return true;
}
function testStaticBlockEmits() {
  // The parsed block must survive the pipeline instead of degrading into an
  // rtiUnhandled placeholder, which would break the build at runtime.
  const src = `class Vec3 {
  static {
    console.log("once");
  }
}`;
  const unhandled = unhandledNodeType(src);
  if (unhandled !== null) {
    console.warn('static block degrades into placeholder', {unhandled});
    return false;
  }
  return true;
}
function testJsxSpreadAttributeEmits() {
  // A spread prop merges into the props object: without an emitter the props
  // entry degrades and the element call breaks.
  const unhandled = unhandledNodeType('const element = <div a={1} {...properties}>{child}</div>;');
  if (unhandled !== null) {
    console.warn('JSX spread attribute degrades into placeholder', {unhandled});
    return false;
  }
  return true;
}
function testJsxSpreadChildEmits() {
  // A spread child becomes a spread call argument: without an emitter the
  // children list degrades and the element call breaks.
  const unhandled = unhandledNodeType('const element = <div>{...items}</div>;');
  if (unhandled !== null) {
    console.warn('JSX spread child degrades into placeholder', {unhandled});
    return false;
  }
  return true;
}
function testJsxEmptyExpressionEmits() {
  // A comment-only container holds no value: without an emitter the children
  // list degrades even though nothing should print.
  const unhandled = unhandledNodeType('const element = <div>{/* note */}</div>;');
  if (unhandled !== null) {
    console.warn('JSX empty expression degrades into placeholder', {unhandled});
    return false;
  }
  return true;
}
export const tests = [
  testStaticBlockParses,
  testStaticBlockEmits,
  testJsxSpreadAttributeEmits,
  testJsxSpreadChildEmits,
  testJsxEmptyExpressionEmits,
];
