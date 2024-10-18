
// - Imports - //

// Depedency.
import { AsClass, ReClass } from "mixin-types/types";
// Library.
import { PropType, SetLike, GetJoinedDataKeysFrom } from "../typing";
// Mixins.
import { SignalListener, SignalsRecord } from "../mixins/SignalBoy";
import { SignalSendAsReturn, SignalManType, mixinSignalMan, SignalMan } from "../mixins/SignalMan";
import { mixinDataBoy, DataBoy, DataBoyType } from "../mixins/DataBoy";
// Classes.
import { Context, ContextSettings, createContexts } from "./Context";


// - Helper types - //

// All contexts.
/** Typing to hold named contexts as a dictionary. */
export type ContextsAllType = Record<string, Context<any, any>>;
/** Typing to hold named contexts as a dictionary with optional UnionType and optionally only using certain keys. */
export type ContextsAllTypeWith<
    AllContexts extends ContextsAllType = {},
    UnifyWith extends any = undefined,
    OnlyKeys extends keyof AllContexts & string = keyof AllContexts & string
> = { [Name in OnlyKeys]: never extends UnifyWith ? AllContexts[Name] : AllContexts[Name] | UnifyWith; };

// Join contextual signal keys.
/** Get the joined contextual signal keys: `${ContextName}.${SignalName}`. */
export type GetJoinedSignalKeysFromContexts<Contexts extends ContextsAllType> = {[CtxName in string & keyof Contexts]: keyof (Contexts[CtxName]["_Signals"] & {}) extends string ? `${CtxName}.${keyof (Contexts[CtxName]["_Signals"] & {}) & string}` : never; }[string & keyof Contexts];

// Read from contexts.
/** Get the joined contextual data keys: `${ContextName}.${MainKey}.${SubKey}`, and so on. */
export type GetSignalsFromContexts<Ctxs extends ContextsAllType> = { [CtxSignalName in GetJoinedSignalKeysFromContexts<Ctxs> & string]: CtxSignalName extends `${infer CtxName}.${infer SignalName}` ? (Ctxs[CtxName]["_Signals"] & {})[SignalName] : never; };
/** Combine the data part of the named contexts, keeping the same naming structure. */
export type GetDataFromContexts<Ctxs extends ContextsAllType> = { [Key in string & keyof Ctxs]: Ctxs[Key]["data"]; };
// /** Combine the data part of the named contexts, keeping the same naming structure. Enforces the data declaration of each context to `type` like from `interface` like, so that it's not cut out. */
// export type GetDataFromContexts<Ctxs extends ContextsAllType> = { [Key in string & keyof Ctxs]: Ctxs[Key]["data"] & { [y: number]: never; }; }; // Let's make interfaces look like types here at the 1st level.


// - Class - //

/** Class type of ContextAPI. */
export interface ContextAPIType<Contexts extends ContextsAllType = {}> extends AsClass<
    // Static.
    DataBoyType<Partial<GetDataFromContexts<Contexts>>, 1> & SignalManType<GetSignalsFromContexts<Contexts>>,
    // Instance.
    ContextAPI<Contexts>,
    // Args.
    [contexts?: Partial<Contexts>, inheritedContexts?: Partial<Contexts>]>
{ 
    // Re-type.
    /** Assignable getter to call more data listeners when callDataBy is used.
     * - If dataKeys is true (or undefined), then should refresh all data.
     * - Note. To use the default callDataBy implementation from the static side put 2nd arg to true: `contextAPI.callDataBy(dataKeys, true)`.
     * - Note. Put as static to keep the public instance API clean. The method needs to be public for internal use of extending classes.
     */
    callDataListenersFor?(contextAPI: ContextAPI<any>, dataKeys?: true | string[]): void;
    /** Optional method to keep track of added / removed listeners. Called right after adding and right before removing. */
    onListener?(contextAPI: ContextAPI<any>, name: string, index: number, wasAdded: boolean): void;
    /** Optional method to get the listeners for the given signal. If used it determines the listeners, if not present then uses this.signals[name] instead. Return undefined to not call anything. */
    getListenersFor?(contextAPI: ContextAPI<any>, signalName: string): SignalListener[] | undefined;

    // Extendable.
    /** Extendable static method to handle modifying contexts. Modifies the named context assignments by the given contextMods. To totally remove a context set its value as `undefined`. */
    modifyContexts(contextAPI: ContextAPI<any>, contextMods: Partial<ContextsAllTypeWith<{}, null>>, callDataIfChanged: boolean, setAsInherited: boolean): string[];

    // Static simple-typed helpers.
    /** Converts contextual data or signal key to `[ctxName: string, dataSignalKey: string]` */
    parseContextDataKey(ctxDataSignalKey: string): [ctxName: string, dataSignalKey: string];
    /** Read context names from contextual data keys or signals. */
    readContextNamesFrom(ctxDataSignalKeys: string[]): string[];
    /** Converts array of context data keys or signals `${ctxName}.${dataSignalKey}` to a dictionary `{ [ctxName]: dataSignalKey[] | true }`, where `true` as value means all in context. */
    readContextDictionaryFrom(ctxDataKeys: string[]): Record<string, string[] | true>;
}
export interface ContextAPI<Contexts extends ContextsAllType = {}> extends DataBoy<GetDataFromContexts<Contexts>, 1>, SignalMan<GetSignalsFromContexts<Contexts>> { }
/** ContextAPI extends SignalMan and DataBoy mixins to provide features for handling multiple named Contexts.
 * - According to its mixin basis, ContextAPI allows to:
 *      * SignalMan: Send and listen to signals in the named contexts.
 *      * DataBoy: Listen to data changes, but also to set/get data in the contexts.
 * - All data keys and signal names should start with `${contextName}.${keyOrName}`.
 *      * For example: "settings.something.deep" data key (for "settings" context) or "navigation.onFocus" signal (for "navigation" context).
 * - Importantly, the ContextAPI's `awaitDelay` method can be overridden externally to affect the syncing of all the connected contexts.
 *      * More specifically, the "delay" cycle of the Contexts is resolved only once all the ContextAPIs connected to the context have resolved their `awaitDelay`.
 */
export class ContextAPI<Contexts extends ContextsAllType = {}> extends (mixinDataBoy(mixinSignalMan(Object)) as any as ReClass<ContextAPIType, {}>) {
    

    // - Members - //

    // Typing.
    ["constructor"]: ContextAPIType<Contexts>;

    /** All the contexts assigned to us.
     * - They also have a link back to us by context.contextAPIs, with this as the key and context names as the values. 
     * - Note that can also set `null` value here - for purposefully excluding an inherited context (when using one contextAPI to inherit contexts from another).
     *      * But `undefined` will never be found in here - if gives to the setContext, it means deleting the entry from the record.
     */
    public contexts: Partial<Record<string, Context<Record<string, any>, SignalsRecord> | null>>;
    /** Optionally set inherited contexts that will be automatically hooked up and connected just like normal contexts.
     * - For example, if you have a common source of inheritance, only change it once it changes, treating the contexts as dictionary as if immutable.
     *      * The immutable nature is important in order to correctly manage connections to contexts.
     */
    public inheritedContexts?: Partial<Record<string, Context<Record<string, any>, SignalsRecord> | null>>;


    // - Initialize - //

    constructor(contexts?: Partial<Contexts>, inheritedContexts?: Partial<Contexts>) {
        super();
        this.contexts = { ...contexts };
        if (inheritedContexts)
            this.inheritedContexts = { ...inheritedContexts };
        this.dataListeners = new Map();
    }


    // - Overrideable - //

    /** This (triggers a refresh and) returns a promise that is resolved when the "pre-delay" or "delay" cycle is completed.
     * - At the level of ContextAPI there's nothing to refresh (no data held, just read from contexts).
     *      * Actually the point is the opposite: to optionally delay the "delay" cycle of the connected contexts by overriding the `awaitDelay` method.
     * - Note that this method is overrideable. On the basic implementation it resolves immediately due to that there's no awaitDelay.
     *      * But on an external layer, the awaiting might be synced to provide the bridging for syncing the "delay" signals of many contexts together.
     * - Note that the timing of this method should always reflect awaitDelay - it should just provide triggering refresh in addition to awaiting the promise.
     *      * So if awaitDelay is not present, this method should resolve instantly as well.
     */
    public afterRefresh(fullDelay?: boolean, forceTimeout?: number | null): Promise<void>;
    public afterRefresh(_fullDelay: boolean = false, _forceTimeout?: number | null): Promise<void> {
        // Let's do an instant "pre-delay" - so, nothing.
        // And then, let's resolve by the awaitDelay.
        return this.awaitDelay ? this.awaitDelay() : Promise.resolve();
    }
    /** At the level of ContextAPI the `awaitDelay` resolves instantly (it's not defined).
     * - Importantly, this method determines when the "delay" cycle of the connected Contexts is resolved. (That's why defaults to instant.)
     * - Accordingly, you can set / override this method (externally or by extending class) to customize the syncing.
     * - Note that this method should not be _called_ externally - only overridden externally (to affect the "delay" cycle timing).
     */
    awaitDelay?(): Promise<void>;
 

    // - Send signals - //

    // Override to use contexts.
    /** Emit a signal. Does not return a value. Use `sendSignalAs(modes, ctxSignalName, ...args)` to refine the behaviour. */
    public sendSignal<
        CtxSignalName extends string & keyof GetSignalsFromContexts<Contexts>,
        Names extends CtxSignalName extends `${infer CtxName}.${infer SignalName}` ? [CtxName, SignalName] : [never, never],
    >(ctxSignalName: CtxSignalName, ...args: Parameters<(Contexts[Names[0]]["_Signals"] & {})[Names[1]]>): void {
        const iSplit = ctxSignalName.indexOf(".");
        iSplit !== -1 && this.getContext(ctxSignalName.slice(0, iSplit))?.sendSignal(ctxSignalName.slice(iSplit + 1), ...args);
    }
    
    // Override to use contexts.
    /** The sendSignalAs method exposes various signalling features through its first arg: string or string[]. The features are listed below:
     * - `"delay"`:
     *      * Delays sending the signal. To also collect returned values must include "await".
     *      * Note that this delays the process to sync with the Context's refresh cycle, and waits until all related contextAPIs have refreshed.
     *      * In an external layer this could be further tied to other update cycles (eg. rendering cycle).
     * - `"pre-delay"`:
     *      * Like "delay", syncs to the Context's refresh cycle, but calls then on that cycle - without waiting external flush (from other contextAPIs connected to the same context network).
     * - `"await"`:
     *      * Awaits each listener (simultaneously) and returns a promise. By default returns the last non-`undefined` value, combine with "multi" to return an array of awaited values (skipping `undefined`).
     *      * Exceptionally if "delay" is on, and there's no "await" then can only return `undefined`.
     *      * This is because there's no promise to capture the timed out returns.
     * - `"multi"`:
     *      * "multi" is actually the default behaviour: returns an array of values ignoring any `undefined`.
     *      * It can also be used explicitly to force array return even if using "last", "first" or "first-true" - which would otherwise switch to a single value return mode.
     * - `"last"`:
     *      * Use "last" to return the last acceptable value (by default ignoring any `undefined`) - instead of an array of values.
     * - "first"`:
     *      * Stops the listening at the first value that is not `undefined` (and not skipped by "no-false" or "no-null"), and returns that single value.
     *      * Note that "first" does not stop the flow when using "await", but just returns the first acceptable value.
     * - "first-true":
     *      * Is like "first" but stops only if value amounts to true like: !!value.
     * - "no-false":
     *      * Ignores any falsifiable values, only accepts: `(!!value)`. So most commonly ignored are: `false`, `0`, `""`, `null´, `undefined`.
     * - "no-null":
     *      * Ignores any `null` values in addition to `undefined`. (By default only ignores `undefined`.)
     *      * Note also that when returning values, any signal that was connected with .Deferred flag will always be ignored from the return value flow (and called 0ms later, in addition to "delay" timeout).
     * - Note about the signal flow at the ContextAPI level:
     *      * The `listenTo` and `listenToData` features provide a stable basis for listening. It makes no difference whether contexts are present when attaching the listeners.
     *      * However, the `sendSignal` and `sendSignalAs` use the context methods directly - so if the context is not found at the time of calling, then does nothing.
     */
    public sendSignalAs<
        // Inferred.
        CtxSignals extends GetSignalsFromContexts<Contexts>,
        CtxSignalName extends string & keyof CtxSignals,
        Mode extends "" | "pre-delay" | "delay" | "await" | "last" | "first" | "first-true" | "multi" | "no-false" | "no-null",
        // Local variables.
        HasAwait extends boolean = Mode extends string[] ? Mode[number] extends "await" ? true : false : Mode extends "await" ? true : false,
        HasLast extends boolean = Mode extends string[] ? Mode[number] extends "last" ? true : false : Mode extends "last" ? true : false,
        HasFirst extends boolean = Mode extends string[] ? Mode[number] extends "first" ? true : Mode[number] extends "first-true" ? true : false : Mode extends "first" ? true : Mode extends "first-true" ? true : false,
        HasMulti extends boolean = Mode extends string[] ? Mode[number] extends "multi" ? true : false : Mode extends "multi" ? true : false,
        HasDelay extends boolean = Mode extends string[] ? Mode[number] extends "delay" ? true : false : Mode extends "delay" ? true : false,
        HasPreDelay extends boolean = Mode extends string[] ? Mode[number] extends "pre-delay" ? true : false : Mode extends "pre-delay" ? true : false,
        UseSingle extends boolean = true extends HasMulti ? false : HasFirst | HasLast,
        UseReturnVal extends boolean = true extends HasAwait ? true : true extends HasDelay | HasPreDelay ? false : true,
    >(modes: Mode | Mode[], ctxSignalName: CtxSignalName, ...args: Parameters<CtxSignals[CtxSignalName]>): true extends UseReturnVal ? SignalSendAsReturn<ReturnType<CtxSignals[CtxSignalName]>, HasAwait, UseSingle> : undefined {
        // Use context.
        const iSplit = ctxSignalName.indexOf(".");
        const ctx = iSplit === -1 ? null : this.getContext(ctxSignalName.slice(0, iSplit));
        if (ctx)
            return ctx.sendSignalAs(modes, ctxSignalName.slice(iSplit + 1), ...args) as any;
        // Handle awaiting and empty value returns without context.
        const m: string[] = typeof modes === "string" ? [modes] : modes;
        const r = m.includes("last") || m.includes("first") || m.includes("first-true") ? undefined : [];
        return m.includes("await") ? Promise.resolve(r) as any : r as any;
    }


    // - Handle data - //

    // Extend.
    /** Get from contextual data by dotted key: eg. `"someCtxName.someData.someProp"`.
     * - If the context exists uses the getInData method from the context (or getData if no sub prop), otherwise returns undefined or the fallback.
     * - If context found, the fallback is passed to it and also used in case the data is not found at the data key location.
     */
    public getInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas, 1>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, fallback?: never | undefined): SubData | undefined;
    public getInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas, 1>, SubData extends PropType<CtxDatas, CtxDataKey, never>, FallbackData extends any>(ctxDataKey: CtxDataKey, fallback: FallbackData): SubData | FallbackData;
    public getInData(ctxDataKey: string, fallback: any = undefined): any {
        // Context not found.
        const iSplit = ctxDataKey.indexOf(".");
        const context = this.getContext(iSplit === -1 ? ctxDataKey : ctxDataKey.slice(0, iSplit));
        if (!context)
            return fallback;
        // Get data with fallback.
        return iSplit === -1 ? context.getData() : context.getInData(ctxDataKey.slice(iSplit + 1), fallback);
    }

    // Extend.
    /** Set in contextual data by dotted key: eg. `"someCtxName.someData.someProp"`.
     * - Sets the data in the context, if context found, and triggers refresh (by default).
     * - Note that if the context is found, using this triggers the contextual data listeners (with default or forced timeout).
     * - About setting data.
     *      * Along the way (to the leaf) automatically extends any values whose constructor === Object, and creates the path to the leaf if needed.
     *      * By default extends the value at the leaf, but supports automatically checking if the leaf value is a dictionary (with Object constructor) - if not, just replaces the value.
     *      * Finally, if the extend is set to false, the typing requires to input full data at the leaf, which reflects JS behaviour - won't try to extend.
    */
    public setInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas, 1>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, data: Partial<SubData> & Record<string, any>, extend?: true, refresh?: boolean, forceTimeout?: number | null): void;
    public setInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas, 1>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, data: SubData, extend?: boolean, refresh?: boolean, forceTimeout?: number | null): void;
    public setInData(ctxDataKey: string, data: any, extend?: boolean, refresh?: boolean, forceTimeout?: number | null): void {
        // Get context.
        const iSplit = ctxDataKey.indexOf(".");
        const context = this.getContext(iSplit === -1 ? ctxDataKey : ctxDataKey.slice(0, iSplit));
        if (!context)
            return;
        // Set the whole context data.
        if (iSplit === -1)
            context.setData(data, extend, refresh, forceTimeout);
        // Or data deep in the context.
        else
            context.setInData(ctxDataKey.slice(iSplit + 1), data as never, extend, refresh, forceTimeout);
    }

    /** Manually trigger refresh without setting any data using a dotted key (or an array of them) with context name prepended: eg. `"someCtxName.someData.someProp"`. Only uses forceTimeout for the contexts implie by ctxDataKeys (`true` for all). */
    public refreshData<CtxDataKey extends GetJoinedDataKeysFrom<GetDataFromContexts<Contexts>, 1>>(ctxDataKeys: boolean | CtxDataKey | CtxDataKey[], forceTimeout?: number | null): void;
    public refreshData(ctxDataKeys: boolean | string | string[], forceTimeout?: number | null): void {
        // Nothing to do.
        if (!ctxDataKeys)
            return;
        // Prepare a temp dictionary.
        const contexts: Record<string, Context | null | undefined> = {};
        // Loop each data key.
        for (const ctxDataKey of ctxDataKeys === true ? Object.keys(this.getContexts()) : typeof ctxDataKeys === "string" ? [ctxDataKeys] : ctxDataKeys) {
            // Get context.
            const iSplit = ctxDataKey.indexOf(".");
            const ctxName = iSplit === -1 ? ctxDataKey : ctxDataKey.slice(0, iSplit);
            let ctx = contexts[ctxName];
            if (ctx === undefined)
                ctx = contexts[ctxName] = this.getContext(ctxName) || null;
            // Add refresh keys, if context found.
            ctx && ctx.addRefreshKeys(iSplit === -1 ? true : ctxDataKey.slice(ctxName.length + 1));
        }
        // Refresh each.
        for (const ctxName in contexts)
            contexts[ctxName] && contexts[ctxName]!.refreshData(null, forceTimeout);
    }

    /** Manually trigger refresh by a dictionary with multiple refreshKeys for multiple contexts.
     * - Note that unlike the other data methods in the ContextAPI, this one separates the contextName and the keys: `{ [contextName]: dataKeys }` instead of `${contextName}.${dataKeyOrSignal}`.
     * - The values (= data keys) can be `true` to refresh all in that context, or a dotted string or an array of dotted strings to refresh multiple separate portions simultaneously.
     */
    public refreshDataBy<
        All extends {
            [Name in keyof Contexts]:
                All[Name] extends boolean ? boolean :
                All[Name] extends string ? PropType<Contexts[Name]["data"], All[Name], never> extends never ? never : string:
                All[Name] extends string[] | readonly string[] ? unknown extends PropType<Contexts[Name]["data"], All[Name][number]> ? never : string[] | readonly string[] :
                never
        }
    >(namedRefreshes: Partial<All>, forceTimeout?: number | null): void;
    public refreshDataBy(namedRefreshes: Record<keyof Contexts & string, boolean | string | string[]>, forceTimeout?: number | null): void {
        const contexts = this.getContexts(namedRefreshes);
        for (const name in contexts) {
            const context = contexts[name];
            if (context)
                context.refreshData(namedRefreshes[name] as never, forceTimeout);
        }
    }
    
    // // Extend.
    // public callDataBy(refreshKeys: true | GetJoinedDataKeysFrom<GetDataFromContexts<Contexts>, 1>[] = true, onlyDirect?: boolean): void {
    //     // Use external flow.
    //     if (!onlyDirect && (this.constructor as DataBoyType).callDataListenersFor) {
    //         (this.constructor as DataBoyType).callDataListenersFor!(this as any, refreshKeys as any);
    //         return;
    //     }
    //     // Loop each callback, and call if needs to.
    //     for (const [callback, [fallbackArgs, ...needs]] of this.dataListeners.entries()) { // Note that we use .entries() to take a copy of the situation.
    //         if (refreshKeys === true || refreshKeys.some((dataKey: string) => needs.some(need => need === dataKey || need.startsWith(dataKey + ".") || dataKey.startsWith(need + ".")))) 
    //             callback(...this.getDataArgsBy(needs as any, fallbackArgs));
    //     }
    // }
    // public getDataArgsBy<
    //     DataKey extends GetJoinedDataKeysFrom<GetDataFromContexts<Contexts>, 1>,
    //     Params extends [DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?, DataKey?],
    //     Fallbacks extends Record<string, any> | [any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?, any?]
    // >(needs: Params, fallbackArgs?: Fallbacks): Fallbacks extends any[] ? PropTypeArray<GetDataFromContexts<Contexts>, Params, Fallbacks> : [valueDictionary: PropTypesFromDictionary<GetDataFromContexts<Contexts>, Fallbacks>];
    // public getDataArgsBy(needs: string[], fallbackArgs?: any[] | Record<string, any>): any[] {
    //     // Has fallback.
    //     return fallbackArgs ?
    //         // Array.
    //         Array.isArray(fallbackArgs) ? needs.map((need, i) => this.getInData(need, fallbackArgs[i])) :
    //         // Dictionary.
    //         [needs.reduce((cum, need) => { cum[need] = this.getInData(need, fallbackArgs[need]); return cum; }, {} as Record<string, any>)] :
    //     // No fallback.
    //     needs.map((need, i) => this.getInData(need));
    // }


    // - Mangle contexts - //

    /** Gets the context locally by name.
     * - Returns undefined if not found, otherwise Context or null if specifically set to null.
     * - This method can be extended to get contexts from elsewhere in addition. (It's used internally all around ContextAPI, except in getContexts and setContext.)
     */
    public getContext<Name extends keyof Contexts & string>(name: Name, includeInherited: boolean = true): Contexts[Name] | null | undefined {
        return this.contexts[name] !== undefined ? this.contexts[name] as Contexts[Name] | null : includeInherited && this.inheritedContexts ? this.inheritedContexts[name] as Contexts[Name] | undefined : undefined;
    }

    /** Gets the contexts by names. If name not found, not included in the returned dictionary, otherwise the values are Context | null. */
    public getContexts<Name extends keyof Contexts & string>(onlyNames?: SetLike<Name> | null, includeInherited?: boolean, skipNulls?: true): Partial<ContextsAllTypeWith<Contexts, never, Name>>;
    public getContexts<Name extends keyof Contexts & string>(onlyNames?: SetLike<Name> | null, includeInherited?: boolean, skipNulls?: boolean | never): Partial<ContextsAllTypeWith<Contexts, null, Name>>;
    public getContexts<Name extends keyof Contexts & string>(onlyNames?: SetLike<Name> | null, includeInherited: boolean = true, skipNulls: boolean = false): Partial<Contexts> | Partial<ContextsAllTypeWith<Contexts, null>> {
        // All.
        if (!onlyNames)
            return { ...includeInherited ? this.inheritedContexts : undefined, ...this.contexts } as Contexts;
        // Collect.
        const okNames = onlyNames.constructor === Set ? onlyNames : onlyNames.constructor === Array ? new Set(onlyNames) : new Set(Object.keys(onlyNames));
        const contexts: Partial<ContextsAllTypeWith<{}, null>> = {};
        const srcCtxs = includeInherited && this.inheritedContexts ? { ...this.inheritedContexts, ...this.contexts} : this.contexts;
        for (const name in srcCtxs)
            if (okNames.has(name) && srcCtxs[name] !== undefined && (!skipNulls || srcCtxs[name] !== null))
                contexts[name] = srcCtxs[name];
        // Mixed.
        return contexts;
    }

    /** Create a new context.
     * - If settings given uses it, otherwise default context settings.
     * - If overrideWithName given, then calls setContext automatically with the given name. If empty (default), functions like a simple static function just instantiating a new context with given data.
     * - If overrides by default triggers a refresh call in data listeners in case the context was actually changed. To not do this set refreshIfOverriden to false.
     */
    public newContext<CtxData extends Record<string, any> = {}, CtxSignals extends SignalsRecord = {}>(data: CtxData, settings?: Partial<ContextSettings> | null, overrideWithName?: never | "" | undefined, refreshIfOverriden?: never | false): Context<CtxData, CtxSignals>;
    public newContext<Name extends keyof Contexts & string>(data: Contexts[Name]["data"], settings: Partial<ContextSettings> | null | undefined, overrideWithName: Name, refreshIfOverriden?: boolean): Contexts[Name];
    public newContext(data: any, settings?: Partial<ContextSettings> | null, overrideWithName?: string, refreshIfOverriden: boolean = true): Context {
        const context = new Context(data, settings);
        if (overrideWithName)
            this.setContext(overrideWithName, context as any, refreshIfOverriden);
        return context;
    }

    /** Same as newContext but for multiple contexts all at once.
     * - If settings given uses it for all, otherwise default context settings.
     * - If overrideForSelf set to true, call setContexts afterwards with the respective context names in allData. Defaults to false: functions as if a static method.
     * - If overrides by default triggers a refresh call in data listeners in case the context was actually changed. To not do this set refreshIfOverriden to false.
     */
    public newContexts<Ctxs extends { [Name in keyof AllData & string]: Context<AllData[Name] & {}> }, AllData extends Record<keyof Ctxs & string, Record<string, any>> = { [Name in keyof Ctxs & string]: Ctxs[Name]["data"] }>(allData: AllData, settings?: Partial<ContextSettings> | null, overrideForSelf?: never | false | undefined, refreshIfOverriden?: never | false): Ctxs;
    public newContexts<Name extends keyof Contexts & string>(allData: Partial<Record<Name, Contexts[Name]["data"]>>, settings: Partial<ContextSettings> | null | undefined, overrideForSelf: true, refreshIfOverriden?: boolean): Partial<{ [Name in keyof Contexts & string]: Contexts[Name]; }>;
    public newContexts(allData: Partial<Record<string, Record<string, any>>>, settings?: Partial<ContextSettings> | null, overrideForSelf: boolean = false, refreshIfOverriden: boolean = true): Partial<Record<string, Context<Record<string, any>, SignalsRecord>>> {
        // Create contexts.
        const contexts = createContexts(allData, settings);
        // Override locally.
        if (overrideForSelf)
            this.setContexts(contexts as any, refreshIfOverriden);
        // Return.
        return contexts;
    }

    /** Attach the context to this ContextAPI by name. Returns true if did attach, false if was already there.
     * - Note that if the context is `null`, it will be kept in the bookkeeping. If it's `undefined`, it will be removed.
     *      * This only makes difference when uses one ContextAPI to inherit its contexts from another ContextAPI.
     */
    public setContext<Name extends keyof Contexts & string>(name: Name, context: Contexts[Name] | null | undefined, callDataIfChanged: boolean = true, setAsInherited: boolean = false): boolean { 
        return this.constructor.modifyContexts(this, { [name]: context }, callDataIfChanged, setAsInherited)[0] !== undefined;
    }

    /** Set multiple named contexts in one go. Returns true if did changes, false if didn't. This will only modify the given keys.
     * - Note that if the context is `null`, it will be kept in the bookkeeping. If it's `undefined`, it will be removed.
     *      * This only makes difference when uses one ContextAPI to inherit its contexts from another ContextAPI.
     * @returns Array of context names that were disconnected/connected. If only modified inherited vs context bookkeeping, without actual changes in connections, does not add it to the returned names.
     */
    public setContexts(contextMods: Partial<{[CtxName in keyof Contexts & string]: Contexts[CtxName] | null | undefined; }>, callDataIfChanged: boolean = true, setAsInherited: boolean = false): Array<string & keyof Contexts> {
        return this.constructor.modifyContexts(this, contextMods, callDataIfChanged, setAsInherited) as Array<string & keyof Contexts>;
    }

    /** Manage the inheritedContexts as a whole. Automatically updates the situation from the previous set of contexts.
     * @param newContexts The new named contexts as a whole state. If wanting to only apply mods, set param extend to `true`.
     * @param callDataIfChanged Calls data changes for each change in contextAPI's context assignments.
     * @param extend Defaults to `false`. If set to `true`, then param newContexts functions as if partial modifications - instead of a full state. Essentially controls whether removes all old that are not found in newContexts (false) or not (true).
     * @returns Array of context names that were disconnected/connected. If only modified inherited vs context bookkeeping, without actual changes in connections, does not add it to the returned names.
     */
    public setInheritedContexts(newContexts: Partial<{[CtxName in keyof Contexts]: Contexts[CtxName] | null | undefined; }>, callDataIfChanged: boolean = true, extend: boolean = false): Array<string & keyof Contexts> {
        // Find old to remove.
        const oldContexts = extend ? {} : { ...this.inheritedContexts };
        for (const ctxName in oldContexts)
            oldContexts[ctxName] = undefined;
        // Set as inherited.
        const didChange = this.setContexts({ ...oldContexts, ...newContexts }, false, true);
        // Refresh.
        if (callDataIfChanged && didChange)
            this.callDataBy(Object.keys(newContexts) as any);
        return didChange;
    }

    /** Trigger a refresh in a specific context.
     * @param forceTimeout Refers to the timing of the context's "pre-delay" cycle.
     */
    public refreshContext(name: keyof Contexts & string, forceTimeout?: number | null): void {
        this.getContext(name)?.triggerRefresh(forceTimeout);
    }

    /** Refresh all or named contexts with the given forceTimeout.
     * @param contextNames An array or a dictionary of context names, or null|undefined to refresh all.
     *      - If a dictionary, the keys are context names and values are timeouts specifically for each. If the value is undefined, uses forceTimeout instead.
     * @param forceTimeout Refers to the timing of the context's "pre-delay" cycle.
     */
    public refreshContexts(contextNames?: Array<keyof Contexts & string>[] | Partial<Record<keyof Contexts & string, number | null | undefined>> | null, forceTimeout?: number | null): void {
        // Refresh all / named with the given forceTimeout.
        if (!contextNames || Array.isArray(contextNames)) {
            for (const ctxName of contextNames || Object.keys(this.getContexts()))
                this.refreshContext(ctxName as keyof Contexts & string, forceTimeout);
        }
        // Refresh by specific timeouts.
        else
            for (const ctxName in contextNames)
                this.refreshContext(ctxName, contextNames[ctxName] === undefined ? forceTimeout : contextNames[ctxName]);
    }


    // - Static context helpers - //

    /** Extendable helper to modify contexts for a contextAPI instance. Returns keys for changed context names (if the actual hook up was changed). */
    public static modifyContexts(cAPI: ContextAPI<any>, contextMods: Partial<ContextsAllTypeWith<{}, null>>, callDataIfChanged: boolean, setAsInherited: boolean): string[] {
        // Nothing to do.
        let changed: string[] = [];
        for (const name in contextMods) {
            // Get.
            const context = contextMods[name];
            const oldContext = cAPI.getContext(name);
            const ctxs = setAsInherited ? cAPI.inheritedContexts || (cAPI.inheritedContexts = {}) : cAPI.contexts;
            // Nothing changed in the final hook-ups.
            if (oldContext === context) {
                // Just local bookkeeping.
                if (setAsInherited ? (cAPI.inheritedContexts && cAPI.inheritedContexts[name]) !== context : cAPI.contexts[name] !== context)
                    context !== undefined ? ctxs[name] = context : delete ctxs[name];
                // Nothing more to do.
                break;
            }
            // Remove from old context.
            if (oldContext) {
                const ctxNames = oldContext.contextAPIs.get(cAPI as ContextAPI);
                if (ctxNames) {
                    const newNames = ctxNames.filter(ctxName => ctxName !== name);
                    newNames.length ? oldContext.contextAPIs.set(cAPI as ContextAPI, newNames) : oldContext.contextAPIs.delete(cAPI as ContextAPI);
                }
            }
            // Add to new context.
            if (context) {
                // Add to new context.
                const ctxNames = context.contextAPIs.get(cAPI as ContextAPI) || [];
                if (!ctxNames.includes(name))
                    ctxNames.push(name);
                context.contextAPIs.set(cAPI as ContextAPI, ctxNames);
            }
            // Handle local bookkeeping.
            context !== undefined ? ctxs[name] = context : delete ctxs[name];
            // Add to changed.
            changed.push(name);
        }
        // Refresh.
        if (callDataIfChanged && changed[0] !== undefined)
            cAPI.callDataBy(changed);
        // Return changed names.
        return changed;
    }


    // - Static data/signal key helpers - //

    /** Converts contextual data or signal key to a tuple: `[ctxName: string, dataSignalKey: string]`
     * @param ctxDataSignalKey The string representing `${ctxName}.${dataKeyOrSignalName}`.
     *      - In case refers to a deep data key, looks like this: `${ctxName}.${dataKey1}.${dataKey2}.${dataKey3}`.
     *      - In any case, the outcome is an array with 2 items: `[ctxName: string, dataSignalKey: string]`.
     * @returns A tuple: `[ctxName: string, dataSignalKey: string]`.
     *      - Return examples: `["settings", "toggleTheme"]`, `["data", "settings.user.name"]`, `["data", ""]`, `["", ""]`.
    */
    public static parseContextDataKey(ctxDataSignalKey: string): [ctxName: string, dataSignalKey: string] {
        const iSplit = ctxDataSignalKey.indexOf(".");
        return iSplit === -1 ? [ctxDataSignalKey, ""] : [ctxDataSignalKey.slice(0, iSplit), ctxDataSignalKey.slice(iSplit + 1)];
    }

    /** Read context names from contextual data keys or signals.
     * @param ctxDataSignalKeys An array of strings representing context names and dotted data keys or signal names in it.
     *      - For example: [`${ctxName}.${signalName}`, `${ctxName}.${dataKey1}.${dataKey2}`, `${ctxName}`, ...]
     * @param strictMatch Defaults to false. If set to true, the returned array is directly mappable to the input array (of ctxDataSignalKeys). The empty ones have name "".
     * @returns An array of context names. If strictMatch is set to true, then the outcome array matches the input array.
     */
    public static readContextNamesFrom(ctxDataSignalKeys: string[], strictMatch?: boolean): string[] {
        return ctxDataSignalKeys.reduce((cum, ctxDataKey) => {
            // Read name.
            const iSplit = ctxDataKey.indexOf(".");
            const ctxName = iSplit === -1 ? ctxDataKey : ctxDataKey.slice(0, iSplit);
            // Add unique.
            if (strictMatch || ctxName && !cum.includes(ctxName))
                cum.push(ctxName);
            return cum;
        }, [] as string[]);
    }

    /** Converts array of context data keys or signals `${ctxName}.${dataSignalKey}` to a dictionary `{ [ctxName]: dataSignalKey[] | true }`, where `true` as value means all in context.
     * @param ctxDataSignalKeys An array of ctxDataOrSignalKeys. Each is a string, and unless referring to the context itself has at least one dot (".").
     *      - For example: [`${ctxName}.${signalName}`, `${ctxName}.${dataKey1}.${dataKey2}`, `${ctxName}`, ...]
     * @returns A dictionary like: `{ [ctxName]: dataSignalKey[] | true }`, where `true` as value means all in context.
     */
    public static readContextDictionaryFrom(ctxDataSignalKeys: string[]): Record<string, string[] | true> {
        // Loop keys.
        const byCtxs: Record<string, string[] | true> = {};
        for (const ctxDataKey of ctxDataSignalKeys) {
            // Read.
            const [ctxName, dataKey] = ContextAPI.parseContextDataKey(ctxDataKey);
            // Set key, unless already at full.
            if (byCtxs[ctxName] !== true)
                dataKey ? (byCtxs[ctxName] as string[] | undefined || (byCtxs[ctxName] = [])).push(dataKey) : byCtxs[ctxName] = true;
        }
        return byCtxs;
    }

}
