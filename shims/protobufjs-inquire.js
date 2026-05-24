'use strict';

const globalRef = typeof globalThis !== 'undefined'
  ? globalThis
  : typeof global !== 'undefined'
    ? global
    : {};

function inquire(moduleName) {
  if (moduleName === 'buffer' && typeof globalRef.Buffer !== 'undefined') {
    return { Buffer: globalRef.Buffer };
  }

  if (moduleName === 'long' && typeof globalRef.Long !== 'undefined') {
    return globalRef.Long;
  }

  return null;
}

module.exports = inquire;
