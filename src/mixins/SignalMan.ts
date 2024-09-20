
// - Imports - //

// Dependency.
import { ClassType, AsClass } from "mixin-types";
// Library.
import { Awaited } from "../library/typing";
// Base class.
import { callListeners, SignalBoy, mixinSignalBoy, SignalBoyType, SignalListener, SignalListenerFlags, SignalsRecord } from "./SignalBoy";


// - Types - //

export type SignalSendAsReturn<
    // Input.
    OrigReturnVal,
    HasAwait extends boolean,
    IsSingle extends boolean,
    // Figured out.
    RetVal = true extends HasAwait ? Awaited<OrigReturnVal> : OrigReturnVal,
    ReturnVal = true extends IsSingle ? RetVal | undefined : RetVal[]
> = true extends HasAwait ? Promise<ReturnVal> : ReturnVal;


// - Helpers - //

/** Emits the signal and collects the answers given by each listener ignoring `undefined` as an answer.
 * - By default, returns a list of answers. To return the last one, include "last" in the modes array.
 * - To stop at the first accepted answer use "first" mode or "first-true" mode.
 * - Always skips `undefined` as an answer. To skip `null` too use "no-null" mode, or any falsifiable with `no-false`.
 */
export function askListeners(listeners: SignalListener[], args?: any[] | null, modes?: Array<"" | "no-false" | "no-null" | "last" | "first" | "first-true">): any {
    // Parse.
    const stopFirst = modes && (modes.includes("first") || modes.includes("first-true"));
    const onlyOne = modes && (stopFirst || modes.includes("last"));
    const noFalse = modes && modes.includes("no-false");
    const noNull = modes && modes.includes("no-null");
    let answers: any[] = [];
    // Loop each.
    for (const listener of listeners.slice()) {
        // One shot.
        const flags: SignalListenerFlags = listener[2] || 0;
        if (flags & SignalListenerFlags.OneShot) {
            // Remove distantly.
            const distListeners = listener[4] || listeners;
            const iThis = distListeners.indexOf(listener);
            if (iThis !== -1)
                distListeners.splice(iThis, 1);
        }
        // Deferred - won't be part of return answer flow.
        if (flags & SignalListenerFlags.Deferred)
            setTimeout(() => listener[0](...(listener[1] && args ? [...args, ...listener[1]] : args || listener[1] || [])), 0);
        // Call and collect answer.
        else {
            // Get answer.
            const answer = listener[0](...(listener[1] && args ? [...args, ...listener[1]] : args || listener[1] || []));
            // Not acceptable.
            if (!answer && (answer === undefined || noFalse || noNull && answer == null))
                continue;
            // Add to acceptables.
            if (onlyOne)
                answers[0] = answer;
            else
                answers.push(answer);
            // Stop at first acceptable. Don't call further.
            if (stopFirst && (answer || !modes!.includes("first-true")))
                break;
        }
    }
    // Return acceptable answers.
    return onlyOne ? answers[0] : answers;
}


// - Class - //

export interface SignalManType<Signals extends SignalsRecord = {}> extends AsClass<SignalBoyType<Signals>, SignalBoy<Signals> & SignalMan<Signals>, []> { }
// export interface SignalManType<Signals extends SignalsRecord = {}> extends SignalBoyType<Signals>, ClassType<SignalMan<Signals>, []> { }
/** SignalMan provides simple and complex signal listening and sending features. Use the `listenTo` method for listening and `sendSignal` or `sendSignalAs` for sending. */
export class SignalMan<Signals extends SignalsRecord = {}> extends (mixinSignalMan(Object) as any as ClassType) { }
export interface SignalMan<Signals extends SignalsRecord = {}> extends SignalBoy<Signals> {


    // - Members - //

    // // Constructor type. Let's not define it, since we're often used as a mixin - so constructor will be something else.
    // ["constructor"]: SignalManType<Signals>;


    // - Send signals - //

    /** The sendSignalAs method exposes various signalling features through its first arg: string or string[]. The features are listed below:
     * - `"delay"`:
     *      * Delays sending the signal. To also collect returned values must include "await".
     *      * Note that this delays the start of the process. So if new listeners are attached right after, they'll receive the signal.
     *      * In an external layer this could be further tied to other update cycles (eg. rendering cycle).
     * - `"pre-delay"`:
     *      * Like "delay" but uses 0ms timeout on the standalone SignalMan. (Typically this is arranged so that delays locally, but not pending external delays.)
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
     */
    sendSignalAs<
        Name extends string & keyof Signals,
        Mode extends "" | "pre-delay" | "delay" | "await" | "last" | "first" | "first-true" | "multi" | "no-false" | "no-null",
        HasAwait extends boolean = Mode extends string[] ? Mode[number] extends "await" ? true : false : Mode extends "await" ? true : false,
        HasLast extends boolean = Mode extends string[] ? Mode[number] extends "last" ? true : false : Mode extends "last" ? true : false,
        HasFirst extends boolean = Mode extends string[] ? Mode[number] extends "first" ? true : Mode[number] extends "first-true" ? true : false : Mode extends "first" ? true : Mode extends "first-true" ? true : false,
        HasMulti extends boolean = Mode extends string[] ? Mode[number] extends "multi" ? true : false : Mode extends "multi" ? true : false,
        HasDelay extends boolean = Mode extends string[] ? Mode[number] extends "delay" ? true : false : Mode extends "delay" ? true : false,
        UseSingle extends boolean = true extends HasMulti ? false : HasFirst | HasLast,
        UseReturnVal extends boolean = true extends HasAwait ? true : true extends HasDelay ? false : true,
    >(modes: Mode | Mode[], name: Name, ...args: Parameters<Signals[Name]>): true extends UseReturnVal ? SignalSendAsReturn<ReturnType<Signals[Name]>, HasAwait, UseSingle> : undefined;


    // - Refresh timing - //

    /** Overrideable method that should trigger a refresh and return a promise.
     * - The promise is resolved after the "pre-delay" or "delay" cycle has finished depending on the "fullDelay" argument.
     *      * By default uses a timeout of 0ms for "pre-delay" and after that awaits the promise from `awaitDelay` for full "delay".
     * - Note that at the level of SignalMan there is nothing to "refresh". However, if extended by a class where refreshing makes sense, this should trigger refreshing first.
     * - Used internally by sendSignalAs flow for its "pre-delay" and "delay" signals.
     */
    afterRefresh(fullDelay?: boolean): Promise<void>;
    /** Should not be called externally, but only overridden externally to determine the timing of the "delay" signals (after "pre-delay").
     * - If not present (default), then is resolved immediately. Otherwise awaits the method.
     * - Used internally through afterRefresh flow.
     */
    awaitDelay?(): Promise<void>;

}


// - Mixin - //

/** Add SignalMan features to a custom class. Provide the BaseClass type specifically as the 2nd type argument.
 * - For examples of how to use mixins see `mixinDataMan` comments or [mixin-types README](https://github.com/koodikulma-fi/mixin-types).
 */
export function mixinSignalMan<Signals extends SignalsRecord = {}, BaseClass extends ClassType = ClassType>(Base: BaseClass): AsClass<
    // Static.
    SignalManType<Signals> & BaseClass,
    // Instanced.
    SignalMan<Signals> & InstanceType<BaseClass>,
    // Constructor args. Just allow to pass in any, not used.
    any[]
> {
    // For clarity of usage and avoid problems with deepness, we don't use the <Data> here at all and return ClassType.
    return class SignalMan extends (mixinSignalBoy(Base) as SignalBoyType) {


        // - Sending signals - //

        // Note. This method assumes modes won't be modified during the call (in case uses delay or await).
        // .. This method can be extended, so uses string | string[] basis for modes in here.
        public sendSignalAs(modes: string | string[], name: string, ...args: any[]): any {
            // Parse.
            const m = (typeof modes === "string" ? [ modes ] : modes) as Array<"" | "pre-delay" | "delay" | "await" | "multi" | "last" | "first" | "first-true" | "no-false" | "no-null">;
            const isDelayed = m.includes("delay") || m.includes("pre-delay");
            const stopFirst = m.includes("first") || m.includes("first-true");
            const multi = m.includes("multi") || !stopFirst && !m.includes("last");
            // Return a promise.
            if (m.includes("await"))
                return new Promise<any>(async (resolve) => {
                    // Wait extra.
                    if (isDelayed)
                        await this.afterRefresh(m.includes("delay"));
                    // No listeners.
                    const listeners = (this.constructor as SignalManType).getListenersFor ? (this.constructor as SignalManType).getListenersFor!(this, name as never) : this.signals[name];
                    if (!listeners)
                        return multi ? resolve([]) : resolve(undefined);
                    // Resolve with answers.
                    // .. We have to do the four checks here manually, as we need to await the answers first.
                    let answers = (await Promise.all(askListeners(listeners, args))).filter(a => !(a === undefined || a == null && m.includes("no-null") || !a && m.includes("no-false")));
                    if (stopFirst && m.includes("first-true"))
                        answers = answers.filter(val => val);
                    // Handle answers.
                    const nAnswers = answers.length;
                    if (!nAnswers)
                        resolve(multi ? [] : undefined);
                    else if (stopFirst)
                        resolve(multi ? [answers[0]] : answers[0]);
                    else if (m.includes("last"))
                        resolve(multi ? [answers[nAnswers - 1]] : answers[nAnswers - 1]);
                    else
                        resolve(answers); // Must be in multi.
                });
            // No promise, nor delay.
            if (!isDelayed) {
                const listeners = (this.constructor as SignalManType).getListenersFor ? (this.constructor as SignalManType).getListenersFor!(this, name as never) : this.signals[name];
                return listeners ? askListeners(listeners, args, m as any[]) : m.includes("last") || stopFirst ? undefined : [];
            }
            // Delayed without a promise - no return value.
            (async () => {
                await this.afterRefresh(m.includes("delay"));
                const listeners = (this.constructor as SignalManType).getListenersFor ? (this.constructor as SignalManType).getListenersFor!(this, name as never) : this.signals[name];
                if (listeners) {
                    // Stop at first. Rarity, so we just support it through askListeners without getting the value.
                    if (stopFirst)
                        askListeners(listeners, args, m as any[]);
                    // Just call.
                    else
                        callListeners(listeners, args);
                }
            })();
            // No value to return.
            return undefined;
        }

        // Overrideable refresher.
        public afterRefresh(fullDelay: boolean = false): Promise<void> {
            return new Promise<void>(resolve => setTimeout(fullDelay && this.awaitDelay ? async () => { await this.awaitDelay!(); resolve(); } : resolve, 0));
        }
        // Overrideable "delay" awaiter.
        awaitDelay?(): Promise<void>;

    } as any; // We're detached from the return type.
}
