
// - Imports - //

// Dependency.
import { ClassType, AsClass, ReClass } from "mixin-types";


// - Types - //

export enum SignalListenerFlags {
    // Modes.
    /** If enabled, removes the listener once it has been fired once. */
    OneShot = 1 << 0,
    /** If enabled, calls the listener after a 0ms timeout. Note that this makes the callback's return value always be ignored from the return flow. */
    Deferred = 1 << 1,
    // Shortcuts.
    None = 0,
    All = OneShot | Deferred,
}
export type SignalListenerFunc = (...args: any[]) => any | void;
export type SignalListener<Callback extends SignalListenerFunc = SignalListenerFunc> = [ callback: Callback, extraArgs: any[] | null, flags: SignalListenerFlags, groupId: any | null | undefined, origListeners?: SignalListener[] ];
export type SignalsRecord = Record<string, SignalListenerFunc>;


// - Helpers - //

/** Calls a bunch of listeners and handles SignalListenerFlags mode.
 * - If OneShot flag used, removes from given listeners array.
 * - If Deferred flag is used, calls the listener after 0ms timeout.
 * - Does not collect return values. Just for emitting out without hassle.
 */
export function callListeners(listeners: SignalListener[], args?: any[] | null): void {
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
        // Deferred.
        if (flags & SignalListenerFlags.Deferred)
            setTimeout(() => listener[0](...(listener[1] && args ? [...args, ...listener[1]] : args || listener[1] || [])), 0);
        // Immediate.
        else
            listener[0](...(listener[1] && args ? [...args, ...listener[1]] : args || listener[1] || []));
    }
}


// - Class - //

/** The static class side typing for SignalBoy. */
export interface SignalBoyType<Signals extends SignalsRecord = {}> extends ClassType<SignalBoy<Signals>> {
    // Static extendables - we use very loose types here.
    /** Optional method to keep track of added / removed listeners. Called right after adding and right before removing. */
    onListener?(signalBoy: SignalBoy, name: string, index: number, wasAdded: boolean): void;
    /** Optional method to get the listeners for the given signal. If used it determines the listeners, if not present then uses this.signals[name] instead. Return undefined to not call anything. */
    getListenersFor?(signalBoy: SignalBoy, signalName: string): SignalListener[] | undefined;
}
/** SignalBoy provides very simple signal listening and sending features. Use the `listenTo` method for listening and `sendSignal` for sending. */
export class SignalBoy<Signals extends SignalsRecord = {}> extends (mixinSignalBoy(Object) as any as ReClass<SignalBoyType, {}>) { }
export interface SignalBoy<Signals extends SignalsRecord = {}> {


    // - Members - //

    // // Constructor type. Let's not define it, since we're often used as a mixin - so constructor will be something else.
    // ["constructor"]: SignalBoyType<Signals>;

    /** The stored signal connections. To emit signals use `sendSignal` and `sendSignalAs` methods. */
    signals: Record<string, Array<SignalListener>>;


    // - Listen to signals - //

    /** Assign a listener to a signal.
     * - You can also define extra arguments, optional groupId for easy clearing, and connection flags (eg. for one-shot or to defer call).
     * - Also checks whether the callback was already attached to the signal, in which case overrides the info.
     */
    listenTo<Name extends string & keyof Signals>(name: Name, callback: Signals[Name], extraArgs?: any[] | null, flags?: SignalListenerFlags | null, groupId?: any | null): void;
    /** Clear listeners by names, callback and/or groupId. Each restricts the what is cleared. To remove a specific callback attached earlier, provide name and callback. */
    unlistenTo(names?: (string & keyof Signals) | Array<string & keyof Signals> | null, callback?: SignalListenerFunc | null, groupId?: any | null): void;
    /** Check if any listener exists by the given name, callback and/or groupId. */
    isListening<Name extends string & keyof Signals>(name?: Name | null, callback?: SignalListenerFunc | null, groupId?: any | null): boolean;


    // - Send signals - //

    /** Send a signal. Does not return a value. Use `sendSignalAs(modes, name, ...args)` to refine the behaviour. */
    sendSignal<Name extends string & keyof Signals>(name: Name, ...args: Parameters<Signals[Name]>): void;

}


// - Mixin - //

/** Add SignalBoy features to a custom class. Provide the BaseClass type specifically as the 2nd type argument.
 * - For examples of how to use mixins see `mixinDataMan` comments or [mixin-types README](https://github.com/koodikulma-fi/mixin-types).
 */
export function mixinSignalBoy<Signals extends SignalsRecord = {}, BaseClass extends ClassType = ClassType>(Base: BaseClass): AsClass<
    // Static.
    SignalBoyType<Signals> & BaseClass,
    // Instanced.
    SignalBoy<Signals> & InstanceType<BaseClass>,
    // Constructor args. Just allow to pass in any, not used.
    any[]
> {
    // For clarity of usage and avoid problems with deepness, we don't use the <Data> here at all and return ClassType.
    return class SignalBoy extends (Base as ClassType) {

        
        // - Members - //

        public signals: Record<string, Array<SignalListener>> = {};


        // - Listening - //

        public listenTo(name: string, callback: SignalListenerFunc, extraArgs?: any[], flags: SignalListenerFlags = SignalListenerFlags.None, groupId?: any | null) {
            // Prepare.
            let listeners = this.signals[name];
            const listener: SignalListener = [callback, extraArgs || null, flags || SignalListenerFlags.None, groupId ?? null ];
            // New entry.
            if (!listeners)
                this.signals[name] = listeners = [ listener ];
            // Add to existing.
            else {
                // Check for a duplicate by callback. If has add in its place (to update the info), otherwise add to end.
                if (!listeners.some((info, index) => info[0] === callback ? listeners[index] = listener : false))
                    listeners.push( listener );
            }
            // Add technical support for distant OneShots.
            // .. So if this listener info is passed around alone (without the parenting this.signals[name] array ref),
            // .. we can still remove it easily from its original array - by just storing that original array here.
            if (listener[2] & SignalListenerFlags.OneShot)
                listener.push(listeners);
            // Call.
            (this.constructor as SignalBoyType).onListener?.(this, name as never, listeners.indexOf(listener), true);
        }

        public unlistenTo(names?: string | string[] | null, callback?: SignalListenerFunc | null, groupId?: any | null) {
            // Prepare names.
            if (names == null)
                names = Object.keys(this.signals);
            else if (typeof names === "string")
                names = [ names ];
            // Loop by names.
            const hasGroupId = groupId != null;
            for (const thisName of names) {
                // Destroy in reverse order.
                const connections = this.signals[thisName];
                if (!connections)
                    continue;
                for (let i=connections.length-1; i>=0; i--) {
                    // Only the callback.
                    if (callback && connections[i][0] !== callback)
                        continue;
                    // Only the group.
                    if (hasGroupId && connections[i][3] !== groupId)
                        continue;
                    // Remove.
                    (this.constructor as SignalBoyType).onListener?.(this, thisName as never, i, false);
                    connections.splice(i, 1);
                }
                // Empty.
                if (!connections[0])
                    delete this.signals[thisName];
            }
        }

        public isListening(name?: string | null, callback?: (SignalListenerFunc) | null, groupId?: any | null) {
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

        public sendSignal(name: string, ...args: any[]): void {
            const listeners = (this.constructor as SignalBoyType).getListenersFor ? (this.constructor as SignalBoyType).getListenersFor!(this, name as never) : this.signals[name];
            if (listeners)
                callListeners(listeners, args);
        }


        // - Optional inner listeners (for extending classes) - //

        /** Optional. */
        public static onListener?(signalBoy: SignalBoy, name: string, index: number, wasAdded: boolean): void {}
        
        /** Optional. */
        public static getListenersFor?(signalBoy: SignalBoy, signalName: string): SignalListener[] | undefined;
    
    } as any; // We're detached from the return type.
}
