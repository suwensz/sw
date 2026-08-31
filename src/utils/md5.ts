/**
 * 极简 MD5（UTF-8）实现。
 * 用途：在浏览器端复现淘宝 TOP / 京东 JOS / 拼多多开放平台的签名算法，用于接入联调与自测。
 * 注意：仅用于生成 / 校验开放平台要求的签名摘要，不可用于密码等安全加密场景。
 */

const ROTATE = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

/** K[i] = floor(abs(sin(i + 1)) * 2^32) */
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296))

function leftRotate(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0
}

/** 32 位寄存器按小端字节序输出 8 位十六进制 */
function toHex(n: number): string {
  let out = ''
  for (let i = 0; i < 4; i += 1) out += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, '0')
  return out
}

export function md5(input: string): string {
  const bytes = new TextEncoder().encode(input)
  const bitLen = bytes.length * 8

  // 填充：0x80 + 若干个 0x00，使长度 ≡ 56 (mod 64)，再追加 8 字节小端长度
  const padLen = ((56 - ((bytes.length + 1) % 64)) + 64) % 64
  const total = bytes.length + 1 + padLen + 8
  const buf = new Uint8Array(total)
  buf.set(bytes)
  buf[bytes.length] = 0x80

  const view = new DataView(buf.buffer)
  view.setUint32(total - 8, bitLen >>> 0, true)
  view.setUint32(total - 4, Math.floor(bitLen / 4294967296), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let offset = 0; offset < total; offset += 64) {
    const m = new Uint32Array(16)
    for (let j = 0; j < 16; j += 1) m[j] = view.getUint32(offset + j * 4, true)

    let a = a0
    let b = b0
    let c = c0
    let d = d0

    for (let j = 0; j < 64; j += 1) {
      let f: number
      let g: number
      if (j < 16) {
        f = (b & c) | (~b & d)
        g = j
      } else if (j < 32) {
        f = (d & b) | (~d & c)
        g = (5 * j + 1) % 16
      } else if (j < 48) {
        f = b ^ c ^ d
        g = (3 * j + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * j) % 16
      }
      const next = d
      d = c
      c = b
      const sum = (a + f + K[j]! + m[g]!) >>> 0
      b = (b + leftRotate(sum, ROTATE[j]!)) >>> 0
      a = next
    }

    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
  }

  return [a0, b0, c0, d0].map(toHex).join('')
}
