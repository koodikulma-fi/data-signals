

// - Imports - //

// Library.
import { ClassType, ClassMixer } from "../types";
// Classes.
import { SignalMan, SignalsRecord, _SignalManMixin } from "./SignalMan";
import { DataMan, _DataManMixin } from "./DataMan";


// - Mixin - //

/** Only for local use. Mixes followingly: `_DataManMixin( _SignalManMixin( Base ) )`. */
export function _DataSignalManMixin<Data = any, Signals extends SignalsRecord = {}>(Base: ClassType) {

    // A bit surprisingly, using this way of typing (combined with the DataSignalManMixin definition below), everything works perfectly.
    // .. The only caveat is that within here, we don't have the base class available. (Luckily we don't need it, as there's no overlap.)
    return class _DataSignalMan extends _DataManMixin(_SignalManMixin(Base) as ClassType) {}

}

/** There are two ways you can use this:
 * 1. Call this to give basic DataSignalMan features with advanced typing being empty.
 *      * `class MyMix extends DataSignalManMixin(MyBase) {}`
 * 2. If you want to define the Data and Signals types, you can use this trick instead:
 *      * `class MyMix extends (DataSignalManMixin as ClassMixer<DataSignalManType<Data, Signals>>)(MyBase) {}`
 */
export const DataSignalManMixin = _DataSignalManMixin as unknown as ClassMixer<ClassType<DataMan & SignalMan>>;


// - Class - //

export interface DataSignalManType<Data = any, Signals extends SignalsRecord = {}> extends ClassType<DataSignalMan<Data, Signals>> { }
export class DataSignalMan<Data = any, Signals extends SignalsRecord = {}> extends (_DataSignalManMixin(Object) as ClassType) { }
export interface DataSignalMan<Data = any, Signals extends SignalsRecord = {}> extends DataMan<Data>, SignalMan<Signals> { }
