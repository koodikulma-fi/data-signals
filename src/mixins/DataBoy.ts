
// - Imports - //

// Dependency.
import { ClassType, AsClass, ReClass } from "mixin-types/types";
// Library.
import { GetJoinedDataKeysFrom, PropTypesFromDictionary, PropTypeArray, PropTypeFallback, PropType } from "../typing";


// - Helper types - //

/** Technically should return void. But for conveniency can return anything - does not use the return value in any case. */
export type DataListenerFunc = (...args: any[]) => any | void;


// - Class - //

/** The static class side typing for DataBoy. */
export interface DataBoyType<Data extends Record<string, any> = {}, InterfaceLevel extends number | never = 0> extends ClassType<DataBoy<Data, InterfaceLevel>> {
    // Static extendables - we use very loose types here.
    /** Assignable getter to call more data listeners when callDataBy is used.
     * - If dataKeys is true (or undefined), then should refresh all data.
     * - Note. To use the default callDataBy implementation from the static side put 2nd arg to true: `dataBoy.callDataBy(dataKeys, true)`.
     * - Note. Put as static to keep the public instance API clean. The method needs to be public for internal use of extending classes.
     */
    callDataListenersFor?(dataBoy: DataBoy<any>, dataKeys?: true | string[]): void;
}
/** DataBoy is like DataMan but only provides data listening, not actual data.
 * - Regardless of having no data, it assumes a custom data structure of nested dictionaries.
 *      * For example: `{ something: { deep: boolean; }; simple: string; }`
 * - It provides listening services using the listenToData method, eg. `listenToData("something.deep", (deep) => {})`.
 * - Examples for usage:
 *      * Create: `const dataMan = new DataMan({ ...initData });`
 *      * Listen: `dataMan.listenToData("something.deep", "another", (some, other) => { ... }, [...fallbackArgs])`
 *      * Set data: `dataMan.setInData("something.deep", somedata)`
 */
export class DataBoy<Data extends Record<string, any> = {}, InterfaceLevel extends number | never = 0>
    extends (mixinDataBoy(Object) as any as ReClass<DataBoyType, {}>) { }
export interface DataBoy<Data extends Record<string, any> = {}, InterfaceLevel extends number | never = 0> {


    // - Members - //

    // // Constructor type. Let's not define it, since we're often used as a mixin - so constructor will be something else.
    // ["constructor"]: DataBoyType<Data, InterfaceLevel>;

    /** External data listeners.
     * - These are called after the data refreshes, though might be tied to update cycles at an external layer - to refresh the whole app in sync.
     * - The keys are data listener callbacks, and values are: `[fallbackArgs, ...dataNeeds]`.
     * - If the fallbackArgs is a dictionary, then the `getDataArgsBy´ handler actually returns only a single argument: `[valueDictionary]`.
     *      * The fallbackArgs dictionary is then used for fallback values as a dictionary instead.
     *      * Note that this does imply that the keys are held both in fallbackArgs and in the needs array. But for fluency left as is.
     */
    dataListeners: Map<DataListenerFunc, [fallbackArgs: any[] | Record<string, any> | undefined, ...needs: string[]]>;


    // - Data listening - //

    // Using dictionary.
    /** Listen to data using a dictionary whose keys are data keys and values fallbacks.
     * - Note that in this case, the callback will only have one argument which is a dictionary with the respective keys and values fetched (and falled back).
     * - Tips:
     *      * If you want to strictly define specific types (eg. `"test"` vs. `string`) in the dictionary add `as const` after value: `{ "some.key": "test" as const }`.
     *      * Or you can do the same on the whole dictionary: `{ "some.key": "test" } as const`.
     */
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>,
        Fallbacks extends Partial<Record<Keys, any>>
    >(fallbackDictionary: keyof Fallbacks extends Keys ? Fallbacks : never, callback: (values: PropTypesFromDictionary<Data, Fallbacks>) => void, callImmediately?: boolean): void;

    // Using pre-suggested keys and no fallback (it's not really needed as we are the direct owners of the data).
    /** This allows to listen to data by defining specific needs which in turn become the listener arguments.
     * - The needs are defined as dotted strings: For example, `listenToData("user.allowEdit", "themes.darkMode", (allowEdit, darkMode) => { ... });`
     * - By calling this, we both assign a listener but also set data needs to it, so it will only be called when the related data portions have changed.
     * - To remove the listener use `unlistenToData(callback)`.
     */
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>,
        Key1 extends Keys,
        Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>) => void,
        Fallback extends [any?] = [undefined]
    >(dataKey: Key1, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>,
        Key1 extends Keys,
        Key2 extends Keys,
        Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>) => void,
        Fallback extends [any?, any?] = [undefined, undefined]
    >(dataKey1: Key1, dataKey2: Key2, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>) => void,
        Fallback extends [any?, any?, any?] = [undefined, undefined, undefined]
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>) => void,
        Fallback extends [any?, any?, any?, any?] = [undefined, undefined, undefined, undefined]
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>, val5: PropTypeFallback<Data, Key5, Fallback[4]>) => void,
        Fallback extends [any?, any?, any?, any?, any?] = [undefined, undefined, undefined, undefined, undefined]
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Key6 extends Keys,
        Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>, val5: PropTypeFallback<Data, Key5, Fallback[4]>, val6: PropTypeFallback<Data, Key6, Fallback[5]>) => void,
        Fallback extends [any?, any?, any?, any?, any?, any?] = [undefined, undefined, undefined, undefined, undefined, undefined]
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Key6 extends Keys,
        Key7 extends Keys,
        Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>, val5: PropTypeFallback<Data, Key5, Fallback[4]>, val6: PropTypeFallback<Data, Key6, Fallback[5]>, val7: PropTypeFallback<Data, Key7, Fallback[6]>) => void,
        Fallback extends [any?, any?, any?, any?, any?, any?, any?] = [undefined, undefined, undefined, undefined, undefined, undefined, undefined]
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data, InterfaceLevel>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Key6 extends Keys,
        Key7 extends Keys,
        Key8 extends Keys,
        Callback extends (val1: PropTypeFallback<Data, Key1, Fallback[0]>, val2: PropTypeFallback<Data, Key2, Fallback[1]>, val3: PropTypeFallback<Data, Key3, Fallback[2]>, val4: PropTypeFallback<Data, Key4, Fallback[3]>, val5: PropTypeFallback<Data, Key5, Fallback[4]>, val6: PropTypeFallback<Data, Key6, Fallback[5]>, val7: PropTypeFallback<Data, Key7, Fallback[6]>, val8: PropTypeFallback<Data, Key8, Fallback[7]>) => void,
        Fallback extends [any?, any?, any?, any?, any?, any?, any?, any?] = [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined]
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, dataKey8: Key8, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
    unlistenToData(callback: DataListenerFunc): boolean;


    // - Get and set data (all should be extended) - //

    /** Should be extended. Default implementation returns fallback. */
    getInData<DataKey extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, SubData extends PropType<Data, DataKey, never>>(ctxDataKey: DataKey, fallback?: never | undefined): SubData | undefined;
    getInData<DataKey extends GetJoinedDataKeysFrom<Data, InterfaceLevel>, SubData extends PropType<Data, DataKey, never>, FallbackData extends any>(ctxDataKey: DataKey, fallback: FallbackData): SubData | FallbackData;

    /** Should be extended. Default implementation does not do anything. */
    setInData(dataKey: string, subData: any, extend?: boolean, refresh?: boolean): void;

    /** Should be extended. Default implementation at DataBoy just calls the data listeners, optionally after a timeout. */
    refreshData<DataKey extends GetJoinedDataKeysFrom<Data, InterfaceLevel>>(dataKeys: DataKey | DataKey[], forceTimeout?: number | null): void;


    // - Helpers - //

    /** Helper to build data arguments with values fetched using getInData method with the given data needs args.
     * - For example: `getDataArgsBy(["user.name", "darkMode"])` returns `[userName?, darkMode?]`.
     * - To add fallbacks (whose type affects the argument types), give an array of fallbacks as the 2nd argument with respective order.
     * - If the fallbackArgs is a dictionary, then returns `[valueDictionary]` picking the fallbacks from the given dictionary.
     * - Note. This method is used internally but can also be used for custom external purposes.
     */
    getDataArgsBy<
        DataKey extends GetJoinedDataKeysFrom<Data, InterfaceLevel>,
        Params extends [DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?],
        Fallbacks extends Record<string, any> | [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?]
    >(needs: Params, fallbackArgs?: Fallbacks): Fallbacks extends any[] ? PropTypeArray<Data, Params, Fallbacks> : [valueDictionary: PropTypesFromDictionary<Data, Fallbacks>];

    /** Manually trigger an update based on changes in context. Should not be called externally in normal circumstances.
     * - Only calls / triggers for refresh by needs related to the given contexts. If ctxNames is true, then all.
     * - If the refreshKeys is `true` (default), then refreshes as if all data had changed.
     * - The onlyDirect? 2nd argument should be put to true if wanting to skip the callDataListenersFor static method if present.
     *      * Normally, if the callDataListenersFor static method is defined, will not perform the internal implementation.
     */
    callDataBy(refreshKeys?: true | GetJoinedDataKeysFrom<Data, InterfaceLevel>[], onlyDirect?: boolean): void;

}


// - Mixin - //

/** Add DataBoy features to a custom class. Provide the BaseClass type specifically as the 2nd type argument.
 * - For examples of how to use mixins see `mixinDataMan` comments or [mixin-types README](https://github.com/koodikulma-fi/mixin-types).
 * - Note. The InterfaceLevel type argument can be used to define how many levels of interface types allows vs. strict types.
 *      * However, allowing interfaces also allows class instances to be included in the typed dotted data keys.
 */
export function mixinDataBoy<Data extends Record<string, any> = {}, InterfaceLevel extends number | never = 0, BaseClass extends ClassType = ClassType>(Base: BaseClass): AsClass<
    // Static.
    DataBoyType<Data, InterfaceLevel> & BaseClass,
    // Instanced.
    DataBoy<Data, InterfaceLevel> & InstanceType<BaseClass>,
    // Constructor args. Just allow to pass in any, not used.
    any[]
> {
    // We just use the same internal JS method.
    // .. For clarity of usage and avoid problems with deepness, we don't use the <Data, InterfaceLevel> here at all and return ClassType.
    return class DataBoy extends (Base as ClassType) {


        // - Members - //

        /** External data listeners.
         * - These are called after the data refreshes, though might be tied to update cycles at an external layer - to refresh the whole app in sync.
         * - The keys are data listener callbacks, and values are: `[fallbackArgs, ...dataNeeds]`.
         * - If the fallbackArgs is a dictionary, then the `getDataArgsBy´ handler actually returns only a single argument: `[valueDictionary]`.
         *      * The fallbackArgs dictionary is then used for fallback values as a dictionary instead.
         *      * Note that this does imply that the keys are held both in fallbackArgs and in the needs array. But for fluency left as is.
         */
        public dataListeners: Map<DataListenerFunc, [fallbackArgs: any[] | Record<string, any> | undefined, ...needs: string[]]> = new Map();


        // - Data listening - //

        public listenToData(...args: any[]): void {
            // Parse.
            let iOffset = 1;
            const nArgs = args.length;
            const callImmediately = typeof args[nArgs - iOffset] === "boolean" && args[nArgs - iOffset++];
            const isDictionary = typeof args[0] === "object";
            const fallbackArgs: any[] | Record<string, any> | undefined = isDictionary ? args[0] as Record<string, any> : Array.isArray(args[nArgs - iOffset]) ? args[nArgs - iOffset++]?.slice() : undefined;
            const dataNeeds = isDictionary ? Object.keys(args[0]) : args.slice(0, nArgs - iOffset);
            const callback: DataListenerFunc = args[nArgs - iOffset];
            // Add / Override.
            this.dataListeners.set(callback, [fallbackArgs, ...dataNeeds]);
            // Call.
            if (callImmediately)
                callback(...this.getDataArgsBy(dataNeeds as any, fallbackArgs));
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

        /** Should be extended. Default implementation returns fallback. */
        public getInData(ctxDataKey: string, fallback: any = undefined): any {
            return fallback;
        }

        /** Should be extended. Default implementation does not do anything. */
        public setInData(dataKey: string, subData: any, extend?: boolean, refresh?: boolean): void { }

        /** Should be extended. Default implementation just calls the data listeners, optionally after a timeout. */
        public refreshData(dataKeys: string | string[], forceTimeout?: number | null): void {
            if (!dataKeys)
                return;
            if (typeof dataKeys === "string")
                dataKeys = [dataKeys];
            forceTimeout != null ? setTimeout(() => this.callDataBy(dataKeys as string[])) : this.callDataBy(dataKeys as string[]);
        }


        // - Helpers - //

        public getDataArgsBy(needs: string[], fallbackArgs?: any[] | Record<string, any>): any[] {
            // Has fallback.
            return fallbackArgs ?
                // Array.
                Array.isArray(fallbackArgs) ? needs.map((need, i) => this.getInData(need, fallbackArgs[i])) :
                // Dictionary.
                [needs.reduce((cum, need) => { cum[need] = this.getInData(need, fallbackArgs[need]); return cum; }, {} as Record<string, any>)] :
            // No fallback.
            needs.map((need, i) => this.getInData(need));
        }

        public callDataBy(refreshKeys: true | string[] = true, onlyDirect?: boolean): void {
            // Use external flow.
            if (!onlyDirect && (this.constructor as DataBoyType).callDataListenersFor) {
                (this.constructor as DataBoyType).callDataListenersFor!(this as any, refreshKeys as any);
                return;
            }
            // Loop each callback, and call if needs to.
            for (const [callback, [fallbackArgs, ...needs]] of this.dataListeners.entries()) { // Note that we use .entries() to take a copy of the situation.
                if (refreshKeys === true || refreshKeys.some((dataKey: string) => needs.some(need => need === dataKey || need.startsWith(dataKey + ".") || dataKey.startsWith(need + ".")))) 
                    callback(...this.getDataArgsBy(needs as any, fallbackArgs));
            }
        }


        // - Optional assignable static getter - //

        /** Assignable getter to call more data listeners when callDataBy is used.
         * - If dataKeys is true (or undefined), then should refresh all data.
         * - Note. To use the default callDataBy implementation from the static side put 2nd arg to true: `dataBoy.callDataBy(dataKeys, true)`.
         * - Note. Put as static to keep the public instance API clean. The method needs to be public for internal use of extending classes.
         */
        public static callDataListenersFor?(dataBoy: DataBoy, dataKeys?: true | string[]): boolean;

    } as any; // We're detached from the return type.
}
