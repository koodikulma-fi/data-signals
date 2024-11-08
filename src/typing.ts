
// - Imports - //

// Dependency.
import { ClassType, IterateBackwards } from "mixin-types/types";


// - General - //

// NodeJS side timer.
/** Typing for NodeJS side timers. */
export interface NodeJSTimeout {
    ref(): this;
    unref(): this;
    hasRef(): boolean;
    refresh(): this;
    [Symbol.toPrimitive](): number;
}

// Common JS/TS things.
/** Awaits the value from a promise. */
export type AwaitedOnce<T> = T extends PromiseLike<infer U> ? U : T
/** Type for holding keys as a dictionary, array or set. Useful for name checking. */
export type SetLike<K extends string> = Partial<Record<K, any>> | Array<K> | Set<K>;
/** Returns true if type is `any`, otherwise false. */
export type IsAny<T> = (any extends T ? true : false) extends true ? true : false;
/** Get keys of a object that have partial values. */
export type GetPartialKeys<T> = { [Key in keyof T & string]: {[K in Key]?: T[Key]; } extends Pick<T, Key> ? Key : never; }[keyof T & string];
/** Omit keys that are partial, resulting in a dictionary that only contains the required properties. */
export type OmitPartial<T> = Omit<T, GetPartialKeys<T>>;

// // Intersect.
// /** Convert union to intersection. */
// export type Intersect<T> = (T extends any ? ((x: T) => 0) : never) extends ((x: infer R) => 0) ? R : never;
// /** Convert array values to intersection type. */
// export type IntersectArray<Arr extends any[], Index extends number = Arr["length"], Intersected extends any = {}> = Index extends 0 ? Intersected : IntersectArray<Arr, IterateBackwards[Index], Intersected & Arr[IterateBackwards[Index]]>;

// // Tuple helpers.
// /** Get the sub array before an index. For example: `TupleBefore<[0, 1, 2, 3], 2>` returns `[0, 1]`. */
// export type TupleBefore<Arr extends any[] | readonly any[], Index extends number | never, Result extends any[] = []> =
//     // Generic or too far.
//     0 | 1 extends Index ? Arr : Index extends never ? Result :
//     // Finished.
//     Index extends 0 ? Result :
//     // Do this, and then maybe more.
//     TupleBefore<Arr, IterateBackwards[Index], [Arr[IterateBackwards[Index]], ...Result]>;
// /** Get the sub array after an index. For example: `TupleBefore<[0, 1, 2, 3], 1>` returns `[2, 3]`. */
// export type TupleAfter<Arr extends any[] | readonly any[], Index extends number | never, Result extends any[] = []> =
//     // Generic or too far.
//     1 | 2 extends Index ? Arr : Index extends never ? Result :
//     // Finished.
//     IterateForwards[Index] extends Arr["length"] ? Result :
//     // Do this, and then maybe more.
//     TupleAfter<Arr, IterateForwards[Index], [...Result, Arr[IterateForwards[Index]]]>;
// /** Replace a value in a type array. */
// export type TupleReplace<Arr extends any[] | readonly any[], Index extends number, Value extends any> = [...TupleBefore<Arr, Index>, Value, ...TupleAfter<Arr, Index>];


// - Get deep value - //

// Thanks to: https://github.com/microsoft/TypeScript/pull/40336
/** Get deep value type using a dotted data key, eg. `somewhere.deep.in.data`.
 * - If puts Unknown (3rd arg) to `never`, then triggers error with incorrect path.
 * - Use the IsPartial (4th arg) to control partial objects: if `false`, is never partial, if `true` always partial, if `null` (default) then is not yet partial, but can become partial.
 */
export type PropType<T extends Record<string, any> | undefined, Path extends string, Unknown = unknown, IsPartial extends boolean | null = null> =
    // Too generic.
    string extends Path ? Unknown :
    // Finished.
    Path extends keyof T ? true extends IsPartial ? T[Path] | undefined : IsPartial extends false ? Exclude<T[Path], undefined> : T[Path] :
    // Should go deeper.
    Path extends `${infer K}.${infer R}` ?
        // Can go deeper.
        K extends keyof T ?
            PropType<T[K] & {}, R, Unknown, IsPartial extends false ? false : undefined extends T[K] ? true : IsPartial> :
        Unknown :
    // Unfound path.
    Unknown;

/** This helps to feed in a fallback to handle partiality.
 * - If the Fallback is not `undefined`, then it can cut partiality away and represents itself as an union type for the deep data.
 * - If the Fallback is `undefined`, then only adds `undefined` if the data was actually partial. Otherwise doesn't.
 */
export type PropTypeFallback<T extends Record<string, any> | undefined, Path extends string, Fallback extends any = undefined> =
    Fallback extends undefined ? PropType<T, Path, never> : PropType<T, Path, never, false> | Fallback;

/** Get deep props by a dictionary whose keys are dotted data keys and values are fallbacks (to be used when data is not found on the JS side).
 * - The outputted type is likewise a flat dictionary with the same keys, but values are fetched deeply for each.
 */
export type PropTypesFromDictionary<T extends Record<string, any>, Fallbacks extends Record<string, any>> = {
    [Key in keyof Fallbacks & string]: PropTypeFallback<T, Key, Fallbacks[Key]>;
};

/** Get deep props for an array of dotted data keys. */
export type PropTypeArray<T extends Record<string, any>, Paths extends Array<string | undefined>, Fallbacks extends any[] = undefined[], Index extends number = Paths["length"]> =
    // Nothing more to do.
    Index extends 0 ? [] :
    // Cut deepness away.
    number | never extends Index ? [] :
    // Do this, and then there's still more to add before us.
    [...PropTypeArray<T, Paths, Fallbacks, IterateBackwards[Index]>, PropTypeFallback<T, Paths[IterateBackwards[Index]] & string, Fallbacks[IterateBackwards[Index]]>];


// - Get dotted data keys from nested data - //

// This variant does not allow class instances nor interfaces.
/** Collect structural data keys from a deep dictionary as dotted strings.
 * - Does not go inside arrays, sets, maps, immutable objects nor classes or class instances.
 *      * Note. By cutting class instances also cuts any `interface` sub types, only use `type` for sub data.
 * - By default limits to 10 depth, to not limit at all put MaxDepth to -1.
 * - Can provide <Data, InterfaceLevel, Pre, Joiner, MaxDepth>. Should not provide the last PreVal, it's used internally.
 * - If InterfaceLevel is never, allows interfaces all the way through - not recommended. Defaults to 0, no interfaces.
 */
export type GetJoinedDataKeysFrom<
    // Type arguments.
    Data extends Record<string, any>,
    InterfaceLevel extends number = 0,
    // Optional.
    Pre extends string = "",
    Joiner extends string = ".",
    MaxDepth extends number = 10,
    // Local variables.
    PreVal extends string = "" extends Pre ? "" : `${Pre}${Joiner}`
> = IsAny<Data> extends true ? any : IterateBackwards[MaxDepth] extends never ? never : {
    // Each key.
    [Key in string & keyof Data]:
        // Check if is deep or not. The scope returns `true` or `false`.
        (0 extends InterfaceLevel ? IsDeepPropertyType<Data, Key> : IsDeepPropertyInterface<Data, Key>) extends true ?
            // Deep.
            string & GetJoinedDataKeysFrom<Data[Key] & {}, InterfaceLevel extends 0 ? 0 : IterateBackwards[InterfaceLevel], `${PreVal}${Key}`, Joiner, IterateBackwards[MaxDepth]> | `${PreVal}${Key}` :
            // Not dictionary like.
            `${PreVal}${Key}`;
}[string & keyof Data];

/** Check if the next level property is deep or not. Skipping arrays, sets, maps, immutable likes, class types, class instances and interfaces. */
export type IsDeepPropertyType<Data extends Record<string, any>, Prop extends keyof Data & string> = 
    // As a type - interfaces don't meet the restriction of `{ [y: number]: never; }` by default, while types do.
    // .. This also cuts class types and class instances away.
    Data[Prop] & {} extends { [x: string]: any; [y: number]: never; } ?
        // Don't accept any sort of iterables (arrays, sets, maps, immutables).
        Data[Prop] & {} extends Iterable<any> ? false :
        // Is indeed a dictionary like type.
        true :
    false;

/** Check if the next level property is deep or not. Skipping arrays, sets, maps, immutable likes and class types - but including class instances and interfaces. */
export type IsDeepPropertyInterface<Data extends Record<string, any>, Prop extends keyof Data & string> = 
    // As an interface - just check if is dictionary like.
    Data[Prop] & {} extends Record<string, any> ?
        // Don't accept any sort of iterables (arrays, sets, maps, immutables), nor class types (static) - but do allow interfaces and class instances.
        Data[Prop] & {} extends Iterable<any> | ClassType ? false :
        // Is indeed a dictionary like interface.
        true :
    // Not dictionary like at all.
    false;
