`RuntimeTypeValidator.js` alongside `JSDoc` is a powerful tool which works in tandem with `Babel.js` and `TypeScript` to generate type-asserting JavaScript files. Assertion code is injected into debug builds to perform runtime type checking of each function and method at runtime - a step which is required beyond pure static typing to help emerge the Incident Management Lifecycle.

The Incident Management Lifecycle is:
 - Identify - recognize the type incidents
 - Respond - debugging in F12/DevTools
 - Resolve - once the issue is cognized it's resolvable
 - Learn - clarify the issue for yourself and share with others

`RuntimeTypeValidator.js` is supporting Identify and Respond of the IML.

**Why is this technology critical?**

This technology is critical because it provides developers with an organized method to ensure type safety with runtime type issue reports while improving code organization, type safety and documentation - making it easier for other developers to understand the code and enforce good coding standards.

RuntimeTypeValidator.js assists the debugging process, since it has a clear definition of what each function expects while issuing warnings, which can act as breakpoints in your source code (as shown in the example debugging session in my showcase video). Finally, good JSDoc can make the entire code base more maintainable, since it's easier for developers to find the specific parts of the code they need to change quickly and easily.

Presentation hunting down a `NaN` bug in the PlayCanvas engine:

https://www.youtube.com/watch?v=o5ipQe2rVKQ

```
npm install runtime-type-validator
```

Live demo: https://jsdoc.killtube.org/