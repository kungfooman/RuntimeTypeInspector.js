import {copyText} from './copyText.js';
/**
 * Installs the smallest DOM the textarea fallback touches.
 * @param {object} [opts] - Overrides.
 * @param {boolean} [opts.execResult] - What `execCommand` reports.
 * @param {string|null} [opts.failAt] - Stage that throws (`append`), if any.
 * @returns {{restore: Function, areas: object[]}} Restore plus created textareas.
 */
function installFallbackDom({execResult = true, failAt = null} = {}) {
  const saved = {document: globalThis.document, navigator: globalThis.navigator};
  const areas = [];
  const body = {
    children: [],
    append(node) {
      if (failAt === 'append') {
        throw new Error('append blocked');
      }
      this.children.push(node);
    },
  };
  globalThis.document = {
    createElement: (tag) => {
      const area = {
        tag, value: '', style: {},
        select() {},
        remove() {
          body.children = body.children.filter((_) => _ !== area);
        },
      };
      areas.push(area);
      return area;
    },
    body,
    execCommand: () => execResult,
  };
  delete globalThis.navigator;
  return {
    areas,
    body,
    restore() {
      globalThis.document = saved.document;
      if (saved.navigator === undefined) {
        delete globalThis.navigator;
      } else {
        globalThis.navigator = saved.navigator;
      }
    },
  };
}
function testFallbackCopiesSync() {
  // No Clipboard API: the textarea round-trip resolves synchronously.
  const {restore, areas, body} = installFallbackDom({execResult: true});
  try {
    const result = copyText('hello');
    return result === true && areas.length === 1 && areas[0].value === 'hello' && body.children.length === 0;
  } finally {
    restore();
  }
}
function testFallbackFailureIsFalse() {
  // A failed execCommand reports false instead of throwing.
  const {restore} = installFallbackDom({execResult: false});
  try {
    return copyText('hello') === false;
  } finally {
    restore();
  }
}
function testFallbackThrowIsFalse() {
  // A hostile DOM (append throws) still resolves to false, never throws.
  const {restore} = installFallbackDom({failAt: 'append'});
  try {
    return copyText('hello') === false;
  } finally {
    restore();
  }
}
function testClipboardApiSuccess() {
  // With the Clipboard API the write delegates and maps resolve to true.
  const saved = globalThis.navigator;
  globalThis.navigator = {clipboard: {writeText: (text) => ({then: (onOk) => onOk(text)})}};
  try {
    return copyText('via-api') === true;
  } finally {
    globalThis.navigator = saved;
  }
}
function testClipboardApiFailure() {
  // A rejected write maps to false through the error branch.
  const saved = globalThis.navigator;
  globalThis.navigator = {clipboard: {writeText: () => ({then: (_, onErr) => onErr(new Error('denied') )})}};
  try {
    return copyText('via-api') === false;
  } finally {
    globalThis.navigator = saved;
  }
}
export const tests = [
  testFallbackCopiesSync,
  testFallbackFailureIsFalse,
  testFallbackThrowIsFalse,
  testClipboardApiSuccess,
  testClipboardApiFailure,
];
