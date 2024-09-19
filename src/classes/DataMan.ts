
// - Imports - //

// Dependency.
import { ClassType, AsClass } from "mixin-types";
// Library.
import { PropType, GetJoinedDataKeysFrom } from "../library/typing";
// Base.
import { DataBoy, DataBoyType, mixinDataBoy } from "./DataBoy";


// - Class - //

/** Class type for DataMan. */
export interface DataManType<Data extends Record<string, any> = {}> extends AsClass<DataBoyType<Data>, DataMan<Data>, {} extends Data ? [Data?] : [Data]> { }
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
export class DataMan<Data extends Record<string, any> = {}> extends (mixinDataMan(Object) as any as ClassType) {
    
    // // Allow without data if data is set to {}, then we can fall it back automatically.
    // constructor(...args: {} extends Data ? [Data?] : [Data, ...any[]]);
    // constructor(...args: any[]) {
    //     super(...args);
    // }

}
export interface DataMan<Data extends Record<string, any> = {}> extends DataBoy<Data> {
    

    // - Members - //

    // Typing.
    ["constructor"]: DataManType<Data>;

    // Data & contents.
    readonly data: Data;
    /** The pending data keys - for internal refreshing uses. */
    dataKeysPending: string[] | true | null;


    // - Get / set data - //

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


// - Mixin - //

/** Add DataMan features to a custom class.
 * - Note. Either provide the BaseClass type specifically as the 2nd type argument or use AsMixin trick (see below).
 * 
 * ```
 * // Type data.
 * type MyData = { something: boolean; };
 * 
 * // Example #1: Create a class extending mixinDataMan with <MyData>.
 * class Test extends mixinDataMan<MyData>(Object) {
 * 
 *    test() {
 *        this.listenToData("something", (something) => {});
 *    }
 * }
 * 
 * // Example #2: Create a class extending mixinDataMan<MyData> and a custom class as the base.
 * class MyBase {
 *     public someMember: number = 0;
 * }
 * class Test2a extends mixinDataMan<MyData, typeof MyBase>(MyBase) { // Needs to specify the base type explicitly here.
 * 
 *    test2() {
 *        this.someMember = 1;
 *        this.listenToData("something", (something) => {});
 *    }
 * }
 * // Or alternatively.
 * class Test2b extends (mixinDataMan as AsMixin<DataMan<MyData>>)(MyBase) { // Get MyBase type dynamically.
 *     
 *     test2() {
 *         this.someMember = 1;
 *         this.listenToData("something", (something) => {});
 *     }
 * }
 * 
 * // Example #3: Pass generic Data from outside with MyBase.
 * // .. Declare an interface extending what we want to extend, supporting passing generic <Data> further.
 * interface Test3<Data extends Record<string, any> = {}> extends DataMan<Data>, MyBase {}
 * // .. Declare a class with base `as ClassType`, so that the interface can fully define the base.
 * class Test3<Data extends Record<string, any> = {}> extends (mixinDataMan(MyBase) as ClassType) {
 * 
 *    // // Just pass. You need to redefine constructor for the class inside the class for it to be effective.
 *    // constructor(...args: GetConstructorArgs<DataManType<Data>>) {
 *    //     super(...args);
 *    // }
 * 
 *    // Or, if we have some custom things, can specify further.
 *    // .. Since we know our base: MyBase < DataMan < Test3, no need to add (...args: any[]) to the constructor.
 *    refreshTimeout: number | null;
 *    constructor(data: Data, refreshTimeout: number | null) {
 *        super(data);
 *        this.refreshTimeout = refreshTimeout;
 *    }
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
export function mixinDataMan<Data extends Record<string, any> = {}, BaseClass extends ClassType = ClassType>(Base: BaseClass): AsClass<
    // Static.
    DataManType<Data> & BaseClass,
    // Instanced.
    DataMan<Data> & InstanceType<BaseClass>,
    // Constructor args.
    {} extends Data ? [Data?, ...any[]] : [Data, ...any[]]
> {
    // For clarity of usage and avoid problems with deepness, we don't use the <Data> here at all and return ClassType.
    return class DataMan extends (mixinDataBoy(Base) as DataBoyType) {


        // - Members - //

        // Data & contents.
        public readonly data: Record<string, any>;
        /** The pending data keys - for internal refreshing uses. */
        public dataKeysPending: string[] | true | null;

        constructor(...args: [Record<string, any>?, ...any[]]) {
            // Base.
            super(...args.slice(1));
            // Listeners.
            this.dataListeners = new Map();
            this.dataKeysPending = null;
            // Data.
            this.data = args[0] || {};
        }


        // - Get / set data - //

        public getData(): Record<string, any> {
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

        public setData(data: Record<string, any>, extend: boolean = true, refresh: boolean = true, forceTimeout?: number | null): void {
            // Set data and refresh. Note that we modify a readonly value here.
            (this.data as any) = extend !== false ? { ...this.data, ...data } : data;
            // Refresh or just add keys.
            refresh ? this.refreshData(true, forceTimeout) : this.addRefreshKeys(true);
        }

        public setInData(dataKey: string, subData: any, extend: boolean = true, refresh: boolean = true, forceTimeout?: number | null): void {
            // Special cases.
            if (!this.data)
                return;
            // No data key.
            if (!dataKey) {
                (this.data as Record<string, any>) = extend && this.data ? { ...this.data, ...subData } : subData;
            }
            // Set partially.
            else {
                // Prepare.
                const dataKeys = dataKey.split(".");
                const lastKey = dataKeys.pop();
                // Invalid - we need to have last key.
                if (!lastKey)
                    return;
                // Get data parent, and take copies of all dictionary types along the way until the leaf.
                let data = { ...this.data as Record<string, any> } = this.data as Record<string, any>;
                for (const key of dataKeys)
                    data = data[key] = data[key]?.constructor === Object ? { ...data[key] } : data[key] || {};
                // Extend or replace the data at the leaf.
                data[lastKey] = extend && data[lastKey]?.constructor === Object ? {...data[lastKey], ...subData as Record<string, any>} : subData;
            }
            // Refresh or just add keys.
            refresh ? this.refreshData(dataKey || true, forceTimeout) : this.addRefreshKeys(dataKey || true);
        }


        // - Refresh data - //

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

    } as any; // We're detached from the return type.
}
