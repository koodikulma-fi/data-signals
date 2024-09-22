
// - Numeric array helpers - //

/** Get cleaned index suitable for finding or inserting children items in an array.
 * - If you're adding a new kid, use kids.length + 1 for newCount. Normally use kids.length directly.
 * - This allows one cycle of negative. So has a range of: [-newCount + 1, newCount - 1], which it turns into [0, newCount - 1].
 * - Only returns -1 if the newCount is 0, otherwise integer of at least 0 and lower than newCount.
 * 
 * ```
 * 
 * // Examples with a count of 3.
 * cleanIndex(undefined, 3); // 2
 * cleanIndex(null, 3);      // 2
 * cleanIndex(3, 3);         // 2
 * cleanIndex(2, 3);         // 2
 * cleanIndex(1, 3);         // 1
 * cleanIndex(0, 3);         // 0
 * cleanIndex(-1, 3);        // 2
 * cleanIndex(-2, 3);        // 1
 * cleanIndex(-3, 3);        // 0
 * cleanIndex(-4, 3);        // 0
 * 
 * ```
 * 
 */
export function cleanIndex(index: number | null | undefined, newCount: number): number {
    return !newCount ? -1 : typeof index === "number" ? index < 0 ? Math.max(0, index + newCount) : Math.min(index, newCount - 1) : newCount - 1;
}

/** Order an array by matching `order` array consisting of numbers or null | undefined.
 * - Ordering happens in 3 categories: 1. near front (>= 0), 2. near end (< 0), 3. don't care (null | undefined).
 * @param arr The original array to sort.
 * @param order The relative order in three categories.
 *      - If a string, then uses it as a property of the array item to ready data.
 *      - If a number in `order` array is `>= 0`, then closer to 0, the more in the front it will be.
 *      - If a number in `order` array is `< 0`, then closer to 0, the later will be.
 *      - If a value in `order` array is `null | undefined`, then does not care: after >= 0, but before any < 0.
 *      - For cases with matching order uses keeps the original order.
 * @returns A new sorted array.
 * 
 * ```
 * 
 * // Arrays.
 * orderArray(["a", "b", "c"], [20, 10, 0]);             // ["c", "b", "a"]
 * orderArray(["a", "b", "c"], [-1, -2, -3]);            // ["c", "b", "a"]
 * orderArray(["a", "b", "c"], [-1, null, 0]);           // ["c", "b", "a"]
 * orderArray(["a", "b", "c"], [null, 0]);               // ["b", "a", "c"]
 * orderArray(["a", "b", "c"], [undefined, 0, null]);    // ["b", "a", "c"]
 * orderArray(["a", "b", "c"], [-1, 0, null]);           // ["b", "c", "a"]
 * orderArray(["a", "b", "c", "d"], [null, 0, -.5, -1]); // ["b", "a", "d", "c"]
 * 
 * // Objects.
 * const a = { name: "a", order: -1 };
 * const b = { name: "b", order: 0 };
 * const c = { name: "c" };
 * orderArray([a, b, c], "order") // [b, c, a]
 * 
 * ```
 * 
 */
export function orderArray<Key extends string & keyof T, T extends Partial<Record<Key, number | null>>>(arr: T[], property: Key): T[];
export function orderArray<T extends any>(arr: T[], order: Array<number | null | undefined>): T[];
export function orderArray<T extends any>(arr: T[], orderOrProperty: Array<number | null | undefined> | string): T[] {
    // Prepare.
    const handled: Array<[order: number | null, item: T]> = [];
    const isProp = typeof orderOrProperty === "string";
    // Loop all once.
    for (let i=0,count=arr.length; i<count; i++) {
        // Find place.
        const oMe = isProp ? arr[i][orderOrProperty] ?? null : orderOrProperty[i] ?? null;
        const iInsert =
            // Null.
            oMe === null ? handled.findIndex(h => h[0] as number < 0) : 
            // Negative.
            oMe < 0 ? handled.findIndex(h => h[0] as number < 0 && h[0] as number > oMe) :
            // Natural.
            handled.findIndex(h => h[0] === null || h[0] < 0 || h[0] > oMe);
        // Insert.
        iInsert === -1 ? handled.push([oMe, arr[i]]) : handled.splice(iInsert, 0, [oMe, arr[i]]);
    }
    // Return items.
    return handled.map(h => h[1]);
}

/** Creates a numeric range with whole numbers.
 * - With end smaller than start, will give the same result but in reverse.
 * - If you use stepSize, always give it a positive number. Otherwise use 1 as would loop forever.
 * - Works for integers and floats. Of course floats might do what they do even with simple adding / subtraction.
 * Examples:
 * ```
 * numberRange(3); // [0, 1, 2]
 * numberRange(1, 3); // [1, 2]
 * numberRange(3, 1); // [2, 1]
 * numberRange(1, -2); // [0, -1, -2]
 * numberRange(-3); // [-1, -2, -3]
 * ```
 */
export function numberRange(start: number, end?: number | null, stepSize: number = 1): number[] {
    // Validate.
    if (!stepSize || stepSize < 0)
        stepSize = 1;
    // Only length given.
    if (end == null)
        [end, start] = [start, 0];
    // Go in reverse.
    const range: number[] = [];
    if (end < start) {
        for (let i=start-1; i>=end; i -= stepSize)
            range.push(i);
    }
    // Fill directly.
    else
        for (let i=start; i<end; i += stepSize)
            range.push(i);
    // Return range.
    return range;
}
