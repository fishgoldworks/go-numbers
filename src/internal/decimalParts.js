'use strict';

/** Digits and base-ten power for the shortest representation of a positive finite number. */
function decimalParts(number) {
  const text = String(number);
  const exponentIndex = text.indexOf('e');
  const end = exponentIndex < 0 ? text.length : exponentIndex;
  const exponent = exponentIndex < 0 ? 0 : Number(text.slice(exponentIndex + 1));
  const dot = text.indexOf('.');
  const fractionLength = dot < 0 ? 0 : end - dot - 1;
  let digits = dot < 0 ? text.slice(0, end) : text.slice(0, dot) + text.slice(dot + 1, end);
  // Only the tiny leading run needs examination; no regex or mantissa copy.
  let start = 0;
  while (digits.charCodeAt(start) === 48) start++;
  if (start > 0) digits = digits.slice(start);
  return { digits, power: exponent - fractionLength };
}

module.exports = decimalParts;
