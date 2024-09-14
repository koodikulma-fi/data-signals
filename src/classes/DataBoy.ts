

// - Imports - //

// Typing.
import { PropType, GetJoinedDataKeysFrom, ClassType, ClassMixer, PropTypeDictionary, PropTypeArray } from "../library/typing";


// - Helper types - //

/** Technically should return void. But for conveniency can return anything - does not use the return value in any case. */
export type DataListenerFunc = (...args: any[]) => any | void;


// - Mixin - //

function _DataBoyMixin<Data extends Record<string, any> = {}>(Base: ClassType) {

    return class _DataBoy extends Base {


        // - Members - //

        /** External data listeners.
         * - These are called after the data refreshes, though might be tied to update cycles at an external layer - eg. to refresh the whole app in sync.
         * - The keys are data listener callbacks, and values are: `[fallbackArgs, ...dataNeeds]`.
         */
        public dataListeners: Map<DataListenerFunc, [fallbackArgs: any[] | undefined, ...dataNeeds: string[]]> = new Map();
        

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

        /** Should be extended. */
        public getInData(dataKey: string, fallback?: any): any {
            return undefined;
        }

        /** Should be extended. */
        public setInData(dataKey: string, subData: any, extend?: boolean, refresh?: boolean): void { }



        // - Helpers - //

        /** Helper to build data arguments with values fetched using getInData method with the given data needs args.
         * - For example: `getDataArgsBy(["user.name", "darkMode"])` returns `[userName?, darkMode?]`.
         * - To add fallbacks (whose type affects the argument types), give an array of fallbacks as the 2nd argument.
         * - Used internally but can be used for manual purposes. Does not currently support typing for the return, only input.
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

/** There are two ways you can use this mixin creator:
 * 1. Call this to give basic DataBoy features with advanced typing being empty.
 *      * `class MyMix extends DataBoyMixin(MyBase) {}`
 * 2. If you want to define the Data and Signals types, you can use this trick instead:
 *      * `class MyMix extends (DataBoyMixin as ClassMixer<DataBoyType<Data, Signals>>)(MyBase) {}`
 */
export const DataBoyMixin = _DataBoyMixin as unknown as ClassMixer<ClassType<DataBoy>>;


// - Class - //

export interface DataBoyType<Data extends Record<string, any> = {}> extends ClassType<DataBoy<Data>> { }
/** DataBoy is like DataMan but only provides data listening, not actual data.
 * - Regardless of having no data, it assumes a custom data structure of nested dictionaries.
 *      * For example: `{ something: { deep: boolean; }; simple: string; }`
 * - It provides listening services using the listenToData method, eg. `listenToData("something.deep", (deep) => {})`.
 * - Examples for usage:
 *      * Create: `const dataMan = new DataMan({ ...initData });`
 *      * Listen: `dataMan.listenToData("something.deep", "another", (some, other) => { ... }, [...fallbackArgs])`
 *      * Set data: `dataMan.setInData("something.deep", somedata)`
 */
export class DataBoy<Data extends Record<string, any> = {}> extends (_DataBoyMixin(Object) as ClassType) { }
export interface DataBoy<Data extends Record<string, any> = {}> { 
    

    // - Members - //

    // Constructor type.
    ["constructor"]: DataBoyType<Data>;
    /** External data listeners.
     * - These are called after the data refreshes, though might be tied to update cycles at an external layer - to refresh the whole app in sync.
     * - The keys are data listener callbacks, and values are: `[fallbackArgs, ...dataNeeds]`.
     */
    dataListeners: Map<DataListenerFunc, [fallbackArgs: any[] | undefined, ...needs: string[]]>;

    
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
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0]) => void,
        Fallback extends [any] = [PropType<Data, Key1, never>],
    >(dataKey: Key1, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Key1 extends Keys,
        Key2 extends Keys,
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1]) => void,
        Fallback extends [any?, any?] = [PropType<Data, Key1, never>, PropType<Data, Key2, never>],
    >(dataKey1: Key1, dataKey2: Key2, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2]) => void,
        Fallback extends [any?, any?, any?] = [PropType<Data, Key1, never>, PropType<Data, Key2, never>, PropType<Data, Key3, never>],
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3]) => void,
        Fallback extends [any?, any?, any?, any?] = [PropType<Data, Key1, never>, PropType<Data, Key2, never>, PropType<Data, Key3, never>, PropType<Data, Key4, never>],
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4]) => void,
        Fallback extends [any?, any?, any?, any?, any?] = [PropType<Data, Key1, never>, PropType<Data, Key2, never>, PropType<Data, Key3, never>, PropType<Data, Key4, never>, PropType<Data, Key5, never>],
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;
    listenToData<
        Keys extends GetJoinedDataKeysFrom<Data>,
        Key1 extends Keys,
        Key2 extends Keys,
        Key3 extends Keys,
        Key4 extends Keys,
        Key5 extends Keys,
        Key6 extends Keys,
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5]) => void,
        Fallback extends [any?, any?, any?, any?, any?, any?] = [PropType<Data, Key1, never>, PropType<Data, Key2, never>, PropType<Data, Key3, never>, PropType<Data, Key4, never>, PropType<Data, Key5, never>, PropType<Data, Key6, never>],
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
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5], val7: PropType<Data, Key7, never> | Fallback[6]) => void,
        Fallback extends [any?, any?, any?, any?, any?, any?, any?] = [PropType<Data, Key1, never>, PropType<Data, Key2, never>, PropType<Data, Key3, never>, PropType<Data, Key4, never>, PropType<Data, Key5, never>, PropType<Data, Key6, never>, PropType<Data, Key7, never>],
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
        Callback extends (val1: PropType<Data, Key1, never> | Fallback[0], val2: PropType<Data, Key2, never> | Fallback[1], val3: PropType<Data, Key3, never> | Fallback[2], val4: PropType<Data, Key4, never> | Fallback[3], val5: PropType<Data, Key5, never> | Fallback[4], val6: PropType<Data, Key6, never> | Fallback[5], val7: PropType<Data, Key7, never> | Fallback[6], val8: PropType<Data, Key8, never> | Fallback[7]) => void,
        Fallback extends [any?, any?, any?, any?, any?, any?, any?, any?] = [PropType<Data, Key1, never>, PropType<Data, Key2, never>, PropType<Data, Key3, never>, PropType<Data, Key4, never>, PropType<Data, Key5, never>, PropType<Data, Key6, never>, PropType<Data, Key7, never>, PropType<Data, Key8, never>],
    >(dataKey1: Key1, dataKey2: Key2, dataKey3: Key3, dataKey4: Key4, dataKey5: Key5, dataKey6: Key6, dataKey7: Key6, dataKey8: Key8, callback: Callback, fallbackArgs?: Fallback | null, callImmediately?: boolean): void;

    /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
    unlistenToData(callback: DataListenerFunc): boolean;


    // - Helpers - //

    /** Helper to build data arguments with fallbacks.
     * - For example: `getDataArgsBy(["common.user.name", "view.darkMode"])`.
     * - Used internally but can be used for manual purposes.
     */
    getDataArgsBy<
        DataKey extends GetJoinedDataKeysFrom<Data>,
        Params extends [DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?],
        Fallbacks extends [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?]
    >(needs: Params, fallbackArgs?: Fallbacks): PropTypeArray<Data, Params, Fallbacks>;

    /** Manually trigger an update based on changes in context. Should not be used in normal circumstances.
     * - Only calls / triggers for refresh by needs related to the given contexts. If ctxNames is true, then all.
     * - The refreshKeys defaults to `true`, so will refresh all.
     */
    callDataBy(refreshKeys?: true | GetJoinedDataKeysFrom<Data>[]): void;

}
