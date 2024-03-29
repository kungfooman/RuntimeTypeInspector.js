import {execSync} from 'child_process';
import fs from 'fs';
import path from 'path';
// 1st party Rollup plugins
import {createFilter} from '@rollup/pluginutils';
import {babel       } from '@rollup/plugin-babel';
import {nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
// 3rd party Rollup plugins
import dts from 'rollup-plugin-dts';
import {visualizer} from 'rollup-plugin-visualizer';
import json from '@rollup/plugin-json';
//import {addTypeChecks} from "./src-transpiler/typeInserter.js";
//const {addTypeChecks} = await import("runtime-type-inspector/src-transpiler/typeInserter.js");
import commonjs from '@rollup/plugin-commonjs';
/** @typedef {import('rollup').RollupOptions} RollupOptions */
/** @typedef {import('rollup').Plugin} Plugin */
/** @typedef {import('rollup').OutputOptions} OutputOptions */
/** @typedef {import('@rollup/plugin-babel').RollupBabelInputPluginOptions} RollupBabelInputPluginOptions */
/**
 * The ES5 options for babel(...) plugin.
 * @returns {RollupBabelInputPluginOptions} The babel options.
 */
const es5Options = () => ({
  babelHelpers: 'bundled',
  babelrc: false,
  comments: true,
  compact: false,
  minified: false,
  presets: [
    [
      '@babel/preset-env', {
        loose: !true,
        modules: false,
        targets: {
          ie: '11'
        }
      }
    ]
  ]
});
/**
 * The ES6 options for babel(...) plugin.
 * @returns {RollupBabelInputPluginOptions} The babel options.
 */
const moduleOptions = () => ({
  babelHelpers: 'bundled',
  babelrc: false,
  comments: true,
  compact: false,
  minified: false,
  presets: [
    [
      '@babel/preset-env', {
        bugfixes: true,
        loose: true,
        modules: false,
        targets: {
          esmodules: true
        }
      }
    ]
  ]
});
/**
 * Build a target that rollup is supposed to build.
 *
 * @param {'debug'|'release'|'profiler'|'min'} buildType - The build type.
 * @param {'es5'|'es6'} moduleFormat - The module format.
 * @returns {RollupOptions} One rollup target.
 */
function buildTarget(name, rootFile, path, buildType, moduleFormat) {
  const banner = {
    debug: ' (DEBUG)',
    release: ' (RELEASE)',
    profiler: ' (PROFILE)',
    min: ' (RELEASE)'
  };
  const outputPlugins = {
    release: [],
    min: [
      terser()
    ]
  };
  if (process.env.treemap) {
    outputPlugins.min.push(visualizer({
      filename: 'treemap.html',
      brotliSize: true,
      gzipSize: true
    }));
  }
  if (process.env.treenet) {
    outputPlugins.min.push(visualizer({
      filename: 'treenet.html',
      template: 'network'
    }));
  }
  if (process.env.treesun) {
    outputPlugins.min.push(visualizer({
      filename: 'treesun.html',
      template: 'sunburst'
    }));
  }
  const outputFile = {
    release:  `${path}`,
    debug:    `${path}.dbg`,
    profiler: `${path}.prf`,
    min:      `${path}.min`,
    rti:      `${path}.rti`,
  };
  const outputExtension = {
    es5: '.cjs',
    es6: '.mjs'
  };
  /** @type {Record<string, 'umd'|'es'>} */
  const outputFormat = {
    es5: 'umd',
    es6: 'es'
  };
  /** @type {OutputOptions} */
  const outputOptions = {
    plugins: outputPlugins[buildType || outputPlugins.release],
    format: outputFormat[moduleFormat],
    indent: '\t',
    sourcemap: false,
    name,
    preserveModules: false,
    file: `${outputFile[buildType]}${outputExtension[moduleFormat]}`
  };
  const babelOptions = {
    es5: es5Options(buildType),
    es6: moduleOptions()
  };
  return {
    input: rootFile,
    output: outputOptions,
    plugins: [
      //runtimeTypeInspector(buildType === 'debug'),
      babel(babelOptions[moduleFormat]),
      //nodeResolve({
      //  browser: true
      //}),
      //commonjs(),
      //json(),
    ],
    ///external: ['fs', 'path', 'url', 'sharp', 'onnxruntime-node', 'onnxruntime-web', 'stream/web'],
  };
}
/** @type {RollupOptions} */
const target_types = {
  input: 'types/transpiler/index.d.mts',
  output: [{
    file: '@runtime-type-inspector/transpiler/types.d.ts',
    //footer: 'export as namespace rtiTranspiler;',
    format: 'es'
  }],
  plugins: [
    dts()
  ]
};
export default (args) => {
  /** @type {RollupOptions[]} */
  let targets = [];
  const envTarget = process.env.target ? process.env.target.toLowerCase() : null;
  if ((envTarget === null) && fs.existsSync('build')) {
    // no targets specified, clean build directory
    fs.rmSync('build', {recursive: true});
  }
  if (envTarget === 'types') {
    targets.push(target_types);
  } else if (envTarget === 'extras') {
    targets = targets.concat(target_extras);
  } else {
    ['release', /*'debug', 'profiler', 'min', 'rti'*/].forEach((t) => {
      ['es5', 'es6'].forEach((m) => {
        if (envTarget === null || envTarget === t || envTarget === m || envTarget === `${t}_${m}`) {
          targets.push(buildTarget('rtiTranspiler', 'src-transpiler/index.js', '@runtime-type-inspector/transpiler/index', t, m));
          targets.push(buildTarget('rtiRuntime'   , 'src-runtime/index.js'   , '@runtime-type-inspector/runtime/index'   , t, m));
        }
      });
    });
  }
  return targets;
};
