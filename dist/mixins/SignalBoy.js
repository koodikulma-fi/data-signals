// - Imports - //
// - Types - //
export var SignalListenerFlags;
(function (SignalListenerFlags) {
    // Modes.
    /** If enabled, removes the listener once it has been fired once. */
    SignalListenerFlags[SignalListenerFlags["OneShot"] = 1] = "OneShot";
    /** If enabled, calls the listener after a 0ms timeout. Note that this makes the callback's return value always be ignored from the return flow. */
    SignalListenerFlags[SignalListenerFlags["Deferred"] = 2] = "Deferred";
    // Shortcuts.
    SignalListenerFlags[SignalListenerFlags["None"] = 0] = "None";
    SignalListenerFlags[SignalListenerFlags["All"] = 3] = "All";
})(SignalListenerFlags || (SignalListenerFlags = {}));
// - Helpers - //
/** Calls a bunch of listeners and handles SignalListenerFlags mode.
 * - If OneShot flag used, removes from given listeners array.
 * - If Deferred flag is used, calls the listener after 0ms timeout.
 * - Does not collect return values. Just for emitting out without hassle.
 */
export function callListeners(listeners, args) {
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
        // Deferred.
        if (flags & SignalListenerFlags.Deferred)
            setTimeout(() => listener[0](...(listener[1] && args ? [...args, ...listener[1]] : args || listener[1] || [])), 0);
        // Immediate.
        else
            listener[0](...(listener[1] && args ? [...args, ...listener[1]] : args || listener[1] || []));
    }
}
/** SignalBoy provides very simple signal listening and sending features. Use the `listenTo` method for listening and `sendSignal` for sending. */
export class SignalBoy extends mixinSignalBoy(Object) {
}
// - Mixin - //
/** Add SignalBoy features to a custom class. Provide the BaseClass type specifically as the 2nd type argument.
 * - For examples of how to use mixins see `mixinDataMan` comments or [mixin-types README](https://github.com/koodikulma-fi/mixin-types).
 */
export function mixinSignalBoy(Base) {
    // For clarity of usage and avoid problems with deepness, we don't use the <Data> here at all and return ClassType.
    return class SignalBoy extends Base {
        constructor() {
            // - Members - //
            super(...arguments);
            this.signals = {};
        }
        // - Listening - //
        listenTo(name, callback, extraArgs, flags = SignalListenerFlags.None, groupId) {
            // Prepare.
            let listeners = this.signals[name];
            const listener = [callback, extraArgs || null, flags || SignalListenerFlags.None, groupId !== null && groupId !== void 0 ? groupId : null];
            // New entry.
            if (!listeners)
                this.signals[name] = listeners = [listener];
            // Add to existing.
            else {
                // Check for a duplicate by callback. If has add in its place (to update the info), otherwise add to end.
                if (!listeners.some((info, index) => info[0] === callback ? listeners[index] = listener : false))
                    listeners.push(listener);
            }
            // Add technical support for distant OneShots.
            // .. So if this listener info is passed around alone (without the parenting this.signals[name] array ref),
            // .. we can still remove it easily from its original array - by just storing that original array here.
            if (listener[2] & SignalListenerFlags.OneShot)
                listener.push(listeners);
            // Call.
            this.onListener(name, listeners.indexOf(listener), true);
        }
        unlistenTo(names, callback, groupId) {
            // Prepare names.
            if (names == null)
                names = Object.keys(this.signals);
            else if (typeof names === "string")
                names = [names];
            // Loop by names.
            const hasGroupId = groupId != null;
            for (const thisName of names) {
                // Destroy in reverse order.
                const connections = this.signals[thisName];
                if (!connections)
                    continue;
                for (let i = connections.length - 1; i >= 0; i--) {
                    // Only the callback.
                    if (callback && connections[i][0] !== callback)
                        continue;
                    // Only the group.
                    if (hasGroupId && connections[i][3] !== groupId)
                        continue;
                    // Remove.
                    this.onListener(thisName, i, false);
                    connections.splice(i, 1);
                }
                // Empty.
                if (!connections[0])
                    delete this.signals[thisName];
            }
        }
        isListening(name, callback, groupId) {
            // Loop each by name.
            if (name == null)
                return Object.keys(this.signals).some(name => this.isListening(name, callback, groupId));
            // Empty.
            if (!this.signals[name])
                return false;
            // Callback doesn't match.
            if (callback && !this.signals[name].some(listener => listener[0] === callback))
                return false;
            // Group doesn't match.
            if (groupId != null && !this.signals[name].some(listener => listener[3] === groupId))
                return false;
            // Does match.
            return true;
        }
        // - Sending signals - //
        sendSignal(name, ...args) {
            const listeners = this.getListenersFor ? this.getListenersFor(name) : this.signals[name];
            if (listeners)
                callListeners(listeners, args);
        }
        // - Optional inner listeners (for extending classes) - //
        /** Extendable. */
        onListener(name, index, wasAdded) { }
    }; // We're detached from the return type.
}
