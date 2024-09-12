

// - Imports - //

// Library.
import { ClassType, ClassMixer } from "../library/typing";
// Classes.
import { SignalsRecord, SignalMan, SignalManMixin } from "./SignalMan";
import { DataBoy, DataBoyMixin } from "./DataBoy";


// - Mixin - //

/** Only for local use. Mixes followingly: `DataBoyMixin( _SignalBoyMixin( Base ) )`. */
function _SignalDataBoyMixin(Base: ClassType) {

    // A bit surprisingly, using this way of typing (combined with the SignalDataBoyMixin definition below), everything works perfectly.
    // .. The only caveat is that within here, we don't have the base class available. (Luckily we don't need it, as there's no overlap.)
    return class _SignalDataBoy extends DataBoyMixin(SignalManMixin(Base) as ClassType) {}

}

/** There are two ways you can use this mixin creator:
 * 1. Call this to give basic SignalDataBoy features with advanced typing being empty.
 *      * `class MyMix extends SignalDataBoyMixin(MyBase) {}`
 * 2. If you want to define the Data and Signals types, you can use this trick instead:
 *      * `class MyMix extends (SignalDataBoyMixin as ClassMixer<SignalDataBoyType<Data, Signals>>)(MyBase) {}`
 */
export const SignalDataBoyMixin = _SignalDataBoyMixin as unknown as ClassMixer<ClassType<DataBoy & SignalMan>>;


// - Class - //

export interface SignalDataBoyType<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends ClassType<SignalDataBoy<Data, Signals>> { }
export class SignalDataBoy<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends (_SignalDataBoyMixin(Object) as ClassType) { }
export interface SignalDataBoy<Data extends Record<string, any> = {}, Signals extends SignalsRecord = {}> extends DataBoy<Data>, SignalMan<Signals> {
    ["constructor"]: SignalDataBoyType<Data, Signals>;
}
