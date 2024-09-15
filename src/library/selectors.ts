
// - Imports - //

// Library.
import { areEqual } from "./library";


// - Data selector depth (enum and type) - //

// Enums.
/** For quick getting modes to depth for certain uses (Memo and DataPicker).
 * - Positive values can go however deep. Note that -1 means deep, but below -2 means will not check.
 * - Values are: "never" = -3, "always" = -2, "deep" = -1, "changed" = 0, "shallow" = 1, "double" = 2.
 */
export enum CompareDataDepthEnum {
    never = -3,
    always = -2,
    deep = -1,
    changed = 0,
    shallow = 1,
    double = 2,
};
/** Data comparison modes as string names.
 * - "always" means always changed - doesn't even compare the data.
 * - "changed" means if a !== b, then it's changed.
 * - "shallow" means comparing all values in an array or dictionary with identity check (!==). This is a common used default, compares 1 level.
 * - "double" is like "shallow" but any prop value that is object or array will do a further shallow comparison to determine if it has changed.
 * - "deep" compares all the way down recursively. Only use this if you it's really what you want - never use it with recursive objects (= with direct or indirect self references).
 */
export type CompareDataDepthMode = keyof typeof CompareDataDepthEnum;


// - Data typing helpers - //

// Data source.
/** Type for a function whose job is to extract data from given arguments. */
export type DataExtractor<P extends any[] = any[], R = any> = (...args: P) => R;
/** This helps to create a typed data selector by providing the types for the Params for extractor and Data for output of the selector.
 * - The type return is a function that can be used for triggering the effect (like in Redux).
 * - The extractor can return an array up to 20 typed members.
 */
export type CreateDataSource<Params extends any[] = any[], Data = any> = <
    Extractor extends(...args: Params) => [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?],
    Extracted extends ReturnType<Extractor> = ReturnType<Extractor>
>(extractor: Extractor, producer: (...args: Extracted) => Data, depth?: number | CompareDataDepthMode) => (...args: Params) => Data;
/** This helps to create a typed cached data selector by providing the types for the Params for extractor and Data for output of the selector.
 * - The type return is a function that can be used for triggering the effect (like in Redux).
 * - The extractor can return an array up to 20 typed members.
 */
export type CreateCachedSource<Params extends any[] = any[], Data = any> = <
    Extractor extends(...args: Params) => [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?],
    Extracted extends ReturnType<Extractor> = ReturnType<Extractor>
>(extractor: Extractor, producer: (...args: Extracted) => Data, cacher: (...args: [...args: Params, cached: Record<string, (...args: Params) => Data>]) => string, depth?: number | CompareDataDepthMode) => (...args: Params) => Data;

// Data trigger.
/** Callback to run when the DataTrigger memory has changed (according to the comparison mode).
 * - If the callback returns a new callback function, it will be run when unmounting the callback.
 */
export type DataTriggerOnMount<Memory = any> = (newMem: Memory, prevMem: Memory | undefined) => void | DataTriggerOnUnmount;
/** Callback to run when specifically changes to use a new onMount callback - implies that memory was changed as well.
 * - The callback is called right before calling the new onMount counter part.
 * - Note that this is not called on every memory change, but only on memory changes where new onMount callback was defined.
 */
export type DataTriggerOnUnmount<Memory = any> = (currentMem: Memory, nextMem: Memory) => void;


// - Create data trigger - //

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
 *          - Defaults to 1 meaning will perform a shallow comparison on the old and new memory. (By default assumes it's an object.)
 */
export function createDataTrigger<Memory extends any>(onMount?: DataTriggerOnMount<Memory>, memory?: Memory, depth: number | CompareDataDepthMode = 1): (newMemory: Memory, forceRun?: boolean, newOnMountIfChanged?: DataTriggerOnMount<Memory> | null) => boolean {
    // Local memory.
    const d = typeof depth === "string" ? CompareDataDepthEnum[depth] : depth;
    let onUnmount: DataTriggerOnUnmount<Memory> | undefined = undefined;
    // Return handler.
    return (newMemory: Memory, forceRun: boolean = false, newOnMountIfChanged?: DataTriggerOnMount<Memory> | null): boolean => {
        // No change.
        const memWas = memory;
        if (d < -1) {
            if (d !== -2)
                return false;
        }
        else if (!forceRun && areEqual(memWas, newMemory, d))
            return false;
        // Update callbacks.
        if (newOnMountIfChanged !== undefined) {
            if (onUnmount)
                onUnmount(memWas!, newMemory);
            onUnmount = undefined;
            onMount = newOnMountIfChanged || undefined;
        }
        // Store the memory.
        memory = newMemory;
        // Run callback.
        if (onMount)
            onUnmount = onMount(newMemory, memWas) || undefined;
        // Did not change in given mode.
        return false;
    }
}


// - Create data memo - //

/** Create a data memo.
 * - First define a memo: `const myMemo = createDataMemo((arg1, arg2) => { return "something"; });`.
 * - Then later in repeatable part of code get the value: `const myValue = myMemo(arg1, arg2);`
 * - About arguments:
 *      @param producer Defines the callback to produce the final data given the custom arguments.
 *      @param depth Defines the comparison depth for comparing previous and new memory arguments - to decide whether to run onMount callback.
 *          - The depth defaults to 0 meaning identity check on args (or if count changed).
 *          - Note that the depth refers to _each_ item in the memory, not the memory argments array as a whole since it's new every time.
 */
export function createDataMemo<Data extends any, MemoryArgs extends any[]>(producer: (...memory: MemoryArgs) => Data, depth: number | CompareDataDepthMode = 0): (...memory: MemoryArgs) => Data {
    // Local memory.
    let data: Data | undefined = undefined;
    let memoryArgs: any[] | undefined = undefined;
    const d = typeof depth === "string" ? CompareDataDepthEnum[depth] : depth;
    // Return handler.
    return (...memory: MemoryArgs): Data => {
        // Can potentially reuse as we have already computed once.
        if (memoryArgs) {
            // No change.
            if (d < -1) {
                if (d !== -2)
                    return data!;
            }
            else if (areEqual(memoryArgs, memory, d >= 0 ? d + 1 : d)) // Increase by 1 - our memory is always a new array.
                return data!;
        }
        // Store the memory.
        memoryArgs = memory;
        // Run callback.
        data = producer(...memory);
        // Return data.
        return data;
    }
}


// - Create data source - //

/** Create a data source (returns a function): Functions like createDataMemo but for data with an intermediary extractor.
 * - Give an extractor that extracts an array out of your customly defined arguments. Can return an array up to 20 typed members or more with `[...] as const` trick.
 * - Whenever the extracted output has changed, the producer callback is triggered.
 *      * To control the level of comparsion, pass in the optional last arg for "depth". Defaults to 0: identity check on each argument (+ checks argment count).
 * - The producer callback directly receives the arguments returned by the extractor, and it should return the output data solely based on them (other sources of data should be constant).
 * - The whole point of this abstraction, is to trigger the presumably expensive producer callback only when the cheap extractor func tells there's a change.
 */
export function createDataSource<
    Extracted extends [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?] | readonly any[],
    Data extends any,
    Params extends any[],
>(extractor: (...args: Params) => Extracted, producer: (...args: Extracted) => Data, depth: number | CompareDataDepthMode = 0): (...args: Params) => Data {
    // Prepare.
    let extracted: any[] | readonly any[] | undefined = undefined;
    let data: Data = undefined as any;
    // Clean depth.
    const d = typeof depth === "string" ? CompareDataDepthEnum[depth] : depth;
    // Return a function to do the selecting.
    return (...args: any[]): Data => {
        // Extract new extracts.
        const newExtracted = extractor(...args as any);
        // Can reuse.
        if (extracted) {
            // Check extracts have changed - if not, return old outcome.
            // .. If depth is -2 , we are in "always" mode, if lower in "never" mode, and so no need to check in either.
            if (d < -1) {
                // In never mode, never update.
                if (d !== -2)
                    return data;
            }
            else if (areEqual(newExtracted, extracted, d))
                return data;
        }
        // Got through - set new extracts, recalc and store new outcome by the selector.
        extracted = newExtracted;
        data = producer(...extracted as any);
        // Return the new data.
        return data;
    };
}


// - Create data source - //

/** Create a cached data source (returns a function).
 * - Just like createDataSource but provides multiple sets of extraction and data memory.
 * - The key (string) for caching is derived by the 3rd argument which is a function that receives the source arguments: `(...origArgs, cached): string`.
 *      * The cached extra argument provides the dictionary of current caching. The function may also use it to mutate the cache manually, eg. to delete keys from it.
 * - The reason why you would use the "cached" variant is when you have multiple similar use cases for the same selector with different source datas.
 *      * For example, let's say you have 2 similar grids but with two different source data.
 *      * If you would use createDataSource they would be competing about it.
 *      * So in practice, the producer callback would be triggered every time the _asker changes_ - even if data in both sets would stay identical.
 *      * To solve this, you simply define unique keys for each use case. For example: "grid1" and "grid2" in our simple example here.
 * - Like in createDataSource the optional last argument "depth" can be used to define the level of comparison for each argument. Defaults to 0: identity check.
 */
export function createCachedSource<
    Extracted extends [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?] | readonly any[],
    Data extends any,
    Params extends any[],
>(extractor: (...args: Params) => Extracted, producer: (...args: Extracted) => Data, cacher: (...args: [...args: Params, cached: Record<string, (...args: Params) => Data>]) => string, depth: number | CompareDataDepthMode = 0): (...args: Params) => Data {
    // Memory.
    const cached: Record<string, (...args: Params) => Data> = {};
    // Return handler.
    return (...args: any[]): Data => {
        // Get key.
        const cachedKey = cacher(...args as Params, cached);
        // Create a new data source if hadn't one for the cachedKey.
        if (!cached[cachedKey])
            cached[cachedKey] = createDataSource(extractor, producer, depth);
        // Use the data source.
        return cached[cachedKey](...args as Params);
    }
}
