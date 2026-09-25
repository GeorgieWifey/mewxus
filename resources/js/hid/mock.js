// Demo mode: a faithful EEPROM emulator behind the same transport interface.
// Every command the real firmware answers is emulated here, so the demo runs
// the exact same code path as real hardware — and the cat can pretend to be a
// keyboard by emitting 0xA0 travel events when you click keys.

import { LAYOUT, KEY_SLOTS } from './layout.js';
import { TYPE, normalEntry, emptyEntry } from './keycodes.js';
import * as P from './protocol.js';

function defaultEntry(code) {
    if (code === 255) return { type: TYPE.FN, code1: 255, code2: 255 };
    return normalEntry(0, code);
}

function defaultLayer() {
    const entries = Array.from({ length: 128 }, () => emptyEntry());
    LAYOUT.keys.filter((k) => k.mode !== 1).forEach((k, i) => {
        entries[i] = defaultEntry(k.code);
    });
    return entries;
}

function defaultColors() {
    // pastel rainbow sweep across the board
    const hues = ['#dc8a78', '#ea76cb', '#8839ef', '#7287fd', '#04a5e5', '#179299', '#40a02b', '#df8e1d', '#fe640b', '#d20f39'];
    return Array.from({ length: 128 }, (_, i) => {
        const hex = hues[i % hues.length];
        return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    });
}

function defaultConfig() {
    const raw = new Array(64).fill(0);
    raw[1] = 0; // win mode
    raw[4] = 1; // report rate
    raw[7] = 2 << 5; // debounce
    raw[8] = 1; // spectrum effect
    raw[9] = 80; // brightness
    raw[10] = 2; // speed
    raw[12] = 1; // color flag
    raw[14] = 220; raw[15] = 138; raw[16] = 120; // rosewater
    raw[24] = 0; raw[25] = 60; raw[26] = 2; // logo
    raw[29] = 220; raw[30] = 138; raw[31] = 120;
    return { cfg: null, raw };
}

export class MockTransport {
    constructor() {
        this.listeners = [];
        this.mem = {
            factory: defaultMatrix(),
            user: defaultMatrix(),
            colors: flatColors(),
            config: Uint8Array.from(defaultConfig().raw),
            macros: new Uint8Array(2048),
            rt: defaultRt(),
            dks: new Uint8Array(768),
            mt: new Uint8Array(256),
            tgl: new Uint8Array(128),
        };
    }

    onKeyEvent(fn) {
        this.listeners.push(fn);
        return () => {
            const i = this.listeners.indexOf(fn);
            if (i > -1) this.listeners.splice(i, 1);
        };
    }

    send(cmd, args) {
        const payload = this.handle(cmd, args);
        return Promise.resolve(payload);
    }

    close() { /* nothing to close */ }

    handle(cmd, args) {
        if (cmd !== P.CMD.MEM) return new Uint8Array(56);
        const sub = args[0];
        switch (sub) {
            case P.SUB.INFO: return infoPayload();
            case P.SUB.BASE: return basePayload();
            case P.SUB.CFG_READ: return slice(this.mem.config, addr(args), len(args));
            case P.SUB.CFG_WRITE: return this.writeMem(this.mem.config, args);
            case P.SUB.MATRIX_FACTORY: return slice(this.mem.factory, addr(args), len(args));
            case P.SUB.MATRIX_USER: return slice(this.mem.user, addr(args), len(args));
            case P.SUB.MATRIX_WRITE: return this.writeMem(this.mem.user, args);
            case P.SUB.COLOR_READ: return slice(this.mem.colors, addr(args), len(args));
            case P.SUB.COLOR_WRITE: return this.writeMem(this.mem.colors, args);
            case P.SUB.MACRO_READ: return slice(this.mem.macros, addr(args), len(args));
            case P.SUB.MACRO_WRITE: return this.writeMem(this.mem.macros, args);
            case P.SUB.RT_READ: return slice(this.mem.rt, addr(args), len(args));
            case P.SUB.RT_WRITE: return this.writeMem(this.mem.rt, args);
            case P.SUB.DKS_READ: return slice(this.mem.dks, addr(args), len(args));
            case P.SUB.DKS_WRITE: return this.writeMem(this.mem.dks, args);
            case P.SUB.MT_READ: return slice(this.mem.mt, addr(args), len(args));
            case P.SUB.MT_WRITE: return this.writeMem(this.mem.mt, args);
            case P.SUB.TGL_READ: return slice(this.mem.tgl, addr(args), len(args));
            case P.SUB.TGL_WRITE: return this.writeMem(this.mem.tgl, args);
            case P.SUB.CAL_START:
            case P.SUB.CAL_END:
            case 14: // config mode
            case 0xee: return new Uint8Array(56);
            default: return new Uint8Array(56);
        }
    }

    writeMem(target, args) {
        // args: [sub, 0, chk, len, lo, hi, 0, ...data]
        const len = args[3];
        const a = args[4] | (args[5] << 8);
        const data = args.slice(7, 7 + len);
        for (let i = 0; i < len; i++) target[a + i] = data[i] & 255;
        return new Uint8Array(56);
    }

    /** demo cat "presses" a key: emit 0xA0 events with a travel ramp */
    pressKey(slot, pressed = true) {
        const key = LAYOUT.keys.filter((k) => k.mode !== 1)[slot];
        if (!key) return;
        const emit = (travel, down) => this.listeners.forEach((fn) => fn({
            row: key.row, col: key.col, travel, pressed: down,
        }));
        if (pressed) {
            emit(10, 0); emit(40, 0); emit(80, 1);
        } else {
            emit(30, 0); emit(5, 0); emit(0, 0);
        }
    }
}

function addr(args) {
    return args[4] | (args[5] << 8);
}
function len(args) {
    return args[3];
}
function slice(src, a, l) {
    const out = new Uint8Array(56);
    for (let i = 0; i < l && i < 56; i++) out[i] = src[a + i] ?? 0;
    return out;
}
function infoPayload() {
    const out = new Uint8Array(56);
    const fw = 0x118; // 118 like the official YODALL61_118
    out[0] = fw & 255;
    out[1] = (fw >> 8) & 255;
    out[2] = 0x5e; out[3] = 0xea; // pid le
    return out;
}
function basePayload() {
    const out = new Uint8Array(56);
    out[0] = 1;
    return out;
}
function defaultMatrix() {
    const flat = new Uint8Array(2048);
    LAYOUT.keys.filter((k) => k.mode !== 1).forEach((k, i) => {
        const e = defaultEntry(k.code);
        flat[3 * i] = e.type; flat[3 * i + 1] = e.code1; flat[3 * i + 2] = e.code2;
    });
    return flat;
}
function flatColors() {
    const out = new Uint8Array(512);
    defaultColors().forEach(([r, g, b], i) => {
        out[3 * i] = r; out[3 * i + 1] = g; out[3 * i + 2] = b;
    });
    return out;
}
function defaultRt() {
    const out = new Uint8Array(1024);
    for (let i = 0; i < KEY_SLOTS; i++) {
        const act = 74; // stored as value-1 => 75
        const rp = 24;
        out[8 * i + 2] = act;
        out[8 * i + 3] = (act >> 8) & 1;
        out[8 * i + 4] = rp;
        out[8 * i + 5] = (rp >> 8) & 1;
        out[8 * i + 6] = rp;
        out[8 * i + 7] = (rp >> 8) & 1;
    }
    return out;
}

export { defaultConfig, defaultColors };
