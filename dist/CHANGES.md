# CHANGES

## v1.1.2 (2024-10-20)

### Enhances typing
- Refine typing for `ContextAPI` data listeners in that for ContextAPI the data can always have `undefined` union (unless specific fallback given).
    * Note that for direct `Context` data listening, this is not the case, since it's known that the context exists - so only provides `undefined` union if data is actually partial.
- Adds `InterfaceLevel` (3rd) type arg to `Context`, eg. `Context<Data, Signals, 2>`.
    * The type arg defaults to `0` like in `DataMan`. Note that in `ContextAPI` it defaults to `1`.
    * Note that you can alternatively control the typing depth by using `type` vs. `interface`.

### Package refines
- Refines how typing for constructor args is read (end result is the same).
- Updates comments, README, and adds "types" specifically to package.json.
- In imports, refines that dependency is to `"mixin-types/types"` (only the typing as of `mixin-types@v1.1.1`).

## v1.1.1 (2024-10-13)

### Typing refines
- Renames `Awaited` to `AwaitedOnce` to clarify and to distinguish from TypeScript's own `Awaited` (that awaits all nested).
- Adds `OmitPartial` and `GetPartialKeys` utility types.
- Refines optionality of `DataMan`'s 1st constructor arg (to allow skipping if data has no _required_ properties).

## v1.1.0 (2024-09-30)

### Additions & refines

- Added to ContextSettings: `{ dataSetMode: "root" | "leaf" | "only" }`, and likewise refactored DataMan base.
- Added createContexts method to easily create multiple named contexts with initial data (and settings).
- Refined the static side typing of the mixins and classes. Accordingly requires `mixin-types` v1.1.0.
- Refined the bundled output form.
- Refines compiling to keep class and func names. (Func args are mangled to keep size small.)
