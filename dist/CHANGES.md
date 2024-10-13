# CHANGES

## v1.1.1

### Typing refines
- Renames `Awaited` to `AwaitedOnce` to clarify and to distinguish from TypeScript's own `Awaited` (that awaits all nested).
- Adds `OmitPartial` and `GetPartialKeys` utility types.
- Refines optionality of `DataMan`'s 1st constructor arg (to allow skipping if data has no _required_ properties).

## v1.1.0

### Additions & refines

- Added to ContextSettings: `{ dataSetMode: "root" | "leaf" | "only" }`, and likewise refactored DataMan base.
- Added createContexts method to easily create multiple named contexts with initial data (and settings).
- Refined the static side typing of the mixins and classes. Accordingly requires `mixin-types` v1.1.0.
- Refined the bundled output form.
- Refines compiling to keep class and func names. (Func args are mangled to keep size small.)
