import {typecheckOptions    } from "./typecheckOptions.mjs";
import {typecheckWarnedTable} from "./typecheckTable.mjs";
/**
 * @param {HTMLDivElement} div - The <div>.
 */
function niceDiv(div) {
  div.style.border  = "1px solid #C1C1C1";
  div.style.margin = "10px";
  div.style.padding = "10px";
  div.style.textAlign = "left";
  div.style.lineHeight = "25px";
  div.style.backgroundColor = "#F3F3F3";
  div.style.borderRadius = "4px";
}
/**
 * @todo
 * Show number of validations too? Might be too noisy.
 * @returns {HTMLDivElement}
 */
function createDiv() {
  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.bottom = "0px";
  div.style.right = "0px";
  div.style.zIndex = "1";
  niceDiv(div);
  const spanErrors = document.createElement("span");
  const span = document.createElement("span");
  span.innerText = " Spam type reports:";
  const input = document.createElement("input");
  input.type = "checkbox";
  const spamTypeReports = localStorage.getItem('rti-spam-type-reports');
  input.checked = true;
  if (spamTypeReports !== null) {
    input.checked = spamTypeReports === 'spam' ? true : false;
  }
  const onchange = () => {
    localStorage.setItem('rti-spam-type-reports', input.checked ? 'spam' : 'once');
    if (input.checked) {
      typecheckOptions.mode = "spam";
    } else {
      typecheckOptions.mode = "once";
    }
  };
  input.onchange = onchange;
  onchange(); // update mode from localStorage
  const buttonHide = document.createElement("button");
  buttonHide.textContent = 'Hide';
  buttonHide.onclick = () => {
    div.style.display = 'none';
  };
  div.append(spanErrors, span, input, buttonHide, typecheckWarnedTable);
  div.style.maxHeight = '200px';
  div.style.overflow = 'scroll';
  const finalFunc = () => document.body.append(div);
  // Add our <div> to <body> when possible
  if (document.readyState === "complete") {
    finalFunc();
  } else {
    // add when page is loaded
    document.addEventListener("DOMContentLoaded", finalFunc);
  }
  setInterval(() => {
    spanErrors.innerText = `Type validation errors: ${typecheckOptions.count}`;
  }, 100);
  return div;
}
export {createDiv};
