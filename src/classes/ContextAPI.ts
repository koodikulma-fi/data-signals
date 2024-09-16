
// - Imports - //

// Library.
import { PropType, RecordableType, GetJoinedDataKeysFrom, ClassType } from "../library/typing";
import { buildRecordable } from "../library/library";
// Classes.
import { SignalDataBoy } from "./SignalDataBoy";
import { Context } from "./Context";
// Typing.
import { SignalsRecord, SignalSendAsReturn, SignalManType } from "./SignalMan";
import { DataBoyType } from "./DataBoy";


// - Helper types - //

// All contexts.
/** Typing to hold named contexts as a dictionary. */
export type ContextsAllType = Record<string, Context<any, SignalsRecord>>;
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


// - Class - //

/** Class type of ContextAPI. */
export interface ContextAPIType<Contexts extends ContextsAllType = {}> extends ClassType<ContextAPI<Contexts>>, DataBoyType<Partial<GetDataFromContexts<Contexts>>>, SignalManType<GetSignalsFromContexts<Contexts>> { }
/** ContextAPI extends SignalMan and DataBoy mixins to provide features for handling multiple named Contexts.
 * - According to its mixin basis, ContextAPI allows to:
 *      * SignalMan: Send and listen to signals in the named contexts.
 *      * DataBoy: Listen to data changes, but also to set/get data in the contexts.
 * - All data keys and signal names should start with `${contextName}.${keyOrName}`.
 *      * For example: "settings.something.deep" data key (for "settings" context) or "navigation.onFocus" signal (for "navigation" context).
 * - Importantly, the ContextAPI's `awaitRefresh` method can be overridden externally to affect the syncing of all the connected contexts.
 *      * More specifically, the "delay" cycle of the Contexts is resolved only once all the ContextAPIs connected to the context have resolved their `awaitRefresh`.
 */
export class ContextAPI<Contexts extends ContextsAllType = {}> extends SignalDataBoy<Partial<GetDataFromContexts<Contexts>>, GetSignalsFromContexts<Contexts>> {
    

    // - Members - //

    // Typing.
    ["constructor"]: ContextAPIType<Contexts>;

    /** All the contexts assigned to us.
     * - They also have a link back to us by context.contextAPIs, with this as the key and context names as the values. 
     * - Note that can also set `null` value here - for purposefully excluding an inherited context (when using one contextAPI to inherit contexts from another).
     *      * But `undefined` will never be found in here - if gives to the setContext, it means deleting the entry from the record.
     */
    public contexts: Partial<Record<string, Context<any, SignalsRecord> | null>>;


    // - Initialize - //

    constructor(contexts?: Partial<Contexts>) {
        super();
        this.contexts = { ...contexts };
        this.dataListeners = new Map();
    }


    // - Overrideable - //

    /** This (triggers a refresh and) returns a promise that is resolved when the "pre-delay" or "delay" cycle is completed.
     * - At the level of ContextAPI there's nothing to refresh (no data held, just read from contexts).
     *      * Actually the point is the opposite: to optionally delay the "delay" cycle of the connected contexts by overriding the `awaitRefresh` method.
     * - Note that this method is overrideable. On the basic implementation it resolves immediately.
     *      * But on an external layer, the awaiting might be synced to provide the bridging for syncing the "delay" signals of many contexts together.
     */
    public afterRefresh(fullDelay?: boolean, forceTimeout?: number | null): Promise<void>;
    public afterRefresh(_fullDelay: boolean = false, _forceTimeout?: number | null): Promise<void> {
        // Let's do an instant "pre-delay" - so, nothing.
        // And then, let's resolve by the awaitRefresh.
        return this.awaitRefresh();
    }
    /** At the level of ContextAPI the `awaitRefresh` resolves instantly.
     * - Importantly, this method determines when the "delay" cycle of the connected Contexts is resolved. (That's why defaults to instant.)
     * - Accordingly, you can override this method (externally or by extending class) to customize the syncing.
     * - Note that this method should not be _called_ externally - only overridden externally (to affect the "delay" cycle timing).
     */
    awaitRefresh(): Promise<void> {
        return new Promise<void>(async (resolve) => resolve());
    }
 

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
        return m.includes("await") ? new Promise(resolve => resolve(r)) as any : r as any;
    }


    // - Handle data - //

    // Extend.
    /** Get from contextual data by dotted key: eg. `"someCtxName.someData.someProp"`.
     * - If the context exists uses the getInData method from the context (or getData if no sub prop), otherwise returns undefined or the fallback.
     * - If context found, the fallback is passed to it and also used in case the data is not found at the data key location.
     */
    public getInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, fallback?: never | undefined): SubData | undefined;
    public getInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas>, SubData extends PropType<CtxDatas, CtxDataKey, never>, FallbackData extends any>(ctxDataKey: CtxDataKey, fallback: FallbackData): SubData | FallbackData;
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
    public setInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, data: Partial<SubData> & Record<string, any>, extend?: true, refresh?: boolean, forceTimeout?: number | null): void;
    public setInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, data: SubData, extend?: boolean, refresh?: boolean, forceTimeout?: number | null): void;
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

    /** Manually trigger refresh without setting any data using a dotted key (or an array of them) with context name prepended: eg. `"someCtxName.someData.someProp"`. */
    public refreshData<CtxDataKey extends GetJoinedDataKeysFrom<GetDataFromContexts<Contexts>>>(ctxDataKeys: CtxDataKey | CtxDataKey[], forceTimeout?: number | null): void;
    public refreshData(ctxDataKeys: string | string[], forceTimeout?: number | null): void {
        // Prepare a temp dictionary.
        const contexts: Record<string, Context | null | undefined> = {};
        // Loop each data key.
        for (const ctxDataKey of typeof ctxDataKeys === "string" ? [ctxDataKeys] : ctxDataKeys) {
            // Get context.
            const iSplit = ctxDataKey.indexOf(".");
            const ctxName = iSplit === -1 ? ctxDataKey : ctxDataKey.slice(0, iSplit);
            if (contexts[ctxName] !== undefined)
                contexts[ctxName] = this.getContext(ctxName);
            // Add refresh keys, if context found.
            contexts[ctxName]?.addRefreshKeys(iSplit === -1 ? true : ctxDataKey.slice(ctxName.length + 1));
        }
        // Refresh each.
        for (const ctxName in contexts)
            contexts[ctxName]?.refreshData(null as never, forceTimeout);
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
    public refreshDataBy(namedNeeds: Record<keyof Contexts & string, boolean | string | string[]>, forceTimeout?: number | null): void {
        const contexts = this.getContexts(namedNeeds);
        for (const name in contexts) {
            const context = contexts[name];
            if (context)
                context.refreshData(namedNeeds[name] as never, forceTimeout);
        }
    }


    // - Mangle contexts - //

    /** Gets the context locally by name.
     * - Returns undefined if not found, otherwise Context or null if specifically set to null.
     * - This method can be extended to get contexts from elsewhere in addition. (It's used internally all around ContextAPI, except in getContexts and setContext.)
     */
    public getContext<Name extends keyof Contexts & string>(name: Name): Contexts[Name] | null | undefined {
        return this.contexts[name] as Contexts[Name] | null | undefined;
    }

    /** Gets the contexts by names. If name not found, not included in the returned dictionary, otherwise the values are Context | null. */
    public getContexts<Name extends keyof Contexts & string>(onlyNames?: RecordableType<Name> | null, skipNulls?: true): Partial<ContextsAllTypeWith<Contexts, never, Name>>;
    public getContexts<Name extends keyof Contexts & string>(onlyNames?: RecordableType<Name> | null, skipNulls?: boolean | never): Partial<ContextsAllTypeWith<Contexts, null, Name>>;
    public getContexts<Name extends keyof Contexts & string>(onlyNames?: RecordableType<Name> | null, skipNulls: boolean = false): Partial<Contexts> | Partial<ContextsAllTypeWith<Contexts, null>> {
        // Base.
        if (!onlyNames)
            return { ...this.contexts } as Contexts;
        const okNames = buildRecordable(onlyNames);
        const contexts: Partial<ContextsAllTypeWith<{}, null>> = {};
        for (const name in this.contexts)
            if (okNames[name] && this.contexts[name] !== undefined && (!skipNulls || this.contexts[name] !== null))
                contexts[name] = this.contexts[name];
        // Mixed.
        return contexts;
    }

    /** Create a new context.
     * - If overrideWithName given, then calls setContext automatically with the given name. If empty (default), functions like a simple static function just instantiating a new context with given data.
     * - If overrides by default triggers a refresh call in data listeners in case the context was actually changed. To not do this set refreshIfOverriden to false.
     */
    public newContext<CtxData extends Record<string, any> = {}, CtxSignals extends SignalsRecord = {}>(data: CtxData, overrideWithName?: never | "" | undefined, refreshIfOverriden?: never | false): Context<CtxData, CtxSignals>;
    public newContext<Name extends keyof Contexts & string>(data: Contexts[Name]["data"], overrideWithName: Name, refreshIfOverriden?: boolean): Contexts[Name];
    public newContext(data: any, overrideWithName?: string, refreshIfOverriden: boolean = true): Context {
        const context = new Context(data);
        if (overrideWithName)
            this.setContext(overrideWithName, context as any, refreshIfOverriden);
        return context;
    }

    /** Same as newContext but for multiple contexts all at once.
     * - If overrideForSelf set to true, call setContexts afterwards with the respective context names in allData. Defaults to false: functions as if a static method.
     * - If overrides by default triggers a refresh call in data listeners in case the context was actually changed. To not do this set refreshIfOverriden to false.
     */
    public newContexts<Ctxs extends { [Name in keyof AllData & string]: Context<AllData[Name] & {}> }, AllData extends Record<keyof Ctxs & string, Record<string, any>> = { [Name in keyof Ctxs & string]: Ctxs[Name]["data"] }>(allData: AllData, overrideForSelf?: never | false | undefined, refreshIfOverriden?: never | false): Ctxs;
    public newContexts<Name extends keyof Contexts & string>(allData: Partial<Record<Name, Contexts[Name]["data"]>>, overrideForSelf: true, refreshIfOverriden?: boolean): Partial<{ [Name in keyof Contexts & string]: Contexts[Name]["data"]; }>;
    public newContexts(allData: Partial<Record<string, Record<string, any>>>, overrideForSelf: boolean = false, refreshIfOverriden: boolean = true): Partial<Record<string, Context>> {
        // Create contexts.
        const contexts: Record<string, Context> = {};
        for (const name in allData)
            contexts[name] = new Context(allData[name]);
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
    public setContext<Name extends keyof Contexts & string>(name: Name, context: Contexts[Name] | null | undefined, callDataIfChanged: boolean = true): boolean { 
        // Nothing to do.
        const oldContext = this.contexts[name];
        if (oldContext === context)
            return false;
        // Remove from old context.
        if (oldContext) {
            const ctxNames = oldContext.contextAPIs.get(this as ContextAPI);
            if (ctxNames) {
                const newNames = ctxNames.filter(ctxName => ctxName !== name);
                newNames.length ? oldContext.contextAPIs.set(this as ContextAPI, newNames) : oldContext.contextAPIs.delete(this as ContextAPI);
            }
        }
        // Add to new context.
        if (context) {
            // Add to new context.
            const ctxNames = context.contextAPIs.get(this as ContextAPI) || [];
            if (!ctxNames.includes(name))
                ctxNames.push(name);
            context.contextAPIs.set(this as ContextAPI, ctxNames);
        }
        // Handle local bookkeeping.
        if (context !== undefined)
            this.contexts[name] = context;
        else
            delete this.contexts[name];
        // Refresh.
        if (callDataIfChanged)
            this.callDataListenersFor ? this.callDataListenersFor([name] as any) : this.callDataBy([name] as any);
        return true;
    }

    /** Set multiple named contexts in one go. Returns true if did changes, false if didn't. This will only modify the given keys.
     * - Note that if the context is `null`, it will be kept in the bookkeeping. If it's `undefined`, it will be removed.
     *      * This only makes difference when uses one ContextAPI to inherit its contexts from another ContextAPI.
     */
    public setContexts(contexts: Partial<{[CtxName in keyof Contexts]: Contexts[CtxName] | null | undefined; }>, callDataIfChanged: boolean = true): boolean {
        // Override each - don't refresh.
        let didChange = false;
        for (const name in contexts)
            didChange = this.setContext(name, contexts[name] as any, false) || didChange;
        // Refresh.
        if (callDataIfChanged && didChange)
            this.callDataListenersFor ? this.callDataListenersFor(Object.keys(contexts) as any) : this.callDataBy(Object.keys(contexts) as any);
        return didChange;
    }


    // - Optional assignable getter - //

    /** Assignable getter to call more data listeners when specific contexts are refreshed.
     * - Used internally after setting contexts. If not used, calls `this.callDataBy(ctxNames)` instead.
     * - If ctxDataKeys is true (or undefined), then should refresh all data in all contexts. (Not used internally, but to mirror callDataBy.)
     */
    public callDataListenersFor?(ctxDataKeys?: true | GetJoinedDataKeysFrom<GetDataFromContexts<Contexts>>[]): void;


    // - Static data/signal key helpers - //

    /** Converts contextual data or signal key to `[ctxName: string, dataSignalKey: string]` */
    public static parseContextDataKey(ctxDataSignalKey: string): [ctxName: string, dataSignalKey: string] {
        const iSplit = ctxDataSignalKey.indexOf(".");
        return iSplit === -1 ? [ctxDataSignalKey, ""] : [ctxDataSignalKey.slice(0, iSplit), ctxDataSignalKey.slice(iSplit + 1)];
    }

    /** Read context names from contextual data keys or signals. */
    public static readContextNamesFrom(ctxDataSignalKeys: string[]): string[] {
        return ctxDataSignalKeys.reduce((cum, ctxDataKey) => {
            // Read name.
            const iSplit = ctxDataKey.indexOf(".");
            const ctxName = iSplit === -1 ? ctxDataKey : ctxDataKey.slice(0, iSplit);
            // Add unique.
            if (!cum.includes(ctxName) && ctxName)
                cum.push(ctxName);
            return cum;
        }, [] as string[]);
    }

    /** Converts array of context data keys or signals `${ctxName}.${dataSignalKey}` to a dictionary `{ [ctxName]: dataSignalKey[] | true }`, where `true` as value means all in context. */
    public static readContextDictionaryFrom(ctxDataKeys: string[]): Record<string, string[] | true> {
        // Loop keys.
        const byCtxs: Record<string, string[] | true> = {};
        for (const ctxDataKey of ctxDataKeys) {
            // Read.
            const [ctxName, dataKey] = ContextAPI.parseContextDataKey(ctxDataKey);
            // Set key, unless already at full.
            if (byCtxs[ctxName] !== true)
                dataKey ? (byCtxs[ctxName] as string[] | undefined || (byCtxs[ctxName] = [])).push(dataKey) : byCtxs[ctxName] = true;
        }
        return byCtxs;
    }

}
