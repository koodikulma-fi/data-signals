type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
type RecordableType<K extends string> = Partial<Record<K, any>> | Array<K> | Set<K>;
type Dictionary<V = any> = Record<string, V>;
type GetConstructorArgs<T> = T extends new (...args: infer U) => any ? U : never;
/** This senseless types makes the mixin typing work. */
type GetConstructorReturn<T> = T extends new (...args: any[]) => infer U ? U : never;
type ClassType<T = {}, Args extends any[] = any[]> = new (...args: Args) => T;
type ClassMixer<TExtends extends ClassType> = <TBase extends ClassType>(Base: TBase) => Omit<TBase & TExtends, "new"> & {
    new (...args: GetConstructorArgs<TExtends>): GetConstructorReturn<TBase> & GetConstructorReturn<TExtends>;
};
/** Helper to collect up to 10 return types from an array of functions. */
type ReturnTypes<T extends any[] | readonly any[]> = T[0] extends undefined ? [] : T[1] extends undefined ? [ReturnType<T[0]>] : T[2] extends undefined ? [ReturnType<T[0]>, ReturnType<T[1]>] : T[3] extends undefined ? [ReturnType<T[0]>, ReturnType<T[1]>, ReturnType<T[2]>] : T[4] extends undefined ? [ReturnType<T[0]>, ReturnType<T[1]>, ReturnType<T[2]>, ReturnType<T[3]>] : T[5] extends undefined ? [ReturnType<T[0]>, ReturnType<T[1]>, ReturnType<T[2]>, ReturnType<T[3]>, ReturnType<T[4]>] : T[6] extends undefined ? [ReturnType<T[0]>, ReturnType<T[1]>, ReturnType<T[2]>, ReturnType<T[3]>, ReturnType<T[4]>, ReturnType<T[5]>] : T[7] extends undefined ? [ReturnType<T[0]>, ReturnType<T[1]>, ReturnType<T[2]>, ReturnType<T[3]>, ReturnType<T[4]>, ReturnType<T[5]>, ReturnType<T[6]>] : T[8] extends undefined ? [ReturnType<T[0]>, ReturnType<T[1]>, ReturnType<T[2]>, ReturnType<T[3]>, ReturnType<T[4]>, ReturnType<T[5]>, ReturnType<T[6]>, ReturnType<T[7]>] : T[9] extends undefined ? [ReturnType<T[0]>, ReturnType<T[1]>, ReturnType<T[2]>, ReturnType<T[3]>, ReturnType<T[4]>, ReturnType<T[5]>, ReturnType<T[6]>, ReturnType<T[7]>, ReturnType<T[8]>] : [
    ReturnType<T[0]>,
    ReturnType<T[1]>,
    ReturnType<T[2]>,
    ReturnType<T[3]>,
    ReturnType<T[4]>,
    ReturnType<T[5]>,
    ReturnType<T[6]>,
    ReturnType<T[7]>,
    ReturnType<T[8]>,
    ReturnType<T[9]>
];
interface NodeJSTimeout {
    ref(): this;
    unref(): this;
    hasRef(): boolean;
    refresh(): this;
    [Symbol.toPrimitive](): number;
}
type Join<T extends unknown[], D extends string> = T extends [] ? '' : T extends [string | number | boolean | bigint] ? `${T[0]}` : T extends [string | number | boolean | bigint, ...infer U] ? `${T[0]}${D}${Join<U, D>}` : string;
/** Split a string into a typed array.
 * - Use with PropType to validate and get deep value types with, say, dotted strings. */
type Split<S extends string, D extends string> = string extends S ? string[] : S extends '' ? [] : S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [
    S
];
type SplitOnce<S extends string, D extends string> = string extends S ? string[] : S extends '' ? [] : S extends `${infer T}${D}${infer U}` ? [T, U] : [
    S
];
type FirstSplit<S extends string, D extends string> = string extends S ? string : S extends '' ? '' : S extends `${infer T}${D}${string}` ? T : S;
type SecondSplit<S extends string, D extends string> = string extends S ? string : S extends '' ? '' : S extends `${string}${D}${infer T}` ? T : S;
/** Get deep value type. If puts 3rd param to never, then triggers error with incorrect path. */
type PropType<T, Path extends string, Unknown = unknown> = string extends Path ? Unknown : Path extends keyof T ? T[Path] : Path extends `${infer K}.${infer R}` ? K extends keyof T ? PropType<T[K], R, Unknown> : Unknown : Unknown;
/** Get deep props for an array. */
type PropTypeArray<T, Paths extends string[], Unknown = unknown, Index extends number = Paths["length"]> = Index extends 0 ? [] : [
    ...PropTypeArray<T, Paths, Unknown, SafeIterator[Index]>,
    PropType<T, Paths[SafeIterator[Index]], Unknown>
];
/** Get deep props by a dictionary that also implies the fallbacks (when data is not found on the JS side). */
type PropTypeDictionary<T, Fallbacks extends Record<string, any>> = {
    [Key in keyof Fallbacks & string]: PropType<T, Key, Fallbacks[Key]> | Fallbacks[Key];
};
type SafeIterator = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];
/** Collect structural data keys from a deep dictionary as dotted strings.
 * - Does not go inside arrays, sets, maps, immutable objects nor classes or class instances.
 * - By default limits to 10 depth, to not limit at all put MaxDepth to -1.
 * - Can provide <Data, Pre, Joiner, MaxDepth>. Should not provide the last PreVal, it's used internally. */
type GetJoinedDataKeysFrom<Data extends Record<string, any>, Pre extends string = "", Joiner extends string = ".", MaxDepth extends number = 10, PreVal extends string = "" extends Pre ? "" : `${Pre}${Joiner}`> = SafeIterator[MaxDepth] extends never ? never : {
    [Key in string & keyof Data]: Data[Key] extends {
        [key: string]: any;
        [key: number]: never;
    } ? Data[Key] extends {
        asMutable(): Data[Key];
    } ? `${PreVal}${Key}` : string & GetJoinedDataKeysFrom<Data[Key], `${PreVal}${Key}`, Joiner, SafeIterator[MaxDepth]> | `${PreVal}${Key}` : `${PreVal}${Key}`;
}[string & keyof Data];

/** Helper for reusing a timer callback, or potentially forcing an immediate call.
 * - Returns the value that should be assigned as the stored timer (either existing one, new one or null).
 */
declare function callWithTimeout<Timer extends number | NodeJSTimeout>(callback: () => void, currentTimer: Timer | null, defaultTimeout: number | null, forceTimeout?: number | null): Timer | null;
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
 * - Values are: "never" = -3, "always" = -2, "deep" = -1, "changed" = 0, "shallow" = 1, "double" = 2. */
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
/** This helps to create a fully typed data selector with multiple extractors (each outputting any value) as an array.
 * - It returns a callback that can be used for selecting (like in Redux).
 * - The typing supports up to 10 extractors.
 */
type CreateDataSelector<Params extends any[], Data extends any> = <Extractors extends [
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
]>(extractors: Extractors, selector: (...args: ReturnTypes<Extractors>) => Data, depth?: number | CompareDataDepthMode) => (...args: Params) => Data;
/** This helps to create a typed data picker by providing the types for the Params for extractor and Data for output of the selector.
 * - The type return is a function that can be used for triggering the effect (like in Redux).
 * - The extractor can return an array up to 10 typed members.
 */
type CreateDataPicker<Params extends any[] = any[], Data = any> = <Extractor extends ((...args: Params) => [any]) | ((...args: Params) => [any, any]) | ((...args: Params) => [any, any, any]) | ((...args: Params) => [any, any, any, any]) | ((...args: Params) => [any, any, any, any, any]) | ((...args: Params) => [any, any, any, any, any, any]) | ((...args: Params) => [any, any, any, any, any, any, any]) | ((...args: Params) => [any, any, any, any, any, any, any, any]) | ((...args: Params) => [any, any, any, any, any, any, any, any, any]) | ((...args: Params) => [any, any, any, any, any, any, any, any, any, any]), Extracted extends ReturnType<Extractor> = ReturnType<Extractor>>(extractor: Extractor, selector: (...args: Extracted) => Data, depth?: number | CompareDataDepthMode) => (...args: Params) => Data;
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
 * - First define a memo: `const myMemo = createDataMemo((arg1, arg2) => { return "something"; });`.
 * - Then later in repeatable part of code get the value: `const myValue = myMemo(arg1, arg2);`
 * - About arguments:
 *      @param producer Defines the callback
 *      @param depth Defines the comparison depth for comparing previous and new memory arguments - to decide whether to run onMount callback.
 *          - Note that the depth refers to _each_ item in the memory, not the memory argments array as a whole since it's new every time.
 */
declare function createDataMemo<Data extends any, MemoryArgs extends any[]>(producer: (...memory: MemoryArgs) => Data, depth?: number | CompareDataDepthMode): (...memory: MemoryArgs) => Data;
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
 */
declare function createDataTrigger<Memory extends any>(onMount?: DataTriggerOnMount<Memory>, memory?: Memory, depth?: number | CompareDataDepthMode): (newMemory: Memory, forceRun?: boolean, newOnMountIfChanged?: DataTriggerOnMount<Memory> | null) => boolean;
/** Create a data selector: It's like the DataPicker above, but takes in an array of extractors (not just one).
 * - Accordingly the outputs of extractors are then spread out as the arguments for the selector.
 */
declare function createDataSelector<Extractors extends [
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
] | [
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>,
    DataExtractor<Params>
], Data extends any, Params extends any[] = Parameters<Extractors[number]>>(extractors: Extractors, selector: (...args: ReturnTypes<Extractors>) => Data, depth?: number | CompareDataDepthMode): (...args: Params) => Data;
/** Create a data picker (returns a function): It's like Memo but for data with an intermediary extractor.
 * - Give an extractor that extracts an array out of your customly defined arguments. Can return an array up to 10 typed members or more with `[...] as const` trick.
 * - Whenever the extracted output has changed (in shallow sense by default), the selector will be run.
 * - The arguments of the selector is the extracted array spread out, and it should return the output data solely based on them.
 * - The whole point of this abstraction, is to trigger the presumably expensive selector call only when the cheap extractor func tells there's a change.
 */
declare function createDataPicker<Extracted extends [
    any
] | [
    any,
    any
] | [
    any,
    any,
    any
] | [
    any,
    any,
    any,
    any
] | [
    any,
    any,
    any,
    any,
    any
] | [
    any,
    any,
    any,
    any,
    any,
    any
] | [
    any,
    any,
    any,
    any,
    any,
    any,
    any
] | [
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
] | [
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
] | [
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
] | readonly any[], Data extends any, Params extends any[]>(extractor: (...args: Params) => Extracted, selector: (...args: Extracted) => Data, depth?: number | CompareDataDepthMode): (...args: Params) => Data;

declare enum SignalManFlags {
    /** If enabled, removes the listener once it has been fired once. */
    OneShot = 1,
    /** If enabled, calls the listener after a 0ms timeout. Note that this makes the callback's return value always be ignored from the return flow. */
    Deferred = 2,
    None = 0,
    All = 3
}
type SignalListenerFunc = (...args: any[]) => any | void;
type SignalListener<Callback extends SignalListenerFunc = SignalListenerFunc> = [callback: Callback, extraArgs: any[] | null, flags: SignalManFlags, groupId: any | null | undefined, origListeners?: SignalListener[]];
type SignalsRecord = Record<string, SignalListenerFunc>;
type SignalSendAsReturn<OrigReturnVal, HasAwait extends boolean, IsSingle extends boolean, RetVal = true extends HasAwait ? Awaited<OrigReturnVal> : OrigReturnVal, ReturnVal = true extends IsSingle ? RetVal | undefined : RetVal[]> = true extends HasAwait ? Promise<ReturnVal> : ReturnVal;
/** Calls a bunch of listeners and handles SignalManFlags mode.
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
declare function _SignalBoyMixin(Base: ClassType): {
    new (...passArgs: any[]): {
        signals: Record<string, Array<SignalListener>>;
        listenTo(name: string, callback: SignalListenerFunc, extraArgs?: any[], flags?: SignalManFlags, groupId?: any | null): void;
        unlistenTo(names?: string | string[] | null, callback?: SignalListenerFunc | null, groupId?: any | null): void;
        isListening(name?: string | null, callback?: (SignalListenerFunc) | null, groupId?: any | null): any;
        onListener?(name: string, index: number, wasAdded: boolean): void;
    };
};
/** There are two ways you can use this:
 * 1. Call this to give basic SignalBoy features with types for Props and such being empty.
 *      * `class MyMix extends SignalBoyMixin(MyBase) {}`
 * 2. If you want to type the signals (as you very likely do), use this simple trick instead:
 *      * `class MyMix extends (SignalBoyMixin as ClassMixer<typeof SignalBoy<{ someSignal: () => void; }>>)(MyBase) {}`
 */
declare const SignalBoyMixin: ClassMixer<SignalManType>;
declare function _SignalManMixin(Base: ClassType): {
    new (...passArgs: any[]): {
        sendSignal(name: string, ...args: any[]): any;
        sendSignalAs(modes: string | string[], name: string, ...args: any[]): any;
        afterRefresh(fullDelay?: boolean): Promise<void>;
        getListenersFor?(signalName: string): SignalListener[] | undefined;
        signals: Record<string, Array<SignalListener>>;
        listenTo(name: string, callback: SignalListenerFunc, extraArgs?: any[], flags?: SignalManFlags, groupId?: any | null): void;
        unlistenTo(names?: string | string[] | null, callback?: SignalListenerFunc | null, groupId?: any | null): void;
        isListening(name?: string | null, callback?: (SignalListenerFunc) | null, groupId?: any | null): any;
        onListener?(name: string, index: number, wasAdded: boolean): void;
    };
};
/** There are two ways you can use this:
 * 1. Call this to give basic SignalMan features with types for Props and such being empty.
 *      * `class MyMix extends SignalManMixin(MyBase) {}`
 * 2. If you want to type the signals (as you very likely do), use this simple trick instead:
 *      * `class MyMix extends (SignalManMixin as ClassMixer<typeof SignalMan<{ someSignal: () => void; }>>)(MyBase) {}`
 */
declare const SignalManMixin: ClassMixer<SignalManType>;
interface SignalBoyType<Signals extends SignalsRecord = {}> extends ClassType<SignalBoy<Signals>> {
}
declare const SignalBoy_base: ClassType;
/** This is like SignalMan but only provides listening: the sendSignal, sendSignalAs and afterRefresh methods are deleted (for clarity of purpose). */
declare class SignalBoy<Signals extends SignalsRecord = {}> extends SignalBoy_base {
}
interface SignalBoy<Signals extends SignalsRecord = {}> {
    ["constructor"]: SignalBoyType<Signals>;
    /** The stored signal connections. To emit signals use `sendSignal` and `sendSignalAs` methods. */
    signals: Record<string, Array<SignalListener>>;
    /** Assign a listener to a signal. You can also define extra arguments, optional groupId for easy clearing, and connection flags (eg. for one-shot or to defer call).
     * Also checks whether the callback was already attached to the signal, in which case overrides the info. */
    listenTo<Name extends string & keyof Signals>(name: Name, callback: Signals[Name], extraArgs?: any[] | null, flags?: SignalManFlags | null, groupId?: any | null): void;
    /** Clear listeners by names, callback and/or groupId. Each restricts the what is cleared. To remove a specific callback attached earlier, provide name and callback. */
    unlistenTo(names?: (string & keyof Signals) | Array<string & keyof Signals> | null, callback?: SignalListenerFunc | null, groupId?: any | null): void;
    /** Check if any listener exists by the given name, callback and/or groupId. */
    isListening<Name extends string & keyof Signals>(name?: Name | null, callback?: SignalListenerFunc | null, groupId?: any | null): boolean;
    /** Optional local callback handler to keep track of added / removed listeners. Called right after adding and right before removing. */
    onListener?(name: string & keyof Signals, index: number, wasAdded: boolean): void;
}
interface SignalManType<Signals extends SignalsRecord = {}> extends ClassType<SignalMan<Signals>> {
}
declare const SignalMan_base: ClassType;
declare class SignalMan<Signals extends SignalsRecord = {}> extends SignalMan_base {
}
interface SignalMan<Signals extends SignalsRecord = {}> extends SignalBoy<Signals> {
    ["constructor"]: SignalManType<Signals>;
    /** Send a signal. Does not return a value. Use `sendSignalAs(modes, name, ...args)` to refine the behaviour. */
    sendSignal<Name extends string & keyof Signals>(name: Name, ...args: Parameters<Signals[Name]>): void;
    /** This exposes various features to the signalling process which are inputted as the first arg: either string or string[]. Features are:
     * - "delay": Delays sending the signal. To also collect returned values must include "await".
     *      * Note that this delays the start of the process. So if new listeners are attached right after, they'll receive the signal.
     *      * The stand alone SignalMan simply uses setTimeout with 1ms delay. (But an external layer might tie it to its own timing processes, eg. to sync rendering.)
     * - "pre-delay": This is like "delay" but uses 0ms timeout on the standalone SignalMan. (Typically this is arranged so that delays locally, but not pending external delays.)
     * - "await": Awaits each listener (simultaneously) and returns a promise. By default returns the last non-`undefined` value, combine with "multi" to return an array of awaited values (skipping `undefined`).
     *      * Exceptionally if "delay" is on, and there's no "await" then can only return `undefined`, as there's no promise to capture the timed out returns.
     * - "multi": Can be used to force array return even if using "last", "first" or "first-true" - which would otherwise switch to a single value return mode.
     *      * Note that by default, is in multi mode, except if a mode is used that indicates a single value return.
     * - "last": Use this to return the last acceptable value (by default ignoring any `undefined`) - instead of an array of values.
     * - "first": Stops the listening at the first value that is not `undefined` (and not skipped by "no-false" or "no-null"), and returns that single value.
     *      * Note that "first" does not stop the flow when using "await" as the async calls are made simultaneously. But it returns the first acceptable value.
     * - "first-true": Is like "first" but stops only if value amounts to true like: !!value.
     * - "no-false": Ignores any falsifiable values, only accepts: `(!!value)`. So most commonly ignored are: `false`, `0`, `""`, `null´, `undefined`.
     * - "no-null": Ignores any `null` values in addition to `undefined`. (By default only ignores `undefined`.)
     *      * Note also that when returning values, any signal that was connected with .Deferred flag will always be ignored from the return value flow (and called 0ms later, in addition to "delay" timeout).
     */
    sendSignalAs<Name extends string & keyof Signals, Mode extends "" | "pre-delay" | "delay" | "await" | "last" | "first" | "first-true" | "multi" | "no-false" | "no-null", HasAwait extends boolean = Mode extends string[] ? Mode[number] extends "await" ? true : false : Mode extends "await" ? true : false, HasLast extends boolean = Mode extends string[] ? Mode[number] extends "last" ? true : false : Mode extends "last" ? true : false, HasFirst extends boolean = Mode extends string[] ? Mode[number] extends "first" ? true : Mode[number] extends "first-true" ? true : false : Mode extends "first" ? true : Mode extends "first-true" ? true : false, HasMulti extends boolean = Mode extends string[] ? Mode[number] extends "multi" ? true : false : Mode extends "multi" ? true : false, HasDelay extends boolean = Mode extends string[] ? Mode[number] extends "delay" ? true : false : Mode extends "delay" ? true : false, UseSingle extends boolean = true extends HasMulti ? false : HasFirst | HasLast, UseReturnVal extends boolean = true extends HasAwait ? true : true extends HasDelay ? false : true>(modes: Mode | Mode[], name: Name, ...args: Parameters<Signals[Name]>): true extends UseReturnVal ? SignalSendAsReturn<ReturnType<Signals[Name]>, HasAwait, UseSingle> : undefined;
    /** This returns a promise that is resolved after the "pre-delay" or "delay" cycle has finished.
     * - By default uses a timeout of 1ms for fullDelay (for "delay") and 0ms otherwise (for "pre-delay").
     * - This is used internally by the sendSignalAs method with "pre-delay" or "delay". The method can be overridden to provide custom timing. */
    afterRefresh(fullDelay?: boolean): Promise<void>;
    /** Optional assignable method. If used, then this will be used for the signal sending related methods to get all the listeners - instead of this.signals[name]. */
    getListenersFor?(signalName: string & keyof Signals): SignalListener[] | undefined;
}

/** Technically should return void. But for conveniency can return anything - does not use the return value in any case. */
type DataListenerFunc = (...args: any[]) => any | void;
declare function _DataManMixin<Data extends Record<string, any> = {}>(Base: ClassType): {
    new (...args: {} extends Data ? any[] : [Data, ...any[]]): {
        readonly data: Data;
        /** External data listeners.
         * - These are called after the data refreshes, though might be tied to update cycles at an external layer - eg. to refresh the whole app in sync.
         * - The keys are data listener callbacks, and values are: `[fallbackArgs, ...dataNeeds]`.
         */
        dataListeners: Map<DataListenerFunc, [fallbackArgs: any[] | undefined, ...dataNeeds: string[]]>;
        /** The pending data keys - for internal refreshing uses. */
        dataKeysPending: string[] | true | null;
        listenToData(...args: any[]): void;
        /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
        unlistenToData(callback: DataListenerFunc): boolean;
        getData(): Data;
        getInData(dataKey: string, fallback?: any): any;
        setData(data: Data, extend?: boolean, refresh?: boolean, ...timeArgs: any[]): void;
        setInData(dataKey: string, subData: any, extend?: boolean, refresh?: boolean, ...timeArgs: any[]): void;
        /** Trigger refresh and optionally add data keys for refreshing.
         * - This triggers callbacks from dataListeners that match needs in dataKeysPending.
         * - This base implementation just calls the listeners with matching keys immediately / after the given timeout.
         * - Note that you might want to override this method and tie it to some refresh system.
         *      * In that case, remember to feed the keys: `if (dataKeys) this.addRefreshKeys(dataKeys);`
         */
        refreshData(dataKeys?: string | string[] | boolean | null, forceTimeout?: number | null): void;
        /** Note that this only adds the refresh keys but will not refresh. */
        addRefreshKeys(refreshKeys: string | string[] | boolean): void;
        /** Helper to build data arguments with fallbacks.
         * - For example: `getDataArgsBy(["common.user.name", "view.darkMode"])`.
         * - Used internally but can be used for manual purposes.
         */
        getDataArgsBy(needs: GetJoinedDataKeysFrom<Data>[], fallbackArgs?: any[]): any[];
        /** Manually trigger an update based on changes in context. Should not be used in normal circumstances.
         * - Only calls / triggers for refresh by needs related to the given contexts. If ctxNames is true, then all.
         */
        callDataBy(refreshKeys?: true | GetJoinedDataKeysFrom<Data>[]): void;
    };
};
/** There are two ways you can use this:
 * 1. Call this to give basic DataMan features with advanced typing being empty.
 *      * `class MyMix extends DataManMixin(MyBase) {}`
 * 2. If you want to define the Data and Signals types, you can use this trick instead:
 *      * `class MyMix extends (DataManMixin as ClassMixer<DataManType<Data, Signals>>)(MyBase) {}`
 */
declare const DataManMixin: ClassMixer<ClassType<DataMan>>;
interface DataManType<Data extends Record<string, any> = {}> extends ClassType<DataMan<Data>> {
}
declare const DataMan_base: {
    new (...args: any[]): {
        readonly data: {};
        /** External data listeners.
         * - These are called after the data refreshes, though might be tied to update cycles at an external layer - eg. to refresh the whole app in sync.
         * - The keys are data listener callbacks, and values are: `[fallbackArgs, ...dataNeeds]`.
         */
        dataListeners: Map<DataListenerFunc, [fallbackArgs: any[] | undefined, ...dataNeeds: string[]]>;
        /** The pending data keys - for internal refreshing uses. */
        dataKeysPending: string[] | true | null;
        listenToData(...args: any[]): void;
        /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
        unlistenToData(callback: DataListenerFunc): boolean;
        getData(): {};
        getInData(dataKey: string, fallback?: any): any;
        setData(data: {}, extend?: boolean, refresh?: boolean, ...timeArgs: any[]): void;
        setInData(dataKey: string, subData: any, extend?: boolean, refresh?: boolean, ...timeArgs: any[]): void;
        /** Trigger refresh and optionally add data keys for refreshing.
         * - This triggers callbacks from dataListeners that match needs in dataKeysPending.
         * - This base implementation just calls the listeners with matching keys immediately / after the given timeout.
         * - Note that you might want to override this method and tie it to some refresh system.
         *      * In that case, remember to feed the keys: `if (dataKeys) this.addRefreshKeys(dataKeys);`
         */
        refreshData(dataKeys?: string | string[] | boolean | null, forceTimeout?: number | null): void;
        /** Note that this only adds the refresh keys but will not refresh. */
        addRefreshKeys(refreshKeys: string | string[] | boolean): void;
        /** Helper to build data arguments with fallbacks.
         * - For example: `getDataArgsBy(["common.user.name", "view.darkMode"])`.
         * - Used internally but can be used for manual purposes.
         */
        getDataArgsBy(needs: never[], fallbackArgs?: any[]): any[];
        /** Manually trigger an update based on changes in context. Should not be used in normal circumstances.
         * - Only calls / triggers for refresh by needs related to the given contexts. If ctxNames is true, then all.
         */
        callDataBy(refreshKeys?: true | never[]): void;
    };
};
declare class DataMan<Data extends Record<string, any> = {}> extends DataMan_base {
    constructor(...args: {} extends Data ? any[] : [Data, ...any[]]);
}
/** DataMan provides data setting and listening features with dotted strings.
 * - Example to create: `const dataMan = new DataMan({ ...initData });`
 * - Example for listening: `dataMan.listenToData("some.data.key", "another", (some, other) => { ... })`
 * - Example for setting data: `dataMan.setInData("some.data.key", somedata)`
 */
interface DataMan<Data extends Record<string, any> = {}> {
    ["constructor"]: DataManType<Data>;
    readonly data: Data;
    /** External data listeners.
     * - These are called after the data refreshes, though might be tied to update cycles at an external layer - to refresh the whole app in sync.
     * - The keys are data listener callbacks, and values are: `[fallbackArgs, ...dataNeeds]`.
     */
    dataListeners: Map<DataListenerFunc, [fallbackArgs: any[] | undefined, ...needs: string[]]>;
    /** The pending data keys - for internal refreshing uses. */
    dataKeysPending: string[] | true | null;
    /** Listen to data using a dictionary whose keys are data keys and values fallbacks. If you want to strictly define the types in the dictionary add `as const` after its definition. */
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Fallbacks extends Partial<Record<Keys, any>>>(fallbackDictionary: Fallbacks, callback: (values: PropTypeDictionary<Data, Fallbacks>) => void, callImmediately?: boolean): void;
    /** This allows to listen to data by defining specific needs which in turn become the listener arguments.
     * - The needs are defined as dotted strings: For example, `listenToData("user.allowEdit", "themes.darkMode", (allowEdit, darkMode) => { ... });`
     * - By calling this, we both assign a listener but also set data needs to it, so it will only be called when the related data portions have changed.
     * - To remove the listener use `unlistenToData(callback)`.
     */
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Fallback extends [fall1?: any], Callback extends (val1: PropType<Data, Key1, never> | Fallback[0]) => void>(dataKey: Key1, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Fallback extends [fall1?: any, fall2?: any], Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1]) => void>(dataKey1: Key1, dataKey2: Key2, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Fallback extends [fall1?: any, fall2?: any, fall3?: any], Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Fallback extends [fall1?: any, fall2?: any, fall3?: any, fall4?: any], Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Fallback extends [fall1?: any, fall2?: any, fall3?: any, fall4?: any, fall5?: any], Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Fallback extends [fall1?: any, fall2?: any, fall3?: any, fall4?: any, fall5?: any, fall6?: any], Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Key7 extends Keys, Fallback extends [fall1?: any, fall2?: any, fall3?: any, fall4?: any, fall5?: any, fall6?: any, fall7?: any], Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5], val7: PropType<Data, Key7, never> | Fallback[6]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Key7 extends Keys, Key8 extends Keys, Fallback extends [fall1?: any, fall2?: any, fall3?: any, fall4?: any, fall5?: any, fall6?: any, fall7?: any, fall8?: any], Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5], val7: PropType<Data, Key7, never> | Fallback[6], val8: PropType<Data, Key8, never> | Fallback[7]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, dataKey8: Key8, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
    unlistenToData(callback: DataListenerFunc): boolean;
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
     * - Note that the extend functionality should only be used for dictionary objects. Defaults to false, since the sub data is not statically known at DataMan level.
     */
    setInData<DataKey extends GetJoinedDataKeysFrom<Data>, SubData extends PropType<Data, DataKey, never>>(dataKey: DataKey, subData: Partial<SubData>, extend?: true, refresh?: boolean, forceTimeout?: number | null): void;
    setInData<DataKey extends GetJoinedDataKeysFrom<Data>, SubData extends PropType<Data, DataKey, never>>(dataKey: DataKey, subData: SubData, extend?: boolean | undefined, refresh?: boolean, forceTimeout?: number | null): void;
    /** This refreshes both: data & pending signals.
     * - If refreshKeys defined, will add them - otherwise only refreshes pending.
     * - Note that if !!refreshKeys is false, then will not add any refreshKeys. If there were none, will only trigger the signals.
     */
    refreshData<DataKey extends GetJoinedDataKeysFrom<Data>>(dataKeys: DataKey | DataKey[] | boolean, forceTimeout?: number | null): void;
    refreshData<DataKey extends GetJoinedDataKeysFrom<Data>>(dataKeys: DataKey | DataKey[] | boolean, forceTimeout?: number | null): void;
    /** Note that this only adds the refresh keys but will not refresh. */
    addRefreshKeys(refreshKeys?: string | string[] | boolean): void;
}

/** Only for local use. Mixes followingly: `_DataManMixin( _SignalManMixin( Base ) )`. */
declare function _DataSignalManMixin(Base: ClassType): {
    new (...args: any[]): {
        readonly data: {};
        dataListeners: Map<DataListenerFunc, [fallbackArgs: any[] | undefined, ...dataNeeds: string[]]>;
        dataKeysPending: string[] | true | null;
        listenToData(...args: any[]): void;
        unlistenToData(callback: DataListenerFunc): boolean;
        getData(): {};
        getInData(dataKey: string, fallback?: any): any;
        setData(data: {}, extend?: boolean, refresh?: boolean, ...timeArgs: any[]): void;
        setInData(dataKey: string, subData: any, extend?: boolean, refresh?: boolean, ...timeArgs: any[]): void;
        refreshData(dataKeys?: string | string[] | boolean | null, forceTimeout?: number | null): void;
        addRefreshKeys(refreshKeys: string | string[] | boolean): void;
        getDataArgsBy(needs: never[], fallbackArgs?: any[]): any[];
        callDataBy(refreshKeys?: true | never[]): void;
    };
};
/** There are two ways you can use this:
 * 1. Call this to give basic DataSignalMan features with advanced typing being empty.
 *      * `class MyMix extends DataSignalManMixin(MyBase) {}`
 * 2. If you want to define the Data and Signals types, you can use this trick instead:
 *      * `class MyMix extends (DataSignalManMixin as ClassMixer<DataSignalManType<Data, Signals>>)(MyBase) {}`
 */
declare const DataSignalManMixin: ClassMixer<ClassType<DataMan & SignalMan>>;
interface DataSignalManType<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends ClassType<DataSignalMan<Data, Signals>> {
}
declare const DataSignalMan_base: ClassType;
declare class DataSignalMan<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends DataSignalMan_base {
}
interface DataSignalMan<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends DataMan<Data>, SignalMan<Signals> {
    ["constructor"]: DataSignalManType<Data, Signals>;
}

type ContextsAllType = Record<string, Context<any, SignalsRecord>>;
type ContextsAllOrNullType<AllContexts extends ContextsAllType = {}> = {
    [Name in keyof AllContexts]: AllContexts[Name] | null;
};
type GetJoinedDataKeysFromContexts<Contexts extends ContextsAllType> = {
    [CtxName in string & keyof Contexts]: GetJoinedDataKeysFrom<Contexts[CtxName]["data"], CtxName>;
}[string & keyof Contexts];
type GetJoinedSignalKeysFromContexts<Contexts extends ContextsAllType> = {
    [CtxName in string & keyof Contexts]: keyof Contexts[CtxName]["_Signals"] extends string ? `${CtxName}.${keyof Contexts[CtxName]["_Signals"]}` : never;
}[string & keyof Contexts];
type MergeSignalsFromContexts<Ctxs extends ContextsAllType> = {
    [Key in string & GetJoinedSignalKeysFromContexts<Ctxs>]: [(Ctxs[FirstSplit<Key, ".">]["_Signals"] & {})[SecondSplit<Key, ".">]] extends [SignalListenerFunc] ? (Ctxs[FirstSplit<Key, ".">]["_Signals"] & {})[SecondSplit<Key, ".">] : never;
};
type GetDataByContextString<Key extends string, Contexts extends ContextsAllType> = GetDataByContextKeys<SplitOnce<Key, ".">, Contexts>;
type GetDataByContextKeys<CtxKeys extends string[], Contexts extends ContextsAllType> = [
    CtxKeys[0]
] extends [keyof Contexts] ? [
    CtxKeys[1]
] extends [string] ? PropType<Contexts[CtxKeys[0]]["data"], CtxKeys[1], never> : Contexts[CtxKeys[0]]["data"] : never;
type GetDataByContextDictionary<Fallbacks extends Record<string, any>, Contexts extends ContextsAllType> = {
    [Key in keyof Fallbacks & string]: Key extends `${infer ContextName}.${infer DataKey}` ? PropType<(Contexts[ContextName] & {})["data"], DataKey, Fallbacks[Key]> | Fallbacks[Key] : never;
};
/** Builds a record of { [key]: trueFalseLike }, which is useful for internal quick checks. */
declare function buildRecordable<T extends string = any>(types: RecordableType<T>): Partial<Record<T, any>>;
/** Class type of ContextAPI. */
interface ContextAPIType<Contexts extends ContextsAllType = {}, CtxSignals extends SignalsRecord = MergeSignalsFromContexts<Contexts>> extends ClassType<ContextAPI<Contexts, CtxSignals>> {
}
/** ContextAPI looks like it has full SignalMan and DataMan capabilities but only extends SignalBoy internally.
 * - It has all the same methods, but does not have .data member and data listening can have a fallback array.
 * - All data keys and signal names should start with "contextName.", for example: "settings.theme" data key or "navigation.onFocus" signal.
 */
declare class ContextAPI<Contexts extends ContextsAllType = {}, CtxSignals extends SignalsRecord = MergeSignalsFromContexts<Contexts>> extends SignalBoy<CtxSignals> {
    ["constructor"]: ContextAPIType<Contexts, CtxSignals>;
    /** Data needs mapping using the callback as the key and value contains: `[ fallbackArgs, ...needs ]`. The data needs are also used as to get the argument values for the callback. */
    dataListeners: Map<DataListenerFunc, [fallbackArgs: any[] | undefined, ...needs: string[]]>;
    /** All the contexts assigned to us.
     * - They also have a link back to us by context.contextAPIs, with this as the key and context names as the values.
     * - Note that can also set `null` value here - for purposefully excluding an inherited context (when using one contextAPI to inherit contexts from another).
     *      * But `undefined` will never be found in here - if gives to the setContext, it means deleting the entry from the record.
     */
    contexts: Partial<Record<string, Context<any, SignalsRecord> | null>>;
    constructor(contexts?: Partial<Contexts>);
    /** This triggers a refresh and returns a promise that is resolved when the update cycle is completed.
     * - If there's nothing pending, then will resolve immediately.
     * - This uses the signals system, so the listener is called among other listeners depending on the adding order.
     * - Note that this method is overrideable. On the basic implementation it resolves immediately.
     *      * However, on an external layer, it might be tied to an update cycle - to provide the bridge for syncing the "delay" signals.
     */
    afterRefresh(fullDelay?: boolean, forceTimeout?: number | null): Promise<void>;
    /** Emit a signal. Does not return a value. Use `sendSignalAs(modes, ctxSignalName, ...args)` to refine the behaviour. */
    sendSignal<CtxSignalName extends string & keyof CtxSignals, CtxName extends keyof Contexts & FirstSplit<CtxSignalName, ".">, SignalName extends string & SecondSplit<CtxSignalName, ".">>(ctxSignalName: CtxSignalName, ...args: Parameters<(Contexts[CtxName]["_Signals"] & {})[SignalName]>): void;
    /** This exposes various features to the signalling process which are inputted as the first arg: either string or string[]. Features are:
     * - "delay": Delays sending the signal. To also collect returned values must include "await".
     *      * Note that this delays the process to sync with the Context's refresh cycle, and waits until all related contextAPIs have refreshed. (In an external layer, often further tied to other update cycles, like rendering.)
     * - "pre-delay": Like "delay", syncs to the Context's refresh cycle, but calls then on that cycle - without waiting external flush (from other contextAPIs connected to the same context network).
     * - "await": Awaits each listener (simultaneously) and returns a promise. By default returns the last non-`undefined` value, combine with "multi" to return an array of awaited values (skipping `undefined`).
     *      * Exceptionally if "delay" is on, and there's no "await" then can only return `undefined`, as there's no promise to capture the timed out returns.
     * - "multi": This is the default mode: returns an array of values ignoring any `undefined`.
     *      * Inputting this mode makes no difference. It's just provided for typing convenience when wants a list of answers without anything else (instead of inputting "").
     * - "last": Use this to return the last acceptable value (by default ignoring any `undefined`) - instead of an array of values.
     * - "first": Stops the listening at the first value that is not `undefined` (and not skipped by "no-false" or "no-null"), and returns that single value.
     *      * Note that "first" does not stop the flow when using "await" as the async calls are made simultaneously. But it returns the first acceptable value.
     * - "first-true": Is like "first" but stops only if value amounts to true like: !!value.
     * - "no-false": Ignores any falsifiable values, only accepts: `(!!value)`. So most commonly ignored are: `false`, `0`, `""`, `null´, `undefined`.
     * - "no-null": Ignores any `null` values in addition to `undefined`. (By default only ignores `undefined`.)
     *      * Note also that when returning values, any signal that was connected with .Deferred flag will always be ignored from the return value flow (and called 0ms later, in addition to "delay" timeout).
     * - Note that ContextAPI's sendSignal and sendSignalAs will use the contexts methods if found. If context not found immediately when called, then does nothing.
     */
    sendSignalAs<CtxSignalName extends string & keyof CtxSignals, Mode extends "" | "pre-delay" | "delay" | "await" | "last" | "first" | "first-true" | "multi" | "no-false" | "no-null", HasAwait extends boolean = Mode extends string[] ? Mode[number] extends "await" ? true : false : Mode extends "await" ? true : false, HasLast extends boolean = Mode extends string[] ? Mode[number] extends "last" ? true : false : Mode extends "last" ? true : false, HasFirst extends boolean = Mode extends string[] ? Mode[number] extends "first" ? true : Mode[number] extends "first-true" ? true : false : Mode extends "first" ? true : Mode extends "first-true" ? true : false, HasMulti extends boolean = Mode extends string[] ? Mode[number] extends "multi" ? true : false : Mode extends "multi" ? true : false, HasDelay extends boolean = Mode extends string[] ? Mode[number] extends "delay" ? true : false : Mode extends "delay" ? true : false, HasPreDelay extends boolean = Mode extends string[] ? Mode[number] extends "pre-delay" ? true : false : Mode extends "pre-delay" ? true : false, UseSingle extends boolean = true extends HasMulti ? false : HasFirst | HasLast, UseReturnVal extends boolean = true extends HasAwait ? true : true extends HasDelay | HasPreDelay ? false : true>(modes: Mode | Mode[], ctxSignalName: CtxSignalName, ...args: Parameters<CtxSignals[CtxSignalName]>): true extends UseReturnVal ? SignalSendAsReturn<ReturnType<CtxSignals[CtxSignalName]>, HasAwait, UseSingle> : undefined;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Fallback extends [fall1?: any], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0]) => void>(dataKey1: Key1, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Fallback extends [fall1?: any, fall2?: any], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1]) => void>(dataKey1: Key1, dataKey2: Key2, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Fallback extends [fall1?: any, fall2?: any, fall3?: any], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1], val3: GetDataByContextString<Key3, Contexts> | Fallback[2]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Fallback extends [fall1?: any, fall2?: any, fall3?: any, fall4?: any], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1], val3: GetDataByContextString<Key3, Contexts> | Fallback[2], val4: GetDataByContextString<Key4, Contexts> | Fallback[3]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Fallback extends [fall1?: any, fall2?: any, fall3?: any, fall4?: any, fall5?: any], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1], val3: GetDataByContextString<Key3, Contexts> | Fallback[2], val4: GetDataByContextString<Key4, Contexts> | Fallback[3], val5: GetDataByContextString<Key5, Contexts> | Fallback[4]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Fallback extends [fall1?: any, fall2?: any, fall3?: any, fall4?: any, fall5?: any, fall6?: any], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1], val3: GetDataByContextString<Key3, Contexts> | Fallback[2], val4: GetDataByContextString<Key4, Contexts> | Fallback[3], val5: GetDataByContextString<Key5, Contexts> | Fallback[4], val6: GetDataByContextString<Key6, Contexts> | Fallback[5]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Key7 extends Keys, Fallback extends [fall1?: any, fall2?: any, fall3?: any, fall4?: any, fall5?: any, fall6?: any, fall7?: any], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1], val3: GetDataByContextString<Key3, Contexts> | Fallback[2], val4: GetDataByContextString<Key4, Contexts> | Fallback[3], val5: GetDataByContextString<Key5, Contexts> | Fallback[4], val6: GetDataByContextString<Key6, Contexts> | Fallback[5], val7: GetDataByContextString<Key7, Contexts> | Fallback[6]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Key7 extends Keys, Key8 extends Keys, Fallback extends [fall1?: any, fall2?: any, fall3?: any, fall4?: any, fall5?: any, fall6?: any, fall7?: any, fall8?: any], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1], val3: GetDataByContextString<Key3, Contexts> | Fallback[2], val4: GetDataByContextString<Key4, Contexts> | Fallback[3], val5: GetDataByContextString<Key5, Contexts> | Fallback[4], val6: GetDataByContextString<Key6, Contexts> | Fallback[5], val7: GetDataByContextString<Key7, Contexts> | Fallback[6], val8: GetDataByContextString<Key8, Contexts> | Fallback[7]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, dataKey8: Key8, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    /** Listen to data using a dictionary whose keys are dotted data keys and values fallback for each. If wanting to strictly define the types in the dictionary, add `as const` after its definition. */
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Fallbacks extends Partial<Record<Keys, any>>>(fallbackDictionary: Fallbacks, callback: (values: GetDataByContextDictionary<Fallbacks, Contexts>) => void, callImmediately?: boolean): void;
    /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
    unlistenToData(callback: DataListenerFunc): boolean;
    /** Get from contextual data by dotted key: eg. `"someCtxName.someData.someProp"`.
     * - If the context exists uses the getInData method from the context, otherwise returns undefined or the fallback. (The fallback is also used if the data key not found in context data.)
     */
    getInData<CtxDataKey extends GetJoinedDataKeysFromContexts<Contexts>, SubData extends GetDataByContextString<CtxDataKey, Contexts>>(ctxDataKey: CtxDataKey, fallback?: never | undefined): SubData | undefined;
    getInData<CtxDataKey extends GetJoinedDataKeysFromContexts<Contexts>, SubData extends GetDataByContextString<CtxDataKey, Contexts>, FallbackData extends any>(ctxDataKey: CtxDataKey, fallback: FallbackData): SubData | FallbackData;
    /** Set in contextual data by dotted key: eg. `"someCtxName.someData.someProp"`.
     * - Sets the data in the context, if context found, and triggers refresh (by default). If the sub data is an object, can also extend.
     * - Note that if the context is found, using this triggers the contextual data listeners (with default or forced timeout). */
    setInData<CtxDataKey extends GetJoinedDataKeysFromContexts<Contexts>, SubData extends GetDataByContextString<CtxDataKey, Contexts>>(ctxDataKey: CtxDataKey, data: Partial<SubData> & Dictionary, extend?: true, refresh?: boolean, forceTimeout?: number | null): void;
    setInData<CtxDataKey extends GetJoinedDataKeysFromContexts<Contexts>, SubData extends GetDataByContextString<CtxDataKey, Contexts>>(ctxDataKey: CtxDataKey, data: SubData, extend?: boolean, refresh?: boolean, forceTimeout?: number | null): void;
    /** Manually trigger refresh without setting the data using a dotted key (or an array of them) with context name: eg. `"someCtxName.someData.someProp"`. */
    refreshData<CtxDataKey extends GetJoinedDataKeysFromContexts<Contexts>>(ctxDataKeys: CtxDataKey | CtxDataKey[], forceTimeout?: number | null): void;
    /** Manually trigger refresh by multiple refreshKeys for multiple contexts.
     * - Note that unlike the other data methods in the ContextAPI, this one separates the contextName and the keys: `{ [contextName]: dataKeys }`
     * - The data keys can be `true` to refresh all in the context, or a dotted string or an array of dotted strings to refresh multiple separate portions simultaneously. */
    refreshDataBy<All extends {
        [Name in keyof Contexts]: All[Name] extends boolean ? boolean : All[Name] extends string ? PropType<Contexts[Name]["data"], All[Name], never> extends never ? never : string : All[Name] extends string[] | readonly string[] ? unknown extends PropType<Contexts[Name]["data"], All[Name][number]> ? never : string[] | readonly string[] : never;
    }>(namedRefreshes: Partial<All>, forceTimeout?: number | null): void;
    /** Gets the context locally by name. Returns null if not found, otherwise Context.
     * - This method can be extended to get contexts from elsewhere in addition. (It's used internally all around ContextAPI, except in getContexts and setContext.)
     */
    getContext<Name extends keyof Contexts & string>(name: Name): Contexts[Name] | null | undefined;
    /** Gets the contexts by names. If name not found, not included in the returned dictionary, otherwise the values are Context | null. */
    getContexts<Name extends keyof Contexts & string>(onlyNames?: RecordableType<Name> | null): Partial<Record<string, Context | null>> & Partial<ContextsAllOrNullType<Contexts>>;
    /** This creates a new context - presumably to be attached with .contexts prop.
     * - If overrideWithName given, then calls setContext automatically with the given name. */
    newContext<CtxData extends Record<string, any> = {}, CtxSignals extends SignalsRecord = {}>(data: CtxData, overrideWithName?: never | "" | undefined, refreshIfOverriden?: never | false): Context<CtxData, CtxSignals>;
    newContext<Name extends keyof Contexts & string>(data: Contexts[Name]["data"], overrideWithName: Name, refreshIfOverriden?: boolean): Contexts[Name];
    /** Same as newContext but for multiple contexts all at once.
     * - If overrideForSelf set to true, will call setContexts after to attach the contexts here. */
    newContexts<Contexts extends {
        [Name in keyof AllData & string]: Context<AllData[Name] & {}>;
    }, AllData extends Record<keyof Contexts & string, Record<string, any>> = {
        [Name in keyof Contexts & string]: Contexts[Name]["data"];
    }>(allData: AllData, overrideForSelf?: never | false | undefined, refreshIfOverriden?: never | false): Contexts;
    newContexts<Name extends keyof Contexts & string>(allData: Partial<Record<Name, Contexts[Name]["data"]>>, overrideForSelf: true, refreshIfOverriden?: boolean): Partial<Record<Name, Contexts[Name]["data"]>>;
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
    /** Helper to build data arguments from this ContextAPI's contextual connections with the given data needs args.
     * - For example: `getDataArgsBy(["settings.user.name", "themes.darkMode"])`.
     * - Used internally but can be used for manual purposes. Does not support typing like listenToData - just string[].
     */
    getDataArgsBy(needs: string[], fallbackArgs?: any[]): any[];
    /** Manually trigger an update based on changes in context. Should not be used in normal circumstances.
     * - Only calls / triggers for refresh by needs related to the given contexts. If ctxNames is true, then all.
     */
    callDataBy(ctxDataKeys?: true | GetJoinedDataKeysFromContexts<Contexts>[]): void;
    /** Assignable getter to collect more signal listeners for a call through a specific context name. */
    getListenersFor?<CtxName extends string & keyof Contexts>(ctxName: CtxName, signalName: string & keyof Contexts[CtxName]["_Signals"]): SignalListener[] | undefined;
    /** Assignable getter to call more data listeners when specific context names are refreshed. */
    callDataListenersFor?(ctxNames: string[], dataKeys?: true | string[]): void;
}

type ContextSettings = {
    /** Timeout for refreshing for this particular context.
     * - The timeout is used for data refreshing, but also tied to actions called with syncing (like "delay" or "pre-delay").
     *      * Note that "pre-delay" refers to resolving this refreshTimeout, while "delay" is resolved after it once all the related contextAPIs have refreshed.
     * - If null, then synchronous - defaults to 0ms.
     * - Note that if you use null, the updates will run synchronously.
     *      * It's not recommended for normal usage, because you'd have to make sure you always use it in that sense.
     *      * For example, on the next code line (after say, setting data in context) the context have already updated and triggered refreshes all around the app. Maybe instance you called from has alredy unmounted.
     */
    refreshTimeout: number | null;
};
/** Context provides signal and data listener features (extending `SignalMan` and `DataMan` basis).
 * - Contexts provide data listening and signalling features.
 * - Contexts are useful in complex applications and often shared non-locally (or down the tree) in app structure to provide common data and intercommunication channels.
 *      * For example, you might have several different contexts in your app, and then interconnect them together (if needed).
 * - Contexts are designed to function stand alone, but also to work with ContextAPI instances to sync a bigger whole together.
 *      * The contextAPIs can be connected to multiple named contexts, and listen to data and signals in all of them.
 *      * In this usage, the "pre-delay" signals are tied to the Context's own refresh, while "delay" happens after all the related contextAPIs have also refreshed (= after their afterRefresh promise has resolved).
 */
declare class Context<Data extends Record<string, any> = {}, Signals extends SignalsRecord = any> extends DataSignalMan<Data, Signals> {
    /** This is only provided for typing related technical reasons (so that can access signals typing easier externally). There's no actual _Signals member on the javascript side. */
    _Signals?: Signals;
    ["constructor"]: ContextType<Data, Signals>;
    settings: ContextSettings;
    /** The keys are the ContextAPIs this context is attached to with a name, and the values are the names (typically only one). They are used for refresh related purposes. */
    contextAPIs: Map<ContextAPI, string[]>;
    /** Temporary internal timer marker for refreshing. */
    private _refreshTimer;
    /** Temporary internal callbacks that will be called when the update cycle is done - at the moment of "pre-delay" cycle (after refreshTimeout). */
    private _afterPre?;
    /** Temporary internal callbacks that will be called after the update cycle and the related external refreshes (by contextAPIs) have been flushed - at the moment of "delay" cycle. */
    private _afterPost?;
    constructor(data: Data, settings?: Partial<ContextSettings> | null | undefined);
    /** Overridden to support getting signal listeners from related contextAPIs - in addition to direct listeners (which are put first). */
    getListenersFor(signalName: string): SignalListener[] | undefined;
    /** This returns a promise that is resolved when the context is refreshed, or after all the related contextAPIs have refreshed (based on their afterRefresh promise). */
    afterRefresh(fullDelay?: boolean, forceTimeout?: number | null): Promise<void>;
    /** Trigger refresh of the context and optionally add data keys.
     * - This triggers calling pending data keys and delayed signals (when the refresh cycle is executed).
     */
    refreshData<DataKey extends GetJoinedDataKeysFrom<Data & {}>>(dataKeys: DataKey | DataKey[] | boolean | null, forceTimeout?: number | null): void;
    /** Trigger a refresh in the context. Refreshes all pending after a timeout. */
    triggerRefresh(forceTimeout?: number | null): void;
    /** Check whether is waiting to be refreshed. */
    isWaitingForRefresh(): boolean;
    /** This refreshes the context immediately.
     * - This is assumed to be called only by the .refresh function above.
     * - So it will mark the timer as cleared, without using clearTimeout for it.
     */
    private refreshPending;
    /** Update settings with a dictionary. If any value is `undefined` then uses the default setting. */
    modifySettings(settings: Partial<ContextSettings>): void;
    /** Extendable static default settings getter. */
    static getDefaultSettings(): ContextSettings;
}
type ContextType<Data extends Record<string, any> = {}, Signals extends SignalsRecord = SignalsRecord> = ClassType<Context<Data, Signals>, [Data?, Partial<ContextSettings>?]> & {
    getDefaultSettings(): ContextSettings;
};

export { Awaited, ClassMixer, ClassType, CompareDataDepthEnum, CompareDataDepthMode, Context, ContextAPI, ContextAPIType, ContextSettings, ContextType, ContextsAllOrNullType, ContextsAllType, CreateDataPicker, CreateDataSelector, DataExtractor, DataListenerFunc, DataMan, DataManMixin, DataManType, DataSignalMan, DataSignalManMixin, DataSignalManType, DataTriggerOnMount, DataTriggerOnUnmount, Dictionary, FirstSplit, GetConstructorArgs, GetConstructorReturn, GetDataByContextDictionary, GetDataByContextKeys, GetDataByContextString, GetJoinedDataKeysFrom, GetJoinedDataKeysFromContexts, GetJoinedSignalKeysFromContexts, Join, MergeSignalsFromContexts, NodeJSTimeout, PropType, PropTypeArray, PropTypeDictionary, RecordableType, ReturnTypes, SecondSplit, SignalBoy, SignalBoyMixin, SignalBoyType, SignalListener, SignalListenerFunc, SignalMan, SignalManFlags, SignalManMixin, SignalManType, SignalSendAsReturn, SignalsRecord, Split, SplitOnce, _DataManMixin, _DataSignalManMixin, _SignalBoyMixin, _SignalManMixin, areEqual, askListeners, buildRecordable, callListeners, callWithTimeout, createDataMemo, createDataPicker, createDataSelector, createDataTrigger, deepCopy };
