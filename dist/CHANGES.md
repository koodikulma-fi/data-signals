# CHANGES

## v1.1.0

### Additions & refines

- Add to ContextSettings: `{ dataSetMode: "root" | "leaf" | "only" }`, and likewise refactored DataMan base.
- Refined the static side typing of the mixins and classes. Accordingly requires `mixin-types` v1.1.0.
- Refined the bundled output form.
- Refines compiling to keep class and func names. (Func args are mangled to keep size small.)
