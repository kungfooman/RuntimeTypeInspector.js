/** Imported modules are instrumented before their overloaded exports are called. */
import {importedOverload} from './overloads-provider.mjs';
import {importedJsOverload} from './overloads-provider-js.js';
importedOverload(1); // ok

importedOverload('ok'); // ok

// @ts-expect-error No overload accepts a boolean.

 // ok

// @ts-expect-error No overload accepts a boolean.
importedOverload(false); // warns

importedJsOverload(1); // ok

// @ts-expect-error The JavaScript module's overloads reject a boolean too.

 // ok

// @ts-expect-error The JavaScript module's overloads reject a boolean too.
importedJsOverload(false); // warns
