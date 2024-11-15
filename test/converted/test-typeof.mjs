import {inspectType, inspectTypeWithTemplates, youCanAddABreakpointHere, registerVariable, validateDivision, registerTypedef, registerClass, registerImportNamespaceSpecifier} from '@runtime-type-inspector/runtime';
export * from '@runtime-type-inspector/runtime';
import {options} from '@runtime-type-inspector/runtime';
class TestClass1 {
  abc = 123;
  constructor(greeting = "hi1") {
    this.greeting = greeting;
  }
}
registerClass(TestClass1);
class TestClass2 {
  abc = 123;
  constructor(greeting = "hi2") {
    this.greeting = greeting;
  }
}
registerClass(TestClass2);

/**
 * @param {typeof TestClass1} someClass - Some class.
 * @param {...any} args - The arguments.
 * @returns {object} The object.
 */

function callNew(someClass, ...args) {
  if (!inspectType(someClass, {
    "type": "typeof",
    "argument": "TestClass1",
    "optional": false
  }, 'callNew', 'someClass')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(args, {
    "type": "array",
    "elementType": "any",
    "optional": false
  }, 'callNew', 'args')) {
    youCanAddABreakpointHere();
  }
  return new someClass(...args);
}
const testClass1 = callNew(TestClass1, "hoi1");
console.assert(options.count === 0, "Should have 0 errors here");
const testClass2 = callNew(TestClass2, "hoi2");
console.assert(options.count === 1, "Should have 1 error here");
