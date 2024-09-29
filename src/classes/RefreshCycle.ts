
// - Imports - //

import { AsClass, GetConstructorArgs } from "mixin-types";
import { SignalBoy, SignalBoyType, SignalsRecord } from "../mixins/SignalBoy";
import { NodeJSTimeout } from "../library/typing";


// - Extra typing - //

/** All settings for RefreshCycle. */
export interface RefreshCycleSettings<PendingInfo = undefined> {
    /** The default timeout to use. Can be temporarily overridden using the `trigger(defaultTimeout, forceTimeout)` method (as the 1st arg, the 2nd arg always overrides). */
    defaultTimeout: number | null | undefined;
    /** If set to true, then creates a new promise already when the old is finished. So the promise defaults to "pending", instead of "fulfilled". */
    autoRenewPromise: boolean;
    /** The pending initializer to call after clearing the pending info. */
    initPending: (() => PendingInfo) | undefined;
}
export type RefreshCycleSignals<PendingInfo = undefined> = {
    /** Called when a new cycle starts. Perfect place to trigger start-up-dependencies (from other cycles). */
    onStart: () => void;
    /** Called right before resolving the promise. Perfect place to trigger resolve-dependencies (from other cycles). */
    onResolve: () => void;
    /** Called right when the cycle has finished (without cancelling). Contains the pending info for executing the related updates.
     * - Also contains resolvePromise(), which is called right after synchronously. But can be called earlier if wanted.
     * - Note that if resolves early, should take into account that more pending could have accumulated during the call.
     */
    onRefresh: (pending: PendingInfo, resolvePromise: (keepResolving?: boolean) => void) => void;
    /** Called after onResolve and onRefresh but before onFinish - called right before the state is set to "" and the promise is resolved.
     * - It's the perfect moment to set up chained-start-up-dependencies.
     *      * Such that require the earlier cycle to _not_ be finished, while the further cycles are _initialized_.
     *      * Note that the current cycle will anyway be finished up (to state "") synchronously right after this call. So only for _initializing_ other cycles.
     */
    onChain: (cancelled: boolean) => void;
    /** Called right after the cycle has finished (due to either: refresh or cancel). Perfect place to trigger disposing-dependencies (from other cycles) and to start other cycles. */
    onFinish: (cancelled: boolean) => void;
}


// - Class - //

/** Class type for RefreshCycle. */
export interface RefreshCycleType<
    PendingInfo = undefined,
    AddSignals extends SignalsRecord = {}
> extends AsClass<SignalBoyType<AddSignals>, RefreshCycle<PendingInfo, AddSignals>, GetConstructorArgs<RefreshCycle<PendingInfo, AddSignals>>> { }

/** Class to help manage refresh cycles. */
export class RefreshCycle<
    PendingInfo = undefined,
    AddSignals extends SignalsRecord = {}
> extends SignalBoy<RefreshCycleSignals<PendingInfo> & AddSignals> {
    

    // - Members - //

    // Constructor type.
    ["constructor"]: RefreshCycleType<PendingInfo, AddSignals>;

    // Public.
    /** Settings. */
    public settings: Partial<RefreshCycleSettings<PendingInfo>>;
    /** The `promise` can be used for waiting purposes. It's always present, and if there's nothing to wait it's already fulfilled. */
    public promise: Promise<void>;
    /** State of the cycle. Set to "resolving" right when is finishing (does not matter if reject was called), and to "" right after the promise is resolved. */
    public state: "waiting" | "resolving" | "" = "";
    /** Optional collection of things to update when the cycle finished.
     * - When the cycle is finished calls `onRefresh(pending: PendingInfo)` using this info.
     * - Initialized by initPending given on constructor, or then undefined.
     *      * The pending is re-inited at the moment of clearing pending - the first one on instantiating the class.
     *      * Can then add manually to the cycle externally: eg. `myCycle.pending.myThings.push(thisThing)`.
     */
    public pending: PendingInfo;
    /** The current timer if any. */
    public timer?: number | NodeJSTimeout;
    /** If not undefined, this functions as the defaultTimeout for the next cycle start. */
    public nextTimeout?: number | null;

    // Private.
    /** The callback to resolve the promise created. When called will first delete itself, and then resolves the promise. */
    private _resolve?: () => void;

    // Allow without autoPending if didn't require conversion by type.
    constructor(...args: PendingInfo extends undefined ? [settings?: Partial<RefreshCycleSettings<PendingInfo>>] : [settings: Partial<RefreshCycleSettings<PendingInfo>> & Pick<RefreshCycleSettings<PendingInfo>, "initPending">]) {
        super();
        this.settings = args[0] || {};
        // Use settings.
        this.settings.autoRenewPromise ? this.initPromise() : this.promise = Promise.resolve();
        this.pending = this.settings.initPending ? this.settings.initPending() : undefined as PendingInfo;
    }


    // - Basic API - //

    /** Start the cycle, optionally forcing a timeout (if not undefined). */
    public start(forceTimeout?: number | null): void {
        // Only if was ready.
        if (this.state)
            return;
        // Set state.
        this.state = "waiting";
        // Set up a new promise - or reuse existing one, if still pending and not set to auto renew on clear.
        if (!this._resolve || !this.settings.autoRenewPromise)
            this.initPromise();
        // Set up the next timer, but don't execute immediately - we need to call "onStart" first.
        const timeout = forceTimeout === undefined ? this.nextTimeout === undefined ? this.settings.defaultTimeout : this.nextTimeout : forceTimeout;
        this.extend(timeout); // Just extend, don't trigger nor resolve anything. It'll also clear nextTimeout.
        // Call up.
        this.signals.onStart && (this as RefreshCycle).sendSignal("onStart");
        // Resolve immediately.
        if (timeout === null)
            this.resolve();
    }

    /** Starts the cycle if wasn't started: goes to "waiting" state unless was "resolving".
     * - If forceTimeout given modifies the timeout, the defaultTimeout is only used when starting up the cycle.
     * - The cycle is finished by calling "resolve" or "reject", or by the timeout triggering "resolve".
     * - Returns the promise in any case - might be fulfilled already.
     */
    public trigger(defaultTimeout?: number | null, forceTimeout?: number | null): Promise<void> {
        // Start.
        const timeout = forceTimeout === undefined ? this.nextTimeout === undefined ? defaultTimeout : this.nextTimeout : forceTimeout;
        if (!this.state)
            this.start(timeout);
        // Already started.
        // .. Just extend the timer - allowing instant resolution, if such is to be desired.
        // .. If is "resolving", calling .extend() will not do anything.
        else if (timeout !== undefined)
            this.extend(timeout, "instant"); // Allow instant resolution.
        // Return the promise.
        return this.promise;
    }

    /** Extend the timeout without triggering the cycle (by default).
     * @param timeout Defaults to `undefined`.
     *      - If given `number`, then sets it as the new timeout.
     *      - If given `null`, then will immediaty resolve it (when the cycle starts). If cycle already started, resolves instantly.
     *      - If given `undefined´ only clears the timer and does not set up a new one.
     * @param allowTrigger Defaults to `false`.
     *      - If `true`, then allows to start up a new cycle if the state was "". This might include resolving it instantly as well if new timeout is `null`.
     *      - If `"instant"`, then does not allow start up a new cycle, but does allow instant resolving of the current cycle if was "waiting" and new timeout `null`.
     *      - If `false` (default), then never starts up a new cycle, nor resolves it instantly if `null` given for an active cycle.
     *          * In terms of micro-processing, this is often what is wanted externally. That's why the default - so calling `extend` never resolves nor triggers instantly by default.
     *          * If the new timeout is `null`, the external layer probably calls `.resolve()` manually - very synchronously-soon after.
     * - About phase of the cycle:
     *      * "": If the cycle has not yet started, only marks the timeout (to override the default), when the cycle later starts. Unless allowTriggerCycle is true.
     *      * "waiting": If the cycle is ready, clears the old timer (if any) and sets the new timer. (If null, and allowInstantResolve is true, then resolves instantly.)
     *      * "resolving": Does not do anything, things are already in the process of being resolved synchronously - right now.
     */
    public extend(timeout: number | null | undefined, allowTrigger?: boolean | "instant"): void {
        // Handle by state.
        switch(this.state) {
            // Has not started.
            case "":
                // Mark the next timeout in any case.
                timeout === undefined ? delete this.nextTimeout : this.nextTimeout = timeout;
                // If allowing to start up or trigger instantly.
                if (allowTrigger === true || allowTrigger && timeout === null)
                    this.start();
                break;
            // Set up.
            case "waiting":
                // Clear old timer.
                this.clearTimer();
                // Resolve instantly, unless not allowed to - in that case, we'll just leave it hanging.
                if (timeout === null)
                    allowTrigger ? this.resolve() : this.nextTimeout = null;
                // Set up a new.
                else if (timeout !== undefined)
                    this.timer = setTimeout(() => { delete this.timer; this.resolve(); }, timeout)
                break;
            // // Is resolving - don't do anything.
            // case "resolving":
            //     break;
        }
    }

    /** Clears the timer. Mostly used internally, but can be used externally as well. Does not affect the state of the cycle. */
    public clearTimer(): void {
        // Clear next default.
        delete this.nextTimeout;
        // Clear actual timer.
        if (this.timer !== undefined) {
            clearTimeout(this.timer as any);
            delete this.timer;
        }
    }

    /** Get and clear the pending info. */
    public resetPending(): PendingInfo {
        const pending = this.pending;
        this.pending = this.settings.initPending ? this.settings.initPending() : undefined as PendingInfo;
        return pending;
    }


    // - Resolve API - //

    /** Resolve the refresh cycle (and promise) manually. Results in clearing the entry from bookkeeping and calling `onRefresh`. Resolving again results in nothing. */
    public resolve(): void {
        // Not valid.
        if (this.state !== "waiting")
            return;
        // State.
        this.state = "resolving";
        // Clear timer.
        this.clearTimer();
        // Collect pending.
        const pending = this.resetPending();
        // Call onResolve.
        const s = this.signals;
        s.onResolve && (this as RefreshCycle).sendSignal("onResolve");
        // Call onRefresh.
        /** Indicates sub state of resolving.
         * - Flag &1 indicates that the promise has been resolved. The state is either "resolving" or "" based on flag &2.
         * - Flag &2 indicates that process is fully finished. The state becomes "".
         */
        let done: 0 | 1 | 2 = 0;
        const resolvePromise = (keepResolving: boolean = false) => {
            if ((done & 1) === 0) {
                done |= keepResolving ? 1 : 1 | 2;
                if (!keepResolving && this.state === "resolving") {
                    s.onChain && (this as RefreshCycle).sendSignal("onChain", false);
                    this.state = "";
                }
                this._resolve && this._resolve();
            }
            else if (!keepResolving && (done & 2) === 0 && this.state === "resolving") {
                done |= 2;
                s.onChain && (this as RefreshCycle).sendSignal("onChain", false);
                this.state = "";
                this._resolve && this._resolve(); // Just in case for some funky synchronous situations.
            }
        }
        (this as RefreshCycle<PendingInfo>).sendSignal("onRefresh", pending, resolvePromise);
        // Make sure the promise is resolved by now, and state cleared.
        resolvePromise();
        // Create a new promise already, if set to do so.
        if (this.settings.autoRenewPromise)
            this.initPromise();
        // Call onFinish.
        s.onFinish && (this as RefreshCycle).sendSignal("onFinish", false);
    }

    /** Cancel the whole refresh cycle. Note that this will clear the entry from refreshTimers bookkeeping along with its updates. */
    public reject(): void {
        // Not valid.
        if (this.state !== "waiting")
            return;
        // State.
        this.state = "resolving";
        // Clear timer.
        this.clearTimer();
        // Upon cancelling, clear old pending.
        this.resetPending();
        // Call onResolve.
        const s = this.signals;
        s.onResolve && (this as RefreshCycle).sendSignal("onResolve");
        // Call chain.
        s.onChain && (this as RefreshCycle).sendSignal("onChain", true);
        // Clear state.
        this.state = "";
        // Make sure promise is resolved by now, and create new if set to.
        this.settings.autoRenewPromise ? this.initPromise() : this._resolve && this._resolve();
        // Emit.
        s.onFinish && (this as RefreshCycle).sendSignal("onFinish", true);
    }


    // - Private helpers - //
    
    private initPromise(): void {
        // Make sure the old promise is resolved.
        this._resolve && this._resolve();
        // Set up a new promise.
        this.promise = new Promise(res => this._resolve = () => {
            // Delete.
            delete this._resolve;
            // Resolve.
            res();
        });
    }

}
