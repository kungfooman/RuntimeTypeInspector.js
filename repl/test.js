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
  // for (const {input, output} of json) {
  //   const res       = await fetch('../' + input);
  //   const txtInput  = await res.text();
  //   const res2      = await fetch('../' + output);
  //   const txtOutput = await res2.text();
  //   const div = document.createElement('div');
  //   document.body.append(div);
  //   const aceDiffer = new AceDiff({
  //     //element: '.custom',
  //     element: div,
  //     left: {
  //       content: txtInput,
  //     },
  //     right: {
  //       content: txtOutput,
  //     },
  //   });
  // }
  const buttonsDiv = document.getElementById('buttons');
  if (!(buttonsDiv instanceof HTMLDivElement)) {
    throw new Error("buttons isn't a <div>");
  }
  const aceDiffer = addDiff('1\n2\n3\n4\n', '1\n2\n33\n4\n');
  for (const {input, output} of json) {
    const button = document.createElement('button');
    buttonsDiv.append(button);
    console.log("add", button);
    button.innerText = input;
    button.onclick = async () => {
      const res       = await fetch('../' + input);
      const txtInput  = await res.text();
      const res2      = await fetch('../' + output);
      const txtOutput = await res2.text();
      aceDiffer.editors.left.ace.setValue(txtInput);
      aceDiffer.editors.left.ace.clearSelection();
      aceDiffer.editors.right.ace.setValue(txtOutput);
      aceDiffer.editors.right.ace.clearSelection();
      //console.log({input, output});
    };
  }
  Object.assign(window, {aceDiffer, json});
}
main();
