
// - Imports - //

// Library.
import { areEqual, CompareDataDepthEnum, CompareDataDepthMode } from "./deep";


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
 *      2. Then define create a trigger: `const myTrigger = createDataTrigger(onMount, memory)`.
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
 *
 * ```
 * 
 * // Create a function that can be called to trigger a callback when the reference data is changed from the last time
 * type Memory = { id: number; text: string; };
 * const myTrigger = createDataTrigger<Memory>(
 *      // 1st arg is an optional (but often used) _mount_ callback.
 *      (newMem, oldMem) => {
 *          // Run upon change.
 *          if (newMem.id !== oldMem?.id)
 *              console.log("Id changed!");
 *          // Optionally return a callback to do _unmounting_.
 *          return (currentMem, nextMem) => { console.log("Unmounted!"); }
 *      },
 *      // 2nd arg is optional initial memory.
 *      // .. Use it to delay the first triggering of the mount callback (in case the same on first usages).
 *      { id: 1, text: "init" },
 *      // 3rd arg is optional depth, defaults to 1, meaning performs shallow comparison on the memory.
 *      1
 * );
 * 
 * // Use the trigger.
 * let didChange = myTrigger({ id: 1, text: "init" }); // false, new memory and init memory have equal contents.
 * didChange = myTrigger({ id: 1, text: "thing" }); // true
 * didChange = myTrigger({ id: 2, text: "thing" }); // true, logs: "Id changed!"
 * didChange = myTrigger({ id: 2, text: "thing" }, true); // true
 * 
 * // Change callback.
 * const newCallback = () => { console.log("Changes!"); };
 * didChange = myTrigger({ id: 2, text: "thing" }, false, newCallback); // false
 * didChange = myTrigger({ id: 3, text: "thing" }, false, newCallback); // true, logs: "Unmounted!" and then "Changes!".
 * didChange = myTrigger({ id: 3, text: "now?" }); // true, logs: "Changes!"
 * 
 * ```
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
 * - First define a handler: `const onChange = createDataMemo((arg1, arg2) => { return "something"; });`.
 * - Then later in repeatable part of code get the value: `const myValue = onChange(arg1, arg2);`
 * - About arguments:
 *      @param producer Defines the callback to produce the final data given the custom arguments.
 *      @param depth Defines the comparison depth for comparing previous and new memory arguments - to decide whether to run onMount callback.
 *          - The depth defaults to 0 meaning identity check on args (or if count changed).
 *          - Note that the depth refers to _each_ item in the memory, not the memory argments array as a whole since it's new every time.
 * 
 * ```
 * 
 * // Types.
 * type Input = { name: string; score: number; };
 * type Output = { winner: string | null; loser: string | null; difference: number; };
 * 
 * // Create a function that can be called to return updated data if arguments changed.
 * const onResults = createDataMemo(
 *     // 1st arg is the producer callback that should return the desired data.
 *     // .. It's only triggered when either (a, b) is changed from last time.
 *     (a: Input, b: Input): Output => {
 *         // Do something with the args.
 *         return a.score > b.score ? { winner: a.name, loser: b.name, difference: a.score - b.score } :
 *             a.score < b.score ? { winner: b.name, loser: a.name, difference: b.score - a.score } : 
 *             { winner: null, loser: null, difference: 0 };
 *     },
 *     // 2nd arg is optional and defines the _level of comparison_ referring to each argument.
 *     // .. For DataMemo it defaults to 0, meaning identity comparison on each arg: oldArg[i] !== newArg[i].
 *     // .. To do a deep comparison set to -1. Setting of 1 means shallow comparison (on each arg), and from there up.
 *     1,
 * );
 * 
 * // Use the memo.
 * const a = { score: 3, name: "alpha"};
 * const b = { score: 5, name: "beta"};
 * const result = onResults(a, b);         // { winner: "beta", loser: "alpha", difference: 2 }
 * 
 * // Show case functionality.
 * const result2 = onResults(a, b);        // Identical to above. (Used same args.)
 * const result3 = onResults(a, {...b});   // Identical to above, because of comparison depth 1.
 * const result4 = onResults(b, a);        // Same as above - but a new object.
 * const result5 = onResults(b, a);        // Identical to above (result4).
 * const result6 = onResults(a, b);        // Same as above - but a new object.
 * const result7 = onResults(a, a);        // { winner: null, loser: null, difference: 0 }
 * const result8 = onResults(a, a);        // Same as above - identical to result7.
 * 
 * // That the identity stays the same for consequent tries is useful in state based refresh flow.
 * result === result2      // true
 * result === result3      // true
 * result === result4      // false
 * result4 === result5     // true
 * result4 === result6     // false
 * result === result6      // false
 * result7 === result8     // true
 * 
 * ```
 * 
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
 * 
 * ```
 * 
 * // Prepare.
 * type MyParams = [ colorTheme: { mode?: "light" | "dark" }, specialMode?: boolean];
 * type MyData = { theme: "dark" | "light"; special: boolean; }
 * 
 * // With pre-typing.
 * const mySource = (createDataSource as CreateDataSource<MyParams, MyData>)(
 *      // Extractor - showcases the usage for contexts.
 *      // .. For example, if has many usages with similar context data needs.
 *      (colorTheme, specialMode) => [
 *          colorTheme?.mode || "dark",
 *          specialMode || false,
 *      ],
 *      // Producer - it's only called if the extracted data items were changed from last time.
 *      (theme, special) => ({ theme, special }),
 *      // Optional depth of comparing each argument.
 *      // .. Defaults to 0: if any arg (or arg count) is changed, triggers the producer.
 *      0
 * );
 * 
 * // With manual typing.
 * const mySource_MANUAL = createDataSource(
 *      // Extractor.
 *      (...[colorTheme, specialMode]: MyParams) => [
 *          colorTheme?.mode || "dark",
 *          specialMode || false,
 *      ],
 *      // Producer.
 *      (theme, special): MyData => ({ theme, special }),
 *      // Optional depth.
 *      0
 * );
 * 
 * // Use.
 * const val = mySource({ mode: "dark" }, true);   // { theme: "dark", special: true }
 * const val2 = mySource({ mode: "dark" }, true);  // Identical to above.
 * val === val2; // true
 * 
 * // Test typing.
 * const val_FAIL = mySource({ mode: "FAIL" }, true); // The "FAIL" is red-underlined.
 * const val_MANUAL = mySource_MANUAL({ mode: "dark" }, true);
 * const val_MANUAL_FAIL = mySource_MANUAL({ mode: "FAIL" }, true); // The "FAIL" is red-underlined.
 * 
 * ```
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
    // .. We add one to >= 0, since our extracted array is always new. If -1, -2 or -3, keep as is.
    depth = typeof depth === "string" ? CompareDataDepthEnum[depth] : depth;
    const d = depth >= 0 ? depth + 1 : depth;
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
 * 
 * ```
 * 
 * // Let' use the same MyData as with createDataSource, but add cacheKey to args.
 * type MyData = { theme: "dark" | "light"; special: boolean; };
 * type MyCachedParams = [
 *      colorTheme: { mode?: "light" | "dark" },
 *      specialMode: boolean | undefined,
 *      cacheKey: string
 * ];
 * 
 * // With pre-typing.
 * const mySource = (createCachedSource as CreateCachedSource<MyCachedParams, MyData>)(
 *      // Extractor.
 *      (colorTheme, specialMode) => [colorTheme?.mode || "dark", specialMode || false],
 *      // Producer.
 *      (theme, special) => ({ theme, special }),
 *      // Cache key generator.
 *      (_theme, _special, cacheKey) => cacheKey,
 *      // Optional depth. Defaults to 0: identity check on each extracted arg.
 *      0
 * );
 * 
 * // With manual typing. The result works just the same.
 * const mySource_MANUAL = createCachedSource(
 *      // Extractor. Let's specify MyCachedParams here, will also be use for the cacher.
 *      (...[colorTheme, specialMode]: MyCachedParams) => [colorTheme?.mode || "dark", specialMode || false],
 *      // Producer.
 *      (theme, special): MyData => ({ theme, special }),
 *      // Cache key generator.
 *      (_theme, _special, cacheKey) => cacheKey,
 *      // Optional depth.
 *      0
 * );
 * 
 * // Let's say state1 and state2 variants come from somewhere.
 * let settings1 = { mode: "dark" } as const;
 * let settings2 = { mode: "dark" } as const;
 * let special1 = true;
 * let special2 = false;
 * 
 * // Use.
 * let val_someKey = mySource(settings1, special1, "someKey"); // In one place.
 * let val_anotherKey = mySource(settings2, special2, "anotherKey"); // In another place with similar data.
 * // We can do it again, and the producers won't be retriggered (unlike without caching).
 * let val2_someKey = mySource(settings1, special1, "someKey");
 * let val2_anotherKey = mySource(settings2, special2, "anotherKey");
 * // Validate claims.
 * val_someKey === val2_someKey // true.
 * val_anotherKey === val2_anotherKey // true.
 * 
 * ```
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
