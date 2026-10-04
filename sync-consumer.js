/**
 * Copies the freshly built `@runtime-type-inspector` bundles into a downstream
 * consumer project that already has RTI installed, so local changes take
 * effect there without a version bump and publish cycle. Run via
 * `npm run sync:consumer -- <project-dir>` (builds first), or with no arg to
 * pick from the sibling projects next to the current directory that have RTI
 * installed. Every `node_modules/@runtime-type-inspector/{runtime,transpiler}`
 * install found under the chosen project (nested ones like `rti/node_modules`
 * included) gets its matching fresh bundles; anything else in the consumer is
 * left alone. Exits non-zero when no RTI install is found or a copy fails.
 * @example
 * npm run sync:consumer -- ~/playcanvas-engine // refreshes its runtime + sandbox copies
 */
import {copyFileSync, existsSync, readdirSync, statSync} from 'fs';
import {createInterface} from 'readline';
import {dirname, join, relative, resolve} from 'path';
import {fileURLToPath} from 'url';
const repoRoot = dirname(fileURLToPath(import.meta.url));
/**
 * Finds every `@runtime-type-inspector` install below a directory by walking
 * down through `node_modules` folders (depth-capped, skips hidden dirs).
 * @param {string} root - Directory to search.
 * @param {number} depth - Remaining walk depth.
 * @returns {string[]} Install dirs holding `runtime` and/or `transpiler` packages.
 */
function findInstalls(root, depth = 5) {
  const found = [];
  if (depth < 0 || !existsSync(root)) {
    return found;
  }
  const scope = join(root, 'node_modules', '@runtime-type-inspector');
  if (existsSync(scope) && (existsSync(join(scope, 'runtime')) || existsSync(join(scope, 'transpiler')))) {
    found.push(scope);
  }
  let entries = [];
  try {
    entries = readdirSync(root);
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'node_modules') {
      continue;
    }
    const dir = join(root, entry);
    let isDir = false;
    try {
      isDir = statSync(dir).isDirectory();
    } catch {
      continue;
    }
    if (isDir) {
      found.push(...findInstalls(dir, depth - 1));
    }
  }
  return found;
}
/**
 * Names the installed packages inside a scope dir (e.g. `runtime, transpiler`).
 * @param {string} scope - Install dir (`.../node_modules/@runtime-type-inspector`).
 * @param {string} project - Project dir the scope was found under.
 * @returns {string} Scope path relative to the project plus installed package names.
 */
function describeInstall(scope, project) {
  const names = ['runtime', 'transpiler'].filter((name) => existsSync(join(scope, name)));
  return `${relative(project, scope)} (${names.join(', ')})`;
}
/**
 * Copies fresh bundles over every RTI install under a project.
 * @param {string} project - Consumer project directory.
 */
function syncProject(project) {
  const installs = findInstalls(project);
  if (!installs.length) {
    console.error(`sync-consumer: no @runtime-type-inspector install found under ${project}`);
    process.exit(1);
  }
  const bundles = {
    runtime: ['@runtime-type-inspector/runtime/index.mjs', '@runtime-type-inspector/runtime/index.cjs'],
    transpiler: ['@runtime-type-inspector/transpiler/index.mjs', '@runtime-type-inspector/transpiler/index.cjs'],
  };
  for (const scope of installs) {
    for (const name of Object.keys(bundles)) {
      if (!existsSync(join(scope, name))) {
        continue;
      }
      for (const from of bundles[name]) {
        const to = join(scope, from.split('@runtime-type-inspector/')[1]);
        copyFileSync(join(repoRoot, from), to);
        console.log(`sync-consumer: ${from} -> ${to}`);
      }
    }
  }
}
/**
 * Sibling projects next to the current directory that have RTI installed:
 * every child of the parent dir with a `package.json` (project heuristic, so
 * media and checkout dirs scan no deeper) and at least one install inside.
 * @returns {{dir: string, installs: string[]}[]} Candidates in stable order.
 */
function siblingCandidates() {
  const parent = dirname(process.cwd());
  let entries = [];
  try {
    entries = readdirSync(parent);
  } catch {
    return [];
  }
  const candidates = [];
  for (const entry of entries.sort()) {
    if (entry.startsWith('.')) {
      continue;
    }
    const dir = join(parent, entry);
    try {
      if (!statSync(dir).isDirectory() || !existsSync(join(dir, 'package.json'))) {
        continue;
      }
    } catch {
      continue;
    }
    const installs = findInstalls(dir, 3);
    if (installs.length) {
      candidates.push({dir, installs});
    }
  }
  return candidates;
}
/**
 * Asks which candidate to sync (number, or `a` for all).
 * @param {{dir: string, installs: string[]}[]} candidates - Projects to choose from.
 * @returns {Promise<{dir: string, installs: string[]}[]>} Chosen projects.
 */
function pickCandidates(candidates) {
  for (const [i, {dir, installs}] of candidates.entries()) {
    console.log(`${i + 1}: ${dir}`);
    for (const scope of installs) {
      console.log(`   ${describeInstall(scope, dir)}`);
    }
  }
  const rl = createInterface({input: process.stdin, output: process.stdout});
  return new Promise((resolvePick) => {
    rl.question(`Pick a project [1-${candidates.length}] (or a for all): `, (answer) => {
      rl.close();
      const pick = answer.trim().toLowerCase();
      if (pick === 'a') {
        resolvePick(candidates);
        return;
      }
      const n = Number.parseInt(pick, 10);
      if (Number.isInteger(n) && n >= 1 && n <= candidates.length) {
        resolvePick([candidates[n - 1]]);
        return;
      }
      console.error(`sync-consumer: invalid pick: ${answer}`);
      process.exit(1);
    });
  });
}
const arg = process.argv[2] && !process.argv[2].startsWith('-') ? resolve(process.argv[2]) : null;
if (arg) {
  syncProject(arg);
} else {
  const candidates = siblingCandidates();
  if (!candidates.length) {
    console.error(`sync-consumer: no project with @runtime-type-inspector installed next to ${process.cwd()}`);
    process.exit(1);
  }
  const chosen = candidates.length === 1 ? candidates : await pickCandidates(candidates);
  for (const {dir} of chosen) {
    syncProject(dir);
  }
}
