import { IterateBackwards, ClassType, AsClass, ReClass, GetConstructorArgs } from 'mixin-types';

/** Typing for NodeJS side timers. */
interface NodeJSTimeout {
    ref(): this;
    unref(): this;
    hasRef(): boolean;
    refresh(): this;
    [Symbol.toPrimitive](): number;
}
/** Awaits the value from a promise. */
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
/** Type for holding keys as a dictionary, array or set. Useful for name checking. */
type SetLike<K extends string> = Partial<Record<K, any>> | Array<K> | Set<K>;
/** Returns true if type is `any`, otherwise false. */
type IsAny<T> = (any extends T ? true : false) extends true ? true : false;
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
type PropTypeArray<T extends Record<string, any>, Paths extends Array<string | undefined>, Fallbacks extends any[] = Paths, Index extends number = Paths["length"]> = IsAny<T> extends true ? any[] : Index extends 0 ? [] : [
    ...PropTypeArray<T, Paths, Fallbacks, IterateBackwards[Index]>,
    PropTypeFallback<T, Paths[IterateBackwards[Index]] & string, Fallbacks[IterateBackwards[Index]]>
];
/** Collect structural data keys from a deep dictionary as dotted strings.
 * - Does not go inside arrays, sets, maps, immutable objects nor classes or class instances.
 *      * Note. By cutting class instances also cuts any `interface` sub types, only use `type` for sub data.
 * - By default limits to 10 depth, to not limit at all put MaxDepth to -1.
 * - Can provide <Data, InterfaceLevel, Pre, Joiner, MaxDepth>. Should not provide the last PreVal, it's used internally.
 * - If InterfaceLevel is never, allows interfaces all the way through - not recommended. Defaults to 0, no interfaces.
 */
type GetJoinedDataKeysFrom<Data extends Record<string, any>, InterfaceLevel extends number = 0, Pre extends string = "", Joiner extends string = ".", MaxDepth extends number = 10, PreVal extends string = "" extends Pre ? "" : `${Pre}${Joiner}`> = IsAny<Data> extends true ? any : IterateBackwards[MaxDepth] extends never ? never : {
    [Key in string & keyof Data]: (0 extends InterfaceLevel ? IsDeepPropertyType<Data, Key> : IsDeepPropertyInterface<Data, Key>) extends true ? string & GetJoinedDataKeysFrom<Data[Key] & {}, InterfaceLevel extends 0 ? 0 : IterateBackwards[InterfaceLevel], `${PreVal}${Key}`, Joiner, IterateBackwards[MaxDepth]> | `${PreVal}${Key}` : `${PreVal}${Key}`;
}[string & keyof Data];
/** Check if the next level property is deep or not. Skipping arrays, sets, maps, immutable likes, class types, class instances and interfaces. */
type IsDeepPropertyType<Data extends Record<string, any>, Prop extends keyof Data & string> = Data[Prop] & {} extends {
    [x: string]: any;
    [y: number]: never;
} ? Data[Prop] & {} extends Iterable<any> ? false : true : false;
/** Check if the next level property is deep or not. Skipping arrays, sets, maps, immutable likes and class types - but including class instances and interfaces. */
type IsDeepPropertyInterface<Data extends Record<string, any>, Prop extends keyof Data & string> = Data[Prop] & {} extends Record<string, any> ? Data[Prop] & {} extends Iterable<any> | ClassType ? false : true : false;

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
/** Calls a bunch of listeners and handles SignalListenerFlags mode.
 * - If OneShot flag used, removes from given listeners array.
 * - If Deferred flag is used, calls the listener after 0ms timeout.
 * - Does not collect return values. Just for emitting out without hassle.
 */
declare function callListeners(listeners: SignalListener[], args?: any[] | null): void;
/** The static class side typing for SignalBoy. */
interface SignalBoyType<Signals extends SignalsRecord = {}> extends ClassType<SignalBoy<Signals>> {
    /** Optional method to keep track of added / removed listeners. Called right after adding and right before removing. */
    onListener?(signalBoy: SignalBoy, name: string, index: number, wasAdded: boolean): void;
    /** Optional method to get the listeners for the given signal. If used it determines the listeners, if not present then uses this.signals[name] instead. Return undefined to not call anything. */
    getListenersFor?(signalBoy: SignalBoy, signalName: string): SignalListener[] | undefined;
}
declare const SignalBoy_base: ReClass<SignalBoyType<{}>, {}, any[]>;
/** SignalBoy provides very simple signal listening and sending features. Use the `listenTo` method for listening and `sendSignal` for sending. */
declare class SignalBoy<Signals extends SignalsRecord = {}> extends SignalBoy_base {
}
interface SignalBoy<Signals extends SignalsRecord = {}> {
    /** The stored signal connections. To emit signals use `sendSignal` and `sendSignalAs` methods. */
    signals: Record<string, Array<SignalListener>>;
    /** Assign a listener to a signal.
     * - You can also define extra arguments, optional groupId for easy clearing, and connection flags (eg. for one-shot or to defer call).
     * - Also checks whether the callback was already attached to the signal, in which case overrides the info.
     */
    listenTo<Name extends string & keyof Signals>(name: Name, callback: Signals[Name], extraArgs?: any[] | null, flags?: SignalListenerFlags | null, groupId?: any | null): void;
    /** Clear listeners by names, callback and/or groupId. Each restricts the what is cleared. To remove a specific callback attached earlier, provide name and callback. */
    unlistenTo(names?: (string & keyof Signals) | Array<string & keyof Signals> | null, callback?: SignalListenerFunc | null, groupId?: any | null): void;
    /** Check if any listener exists by the given name, callback and/or groupId. */
    isListening<Name extends string & keyof Signals>(name?: Name | null, callback?: SignalListenerFunc | null, groupId?: any | null): boolean;
    /** Send a signal. Does not return a value. Use `sendSignalAs(modes, name, ...args)` to refine the behaviour. */
    sendSignal<Name extends string & keyof Signals>(name: Name, ...args: Parameters<Signals[Name]>): void;
}
/** Add SignalBoy features to a custom class. Provide the BaseClass type specifically as the 2nd type argument.
 * - For examples of how to use mixins see `mixinDataMan` comments or [mixin-types README](https://github.com/koodikulma-fi/mixin-types).
 */
declare function mixinSignalBoy<Signals extends SignalsRecord = {}, BaseClass extends ClassType = ClassType>(Base: BaseClass): AsClass<SignalBoyType<Signals> & BaseClass, SignalBoy<Signals> & InstanceType<BaseClass>, any[]>;

type SignalSendAsReturn<OrigReturnVal, HasAwait extends boolean, IsSingle extends boolean, RetVal = true extends HasAwait ? Awaited<OrigReturnVal> : OrigReturnVal, ReturnVal = true extends IsSingle ? RetVal | undefined : RetVal[]> = true extends HasAwait ? Promise<ReturnVal> : ReturnVal;
/** Emits the signal and collects the answers given by each listener ignoring `undefined` as an answer.
 * - By default, returns a list of answers. To return the last one, include "last" in the modes array.
 * - To stop at the first accepted answer use "first" mode or "first-true" mode.
 * - Always skips `undefined` as an answer. To skip `null` too use "no-null" mode, or any falsifiable with `no-false`.
 */
declare function askListeners(listeners: SignalListener[], args?: any[] | null, modes?: Array<"" | "no-false" | "no-null" | "last" | "first" | "first-true">): any;
/** The static class side typing for SignalMan. */
interface SignalManType<Signals extends SignalsRecord = {}> extends AsClass<SignalBoyType<Signals>, SignalBoy<Signals> & SignalMan<Signals>, [...args: any[]]> {
}
declare const SignalMan_base: ReClass<SignalBoyType<{}>, {}, any[]>;
/** SignalMan provides simple and complex signal listening and sending features. Use the `listenTo` method for listening and `sendSignal` or `sendSignalAs` for sending. */
declare class SignalMan<Signals extends SignalsRecord = {}> extends SignalMan_base {
}
interface SignalMan<Signals extends SignalsRecord = {}> extends SignalBoy<Signals> {
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
     *      * By default uses a timeout of 0ms for "pre-delay" and after that awaits the promise from `awaitDelay` for full "delay".
     * - Note that at the level of SignalMan there is nothing to "refresh". However, if extended by a class where refreshing makes sense, this should trigger refreshing first.
     * - Used internally by sendSignalAs flow for its "pre-delay" and "delay" signals.
     */
    afterRefresh(fullDelay?: boolean): Promise<void>;
    /** Should not be called externally, but only overridden externally to determine the timing of the "delay" signals (after "pre-delay").
     * - If not present (default), then is resolved immediately. Otherwise awaits the method.
     * - Used internally through afterRefresh flow.
     */
    awaitDelay?(): Promise<void>;
}
/** Add SignalMan features to a custom class. Provide the BaseClass type specifically as the 2nd type argument.
 * - For examples of how to use mixins see `mixinDataMan` comments or [mixin-types README](https://github.com/koodikulma-fi/mixin-types).
 */
declare function mixinSignalMan<Signals extends SignalsRecord = {}, BaseClass extends ClassType = ClassType>(Base: BaseClass): AsClass<SignalManType<Signals> & BaseClass, SignalMan<Signals> & InstanceType<BaseClass>, any[]>;

/** Technically should return void. But for conveniency can return anything - does not use the return value in any case. */
type DataListenerFunc = (...args: any[]) => any | void;
/** The static class side typing for DataBoy. */
interface DataBoyType<Data extends Record<string, any> = {}, InterfaceLevel extends number | never = 0> extends ClassType<DataBoy<Data, InterfaceLevel>> {
    /** Assignable getter to call more data listeners when callDataBy is used.
     * - If dataKeys is true (or undefined), then should refresh all data.
     * - Note. To use the default callDataBy implementation from the static side put 2nd arg to true: `dataBoy.callDataBy(dataKeys, true)`.
     * - Note. Put as static to keep the public instance API clean. The method needs to be public for internal use of extending classes.
     */
    callDataListenersFor?(dataBoy: DataBoy<any>, dataKeys?: true | string[]): void;
}
declare const DataBoy_base: ReClass<DataBoyType<{}, 0>, {}, any[]>;
/** DataBoy is like DataMan but only provides data listening, not actual data.
 * - Regardless of having no data, it assumes a custom data structure of nested dictionaries.
 *      * For example: `{ something: { deep: boolean; }; simple: string; }`
 * - It provides listening services using the listenToData method, eg. `listenToData("something.deep", (deep) => {})`.
 * - Examples for usage:
 *      * Create: `const dataMan = new DataMan({ ...initData });`
 *      * Listen: `dataMan.listenToData("something.deep", "another", (some, other) => { ... }, [...fallbackArgs])`
 *      * Set data: `dataMan.setInData("something.deep", somedata)`
 */
declare class DataBoy<Data extends Record<string, any> = {}, InterfaceLevel extends number | never = 0> extends DataBoy_base {
}
interface DataBoy<Data extends Record<string, any> = {}, InterfaceLevel extends number | never = 0> {
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
    listenToData<Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, Fallbacks extends Partial<Record<Keys, any>>>(fallbackDictionary: keyof Fallbacks extends Keys ? Fallbacks : never, callback: (values: PropTypesFromDictionary<Data, Fallbacks>) => void, callImmediately?: boolean): void;
    /** This allows to listen to data by defining specific needs which in turn become the listener arguments.
     * - The needs are defined as dotted strings: For example, `listenToData("user.allowEdit", "themes.darkMode", (allowEdit, darkMode) => { ... });`
     * - By calling this, we both assign a listener but also set data needs to it, so it will only be called when the related data portions have changed.
     * - To remove the listener use `unlistenToData(callback)`.
     */
    listenToData<Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, Key1 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>) => void, Fallback extends [any?] = []>(dataKey: Key1, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, Key1 extends Keys, Key2 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>) => void, Fallback extends [any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>) => void, Fallback extends [any?, any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>) => void, Fallback extends [any?, any?, any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>, val5: PropTypeFallback<Data, Key5, Fallback[4]>) => void, Fallback extends [any?, any?, any?, any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>, val5: PropTypeFallback<Data, Key5, Fallback[4]>, val6: PropTypeFallback<Data, Key6, Fallback[5]>) => void, Fallback extends [any?, any?, any?, any?, any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Key7 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>, val5: PropTypeFallback<Data, Key5, Fallback[4]>, val6: PropTypeFallback<Data, Key6, Fallback[5]>, val7: PropTypeFallback<Data, Key7, Fallback[6]>) => void, Fallback extends [any?, any?, any?, any?, any?, any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Key7 extends Keys, Key8 extends Keys, Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>, val5: PropTypeFallback<Data, Key5, Fallback[4]>, val6: PropTypeFallback<Data, Key6, Fallback[5]>, val7: PropTypeFallback<Data, Key7, Fallback[6]>, val8: PropTypeFallback<Data, Key8, Fallback[7]>) => void, Fallback extends [any?, any?, any?, any?, any?, any?, any?, any?] = []>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, dataKey8: Key8, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
    unlistenToData(callback: DataListenerFunc): boolean;
    /** Should be extended. Default implementation returns fallback. */
    getInData<DataKey extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, SubData extends PropType<Data, DataKey, never>>(ctxDataKey: DataKey, fallback?: never | undefined): SubData | undefined;
    getInData<DataKey extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, SubData extends PropType<Data, DataKey, never>, FallbackData extends any>(ctxDataKey: DataKey, fallback: FallbackData): SubData | FallbackData;
    /** Should be extended. Default implementation does not do anything. */
    setInData(dataKey: string, subData: any, extend?: boolean, refresh?: boolean): void;
    /** Should be extended. Default implementation at DataBoy just calls the data listeners, optionally after a timeout. */
    refreshData<DataKey extends GetJoinedDataKeysFrom<Data, InterfaceLevel>>(dataKeys: DataKey | DataKey[], forceTimeout?: number | null): void;
    /** Helper to build data arguments with values fetched using getInData method with the given data needs args.
     * - For example: `getDataArgsBy(["user.name", "darkMode"])` returns `[userName?, darkMode?]`.
     * - To add fallbacks (whose type affects the argument types), give an array of fallbacks as the 2nd argument with respective order.
     * - If the fallbackArgs is a dictionary, then returns `[valueDictionary]` picking the fallbacks from the given dictionary.
     * - Note. This method is used internally but can also be used for custom external purposes.
     */
    getDataArgsBy<DataKey extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, Params extends [DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?], Fallbacks extends Record<string, any> | [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?]>(needs: Params, fallbackArgs?: Fallbacks): Fallbacks extends any[] ? PropTypeArray<Data, Params, Fallbacks> : [valueDictionary: PropTypesFromDictionary<Data, Fallbacks>];
    /** Manually trigger an update based on changes in context. Should not be called externally in normal circumstances.
     * - Only calls / triggers for refresh by needs related to the given contexts. If ctxNames is true, then all.
     * - If the refreshKeys is `true` (default), then refreshes as if all data had changed.
     * - The onlyDirect? 2nd argument should be put to true if wanting to skip the callDataListenersFor static method if present.
     *      * Normally, if the callDataListenersFor static method is defined, will not perform the internal implementation.
     */
    callDataBy(refreshKeys?: true | GetJoinedDataKeysFrom<Data, InterfaceLevel>[], onlyDirect?: boolean): void;
}
/** Add DataBoy features to a custom class. Provide the BaseClass type specifically as the 2nd type argument.
 * - For examples of how to use mixins see `mixinDataMan` comments or [mixin-types README](https://github.com/koodikulma-fi/mixin-types).
 * - Note. The InterfaceLevel type argument can be used to define how many levels of interface types allows vs. strict types.
 *      * However, allowing interfaces also allows class instances to be included in the typed dotted data keys.
 */
declare function mixinDataBoy<Data extends Record<string, any> = {}, InterfaceLevel extends number | never = 0, BaseClass extends ClassType = ClassType>(Base: BaseClass): AsClass<DataBoyType<Data, InterfaceLevel> & BaseClass, DataBoy<Data, InterfaceLevel> & InstanceType<BaseClass>, any[]>;

/** The static class side typing for DataMan. Includes the constructor arguments when used as a standalone class (or for the mixin in the flow). */
interface DataManType<Data extends Record<string, any> = {}, InterfaceLevel extends number | never = 0> extends AsClass<DataBoyType<Data, InterfaceLevel>, DataMan<Data, InterfaceLevel>, {} extends Data ? [data?: Data, ...args: any[]] : [data: Data, ...args: any[]]> {
    /** Extendable static helper. The default implementation makes the path and copies all dictionaries along the way from the root down. */
    createPathTo(dataMan: DataMan<any>, dataKeys: string[]): Record<string, any> | undefined;
}
declare const DataMan_base: ReClass<DataManType<{}, 0>, {}, [data?: {} | undefined, ...args: any[]]>;
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
 * - Note. The InterfaceLevel type argument can be used to define how many levels of interface types allows vs. strict types.
 *      * However, allowing interfaces also allows class instances to be included in the typed dotted data keys.
 */
declare class DataMan<Data extends Record<string, any> = {}, InterfaceLevel extends number | never = 0> extends DataMan_base {
}
interface DataMan<Data extends Record<string, any> = {}, InterfaceLevel extends number | never = 0> extends DataBoy<Data, InterfaceLevel> {
    readonly data: Data;
    /** The pending data keys - for internal refreshing uses. */
    dataKeysPending: string[] | true | null;
    /** Get the whole data (directly).
     * - If you want to use refreshes and such as designed, don't modify the data directly (do it via setData or setInData) - or then call .refreshData accordingly.
     */
    getData(): Data;
    /** Get a portion within the data using dotted string to point the location. For example: "themes.selected". */
    getInData<DataKey extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, Fallback extends any>(dataKey: DataKey, fallback: Fallback): PropType<Data, DataKey> | Fallback;
    getInData<DataKey extends GetJoinedDataKeysFrom<Data, InterfaceLevel>>(dataKey: DataKey, fallback?: never | undefined): PropType<Data, DataKey>;
    /** Set the data and refresh. By default extends the data (only replaces if extend is set to false), and triggers a refresh. */
    setData(data: Data, extend: false, refresh?: boolean, forceTimeout?: number | null): void;
    setData(data: Partial<Data>, extend?: boolean | true, refresh?: boolean, forceTimeout?: number | null): void;
    /** Set or extend in nested data, and refresh with the key. (And by default trigger a refresh.)
     * - Along the way (to the leaf) automatically extends any values whose constructor === Object, and creates the path to the leaf if needed.
     * - By default extends the value at the leaf, but supports automatically checking if the leaf value is a dictionary (with Object constructor) - if not, just replaces the value.
     * - Finally, if the extend is set to false, the typing requires to input full data at the leaf, which reflects JS behaviour - won't try to extend.
     */
    setInData<DataKey extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, SubData extends PropType<Data, DataKey, never>>(dataKey: DataKey, subData: SubData, extend?: false, refresh?: boolean, forceTimeout?: number | null): void;
    setInData<DataKey extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, SubData extends PropType<Data, DataKey, never>>(dataKey: DataKey, subData: Partial<SubData>, extend?: boolean | undefined, refresh?: boolean, forceTimeout?: number | null): void;
    /** Note that this only adds the refresh keys but will not refresh. */
    addRefreshKeys(refreshKeys?: string | string[] | boolean): void;
}
/** Add DataMan features to a custom class.
 * - Note. Either provide the BaseClass type specifically as the 2nd type argument or use ReMixin trick (see below).
 *
 * ```
 *
 * // Imports.
 * import { GetConstructorArgs, ReClass, ReMixin, ClassType } from "mixin-types";
 * import { DataMan, DataManType, mixinDataMan } from "data-signals";
 *
 * // Type data.
 * type MyData = { something: boolean; };
 *
 * // Example #1: Create a class extending mixinDataMan with <MyData>.
 * class Test extends mixinDataMan<MyData>(Object) {
 *      test() {
 *          this.listenToData("something", (something) => {});
 *      }
 * }
 *
 * // Example #2: Create a class extending mixinDataMan<MyData> and a custom class as the base.
 * class MyBase {
 *      public someMember: number = 0;
 * }
 * class Test2a extends mixinDataMan<MyData, 0, typeof MyBase>(MyBase) { // Needs to specify the base type explicitly here.
 *      test2() {
 *          this.someMember = 1;
 *          this.listenToData("something", (something) => {});
 *      }
 * }
 * // Or alternatively.
 * class Test2b extends (mixinDataMan as ReMixin<DataManType<MyData>>)(MyBase) { // Get MyBase type dynamically.
 *      test2() {
 *          this.someMember = 1;
 *          this.listenToData("something", (something) => {});
 *      }
 * }
 *
 * // Example #3: Pass generic Data from outside with MyBase.
 * // .. Declare an interface for the static side - optional.
 * interface Test3Type<Data extends Record<string, any> = {}> extends
 *     AsClass<DataManType<Data> & typeof MyBase, Test3<Data> & MyBase, [Data?]> {}
 * // .. Declare an interface extending what we want to extend, supporting passing generic <Data> further.
 * interface Test3<Data extends Record<string, any> = {}> extends DataMan<Data>, MyBase {}
 * // .. Declare a class with base `as any as ClassType`, so that the interface can fully define the base.
 * // .. Actually, to include the static side methods, let's use `as any as ReClass`.
 * class Test3<Data extends Record<string, any> = {}> extends
 *      // (mixinDataMan(MyBase) as any as ClassType) { // Without static side methods.
 *      // (mixinDataMan(MyBase) as any as ReClass<DataManType & typeof MyBase, {}, GetConstructorArgs<DataManType>>) {
 *      (mixinDataMan(MyBase) as any as ReClass<Test3Type, {}, GetConstructorArgs<DataManType>>) {
 *
 *      // Or, if we have some custom things, can specify further.
 *      // .. Since we know our base: Test3 -> DataMan -> MyBase, no need to add (...args: any[]) to the constructor.
 *      refreshTimeout: number | null;
 *      constructor(data: Data, refreshTimeout: number | null) {
 *          super(data); // Because we typed the constructor args above, it's know what super wants here.
 *          this.refreshTimeout = refreshTimeout;
 *      }
 *
 * }
 *
 * // Test.
 * const test3 = new Test3<MyData>({ something: true }, 5);
 * test3.listenToData("something", (something) => {});
 * test3.refreshTimeout; // number | null
 *
 * ```
 */
declare function mixinDataMan<Data extends Record<string, any> = {}, InterfaceLevel extends number | never = 0, BaseClass extends ClassType = ClassType>(Base: BaseClass): AsClass<DataManType<Data, InterfaceLevel> & BaseClass, DataMan<Data, InterfaceLevel> & InstanceType<BaseClass>, {} extends Data ? [Data?, ...any[]] : [Data, ...any[]]>;

/** All settings for RefreshCycle. */
interface RefreshCycleSettings<PendingInfo = undefined> {
    /** The default timeout to use. Can be temporarily overridden using the `trigger(defaultTimeout, forceTimeout)` method (as the 1st arg, the 2nd arg always overrides). */
    defaultTimeout: number | null | undefined;
    /** If set to true, then creates a new promise already when the old is finished. So the promise defaults to "pending", instead of "fulfilled". */
    autoRenewPromise: boolean;
    /** The pending initializer to call after clearing the pending info. */
    initPending: (() => PendingInfo) | undefined;
}
type RefreshCycleSignals<PendingInfo = undefined> = {
    /** Called always right after the state has changed. (The previous state is implied by the current state: "" -> "waiting" -> "resolving" -> "") */
    onState: (nextState: "" | "waiting" | "resolving") => void;
    /** Called when a new cycle starts. Perfect place to trigger start-up-dependencies (from other cycles). */
    onStart: () => void;
    /** Called right before resolving the promise. Perfect place to trigger resolve-dependencies (from other cycles). */
    onResolve: () => void;
    /** Called right when the cycle has finished (without cancelling). Contains the pending info for executing the related updates.
     * - Also contains resolvePromise(), which is called right after synchronously. But can be called earlier if wanted.
     * - Note that if resolves early, should take into account that more pending could have accumulated during the call.
     */
    onRefresh: (pending: PendingInfo, resolvePromise: (keepResolving?: boolean) => void) => void;
    /** Called right after the cycle has finished (due to either: refresh or cancel). Perfect place to trigger disposing-dependencies (from other cycles) and to start other cycles. */
    onFinish: (cancelled: boolean) => void;
};
/** Class type for RefreshCycle. */
interface RefreshCycleType<PendingInfo = undefined, AddSignals extends SignalsRecord = {}> extends AsClass<SignalBoyType<AddSignals>, RefreshCycle<PendingInfo, AddSignals>, GetConstructorArgs<RefreshCycle<PendingInfo, AddSignals>>> {
}
/** Class to help manage refresh cycles. */
declare class RefreshCycle<PendingInfo = undefined, AddSignals extends SignalsRecord = {}> extends SignalBoy<RefreshCycleSignals<PendingInfo> & AddSignals> {
    ["constructor"]: RefreshCycleType<PendingInfo, AddSignals>;
    /** Settings. */
    settings: Partial<RefreshCycleSettings<PendingInfo>>;
    /** The `promise` can be used for waiting purposes. It's always present, and if there's nothing to wait it's already fulfilled. */
    promise: Promise<void>;
    /** State of the cycle. Set to "resolving" right when is finishing (does not matter if reject was called), and to "" right after the promise is resolved. */
    state: "waiting" | "resolving" | "";
    /** Optional collection of things to update when the cycle finished.
     * - When the cycle is finished calls `onRefresh(pending: PendingInfo)` using this info.
     * - Initialized by initPending given on constructor, or then undefined.
     *      * The pending is re-inited at the moment of clearing pending - the first one on instantiating the class.
     *      * Can then add manually to the cycle externally: eg. `myCycle.pending.myThings.push(thisThing)`.
     */
    pending: PendingInfo;
    /** The current timer if any. */
    timer?: number | NodeJSTimeout;
    /** If not undefined, this functions as the defaultTimeout for the next cycle start. */
    nextTimeout?: number | null;
    /** The callback to resolve the promise created. When called will first delete itself, and then resolves the promise. */
    private _resolve?;
    constructor(...args: PendingInfo extends undefined ? [settings?: Partial<RefreshCycleSettings<PendingInfo>>] : [settings: Partial<RefreshCycleSettings<PendingInfo>> & Pick<RefreshCycleSettings<PendingInfo>, "initPending">]);
    /** Start the cycle, optionally forcing a timeout (if not undefined). */
    start(forceTimeout?: number | null): void;
    /** Starts the cycle if wasn't started: goes to "waiting" state unless was "resolving".
     * - If forceTimeout given modifies the timeout, the defaultTimeout is only used when starting up the cycle.
     * - The cycle is finished by calling "resolve" or "reject", or by the timeout triggering "resolve".
     * - Returns the promise in any case - might be fulfilled already.
     */
    trigger(defaultTimeout?: number | null, forceTimeout?: number | null): Promise<void>;
    /** Extend the timeout without triggering the cycle (by default).
     * @param timeout Defaults to `undefined`.
     *      - If given `number`, then sets it as the new timeout.
     *      - If given `null`, then will immediaty resolve it (when the cycle starts). If cycle already started, resolves instantly.
     *      - If given `undefined´ only clears the timer and does not set up a new one.
     * @param allowTrigger Defaults to `false`.
     *      - If `true`, then allows to start up a new cycle if the state was "". This might include resolving it instantly as well if new timeout is `null`.
     *      - If `"instant"`, then does not allow start up a new cycle, but does allow instant resolving of the current cycle if was "waiting" and new timeout `null`.
     *      - If `false` (default), then never starts up a new cycle, nor resolves it instantly if `null` given for an active cycle.
     *          * In terms of micro-processing, this is often what is wanted externally. That's why the default - so calling `extend` never resolves nor triggers instantly by default.
     *          * If the new timeout is `null`, the external layer probably calls `.resolve()` manually - very synchronously-soon after.
     * - About phase of the cycle:
     *      * "": If the cycle has not yet started, only marks the timeout (to override the default), when the cycle later starts. Unless allowTriggerCycle is true.
     *      * "waiting": If the cycle is ready, clears the old timer (if any) and sets the new timer. (If null, and allowInstantResolve is true, then resolves instantly.)
     *      * "resolving": Does not do anything, things are already in the process of being resolved synchronously - right now.
     */
    extend(timeout: number | null | undefined, allowTrigger?: boolean | "instant"): void;
    /** Clears the timer. Mostly used internally, but can be used externally as well. Does not affect the state of the cycle. */
    clearTimer(): void;
    /** Get and clear the pending info. */
    resetPending(): PendingInfo;
    /** Resolve the refresh cycle (and promise) manually. Results in clearing the entry from bookkeeping and calling `onRefresh`. Resolving again results in nothing. */
    resolve(): void;
    /** Cancel the whole refresh cycle. Note that this will clear the entry from refreshTimers bookkeeping along with its updates. */
    reject(): void;
    private initPromise;
    private setState;
}

/** Typing to hold named contexts as a dictionary. */
type ContextsAllType = Record<string, Context<any, any>>;
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
interface ContextAPIType<Contexts extends ContextsAllType = {}> extends AsClass<DataBoyType<Partial<GetDataFromContexts<Contexts>>, 1> & SignalManType<GetSignalsFromContexts<Contexts>>, ContextAPI<Contexts>, [contexts?: Partial<Contexts>]> {
    /** Assignable getter to call more data listeners when callDataBy is used.
     * - If dataKeys is true (or undefined), then should refresh all data.
     * - Note. To use the default callDataBy implementation from the static side put 2nd arg to true: `contextAPI.callDataBy(dataKeys, true)`.
     * - Note. Put as static to keep the public instance API clean. The method needs to be public for internal use of extending classes.
     */
    callDataListenersFor?(contextAPI: ContextAPI<any>, dataKeys?: true | string[]): void;
    /** Optional method to keep track of added / removed listeners. Called right after adding and right before removing. */
    onListener?(contextAPI: ContextAPI<any>, name: string, index: number, wasAdded: boolean): void;
    /** Optional method to get the listeners for the given signal. If used it determines the listeners, if not present then uses this.signals[name] instead. Return undefined to not call anything. */
    getListenersFor?(contextAPI: ContextAPI<any>, signalName: string): SignalListener[] | undefined;
    /** Converts contextual data or signal key to `[ctxName: string, dataSignalKey: string]` */
    parseContextDataKey(ctxDataSignalKey: string): [ctxName: string, dataSignalKey: string];
    /** Read context names from contextual data keys or signals. */
    readContextNamesFrom(ctxDataSignalKeys: string[]): string[];
    /** Converts array of context data keys or signals `${ctxName}.${dataSignalKey}` to a dictionary `{ [ctxName]: dataSignalKey[] | true }`, where `true` as value means all in context. */
    readContextDictionaryFrom(ctxDataKeys: string[]): Record<string, string[] | true>;
}
declare const ContextAPI_base: ReClass<ContextAPIType<{}>, {}, [contexts?: Partial<{}> | undefined]>;
interface ContextAPI<Contexts extends ContextsAllType = {}> extends DataBoy<GetDataFromContexts<Contexts>, 1>, SignalMan<GetSignalsFromContexts<Contexts>> {
}
/** ContextAPI extends SignalMan and DataBoy mixins to provide features for handling multiple named Contexts.
 * - According to its mixin basis, ContextAPI allows to:
 *      * SignalMan: Send and listen to signals in the named contexts.
 *      * DataBoy: Listen to data changes, but also to set/get data in the contexts.
 * - All data keys and signal names should start with `${contextName}.${keyOrName}`.
 *      * For example: "settings.something.deep" data key (for "settings" context) or "navigation.onFocus" signal (for "navigation" context).
 * - Importantly, the ContextAPI's `awaitDelay` method can be overridden externally to affect the syncing of all the connected contexts.
 *      * More specifically, the "delay" cycle of the Contexts is resolved only once all the ContextAPIs connected to the context have resolved their `awaitDelay`.
 */
declare class ContextAPI<Contexts extends ContextsAllType = {}> extends ContextAPI_base {
    ["constructor"]: ContextAPIType<Contexts>;
    /** All the contexts assigned to us.
     * - They also have a link back to us by context.contextAPIs, with this as the key and context names as the values.
     * - Note that can also set `null` value here - for purposefully excluding an inherited context (when using one contextAPI to inherit contexts from another).
     *      * But `undefined` will never be found in here - if gives to the setContext, it means deleting the entry from the record.
     */
    contexts: Partial<Record<string, Context<Record<string, any>, SignalsRecord> | null>>;
    constructor(contexts?: Partial<Contexts>);
    /** This (triggers a refresh and) returns a promise that is resolved when the "pre-delay" or "delay" cycle is completed.
     * - At the level of ContextAPI there's nothing to refresh (no data held, just read from contexts).
     *      * Actually the point is the opposite: to optionally delay the "delay" cycle of the connected contexts by overriding the `awaitDelay` method.
     * - Note that this method is overrideable. On the basic implementation it resolves immediately due to that there's no awaitDelay.
     *      * But on an external layer, the awaiting might be synced to provide the bridging for syncing the "delay" signals of many contexts together.
     * - Note that the timing of this method should always reflect awaitDelay - it should just provide triggering refresh in addition to awaiting the promise.
     *      * So if awaitDelay is not present, this method should resolve instantly as well.
     */
    afterRefresh(fullDelay?: boolean, forceTimeout?: number | null): Promise<void>;
    /** At the level of ContextAPI the `awaitDelay` resolves instantly (it's not defined).
     * - Importantly, this method determines when the "delay" cycle of the connected Contexts is resolved. (That's why defaults to instant.)
     * - Accordingly, you can set / override this method (externally or by extending class) to customize the syncing.
     * - Note that this method should not be _called_ externally - only overridden externally (to affect the "delay" cycle timing).
     */
    awaitDelay?(): Promise<void>;
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
    getInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas, 1>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, fallback?: never | undefined): SubData | undefined;
    getInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas, 1>, SubData extends PropType<CtxDatas, CtxDataKey, never>, FallbackData extends any>(ctxDataKey: CtxDataKey, fallback: FallbackData): SubData | FallbackData;
    /** Set in contextual data by dotted key: eg. `"someCtxName.someData.someProp"`.
     * - Sets the data in the context, if context found, and triggers refresh (by default).
     * - Note that if the context is found, using this triggers the contextual data listeners (with default or forced timeout).
     * - About setting data.
     *      * Along the way (to the leaf) automatically extends any values whose constructor === Object, and creates the path to the leaf if needed.
     *      * By default extends the value at the leaf, but supports automatically checking if the leaf value is a dictionary (with Object constructor) - if not, just replaces the value.
     *      * Finally, if the extend is set to false, the typing requires to input full data at the leaf, which reflects JS behaviour - won't try to extend.
    */
    setInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas, 1>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, data: Partial<SubData> & Record<string, any>, extend?: true, refresh?: boolean, forceTimeout?: number | null): void;
    setInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas, 1>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, data: SubData, extend?: boolean, refresh?: boolean, forceTimeout?: number | null): void;
    /** Manually trigger refresh without setting any data using a dotted key (or an array of them) with context name prepended: eg. `"someCtxName.someData.someProp"`. */
    refreshData<CtxDataKey extends GetJoinedDataKeysFrom<GetDataFromContexts<Contexts>, 1>>(ctxDataKeys: CtxDataKey | CtxDataKey[], forceTimeout?: number | null): void;
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
    getContexts<Name extends keyof Contexts & string>(onlyNames?: SetLike<Name> | null, skipNulls?: true): Partial<ContextsAllTypeWith<Contexts, never, Name>>;
    getContexts<Name extends keyof Contexts & string>(onlyNames?: SetLike<Name> | null, skipNulls?: boolean | never): Partial<ContextsAllTypeWith<Contexts, null, Name>>;
    /** Create a new context.
     * - If settings given uses it, otherwise default context settings.
     * - If overrideWithName given, then calls setContext automatically with the given name. If empty (default), functions like a simple static function just instantiating a new context with given data.
     * - If overrides by default triggers a refresh call in data listeners in case the context was actually changed. To not do this set refreshIfOverriden to false.
     */
    newContext<CtxData extends Record<string, any> = {}, CtxSignals extends SignalsRecord = {}>(data: CtxData, settings?: Partial<ContextSettings> | null, overrideWithName?: never | "" | undefined, refreshIfOverriden?: never | false): Context<CtxData, CtxSignals>;
    newContext<Name extends keyof Contexts & string>(data: Contexts[Name]["data"], settings: Partial<ContextSettings> | null | undefined, overrideWithName: Name, refreshIfOverriden?: boolean): Contexts[Name];
    /** Same as newContext but for multiple contexts all at once.
     * - If settings given uses it for all, otherwise default context settings.
     * - If overrideForSelf set to true, call setContexts afterwards with the respective context names in allData. Defaults to false: functions as if a static method.
     * - If overrides by default triggers a refresh call in data listeners in case the context was actually changed. To not do this set refreshIfOverriden to false.
     */
    newContexts<Ctxs extends {
        [Name in keyof AllData & string]: Context<AllData[Name] & {}>;
    }, AllData extends Record<keyof Ctxs & string, Record<string, any>> = {
        [Name in keyof Ctxs & string]: Ctxs[Name]["data"];
    }>(allData: AllData, settings?: Partial<ContextSettings> | null, overrideForSelf?: never | false | undefined, refreshIfOverriden?: never | false): Ctxs;
    newContexts<Name extends keyof Contexts & string>(allData: Partial<Record<Name, Contexts[Name]["data"]>>, settings: Partial<ContextSettings> | null | undefined, overrideForSelf: true, refreshIfOverriden?: boolean): Partial<{
        [Name in keyof Contexts & string]: Contexts[Name];
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
    /** Trigger a refresh in a specific context.
     * @param forceTimeout Refers to the timing of the context's "pre-delay" cycle.
     */
    refreshContext(name: keyof Contexts & string, forceTimeout?: number | null): void;
    /** Refresh all or named contexts with the given forceTimeout.
     * @param contextNames An array or a dictionary of context names, or null|undefined to refresh all.
     *      - If a dictionary, the keys are context names and values are timeouts specifically for each. If the value is undefined, uses forceTimeout instead.
     * @param forceTimeout Refers to the timing of the context's "pre-delay" cycle.
     */
    refreshContexts(contextNames?: Array<keyof Contexts & string>[] | Partial<Record<keyof Contexts & string, number | null | undefined>> | null, forceTimeout?: number | null): void;
    /** Converts contextual data or signal key to a tuple: `[ctxName: string, dataSignalKey: string]`
     * @param ctxDataSignalKey The string representing `${ctxName}.${dataKeyOrSignalName}`.
     *      - In case refers to a deep data key, looks like this: `${ctxName}.${dataKey1}.${dataKey2}.${dataKey3}`.
     *      - In any case, the outcome is an array with 2 items: `[ctxName: string, dataSignalKey: string]`.
     * @returns A tuple: `[ctxName: string, dataSignalKey: string]`.
     *      - Return examples: `["settings", "toggleTheme"]`, `["data", "settings.user.name"]`, `["data", ""]`, `["", ""]`.
    */
    static parseContextDataKey(ctxDataSignalKey: string): [ctxName: string, dataSignalKey: string];
    /** Read context names from contextual data keys or signals.
     * @param ctxDataSignalKeys An array of strings representing context names and dotted data keys or signal names in it.
     *      - For example: [`${ctxName}.${signalName}`, `${ctxName}.${dataKey1}.${dataKey2}`, `${ctxName}`, ...]
     * @param strictMatch Defaults to false. If set to true, the returned array is directly mappable to the input array (of ctxDataSignalKeys). The empty ones have name "".
     * @returns An array of context names. If strictMatch is set to true, then the outcome array matches the input array.
     */
    static readContextNamesFrom(ctxDataSignalKeys: string[], strictMatch?: boolean): string[];
    /** Converts array of context data keys or signals `${ctxName}.${dataSignalKey}` to a dictionary `{ [ctxName]: dataSignalKey[] | true }`, where `true` as value means all in context.
     * @param ctxDataSignalKeys An array of ctxDataOrSignalKeys. Each is a string, and unless referring to the context itself has at least one dot (".").
     *      - For example: [`${ctxName}.${signalName}`, `${ctxName}.${dataKey1}.${dataKey2}`, `${ctxName}`, ...]
     * @returns A dictionary like: `{ [ctxName]: dataSignalKey[] | true }`, where `true` as value means all in context.
     */
    static readContextDictionaryFrom(ctxDataSignalKeys: string[]): Record<string, string[] | true>;
}

/** Settings for context functionality. */
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
    /** How sets nested data when using "setInData" method. The default is "leaf".
     * - "root": In this mode takes shallow copies of all parenting dictionaries - from the root down to the target leaf.
     *      * This mode is particularly suitable with data selector concept (eg. see "data-memo" npm package).
     * - "leaf": In this mode only sets the target leaf data without copying parenting structure.
     *      * However, if a parenting object does not exist, creates an empty dictionary for it (unlike the "only" mode).
     *      * This mode is recommended, if immutable-like renewal of the parenting dictionaries is not needed.
     * - "only": Like "leaf", but only sets the data if the parenting structure exists - ie. stops if it doesn't.
     */
    dataSetMode: "root" | "leaf" | "only";
}
/** Class type for Context class. */
interface ContextType<Data extends Record<string, any> = {}, Signals extends SignalsRecord = SignalsRecord> extends AsClass<DataManType<Data> & SignalManType<Signals>, Context<Data, Signals>, [Data?, Partial<ContextSettings>?]> {
    /** Assignable getter to call more data listeners when callDataBy is used.
     * - If dataKeys is true (or undefined), then should refresh all data.
     * - Note. To use the default callDataBy implementation from the static side put 2nd arg to true: `contextAPI.callDataBy(dataKeys, true)`.
     * - Note. Put as static to keep the public instance API clean. The method needs to be public for internal use of extending classes.
     */
    callDataListenersFor?(context: Context<any, any>, dataKeys?: true | string[]): void;
    /** Optional method to keep track of added / removed listeners. Called right after adding and right before removing. */
    onListener?(context: Context<any, any>, name: string, index: number, wasAdded: boolean): void;
    /** Optional method to get the listeners for the given signal. If used it determines the listeners, if not present then uses this.signals[name] instead. Return undefined to not call anything. */
    getListenersFor?(context: Context<any, any>, signalName: string): SignalListener[] | undefined;
    /** Extendable static helper. At the level of Context, this is tied to the context's dataSetMode setting. */
    createPathTo(context: Context<any, any>, dataKeys: string[]): Record<string, any> | undefined;
    /** Extendable static default settings getter. */
    getDefaultSettings<Settings extends ContextSettings = ContextSettings>(): Settings;
    /** Extendable static helper to hook up context refresh cycles together. Put as static so that doesn't pollute the public API of Context. */
    initializeCyclesFor(context: Context<any>): void;
    /** Extendable static helper to run "pre-delay" cycle. Put as static so that doesn't pollute the public API of Context. */
    runPreDelayFor(context: Context<any>, resolvePromise: () => void): void;
    /** Extendable static helper to run "delay" cycle - default implementation is empty. Put as static so that doesn't pollute the public API of Context (nor prevent features of extending classes). */
    runDelayFor(context: Context<any>, resolvePromise: () => void): void;
}
declare const Context_base: ReClass<ContextType<{}, SignalsRecord>, {}, [({} | undefined)?, (Partial<ContextSettings> | undefined)?]>;
interface Context<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends SignalMan<Signals>, DataMan<Data> {
}
/** Context provides signal and data listener features (extending `SignalMan` and `DataMan` basis).
 * - Contexts provide data listening and signalling features.
 *      - Extending SignalMan they allow to send typed signals with special options available through sendSignalAs.
 *          * Furthermore, the "pre-delay" and "delay" signals are synced to the refresh cycles of the context.
 *          * The "pre-delay" signals are triggered right before calling data listeners, and "delay" once all related ContextAPI's have resolved their `awaitDelay`.
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
declare class Context<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends Context_base {
    /** This is only provided for typing related technical reasons (so that can access signals typing easier externally). There's no actual _Signals member on the javascript side. */
    _Signals?: Signals;
    ["constructor"]: ContextType<Data, Signals>;
    settings: ContextSettings;
    /** Handle for refresh cycles. */
    preDelayCycle: RefreshCycle;
    delayCycle: RefreshCycle;
    /** The keys are the ContextAPIs this context is attached to with a name, and the values are the names (typically only one). They are used for refresh related purposes. */
    contextAPIs: Map<ContextAPI, string[]>;
    constructor(...args: {} extends Data ? [data?: Data, settings?: Partial<ContextSettings> | null | undefined] : [data: Data, settings?: Partial<ContextSettings> | null | undefined]);
    /** Update settings with a dictionary. If any value is `undefined` then uses the existing or default setting. */
    modifySettings(settings: Partial<ContextSettings>): void;
    /** Trigger a refresh in the context.
     * - Triggers "pre-delay" and once finished, performs the "delay" cycle (awaiting connected contextAPIs).
     * @param forceTimeout Refers to the "pre-delay" time (defaults to settings.refreshTimeout).
     */
    triggerRefresh(forceTimeout?: number | null): void;
    /** Triggers a refresh and returns a promise that is resolved when the context is refreshed.
     * - If using "pre-delay" and there's nothing pending, then will resolve immediately (by the design of the flow). The "delay" always awaits.
     * - The promise is resolved after the "pre-delay" or "delay" cycle has finished depending on the "fullDelay" argument.
     *      * The "pre-delay" (fullDelay = false) uses the forceTimeout or the time out from settings { refreshTimeout }.
     *      * The "delay" (fullDelay = true) waits for "pre-delay" cycle to happen (with forceTimeout), and then awaits the promise from `awaitDelay`.
     *          - The `awaitDelay` is in turn synced to awaiting the `awaitDelay` of all the connected contextAPIs.
     * - Note that technically, the system at Context level simply collects an array (per delay type) of one-time promise resolve funcs and calls them at the correct time.
     * - Used internally by setData, setInData, refreshData and sendSignalAs flow.
     */
    afterRefresh(fullDelay?: boolean, forceTimeout?: number | null): Promise<void>;
    /** At the level of Context the `awaitDelay` is tied to waiting the refresh from all connected contextAPIs.
     * - It's used by the data refreshing flow (after "pre-delay") to mark the "delay" cycle. When the promise resolves, the "delay" is resolved.
     * - Note that this method should not be _called_ externally, but can be overridden externally to affect when "delay" cycle is resolved.
     * - Note that you can still externally delete the method, if needing to customize context. (Or override it to tie to other things.)
     */
    awaitDelay?(): Promise<void>;
    /** Trigger refresh of the context and optionally add data keys.
     * - This triggers calling pending data keys and delayed signals (when the refresh cycle is executed).
     */
    refreshData<DataKey extends GetJoinedDataKeysFrom<Data>>(dataKeys: DataKey | DataKey[] | boolean | null, forceTimeout?: number | null): void;
    /** Overridden to support getting signal listeners from related contextAPIs - in addition to direct listeners (which are put first). */
    static getListenersFor(context: Context, signalName: string): SignalListener[] | undefined;
    /** Overriden to take into account our context settings. */
    static createPathTo(context: Context, dataKeys: string[]): Record<string, any> | undefined;
    /** Extendable static default settings getter. */
    static getDefaultSettings<Settings extends ContextSettings = ContextSettings>(): Settings;
    /** Extendable static helper to hook up context refresh cycles together. Put as static so that doesn't pollute the public API of Context (nor prevent features of extending classes). */
    static initializeCyclesFor(context: Context): void;
    /** Extendable static helper to run "pre-delay" cycle. Put as static so that doesn't pollute the public API of Context (nor prevent features of extending classes). */
    static runPreDelayFor(context: Context, resolvePromise: () => void): void;
    /** Extendable static helper to run "delay" cycle - default implementation is empty. Put as static so that doesn't pollute the public API of Context (nor prevent features of extending classes). */
    static runDelayFor(context: Context, resolvePromise: () => void): void;
}
/** Create multiple named Contexts as a dictionary. Useful for attaching them to a ContextAPI, eg. to feed them to the root host (or a specific component if you like). */
declare const createContexts: <Contexts extends Partial<Record<string, Context<any, any>>>, AllData extends Partial<Record<string, Record<string, any>>> = { [Name in keyof Contexts & string]: (Contexts[Name] & {
    data: {};
})["data"]; }>(contextsData: AllData, settings?: Partial<ContextSettings> | null) => Contexts;

export { Awaited, Context, ContextAPI, ContextAPIType, ContextSettings, ContextType, ContextsAllType, ContextsAllTypeWith, DataBoy, DataBoyType, DataListenerFunc, DataMan, DataManType, GetDataFromContexts, GetJoinedDataKeysFrom, GetJoinedSignalKeysFromContexts, GetSignalsFromContexts, IsAny, IsDeepPropertyInterface, IsDeepPropertyType, NodeJSTimeout, PropType, PropTypeArray, PropTypeFallback, PropTypesFromDictionary, RefreshCycle, RefreshCycleSettings, RefreshCycleSignals, RefreshCycleType, SetLike, SignalBoy, SignalBoyType, SignalListener, SignalListenerFlags, SignalListenerFunc, SignalMan, SignalManType, SignalSendAsReturn, SignalsRecord, askListeners, callListeners, createContexts, mixinDataBoy, mixinDataMan, mixinSignalBoy, mixinSignalMan };
