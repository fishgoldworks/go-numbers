'use strict';

const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);

/**
 * Read two supported own options, once each in ownKeys order. Keep primitive
 * defaults in a compact tuple rather than cloning a property-name dictionary.
 * The callers handle omitted options without allocating a tuple at all.
 * Unknown remaining own keys and explicit configuration errors are rejected.
 */
function readOptions(options, firstKey, secondKey, firstDefault, secondDefault) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('options must be a non-null, non-array object.');
  }
  const result = [firstDefault, secondDefault];
  for (const key of Reflect.ownKeys(options)) {
    // A preceding getter may delete a later key, and a proxy can report keys
    // for which it has no own descriptor. Do not fall through to a prototype
    // property in either case. A proxy's descriptor/get errors still escape.
    if (!hasOwn(options, key)) continue;
    const index = key === firstKey ? 0 : key === secondKey ? 1 : -1;
    if (index < 0) {
      const label = typeof key === 'symbol' ? String(key) : JSON.stringify(key);
      const allowed = `${JSON.stringify(firstKey)}, ${JSON.stringify(secondKey)}`;
      throw new TypeError(`Unknown option ${label}. Expected one of: ${allowed}.`);
    }
    const value = options[key];
    if (value !== undefined) result[index] = value;
  }
  return result;
}

module.exports = readOptions;
