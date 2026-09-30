import {FakeElement} from './FakeElement.js';
import {FakeNode} from './FakeNode.js';
import {FakeText} from './FakeText.js';
/**
 * Installs the fake browser globals `Warning` needs, returning a restore fn.
 * @returns {Function} Restore.
 */
function installFakeBrowser() {
  const savedDocument = globalThis.document;
  const savedNode = globalThis.Node;
  globalThis.Node = FakeNode;
  globalThis.document = {
    createElement: () => new FakeElement(),
    createTextNode: (text) => new FakeText(text),
  };
  return () => {
    if (savedDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = savedDocument;
    }
    if (savedNode === undefined) {
      delete globalThis.Node;
    } else {
      globalThis.Node = savedNode;
    }
  };
}
export {installFakeBrowser};
