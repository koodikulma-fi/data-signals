
// - Imports - //

// Library.
import { ClassType, GetJoinedDataKeysFrom } from "../library/typing";
// Classes.
import { SignalDataMan } from "./SignalDataMan";
// Typing.
import { SignalListener, SignalsRecord } from "./SignalMan";
import { ContextAPI } from "./ContextAPI"; // Only typing (not on JS side - would be cyclical).


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
 *      - Extending SignalMan they allow to send typed signals with special options available through sendSignalAs.
 *          * Furthermore, the "pre-delay" and "delay" signals are synced to the refresh cycles of the context.
 *          * The "pre-delay" signals are triggered right before calling data listeners, and "delay" once all related ContextAPI's have resolved their `awaitRefresh`.
 *      - Extending DataMan they assume a data structure of nested dictionaries.
 *          * For example: `{ something: { deep: boolean; }; simple: string; }`
 *          * The actual values can be anything: static values, functions, arrays, maps, sets, custom classes (including Immutable maps and such).
 *      - When the data is modified, the parenting data dictionaries are shallow copied all the way up to the root data.
 *          * Accordingly, the related data listeners are called (instantly at the level of DataMan).
 *      - Note that the typing data key suggestions won't go inside any non-Object type nor custom classes, only dictionaries.
 *          * Accordingly you should not refer deeper on the JS either, even thought it might work in practice since won't take a shallow copy of non-Objects.
 * - Contexts are useful in complex applications and often shared non-locally (or down the tree) in app structure to provide common data and intercommunication channels.
 *      * For example, you might have several different contexts in your app, and then interconnect them together (if needed).
 * - Contexts are designed to function stand alone, but also to work with ContextAPI instances to sync a bigger whole together.
 *      * The contextAPIs can be connected to multiple named contexts, and listen to data and signals in all of them in sync.
 */
export class Context<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends SignalDataMan<Data, Signals> {


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
    private _refreshTimer: number | NodeJS.Timeout | null;
    /** Temporary internal callbacks that will be called when the update cycle is done - at the moment of "pre-delay" cycle (after refreshTimeout). */
    private _afterPre?: Array<() => void>;
    /** Temporary internal callbacks that will be called after the update cycle and the related external refreshes (by contextAPIs) have been flushed - at the moment of "delay" cycle. */
    private _afterPost?: Array<() => void>;


    // - Construct - //

    constructor(...args: {} extends Data ? [data?: Data, settings?: Partial<ContextSettings> | null | undefined] : [data: Data, settings?: Partial<ContextSettings> | null | undefined]);
    constructor(data: Data, settings?: Partial<ContextSettings> | null | undefined) {
        // Base.
        super(data);
        // Public settings.
        this.contextAPIs = new Map();
        this.settings = this.constructor.getDefaultSettings();
        this._refreshTimer = null;
        // Update settings.
        if (settings)
            this.modifySettings(settings);
    }


    // - Settings - //

    /** Update settings with a dictionary. If any value is `undefined` then uses the existing or default setting. */
    public modifySettings(settings: Partial<ContextSettings>): void {
        const defaults = (this.constructor as typeof Context).getDefaultSettings();
        for (const name in settings)
            this.settings[name] = settings[name] !== undefined ? settings[name] : this.settings[name] ?? defaults[name];
    }


    // - SignalMan sending extensions - //
    
    /** Overridden to support getting signal listeners from related contextAPIs - in addition to direct listeners (which are put first). */
    public getListenersFor(signalName: string): SignalListener[] | undefined {
        // Collect all.
        let allListeners: SignalListener[] = this.signals[signalName] || [];
        for (const [contextAPI, ctxNames] of this.contextAPIs) {
            for (const ctxName of ctxNames) {
                const listeners = contextAPI.getListenersFor ? contextAPI.getListenersFor(ctxName + "." + signalName as never) : contextAPI.signals[ctxName + "." + signalName];
                if (listeners)
                    allListeners = allListeners.concat(listeners);
            }
        }
        return allListeners[0] && allListeners;
    }


    // - SignalDataMan-like methods. - //

    // Overridden.
    /** Triggers a refresh and returns a promise that is resolved when the context is refreshed.
     * - If there's nothing pending, then will resolve immediately (by the design of the flow).
     * - The promise is resolved after the "pre-delay" or "delay" cycle has finished depending on the "fullDelay" argument.
     *      * The "pre-delay" (fullDelay = false) uses the time out from settings { refreshTimeout }.
     *      * The "delay" (fullDelay = true) waits for "pre-delay" cycle to happen, and then awaits the promise from `awaitRefresh`.
     *          - The `awaitRefresh` is in turn synced to awaiting the `awaitRefresh` of all the connected contextAPIs.
     * - Note that technically, the system at Context level simply collects an array (per delay type) of one-time promise resolve funcs and calls them at the correct time.
     * - Used internally by setData, setInData, refreshData and sendSignalAs flow.
     */
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
    /** At the level of Context the `awaitRefresh` is tied to waiting the refresh from all contexts.
     * - It's called by the data refreshing flow after calling the "pre-delay" actions and the data listeners.
     * - Note that this method should not be _called_ externally, but can be overridden externally to affect when "delay" cycle is resolved.
     */
    async awaitRefresh() {
        // Add an await refresh listener on all connected contextAPIs.
        // .. Note that we don't specify which contextAPIs actually were refreshed in relation to the actions and pending data.
        // .. We simply await before all the contextAPIs attached to us have refreshed. It's much simpler and feels more stable when actually used.
        const toWait: Promise<void>[] = [];
        for (const contextAPI of this.contextAPIs.keys())
            toWait.push(contextAPI.afterRefresh(true));
        // Wait.
        await Promise.all(toWait);
    }
    
    // Overridden to handle data refreshes.
    /** Trigger refresh of the context and optionally add data keys.
     * - This triggers calling pending data keys and delayed signals (when the refresh cycle is executed).
     */
    public refreshData<DataKey extends GetJoinedDataKeysFrom<Data>>(dataKeys: DataKey | DataKey[] | boolean | null, forceTimeout?: number | null): void;
    public refreshData(dataKeys: string | string[] | boolean | null, forceTimeout?: number | null): void {
        // Add keys.
        dataKeys && this.addRefreshKeys(dataKeys);
        // Trigger contextual refresh.
        this.triggerRefresh(forceTimeout);
    }

    // Added method.
    /** Trigger a refresh in the context. Refreshes all pending after a timeout. */
    public triggerRefresh(forceTimeout?: number | null): void {
        this._refreshTimer = (this.constructor as typeof Context).callWithTimeout(() => this.refreshPending(), this._refreshTimer, this.settings.refreshTimeout, forceTimeout) as any;
    }


    // - Refresh state getters - //

    /** Check whether is waiting to be refreshed. */
    public isWaitingForRefresh(): boolean {
        return this._refreshTimer !== null;
    }
    /** Check whether has any reason to be refreshed: checks if there are any pending data keys or signals on the "pre-delay" or "delay" cycle. */
    public isPendingRefresh(): boolean {
        return !!(this._afterPre || this._afterPost || this.dataKeysPending);
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
                    callback(...this.getDataArgsBy(needs as any, fallbackArgs as any));
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
                // Wait.
                await this.awaitRefresh();
                // Resolve all afterPost awaiters.
                for (const callback of afterPost)
                    callback();
            })();
        }
    }
    
    
    // - Static - //
    
    /** Extendable static default settings getter. */
    public static getDefaultSettings(): ContextSettings {
        return { refreshTimeout: 0 };
    }

    /** General helper for reusing a timer callback, or potentially forcing an immediate call.
     * - Returns the value that should be assigned as the stored timer (either existing one, new one or null).
     */
    public static callWithTimeout<Timer extends number | NodeJS.Timeout>(callback: () => void, currentTimer: Timer | null, defaultTimeout: number | null, forceTimeout?: number | null): Timer | null {
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
    
}

/** Class type for Context class. */
export type ContextType<Data extends Record<string, any> = {}, Signals extends SignalsRecord = SignalsRecord> = ClassType<Context<Data, Signals>, [Data?, Partial<ContextSettings>?]> & {
    /** Extendable static default settings getter. */
    getDefaultSettings(): ContextSettings;
    /** Helper for reusing a timer callback, or potentially forcing an immediate call.
     * - Returns the value that should be assigned as the stored timer (either existing one, new one or null).
     */
    callWithTimeout<Timer extends number | NodeJS.Timeout>(callback: () => void, currentTimer: Timer | null, defaultTimeout: number | null, forceTimeout?: number | null): Timer | null;
}
