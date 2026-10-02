
/**
 * `typeof Base` must accept subclass constructors, not just identity:
 * every `createScript` or ESM `Script` subclass passed to `registerScript`,
 * `ScriptRegistry#add` or `ScriptComponent#create` failed the old
 * `value === Base` check. Base classes stay realistic (non-empty): tsc
 * reads an empty `class C {}` structurally, so every class would extend it
 * and TypeScript-playground counter-checks would diverge from RTI's
 * nominal class checks. Every throwing call carries `@ts-expect-error`,
 * so a tsc-strict run is green if and only if each directive is consumed
 * and nothing else errors; `*-errors.json` pins the same sequence for RTI.
 */
class Script {
  constructor() {
    /** @type {boolean} */
    this.enabled = true;
  }
  update() {}
}
registerClass(Script);
registerTypedef('Script', {
  "type": "object",
  "properties": {
    "update": "Function",
    "enabled": "boolean"
  }
});
class PlayerController extends Script {
  constructor() {
    super();
    /** @type {number} */

    this.speed = 1;
  }
}
registerClass(PlayerController);
registerTypedef('PlayerController', {
  "type": "object",
  "properties": {
    "speed": "number"
  }
});
class TurboPlayer extends PlayerController {
  constructor() {
    super();
    /** @type {number} */

    this.boost = 2;
  }
}
registerClass(TurboPlayer);
registerTypedef('TurboPlayer', {
  "type": "object",
  "properties": {
    "boost": "number"
  }
});
class Unrelated {
  constructor() {
    /** @type {string} */
    this.label = 'x';
  }
}
registerClass(Unrelated);
registerTypedef('Unrelated', {
  "type": "object",
  "properties": {
    "label": "string"
  }
});
// Legacy `createScript` shape: prototype-linked without `extends`.

function LegacyScript() {}
LegacyScript.prototype = Object.create(Script.prototype);
LegacyScript.prototype.constructor = LegacyScript;
// Newer `createScript` shape: prototype-linked like above, with the static

// side inheriting too, mirroring `extends`.


// Newer `createScript` shape: prototype-linked like above, with the static

// side inheriting too, mirroring `extends`.
function ModernScript() {}
ModernScript.prototype = Object.create(Script.prototype);
ModernScript.prototype.constructor = ModernScript;
Object.setPrototypeOf(ModernScript, Script);

/**
 * @param {typeof Script} script - The script class to register.
 */

function registerScript(script) {
  if (!inspectType(script, {
    "type": "typeof",
    "argument": "Script",
    "optional": false
  }, 'registerScript', 'script')) {
    youCanAddABreakpointHere();
  }
  return script;
}
registerScript(Script); // ok: identity still passes

registerScript(PlayerController); // ok: direct subclass

registerScript(TurboPlayer); // ok: indirect subclass

// @ts-expect-error: tsc cannot see prototype linkage (`new () => void` is

// not `new () => Script`), but at runtime LegacyScript.prototype is a

// Script and RTI accepts it — the createScript case from the issue.

 // ok: indirect subclass

// @ts-expect-error: tsc cannot see prototype linkage (`new () => void` is

// not `new () => Script`), but at runtime LegacyScript.prototype is a

// Script and RTI accepts it — the createScript case from the issue.
registerScript(LegacyScript); // ok for RTI

// @ts-expect-error: tsc cannot see either linkage (`Object.setPrototypeOf`

// is opaque to it), but at runtime ModernScript is a Script on both the

// instance and the static side and RTI accepts it.

 // ok for RTI

// @ts-expect-error: tsc cannot see either linkage (`Object.setPrototypeOf`

// is opaque to it), but at runtime ModernScript is a Script on both the

// instance and the static side and RTI accepts it.
registerScript(ModernScript); // ok for RTI

// @ts-expect-error: Unrelated is not a Script subclass

 // ok for RTI

// @ts-expect-error: Unrelated is not a Script subclass
registerScript(Unrelated);
// @ts-expect-error: instances are not constructors

registerScript(new PlayerController());

/**
 * `string|typeof Script` union form, like `ScriptComponent#create`.
 * @param {string|typeof Script} nameOrType - The name or class of the script.
 */

function create(nameOrType) {
  if (!inspectType(nameOrType, {
    "type": "union",
    "members": [
      "string",
      {
        "type": "typeof",
        "argument": "Script"
      }
    ],
    "optional": false
  }, 'create', 'nameOrType')) {
    youCanAddABreakpointHere();
  }
  return nameOrType;
}
create('player'); // ok

create(PlayerController); // ok: subclass through a union

// @ts-expect-error: neither a name nor a Script subclass

 // ok: subclass through a union

// @ts-expect-error: neither a name nor a Script subclass
create(Unrelated);
