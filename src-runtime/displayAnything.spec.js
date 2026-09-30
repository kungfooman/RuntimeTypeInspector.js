import {DisplayAnything} from './DisplayAnything.js';
import {dump, installFakeBrowser, warningFor} from '../src-unittest/index.js';
/**
 * Runs a closure with the fake browser globals installed.
 * @param {Function} fn - The closure to run.
 * @returns {*} The closure result.
 */
function withFake(fn) {
  const restore = installFakeBrowser();
  try {
    return fn();
  } finally {
    restore();
  }
}
/**
 * Renders a fresh tree for one value under the fake DOM.
 * @param {*} value - The value to render.
 * @returns {{root: object, el: object}} Tree and element.
 */
function renderTree(value) {
  const root = new DisplayAnything(value);
  return {root, el: root.render()};
}
function testRenderLeaf() {
  return withFake(() => {
    const num = dump(renderTree(5).el) === '5';
    const str = dump(renderTree('x').el) === '"x"';
    const nul = dump(renderTree(null).el) === 'null';
    return num && str && nul;
  });
}
function testRenderPlainObject() {
  return withFake(() => {
    const text = dump(renderTree({a: 1}).el);
    return text.includes('Object') && text.includes('{1}') &&
      text.includes('a') && text.includes('1');
  });
}
function testRenderArray() {
  return withFake(() => {
    const text = dump(renderTree(['a', 1]).el);
    return text.includes('array') && text.includes('[2]') &&
      text.includes('a') && text.includes('1');
  });
}
function testDepthCap() {
  // Past depth 1 nodes stay leaves, which also terminates cyclic shapes.
  return withFake(() => {
    const {root} = renderTree({a: {b: {c: 1}}});
    const [child] = root.children;
    const [grandchild] = child.children;
    return child.detailsEl !== null && grandchild.children.length === 0 &&
      dump(child.el).includes('b');
  });
}
function testCaretExpandCollapse() {
  return withFake(() => {
    const {root} = renderTree({sub: {x: 1}});
    const [sub] = root.children;
    if (root.detailsEl.open !== true || !!sub.detailsEl.open) {
      return false;
    }
    sub.toggleNode();
    if (sub.detailsEl.open !== true) {
      return false;
    }
    sub.toggleNode();
    if (!!sub.detailsEl.open) {
      return false;
    }
    root.expand();
    if (sub.detailsEl.open !== true) {
      return false;
    }
    root.collapse();
    return root.detailsEl.open === false && sub.detailsEl.open === false;
  });
}
function testRefillPreservesOpen() {
  // Repeat errors refill rows in place: element identity and the open
  // state survive while texts follow the latest value.
  return withFake(() => {
    const {root, el} = renderTree({a: 1, sub: {x: 1}});
    const sub = root.children.find((child) => child.key === 'sub');
    sub.detailsEl.open = true;
    root.refill({a: 2, sub: {x: 2, y: 3}});
    const after = root.children.find((child) => child.key === 'sub');
    const text = dump(el);
    return root.el === el && after.detailsEl === sub.detailsEl &&
      after.detailsEl.open === true && text.includes('a') &&
      text.includes('2') && text.includes('y') && text.includes('3');
  });
}
function testRefillRemovesKeys() {
  return withFake(() => {
    const {root, el} = renderTree({a: 1, b: 2});
    root.refill({b: 3, c: 4});
    const text = dump(el);
    return root.children.map((child) => child.key).join() === 'b,c' &&
      text.includes('3') && text.includes('4') && !text.includes('1');
  });
}
function testRefillShapeChange() {
  // A row flipping between leaf and branch rebuilds only itself:
  // siblings keep identity and open state.
  return withFake(() => {
    const {root} = renderTree({a: 1, keep: {z: 0}});
    const keep = root.children.find((child) => child.key === 'keep');
    keep.detailsEl.open = true;
    root.refill({a: {x: 1}, keep: {z: 0}});
    const afterKeep = root.children.find((child) => child.key === 'keep');
    const afterA = root.children.find((child) => child.key === 'a');
    if (afterKeep.detailsEl !== keep.detailsEl || afterKeep.detailsEl.open !== true) {
      return false;
    }
    if (!afterA.detailsEl || !dump(afterA.el).includes('x')) {
      return false;
    }
    root.refill({a: 9, keep: {z: 0}});
    const back = root.children.find((child) => child.key === 'a');
    const backKeep = root.children.find((child) => child.key === 'keep');
    return back.detailsEl === null && dump(back.el).includes('9') &&
      backKeep.detailsEl === keep.detailsEl && backKeep.detailsEl.open === true;
  });
}
function testClassInstance() {
  return withFake(() => {
    class Vec {
      move() {}
    }
    const vec = Object.assign(new Vec(), {x: 1});
    const text = dump(renderTree(vec).el);
    return text.includes('Vec') && text.includes('x') && text.includes('1');
  });
}
function testThrowingGetter() {
  // Throwing getters degrade to markers instead of breaking the tree,
  // both on first paint and on refill.
  return withFake(() => {
    const bad = {};
    Object.defineProperty(bad, 'boom', {enumerable: true, get() {
      throw new Error('nope');
    }});
    const {root, el} = renderTree({a: 1});
    root.refill(bad);
    const refilled = dump(el).includes('Getter threw');
    const fresh = dump(renderTree(bad).el).includes('Getter threw');
    return refilled && fresh;
  });
}
function testRevokedProxy() {
  return withFake(() => {
    const {proxy, revoke} = Proxy.revocable({a: 1}, {});
    revoke();
    const {root, el} = renderTree({a: 1});
    root.refill(proxy);
    return dump(el).includes('[Unreadable]');
  });
}
function testCyclic() {
  return withFake(() => {
    const cyclic = {n: 1};
    cyclic.self = cyclic;
    const {root, el} = renderTree(cyclic);
    let count = 0;
    root.traverse(() => count++);
    root.refill(cyclic);
    return count < 12 && dump(el).includes('self');
  });
}
function testForInPinned() {
  // Inherited enumerables render as rows, matching the previous walk.
  return withFake(() => {
    const obj = Object.create({inherited: 7});
    obj.own = 1;
    const text = dump(renderTree(obj).el);
    return text.includes('inherited') && text.includes('7') && text.includes('own');
  });
}
function testNullProto() {
  return withFake(() => {
    const obj = Object.create(null);
    obj.k = 'v';
    const text = dump(renderTree(obj).el);
    return text.includes('k') && text.includes('v');
  });
}
function testWarningValueRefillKeepsNode() {
  // End to end for repeat hits: the value cell keeps its nodes, so an
  // expanded tree is not reset by the next identical error.
  const {warn, restore} = warningFor({sub: {x: 1}});
  try {
    const [first] = warn.td_value.children;
    warn.value = {sub: {x: 2}};
    const text = dump(warn.td_value);
    return warn.td_value.children[0] === first && text.includes('2') &&
      !text.includes('[object Object]');
  } finally {
    restore();
  }
}
function testWarningExpectRefillKeepsTree() {
  const {warn, restore} = warningFor('v');
  try {
    warn.expect = {a: 1};
    const [, tree] = warn.td_expect.children;
    tree.open = true;
    warn.expect = {a: 2, b: 3};
    const text = dump(warn.td_expect);
    return warn.td_expect.children[1] === tree && tree.open === true &&
      text.includes('2') && text.includes('b');
  } finally {
    restore();
  }
}
function testWarningMapUnaffected() {
  // Dedicated Map trees still rebuild through their own path.
  const {warn, restore} = warningFor(new Map([['a', 1]]));
  try {
    if (!dump(warn.td_value).includes('Map(1)')) {
      return false;
    }
    warn.value = new Map([['b', 2]]);
    const text = dump(warn.td_value);
    return text.includes('Map(1)') && text.includes('b');
  } finally {
    restore();
  }
}
function testWarningGenericToMapTransition() {
  // Switching between generic trees and dedicated trees rebuilds cleanly.
  const {warn, restore} = warningFor({a: 1});
  try {
    const [first] = warn.td_value.children;
    warn.value = new Map([['b', 2]]);
    if (warn.td_value.children[0] === first || !dump(warn.td_value).includes('Map(1)')) {
      return false;
    }
    warn.value = {c: 3};
    return dump(warn.td_value).includes('c');
  } finally {
    restore();
  }
}
function testObjectLeafShowsOneliner() {
  // Rows past the depth cap read as bounded one-liners, never dead-end
  // `[object Object]` rows.
  return withFake(() => {
    const text = dump(renderTree({a: {b: {c: 1}}}).el);
    return text.includes('{c: 1}') && !text.includes('[object Object]');
  });
}
function testFunctionLeafUnaffected() {
  return withFake(() => {
    const text = dump(renderTree({f: () => 42}).el);
    return text.includes('42');
  });
}
function testSnapshotTreeSkipsEnvelope() {
  // Snapshot trees header by their recorded tag with one row per recorded
  // key; nested snapshots collapse to their tags.
  return withFake(() => {
    const snapshot = {
      $type: 'FakeWindow', name: '', closed: false,
      location: {$type: 'FakeLocation', href: 'https://x/'},
    };
    const {root, el} = renderTree(snapshot);
    const text = dump(el);
    return text.includes('FakeWindow') && text.includes('{3}') &&
      text.includes('FakeLocation') && !text.includes('$type') &&
      !text.includes('[object Object]') && root.children.length === 3;
  });
}
function testSnapshotEmptyRendersTag() {
  return withFake(() => {
    const text = dump(renderTree({$type: 'BarProp'}).el);
    return text === 'BarProp';
  });
}
/**
 * Builds an object with `n` plain keys.
 * @param {number} n - Key count.
 * @returns {object} The fixture.
 */
function wideObject(n) {
  const obj = {};
  for (let i = 0; i < n; i++) {
    obj[`k${i}`] = i;
  }
  return obj;
}
function testDroppedKeysLeaveMarker() {
  return withFake(() => {
    const {warn, restore} = warningFor(wideObject(25));
    try {
      const text = dump(warn.td_value);
      const [tree] = warn.td_value.children;
      const [details] = tree.children;
      return text.includes('...(+5 more)') && !text.includes('k24') &&
        details.children.length === 22;
    } finally {
      restore();
    }
  });
}
function testDroppedIndicesLeaveMarker() {
  return withFake(() => {
    const {warn, restore} = warningFor(Array.from({length: 25}, (_, i) => i));
    try {
      const text = dump(warn.td_value);
      return text.includes('...(+5 more)') && !text.includes('24');
    } finally {
      restore();
    }
  });
}
function testNoMarkerWhenFits() {
  return withFake(() => {
    const {warn, restore} = warningFor({a: 1, b: [1, 2]});
    try {
      return !dump(warn.td_value).includes('...(+');
    } finally {
      restore();
    }
  });
}
function testNestedDroppedKeysLeaveMarker() {
  return withFake(() => {
    const {warn, restore} = warningFor({big: wideObject(25)});
    try {
      const text = dump(warn.td_value);
      return text.includes('...(+5 more)') && !text.includes('k24');
    } finally {
      restore();
    }
  });
}
function testMarkerFollowsRefill() {
  // The marker is a normal row: it updates in place and never duplicates.
  return withFake(() => {
    const {warn, restore} = warningFor(wideObject(25));
    try {
      warn.value = wideObject(30);
      const text = dump(warn.td_value);
      const markers = text.split('...(+').length - 1;
      return text.includes('...(+10 more)') && !text.includes('...(+5 more)') &&
        markers === 1;
    } finally {
      restore();
    }
  });
}
function testBatchMarkerCounts() {
  return withFake(() => {
    const {root, el} = renderTree(wideObject(25));
    const {markerEl, detailsEl} = root;
    const text = dump(el);
    return root.children.length === 20 && markerEl !== null &&
      markerEl.dataset.shown === '20' && markerEl.dataset.total === '25' &&
      detailsEl.dataset.limit === '20' && text.includes('...(+5 more)') &&
      !text.includes('k24');
  });
}
function testShowMoreLoadsBatch() {
  return withFake(() => {
    const {root, el} = renderTree(wideObject(25));
    root.markerEl.onclick();
    const text = dump(el);
    return root.children.length === 25 && root.markerEl === null &&
      root.detailsEl.dataset.limit === '40' && text.includes('k24') &&
      !text.includes('...(+');
  });
}
function testShowMoreKeepsOpenRows() {
  // Loading a batch appends rows: expanded rows keep identity and state.
  return withFake(() => {
    const big = {};
    for (let i = 0; i < 25; i++) {
      big[`k${i}`] = {x: i};
    }
    const {root} = renderTree(big);
    const [first] = root.children;
    first.detailsEl.open = true;
    root.markerEl.onclick();
    const [kept] = root.children;
    return kept === first && kept.detailsEl.open === true && root.children.length === 25;
  });
}
function testBatchLimitPersistsAcrossRefill() {
  return withFake(() => {
    const {root, el} = renderTree(wideObject(25));
    root.markerEl.onclick();
    root.refill(wideObject(30));
    if (root.children.length !== 30 || root.markerEl !== null) {
      return false;
    }
    root.refill(wideObject(50));
    return root.children.length === 40 && dump(el).includes('...(+10 more)');
  });
}
function testNestedBatching() {
  return withFake(() => {
    const {root, el} = renderTree({big: wideObject(25)});
    const nested = root.children.find((child) => child.key === 'big');
    if (nested.children.length !== 20 || nested.markerEl === null) {
      return false;
    }
    nested.markerEl.onclick();
    return nested.children.length === 25 && nested.markerEl === null &&
      dump(el).includes('k24');
  });
}
const tests = [
  testRenderLeaf,
  testRenderPlainObject,
  testRenderArray,
  testDepthCap,
  testCaretExpandCollapse,
  testRefillPreservesOpen,
  testRefillRemovesKeys,
  testRefillShapeChange,
  testClassInstance,
  testThrowingGetter,
  testRevokedProxy,
  testCyclic,
  testForInPinned,
  testNullProto,
  testWarningValueRefillKeepsNode,
  testWarningExpectRefillKeepsTree,
  testWarningMapUnaffected,
  testWarningGenericToMapTransition,
  testObjectLeafShowsOneliner,
  testFunctionLeafUnaffected,
  testSnapshotTreeSkipsEnvelope,
  testSnapshotEmptyRendersTag,
  testDroppedKeysLeaveMarker,
  testDroppedIndicesLeaveMarker,
  testNoMarkerWhenFits,
  testNestedDroppedKeysLeaveMarker,
  testMarkerFollowsRefill,
  testBatchMarkerCounts,
  testShowMoreLoadsBatch,
  testShowMoreKeepsOpenRows,
  testBatchLimitPersistsAcrossRefill,
  testNestedBatching,
];
export {tests};
