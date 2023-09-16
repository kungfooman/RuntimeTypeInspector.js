import { typecheckOptions } from "./typecheckOptions.mjs";
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
  div.style.top = "0px";
  div.style.left = "0px";
  div.style.zIndex = "1";
  niceDiv(div);
  const spanErrors = document.createElement("span");
  const span = document.createElement("span");
  span.innerText = " Spam type reports:";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.onchange = () => {
    if (input.checked) {
      typecheckOptions.mode = "spam";
    } else {
      typecheckOptions.mode = "once";
    }
  }
  input.checked = true;
  div.append(spanErrors, span, input);
  // add when page is loaded
  document.addEventListener("DOMContentLoaded", () => document.body.append(div));
  setInterval(() => {
    spanErrors.innerText = `Type validation errors: ${typecheckOptions.count}`;
  }, 100);
  return div;
}
export { createDiv };
