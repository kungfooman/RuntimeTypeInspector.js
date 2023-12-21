# `RuntimeTypeInspector.js` - your personal type-checking assistant 🕵️🐞🐛

`RuntimeTypeInspector.js` alongside `JSDoc` is a powerful tool which works in tandem with `Babel.js` and `TypeScript` to generate type-asserting JavaScript files. Assertion code is injected into debug builds to perform runtime type checking of each function and method at runtime - a step which is required beyond pure static typing to help emerge the Incident Management Lifecycle.

The Incident Management Lifecycle is:
 - Identify - recognize the type incidents
 - Respond - debugging in F12/DevTools
 - Resolve - once the issue is cognized it's resolvable
 - Learn - clarify the issue for yourself and share with others

`RuntimeTypeInspector.js` is supporting Identify and Respond of the IML.

# Why is this technology critical?

This technology is critical because it provides developers with an organized method to ensure type safety with runtime type issue reports while improving code organization, type safety and documentation - making it easier for other developers to understand the code and enforce good coding standards.

RuntimeTypeInspector.js assists the debugging process, since it has a clear definition of what each function expects while issuing warnings, which can act as breakpoints in your source code (as shown in the example debugging session in my showcase video). Finally, good JSDoc can make the entire code base more maintainable, since it's easier for developers to find the specific parts of the code they need to change quickly and easily.

# Watch our Example Usage Videos!

If you want to see how our product works, take a look at the videos we have prepared. They show you exactly how to use our product with ease.

**Presentation hunting down a `NaN` bug in the PlayCanvas engine:**

https://www.youtube.com/watch?v=o5ipQe2rVKQ

[![hunting down NaN bug in PlayCanvas](https://img.youtube.com/vi/o5ipQe2rVKQ/0.jpg)](https://www.youtube.com/watch?v=o5ipQe2rVKQ)

**Another demonstration fixing `NaN` bugs in the PlayCanvas Volumetric Video project:**

https://www.youtube.com/watch?v=xOp3YWU6M1g

[![volumetric video bug fixing](https://img.youtube.com/vi/xOp3YWU6M1g/0.jpg)](https://www.youtube.com/watch?v=xOp3YWU6M1g)

# Installation

Please take my two Pull Requests for [Transformers.js](https://github.com/xenova/transformers.js/pull/409) (using Webpack) and [PlayCanvas](https://github.com/playcanvas/engine/pull/5817) (using Rollup) as example.

```
npm install @runtime-type-inspector/transpiler
```

Live demo: https://runtimetypeinspector.org/

Thank you for reading and testing! You can also open DevTools and run:

```js
console.log(rtiTranspiler)
```

# Available NPM packages

- https://www.npmjs.com/package/@runtime-type-inspector/runtime
- https://www.npmjs.com/package/@runtime-type-inspector/transpiler
- https://www.npmjs.com/package/@runtime-type-inspector/plugin-parcel1
- https://www.npmjs.com/package/@runtime-type-inspector/parcel-transformer (Parcel v2)
- https://www.npmjs.com/package/@runtime-type-inspector/plugin-rollup
- https://www.npmjs.com/package/@runtime-type-inspector/plugin-webpack (version independent)
- https://www.npmjs.com/package/@runtime-type-inspector/plugin-webpack4
- https://www.npmjs.com/package/@runtime-type-inspector/plugin-webpack5

# Acknowledgements

We are incredibly grateful for the support and contribution of our funders, [Sovereign Tech Fund](https://www.sovereigntechfund.de/). We would like to thank them for their support and contribution towards making this project possible. Their partnership and generous funding have been instrumental in the success and realization of [RuntimeTypeInspector.js](https://github.com/kungfooman/RuntimeTypeInspector.js).

![STF-Logo-Wide-Dark-RGB](https://github.com/kungfooman/RuntimeTypeInspector.js/assets/5236548/a5e5870c-2f93-4047-877f-21f823473a68)
![STF-Logo-Wide-White-RGB](https://github.com/kungfooman/RuntimeTypeInspector.js/assets/5236548/94e790d9-9fda-4c17-a811-0af370d708b8)

> Open source, a treasure trove for all to embrace,
> 
> But its potential is limited, without financial grace.
> 
> Let's urge our governments, to invest in its light,
> 
> For a resilient digital infrastructure, shining bright.
