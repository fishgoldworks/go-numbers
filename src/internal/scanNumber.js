'use strict';

function isDigit(code) {
  return code >= 48 && code <= 57;
}

// The special-token boundary matches ASCII regex \b semantics, not locale words.
function isWord(code) {
  return isDigit(code) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 95;
}

/** Return the exclusive decimal-token end, or start if no digits were found. */
function decimalEnd(text, start) {
  let index = start;
  const sign = text.charCodeAt(index);
  if (sign === 43 || sign === 45) index++;

  const integerStart = index;
  while (isDigit(text.charCodeAt(index))) index++;
  const hasInteger = index > integerStart;

  if (text.charCodeAt(index) === 46) {
    index++;
    const fractionStart = index;
    while (isDigit(text.charCodeAt(index))) index++;
    if (!hasInteger && index === fractionStart) return start;
  } else if (!hasInteger) {
    return start;
  }

  const exponent = text.charCodeAt(index);
  if (exponent === 69 || exponent === 101) {
    const mantissaEnd = index++;
    const exponentSign = text.charCodeAt(index);
    if (exponentSign === 43 || exponentSign === 45) index++;
    const exponentStart = index;
    while (isDigit(text.charCodeAt(index))) index++;
    // Extraction keeps a valid mantissa when an exponent is incomplete.
    // Strict parsing will reject the leftover exponent characters.
    if (index === exponentStart) return mantissaEnd;
  }
  return index;
}

/** Recognize a standalone Infinity/NaN token, normalizing accepted casing. */
function specialValue(text, start, strict) {
  const first = text.charCodeAt(start);
  const signed = first === 43 || first === 45;
  const tokenStart = signed ? start + 1 : start;
  if (isWord(text.charCodeAt(tokenStart - 1))) return undefined;

  const code = text.charCodeAt(tokenStart);
  if (code === 73 || code === 105) {
    const end = tokenStart + 8;
    if (
      text.slice(tokenStart, end).toLowerCase() !== 'infinity' ||
      isWord(text.charCodeAt(end)) ||
      (strict && end !== text.length)
    ) {
      return undefined;
    }
    return first === 45 ? -Infinity : Infinity;
  }
  if (!signed && (code === 78 || code === 110)) {
    const end = start + 3;
    if (
      text.slice(start, end).toLowerCase() === 'nan' &&
      !isWord(text.charCodeAt(end)) &&
      (!strict || end === text.length)
    ) {
      return NaN;
    }
  }
  return undefined;
}

/**
 * Parse a complete string or extract its first number without regex backtracking.
 * A failed decimal candidate examines at most a sign and a dot. Once any digit
 * sequence is scanned, extraction returns immediately. Special-token probes
 * inspect at most eight characters. Total scanning work is O(text.length).
 * @param {string} text
 * @param {boolean} strict
 * @returns {number | undefined}
 */
function scanNumber(text, strict) {
  for (let start = 0; start < text.length; start++) {
    const code = text.charCodeAt(start);
    const signed = code === 43 || code === 45;
    if (signed || code === 46 || isDigit(code)) {
      const end = decimalEnd(text, start);
      if (end > start && (!strict || end === text.length)) {
        return Number(text.slice(start, end));
      }
    }
    if (signed || code === 73 || code === 105 || code === 78 || code === 110) {
      const special = specialValue(text, start, strict);
      if (special !== undefined) return special;
    }
    if (strict) return undefined;
  }
  return undefined;
}

module.exports = scanNumber;
