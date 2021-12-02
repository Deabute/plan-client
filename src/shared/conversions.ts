// conversions ~ copyright 2021 Paul Beaudet MIT Licence

// Pre-Init
const HEX_LUT_4b: string[] = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
];

const HEX_LUT_8b: string[] = new Array(0x100);

const SEPARATION_LUT: number[] = [3, 7, 11, 15, 19, 23, 27];

for (let n = 0; n < 0x100; n++) {
  HEX_LUT_8b[n] = `${HEX_LUT_4b[(n >>> 4) & 0xf]}${HEX_LUT_4b[n & 0xf]}`;
}
// End Pre-Init

const toHex = (buffer: number[]): string => {
  let out = '';
  for (let idx = 0, edx = buffer.length; idx < edx; idx++) {
    out += HEX_LUT_8b[buffer[idx]];
  }
  return out;
};

const toDeviceId = (buffer: number[]): string => {
  let out = '';
  let sepIdx = 0;
  for (let idx = 0, edx = buffer.length; idx < edx; idx++) {
    out += HEX_LUT_8b[buffer[idx]];
    if (idx === SEPARATION_LUT[sepIdx]) {
      sepIdx++;
      out += '-';
    }
  }
  return out;
};

const getDeviceId = async (publicKey: CryptoKey): Promise<string> => {
  const pubKeyBuffer = await crypto.subtle.exportKey('raw', publicKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', pubKeyBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return toDeviceId(hashArray);
};

export { toHex, toDeviceId, getDeviceId };
