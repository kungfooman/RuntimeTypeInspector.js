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

1) https://www.npmjs.com/package/@runtime-type-inspector/runtime
2) https://www.npmjs.com/package/@runtime-type-inspector/transpiler
3) https://www.npmjs.com/package/@runtime-type-inspector/parcel-transformer
4) https://www.npmjs.com/package/@runtime-type-inspector/plugin-rollup
5) https://www.npmjs.com/package/@runtime-type-inspector/plugin-webpack (version independent)
6) https://www.npmjs.com/package/@runtime-type-inspector/plugin-webpack4
7) https://www.npmjs.com/package/@runtime-type-inspector/plugin-webpack5

# Acknowledgements

We are incredibly grateful for the support and contribution of our funders, SPRIND GmbH. We would like to thank them for their support and contribution towards making this project possible. Their partnership and generous funding have been instrumental in the success and realization of [RuntimeTypeInspector.js](https://github.com/kungfooman/RuntimeTypeInspector.js).

![sprind-logo-dark](https://github.com/kungfooman/RuntimeTypeInspector.js/assets/5236548/91622e53-f07e-4bd7-8c43-ffb4b96b6048)
<svg width="184" height="24" viewBox="0 0 184 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_274_2129)">
<path d="M13.9902 24C22.0098 24 26.6341 21.2488 26.6341 16.2146C26.6341 12.0585 24.1171 10.2439 17.9707 9.6L11.8829 8.9561C9.01463 8.66341 8.13659 8.13659 8.13659 6.79024C8.13659 5.26829 10.0098 4.44878 13.4049 4.44878C17.678 4.44878 20.839 5.79512 22.478 8.01951L26.4585 4.62439C23.6488 1.46341 19.2585 0 13.6976 0C6.0878 0 1.7561 2.63415 1.7561 7.08293C1.7561 11.239 4.39024 13.2293 9.83415 13.8146L16.6829 14.6341C19.3171 14.9268 20.2537 15.5122 20.2537 16.8585C20.2537 18.6146 18.3805 19.4927 14.3415 19.4927C9.77561 19.4927 6.38049 17.678 4.56585 15.0439L0 18.2634C2.28293 21.7756 7.43415 24 13.9902 24ZM45.6 0.760976H30.4976V23.1805H36.878V16.0976H45.5415C51.278 16.0976 54.9659 13.0537 54.9659 8.25366C54.9073 3.62927 51.4537 0.760976 45.6 0.760976ZM44.078 11.8244H36.878V5.09268H44.1366C46.7707 5.09268 48.2927 6.26341 48.2927 8.42927C48.2341 10.5951 46.6537 11.8244 44.078 11.8244ZM76.3317 23.239H83.4732L77.678 14.5756C81.4244 13.3463 82.6537 10.4195 82.6537 7.90244C82.6537 4.50732 80.6049 0.819512 73.4634 0.819512H58.3024V23.239H64.6244V15.278H71.0634L76.3317 23.239ZM64.6244 5.03415H72C75.0439 5.03415 75.9219 6.49756 75.9219 8.07805C75.9219 9.65854 74.9854 11.1805 72 11.1805H64.6244V5.03415ZM87.278 23.239H93.6V0.760976H87.278V23.239ZM99.3951 23.239H105.132V10.9463V7.8439H105.249C105.6 8.54634 106.42 9.71707 107.005 10.4195L119.005 23.2976H125.327V0.760976H119.59V12.8195V16.039H119.415C119.005 15.161 118.361 14.4 117.659 13.522L106.127 0.760976H99.3366V23.239H99.3951ZM129.6 14.7512H151.376V9.65854H129.6V14.7512ZM155.707 23.239H169.698C177.659 23.239 183.22 18.6146 183.22 11.6488C183.22 4.62439 178.01 0.819512 169.815 0.819512H155.707V23.239ZM162.029 18.9073V5.09268H168.878C173.444 5.09268 176.546 7.31707 176.546 11.7073C176.546 16.2146 173.678 18.8488 168.878 18.8488H162.029V18.9073Z" fill="black"/>
</g>
<defs>
<clipPath id="clip0_274_2129">
<rect width="183.22" height="24" fill="white"/>
</clipPath>
</defs>
</svg>

- Open source, a treasure trove for all to embrace,
- But its potential is limited, without financial grace.
- Let's urge our governments, to invest in its light,
- For a resilient digital infrastructure, shining bright.

![sprind-logo-light](https://github.com/kungfooman/RuntimeTypeInspector.js/assets/5236548/831d1942-3d17-48c8-a795-9a511f423f96)
<svg width="184" height="24" viewBox="0 0 184 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_274_2129)">
<path d="M13.9902 24C22.0098 24 26.6341 21.2488 26.6341 16.2146C26.6341 12.0585 24.1171 10.2439 17.9707 9.6L11.8829 8.9561C9.01463 8.66341 8.13659 8.13659 8.13659 6.79024C8.13659 5.26829 10.0098 4.44878 13.4049 4.44878C17.678 4.44878 20.839 5.79512 22.478 8.01951L26.4585 4.62439C23.6488 1.46341 19.2585 0 13.6976 0C6.0878 0 1.7561 2.63415 1.7561 7.08293C1.7561 11.239 4.39024 13.2293 9.83415 13.8146L16.6829 14.6341C19.3171 14.9268 20.2537 15.5122 20.2537 16.8585C20.2537 18.6146 18.3805 19.4927 14.3415 19.4927C9.77561 19.4927 6.38049 17.678 4.56585 15.0439L0 18.2634C2.28293 21.7756 7.43415 24 13.9902 24ZM45.6 0.760976H30.4976V23.1805H36.878V16.0976H45.5415C51.278 16.0976 54.9659 13.0537 54.9659 8.25366C54.9073 3.62927 51.4537 0.760976 45.6 0.760976ZM44.078 11.8244H36.878V5.09268H44.1366C46.7707 5.09268 48.2927 6.26341 48.2927 8.42927C48.2341 10.5951 46.6537 11.8244 44.078 11.8244ZM76.3317 23.239H83.4732L77.678 14.5756C81.4244 13.3463 82.6537 10.4195 82.6537 7.90244C82.6537 4.50732 80.6049 0.819512 73.4634 0.819512H58.3024V23.239H64.6244V15.278H71.0634L76.3317 23.239ZM64.6244 5.03415H72C75.0439 5.03415 75.9219 6.49756 75.9219 8.07805C75.9219 9.65854 74.9854 11.1805 72 11.1805H64.6244V5.03415ZM87.278 23.239H93.6V0.760976H87.278V23.239ZM99.3951 23.239H105.132V10.9463V7.8439H105.249C105.6 8.54634 106.42 9.71707 107.005 10.4195L119.005 23.2976H125.327V0.760976H119.59V12.8195V16.039H119.415C119.005 15.161 118.361 14.4 117.659 13.522L106.127 0.760976H99.3366V23.239H99.3951ZM129.6 14.7512H151.376V9.65854H129.6V14.7512ZM155.707 23.239H169.698C177.659 23.239 183.22 18.6146 183.22 11.6488C183.22 4.62439 178.01 0.819512 169.815 0.819512H155.707V23.239ZM162.029 18.9073V5.09268H168.878C173.444 5.09268 176.546 7.31707 176.546 11.7073C176.546 16.2146 173.678 18.8488 168.878 18.8488H162.029V18.9073Z" fill="white"/>
</g>
<defs>
<clipPath id="clip0_274_2129">
<rect width="183.22" height="24" fill="white"/>
</clipPath>
</defs>
</svg>

