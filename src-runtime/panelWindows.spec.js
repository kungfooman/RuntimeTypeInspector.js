import {TypePanel} from './TypePanel.js';
import {options} from './options.js';
/**
 * Fake DOM substantial enough for TypePanel + compare windows: elements
 * carry props/styles/dataset, listeners are storable and firievable, and
 * remove()/isConnected track attachment.
 */
class FakeNode {
  constructor() {
    this.children = [];
    this.parent = null;
    this.listeners = {};
  }
  append(...nodes) {
    for (const node of nodes.flat(Infinity)) {
      if (node === undefined || node === null || node === false) {
        continue;
      }
      this.children.push(node);
      if (node instanceof FakeNode) {
        node.parent = this;
      }
    }
  }
  appendChild(node) {
    this.append(node);
    return node;
  }
  remove() {
    if (this.parent) {
      this.parent.children = this.parent.children.filter((_) => _ !== this);
      this.parent = null;
    }
  }
  addEventListener(type, fn) {
    (this.listeners[type] ??= []).push(fn);
  }
  removeEventListener(type, fn) {
    this.listeners[type] = (this.listeners[type] ?? []).filter((_) => _ !== fn);
  }
  fire(type, event = {}) {
    const full = {
      target: this,
      preventDefault: () => {},
      stopPropagation: () => {},
      ...event,
    };
    for (const fn of this.listeners[type] ?? []) {
      fn(full);
    }
  }
  contains(node) {
    if (node === this) {
      return true;
    }
    return this.children.some((_) => _ instanceof FakeNode && _.contains(node));
  }
  closest(selector) {
    const cls = selector.startsWith('.') ? selector.slice(1) : null;
    let node = this;
    while (node instanceof FakeNode) {
      const names = typeof node.className === 'string' ? node.className.split(' ') : [];
      if (cls && names.includes(cls)) {
        return node;
      }
      node = node.parent;
    }
    return null;
  }
  get isConnected() {
    let current = this;
    while (current.parent) {
      current = current.parent;
    }
    return current.connectedRoot === true;
  }
  getBoundingClientRect() {
    return {left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0};
  }
}
class FakeElement extends FakeNode {
  constructor(tag) {
    super();
    this.tag = tag;
    this.dataset = {};
    this.style = {};
    this.attributes = {};
    this.classList = {
      added: new Set(),
      add: (...names) => names.forEach((_) => this.classList.added.add(_)),
      remove: (...names) => names.forEach((_) => this.classList.added.delete(_)),
      toggle: (name, force) => {
        const has = this.classList.added.has(name);
        const next = force === undefined ? !has : !!force;
        if (next) {
          this.classList.added.add(name);
        } else {
          this.classList.added.delete(name);
        }
        return next;
      },
      contains: (name) => this.classList.added.has(name),
    };
  }
  setAttribute(key, value) {
    this.attributes[key] = value;
  }
  set innerHTML(_) {
    // Like the browser: replacing markup detaches all children.
    for (const child of this.children) {
      if (child instanceof FakeNode) {
        child.parent = null;
      }
    }
    this.children = [];
  }
  get innerHTML() {
    return '';
  }
  // Detached/unlaid-out elements measure zero, like a real browser.
  get offsetWidth() {
    return 0;
  }
  get offsetHeight() {
    return 0;
  }
}
class FakeText extends FakeNode {
  constructor(text) {
    super();
    this.text = text;
  }
}
/**
 * Installs fake browser globals, returning a restore function.
 * @returns {Function} Restore.
 */
function installFakeBrowser() {
  const saved = {};
  for (const key of ['document', 'window', 'localStorage', 'location', 'Node']) {
    saved[key] = globalThis[key];
  }
  const store = {};
  const body = new FakeElement('body');
  body.connectedRoot = true;
  const head = new FakeElement('head');
  const docListeners = {};
  const doc = {
    createElement: (tag) => new FakeElement(tag),
    createTextNode: (text) => new FakeText(String(text)),
    querySelectorAll: () => [],
    head,
    body,
    readyState: 'complete',
    defaultView: null,
    addEventListener: (type, fn) => {
      (docListeners[type] ??= []).push(fn);
    },
    removeEventListener: (type, fn) => {
      docListeners[type] = (docListeners[type] ?? []).filter((_) => _ !== fn);
    },
    fire: (type, event) => {
      for (const fn of docListeners[type] ?? []) {
        fn(event);
      }
    },
  };
  globalThis.Node = FakeNode;
  globalThis.document = doc;
  const winListeners = {};
  globalThis.window = {
    addEventListener: (type, fn) => {
      (winListeners[type] ??= []).push(fn);
    },
    removeEventListener: (type, fn) => {
      winListeners[type] = (winListeners[type] ?? []).filter((_) => _ !== fn);
    },
    fire: (type, event = {}) => {
      for (const fn of winListeners[type] ?? []) {
        fn(event);
      }
    },
    innerWidth: 1600,
    innerHeight: 900,
  };
  globalThis.localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
  };
  globalThis.location = {hash: '', href: 'http://localhost/'};
  return () => {
    for (const key of Object.keys(saved)) {
      if (saved[key] === undefined) {
        delete globalThis[key];
      } else {
        globalThis[key] = saved[key];
      }
    }
  };
}
function stubWarn(loc, name) {
  return {
    loc, name, expect: {type: 'object', properties: {a: 'number'}}, value: {a: 1},
    msg: `${loc} ${name} broke`, hits: 1, detailStrings: ['boom'],
  };
}
function withPanel(fn) {
  const restore = installFakeBrowser();
  try {
    TypePanel.instance = null;
    TypePanel.divAll = null;
    return fn(new TypePanel());
  } finally {
    restore();
  }
}
function testOpenFocusDedupe() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    panel.openComparator(stubWarn('L2', 'b'));
    if (panel.compareWins.size !== 2) {
      return false;
    }
    panel.openComparator(stubWarn('L1', 'a'));
    return panel.compareWins.size === 2;
  });
}
function testMinimizeRestoreTaskbar() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    const key = 'L1-a';
    // Open windows always hold a taskbar entry, minimized or not.
    if (panel.taskbarWins.children.length !== 1) {
      return false;
    }
    panel.minimizeCompare(key);
    const win = panel.compareWins.get(key);
    if (!win.minimized || win.el.style.display !== 'none') {
      return false;
    }
    if (panel.taskbar.style.display === 'none') {
      return false;
    }
    const [minEntry] = panel.taskbarWins.children;
    if (panel.taskbarWins.children.length !== 1 ||
        minEntry.className.includes('rti-taskbar-active')) {
      return false;
    }
    panel.restoreCompare(key);
    const [entry] = panel.taskbarWins.children;
    return !win.minimized && win.el.style.display === '' &&
      panel.taskbarWins.children.length === 1 &&
      entry.className.includes('rti-taskbar-active');
  });
}
function testTaskbarActiveFollowsFront() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    panel.openComparator(stubWarn('L2', 'b'));
    const active = () => panel.taskbarWins.children
      .filter((_) => _.className.includes('rti-taskbar-active')).length;
    if (active() !== 1) {
      return false;
    }
    // Clicking the covered window flips the bright entry to it.
    globalThis.document.fire('mousedown', {target: panel.compareWins.get('L1-a').el.children[0]});
    const labels = panel.taskbarWins.children
      .filter((_) => _.className.includes('rti-taskbar-active'))
      .map((_) => _.textContent);
    return labels.length === 1 && labels[0].includes('L1-a');
  });
}
function testCloseDestroys() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    panel.closeCompare('L1-a');
    return panel.compareWins.size === 0 && panel.compareFocus.length === 0 &&
      panel.taskbarWins.children.length === 0;
  });
}
function testEscClosesTopmost() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    panel.openComparator(stubWarn('L2', 'b'));
    globalThis.document.fire('keydown', {key: 'Escape'});
    if (panel.compareWins.size !== 1 || panel.compareWins.has('L2-b')) {
      return false;
    }
    globalThis.document.fire('keydown', {key: 'Escape'});
    return panel.compareWins.size === 0;
  });
}
function testClearClosesWindows() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    panel.clear();
    return panel.compareWins.size === 0;
  });
}
function testSingletonNoStacking() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    if (panel.compareWins.size !== 1) {
      return false;
    }
    // Re-evaluation hands back the same panel, refreshed — never a twin.
    const again = new TypePanel();
    return again === panel && panel.compareWins.size === 0 &&
      panel.div.style.display !== 'none';
  });
}
function testStaleInstanceIgnoresEvents() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    const fresh = new TypePanel();
    if (fresh !== panel) {
      return false;
    }
    // A leaked pre-singleton instance must not process messages anymore.
    const stale = Object.create(TypePanel.prototype);
    stale.handleEvent({data: {type: 'rti', destination: 'ui', action: 'clear'}});
    if (panel.compareWins.size !== 0) {
      return false;
    }
    panel.openComparator(stubWarn('L2', 'b'));
    stale.handleEvent({data: {type: 'rti', destination: 'ui', action: 'clear'}});
    return panel.compareWins.size === 1;
  });
}
function testClickBringsToFront() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    panel.openComparator(stubWarn('L2', 'b'));
    const a = panel.compareWins.get('L1-a').el;
    const b = panel.compareWins.get('L2-b').el;
    if (!(Number(b.style.zIndex) > Number(a.style.zIndex))) {
      return false;
    }
    // Document-capture path with a nested target (e.g. titlebar content),
    // as a real browser dispatches it.
    globalThis.document.fire('mousedown', {target: a.children[0]});
    return Number(a.style.zIndex) > Number(b.style.zIndex);
  });
}
function testTaskbarEntryFrontsOrRestores() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    panel.openComparator(stubWarn('L2', 'b'));
    const entries = () => panel.taskbarWins.children;
    if (entries().length !== 2) {
      return false;
    }
    // Inactive entry fronts without minimizing; active entry minimizes;
    // minimized entry reopens. Plain XP toggle on active state.
    entries()[0].onclick();
    const a = panel.compareWins.get('L1-a');
    if (a.minimized || panel.activeWindow !== 'L1-a') {
      return false;
    }
    panel.taskbarWins.children[0].onclick();
    if (!a.minimized) {
      return false;
    }
    panel.taskbarWins.children[0].onclick();
    return !a.minimized && panel.activeWindow === 'L1-a';
  });
}
function testRtiEntryFocusesPanelWithCount() {
  return withPanel((panel) => {
    if (panel.taskbarRti.textContent !== 'RTI') {
      return false;
    }
    // Fresh panel starts front/active: the first click minimizes
    // immediately instead of no-op fronting an already-front panel.
    if (panel.activeWindow !== 'panel') {
      return false;
    }
    panel.taskbarRti.onclick();
    if (panel.div.style.display !== 'none') {
      return false;
    }
    panel.taskbarRti.onclick();
    if (panel.div.style.display === 'none' || panel.activeWindow !== 'panel') {
      return false;
    }
    const {count: prev} = options;
    options.count = 1;
    try {
      panel.updateErrorCount();
    } finally {
      options.count = prev;
    }
    return panel.taskbarRti.textContent === 'RTI (1 error)';
  });
}
function testOutsideClickClearsAll() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    // Click on bare page (not a window): everything goes dim, nothing bright.
    globalThis.document.fire('mousedown', {target: globalThis.document.body});
    if (panel.activeWindow !== null) {
      return false;
    }
    const titles = (key) => panel.compareWins.get(key).titlebar.classList;
    const bright = panel.taskbarWins.children
      .filter((_) => _.className.includes('rti-taskbar-active'));
    return titles('L1-a').contains('rti-inactive') === true &&
      panel.titlebar.classList.contains('rti-inactive') === true &&
      bright.length === 0;
  });
}
function testPanelClickFrontsOverCompares() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    const winZ = Number(panel.compareWins.get('L1-a').el.style.zIndex);
    const {divAll} = TypePanel;
    if (!(winZ > Number(divAll.style.zIndex))) {
      return false;
    }
    // Click inside the main panel wrapper: it must front above compares,
    // main title blue again, taskbar kept above everything.
    globalThis.document.fire('mousedown', {target: panel.toolbar});
    const panelZ = Number(divAll.style.zIndex);
    const titles = (key) => panel.compareWins.get(key).titlebar.classList;
    return panelZ > winZ &&
      Number(panel.taskbar.style.zIndex) > panelZ &&
      panel.titlebar.classList.contains('rti-inactive') === false &&
      titles('L1-a').contains('rti-inactive') === true;
  });
}
function testActiveTitleFollowsClick() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    panel.openComparator(stubWarn('L2', 'b'));
    const titles = (key) => panel.compareWins.get(key).titlebar.classList;
    if (titles('L1-a').contains('rti-inactive') !== true) {
      return false;
    }
    if (titles('L2-b').contains('rti-inactive') !== false) {
      return false;
    }
    globalThis.document.fire('mousedown', {target: panel.compareWins.get('L1-a').el.children[0]});
    return titles('L1-a').contains('rti-inactive') === false &&
      titles('L2-b').contains('rti-inactive') === true;
  });
}
function testGrabActivatesWindow() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    panel.openComparator(stubWarn('L2', 'b'));
    panel.setActive(null);
    // Grabbing the titlebar (drag start) marks the window active.
    panel.compareWins.get('L1-a').titlebar.fire('mousedown', {clientX: 10, clientY: 10});
    return panel.activeWindow === 'L1-a';
  });
}
function testPointerdownFronts() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    panel.openComparator(stubWarn('L2', 'b'));
    const a = panel.compareWins.get('L1-a').el;
    const b = panel.compareWins.get('L2-b').el;
    globalThis.document.fire('pointerdown', {target: a.children[0]});
    return Number(a.style.zIndex) > Number(b.style.zIndex) && panel.activeWindow === 'L1-a';
  });
}
function testTaskbarAlwaysVisible() {
  return withPanel((panel) => {
    if (panel.taskbar.style.display === 'none') {
      return false;
    }
    panel.hide();
    if (panel.taskbar.style.display === 'none') {
      return false;
    }
    panel.show();
    return panel.taskbar.style.display !== 'none';
  });
}
function testCompareWindowsResizable() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    const el = panel.compareWins.get('L1-a').el;
    const dirs = el.children
      .map((_) => _?.dataset?.dir)
      .filter(Boolean)
      .sort();
    return JSON.stringify(dirs) === JSON.stringify(['e', 'n', 'ne', 'nw', 's', 'se', 'sw', 'w']);
  });
}
/**
 * Replays the real browser sequence for a taskbar click: document-capture
 * mousedown first, then the entry's own click. The press must neither
 * destroy the pressed button (a rebuild detaches it, so no click would
 * ever dispatch) nor clobber the active state the XP toggle reads.
 * @returns {boolean} True when the press survives and the click focuses.
 */
function testTaskbarPressKeepsButtonAlive() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    panel.openComparator(stubWarn('L2', 'b'));
    const entry = panel.taskbarWins.children[0];
    const before = panel.activeWindow;
    if (before === 'panel' || before === 'L1-a') {
      return false;
    }
    globalThis.document.fire('mousedown', {target: entry});
    if (!entry.isConnected || panel.activeWindow !== before) {
      return false;
    }
    entry.onclick();
    return panel.activeWindow === 'L1-a' && !panel.compareWins.get('L1-a').minimized;
  });
}
/**
 * Drags a compare window far past every edge: the XP rule keeps the
 * caption on-screen and grabbable, so no window is ever lost.
 * @returns {boolean} True when both corners clamp into the viewport.
 */
function testDragCannotLoseWindow() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    const {el, titlebar} = panel.compareWins.get('L1-a');
    const press = {clientX: 100, clientY: 100, target: titlebar};
    globalThis.document.fire('mousedown', press);
    titlebar.fire('mousedown', press);
    globalThis.document.fire('mousemove', {clientX: 5000, clientY: 5000});
    globalThis.document.fire('mouseup', {});
    // Fake viewport is 1600x900: sliver stays at right/bottom caption.
    if (el.style.left !== '1536px' || el.style.top !== '872px') {
      return false;
    }
    globalThis.document.fire('mousedown', press);
    titlebar.fire('mousedown', press);
    globalThis.document.fire('mousemove', {clientX: -5000, clientY: -5000});
    globalThis.document.fire('mouseup', {});
    return el.style.left === '64px' && el.style.top === '0px';
  });
}
/**
 * Grows a compare window past the top/left edges: the caption edge
 * clamps instead of leaving the screen.
 * @returns {boolean} True when both grips clamp into the viewport.
 */
function testResizeKeepsCaptionOnScreen() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    const {el} = panel.compareWins.get('L1-a');
    const grip = (dir) => el.children.find((_) => _?.dataset?.dir === dir);
    const north = grip('n');
    const pressN = {clientX: 100, clientY: 100, target: north};
    globalThis.document.fire('mousedown', pressN);
    north.fire('mousedown', pressN);
    globalThis.document.fire('mousemove', {clientX: 100, clientY: -5000});
    globalThis.document.fire('mouseup', {});
    if (el.style.top !== '0px') {
      return false;
    }
    const west = grip('w');
    const pressW = {clientX: 100, clientY: 100, target: west};
    globalThis.document.fire('mousedown', pressW);
    west.fire('mousedown', pressW);
    globalThis.document.fire('mousemove', {clientX: -5000, clientY: 100});
    globalThis.document.fire('mouseup', {});
    return el.style.left === '64px';
  });
}
/**
 * Poisoned persisted geometry (or a shrunk screen) revives on-screen
 * instead of stranding the panel where no grab can reach it.
 * @returns {boolean} True when stale geometry clamps into the viewport.
 */
function testStaleGeometryClampedToViewport() {
  return withPanel((panel) => {
    globalThis.localStorage.setItem('rti-panel-geometry', JSON.stringify({left: '-2000px', top: '3000px'}));
    panel.applyGeometry();
    return TypePanel.divAll.style.left === '64px' && TypePanel.divAll.style.top === '872px';
  });
}
/**
 * Shrinks the viewport (docked devtools) past live window positions: the
 * real `resize` event pulls the panel and every compare window back
 * on-screen instead of stranding them where no grab can reach.
 * @returns {boolean} True when the resize revives every window, wired once.
 */
function testViewportShrinkRevivesWindows() {
  return withPanel((panel) => {
    panel.openComparator(stubWarn('L1', 'a'));
    const win = panel.compareWins.get('L1-a');
    TypePanel.divAll.style.left = '1500px';
    TypePanel.divAll.style.top = '850px';
    win.el.style.left = '1400px';
    win.el.style.top = '800px';
    if (!TypePanel.viewportClampedViews.has(globalThis.window)) {
      return false;
    }
    globalThis.window.innerWidth = 800;
    globalThis.window.innerHeight = 600;
    globalThis.window.fire('resize', {});
    const panelLeftOk = TypePanel.divAll.style.left === '736px';
    const panelTopOk = TypePanel.divAll.style.top === '572px';
    const winLeftOk = win.el.style.left === '736px';
    const winTopOk = win.el.style.top === '572px';
    return panelLeftOk && panelTopOk && winLeftOk && winTopOk;
  });
}
/**
 * Fresh panels dock at the validated start position from `localStorage`,
 * defaulting to bottom-right on junk.
 * @returns {boolean} True when every corner (and the default) anchors right.
 */
function testPanelStartPositions() {
  return withPanel(() => {
    const prev = options.panelPosition;
    try {
      const cases = [
        ['bottom-right', 'bottom-right'],
        ['bottom-left', 'bottom-left'],
        ['top-right', 'top-right'],
        ['top-left', 'top-left'],
        ['junk', 'bottom-right'],
      ];
      const want = {
        'bottom-right': ['auto', '0px', 'auto', '0px'],
        'bottom-left': ['auto', '0px', '0px', 'auto'],
        'top-right': ['0px', 'auto', 'auto', '0px'],
        'top-left': ['0px', 'auto', '0px', 'auto'],
      };
      for (const [stored, expected] of cases) {
        globalThis.localStorage.setItem('rti-panel-position', stored);
        TypePanel.instance = null;
        TypePanel.divAll = null;
        const fresh = new TypePanel();
        const {style} = TypePanel.divAll;
        const [top, bottom, left, right] = want[expected];
        const anchored = style.top === top && style.bottom === bottom;
        const sided = style.left === left && style.right === right;
        const synced = options.panelPosition === expected && fresh.selectPosition.value === expected;
        if (!anchored || !sided || !synced) {
          return false;
        }
      }
      return true;
    } finally {
      options.panelPosition = prev;
    }
  });
}
/**
 * `center` docks a fresh panel mid-viewport (fallbacks cover measuring
 * before layout; the post-append re-dock uses the live size).
 * @returns {boolean} True when center computes from the 1600x900 viewport.
 */
function testPanelStartCenter() {
  return withPanel(() => {
    const prev = options.panelPosition;
    try {
      globalThis.localStorage.setItem('rti-panel-position', 'center');
      TypePanel.instance = null;
      TypePanel.divAll = null;
      const fresh = new TypePanel();
      const {style} = TypePanel.divAll;
      const centered = style.left === '480px' && style.top === '290px';
      const unanchored = style.right === 'auto' && style.bottom === 'auto';
      const synced = options.panelPosition === 'center' && fresh.selectPosition.value === 'center';
      return centered && unanchored && synced;
    } finally {
      options.panelPosition = prev;
    }
  });
}
/**
 * The settings-menu select re-docks live, persists, and normalizes junk.
 * @returns {boolean} True when menu moves, storage and options follow.
 */
function testPanelPositionMenu() {
  return withPanel((panel) => {
    const prev = options.panelPosition;
    try {
      if (panel.selectPosition.children.length !== 5) {
        return false;
      }
      panel.selectPosition.value = 'top-right';
      panel.selectPosition.onchange();
      const {style} = TypePanel.divAll;
      const anchored = style.top === '0px' && style.bottom === 'auto';
      const sided = style.left === 'auto' && style.right === '0px';
      const stored = globalThis.localStorage.getItem('rti-panel-position') === 'top-right';
      if (!anchored || !sided || !stored || options.panelPosition !== 'top-right') {
        return false;
      }
      panel.selectPosition.value = 'junk';
      panel.selectPosition.onchange();
      const fallback = TypePanel.divAll.style.bottom === '0px';
      const corner = TypePanel.divAll.style.right === '0px';
      return fallback && corner && options.panelPosition === 'bottom-right';
    } finally {
      options.panelPosition = prev;
    }
  });
}
/**
 * A persisted drag wins over the start position (which still normalizes).
 * @returns {boolean} True when geometry survives a conflicting start.
 */
function testPersistedPositionWinsOverStart() {
  return withPanel(() => {
    const prev = options.panelPosition;
    try {
      globalThis.localStorage.setItem('rti-panel-position', 'top-left');
      globalThis.localStorage.setItem('rti-panel-geometry', JSON.stringify({left: '100px', top: '100px'}));
      TypePanel.instance = null;
      TypePanel.divAll = null;
      const fresh = new TypePanel();
      const {style} = TypePanel.divAll;
      const kept = style.left === '100px' && style.top === '100px';
      const synced = options.panelPosition === 'top-left' && fresh.selectPosition.value === 'top-left';
      return kept && synced;
    } finally {
      options.panelPosition = prev;
    }
  });
}
/**
 * Re-instantiating the panel (REPL re-runs) must keep fetching: the
 * singleton hand-back plus a real window `message` still lands a row.
 * @returns {boolean} True when the error arrives after re-instantiation.
 */
function testSecondInstantiationStillFetchesErrors() {
  return withPanel((panel) => {
    const prevMode = options.mode;
    options.mode = 'never';
    try {
      const again = new TypePanel();
      if (again !== panel) {
        return false;
      }
      const sink = {postMessage: () => {}};
      const msg = {source: null, srcElement: sink, data: {type: 'rti', destination: 'ui', action: 'addError',
        value: 1, expect: 'string', loc: 'L1', name: 'a', valueToString: '1',
        strings: ['boom'], extras: [], key: 'L1-a'}};
      globalThis.window.fire('message', msg);
      const warnObj = panel.warnings['L1-a'];
      return !!warnObj && panel.warnedTable.contains(warnObj.tr);
    } finally {
      options.mode = prevMode;
    }
  });
}
/**
 * A detached panel wrapper (closed pop-out, wiped body) is a corpse:
 * re-instantiating rebuilds live instead of appending new errors into
 * dead nodes, and the corpse's leaked listener stays muted.
 * @returns {boolean} True when the rebuild fetches and the corpse ignores.
 */
function testCorpsePanelRebuildsLive() {
  return withPanel((panel) => {
    const prevMode = options.mode;
    options.mode = 'never';
    try {
      TypePanel.divAll.remove();
      const revived = new TypePanel();
      const alive = revived !== panel && TypePanel.divAll.isConnected && TypePanel.instance === revived;
      if (!alive) {
        return false;
      }
      // Rebuilding re-syncs options from storage; re-quiet for the fetch.
      options.mode = 'never';
      const sink = {postMessage: () => {}};
      const msg = {source: null, srcElement: sink, data: {type: 'rti', destination: 'ui', action: 'addError',
        value: 1, expect: 'string', loc: 'L1', name: 'a', valueToString: '1',
        strings: ['boom'], extras: [], key: 'L1-a'}};
      globalThis.window.fire('message', msg);
      const warnObj = revived.warnings['L1-a'];
      const fetched = !!warnObj && revived.warnedTable.contains(warnObj.tr);
      return fetched && !panel.warnings['L1-a'];
    } finally {
      options.mode = prevMode;
    }
  });
}
/**
 * `clear()` (Clear button or re-instantiation) resets the whole session:
 * rows, event log, and the validation counter — so the badge matches the
 * table instead of bragging about dead runs.
 * @returns {boolean} True when count and badge zero out with the rows.
 */
function testClearResetsErrorCount() {
  return withPanel((panel) => {
    const prev = options.count;
    try {
      options.count = 5;
      panel.updateErrorCount();
      const again = new TypePanel();
      const zeroed = options.count === 0 && panel.spanErrors.innerText === 'Type validation errors: 0';
      const badge = panel.taskbarRti.textContent === 'RTI' && panel.titleText.textContent === 'Runtime Type Inspector';
      return again === panel && zeroed && badge;
    } finally {
      options.count = prev;
    }
  });
}
const tests = [
  testOpenFocusDedupe,
  testMinimizeRestoreTaskbar,
  testCloseDestroys,
  testEscClosesTopmost,
  testClearClosesWindows,
  testSingletonNoStacking,
  testStaleInstanceIgnoresEvents,
  testClickBringsToFront,
  testTaskbarEntryFrontsOrRestores,
  testTaskbarPressKeepsButtonAlive,
  testDragCannotLoseWindow,
  testResizeKeepsCaptionOnScreen,
  testStaleGeometryClampedToViewport,
  testViewportShrinkRevivesWindows,
  testPanelStartPositions,
  testPanelStartCenter,
  testPanelPositionMenu,
  testPersistedPositionWinsOverStart,
  testSecondInstantiationStillFetchesErrors,
  testCorpsePanelRebuildsLive,
  testClearResetsErrorCount,
  testRtiEntryFocusesPanelWithCount,
  testTaskbarActiveFollowsFront,
  testOutsideClickClearsAll,
  testPanelClickFrontsOverCompares,
  testActiveTitleFollowsClick,
  testCompareWindowsResizable,
  testGrabActivatesWindow,
  testPointerdownFronts,
  testTaskbarAlwaysVisible,
];
export {tests};
