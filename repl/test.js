import {addTypeChecks, expandType} from "@runtime-type-inspector/transpiler";
/**
 * @param {string} a - Left text.
 * @param {string} b - Right text.
 * @returns {object} AceDiff editor instance.
 */
function addDiff(a, b) {
  const element = document.createElement('div');
  document.getElementById("here").innerHTML = '';
  document.getElementById("here").append(element);
  return new AceDiff({
    element,
    left: {
      content: a,
    },
    right: {
      content: b,
    },
  });
}
async function main() {
  const resp = await fetch("../test/typechecking.json");
  const json = await resp.json();
  const buttonsDiv = document.getElementById('buttons');
  if (!(buttonsDiv instanceof HTMLDivElement)) {
    throw new Error("buttons isn't a <div>");
  }
  const aceDiffer = addDiff('1\n2\n3\n4\n', '1\n2\n33\n4\n');
  /** @type {HTMLButtonElement[]} */
  const buttons = [];
  for (const {input, output} of json) {
    const button = document.createElement('button');
    buttonsDiv.append(button);
    button.innerText = input;
    const res       = await fetch('../' + input);
    const txtInput  = await res.text();
    const res2      = await fetch('../' + output);
    const txtOutput = await res2.text();
    let actualResult = addTypeChecks(txtInput, {expandType, addHeader: false});
    // Remove multiple newlines into one
    // I would rather not do it, but Stringifier needs a bit more love in other areas:
    //  - multiline array output when elements surpass a max-col option
    actualResult = actualResult.replace(/\n+/g, '\n').trim();
    const success = actualResult === txtOutput.trim();
    button.style.backgroundColor = success ? 'lime' : 'red';
    button.onclick = async () => {
      aceDiffer.editors.left.ace.setValue(txtInput);
      aceDiffer.editors.left.ace.clearSelection();
      let rightText = txtOutput;
      if (!success) {
        rightText += `\n\n// Actual result:\n${actualResult}`;
      }
      aceDiffer.editors.right.ace.setValue(rightText);
      aceDiffer.editors.right.ace.clearSelection();
      //console.log({input, output});
    };
    buttons.push(button);
  }
  buttons[1].onclick();
  Object.assign(window, {aceDiffer, json});
}
main();
