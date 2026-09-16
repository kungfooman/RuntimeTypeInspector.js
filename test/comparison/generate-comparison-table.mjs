#!/usr/bin/env node
/**
 * Generate comparison-table.html — catharsis (raw parser) vs RTI (expandType + stringifyType)
 * 5 cols: INPUT | catharsis TYPE | catharsis STRINGIFY | RTI expandType | RTI stringifyType
 * Green = stringification exactly equals INPUT, hotpink = differs.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expandType } from '../../src-transpiler/expandType.js';
import { stringifyType } from '../../src-runtime/stringifyType.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const catharsis = require('catharsis');
const rawParser = require('catharsis/lib/parser');
const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'comparison-table.html');

const cases = [
  'string', 'number', 'boolean', 'any', '*',
  'Array.<Node>', 'Array<Node>', 'Node[]',
  "import('@babel/types').Node", "import('./x').Foo",
  "Node['type']", 'keyof Obj', 'typeof foo',
  '{a: number, b?: string}', '[string, number]', '[a: string, b: number]',
  'string | number', 'A & B', 'Record<string, number>', 'Object.<string, number>',
  'Map<string, any>', 'Promise<number>', 'Set<string>',
  'MyEnum', 'MyEnum.FOO',
  '`prefix-${string}`', '1 | 2 | 3',
  'function(string, number)', '...number', 'number?', 'Object', 'Function',
  'Array<string | {x: number}>', '{[Key in ObjKeys]: Key}',
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let rows = '';
for (const input of cases) {
  let cType = '—', cStr = '—', oType = '—', oStr = '—';
  try {
    const parsed = rawParser.parse(input, { jsdoc: true });
    cType = parsed.type;
    try { cStr = catharsis.stringify(parsed); } catch (e) { cStr = `ERR: ${e.message.slice(0, 60)}`; }
  } catch { cType = 'THROW'; cStr = '—'; }
  try {
    const exp = expandType(input);
    oType = typeof exp === 'object' ? JSON.stringify(exp) : String(exp);
    try { oStr = stringifyType(exp); } catch (e) { oStr = `ERR: ${e.message.slice(0, 60)}`; }
  } catch { oType = 'THROW'; oStr = '—'; }
  const cCls = cStr === input ? 'ok' : 'bad';
  const oCls = oStr === input ? 'ok' : 'bad';
  rows += `<tr><td><code>${esc(input)}</code></td><td>${esc(cType)}</td><td class="${cCls}"><code>${esc(cStr)}</code></td><td><code class="small">${esc(oType)}</code></td><td class="${oCls}"><code>${esc(oStr)}</code></td></tr>\n`;
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>catharsis vs RTI comparison</title>
<style>
body{font-family:system-ui,sans-serif;margin:20px}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#0f172a;color:#fff}
td.ok{background:#dcfce7}
td.bad{background:hotpink;color:#000}
code{font-family:ui-monospace,monospace}
.small{font-size:11px;word-break:break-all;max-width:340px;display:inline-block}
</style>
</head>
<body>
<h1>catharsis (raw parser) vs RTI (expandType + stringifyType)</h1>
<p>Green = stringification exactly equals input. Hotpink = differs (needs attention).</p>
<table><tr><th>INPUT</th><th>catharsis TYPE</th><th>catharsis STRINGIFY</th><th>RTI expandType</th><th>RTI stringifyType</th></tr>
${rows}</table>
</body>
</html>`;

fs.writeFileSync(outPath, html);
console.log(`wrote ${outPath} with ${cases.length} rows`);
