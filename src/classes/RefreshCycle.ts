
// - Imports - //

import { AsClass, GetConstructorArgs } from "mixin-types";
import { SignalBoy, SignalBoyType, SignalsRecord } from "../mixins/SignalBoy";


// - Extra typing - //

export type RefreshCycleSignals<PendingInfo = undefined> = {
    /** Called when a new cycle starts. Perfect place to trigger start-up-dependencies (from other cycles). */
    onStart: () => void;
    /** Called right before resolving the promise. Perfect place to trigger resolve-dependencies (from other cycles). */
    onResolve: () => void;
    /** Called right when the cycle has finished (without cancelling). Contains the pending info for executing the related updates.
     * - Also contains resolvePromise(), which is called right after synchronously. But can be called earlier if wanted.
     */
    onRefresh: (pending: PendingInfo, resolvePromise: () => void) => void;
    /** Called right after the cycle has finished (due to either: refresh or cancel). Perfect place to trigger disposing-dependencies (from other cycles). */
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
    /** The `promise` can be used for waiting purposes. It's always present, and if there's nothing to wait it's already fulfilled. */
    public promise: Promise<void> = Promise.resolve();
    /** State of the cycle. Set to "resolving" right when is finishing (does not matter if reject was called), and to "" right after the promise is resolved. */
    public state: "waiting" | "resolving" | "" = "";
    /** Optional collection of things to update when the cycle finished.
     * - When the cycle is finished calls `onRefresh(pending: PendingInfo)` using this info.
     * - Initialized by initializer given on constructor. Can then add manually to the cycle externally.
     *      * The pending is re-inited at the moment of clearing pending. The first one on instantiating the class.
     *      * If no initializer given then is undefined.
     */
    public pending: PendingInfo;
    /** The current timer if any. */
    public timer?: number | NodeJS.Timeout;
    public initializer?: () => PendingInfo;

    // Private.
    /** The callback to resolve the promise created. When called will first delete itself, and then resolves the promise. */
    private _resolvePromise?: () => void;

    // Allow without autoPending if didn't require conversion by type.
    constructor(...args: PendingInfo extends undefined ? [initializer?: () => PendingInfo] : [initializer: () => PendingInfo]) {
        super();
        this.initializer = args[0];
        this.pending = this.initializer ? this.initializer() : undefined as PendingInfo;
    }


    // - Basic API - //

    /** Starts the cycle if wasn't started: goes to "waiting" state unless was "resolving".
     * - If forceTimeout given modifies the timeout, the defaultTimeout is only used when starting up the cycle.
     * - The cycle is finished by calling "resolve" or "reject", or by the timeout triggering "resolve".
     * - Returns the promise in any case - might be fulfilled already.
    */
    public trigger(defaultTimeout?: number | null, forceTimeout?: number | null): Promise<void> {
        // Start.
        if (!this.state) {
            // Set state.
            this.state = "waiting";
            // Set up a new promise.
            this.promise = new Promise(res => this._resolvePromise = () => {
                delete this._resolvePromise;
                res();
            });
            // Set up a timer.
            defaultTimeout !== undefined && this.extend(defaultTimeout);
            // Call up.
            (this as RefreshCycle).sendSignal("onStart");
        }
        // Just extend the timer.
        else if (this.state === "waiting" && forceTimeout !== undefined)
            this.extend(forceTimeout);
        // Return the promise.
        return this.promise;
    }

    /** Extend the timeout - clearing old timeout (if had).
     * - If given `number`, then sets it as the new timeout.
     * - If given `null`, then will immediaty resolve it - same as calling `resolve`.
     * - If given `undefined´ will only clear the timer and not set up a new one.
     * - Note that does _not_ start up a cycle - only extends an active one in the "waiting" state.
     */
    public extend(timeout: number | null | undefined): void {
        // Not active.
        if (this.state !== "waiting")
            return;
        // Clear.
        this.clearTimer();
        // Execute or set up a timer (or do nothing).
        if (timeout === null)
            this.resolve();
        else if (timeout !== undefined)
            this.timer = setTimeout(() => { delete this.timer; this.resolve(); }, timeout);
    }

    /** Clears the timer. Mostly used internally, but can be used externally as well. Does not affect the state of the cycle. */
    public clearTimer(): void {
        if (this.timer !== undefined) {
            clearTimeout(this.timer as any);
            delete this.timer;
        }
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
        const pending = this.pending;
        this.pending = this.initializer ? this.initializer() : undefined as PendingInfo;
        // Call onResolve.
        (this as RefreshCycle).sendSignal("onResolve");
        // Call onRefresh.
        let done = false;
        const resolvePromise = () => {
            if (!done) {
                done = true;
                this.state = "";
                this._resolvePromise?.();
            }
        }
        (this as RefreshCycle<PendingInfo>).sendSignal("onRefresh", pending, resolvePromise);
        resolvePromise(); // Make sure the promise is resolved by now.
        // Call onFinish.
        (this as RefreshCycle).sendSignal("onFinish", false);
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
        this.pending = this.initializer ? this.initializer() : undefined as PendingInfo;
        // Call onResolve.
        (this as RefreshCycle).sendSignal("onResolve");
        // Clear state and resolve promise.
        this.state = "";
        this._resolvePromise?.();
        // Emit.
        (this as RefreshCycle).sendSignal("onFinish", true);
    }

}
