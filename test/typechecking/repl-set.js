// Shift-Enter: convert content of left editor,
//              write result to right editor
// Tip: open F12/DevTools to see errors and warnings
// Press Shift-Enter in right editor to eval result.
import {TypePanel} from '@runtime-type-inspector/runtime';


/**
 * Processes a collection of unique items or identifiers.
 *
 * @param {Set<string | number>} items - A Set containing strings or numbers.
 * @returns {void}
 */
function processItems(items) {
  // Implementation logic
}

// ==========================================
// 5 TYPE-CORRECT CALLS
// ==========================================

// 1. Standard Set initialized with string and number elements
processItems(new Set(["apple", 42, "banana"]));

// 2. Set initialized empty and populated validly
const validSet1 = new Set();
validSet1.add("timeout");
validSet1.add(5000);
processItems(validSet1);

// 3. Set with explicitly declared types via JSDoc comment
/** @type {Set<string | number>} */
const validSet2 = new Set();
validSet2.add(3);
validSet2.add("active");
processItems(validSet2);

// 4. Set with all string values
processItems(new Set(["theme", "dark", "en-US"]));

// 5. Set with all numeric values
processItems(new Set([1920, 1080, 60]));


// ==========================================
// 5 TYPE-BUG CALLS
// ==========================================

// 6. TYPE BUG: Element is a boolean instead of string | number
processItems(new Set([
  "admin",
  true // Error: Type 'boolean' is not assignable to type 'string | number'.
]));

// 7. TYPE BUG: Element is an object instead of string | number
processItems(new Set([
  { id: 1 }, // Error: Type '{ id: number; }' is not assignable to type 'string | number'.
  "user"
]));

// 8. TYPE BUG: Passing an Array instead of a Set instance
processItems([ // Error: Argument of type '(string | number)[]' is not assignable to parameter of type 'Set<string | number>'.
  3000,
  "127.0.0.1"
]);

// 9. TYPE BUG: Element is an array instead of string | number
processItems(new Set([
  ["api", "v1"] // Error: Type 'string[]' is not assignable to type 'string | number'.
]));

// 10. TYPE BUG: Element is null/undefined
processItems(new Set([
  null // Error: Type 'null' is not assignable to type 'string | number'.
]));


const typePanel = new TypePanel();
Object.assign(window, {typePanel});
