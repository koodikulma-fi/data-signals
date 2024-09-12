
// - General - //

// Helpers for object-likes: dictionaries / classes.
export type Awaited<T> = T extends PromiseLike<infer U> ? U : T
export type RecordableType<K extends string> = Partial<Record<K, any>> | Array<K> | Set<K>; // Iterable<K>;
export type Dictionary<V = any> = Record<string, V>;
export type GetConstructorArgs<T> = T extends new (...args: infer U) => any ? U : never;
/** This senseless types makes the mixin typing work. */
export type GetConstructorReturn<T> = T extends new (...args: any[]) => infer U ? U : never;
export type ClassType<T = {}, Args extends any[] = any[]> = new (...args: Args) => T;
export type ClassMixer<TExtends extends ClassType> = <TBase extends ClassType>(Base: TBase) => Omit<TBase & TExtends, "new"> & { new (...args: GetConstructorArgs<TExtends>): GetConstructorReturn<TBase> & GetConstructorReturn<TExtends>; };


// - Node JS - //

export interface NodeJSTimeout {
    ref(): this;
    unref(): this;
    hasRef(): boolean;
    refresh(): this;
    [Symbol.toPrimitive](): number;
}


// - Algoritm: Get nested value & join & split - //
//
// These are thanks to: https://github.com/microsoft/TypeScript/pull/40336

export type Join<T extends unknown[], D extends string> =
    T extends [] ? '' :
    T extends [string | number | boolean | bigint] ? `${T[0]}` :
    T extends [string | number | boolean | bigint, ...infer U] ? `${T[0]}${D}${Join<U, D>}` :
    string;

/** Split a string into a typed array.
 * - Use with PropType to validate and get deep value types with, say, dotted strings. */
export type Split<S extends string, D extends string> =
    string extends S ? string[] :
    S extends '' ? [] :
    S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] :
    [S];
export type SplitOnce<S extends string, D extends string> =
    string extends S ? string[] :
    S extends '' ? [] :
    S extends `${infer T}${D}${infer U}` ? [T, U] :
    [S];
export type FirstSplit<S extends string, D extends string> =
    string extends S ? string :
    S extends '' ? '' :
    S extends `${infer T}${D}${string}` ? T :
    S;
export type SecondSplit<S extends string, D extends string> =
    string extends S ? string :
    S extends '' ? '' :
    S extends `${string}${D}${infer T}` ? T :
    S;

/** Get deep value type. If puts 3rd param to never, then triggers error with incorrect path. */
export type PropType<T, Path extends string, Unknown = unknown> =
    string extends Path ? Unknown :
    Path extends keyof T ? T[Path] :
    Path extends `${infer K}.${infer R}` ? K extends keyof T ? PropType<T[K], R, Unknown> : Unknown :
    Unknown;


// - Custom algoritms for building dotted string suggestions - //

// Helper - to iterate up to 10. If used with negative (or higher) value, iterates forever.
type SafeIterator = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];

/** Collect structural data keys from a deep dictionary as dotted strings.
 * - Does not go inside arrays, sets, maps, immutable objects nor classes or class instances.
 * - By default limits to 10 depth, to not limit at all put MaxDepth to -1.
 * - Can provide <Data, Pre, Joiner, MaxDepth>. Should not provide the last PreVal, it's used internally. */
export type GetJoinedDataKeysFrom<
    Data extends Record<string, any>,
    Pre extends string = "",
    Joiner extends string = ".",
    MaxDepth extends number = 10,
    PreVal extends string = "" extends Pre ? "" : `${Pre}${Joiner}` // This one is computed, do not input it.
> = SafeIterator[MaxDepth] extends never ? never : 
    { [Key in string & keyof Data]:
        Data[Key] extends { [key: string]: any;[key: number]: never; } ?
            Data[Key] extends { asMutable(): Data[Key]; } ?
                `${PreVal}${Key}` :
            string & GetJoinedDataKeysFrom<Data[Key], `${PreVal}${Key}`, Joiner, SafeIterator[MaxDepth]> | `${PreVal}${Key}` :
        `${PreVal}${Key}`
    }[string & keyof Data];

// Other useful:
//
// type PickByArrayLength<Arr extends any[], Options extends any[], Index extends number = 10> = [undefined] extends [Arr[Index]] ? PickByArrayLength<Arr, Options, SafeIterator[Index]> : Options[Index];
// export declare function getPropValue<T, P extends string>(obj: T, path: P): PropType<T, P>;
// type MatchPair<S extends string> = S extends `${infer A}.${infer B}` ? [A, B] : unknown;
