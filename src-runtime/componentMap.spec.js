import {validateType} from './validateType.js';
import {registerTypedef, typedefs} from './registerTypedef.js';
import {registerClass} from './registerClass.js';
import {expandType} from '../src-transpiler/expandType.js';
import {createType} from './createType.js';
import {inspectTypeWithTemplates} from './inspectTypeWithTemplates.js';
const warn = () => undefined;
/**
 * Stripped PlayCanvas classes: only the inheritance chain and the
 * component slots matter here. Real `Entity` gains its component props
 * dynamically, the static shape lives in the `Entity` typedef below,
 * mirroring how the engine pairs runtime classes with JSDoc types.
 */
class Component {}
class CameraComponent extends Component {
  constructor() {
    super();
    this.clearColor = [0, 0, 0, 1];
  }
}
class LightComponent extends Component {
  constructor() {
    super();
    this.intensity = 1;
  }
}
class Entity {
  constructor() {
    this.camera = null;
    this.light = null;
    this.name = 'unnamed';
  }
  /**
   * @param {ComponentName} name - The name of the component to add.
   * @returns {*} The name.
   */
  addComponent(name) {
    return name;
  }
}
function clearTypedefs() {
  Object.keys(typedefs).forEach((_) => delete typedefs[_]);
}
function prepare() {
  clearTypedefs();
  registerClass(Component);
  registerClass(CameraComponent);
  registerClass(LightComponent);
  registerClass(Entity);
  // Static shape of Entity: what TypeScript sees for `keyof Entity`.
  registerTypedef('Entity', {
    type: 'object',
    properties: {
      camera: 'CameraComponent',
      light: 'LightComponent',
      name: 'string',
      enabled: 'boolean',
    },
  });
  /**
   * The components an {@link Entity} can hold, keyed by name: only props
   * whose type extends {@link Component} survive the `as` remapping.
   */
  registerTypedef('ComponentMap', expandType('{ [K in keyof Entity as NonNullable<Entity[K]> extends Component ? K : never]: NonNullable<Entity[K]> }'));
  /**
   * The name of a component an {@link Entity} can hold, such as `'camera'`
   * or `'light'`: the keys of {@link ComponentMap}. Spelled with `& string`
   * on purpose, like in the engine.
   */
  registerTypedef('ComponentName', expandType('keyof ComponentMap & string'));
}
function testAsClauseParsed() {
  prepare();
  const mapping = typedefs.ComponentMap;
  if (!mapping || mapping.type !== 'mapping') {
    return false;
  }
  // The `as` remapping must survive parsing, not be silently dropped.
  if (!mapping.nameType || mapping.nameType.type !== 'condition') {
    return false;
  }
  return true;
}
function testComponentMapMaterializes() {
  prepare();
  const type = createType('ComponentMap', warn);
  if (!type || type.type !== 'object') {
    return false;
  }
  const keys = Object.keys(type.properties).sort();
  // Only component props survive: `name`/`enabled` are remapped away.
  if (JSON.stringify(keys) !== JSON.stringify(['camera', 'light'])) {
    return false;
  }
  return true;
}
function testComponentNameAccepts() {
  prepare();
  if (!validateType('camera', 'ComponentName', 'Entity#addComponent', 'name', true, warn, 0)) {
    return false;
  }
  if (!validateType('light', 'ComponentName', 'Entity#addComponent', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testComponentNameRejects() {
  prepare();
  // Remapped away: valid Entity key but not a component.
  if (validateType('name', 'ComponentName', 'Entity#addComponent', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType('nope', 'ComponentName', 'Entity#addComponent', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(123, 'ComponentName', 'Entity#addComponent', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testComponentInstanceMatches() {
  prepare();
  const type = createType('ComponentMap', warn);
  const cameraProp = type.properties.camera;
  if (!validateType(new CameraComponent(), cameraProp, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  // A light is not a valid camera option value.
  if (validateType(new LightComponent(), cameraProp, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testGenericMappedInstantiation() {
  // The machinery `ComponentOptions<K>` needs: template substitution must
  // flow through `mapping` and `indexedAccess` (local stand-in, not engine code).
  prepare();
  registerTypedef('Box', {type: 'object', properties: {a: '"x"', b: 1}});
  const templates = {T: 'Box'};
  const mapping = () => ({type: 'mapping', iterable: {type: 'keyof', argument: 'T'}, element: 'K', result: {type: 'indexedAccess', index: 'K', object: 'T'}});
  if (!inspectTypeWithTemplates({a: 'x', b: 1}, mapping(), 'loc', 'name', templates)) {
    return false;
  }
  if (inspectTypeWithTemplates({a: 'y', b: 1}, mapping(), 'loc', 'name', templates)) {
    return false;
  }
  return true;
}
export const tests = [
  testAsClauseParsed,
  testComponentMapMaterializes,
  testComponentNameAccepts,
  testComponentNameRejects,
  testComponentInstanceMatches,
  testGenericMappedInstantiation,
];
