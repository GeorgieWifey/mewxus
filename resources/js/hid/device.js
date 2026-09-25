// High-level Nexus 61S device. Wraps any transport that exposes
// send(cmd, args) -> Promise<payload56> and onKeyEvent(fn) — the real HID
// transport and the demo mock share this exact code path.

import { EEPROM } from './protocol.js';
import * as P from './protocol.js';
import {
    parseKeymapLayer, keymapLayerToBytes,
    parseRtBlock, rtBlockToBytes,
    parseMacros, macrosToBytes,
    parseDksSlot, packDksSlot, parseMtSlot, packMtSlot, parseTglSlot, packTglSlot,
    parseConfig, configToBytes,
} from './structures.js';

export class MewxusDevice {
    constructor(transport, { kind = 'real', name = 'Yodall 61' } = {}) {
        this.t = transport;
        this.kind = kind;
        this.name = name;
        this.profile = 0;
        this.fw = null;
    }

    onKeyEvent(fn) {
        return this.t.onKeyEvent(fn);
    }

    async readInfo() {
        const payload = await this.t.send(P.getInfoCommand().cmd, P.getInfoCommand().args);
        this.fw = P.parseFwVersion(payload);
        return { fw: this.fw };
    }

    async readAllState(profile = 0) {
        this.profile = profile;
        const [layers, colors, config, rt, dksRaw, mtRaw, tglRaw, macroRaw] = await Promise.all([
            this.readKeymap(profile),
            this.readColors(profile),
            this.readConfig(profile),
            this.readRt(profile),
            this.readBlock(P.dksReadCommands(profile), EEPROM.DKS_STRIDE),
            this.readBlock(P.mtReadCommands(profile), EEPROM.MT_STRIDE),
            this.readBlock(P.tglReadCommands(profile), EEPROM.TGL_STRIDE),
            this.readBlock(P.readMacroCommands(profile), EEPROM.PROFILE_STRIDE),
        ]);
        const dks = [];
        for (let s = 0; s < EEPROM.ADV_SLOTS; s++) dks.push(parseDksSlot(dksRaw.slice(24 * s, 24 * s + 24)));
        const mt = [];
        for (let s = 0; s < EEPROM.ADV_SLOTS; s++) mt.push(parseMtSlot(mtRaw.slice(6 * s, 6 * s + 6)));
        const tgl = [];
        for (let s = 0; s < EEPROM.ADV_SLOTS; s++) tgl.push(parseTglSlot(tglRaw.slice(3 * s, 3 * s + 3)));
        return {
            layers,
            colors,
            config,
            rt,
            dks,
            mt,
            tgl,
            macros: parseMacros(macroRaw),
        };
    }

    async readKeymap(profile = 0) {
        const layers = [];
        for (let layer = 0; layer < 4; layer++) {
            const flat = await this.readBlock(P.readLayerCommands(profile, layer), EEPROM.LAYER_STRIDE);
            layers.push(parseKeymapLayer(flat));
        }
        return layers;
    }

    async readFactoryKeymap(profile = 0) {
        const layers = [];
        for (let layer = 0; layer < 4; layer++) {
            const flat = await this.readBlock(P.readFactoryLayerCommands(profile, layer), EEPROM.LAYER_STRIDE);
            layers.push(parseKeymapLayer(flat));
        }
        return layers;
    }

    async runReads(commands) {
        const parts = [];
        for (const c of commands) {
            const payload = await this.t.send(c.cmd, c.args);
            parts.push(payload);
        }
        return concatPayloads(parts);
    }

    async readBlock(commands, totalLen) {
        const flat = await this.runReads(commands);
        return flat.slice(0, totalLen);
    }

    async readColors(profile = 0) {
        const flat = await this.readBlock(P.readColorCommands(profile), EEPROM.COLOR_STRIDE);
        const colors = [];
        for (let i = 0; i < EEPROM.SLOTS; i++) {
            colors.push([flat[3 * i] ?? 0, flat[3 * i + 1] ?? 0, flat[3 * i + 2] ?? 0]);
        }
        return colors;
    }

    async readConfig(profile = 0) {
        const flat = await this.readBlock(P.readConfigCommands(profile), EEPROM.CFG_STRIDE);
        return parseConfig(flat);
    }

    async readRt(profile = 0) {
        const flat = await this.readBlock(P.readRtCommands(profile), EEPROM.RT_STRIDE);
        return parseRtBlock(flat);
    }

    async readMacros(profile = 0) {
        const flat = await this.readBlock(P.readMacroCommands(profile), EEPROM.PROFILE_STRIDE);
        return parseMacros(flat);
    }

    // --- writes ------------------------------------------------------------------
    async writeKey(profile, layer, slot, entry) {
        for (const c of P.writeKeyEntryCommands(profile, layer, slot, entry)) {
            await this.t.send(c.cmd, c.args);
        }
    }

    async writeLayer(profile, layer, entries) {
        for (const c of P.writeLayerCommands(profile, layer, keymapLayerToBytes(entries))) {
            await this.t.send(c.cmd, c.args);
        }
    }

    async writeColor(profile, slot, rgb) {
        const c = P.writeKeyColorCommand(profile, slot, rgb);
        await this.t.send(c.cmd, c.args);
    }

    async writeColors(profile, colors) {
        const flat = new Uint8Array(EEPROM.SLOTS * 3);
        colors.slice(0, EEPROM.SLOTS).forEach(([r, g, b], i) => {
            flat[3 * i] = r;
            flat[3 * i + 1] = g;
            flat[3 * i + 2] = b;
        });
        for (const c of P.writeAllColorsCommands(profile, flat)) await this.t.send(c.cmd, c.args);
    }

    async writeConfig(profile, cfg, rawBase) {
        for (const c of P.writeConfigCommands(profile, configToBytes(cfg, rawBase))) {
            await this.t.send(c.cmd, c.args);
        }
    }

    async writeRtKey(profile, slot, rt) {
        for (const c of P.writeRtKeyCommands(profile, slot, packRtKey(rt))) {
            await this.t.send(c.cmd, c.args);
        }
    }

    async writeAllRt(profile, rtList) {
        for (const c of P.writeAllRtCommands(profile, rtBlockToBytes(rtList))) {
            await this.t.send(c.cmd, c.args);
        }
    }

    async writeDksSlot(profile, slot, dks) {
        for (const c of P.writeDksSlotCommands(profile, slot, packDksSlot(dks))) {
            await this.t.send(c.cmd, c.args);
        }
    }

    async writeMtSlot(profile, slot, mt) {
        for (const c of P.writeMtSlotCommand(profile, slot, packMtSlot(mt))) {
            await this.t.send(c.cmd, c.args);
        }
    }

    async writeTglSlot(profile, slot, tgl) {
        for (const c of P.writeTglSlotCommands(profile, slot, packTglSlot(tgl))) {
            await this.t.send(c.cmd, c.args);
        }
    }

    async writeMacros(profile, slots) {
        for (const c of P.writeMacroCommands(profile, macrosToBytes(slots))) {
            await this.t.send(c.cmd, c.args);
        }
    }

    // --- control -----------------------------------------------------------------
    async reset() {
        const c = P.resetCommand();
        await this.t.send(c.cmd, c.args);
    }

    async factoryReset() {
        const c = P.factoryResetCommand();
        await this.t.send(c.cmd, c.args);
    }

    async calStart() {
        const c = P.calStartCommand();
        await this.t.send(c.cmd, c.args);
    }

    async calEnd() {
        const c = P.calEndCommand();
        await this.t.send(c.cmd, c.args);
    }

    async setConfigMode(mode) {
        const c = P.setConfigModeCommand(mode);
        await this.t.send(c.cmd, c.args);
    }

    async enterBoot() {
        const c = P.enterBootCommand();
        await this.t.send(c.cmd, c.args);
    }

    async close() {
        await this.t.close?.();
    }
}

function concatPayloads(parts) {
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let o = 0;
    parts.forEach((p) => {
        out.set(p, o);
        o += p.length;
    });
    return out;
}
