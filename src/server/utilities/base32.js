const RFC4648_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf, { padding = false } = {}) {
  if (!Buffer.isBuffer(buf)) {
    throw new TypeError("base32Encode: buf must be a Buffer");
  }

  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      const index = (value >>> (bits - 5)) & 31;
      output += RFC4648_ALPHABET[index];
      bits -= 5;
    }
  }

  if (bits > 0) {
    const index = (value << (5 - bits)) & 31;
    output += RFC4648_ALPHABET[index];
  }

  if (padding) {
    while (output.length % 8 !== 0) output += "=";
  }

  return output;
}

module.exports = { base32Encode };

