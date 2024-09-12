

// - Imports - //

// Library.
import { ClassType, ClassMixer } from "../library/typing";
// Classes.
import { SignalsRecord, SignalMan, SignalManMixin } from "./SignalMan";
import { DataMan, DataManMixin } from "./DataMan";


// - Mixin - //

/** Only for local use. Mixes followingly: `_DataManMixin( _SignalManMixin( Base ) )`. */
function _SignalDataManMixin(Base: ClassType) {

    // A bit surprisingly, using this way of typing (combined with the SignalDataManMixin definition below), everything works perfectly.
    // .. The only caveat is that within here, we don't have the base class available. (Luckily we don't need it, as there's no overlap.)
    return class _SignalDataMan extends DataManMixin(SignalManMixin(Base) as ClassType) {}

}

/** There are two ways you can use this mixin creator:
 * 1. Call this to give basic SignalDataMan features with advanced typing being empty.
 *      * `class MyMix extends SignalDataManMixin(MyBase) {}`
 * 2. If you want to define the Data and Signals types, you can use this trick instead:
 *      * `class MyMix extends (SignalDataManMixin as ClassMixer<SignalDataManType<Data, Signals>>)(MyBase) {}`
 */
export const SignalDataManMixin = _SignalDataManMixin as unknown as ClassMixer<ClassType<DataMan & SignalMan>>;


// - Class - //

export interface SignalDataManType<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends ClassType<SignalDataMan<Data, Signals>> { }
export class SignalDataMan<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends (_SignalDataManMixin(Object) as ClassType) { }
export interface SignalDataMan<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends DataMan<Data>, SignalMan<Signals> {
    ["constructor"]: SignalDataManType<Data, Signals>;
}
