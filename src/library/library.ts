
// - Import - // 

// Typing.
import { ClassType } from "./typing";


// - Static timer helpers - // 

/** Helper for reusing a timer callback, or potentially forcing an immediate call.
 * - Returns the value that should be assigned as the stored timer (either existing one, new one or null).
 */
export function callWithTimeout<Timer extends number | NodeJS.Timeout>(callback: () => void, currentTimer: Timer | null, defaultTimeout: number | null, forceTimeout?: number | null): Timer | null {
    // Clear old timer if was given a specific forceTimeout (and had a timer).
    if (currentTimer !== null && forceTimeout !== undefined) {
        clearTimeout(currentTimer as any); // To support both sides: NodeJS and browser.
        currentTimer = null;
    }
    // Execute immediately.
    const timeout = forceTimeout !== undefined ? forceTimeout : defaultTimeout;
    if (timeout === null)
        callback();
    // Or setup a timer - unless already has a timer to be reused.
    else if (currentTimer === null)
        currentTimer = setTimeout(() => callback(), timeout) as any;
    // Return the timer.
    return currentTimer;
}


// - Static data helpers - // 

/** General data comparison function with level for deepness.
 * - Supports Object, Array, Set, Map complex types and recognizes classes vs. objects.
 * - About arguments:
 *      @param a First object for comparison. (Order of a and b makes no difference in the outcome.)
 *      @param b Second object for comparison. (Order of a and b makes no difference in the outcome.)
 *      @param nDepth Set the depth of comparison. Defaults to -1 (deep).
 *          - nDepth of -1 means no limit. 0 means no depth: simple identity check. 1 means shallow comparison, 2 double shallow comparison, and so on.
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

/** General copy function with level for deepness.
 * - Supports Object, Array, Set, Map complex types and recognizes classes vs. objects.
 * - About arguments:
 *      @param obj The value to copy, typically a complex object (but can of course be a simple value as well).
 *      @param nDepth Set the depth of copy level. Defaults to -1 (deep).
 *          - nDepth of -1 means no limit. 0 means no depth: simple identity check. 1 means shallow copy, 2 double shallow copy, and so on.
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
