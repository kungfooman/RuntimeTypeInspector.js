/**
 * Bundles the minified-bundle fixtures with real Rollup: the same transform
 * hook shape as `plugin-rollup` (but importing the working-tree transpiler,
 * not the stale published build), then emits a plain bundle and a
 * terser-minified one (aggressive `toplevel` mangling, like esbuild/webpack
 * production output where no binding keeps its source spelling).
 */
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {rollup} from 'rollup';
import terser from '@rollup/plugin-terser';
import {addTypeChecks} from '../../src-transpiler/addTypeChecks.js';
import {expandType} from '../../src-transpiler/expandType.js';
const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, 'fixtures');
const outDir = join(here, 'out');
const runtimeAbs = join(here, '..', '..', 'src-runtime', 'index.js');
// Specifier as seen from the emitted bundle: the runtime stays an external
// import, never bundled in. Rollup leaves it alone via `external` below and
// Node resolves it to the working-tree runtime at run time.
let runtimeSpec = relative(outDir, runtimeAbs).replace(/\\/gu, '/');
if (!runtimeSpec.startsWith('.')) {
  runtimeSpec = `./${runtimeSpec}`;
}
// Anything resolving into the working-tree runtime stays external.
const isRuntimeExternal = new RegExp(`src-runtime${'/'}index\\.js$`, 'u');
/**
 * RTI transform mirroring `plugin-rollup`: transpile with the working-tree
 * sources and point the runtime import at the working-tree runtime, so the
 * bundle exercises current code on both sides of the pipeline. The emitted
 * specifier is the bundle-relative `runtimeSpec`, which `external`/`paths`
 * below keep out of the bundle.
 * @returns {import('rollup').Plugin} The transform plugin.
 */
function rtiWorkingTree() {
  return {
    name: 'rti-working-tree',
    transform(code, id) {
      if (!id.startsWith(fixtures)) {
        return null;
      }
      const out = addTypeChecks(code, {
        expandType,
        filename: id,
      });
      return {
        code: out.replaceAll("'@runtime-type-inspector/runtime'", `'${runtimeSpec}'`),
        map: null,
      };
    },
  };
}
/**
 * Shared Rollup input options: the runtime is external, exactly like an app
 * bundler treats `@runtime-type-inspector/runtime` (a dependency import,
 * never inlined into the app bundle).
 * @returns {import('rollup').RollupOptions} The input options.
 */
function inputOptions() {
  return {
    input: join(fixtures, 'entry.mjs'),
    plugins: [rtiWorkingTree()],
    external: (source, _importer, isResolved) => isResolved && isRuntimeExternal.test(source),
    onwarn: () => {},
  };
}
/**
 * Shared output options: everything external keeps the one runtime path we
 * emitted in the transform.
 * @returns {import('rollup').OutputOptions} The output options.
 */
function outputOptions() {
  return {
    format: 'es',
    paths: (id) => (isRuntimeExternal.test(id) ? runtimeSpec : id),
  };
}
/**
 * Builds the plain and the minified bundle.
 * @param {object} [opts] - Options.
 * @param {boolean} [opts.minifyOnly] - Skip the plain bundle.
 * @returns {Promise<{plain: string, min: string}>} Absolute bundle paths.
 */
async function buildBundles(opts = {}) {
  mkdirSync(outDir, {
    recursive: true,
  });
  const plain = join(outDir, 'app.bundle.mjs');
  if (!opts.minifyOnly) {
    const bundle = await rollup(inputOptions());
    await bundle.write({
      ...outputOptions(),
      file: plain,
    });
    await bundle.close();
  }
  const bundle = await rollup(inputOptions());
  const min = join(outDir, 'app.min.mjs');
  await bundle.write({
    ...outputOptions(),
    file: min,
    plugins: [
      terser({
        compress: {
          toplevel: true,
        },
        mangle: {
          toplevel: true,
        },
      }),
    ],
  });
  await bundle.close();
  writeFileSync(join(outDir, '.gitignore'), '*\n');
  return {
    plain,
    min,
  };
}
export {buildBundles};
