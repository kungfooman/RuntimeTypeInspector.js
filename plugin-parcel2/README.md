# Plugin for Parcel v2

For integrating this plugin follow this process:

1) `npm install --save-dev @runtime-type-inspector/parcel-transformer`

2) Edit your `.parcelrc`:

```json
{
    "extends": "@parcel/config-default",
    "transformers": {
        "*.js": ["@runtime-type-inspector/parcel-transformer", "..."]
    }
}
```

3) Make sure to declare RTI as globals:

```html
<script src="/node_modules/@runtime-type-inspector/runtime/index.cjs"></script>
<script>
  Object.assign(window, rtiRuntime);
</script>
<script src="./build/out.js"></script>
```

This is *kind of ugly*, but Parcel v2 simply doesn't seem to support adding import declarations inside a plugin. If I will find a possibility, I will fix this.

Parcel also drops files that export nothing, but given the nature of JSDoc comments in combination of RTI, a comment is converted into `registerTypedef(...)` for example. This means that typedefs in such files will simply be unregistered, causing runtime type errors (because it's an unknown type). Make sure to process such files individually and add them into the final `out.js`.