// Byte-level helpers for the Nexus 61S protocol.
// All packets are 64 bytes; the first byte of sendReport is the report id (0).

/** 16-bit little-endian pair */
export const u16le = (n) => [n & 255, (n >> 8) & 255];

/** 32-bit little-endian quad */
export const u32le = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255];

/** assemble from [lo, hi] */
export const fromLe = ([lo, hi]) => (lo & 255) | ((hi & 255) << 8);

export const sum8 = (bytes) => bytes.reduce((a, b) => a + (b & 255), 0) & 255;

/** checksum for memory reads: (addrLo + addrHi + len) & 255 */
export const readChecksum = (addr, len) => {
    const [lo, hi] = u16le(addr);
    return (lo + hi + len) & 255;
};

/** pad a command+args list into a 64-byte report body */
export const packReport = (cmd, args = []) => {
    const out = new Uint8Array(64);
    out[0] = cmd & 255;
    for (let i = 0; i < args.length && i < 63; i++) out[i + 1] = args[i] & 255;
    return out;
};

/** split data into <=size chunks (official driver uses 56 for mem writes, 32 for rom) */
export function chunkData(data, size) {
    const chunks = [];
    for (let i = 0; i < data.length; i += size) chunks.push(data.slice(i, i + size));
    return chunks;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
