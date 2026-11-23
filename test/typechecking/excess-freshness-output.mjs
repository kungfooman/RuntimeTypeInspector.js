registerTypedef('CCBox', {
  "type": "object",
  "properties": {
    "a": "number",
    "b": "string"
  }
});
registerTypedef('CCPartial', {
  "type": "reference",
  "name": "Partial",
  "args": [
    "CCBox"
  ]
});
registerTypedef('CCPick', {
  "type": "reference",
  "name": "Partial",
  "args": [
    {
      "type": "reference",
      "name": "Pick",
      "args": [
        "CCBox",
        "\"a\""
      ]
    }
  ]
});
registerTypedef('CCOmit', {
  "type": "reference",
  "name": "Partial",
  "args": [
    {
      "type": "reference",
      "name": "Omit",
      "args": [
        "CCBox",
        "\"a\""
      ]
    }
  ]
});

/**
 * Excess Property Checking on fresh literals plus the weak-type gate:
 * fresh object literals reject unknown keys while the same shape in a
 * stale variable passes structurally (`tsc --strict` parity, verified on
 * the `CC-*` mirrors). A stale probe with no key in common with an
 * all-optional shape still fails (`tsc` TS2559). Every throwing call
 * carries `@ts-expect-error`, so a tsc-strict run is green if and only
 * if each directive is consumed and nothing else errors.
 */

/**
 * @param {{r: number, g: number, b: number}} color
 */
function takeColor(color) {
  if (!inspectType(color, {
    "type": "object",
    "properties": {
      "r": "number",
      "g": "number",
      "b": "number"
    },
    "optional": false
  }, 'takeColor', 'color')) {
    youCanAddABreakpointHere();
  }
  return color;
}
takeColor({
  r: 1,
  g: 2,
  b: 3
}); /* ok: exact fresh literal */ 
/* @ts-expect-error: fresh excess key */

/* ok: exact fresh literal */ /* @ts-expect-error: fresh excess key */
takeColor({
  r: 1,
  g: 2,
  b: 3,
  a: 4
});
const staleColor = {
  r: 1,
  g: 2,
  b: 3,
  a: 4
};
takeColor(staleColor); /* ok: stale excess passes structurally */ 

/**
 * @param {{nested: {x: number}}} o
 */

/* ok: stale excess passes structurally */ 
/**
 * @param {{nested: {x: number}}} o
 */
function takeNested(o) {
  if (!inspectType(o, {
    "type": "object",
    "properties": {
      "nested": {
        "type": "object",
        "properties": {
          "x": "number"
        }
      }
    },
    "optional": false
  }, 'takeNested', 'o')) {
    youCanAddABreakpointHere();
  }
  return o;
}
/* @ts-expect-error: nested fresh excess key */

takeNested({
  nested: {
    x: 1,
    extra: 2
  }
});
const inner = {
  x: 1,
  extra: 2
};
takeNested({
  nested: inner
}); /* ok: nested stale passes */ 

/**
 * @typedef {{a: number, b: string}} CCBox
 * @typedef {Partial<CCBox>} CCPartial
 * @typedef {Partial<Pick<CCBox, "a">>} CCPick
 * @typedef {Partial<Omit<CCBox, "a">>} CCOmit
 */

/** @param {CCPartial} x */

/* ok: nested stale passes */ 
/**
 * @typedef {{a: number, b: string}} CCBox
 * @typedef {Partial<CCBox>} CCPartial
 * @typedef {Partial<Pick<CCBox, "a">>} CCPick
 * @typedef {Partial<Omit<CCBox, "a">>} CCOmit
 */
/** @param {CCPartial} x */
function takePartial(x) {
  if (!inspectType(x, "CCPartial", 'takePartial', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takePartial({
  a: 1
}); /* ok: overlapping stale passes */ 
takePartial({}); /* ok: empty is assignable to every weak shape */ 
/* @ts-expect-error: fresh excess key */

/* ok: empty is assignable to every weak shape */ /* @ts-expect-error: fresh excess key */
takePartial({
  a: 1,
  zzz: 9
});
const staleUnknown = {
  zzz: 9
};
takePartial(staleUnknown); /* ok: unknown excess is not a weak-type fail */ 
/** @param {CCPick} x */

/* ok: unknown excess is not a weak-type fail */ /** @param {CCPick} x */
function takePick(x) {
  if (!inspectType(x, "CCPick", 'takePick', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takePick({}); /* ok */ 
/* @ts-expect-error: fresh picked-away key */

/* ok */ /* @ts-expect-error: fresh picked-away key */
takePick({
  b: 's'
});
const stalePickedAway = {
  b: 's'
};
takePick(stalePickedAway); /* throws: no key in common (tsc TS2559) */ 
/** @param {CCOmit} x */

/* throws: no key in common (tsc TS2559) */ /** @param {CCOmit} x */
function takeOmit(x) {
  if (!inspectType(x, "CCOmit", 'takeOmit', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeOmit({
  b: 's'
}); /* ok: surviving key */ 
/* @ts-expect-error: fresh omitted key */

/* ok: surviving key */ /* @ts-expect-error: fresh omitted key */
takeOmit({
  a: 1
});
const staleOmitted = {
  a: 1
};
takeOmit(staleOmitted); /* throws: no key in common (tsc TS2559) */ 
