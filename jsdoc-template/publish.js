/**
 * RTI JSDoc template — typed string templates (no Handlebars), no catharsis PEGJS.
 * Vendored from @playcanvas/jsdoc-template@1.1.2 and redesigned for
 * RuntimeTypeInspector.js (issue #72).
 * @module publish
 */
const fs = require('jsdoc/fs');
const helper = require('jsdoc/util/templateHelper');
const path = require('jsdoc/path');

/** @typedef {import('taffydb').Collection} TaffyCollection */
/** @typedef {Record<string, any>} Doclet */

/**
 * @param {Doclet} a
 * @param {Doclet} b
 * @returns {number}
 */
const localeAlphaSort = (a, b) => {
  if (a.longname && b.longname) return a.longname.localeCompare(b.longname);
  if (a.name && b.name) return a.name.localeCompare(b.name);
  return 0;
};
const alphaSort = localeAlphaSort;

/**
 * Collect class members/methods/events/typedefs for a class doclet.
 * @param {TaffyCollection} data
 * @param {Doclet} cls
 * @returns {{cls: Doclet, inherited: any, methods: Doclet[]|null, staticMethods: Doclet[]|null, members: Doclet[]|null, events: Doclet[]|null, typedefs: Doclet[]|null}}
 */
function getClassInfo(data, cls) {
  const members = [];
  const methods = [];
  const staticMethods = [];
  const events = [];
  const typedefs = [];
  const all = data({
    kind: ['constant', 'member', 'function', 'event', 'typedef'],
    access: { isUndefined: true },
    inherited: { isUndefined: true },
    undocumented: { isUndefined: true },
    memberof: cls.longname,
  }).get();
  all.forEach((i) => {
    if (i.kind === 'member' || i.kind === 'constant') {
      if (i.scope === 'instance' && i.name === i.name.toUpperCase()) i.scope = 'static';
      if (i.scope === 'instance') {
        if (!cls.properties) cls.properties = [];
        else { for (let p = 0; p < cls.properties.length; p++) if (cls.properties[p].name === i.name) return; }
        cls.properties.push(i);
      } else if (i.scope === 'static') {
        for (let p = 0; p < members.length; p++) if (members[p].name === i.name) return;
        members.push(i);
      }
    } else if (i.kind === 'function') {
      if (i.scope === 'instance') methods.push(i);
      else if (i.scope === 'static') staticMethods.push(i);
    } else if (i.kind === 'event') events.push(i);
    else if (i.kind === 'typedef') typedefs.push(i);
  });
  if (cls.properties) cls.properties.sort(alphaSort);
  members.sort(alphaSort); methods.sort(alphaSort); staticMethods.sort(alphaSort); events.sort(alphaSort); typedefs.sort(alphaSort);
  let inherited = null;
  if (cls.augments && cls.augments.length) {
    inherited = { cls: [], members: [], methods: [], staticMethods: [], events: [] };
    for (let i = 0; i < cls.augments.length; i++) {
      const base = cls.augments[i];
      const queryItems = data({ kind: ['class', 'interface'], access: { isUndefined: true }, undocumented: { isUndefined: true }, longname: base }).get();
      inherited.cls.push(queryItems[0]);
      const all2 = data({ kind: ['member', 'function', 'event'], access: { isUndefined: true }, inherited: true, undocumented: { isUndefined: true }, memberof: cls.longname }).get();
      all2.forEach((doclet) => {
        let kind;
        if (doclet.kind === 'member') {
          if (doclet.scope === 'instance') {
            if (!inherited.cls[i].properties) inherited.cls[i].properties = [];
            if (!inherited.cls[i].properties.find((d) => doclet.name === d.name)) inherited.cls[i].properties.push(doclet);
          } else if (doclet.scope === 'static') kind = 'members';
        } else if (doclet.kind === 'function') {
          if (doclet.scope === 'instance') kind = 'methods';
          else if (doclet.scope === 'static') kind = 'staticMethods';
        } else if (doclet.kind === 'event') kind = 'events';
        if (kind && inherited[kind] && !inherited[kind].find((d) => doclet.name === d.name)) inherited[kind].push(doclet);
      });
      inherited.members.sort(alphaSort); inherited.methods.sort(alphaSort); inherited.staticMethods.sort(alphaSort); inherited.events.sort(alphaSort);
      if (inherited.cls[i].properties) inherited.cls[i].properties.sort(alphaSort);
    }
  }
  return { cls, inherited: inherited || null, methods: methods.length ? methods : null, staticMethods: staticMethods.length ? staticMethods : null, members: members.length ? members : null, events: events.length ? events : null, typedefs: typedefs.length ? typedefs : null };
}

/**
 * @param {Doclet|string} cls
 * @returns {string|null}
 */
const clsUrl = (cls) => {
  const name = cls.longname || cls;
  if (name.includes('"')) return null;
  return `${name}.html`;
};

/**
 * @param {string} name
 * @param {string|undefined} display
 * @returns {{name: string, display: string}}
 */
const unwrapType = (name, display) => {
  let match; let type;
  match = /^Array\.<(.*)>$/i.exec(name) || /^Array<(.*)>$/i.exec(name);
  if (match) { name = match[1]; type = unwrapType(name, display); display = `${type.display}[]`; name = type.name; }
  match = /^Object\.<string,\s*(.*)>$/i.exec(name) || /^Object<string,\s*(.*)>$/i.exec(name);
  if (match) { name = match[1]; type = unwrapType(name, display); display = `{ [string]: ${type.display} }`; name = type.name; }
  match = /^Class\.<(.*)>$/i.exec(name) || /^Class<(.*)>$/i.exec(name);
  if (match) { name = match[1]; type = unwrapType(name, display); display = `typeof(${type.display})`; name = type.name; }
  return { name, display: display || name };
};

const builtins = {
  undefined: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Undefined',
  null: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Null',
  array: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array',
  boolean: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean',
  number: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number',
  object: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object',
  string: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
  promise: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
  map: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map',
  set: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set',
  bigint: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt',
  '*': '#',
};

/**
 * RTI type-link — no catharsis PEGJS. Uses stringifyType-style display and
 * handles import() , Array<>, tuples, unions, etc. as plain text with
 * builtin/external linking. Never throws (issue #72).
 * @param {{names: string[]}|string} type
 * @returns {string}
 */
const typeLink = (type) => {
  let typeName = typeof type === 'string' ? type : (type.longname || type);
  if (Array.isArray(type)) typeName = type[0];
  // JSDoc may pass {names: [...]}
  const names = type && type.names ? type.names : [String(typeName)];
  const parts = [];
  for (const raw of names) {
    // Normalize Closure-style generics: Array.<Node> -> Node[], Array<Node> -> Node[]
    const { name: inner, display } = unwrapType(String(raw).trim());
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Array case: link inner type, keep [] outside: <a>Node</a>[]
    if (display.endsWith('[]')) {
      const base = inner;
      const lower = base.toLowerCase().split('.').pop();
      let url = builtins[lower];
      if (!url) {
        if (base.startsWith('import(')) url = null;
        else if (base.includes('.')) url = `${base.split('.')[0]}.html`;
        else url = clsUrl(base);
      }
      parts.push(url ? `<a href="${url}">${esc(base)}</a>[]` : esc(display));
      continue;
    }
    const baseMatch = /^([A-Za-z_$][A-Za-z0-9_$\.]*)(\s*[<\[\(].*)?$/.exec(display);
    const base = baseMatch ? baseMatch[1] : display;
    const lower = base.toLowerCase().split('.').pop();
    let url = builtins[lower];
    if (!url) {
      if (display.startsWith('import(')) url = null; // external import type, no link
      else if (base.includes('.')) url = `${base.split('.')[0]}.html`;
      else url = clsUrl(base);
    }
    parts.push(url ? `<a href="${url}">${esc(display)}</a>` : esc(display));
  }
  return parts.join(', ');
};

// ---------- typed string-template helpers (replaces Handlebars) ----------

/**
 * @param {string|undefined} text
 * @returns {string}
 */
const excerpt = (text) => {
  if (!text) return '';
  const n = text.search(/\.(?![^{]*})/);
  return n > 0 ? text.slice(0, n + 1) : text;
};

/**
 * @param {string|undefined} text
 * @returns {string}
 */
const parse = (text) => {
  if (!text) return '';
  let result = helper.resolveLinks(text);
  const regex = /href="(\w+)\.html/g;
  let match;
  while ((match = regex.exec(result))) {
    if (match[1] === 'pc' || match[1] === 'rti') continue;
    result = `${result.slice(0, match.index)}href="${match[1]}.html${result.slice(match.index + 11 + match[1].length)}`;
  }
  return result;
};

/**
 * @param {Doclet|string} cls
 * @returns {string}
 */
const clsurl = (cls) => clsUrl(cls) || '#';

/**
 * @param {Doclet} prop
 * @returns {string}
 */
const readonly = (prop) => prop.readonly ? '<span class="readonly">[read only]</span>' : '';

/**
 * @param {Doclet} method
 * @returns {string}
 */
const methodsig = (method) => {
  let sig = '(';
  if (method.params) {
    for (let i = 0; i < method.params.length; i++) {
      if (method.params[i].name.indexOf('.') < 0) {
        if (i !== 0) sig += ', ';
        let name = method.params[i].name;
        if (method.params[i].optional) name = `[${name}]`;
        sig += name;
      }
    }
  }
  return `${sig})`;
};

/** @param {string} content @returns {string} */
const renderExample = (content) => `<pre class="example"><code>${content.example || content}</code></pre>`;
/** @returns {string} */
const renderAnalytics = () => '';
/**
 * @param {{'header-title': string}} data
 * @returns {string}
 */
const renderHeader = (data) => `<header>
    <nav class="header-width">
        <a href="/" class="header-title"><span style="font-weight:700;letter-spacing:1px">RTI</span> <span style="opacity:0.7">RuntimeTypeInspector</span></a>
        <ul class="header-menu">
            <li><a href="https://github.com/kungfooman/RuntimeTypeInspector.js">GitHub</a></li>
            <li class="api active"><a href="/api/">API Reference</a></li>
        </ul>
    </nav>
    <div class="header-content header-page header-width">
        <h1>${data['header-title']}</h1>
        <input id="search" class="search" type="text" placeholder="Search RTI…">
    </div>
</header>`;
/**
 * @param {{classes: Doclet[]}} data
 * @returns {string}
 */
const renderNavigation = (data) => {
  const items = data.classes.map((c) => `<li><a href="${clsUrl(c)}">${c.longname}</a></li>`).join('\n');
  return `<nav class="sidebar"><ul>${items}</ul></nav>`;
};
/**
 * @param {Doclet} obj
 * @returns {string}
 */
const renderMethod = (obj) => {
  const params = obj.params ? `<h4>Parameters</h4><table>${obj.params.map((p) => `<tr><td>${p.name}</td><td>${p.type ? typeLink(p.type) : ''}</td><td>${parse(p.description || '')}</td></tr>`).join('')}</table>` : '';
  const returns = obj.returns ? `<h4>Returns</h4>${obj.returns.map((r) => `${r.type ? typeLink(r.type) : ''} ${parse(r.description || '')}`).join('')}` : '';
  const examples = (obj.examples || []).map(renderExample).join('');
  return `<div id="${obj.name}"><h3 class="methodname">${obj.name}${methodsig(obj)} <a class="anchor" href="#${obj.name}">#</a></h3><p>${parse(obj.description || '')}</p>${examples}${params}${returns}</div>`;
};
/**
 * @param {Doclet} obj
 * @returns {string}
 */
const renderProperty = (obj) => `<div id="${obj.name}"><span class="property">${obj.type ? typeLink(obj.type) : ''}</span><span class="property">${obj.name} <a class="anchor" href="#${obj.name}">#</a></span><p>${parse(obj.description || '')}${readonly(obj)}</p>${(obj.examples || []).map(renderExample).join('')}</div>`;
/**
 * @param {Doclet} obj
 * @returns {string}
 */
const renderTypedef = (obj) => {
  const params = obj.params ? `<h4>Parameters</h4><table>${obj.params.map((p) => `<tr><td>${p.name}</td><td>${p.type ? typeLink(p.type) : ''}</td><td>${parse(p.description || '')}</td></tr>`).join('')}</table>` : '';
  const examples = (obj.examples || []).map(renderExample).join('');
  return `<div id="${obj.name}"><h3 class="methodname">${obj.name} <a class="anchor" href="#${obj.name}">#</a></h3><p>${parse(obj.description || '')}</p>${examples}${params}</div>`;
};
/**
 * @param {Doclet} obj
 * @returns {string}
 */
const renderEvent = (obj) => `<div id="event:${obj.name}"><h3>${obj.name}</h3><p>${parse(obj.description || '')}</p></div>`;

/**
 * @param {{cls: Doclet, inherited: any, methods: Doclet[]|null, staticMethods: Doclet[]|null, members: Doclet[]|null, events: Doclet[]|null, typedefs: Doclet[]|null}} info
 * @returns {string}
 */
const renderClass = (info) => {
  const { cls } = info;
  const aug = (cls.augments || []).map((a) => `<p class="extends">Extends: <a href="${clsurl(a)}">${a}</a></p>`).join('');
  const examples = (cls.examples || []).map(renderExample).join('');
  const summaryTypedefs = info.typedefs ? `<h3>Type Definitions</h3><table class="properties">${info.typedefs.map((t) => `<tr><td><a href="#${t.name}">${t.name}</a></td><td>${parse(excerpt(t.description || ''))}</td></tr>`).join('')}</table>` : '';
  const summaryMembers = info.members ? `<h3>Static Properties</h3><table class="properties">${info.members.map((m) => `<tr><td><a href="#${m.name}">${m.name}</a></td><td>${parse(excerpt(m.description || ''))}${readonly(m)}</td></tr>`).join('')}</table>` : '';
  const summaryStaticMethods = info.staticMethods ? `<h3>Static Methods</h3><table class="properties">${info.staticMethods.map((m) => `<tr><td><a href="#${m.name}">${m.name}</a></td><td>${parse(excerpt(m.description || ''))}</td></tr>`).join('')}</table>` : '';
  const summaryProps = cls.properties ? `<h3>Properties</h3><table class="properties">${cls.properties.map((p) => `<tr><td><a href="#${p.name}">${p.name}</a></td><td>${parse(excerpt(p.description || ''))}${readonly(p)}</td></tr>`).join('')}</table>` : '';
  const summaryMethods = info.methods ? `<h3>Methods</h3><table class="properties">${info.methods.map((m) => `<tr><td><a href="#${m.name}">${m.name}</a></td><td>${parse(excerpt(m.description || ''))}</td></tr>`).join('')}</table>` : '';
  const summaryEvents = info.events ? `<h3>Events</h3><table class="properties">${info.events.map((e) => `<tr><td><a href="#event:${e.name}">${e.name}</a></td><td>${parse(excerpt(e.description || ''))}</td></tr>`).join('')}</table>` : '';
  const detailTypedefs = info.typedefs ? `<h2>Type Definitions</h2>${info.typedefs.map((t) => renderTypedef(t)).join('')}` : '';
  const detailMembers = info.members ? `<h2>Static Properties</h2><table class="members">${info.members.map((m) => `<tr><td id="${m.name}">${m.name}</td><td>${parse(m.description || '')}${readonly(m)}</td></tr>`).join('')}</table>` : '';
  const detailStaticMethods = info.staticMethods ? `<h2>Static Methods</h2>${info.staticMethods.map((m) => renderMethod(m)).join('')}` : '';
  const ctor = cls._class && !cls.hideconstructor ? `<h2>Constructor</h2>${renderMethod(cls)}` : '';
  const detailProps = cls.properties ? `<h2>Properties</h2>${cls.properties.map((p) => renderProperty(p)).join('')}` : '';
  const detailMethods = info.methods ? `<h2>Methods</h2>${info.methods.map((m) => renderMethod(m)).join('')}` : '';
  const detailEvents = info.events ? `<h2>Events</h2>${info.events.map((e) => renderEvent(e)).join('')}` : '';
  return `<main class="cls"><h1>${cls.longname}</h1>${aug}<p>${parse(cls.classdesc || '')}</p>${cls._namespace ? `<p>${parse(cls.description || '')}</p>` : ''}${examples}
    <h1>Summary</h1>${summaryTypedefs}${summaryMembers}${summaryStaticMethods}${summaryProps}${summaryMethods}${summaryEvents}
    <h1>Details</h1>${detailTypedefs}${detailMembers}${detailStaticMethods}${ctor}${detailProps}${detailMethods}${detailEvents}</main>`;
};

/**
 * @param {{title: string, classes: Doclet[], cls: any}} data
 * @returns {string}
 */
const renderPage = (data) => `<!doctype html>
<html lang="en">
    <head><title>${data.title} | RTI API Reference</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" type="image/png" href="images/rti-favicon.png"><link href="styles/styles.css" rel="stylesheet"><link href="styles/rti-theme.css" rel="stylesheet"><script src="scripts/site/search.js"></script><script src="scripts/site/sidebar.js"></script><script src="scripts/site/sidebar-filter.js"></script></head>
    <body>${renderHeader({ 'header-title': 'RTI API Reference' })}<div class="container content-width">${renderNavigation(data)}${renderClass(data.cls)}</div>${renderAnalytics()}</body>
</html>`;

const renderFrontpage = (data) => `<!doctype html>
<html lang="en">
    <head><title>RTI API Reference</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" type="image/png" href="images/rti-favicon.png"><link href="styles/styles.css" rel="stylesheet"><link href="styles/rti-theme.css" rel="stylesheet"></head>
    <body>${renderHeader({ 'header-title': 'RTI — Runtime Type Inspector' })}<div class="container content-width">${renderNavigation(data)}<main><h1>RuntimeTypeInspector.js</h1><p>Trust is good, control is better — validating JSDoc types at runtime.</p><p><a href="https://github.com/kungfooman/RuntimeTypeInspector.js">GitHub</a> • Vendored template from @playcanvas/jsdoc-template, redesigned for RTI (no catharsis, handlebars → typed string templates).</p></main></div></body>
</html>`;

// ---------- publish plumbing (kept compatible with JSDoc) ----------

/**
 * @param {string} dir
 * @param {string} outdir
 * @param {() => void} callback
 */
const copyStaticFiles = (dir, outdir, callback) => {
  fs.mkPath(outdir);
  const fromDir = path.join(dir, 'static');
  const staticFiles = fs.ls(fromDir, 3);
  staticFiles.forEach((fileName) => {
    const toDir = fs.toDir(fileName.replace(fromDir, outdir));
    fs.mkPath(toDir);
    fs.copyFileSync(fileName, toDir);
  });
  callback();
};

/**
 * @param {TaffyCollection} taffyData
 * @param {{destination: string, template: string, env: any}} opts
 * @param {any} tutorials
 */
exports.publish = (taffyData, opts, tutorials) => {
  const outdir = path.join(env.pwd, opts.destination); /* eslint-disable-line no-undef */
  const tmpldir = opts.template;
  let data = taffyData;
  copyStaticFiles(tmpldir, outdir, () => {
    const registeredLinks = {};
    const invalidCharsInLink = /#\./g;
    data = helper.prune(data);
    // RTI: rename legacy 'pc' namespace to 'rti' (original template collected globals under 'pc')
    data().each((doclet) => {
      if (doclet.longname === 'pc') { doclet.longname = 'rti'; doclet.name = 'rti'; }
      else if (doclet.longname && doclet.longname.startsWith('pc.')) doclet.longname = `rti.${doclet.longname.slice(3)}`;
      if (doclet.memberof === 'pc') doclet.memberof = 'rti';
      else if (doclet.memberof && doclet.memberof.startsWith('pc.')) doclet.memberof = `rti.${doclet.memberof.slice(3)}`;
      if (doclet.name === 'pc') doclet.name = 'rti';
    });
    data({ kind: 'typedef', name: { test: (v) => typeof v === 'string' && !v.endsWith('Callback') } }).remove = data({ kind: 'typedef' }).remove; // keep original prune logic below
    data(function () { return this.kind === 'typedef' && !this.name.endsWith('Callback'); }).remove();
    data().each((doclet) => {
      if (registeredLinks[doclet.longname]) return;
      if (!doclet.memberof) { doclet.scope = 'static'; doclet.memberof = 'rti'; }
      let link = helper.createLink(doclet);
      link = link.replace(invalidCharsInLink, '#');
      helper.registerLink(doclet.longname, link);
      registeredLinks[doclet.longname] = true;
    });
    let classes = data({ kind: ['class', 'interface'], access: { isUndefined: true }, undocumented: { isUndefined: true } }).get();
    const modules = data({ kind: 'namespace', access: { isUndefined: true }, undocumented: { isUndefined: true } }).get();
    classes.sort(localeAlphaSort); modules.sort(localeAlphaSort);
    classes = modules.concat(classes);
    classes.forEach((cls) => { cls._class = (cls.kind === 'class' || cls.kind === 'interface'); cls._namespace = (cls.kind === 'namespace'); });
    classes.forEach((cls) => {
      helper.registerLink(cls.longname, clsUrl(cls));
      const info = getClassInfo(data, cls);
      const html = renderPage({ title: cls.longname, classes, cls: info });
      const outpath = path.join(outdir, `${cls.longname}.html`);
      fs.writeFileSync(outpath, html, 'utf8');
    });
    const html = renderFrontpage({ classes });
    fs.writeFileSync(path.join(outdir, 'index.html'), html, 'utf8');
  });
};
