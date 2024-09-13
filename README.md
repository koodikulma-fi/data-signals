## DataSignals

DataSignals (or `data-signals`) is a library containing a few simple but carefully designed JS/TS classes, mixins and tools to help manage complex state and action flow in sync.

## NPM

The npm package can be found with: [data-signals](https://www.npmjs.com/package/data-signals)

## GitHub

Contribute in GitHub: [koodikulma-fi/data-signals.git](https://github.com/koodikulma-fi/data-signals.git)

## Documentation

---

### 3 main layers

#### 1. LIBRARY METHODS
A couple of library methods useful for reusing data.
- `DataTrigger` allows to trigger a callback when reference data is changed from last time - supporting various levels of comparison.
- `DataMemo` allows to recompute / reuse data based on arguments: when args change (according to comparison level), calls the producer callback to return new data.
- `DataPicker` is like DataMemo but with an extraction process in between, and always uses shallow comparison (of prev/next args) to trigger the producer callback.
- `DataSelector` functions exactly like DataSelector but uses multiple extractors: `(extractor1, extractor2, ..., producerCallback)`.

#### 2. MIXINS / CLASSES
A couple of mixins (+ stand alone class) for signalling and data listening features.
- `SignalMan` provides a service to attach listener callbacks to signals and then emit signals from the class - optionally supporting various data or sync related options.
- `DataBoy` provides data listening services, but without actually having any data.
- `DataMan` extends `DataBoy` to provide the actual data hosting and related methods.
- `SignalDataBoy` extends both `SignalMan` and `DataBoy`.
- `SignalDataMan` extends both `SignalMan` and `DataMan`.
- Note. The mixins simply allow to extend an existing class with the mixin features - the result is a new custom made class.

#### 3. CLASSES
Finally, two classes specialized for complex data sharing situations, like those in modern web apps.
- `Context` extends `SignalDataMan` with syncing related settings. The contexts can also sync to the `ContextAPI`s that are listening to them.
- `ContextAPI` extends `SignalDataBoy` and accordingly allows to listen to data and signals in various named contexts.
- The contextAPIs can also affect the syncing of `Context` refreshes - this is especially useful with the "delay" type of signals.
    * For example, consider a state based rendering app, where you first set some data in context to trigger rendering ("pre-delay"), but want to send a signal only once the whole rendering is completed ("delay").
    * The rendering hosts can simply use a connected contextAPI and override its `afterRefresh` method to await until rendering completed, making the "delay" be triggered only once the last of them completed.

---

### Basics

---

### Selectors
There are 4 data reusing helpers available:
- `createDataTrigger` creates a function that can be called to trigger a callback when the reference data is changed from the last time.
    * First create a trigger: `const myTrigger = createDataTrigger((newMem, oldMem) => { ...do something... }))`.
    * Then later on use it: `const didChange = myTrigger(newData)`.
- `createDataMemo` is similar but when used returns the data.
    * First create a memo: `const orderMemo = createDataMemo((a, b) => a < b ? [a, b] : [b, a])`.
    * Then later on use it: `const [smaller, greater] = orderMemo(a, b)`.
- `createDataPicker` is similar to memo, but uses an extractor func to produce the arguments for (comparison and) the producer callback.
    * Create: `const myPicker = createDataPicker((state1, state2) => [state1.a, state1.b, state2.c, state2.d], (a, b, c, d) => { return something; } )`.
    * Use: `const myData = myPicker(state1, state2)`. Typically the state(s) would come from the data of `Context`s (see below).
- `createDataSelector` functions exactly like DataSelector but uses multiple extractors.
    * The first args are extractors, the last executor: `const mySelector = createDataSelector((state1, state2) => state1.a, (state1, state2) => state2.b, (a, b) => a < b ? [a, b] : [b, a])`.
    * Used like data picker: `const myData = mySelector(state1, state2)`.

---

### Contexts

---

### ContextAPIs

---

## More examples

```

// - - Extra tests - - //


// - Testing: DataSelector - //

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


// - Testing: DataPicker - //

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
