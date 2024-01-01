import {parse} from '@babel/parser';
import {
  parseJSDoc,
  addTypeChecks,
  expandType,
  expandTypeBabelTS,
  expandTypeDepFree,
  code2ast2code,
  ast2jsonForComparison
} from '@runtime-type-inspector/transpiler';
import * as ti  from '@runtime-type-inspector/transpiler';
import * as rti from '@runtime-type-inspector/runtime';
const hashvars = new Map(location.hash.slice(1).split('&').map(_ => _.split('=')));
if (!hashvars.get('action')) {
  hashvars.set('action', 'typechecking');
}
const currentAction = hashvars.get('action');
const selectAction = document.getElementById("action");
if (!(selectAction instanceof HTMLSelectElement)) {
  throw new Error('This module requires a <select id="action" ...');
}
const selectPreferredExpandType = document.getElementById('preferred-expand-type');
if (!(selectPreferredExpandType instanceof HTMLSelectElement)) {
  throw new Error('This module requires a <select id="action" ...');
}
function setHash() {
  const left = btoa(getLeft());
  const right = btoa(getRight());
  location.hash = `action=${selectAction.value}&left=${left}&right=${right}`;
}
// selectPreferredExpandType.value;
selectAction.value = currentAction;
const buttonREPL = document.getElementById('repl');
if (!(buttonREPL instanceof HTMLButtonElement)) {
  throw new Error('This module requires a <button id="repl" ...');
}
const inputLeft = document.getElementById('left');
if (!(inputLeft instanceof HTMLInputElement)) {
  throw 'This module requires a <input id="left" ...';
}
const inputRight = document.getElementById('right');
if (!(inputRight instanceof HTMLInputElement)) {
  throw 'This module requires a <input id="right" ...';
}
inputLeft.onchange = (event) => {
  const {checked} = event.target;
  if (checked) {
    // Unhide right editor and resize right one to half size again
    aceDivLeft.style.display = "";
    setHalfSizeLeft();
    setHalfSizeRight();
  } else {
    // Hide left editor and resize right one to full size
    aceDivLeft.style.display = "none";
    Object.assign(aceDivRight.style, {
      position: "absolute",
      left: "0vw",
      top: "40px",
      width: "100vw",
      height: "calc(100vh - 40px)",
    });
  }
}
inputRight.onchange = (event) => {
  const {checked} = event.target;
  if (checked) {
    // Unhide left editor and resize right one to half size again
    aceDivRight.style.display = "";
    setHalfSizeLeft();
    setHalfSizeRight();
  } else {
    // Hide left editor and resize right one to full size
    aceDivRight.style.display = "none";
    Object.assign(aceDivLeft.style, {
      position: "absolute",
      left: "0vw",
      top: "40px",
      width: "100vw",
      height: "calc(100vh - 40px)",
    });
  }
}
function getPreferredExpandType() {
  const {value} = selectPreferredExpandType;
  if (value == 'expandTypeTS') {
    return expandType;
  }
  return expandTypeDepFree;
}
function getCodeForAction() {
  switch (getAction()) {
    case 'typechecking':
      return "const ret = addTypeChecks(jsdoc, {expandType: getPreferredExpandType()});\nsetRight(ret);";
    case 'jsdoc':
      return "const ret = parseJSDoc(jsdoc);\nsetRight(JSON.stringify(ret, null, 2));";
    case 'code2ast2code':
      return "const ret = code2ast2code(jsdoc);\nsetRight(ret);";
    case 'expand-type':
      return 'setRight(expandTypeAll(jsdoc));';
  }
  return '// This action has no special code';
}
/**
 * @param {string} name - The name.
 * @param {any} data - Function or object.
 * @returns {string}
 */
function data2code(name, data) {
  if (data instanceof Function) {
    return data.toString();
  } else if (data instanceof Object && data !== null) {
    return `let ${name} = ${JSON.stringify(data, null, 2)};`;
  }
  return `// data2code> unhandled type: name=${name}, type of data: ${typeof data}`;
}
/**
 * Since Asserter extends Stringifier, it needs to appear afterwards.
 * @param {string} a 
 * @param {string} b 
 * @returns {-1|0|1}
 */
function compareBaseClasses(a, b) {
  if (a.startsWith("class Asserter") && b.startsWith("class Stringifier")) {
    return 1;
  }
  if (b.startsWith("class Asserter") && a.startsWith("class Stringifier")) {
    return -1;
  }
  return 0;
}
function activateREPL() {
  const code = Object.entries(ti)
    .map(([key, val]) => data2code(key, val))
    .sort(compareBaseClasses)
    .join('\n');
  const codeLocal = [getPreferredExpandType, expandTypeAll].join('\n');
  const leftContent = aceEditorLeft.getValue().replaceAll('`', '\\`');
  const leftContentAsCode = `const jsdoc = \`${leftContent}\`;`;
  const out = [leftContentAsCode, code, codeLocal, getCodeForAction()].join('\n');
  setLeft(out);
  // @ts-ignore
  selectAction.value = "eval";
}
buttonREPL.onclick = activateREPL;
Object.assign(window, {
  parse,
  ti, ...ti,
  rti, ...rti,
});
let lastStats = {};
function statsPrint() {
  console.table(lastStats);
}
/**
 * @param {string} value
 */
function setLeft(value) {
  if (typeof value !== 'string') {
    aceEditorRight.setValue(`Cannot set type ${typeof value}`);
    return;
  }
  aceEditorLeft.setValue(value);
  aceEditorLeft.clearSelection(); // setValue() selects everything, so unselect it now
}
/**
 * @param {string} value
 */
function setRight(value) {
  if (typeof value !== 'string') {
    aceEditorRight.setValue(`Cannot set type ${typeof value}`);
    return;
  }
  aceEditorRight.setValue(value);
  aceEditorRight.clearSelection(); // setValue() selects everything, so unselect it now
}
function getLeft() {
  return aceEditorLeft.getValue();
}
function getRight() {
  return aceEditorRight.getValue();
}
function actionAST() {
  const ast = parse(getLeft(), {sourceType: 'module'});
  const out = JSON.stringify(ast, function (name, val) {
    if (name === "loc" || name === "start" || name === "end") {
      return undefined; // remove
    }
    return val; // keep
  }, 2);
  setRight(out);
}
function actionAST_TS() {
  const str = getLeft();
  const ast = ts.createSourceFile('repl.ts', str, ts.ScriptTarget.Latest, false /*setParentNodes*/);
  const out = JSON.stringify(ast, function(name, val) {
    if (name === "parent") {
      return undefined; // remove
    }
    return val; // keep
  }, 2);
  setRight(out);
}
function actionAST_BabelTS() {
  const str = getLeft();
  const ast = parse(str, {plugins: ['typescript'], sourceType: "module"});
  const out = JSON.stringify(ast, null, 2);
  setRight(out);
}
/**
 * @param {string} type - The type like `...string`.
 * @returns {string} Structured output of all expandType functions.
 */
function expandTypeAll(type) {
  let out = '';
  out += '// expandTypeTS:\n';
  try {
    const ts = expandType(type);
    out += JSON.stringify(ts, null, 2) + '\n';
  } catch (e) {
    out += e + '\n';
  }
  out += '// expandTypeBabelTS:\n';
  try {
    const babelts = expandTypeBabelTS(type);
    out += JSON.stringify(babelts, null, 2) + '\n';
  } catch (e) {
    out += e + '\n';
  }
  out += '// expandTypeDepFree:\n';
  try {
    const depFree = expandTypeDepFree(type);
    out += JSON.stringify(depFree, null, 2) + '\n';
  } catch (e) {
    out += e + '\n';
  }
  return out;
}
function actionExpandType() {
  setRight(expandTypeAll(getLeft()));
}
function actionJSDoc() {
  const ret = parseJSDoc(getLeft());
  /** @type {string} */
  let out;
  if (ret === undefined) {
    out = '// parseJSDoc returned undefined';
  } else {
    out = '// parseJSDoc output:\n' + JSON.stringify(ret, null, 2);
  }
  setRight(out);
}
function actionTypeChecking() {
  setRight(addTypeChecks(getLeft(), {expandType: getPreferredExpandType()}));
}
/**
 * @todo use Monaco Diff Editor
 * @param {string} left - Left source code.
 * @param {string} right - Right source code.
 */
function compareAST(left = getLeft(), right = getRight()) {
  const l = parse(left , {sourceType: 'module'});
  const r = parse(right, {sourceType: 'module'});
  const ljson = ast2jsonForComparison(l);
  const rjson = ast2jsonForComparison(r);
  const test = ljson === rjson;
  const _ = test ? ' ' : ' NOT ';
  console.log(`AST is ${_} equal`);
  // todo add conversion buttons
  //console.log('ljson', ljson);
  //console.log('rjson', rjson);
  setLeft(ljson);
  setRight(rjson);
}
function actionCode2Ast2Code() {
  const content = getLeft();
  const out = code2ast2code(content);
  if (!out) {
    setRight("// code2ast2code failed");
    return;
  }
  setRight(out);
  // compareAST(content, out);
}
async function runAction() {
  const action = getAction();
  switch (action) {
    case 'ast':
      await actionAST();
      break;
    case 'ast-ts':
      await actionAST_TS();
      break;
    case 'ast-babel-ts':
      await actionAST_BabelTS();
      break;
    case 'jsdoc':
      await actionJSDoc();
      break;
    case 'typechecking':
      await actionTypeChecking();
      break;
    case 'code2ast2code':
      await actionCode2Ast2Code();
      break;
    case 'eval':
      eval(aceEditorLeft.getValue());
      break;
    case 'expand-type':
      await actionExpandType();
      break;
    default:
      setRight(`Action ${action} not implemented`);
  }
}
async function insertTypes() {
  const ret = await postData('insertTypes', {
    file: aceEditorLeft.getValue()
  });
  ret.logs?.map(_ => console.log(..._));
  ret.warns?.map(_ => console.warn(..._));
  console.log(ret);
  if (ret.success) {
    lastStats = ret.stats;
    statsPrint();
    aceEditorRight.setValue(ret.result);
    if (ret.insertTypesAndEval) {
      eval(ret.result.replaceAll('export ', ''));
    }
  } else {
    aceEditorRight.setValue(JSON.stringify(ret, null, 2));
  }
  aceEditorRight.clearSelection(); // setValue() selects everything, so unselect it now
}
/**
 * @typedef {'typechecking'|'code2ast2code'|'ast'|'ast-ts'|'jsdoc'|'eval'|'expand-type'} Action
 */
/** @returns {Action} */
const getAction = () => selectAction.value;
/**
 * @param {string} id - The ID.
 * @returns {HTMLDivElement} - The DIV element.
 */
function createDivWithId(id) {
  let div = document.getElementById(id);
  if (!div) {
    div = document.createElement('div');
    div.id = id;
  }
  if (!(div instanceof HTMLDivElement)) {
    throw "createDivWithId> div creation failed";
  }
  return div;
}
const aceDivLeft = createDivWithId("aceDivLeft");
const aceDivRight = createDivWithId("aceDivRight");
document.body.append(aceDivLeft, aceDivRight);
function setHalfSizeLeft() {
  Object.assign(aceDivLeft.style, {
    position: "absolute",
    left: "0px",
    top: "40px",
    width: "50vw",
    height: "calc(100vh - 40px)",
  });
}
function setHalfSizeRight() {
  Object.assign(aceDivRight.style, {
    position: "absolute",
    left: "50vw",
    top: "40px",
    width: "50vw",
    height: "calc(100vh - 40px)",
  });
}
setHalfSizeLeft();
setHalfSizeRight();
/**
 * @param {string} id - ID of editor.
 * @param {string} txt - Initial text of editor.
 * @param {Function} execShiftEnter - Function for Shift+Enter
 * @param {Function} execAltEnter - Function for Alt+Enter
 * @returns {ACE.Editor} The ACE editor.
 */
function setupAce(id, txt, execShiftEnter, execAltEnter) {
  const aceEditor = ace.edit(id);
  aceEditor.setFontSize(20);
  aceEditor.setTheme('ace/theme/chrome');
  aceEditor.session.setMode('ace/mode/javascript');
  aceEditor.session.setUseWorker(false);
  aceEditor.session.setOptions({
    tabSize: 2,
    useSoftTabs: true
  });
  aceEditor.setValue(txt);
  aceEditor.clearSelection(); // setValue() selects everything, so unselect it now
  aceEditor.commands.addCommand({
    name: 'Insert types',
    bindKey: {win: 'Shift-Enter', mac: 'Shift-Enter'},
    exec: execShiftEnter
  });
  aceEditor.commands.addCommand({
    name: 'Show AST',
    bindKey: {win: 'Alt-Enter', mac: 'Alt-Enter'},
    exec: execAltEnter
  });
  return aceEditor;
}
const aceEditorLeft = setupAce(
  'aceDivLeft',
  `// Shift-Enter: convert content of left editor,
//              write result to right editor
// Tip: open F12/DevTools to see errors and warnings
// Press Shift-Enter in right editor to eval result.
/**
 * @param {number} a
 * @param {number} b
 */
function add(a, b) {
  return a + b;
}
/** @type {number[]} */
const arr = [10_20];
const [a, b] = arr;
const ret = add(a, b);
console.log("ret", ret);
`,
  //editor => insertTypes(),
  editor => runAction(),
  editor => actionAST()
);
const aceEditorRight = setupAce(
  'aceDivRight',
  '// Result editor',
  editor => runRightEditor(),
  editor => console.log("right alt")
);
function runRightEditor() {
  const src = getRight();
  if (src.includes('import') || src.includes('export')) {
    const script = document.createElement("script");
    script.type = "module";
    script.textContent = src;
    document.head.append(script);
    return;
  }
  eval(src);
}
if (hashvars.get('left')) {
  setLeft(atob(hashvars.get('left')));
}
if (hashvars.get('right')) {
  setRight(atob(hashvars.get('right')));
}
export {
  setHash,
  hashvars,
  selectAction,
  selectPreferredExpandType,
  buttonREPL,
  aceDivLeft,
  aceDivRight,
  aceEditorLeft,
  aceEditorRight,
  setLeft,
  setRight,
  getLeft,
  getRight,
  compareAST,
  getPreferredExpandType,
  expandTypeAll,
  runAction,
  data2code,
};
