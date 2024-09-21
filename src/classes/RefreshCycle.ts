
// - Imports - //

import { AsClass, GetConstructorArgs } from "mixin-types";
import { SignalBoy, SignalBoyType, SignalsRecord } from "../mixins/SignalBoy";


// - Extra typing - //

export type RefreshCycleSignals<PendingOutput extends Record<string, any> = {}> = {
    /** Called when a new cycle starts. Perfect place to trigger start-up-dependencies (from other cycles). */
    onStart: () => void;
    /** Called right before resolving the promise. Perfect place to trigger resolve-dependencies (from other cycles). */
    onResolve: () => void;
    /** Called right when the cycle has finished (without cancelling). Contains the pending info for executing the related updates. */
    onRefresh: (pending: Partial<PendingOutput>) => void;
    /** Called right after the cycle has finished (due to either: refresh or cancel). Perfect place to trigger disposing-dependencies (from other cycles). */
    onFinish: (cancelled: boolean) => void;
}
export type RefreshCycleAutoPending<
    PendingInput extends Record<string, any> = {},
    PendingOutput extends { [Key in keyof PendingInput & string]: PendingInput[Key] extends Iterable<any> ? Set<any> | Array<any> | PendingInput[Key] : PendingInput[Key] } = PendingInput
> = {
    [Key in keyof PendingInput & string]?:
        // PendingInput[Key] extends Iterable<any> ? "array" | "set" | "" :
        [PendingInput[Key], PendingOutput[Key]] extends [Iterable<any>, Array<any>] ? "array" | "" :
        [PendingInput[Key], PendingOutput[Key]] extends [Iterable<any>, Set<any>] ? "set" | "" :
        [PendingInput[Key], PendingOutput[Key]] extends [Iterable<any>, Array<any> | Set<any>] ? "array" | "set" | "" :
        PendingInput[Key] extends Record<string, any> ? "object" | "" :
        "";
};


// - Class - //

/** Class type for RefreshCycle. */
export interface RefreshCycleType<
    PendingInput extends Record<string, any> = {},
    PendingOutput extends { [Key in keyof PendingInput & string]: PendingInput[Key] extends Iterable<any> ? Set<any> | Array<any> | PendingInput[Key] : PendingInput[Key] } = PendingInput,
    AddSignals extends SignalsRecord = {}
> extends AsClass<SignalBoyType<AddSignals>, RefreshCycle<PendingInput, PendingOutput, AddSignals>, GetConstructorArgs<RefreshCycle<PendingInput, PendingOutput, AddSignals>>> {
    /** Clears the timer and resolves the promise if had. During the process has state "resolving", after it "". Meant for internal use only (with resolve and reject). */
    flushCycle(cycle: RefreshCycle): void;
}

/** Class to help manage refresh cycles. */
export class RefreshCycle<
    PendingInput extends Record<string, any> = {},
    PendingOutput extends { [Key in keyof PendingInput & string]: PendingInput[Key] extends Iterable<any> ? Set<any> | Array<any> | PendingInput[Key] : PendingInput[Key] } = PendingInput,
    AddSignals extends SignalsRecord = {}
> extends SignalBoy<RefreshCycleSignals<PendingOutput> & AddSignals> {
    

    // - Members - //

    // Constructor type.
    ["constructor"]: RefreshCycleType<PendingInput, PendingOutput, AddSignals>;

    // Public.
    /** The `promise` can be used for waiting purposes. It's always present, and if there's nothing to wait it's already fulfilled. */
    public promise: Promise<void> = Promise.resolve();
    /** State of the cycle. Set to "resolving" right when is finishing (does not matter if reject was called), and to "" right after the promise is resolved. */
    public state: "waiting" | "resolving" | "" = "";
    /** Optional collection of things to update when the cycle finished.
     * - When the cycle is finished calls `onRefresh(pending: Partial<PendingOutput>)` using this info.
     * - Collected by providing `addToPending` spread argument when using the `update` or `add` methods.
     * - You can automate part of the adding process using "autoPending" member.
     */
    public pending: Partial<PendingOutput> = {};
    /** Custom auto-handlers for incoming pending info.
     * - These can be assigned on the constructor or through setAutoPending method.
     * - For each main property tell how to assign. The default is "".
     *      * If uses "object" performs `{ ...oldPending[propery], ...newPending[property] }`.
     *      * If uses "array" creates a new Array on the first run and then pushes to it from an iterable.
     *      * If uses "set" creates a new Set on the first run and then adds to it from an iterable.
     *      * If uses "" simply replace the old value with the new.
     * - For example: `{ actions: "array", settings: "object", targets: "set" }` results in `{ actions: any[]; settings: Record<string, any>; targets: Set<any>; }`.
     *      * Note that using this feature with typing requires providing the PendingOutput - it's then reflected in the constructor.
     */
    public autoPending: RefreshCycleAutoPending<PendingInput, PendingOutput>;
    /** The current timer if any. */
    public timer?: number | NodeJS.Timeout;

    // Private.
    /** The callback to resolve the promise created. When called will first delete itself, and then resolves the promise. */
    private _resolvePromise?: () => void;

    // Allow without autoPending if didn't require conversion by type.
    constructor(...args: PendingInput extends PendingOutput ? [RefreshCycleAutoPending<PendingInput, PendingOutput>?] : [RefreshCycleAutoPending<PendingInput, PendingOutput>]);
    constructor(...args: [RefreshCycleAutoPending<PendingInput, PendingOutput>?]) {
        super();
        this.autoPending = args[0] || {};
    }


    // - Basic API - //

    /** Start up the cycle. Goes to "waiting" state, unless is "resolving". Only starts if wasn't started already. If uses forceTimeout modifies the timeout. */
    public start(defaultTimeout?: number | null, forceTimeout?: number | null): Promise<void> {
        // Already running.
        if (this.state) {
            // Extend timeout.
            if (this.state === "waiting" && forceTimeout !== undefined)
                this.extend(forceTimeout);
            // Return promise.
            return this.promise;
        }
        // Start up.
        this.state = "waiting";
        this.promise = new Promise(res => this._resolvePromise = () => { delete this._resolvePromise; res(); });
        // Set up a timer.
        defaultTimeout !== undefined && this.extend(defaultTimeout);
        // Call up.
        (this as RefreshCycle).sendSignal("onStart");
        return this.promise;
    }

    /** Starts the cycle if wasn't started, and adds pending info, and modifies the timeout. The defaultTimeout is only used when starting up the cycle. */
    public update(addToPending?: Partial<PendingInput> | null, defaultTimeout?: number | null, forceTimeout?: number | null): void {
        // Add to pending.
        if (addToPending)
            this.absorb(addToPending);
        // Start.
        if (!this.state)
            this.start(forceTimeout === undefined ? defaultTimeout : forceTimeout);
        else if (forceTimeout !== undefined)
            this.extend(forceTimeout);
    }

    /** Absorbs the pending info updates without triggering the cycle. Can be automated with "autoPending" member. */
    public absorb(addToPending: Partial<PendingInput>): void {
        // Loop each propery.
        for (const p in addToPending) {
            // Automation.
            switch(this.autoPending[p] || "" as "set" | "array" | "object" | "") {
                // Add to a set.
                case "set": {
                    const set = this.pending[p] as Set<any> || ((this.pending as Record<string, Set<any>>)[p] = new Set());
                    for (const s of addToPending[p] as Iterable<any>)
                        set.add(s);
                    break;
                }
                // Add to an array.
                case "array": {
                    const arr = this.pending[p] as any[] || ((this.pending as Record<string, any[]>)[p] = []);
                    for (const s of addToPending[p] as Iterable<any>)
                        arr.push(s);
                    break;
                }
                // Add to / override in a dictionary.
                case "object":
                    this.pending[p] = { ...this.pending[p], ...addToPending[p] };
                    break;
                // Just replace.
                default:
                    this.pending[p] = addToPending[p];
                    break;
            }
        }
    }

    /** The opposite of absorb.
     * - Removes from pending info (without triggering the cycle). Can be automated with "autoPending" member.
     * - If the key is defined but its value is undefined, deletes the key.
     */
    public eject(removeFromPending: Partial<PendingInput>): void {
        // Loop each propery.
        for (const p in removeFromPending) {
            // Not found.
            if (this.pending[p] === undefined) {
                // Make sure is really deleted.
                delete this.pending[p];
                continue;
            }
            // Automation.
            switch(this.autoPending[p] || "" as "set" | "array" | "object" | "") {
                // Add to a set.
                case "set": {
                    const set = this.pending[p] as Set<any>;
                    for (const s of removeFromPending[p] as Iterable<any>)
                        set.delete(s);
                    break;
                }
                // Add to an array.
                case "array": {
                    const arr = this.pending[p] as any[] || ((this.pending as Record<string, any[]>)[p] = []);
                    for (const s of removeFromPending[p] as Iterable<any>) {
                        const i = arr.indexOf(s);
                        i !== -1 && arr.splice(i, 1);
                    }
                    break;
                }
                // Add to / override in a dictionary.
                case "object": {
                    const dictionary = this.pending[p] = { ...this.pending[p] };
                    for (const key in removeFromPending)
                        delete dictionary[key as any];
                    break;
                }
                // Just delete.
                default:
                    delete this.pending[p];
                    break;
            }
        }
    }

    /** Extend the timeout - clearing old timeout (if had).
     * - If given `number`, then sets it as the new timeout.
     * - If given `null`, then will immediaty resolve it - same as calling `resolve`.
     * - If given `undefined´ will only clear the timer and not set up a new one.
     */
    public extend(timeout: number | null | undefined): void {
        // Execute immediately.
        if (timeout === null)
            this.resolve();
        // Clear old timer and set up a new one - unless is resolving.
        else if (this.state !== "resolving") {
            // Clear.
            if (this.timer !== undefined) {
                clearTimeout(this.timer as any);
                delete this.timer;
            }
            // Set.
            if (timeout !== undefined)
                this.timer = setTimeout(() => { delete this.timer; this.resolve(); }, timeout);
        }
    }


    // - Resolve API - //

    /** Resolve the refresh cycle (and promise) manually. Results in clearing the entry from bookkeeping and calling `onRefresh`. Resolving again results in nothing. */
    public resolve(): void {
        // Not valid.
        if (this.state !== "waiting")
            return;
        // Resolve promise.
        this.constructor.flushCycle(this);
        // Collect pending.
        const pending = this.pending;
        this.pending = {};
        // Call refresh and finish.
        (this as RefreshCycle).sendSignal("onRefresh", pending);
        (this as RefreshCycle).sendSignal("onFinish", false);
    }

    /** Cancel the whole refresh cycle. Note that this will clear the entry from refreshTimers bookkeeping along with its updates. */
    public reject(): void {
        // Not valid.
        if (this.state !== "waiting")
            return;
        // Upon cancelled, clear now - so that there can be a new cycle with new pending then. Only these were trashed.
        // .. Otherwise we continue collecting the pending until the dependencies and the promise have been resolved.
        // .. We resolve the dependencies in any case - the promise flow must stay stable and constant.
        this.pending = {};
        // Resolve promise.
        this.constructor.flushCycle(this);
        // Emit.
        (this as RefreshCycle).sendSignal("onFinish", true);
    }


    // - Static (extendable) helpers - //

    /** Clears the timer and resolves the promise if had. During the process has state "resolving", after it "".
     * - Put as static so that doesn't pollute the public API of RefreshCycle (nor prevent features of extending classes).
     */
    public static flushCycle(cycle: RefreshCycle): void {
        // State.
        cycle.state = "resolving";
        // Clear timer.
        if (cycle.timer !== undefined) {
            clearTimeout(cycle.timer as any);
            delete cycle.timer;
        }
        // Resolve and clear promise.
        if (cycle._resolvePromise) {
            // Emit to resolve dependencies or such.
            (cycle as RefreshCycle).sendSignal("onResolve");
            // Resolve promise, if still there after the signal.
            cycle._resolvePromise?.();
        }
        // State.
        cycle.state = "";
    }

}
