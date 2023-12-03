// The content of this types.d.ts file is authored manually. 
type Options = import('./index.mjs').Options;
declare function runtimeTypeInspector(options?: Options): import('rollup').Plugin;
export {runtimeTypeInspector};
