
---

TODO:
- Finish the SELECTORS part of doc.
- Add a couple of (typed) MIXIN usage examples.
- Release as NPM package.

## What is `data-signals`?

DataSignals (or `data-signals`) is a light weight library containing a few simple but carefully designed JS/TS classes, mixins and tools for managing complex state and action flow in sync.

The classes and methods are fully typed and commented. Accordingly the methods themselves can be used as documentation.

The npm package can be found with: [data-signals](https://www.npmjs.com/package/data-signals). Contribute in GitHub: [koodikulma-fi/data-signals.git](https://github.com/koodikulma-fi/data-signals.git)

---

## Documentation

### Basics - 3 main layers

#### 1. LIBRARY METHODS

A couple of library methods useful for reusing data.
- `DataTrigger` allows to trigger a callback when reference data is changed from last time - supporting various levels of comparison.
- `DataMemo` allows to recompute / reuse data based on arguments: when args change (according to comparison level), calls the producer callback to return new data.
- `DataPicker` is like DataMemo but with an extraction process in between, and always uses shallow comparison (of prev/next args) to trigger the producer callback.
- `DataSelector` functions exactly like DataSelector but uses multiple extractors: `(extractor1, extractor2, ..., producerCallback)`.

#### 2. SIMPLE MIXINS / CLASSES

A couple of mixins (+ stand alone class) for signalling and data listening features.
- `SignalMan` provides a service to attach listener callbacks to signals and then emit signals from the class - optionally supporting various data or sync related options.
- `DataBoy` provides data listening services, but without actually having any data.
- `DataMan` extends `DataBoy` to provide the actual data hosting and related methods.
- `SignalDataBoy` extends both `SignalMan` and `DataBoy`.
- `SignalDataMan` extends both `SignalMan` and `DataMan`.

Note. The mixins simply allow to extend an existing class with the mixin features - the result is a new custom made class.

#### 3. COMPLEX CLASSES

Finally, two classes specialized for complex data sharing situations, like those in modern web apps.
- `Context` extends `SignalDataMan` with syncing related settings. The contexts can also sync to the `ContextAPI`s that are listening to them.
- `ContextAPI` extends `SignalDataBoy` and accordingly allows to listen to data and signals in various named contexts.

The `ContextAPI` instance can also affect the syncing of `Context` refreshes - this is especially useful with the "delay" type of signals.
- For example, consider a state based rendering app, where you first set some data in context to trigger rendering ("pre-delay"), but want to send a signal only once the whole rendering is completed ("delay"). For example, the signal is meant for a component that was not there before state refresh.
- To solve it, the rendering hosts can simply use a connected contextAPI and override its `afterRefresh` method to await until rendering completed, making the "delay" be triggered only once the last of them completed. (The components may also use contextAPI, but typically won't affect the syncing.)

---

### Selectors

TODO: CLEAN THIS PORTION UP.. THEN BASICALLY DOCUMENTED.

There are 4 data reusing helpers available:
- `createDataTrigger` creates a function that can be called to trigger a callback when the reference data is changed from the last time.
    * First create a trigger: `const myTrigger = createDataTrigger((newMem, oldMem) => { ...do something... }))`.
    * Then later on use it: `const didChange = myTrigger(newData)`.
- `createDataMemo` is similar but when used returns the data.
    * First create a memo: `const orderMemo = createDataMemo((a, b) => a < b ? [a, b] : [b, a])`.
    * Then later on use it: `const [smaller, greater] = orderMemo(a, b)`.
- `createDataPicker` is similar to memo, but uses an extractor func to produce the arguments for (comparison and) the producer callback.
    * Create: `const myPicker = createDataPicker((state1, state2) => [state1.a, state1.b, state2.c], (a, b, c) => doSomething)`.
    * Use: `const myData = myPicker(state1, state2)`. Typically the state(s) would come from the data of `Context`s (see below).
- `createDataSelector` functions exactly like DataSelector but uses multiple extractors.
    * The first args are extractors, the last executor: `const mySelector = createDataSelector((state1, state2) => state1.a, (state1, state2) => state2.b, (a, b) => a < b ? [a, b] : [b, a])`.
    * Used like data picker: `const myData = mySelector(state1, state2)`.

Both the DataTrigger and DataMemo support defining the level of comparison to use.
- For createDataMemo the depth is the 2nd argument, while for createDataTrigger it's the 3rd argument.
- For example, `createDataMemo(producer, 2)` performs two level shallow comparison, while `(producer, -1)` would perform deep comparison.

The extractor based (DataPicker and DataSelector) always receive `(...args)` and use shallow comparison of the array contents.

```typescript

// - createDataSelector - //

// Prepare.
type MyParams = [colorMode?: "light" | "dark", typeScript?: boolean];
type MyData = { theme: "dark" | "light"; typescript: boolean; }

// With pre-typing.
const codeViewDataSelector = (createDataSelector as CreateDataSelector<MyParams, MyData>)(
    // Extractors.
    [
        (colorMode, _typeScript) => colorMode || "dark",
        (_colorMode, typeScript) => typeScript || false,
    ], // No trick.
    // Selector.
    (theme, typescript) => ({ theme, typescript })
);

// With manual typing.
const codeViewDataSelector_MANUAL = createDataSelector(
    // Extractors.
    [
        (colorMode: "light" | "dark", _typeScript: boolean) => colorMode || "dark",
        (...[_colorMode, typeScript]: MyParams) => typeScript || false,
    ], // No trick.
    // Selector.
    (theme, typescript): MyData => ({ theme, typescript })
);

// Test.
const sel = codeViewDataSelector("dark", true);
const sel_FAIL = codeViewDataSelector("FAIL", true); // Here only "FAIL" is red-underlined.
const sel_MANUAL = codeViewDataSelector_MANUAL("dark", true);
const sel_MANUAL_FAIL = codeViewDataSelector_MANUAL("FAIL", true); // Only difference is that both: ("FAIL", true) are red-underlined.


// - createDataPicker - //

// Prepare.
type MyParams = [colorMode?: "light" | "dark", typeScript?: boolean];
type MyData = { theme: "dark" | "light"; typescript: boolean; }

// With pre-typing.
const codeViewDataPicker =
    (createDataPicker as CreateDataPicker<MyParams, MyData>)(
    // Extractor - showcases the usage for contexts.
    // .. For example, if has many usages with similar context data needs.
    (colorMode, typeScript) => [
        colorMode || "dark",
        typeScript || false,
    ],
    // Picker - it's only called if the extracted data items were changed from last time.
    (theme, typescript) => ({ theme, typescript })
);

// With manual typing.
const codeViewDataPicker_MANUAL = createDataPicker(
    // Extractor.
    (...[colorMode, typeScript]: MyParams) => [
        colorMode || "dark",
        typeScript || false,
    ],
    // Picker.
    (theme, typescript): MyData => ({ theme, typescript })
);

// Test.
const val = codeViewDataPicker("dark", true);
const val_FAIL = codeViewDataPicker("FAIL", true);
const val_MANUAL = codeViewDataPicker_MANUAL("dark", true);
const val_MANUAL_FAIL = codeViewDataPicker_MANUAL("FAIL", true);

```

---

### SignalMan

- `SignalMan` provides signalling features, from simple instant void signals to complex synced awaiting getters.

```typescript

// Prepare signal typing.
type Signals = { doIt: (what: number) => void; whatIsLife: (whoAsks: string) => Promise<number>; };

// Create a SignalMan instance.
const signalMan = new SignalMan<Signals>();

// Listen to signals.
signalMan.listenTo("doIt", (what) => { console.log(what); });
signalMan.listenTo("whatIsLife", (whoAsks) => new Promise(res => res(whoAsks === "me" ? 0 : -1)));

// Send a signal.
signalMan.sendSignal("doIt", 5);

// Send a more complex signal.
const livesAre = await signalMan.sendSignalAs("await", "whatIsLife", "me"); // [0]
const lifeIsNow = await signalMan.sendSignalAs(["await", "first"], "whatIsLife", "me"); // 0

```

---

### DataMan & DataBoy

- `DataBoy` simply provides data listening basis without having any data. (It's useful eg. for `ContextAPI`s.)
- `DataMan` completes the concept by providing the `data` member and the related methods for setting and getting data.

```typescript

// Create a DataMan instance.
const initialData = { something: { deep: true }, simple: "yes" };
const dataMan = new DataMan(initialData);

// Get data.
dataMan.getData(); // { something: { deep: true }, simple: "yes" }
dataMan.getInData("something.deep"); // true

// Listen to data.
dataMan.listenToData("something.deep", "simple", (deep, simple) => { console.log(deep, simple); });
dataMan.listenToData("something.deep", (deepOrFallback) => { }, [ "someFallback" ]); // Custom fallback if data is undefined.

// Trigger changes.
// .. At DataMan level, the data is refreshed instantly and optional timeouts are resolved separately.
// .. Note. The Contexts level has 0ms timeout by default and the refreshes are triggered all in sync.
dataMan.setData({ simple: "no" });
dataMan.setInData("something.deep", false);
dataMan.setInData("something.deep", true);
dataMan.refreshData("something.deep");
dataMan.refreshData(["something.deep", "simple"], 5); // Trigger a refresh after 5ms timeout.

```

---

### Contexts

- `Context` extends `SignalDataMan` and provides synced data refreshes and signalling.
- The data refreshes are triggered simultaneously after a common timeout (vs. separately at DataMan level), and default to 0ms timeout.
- The signalling part is synced to the refresh cycle using "pre-delay" and "delay" options.
    * The "pre-delay" is tied to context's own refresh cycle, defined by the `{ refreshTimeout: number | null; }` setting.
    * The "delay" happens after ("pre-delay" and) all the connected `ContextAPI` instances have refreshed (by their `afterRefresh` promise).

```typescript

// Prepare initial data and settings.
const initialData = { something: { deep: true }, simple: "yes" };
const settings: { refreshTimeout?: number | null; } = {}; // Defaults to 0ms, null means synchronous, undefined uses default.

// Extra typing - just to showcase Context<Data, Signals>.
type Data = typeof initialData;
type Signals = { doIt: (what: number) => void; whatIsLife: (whoAsks: string) => Promise<number>; };

// Create a context.
const myContext = new Context<Data, Signals>(initialData, settings);

// Get data.
myContext.getData(); // { something: { deep: true }, simple: "yes" }
myContext.getInData("something.deep"); // true

// Listen to data and signals.
myContext.listenToData("something.deep", "simple", (deep, simple) => { console.log(deep, simple); });
myContext.listenToData("something.deep", (deepOrFallback) => { }, [ "someFallback" ]); // Custom fallback if data is undefined.
myContext.listenTo("doIt", (what) => { console.log(what); });
myContext.listenTo("whatIsLife", (whoAsks) => new Promise(res => res(whoAsks === "me" ? 0 : -1)));

// Trigger changes.
// .. At Contexts level data refreshing uses 0ms timeout by default, and refreshes are always triggered all in sync.
myContext.setData({ simple: "no" });
myContext.setInData("something.deep", false);
myContext.setInData("something.deep", true);
myContext.refreshData("something.deep"); // Trigger refresh manually.
myContext.refreshData(["something.deep", "simple"], 5); // Add keys and force the next cycle to be triggered after 5ms timeout.
myContext.refreshData(true, null); // Just refresh everything, and do it now (with `null` as the timeout).

// Send a signal.
myContext.sendSignal("doIt", 5);

// Send a more complex signal.
const livesAre = await myContext.sendSignalAs("await", "whatIsLife", "me"); // [0]
const lifeIsNow = await myContext.sendSignalAs(["delay", "await", "first"], "whatIsLife", "me"); // 0
//
// <-- Using "pre-delay" ties to context's refresh cycle, while "delay" ties to once all related contextAPIs have refreshed.

```

---

### ContextAPIs

- `ContextAPI` provides hooking communication with multiple _named_ `Context`s.
- When a ContextAPI is hooked up to a context, it can use its data and signalling services.
    * In this sense, ContextAPI provides an easy to use and stable reference to potentially changing set of contexts.
- Importantly the ContextAPIs also have `afterRefresh` method that returns a promise, which affects the "delay" cycle of Context refreshing.
    * By default the method resolves the promise instantly, but can be overridden to tie the syncing to other systems.
    * The "delay" cycle is resolved only once all the ContextAPIs connected to the refreshing context have resolved their `afterRefresh`.

```typescript

```

---
