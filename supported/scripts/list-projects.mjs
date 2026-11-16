import {execFileSync} from 'node:child_process';
import {existsSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
const here = new URL('.', import.meta.url).pathname;
const repoRoot = join(here, '..', '..');
// Loads every supported/<name>/project.json manifest and prints the
// instrumented bundle paths, so build-all.sh stays a thin shell loop over
// this single source of truth.
const supported = join(repoRoot, 'supported');
const names = readdirSync(supported, {withFileTypes: true})
  .filter((entry) => entry.isDirectory() && existsSync(join(supported, entry.name, 'project.json')))
  .map((entry) => entry.name)
  .sort();
const projects = names.map((name) => {
  const manifest = JSON.parse(
    (await import('node:fs')).readFileSync(join(supported, name, 'project.json'), 'utf8'),
  );
  return {dir: join(supported, name), manifest};
});
console.log(JSON.stringify(projects.map(({manifest}) => manifest.name)));
