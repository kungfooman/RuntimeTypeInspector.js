/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 *
 * CJS entry, same shape as upstream's build/three.cjs: re-exports the ES
 * module via require(esm). Kept byte-shape-compatible so `require('three')`
 * keeps working against the instrumented build.
 */
module.exports = require( './three.module.js' );
