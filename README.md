# numradix

> Number base conversion toolkit — bases 2–36, BigInt precision, custom alphabets. Zero dependencies. TypeScript-first.

[![npm](https://img.shields.io/npm/v/numradix)](https://www.npmjs.com/package/numradix)
[![license](https://img.shields.io/npm/l/numradix)](./LICENSE)
[![build](https://img.shields.io/github/actions/workflow/status/MaxGrushevsky/numradix/ci.yml)](https://github.com/MaxGrushevsky/numradix/actions)

## Features

- Convert between **any bases from 2 to 36** — binary, octal, decimal, hex, base36 and everything in between
- **No precision loss** — uses `BigInt` internally, handles arbitrarily large numbers
- Convenient shorthands: `toBin`, `toOct`, `toDec`, `toHex`
- **Custom alphabets** — Base58, Base62, Base64URL or your own
- **Output formatting** — prefix (`0x`, `0b`), digit grouping, padding, uppercase
- Written in **TypeScript** — ships with full type declarations
- **Zero runtime dependencies**
- Works in Node.js, Deno, Bun, and modern browsers
- ESM + CommonJS dual build

## Install

```bash
npm install numradix
# or
pnpm add numradix
# or
yarn add numradix
```

## Usage

```ts
import { convert, toBin, toHex, format, isValid } from 'numradix'

// Core conversion
convert('ff', 16, 10)        // '255'
convert('255', 10, 2)        // '11111111'
convert('777', 8, 16)        // '1ff'

// Shorthands
toBin(255)                   // '11111111'
toBin('ff', 16)              // '11111111'
toHex(255)                   // 'ff'
toHex('11111111', 2)         // 'ff'

// Validation
isValid('ff', 16)            // true
isValid('fg', 16)            // false

// Formatting
format(toHex(255), { prefix: '0x', uppercase: true, padStart: 4 })
// '0x00FF'

format(toBin(255), { prefix: '0b', groupSize: 4, separator: '_' })
// '0b1111_1111'
```

CommonJS (require) is also supported:

```js
const { convert, toHex } = require('numradix')

convert('ff', 16, 10)  // '255'
toHex(255)             // 'ff'
```

## API

### `convert(value, fromBase, toBase)`

Convert a number from one base to another. Accepts `string`, `number`, or `bigint`.
For `number` and `bigint` inputs, `fromBase` is ignored — the value is used as-is.

```ts
convert(value: string | number | bigint, fromBase: number, toBase: number): string
```

```ts
convert('ff', 16, 10)          // '255'
convert('255', 10, 2)          // '11111111'
convert(255, 10, 16)           // 'ff'
convert(255n, 10, 2)           // '11111111'

// No precision loss on large numbers
convert('9007199254740993', 10, 16)   // '20000000000001'
```

Throws `RangeError` if base is not an integer between 2 and 36.
Throws `Error` if the string contains a character invalid for the given base.

### Shorthands

| Function | Converts to | Default `fromBase` |
|---|---|---|
| `toBin(value, fromBase?)` | Binary (base 2) | 10 |
| `toOct(value, fromBase?)` | Octal (base 8) | 10 |
| `toDec(value, fromBase)` | Decimal (base 10) | — |
| `toHex(value, fromBase?)` | Hex (base 16) | 10 |

```ts
toBin(255)            // '11111111'
toBin('ff', 16)       // '11111111'
toOct(255)            // '377'
toDec('ff', 16)       // '255'
toHex(255)            // 'ff'
```

### `isValid(value, base)`

Check whether a string is a valid number in the given base. Trims leading/trailing whitespace before checking.

```ts
isValid('ff', 16)      // true
isValid('fg', 16)      // false
isValid(' 1010 ', 2)   // true
isValid('', 10)        // false
```

### `parseBigInt(value, base)` / `stringifyBigInt(value, base)`

Convert between string representations and native `bigint`.

```ts
parseBigInt('ff', 16)                    // 255n
parseBigInt('ffffffffffffffff', 16)      // 18446744073709551615n

stringifyBigInt(255n, 16)               // 'ff'
stringifyBigInt(255n, 2)                // '11111111'
```

### `encodeCustom(value, alphabet)` / `decodeCustom(value, alphabet)`

Encode and decode integers using a custom character alphabet.
Use `ALPHABETS` for common presets.

> When `value` is a string, it must be a **decimal** integer string.
> For other bases, parse first: `encodeCustom(parseBigInt('ff', 16), ALPHABETS.BASE62)`

```ts
import { encodeCustom, decodeCustom, ALPHABETS } from 'numradix'

encodeCustom(1337n, ALPHABETS.BASE62)           // 'LZ'
decodeCustom('LZ', ALPHABETS.BASE62)            // 1337n

encodeCustom(255n, '0123456789ABCDEF')          // 'FF'
decodeCustom('FF', '0123456789ABCDEF')          // 255n
```

#### `ALPHABETS`

| Key | Description | Use case |
|---|---|---|
| `ALPHABETS.BASE62` | `0-9 a-z A-Z` (62 chars) | Short IDs, URL tokens |
| `ALPHABETS.BASE58` | Base62 without `0 O I l` (58 chars) | Bitcoin addresses, QR codes |
| `ALPHABETS.BASE64URL` | `A-Z a-z 0-9 - _` (64 chars) | URL-safe encoding, JWT |

### `format(value, options?)`

Format a converted number string — add prefix, group digits, pad, or change case.

```ts
format('11111111', { prefix: '0b', groupSize: 4, separator: '_' })
// '0b1111_1111'

format('ff', { prefix: '0x', uppercase: true, padStart: 4 })
// '0x00FF'

format('deadbeef', { uppercase: true, groupSize: 4, separator: ' ' })
// 'DEAD BEEF'
```

| Option | Type | Default | Description |
|---|---|---|---|
| `prefix` | `string` | `''` | String to prepend (e.g. `'0x'`, `'0b'`) |
| `groupSize` | `number` | — | Split digits into groups of N (right-to-left) |
| `separator` | `string` | `' '` | Character between groups |
| `uppercase` | `boolean` | `false` | Convert letters to uppercase |
| `padStart` | `number` | — | Minimum digit count, padded with `'0'` |

## BigInt and precision

JavaScript `number` can only represent integers exactly up to `2^53 − 1`. This library uses `BigInt` for all internal computations, so there is no precision loss regardless of input size.

```ts
// Standard JS loses precision here:
Number('9007199254740993') === Number('9007199254740992')  // true — wrong!

// numradix is accurate:
convert('9007199254740993', 10, 16)  // '20000000000001'
convert('20000000000001', 16, 10)    // '9007199254740993' ✓
```

> **Note:** if you pass a `number` (not a string) beyond `Number.MAX_SAFE_INTEGER`,
> precision is already lost before the library sees it. Use a `string` or `bigint` for large values.

## Development

```bash
git clone https://github.com/MaxGrushevsky/numradix.git
cd numradix
npm install

npm run build         # compile to dist/
npm test              # run tests once
npm run test:watch    # run tests in watch mode
npm run typecheck     # TypeScript type-check only
```

## License

[MIT](./LICENSE)
