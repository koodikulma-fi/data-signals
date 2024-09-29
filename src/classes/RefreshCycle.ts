
// - Imports - //

import { AsClass, GetConstructorArgs } from "mixin-types";
import { SignalBoy, SignalBoyType, SignalsRecord } from "../mixins/SignalBoy";
import { NodeJSTimeout } from "../library/typing";


// - Extra typing - //

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
     * - Initialized by pendingInitializer given on constructor, or then undefined.
     *      * The pending is re-inited at the moment of clearing pending - the first one on instantiating the class.
     *      * Can then add manually to the cycle externally: eg. `myCycle.pending.myThings.push(thisThing)`.
     */
    public pending: PendingInfo;
    /** The current timer if any. */
    public timer?: number | NodeJSTimeout;
    /** If not undefined, this functions as the defaultTimeout for the next cycle start. */
    public nextTimeout?: number | null;
    public pendingInitializer?: () => PendingInfo;

    // Private.
    /** The callback to resolve the promise created. When called will first delete itself, and then resolves the promise. */
    private _resolvePromise?: () => void;

    // Allow without autoPending if didn't require conversion by type.
    constructor(...args: PendingInfo extends undefined ? [pendingInitializer?: () => PendingInfo] : [pendingInitializer: () => PendingInfo]) {
        super();
        this.pendingInitializer = args[0];
        this.pending = this.pendingInitializer ? this.pendingInitializer() : undefined as PendingInfo;
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
            // Set up the next timer, but don't execute immediately - we need to call "onStart" first.
            const timeout = forceTimeout === undefined ? this.nextTimeout === undefined ? defaultTimeout : this.nextTimeout : forceTimeout;
            this.extend(timeout, false);
            // Call up.
            (this as RefreshCycle).sendSignal("onStart");
            // Resolve immediately.
            if (timeout === null)
                this.resolve();
        }
        // Just extend the timer - allowing instant resolution, if such is to be desired.
        else if (forceTimeout !== undefined)
            this.extend(forceTimeout);
        // Return the promise.
        return this.promise;
    }

    /** Extend the timeout without triggering the cycle (by default).
     * @param timeout Defaults to `undefined`.
     *      - If given `number`, then sets it as the new timeout.
     *      - If given `null`, then will immediaty resolve it (when the cycle starts). If cycle already started, resolves instantly.
     *      - If given `undefined´ only clears the timer and does not set up a new one.
     * @param allowTrigger Defaults to `"never"`.
     *      - If `true`, then allows to start up a new cycle if the state was "". This might include resolving it instantly as well if new timeout is `null`.
     *      - If `"instant"` (default), then does not allow start up a new cycle, but does allow instant resolving of the current cycle if was "waiting" and new timeout `null`.
     *      - If `false`, then never starts up a new cycle, nor resolves it instantly if `null` given for an active cycle.
     *          * In terms of micro-processing, this is often what is wanted externally.
     *          * If the new timeout is `null`, the external layer probably calls `.resolve()` manually - very synchronously-soon after.
     * - About phase of the cycle:
     *      * "": If the cycle has not yet started, only marks the timeout (to override the default), when the cycle later starts. Unless allowTriggerCycle is true.
     *      * "waiting": If the cycle is ready, clears the old timer (if any) and sets the new timer. (If null, and allowInstantResolve is true, then resolves instantly.)
     *      * "resolving": Does not do anything, things are already in the process of being resolved synchronously - right now.
     */
    public extend(timeout: number | null | undefined, allowTrigger: boolean | "instant" = "instant"): void {
        // Handle by state.
        switch(this.state) {
            // Is resolving - don't do anything.
            case "resolving":
                return;
            // Has not started.
            case "":
                // Just mark.
                timeout === undefined ? delete this.nextTimeout : this.nextTimeout = timeout;
                // If allowing to start up, just trigger now.
                if (allowTrigger === true)
                    this.trigger();
                break;
            // Set up.
            case "waiting":
                // Clear old timer.
                this.clearTimer();
                // Set up a new.
                if (timeout === null)
                    allowTrigger && this.resolve();
                else if (timeout !== undefined)
                    this.timer = setTimeout(() => { delete this.timer; this.resolve(); }, timeout)
                break;
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
        this.pending = this.pendingInitializer ? this.pendingInitializer() : undefined as PendingInfo;
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
        (this as RefreshCycle).sendSignal("onResolve");
        // Call onRefresh.
        let done: 0 | 1 | 2 = 0;
        const resolvePromise = (keepResolving: boolean = false) => {
            if ((done & 1) === 0) {
                done |= keepResolving ? 1 : 1 | 2;
                if (!keepResolving)
                    this.state = "";
                this._resolvePromise?.();
            }
            else if (!keepResolving && (done & 2) === 0 && this.state === "resolving") {
                done |= 2;
                this.state = "";
            }
        }
        (this as RefreshCycle<PendingInfo>).sendSignal("onRefresh", pending, resolvePromise);
        resolvePromise(); // Make sure the promise is resolved by now, and state cleared.
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
        this.resetPending();
        // Call onResolve.
        (this as RefreshCycle).sendSignal("onResolve");
        // Clear state and resolve promise.
        this.state = "";
        this._resolvePromise?.();
        // Emit.
        (this as RefreshCycle).sendSignal("onFinish", true);
    }

}
