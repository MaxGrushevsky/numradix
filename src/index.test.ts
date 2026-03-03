import { describe, it, expect } from 'vitest'
import {
  convert,
  isValid,
  toBin,
  toOct,
  toDec,
  toHex,
  parseBigInt,
  stringifyBigInt,
  encodeCustom,
  decodeCustom,
  format,
  ALPHABETS,
} from './index'

// ─── convert ──────────────────────────────────────────────────────────────────

describe('convert', () => {
  it('converts decimal to binary', () => {
    expect(convert('255', 10, 2)).toBe('11111111')
    expect(convert('0', 10, 2)).toBe('0')
    expect(convert('1', 10, 2)).toBe('1')
  })

  it('converts binary to decimal', () => {
    expect(convert('11111111', 2, 10)).toBe('255')
    expect(convert('0', 2, 10)).toBe('0')
  })

  it('converts decimal to hex', () => {
    expect(convert('255', 10, 16)).toBe('ff')
    expect(convert('16', 10, 16)).toBe('10')
    expect(convert('0', 10, 16)).toBe('0')
  })

  it('converts hex to decimal', () => {
    expect(convert('ff', 16, 10)).toBe('255')
    expect(convert('FF', 16, 10)).toBe('255')
    expect(convert('10', 16, 10)).toBe('16')
  })

  it('converts octal to decimal', () => {
    expect(convert('377', 8, 10)).toBe('255')
    expect(convert('10', 8, 10)).toBe('8')
  })

  it('converts decimal to octal', () => {
    expect(convert('255', 10, 8)).toBe('377')
    expect(convert('8', 10, 8)).toBe('10')
  })

  it('converts between non-decimal bases', () => {
    expect(convert('ff', 16, 2)).toBe('11111111')
    expect(convert('11111111', 2, 16)).toBe('ff')
    expect(convert('377', 8, 16)).toBe('ff')
  })

  it('accepts number input', () => {
    expect(convert(255, 10, 16)).toBe('ff')
    expect(convert(255, 10, 2)).toBe('11111111')
  })

  it('accepts bigint input', () => {
    expect(convert(255n, 10, 16)).toBe('ff')
  })

  it('handles very large numbers without precision loss', () => {
    const big = '9007199254740993' // Number.MAX_SAFE_INTEGER + 2
    const hex = convert(big, 10, 16)
    expect(convert(hex, 16, 10)).toBe(big)
  })

  it('handles extremely large numbers', () => {
    const big = '123456789012345678901234567890'
    const bin = convert(big, 10, 2)
    expect(convert(bin, 2, 10)).toBe(big)
  })

  it('throws on invalid base', () => {
    expect(() => convert('1', 1, 10)).toThrow(RangeError)
    expect(() => convert('1', 10, 37)).toThrow(RangeError)
    expect(() => convert('1', 10, 1.5)).toThrow(RangeError)
  })

  it('throws on invalid character for base', () => {
    expect(() => convert('2', 2, 10)).toThrow()
    expect(() => convert('g', 16, 10)).toThrow()
  })

  it('handles numeric zero input', () => {
    expect(convert(0, 10, 2)).toBe('0')
    expect(convert(0, 10, 16)).toBe('0')
  })

  it('throws on negative number input', () => {
    expect(() => convert(-1, 10, 2)).toThrow(RangeError)
  })

  it('throws on negative bigint input', () => {
    expect(() => convert(-1n, 10, 2)).toThrow(RangeError)
  })

  it('throws on floating-point number input', () => {
    expect(() => convert(3.14, 10, 2)).toThrow(TypeError)
  })

  it('throws on empty string input', () => {
    expect(() => convert('', 10, 2)).toThrow()
    expect(() => convert('   ', 10, 2)).toThrow()
  })

  it('fromBase is ignored for number and bigint inputs', () => {
    // number 255 is always decimal 255 — fromBase has no effect
    expect(convert(255, 16, 10)).toBe('255')
    expect(convert(255n, 16, 10)).toBe('255')
    // string '255' IS affected by fromBase
    expect(convert('255', 16, 10)).toBe('597')
  })

  it('works with base 36', () => {
    expect(convert('z', 36, 10)).toBe('35')
    expect(convert('35', 10, 36)).toBe('z')
    expect(convert('zz', 36, 10)).toBe('1295')
  })
})

// ─── isValid ──────────────────────────────────────────────────────────────────

describe('isValid', () => {
  it('validates binary strings', () => {
    expect(isValid('1010', 2)).toBe(true)
    expect(isValid('1012', 2)).toBe(false)
    expect(isValid('', 2)).toBe(false)
  })

  it('validates hex strings', () => {
    expect(isValid('deadbeef', 16)).toBe(true)
    expect(isValid('DEADBEEF', 16)).toBe(true)
    expect(isValid('xyz', 16)).toBe(false)
  })

  it('validates decimal strings', () => {
    expect(isValid('12345', 10)).toBe(true)
    expect(isValid('123a5', 10)).toBe(false)
  })

  it('returns false for invalid base', () => {
    expect(isValid('101', 1)).toBe(false)
    expect(isValid('101', 37)).toBe(false)
  })

  it('validates zero', () => {
    expect(isValid('0', 2)).toBe(true)
    expect(isValid('0', 10)).toBe(true)
    expect(isValid('0', 16)).toBe(true)
  })

  it('returns false for whitespace-only string', () => {
    expect(isValid('   ', 10)).toBe(false)
  })

  it('trims leading/trailing spaces consistently with convert', () => {
    expect(isValid(' ff ', 16)).toBe(true)
    expect(isValid(' 11111111 ', 2)).toBe(true)
    expect(isValid(' 255 ', 10)).toBe(true)
  })
})

// ─── Shorthands ───────────────────────────────────────────────────────────────

describe('toBin', () => {
  it('converts decimal to binary', () => {
    expect(toBin(255)).toBe('11111111')
    expect(toBin('255')).toBe('11111111')
    expect(toBin(0)).toBe('0')
  })

  it('converts from hex to binary', () => {
    expect(toBin('ff', 16)).toBe('11111111')
  })

  it('ignores fromBase for number and bigint inputs', () => {
    expect(toBin(255n, 16)).toBe('11111111')
    expect(toBin(255, 16)).toBe('11111111')
  })
})

describe('toOct', () => {
  it('converts decimal to octal', () => {
    expect(toOct(255)).toBe('377')
    expect(toOct(8)).toBe('10')
  })

  it('converts from hex to octal', () => {
    expect(toOct('ff', 16)).toBe('377')
  })
})

describe('toDec', () => {
  it('converts hex to decimal', () => {
    expect(toDec('ff', 16)).toBe('255')
  })

  it('converts binary to decimal', () => {
    expect(toDec('11111111', 2)).toBe('255')
  })

  it('converts octal to decimal', () => {
    expect(toDec('377', 8)).toBe('255')
  })
})

describe('toHex', () => {
  it('converts decimal to hex', () => {
    expect(toHex(255)).toBe('ff')
    expect(toHex(0)).toBe('0')
    expect(toHex(16)).toBe('10')
  })

  it('converts binary to hex', () => {
    expect(toHex('11111111', 2)).toBe('ff')
  })
})

// ─── BigInt helpers ───────────────────────────────────────────────────────────

describe('parseBigInt', () => {
  it('parses hex to bigint', () => {
    expect(parseBigInt('ff', 16)).toBe(255n)
  })

  it('parses binary to bigint', () => {
    expect(parseBigInt('11111111', 2)).toBe(255n)
  })

  it('parses large numbers correctly', () => {
    expect(parseBigInt('ffffffffffffffff', 16)).toBe(18446744073709551615n)
  })

  it('throws on invalid base', () => {
    expect(() => parseBigInt('ff', 1)).toThrow(RangeError)
    expect(() => parseBigInt('ff', 37)).toThrow(RangeError)
  })
})

describe('stringifyBigInt', () => {
  it('converts bigint to hex', () => {
    expect(stringifyBigInt(255n, 16)).toBe('ff')
  })

  it('converts bigint to binary', () => {
    expect(stringifyBigInt(255n, 2)).toBe('11111111')
  })

  it('converts large bigint', () => {
    expect(stringifyBigInt(18446744073709551615n, 16)).toBe('ffffffffffffffff')
  })

  it('converts zero', () => {
    expect(stringifyBigInt(0n, 2)).toBe('0')
    expect(stringifyBigInt(0n, 16)).toBe('0')
  })

  it('throws on negative bigint', () => {
    expect(() => stringifyBigInt(-1n, 10)).toThrow(RangeError)
  })

  it('throws on invalid base', () => {
    expect(() => stringifyBigInt(255n, 1)).toThrow(RangeError)
  })
})

// ─── Custom alphabets ─────────────────────────────────────────────────────────

describe('encodeCustom / decodeCustom', () => {
  it('encodes and decodes with BASE62', () => {
    const encoded = encodeCustom(1337n, ALPHABETS.BASE62)
    expect(decodeCustom(encoded, ALPHABETS.BASE62)).toBe(1337n)
  })

  it('encodes and decodes with BASE58', () => {
    const encoded = encodeCustom(1337n, ALPHABETS.BASE58)
    expect(decodeCustom(encoded, ALPHABETS.BASE58)).toBe(1337n)
  })

  it('encodes and decodes with BASE64URL', () => {
    const encoded = encodeCustom(123456789n, ALPHABETS.BASE64URL)
    expect(decodeCustom(encoded, ALPHABETS.BASE64URL)).toBe(123456789n)
  })

  it('encodes zero as first character of alphabet', () => {
    expect(encodeCustom(0n, ALPHABETS.BASE62)).toBe('0')
  })

  it('accepts number input', () => {
    const encoded = encodeCustom(1337, ALPHABETS.BASE62)
    expect(decodeCustom(encoded, ALPHABETS.BASE62)).toBe(1337n)
  })

  it('round-trips very large numbers', () => {
    const big = 123456789012345678901234567890n
    const encoded = encodeCustom(big, ALPHABETS.BASE62)
    expect(decodeCustom(encoded, ALPHABETS.BASE62)).toBe(big)
  })

  it('throws on duplicate characters in alphabet', () => {
    expect(() => encodeCustom(1n, 'aab')).toThrow()
  })

  it('throws on unknown character during decode', () => {
    expect(() => decodeCustom('!', ALPHABETS.BASE62)).toThrow()
  })

  it('throws on empty string during decode', () => {
    expect(() => decodeCustom('', ALPHABETS.BASE62)).toThrow()
  })

  it('throws on negative number input', () => {
    expect(() => encodeCustom(-1n, ALPHABETS.BASE62)).toThrow(RangeError)
  })

  it('accepts decimal string input', () => {
    expect(encodeCustom('1337', ALPHABETS.BASE62)).toBe(encodeCustom(1337n, ALPHABETS.BASE62))
  })

  it('encodeCustom + parseBigInt for non-decimal string', () => {
    // hex 'ff' = decimal 255 → encodeCustom via parseBigInt
    expect(encodeCustom(parseBigInt('ff', 16), ALPHABETS.BASE62)).toBe(
      encodeCustom(255n, ALPHABETS.BASE62),
    )
  })
})

// ─── format ───────────────────────────────────────────────────────────────────

describe('format', () => {
  it('adds a prefix', () => {
    expect(format('ff', { prefix: '0x' })).toBe('0xff')
    expect(format('11111111', { prefix: '0b' })).toBe('0b11111111')
  })

  it('converts to uppercase', () => {
    expect(format('deadbeef', { uppercase: true })).toBe('DEADBEEF')
  })

  it('pads with leading zeros', () => {
    expect(format('ff', { padStart: 8 })).toBe('000000ff')
    expect(format('ff', { padStart: 2 })).toBe('ff')
  })

  it('groups digits', () => {
    expect(format('11111111', { groupSize: 4, separator: ' ' })).toBe('1111 1111')
    expect(format('11111111', { groupSize: 4, separator: '_' })).toBe('1111_1111')
  })

  it('handles uneven groups', () => {
    expect(format('101010', { groupSize: 4, separator: ' ' })).toBe('10 1010')
  })

  it('combines all options', () => {
    expect(
      format('ff', {
        prefix: '0x',
        uppercase: true,
        padStart: 8,
        groupSize: 4,
        separator: ' ',
      }),
    ).toBe('0x0000 00FF')
  })

  it('preserves original case by default', () => {
    expect(format('DEADBEEF')).toBe('DEADBEEF')
    expect(format('deadbeef')).toBe('deadbeef')
    expect(format('DeAdBeEf')).toBe('DeAdBeEf')
  })

  it('handles groupSize larger than string length', () => {
    expect(format('ff', { groupSize: 8, separator: ' ' })).toBe('ff')
  })

  it('does not pad when string already meets padStart length', () => {
    expect(format('deadbeef', { padStart: 4 })).toBe('deadbeef')
  })
})
