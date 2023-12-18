This is the plugin for Parcel 2.

It is a two-step process to install it:

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
