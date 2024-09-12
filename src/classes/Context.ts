

// - Imports - //

// Library.
import { ClassType, GetJoinedDataKeysFrom, NodeJSTimeout } from "../library/typing";
import { callWithTimeout } from "../library/library";
// Classes.
import { SignalListener, SignalsRecord } from "./SignalMan";
import { DataSignalMan } from "./DataSignalMan";
// Only typing.
import { ContextAPI } from "./ContextAPI";


// - Types - //

export type ContextSettings = {
    /** Timeout for refreshing for this particular context.
     * - The timeout is used for data refreshing, but also tied to actions called with syncing (like "delay" or "pre-delay").
     *      * Note that "pre-delay" refers to resolving this refreshTimeout, while "delay" is resolved after it once all the related contextAPIs have refreshed.
     * - If null, then synchronous - defaults to 0ms.
     * - Note that if you use null, the updates will run synchronously.
     *      * It's not recommended for normal usage, because you'd have to make sure you always use it in that sense.
     *      * For example, on the next code line (after say, setting data in context) the context have already updated and triggered refreshes all around the app. Maybe instance you called from has alredy unmounted.
     */
    refreshTimeout: number | null;
};


// - Class - //

/** Context provides signal and data listener features (extending `SignalMan` and `DataMan` basis).
 * - Contexts provide data listening and signalling features.
 * - Contexts are useful in complex applications and often shared non-locally (or down the tree) in app structure to provide common data and intercommunication channels.
 *      * For example, you might have several different contexts in your app, and then interconnect them together (if needed).
 * - Contexts are designed to function stand alone, but also to work with ContextAPI instances to sync a bigger whole together.
 *      * The contextAPIs can be connected to multiple named contexts, and listen to data and signals in all of them.
 *      * In this usage, the "pre-delay" signals are tied to the Context's own refresh, while "delay" happens after all the related contextAPIs have also refreshed (= after their afterRefresh promise has resolved).
 */
export class Context<Data extends Record<string, any> = {}, Signals extends SignalsRecord = any> extends DataSignalMan<Data, Signals> {


    // - Members - //

    // Typing.
    /** This is only provided for typing related technical reasons (so that can access signals typing easier externally). There's no actual _Signals member on the javascript side. */
    _Signals?: Signals;
    ["constructor"]: ContextType<Data, Signals>;
    
    // Settings.
    public settings: ContextSettings;

    // Connected.
    /** The keys are the ContextAPIs this context is attached to with a name, and the values are the names (typically only one). They are used for refresh related purposes. */
    public contextAPIs: Map<ContextAPI, string[]>;

    // Internal.
    /** Temporary internal timer marker for refreshing. */
    private _refreshTimer: number | NodeJSTimeout | null;
    /** Temporary internal callbacks that will be called when the update cycle is done - at the moment of "pre-delay" cycle (after refreshTimeout). */
    private _afterPre?: Array<() => void>;
    /** Temporary internal callbacks that will be called after the update cycle and the related external refreshes (by contextAPIs) have been flushed - at the moment of "delay" cycle. */
    private _afterPost?: Array<() => void>;


    // - Construct - //

    constructor(data: Data, settings?: Partial<ContextSettings> | null | undefined) {
        // Base.
        super(data);
        // Public settings.
        this.contextAPIs =  new Map();
        this.settings = this.constructor.getDefaultSettings();
        this._refreshTimer = null;
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
    }


    // - DataSignalMan-like methods. - //

    // Overridden.
    /** This returns a promise that is resolved when the context is refreshed, or after all the related contextAPIs have refreshed (based on their afterRefresh promise). */
    public afterRefresh(fullDelay: boolean = false, forceTimeout?: number | null): Promise<void> {
        // Add to delayed.
        return new Promise<void>(async (resolve) => {
            // Prepare.
            const delayType = fullDelay ? "_afterPost" : "_afterPre";
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
     * - This triggers calling pending data keys and delayed signals (when the refresh cycle is executed).
     */
    public refreshData<DataKey extends GetJoinedDataKeysFrom<Data & {}>>(dataKeys: DataKey | DataKey[] | boolean | null, forceTimeout?: number | null): void;
    public refreshData(dataKeys: string | string[] | boolean | null, forceTimeout?: number | null): void {
        // Add keys.
        if (dataKeys)
            this.addRefreshKeys(dataKeys);
        // Trigger contextual refresh.
        this.triggerRefresh(forceTimeout);
    }

    /** Trigger a refresh in the context. Refreshes all pending after a timeout. */
    public triggerRefresh(forceTimeout?: number | null): void {
        this._refreshTimer = callWithTimeout(() => this.refreshPending(), this._refreshTimer, this.settings.refreshTimeout, forceTimeout) as any;
    }

    /** Check whether is waiting to be refreshed. */
    public isWaitingForRefresh(): boolean {
        return this._refreshTimer !== null;
    }

    
    // - Private helpers - //

    /** This refreshes the context immediately.
     * - This is assumed to be called only by the .refresh function above.
     * - So it will mark the timer as cleared, without using clearTimeout for it.
     */
    private refreshPending(): void {
        // Get.
        const refreshKeys = this.dataKeysPending;
        let afterPre = this._afterPre;
        let afterPost = this._afterPost;
        // Clear.
        this._refreshTimer = null;
        this.dataKeysPending = null;
        delete this._afterPre;
        delete this._afterPost;
        // Call signals on delayed listeners.
        if (afterPre) {
            for (const callback of afterPre)
                callback();
        }
        // Call data listeners.
        if (refreshKeys) {
            // Call direct.
            for (const [callback, [fallbackArgs, ...needs]] of this.dataListeners.entries()) { // Note that we use .entries() to take a copy of the situation.
                if (refreshKeys === true || refreshKeys.some(dataKey => needs.some(need => need === dataKey || need.startsWith(dataKey + ".") || dataKey.startsWith(need + ".")))) 
                    callback(...this.getDataArgsBy(needs as any, fallbackArgs));
            }
            // Call on related contextAPIs.
            // .. Only call the ones not colliding with our direct, or call all.
            for (const [contextAPI, ctxNames] of this.contextAPIs.entries())
                contextAPI.callDataListenersFor ?
                    contextAPI.callDataListenersFor(ctxNames, refreshKeys) :
                    contextAPI.callDataBy(refreshKeys === true ? ctxNames : ctxNames.map(ctxName => refreshKeys.map(key => ctxName + "." + key)).reduce((a, c) => a.concat(c)) as any);
        }
        // Trigger updates for contextAPIs and wait after they've flushed.
        if (afterPost) {
            (async () => {
                // Add a await refresh listener on all connected contextAPIs.
                // .. Note that we don't specify (anymore as of v3.1) which contextAPIs actually were refreshed in relation to the actions and pending data.
                // .. We simply await before all the contextAPIs attached to us have refreshed. It's much simpler, and hard to argue that it would be worse in terms of usefulness.
                const toWait: Promise<void>[] = [];
                for (const contextAPI of this.contextAPIs.keys())
                    toWait.push(contextAPI.afterRefresh(true));
                // Wait.
                await Promise.all(toWait);
                // Resolve all afterPost awaiters.
                for (const callback of afterPost)
                    callback();
            })();
        }
    }
    

    // - Settings - //

    // Common basis.
    /** Update settings with a dictionary. If any value is `undefined` then uses the default setting. */
    public modifySettings(settings: Partial<ContextSettings>): void {
        const defaults = (this.constructor as typeof Context).getDefaultSettings();
        for (const name in settings)
            this.settings[name] = settings[name] === undefined ? defaults[name] : settings[name];
    }

    
    // - Static - //
    
    /** Extendable static default settings getter. */
    public static getDefaultSettings(): ContextSettings {
        return { refreshTimeout: 0 };
    }

}

export type ContextType<Data extends Record<string, any> = {}, Signals extends SignalsRecord = SignalsRecord> = ClassType<Context<Data, Signals>, [Data?, Partial<ContextSettings>?]> & {
    getDefaultSettings(): ContextSettings;
}
