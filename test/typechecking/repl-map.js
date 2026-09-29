// Shift-Enter: convert content of left editor,
//              write result to right editor
// Tip: open F12/DevTools to see errors and warnings
// Press Shift-Enter in right editor to eval result.
import {TypePanel} from '@runtime-type-inspector/runtime';


/**
 * Processes a key-value mapping of parameters or settings.
 *
 * @param {Map<string, string | number>} config - A Map where keys must be strings
 *   and values can be either strings or numbers.
 * @returns {void}
 */
function processConfig(config) {
  // Implementation logic
}

// ==========================================
// 5 TYPE-CORRECT CALLS
// ==========================================

// 1. Standard map with string keys and string/number values
processConfig(new Map([
  ["host", "localhost"],
  ["port", 8080]
]));

// 2. Map initialized empty and populated validly
const validMap1 = new Map();
validMap1.set("timeout", 5000);
validMap1.set("environment", "production");
processConfig(validMap1);

// 3. Map with explicitly declared types via JSDoc comment
/** @type {Map<string, string | number>} */
const validMap2 = new Map();
validMap2.set("retryCount", 3);
validMap2.set("status", "active");
processConfig(validMap2);

// 4. Map with all string values
processConfig(new Map([
  ["theme", "dark"],
  ["lang", "en-US"]
]));

// 5. Map with all numeric values
processConfig(new Map([
  ["width", 1920],
  ["height", 1080]
]));


// ==========================================
// 5 TYPE-BUG CALLS
// ==========================================

// 6. TYPE BUG: Key is a number instead of a string
processConfig(new Map([
  [101, "admin"], // Error: Type 'number' is not assignable to type 'string'.
  ["role", "user"]
]));

// 7. TYPE BUG: Value is a boolean instead of string | number
processConfig(new Map([
  ["debugMode", true], // Error: Type 'boolean' is not assignable to type 'string | number'.
  ["version", "1.0.0"]
]));

// 8. TYPE BUG: Passing a plain JavaScript Object instead of a Map instance
processConfig({ // Error: Argument of type '{ port: number; host: string }' is not assignable to parameter of type 'Map<string, string | number>'.
  port: 3000,
  host: "127.0.0.1"
});

// 9. TYPE BUG: Value is an array instead of string | number
processConfig(new Map([
  ["tags", ["api", "v1"]] // Error: Type 'string[]' is not assignable to type 'string | number'.
]));

// 10. TYPE BUG: Value is null/undefined
processConfig(new Map([
  ["apiKey", null] // Error: Type 'null' is not assignable to type 'string | number'.
]));


const typePanel = new TypePanel();
Object.assign(window, {typePanel});

