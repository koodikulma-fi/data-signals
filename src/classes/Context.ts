

// - Imports - //

// Library.
import { ClassType, GetJoinedDataKeysFrom, NodeJSTimeout } from "../types";
// Classes.
import { SignalListener, SignalsRecord } from "./SignalMan";
import { DataSignalMan } from "./DataSignalMan";
// Only typing.
import { ContextAPI } from "./ContextAPI";


// - Types - //

export type ContextSettings = {
    /** Timeout for refreshing for this particular context.
     * - The timeout is used for both: data refresh and (normal) actions.
     * - If null, then synchronous - defaults to 0ms.
     * - Note that if you use null, the updates will run synchronously.
     *   .. It's not recommended to use it, because you'd have to make sure you always use it in that sense.
     *   .. For example, the component you called from might have already unmounted on the next line (especially if host is fully synchronous, too). */
    refreshTimeout: number | null;
};


// - Helpers - // 

/** Generic helper for classes with timer and method to call to execute rendering with a very specific logic.
 * - Returns the value that should be assigned as the stored timer (either existing one, new one or null). */
export function callWithTimeout<Obj extends object, Timer extends number | NodeJSTimeout>(obj: Obj, callback: (this: Obj) => void, currentTimer: Timer | null, defaultTimeout: number | null, forceTimeout?: number | null): Timer | null {
    // Clear old timer if was given a specific forceTimeout (and had a timer).
    if (currentTimer !== null && forceTimeout !== undefined) {
        clearTimeout(currentTimer as any); // To support both sides: NodeJS and browser.
        currentTimer = null;
    }
    // Execute immediately.
    const timeout = forceTimeout === undefined ? defaultTimeout : forceTimeout;
    if (timeout === null)
        callback.call(obj);
    // Or setup a timer - unless already has a timer to be reused.
    else if (currentTimer === null)
        currentTimer = setTimeout(() => callback.call(obj), timeout) as any;
    // Return the timer.
    return currentTimer;
}


// - Class - //

/** Context provides signal and data listener features (extending `SignalMan` and `DataMan` basis).
 * - It provides direct listening but is also designed to work with ContextAPI instances.
 */
export class Context<Data = any, Signals extends SignalsRecord = any> extends DataSignalMan<Data, Signals> {


    // - Static - //

    ["constructor"]: ContextType<Data, Signals>;
    
    
    // - Members - //

    // Settings.
    public settings: ContextSettings;

    /** The keys are the ContextAPIs this context is attached to with a name, and the values are the names (typically only one). They are used for refresh related purposes. */
    public contextAPIs: Map<ContextAPI, string[]>;

    /** Temporary internal timer marker. */
    refreshTimer: number | NodeJSTimeout | null;
    /** Temporary internal callbacks that will be called when the update cycle is done. */
    private _afterUpdate?: Array<() => void>;
    /** Temporary internal callbacks that will be called after the update cycle and the related host "render" refresh have been flushed. */
    private _afterRender?: Array<() => void>;


    // - Construct - //

    constructor(data: any, settings?: Partial<ContextSettings> | null | undefined) {
        // Base.
        super(data);
        // Public settings.
        this.contextAPIs =  new Map();
        this.settings = Context.getDefaultSettings();
        this.refreshTimer = null;
        // Just for typing - to avoid warning about not having set _Signals.
        this._Signals = undefined as unknown as Signals;
        delete (this as any)._Signals;
        // Update settings.
        if (settings)
            this.modifySettings(settings);
    }


    // - SignalMan sending extensions - //
    
    /** Overridden to support getting signal listeners from related contextAPIs - in addition to direct listeners (which are put first). */
    getListenersFor(signalName: string): SignalListener[] | undefined {
        // Collect all.
        let allListeners: SignalListener[] = this.signals[signalName] || [];
        for (const [contextAPI, ctxNames] of this.contextAPIs) {
            for (const ctxName of ctxNames) {
                const listeners = contextAPI.getListenersFor ? contextAPI.getListenersFor(ctxName as never, signalName) : contextAPI.signals[ctxName + "." + signalName];
                if (listeners)
                    allListeners = allListeners.concat(listeners);
            }
        }
        return allListeners[0] && allListeners;

        // If has many listeners, remove any duplicates here.
        // .. We do this because components might have overridden with the same name as they have a host connection.
        // .. In that case, would have direct (from component.contextAPI) and indirect listener here (from host.contextAPI).
        // return allListeners[0] ? allListeners[1] ? [...new Set(allListeners)] : allListeners : null;
    }


    // - DataSignalMan-like methods. - //

    // Overridden.
    /** This returns a promise that is resolved when the context is refreshed, or after all the hosts have refreshed. */
    public afterRefresh(fullDelay: boolean = false, forceTimeout?: number | null): Promise<void> {
        // Add to delayed.
        return new Promise<void>(async (resolve) => {
            // Prepare.
            const delayType = fullDelay ? "_afterRender" : "_afterUpdate";
            if (!this[delayType])
                this[delayType] = [];
            // Add timer.
            (this[delayType] as any[]).push(() => resolve()); // We don't use any params - we have no signal name, we just wait until a general refresh has happened.
            // Trigger refresh.
            this.triggerRefresh(forceTimeout);
        });
    }
    
    // Overridden to handle data refreshes.
    /** Trigger refresh of the context and optionally add data keys.
     * - This triggers calling pending data keys and delayed signals (when the refresh cycle is executed). */
    public refreshData<DataKey extends GetJoinedDataKeysFrom<Data & {}>>(dataKeys: DataKey | DataKey[] | boolean | null, forceTimeout?: number | null): void;
    public refreshData(dataKeys: string | string[] | boolean | null, forceTimeout?: number | null): void {
        // Add keys.
        if (dataKeys)
            this.addRefreshKeys(dataKeys);
        // Trigger contextual refresh.
        this.triggerRefresh(forceTimeout);
    }

    public triggerRefresh(forceTimeout?: number | null): void {
        this.refreshTimer = callWithTimeout(this, this.refreshPending, this.refreshTimer, this.settings.refreshTimeout, forceTimeout) as any;
    }

    
    // - Private helpers - //

    /** This refreshes the context immediately.
     * - This is assumed to be called only by the .refresh function above.
     * - So it will mark the timer as cleared, without using clearTimeout for it. */
    private refreshPending(): void {
        // Get.
        const refreshKeys = this.dataKeysPending;
        let afterUpdate = this._afterUpdate;
        let afterRender = this._afterRender;
        // Clear.
        this.refreshTimer = null;
        this.dataKeysPending = null;
        delete this._afterUpdate;
        delete this._afterRender;
        // Call signals on delayed listeners.
        if (afterUpdate) {
            for (const callback of afterUpdate)
                callback();
        }
        // Call data listeners.
        if (refreshKeys) {
            // Call direct.
            for (const [callback, needs] of this.dataListeners.entries()) { // Note that we use .entries() to take a copy of the situation.
                if (refreshKeys === true || refreshKeys.some(dataKey => needs.some(need => need === dataKey || need.startsWith(dataKey + ".") || dataKey.startsWith(need + ".")))) 
                    callback(...needs.map(need => this.getInData(need as never)));
            }
            // Call on related contextAPIs.
            // .. Only call the ones not colliding with our direct, or call all.
            for (const [contextAPI, ctxNames] of this.contextAPIs.entries())
                contextAPI.callDataListenersFor ?
                    contextAPI.callDataListenersFor(ctxNames, refreshKeys) :
                    contextAPI.callDataBy(refreshKeys === true ? ctxNames : ctxNames.map(ctxName => refreshKeys.map(key => ctxName + "." + key)).reduce((a, c) => a.concat(c)) as any);
        }
        // Trigger updates for contextAPIs and wait after they've rendered.
        if (afterRender) {
            (async () => {
                // Add a await refresh listener on all connected contextAPIs.
                // .. Note that we don't specify (anymore as of v3.1) which contextAPIs actually were refreshed in relation to the actions and pending data.
                // .. We simply await before all the contextAPIs attached to us have refreshed. It's much simpler, and hard to argue that it would be worse in terms of usefulness.
                const toWait: Promise<void>[] = [];
                for (const contextAPI of this.contextAPIs.keys())
                    toWait.push(contextAPI.afterRefresh(true));
                // Wait.
                await Promise.all(toWait);
                // Resolve all afterRender awaiters.
                for (const callback of afterRender)
                    callback();
            })();
        }
    }
    

    // - Settings - //

    // Common basis. There's currently (anymore) 1 setting.
    /** Update settings with a dictionary. If any value is `undefined` then uses the default setting. */
    public modifySettings(settings: Partial<ContextSettings>): void {
        const defaults = Context.getDefaultSettings();
        for (const name in settings)
            settings[name] = settings[name] === undefined ? defaults[name] : settings[name];
    }

    
    // - Static - //
    
    public static getDefaultSettings(): ContextSettings {
        return { refreshTimeout: 0 };
    }


    // - Typing - //

    /** This is only provided for typing related technical reasons. There's no actual _Signals member on the javascript side.
     * - Note. Due to complex typing (related to ContextAPI having multiple contexts), we need to have it without undefined (_Signals? is not okay).
     */
    _Signals: Signals;

}

export type ContextType<Data = any, Signals extends SignalsRecord = SignalsRecord> = ClassType<Context<Data, Signals>, [Data?, Partial<ContextSettings>?]> & { }


// - Creation helpers - //

/** Create a new context. */
export const newContext = <Data = any, Signals extends SignalsRecord = SignalsRecord>(data?: Data, settings?: Partial<ContextSettings>): Context<Data, Signals> =>
    new Context<Data, Signals>(data, settings);

/** Create multiple named contexts by giving data. */
export const newContexts = <
    Contexts extends { [Name in keyof AllData & string]: Context<AllData[Name]> },
    AllData extends { [Name in keyof Contexts & string]: Contexts[Name]["data"] } = { [Name in keyof Contexts & string]: Contexts[Name]["data"] }
>(contextsData: AllData, settings?: Partial<ContextSettings>): Contexts => {
    const contexts: Record<string, Context> = {};
    for (const name in contextsData)
        contexts[name] = newContext(contextsData[name], settings);
    return contexts as Contexts;
};
