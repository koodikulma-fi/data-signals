# CHANGES

---

## v1.2.1 (2024-11-09)

### Tiny refines
- Refined typing for `listenToData` and `getInData` methods fallback arguments to correctly cull out `undefined` in certain special cases.
- Refined the internal use of `.entries()` and `.keys()` iteration to not make calls during the iteration (but after). This is to account for any rare changes in the iterable (as it's still connected to the native Map).

---

## v1.2.0 (2024-10-31)

### Renames context setting
- Renames the context setting `dataSetMode` -> `dataMode` in `ContextSettings` and changes its value names and default. The values are:
    * `immutable` (<- `root`): Shallow copies the data from root down to respect immutability.
    * `mutable` (<- `leaf`): Mutates the target data at the leaf, and creates structure to the leaf if needed.
    * `existing` (<- `only`): Mutates the target data at the leaf only if the parenting structure exists.
- The new default is `immutable`, instead of earlier `mutable`. The main reasons are:
    1. `immutable` mode directly reflects the data listener refreshes. (So more consistent as a whole.)
    2. This way the setting makes the usage of contexts more robust (by default) in external applications.
        * In context with a small data tree, `leaf` might be a better default, but on the other hand the feature makes little difference with small trees.
    3. It's perhaps more expectable that contexts would run in immutable-like mode by default.

### Enhances typing
- Refine typing for `ContextAPI` data listeners in that for ContextAPI the data can always have `undefined` union (unless specific fallback given).
    * Note that for direct `Context` data listening, this is not the case, since it's known that the context exists - so only provides `undefined` union if data is actually partial.

### Package refines
- Refines how typing for constructor args is read (end result is the same).
- Updates comments, README, and adds "types" specifically to package.json.
- In imports, refines that dependency is to `"mixin-types/types"` (only the typing as of `mixin-types@v1.1.1`).

---

## v1.1.1 (2024-10-13)

### Typing refines
- Renames `Awaited` to `AwaitedOnce` to clarify and to distinguish from TypeScript's own `Awaited` (that awaits all nested).
- Adds `OmitPartial` and `GetPartialKeys` utility types.
- Refines optionality of `DataMan`'s 1st constructor arg (to allow skipping if data has no _required_ properties).

---

## v1.1.0 (2024-09-30)

### Additions & refines

- Added to ContextSettings: `{ dataSetMode: "root" | "leaf" | "only" }`, and likewise refactored DataMan base.
- Added createContexts method to easily create multiple named contexts with initial data (and settings).
- Refined the static side typing of the mixins and classes. Accordingly requires `mixin-types` v1.1.0.
- Refined the bundled output form.
- Refines compiling to keep class and func names. (Func args are mangled to keep size small.)
