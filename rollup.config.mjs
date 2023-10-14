import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
// 1st party Rollup plugins
import { createFilter } from '@rollup/pluginutils';
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
// 3rd party Rollup plugins
import dts from 'rollup-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';
import json from '@rollup/plugin-json';
//import { addTypeChecks } from "./src-transpiler/typeInserter.mjs";
//const { addTypeChecks } = await import("runtime-type-inspector/src-transpiler/typeInserter.mjs");
import commonjs from '@rollup/plugin-commonjs';
import { runtimeTypeInspector } from './plugin-rollup/index.mjs';
/** @typedef {import('rollup').RollupOptions} RollupOptions */
/** @typedef {import('rollup').Plugin} Plugin */
/** @typedef {import('rollup').OutputOptions} OutputOptions */
/** @typedef {import('@rollup/plugin-babel').RollupBabelInputPluginOptions} RollupBabelInputPluginOptions */
/**
 * The ES5 options for babel(...) plugin.
 *
 * @param {string} buildType - Only 'debug' requires special handling so far.
 * @returns {RollupBabelInputPluginOptions} The babel options.
 */
const es5Options = buildType => ({
  babelHelpers: 'bundled',
  babelrc: false,
  comments: buildType === 'debug' || buildType === 'rti',
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
 *
 * @param {string} buildType - Only 'debug' requires special handling so far.
 * @returns {RollupBabelInputPluginOptions} The babel options.
 */
const moduleOptions = buildType => ({
  babelHelpers: 'bundled',
  babelrc: false,
  comments: buildType === 'debug',
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
function buildTarget(buildType, moduleFormat) {
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
  const name = 'rti-transpiler';
  const outputFile = {
    release:  `build/${name}`,
    debug:    `build/${name}.dbg`,
    profiler: `build/${name}.prf`,
    min:      `build/${name}.min`,
    rti:      `build/${name}.rti`,
  };
  const outputExtension = {
    es5: '.js',
    es6: '.mjs'
  };
  /** @type {OutputOptions} */
  const outputOptions = {
    plugins: outputPlugins[buildType || outputPlugins.release],
    format: 'es',
    indent: '\t',
    sourcemap: false,
    name: 'pc',
    preserveModules: false,
    file: `${outputFile[buildType]}${outputExtension[moduleFormat]}`
  };
  const babelOptions = {
    es5: es5Options(buildType),
    es6: moduleOptions(buildType)
  };
  const rootFile = 'src-transpiler/index.mjs';
  console.log("buildType", buildType);
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
  input: 'types/index.d.ts',
  output: [{
    file: 'build/runtime-type-inspector.d.ts',
    footer: 'export as namespace pc;',
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
  if (envTarget === 'types') {
    targets.push(target_types);
  } else if (envTarget === 'extras') {
    targets = targets.concat(target_extras);
  } else {
    ['release', 'debug', 'profiler', 'min', 'rti'].forEach((t) => {
      ['es5', 'es6'].forEach((m) => {
        console.log("envTarget", envTarget);
        if (envTarget === null || envTarget === t || envTarget === m || envTarget === `${t}_${m}`) {
          targets.push(buildTarget(t, m));
        }
      });
    });
  }
  return targets;
};