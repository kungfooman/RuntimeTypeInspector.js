import resolve from '@rollup/plugin-node-resolve';
import {fileURLToPath} from 'node:url';
import MagicString from 'magic-string';
import { runtimeTypeInspector } from '@runtime-type-inspector/plugin-rollup';

// Same glsl() + header() transforms as three.js utils/build/rollup.config.js:
// stringifies /* glsl */`...` template literals in *.glsl.js shader chunks so
// the RTI instrumented output stays valid JS without their build system, and
// stamps the same @license header so our build/three.*.js outputs are
// drop-in overwrites of the upstream build artifacts.
function glsl() {
    return {
        transform(code, id) {
            if (/\.glsl\.js$/.test(id) === false) {
                return;
            }
            code = new MagicString(code);
            code.replace(/\/\* glsl \*\/`(.*?)`/sg, function (match, p1) {
                return JSON.stringify(
                    p1.trim().replace(/\r/g, '').replace(/[ \t]*\/\/.*\n/g, '').replace(/[ \t]*\/\*[\s\S]*?\*\//g, '').replace(/\n{2,}/g, '\n')
                );
            });
            return {
                code: code.toString(),
                map: code.generateMap()
            };
        }
    };
}

function header() {
    return {
        renderChunk(code) {
            code = new MagicString(code);
            code.prepend(`/**\n * @license\n * Copyright 2010-2026 Three.js Authors\n * SPDX-License-Identifier: MIT\n */\n`);
            return {
                code: code.toString(),
                map: code.generateMap()
            };
        }
    };
}

/**
 * Pins `@runtime-type-inspector/runtime` to one file for every importer.
 * Two installs carry that name: the sandbox `file:` dep (the freshly built
 * working-tree bundle `npm run build` emits at
 * `@runtime-type-inspector/runtime/index.mjs`, which `build.sh` refreshes
 * before this build) and the stale published copy at the repo root
 * `node_modules` (refreshed only by `sync-consumer`, for outside projects).
 * Importers under `supported/three/` resolve the first, importers under
 * `tmp/supported/three.js/src/` walk up to the second, so without this pin
 * Rollup bundles the whole runtime twice (`options$1`, a second `options`
 * object, a second class registry): checks increment one counter while the
 * panel badge reads the other (posted 1, delta 0), and cross-entry
 * `instanceof` misses return. Returning one absolute id makes every
 * importer share a single runtime evaluation.
 * @returns {import('rollup').Plugin} The pin plugin.
 */
function singleRuntime() {
    const runtimeId = fileURLToPath(new URL('../../@runtime-type-inspector/runtime/index.mjs', import.meta.url));
    return {
        name: 'single-runtime',
        resolveId(imported) {
            if (imported === '@runtime-type-inspector/runtime') {
                return runtimeId;
            }
            return null;
        }
    };
}

function rti() {
    return runtimeTypeInspector({
        ignoredFiles: [
            'node_modules'
        ],
        inspectIndexedAccess: false,
        // Upstream three has a single version (its own package.json), and so
        // does this build now: with shared chunks the instrumented modules
        // call into one runtime instance, so no per-module header call can
        // clobber a shared version either way.
        projectVersion: null,
        // The emitted `export * from '@runtime-type-inspector/runtime'`
        // would re-export the runtime out of all 700 instrumented engine
        // modules: every entry then re-exports every runtime helper, so no
        // entry can be loaded without every other, and Rollup answers the
        // cycle by cloning the whole runtime per entry (`options$1`, a
        // second class registry: checks increment one counter while the
        // badge reads the other). Entries import what they need explicitly
        // instead.
        reexportRuntime: false
    });
}

/** @typedef {import('rollup').RollupOptions} RollupOptions */

/**
 * RTI-instrumented mirror of the upstream build (utils/build/rollup.config.js):
 * same multi-entry shape with shared chunks, same output filenames, same
 * glsl()/header() transforms, plus the RTI plugin. One build call emits all
 * five entries into build-upstream-names/; Rollup hoists the modules they
 * share (the whole runtime, Three.Core.js, three-enums.js) into hashed
 * shared chunks that every entry imports. Shared module instances mean a
 * single class identity per engine class (no cross-bundle `instanceof`
 * misses like `CubeTexture` vs `Texture`), a single class/typedef registry,
 * a single `TypePanel.instance` (no twin panels), and a single
 * `options.count` (no zero badge over a full list). Entries are the
 * committed .rti.js files (upstream source, then shims), so the
 * instrumented sources are the same modules the smoke/exercise scripts
 * already gate.
 * @type {RollupOptions}
 */
export default {
    input: {
        'three.core': 'three-core.rti.js',
        'three.module': 'three.rti.js',
        'three.webgpu': 'three-webgpu.rti.js',
        'three.tsl': 'three-tsl.rti.js',
        'three.webgpu.nodes': 'three-webgpu-nodes.rti.js',
    },
    output: {
        format: 'esm',
        dir: 'build-upstream-names',
        entryFileNames: '[name].js',
        // Shared chunks keep hashed names (same as upstream's build):
        // the engine sources every entry shares (Three.Core.js, the
        // runtime, the enum shims) evaluate exactly once per page, so
        // class identity, registries, panel and counters stay single.
        chunkFileNames: 'shared-[hash].js',
    },
    plugins: [
        singleRuntime(),
        resolve(),
        rti(),
        glsl(),
        header(),
    ],
    preserveEntrySignatures: 'strict'
};
