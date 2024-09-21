
## WHAT

`data-signals` is a light weight library containing a few simple but carefully designed JS/TS classes, mixins and tools for managing complex state and action flow in sync.

The classes and methods are fully typed and commented and accordingly provide inlined documentation.

The library runs on server and browser, and only dependent on the tiny ["mixin-types"](https://www.npmjs.com/package/mixin-types) npm module (for typing).

The npm package can be found with: [data-signals](https://www.npmjs.com/package/data-signals). Contribute in GitHub: [koodikulma-fi/data-signals.git](https://github.com/koodikulma-fi/data-signals.git)

---

## CONTENTS

There are 3 kinds of tools available.

### [1. BASE CLASSES / MIXINS](#1-base-classes--mixins-doc)

A couple of classes and mixins for signalling and data listening features.
- `SignalBoy` provides a simple service to attach listener callbacks to signals and then emit signals from the class.
- `SignalMan` extends `SignalBoy` to provide signal sending with various getter and syncing related options.
- `DataBoy` provides data listening services, but without actually having any data.
- `DataMan` extends `DataBoy` to provide the actual data hosting and related methods.

Note. The mixins simply allow to extend an existing class with the mixin features - the result is a new class.


### [2. CONTEXT CLASSES](#2-context-classes-doc)

Two classes specialized for complex data sharing situations, like those in modern web apps.
- `RefreshCycle` extends `SignalBoy` to provide a helper for performing refresh cycles (used by `Context`).
- `Context` extends `SignalMan` and `DataMan` (mixins) to create a synced data and action sharing environment. 
- `ContextAPI` extends `SignalMan` and `DataBoy` (mixins) to manage named `Context`s (and affect their syncing).


### [3. STATIC LIBRARY METHODS](#3-static-library-methods-doc)

A couple of data reusing concepts in the form of library methods.
- Simple `areEqual(a, b, level?)` and `deepCopy(anything, level?)` methods with custom level of depth (-1).
    * The methods support native JS Objects, Arrays, Maps, Sets and handling classes.
- Data selector features:
    * `createDataTrigger` triggers a callback when reference data is changed from previous time.
    * `createDataMemo` recomputes / reuses data based on arguments: if changed, calls the producer callback.
    * `createDataSource` is like createDataMemo but with an extraction process before the producer callback.
    * `createCachedSource` is like createDataSource but creates a new data source for each cacheKey.


### [+ HOW TO USE MIXINS](#-how-to-use-mixins-doc)

Provides a quick guide to using mixins. For a comprehensive guide, see ["mixin-types" README](https://www.npmjs.com/package/mixin-types).

---

## 1. BASE CLASSES / MIXINS (doc)

### SignalBoy

- `SignalBoy` provides signalling features, from simple instant void signals to complex synced awaiting getters.
- The extending classes may also define an optional static methods:
    * `onListener?(signalBoy: SignalBoy<Signals>, name: string & keyof Signals, index: number, wasAdded: boolean): void`
        - To keep track of added / removed listeners. Called right after adding and right before removing.
    * `getListenersFor?(signalBoy: SignalBoy<Signals>, signalName: string & keyof Signals): SignalListener[] | undefined`
        - To get the listeners for the given signal. If not present, uses signalBoy.signals[name] instead.

```typescript

// Prepare signal typing.
type Signals = { doIt: (what: number) => void; };

// Create a SignalBoy instance.
const signalBoy = new SignalBoy<Signals>();

// Listen to signals.
signalBoy.listenTo("doIt", (what) => { console.log(what); });

// Send a signal.
signalBoy.sendSignal("doIt", 5);

```

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

// Send a simple signal.
signalMan.sendSignal("doIt", 5);

// Send a more complex signal.
const livesAre = await signalMan.sendSignalAs("await", "whatIsLife", "me"); // number[]
const lifeIsAfterAll = await signalMan.sendSignalAs(["await", "first"], "whatIsLife", "me"); // number | undefined

```

### DataBoy

- `DataBoy` simply provides data listening basis without having any data.
    * The class should always be extended by another class to actually hook up to the data.
    * The extending class should also implement the methods for `setInData` nor `getInData`.
- The extending classes may also define a static method `callDataListenersFor?(dataBoy, dataKeys): boolean`.
    * If the method is not defined, or returns `true`, performs the default flow using `callDataBy(dataKeys)`.

```typescript

// Note. Just a demo - extending class should implement the actual data connection.

// Create a DataBoy instance.
type MyData = { something: { deep: boolean; }, simple: string; };
const dataBoy = new DataBoy<MyData>();

// Listen to data.
dataBoy.listenToData("something.deep", "simple", (deep, simple) => { console.log(deep, simple); });
dataBoy.listenToData("something.deep", (deepOrFallback) => { }, [false]); // If "something.deep" would be undefined, use `false`.
dataBoy.listenToData({ "something.deep": 0 as const, "simple": false }, (values) => {
    values["something.deep"]; // boolean | 0
    values["simple"]; // string | boolean
});

// Trigger changes.
// .. At DataBoy level, the data is refreshed instantly and optional timeouts are resolved separately.
dataBoy.refreshData("something.deep"); // Trigger a refresh manually.
dataBoy.refreshData(["something.deep", "simple"], 5); // Trigger a refresh after 5ms timeout.

// Get/set by nested data key.
dataBoy.getInData("something.deep"); // The type is boolean, as MyData defines it as boolean.
dataBoy.setInData("something.deep", false);

```

### DataMan

- `DataMan` extends `DataBoy` to complete the concept with `data` member and data set get methods.
    * Note that when nested data is set (with setInData), all the parenting data dictionaries are shallow copied.

```typescript

// Create a DataMan instance.
const initialData = { something: { deep: true }, simple: "yes" };
const dataMan = new DataMan(initialData);

// Get data.
dataMan.getData(); // { something: { deep: true }, simple: "yes" }
dataMan.getInData("something.deep"); // true

// Listen to data.
dataMan.listenToData("something.deep", "simple", (deep, simple) => { console.log(deep, simple); });
dataMan.listenToData("something.deep", (deepOrFallback) => { }, [false]); // If "something.deep" would be undefined, use `false`.
dataMan.listenToData({ "something.deep": 0 as const, "simple": false }, (values) => {
    values["something.deep"]; // boolean | 0
    values["simple"]; // string | boolean
});

// Trigger changes.
// .. At DataMan level, the data is refreshed instantly and optional timeouts are resolved separately.
// .. Note. The Contexts level has 0ms timeout by default and the refreshes are triggered all in sync.
dataMan.setData({ simple: "no" });
dataMan.setInData("something.deep", false); // Automatically shallow copies the parenting "something" and root data object.
dataMan.refreshData("something.deep"); // Trigger a refresh manually.
dataMan.refreshData(["something.deep", "simple"], 5); // Trigger a refresh after 5ms timeout.

```

---

## 2. CONTEXT CLASSES (doc)

### Context

- `Context` extends `SignalDataMan` and provides synced data refreshes and signalling.
- The data refreshes are triggered simultaneously after a common timeout (vs. separately at DataMan level), and default to 0ms timeout.
- The signalling part is synced to the refresh cycle using "pre-delay" and "delay" options.
    * The "pre-delay" is tied to context's refresh cycle set by the `{ refreshTimeout: number | null; }` setting.
    * The "delay" happens after all the connected `ContextAPI`s have resolved their `awaitDelay` promise.
    * Note that "pre-delay" signals are called right before data listeners, while "delay" always after them.
- The `Context` class also provides extendable methods on the static side (to keep public instance API clean):
    * `getDefaultSettings<Settings extends ContextSettings = ContextSettings>(): Settings`
        - Extendable static default settings getter.
    * `initializeCyclesFor(context: Context): void`
        - Extendable static helper to hook up context refresh cycles together.
    * `runPreDelayFor(context: Context): void`
        - Extendable static helper to run "pre-delay" cycle.
    * `runDelayFor(context: Context): void`
        - Extendable static helper to run "delay" cycle.
        - By default there's nothing to run at "delay": promises are resolved automatically.

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
myContext.refreshData("something.deep"); // Trigger a refresh manually.
myContext.refreshData(["something.deep", "simple"], 5); // Add keys and force the next cycle to be triggered after 5ms timeout.
myContext.refreshData(true, null); // Just refresh everything, and do it now (with `null` as the timeout).

// Send a signal.
myContext.sendSignal("doIt", 5);

// Send a more complex signal.
const livesAre = await myContext.sendSignalAs("await", "whatIsLife", "me"); // number[]
const lifeIsAfterAll = await myContext.sendSignalAs(["delay", "await", "first"], "whatIsLife", "me"); // number | undefined
//
// <-- Using "pre-delay" ties to context's refresh cycle, while "delay" ties to once all related contextAPIs have refreshed.

```

### ContextAPI

- `ContextAPI` provides communication with multiple _named_ `Context`s.
- When a ContextAPI is hooked up to a context, it can use its data and signalling services.
    * In this sense, ContextAPI provides a stable reference to potentially changing set of contexts.
- The ContextAPI's `awaitDelay` method affects the "delay" refresh cycle of Contexts (by the returned promise).
    * The default implementation resolves the promise instantly, but can be overridden (for external syncing).
    * The Context's "delay" cycle is resolved once all the connected ContextAPIs have been awaited.
    * I's fine to override the method externally: `myContextAPI.awaitDelay = async () => await someProcess()`.

```typescript

// Typing for multiple contexts.
type CtxSettingsData = { something: { deep: boolean; }; simple: string; };
type CtxUserData = { info: { name: string; avatar: string; } | null; };
type CtxUserSignals = {
    loggedIn: (userInfo: { name: string; avatar: string; }) => void;
    whatIsLife: (whoAsks: string) => Promise<number>;
};
type AllContexts = {
    settings: Context<CtxSettingsData>;
    user: Context<CtxUserData, CtxUserSignals>;
};

// Or, say we have created them.
const allContexts: AllContexts = {
    settings: new Context<CtxSettingsData>({ something: { deep: true }, simple: "yes" }),
    user: new Context<CtxUserData, CtxUserSignals>({ info: null })
};

// Create a stand alone contextAPI instance.
const cApi = new ContextAPI(allContexts);
// const cApi = new ContextAPI<AllContexts>(); // Without initial contexts, but typing yes.

// Set and get contexts later on.
cApi.setContexts(allContexts);
cApi.setContext("settings", allContexts.settings);
cApi.getContexts(); // AllContexts
cApi.getContext("user"); // Context<CtxUserData, CtxUserSignals> | undefined

// Get data.
cApi.getInData("settings"); // CtxSettingsData | undefined
cApi.getInData("settings.something.deep"); // boolean | undefined
cApi.getInData("settings.something.deep", false); // boolean

// Listen to signals.
cApi.listenTo("user.loggedIn", (userInfo) => { console.log(userInfo); }); // logs: { name, avatar }
cApi.listenTo("user.whatIsLife", (whoAsks) => new Promise(res => res(whoAsks === "me" ? 0 : -1)));

// Listen to data.
// .. As contexts might come and go, the type has `| undefined` fallback.
cApi.listenToData("settings.something.deep", "settings.simple", (deep, simple) => { console.log(deep, simple); });
// .. To use custom, provide custom fallback.
cApi.listenToData("settings.something.deep", (deep) => { }, [false]); // boolean
cApi.listenToData("settings.something.deep", (deep) => { }, ["someFallback" as const]); // boolean | "someFallback"
cApi.listenToData("settings.something", "settings.simple", (something, simple) => { }, [{ deep: 1 }, ""] as const);
cApi.listenToData({ "settings.something.deep": 0 as const, "settings.simple": "" }, (values) => {
    values["settings.something.deep"]; // boolean | 0
    values["settings.simple"]; // string
});

// Trigger changes.
// .. At Contexts level data refreshing uses 0ms timeout by default, and refreshes are always triggered all in sync.
cApi.setInData("settings", { simple: "no" }); // Extends already by default, so "something" won't disappear.
cApi.setInData("settings", { simple: "no" }, false); // This would make "something" disappear, but typing prevents it.
cApi.setInData("settings.something.deep", false);  // Even if "something" was lost, this would re-create the path to "something.deep".
cApi.refreshData("settings.something.deep"); // Trigger a refresh manually.
cApi.refreshData(["settings.something.deep", "user.info"], 5); // Add keys and force the next cycle to be triggered after 5ms timeout.
cApi.refreshData(["settings", "user"], null); // Just refresh both contexts fully, and do it instantly (with `null` as the timeout).

// Override the awaitDelay timer - it will affect when "delay" signals are resolved for all connected contexts.
cApi.awaitDelay = () => new Promise((resolve, reject) => { window.setTimeout(resolve, 500); }); // Just to showcase.
cApi.awaitDelay = async () => await someExternalProcess();

// Send a signal.
cApi.sendSignal("user.loggedIn", { name: "Guest", avatar: "" });

// Send a more complex signal.
const livesAre = await cApi.sendSignalAs("await", "user.whatIsLife", "me"); // number[]
const lifeIsAfterAll = await cApi.sendSignalAs(["delay", "await", "first"], "user.whatIsLife", "me"); // number | undefined
//
// <-- Using "pre-delay" is synced to context's refresh cycle, while "delay" to once all related contextAPIs have refreshed.

// Use static methods.
ContextAPI.parseContextDataKey("settings.something.deep"); // ["settings", "something.deep"];
ContextAPI.parseContextDataKey("settings"); // ["settings", ""];
ContextAPI.readContextNamesFrom(["settings", "settings.simple", "user.loggedIn", ""]); // ["settings", "user"];
ContextAPI.readContextDictionaryFrom(["settings.something.deep", "settings.simple", "user"]);
// { settings: ["something.deep", "simple"], user: true }

```

As a use case example of `ContextAPI`:
- Consider a situation in a state based rendering app:
    - You first set some data in context to trigger rendering ("pre-delay").
    - But want to send a signal only once the whole rendering is completed ("delay"), so that the component using the signal has been mounted first.
- To solve it:
    * The rendering hosts can use a connected contextAPI and override its `awaitDelay` method to await until rendering cycle completed. Essentially, "delay" is then completed when the last promise is completed.
    * Optionally, the components can also have a contextAPI, but their `awaitDelay` just directly returns the promise from the host. Or just directly the promise of a `RefreshCycle`.

### RefreshCycle

- `RefreshCycles` extends `SignalBoy` and serves as a helper class to manage refresh cycles.
- For example, `Context` class uses two RefreshCycles, one for `"pre-delay"` and another for `"delay"` cycle.
    * Furthermore, `Context` has hooked up them up so that "pre-delay" is always triggered with "delay", and always resolved before "delay". Below is a similar example.

```typescript

// - Prepare - //

// Typing.
interface MainCyclePendingInfo {
    sources: Set<Object>;
    infos: { name: string; }[];
}

// Prepare cycles.
const preCycle = new RefreshCycle();
const mainCycle = new RefreshCycle<MainCyclePendingInfo>(() => ({ sources: new Set(), infos: [] }));

// Prepare timeouts.
const preTimeout: number | null | undefined = 0;
const awaitMain = (): Promise<void> => Promise.resolve();

// Helper - as if a public API method.
const refreshCycles = () => preCycle.trigger(preTimeout);

// Hook up.
// .. Do the actual "pre" and "main" update parts.
preCycle.listenTo("onRefresh", (_pending, resolvePromise) => {
    // Nothing to do. The resolvePromise will be automatically resolved synchronously right after.
});
mainCycle.listenTo("onRefresh", (pending, resolvePromise) => {
    // Let's resolve the promise before our things.
    // .. Effectively all that were awaiting for it, will be resolved now.
    resolvePromise();
    // Run the "main" update - using pending info from updates.
    // .. Would do something here with the pending info.
    pending.sources; // Set<Object> | undefined;
    pending.infos; // { name: string; }[] | undefined;
});

// Make sure to start "pre" when "main" is started. We use the finishing part of "pre" to correctly run "main".
mainCycle.listenTo("onStart", () => preCycle.trigger(preTimeout));

// Make sure "pre" is always resolved right before "main".
mainCycle.listenTo("onResolve", () => preCycle.resolve());

// Make sure "main" is run when "pre" finishes, and the "main"-related awaitMain is awaited only then.
preCycle.listenTo("onFinish", () => {
    // Start main cycle if was idle. (If was already started, nothing changed.)
    mainCycle.trigger(); // As there's no timeout, will be "waiting" until resolved manually.
    // Resolve the "main" cycle - unless was already "resolving" (or had already become "").
    if (mainCycle.state === "waiting")
        awaitMain().then(() => mainCycle.resolve());
});


// - Use -  //

// Do an update.
const a = {};
mainCycle.pending.sources.add(a);
refreshCycles(); // Use our helper to handle default timing.

// Do another.
preCycle.promise.then(() => console.log("Pre done!"));
mainCycle.promise.then(() => console.log("Main done!"));
mainCycle.pending.infos.push({ name: "test" }, { name: "again" });
refreshCycles(); // Use our helper to handle default timing.

// One more.
const b = {};
mainCycle.pending.sources.add(b);
mainCycle.pending.sources.add(a);

// Test.
// .. Because we used 0 timeout for pre all above are part of same update.
// .. Because mainCycle is resolved only after preCycle (and has no internal timer), it's not resolved yet.
mainCycle.pending; // Has `{ sources: new Set([a, b]), infos: [{ name: "test" }, { name: "again" }] }`

// Extend timeout.
preCycle.extend(5); // null would resolve instantly, undefined just clear timer.

// Or decide to resolve immediately.
preCycle.resolve(); // Console logs: "Pre done!", and then "Main done!".

// Because the main cycle is set up to resolve instantly (after pre), by this time all are done.
mainCycle.pending; // Will just have have empty "sources" set and "infos" array.


```

---

## 3. STATIC LIBRARY METHODS (doc)

- The `areEqual(a, b, depth?)` and `deepCopy(anything, depth?)` compare or copy data to a level of depth.
- Memos, triggers and data sources are especially useful in state based refreshing systems that compare previous and next state to determine refreshing needs. The basic concept is to feed argument(s) to a function, who performs a comparison on them to determine whether to trigger change (= a custom callback).

### library: areEqual

- The `areEqual(a, b, depth?)` compares data with custom level of depth.
- If depth is under 0, checks deeply. Defaults to -1.

```typescript

// Basic usage.
const test = { test: true };
areEqual(true, test); // false, clearly not equal.
areEqual(test, { test: true }); // true, contents are equal when deeply check.
areEqual(test, { test: true }, 1); // true, contents are equal when shallow checked.
areEqual(test, { test: true }, 0); // false, not identical objects.
areEqual(test, test, 0); // true, identical objects.

```

### library: deepCopy

- The `deepCopy(anything, depth?)` copies the data with custom level of depth.
- If depth is under 0, copies deeply. Defaults to -1.

```typescript

// Prepare.
const original = { something: { deep: true }, simple: "yes" };
let copy: typeof original;
// Basic usage.
copy = deepCopy(original); // Copied deeply.
copy = deepCopy(original, 1); // Copied one level, so original.something === copy.something.
copy = deepCopy(original, 0); // Did not copy, so original === copy.

```

### library: createDataMemo

- `createDataMemo` helps to reuse data in simple local usages. By default, it only computes the data if any of the arguments have changed.

```typescript

// Create a function that can be called to return updated data if arguments changed.
const myMemo = createDataMemo(
    // 1st arg is the producer callback that should return the desired data.
    // .. It's only triggered when either (a, b) is changed from last time.
    (a, b) => {
        // Do something with the args.
        return a.score > b.score ? { winner: a.name, loser: b.name } :
            a.score < b.score ? { winner: b.name, loser: a.name } : 
            { winner: null, loser: null };
    },
    // 2nd arg is optional and defines the _level of comparison_ referring to each argument.
    // .. For DataMemo it defaults to 0, meaning identity comparison on each argument: oldArg[i] !== newArg[i].
    // .. To do a deep comparison set to -1. Setting of 1 means shallow comparison (on each arg), and from there up.
    0,
);

// Use the memo.
const { winner, loser } = myMemo({ score: 3, name: "alpha"}, { score: 5, name: "beta" }); // { winner: "beta", loser: "alpha" }

```

### library: createDataTrigger

- `createDataTrigger` is similar to DataMemo, but its purpose is to trigger a callback on mount.
- In addition, the mount callback can return another callback for unmounting, which is called if the mount callback gets overridden upon usage (= when memory changed and a new callback was provided).

```typescript

// Create a function that can be called to trigger a callback when the reference data is changed from the last time
type Memory = { id: number; text: string; };
const myTrigger = createDataTrigger<Memory>(
    // 1st arg is an optional (but often used) _mount_ callback.
    (newMem, oldMem) => {
        // Run upon change.
        if (newMem.id !== oldMem.id)
            console.log("Id changed!");
        // Optionally return a callback to do _unmounting_.
        return (currentMem, nextMem) => { console.log("Unmounted!"); }
    },
    // 2nd arg is optional initial memory.
    // .. Use it to delay the first triggering of the mount callback (in case the same on first usages).
    { id: 1, text: "init" },
    // 3rd arg is optional depth, defaults to 1, meaning performs shallow comparison on the memory.
    1
);

// Use the trigger.
let didChange = myTrigger({ id: 1, text: "init" }); // false, new memory and init memory have equal contents.
didChange = myTrigger({ id: 1, text: "thing" }); // true
didChange = myTrigger({ id: 2, text: "thing" }); // true, logs: "Id changed!"
didChange = myTrigger({ id: 2, text: "thing" }, true); // true

// Change callback.
const newCallback = () => { console.log("Changes!"); };
didChange = myTrigger({ id: 2, text: "thing" }, false, newCallback); // false
didChange = myTrigger({ id: 3, text: "thing" }, false, newCallback); // true, logs: "Unmounted!" and then "Changes!".
didChange = myTrigger({ id: 3, text: "now?" }); // true, logs: "Changes!"

```

### library: createDataSource

- `createDataSource` returns a function for reusing/recomputing data.
- The function receives custom arguments and uses an extractor to produce final arguments for the producer.
- The producer is triggered if the args count or any arg has changed: `newArgs.some((v, i) !== oldArgs[i])`.
- The level of comparison can be customized by the optional 3rd argument. Defaults to 0: if any arg not identical.

```typescript

// Prepare.
type MyParams = [ colorTheme: { mode?: "light" | "dark" }, specialMode?: boolean];
type MyData = { theme: "dark" | "light"; special: boolean; }

// With pre-typing.
const mySource = (createDataSource as CreateDataSource<MyParams, MyData>)(
    // Extractor - showcases the usage for contexts.
    // .. For example, if has many usages with similar context data needs.
    (colorTheme, specialMode) => [
        colorTheme?.mode || "dark",
        specialMode || false,
    ],
    // Producer - it's only called if the extracted data items were changed from last time.
    (theme, special) => ({ theme, special }),
    // Optional depth of comparing each argument.
    // .. Defaults to 0: if any arg (or arg count) is changed, triggers the producer.
    0
);

// With manual typing.
const mySource_MANUAL = createDataSource(
    // Extractor.
    (...[colorTheme, specialMode]: MyParams) => [
        colorTheme?.mode || "dark",
        specialMode || false,
    ],
    // Producer.
    (theme, special): MyData => ({ theme, special }),
    // Optional depth of comparing each argument.
    0
);

// Test.
const val = mySource({ mode: "dark" }, true);
const val_FAIL = mySource({ mode: "FAIL" }, true); // The "FAIL" is red-underlined.
const val_MANUAL = mySource_MANUAL({ mode: "dark" }, true);
const val_MANUAL_FAIL = mySource_MANUAL({ mode: "FAIL" }, true); // The "FAIL" is red-underlined.

```

### library: createCachedSource

- `createCachedSource` is like multiple `createDataSource`s together separated by the unique cache key.
- The key key for caching is derived from an extra "cacher" function dedicated to this purpose - it should return the cache key (string).
- The cacher receives the same args as the extractor, but also the cached dictionary as an extra arg `(...args, cached) => string`.

```typescript

// Let' use the same MyData as above, but add cacheKey to args.
type MyCachedParams = [
    colorTheme: { mode?: "light" | "dark" },
    specialMode: boolean | undefined,
    cacheKey: string
];

// With pre-typing.
const mySource = (createDataSource as CreateCachedSource<MyCachedParams, MyData>)(
    // Extractor.
    (colorTheme, specialMode) => [colorTheme?.mode || "dark", specialMode || false],
    // Producer.
    (theme, special) => ({ theme, special }),
    // Cache key generator.
    (_theme, _special, cacheKey) => cacheKey,
    // Optional depth.
    0
);

// With manual typing.
const mySource_MANUAL = createCachedDataSource(
    // Extractor.
    (...[colorTheme, specialMode]: MyCachedParams) => [colorTheme?.mode || "dark", specialMode || false],
    // Producer.
    (theme, special): MyData => ({ theme, special }),
    // Cache key generator.
    (_theme, _special, cacheKey) => cacheKey,
    // Optional depth.
    0
);

// Test. Let's say state1 and state2 variants come from somewhere.
let val1 = mySource(state1a, state1b, "someKey"); // In one place.
let val2 = mySource(state2a, state2b, "anotherKey"); // In another place with similar data.
// We can do it again, and the producers won't be retriggered (unlike without caching).
val1 = mySource(state1a, state1b, "someKey");
val2 = mySource(state2a, state2b, "anotherKey");

```

---

## + HOW TO USE MIXINS (doc)

### Intro

- Often you can just go and extend the class directly. But where you can't, mixins can make things very convenient.
- For thorough examples and guidelines, see the ["mixin-types" README](https://www.npmjs.com/package/mixin-types).
- Note that some funcs (`mixinsWith`) and types (`AsClass`, `AsInstance`, `AsMixin`, `ClassType`) below are imported from "mixin-types". (The module is used by `data-signals` internally.)

### Basic usage

```typescript

// Imports.
import { AsMixin } from "mixin-types";
import { SignalMan, mixinSignalMan } from "./mixins/SignalMan";

// Let's define some custom class.
class CustomBase {
    something: string = "";
    hasSomething(): boolean {
        return !!this.something;
    }
}

// Let's mix in typed SignalMan features.
type MySignals = { doSomething: (...things: number[]) => void; };
class CustomSignalMix extends mixinSignalMan<MySignals, typeof CustomBase>(CustomBase) { }
class CustomSignalMix_alt extends (mixinSignalMan as AsMixin<SignalMan<MySignals>>)(CustomBase) { }

// Create like any class.
const cMix = new CustomSignalMix();

// Use.
cMix.something = "yes";
cMix.hasSomething(); // true
cMix.listenTo("doSomething", (...things) => { });

```

### Constructor arguments

- You can also use constructor arguments.
- If the mixin uses args, it uses the first arg(s) and pass the rest further as `(...passArgs)`.

```typescript

// Imports.
import { AsMixin } from "mixin-types";
import { DataManType, mixinDataMan } from "data-signals";

// Let's define a custom class with constructor args.
class CustomBase {
    someMember: boolean;
    constructor(someMember: boolean) {
        this.someMember = someMember;
    }
}

// Let's mix in typed DataMan features.
interface MyData { something: { deep: boolean; }; simple: string; }
class CustomDataMix extends (mixinDataMan as AsMixin<DataMan<MyData>>)(CustomBase) {
    // Define explicitly what the final class constructor args.
    constructor(data: MyData, someMember: boolean) {
        super(data, someMember);
    }
}
// Or define them using AsMixin's 2nd arg.
class CustomDataMix_alt extends
    (mixinDataMan as AsMixin<DataMan<MyData>, [data: MyData, someMember: boolean]>)(CustomBase) { }

// Create like any class.
const cMix = new CustomDataMix({ something: { deep: true }, simple: "" }, false);

// Use.
cMix.listenToData("something.deep", "simple", (deep, simple) => { });
cMix.someMember; // boolean (as type), false (as JS value)


```

### Sequence of mixins

- You can of course mix many mixins together into a sequence, one after the other.

```typescript

// Imports.
import { mixinsWith, AsMixin } from "mixin-types";
import { mixinDataMan, mixinSignalMan, DataMan, SignalMan } from "data-signals";

// Base and types from above.
class CustomBase {
    someMember: boolean;
    constructor(someMember: boolean) {
        this.someMember = someMember;
    }
}
interface MyData { something: { deep: boolean; }; simple: string; }
type MySignals = { test: (num: number) => void; };

// Mix DataMan and SignalMan upon CustomBase.
// .. Use `mixinsWith` (or `mixins` without base) method from "mixin-types" module for complex cases.
// .. It ensures typing for the whole chain, and validates mixin requirements based on the accumulated sequence.
class MyMultiMix extends mixinsWith(CustomBase, mixinSignalMan<MySignals>, mixinDataMan<MyData>) {
    // Define args explicitly - knowing DataMan takes 1 arg, SignalMan 0, and CustomBase 1.
    constructor(data: MyData, someMember: boolean) {
        super(data, someMember);
    }
}
// This line below will not take into account the whole chain: CustomBase and SignalMan gets lost.
class MyMultiMix_Incorrect extends mixinDataMan<MyData>(mixinSignalMan<MySignals>(CustomBase)) {}
// To do it all manually with constr. args, should use AsMixin (though the chain won't be evaluated for dependencies.)
class MyMultiMix_Manually extends
    (mixinDataMan as AsMixin<DataMan<MyData>, [data: MyData, someMember: boolean]>)( // Define constr. args here.
        (mixinSignalMan as AsMixin<SignalMan<MySignals>>)(CustomBase)) {}

// Test.
const myMultiMix = new MyMultiMix({ something: { deep: true }, simple: "" }, false);
myMultiMix.listenToData("something.deep", (deep) => {});
myMultiMix.someMember = true;
myMultiMix.sendSignal("test", 5);

// Test manual.
const myMultiMix_Manually = new MyMultiMix_Manually({ something: { deep: true }, simple: "" }, false);
myMultiMix_Manually.listenToData("something.deep", (deep) => {});
myMultiMix_Manually.someMember = true;
myMultiMix_Manually.sendSignal("test", 5);

// Test incorrect.
const myMultiMix_Incorrect = new MyMultiMix_Incorrect({ something: { deep: true }, simple: "" }, "any"); // Only 1st arg typed.
myMultiMix_Incorrect.listenToData("something.deep", (deep) => {}); // The only line that works.
myMultiMix_Incorrect.someMember = true; // someMember is red-undlined, not found.
myMultiMix_Incorrect.sendSignal("test", 5); // sendSignal is red-undlined, not found.

```

### Generic params on the extending class

- You can also use generic params on the extending class, but have to type things carefully.

```typescript

// Imports.
import { ClassType, AsClass, AsInstance } from "mixin-types";
import { SignalsRecord, mixinSignalMan, SignalMan, SignalManType, DataMan, mixinDataMan, DataManType } from "data-signals";

// Mix DataMan and SignalMan upon CustomBase with generic + own args.
class CustomBase {
    someMember: boolean;
    constructor(someMember?: boolean) {
        this.someMember = someMember || false;
    }
}
interface CustomBase {
    someMember: boolean;
}

// Custom type.
type MegaMixSignals = { mySignal: (num: number) => void; };

// Define class using `as any as ClassType` for the mixins.
class MegaMix<
    Data extends Record<string, any> = {},
    AddSignals extends SignalsRecord = {},
> extends (mixinDataMan(mixinSignalMan(CustomBase)) as any as ClassType) {
    
    // Define args explicitly for external use.
    constructor(data: Data, someMember?: boolean, ...args: any[]) {
        super(data, someMember, ...args);
    }

    // Add some method.
    public setSomeMember(value: boolean): void {
        // This line starts to work once the interface is in place.
        this.someMember = value;
        // To use own signals within the class, drop generics first.
        // .. We can do this `this as MegaMix` - or `this as any as MegaMix` for some cases.
        (this as MegaMix).sendSignal("mySignal", value ? 1 : 0);
    }
}

// Define matching interface using multiple typed extends. No need to retype what class adds.
interface MegaMix<
    Data extends Record<string, any> = {},
    AddSignals extends SignalsRecord = {},
> extends AsInstance<
    DataMan<Data> & SignalMan<MegaMixSignals & AddSignals> & CustomBase, // Instance.
    MegaMixType<Data, AddSignals>, // Static.
    // [data: Data, someMember?: boolean] // Constructor args, though typescript won't read them from the interface.
> { }
// Alternatively can use multiple extends as below.
// > extends DataMan<Data>, SignalMan<MegaMixSignals & AddSignals>, CustomBase {
//     // Define constructor: so it works nicely for `.constructor` usage.
//     ["constructor"]: MegaMixType<Data, AddSignals>;
// }

// Optionally define the class type. We actually use it above.
interface MegaMixType<Data extends Record<string, any> = {}, AddSignals extends SignalsRecord = {}> extends AsClass<
    DataManType<Data> & SignalManType<MegaMixSignals & AddSignals>, // Static.
    MegaMix<Data, MegaMixSignals & AddSignals>, // Instance.
    [data: Data, someMember?: boolean] // Constructor args.
> {}

// Test.
type MySignals = { test: (enabled: boolean) => void; };
type MyData = { test: boolean; };
const megaMix = new MegaMix<MyData, MySignals>({ test: false }, false);
megaMix.setSomeMember(true);
megaMix.sendSignal("mySignal", 5);
megaMix.sendSignal("test", false);

// The constructor and its typing works, too - if defined (as we have above).
const megaMix2 = new megaMix.constructor({ test: true }, true);
megaMix.constructor.callDataListenersFor; // Recognized.
megaMix2.constructor.onListener; // Recognized.

```

---

[Back to top](#what)
