/// <reference types="node" />
/** Awaits the value from a promise. */
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
/** Type for holding keys as a dictionary, array or set. */
type RecordableType<K extends string> = Partial<Record<K, any>> | Array<K> | Set<K>;
/** Get the type for class constructor arguments. */
type GetConstructorArgs<T> = T extends new (...args: infer U) => any ? U : never;
/** Get the type for class constructor return. */
type GetConstructorReturn<T> = T extends new (...args: any[]) => infer U ? U : never;
/** Get the type for class from class instance - the opposite of `InstanceType`. Optionally define constructor args. */
type ClassType<T = {}, Args extends any[] = any[]> = new (...args: Args) => T;
/** Typing to extend mixins.
 * @param TExtends Should refer to the class type of the mixin.
 * @returns The returned type is a mixin creator, essentially: `(Base: TBase) => TBase & TExtends`.
 */
type ClassMixer<TExtends extends ClassType> = <TBase extends ClassType>(Base: TBase) => Omit<TBase & TExtends, "new"> & {
    new (...args: GetConstructorArgs<TExtends>): GetConstructorReturn<TBase> & GetConstructorReturn<TExtends>;
};
/** Get deep value type using a dotted data key, eg. `somewhere.deep.in.data`. If puts Unknown (3rd arg) to `never`, then triggers error with incorrect path. */
type PropType<T extends Record<string, any> | undefined, Path extends string, Unknown = unknown, IsPartial extends boolean | never = false> = string extends Path ? Unknown : Path extends keyof T ? true extends IsPartial ? T[Path] | undefined : T[Path] : Path extends `${infer K}.${infer R}` ? K extends keyof T ? PropType<T[K] & {}, R, Unknown, IsPartial extends never ? never : undefined extends T[K] ? true : IsPartial> : Unknown : Unknown;
/** This helps to feed in a fallback to handle partiality.
 * - If the Fallback is not `undefined`, then it can cut partiality away and represents itself as an union type for the deep data.
 * - If the Fallback is `undefined`, then only adds `undefined` if the data was actually partial. Otherwise doesn't.
 */
type PropTypeFallback<T extends Record<string, any> | undefined, Path extends string, Fallback extends any = undefined> = Fallback extends undefined ? PropType<T, Path, never> : PropType<T, Path, never, never> | Fallback;
/** Get deep props by a dictionary whose keys are dotted data keys and values are fallbacks (to be used when data is not found on the JS side).
 * - The outputted type is likewise a flat dictionary with the same keys, but values are fetched deeply for each.
 */
type PropTypesFromDictionary<T extends Record<string, any>, Fallbacks extends Record<string, any>> = {
    [Key in keyof Fallbacks & string]: PropTypeFallback<T, Key, Fallbacks[Key]>;
};
/** Get deep props for an array of dotted data keys. */
type PropTypeArray<T extends Record<string, any>, Paths extends Array<string | undefined>, Fallbacks extends any[] = Paths, Index extends number = Paths["length"]> = Index extends 0 ? [] : [
    ...PropTypeArray<T, Paths, Fallbacks, IterateBackwards[Index]>,
    PropTypeFallback<T, Paths[IterateBackwards[Index]] & string, Fallbacks[IterateBackwards[Index]]>
];
/** Iterate down from 20 to 0. If iterates at 0 returns never. If higher than 20, returns 0. (With negative returns all numeric options type.)
 * - When used, should not input negative, but go down from, say, `Arr["length"]`, and stop after 0.
 */
type IterateBackwards = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]];
/** Collect structural data keys from a deep dictionary as dotted strings.
 * - Does not go inside arrays, sets, maps, immutable objects nor classes or class instances.
 * - By default limits to 10 depth, to not limit at all put MaxDepth to -1.
 * - Can provide <Data, Pre, Joiner, MaxDepth>. Should not provide the last PreVal, it's used internally.
 */
type GetJoinedDataKeysFrom<Data extends Record<string, any>, Pre extends string = "", Joiner extends string = ".", MaxDepth extends number = 10, PreVal extends string = "" extends Pre ? "" : `${Pre}${Joiner}`> = IterateBackwards[MaxDepth] extends never ? never : {
    [Key in string & keyof Data]: Data[Key] & {} extends {
        [key: string]: any;
        [key: number]: never;
    } ? Data[Key] & {} extends {
        asMutable(): Data[Key];
    } ? `${PreVal}${Key}` : string & GetJoinedDataKeysFrom<Data[Key] & {}, `${PreVal}${Key}`, Joiner, IterateBackwards[MaxDepth]> | `${PreVal}${Key}` : `${PreVal}${Key}`;
}[string & keyof Data];

/** Builds a record of { [key]: trueFalseLike }, which is useful for internal quick checks. */
declare function buildRecordable<T extends string = any>(types: RecordableType<T>): Partial<Record<T, any>>;
/** General helper for reusing a timer callback, or potentially forcing an immediate call.
 * - Returns the value that should be assigned as the stored timer (either existing one, new one or null).
 */
declare function updateCallTimer<Timer extends number | NodeJS.Timeout>(callback: () => void, currentTimer: Timer | null, defaultTimeout: number | null, forceTimeout?: number | null): Timer | null;
/** Creates a numeric range with whole numbers.
 * - With end smaller than start, will give the same result but in reverse.
 * - If you use stepSize, always give it a positive number. Otherwise use 1 as would loop forever.
 * - Works for integers and floats. Of course floats might do what they do even with simple adding / subtraction.
 * Examples:
 * - numberRange(3) => [0, 1, 2]
 * - numberRange(1, 3) => [1, 2]
 * - numberRange(3, 1) => [2, 1]
 * - numberRange(1, -2) => [0, -1, -2]
 * - numberRange(-3) => [-1, -2, -3]
 */
declare function createRange(start: number, end?: number | null, stepSize?: number): number[];
/** General data comparison function with level for deepness.
 * - Supports Object, Array, Set, Map complex types and recognizes classes vs. objects.
 * - About arguments:
 *      @param a First object for comparison. (Order of a and b makes no difference in the outcome.)
 *      @param b Second object for comparison. (Order of a and b makes no difference in the outcome.)
 *      @param nDepth Set the depth of comparison. Defaults to -1 (deep).
 *          - nDepth of -1 means no limit. 0 means no depth: simple identity check. 1 means shallow comparison, 2 double shallow comparison, and so on.
 */
declare function areEqual(a: any, b: any, nDepth?: number): boolean;
/** General copy function with level for deepness.
 * - Supports Object, Array, Set, Map complex types and recognizes classes vs. objects.
 * - About arguments:
 *      @param obj The value to copy, typically a complex object (but can of course be a simple value as well).
 *      @param nDepth Set the depth of copy level. Defaults to -1 (deep).
 *          - nDepth of -1 means no limit. 0 means no depth: simple identity check. 1 means shallow copy, 2 double shallow copy, and so on.
 */
declare function deepCopy<T extends any = any>(obj: T, nDepth?: number): T;

/** For quick getting modes to depth for certain uses (Memo and DataPicker).
 * - Positive values can go however deep. Note that -1 means deep, but below -2 means will not check.
 * - Values are: "never" = -3, "always" = -2, "deep" = -1, "changed" = 0, "shallow" = 1, "double" = 2.
 */
declare enum CompareDataDepthEnum {
    never = -3,
    always = -2,
    deep = -1,
    changed = 0,
    shallow = 1,
    double = 2
}
/** Data comparison modes as string names.
 * - "always" means always changed - doesn't even compare the data.
 * - "changed" means if a !== b, then it's changed.
 * - "shallow" means comparing all values in an array or dictionary with identity check (!==). This is a common used default, compares 1 level.
 * - "double" is like "shallow" but any prop value that is object or array will do a further shallow comparison to determine if it has changed.
 * - "deep" compares all the way down recursively. Only use this if you it's really what you want - never use it with recursive objects (= with direct or indirect self references).
 */
type CompareDataDepthMode = keyof typeof CompareDataDepthEnum;
/** Type for a function whose job is to extract data from given arguments. */
type DataExtractor<P extends any[] = any[], R = any> = (...args: P) => R;
/** This helps to create a typed data selector by providing the types for the Params for extractor and Data for output of the selector.
 * - The type return is a function that can be used for triggering the effect (like in Redux).
 * - The extractor can return an array up to 20 typed members.
 */
type CreateDataSource<Params extends any[] = any[], Data = any> = <Extractor extends (...args: Params) => [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?], Extracted extends ReturnType<Extractor> = ReturnType<Extractor>>(extractor: Extractor, producer: (...args: Extracted) => Data, depth?: number | CompareDataDepthMode) => (...args: Params) => Data;
/** This helps to create a typed cached data selector by providing the types for the Params for extractor and Data for output of the selector.
 * - The type return is a function that can be used for triggering the effect (like in Redux).
 * - The extractor can return an array up to 20 typed members.
 */
type CreateCachedSource<Params extends any[] = any[], Data = any> = <Extractor extends (...args: Params) => [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?], Extracted extends ReturnType<Extractor> = ReturnType<Extractor>>(extractor: Extractor, producer: (...args: Extracted) => Data, cacher: (...args: [...args: Params, cached: Record<string, (...args: Params) => Data>]) => string, depth?: number | CompareDataDepthMode) => (...args: Params) => Data;
/** Callback to run when the DataTrigger memory has changed (according to the comparison mode).
 * - If the callback returns a new callback function, it will be run when unmounting the callback.
 */
type DataTriggerOnMount<Memory = any> = (newMem: Memory, prevMem: Memory | undefined) => void | DataTriggerOnUnmount;
/** Callback to run when specifically changes to use a new onMount callback - implies that memory was changed as well.
 * - The callback is called right before calling the new onMount counter part.
 * - Note that this is not called on every memory change, but only on memory changes where new onMount callback was defined.
 */
type DataTriggerOnUnmount<Memory = any> = (currentMem: Memory, nextMem: Memory) => void;
/** Create a data memo.
 * - Usage:
 *      1. First define the (optional but often used) onMount callback to be triggered on memory change.
 *      2. Then define create a trigger: `const myTrigger = createDataMemo(onMount, memory)`.
 *      3. Then later in repeatable part of code call the trigger: `const didChange = myTrigger(newMemory);`
 * - Aboute triggering:
 *      - When calling the trigger you have actually 3 arguments: `(newMemory: Memory, forceRun?: boolean, newOnMountIfChanged?: DataTriggerOnMount<Memory>) => boolean`
 *      - The forceRun forces triggering, while the newOnMountIfChanged sets a new onMount callback, but only if memory was changed (or forced the trigger).
 * - About arguments:
 *      @param onMount Defines a callback to run when the memory has changed.
 *          - If the callback returns another callback, it will be called if the onMount callback gets replaced - see the 3rd arg upon triggering above.
 *      @param memory Defines the initial memory.
 *      @param depth Defines the comparison depth for comparing previous and new memory - to decide whether to run onMount callback.
 *          - Defaults to 1 meaning will perform a shallow comparison on the old and new memory. (By default assumes it's an object.)
 */
declare function createDataTrigger<Memory extends any>(onMount?: DataTriggerOnMount<Memory>, memory?: Memory, depth?: number | CompareDataDepthMode): (newMemory: Memory, forceRun?: boolean, newOnMountIfChanged?: DataTriggerOnMount<Memory> | null) => boolean;
/** Create a data memo.
 * - First define a memo: `const myMemo = createDataMemo((arg1, arg2) => { return "something"; });`.
 * - Then later in repeatable part of code get the value: `const myValue = myMemo(arg1, arg2);`
 * - About arguments:
 *      @param producer Defines the callback to produce the final data given the custom arguments.
 *      @param depth Defines the comparison depth for comparing previous and new memory arguments - to decide whether to run onMount callback.
 *          - The depth defaults to 0 meaning identity check on args (or if count changed).
 *          - Note that the depth refers to _each_ item in the memory, not the memory argments array as a whole since it's new every time.
 */
declare function createDataMemo<Data extends any, MemoryArgs extends any[]>(producer: (...memory: MemoryArgs) => Data, depth?: number | CompareDataDepthMode): (...memory: MemoryArgs) => Data;
/** Create a data source (returns a function): Functions like createDataMemo but for data with an intermediary extractor.
 * - Give an extractor that extracts an array out of your customly defined arguments. Can return an array up to 20 typed members or more with `[...] as const` trick.
 * - Whenever the extracted output has changed, the producer callback is triggered.
 *      * To control the level of comparsion, pass in the optional last arg for "depth". Defaults to 0: identity check on each argument (+ checks argment count).
 * - The producer callback directly receives the arguments returned by the extractor, and it should return the output data solely based on them (other sources of data should be constant).
 * - The whole point of this abstraction, is to trigger the presumably expensive producer callback only when the cheap extractor func tells there's a change.
 */
declare function createDataSource<Extracted extends [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?] | readonly any[], Data extends any, Params extends any[]>(extractor: (...args: Params) => Extracted, producer: (...args: Extracted) => Data, depth?: number | CompareDataDepthMode): (...args: Params) => Data;
/** Create a cached data source (returns a function).
 * - Just like createDataSource but provides multiple sets of extraction and data memory.
 * - The key (string) for caching is derived by the 3rd argument which is a function that receives the source arguments: `(...origArgs, cached): string`.
 *      * The cached extra argument provides the dictionary of current caching. The function may also use it to mutate the cache manually, eg. to delete keys from it.
 * - The reason why you would use the "cached" variant is when you have multiple similar use cases for the same selector with different source datas.
 *      * For example, let's say you have 2 similar grids but with two different source data.
 *      * If you would use createDataSource they would be competing about it.
 *      * So in practice, the producer callback would be triggered every time the _asker changes_ - even if data in both sets would stay identical.
 *      * To solve this, you simply define unique keys for each use case. For example: "grid1" and "grid2" in our simple example here.
 * - Like in createDataSource the optional last argument "depth" can be used to define the level of comparison for each argument. Defaults to 0: identity check.
 */
declare function createCachedSource<Extracted extends [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?] | readonly any[], Data extends any, Params extends any[]>(extractor: (...args: Params) => Extracted, producer: (...args: Extracted) => Data, cacher: (...args: [...args: Params, cached: Record<string, (...args: Params) => Data>]) => string, depth?: number | CompareDataDepthMode): (...args: Params) => Data;

declare enum SignalListenerFlags {
    /** If enabled, removes the listener once it has been fired once. */
    OneShot = 1,
    /** If enabled, calls the listener after a 0ms timeout. Note that this makes the callback's return value always be ignored from the return flow. */
    Deferred = 2,
    None = 0,
    All = 3
}
type SignalListenerFunc = (...args: any[]) => any | void;
type SignalListener<Callback extends SignalListenerFunc = SignalListenerFunc> = [callback: Callback, extraArgs: any[] | null, flags: SignalListenerFlags, groupId: any | null | undefined, origListeners?: SignalListener[]];
type SignalsRecord = Record<string, SignalListenerFunc>;
type SignalSendAsReturn<OrigReturnVal, HasAwait extends boolean, IsSingle extends boolean, RetVal = true extends HasAwait ? Awaited<OrigReturnVal> : OrigReturnVal, ReturnVal = true extends IsSingle ? RetVal | undefined : RetVal[]> = true extends HasAwait ? Promise<ReturnVal> : ReturnVal;
/** Calls a bunch of listeners and handles SignalListenerFlags mode.
 * - If OneShot flag used, removes from given listeners array.
 * - If Deferred flag is used, calls the listener after 0ms timeout.
 * - Does not collect return values. Just for emitting out without hassle.
 */
declare function callListeners(listeners: SignalListener[], args?: any[] | null): void;
/** Emits the signal and collects the answers given by each listener ignoring `undefined` as an answer.
 * - By default, returns a list of answers. To return the last one, include "last" in the modes array.
 * - To stop at the first accepted answer use "first" mode or "first-true" mode.
 * - Always skips `undefined` as an answer. To skip `null` too use "no-null" mode, or any falsifiable with `no-false`.
 */
declare function askListeners(listeners: SignalListener[], args?: any[] | null, modes?: Array<"" | "no-false" | "no-null" | "last" | "first" | "first-true">): any;
declare function _SignalManMixin(Base: ClassType): {
    new (...passArgs: any[]): {
        signals: Record<string, Array<SignalListener>>;
        listenTo(name: string, callback: SignalListenerFunc, extraArgs?: any[], flags?: SignalListenerFlags, groupId?: any | null): void;
        unlistenTo(names?: string | string[] | null, callback?: SignalListenerFunc | null, groupId?: any | null): void;
        isListening(name?: string | null, callback?: (SignalListenerFunc) | null, groupId?: any | null): any;
        sendSignal(name: string, ...args: any[]): any;
        sendSignalAs(modes: string | string[], name: string, ...args: any[]): any;
        afterRefresh(fullDelay?: boolean): Promise<void>;
        awaitRefresh(): Promise<void>;
        /** Extendable. */
        onListener(name: string, index: number, wasAdded: boolean): void;
        /** Optional. */
        getListenersFor?(signalName: string): SignalListener[] | undefined;
    };
};
/** There are two ways you can use this mixin creator:
 * 1. Call this to give basic SignalMan features with types for Props and such being empty.
 *      * `class MyMix extends SignalManMixin(MyBase) {}`
 * 2. If you want to type the signals (as you very likely do), use this simple trick instead:
 *      * `class MyMix extends (SignalManMixin as ClassMixer<typeof SignalMan<{ someSignal: () => void; }>>)(MyBase) {}`
 */
declare const SignalManMixin: ClassMixer<SignalManType<{}>>;
interface SignalManType<Signals extends SignalsRecord = {}> extends ClassType<SignalMan<Signals>> {
}
declare const SignalMan_base: ClassType<{}, any[]>;
/** SignalMan provides simple and complex signal listening and sending features. Use the `listenTo` method for listening and `sendSignal` or `sendSignalAs` for sending. */
declare class SignalMan<Signals extends SignalsRecord = {}> extends SignalMan_base {
}
interface SignalMan<Signals extends SignalsRecord = {}> {
    ["constructor"]: SignalManType<Signals>;
    /** The stored signal connections. To emit signals use `sendSignal` and `sendSignalAs` methods. */
    signals: Record<string, Array<SignalListener>>;
    /** Assign a listener to a signal. You can also define extra arguments, optional groupId for easy clearing, and connection flags (eg. for one-shot or to defer call).
     * Also checks whether the callback was already attached to the signal, in which case overrides the info. */
    listenTo<Name extends string & keyof Signals>(name: Name, callback: Signals[Name], extraArgs?: any[] | null, flags?: SignalListenerFlags | null, groupId?: any | null): void;
    /** Clear listeners by names, callback and/or groupId. Each restricts the what is cleared. To remove a specific callback attached earlier, provide name and callback. */
    unlistenTo(names?: (string & keyof Signals) | Array<string & keyof Signals> | null, callback?: SignalListenerFunc | null, groupId?: any | null): void;
    /** Check if any listener exists by the given name, callback and/or groupId. */
    isListening<Name extends string & keyof Signals>(name?: Name | null, callback?: SignalListenerFunc | null, groupId?: any | null): boolean;
    /** Send a signal. Does not return a value. Use `sendSignalAs(modes, name, ...args)` to refine the behaviour. */
    sendSignal<Name extends string & keyof Signals>(name: Name, ...args: Parameters<Signals[Name]>): void;
    /** The sendSignalAs method exposes various signalling features through its first arg: string or string[]. The features are listed below:
     * - `"delay"`:
     *      * Delays sending the signal. To also collect returned values must include "await".
     *      * Note that this delays the start of the process. So if new listeners are attached right after, they'll receive the signal.
     *      * In an external layer this could be further tied to other update cycles (eg. rendering cycle).
     * - `"pre-delay"`:
     *      * Like "delay" but uses 0ms timeout on the standalone SignalMan. (Typically this is arranged so that delays locally, but not pending external delays.)
     * - `"await"`:
     *      * Awaits each listener (simultaneously) and returns a promise. By default returns the last non-`undefined` value, combine with "multi" to return an array of awaited values (skipping `undefined`).
     *      * Exceptionally if "delay" is on, and there's no "await" then can only return `undefined`.
     *      * This is because there's no promise to capture the timed out returns.
     * - `"multi"`:
     *      * "multi" is actually the default behaviour: returns an array of values ignoring any `undefined`.
     *      * It can also be used explicitly to force array return even if using "last", "first" or "first-true" - which would otherwise switch to a single value return mode.
     * - `"last"`:
     *      * Use "last" to return the last acceptable value (by default ignoring any `undefined`) - instead of an array of values.
     * - "first"`:
     *      * Stops the listening at the first value that is not `undefined` (and not skipped by "no-false" or "no-null"), and returns that single value.
     *      * Note that "first" does not stop the flow when using "await", but just returns the first acceptable value.
     * - "first-true":
     *      * Is like "first" but stops only if value amounts to true like: !!value.
     * - "no-false":
     *      * Ignores any falsifiable values, only accepts: `(!!value)`. So most commonly ignored are: `false`, `0`, `""`, `null´, `undefined`.
     * - "no-null":
     *      * Ignores any `null` values in addition to `undefined`. (By default only ignores `undefined`.)
     *      * Note also that when returning values, any signal that was connected with .Deferred flag will always be ignored from the return value flow (and called 0ms later, in addition to "delay" timeout).
     */
    sendSignalAs<Name extends string & keyof Signals, Mode extends "" | "pre-delay" | "delay" | "await" | "last" | "first" | "first-true" | "multi" | "no-false" | "no-null", HasAwait extends boolean = Mode extends string[] ? Mode[number] extends "await" ? true : false : Mode extends "await" ? true : false, HasLast extends boolean = Mode extends string[] ? Mode[number] extends "last" ? true : false : Mode extends "last" ? true : false, HasFirst extends boolean = Mode extends string[] ? Mode[number] extends "first" ? true : Mode[number] extends "first-true" ? true : false : Mode extends "first" ? true : Mode extends "first-true" ? true : false, HasMulti extends boolean = Mode extends string[] ? Mode[number] extends "multi" ? true : false : Mode extends "multi" ? true : false, HasDelay extends boolean = Mode extends string[] ? Mode[number] extends "delay" ? true : false : Mode extends "delay" ? true : false, UseSingle extends boolean = true extends HasMulti ? false : HasFirst | HasLast, UseReturnVal extends boolean = true extends HasAwait ? true : true extends HasDelay ? false : true>(modes: Mode | Mode[], name: Name, ...args: Parameters<Signals[Name]>): true extends UseReturnVal ? SignalSendAsReturn<ReturnType<Signals[Name]>, HasAwait, UseSingle> : undefined;
    /** Overrideable method that should trigger a refresh and return a promise.
     * - The promise is resolved after the "pre-delay" or "delay" cycle has finished depending on the "fullDelay" argument.
     *      * By default uses a timeout of 0ms for "pre-delay" and after that awaits the promise from `awaitRefresh` for full "delay".
     * - Note that at the level of SignalMan there is nothing to "refresh". However, if extended by a class where refreshing makes sense, this should trigger refreshing first.
     * - Used internally by sendSignalAs flow for its "pre-delay" and "delay" signals.
     */
    afterRefresh(fullDelay?: boolean): Promise<void>;
    /** Should not be called externally, but only overridden externally to determine the timing of the "delay" signals (after "pre-delay").
     * - By default uses a timeout of 1ms. Assumes to be overridden.
     * - Used internally through afterRefresh flow.
     */
    awaitRefresh(): Promise<void>;
    /** Optional extendable local callback handler to keep track of added / removed listeners. Called right after adding and right before removing.
     * - Note. To fluently support any possible middleware, always call `super.onListener(name, index, wasAdded)` (unless specifically wanting to ignore them).
     */
    onListener(name: string & keyof Signals, index: number, wasAdded: boolean): void;
    /** Optional method to get the listeners for the given signal. If used it determines the listeners, if not present then uses this.signals[name] instead. Return undefined to not call anything. */
    getListenersFor?(signalName: string & keyof Signals): SignalListener[] | undefined;
}

/** Technically should return void. But for conveniency can return anything - does not use the return value in any case. */
type DataListenerFunc = (...args: any[]) => any | void;
/** There are two ways you can use this mixin creator:
 * 1. Call this to give basic DataBoy features with advanced typing being empty.
 *      * `class MyMix extends DataBoyMixin(MyBase) {}`
 * 2. If you want to define the Data and Signals types, you can use this trick instead:
 *      * `class MyMix extends (DataBoyMixin as ClassMixer<DataBoyType<Data, Signals>>)(MyBase) {}`
 */
declare const DataBoyMixin: ClassMixer<ClassType<DataBoy<{}>, any[]>>;
interface DataBoyType<Data extends Record<string, any> = {}> extends ClassType<DataBoy<Data>> {
}
declare const DataBoy_base: ClassType<{}, any[]>;
/** DataBoy is like DataMan but only provides data listening, not actual data.
 * - Regardless of having no data, it assumes a custom data structure of nested dictionaries.
 *      * For example: `{ something: { deep: boolean; }; simple: string; }`
 * - It provides listening services using the listenToData method, eg. `listenToData("something.deep", (deep) => {})`.
 * - Examples for usage:
 *      * Create: `const dataMan = new DataMan({ ...initData });`
 *      * Listen: `dataMan.listenToData("something.deep", "another", (some, other) => { ... }, [...fallbackArgs])`
 *      * Set data: `dataMan.setInData("something.deep", somedata)`
 */
declare class DataBoy<Data extends Record<string, any> = {}> extends DataBoy_base {
}
interface DataBoy<Data extends Record<string, any> = {}> {
    ["constructor"]: DataBoyType<Data>;
    /** External data listeners.
     * - These are called after the data refreshes, though might be tied to update cycles at an external layer - to refresh the whole app in sync.
     * - The keys are data listener callbacks, and values are: `[fallbackArgs, ...dataNeeds]`.
     * - If the fallbackArgs is a dictionary, then the `getDataArgsBy´ handler actually returns only a single argument: `[valueDictionary]`.
     *      * The fallbackArgs dictionary is then used for fallback values as a dictionary instead.
     *      * Note that this does imply that the keys are held both in fallbackArgs and in the needs array. But for fluency left as is.
     */
    dataListeners: Map<DataListenerFunc, [fallbackArgs: any[] | Record<string, any> | undefined, ...needs: string[]]>;
    /** Listen to data using a dictionary whose keys are data keys and values fallbacks.
     * - Note that in this case, the callback will only have one argument which is a dictionary with the respective keys and values fetched (and falled back).
     * - Tips:
     *      * If you want to strictly define specific types (eg. `"test"` vs. `string`) in the dictionary add `as const` after value: `{ "some.key": "test" as const }`.
     *      * Or you can do the same on the whole dictionary: `{ "some.key": "test" } as const`.
     */
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Fallbacks extends Partial<Record<Keys, any>>>(fallbackDictionary: keyof Fallbacks extends Keys ? Fallbacks : never, callback: (values: PropTypesFromDictionary<Data, Fallbacks>) => void, callImmediately?: boolean): void;
    /** This allows to listen to data by defining specific needs which in turn become the listener arguments.
     * - The needs are defined as dotted strings: For example, `listenToData("user.allowEdit", "themes.darkMode", (allowEdit, darkMode) => { ... });`
     * - By calling this, we both assign a listener but also set data needs to it, so it will only be called when the related data portions have changed.
     * - To remove the listener use `unlistenToData(callback)`.
     */
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>) => void, Fallback extends [any?] = []>(dataKey: Key1, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>) => void, Fallback extends [any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>) => void, Fallback extends [any?, any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>) => void, Fallback extends [any?, any?, any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>, val5: PropTypeFallback<Data, Key5, Fallback[4]>) => void, Fallback extends [any?, any?, any?, any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>, val5: PropTypeFallback<Data, Key5, Fallback[4]>, val6: PropTypeFallback<Data, Key6, Fallback[5]>) => void, Fallback extends [any?, any?, any?, any?, any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Key7 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>, val5: PropTypeFallback<Data, Key5, Fallback[4]>, val6: PropTypeFallback<Data, Key6, Fallback[5]>, val7: PropTypeFallback<Data, Key7, Fallback[6]>) => void, Fallback extends [any?, any?, any?, any?, any?, any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Key7 extends Keys, Key8 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>, val5: PropTypeFallback<Data, Key5, Fallback[4]>, val6: PropTypeFallback<Data, Key6, Fallback[5]>, val7: PropTypeFallback<Data, Key7, Fallback[6]>, val8: PropTypeFallback<Data, Key8, Fallback[7]>) => void, Fallback extends [any?, any?, any?, any?, any?, any?, any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, dataKey8: Key8, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
    unlistenToData(callback: DataListenerFunc): boolean;
    /** Helper to build data arguments with values fetched using getInData method with the given data needs args.
     * - For example: `getDataArgsBy(["user.name", "darkMode"])` returns `[userName?, darkMode?]`.
     * - To add fallbacks (whose type affects the argument types), give an array of fallbacks as the 2nd argument with respective order.
     * - If the fallbackArgs is a dictionary, then returns `[valueDictionary]` picking the fallbacks from the given dictionary.
     * - Note. This method is used internally but can also be used for custom external purposes.
     */
    getDataArgsBy<DataKey extends GetJoinedDataKeysFrom<Data>, Params extends [DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?], Fallbacks extends Record<string, any> | [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?]>(needs: Params, fallbackArgs?: Fallbacks): Fallbacks extends any[] ? PropTypeArray<Data, Params, Fallbacks> : [valueDictionary: PropTypesFromDictionary<Data, Fallbacks>];
    /** Manually trigger an update based on changes in context. Should not be used in normal circumstances.
     * - Only calls / triggers for refresh by needs related to the given contexts. If ctxNames is true, then all.
     * - If the refreshKeys is `true` (default), then refreshes as if all data had changed.
     */
    callDataBy(refreshKeys?: true | GetJoinedDataKeysFrom<Data>[]): void;
}

declare function _DataManMixin<Data extends Record<string, any> = {}>(Base: ClassType): {
    new (...args: {} extends Data ? any[] : [Data, ...any[]]): {
        readonly data: Data;
        /** The pending data keys - for internal refreshing uses. */
        dataKeysPending: string[] | true | null;
        getData(): Data;
        getInData(dataKey: string, fallback?: any): any;
        setData(data: Data, extend?: boolean, refresh?: boolean, forceTimeout?: number | null): void;
        setInData(dataKey: string, subData: any, extend?: boolean, refresh?: boolean, forceTimeout?: number | null): void;
        /** Trigger refresh and optionally add data keys for refreshing.
         * - This triggers callbacks from dataListeners that match needs in dataKeysPending.
         * - This base implementation just calls the listeners with matching keys immediately / after the given timeout.
         * - Note that you might want to override this method and tie it to some refresh system.
         *      * In that case, remember to feed the keys: `if (dataKeys) this.addRefreshKeys(dataKeys);`
         */
        refreshData(dataKeys?: string | string[] | boolean | null, forceTimeout?: number | null): void;
        /** Note that this only adds the refresh keys but will not refresh. */
        addRefreshKeys(refreshKeys: string | string[] | boolean): void;
        constructor: DataBoyType<{}>;
        dataListeners: Map<DataListenerFunc, [fallbackArgs: any[] | Record<string, any> | undefined, ...needs: string[]]>;
        listenToData<Keys extends never, Fallbacks extends Partial<Record<Keys, any>>>(fallbackDictionary: keyof Fallbacks extends Keys ? Fallbacks : never, callback: (values: PropTypesFromDictionary<{}, Fallbacks>) => void, callImmediately?: boolean | undefined): void;
        listenToData<Keys_1 extends never, Key1 extends Keys_1, Callback extends (val1: PropTypeFallback<{}, Key1, Fallback[0]>) => void, Fallback extends [any?] = []>(dataKey: Key1, callback: Callback, fallbackArgs?: Fallback | null | undefined, callImmediately?: boolean | undefined): void;
        listenToData<Keys_2 extends never, Key1_1 extends Keys_2, Key2 extends Keys_2, Callback_1 extends (val1: PropTypeFallback<{}, Key1_1, Fallback_1[0]>, val2: PropTypeFallback<{}, Key2, Fallback_1[1]>) => void, Fallback_1 extends [any?, any?] = []>(dataKey1: Key1_1, dataKey2: Key2, callback: Callback_1, fallbackArgs?: Fallback_1 | null | undefined, callImmediately?: boolean | undefined): void;
        listenToData<Keys_3 extends never, Key1_2 extends Keys_3, Key2_1 extends Keys_3, Key3 extends Keys_3, Callback_2 extends (val1: PropTypeFallback<{}, Key1_2, Fallback_2[0]>, val2: PropTypeFallback<{}, Key2_1, Fallback_2[1]>, val3: PropTypeFallback<{}, Key3, Fallback_2[2]>) => void, Fallback_2 extends [any?, any?, any?] = []>(dataKey1: Key1_2, dataKey2: Key2_1, dataKey3: Key3, callback: Callback_2, fallbackArgs?: Fallback_2 | null | undefined, callImmediately?: boolean | undefined): void;
        listenToData<Keys_4 extends never, Key1_3 extends Keys_4, Key2_2 extends Keys_4, Key3_1 extends Keys_4, Key4 extends Keys_4, Callback_3 extends (val1: PropTypeFallback<{}, Key1_3, Fallback_3[0]>, val2: PropTypeFallback<{}, Key2_2, Fallback_3[1]>, val3: PropTypeFallback<{}, Key3_1, Fallback_3[2]>, val4: PropTypeFallback<{}, Key4, Fallback_3[3]>) => void, Fallback_3 extends [any?, any?, any?, any?] = []>(dataKey1: Key1_3, dataKey2: Key2_2, dataKey3: Key3_1, dataKey4: Key4, callback: Callback_3, fallbackArgs?: Fallback_3 | null | undefined, callImmediately?: boolean | undefined): void;
        listenToData<Keys_5 extends never, Key1_4 extends Keys_5, Key2_3 extends Keys_5, Key3_2 extends Keys_5, Key4_1 extends Keys_5, Key5 extends Keys_5, Callback_4 extends (val1: PropTypeFallback<{}, Key1_4, Fallback_4[0]>, val2: PropTypeFallback<{}, Key2_3, Fallback_4[1]>, val3: PropTypeFallback<{}, Key3_2, Fallback_4[2]>, val4: PropTypeFallback<{}, Key4_1, Fallback_4[3]>, val5: PropTypeFallback<{}, Key5, Fallback_4[4]>) => void, Fallback_4 extends [any?, any?, any?, any?, any?] = []>(dataKey1: Key1_4, dataKey2: Key2_3, dataKey3: Key3_2, dataKey4: Key4_1, dataKey5: Key5, callback: Callback_4, fallbackArgs?: Fallback_4 | null | undefined, callImmediately?: boolean | undefined): void;
        listenToData<Keys_6 extends never, Key1_5 extends Keys_6, Key2_4 extends Keys_6, Key3_3 extends Keys_6, Key4_2 extends Keys_6, Key5_1 extends Keys_6, Key6 extends Keys_6, Callback_5 extends (val1: PropTypeFallback<{}, Key1_5, Fallback_5[0]>, val2: PropTypeFallback<{}, Key2_4, Fallback_5[1]>, val3: PropTypeFallback<{}, Key3_3, Fallback_5[2]>, val4: PropTypeFallback<{}, Key4_2, Fallback_5[3]>, val5: PropTypeFallback<{}, Key5_1, Fallback_5[4]>, val6: PropTypeFallback<{}, Key6, Fallback_5[5]>) => void, Fallback_5 extends [any?, any?, any?, any?, any?, any?] = []>(dataKey1: Key1_5, dataKey2: Key2_4, dataKey3: Key3_3, dataKey4: Key4_2, dataKey5: Key5_1, dataKey6: Key6, callback: Callback_5, fallbackArgs?: Fallback_5 | null | undefined, callImmediately?: boolean | undefined): void;
        listenToData<Keys_7 extends never, Key1_6 extends Keys_7, Key2_5 extends Keys_7, Key3_4 extends Keys_7, Key4_3 extends Keys_7, Key5_2 extends Keys_7, Key6_1 extends Keys_7, Key7 extends Keys_7, Callback_6 extends (val1: PropTypeFallback<{}, Key1_6, Fallback_6[0]>, val2: PropTypeFallback<{}, Key2_5, Fallback_6[1]>, val3: PropTypeFallback<{}, Key3_4, Fallback_6[2]>, val4: PropTypeFallback<{}, Key4_3, Fallback_6[3]>, val5: PropTypeFallback<{}, Key5_2, Fallback_6[4]>, val6: PropTypeFallback<{}, Key6_1, Fallback_6[5]>, val7: PropTypeFallback<{}, Key7, Fallback_6[6]>) => void, Fallback_6 extends [any?, any?, any?, any?, any?, any?, any?] = []>(dataKey1: Key1_6, dataKey2: Key2_5, dataKey3: Key3_4, dataKey4: Key4_3, dataKey5: Key5_2, dataKey6: Key6_1, dataKey7: Key6_1, callback: Callback_6, fallbackArgs?: Fallback_6 | null | undefined, callImmediately?: boolean | undefined): void;
        listenToData<Keys_8 extends never, Key1_7 extends Keys_8, Key2_6 extends Keys_8, Key3_5 extends Keys_8, Key4_4 extends Keys_8, Key5_3 extends Keys_8, Key6_2 extends Keys_8, Key7_1 extends Keys_8, Key8 extends Keys_8, Callback_7 extends (val1: PropTypeFallback<{}, Key1_7, Fallback_7[0]>, val2: PropTypeFallback<{}, Key2_6, Fallback_7[1]>, val3: PropTypeFallback<{}, Key3_5, Fallback_7[2]>, val4: PropTypeFallback<{}, Key4_4, Fallback_7[3]>, val5: PropTypeFallback<{}, Key5_3, Fallback_7[4]>, val6: PropTypeFallback<{}, Key6_2, Fallback_7[5]>, val7: PropTypeFallback<{}, Key7_1, Fallback_7[6]>, val8: PropTypeFallback<{}, Key8, Fallback_7[7]>) => void, Fallback_7 extends [any?, any?, any?, any?, any?, any?, any?, any?] = []>(dataKey1: Key1_7, dataKey2: Key2_6, dataKey3: Key3_5, dataKey4: Key4_4, dataKey5: Key5_3, dataKey6: Key6_2, dataKey7: Key6_2, dataKey8: Key8, callback: Callback_7, fallbackArgs?: Fallback_7 | null | undefined, callImmediately?: boolean | undefined): void;
        unlistenToData(callback: DataListenerFunc): boolean;
        getDataArgsBy<DataKey extends never, Params extends [(DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?, (DataKey | undefined)?], Fallbacks_1 extends Record<string, any> | [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?]>(needs: Params, fallbackArgs?: Fallbacks_1 | undefined): Fallbacks_1 extends any[] ? PropTypeArray<{}, Params, Fallbacks_1, Params["length"]> : [valueDictionary: PropTypesFromDictionary<{}, Fallbacks_1>];
        callDataBy(refreshKeys?: true | never[] | undefined): void;
    };
};
/** There are two ways you can use this mixin creator:
 * 1. Call this to give basic DataMan features with advanced typing being empty.
 *      * `class MyMix extends DataManMixin(MyBase) {}`
 * 2. If you want to define the Data and Signals types, you can use this trick instead:
 *      * `class MyMix extends (DataManMixin as ClassMixer<DataManType<Data, Signals>>)(MyBase) {}`
 */
declare const DataManMixin: ClassMixer<ClassType<DataMan<{}>, any[]>>;
interface DataManType<Data extends Record<string, any> = {}> extends ClassType<DataMan<Data>> {
}
declare const DataMan_base: ClassType<{}, any[]>;
/** DataMan provides data setting and listening features with dotted strings.
 * - Examples for usage:
 *      * Create: `const dataMan = new DataMan({ ...initData });`
 *      * Listen: `dataMan.listenToData("something.deep", "another", (some, other) => { ... })`
 *      * Set data: `dataMan.setInData("something.deep", somedata)`
 * - It assumes a custom data structure of nested dictionaries.
 *      * For example: `{ something: { deep: boolean; }; simple: string; }`
 *      * The actual values can be anything: static values, functions, arrays, maps, sets, custom classes (including Immutable maps and such).
 * - When the data is modified, the parenting data dictionaries are shallow copied all the way up to the root data.
 *      * Accordingly, the related data listeners are called (instantly at the level of DataMan).
 * - Note that the typing data key suggestions won't go inside any non-Object type nor custom classes, only dictionaries.
 *      * Accordingly you should not refer deeper on the JS either, even thought it might work in practice since won't take a shallow copy of non-Objects.
 */
declare class DataMan<Data extends Record<string, any> = {}> extends DataMan_base {
    constructor(...args: {} extends Data ? any[] : [Data, ...any[]]);
}
interface DataMan<Data extends Record<string, any> = {}> extends DataBoy<Data> {
    ["constructor"]: DataManType<Data>;
    readonly data: Data;
    /** The pending data keys - for internal refreshing uses. */
    dataKeysPending: string[] | true | null;
    /** Get the whole data (directly).
     * - If you want to use refreshes and such as designed, don't modify the data directly (do it via setData or setInData) - or then call .refreshData accordingly.
     */
    getData(): Data;
    /** Get a portion within the data using dotted string to point the location. For example: "themes.selected". */
    getInData<DataKey extends GetJoinedDataKeysFrom<Data>, Fallback extends any>(dataKey: DataKey, fallback: Fallback): PropType<Data, DataKey> | Fallback;
    getInData<DataKey extends GetJoinedDataKeysFrom<Data>>(dataKey: DataKey, fallback?: never | undefined): PropType<Data, DataKey>;
    /** Set the data and refresh. By default extends the data (only replaces if extend is set to false), and triggers a refresh. */
    setData(data: Data, extend: false, refresh?: boolean, forceTimeout?: number | null): void;
    setData(data: Partial<Data>, extend?: boolean | true, refresh?: boolean, forceTimeout?: number | null): void;
    /** Set or extend in nested data, and refresh with the key. (And by default trigger a refresh.)
     * - Along the way (to the leaf) automatically extends any values whose constructor === Object, and creates the path to the leaf if needed.
     * - By default extends the value at the leaf, but supports automatically checking if the leaf value is a dictionary (with Object constructor) - if not, just replaces the value.
     * - Finally, if the extend is set to false, the typing requires to input full data at the leaf, which reflects JS behaviour - won't try to extend.
     */
    setInData<DataKey extends GetJoinedDataKeysFrom<Data>, SubData extends PropType<Data, DataKey, never>>(dataKey: DataKey, subData: SubData, extend?: false, refresh?: boolean, forceTimeout?: number | null): void;
    setInData<DataKey extends GetJoinedDataKeysFrom<Data>, SubData extends PropType<Data, DataKey, never>>(dataKey: DataKey, subData: Partial<SubData>, extend?: boolean | undefined, refresh?: boolean, forceTimeout?: number | null): void;
    /** This refreshes both: data & pending signals.
     * - If refreshKeys defined, will add them - otherwise only refreshes pending.
     * - Note that if !!refreshKeys is false, then will not add any refreshKeys. If there were none, will only trigger the signals.
     */
    refreshData<DataKey extends GetJoinedDataKeysFrom<Data>>(dataKeys: DataKey | DataKey[] | boolean, forceTimeout?: number | null): void;
    refreshData<DataKey extends GetJoinedDataKeysFrom<Data>>(dataKeys: DataKey | DataKey[] | boolean, forceTimeout?: number | null): void;
    /** Note that this only adds the refresh keys but will not refresh. */
    addRefreshKeys(refreshKeys?: string | string[] | boolean): void;
}

/** There are two ways you can use this mixin creator:
 * 1. Call this to give basic SignalDataBoy features with advanced typing being empty.
 *      * `class MyMix extends SignalDataBoyMixin(MyBase) {}`
 * 2. If you want to define the Data and Signals types, you can use this trick instead:
 *      * `class MyMix extends (SignalDataBoyMixin as ClassMixer<SignalDataBoyType<Data, Signals>>)(MyBase) {}`
 */
declare const SignalDataBoyMixin: ClassMixer<ClassType<DataBoy<{}> & SignalMan<{}>, any[]>>;
interface SignalDataBoyType<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends ClassType<SignalDataBoy<Data, Signals>> {
}
declare const SignalDataBoy_base: ClassType<{}, any[]>;
declare class SignalDataBoy<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends SignalDataBoy_base {
}
interface SignalDataBoy<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends DataBoy<Data>, SignalMan<Signals> {
    ["constructor"]: SignalDataBoyType<Data, Signals>;
}

/** There are two ways you can use this mixin creator:
 * 1. Call this to give basic SignalDataMan features with advanced typing being empty.
 *      * `class MyMix extends SignalDataManMixin(MyBase) {}`
 * 2. If you want to define the Data and Signals types, you can use this trick instead:
 *      * `class MyMix extends (SignalDataManMixin as ClassMixer<SignalDataManType<Data, Signals>>)(MyBase) {}`
 */
declare const SignalDataManMixin: ClassMixer<ClassType<DataMan<{}> & SignalMan<{}>, any[]>>;
interface SignalDataManType<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends ClassType<SignalDataMan<Data, Signals>> {
}
declare const SignalDataMan_base: ClassType<{}, any[]>;
declare class SignalDataMan<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends SignalDataMan_base {
}
interface SignalDataMan<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends DataMan<Data>, SignalMan<Signals> {
    ["constructor"]: SignalDataManType<Data, Signals>;
}

/** Typing to hold named contexts as a dictionary. */
type ContextsAllType = Record<string, Context<any, SignalsRecord>>;
/** Typing to hold named contexts as a dictionary with optional UnionType and optionally only using certain keys. */
type ContextsAllTypeWith<AllContexts extends ContextsAllType = {}, UnifyWith extends any = undefined, OnlyKeys extends keyof AllContexts & string = keyof AllContexts & string> = {
    [Name in OnlyKeys]: never extends UnifyWith ? AllContexts[Name] : AllContexts[Name] | UnifyWith;
};
/** Get the joined contextual signal keys: `${ContextName}.${SignalName}`. */
type GetJoinedSignalKeysFromContexts<Contexts extends ContextsAllType> = {
    [CtxName in string & keyof Contexts]: keyof (Contexts[CtxName]["_Signals"] & {}) extends string ? `${CtxName}.${keyof (Contexts[CtxName]["_Signals"] & {}) & string}` : never;
}[string & keyof Contexts];
/** Get the joined contextual data keys: `${ContextName}.${MainKey}.${SubKey}`, and so on. */
type GetSignalsFromContexts<Ctxs extends ContextsAllType> = {
    [CtxSignalName in GetJoinedSignalKeysFromContexts<Ctxs> & string]: CtxSignalName extends `${infer CtxName}.${infer SignalName}` ? (Ctxs[CtxName]["_Signals"] & {})[SignalName] : never;
};
/** Combine the data part of the named contexts, keeping the same naming structure. */
type GetDataFromContexts<Ctxs extends ContextsAllType> = {
    [Key in string & keyof Ctxs]: Ctxs[Key]["data"];
};
/** Class type of ContextAPI. */
interface ContextAPIType<Contexts extends ContextsAllType = {}> extends ClassType<ContextAPI<Contexts>>, DataBoyType<Partial<GetDataFromContexts<Contexts>>>, SignalManType<GetSignalsFromContexts<Contexts>> {
}
/** ContextAPI extends SignalMan and DataBoy mixins to provide features for handling multiple named Contexts.
 * - According to its mixin basis, ContextAPI allows to:
 *      * SignalMan: Send and listen to signals in the named contexts.
 *      * DataBoy: Listen to data changes, but also to set/get data in the contexts.
 * - All data keys and signal names should start with `${contextName}.${keyOrName}`.
 *      * For example: "settings.something.deep" data key (for "settings" context) or "navigation.onFocus" signal (for "navigation" context).
 * - Importantly, the ContextAPI's `awaitRefresh` method can be overridden externally to affect the syncing of all the connected contexts.
 *      * More specifically, the "delay" cycle of the Contexts is resolved only once all the ContextAPIs connected to the context have resolved their `awaitRefresh`.
 */
declare class ContextAPI<Contexts extends ContextsAllType = {}> extends SignalDataBoy<Partial<GetDataFromContexts<Contexts>>, GetSignalsFromContexts<Contexts>> {
    ["constructor"]: ContextAPIType<Contexts>;
    /** All the contexts assigned to us.
     * - They also have a link back to us by context.contextAPIs, with this as the key and context names as the values.
     * - Note that can also set `null` value here - for purposefully excluding an inherited context (when using one contextAPI to inherit contexts from another).
     *      * But `undefined` will never be found in here - if gives to the setContext, it means deleting the entry from the record.
     */
    contexts: Partial<Record<string, Context<any, SignalsRecord> | null>>;
    constructor(contexts?: Partial<Contexts>);
    /** This (triggers a refresh and) returns a promise that is resolved when the "pre-delay" or "delay" cycle is completed.
     * - At the level of ContextAPI there's nothing to refresh (no data held, just read from contexts).
     *      * Actually the point is the opposite: to optionally delay the "delay" cycle of the connected contexts by overriding the `awaitRefresh` method.
     * - Note that this method is overrideable. On the basic implementation it resolves immediately.
     *      * But on an external layer, the awaiting might be synced to provide the bridging for syncing the "delay" signals of many contexts together.
     */
    afterRefresh(fullDelay?: boolean, forceTimeout?: number | null): Promise<void>;
    /** At the level of ContextAPI the `awaitRefresh` resolves instantly.
     * - Importantly, this method determines when the "delay" cycle of the connected Contexts is resolved. (That's why defaults to instant.)
     * - Accordingly, you can override this method (externally or by extending class) to customize the syncing.
     * - Note that this method should not be _called_ externally - only overridden externally (to affect the "delay" cycle timing).
     */
    awaitRefresh(): Promise<void>;
    /** Emit a signal. Does not return a value. Use `sendSignalAs(modes, ctxSignalName, ...args)` to refine the behaviour. */
    sendSignal<CtxSignalName extends string & keyof GetSignalsFromContexts<Contexts>, Names extends CtxSignalName extends `${infer CtxName}.${infer SignalName}` ? [CtxName, SignalName] : [never, never]>(ctxSignalName: CtxSignalName, ...args: Parameters<(Contexts[Names[0]]["_Signals"] & {})[Names[1]]>): void;
    /** The sendSignalAs method exposes various signalling features through its first arg: string or string[]. The features are listed below:
     * - `"delay"`:
     *      * Delays sending the signal. To also collect returned values must include "await".
     *      * Note that this delays the process to sync with the Context's refresh cycle, and waits until all related contextAPIs have refreshed.
     *      * In an external layer this could be further tied to other update cycles (eg. rendering cycle).
     * - `"pre-delay"`:
     *      * Like "delay", syncs to the Context's refresh cycle, but calls then on that cycle - without waiting external flush (from other contextAPIs connected to the same context network).
     * - `"await"`:
     *      * Awaits each listener (simultaneously) and returns a promise. By default returns the last non-`undefined` value, combine with "multi" to return an array of awaited values (skipping `undefined`).
     *      * Exceptionally if "delay" is on, and there's no "await" then can only return `undefined`.
     *      * This is because there's no promise to capture the timed out returns.
     * - `"multi"`:
     *      * "multi" is actually the default behaviour: returns an array of values ignoring any `undefined`.
     *      * It can also be used explicitly to force array return even if using "last", "first" or "first-true" - which would otherwise switch to a single value return mode.
     * - `"last"`:
     *      * Use "last" to return the last acceptable value (by default ignoring any `undefined`) - instead of an array of values.
     * - "first"`:
     *      * Stops the listening at the first value that is not `undefined` (and not skipped by "no-false" or "no-null"), and returns that single value.
     *      * Note that "first" does not stop the flow when using "await", but just returns the first acceptable value.
     * - "first-true":
     *      * Is like "first" but stops only if value amounts to true like: !!value.
     * - "no-false":
     *      * Ignores any falsifiable values, only accepts: `(!!value)`. So most commonly ignored are: `false`, `0`, `""`, `null´, `undefined`.
     * - "no-null":
     *      * Ignores any `null` values in addition to `undefined`. (By default only ignores `undefined`.)
     *      * Note also that when returning values, any signal that was connected with .Deferred flag will always be ignored from the return value flow (and called 0ms later, in addition to "delay" timeout).
     * - Note about the signal flow at the ContextAPI level:
     *      * The `listenTo` and `listenToData` features provide a stable basis for listening. It makes no difference whether contexts are present when attaching the listeners.
     *      * However, the `sendSignal` and `sendSignalAs` use the context methods directly - so if the context is not found at the time of calling, then does nothing.
     */
    sendSignalAs<CtxSignals extends GetSignalsFromContexts<Contexts>, CtxSignalName extends string & keyof CtxSignals, Mode extends "" | "pre-delay" | "delay" | "await" | "last" | "first" | "first-true" | "multi" | "no-false" | "no-null", HasAwait extends boolean = Mode extends string[] ? Mode[number] extends "await" ? true : false : Mode extends "await" ? true : false, HasLast extends boolean = Mode extends string[] ? Mode[number] extends "last" ? true : false : Mode extends "last" ? true : false, HasFirst extends boolean = Mode extends string[] ? Mode[number] extends "first" ? true : Mode[number] extends "first-true" ? true : false : Mode extends "first" ? true : Mode extends "first-true" ? true : false, HasMulti extends boolean = Mode extends string[] ? Mode[number] extends "multi" ? true : false : Mode extends "multi" ? true : false, HasDelay extends boolean = Mode extends string[] ? Mode[number] extends "delay" ? true : false : Mode extends "delay" ? true : false, HasPreDelay extends boolean = Mode extends string[] ? Mode[number] extends "pre-delay" ? true : false : Mode extends "pre-delay" ? true : false, UseSingle extends boolean = true extends HasMulti ? false : HasFirst | HasLast, UseReturnVal extends boolean = true extends HasAwait ? true : true extends HasDelay | HasPreDelay ? false : true>(modes: Mode | Mode[], ctxSignalName: CtxSignalName, ...args: Parameters<CtxSignals[CtxSignalName]>): true extends UseReturnVal ? SignalSendAsReturn<ReturnType<CtxSignals[CtxSignalName]>, HasAwait, UseSingle> : undefined;
    /** Get from contextual data by dotted key: eg. `"someCtxName.someData.someProp"`.
     * - If the context exists uses the getInData method from the context (or getData if no sub prop), otherwise returns undefined or the fallback.
     * - If context found, the fallback is passed to it and also used in case the data is not found at the data key location.
     */
    getInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, fallback?: never | undefined): SubData | undefined;
    getInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas>, SubData extends PropType<CtxDatas, CtxDataKey, never>, FallbackData extends any>(ctxDataKey: CtxDataKey, fallback: FallbackData): SubData | FallbackData;
    /** Set in contextual data by dotted key: eg. `"someCtxName.someData.someProp"`.
     * - Sets the data in the context, if context found, and triggers refresh (by default).
     * - Note that if the context is found, using this triggers the contextual data listeners (with default or forced timeout).
     * - About setting data.
     *      * Along the way (to the leaf) automatically extends any values whose constructor === Object, and creates the path to the leaf if needed.
     *      * By default extends the value at the leaf, but supports automatically checking if the leaf value is a dictionary (with Object constructor) - if not, just replaces the value.
     *      * Finally, if the extend is set to false, the typing requires to input full data at the leaf, which reflects JS behaviour - won't try to extend.
    */
    setInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, data: Partial<SubData> & Record<string, any>, extend?: true, refresh?: boolean, forceTimeout?: number | null): void;
    setInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, data: SubData, extend?: boolean, refresh?: boolean, forceTimeout?: number | null): void;
    /** Manually trigger refresh without setting any data using a dotted key (or an array of them) with context name prepended: eg. `"someCtxName.someData.someProp"`. */
    refreshData<CtxDataKey extends GetJoinedDataKeysFrom<GetDataFromContexts<Contexts>>>(ctxDataKeys: CtxDataKey | CtxDataKey[], forceTimeout?: number | null): void;
    /** Manually trigger refresh by a dictionary with multiple refreshKeys for multiple contexts.
     * - Note that unlike the other data methods in the ContextAPI, this one separates the contextName and the keys: `{ [contextName]: dataKeys }` instead of `${contextName}.${dataKeyOrSignal}`.
     * - The values (= data keys) can be `true` to refresh all in that context, or a dotted string or an array of dotted strings to refresh multiple separate portions simultaneously.
     */
    refreshDataBy<All extends {
        [Name in keyof Contexts]: All[Name] extends boolean ? boolean : All[Name] extends string ? PropType<Contexts[Name]["data"], All[Name], never> extends never ? never : string : All[Name] extends string[] | readonly string[] ? unknown extends PropType<Contexts[Name]["data"], All[Name][number]> ? never : string[] | readonly string[] : never;
    }>(namedRefreshes: Partial<All>, forceTimeout?: number | null): void;
    /** Gets the context locally by name.
     * - Returns undefined if not found, otherwise Context or null if specifically set to null.
     * - This method can be extended to get contexts from elsewhere in addition. (It's used internally all around ContextAPI, except in getContexts and setContext.)
     */
    getContext<Name extends keyof Contexts & string>(name: Name): Contexts[Name] | null | undefined;
    /** Gets the contexts by names. If name not found, not included in the returned dictionary, otherwise the values are Context | null. */
    getContexts<Name extends keyof Contexts & string>(onlyNames?: RecordableType<Name> | null, skipNulls?: true): Partial<ContextsAllTypeWith<Contexts, never, Name>>;
    getContexts<Name extends keyof Contexts & string>(onlyNames?: RecordableType<Name> | null, skipNulls?: boolean | never): Partial<ContextsAllTypeWith<Contexts, null, Name>>;
    /** Create a new context.
     * - If overrideWithName given, then calls setContext automatically with the given name. If empty (default), functions like a simple static function just instantiating a new context with given data.
     * - If overrides by default triggers a refresh call in data listeners in case the context was actually changed. To not do this set refreshIfOverriden to false.
     */
    newContext<CtxData extends Record<string, any> = {}, CtxSignals extends SignalsRecord = {}>(data: CtxData, overrideWithName?: never | "" | undefined, refreshIfOverriden?: never | false): Context<CtxData, CtxSignals>;
    newContext<Name extends keyof Contexts & string>(data: Contexts[Name]["data"], overrideWithName: Name, refreshIfOverriden?: boolean): Contexts[Name];
    /** Same as newContext but for multiple contexts all at once.
     * - If overrideForSelf set to true, call setContexts afterwards with the respective context names in allData. Defaults to false: functions as if a static method.
     * - If overrides by default triggers a refresh call in data listeners in case the context was actually changed. To not do this set refreshIfOverriden to false.
     */
    newContexts<Ctxs extends {
        [Name in keyof AllData & string]: Context<AllData[Name] & {}>;
    }, AllData extends Record<keyof Ctxs & string, Record<string, any>> = {
        [Name in keyof Ctxs & string]: Ctxs[Name]["data"];
    }>(allData: AllData, overrideForSelf?: never | false | undefined, refreshIfOverriden?: never | false): Ctxs;
    newContexts<Name extends keyof Contexts & string>(allData: Partial<Record<Name, Contexts[Name]["data"]>>, overrideForSelf: true, refreshIfOverriden?: boolean): Partial<{
        [Name in keyof Contexts & string]: Contexts[Name]["data"];
    }>;
    /** Attach the context to this ContextAPI by name. Returns true if did attach, false if was already there.
     * - Note that if the context is `null`, it will be kept in the bookkeeping. If it's `undefined`, it will be removed.
     *      * This only makes difference when uses one ContextAPI to inherit its contexts from another ContextAPI.
     */
    setContext<Name extends keyof Contexts & string>(name: Name, context: Contexts[Name] | null | undefined, callDataIfChanged?: boolean): boolean;
    /** Set multiple named contexts in one go. Returns true if did changes, false if didn't. This will only modify the given keys.
     * - Note that if the context is `null`, it will be kept in the bookkeeping. If it's `undefined`, it will be removed.
     *      * This only makes difference when uses one ContextAPI to inherit its contexts from another ContextAPI.
     */
    setContexts(contexts: Partial<{
        [CtxName in keyof Contexts]: Contexts[CtxName] | null | undefined;
    }>, callDataIfChanged?: boolean): boolean;
    /** Assignable getter to call more data listeners when specific contexts are refreshed.
     * - Used internally after setting contexts. If not used, calls `this.callDataBy(ctxNames)` instead.
     * - If ctxDataKeys is true (or undefined), then should refresh all data in all contexts. (Not used internally, but to mirror callDataBy.)
     */
    callDataListenersFor?(ctxDataKeys?: true | GetJoinedDataKeysFrom<GetDataFromContexts<Contexts>>[]): void;
    /** Converts contextual data or signal key to `[ctxName: string, dataSignalKey: string]` */
    static parseContextDataKey(ctxDataSignalKey: string): [ctxName: string, dataSignalKey: string];
    /** Read context names from contextual data keys or signals. */
    static readContextNamesFrom(ctxDataSignalKeys: string[]): string[];
    /** Converts array of context data keys or signals `${ctxName}.${dataSignalKey}` to a dictionary `{ [ctxName]: dataSignalKey[] | true }`, where `true` as value means all in context. */
    static readContextDictionaryFrom(ctxDataKeys: string[]): Record<string, string[] | true>;
}

interface ContextSettings {
    /** Timeout for refreshing for this particular context.
     * - The timeout is used for data refreshing, but also tied to actions called with syncing (like "delay" or "pre-delay").
     *      * Note that "pre-delay" refers to resolving this refreshTimeout, while "delay" is resolved after it once all the related contextAPIs have refreshed.
     * - If null, then synchronous - defaults to 0ms.
     * - Note that if you use null, the updates will run synchronously.
     *      * It's not recommended for normal usage, because you'd have to make sure you always use it in that sense.
     *      * For example, on the next code line (after say, setting data in context) the context have already updated and triggered refreshes all around the app. Maybe instance you called from has alredy unmounted.
     */
    refreshTimeout: number | null;
}
/** Class type for Context class. */
interface ContextType<Data extends Record<string, any> = {}, Signals extends SignalsRecord = SignalsRecord, Settings extends ContextSettings = ContextSettings> extends ClassType<Context<Data, Signals>, [Data?, Partial<ContextSettings>?]>, DataManType<Data>, SignalManType<Signals> {
    /** Extendable static default settings getter. */
    getDefaultSettings<CtxSettings extends Settings & ContextSettings = Settings>(): CtxSettings;
}
/** Context provides signal and data listener features (extending `SignalMan` and `DataMan` basis).
 * - Contexts provide data listening and signalling features.
 *      - Extending SignalMan they allow to send typed signals with special options available through sendSignalAs.
 *          * Furthermore, the "pre-delay" and "delay" signals are synced to the refresh cycles of the context.
 *          * The "pre-delay" signals are triggered right before calling data listeners, and "delay" once all related ContextAPI's have resolved their `awaitRefresh`.
 *      - Extending DataMan they assume a data structure of nested dictionaries.
 *          * For example: `{ something: { deep: boolean; }; simple: string; }`
 *          * The actual values can be anything: static values, functions, arrays, maps, sets, custom classes (including Immutable maps and such).
 *      - When the data is modified, the parenting data dictionaries are shallow copied all the way up to the root data.
 *          * Accordingly, the related data listeners are called (instantly at the level of DataMan).
 *      - Note that the typing data key suggestions won't go inside any non-Object type nor custom classes, only dictionaries.
 *          * Accordingly you should not refer deeper on the JS either, even thought it might work in practice since won't take a shallow copy of non-Objects.
 * - Contexts are useful in complex applications and often shared non-locally (or down the tree) in app structure to provide common data and intercommunication channels.
 *      * For example, you might have several different contexts in your app, and then interconnect them together (if needed).
 * - Contexts are designed to function stand alone, but also to work with ContextAPI instances to sync a bigger whole together.
 *      * The contextAPIs can be connected to multiple named contexts, and listen to data and signals in all of them in sync.
 */
declare class Context<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}, Settings extends ContextSettings = ContextSettings> extends SignalDataMan<Data, Signals> {
    /** This is only provided for typing related technical reasons (so that can access signals typing easier externally). There's no actual _Signals member on the javascript side. */
    _Signals?: Signals;
    ["constructor"]: ContextType<Data, Signals>;
    settings: Settings;
    /** The keys are the ContextAPIs this context is attached to with a name, and the values are the names (typically only one). They are used for refresh related purposes. */
    contextAPIs: Map<ContextAPI, string[]>;
    /** Temporary internal timer marker for refreshing. */
    private _refreshTimer;
    /** Temporary internal callbacks that will be called when the update cycle is done - at the moment of "pre-delay" cycle (after refreshTimeout). */
    private _afterPre?;
    /** Temporary internal callbacks that will be called after the update cycle and the related external refreshes (by contextAPIs) have been flushed - at the moment of "delay" cycle. */
    private _afterPost?;
    constructor(...args: {} extends Data ? [data?: Data, settings?: Partial<Settings> | null | undefined] : [data: Data, settings?: Partial<Settings> | null | undefined]);
    /** Update settings with a dictionary. If any value is `undefined` then uses the existing or default setting. */
    modifySettings(settings: Partial<ContextSettings>): void;
    /** Overridden to support getting signal listeners from related contextAPIs - in addition to direct listeners (which are put first). */
    getListenersFor(signalName: string): SignalListener[] | undefined;
    /** Triggers a refresh and returns a promise that is resolved when the context is refreshed.
     * - If there's nothing pending, then will resolve immediately (by the design of the flow).
     * - The promise is resolved after the "pre-delay" or "delay" cycle has finished depending on the "fullDelay" argument.
     *      * The "pre-delay" (fullDelay = false) uses the time out from settings { refreshTimeout }.
     *      * The "delay" (fullDelay = true) waits for "pre-delay" cycle to happen, and then awaits the promise from `awaitRefresh`.
     *          - The `awaitRefresh` is in turn synced to awaiting the `awaitRefresh` of all the connected contextAPIs.
     * - Note that technically, the system at Context level simply collects an array (per delay type) of one-time promise resolve funcs and calls them at the correct time.
     * - Used internally by setData, setInData, refreshData and sendSignalAs flow.
     */
    afterRefresh(fullDelay?: boolean, forceTimeout?: number | null): Promise<void>;
    /** At the level of Context the `awaitRefresh` is tied to waiting the refresh from all contexts.
     * - It's called by the data refreshing flow after calling the "pre-delay" actions and the data listeners.
     * - Note that this method should not be _called_ externally, but can be overridden externally to affect when "delay" cycle is resolved.
     */
    awaitRefresh(): Promise<void>;
    /** Trigger refresh of the context and optionally add data keys.
     * - This triggers calling pending data keys and delayed signals (when the refresh cycle is executed).
     */
    refreshData<DataKey extends GetJoinedDataKeysFrom<Data>>(dataKeys: DataKey | DataKey[] | boolean | null, forceTimeout?: number | null): void;
    /** Trigger a refresh in the context. Refreshes all pending after a timeout. */
    triggerRefresh(forceTimeout?: number | null): void;
    /** Check whether is waiting to be refreshed. */
    isWaitingForRefresh(): boolean;
    /** Check whether has any reason to be refreshed: checks if there are any pending data keys or signals on the "pre-delay" or "delay" cycle. */
    isPendingRefresh(): boolean;
    /** This refreshes the context immediately.
     * - This is assumed to be called only by the .refresh function above.
     * - So it will mark the timer as cleared, without using clearTimeout for it.
     */
    private refreshPending;
    /** Extendable static default settings getter. */
    static getDefaultSettings<Settings extends ContextSettings = ContextSettings>(): Settings;
}

export { Awaited, ClassMixer, ClassType, CompareDataDepthEnum, CompareDataDepthMode, Context, ContextAPI, ContextAPIType, ContextSettings, ContextType, ContextsAllType, ContextsAllTypeWith, CreateCachedSource, CreateDataSource, DataBoy, DataBoyMixin, DataBoyType, DataExtractor, DataListenerFunc, DataMan, DataManMixin, DataManType, DataTriggerOnMount, DataTriggerOnUnmount, GetConstructorArgs, GetConstructorReturn, GetDataFromContexts, GetJoinedDataKeysFrom, GetJoinedSignalKeysFromContexts, GetSignalsFromContexts, IterateBackwards, PropType, PropTypeArray, PropTypeFallback, PropTypesFromDictionary, RecordableType, SignalDataBoy, SignalDataBoyMixin, SignalDataBoyType, SignalDataMan, SignalDataManMixin, SignalDataManType, SignalListener, SignalListenerFlags, SignalListenerFunc, SignalMan, SignalManMixin, SignalManType, SignalSendAsReturn, SignalsRecord, _DataManMixin, _SignalManMixin, areEqual, askListeners, buildRecordable, callListeners, createCachedSource, createDataMemo, createDataSource, createDataTrigger, createRange, deepCopy, updateCallTimer };
