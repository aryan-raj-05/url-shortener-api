import { randomBytes } from "node:crypto";

const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const ALPHABET_LENGTH = ALPHABET.length;
const MAX_BYTE = 256 - (256 % ALPHABET_LENGTH);

export function generateShortCode(length = 7): string {
  let code = "";

  while (code.length < length) {
    const bytes = randomBytes(length - code.length);

    for (const byte of bytes) {
      if (byte >= MAX_BYTE) continue;

      code += ALPHABET[byte % ALPHABET_LENGTH];

      if (code.length == length) break;
    }
  }

  return code;
}
