import {inspectType} from './inspectType.js';
import {explainMismatch} from './explainMismatch.js';
import {compareText} from './compareText.js';
import {registerClass} from './registerClass.js';
import {registerTypedef} from './registerTypedef.js';
import {classes} from './registerClass.js';
import {typedefs, bumpTypedefVersion} from './registerTypedef.js';
import {options, setOptions} from './options.js';
import {validators} from './validators.js';
import {validateArray} from './validateArray.js';
class ReportWidget {
  constructor() {
    this.r = 1;
    this.g = 1;
    this.b = 1;
    this.a = 1;
  }
  spin() {
    return this.r;
  }
}
class ReportVec2 {
  constructor() {
    this.x = 0;
    this.y = 0;
  }
  set() {
    return this;
  }
}
function prepare() {
  // Registry-wiping specs run in the same process, so every test
  // re-registers its own entries instead of trusting module scope.
  // Runtime harvesting sees only prototype methods, never constructor
  // assignments: like the engine twins, register the harvested data shapes
  // next to the classes so snapshots diff against data, not just methods.
  registerClass(ReportWidget);
  registerClass(ReportVec2);
  registerTypedef('ReportWidget', {type: 'object', properties: {r: 'number', g: 'number', b: 'number', a: 'number', spin: 'Function'}});
  registerTypedef('ReportVec2', {type: 'object', properties: {x: 'number', y: 'number', set: 'Function'}});
}
/**
 * Captures the posted report of one failing check. Cross-realm mode pushes
 * the report through `structuredClone`, which is what the browser does at
 * the iframe boundary: values the checker passed by reference arrive as
 * copies. Loc differs per mode so the second transport is a full report,
 * never a key-only repeat. Reports carry no diagnosis: the panel diffs
 * lazily on open, in its own realm.
 * @param {*} value - The failing value to check.
 * @param {*} expect - The expected type.
 * @param {string} loc - The check location.
 * @param {string} name - The argument name.
 * @param {boolean} crossRealm - Clone the report like a realm crossing.
 * @returns {object | null} The posted report, or null when nothing posted.
 */
function postReport(value, expect, loc, name, crossRealm) {
  prepare();
  const prevParent = globalThis.parent;
  let posted = null;
  globalThis.parent = {postMessage: (msg) => {
    posted = msg;
  }};
  try {
    inspectType(value, expect, `${loc}-${crossRealm ? 'cross' : 'same'}`, name);
  } finally {
    globalThis.parent = prevParent;
  }
  if (posted === null) {
    return null;
  }
  return crossRealm ? structuredClone(posted) : posted;
}
function testReportCarriesNoDiagnosis() {
  // Per-error cost stays at validation: the report carries value, expect
  // and messages, never a precomputed diagnosis. Both transports agree.
  for (const crossRealm of [false, true]) {
    const posted = postReport({r: 'x'}, 'ReportWidget', 'reportLocOne', 'reportNameOne', crossRealm);
    if (!posted || posted.findings !== undefined || posted.stub !== undefined) {
      return false;
    }
  }
  return true;
}
function testLazyDiffFindsRowInForeignRegistry() {
  // The panel diffs on open against whatever registry it has: with the
  // types registered the lazy diff finds the true row. Rendered from the
  // transported value, not a hand-built one, so clone damage would show.
  for (const crossRealm of [false, true]) {
    const posted = postReport({r: 'x'}, 'ReportWidget', 'reportLocTwo', 'reportNameTwo', crossRealm);
    const rendered = compareText({msg: 'm', expect: posted.expect, value: posted.value, name: 'reportNameTwo', hits: 1});
    if (!rendered.includes('reportNameTwo') || !rendered.includes('Diagnosis:')) {
      return false;
    }
  }
  return true;
}
function testLazyDiffDegradesWithoutRegistry() {
  // Honest degradation, pinned: a panel without the engine twins cannot
  // resolve the reference, so the on-click diff reports one opaque row
  // instead of inventing member rows. Late-loading twins can only add
  // information from here, never silently change a verdict-shaped row.
  prepare();
  const posted = postReport({r: 'x'}, 'ReportWidget', 'reportLocThree', 'reportNameThree', false);
  const savedTypedefs = {...typedefs};
  const savedClasses = {...classes};
  Object.keys(typedefs).forEach((key) => delete typedefs[key]);
  Object.keys(classes).forEach((key) => delete classes[key]);
  bumpTypedefVersion();
  let rendered;
  try {
    rendered = compareText({msg: 'm', expect: posted.expect, value: posted.value, name: 'reportNameThree', hits: 1});
  } finally {
    Object.assign(typedefs, savedTypedefs);
    Object.assign(classes, savedClasses);
    bumpTypedefVersion();
  }
  const localRows = (rendered.match(/^- \[/gm) || []).length;
  return localRows === 1 && rendered.includes('reportNameThree');
}
function testAnchorsPayloadKeepsSingleRow() {
  // Production anchors shape: dense arrays satisfy their number[] members
  // and the live Color-like instance matches nominally after tagging, so
  // the only failing property is the genuinely mistyped alignment. The
  // on-click diff must say exactly that in both realms, never the
  // phantom union rows. Tints are live instances, not hand-tagged
  // literals, so the snapshot envelope path runs for real.
  const widget = new ReportWidget();
  for (const crossRealm of [false, true]) {
    const posted = postReport(
      {anchor: [0, 0, 1, 1], tint: widget, align: [0, 0]},
      {type: 'object', properties: {
        anchor: {type: 'union', members: ['ReportVec2', {type: 'array', elementType: 'number'}], optional: true},
        tint: {type: 'union', members: ['ReportWidget', {type: 'array', elementType: 'number'}], optional: true},
        align: {type: 'ReportVec2', optional: true},
      }},
      'reportLocFour',
      'reportNameFour',
      crossRealm,
    );
    const {findings} = explainMismatch(posted.value, posted.expect, 'reportNameFour');
    if (!(Array.isArray(findings) && findings.length === 1 && findings[0].path === 'reportNameFour.align')) {
      return false;
    }
    if (crossRealm && (!posted.value || posted.value.tint.$type !== 'ReportWidget' || !Array.isArray(posted.value.anchor))) {
      return false;
    }
  }
  return true;
}
function testOptionDriftShowsInLocalDiff() {
  // Documented drift, pinned openly: a panel stricter than the checker
  // (infinities rejected at render time, allowed at check time) shows an
  // extra `a[1]` row the verdict never saw. The lazy diff reflects the
  // rendering realm; it does not promise the checking verdict.
  prepare();
  const prev = {strictNullChecks: options.strictNullChecks, checkInfinity: options.checkInfinity, exactObjects: options.exactObjects};
  setOptions({strictNullChecks: true, checkInfinity: false, exactObjects: false});
  let posted;
  try {
    posted = postReport({a: [0, Infinity], b: 'x'}, {type: 'object', properties: {a: {type: 'array', elementType: 'number'}, b: 'number'}}, 'reportLocFive', 'reportNameFive', false);
  } finally {
    setOptions(prev);
  }
  if (!posted) {
    return false;
  }
  setOptions({strictNullChecks: true, checkInfinity: true, exactObjects: true});
  let rendered;
  try {
    rendered = compareText({msg: 'm', expect: posted.expect, value: posted.value, name: 'reportNameFive', hits: 1});
  } finally {
    setOptions(prev);
  }
  const rows = rendered.match(/^- \[/gm) || [];
  return rows.length === 2 && rendered.includes('a[1]') && rendered.includes('reportNameFive.b');
}
function testValidatorDriftShowsInLocalDiff() {
  // Documented drift, pinned openly: a panel realm whose validator table
  // disagrees with the checker's (a second runtime copy with a userland
  // override, a stale bundle) invents phantom union rows for dense clean
  // arrays: per-element probes use the intact number check while the
  // whole-array probe hits the hostile array validator, tripping the
  // later-element fallback. This is the exact shape of the production
  // phantom rows; the lazy diff reproduces them, it does not suppress
  // them.
  prepare();
  const posted = postReport(
    {anchor: [0, 0, 1, 1], align: [0, 0]},
    {type: 'object', properties: {
      anchor: {type: 'union', members: ['ReportVec2', {type: 'array', elementType: 'number'}], optional: true},
      align: {type: 'ReportVec2', optional: true},
    }},
    'reportLocSix',
    'reportNameSix',
    false,
  );
  if (!posted) {
    return false;
  }
  validators.validateArray = () => false;
  let rendered;
  try {
    rendered = compareText({msg: 'm', expect: posted.expect, value: posted.value, name: 'reportNameSix', hits: 1});
  } finally {
    validators.validateArray = validateArray;
  }
  return rendered.includes('closest is') && rendered.includes('reportNameSix.anchor');
}
function testTypedArrayDiagnosisSurvivesTransit() {
  // Views cross realms by buffer, never by reference: no `$type` expando
  // may appear in the diagnosis (structuredClone drops it, and untagged
  // views no longer invent it), and the same-vs-cross renders agree
  // exactly. Diffed bare against the class shape, a view reports its
  // missing and excess keys: x and y absent, indices excess, and never a
  // `$type` row.
  prepare();
  for (const crossRealm of [false, true]) {
    const posted = postReport(
      new Float32Array([0, 0]),
      'ReportVec2',
      'reportLocSeven',
      'reportNameSeven',
      crossRealm,
    );
    const {findings} = explainMismatch(posted.value, posted.expect, 'reportNameSeven');
    const paths = Array.isArray(findings) ? findings.map((row) => row.path) : [];
    if (!(paths.length === 4 && paths.every((path) => path === 'reportNameSeven' || path.startsWith('reportNameSeven.')))) {
      return false;
    }
    if (findings.some((row) => row.path.endsWith('$type') || JSON.stringify(row).includes('$type'))) {
      return false;
    }
    const rendered = compareText({msg: 'm', expect: posted.expect, value: posted.value, name: 'reportNameSeven', hits: 1});
    const localRows = rendered.match(/^- \[/gm) || [];
    if (localRows.length !== 4 || rendered.includes('$type')) {
      return false;
    }
  }
  return true;
}
export const tests = [
  testReportCarriesNoDiagnosis,
  testLazyDiffFindsRowInForeignRegistry,
  testLazyDiffDegradesWithoutRegistry,
  testAnchorsPayloadKeepsSingleRow,
  testOptionDriftShowsInLocalDiff,
  testValidatorDriftShowsInLocalDiff,
  testTypedArrayDiagnosisSurvivesTransit,
];
