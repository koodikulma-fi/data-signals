
// - Imports - //

// Dependency.
import { ClassType, AsClass } from "mixin-types";
// Library.
import { GetJoinedDataKeysFrom } from "../typing";
// Mixins.
import { mixinSignalMan, SignalMan } from "../mixins/SignalMan";
import { mixinDataMan, DataMan } from "../mixins/DataMan";
// Classes.
import { RefreshCycle } from "./RefreshCycle";
// Typing.
import { SignalBoy, SignalListener, SignalsRecord } from "../mixins/SignalBoy";
import { SignalManType } from "../mixins/SignalMan";
import { DataManType } from "../mixins/DataMan";
import { ContextAPI } from "./ContextAPI"; // Only typing (not on JS side - would be cyclical).


// - Extra typing - //

export interface ContextSettings {
    /** Timeout for refreshing for this particular context.
     * - The timeout is used for data refreshing, but also tied to actions called with syncing (like "delay" or "pre-delay").
     *      * Note that "pre-delay" refers to resolving this refreshTimeout, while "delay" is resolved after it once all the related contextAPIs have refreshed.
     * - If null, then synchronous - defaults to 0ms.
     * - Note that if you use null, the updates will run synchronously.
     *      * It's not recommended for normal usage, because you'd have to make sure you always use it in that sense.
     *      * For example, on the next code line (after say, setting data in context) the context have already updated and triggered refreshes all around the app. Maybe instance you called from has alredy unmounted.
     */
    refreshTimeout: number | null;
}


// - Class - //

/** Class type for Context class. */
export interface ContextType<Data extends Record<string, any> = {}, Signals extends SignalsRecord = SignalsRecord> extends AsClass<DataManType<Data> & SignalManType<Signals>, Context<Data, Signals>, [Data?, Partial<ContextSettings>?]> {
    /** Extendable static default settings getter. */
    getDefaultSettings<Settings extends ContextSettings = ContextSettings>(): Settings;
    /** Extendable static helper to hook up context refresh cycles together. Put as static so that doesn't pollute the public API of Context. */
    initializeCyclesFor(context: Context): void;
    /** Extendable static helper to run "pre-delay" cycle. Put as static so that doesn't pollute the public API of Context. */
    runPreDelayFor(context: Context, resolvePromise: () => void): void;
    /** Extendable static helper to run "delay" cycle - default implementation is empty. Put as static so that doesn't pollute the public API of Context (nor prevent features of extending classes). */
    runDelayFor(context: Context, resolvePromise: () => void): void;
}

export interface Context<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends SignalMan<Signals>, DataMan<Data> { }

/** Context provides signal and data listener features (extending `SignalMan` and `DataMan` basis).
 * - Contexts provide data listening and signalling features.
 *      - Extending SignalMan they allow to send typed signals with special options available through sendSignalAs.
 *          * Furthermore, the "pre-delay" and "delay" signals are synced to the refresh cycles of the context.
 *          * The "pre-delay" signals are triggered right before calling data listeners, and "delay" once all related ContextAPI's have resolved their `awaitDelay`.
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
export class Context<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends (mixinDataMan(mixinSignalMan(Object)) as any as ClassType) {


    // - Members - //

    // Typing.
    /** This is only provided for typing related technical reasons (so that can access signals typing easier externally). There's no actual _Signals member on the javascript side. */
    _Signals?: Signals;
    ["constructor"]: ContextType<Data, Signals>;
    
    // Settings.
    public settings: ContextSettings;

    // State.
    /** Handle for refresh cycles. */
    public preDelayCycle: RefreshCycle;
    public delayCycle: RefreshCycle;
    /** The keys are the ContextAPIs this context is attached to with a name, and the values are the names (typically only one). They are used for refresh related purposes. */
    public contextAPIs: Map<ContextAPI, string[]>;


    // - Construct - //

    constructor(...args: {} extends Data ? [data?: Data, settings?: Partial<ContextSettings> | null | undefined] : [data: Data, settings?: Partial<ContextSettings> | null | undefined]);
    constructor(data: Data, settings?: Partial<ContextSettings> | null | undefined) {
        // Base.
        super(data);
        // Set up.
        this.settings = this.constructor.getDefaultSettings();
        this.contextAPIs = new Map();
        this.preDelayCycle = new RefreshCycle();
        this.delayCycle = new RefreshCycle({ autoRenewPromise: true });
        // Update settings.
        if (settings)
            this.modifySettings(settings);
        // Hook up cycle interconnections.
        this.constructor.initializeCyclesFor(this as Context);
    }


    // - Settings - //

    /** Update settings with a dictionary. If any value is `undefined` then uses the existing or default setting. */
    public modifySettings(settings: Partial<ContextSettings>): void {
        const defaults = (this.constructor as typeof Context).getDefaultSettings();
        for (const name in settings)
            this.settings[name] = settings[name] !== undefined ? settings[name] : this.settings[name] ?? defaults[name];
    }


    // - Data related methods. - //

    // Added method.
    /** Trigger a refresh in the context.
     * - Triggers "pre-delay" and once finished, performs the "delay" cycle (awaiting connected contextAPIs).
     * @param forceTimeout Refers to the "pre-delay" time (defaults to settings.refreshTimeout).
     */
    public triggerRefresh(forceTimeout?: number | null): void {
        // Start the "pre-delay" cycle. Even if "delay" is running already - we've anyway hooked up "pre-delay" to always be resolved before "delay".
        this.preDelayCycle.trigger(this.settings.refreshTimeout, forceTimeout);
    }

    // Overridden.
    /** Triggers a refresh and returns a promise that is resolved when the context is refreshed.
     * - If using "pre-delay" and there's nothing pending, then will resolve immediately (by the design of the flow). The "delay" always awaits.
     * - The promise is resolved after the "pre-delay" or "delay" cycle has finished depending on the "fullDelay" argument.
     *      * The "pre-delay" (fullDelay = false) uses the forceTimeout or the time out from settings { refreshTimeout }.
     *      * The "delay" (fullDelay = true) waits for "pre-delay" cycle to happen (with forceTimeout), and then awaits the promise from `awaitDelay`.
     *          - The `awaitDelay` is in turn synced to awaiting the `awaitDelay` of all the connected contextAPIs.
     * - Note that technically, the system at Context level simply collects an array (per delay type) of one-time promise resolve funcs and calls them at the correct time.
     * - Used internally by setData, setInData, refreshData and sendSignalAs flow.
     */
    public afterRefresh(fullDelay: boolean = false, forceTimeout?: number | null): Promise<void> {
        // We always trigger "pre-delay", unless delayCycle is already running and asked for fullDelay.
        if (!fullDelay || !this.delayCycle.state)
            this.preDelayCycle.trigger(this.settings.refreshTimeout, forceTimeout);
        // Return according promise.
        return fullDelay ? this.delayCycle.promise : this.preDelayCycle.promise;
    }

    /** At the level of Context the `awaitDelay` is tied to waiting the refresh from all connected contextAPIs.
     * - It's used by the data refreshing flow (after "pre-delay") to mark the "delay" cycle. When the promise resolves, the "delay" is resolved.
     * - Note that this method should not be _called_ externally, but can be overridden externally to affect when "delay" cycle is resolved.
     * - Note that you can still externally delete the method, if needing to customize context. (Or override it to tie to other things.)
     */
    awaitDelay?(): Promise<void>;
    async awaitDelay?() {
        // Add an await refresh listener on all connected contextAPIs.
        // .. Note that we don't specify which contextAPIs actually were refreshed in relation to the actions and pending data.
        // .... We simply await before all the contextAPIs attached to us have refreshed - they can return same promise if associated, then skipped here.
        // .... This way, the feature set and technical side is much simpler and feels more stable/predictable when actually used.
        const toWait: Set<Promise<void>> = new Set();
        for (const contextAPI of this.contextAPIs.keys())
            toWait.add(contextAPI.afterRefresh(true));
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

    
    // - Static - //
    
    // Overridden.
    /** Overridden to support getting signal listeners from related contextAPIs - in addition to direct listeners (which are put first). */
    public static getListenersFor(context: Context, signalName: string): SignalListener[] | undefined {
        // Collect all.
        let allListeners: SignalListener[] = context.signals[signalName] || [];
        for (const [contextAPI, ctxNames] of context.contextAPIs) {
            for (const ctxName of ctxNames) {
                const listeners = contextAPI.constructor.getListenersFor ? contextAPI.constructor.getListenersFor(contextAPI as SignalBoy, ctxName + "." + signalName as never) : contextAPI.signals[ctxName + "." + signalName];
                if (listeners)
                    allListeners = allListeners.concat(listeners);
            }
        }
        return allListeners[0] && allListeners;
    }

    /** Extendable static default settings getter. */
    public static getDefaultSettings<Settings extends ContextSettings = ContextSettings>(): Settings {
        return { refreshTimeout: 0 } as Settings;
    }

    /** Extendable static helper to hook up context refresh cycles together. Put as static so that doesn't pollute the public API of Context (nor prevent features of extending classes). */
    public static initializeCyclesFor(context: Context): void {

        // - DEV-LOG - //
        //
        // Useful for debugging the flow.
        //
        // context.preDelayCycle.listenTo("onStart", () => console.log("--- RefreshCycle: CONTEXT 1. PRE-DELAY - onStart ---"));
        // context.delayCycle.listenTo("onStart", () => console.log("--- RefreshCycle: CONTEXT 2. REFRESH - onStart ---"));
        // context.preDelayCycle.listenTo("onResolve", () => console.log("--- RefreshCycle: CONTEXT 1. PRE-DELAY - onResolve ---"));
        // context.delayCycle.listenTo("onResolve", () => console.log("--- RefreshCycle: CONTEXT 2. REFRESH - onResolve ---"));
        // context.preDelayCycle.listenTo("onRefresh", () => console.log("--- RefreshCycle: CONTEXT 1. PRE-DELAY - onRefresh ---"));
        // context.delayCycle.listenTo("onRefresh", () => console.log("--- RefreshCycle: CONTEXT 2. REFRESH - onRefresh ---"));
        // context.preDelayCycle.listenTo("onFinish", () => console.log("--- RefreshCycle: CONTEXT 1. PRE-DELAY - onFinish ---"));
        // context.delayCycle.listenTo("onFinish", () => console.log("--- RefreshCycle: CONTEXT 2. REFRESH - onFinish ---"));

        // Hook up cycle interconnections.
        // .. Do the actual updating.
        context.preDelayCycle.listenTo("onRefresh", (_pending, resolvePromise) => context.constructor.runPreDelayFor(context, resolvePromise));
        context.delayCycle.listenTo("onRefresh", (_pending, resolvePromise) => context.constructor.runDelayFor(context, resolvePromise));
        // .. Make sure "delay" is run when "pre-delay" finishes, and the "delay"-related awaitDelay is awaited only then.
        context.preDelayCycle.listenTo("onFinish", () => {
            // Start delay cycle if was idle.
            context.delayCycle.trigger();
            // Resolve "delay" cycle - unless was already "resolving" (or had become "").
            if (context.delayCycle.state === "waiting")
                context.awaitDelay ? context.awaitDelay().then(() => context.delayCycle.resolve()) : context.delayCycle.resolve();
        });
        // .. Make sure "pre-delay" is always resolved right before "delay".
        context.delayCycle.listenTo("onResolve", () => context.preDelayCycle.resolve());
    }
    
    /** Extendable static helper to run "pre-delay" cycle. Put as static so that doesn't pollute the public API of Context (nor prevent features of extending classes). */
    public static runPreDelayFor(context: Context, resolvePromise: () => void): void {

        // Clear data keys from context.
        const refreshKeys = context.dataKeysPending;
        context.dataKeysPending = null;

        // Resolve the promise to trigger action calls now (before data listener calls).
        resolvePromise();

        // Call data listeners.
        if (refreshKeys) {
            // Call direct.
            for (const [callback, [fallbackArgs, ...needs]] of context.dataListeners.entries()) { // Note that we use .entries() to take a copy of the situation.
                if (refreshKeys === true || refreshKeys.some(dataKey => needs.some(need => need === dataKey || need.startsWith(dataKey + ".") || dataKey.startsWith(need + ".")))) 
                    callback(...context.getDataArgsBy(needs as any, fallbackArgs as any));
            }
            // Call on related contextAPIs.
            // .. Only call the ones not colliding with our direct, or call all.
            for (const [contextAPI, ctxNames] of context.contextAPIs.entries())
                // Call method.
                contextAPI.callDataBy((refreshKeys === true ? ctxNames : ctxNames.reduce((cum, ctxName) => cum.concat(refreshKeys.map(rKey => rKey ? ctxName + "." + rKey : ctxName)), [] as string[])) as any);
        }
    }

    /** Extendable static helper to run "delay" cycle - default implementation is empty. Put as static so that doesn't pollute the public API of Context (nor prevent features of extending classes). */
    public static runDelayFor(context: Context, resolvePromise: () => void): void { }

}
