// Copyright (c) 2026 Grégoire Geis
// SPDX-License-Identifier: MPL-2.0

/**
 * Encodes a byte buffer to [Z85t](#z85t). Use {@linkcode decodeZ85t()} to get your `buffer` back.
 *
 * @param buffer A byte array; the only requirement is that it supports `length` and indexing, so
 *   both plain number arrays and {@linkcode Uint8Array} will work. Every value is assumed to be a
 *   value between 0 and 255 (included).
 *
 * ### Z85t
 *
 * Z85t is a superset of [Z85](https://rfc.zeromq.org/spec/32) which supports padding using
 * truncated tails:
 *
 * - When encoding, a final chunk of `r` in `{1, 2, 3}` bytes is encoded as a full 5-digit chunk
 *   (bytes in the high positions, low bytes set to zero, as if the chunk was end-padded with
 *   zeros), with only the first `r + 1` characters emitted.
 *
 * - When decoding, the missing characters are filled with the maximum digit (84), and only the top
 *   `r` bytes are kept (with `r = input.length % 5 - 1`).
 *
 *   Decoding rejects non-canonical inputs: a tail is valid only if re-encoding the decoded bytes
 *   reproduces it.
 *
 * ### Examples
 *
 * ```ts
 * import { assertEquals } from "jsr:@std/assert";
 *
 * assertEquals(encodeZ85t(new Uint8Array()), "");
 *
 * // https://rfc.zeromq.org/spec/32 test case:
 * assertEquals(encodeZ85t(Uint8Array.fromHex("864FD26FB559F75B")), "HelloWorld");
 *
 * // Roundtrips:
 * const repeat = (s: string, n: number) => Array.from({ length: n }, (_, i) => s.repeat(i + 1));
 *
 * const testCases = [
 *   ...repeat("FF", 10),
 *   ...repeat("00", 10),
 *   ...repeat("F0", 10),
 *   ...repeat("0F", 10),
 * ];
 *
 * for (const hex of testCases) {
 *   const bytes = Uint8Array.fromHex(hex);
 *   const encoded = encodeZ85t(bytes);
 *
 *   assertEquals(decodeZ85t(encoded), bytes, `0x${hex} vs ${encoded}`);
 * }
 * ```
 */
export function encode(buffer: ArrayLike<number>): string {
  const length = buffer.length;
  const remainder = length % 4;
  const wholeLength = length - remainder;

  let result = "";

  // Encode whole chunks.
  for (let i = 0; i < wholeLength; i += 4) {
    result += encodeChunk(
      ((buffer[i] << 24) |
        (buffer[i + 1] << 16) |
        (buffer[i + 2] << 8) |
        buffer[i + 3]) >>> 0,
    );
  }

  if (remainder !== 0) {
    // Encode tail.
    let value = buffer[wholeLength] << 24;

    switch (remainder) {
      case 2:
        value |= buffer[wholeLength + 1] << 16;
        break;
      case 3:
        value |= (buffer[wholeLength + 1] << 16) |
          (buffer[wholeLength + 2] << 8);
        break;
    }

    result += encodeChunk(value >>> 0).slice(0, remainder + 1);
  }

  return result;
}

/**
 * Decodes a {@link encodeZ85t Z85t} string to a byte buffer.
 *
 * @throws TypeError if the input is not a string.
 * @throws Error if the input is invalid (invalid length, characters, or chunks) or non-canonical.
 *
 * ### Examples
 *
 * ```ts
 * import { assertEquals } from "jsr:@std/assert/equals";
 *
 * assertEquals(decodeZ85t(""), new Uint8Array());
 *
 * const toHex = (bytes: Uint8Array) => bytes.toHex().toUpperCase();
 *
 * // https://rfc.zeromq.org/spec/32 test case:
 * assertEquals(toHex(decodeZ85t("HelloWorld")), "864FD26FB559F75B");
 * ```
 *
 * Invalid inputs:
 *
 * ```ts
 * import { assertThrows } from "jsr:@std/assert/throws";
 *
 * assertThrows(() => decodeZ85t("  "), Error, "invalid character in input");
 * assertThrows(() => decodeZ85t("\x00\x00"), Error, "invalid character in input");
 *
 * assertThrows(() => decodeZ85t("0"), Error, "invalid input length");
 * assertThrows(() => decodeZ85t("000000"), Error, "invalid input length");
 *
 * assertThrows(() => decodeZ85t("#####"), Error, "input chunk value out of range");
 * assertThrows(() => decodeZ85t("####"), Error, "input chunk value out of range");
 * assertThrows(() => decodeZ85t("###"), Error, "input chunk value out of range");
 * assertThrows(() => decodeZ85t("##"), Error, "input chunk value out of range");
 * ```
 *
 * Non-canonical inputs:
 *
 * ```ts
 * import { assertEquals, assertThrows } from "jsr:@std/assert";
 *
 * // "00" and "01" both decode to 0x00:
 * // - "00" -> (decodeChunk2() = 0x095eec) >>> 24 = 0
 * // - "01" -> (decodeChunk2() = 0x12bdd9) >>> 24 = 0
 * //
 * // But "00" is the canonical version:
 * assertEquals(encodeZ85t(new Uint8Array([0x00])), "00");
 * assertEquals(decodeZ85t("00"), new Uint8Array([0x00]));
 *
 * assertThrows(() => decodeZ85t("01"), Error, "non-canonical input");
 *
 * // "@@", "@%", "@#" all decode to 0xFF:
 * // - "@@" -> (decodeChunk2() = 0xff0663ea) >>> 24 = 0xFF
 * // - "@%" -> (decodeChunk2() = 0xff0fc2d7) >>> 24 = 0xFF
 * // - "@#" -> (decodeChunk2() = 0xff2280b1) >>> 24 = 0xFF
 * //
 * // But "@@" is the canonical version:
 * assertEquals(encodeZ85t(new Uint8Array([0xFF])), "@@");
 * assertEquals(decodeZ85t("@@"), new Uint8Array([0xFF]));
 *
 * assertThrows(() => decodeZ85t("@%"), Error, "non-canonical input");
 * assertThrows(() => decodeZ85t("@#"), Error, "non-canonical input");
 *
 * // 2-byte tail:
 * assertEquals(encodeZ85t(new Uint8Array([0xFF, 0xFF])), "%nJ");
 * assertEquals(decodeZ85t("%nJ"), new Uint8Array([0xFF, 0xFF]));
 * assertThrows(() => decodeZ85t("%nK"), Error, "non-canonical input");
 *
 * assertEquals(encodeZ85t(new Uint8Array([0x00, 0x00])), "000");
 * assertThrows(() => decodeZ85t("001"), Error, "non-canonical input");
 *
 * // 3-byte tail:
 * assertEquals(encodeZ85t(new Uint8Array([0xFF, 0xFF, 0xFF])), "%nS9");
 * assertEquals(decodeZ85t("%nS9"), new Uint8Array([0xFF, 0xFF, 0xFF]));
 * assertThrows(() => decodeZ85t("%nSa"), Error, "non-canonical input");
 *
 * assertEquals(encodeZ85t(new Uint8Array([0x00, 0x00, 0x00])), "0000");
 * assertThrows(() => decodeZ85t("0001"), Error, "non-canonical input");
 * ```
 */
export function decode(string: string): Uint8Array<ArrayBuffer> {
  if (typeof string !== "string") throw new TypeError("input must be a string");

  const length = string.length;
  const tailChars = length % 5;
  if (tailChars === 1) throw new Error("invalid input length");

  const tailBytes = tailChars === 0 ? 0 : tailChars - 1;
  const wholeLength = length - tailChars;
  const result = new Uint8Array(wholeLength / 5 * 4 + tailBytes);

  // Decode whole chunks.
  let outputOffset = 0;

  for (let i = 0; i < wholeLength; i += 5) {
    const number = decodeChunk5(string, i);
    if (number > U32_MAX) throw new Error("input chunk value out of range");

    result[outputOffset] = number >>> 24;
    result[outputOffset + 1] = (number >> 16) & 0xFF;
    result[outputOffset + 2] = (number >> 8) & 0xFF;
    result[outputOffset + 3] = number & 0xFF;

    outputOffset += 4;
  }

  if (tailBytes !== 0) {
    // Decode tail.
    let number = 0;
    let mask = 0;
    let pow = 0;

    switch (tailBytes) {
      case 1:
        number = decodeChunk2(string, wholeLength);
        result[outputOffset] = number >>> 24;
        mask = 0x00FF_FFFF;
        pow = 85 * 85 * 85;
        break;
      case 2:
        number = decodeChunk3(string, wholeLength);
        result[outputOffset] = number >>> 24;
        result[outputOffset + 1] = (number >> 16) & 0xFF;
        mask = 0x0000_FFFF;
        pow = 85 * 85;
        break;
      case 3:
        number = decodeChunk4(string, wholeLength);
        result[outputOffset] = number >>> 24;
        result[outputOffset + 1] = (number >> 16) & 0xFF;
        result[outputOffset + 2] = (number >> 8) & 0xFF;
        mask = 0x0000_00FF;
        pow = 85;
        break;
    }
    if (number > U32_MAX) throw new Error("input chunk value out of range");

    // Check that tail is canonical.
    if ((number & mask) >= pow) throw new Error("non-canonical input");
  }

  return result;
}

// -------------------------------------------------------------------------------------------------
// MARK: Implementation

const U32_MAX = 0xFFFF_FFFF;

/** Encodes a 4-byte unsigned chunk into a 5-character string. */
function encodeChunk(u32: number): string {
  const e = ENCODE_TABLE[u32 % 85];
  u32 = (u32 / 85) | 0;
  const d = ENCODE_TABLE[u32 % 85];
  u32 = (u32 / 85) | 0;
  const c = ENCODE_TABLE[u32 % 85];
  u32 = (u32 / 85) | 0;
  const b = ENCODE_TABLE[u32 % 85];
  u32 = (u32 / 85) | 0;
  const a = ENCODE_TABLE[u32 % 85];

  return a + b + c + d + e;
}

/** Returns the value of the chunk at `string[i..<i+5]`. */
function decodeChunk5(string: string, i: number): number {
  const a = DECODE_TABLE[string.charCodeAt(i)] ?? 0xFF;
  const b = DECODE_TABLE[string.charCodeAt(i + 1)] ?? 0xFF;
  const c = DECODE_TABLE[string.charCodeAt(i + 2)] ?? 0xFF;
  const d = DECODE_TABLE[string.charCodeAt(i + 3)] ?? 0xFF;
  const e = DECODE_TABLE[string.charCodeAt(i + 4)] ?? 0xFF;

  // Check that we didn't encounter any invalid character.
  if ((a | b | c | d | e) & 0x80) throw new Error("invalid character in input");

  return (((a * 85 + b) * 85 + c) * 85 + d) * 85 + e;
}
/** Returns the value of the chunk at `string[i..<i+4]`. */
function decodeChunk4(string: string, i: number): number {
  const a = DECODE_TABLE[string.charCodeAt(i)] ?? 0xFF;
  const b = DECODE_TABLE[string.charCodeAt(i + 1)] ?? 0xFF;
  const c = DECODE_TABLE[string.charCodeAt(i + 2)] ?? 0xFF;
  const d = DECODE_TABLE[string.charCodeAt(i + 3)] ?? 0xFF;
  const e = 84;

  if ((a | b | c | d) & 0x80) throw new Error("invalid character in input");

  return (((a * 85 + b) * 85 + c) * 85 + d) * 85 + e;
}
/** Returns the value of the chunk at `string[i..<i+3]`. */
function decodeChunk3(string: string, i: number): number {
  const a = DECODE_TABLE[string.charCodeAt(i)] ?? 0xFF;
  const b = DECODE_TABLE[string.charCodeAt(i + 1)] ?? 0xFF;
  const c = DECODE_TABLE[string.charCodeAt(i + 2)] ?? 0xFF;
  const d = 84;
  const e = 84;

  if ((a | b | c) & 0x80) throw new Error("invalid character in input");

  return (((a * 85 + b) * 85 + c) * 85 + d) * 85 + e;
}
/** Returns the value of the chunk at `string[i..<i+2]`. */
function decodeChunk2(string: string, i: number): number {
  const a = DECODE_TABLE[string.charCodeAt(i)] ?? 0xFF;
  const b = DECODE_TABLE[string.charCodeAt(i + 1)] ?? 0xFF;
  const c = 84;
  const d = 84;
  const e = 84;

  if ((a | b) & 0x80) throw new Error("invalid character in input");

  return (((a * 85 + b) * 85 + c) * 85 + d) * 85 + e;
}

// -------------------------------------------------------------------------------------------------
// MARK: Constant tables
//
// https://rfc.zeromq.org/spec/32/

// deno-fmt-ignore
const ENCODE_TABLE = `\
0123456789\
abcdefghij\
klmnopqrst\
uvwxyzABCD\
EFGHIJKLMN\
OPQRSTUVWX\
YZ.-:+=^!/\
*?&<>()[]{\
}@%$#`;

/**
 * Maps characters from the {@linkcode ENCODE_TABLE} to their original value, using `0xFF` for
 * invalid characters. Only has 128 bytes (out of range values are also invalid).
 */
// deno-fmt-ignore
const DECODE_TABLE = new Uint8Array([
  // 32 invalid bytes.
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
  0xFF, 0xFF,

  // Actual decode table.
  0xFF, 0x44, 0xFF, 0x54, 0x53, 0x52, 0x48, 0xFF, 0x4B, 0x4C,
  0x46, 0x41, 0xFF, 0x3F, 0x3E, 0x45, 0x00, 0x01, 0x02, 0x03,
  0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x40, 0xFF, 0x49, 0x42,
  0x4A, 0x47, 0x51, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A,
  0x2B, 0x2C, 0x2D, 0x2E, 0x2F, 0x30, 0x31, 0x32, 0x33, 0x34,
  0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, 0x4D,
  0xFF, 0x4E, 0x43, 0xFF, 0xFF, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E,
  0x0F, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
  0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F, 0x20, 0x21, 0x22,
  0x23, 0x4F, 0xFF, 0x50, 0xFF, 0xFF,
]);
