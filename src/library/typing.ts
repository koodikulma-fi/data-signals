
// - General - //

// Common JS things.
/** Awaits the value from a promise. */
export type Awaited<T> = T extends PromiseLike<infer U> ? U : T
/** Type for holding keys as a dictionary, array or set. */
export type RecordableType<K extends string> = Partial<Record<K, any>> | Array<K> | Set<K>;

// Classes and mixins.
/** Get the type for class constructor arguments. */
export type GetConstructorArgs<T> = T extends new (...args: infer U) => any ? U : never;
/** Get the type for class constructor return. */
export type GetConstructorReturn<T> = T extends new (...args: any[]) => infer U ? U : never;
/** Get the type for class from class instance - the opposite of `InstanceType`. Optionally define constructor args. */
export type ClassType<T = {}, Args extends any[] = any[]> = new (...args: Args) => T;
/** Typing to extend mixins.
 * @param TExtends Should refer to the class type of the mixin.
 * @returns The returned type is a mixin creator, essentially: `(Base: TBase) => TBase & TExtends`.
 */
export type ClassMixer<TExtends extends ClassType> = <TBase extends ClassType>(Base: TBase) => Omit<TBase & TExtends, "new"> & { new (...args: GetConstructorArgs<TExtends>): GetConstructorReturn<TBase> & GetConstructorReturn<TExtends>; };


// - Get deep value - //

// Thanks to: https://github.com/microsoft/TypeScript/pull/40336
/** Get deep value type using a dotted data key, eg. `somewhere.deep.in.data`. If puts Unknown (3rd arg) to `never`, then triggers error with incorrect path. */
export type PropType<T, Path extends string, Unknown = unknown> =
    string extends Path ? Unknown :
    Path extends keyof T ? T[Path] :
    Path extends `${infer K}.${infer R}` ? K extends keyof T ? PropType<T[K], R, Unknown> : Unknown :
    Unknown;

/** Get deep props by a dictionary whose keys are dotted data keys and values are fallbacks (to be used when data is not found on the JS side).
 * - Note that if does not validate whether the keys are valid, since in those cases should simply always return the respective fallback.
 */
export type PropTypeDictionary<T, Fallbacks extends Record<string, any>> = {
    [Key in keyof Fallbacks & string]: PropType<T, Key, Fallbacks[Key]> | Fallbacks[Key];
};

/** Get deep props for an array of dotted data keys. */
export type PropTypeArray<T, Paths extends Array<string | undefined>, Fallbacks extends any[] = Paths, Index extends number = Paths["length"]> =
    // Nothing more to do.
    Index extends 0 ? [] :
    // Do this, and then there's still more to add before us.
    [...PropTypeArray<T, Paths, Fallbacks, IterateBackwards[Index]>, PropType<T, Paths[IterateBackwards[Index]] & string, Fallbacks[IterateBackwards[Index]]> | Fallbacks[IterateBackwards[Index]]];


// - Get dotted data keys from nested data - //

/** Iterate down from 20 to 0. If iterates with 0 or negative returns never. If iterates with higher than 20, returns 0. */
type IterateBackwards = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]];

/** Collect structural data keys from a deep dictionary as dotted strings.
 * - Does not go inside arrays, sets, maps, immutable objects nor classes or class instances.
 * - By default limits to 10 depth, to not limit at all put MaxDepth to -1.
 * - Can provide <Data, Pre, Joiner, MaxDepth>. Should not provide the last PreVal, it's used internally. */
export type GetJoinedDataKeysFrom<
    // Type arguments.
    Data extends Record<string, any>,
    Pre extends string = "",
    Joiner extends string = ".",
    MaxDepth extends number = 10,
    // Local variables.
    PreVal extends string = "" extends Pre ? "" : `${Pre}${Joiner}`
> = IterateBackwards[MaxDepth] extends never ? never : 
    { [Key in string & keyof Data]:
        Data[Key] extends { [key: string]: any;[key: number]: never; } ?
            Data[Key] extends { asMutable(): Data[Key]; } ?
                `${PreVal}${Key}` :
            string & GetJoinedDataKeysFrom<Data[Key], `${PreVal}${Key}`, Joiner, IterateBackwards[MaxDepth]> | `${PreVal}${Key}` :
        `${PreVal}${Key}`
    }[string & keyof Data];
