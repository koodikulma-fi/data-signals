

// - Imports - //

// Typing.
import { PropType, GetJoinedDataKeysFrom, ClassType, ClassMixer, PropTypeDictionary } from "../library/typing";


// - Helper types - //

/** Technically should return void. But for conveniency can return anything - does not use the return value in any case. */
export type DataListenerFunc = (...args: any[]) => any | void;


// - Mixin - //
// 
// This can be used as a basis for providing data listening and refreshing features.

export function _DataManMixin<Data extends Record<string, any> = {}>(Base: ClassType) {

    return class _DataMan extends Base {


        // - Members - //

        // Data & contents.
        public readonly data: Data;
        /** External data listeners.
         * - These are called after the data refreshes, though might be tied to update cycles at an external layer - eg. to refresh the whole app in sync.
         * - The keys are data listener callbacks, and values are: `[fallbackArgs, ...dataNeeds]`.
         */
        public dataListeners: Map<DataListenerFunc, [fallbackArgs: any[] | undefined, ...dataNeeds: string[]]>;
        /** The pending data keys - for internal refreshing uses. */
        dataKeysPending: string[] | true | null;


        // - Construct - //

        constructor(...args: {} extends Data ? any[] : [Data, ...any[]]) {
            // Base.
            super(...args.slice(1));
            // Listeners.
            this.dataListeners = new Map();
            this.dataKeysPending = null;
            // Data.
            this.data = args[0] || {} as Data;
        }


        // - Data listening - //

        public listenToData(...args: any[]): void {
            // Parse.
            let iOffset = 1;
            const nArgs = args.length;
            const callImmediately = typeof args[nArgs - iOffset] === "boolean" && args[nArgs - iOffset++];
            const isDictionary = typeof args[0] === "object";
            const fallbackArgs: any[] | undefined = isDictionary ? Object.values(args[0] as Record<string, any>) as string[] : Array.isArray(args[nArgs - iOffset]) ? args[nArgs - iOffset++]?.slice() : undefined;
            const dataNeeds = isDictionary ? Object.keys(args[0]) : args.slice(0, nArgs - iOffset);
            const callback: DataListenerFunc = args[nArgs - iOffset];
            // Add / Override.
            this.dataListeners.set(callback, [fallbackArgs, ...dataNeeds]);
            // Call.
            if (callImmediately)
                callback(...this.getDataArgsBy(dataNeeds, fallbackArgs));
        }

        /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
        public unlistenToData(callback: DataListenerFunc): boolean {
            // Doesn't have.
            if (!this.dataListeners.has(callback))
                return false;
            // Remove.
            this.dataListeners.delete(callback);
            return true;
        }


        // - Get and set data - //

        public getData(): Data {
            return this.data;
        }

        public getInData(dataKey: string, fallback?: any): any {
            // No data.
            if (!this.data)
                return fallback;
            // No data key - get the whole data.
            if (!dataKey)
                return this.data;
            // Split keys.
            const dataKeys = dataKey.split(".");
            let data = this.data as Record<string, any>;
            for (const key of dataKeys) {
                if (!data)
                    return fallback;
                data = data[key];
            }
            // Return the nested data.
            return data === undefined ? fallback : data;
        }

        public setData(data: Data, extend: boolean = true, refresh: boolean = true, ...timeArgs: any[]): void {
            // Set data and refresh. Note that we modify a readonly value here.
            (this.data as any) = extend !== false ? { ...this.data, ...data } as Data : data;
            // Refresh or just add keys.
            refresh ? this.refreshData(true, ...timeArgs) : this.addRefreshKeys(true);
        }

        public setInData(dataKey: string, subData: any, extend: boolean = false, refresh: boolean = true, ...timeArgs: any[]): void {
            // Special cases.
            if (!this.data)
                return;
            // No data key.
            if (!dataKey) {
                (this.data as any) = extend && this.data ? { ...this.data as object, ...subData as object } as Data : subData;
            }
            // Set partially.
            else {
                // Prepare.
                const dataKeys = dataKey.split(".");
                const lastKey = dataKeys.pop();
                // .. Handle invalid case. We need to have last key.
                if (!lastKey)
                    return;
                // Get data parent.
                let data = this.data as Record<string, any>;
                for (const key of dataKeys)
                    data = data[key] || (data[key] = {});
                // Extend.
                if (extend) {
                    const last = data[lastKey];
                    if (!last || last.constructor !== Object)
                        extend = false;
                    else
                        data[lastKey] = {...last, ...subData as object};
                }
                // Set.
                if (!extend)
                    data[lastKey] = subData;
            }
            // Refresh or just add keys.
            refresh ? this.refreshData(dataKey || true, ...timeArgs) : this.addRefreshKeys(dataKey || true);
        }

        /** Trigger refresh and optionally add data keys for refreshing.
         * - This triggers callbacks from dataListeners that match needs in dataKeysPending.
         * - This base implementation just calls the listeners with matching keys immediately / after the given timeout.
         * - Note that you might want to override this method and tie it to some refresh system.
         *      * In that case, remember to feed the keys: `if (dataKeys) this.addRefreshKeys(dataKeys);`
         */
        public refreshData(dataKeys?: string | string[] | boolean | null, forceTimeout?: number | null): void {
            // Add keys.
            if (dataKeys)
                this.addRefreshKeys(dataKeys);
            
            // Provide the base implementation for refreshing.
            // Call after a timeout.
            if (forceTimeout != null) {
                setTimeout(() => this.refreshData(null), forceTimeout);
                return;
            }
            // Get and clear pending refreshes.
            const refreshKeys = this.dataKeysPending;
            this.dataKeysPending = null;
            // Call each.
            if (refreshKeys)
                this.callDataBy(refreshKeys as any);
        }
        
        /** Note that this only adds the refresh keys but will not refresh. */
        public addRefreshKeys(refreshKeys: string | string[] | boolean): void {
            // Set to all.
            if (refreshKeys === true)
                this.dataKeysPending = true;
            // Add given.
            else if (refreshKeys && (this.dataKeysPending !== true)) {
                // Into array.
                if (typeof refreshKeys === "string")
                    refreshKeys = [ refreshKeys ];
                // Set.
                if (!this.dataKeysPending)
                    this.dataKeysPending = [...refreshKeys];
                // Add if weren't there already.
                else {
                    for (const key of refreshKeys) {
                        // Add if not already included by a direct match or by a parenting branch.
                        if (!this.dataKeysPending.some(otherKey => otherKey === key || key.startsWith(otherKey + ".")))
                            this.dataKeysPending.push(key);
                    }
                }
            }
        }


        // - Helpers - //

        /** Helper to build data arguments with fallbacks.
         * - For example: `getDataArgsBy(["common.user.name", "view.darkMode"])`.
         * - Used internally but can be used for manual purposes.
         */
        public getDataArgsBy(needs: GetJoinedDataKeysFrom<Data>[], fallbackArgs?: any[]): any[] {
            return fallbackArgs ? needs.map((need, i) => this.getInData(need, fallbackArgs[i])) : needs.map((need, i) => this.getInData(need));
        }
        /** Manually trigger an update based on changes in context. Should not be used in normal circumstances.
         * - Only calls / triggers for refresh by needs related to the given contexts. If ctxNames is true, then all.
         */
        public callDataBy(refreshKeys: true | GetJoinedDataKeysFrom<Data>[] = true): void {
            // Loop each callback, and call if needs to.
            for (const [callback, [fallbackArgs, ...needs]] of this.dataListeners.entries()) { // Note that we use .entries() to take a copy of the situation.
                if (refreshKeys === true || refreshKeys.some((dataKey: string) => needs.some(need => need === dataKey || need.startsWith(dataKey + ".") || dataKey.startsWith(need + ".")))) 
                    callback(...this.getDataArgsBy(needs as GetJoinedDataKeysFrom<Data>[], fallbackArgs));
            }
        }

    }
}

/** There are two ways you can use this:
 * 1. Call this to give basic DataMan features with advanced typing being empty.
 *      * `class MyMix extends DataManMixin(MyBase) {}`
 * 2. If you want to define the Data and Signals types, you can use this trick instead:
 *      * `class MyMix extends (DataManMixin as ClassMixer<DataManType<Data, Signals>>)(MyBase) {}`
 */
export const DataManMixin = _DataManMixin as unknown as ClassMixer<ClassType<DataMan>>;


// - Class - //

export interface DataManType<Data extends Record<string, any> = {}> extends ClassType<DataMan<Data>> { }
export class DataMan<Data extends Record<string, any> = {}> extends _DataManMixin(Object) {
    
    // Allow without data if data is set to {}, then we can fall it back automatically.
    constructor(...args: {} extends Data ? any[] : [Data, ...any[]]);
    constructor(...args: any[]) {
        super(...args);
    }

}
/** DataMan provides data setting and listening features with dotted strings.
 * - Example to create: `const dataMan = new DataMan({ ...initData });`
 * - Example for listening: `dataMan.listenToData("some.data.key", "another", (some, other) => { ... })`
 * - Example for setting data: `dataMan.setInData("some.data.key", somedata)`
 */
export interface DataMan<Data extends Record<string, any> = {}> {
    

    // - Members - //

    // Typing.
    ["constructor"]: DataManType<Data>;

    // Data & contents.
    readonly data: Data;
    /** External data listeners.
     * - These are called after the data refreshes, though might be tied to update cycles at an external layer - to refresh the whole app in sync.
     * - The keys are data listener callbacks, and values are: `[fallbackArgs, ...dataNeeds]`.
     */
    dataListeners: Map<DataListenerFunc, [fallbackArgs: any[] | undefined, ...needs: string[]]>;
    /** The pending data keys - for internal refreshing uses. */
    dataKeysPending: string[] | true | null;


    // - Data listening - //

    // Using dictionary.
    /** Listen to data using a dictionary whose keys are data keys and values fallbacks. If you want to strictly define the types in the dictionary add `as const` after its definition. */
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Fallbacks extends Partial<Record<Keys, any>>
    >(fallbackDictionary: Fallbacks, callback: (values: PropTypeDictionary<Data, Fallbacks>) => void, callImmediately?: boolean): void;

    // Using pre-suggested keys and no fallback (it's not really needed as we are the direct owners of the data).
    /** This allows to listen to data by defining specific needs which in turn become the listener arguments.
     * - The needs are defined as dotted strings: For example, `listenToData("user.allowEdit", "themes.darkMode", (allowEdit, darkMode) => { ... });`
     * - By calling this, we both assign a listener but also set data needs to it, so it will only be called when the related data portions have changed.
     * - To remove the listener use `unlistenToData(callback)`.
     */
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Key1 extends Keys,
        Fallback extends [ fall1?: any],
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0]) => void,
    >(dataKey: Key1, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Key1 extends Keys,
        Key2 extends Keys,
        Fallback extends [ fall1?: any, fall2?: any],
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1]) => void,
    >(dataKey1: Key1, dataKey2: Key2, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Fallback extends [ fall1?: any, fall2?: any, fall3?: any],
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2]) => void,
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Fallback extends [ fall1?: any, fall2?: any, fall3?: any, fall4?: any],
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3]) => void,
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Fallback extends [ fall1?: any, fall2?: any, fall3?: any, fall4?: any, fall5?: any],
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4]) => void,
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Key6 extends Keys,
        Fallback extends [ fall1?: any, fall2?: any, fall3?: any, fall4?: any, fall5?: any, fall6?: any],
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5]) => void,
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Key6 extends Keys,
        Key7 extends Keys,
        Fallback extends [ fall1?: any, fall2?: any, fall3?: any, fall4?: any, fall5?: any, fall6?: any, fall7?: any ],
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5], val7: PropType<Data, Key7, never> | Fallback[6]) => void,
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Key6 extends Keys,
        Key7 extends Keys,
        Key8 extends Keys,
        Fallback extends [ fall1?: any, fall2?: any, fall3?: any, fall4?: any, fall5?: any, fall6?: any, fall7?: any, fall8?: any ],
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5], val7: PropType<Data, Key7, never> | Fallback[6], val8: PropType<Data, Key8, never> | Fallback[7]) => void,
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, dataKey8: Key8, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;

    /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
    unlistenToData(callback: DataListenerFunc): boolean;


    // - Get and set data - //

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
