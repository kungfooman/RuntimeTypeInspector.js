// The content of this types.d.ts file is authored manually. 
type Options = {
  enable?: boolean;
  selftest?: boolean;
  ignoredFiles?: string[];
};
declare function runtimeTypeInspector(options?: Options): import('rollup').Plugin;
export{runtimeTypeInspector};
