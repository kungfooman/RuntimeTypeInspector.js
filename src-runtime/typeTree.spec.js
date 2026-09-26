import {expandType} from '../src-transpiler/expandType.js';
import {registerTypedef, typedefs, typedefTemplates} from './registerTypedef.js';
import {buildTypeTree, suggestKey} from './typeTree.js';
function reset() {
  Object.keys(typedefs).forEach((_) => delete typedefs[_]);
  Object.keys(typedefTemplates).forEach((_) => delete typedefTemplates[_]);
}
function prepareMap() {
  reset();
  registerTypedef('ComponentMap', expandType('{camera: {fov: number}, light: {intensity: number}}'));
  registerTypedef('ComponentName', expandType('keyof ComponentMap & string'));
}
function testKeyofListsKeys() {
  prepareMap();
  const tree = buildTypeTree('ComponentName', 'nope', 'ComponentName');
  if (tree.kind !== 'alias') {
    return false;
  }
  const inter = tree.children[0];
  if (inter.kind !== 'intersection') {
    return false;
  }
  const keyof = inter.children.find((_) => _.kind === 'keyof');
  if (!keyof || !keyof.keys.includes('camera') || !keyof.keys.includes('light')) {
    return false;
  }
  // "nope" is flagged as absent, and the failing level is pinned.
  return keyof.valueInKeys === false && keyof.passes === false &&
    inter.children.find((_) => treeSnipIsString(_))?.passes === true;
}
/**
 * @param {object} node - A tree node.
 * @returns {boolean} True when the node is the `string` member.
 */
function treeSnipIsString(node) {
  return node.summary === 'string';
}
function testDidYouMean() {
  return suggestKey('camra', ['camera', 'light']) === 'camera' &&
    suggestKey('nope', ['camera', 'light']) === undefined &&
    suggestKey('cam', ['camera', 'light']) === undefined;
}
function testAliasClimb() {
  prepareMap();
  const tree = buildTypeTree('ComponentMap', {camera: {fov: 1}}, 'ComponentMap');
  if (tree.kind !== 'alias' || !tree.children?.length) {
    return false;
  }
  const obj = tree.children[0];
  return obj.kind === 'object' && obj.children.some((_) => _.label.startsWith('camera:'));
}
function testUnionMarks() {
  reset();
  const tree = buildTypeTree(expandType('"a" | "b"'), 'c', 'root');
  return tree.kind === 'union' && tree.children.length === 2 &&
    tree.children.every((_) => _.passes === false);
}
function deepType(n) {
  let t = 'number';
  for (let i = 0; i < n; i++) {
    t = `{level${i}: ${t}}`;
  }
  return expandType(t);
}
function testUnlimitedDepth() {
  // No depth cap: 8 nested levels all expand, each one collapsible.
  reset();
  let node = buildTypeTree(deepType(8), {}, 'root');
  for (let i = 0; i < 8; i++) {
    node = node.children?.[0];
    if (!node || node.kind !== 'object') {
      return false;
    }
  }
  return node.children?.[0]?.summary === 'number';
}
function testRecursiveTypedefTerminates() {
  reset();
  registerTypedef('Node', expandType('{child: Node}'));
  const tree = buildTypeTree('Node', {}, 'Node');
  const child = tree.children?.[0]?.children?.find((_) => _.label.startsWith('child:'));
  const grandchild = child?.children?.[0];
  // Terminates and says where the recursion folds back.
  return !!grandchild && grandchild.detail.includes('Recursive');
}
const tests = [
  testKeyofListsKeys,
  testDidYouMean,
  testAliasClimb,
  testUnionMarks,
  testUnlimitedDepth,
  testRecursiveTypedefTerminates,
];
export {tests};
