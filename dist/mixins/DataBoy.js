// - Imports - //
/** DataBoy is like DataMan but only provides data listening, not actual data.
 * - Regardless of having no data, it assumes a custom data structure of nested dictionaries.
 *      * For example: `{ something: { deep: boolean; }; simple: string; }`
 * - It provides listening services using the listenToData method, eg. `listenToData("something.deep", (deep) => {})`.
 * - Examples for usage:
 *      * Create: `const dataMan = new DataMan({ ...initData });`
 *      * Listen: `dataMan.listenToData("something.deep", "another", (some, other) => { ... }, [...fallbackArgs])`
 *      * Set data: `dataMan.setInData("something.deep", somedata)`
 */
export class DataBoy extends mixinDataBoy(Object) {
}
// - Mixin - //
/** Add DataBoy features to a custom class. Provide the BaseClass type specifically as the 2nd type argument.
 * - For examples of how to use mixins see `mixinDataMan` comments or [mixin-types README](https://github.com/koodikulma-fi/mixin-types).
*/
export function mixinDataBoy(Base) {
    // We just use the same internal JS method.
    // .. For clarity of usage and avoid problems with deepness, we don't use the <Data> here at all and return ClassType.
    return class DataBoy extends Base {
        constructor() {
            // - Members - //
            super(...arguments);
            /** External data listeners.
             * - These are called after the data refreshes, though might be tied to update cycles at an external layer - to refresh the whole app in sync.
             * - The keys are data listener callbacks, and values are: `[fallbackArgs, ...dataNeeds]`.
             * - If the fallbackArgs is a dictionary, then the `getDataArgsBy´ handler actually returns only a single argument: `[valueDictionary]`.
             *      * The fallbackArgs dictionary is then used for fallback values as a dictionary instead.
             *      * Note that this does imply that the keys are held both in fallbackArgs and in the needs array. But for fluency left as is.
             */
            this.dataListeners = new Map();
        }
        // - Data listening - //
        listenToData(...args) {
            var _a;
            // Parse.
            let iOffset = 1;
            const nArgs = args.length;
            const callImmediately = typeof args[nArgs - iOffset] === "boolean" && args[nArgs - iOffset++];
            const isDictionary = typeof args[0] === "object";
            const fallbackArgs = isDictionary ? args[0] : Array.isArray(args[nArgs - iOffset]) ? (_a = args[nArgs - iOffset++]) === null || _a === void 0 ? void 0 : _a.slice() : undefined;
            const dataNeeds = isDictionary ? Object.keys(args[0]) : args.slice(0, nArgs - iOffset);
            const callback = args[nArgs - iOffset];
            // Add / Override.
            this.dataListeners.set(callback, [fallbackArgs, ...dataNeeds]);
            // Call.
            if (callImmediately)
                callback(...this.getDataArgsBy(dataNeeds, fallbackArgs));
        }
        /** Remove a data listener manually. Returns true if did remove, false if wasn't attached. */
        unlistenToData(callback) {
            // Doesn't have.
            if (!this.dataListeners.has(callback))
                return false;
            // Remove.
            this.dataListeners.delete(callback);
            return true;
        }
        // - Get and set data - //
        /** Should be extended. */
        getInData(ctxDataKey, fallback = undefined) {
            return undefined;
        }
        /** Should be extended. */
        setInData(dataKey, subData, extend, refresh) { }
        // - Helpers - //
        getDataArgsBy(needs, fallbackArgs) {
            // Has fallback.
            return fallbackArgs ?
                // Array.
                Array.isArray(fallbackArgs) ? needs.map((need, i) => this.getInData(need, fallbackArgs[i])) :
                    // Dictionary.
                    [needs.reduce((cum, need) => { cum[need] = this.getInData(need, fallbackArgs[need]); return cum; }, {})] :
                // No fallback.
                needs.map((need, i) => this.getInData(need));
        }
        callDataBy(refreshKeys = true) {
            // Loop each callback, and call if needs to.
            for (const [callback, [fallbackArgs, ...needs]] of this.dataListeners.entries()) { // Note that we use .entries() to take a copy of the situation.
                if (refreshKeys === true || refreshKeys.some((dataKey) => needs.some(need => need === dataKey || need.startsWith(dataKey + ".") || dataKey.startsWith(need + "."))))
                    callback(...this.getDataArgsBy(needs, fallbackArgs));
            }
        }
    }; // We're detached from the return type.
}
