const crypto = require("crypto");

function createRng() {
  function randomInt(maxExclusive) {
    if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) {
      throw new Error("maxExclusive must be a positive number");
    }
    return crypto.randomInt(0, maxExclusive);
  }

  function randomFloat() {
    const buffer = crypto.randomBytes(8);
    const value = buffer.readBigUInt64BE(0);
    const max = 2n ** 64n;
    return Number(value) / Number(max);
  }

  return { randomInt, randomFloat };
}

module.exports = { createRng };

