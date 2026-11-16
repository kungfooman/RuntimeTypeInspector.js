# three.js — officially supported

Upstream: https://github.com/mrdoob/three.js (pinned rev in `project.json`).
Scope: all five upstream entries, instrumented under their own filenames:
`build/three.{core,module,tsl,webgpu,webgpu.nodes}.js` (+ `three.cjs` shim).
Demo: stock examples page, `examples/index.html` + one import-map line for
the runtime (see `examples-page.md`).

Build notes (not upstream bugs): the Debug button armed `${loc}-${name}`
suffixed with the panel's `@source` tag for foreign rows, a key the checker
never looks up, so the icon toggled but nothing ever broke. Rows now carry
the bare checking-side key (`breakpointKey` on `Warning`, passed at
construction in `TypePanel#addError`), so arming works for same-runtime,
worker, iframe and version-mix traffic alike.

## What the build needed

- `glsl()` rollup transform (`rollup.config.mjs`): stringifies `/* glsl */`
  template literals in `*.glsl.js` shader chunks, mirroring three.js's own
  build script. Without it the bundle is not valid JS.
- `three-enums.js` (regenerate with `gen-enums.mjs`): 204 `registerTypedef`
  shims for literal-valued `src/constants.js` exports, so value-as-type JSDoc
  unions (`WebGLCoordinateSystem`, `ShadowMapType`, ...) resolve instead of
  warning `unchecked`.
- `customTypes.TypedArray` (`three.rti.js`): one predicate,
  `(value) => ArrayBuffer.isView(value)`, covering the bare `{TypedArray}`
  references across `math/` that name the abstract `%TypedArray%` with no
  global constructor.

Each shim comment names the upstream RTI change that would obsolete it.

## Findings (real upstream bugs, with repros)

 1. `new Raycaster()` with no arguments warns on `origin`, `direction`, and
    `far`: the constructor's `@param {Vector3} origin` is documented required,
    but the no-arg form forwards `undefined` into `new Ray(...)` instead of
    falling back to `Ray`'s defaults. three.js's own unit tests call
    `new Raycaster()`.
 2. `Ray` treats `null` as infinite: `value is +-infinite` fires for `null`
    through `isFinite` coercion.
 3. `CubeRenderTarget` passes data images to `new CubeTexture(images)`,
    but `CubeTexture` documents `@param {Array<Image>} [images=[]]`. The
    six `{width, height, depth}` literals are not DOM `Image`s, so the
    `images` element check fails — and `tsc --strict` rejects the same
    call (`Type ... provides no match for the signature ...
    HTMLImageElement`). Note the parent disagrees with the child:
    `Texture`'s own constructor takes `{?Object} [image]` (deliberately
    loose, data textures included), while the `CubeTexture` override
    tightened it to `Array<Image>`. Repro: open
    `examples/webgpu_materials_envmaps_bpcem.html` (`new
    THREE.CubeRenderTarget(512)` in `init()`); the `CubeTexture#constructor
    > images` row fires once at startup.
 4. `Binding.clone()` (`src/renderers/common/Binding.js`) constructs with
    no arguments — `Object.assign(new this.constructor(), this)` — but the
    `NodeSampled*` subclass constructors document every parameter required
    (`@param {string} name`, `@param {TextureNode} textureNode`, `@param
    {UniformGroupNode} groupNode`). Cloning any sampled binding therefore
    warns three times (once per parameter, all `undefined`) before
    `Object.assign` fills the fields in. Repro: same BPCEM page; the
    `NodeSampledCubeTexture#constructor > name|textureNode|groupNode` rows
    fire together during `init()` (all three `undefined` rules out the
    builder call sites, which always pass a string `name`). Same family as
    finding 1: required JSDoc, engine-internal under-supplied call.

## Non-findings (JSDoc says optional, RTI agrees)

- `Euler` order is bare `{string}`: `'WXYZ'` passes by design.
- `Matrix4.set` params are all optional; `Mesh` material is optional.
