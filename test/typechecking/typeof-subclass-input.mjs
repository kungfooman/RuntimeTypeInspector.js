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
class PlayerController extends Script {
  constructor() {
    super();
    /** @type {number} */
    this.speed = 1;
  }
}
class TurboPlayer extends PlayerController {
  constructor() {
    super();
    /** @type {number} */
    this.boost = 2;
  }
}
class Unrelated {
  constructor() {
    /** @type {string} */
    this.label = 'x';
  }
}
// Legacy `createScript` shape: prototype-linked without `extends`.
function LegacyScript() {}
LegacyScript.prototype = Object.create(Script.prototype);
LegacyScript.prototype.constructor = LegacyScript;
/**
 * @param {typeof Script} script - The script class to register.
 */
function registerScript(script) {
  return script;
}
registerScript(Script); // ok: identity still passes
registerScript(PlayerController); // ok: direct subclass
registerScript(TurboPlayer); // ok: indirect subclass
// @ts-expect-error: tsc cannot see prototype linkage (`new () => void` is
// not `new () => Script`), but at runtime LegacyScript.prototype is a
// Script and RTI accepts it — the createScript case from the issue.
registerScript(LegacyScript); // ok for RTI
// @ts-expect-error: Unrelated is not a Script subclass
registerScript(Unrelated);
// @ts-expect-error: instances are not constructors
registerScript(new PlayerController());
/**
 * `string|typeof Script` union form, like `ScriptComponent#create`.
 * @param {string|typeof Script} nameOrType - The name or class of the script.
 */
function create(nameOrType) {
  return nameOrType;
}
create('player'); // ok
create(PlayerController); // ok: subclass through a union
// @ts-expect-error: neither a name nor a Script subclass
create(Unrelated);
