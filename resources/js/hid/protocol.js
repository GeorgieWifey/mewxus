// Nexus 61S command protocol — extracted verbatim from the official driver bundle.
// Transport: 64-byte HID reports, report id 0. Response payload = bytes [8..63].
// Every sub-command (7/8/9/10/11/12/13/0xA0..0xA7/5/6) owns its own address space.

import { u16le, u32le, sum8, readChecksum, chunkData } from './bytes.js';

export const CMD = {
    MEM: 0x55, // 85 — memory read/write gateway
    BOOT: 0x5f, // 95 — enter bootloader
    RESET: 0xee, // 238
    FAST_ON: 0x01,
    FAST_OFF: 0x02,
    KEY_INFO: 0x06, // raw key-info passthrough (also factory reset with [15,255])
};

export const SUB = {
    INFO: 3,
    BASE: 4,
    CFG_READ: 5,
    CFG_WRITE: 6,
    MATRIX_FACTORY: 7,
    MATRIX_USER: 8,
    MATRIX_WRITE: 9,
    COLOR_READ: 10,
    COLOR_WRITE: 11,
    MACRO_READ: 12,
    MACRO_WRITE: 13,
    RT_READ: 0xa0,
    RT_WRITE: 0xa1,
    DKS_READ: 0xa2,
    DKS_WRITE: 0xa3,
    MT_READ: 0xa4,
    MT_WRITE: 0xa5,
    TGL_READ: 0xa6,
    TGL_WRITE: 0xa7,
    CAL_START: 0xa8,
    CAL_END: 0xa9,
    KEYLIGHT: 0xde,
};

export const EEPROM = {
    LAYER_STRIDE: 512, // bytes per keymap layer
    PROFILE_STRIDE: 2048, // bytes per keymap profile (also macro block size)
    COLOR_STRIDE: 512,
    RT_STRIDE: 1024, // 128 keys x 8 bytes
    DKS_STRIDE: 768, // 32 slots x 24 bytes
    MT_STRIDE: 256,
    TGL_STRIDE: 128,
    CFG_STRIDE: 64,
    SLOTS: 128,
    ADV_SLOTS: 32,
};

export const memRead = (sub, addr, len) => {
    const [lo, hi] = u16le(addr);
    return { cmd: CMD.MEM, args: [sub, 0, readChecksum(addr, len), len, lo, hi] };
};

export const memWriteChunks = (sub, addr, data) =>
    chunkData(data, 56).map((chunk, i) => {
        const head = [chunk.length, ...u16le(addr + i * 56), 0, ...chunk];
        return { cmd: CMD.MEM, args: [sub, 0, sum8(head), ...head] };
    });

// --- keymap -----------------------------------------------------------------
export const keymapAddr = (profile, layer, slot = 0) =>
    EEPROM.PROFILE_STRIDE * profile + EEPROM.LAYER_STRIDE * layer + 3 * slot;

// read a full 512-byte layer in <=56-byte chunks, exactly like the official loop
export function readLayerCommands(profile, layer) {
    const base = keymapAddr(profile, layer);
    const cmds = [];
    for (let t = 0; t < EEPROM.LAYER_STRIDE; ) {
        const len = Math.min(EEPROM.LAYER_STRIDE - t, 56);
        cmds.push(memRead(SUB.MATRIX_USER, base + t, len));
        t += len;
    }
    return cmds;
}

export function readFactoryLayerCommands(profile, layer) {
    const base = keymapAddr(profile, layer);
    const cmds = [];
    for (let t = 0; t < EEPROM.LAYER_STRIDE; ) {
        const len = Math.min(EEPROM.LAYER_STRIDE - t, 56);
        cmds.push(memRead(SUB.MATRIX_FACTORY, base + t, len));
        t += len;
    }
    return cmds;
}

export const writeKeyEntryCommands = (profile, layer, slot, entry) =>
    memWriteChunks(SUB.MATRIX_WRITE, keymapAddr(profile, layer, slot), [entry.type, entry.code1, entry.code2]);

export function writeLayerCommands(profile, layer, flat3) {
    // flat3: 128 entries x 3 bytes
    return memWriteChunks(SUB.MATRIX_WRITE, keymapAddr(profile, layer), flat3);
}

// --- colors -----------------------------------------------------------------
export const readColorCommands = (profile) => {
    const cmds = [];
    for (let t = 0; t < EEPROM.COLOR_STRIDE; ) {
        const len = Math.min(EEPROM.COLOR_STRIDE - t, 56);
        cmds.push(memRead(SUB.COLOR_READ, EEPROM.COLOR_STRIDE * profile + t, len));
        t += len;
    }
    return cmds;
};
export const writeAllColorsCommands = (profile, flatRgb) =>
    memWriteChunks(SUB.COLOR_WRITE, EEPROM.COLOR_STRIDE * profile, flatRgb);
export const writeKeyColorCommand = (profile, slot, [r, g, b]) => {
    const addr = EEPROM.COLOR_STRIDE * profile + 3 * slot;
    const head = [3, ...u16le(addr), 0, r, g, b];
    return { cmd: CMD.MEM, args: [SUB.COLOR_WRITE, 0, sum8(head), ...head] };
};
export const readKeyLightCommand = () => memRead(SUB.KEYLIGHT, 0, 384);

// --- config block (64B per profile) ------------------------------------------
export const readConfigCommands = (profile) => {
    const cmds = [];
    for (let t = 0; t < EEPROM.CFG_STRIDE; ) {
        const len = Math.min(EEPROM.CFG_STRIDE - t, 56);
        cmds.push(memRead(SUB.CFG_READ, EEPROM.CFG_STRIDE * profile + t, len));
        t += len;
    }
    return cmds;
};
export const writeConfigCommands = (profile, cfg64) =>
    memWriteChunks(SUB.CFG_WRITE, EEPROM.CFG_STRIDE * profile, cfg64);

// --- macros (2048B per profile: 64B header of 16 u16le offsets + actions) ----
export function readMacroCommands(profile) {
    const cmds = [];
    for (let t = 0; t < EEPROM.PROFILE_STRIDE; ) {
        const len = Math.min(EEPROM.PROFILE_STRIDE - t, 56);
        cmds.push(memRead(SUB.MACRO_READ, EEPROM.PROFILE_STRIDE * profile + t, len));
        t += len;
    }
    return cmds;
}
export const writeMacroCommands = (profile, macro2048) =>
    memWriteChunks(SUB.MACRO_WRITE, EEPROM.PROFILE_STRIDE * profile, macro2048);

// --- rapid trigger / travel (8B per key) --------------------------------------
export function readRtCommands(profile) {
    const cmds = [];
    for (let t = 0; t < EEPROM.RT_STRIDE; ) {
        const len = Math.min(EEPROM.RT_STRIDE - t, 56);
        cmds.push(memRead(SUB.RT_READ, EEPROM.RT_STRIDE * profile + t, len));
        t += len;
    }
    return cmds;
}
export const writeRtKeyCommands = (profile, slot, data8) =>
    memWriteChunks(SUB.RT_WRITE, EEPROM.RT_STRIDE * profile + 8 * slot, data8);
export const writeAllRtCommands = (profile, flat) =>
    memWriteChunks(SUB.RT_WRITE, EEPROM.RT_STRIDE * profile, flat);

// --- DKS (24B per slot, 32 slots) / MT (6B per slot) / TGL (3B per slot) ------
export function dksReadCommands(profile) {
    const cmds = [];
    for (let t = 0; t < EEPROM.DKS_STRIDE; ) {
        const len = Math.min(EEPROM.DKS_STRIDE - t, 56);
        cmds.push(memRead(SUB.DKS_READ, EEPROM.DKS_STRIDE * profile + t, len));
        t += len;
    }
    return cmds;
}
export const writeDksSlotCommands = (profile, slot, data24) =>
    memWriteChunks(SUB.DKS_WRITE, EEPROM.DKS_STRIDE * profile + 24 * slot, data24);
export const writeAllDksCommands = (profile, flat768) =>
    memWriteChunks(SUB.DKS_WRITE, EEPROM.DKS_STRIDE * profile, flat768);

export function mtReadCommands(profile) {
    const cmds = [];
    for (let t = 0; t < EEPROM.MT_STRIDE; ) {
        const len = Math.min(EEPROM.MT_STRIDE - t, 56);
        cmds.push(memRead(SUB.MT_READ, EEPROM.MT_STRIDE * profile + t, len));
        t += len;
    }
    return cmds;
}
// official quirk: MT write address = (256*profile + slot) * 6
export const writeMtSlotCommand = (profile, slot, data6) =>
    memWriteChunks(SUB.MT_WRITE, (EEPROM.MT_STRIDE * profile + slot) * 6, data6);
export const writeAllMtCommands = (profile, flat256) =>
    memWriteChunks(SUB.MT_WRITE, EEPROM.MT_STRIDE * profile * 6, flat256);

export function tglReadCommands(profile) {
    const cmds = [];
    for (let t = 0; t < EEPROM.TGL_STRIDE; ) {
        const len = Math.min(EEPROM.TGL_STRIDE - t, 56);
        cmds.push(memRead(SUB.TGL_READ, EEPROM.TGL_STRIDE * profile + t, len));
        t += len;
    }
    return cmds;
}
export const writeTglSlotCommands = (profile, slot, data3) =>
    memWriteChunks(SUB.TGL_WRITE, EEPROM.TGL_STRIDE * profile + 3 * slot, data3);
export const writeAllTglCommands = (profile, flat128) =>
    memWriteChunks(SUB.TGL_WRITE, EEPROM.TGL_STRIDE * profile, flat128);

// --- misc ---------------------------------------------------------------------
export const getInfoCommand = () => ({ cmd: CMD.MEM, args: [SUB.INFO, 0, 32, 32, 0, 0] });
export const getBaseCommand = () => ({ cmd: CMD.MEM, args: [SUB.BASE, 0, 32, 32, 0, 0] });
export const calStartCommand = () => ({ cmd: CMD.MEM, args: [0xa8, 0, 0] });
export const calEndCommand = () => ({ cmd: CMD.MEM, args: [0xa9, 0, 0] });
export const setConfigModeCommand = (mode) => ({ cmd: CMD.MEM, args: [14, 0, (1 + mode) & 255, 1, 0, 0, 0, mode] });
export const resetCommand = () => ({ cmd: CMD.MEM, args: [0xee, 0, 0] });
export const fastModeOnCommand = () => ({ cmd: CMD.MEM, args: [0x01, 0, 0] });
export const fastModeOffCommand = () => ({ cmd: CMD.MEM, args: [0x02, 0, 0] });
export const enterBootCommand = () => ({ cmd: CMD.BOOT, args: [6, 0, 82, 1, 0, 0, 0, 81] });
export const factoryResetCommand = () => ({ cmd: CMD.KEY_INFO, args: [15, 255] });

// parse fw version from 32-byte info payload
export const parseFwVersion = (payload) =>
    (((payload[1] << 8) | payload[0]) >>> 0).toString(16);

// --- bootloader (device re-enumerates as 0x0C45:0x0500) ------------------------
export const BOOT_CMD = { SEND: 0x80, ERASE: 0x81, CHECK: 0x82, END: 0x83, SUCC: 0x84 };
export const eraseRomCommand = (vendorId, productId) => ({
    cmd: BOOT_CMD.ERASE,
    args: [7, ...u16le(vendorId), ...u16le(productId), 0],
});
export function romDataCommands(fwBytes, cmd, onProgress) {
    const chunks = chunkData(fwBytes, 32);
    return chunks.map((chunk, i) => {
        if (onProgress) onProgress(i / chunks.length);
        return { cmd, args: [chunk.length, ...u32le(32 * i), ...chunk] };
    });
}
export const endRomCommand = () => ({ cmd: BOOT_CMD.END, args: [1, 0, 0, 0] });
export const succRomCommand = () => ({ cmd: BOOT_CMD.SUCC, args: [1, 0, 0, 0] });

// --- live key events (async reports starting 0xA0) ----------------------------
// [0xA0, row, col, ?, ?, ?, travelLo, travelHi, ?, ?, pressed, ...]
export function parseKeyEvent(report) {
    if (report[0] !== 0xa0) return null;
    return {
        row: report[1],
        col: report[2],
        travel: report[6] | (report[7] << 8),
        pressed: report[10],
    };
}
