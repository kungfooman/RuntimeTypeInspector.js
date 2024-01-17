import {assertMode } from "./assertMode.js";
import {options    } from "./options.mjs";
import {warnedTable} from "./warnedTable.mjs";
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
  const rule = document.createElement('style');
  rule.innerHTML = /* css */ `
    .rti tr:nth-child(even) {
      background-color: #ccc;
    }
    .rti {
      color: black;
    }
  `;
  div.classList.add('rti');
  document.head.appendChild(rule);
}
/**
 * @returns {HTMLDivElement} The <div> at bottom/right position.
 */
function createDiv() {
  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.bottom = "0px";
  div.style.right = "0px";
  div.style.zIndex = "10";
  niceDiv(div);
  const spanErrors = document.createElement("span");
  const span = document.createElement("span");
  span.innerText = " Type report mode:";
  const select = document.createElement("select");
  const option_spam = document.createElement('option');
  option_spam.text = 'spam';
  const option_once = document.createElement('option');
  option_once.text = 'once';
  const option_never = document.createElement('option');
  option_never.text = 'never';
  select.append(option_spam, option_once, option_never);
  const spamTypeReports = localStorage.getItem('rti-spam-type-reports');
  select.value = options.mode;
  if (spamTypeReports !== null) {
    select.value = spamTypeReports;
  }
  const onchange = () => {
    const {value} = select;
    localStorage.setItem('rti-spam-type-reports', value);
    assertMode(value);
    options.mode = value;
  };
  select.onchange = onchange;
  onchange(); // set mode in options
  const buttonHide = document.createElement("button");
  buttonHide.textContent = 'Hide';
  buttonHide.onclick = () => {
    div.style.display = 'none';
  };
  const buttonSaveState = document.createElement("button");
  buttonSaveState.textContent = 'Save state';
  buttonSaveState.onclick = () => {
    console.log("Save state ");
    /** @type {object[]} */
    const fullState = [];
    /**
     * @todo I would rather save loc/name because it's less likely to change in future... to keep state URL's alive
     */
    for (const key in options.warned) {
      const e = options.warned[key];
      const {deltaState} = e;
      if (deltaState) {
        const {loc, name} = e;
        fullState.push({loc, name, ...deltaState});
      }
    }
    console.log("fullState", JSON.stringify(fullState), fullState);
    // location.hash =
  };
  div.append(spanErrors, span, select, buttonHide, buttonSaveState, warnedTable);
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
  /** @todo debounce or get rid of this interval, ugly html changes all the time even if not needed */
  setInterval(() => {
    spanErrors.innerText = `Type validation errors: ${options.count}`;
  }, 100);
  return div;
}
export {createDiv};
