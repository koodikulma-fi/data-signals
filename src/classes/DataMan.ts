

// - Imports - //

// Library.
import { PropType, GetJoinedDataKeysFrom, ClassType, ClassMixer } from "../types";


// - Helper types - //

/** Technically should return void. But for conveniency can return anything - does not use the return value in any case. */
export type DataListenerFunc = (...args: any[]) => any | void;


// - Mixin - //
// 
// This can be used as a basis for providing data listening and refreshing features.

export function _DataManMixin<Data = any>(Base: ClassType) {

    return class _DataMan extends Base {


        // - Members - //

        // Data & contents.
        public readonly data: Data;
        /** External data listeners - called after the contextual components. The keys are data listener callbacks, and values are the data needs. */
        public dataListeners: Map<DataListenerFunc, string[]>;
        /** The pending data keys - for internal refreshing uses. */
        dataKeysPending: string[] | true | null;


        // - Construct - //

        constructor(data?: any, ...args: any[]) {
            // Base.
            super(...args);
            // Listeners.
            this.dataListeners = new Map();
            this.dataKeysPending = null;
            // Data.
            this.data = data;
        }


        // - Data listening - //

        public listenToData(...args: any[]): void {
            // Parse.
            let iOffset = 1;
            const nArgs = args.length;
            const callImmediately = typeof args[nArgs - iOffset] === "boolean" && args[nArgs - iOffset++];
            const callback: DataListenerFunc = args[nArgs - iOffset];
            const dataNeeds = args.slice(0, nArgs - iOffset);
            // Add / Override.
            this.dataListeners.set(callback, dataNeeds);
            // Call.
            if (callImmediately)
                callback(...dataNeeds.map(need => this.getInData(need)));
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

        public setData(data: Data, extend: boolean = false, refresh: boolean = true, ...timeArgs: any[]): void {
            // Set data and refresh. Note that we modify a readonly value here.
            (this.data as any) = extend && this.data ? { ...this.data as object, ...data as object } as Data : data;
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
            if (refreshKeys) {
                for (const [callback, needs] of this.dataListeners.entries()) { // Note that we use .entries() to take a copy of the situation.
                    if (refreshKeys === true || refreshKeys.some(dataKey => needs.some(need => need === dataKey || need.startsWith(dataKey + ".") || dataKey.startsWith(need + ".")))) 
                        callback(...needs.map(need => this.getInData(need)));
                }
            }
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

export interface DataManType<Data = any> extends ClassType<DataMan<Data>> { }
export class DataMan<Data = any> extends _DataManMixin(Object) { }
/** This provides data setting and listening features with dotted strings.
 * - Example to create: `const dataMan = new DataMan({ ...initData });`
 * - Example for listening: `dataMan.listenToData("some.data.key", "another", (some, other) => { ... })`
 * - Example for setting data: `dataMan.setInData("some.data.key", somedata)`
 */
export interface DataMan<Data = any> {


    // - Members - //

    // Data & contents.
    readonly data: Data;
    /** External data listeners - called after the contextual components. The keys are data listener callbacks, and values are the data needs. */
    dataListeners: Map<DataListenerFunc, string[]>;
    /** The pending data keys - for internal refreshing uses. */
    dataKeysPending: string[] | true | null;


    // - Data listening - //

    // Using pre-suggested keys and no fallback (it's not really needed as we are the direct owners of the data).
    /** This allows to listen to data by defining specific needs which in turn become the listener arguments.
     * - The needs are defined as dotted strings: For example, `listenToData("user.allowEdit", "themes.darkMode", (allowEdit, darkMode) => { ... });`
     * - By calling this, we both assign a listener but also set data needs to it, so it will only be called when the related data portions have changed.
     * - To remove the listener use `unlistenToData(callback)`.
     */
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data & {}>,
        Key1 extends Keys,
        Callback extends (val1: PropType<Data, Key1, never>) => void,
    >(dataKey: Key1, callback: Callback, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data & {}>,
        Key1 extends Keys,
        Key2 extends Keys,
        Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>) => void,
    >(dataKey1: Key1, dataKey2: Key2, callback: Callback, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data & {}>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>, val3: PropType<Data, Key3, never>) => void,
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, callback: Callback, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data & {}>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null, fall4?: PropType<Data, Key4, never> | null],
        Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>, val3: PropType<Data, Key3, never>, val4: PropType<Data, Key4, never>) => void,
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, callback: Callback, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data & {}>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>, val3: PropType<Data, Key3, never>, val4: PropType<Data, Key4, never>, val5: PropType<Data, Key5, never>) => void,
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, callback: Callback, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data & {}>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Key6 extends Keys,
        Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>, val3: PropType<Data, Key3, never>, val4: PropType<Data, Key4, never>, val5: PropType<Data, Key5, never>, val6: PropType<Data, Key6, never>) => void,
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, callback: Callback, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data & {}>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Key6 extends Keys,
        Key7 extends Keys,
        Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>, val3: PropType<Data, Key3, never>, val4: PropType<Data, Key4, never>, val5: PropType<Data, Key5, never>, val6: PropType<Data, Key6, never>, val7: PropType<Data, Key7, never>) => void,
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, callback: Callback, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data & {}>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Key6 extends Keys,
        Key7 extends Keys,
        Key8 extends Keys,
        Callback extends (val1: PropType<Data, Key1, never>, val2: PropType<Data, Key2, never>, val3: PropType<Data, Key3, never>, val4: PropType<Data, Key4, never>, val5: PropType<Data, Key5, never>, val6: PropType<Data, Key6, never>, val7: PropType<Data, Key7, never>, val8: PropType<Data, Key8, never>) => void,
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, dataKey8: Key8, callback: Callback, callImmediately?: boolean): void;

    /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
    unlistenToData(callback: DataListenerFunc): boolean;


    // - Get and set data - //

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


// - Backup typing - //
// 
// listenToData<
//     Key1 extends CheckDataByKey<Key1, Data>,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0]) => void,
// >(dataKey: Key1, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Key1 extends CheckDataByKey<Key1, Data>,
//     Key2 extends CheckDataByKey<Key2, Data>,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1]) => void,
// >(dataKey1: Key1, dataKey2: Key2, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Key1 extends CheckDataByKey<Key1, Data>,
//     Key2 extends CheckDataByKey<Key2, Data>,
//     Key3 extends CheckDataByKey<Key3, Data>,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2]) => void,
// >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Key1 extends CheckDataByKey<Key1, Data>,
//     Key2 extends CheckDataByKey<Key2, Data>,
//     Key3 extends CheckDataByKey<Key3, Data>,
//     Key4 extends CheckDataByKey<Key4, Data>,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null, fall4?: PropType<Data, Key4, never> | null],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3]) => void,
// >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Key1 extends CheckDataByKey<Key1, Data>,
//     Key2 extends CheckDataByKey<Key2, Data>,
//     Key3 extends CheckDataByKey<Key3, Data>,
//     Key4 extends CheckDataByKey<Key4, Data>,
//     Key5 extends CheckDataByKey<Key5, Data>,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null, fall4?: PropType<Data, Key4, never> | null, fall5?: PropType<Data, Key5, never> | null],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4]) => void,
// >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Key1 extends CheckDataByKey<Key1, Data>,
//     Key2 extends CheckDataByKey<Key2, Data>,
//     Key3 extends CheckDataByKey<Key3, Data>,
//     Key4 extends CheckDataByKey<Key4, Data>,
//     Key5 extends CheckDataByKey<Key5, Data>,
//     Key6 extends CheckDataByKey<Key6, Data>,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null, fall4?: PropType<Data, Key4, never> | null, fall5?: PropType<Data, Key5, never> | null, fall6?: PropType<Data, Key6, never> | null],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5]) => void,
// >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Key1 extends CheckDataByKey<Key1, Data>,
//     Key2 extends CheckDataByKey<Key2, Data>,
//     Key3 extends CheckDataByKey<Key3, Data>,
//     Key4 extends CheckDataByKey<Key4, Data>,
//     Key5 extends CheckDataByKey<Key5, Data>,
//     Key6 extends CheckDataByKey<Key6, Data>,
//     Key7 extends CheckDataByKey<Key7, Data>,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null, fall4?: PropType<Data, Key4, never> | null, fall5?: PropType<Data, Key5, never> | null, fall6?: PropType<Data, Key6, never> | null, fall7?: PropType<Data, Key7, never> | null ],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5], val7: PropType<Data, Key7, never> | Fallback[6]) => void,
// >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Key1 extends CheckDataByKey<Key1, Data>,
//     Key2 extends CheckDataByKey<Key2, Data>,
//     Key3 extends CheckDataByKey<Key3, Data>,
//     Key4 extends CheckDataByKey<Key4, Data>,
//     Key5 extends CheckDataByKey<Key5, Data>,
//     Key6 extends CheckDataByKey<Key6, Data>,
//     Key7 extends CheckDataByKey<Key7, Data>,
//     Key8 extends CheckDataByKey<Key8, Data>,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null, fall4?: PropType<Data, Key4, never> | null, fall5?: PropType<Data, Key5, never> | null, fall6?: PropType<Data, Key6, never> | null, fall7?: PropType<Data, Key7, never> | null, fall8?: PropType<Data, Key8, never> | null ],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5], val7: PropType<Data, Key7, never> | Fallback[6], val8: PropType<Data, Key8, never> | Fallback[7]) => void,
// >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, dataKey8: Key8, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;

// // Alternative. Using pre-suggested keys for better typing experience.
// listenToData<
//     Keys extends GetJoinedDataKeysFrom<Data & {}>,
//     Key1 extends Keys,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0]) => void,
// >(dataKey: Key1, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Keys extends GetJoinedDataKeysFrom<Data & {}>,
//     Key1 extends Keys,
//     Key2 extends Keys,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1]) => void,
// >(dataKey1: Key1, dataKey2: Key2, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Keys extends GetJoinedDataKeysFrom<Data & {}>,
//     Key1 extends Keys,
//     Key2 extends Keys,
//     Key3 extends Keys,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2]) => void,
// >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Keys extends GetJoinedDataKeysFrom<Data & {}>,
//     Key1 extends Keys,
//     Key2 extends Keys,
//     Key3 extends Keys,
//     Key4 extends Keys,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null, fall4?: PropType<Data, Key4, never> | null],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3]) => void,
// >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Keys extends GetJoinedDataKeysFrom<Data & {}>,
//     Key1 extends Keys,
//     Key2 extends Keys,
//     Key3 extends Keys,
//     Key4 extends Keys,
//     Key5 extends Keys,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null, fall4?: PropType<Data, Key4, never> | null, fall5?: PropType<Data, Key5, never> | null],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4]) => void,
// >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Keys extends GetJoinedDataKeysFrom<Data & {}>,
//     Key1 extends Keys,
//     Key2 extends Keys,
//     Key3 extends Keys,
//     Key4 extends Keys,
//     Key5 extends Keys,
//     Key6 extends Keys,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null, fall4?: PropType<Data, Key4, never> | null, fall5?: PropType<Data, Key5, never> | null, fall6?: PropType<Data, Key6, never> | null],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5]) => void,
// >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Keys extends GetJoinedDataKeysFrom<Data & {}>,
//     Key1 extends Keys,
//     Key2 extends Keys,
//     Key3 extends Keys,
//     Key4 extends Keys,
//     Key5 extends Keys,
//     Key6 extends Keys,
//     Key7 extends Keys,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null, fall4?: PropType<Data, Key4, never> | null, fall5?: PropType<Data, Key5, never> | null, fall6?: PropType<Data, Key6, never> | null, fall7?: PropType<Data, Key7, never> | null ],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5], val7: PropType<Data, Key7, never> | Fallback[6]) => void,
// >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
// listenToData<
//     Keys extends GetJoinedDataKeysFrom<Data & {}>,
//     Key1 extends Keys,
//     Key2 extends Keys,
//     Key3 extends Keys,
//     Key4 extends Keys,
//     Key5 extends Keys,
//     Key6 extends Keys,
//     Key7 extends Keys,
//     Key8 extends Keys,
//     Fallback extends [ fall1?: PropType<Data, Key1, never> | null, fall2?: PropType<Data, Key2, never> | null, fall3?: PropType<Data, Key3, never> | null, fall4?: PropType<Data, Key4, never> | null, fall5?: PropType<Data, Key5, never> | null, fall6?: PropType<Data, Key6, never> | null, fall7?: PropType<Data, Key7, never> | null, fall8?: PropType<Data, Key8, never> | null ],
//     Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5], val7: PropType<Data, Key7, never> | Fallback[6], val8: PropType<Data, Key8, never> | Fallback[7]) => void,
// >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, dataKey8: Key8, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
