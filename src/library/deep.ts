
// - Import - // 

// Typing.
import { ClassType } from "mixin-types";


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


// - Totally static data helpers - // 

// Used internally but also meant as a tool for external use.
/** General data comparison function with level for deepness.
 * - Supports Object, Array, Set, Map complex types and recognizes classes vs. objects.
 * - About arguments:
 *      @param a First object for comparison. (Order of a and b makes no difference in the outcome.)
 *      @param b Second object for comparison. (Order of a and b makes no difference in the outcome.)
 *      @param nDepth Set the depth of comparison. Defaults to -1 (deep).
 *          - nDepth of -1 means no limit. 0 means no depth: simple identity check. 1 means shallow comparison, 2 double shallow comparison, and so on.
 * ```
 * 
 * // Basic usage.
 * const test = { test: true };
 * areEqual(true, test); // false, clearly not equal.
 * areEqual(test, { test: true }); // true, contents are equal when deeply check.
 * areEqual(test, { test: true }, 1); // true, contents are equal when shallow checked.
 * areEqual(test, { test: true }, 0); // false, not identical objects.
 * areEqual(test, test, 0); // true, identical objects.
 * 
 * ```
 */
export function areEqual(a: any, b: any, nDepth = -1): boolean {
    // Identical.
    if (a === b)
        return true;
    // Object.
    if (a && nDepth && typeof a === "object") {
        // Incompatible.
        if (!b || typeof b !== "object")
            return false;
        // Check constructor.
        // .. Note that for classes, we would do this specifically anyway.
        // .. In other words, classes get handled without any specific rules: by this check and below like an object.
        const constr = a.constructor;
        if (constr !== b.constructor)
            return false;
        // Next level.
        nDepth--;
        // Prepare subtype.
        let isArr = false;
        switch(constr) {
            case Object:
                break;
            case Array:
                isArr = true;
                break;
            case Set:
                isArr = true;
                a = [...a];
                b = [...b];
                break;
            case Map:
                if (a.size !== b.size)
                    return false;
                for (const [k, v] of a) {
                    if (!b.has(k))
                        return false;
                    if (nDepth ? !areEqual(b.get(k), v, nDepth) : b.get(k) !== v)
                        return false;
                }
                return true;
            default:
                // Array like.
                const subType = a.toString();
                if (subType === "[object NodeList]" || subType === "[object HTMLCollection]")
                    isArr = true;
                break;
        }
        // Array like.
        if (isArr) {
            const count = a.length;
            if (count !== b.length)
                return false;
            for (let i=0; i<count; i++)
                if (nDepth ? !areEqual(a[i], b[i], nDepth) : a[i] !== b[i])
                    return false;
        }
        // Anything object-like - hoping that works for anything else.
        // .. Note. This works for arrays as well (though slower), but NodeList and HTMLCollection has extras. And not for Sets nor Maps.
        else {
            // Added or changed.
            for (const p in b) {
                if (!a.hasOwnProperty(p))
                    return false;
                if (nDepth ? !areEqual(a[p], b[p], nDepth) : a[p] !== b[p])
                    return false;
            }
            // Deleted.
            for (const p in a) {
                if (!b.hasOwnProperty(p))
                    return false;
            }
        }
        // No diffs found.
        return true;
    }
    // Otherwise not equal, because are not objects and were not identical (checked earlier already).
    return false;
}

// Not used internally, only exported as a tool for external use.
/** General copy function with level for deepness.
 * - Supports Object, Array, Set, Map complex types and recognizes classes vs. objects.
 * - About arguments:
 *      @param obj The value to copy, typically a complex object (but can of course be a simple value as well).
 *      @param nDepth Set the depth of copy level. Defaults to -1 (deep).
 *          - nDepth of -1 means no limit. 0 means no depth: simple identity check. 1 means shallow copy, 2 double shallow copy, and so on.
 * ```
 * 
 * // Prepare.
 * const original = { deep: { blue: true }, simple: "yes" };
 * 
 * // Basic usage.
 * const copy1 = deepCopy(original); // Copied deeply.
 * const copy2 = deepCopy(original, 1); // Copied one level, so original.blue === copy.blue.
 * const copy3 = deepCopy(original, 0); // Did not copy, so original === copy.
 * 
 * // Let's check the claims about depth.
 * [copy1 === original, copy1.deep === original.deep] // [false, false]
 * [copy2 === original, copy2.deep === original.deep] // [false, true]
 * [copy3 === original, copy3.deep === original.deep] // [true, true]
 * 
 * ```
 */
export function deepCopy<T extends any = any>(obj: T, nDepth = -1): T {
    // Simple.
    if (!obj || !nDepth || typeof obj !== "object")
        return obj;
    // Next level.
    nDepth--;
    // Prepare subtype.
    let arr: any[] | null = null;
    switch(obj.constructor) {
        case Object:
            break;
        case Array:
            arr = obj as any[];
            break;
        case Set:
            return new Set(!nDepth ? obj as unknown as Set<any> : [...(obj as unknown as Set<any>)].map(item => deepCopy(item, nDepth)) ) as T;
        case Map:
            return new Map(!nDepth ? obj as unknown as Map<any, any> : [...(obj as unknown as Map<any, any>)].map(([key, item]) => [deepCopy(key, nDepth), deepCopy(item, nDepth) ]) ) as T;
        default:
            // Array like - note that it's an illegal constructor to use: new obj.constructor() for these types (or using: new NodeList() likewise for the same reason).
            const subType = obj.toString();
            if (subType === "[object NodeList]" || subType === "[object HTMLCollection]")
                arr = [...obj as any[]];
            break;
    }
    // Array or array like.
    if (arr)
        return (nDepth ? arr.map(item => deepCopy(item, nDepth)) : [...arr as any[]]) as T;
    // Object (dictionary) like.
    // .. Shallow.
    if (!nDepth)
        return { ...obj };
    // .. Deeper - with support to keep constructor (might not work for all, but it's more correct than changing the constructor).
    const newObj: Record<string, any> = new (obj.constructor as ClassType)();
    for (const prop in obj)
        newObj[prop] = deepCopy(obj[prop], nDepth);
    return newObj as T;
}


// - Static helpers using compare depth mode - //

/** Helper to compare a dictionary/object against another using a compareBy dictionary for update modes - only compares the properties of the compareBy dictionary.
 * - For example, let's say a class instance has `{ props, state }` here, so compareBy would define the comparison modes for each: `{ props: 1, state: "always" }`.
 * - Returns false if had differences. Note that in "always" mode even identical values are considered different, so returns true for any. 
 * - -2 always, -1 deep, 0 changed, 1 shallow, 2 double, ... See the CompareDataDepthMode type for details.
 * 
 * ```
 *
 * // Basic usage.
 * // .. Let's test with two equal sets of data to show case the comparison depth.
 * const a = { props: { deep: { test: true }, simple: false }, state: undefined };
 * const b = { props: { deep: { test: true }, simple: false }, state: undefined };
 * 
 * // Let's mirror what we do for props and state, but by using number vs. mode name.
 * areEqualBy(a, b, { props: 0, state: "changed" });   // false, since `a.props !== b.props`.
 * areEqualBy(a, b, { props: 1, state: "shallow" });   // false, since `a.props.deep !== b.props.deep` (not same obj. ref.).
 * areEqualBy(a, b, { props: 2, state: "double" });    // true, every nested value compared was equal.
 * areEqualBy(a, b, { props: -1, state: "deep" });     // true, every nested value was compared and was equal.
 * areEqualBy(a, b, { props: -2, state: "always" });   // false, both are "always" different - doesn't check.
 * areEqualBy(a, b, { props: -3, state: "never" });    // true, both are "never" different - doesn't check.
 * 
 * // Some tests with "never": saying that the data never changes, don't even check.
 * areEqualBy(a, b, { props: "changed", state: "never" });     // false, since `a.props !== b.props`.
 * areEqualBy(a, b, { props: "never", state: "never" });       // true, did not check either, since they "never" change.
 * 
 * // Of course, if one part says not equal, then doesn't matter what others say: not equal.
 * areEqualBy(a, b, { props: "never", state: "always" });      // false, since state is "always" different.
 * 
 * ```
 */
export function areEqualBy(from: Record<string, any> | null | undefined, to: Record<string, any> | null | undefined, compareBy: Record<string, CompareDataDepthMode | number | any>): boolean {
    // Loop each prop key in the compareBy dictionary.
    const eitherEmpty = !from || !to;
    for (const prop in compareBy) {
        // Prepare.
        const mode = compareBy[prop];
        const nMode = typeof mode === "number" ? mode : CompareDataDepthEnum[mode as string] as number ?? 0;
        // Never (-3) and always (-2) modes. The outcome is flipped as we're not asking about change but equality.
        if (nMode < -1) {
            // Always different - so never equal.
            if (nMode === -2)
                return false;
            continue;
        }
        // Special case. If either was empty, return true (= equal) if both were empty, false (= not equal) otherwise.
        if (eitherEmpty)
            return !from && !to;
        // Changed.
        if (nMode === 0) {
            if (from[prop] !== to[prop])
                return false;
        }
        // Otherwise use the library method.
        else if (!areEqual(from[prop], to[prop], nMode))
            return false;
    }
    // All that were checked were equal.
    return true;
}
