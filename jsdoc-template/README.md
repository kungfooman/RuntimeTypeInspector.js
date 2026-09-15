# RTI JSDoc Template
Vendored from `@playcanvas/jsdoc-template@1.1.2` for RuntimeTypeInspector.js (issue #72). Handlebars + catharsis PEGJS removed; now typed string templates + `src-runtime/stringifyType` — `jsdoc -c jsdoc.json` uses `./jsdoc-template` locally.

[![NPM version][npm-badge]][npm-url]
[![License][license-badge]][license-url]
[![CI][ci-badge]][ci-url]

## How to build

Ensure you have [Node.js](https://nodejs.org) installed. Then, install all of the required Node.js dependencies:

    npm install

Then you can build CSS styles:

    npm run build

To test static html files, you need to use PlayCanvas Engine repository. Clone https://github.com/playcanvas/engine besides this repository:

    ./playcanvas-jsdoc-template/
    ./engine/

Then edit `./engine/conf-api.json`, field `opts.template` to: `"../playcanvas-jsdoc-template"` so it will use your local copy of templates for building the docs, and then in `./engine/` run:

    npm run docs

Static files will be generated to:

    ./engine/docs/

These can be served by the web server of your choice or viewed directly by opening `./engine/docs/index.html` in a web browser.

[ci-badge]: https://github.com/playcanvas/playcanvas-jsdoc-template/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/playcanvas/playcanvas-jsdoc-template/actions/workflows/ci.yml
[npm-badge]: https://img.shields.io/npm/v/@playcanvas/jsdoc-template
[npm-url]: https://www.npmjs.com/package/@playcanvas/jsdoc-template
[license-badge]: https://img.shields.io/npm/l/@playcanvas/jsdoc-template.svg?cacheSeconds=2592000
[license-url]: LICENSE

