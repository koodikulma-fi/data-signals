
// - Imports - //

// Classes.
import { SignalDataBoy } from "./SignalDataBoy";
import { Context } from "./Context";
// Typing.
import { PropType, Dictionary, RecordableType, GetJoinedDataKeysFrom, ClassType } from "../library/typing";
import { SignalsRecord, SignalSendAsReturn } from "./SignalMan";


// - Helper types - //

// All contexts.
export type ContextsAllType = Record<string, Context<any, SignalsRecord>>;
export type ContextsAllOrNullType<AllContexts extends ContextsAllType = {}> = { [Name in keyof AllContexts]: AllContexts[Name] | null; };

// Join contextual signal keys.
export type GetJoinedSignalKeysFromContexts<Contexts extends ContextsAllType> = {[CtxName in string & keyof Contexts]: keyof (Contexts[CtxName]["_Signals"] & {}) extends string ? `${CtxName}.${keyof (Contexts[CtxName]["_Signals"] & {}) & string}` : never; }[string & keyof Contexts];

// Read from contexts.
export type GetSignalsFromContexts<Ctxs extends ContextsAllType> = { [CtxSignalName in GetJoinedSignalKeysFromContexts<Ctxs> & string]: CtxSignalName extends `${infer CtxName}.${infer SignalName}` ? (Ctxs[CtxName]["_Signals"] & {})[SignalName] : never; };
export type GetDataFromContexts<Ctxs extends ContextsAllType> = { [Key in string & keyof Ctxs]: Ctxs[Key]["data"]; };


// - Helpers - //
    
/** Builds a record of { [key]: trueFalseLike }, which is useful for internal quick checks. */
export function buildRecordable<T extends string = any>(types: RecordableType<T>): Partial<Record<T, any>> {
    if (types.constructor === Object)
        return types as Partial<Record<T, any>>;
    const tTypes: Partial<Record<T, any>> = {};
    for (const type of types as Iterable<T>)
        tTypes[type] = true;
    return tTypes;
}


// - Class - //

/** Class type of ContextAPI. */
export interface ContextAPIType<Contexts extends ContextsAllType = {}> extends ClassType<ContextAPI<Contexts>> { }
/** ContextAPI looks like it has full SignalMan and DataMan capabilities but only extends SignalBoy internally.
 * - It has all the same methods, but does not have .data member and data listening can have a fallback array.
 * - All data keys and signal names should start with "contextName.", for example: "settings.theme" data key or "navigation.onFocus" signal.
 */
export class ContextAPI<Contexts extends ContextsAllType = {}> extends SignalDataBoy<GetDataFromContexts<Contexts>, GetSignalsFromContexts<Contexts>> {
    

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

    /** This (triggers a refresh and) returns a promise that is resolved when the update cycle is completed.
     * - If there's nothing pending, then will resolve immediately. 
     * - This uses the signals system, so the listener is called among other listeners depending on the adding order.
     * - Note that this method is overrideable. On the basic implementation it resolves immediately.
     *      * However, on an externael layer, the awaiting might be synced to an update cycle - to provide the bridge for syncing the "delay" signals.
     *      * Note also that at ContextAPI level, there is nothing to "refresh" (it doesn't hold data, just reads it from contexts). So will not trigger a refresh, just await.
     */
    public afterRefresh(fullDelay?: boolean, forceTimeout?: number | null): Promise<void>;
    public afterRefresh(_fullDelay: boolean = false, _forceTimeout?: number | null): Promise<void> {
        return new Promise<void>(async (resolve) => resolve());
    }
 

    // - Send signals - //

    // Override to use contexts.
    /** Emit a signal. Does not return a value. Use `sendSignalAs(modes, ctxSignalName, ...args)` to refine the behaviour. */
    public sendSignal<
        CtxSignalName extends string & keyof GetSignalsFromContexts<Contexts>,
        Names extends CtxSignalName extends `${infer CtxName}.${infer SignalName}` ? [CtxName, SignalName] : [never, never],
    >(ctxSignalName: CtxSignalName, ...args: Parameters<(Contexts[Names[0]]["_Signals"] & {})[Names[1]]>): void {
        const [ctxName, signalName] = ctxSignalName.split(".", 2);
        return this.getContext(ctxName)?.sendSignal(signalName, ...args);
    }
    
    // Override to use contexts.
    /** This exposes various features to the signalling process which are inputted as the first arg: either string or string[]. Features are:
     * - "delay": Delays sending the signal. To also collect returned values must include "await".
     *      * Note that this delays the process to sync with the Context's refresh cycle, and waits until all related contextAPIs have refreshed. (In an external layer, often further tied to other update cycles, like rendering.)
     * - "pre-delay": Like "delay", syncs to the Context's refresh cycle, but calls then on that cycle - without waiting external flush (from other contextAPIs connected to the same context network).
     * - "await": Awaits each listener (simultaneously) and returns a promise. By default returns the last non-`undefined` value, combine with "multi" to return an array of awaited values (skipping `undefined`).
     *      * Exceptionally if "delay" is on, and there's no "await" then can only return `undefined`, as there's no promise to capture the timed out returns.
     * - "multi": This is the default mode: returns an array of values ignoring any `undefined`.
     *      * Inputting this mode makes no difference. It's just provided for typing convenience when wants a list of answers without anything else (instead of inputting "").
     * - "last": Use this to return the last acceptable value (by default ignoring any `undefined`) - instead of an array of values.
     * - "first": Stops the listening at the first value that is not `undefined` (and not skipped by "no-false" or "no-null"), and returns that single value.
     *      * Note that "first" does not stop the flow when using "await" as the async calls are made simultaneously. But it returns the first acceptable value.
     * - "first-true": Is like "first" but stops only if value amounts to true like: !!value.
     * - "no-false": Ignores any falsifiable values, only accepts: `(!!value)`. So most commonly ignored are: `false`, `0`, `""`, `null´, `undefined`.
     * - "no-null": Ignores any `null` values in addition to `undefined`. (By default only ignores `undefined`.)
     *      * Note also that when returning values, any signal that was connected with .Deferred flag will always be ignored from the return value flow (and called 0ms later, in addition to "delay" timeout).
     * - Note that ContextAPI's sendSignal and sendSignalAs will use the contexts methods if found. If context not found immediately when called, then does nothing.
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
        const [ctxName, signalName] = ctxSignalName.split(".", 2);
        const ctx = this.getContext(ctxName);
        if (ctx)
            return ctx.sendSignalAs(modes, signalName, ...args) as any;
        // Handle awaiting and empty value returns without context.
        const m: string[] = typeof modes === "string" ? [modes] : modes;
        const r = m.includes("last") || m.includes("first") || m.includes("first-true") ? undefined : [];
        return m.includes("await") ? new Promise(resolve => resolve(r)) as any : r as any;
    }


    // - Handle data - //

    // Extend.
    /** Get from contextual data by dotted key: eg. `"someCtxName.someData.someProp"`.
     * - If the context exists uses the getInData method from the context, otherwise returns undefined or the fallback. (The fallback is also used if the data key not found in context data.)
     */
    public getInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, fallback?: never | undefined): SubData | undefined;
    public getInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas>, SubData extends PropType<CtxDatas, CtxDataKey, never>, FallbackData extends any>(ctxDataKey: CtxDataKey, fallback: FallbackData): SubData | FallbackData;
    public getInData(ctxDataKey: string, fallback: any = undefined): any {
        const ctxName = ctxDataKey.split(".", 1)[0];
        const context = this.getContext(ctxName);
        return context ? context.getInData(ctxDataKey.slice(ctxName.length + 1), fallback) : fallback;
    }

    // Extend.
    /** Set in contextual data by dotted key: eg. `"someCtxName.someData.someProp"`.
     * - Sets the data in the context, if context found, and triggers refresh (by default). If the sub data is an object, can also extend.
     * - Note that if the context is found, using this triggers the contextual data listeners (with default or forced timeout). */
    public setInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, data: Partial<SubData> & Dictionary, extend?: true, refresh?: boolean, forceTimeout?: number | null): void;
    public setInData<CtxDatas extends GetDataFromContexts<Contexts>, CtxDataKey extends GetJoinedDataKeysFrom<CtxDatas>, SubData extends PropType<CtxDatas, CtxDataKey, never>>(ctxDataKey: CtxDataKey, data: SubData, extend?: boolean, refresh?: boolean, forceTimeout?: number | null): void;
    public setInData(ctxDataKey: string, data: any, extend?: boolean, refresh?: boolean, forceTimeout?: number | null): void {
        const ctxName = ctxDataKey.split(".", 1)[0];
        this.getContext(ctxName)?.setInData(ctxDataKey.slice(ctxName.length + 1), data as never, extend, refresh, forceTimeout);
    }

    /** Manually trigger refresh without setting the data using a dotted key (or an array of them) with context name: eg. `"someCtxName.someData.someProp"`. */
    public refreshData<CtxDataKey extends GetJoinedDataKeysFrom<GetDataFromContexts<Contexts>>>(ctxDataKeys: CtxDataKey | CtxDataKey[], forceTimeout?: number | null): void;
    public refreshData(ctxDataKeys: string | string[], forceTimeout?: number | null): void {
        // Prepare a temp dictionary.
        const contexts: Record<string, Context | null | undefined> = {};
        // Loop each data key.
        for (const ctxDataKey of typeof ctxDataKeys === "string" ? [ctxDataKeys] : ctxDataKeys) {
            // Get context.
            const ctxName = ctxDataKey.split(".", 1)[0];
            if (contexts[ctxName] !== undefined)
                contexts[ctxName] = this.getContext(ctxName);
            // Add refresh keys, if context found.
            contexts[ctxName]?.addRefreshKeys(ctxDataKey.slice(ctxName.length + 1));
        }
        // Refresh each.
        for (const ctxName in contexts)
            contexts[ctxName]?.refreshData(null as never, forceTimeout);
    }

    /** Manually trigger refresh by multiple refreshKeys for multiple contexts.
     * - Note that unlike the other data methods in the ContextAPI, this one separates the contextName and the keys: `{ [contextName]: dataKeys }`
     * - The data keys can be `true` to refresh all in the context, or a dotted string or an array of dotted strings to refresh multiple separate portions simultaneously. */
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

    /** Gets the context locally by name. Returns null if not found, otherwise Context. 
     * - This method can be extended to get contexts from elsewhere in addition. (It's used internally all around ContextAPI, except in getContexts and setContext.)
     */
    public getContext<Name extends keyof Contexts & string>(name: Name): Contexts[Name] | null | undefined {
        return this.contexts[name] as Contexts[Name] | null | undefined;
    }

    /** Gets the contexts by names. If name not found, not included in the returned dictionary, otherwise the values are Context | null. */
    public getContexts<Name extends keyof Contexts & string>(onlyNames?: RecordableType<Name> | null): Partial<Record<string, Context | null>> & Partial<ContextsAllOrNullType<Contexts>> {
        // Base.
        if (!onlyNames)
            return { ...this.contexts } as Contexts;
        const okNames = buildRecordable(onlyNames);
        const contexts: Partial<ContextsAllOrNullType> = {};
        for (const name in this.contexts)
            if (okNames[name])
                contexts[name] = this.contexts[name];
        // Mixed.
        return contexts;
    }

    /** Create a new context. If overrideWithName given, then calls setContext automatically with the given name. */
    public newContext<CtxData extends Record<string, any> = {}, CtxSignals extends SignalsRecord = {}>(data: CtxData, overrideWithName?: never | "" | undefined, refreshIfOverriden?: never | false): Context<CtxData, CtxSignals>;
    public newContext<Name extends keyof Contexts & string>(data: Contexts[Name]["data"], overrideWithName: Name, refreshIfOverriden?: boolean): Contexts[Name];
    public newContext(data: any, overrideWithName?: string, refreshIfOverriden: boolean = true): Context {
        const context = new Context(data);
        if (overrideWithName)
            this.setContext(overrideWithName, context as any, refreshIfOverriden);
        return context;
    }

    /** Same as newContext but for multiple contexts all at once.
     * - If overrideForSelf set to true, will call setContexts after to attach the contexts here. */
    public newContexts<Contexts extends { [Name in keyof AllData & string]: Context<AllData[Name] & {}> }, AllData extends Record<keyof Contexts & string, Record<string, any>> = { [Name in keyof Contexts & string]: Contexts[Name]["data"] }>(allData: AllData, overrideForSelf?: never | false | undefined, refreshIfOverriden?: never | false): Contexts;
    public newContexts<Name extends keyof Contexts & string>(allData: Partial<Record<Name, Contexts[Name]["data"]>>, overrideForSelf: true, refreshIfOverriden?: boolean): Partial<Record<Name, Contexts[Name]["data"]>>;
    public newContexts(allData: any, overrideForSelf: boolean = false, refreshIfOverriden: boolean = true): Record<string, Context> {
        const contexts: Record<string, Context> = {};
        for (const name in allData)
            contexts[name] = new Context(allData[name]);
        if (overrideForSelf)
            this.setContexts(contexts as any, refreshIfOverriden);
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
            this.callDataListenersFor ? this.callDataListenersFor([name]) : this.callDataBy([name] as never);
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
            this.callDataListenersFor ? this.callDataListenersFor(Object.keys(contexts)) : this.callDataBy(Object.keys(contexts) as never);
        return didChange;
    }

    
    // - Context data build helpers - //

    // Extend.
    /** Helper to build data arguments from this ContextAPI's contextual connections with the given data needs args.
     * - For example: `getDataArgsBy(["settings.user.name", "themes.darkMode"])`.
     * - Used internally but can be used for manual purposes. Does not support typing like listenToData - just string[].
     */
    public getDataArgsBy(needs: string[], fallbackArgs?: any[]): any[] {
        return needs.map((need, i) => {
            const ctxName = need.split(".", 1)[0];
            const ctx = this.getContext(ctxName); // Use the getter - for better extendability of the ContextAPI class.
            const dataKey = need.slice(ctxName.length + 1);
            return ctx ? dataKey ? ctx.getInData(dataKey, fallbackArgs && fallbackArgs[i]) : ctx.getData() : fallbackArgs && fallbackArgs[i];
        });
    }


    // - Optional assignable getter - //

    /** Assignable getter to call more data listeners when specific context names are refreshed. */
    public callDataListenersFor?(ctxNames: string[], dataKeys?: true | string[]): void;

}
