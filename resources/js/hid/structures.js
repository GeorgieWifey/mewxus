// Codec layer: raw device bytes <-> friendly UI structures.
// All layouts verbatim from the official driver (see protocol.js notes).

import { fromLe, u16le } from './bytes.js';
import { TYPE } from './keycodes.js';

// --- keymap entries ----------------------------------------------------------
// Each key slot = 3 bytes [type, code1, code2].

export function parseKeymapLayer(bytes512) {
    const entries = [];
    for (let i = 0; i < 128; i++) {
        const [type, code1, code2] = [bytes512[3 * i], bytes512[3 * i + 1], bytes512[3 * i + 2]];
        if (type === 0 || type === 255 || (type === TYPE.NORMAL && code2 === 0 && code1 === 0)) {
            entries.push({ type: 0, code1: 0, code2: 0 });
        } else if (type === TYPE.NORMAL) {
            entries.push({ type, code1, code2 });
        } else {
            entries.push({ type, code1, code2 });
        }
    }
    return entries;
}

export function keymapLayerToBytes(entries) {
    const out = new Uint8Array(512);
    entries.slice(0, 128).forEach((e, i) => {
        out[3 * i] = e.type & 255;
        out[3 * i + 1] = e.code1 & 255;
        out[3 * i + 2] = e.code2 & 255;
    });
    return out;
}

// --- rapid trigger / travel (8 bytes per key) ----------------------------------
// [0] switch type, [1] priority<<4 | key_mode,
// [2] actuation lo, [3] actuation bit8 | releasePrec<<1 | pressPrec<<3,
// [4] rt_press lo, [5] rt_press bit8 | pressDeadzone<<1,
// [6] rt_release lo, [7] rt_release bit8 | releaseDeadzone<<1
// Values are stored as value-1 (0 => 1).

export const RT_DEFAULTS = {
    switchType: 0,
    keyMode: 0,
    priority: 0,
    actuation: 75,
    rtPress: 25,
    rtRelease: 25,
    pressDeadzone: 0,
    releaseDeadzone: 0,
    pressPrecision: 0,
    releasePrecision: 0,
};

export function parseRtKey(b8) {
    if (!b8 || b8.length < 8) return { ...RT_DEFAULTS };
    return {
        switchType: b8[0],
        keyMode: b8[1] & 0x0f,
        priority: (b8[1] >> 4) & 0x0f,
        actuation: fromLe([b8[2], b8[3] & 1]) + 1,
        pressPrecision: (b8[3] >> 3) & 3,
        releasePrecision: (b8[3] >> 1) & 3,
        rtPress: fromLe([b8[4], b8[5] & 1]) + 1,
        pressDeadzone: (b8[5] >> 1) & 127,
        rtRelease: fromLe([b8[6], b8[7] & 1]) + 1,
        releaseDeadzone: (b8[7] >> 1) & 127,
    };
}

export function packRtKey(rt) {
    const r = { ...RT_DEFAULTS, ...rt };
    const act = Math.max(1, r.actuation) - 1;
    const rp = Math.max(1, r.rtPress) - 1;
    const rr = Math.max(1, r.rtRelease) - 1;
    return [
        r.switchType & 255,
        ((r.priority & 0x0f) << 4) | (r.keyMode & 0x0f),
        act & 255,
        ((act >> 8) & 1) | ((r.releasePrecision & 3) << 1) | ((r.pressPrecision & 3) << 3),
        rp & 255,
        ((rp >> 8) & 1) | ((r.pressDeadzone & 127) << 1),
        rr & 255,
        ((rr >> 8) & 1) | ((r.releaseDeadzone & 127) << 1),
    ];
}

export function parseRtBlock(bytes1024) {
    const out = [];
    for (let i = 0; i < 128; i++) out.push(parseRtKey(bytes1024.slice(8 * i, 8 * i + 8)));
    return out;
}

export function rtBlockToBytes(rtList) {
    const out = new Uint8Array(1024);
    rtList.slice(0, 128).forEach((rt, i) => out.set(packRtKey(rt), 8 * i));
    return out;
}

// --- macros (2048B per profile) --------------------------------------------------
// Header: 16 x u16le action offsets (empty slot = 64). Actions: 4 bytes
// [delayLo, delayHi, flags, code]; flags bit6 = key down, bit7 = last action,
// bit0 = 1 when code is a modifier (224..231) else modifier-mask-of-one style 2.

export const MACRO_SLOTS = 16;
export const MACRO_HEADER = 64;

export function parseMacros(block2048) {
    const offsets = [];
    for (let i = 0; i < MACRO_SLOTS; i++) offsets.push(fromLe([block2048[2 * i], block2048[2 * i + 1]]));
    const slots = offsets.map((start, i) => {
        const end = i + 1 < MACRO_SLOTS ? Math.min(offsets[i + 1], block2048.length) : findEnd(block2048, start);
        const actions = [];
        for (let p = start; p + 4 <= end; p += 4) {
            const delay = fromLe([block2048[p], block2048[p + 1]]);
            const flags = block2048[p + 2];
            const code = block2048[p + 3];
            const isModifier = code >= 224 && code <= 231;
            actions.push({
                delay,
                down: !!(flags & 0x40),
                last: !!(flags & 0x80),
                code,
                isModifier,
            });
        }
        return { actions, empty: start >= MACRO_HEADER && actions.length === 0 };
    });
    return { offsets, slots };
}

function findEnd(block, start) {
    // last slot: actions until first fully-zero quad
    for (let p = start; p + 4 <= block.length; p += 4) {
        if (block[p] === 0 && block[p + 1] === 0 && block[p + 2] === 0 && block[p + 3] === 0) return p;
    }
    return block.length;
}

export function macrosToBytes(slots) {
    const out = new Uint8Array(2048);
    let cursor = MACRO_HEADER;
    const offsets = slots.slice(0, MACRO_SLOTS).map((slot) => {
        const start = slot && slot.actions && slot.actions.length ? cursor : MACRO_HEADER;
        (slot?.actions || []).forEach((a) => {
            const isModifier = a.code >= 224 && a.code <= 231;
            const flags = (isModifier ? 1 : 2) | (a.down ? 0x40 : 0) | (a.last ? 0x80 : 0);
            out[cursor] = a.delay & 255;
            out[cursor + 1] = (a.delay >> 8) & 255;
            out[cursor + 2] = flags;
            out[cursor + 3] = a.code & 255;
            cursor += 4;
        });
        return start;
    });
    offsets.forEach((o, i) => {
        out[2 * i] = o & 255;
        out[2 * i + 1] = (o >> 8) & 255;
    });
    return out;
}

// --- DKS (24B per slot, 32 slots) ------------------------------------------------
// 4 trigger stages; each stage = 6 bytes: [type, code1, code2, paramLo, paramHi, mode].
export function parseDksSlot(b24) {
    const stages = [];
    for (let s = 0; s < 4; s++) {
        const o = 6 * s;
        stages.push({
            type: b24[o],
            code1: b24[o + 1],
            code2: b24[o + 2],
            param: fromLe([b24[o + 3], b24[o + 4]]),
            mode: b24[o + 5],
        });
    }
    return { stages };
}

export function packDksSlot(dks) {
    const out = new Uint8Array(24);
    (dks.stages || []).slice(0, 4).forEach((st, s) => {
        const o = 6 * s;
        out[o] = st.type & 255;
        out[o + 1] = st.code1 & 255;
        out[o + 2] = st.code2 & 255;
        const [lo, hi] = u16le(st.param || 0);
        out[o + 3] = lo;
        out[o + 4] = hi;
        out[o + 5] = st.mode & 255;
    });
    return out;
}

// --- MT (6B per slot: down key + tap key) and TGL (3B per slot) --------------------
export function parseMtSlot(b6) {
    return {
        downKey: { type: b6[0], code1: b6[1], code2: b6[2] },
        clickKey: { type: b6[3], code1: b6[4], code2: b6[5] },
    };
}
export function packMtSlot(mt) {
    return [
        mt.downKey.type, mt.downKey.code1, mt.downKey.code2,
        mt.clickKey.type, mt.clickKey.code1, mt.clickKey.code2,
    ];
}
export const parseTglSlot = (b3) => ({ tglKey: { type: b3[0], code1: b3[1], code2: b3[2] } });
export const packTglSlot = (tgl) => [tgl.tglKey.type, tgl.tglKey.code1, tgl.tglKey.code2];

// --- config block (64B per profile) ------------------------------------------------
export function parseConfig(cfg64) {
    return {
        sysMode: cfg64[1], // 0 win, 2 mac
        reportRate: cfg64[4] & 0x0f,
        tick: (cfg64[4] >> 4) & 0x0f,
        winLock: !!(cfg64[6] & 1),
        altTabLock: !!(cfg64[6] & 2),
        tachyon: !!(cfg64[7] & 1),
        stability: (cfg64[7] >> 1) & 3,
        debug: !!(cfg64[7] & 8),
        debounce: (cfg64[7] >> 5) & 7,
        effect: cfg64[8],
        brightness: cfg64[9],
        speed: cfg64[10], // device value; UI displays 4 - speed
        direction: cfg64[11],
        colorFlag: cfg64[12],
        rgb: [cfg64[14], cfg64[15], cfg64[16]],
        lightSleep: cfg64[22],
        floorSync: cfg64[23],
        logoEffect: cfg64[24],
        logoBrightness: cfg64[25],
        logoSpeed: cfg64[26],
        logoSingle: cfg64[27],
        logoRgb: [cfg64[29], cfg64[30], cfg64[31]],
        raw: Array.from(cfg64.slice(0, 64)),
    };
}

export function configToBytes(cfg, rawBase) {
    const out = Uint8Array.from(rawBase || new Array(64).fill(0));
    out[1] = cfg.sysMode & 255;
    out[4] = ((cfg.tick & 0x0f) << 4) | (cfg.reportRate & 0x0f);
    out[6] = (cfg.winLock ? 1 : 0) | (cfg.altTabLock ? 2 : 0);
    out[7] =
        (cfg.tachyon ? 1 : 0) |
        ((cfg.stability & 3) << 1) |
        (cfg.debug ? 8 : 0) |
        ((cfg.debounce & 7) << 5);
    out[8] = cfg.effect & 255;
    out[9] = cfg.brightness & 255;
    out[10] = cfg.speed & 255;
    out[11] = cfg.direction & 255;
    out[12] = cfg.colorFlag & 255;
    out[14] = cfg.rgb[0] & 255;
    out[15] = cfg.rgb[1] & 255;
    out[16] = cfg.rgb[2] & 255;
    out[22] = cfg.lightSleep & 255;
    out[23] = cfg.floorSync & 255;
    out[24] = cfg.logoEffect & 255;
    out[25] = cfg.logoBrightness & 255;
    out[26] = cfg.logoSpeed & 255;
    out[27] = cfg.logoSingle & 255;
    out[29] = cfg.logoRgb[0] & 255;
    out[30] = cfg.logoRgb[1] & 255;
    out[31] = cfg.logoRgb[2] & 255;
    return out;
}
