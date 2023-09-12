// import * as runtimeTypeChecker from '../src-runtime/runtime-type-checker.mjs';
import { expandType } from '../src/expandType.mjs';
import { expandTypeDepFree } from '../src/expandTypeDepFree.mjs';
import { parseJSDoc } from '../src/parseJSDoc.mjs';
import { parseSync } from '@babel/core';
import { TypeStringifier } from '../src/TypeStringifier.mjs';
import { addTypeChecks } from '../src/addTypeChecks.mjs';
const currentAction = location.hash.slice(1).split('=')[1] || 'jsdoc';
const selectAction = document.getElementById("action");
if (!(selectAction instanceof HTMLSelectElement)) {
  throw 'This module requires a <select id="action" ...';
}
selectAction.value = currentAction;
Object.assign(window, {
  expandType,
  expandTypeDepFree,
  parseJSDoc,
  parseSync,
  TypeStringifier, addTypeChecks,
  // runtimeTypeChecker
});
let lastStats = {};
function statsPrint() {
  console.table(lastStats);
}
async function actionAST() {
  const content = aceEditorLeft.getValue();
  const ast = parseSync(content);
  const out = JSON.stringify(ast, function(name, val) {
    if (name == "loc" || name == "start" || name == "end") {
      return undefined; // remove
    }
    return val; // keep
  }, 2);
  aceEditorRight.setValue(out);
  aceEditorRight.clearSelection(); // setValue() selects everything, so unselect it now
}
async function actionJSDoc() {
  const content = aceEditorLeft.getValue();
  const ret = parseJSDoc(content);
  /** @type {string} */
  let out;
  if (ret === undefined) {
    out = '// parseJSDoc returned undefined';
  } else {
    out = '// parseJSDoc output:\n' + JSON.stringify(ret, null, 2);
  }
  aceEditorRight.setValue(out);
}
async function actionTypeChecking() {
  const content = aceEditorLeft.getValue();
  const out = addTypeChecks(content);
  aceEditorRight.setValue(out);
  aceEditorRight.clearSelection(); // setValue() selects everything, so unselect it now
}
async function runAction() {
  switch (getAction()) {
    case 'ast':
      await actionAST();
      break;
    case 'jsdoc':
      await actionJSDoc();
      break;
    case 'typechecking':
      await actionTypeChecking();
      break;
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
async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

/** @returns {'typechecking'|'ast'|'jsdoc'} */
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
Object.assign(aceDivLeft.style, {
  position: "absolute",
  left: "0px",
  top: "40px",
  width: "50vw",
  height: "100vh",
});
Object.assign(aceDivRight.style, {
  position: "absolute",
  left: "50vw",
  top: "40px",
  width: "50vw",
  height: "100vh",
});

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
  '// Shift-Enter: convert content of left editor,\n//              write result to right editor\n// Tip: open Devtools to see warnings',
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
  eval(aceEditorRight.getValue());
}
