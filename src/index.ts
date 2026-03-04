/**
 * numradix — Number base conversion toolkit.
 * Supports bases 2–36, BigInt precision, custom alphabets, and output formatting.
 * Zero dependencies. TypeScript-first. Works in browser and Node.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Accepted input types for all conversion functions. */
export type NumberInput = string | number | bigint

/** Options for the `format` function. */
export interface FormatOptions {
  /** Prefix to prepend (e.g. `'0x'`, `'0b'`, `'0o'`). */
  prefix?: string
  /** Split digits into groups of this size (right-to-left). */
  groupSize?: number
  /** Separator placed between groups. Defaults to `' '`. */
  separator?: string
  /** Convert letters in the result to uppercase. */
  uppercase?: boolean
  /** Pad the result with leading zeros to reach this total length. */
  padStart?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

// Fast lookup table for digit values of ASCII characters in `DIGITS`.
// Non-digit characters are mapped to -1.
const DIGIT_TABLE: number[] = (() => {
  const table = new Array<number>(128).fill(-1)

  // '0'–'9'
  for (let i = 0; i < 10; i++) {
    table[48 + i] = i
  }

  // 'a'–'z'
  for (let i = 0; i < 26; i++) {
    table[97 + i] = 10 + i
  }

  return table
})()

/** Preset alphabets for use with `encodeCustom` / `decodeCustom`. */
export const ALPHABETS = {
  /** 62 characters: digits + lowercase + uppercase. */
  BASE62: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  /** 58 characters: Base62 minus visually ambiguous chars `0`, `O`, `I`, `l` (Bitcoin-style). */
  BASE58: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  /** URL-safe Base64 alphabet (no padding). */
  BASE64URL: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
} as const

// ─── Internal helpers ─────────────────────────────────────────────────────────

function assertBase(base: number): void {
  if (!Number.isInteger(base) || base < 2 || base > 36) {
    throw new RangeError(`Base must be an integer between 2 and 36, got ${base}`)
  }
}

function inputToBigInt(value: NumberInput, base: number): bigint {
  if (typeof value === 'bigint') return value

  if (typeof value === 'number') {
    if (!Number.isInteger(value)) throw new TypeError('Floating-point numbers are not supported')
    if (value < 0) throw new RangeError('Negative numbers are not supported')
    return BigInt(value)
  }

  const str = value.trim().toLowerCase()
  if (str === '') throw new Error('Input string must not be empty')
  if (str === '0') return 0n

  const bigBase = BigInt(base)
  let result = 0n

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    const digit = code < DIGIT_TABLE.length ? DIGIT_TABLE[code] : -1
    if (digit < 0 || digit >= base) {
      const char = str[i]
      throw new Error(`Invalid character '${char}' for base ${base}`)
    }
    result = result * bigBase + BigInt(digit)
  }

  return result
}

function bigIntToBase(value: bigint, base: number): string {
  if (value < 0n) throw new RangeError('Negative numbers are not supported')
  if (value === 0n) return '0'

  const bigBase = BigInt(base)
  let result = ''
  let n = value

  while (n > 0n) {
    result = DIGITS[Number(n % bigBase)] + result
    n /= bigBase
  }

  return result
}

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Convert a number from one base to another.
 * Handles arbitrarily large integers via BigInt — no precision loss.
 *
 * @param value  - The number to convert (string, number, or bigint).
 * @param fromBase - The base of the input value (2–36).
 * @param toBase   - The target base (2–36).
 * @returns The converted number as a lowercase string.
 *
 * @example
 * convert('ff', 16, 10)     // '255'
 * convert('255', 10, 2)     // '11111111'
 * convert('777', 8, 16)     // '1ff'
 */
export function convert(value: NumberInput, fromBase: number, toBase: number): string {
  assertBase(fromBase)
  assertBase(toBase)
  return bigIntToBase(inputToBigInt(value, fromBase), toBase)
}

/**
 * Check whether a string is a valid number in the given base.
 *
 * @example
 * isValid('ff', 16)   // true
 * isValid('fg', 16)   // false
 * isValid('1010', 2)  // true
 */
export function isValid(value: string, base: number): boolean {
  if (!Number.isInteger(base) || base < 2 || base > 36) return false
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (trimmed === '') return false
  const lower = trimmed.toLowerCase()

  for (let i = 0; i < lower.length; i++) {
    const code = lower.charCodeAt(i)
    const digit = code < DIGIT_TABLE.length ? DIGIT_TABLE[code] : -1
    if (digit < 0 || digit >= base) return false
  }

  return true
}

// ─── Shorthands ───────────────────────────────────────────────────────────────

/**
 * Convert a number to binary (base 2).
 * @param value    - Input value.
 * @param fromBase - Base of the input. Defaults to `10`.
 *                   Ignored when `value` is `number` or `bigint`.
 *
 * @example
 * toBin(255)           // '11111111'
 * toBin('ff', 16)      // '11111111'
 */
export function toBin(value: NumberInput, fromBase = 10): string {
  return convert(value, fromBase, 2)
}

/**
 * Convert a number to octal (base 8).
 * @param value    - Input value.
 * @param fromBase - Base of the input. Defaults to `10`.
 *                   Ignored when `value` is `number` or `bigint`.
 *
 * @example
 * toOct(255)       // '377'
 * toOct('ff', 16)  // '377'
 */
export function toOct(value: NumberInput, fromBase = 10): string {
  return convert(value, fromBase, 8)
}

/**
 * Convert a number to decimal (base 10).
 * @param value    - Input value.
 * @param fromBase - Base of the input.
 *                   Ignored when `value` is `number` or `bigint`.
 *
 * @example
 * toDec('ff', 16)       // '255'
 * toDec('11111111', 2)  // '255'
 */
export function toDec(value: NumberInput, fromBase: number): string {
  return convert(value, fromBase, 10)
}

/**
 * Convert a number to hexadecimal (base 16).
 * @param value    - Input value.
 * @param fromBase - Base of the input. Defaults to `10`.
 *                   Ignored when `value` is `number` or `bigint`.
 *
 * @example
 * toHex(255)            // 'ff'
 * toHex('11111111', 2)  // 'ff'
 */
export function toHex(value: NumberInput, fromBase = 10): string {
  return convert(value, fromBase, 16)
}

// ─── BigInt helpers ───────────────────────────────────────────────────────────

/**
 * Parse a string in the given base and return a `bigint`.
 * Safe for numbers of any size.
 *
 * @example
 * parseBigInt('ff', 16)   // 255n
 * parseBigInt('zzz', 36)  // 46655n
 */
export function parseBigInt(value: string, base: number): bigint {
  assertBase(base)
  return inputToBigInt(value, base)
}

/**
 * Convert a `bigint` to a string in the given base.
 *
 * @example
 * stringifyBigInt(255n, 16)  // 'ff'
 * stringifyBigInt(255n, 2)   // '11111111'
 */
export function stringifyBigInt(value: bigint, toBase: number): string {
  assertBase(toBase)
  return bigIntToBase(value, toBase)
}

// ─── Custom alphabets ─────────────────────────────────────────────────────────

type AlphabetMap = { [char: string]: number | undefined }

type AlphabetInfo = {
  base: bigint
  charToValue: AlphabetMap
}

const alphabetCache = new Map<string, AlphabetInfo>()

function getAlphabetInfo(alphabet: string): AlphabetInfo {
  let info = alphabetCache.get(alphabet)
  if (info) return info

  if (alphabet.length < 2) {
    throw new Error('Alphabet must contain at least 2 characters')
  }

  const charToValue: AlphabetMap = Object.create(null)

  for (let i = 0; i < alphabet.length; i++) {
    const ch = alphabet[i]
    if (charToValue[ch] !== undefined) {
      throw new Error('Alphabet must not contain duplicate characters')
    }
    charToValue[ch] = i
  }

  info = {
    base: BigInt(alphabet.length),
    charToValue,
  }

  alphabetCache.set(alphabet, info)
  return info
}

/**
 * Encode a non-negative integer using a custom alphabet.
 * The index of each character in the alphabet defines its digit value.
 * Use `ALPHABETS` for common presets (Base58, Base62, Base64URL).
 *
 * When `value` is a `string`, it must be a valid **decimal** integer string.
 * To encode a value from another base (e.g. hex), parse it first:
 * `encodeCustom(parseBigInt('ff', 16), ALPHABETS.BASE62)`
 *
 * @example
 * encodeCustom(1337n, ALPHABETS.BASE62)  // 'LZ'
 * encodeCustom(255n, '0123456789ABCDEF') // 'FF'
 */
export function encodeCustom(value: NumberInput, alphabet: string): string {
  const { base } = getAlphabetInfo(alphabet)

  let n: bigint
  if (typeof value === 'bigint') n = value
  else if (typeof value === 'number') n = BigInt(value)
  else n = BigInt(value)

  if (n < 0n) throw new RangeError('Negative numbers are not supported')
  if (n === 0n) return alphabet[0]

  let result = ''

  while (n > 0n) {
    result = alphabet[Number(n % base)] + result
    n /= base
  }

  return result
}

/**
 * Decode a string encoded with a custom alphabet back to a `bigint`.
 *
 * @example
 * decodeCustom('LZ', ALPHABETS.BASE62)  // 1337n
 */
export function decodeCustom(value: string, alphabet: string): bigint {
  if (value.length === 0) throw new Error('Input string must not be empty')

  const { base, charToValue } = getAlphabetInfo(alphabet)
  let result = 0n

  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    const digit = charToValue[char]
    if (digit === undefined) throw new Error(`Character '${char}' not found in the alphabet`)
    result = result * base + BigInt(digit)
  }

  return result
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Format a base-converted string: add prefix, group digits, pad, or change case.
 *
 * @example
 * format('11111111', { prefix: '0b', groupSize: 4, separator: '_' })
 * // '0b1111_1111'
 *
 * format('ff', { prefix: '0x', uppercase: true, padStart: 4 })
 * // '0x00FF'
 */
export function format(value: string, options: FormatOptions = {}): string {
  const { prefix = '', groupSize, separator = ' ', uppercase = false, padStart } = options

  let result = uppercase ? value.toUpperCase() : value

  if (padStart !== undefined && result.length < padStart) {
    result = result.padStart(padStart, '0')
  }

  if (groupSize !== undefined && groupSize > 0) {
    const groups: string[] = []
    for (let i = result.length; i > 0; i -= groupSize) {
      groups.unshift(result.slice(Math.max(0, i - groupSize), i))
    }
    result = groups.join(separator)
  }

  return prefix + result
}
