// - Imports - //
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
// Base.
import { mixinDataBoy } from "./DataBoy";
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
export class DataMan extends mixinDataMan(Object) {
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
export function mixinDataMan(Base) {
    // For clarity of usage and avoid problems with deepness, we don't use the <Data> here at all and return ClassType.
    return class DataMan extends mixinDataBoy(Base) {
        constructor(...args) {
            // Base.
            super(...args.slice(1));
            // Listeners.
            this.dataListeners = new Map();
            this.dataKeysPending = null;
            // Data.
            this.data = args[0] || {};
        }
        // - Get / set data - //
        getData() {
            return this.data;
        }
        getInData(dataKey, fallback) {
            // No data.
            if (!this.data)
                return fallback;
            // No data key - get the whole data.
            if (!dataKey)
                return this.data;
            // Split keys.
            const dataKeys = dataKey.split(".");
            let data = this.data;
            for (const key of dataKeys) {
                if (!data)
                    return fallback;
                data = data[key];
            }
            // Return the nested data.
            return data === undefined ? fallback : data;
        }
        setData(data, extend = true, refresh = true, forceTimeout) {
            // Set data and refresh. Note that we modify a readonly value here.
            this.data = extend !== false ? Object.assign(Object.assign({}, this.data), data) : data;
            // Refresh or just add keys.
            refresh ? this.refreshData(true, forceTimeout) : this.addRefreshKeys(true);
        }
        setInData(dataKey, subData, extend = true, refresh = true, forceTimeout) {
            var _a;
            var _b, _c;
            // Special cases.
            if (!this.data)
                return;
            // No data key.
            if (!dataKey) {
                this.data = extend && this.data ? Object.assign(Object.assign({}, this.data), subData) : subData;
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
                let data = (_a = this.data, this.data = __rest(_a, []), _a);
                for (const key of dataKeys)
                    data = data[key] = ((_b = data[key]) === null || _b === void 0 ? void 0 : _b.constructor) === Object ? Object.assign({}, data[key]) : data[key] || {};
                // Extend or replace the data at the leaf.
                data[lastKey] = extend && ((_c = data[lastKey]) === null || _c === void 0 ? void 0 : _c.constructor) === Object ? Object.assign(Object.assign({}, data[lastKey]), subData) : subData;
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
        refreshData(dataKeys, forceTimeout) {
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
                this.callDataBy(refreshKeys);
        }
        /** Note that this only adds the refresh keys but will not refresh. */
        addRefreshKeys(refreshKeys) {
            // Set to all.
            if (refreshKeys === true)
                this.dataKeysPending = true;
            // Add given.
            else if (refreshKeys && (this.dataKeysPending !== true)) {
                // Into array.
                if (typeof refreshKeys === "string")
                    refreshKeys = [refreshKeys];
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
    }; // We're detached from the return type.
}
