declare module 'decode-ico' {
  interface DecodedIcoFrame {
    width: number
    height: number
    type: 'png' | 'bmp'
    bit: number
    data: Uint8ClampedArray
  }

  function decodeIco(buffer: Buffer | Uint8Array | ArrayBuffer): DecodedIcoFrame[]

  export = decodeIco
}
