'use strict';

// Keep BigInt syntax isolated: older CommonJS hosts can skip this module.
// A literal finds the intrinsic even when the optional global is unavailable.
const prototype = Object.getPrototypeOf(0n);
const valueOf = Object.getOwnPropertyDescriptor(prototype, 'valueOf');
// Prefer allocation-free unboxing, but never capture inherited Object#valueOf.
const method = valueOf && typeof valueOf.value === 'function' ? valueOf.value : prototype.toString;
module.exports = Function.prototype.call.bind(method);
