
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

/** Gets an index for insertion based on the concept of order in 3 categories: `>= 0`, `null|undefined`, `< 0`.
 * @param order The relative order in three categories.
 *      - If a number in `order` array is `>= 0`, then closer to 0, the more in the front it will be.
 *      - If a number in `order` array is `< 0`, then closer to 0, the later will be.
 *      - If a value in `order` array is `null | undefined`, then does not care: after >= 0, but before any < 0.
 *      - If encounters the same in order, adds after (all same).
 * @param orderBy Array representing the _already existing and sorted_ items by their `order`.
 *      - The count of the array implies how many currently exists. If should return after, returns -1.
 *      - Note. If orderBy represents objects or arrays whose property/index contains the order instead, defined `orderProp` (3rd arg).
 * @param orderProp Optional parameter to define a property / index to read the order from the `orderBy` array.
 * @returns The insertion index which is >= 0, or -1 if should add as the last one.
 * 
 * ```
 * 
 * // Get an insertion index using `order` in _pre-sorted_ `orderBy` array.
 * // .. Note. To re-order a whole array use `orderArray(arr, orderBy)`.
 * 
 * // Directly.
 * orderedIndex(0, [0, 1, 2]);                  // 1
 * orderedIndex(0, [1, 2, null, -2, -1]);       // 0
 * orderedIndex(2, [1, 2, null, -2, -1]);       // 2
 * orderedIndex(-1, [1, 2, null, -2, -1]);      // -1
 * orderedIndex(-1.5, [1, 2, null, -2, -1]);    // 4
 * orderedIndex(null, [1, 2, null, -2, -1]);    // 3
 * 
 * // From dictionaries.
 * const orderByObj: { name: string; order?: number | null; }[] = [
 *      { name: "1st", order: 0 },
 *      { name: "2nd" },
 *      { name: "3rd", order: -1 },
 * ];
 * orderedIndex(0, orderByObj, "order");         // 1
 * orderedIndex(null, orderByObj, "order");      // 2
 * orderedIndex(-1, orderByObj, "order");        // -1
 * 
 * // From sub array objects.
 * const orderByArr = [
 *      ["1st", 0] as const,
 *      ["2nd"] as const,
 *      ["3rd", -1] as const,
 * ];
 * orderedIndex(0, orderByArr, 1);               // 1
 * orderedIndex(null, orderByArr, 1);            // 2
 * orderedIndex(-1, orderByArr, 1);              // -1
 * 
 * // Test typeguard.
 * orderedIndex(null, orderByObj, "name");  // orderByObj is red-underlined (or the method).
 * orderedIndex(null, orderByArr, 0);       // 0 is red-underlined (or the method).
 *
 * ```
 */
export function orderedIndex<Index extends number, T extends any[] | readonly any[]>(order: number | null | undefined, orderBy: T[], index: T[Index] extends number | null | undefined ? Index : never): number;
export function orderedIndex<Key extends (string | number) & keyof T, T extends Partial<Record<Key, number | null>>>(order: number | null | undefined, orderBy: T[], property: Key): number;
export function orderedIndex(order: number | null | undefined, orderBy: Array<number | null | undefined>, orderProp?: "" | undefined | never): number;
export function orderedIndex(order: number | null | undefined, orderBy: Array<number | null | undefined> | Partial<Record<string | number, number | null>>[] | any[][], orderProp?: string | number): number {
    // Find place.
    return orderProp != null ? 
        // By prop.
        // .. Null. Note that in comparison o < 0, null|undefined behaves like 0: results in false.
        order == null ? (orderBy as Partial<Record<string | number, number | null>>[]).findIndex(o => o[orderProp] as number < 0) :
        // .. Negative.
        order < 0 ? (orderBy as Partial<Record<string | number, number | null>>[]).findIndex(o => o[orderProp] != null && o[orderProp]! < 0 && o[orderProp]! > order) :
        // .. Natural.
        (orderBy as Partial<Record<string | number, number | null>>[]).findIndex(o => o[orderProp] == null || o[orderProp]! < 0 || o[orderProp]! > order) : 
        // Directly.
        // .. Null. Note that in comparison o < 0, null|undefined behaves like 0: results in false.
        order == null ? (orderBy as Array<number | null | undefined>).findIndex(o => o as number < 0) :
        // .. Negative.
        order < 0 ? (orderBy as Array<number | null | undefined>).findIndex(o => o != null && o < 0 && o > order) :
        // .. Natural.
        (orderBy as Array<number | null | undefined>).findIndex(o => o == null || o < 0 || o > order);
}

/** Order an array by matching `order` array consisting of numbers or null | undefined.
 * - Ordering happens in 3 categories: 1. near front (>= 0), 2. near end (< 0), 3. don't care (null | undefined).
 * @param arr The original array to sort.
 * @param orderOrPropIndex The relative order in three categories, or a property string or index number.
 *      - If a string or number, then uses it as a property/index of the item to ready data.
 *      - If an array:
 *          * For values `>= 0`, then closer to 0, the more in the front it will be.
 *          * For values `< 0`, then closer to 0, the later will be.
 *          * For values `null | undefined`, then does not care: after >= 0, but before any < 0.
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
 * // Dictionaries (with type support).
 * type Obj = { name: string; order?: number | null; };
 * const a: Obj = { name: "a", order: -1 };
 * const b: Obj = { name: "b", order: 0 };
 * const c: Obj = { name: "c" };
 * orderArray([a, b, c], "order"); // [b, c, a]
 * 
 * // Sub array objects (with type support for specific index).
 * const d = ["d", -1] as const;
 * const e = ["e", 0] as const;
 * const f = ["f"] as const;
 * orderArray([d, e, f], 1); // [e, f, d]
 * 
 * // Test typeguard.
 * orderArray([a, b, c], "name");   // name is red-underlined (or the method).
 * orderArray([d, e, f], 0);        // 0 is red-underlined (or the method).
 *
 * ```
 * 
 */
export function orderArray<Index extends number, T extends any[] | readonly any[]>(arr: T[], index: T[Index] extends number | null | undefined ? Index : never): T[];
export function orderArray<Key extends string & keyof T, T extends Partial<Record<Key, number | null>>>(arr: T[], property: Key): T[];
export function orderArray<T extends any>(arr: T[], orderBy: Array<number | null | undefined>): T[];
export function orderArray<T extends any>(arr: T[], orderOrPropIndex: Array<number | null | undefined> | string | number): T[] {
    // Prepare.
    const handled: Array<[order: number | null | undefined, item: T]> = [];
    const isProp = !Array.isArray(orderOrPropIndex);
    // Loop all once.
    for (let i=0,count=arr.length; i<count; i++) {
        // Find place.
        const oMe = isProp ? arr[i][orderOrPropIndex] : orderOrPropIndex[i];
        const iInsert = orderedIndex(oMe, handled, 0);
        // Insert.
        iInsert === -1 ? handled.push([oMe, arr[i]]) : handled.splice(iInsert, 0, [oMe, arr[i]]);
    }
    // Return items.
    return handled.map(h => h[1]);
}

/** Creates a numeric range with whole or fractoral numbers.
 * @param startOrEnd Define where the range starting from 0 ends, or where the range starts if end (2nd arg) is not undefined nor null.
 * @param end Define wher the range ends, making the 1st argument represent start. Note that ends _before_ the end value by default.
 * @param stepSize How big each step. If 0 then 1. If negative, flips the order.
 * @param includeEnd If set to true, then the range includes the end value. By default ends _before_ the end is reached.
 * 
 * ```
 * 
 * // Create whole number ranges.
 * numberRange(3);                  // [0, 1, 2]
 * numberRange(-3);                 // [0, -1, -2]
 * numberRange(1, 3);               // [1, 2]
 * numberRange(3, 1);               // [3, 2]
 * numberRange(1, 3, 1, true);      // [1, 2, 3]
 * numberRange(3, 1, -1, true);     // [1, 2, 3]
 * numberRange(3, 1, null, true);   // [3, 2, 1]
 * numberRange(-1, 2);              // [-1, 0, 1]
 * numberRange(1, -2);              // [1, 0, -1]
 * numberRange(1, -2, -1);          // [-1, 0, 1]
 * numberRange(0, 3, -1);           // [2, 1, 0]
 * numberRange(3, null, -1);        // [2, 1, 0]
 * numberRange(-3, null, -1);       // [-2, -1, 0]
 * 
 * // Create fractional ranges.
 * numberRange(1, 2, 0.25);         // [1, 1.25, 1.5, 1.75]
 * numberRange(1, 2, -0.25);        // [1.75, 1.5, 1.25, 1]
 * numberRange(2, 1, 0.25);         // [2, 1.75, 1.5, 1.25]
 * numberRange(1, 2, 0.25, true);   // [1, 1.25, 1.5, 1.75, 2]
 * numberRange(2, 1, 0.25, true);   // [2, 1.75, 1.5, 1.25, 1]
 * numberRange(2, 1, -0.25, true);  // [1, 1.25, 1.5, 1.75, 2]
 * numberRange(3, null, 0.5);       // [0, 0.5, 1, 1.5, 2, 2.5]
 * numberRange(3, null, -0.5);      // [0, -0.5, -1, -1.5, -2, -2.5]
 * numberRange(1, 2, 0.33);         // [1, 1.33, 1.66, 1.99] // Or what fracts do.
 * numberRange(1, 2, -0.33);        // [1.99, 1.66, 1.33, 1] // Or what fracts do.
 * 
 * ```
 */
export function numberRange(startOrEnd: number, end?: number | null, stepSize?: number | null, includeEnd?: boolean): number[] {
    // Validate.
    const flip = (stepSize as number) < 0; // (null|undefined|0 < 0) all say `false`.
    let [i, e] = end == null ? [0, startOrEnd] : [startOrEnd, end];
    const forwards = i < e;
    stepSize = !stepSize ? forwards ? 1 : -1 : forwards !== flip ? stepSize : -stepSize;
    // Fill directly.
    const range: number[] = [];
    if (includeEnd)
        while(forwards ? i<=e : i>=e) { range.push(i); i += stepSize!; }
    else
        while(forwards ? i<e : i>e) { range.push(i); i += stepSize!; }
    // Flip.
    if (flip)
        range.reverse();
    // Return range.
    return range;
}
