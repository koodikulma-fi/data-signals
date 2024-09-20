// - Imports - //
// Base class.
import { callListeners, mixinSignalBoy, SignalListenerFlags } from "./SignalBoy";
// - Helpers - //
/** Emits the signal and collects the answers given by each listener ignoring `undefined` as an answer.
 * - By default, returns a list of answers. To return the last one, include "last" in the modes array.
 * - To stop at the first accepted answer use "first" mode or "first-true" mode.
 * - Always skips `undefined` as an answer. To skip `null` too use "no-null" mode, or any falsifiable with `no-false`.
 */
export function askListeners(listeners, args, modes) {
    // Parse.
    const stopFirst = modes && (modes.includes("first") || modes.includes("first-true"));
    const onlyOne = modes && (stopFirst || modes.includes("last"));
    const noFalse = modes && modes.includes("no-false");
    const noNull = modes && modes.includes("no-null");
    let answers = [];
    // Loop each.
    for (const listener of listeners.slice()) {
        // One shot.
        const flags = listener[2] || 0;
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
            if (stopFirst && (answer || !modes.includes("first-true")))
                break;
        }
    }
    // Return acceptable answers.
    return onlyOne ? answers[0] : answers;
}
// export interface SignalManType<Signals extends SignalsRecord = {}> extends SignalBoyType<Signals>, ClassType<SignalMan<Signals>, []> { }
/** SignalMan provides simple and complex signal listening and sending features. Use the `listenTo` method for listening and `sendSignal` or `sendSignalAs` for sending. */
export class SignalMan extends mixinSignalMan(Object) {
}
// - Mixin - //
/** Add SignalMan features to a custom class. Provide the BaseClass type specifically as the 2nd type argument.
 * - For examples of how to use mixins see `mixinDataMan` comments or [mixin-types README](https://github.com/koodikulma-fi/mixin-types).
 */
export function mixinSignalMan(Base) {
    // For clarity of usage and avoid problems with deepness, we don't use the <Data> here at all and return ClassType.
    return class SignalMan extends mixinSignalBoy(Base) {
        // // - Members - //
        //
        // // Static.
        // ["constructor"]: SignalManType<Signals>;
        // - Sending signals - //
        // Note. This method assumes modes won't be modified during the call (in case uses delay or await).
        // .. This method can be extended, so uses string | string[] basis for modes in here.
        sendSignalAs(modes, name, ...args) {
            // Parse.
            const m = (typeof modes === "string" ? [modes] : modes);
            const isDelayed = m.includes("delay") || m.includes("pre-delay");
            const stopFirst = m.includes("first") || m.includes("first-true");
            const multi = m.includes("multi") || !stopFirst && !m.includes("last");
            // Return a promise.
            if (m.includes("await"))
                return new Promise(async (resolve) => {
                    // Wait extra.
                    if (isDelayed)
                        await this.afterRefresh(m.includes("delay"));
                    // No listeners.
                    const listeners = this.getListenersFor ? this.getListenersFor(name) : this.signals[name];
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
                const listeners = this.getListenersFor ? this.getListenersFor(name) : this.signals[name];
                return listeners ? askListeners(listeners, args, m) : m.includes("last") || stopFirst ? undefined : [];
            }
            // Delayed without a promise - no return value.
            (async () => {
                await this.afterRefresh(m.includes("delay"));
                const listeners = this.getListenersFor ? this.getListenersFor(name) : this.signals[name];
                if (listeners) {
                    // Stop at first. Rarity, so we just support it through askListeners without getting the value.
                    if (stopFirst)
                        askListeners(listeners, args, m);
                    // Just call.
                    else
                        callListeners(listeners, args);
                }
            })();
            // No value to return.
            return undefined;
        }
        // Overrideable refresher.
        afterRefresh(fullDelay = false) {
            return new Promise(resolve => setTimeout(fullDelay && this.awaitDelay ? async () => { await this.awaitDelay(); resolve(); } : resolve, 0));
        }
    }; // We're detached from the return type.
}
