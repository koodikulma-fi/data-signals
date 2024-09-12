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
/** Call a bunch of listeners and handle SignalManFlags mode.
 * - Will remove from given listeners array if OneShot flag is used.
 * - If Deferred flag is used, calls the listener after 0ms timeout.
 * - Does not collect return values. Just for emitting out without hassle. */
declare function callListeners(listeners: SignalListener[], args?: any[] | null): void;
/** This emits the signal and collects the answers given by each listener ignoring `undefined` as an answer.
 * - By default, returns a list of answers. To return the last one, include "last" in the modes array.
 * - To stop at the first accepted answer use "first" mode or "first-true" mode.
 * - Always skips `undefined` as an answer. To skip `null` too use "no-null" mode, or any falsifiable with `no-false`.
 */
declare function askListeners(listeners: SignalListener[], args?: any[] | null, modes?: Array<"" | "no-false" | "no-null" | "last" | "first" | "first-true">): any;
declare function _SignalBoyMixin<Signals extends SignalsRecord = {}>(Base: ClassType): {
    new (...passArgs: any[]): {
        signals: Record<string, Array<SignalListener>>;
        listenTo(name: string, callback: SignalListenerFunc, extraArgs?: any[], flags?: SignalManFlags, groupId?: any | null): void;
        unlistenTo(names?: string | string[] | null, callback?: SignalListenerFunc | null, groupId?: any | null): void;
        isListening(name?: string | null, callback?: (SignalListenerFunc) | null, groupId?: any | null): any;
        onListener?(name: string, index: number, wasAdded: boolean): void;
    };
};
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
declare const SignalBoy_base: ClassType;
/** This is like SignalMan but only provides listening: the sendSignal, sendSignalAs and afterRefresh methods are deleted (for clarity of purpose). */
declare class SignalBoy<Signals extends SignalsRecord = {}> extends SignalBoy_base {
}
interface SignalBoy<Signals extends SignalsRecord = {}> {
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
    /** Send a signal. Does not return a value. Use `sendSignalAs(modes, name, ...args)` to refine the behaviour. */
    sendSignal<Name extends string & keyof Signals>(name: Name, ...args: Parameters<Signals[Name]>): void;
    /** This exposes various features to the signalling process which are inputted as the first arg: either string or string[]. Features are:
     * - "delay": Delays sending the signal. To also collect returned values must include "await".
     *      * Note that this delays the start of the process. So if new listeners are attached right after, they'll receive the signal.
     *      * The stand alone SignalMan simply uses setTimeout with 1ms delay. (On Components, Hosts and Contexts it's delayed to the "render" cycle of the host(s).)
     * - "pre-delay": This is like "delay" but uses 0ms timeout on the standalone SignalMan. (On Components, Hosts and Contexts it's delayed to their update cycle.)
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
declare function _DataManMixin<Data = any>(Base: ClassType): {
    new (data?: any, ...args: any[]): {
        readonly data: Data;
        /** External data listeners - called after the contextual components. The keys are data listener callbacks, and values are the data needs. */
        dataListeners: Map<DataListenerFunc, string[]>;
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
    };
};
/** There are two ways you can use this:
 * 1. Call this to give basic DataMan features with advanced typing being empty.
 *      * `class MyMix extends DataManMixin(MyBase) {}`
 * 2. If you want to define the Data and Signals types, you can use this trick instead:
 *      * `class MyMix extends (DataManMixin as ClassMixer<DataManType<Data, Signals>>)(MyBase) {}`
 */
declare const DataManMixin: ClassMixer<ClassType<DataMan>>;
interface DataManType<Data = any> extends ClassType<DataMan<Data>> {
}
declare const DataMan_base: {
    new (data?: any, ...args: any[]): {
        readonly data: any;
        /** External data listeners - called after the contextual components. The keys are data listener callbacks, and values are the data needs. */
        dataListeners: Map<DataListenerFunc, string[]>;
        /** The pending data keys - for internal refreshing uses. */
        dataKeysPending: string[] | true | null;
        listenToData(...args: any[]): void;
        /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
        unlistenToData(callback: DataListenerFunc): boolean;
        getData(): any;
        getInData(dataKey: string, fallback?: any): any;
        setData(data: any, extend?: boolean, refresh?: boolean, ...timeArgs: any[]): void;
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
    };
};
declare class DataMan<Data = any> extends DataMan_base {
}
/** This provides data setting and listening features with dotted strings.
 * - Example to create: `const dataMan = new DataMan({ ...initData });`
 * - Example for listening: `dataMan.listenToData("some.data.key", "another", (some, other) => { ... })`
 * - Example for setting data: `dataMan.setInData("some.data.key", somedata)`
 */
interface DataMan<Data = any> {
    readonly data: Data;
    /** External data listeners - called after the contextual components. The keys are data listener callbacks, and values are the data needs. */
    dataListeners: Map<DataListenerFunc, string[]>;
    /** The pending data keys - for internal refreshing uses. */
    dataKeysPending: string[] | true | null;
    /** This allows to listen to data by defining specific needs which in turn become the listener arguments.
     * - The needs are defined as dotted strings: For example, `listenToData("user.allowEdit", "themes.darkMode", (allowEdit, darkMode) => { ... });`
     * - By calling this, we both assign a listener but also set data needs to it, so it will only be called when the related data portions have changed.
     * - To remove the listener use `unlistenToData(callback)`.
     */
    listenToData<Keys extends GetJoinedDataKeysFrom<Data & {}>, Key1 extends Keys, Callback extends (val1: PropType<Data, Key1, never>) => void>(dataKey: Key1, callback: Callback, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data & {}>, Key1 extends Keys, Key2 extends Keys, Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>) => void>(dataKey1: Key1, dataKey2: Key2, callback: Callback, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data & {}>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>, val3: PropType<Data, Key3, never>) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, callback: Callback, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data & {}>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Fallback extends [fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null, fall4?: PropType<Data, Key4, never> | null], Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>, val3: PropType<Data, Key3, never>, val4: PropType<Data, Key4, never>) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, callback: Callback, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data & {}>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>, val3: PropType<Data, Key3, never>, val4: PropType<Data, Key4, never>, val5: PropType<Data, Key5, never>) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, callback: Callback, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data & {}>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>, val3: PropType<Data, Key3, never>, val4: PropType<Data, Key4, never>, val5: PropType<Data, Key5, never>, val6: PropType<Data, Key6, never>) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, callback: Callback, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data & {}>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Key7 extends Keys, Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>, val3: PropType<Data, Key3, never>, val4: PropType<Data, Key4, never>, val5: PropType<Data, Key5, never>, val6: PropType<Data, Key6, never>, val7: PropType<Data, Key7, never>) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, callback: Callback, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFrom<Data & {}>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Key7 extends Keys, Key8 extends Keys, Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>, val3: PropType<Data, Key3, never>, val4: PropType<Data, Key4, never>, val5: PropType<Data, Key5, never>, val6: PropType<Data, Key6, never>, val7: PropType<Data, Key7, never>, val8: PropType<Data, Key8, never>) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, dataKey8: Key8, callback: Callback, callImmediately?: boolean): void;
    /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
    unlistenToData(callback: DataListenerFunc): boolean;
    /** Get the whole data (directly).
     * - If you want to use refreshes and such as designed, don't modify the data directly (do it via setData or setInData) - or then call .refreshData accordingly. */
    getData(): Data;
    /** Get a portion within the data using dotted string to point the location. For example: "themes.selected". */
    getInData<DataKey extends GetJoinedDataKeysFrom<Data & {}>>(dataKey: DataKey, fallback?: PropType<Data, DataKey, never>): PropType<Data, DataKey>;
    /** Set the data and refresh.
     * - Note that the extend functionality should only be used for dictionary objects. */
    setData(data: Data, extend?: boolean | false, refresh?: boolean, forceTimeout?: number | null): void;
    setData(data: Partial<Data>, extend?: boolean | true, refresh?: boolean, forceTimeout?: number | null): void;
    /** Set or extend in nested data, and refresh with the key.
     * - Note that the extend functionality should only be used for dictionary objects. */
    setInData<DataKey extends GetJoinedDataKeysFrom<Data & {}>, SubData extends PropType<Data, DataKey, never>>(dataKey: DataKey, subData: Partial<SubData>, extend?: true, refresh?: boolean, forceTimeout?: number | null): void;
    setInData<DataKey extends GetJoinedDataKeysFrom<Data & {}>, SubData extends PropType<Data, DataKey, never>>(dataKey: DataKey, subData: SubData, extend?: boolean | undefined, refresh?: boolean, forceTimeout?: number | null): void;
    /** This refreshes both: data & pending signals.
     * - If refreshKeys defined, will add them - otherwise only refreshes pending.
     * - Note that if !!refreshKeys is false, then will not add any refreshKeys. If there were none, will only trigger the signals. */
    refreshData<DataKey extends GetJoinedDataKeysFrom<Data & {}>>(dataKeys: DataKey | DataKey[] | boolean, forceTimeout?: number | null): void;
    refreshData<DataKey extends GetJoinedDataKeysFrom<Data & {}>>(dataKeys: DataKey | DataKey[] | boolean, forceTimeout?: number | null): void;
    /** Note that this only adds the refresh keys but will not refresh. */
    addRefreshKeys(refreshKeys?: string | string[] | boolean): void;
}

/** Only for local use. Mixes followingly: `_DataManMixin( _SignalManMixin( Base ) )`. */
declare function _DataSignalManMixin<Data = any, Signals extends SignalsRecord = {}>(Base: ClassType): {
    new (data?: any, ...args: any[]): {
        readonly data: any;
        dataListeners: Map<DataListenerFunc, string[]>;
        dataKeysPending: string[] | true | null;
        listenToData(...args: any[]): void;
        unlistenToData(callback: DataListenerFunc): boolean;
        getData(): any;
        getInData(dataKey: string, fallback?: any): any;
        setData(data: any, extend?: boolean, refresh?: boolean, ...timeArgs: any[]): void;
        setInData(dataKey: string, subData: any, extend?: boolean, refresh?: boolean, ...timeArgs: any[]): void;
        refreshData(dataKeys?: string | string[] | boolean | null, forceTimeout?: number | null): void;
        addRefreshKeys(refreshKeys: string | string[] | boolean): void;
    };
};
/** There are two ways you can use this:
 * 1. Call this to give basic DataSignalMan features with advanced typing being empty.
 *      * `class MyMix extends DataSignalManMixin(MyBase) {}`
 * 2. If you want to define the Data and Signals types, you can use this trick instead:
 *      * `class MyMix extends (DataSignalManMixin as ClassMixer<DataSignalManType<Data, Signals>>)(MyBase) {}`
 */
declare const DataSignalManMixin: ClassMixer<ClassType<DataMan & SignalMan>>;
interface DataSignalManType<Data = any, Signals extends SignalsRecord = {}> extends ClassType<DataSignalMan<Data, Signals>> {
}
declare const DataSignalMan_base: ClassType;
declare class DataSignalMan<Data = any, Signals extends SignalsRecord = {}> extends DataSignalMan_base {
}
interface DataSignalMan<Data = any, Signals extends SignalsRecord = {}> extends DataMan<Data>, SignalMan<Signals> {
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
    [Key in string & GetJoinedSignalKeysFromContexts<Ctxs>]: [Ctxs[FirstSplit<Key, ".">]["_Signals"][SecondSplit<Key, ".">]] extends [SignalListenerFunc] ? Ctxs[FirstSplit<Key, ".">]["_Signals"][SecondSplit<Key, ".">] : never;
};
type GetDataByContextString<Key extends string, Contexts extends ContextsAllType> = GetDataByContextKeys<SplitOnce<Key, ".">, Contexts>;
type GetDataByContextKeys<CtxKeys extends string[], Contexts extends ContextsAllType> = [
    CtxKeys[0]
] extends [keyof Contexts] ? [
    CtxKeys[1]
] extends [string] ? PropType<Contexts[CtxKeys[0]]["data"], CtxKeys[1], never> : Contexts[CtxKeys[0]]["data"] : never;
/** Builds a record of { [key]: trueFalseLike }, which is useful for internal quick checks. */
declare function buildRecordable<T extends string = any>(types: RecordableType<T>): Partial<Record<T, any>>;
/** ContextAPI looks like it has full SignalMan and DataMan capabilities but only extends SignalBoy internally.
 * - It has all the same methods, but does not have .data member and data listening can have a fallback array.
 * - All data keys and signal names should start with "contextName.", for example: "settings.theme" data key or "navigation.onFocus" signal.
 */
declare class ContextAPI<Contexts extends ContextsAllType = {}, CtxSignals extends SignalsRecord = MergeSignalsFromContexts<Contexts>> extends SignalBoy<CtxSignals> {
    /** Data needs mapping using the callback as the key and value contains the data needs. The data needs are also used as to get the argument values for the callback. */
    dataListeners: Map<DataListenerFunc, [needs: string[], fallbackArgs?: any[]]>;
    /** All the contexts assigned to us.
     * - They also have a link back to us by context.contextAPIs, with this as the key and context names as the values.
     * - Note that can also set `null` value here - for purposefully excluding an inherited context (when using one contextAPI to inherit contexts from another).
     *      * But `undefined` will never be found in here - if gives to the setContext, it means deleting the entry from the record. */
    contexts: Partial<Record<string, Context<any, SignalsRecord> | null>>;
    constructor(contexts?: Partial<Contexts>);
    /** This triggers a refresh and returns a promise that is resolved when the update / render cycle is completed.
     * - If there's nothing pending, then will resolve immediately.
     * - This uses the signals system, so the listener is called among other listeners depending on the adding order.
     * - Note that this method is overrideable. On the basic implementation it resolves immediately.
     *      * However, on the Host.contextAPI it's tied to the Host's update / render cycle - and serves as the bridge for syncing (to implement "delay" signals). */
    afterRefresh(fullDelay?: boolean, forceTimeout?: number | null): Promise<void>;
    /** Emit a signal. Does not return a value. Use `sendSignalAs(modes, ctxSignalName, ...args)` to refine the behaviour. */
    sendSignal<CtxSignalName extends string & keyof CtxSignals, CtxName extends keyof Contexts & FirstSplit<CtxSignalName, ".">, SignalName extends string & SecondSplit<CtxSignalName, ".">>(ctxSignalName: CtxSignalName, ...args: Parameters<Contexts[CtxName]["_Signals"][SignalName]>): void;
    /** This exposes various features to the signalling process which are inputted as the first arg: either string or string[]. Features are:
     * - "delay": Delays sending the signal. To also collect returned values must include "await".
     *      * Note that this delays the process to sync with the Context's refresh cycle and further after all the related host's have finished their "render" cycle.
     * - "pre-delay": Like "delay", syncs to the Context's refresh cycle, but calls then on that cycle - without waiting the host's to have rendered.
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
    /** This allows to listen to contextual data by defining specific needs which in turn become the listener arguments.
     * - The needs are defined as dotted strings in which the first word is the contextName: eg. `settings.user` refers to context named `settings` and it has `user` data.
     * - The needs are transferred to callback arguments. For example, if we have contexts named "settings" and "themes", we could do something like:
     *      * `listenToData("settings.user.allowEdit", "themes.darkMode", (allowEdit, darkMode) => { ... });`
     * - By calling this, we both assign a listener but also set data needs.
     *      *  The listener will be fired on data changes. If puts last argument to `true`, will be fired once immediately - or when mounts if not yet mounted.
     *      *  The data needs are used to detect when the callback needs to be fired again. Will only be fired if the data in the portion (or including it) has been set.
     * - Normally, using ContextAPI you never need to remove the listeners (they'll be disconnected upon unmounting). But you can use `unlistenToData(callback)` to do so manually as well.
     * - You can also input fallbackArgs after the callback, to provide for the cases where context is missing.
     */
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Fallback extends [fall1?: GetDataByContextString<Key1, Contexts> | null], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0]) => void>(dataKey1: Key1, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Fallback extends [fall1?: GetDataByContextString<Key1, Contexts> | null, fall2?: GetDataByContextString<Key2, Contexts> | null], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1]) => void>(dataKey1: Key1, dataKey2: Key2, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Fallback extends [fall1?: GetDataByContextString<Key1, Contexts> | null, fall2?: GetDataByContextString<Key2, Contexts> | null, fall3?: GetDataByContextString<Key3, Contexts> | null], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1], val3: GetDataByContextString<Key3, Contexts> | Fallback[2]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Fallback extends [fall1?: GetDataByContextString<Key1, Contexts> | null, fall2?: GetDataByContextString<Key2, Contexts> | null, fall3?: GetDataByContextString<Key3, Contexts> | null, fall4?: GetDataByContextString<Key4, Contexts> | null], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1], val3: GetDataByContextString<Key3, Contexts> | Fallback[2], val4: GetDataByContextString<Key4, Contexts> | Fallback[3]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Fallback extends [fall1?: GetDataByContextString<Key1, Contexts> | null, fall2?: GetDataByContextString<Key2, Contexts> | null, fall3?: GetDataByContextString<Key3, Contexts> | null, fall4?: GetDataByContextString<Key4, Contexts> | null, fall5?: GetDataByContextString<Key5, Contexts> | null], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1], val3: GetDataByContextString<Key3, Contexts> | Fallback[2], val4: GetDataByContextString<Key4, Contexts> | Fallback[3], val5: GetDataByContextString<Key5, Contexts> | Fallback[4]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Fallback extends [fall1?: GetDataByContextString<Key1, Contexts> | null, fall2?: GetDataByContextString<Key2, Contexts> | null, fall3?: GetDataByContextString<Key3, Contexts> | null, fall4?: GetDataByContextString<Key4, Contexts> | null, fall5?: GetDataByContextString<Key5, Contexts> | null, fall6?: GetDataByContextString<Key6, Contexts> | null], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1], val3: GetDataByContextString<Key3, Contexts> | Fallback[2], val4: GetDataByContextString<Key4, Contexts> | Fallback[3], val5: GetDataByContextString<Key5, Contexts> | Fallback[4], val6: GetDataByContextString<Key6, Contexts> | Fallback[5]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Key7 extends Keys, Fallback extends [fall1?: GetDataByContextString<Key1, Contexts> | null, fall2?: GetDataByContextString<Key2, Contexts> | null, fall3?: GetDataByContextString<Key3, Contexts> | null, fall4?: GetDataByContextString<Key4, Contexts> | null, fall5?: GetDataByContextString<Key5, Contexts> | null, fall6?: GetDataByContextString<Key6, Contexts> | null, fall7?: GetDataByContextString<Key7, Contexts> | null], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1], val3: GetDataByContextString<Key3, Contexts> | Fallback[2], val4: GetDataByContextString<Key4, Contexts> | Fallback[3], val5: GetDataByContextString<Key5, Contexts> | Fallback[4], val6: GetDataByContextString<Key6, Contexts> | Fallback[5], val7: GetDataByContextString<Key7, Contexts> | Fallback[6]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<Keys extends GetJoinedDataKeysFromContexts<Contexts>, Key1 extends Keys, Key2 extends Keys, Key3 extends Keys, Key4 extends Keys, Key5 extends Keys, Key6 extends Keys, Key7 extends Keys, Key8 extends Keys, Fallback extends [fall1?: GetDataByContextString<Key1, Contexts> | null, fall2?: GetDataByContextString<Key2, Contexts> | null, fall3?: GetDataByContextString<Key3, Contexts> | null, fall4?: GetDataByContextString<Key4, Contexts> | null, fall5?: GetDataByContextString<Key5, Contexts> | null, fall6?: GetDataByContextString<Key6, Contexts> | null, fall7?: GetDataByContextString<Key7, Contexts> | null, fall8?: GetDataByContextString<Key8, Contexts> | null], Callback extends (val1: GetDataByContextString<Key1, Contexts> | Fallback[0], val2: GetDataByContextString<Key2, Contexts> | Fallback[1], val3: GetDataByContextString<Key3, Contexts> | Fallback[2], val4: GetDataByContextString<Key4, Contexts> | Fallback[3], val5: GetDataByContextString<Key5, Contexts> | Fallback[4], val6: GetDataByContextString<Key6, Contexts> | Fallback[5], val7: GetDataByContextString<Key7, Contexts> | Fallback[6], val8: GetDataByContextString<Key8, Contexts> | Fallback[7]) => void>(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, dataKey8: Key8, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
    unlistenToData(callback: DataListenerFunc): boolean;
    /** Get from contextual data by dotted key: eg. `"someCtxName.someData.someProp"`.
     * - If the context exists uses the getInData method from the context, otherwise returns undefined or the fallback. (The fallback is also used if the data key not found in context data.)
     */
    getInData<CtxDataKey extends GetJoinedDataKeysFromContexts<Contexts>, SubData extends GetDataByContextString<CtxDataKey, Contexts>>(ctxDataKey: CtxDataKey, fallback?: never | undefined): SubData | undefined;
    getInData<CtxDataKey extends GetJoinedDataKeysFromContexts<Contexts>, SubData extends GetDataByContextString<CtxDataKey, Contexts>, FallbackData extends SubData>(ctxDataKey: CtxDataKey, fallback: FallbackData): SubData;
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
    newContext<CtxData = any, CtxSignals extends SignalsRecord = {}>(data: CtxData, overrideWithName?: never | "" | undefined, refreshIfOverriden?: never | false): Context<CtxData, CtxSignals>;
    newContext<Name extends keyof Contexts & string>(data: Contexts[Name]["data"], overrideWithName: Name, refreshIfOverriden?: boolean): Contexts[Name];
    /** Same as newContext but for multiple contexts all at once.
     * - If overrideForSelf set to true, will call setContexts after to attach the contexts here. */
    newContexts<Contexts extends {
        [Name in keyof AllData & string]: Context<AllData[Name]>;
    }, AllData extends {
        [Name in keyof Contexts & string]: Contexts[Name]["data"];
    } = {
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
     * - The timeout is used for both: data refresh and (normal) actions.
     * - If null, then synchronous - defaults to 0ms.
     * - Note that if you use null, the updates will run synchronously.
     *   .. It's not recommended to use it, because you'd have to make sure you always use it in that sense.
     *   .. For example, the component you called from might have already unmounted on the next line (especially if host is fully synchronous, too). */
    refreshTimeout: number | null;
};
/** Generic helper for classes with timer and method to call to execute rendering with a very specific logic.
 * - Returns the value that should be assigned as the stored timer (either existing one, new one or null). */
declare function callWithTimeout<Obj extends object, Timer extends number | NodeJSTimeout>(obj: Obj, callback: (this: Obj) => void, currentTimer: Timer | null, defaultTimeout: number | null, forceTimeout?: number | null): Timer | null;
/** Context provides signal and data listener features (extending `SignalMan` and `DataMan` basis).
 * - It provides direct listening but is also designed to work with ContextAPI instances.
 */
declare class Context<Data = any, Signals extends SignalsRecord = any> extends DataSignalMan<Data, Signals> {
    ["constructor"]: ContextType<Data, Signals>;
    settings: ContextSettings;
    /** The keys are the ContextAPIs this context is attached to with a name, and the values are the names (typically only one). They are used for refresh related purposes. */
    contextAPIs: Map<ContextAPI, string[]>;
    /** Temporary internal timer marker. */
    refreshTimer: number | NodeJSTimeout | null;
    /** Temporary internal callbacks that will be called when the update cycle is done. */
    private _afterUpdate?;
    /** Temporary internal callbacks that will be called after the update cycle and the related host "render" refresh have been flushed. */
    private _afterRender?;
    constructor(data: any, settings?: Partial<ContextSettings> | null | undefined);
    /** Overridden to support getting signal listeners from related contextAPIs - in addition to direct listeners (which are put first). */
    getListenersFor(signalName: string): SignalListener[] | undefined;
    /** This returns a promise that is resolved when the context is refreshed, or after all the hosts have refreshed. */
    afterRefresh(fullDelay?: boolean, forceTimeout?: number | null): Promise<void>;
    /** Trigger refresh of the context and optionally add data keys.
     * - This triggers calling pending data keys and delayed signals (when the refresh cycle is executed). */
    refreshData<DataKey extends GetJoinedDataKeysFrom<Data & {}>>(dataKeys: DataKey | DataKey[] | boolean | null, forceTimeout?: number | null): void;
    triggerRefresh(forceTimeout?: number | null): void;
    /** This refreshes the context immediately.
     * - This is assumed to be called only by the .refresh function above.
     * - So it will mark the timer as cleared, without using clearTimeout for it. */
    private refreshPending;
    /** Update settings with a dictionary. If any value is `undefined` then uses the default setting. */
    modifySettings(settings: Partial<ContextSettings>): void;
    static getDefaultSettings(): ContextSettings;
    /** This is only provided for typing related technical reasons. There's no actual _Signals member on the javascript side.
     * - Note. Due to complex typing (related to ContextAPI having multiple contexts), we need to have it without undefined (_Signals? is not okay).
     */
    _Signals: Signals;
}
type ContextType<Data = any, Signals extends SignalsRecord = SignalsRecord> = ClassType<Context<Data, Signals>, [Data?, Partial<ContextSettings>?]> & {};
/** Create a new context. */
declare const newContext: <Data = any, Signals extends SignalsRecord = SignalsRecord>(data?: Data, settings?: Partial<ContextSettings>) => Context<Data, Signals>;
/** Create multiple named contexts by giving data. */
declare const newContexts: <Contexts extends { [Name in keyof AllData & string]: Context<AllData[Name]>; }, AllData extends { [Name in keyof Contexts & string]: Contexts[Name]["data"]; } = { [Name in keyof Contexts & string]: Contexts[Name]["data"]; }>(contextsData: AllData, settings?: Partial<ContextSettings>) => Contexts;

export { Awaited, ClassMixer, ClassType, Context, ContextAPI, ContextSettings, ContextType, ContextsAllOrNullType, ContextsAllType, DataListenerFunc, DataMan, DataManMixin, DataManType, DataSignalMan, DataSignalManMixin, DataSignalManType, Dictionary, FirstSplit, GetConstructorArgs, GetConstructorReturn, GetJoinedDataKeysFrom, GetJoinedDataKeysFromContexts, GetJoinedSignalKeysFromContexts, Join, MergeSignalsFromContexts, NodeJSTimeout, PropType, RecordableType, SecondSplit, SignalBoy, SignalListener, SignalListenerFunc, SignalMan, SignalManFlags, SignalManMixin, SignalManType, SignalSendAsReturn, SignalsRecord, Split, SplitOnce, _DataManMixin, _DataSignalManMixin, _SignalBoyMixin, _SignalManMixin, askListeners, buildRecordable, callListeners, callWithTimeout, newContext, newContexts };
