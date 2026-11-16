import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
// Reads a supported/<name>/project.json manifest and prints the pinned
// upstream checkout path, cloning with `--depth 1` and checking out the
// pinned rev when the checkout is missing or stale.
const manifestPath = process.argv[2];
const manifest = JSON.parse(
  (await import('node:fs')).readFileSync(manifestPath, 'utf8'),
);
const repoRoot = join(here, '..', '..');
const upstream = join(repoRoot, 'tmp', 'supported', manifest.checkoutDir);
mkdirSync(join(repoRoot, 'tmp', 'supported'), {recursive: true});
if (existsSync(join(upstream, '.git')) === false) {
  execFileSync('git', ['clone', '--depth', '1', manifest.repo, upstream], {stdio: 'inherit'});
}
execFileSync('git', ['-C', upstream, 'fetch', '--depth', '1', 'origin', manifest.rev], {stdio: 'inherit'});
execFileSync('git', ['-C', upstream, 'checkout', '--detach', manifest.rev], {stdio: 'inherit'});
console.log('fetch-upstream: ' + manifest.name + ' at ' + manifest.rev);
