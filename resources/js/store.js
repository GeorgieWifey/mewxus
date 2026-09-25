// Alpine store: the whole app state machine.

import { HidTransport, RUNTIME_FILTERS } from './hid/transport.js';
import { MewxusDevice } from './hid/device.js';
import { MockTransport } from './hid/mock.js';
import { LAYOUT, LIGHT_EFFECTS, LOGO_EFFECTS, keyIndexByMatrix, KEY_SLOTS } from './hid/layout.js';
import { TYPE, entryName, entryKind, emptyEntry, normalEntry, PICKER_GROUPS, usageName } from './hid/keycodes.js';
import { RT_DEFAULTS } from './hid/structures.js';
import { flashFirmware } from './hid/bootloader.js';
import { fetchOfficialFirmware, firmwareFromUpload, formatBytes } from './hid/firmware.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

let toastSeq = 0;

export function createStore() {
    return {
        // --- connection ----------------------------------------------------------
        phase: 'gate', // gate | ready
        demo: false,
        webhidSupported: HidTransport.supported(),
        connecting: false,
        error: '',
        deviceName: '',
        fw: '',
        mascot: 'sleep', // sleep | wake | happy | alarm

        // --- state ---------------------------------------------------------------
        profile: 0,
        layer: 0,
        layers: Array.from({ length: 4 }, () => Array.from({ length: 128 }, emptyEntry)),
        factoryLayers: Array.from({ length: 4 }, () => Array.from({ length: 128 }, emptyEntry)),
        colors: Array.from({ length: 128 }, () => [0, 0, 0]),
        config: null,
        rt: Array.from({ length: 128 }, () => ({ ...RT_DEFAULTS })),
        dks: [],
        mt: [],
        tgl: [],
        macroSlots: Array.from({ length: 16 }, () => ({ actions: [] })),

        // --- ui ------------------------------------------------------------------
        tab: 'keys', // keys | lights | feel | macros | settings | firmware
        mode: 'assign', // assign | paint
        selectedSlot: null,
        paintColor: '#dc8a78',
        pressed: new Array(128).fill(false),
        lastTravel: 0,
        keyPressCount: 0,
        busy: false,
        busyText: '',
        toasts: [],
        pickerQuery: '',
        pickerGroup: 'letters',
        advSlotTarget: 0,
        macroSlot: 0,
        flashStage: '',
        flashProgress: 0,
        flashing: false,

        layout: LAYOUT,
        lightEffects: LIGHT_EFFECTS,
        logoEffects: LOGO_EFFECTS,
        keySlots: KEY_SLOTS,
        // renderer view model: mode-1 entries are the split-spacebar alternate
        // segments (fixed lighting keys), drawn as the full space instead
        boardKeys: LAYOUT.keys
            .filter((k) => k.mode !== 1)
            .map((k, i) => ({ ...k, slot: i })),

        // --- lifecycle -----------------------------------------------------------
        async init() {
            if (!this.webhidSupported) {
                this.mascot = 'sleep';
            }
            const granted = this.webhidSupported ? await HidTransport.getGranted().catch(() => null) : null;
            if (granted) this.mascot = 'wake';
        },

        toast(text, type = 'info') {
            const id = ++toastSeq;
            this.toasts.push({ id, text, type });
            setTimeout(() => {
                this.toasts = this.toasts.filter((t) => t.id !== id);
            }, 4200);
        },

        // --- connect -------------------------------------------------------------
        async connectDemo() {
            this.error = '';
            this.connecting = true;
            this.busyText = 'Waking the demo cat...';
            try {
                const t = new MockTransport();
                this.device = new MewxusDevice(t, { kind: 'mock', name: 'Yodall 61 (demo)' });
                await this.afterConnect(true);
            } catch (e) {
                this.error = e.message || String(e);
                this.mascot = 'alarm';
            } finally {
                this.connecting = false;
            }
        },

        async connectReal() {
            if (!this.webhidSupported) {
                this.toast('This browser has no WebHID — use Chrome, Edge or Opera, or try demo mode.', 'error');
                return;
            }
            this.error = '';
            this.connecting = true;
            this.busyText = 'Waiting for you to pick the keyboard...';
            try {
                const hidDevice = await HidTransport.request(RUNTIME_FILTERS);
                const t = new HidTransport(hidDevice);
                await t.open();
                this.device = new MewxusDevice(t, { kind: 'real', name: 'Yodall 61' });
                await this.afterConnect(false);
            } catch (e) {
                this.error = e.message || String(e);
                this.mascot = 'alarm';
                this.connecting = false;
            }
        },

        async afterConnect(isDemo) {
            this.busyText = 'Reading the whole board...';
            await new Promise((r) => setTimeout(r, isDemo ? 350 : 30));
            const info = await this.device.readInfo();
            this.fw = info.fw;
            const state = await this.device.readAllState(this.profile);
            this.layers = state.layers;
            this.colors = state.colors;
            this.config = state.config;
            this.rt = state.rt;
            this.dks = state.dks;
            this.mt = state.mt;
            this.tgl = state.tgl;
            this.macroSlots = state.macros.slots;
            this.factoryLayers = await this.device.readFactoryKeymap(this.profile);
            this.demo = isDemo;
            this.deviceName = this.device.name;
            this.phase = 'ready';
            this.mascot = 'happy';
            this.device.onKeyEvent((ev) => this.onKeyEvent(ev));
            this.toast(isDemo ? 'Demo cat connected! Nothing here can break anything.' : `Connected — firmware ${this.fw}`, 'success');
            // fetch factory defaults only for UI; ignore failures gracefully
            this.connecting = false;
            if (isDemo && this.device.t.pressKey) {
                // the demo cat walks across the board so the live-press effect is visible
                this._demoTimer = setInterval(() => {
                    const slot = Math.floor(Math.random() * KEY_SLOTS);
                    this.device.t.pressKey(slot, true);
                    setTimeout(() => this.device?.t?.pressKey(slot, false), 200);
                }, 1300);
            }
        },

        async disconnect() {
            clearInterval(this._demoTimer);
            if (this.device) await this.device.close();
            this.device = null;
            this.phase = 'gate';
            this.demo = false;
            this.mascot = 'sleep';
            this.pressed = new Array(128).fill(false);
        },

        onKeyEvent(ev) {
            const slot = keyIndexByMatrix(ev.row, ev.col);
            if (slot < 0) return;
            this.pressed[slot] = !!ev.pressed;
            this.lastTravel = ev.travel;
            if (ev.pressed) {
                this.keyPressCount++;
                this.mascot = 'wake';
                clearTimeout(this._mascotTimer);
                this._mascotTimer = setTimeout(() => {
                    if (this.phase === 'ready') this.mascot = 'happy';
                }, 900);
            }
        },

        // --- helpers -------------------------------------------------------------
        slotCount() {
            return KEY_SLOTS;
        },

        entryAt(slot) {
            return this.layers[this.layer][slot] || emptyEntry();
        },

        labelFor(entry) {
            return entryName(entry);
        },

        entryName(entry) {
            return entryName(entry);
        },

        usageName(usage) {
            return usageName(usage);
        },

        hexToRgb(hex) {
            return hexToRgb(hex);
        },

        rgbToHex(rgb) {
            return rgbToHex(rgb);
        },

        keyStyle(k) {
            const c = this.colors[k.slot];
            const painted = c && (c[0] || c[1] || c[2]);
            // display the paint blended toward the base so labels stay readable
            // (the device keeps the true RGB — this is presentation only)
            const blend = (v) => Math.round(v + (239 - v) * 0.45);
            return {
                left: `${(k.x / 16) * 100}%`,
                top: `${(k.y / 5) * 100}%`,
                width: `${(k.w / 16) * 100}%`,
                height: `${(1 / 5) * 100}%`,
                backgroundColor: painted ? `rgb(${blend(c[0])},${blend(c[1])},${blend(c[2])})` : undefined,
            };
        },

        keyClass(k) {
            const out = [];
            if (this.selectedSlot === k.slot) out.push('!border-flamingo', 'z-10');
            if (this.pressed[k.slot]) out.push('translate-y-0.5', 'shadow-none', 'brightness-110', '!bg-green/40');
            else if (this.layer > 0 && !(this.colors[k.slot] || []).some((v) => v)) out.push('bg-mantle');
            return out.join(' ');
        },

        kindFor(entry) {
            return entryKind(entry);
        },

        async guard(fn, successText) {
            if (this.busy) return;
            this.busy = true;
            try {
                await fn();
                if (successText) this.toast(successText, 'success');
            } catch (e) {
                this.toast(e.message || String(e), 'error');
            } finally {
                this.busy = false;
            }
        },

        // --- keymap ----------------------------------------------------------------
        selectSlot(slot) {
            if (this.mode === 'paint') {
                this.paintSlot(slot);
                return;
            }
            this.selectedSlot = slot;
        },

        assignEntry(entry) {
            const slot = this.selectedSlot;
            if (slot == null) {
                this.toast('Pick a key on the board first!', 'error');
                return;
            }
            this.layers[this.layer][slot] = { ...entry };
            this.guard(async () => {
                await this.device.writeKey(this.profile, this.layer, slot, entry);
            }, 'Key saved to the board');
        },

        clearSlot() {
            if (this.selectedSlot == null) return;
            this.assignEntry(emptyEntry());
        },

        resetSlotToFactory() {
            const slot = this.selectedSlot;
            if (slot == null) return;
            const factory = this.factoryLayers[this.layer][slot];
            this.assignEntry(factory && factory.type ? factory : emptyEntry());
        },

        // --- paint ------------------------------------------------------------------
        paintSlot(slot) {
            const rgb = hexToRgb(this.paintColor);
            this.colors[slot] = rgb;
            this.guard(async () => {
                await this.device.writeColor(this.profile, slot, rgb);
            });
        },

        paintAll() {
            const rgb = hexToRgb(this.paintColor);
            this.colors = this.colors.map(() => rgb);
            this.guard(async () => {
                await this.device.writeColors(this.profile, this.colors);
            }, 'Painted every key');
        },

        async applyPalette(hexes) {
            // sweep a small palette across keys for a one-click cute look
            this.colors = this.colors.map((_, i) => hexToRgb(hexes[i % hexes.length]));
            await this.guard(async () => {
                await this.device.writeColors(this.profile, this.colors);
            }, 'Palette applied');
        },

        // --- lighting -----------------------------------------------------------------
        async updateConfig(patch, successText) {
            if (!this.config) return;
            this.config = { ...this.config, ...patch };
            const cfg = this.config;
            await this.guard(async () => {
                await this.device.writeConfig(this.profile, cfg, cfg.raw);
            }, successText);
        },

        // --- rapid trigger -----------------------------------------------------------
        updateRtLocal(slot, patch) {
            this.rt[slot] = { ...RT_DEFAULTS, ...this.rt[slot], ...patch };
        },

        pushRt(slot) {
            const rt = this.rt[slot];
            this.guard(async () => {
                await this.device.writeRtKey(this.profile, slot, rt);
            }, 'Trigger saved');
        },

        pushRtAll() {
            this.guard(async () => {
                await this.device.writeAllRt(this.profile, this.rt);
            }, 'All trigger settings saved');
        },

        // --- keycode picker -----------------------------------------------------------
        pickerMods: [], // active modifier bitmask for normal key assignment

        get pickerGroups() {
            const q = this.pickerQuery.trim().toLowerCase();
            return PICKER_GROUPS
                .map((g) => ({
                    ...g,
                    items: q
                        ? g.items.filter((it) => it.label.toLowerCase().includes(q))
                        : g.items,
                }))
                .filter((g) => g.items.length > 0);
        },

        pickItem(item) {
            if (item.usage != null) {
                this.assignEntry(normalEntry(this.pickerMods.reduce((a, b) => a | b, 0), item.usage));
            } else if (item.mod != null) {
                this.togglePickerMod(item.mod, item.label);
            } else if (item.layer != null) {
                this.assignEntry({ type: TYPE.LAYER, code1: item.layer, code2: 0 });
            } else if (item.fn) {
                this.assignEntry({ type: TYPE.FN, code1: 255, code2: 255 });
            } else if (item.macro != null) {
                this.assignEntry({ type: TYPE.MACRO, code1: item.macro, code2: 0 });
            } else if (item.adv) {
                this.assignAdvanced(item.adv);
            }
        },

        togglePickerMod(bit, label) {
            // toggling a modifier key assigns it as a plain entry unless combined
            const i = this.pickerMods.indexOf(bit);
            if (i > -1) {
                this.pickerMods.splice(i, 1);
            } else {
                this.pickerMods.push(bit);
            }
            if (this.pickerMods.length === 1 && this.selectedSlot == null) {
                this.toast('Modifier armed — now pick a letter key to combine it with.', 'info');
            }
        },

        // --- advanced keys ------------------------------------------------------------
        advEntryKind() {
            return { TYPE };
        },

        nextFreeAdvSlot(list) {
            const i = list.findIndex((s) =>
                !s.tglKey || s.tglKey.type === 0 || s.tglKey.type === undefined ||
                (s.downKey && (s.downKey.type === 0 || s.downKey.type === undefined)),
            );
            return i < 0 ? 0 : i;
        },

        assignAdvanced(kind) {
            const slot = this.selectedSlot;
            if (slot == null) {
                this.toast('Pick a key on the board first!', 'error');
                return;
            }
            let entry;
            let target = this.advSlotTarget;
            if (kind === 'dks') {
                entry = { type: TYPE.DKS, code1: target, code2: 0 };
            } else if (kind === 'tgl') {
                entry = { type: TYPE.TGL, code1: target, code2: 0 };
                this.tgl[target] = { tglKey: normalEntry(0, 41) };
            } else if (kind === 'mt') {
                entry = { type: TYPE.MT, code1: target, code2: 20 };
                this.mt[target] = {
                    downKey: normalEntry(0, 41),
                    clickKey: normalEntry(0, 42),
                };
            } else if (kind === 'macro') {
                const free = this.macroSlots.findIndex((s) => !s.actions || s.actions.length === 0);
                const mid = free < 0 ? 0 : free + 1;
                entry = { type: TYPE.MACRO, code1: mid, code2: 0 };
            } else {
                return;
            }
            this.assignEntry(entry);
        },

        async pushAdvSlot(kind, index) {
            await this.guard(async () => {
                if (kind === 'dks') await this.device.writeDksSlot(this.profile, index, this.dks[index]);
                if (kind === 'mt') await this.device.writeMtSlot(this.profile, index, this.mt[index]);
                if (kind === 'tgl') await this.device.writeTglSlot(this.profile, index, this.tgl[index]);
            }, 'Saved');
        },

        // --- macros ---------------------------------------------------------------------
        setMacroSlot(i) {
            this.macroSlot = i;
        },

        addMacroAction(kind) {
            const actions = this.macroSlots[this.macroSlot].actions;
            if (kind === 'tap') actions.push({ delay: 20, down: true, last: false, code: 4 });
            if (kind === 'delay') actions.push({ delay: 100, down: false, last: false, code: 0 });
            if (actions.length) actions[actions.length - 1].last = true;
        },

        removeMacroAction(i) {
            const actions = this.macroSlots[this.macroSlot].actions;
            actions.splice(i, 1);
            if (actions.length) actions[actions.length - 1].last = true;
        },

        pushMacro() {
            const slot = this.macroSlot;
            this.guard(async () => {
                await this.device.writeMacros(this.profile, this.macroSlots);
            }, `Macro ${slot + 1} saved`);
        },

        // --- presets ----------------------------------------------------------------------
        snapshot() {
            return {
                version: 1,
                board: 'nexus61s',
                profile: this.profile,
                layers: this.layers,
                colors: this.colors,
                config: this.config ? { ...this.config, raw: undefined } : null,
                rt: this.rt,
                dks: this.dks,
                mt: this.mt,
                tgl: this.tgl,
                macros: this.macroSlots,
            };
        },

        presetInputValue: '',
        presets: [],
        presetsLoaded: false,

        async loadPresets() {
            try {
                const res = await fetch('/presets', { headers: { Accept: 'application/json' } });
                if (res.ok) {
                    const data = await res.json();
                    this.presets = data.presets || [];
                    this.presetsLoaded = true;
                }
            } catch {
                /* server not available */
            }
        },

        fillPresetInput() {
            this.presetInputValue = JSON.stringify(this.snapshot());
        },

        async applySnapshot(json) {
            const snap = typeof json === 'string' ? JSON.parse(json) : json;
            if (!snap || snap.board !== 'nexus61s') throw new Error('Not a Nexus 61S preset.');
            await this.guard(async () => {
                if (snap.layers) {
                    for (let l = 0; l < 4; l++) {
                        if (snap.layers[l]) {
                            this.layers[l] = snap.layers[l];
                            await this.device.writeLayer(this.profile, l, this.layers[l]);
                        }
                    }
                }
                if (snap.colors) {
                    this.colors = snap.colors;
                    await this.device.writeColors(this.profile, this.colors);
                }
                if (snap.config) {
                    const raw = this.config?.raw;
                    this.config = { ...this.config, ...snap.config };
                    await this.device.writeConfig(this.profile, this.config, raw);
                }
                if (snap.rt) {
                    this.rt = snap.rt.map((r) => ({ ...RT_DEFAULTS, ...r }));
                    await this.device.writeAllRt(this.profile, this.rt);
                }
                if (snap.dks) {
                    this.dks = snap.dks;
                    for (let i = 0; i < snap.dks.length; i++) await this.device.writeDksSlot(this.profile, i, snap.dks[i]);
                }
                if (snap.mt) {
                    this.mt = snap.mt;
                    for (let i = 0; i < snap.mt.length; i++) await this.device.writeMtSlot(this.profile, i, snap.mt[i]);
                }
                if (snap.tgl) {
                    this.tgl = snap.tgl;
                    for (let i = 0; i < snap.tgl.length; i++) await this.device.writeTglSlot(this.profile, i, snap.tgl[i]);
                }
                if (snap.macros) {
                    this.macroSlots = snap.macros;
                    await this.device.writeMacros(this.profile, this.macroSlots);
                }
            }, 'Preset applied to the board');
        },

        async applyPresetById(id) {
            try {
                const res = await fetch(`/presets/${id}/export`);
                if (!res.ok) throw new Error(`Could not load preset (${res.status}).`);
                await this.applySnapshot(await res.json());
            } catch (e) {
                this.toast(e.message || String(e), 'error');
            }
        },

        // --- calibration & control -----------------------------------------------------------
        async runCalibration() {
            await this.guard(async () => {
                this.toast('Keep paws off the keys while calibrating...', 'info');
                await this.device.calStart();
                await new Promise((r) => setTimeout(r, 4000));
                await this.device.calEnd();
            }, 'Calibration done');
        },

        async resetBoard() {
            if (!confirm('Reset the board? Your saved config on the keyboard will restart.')) return;
            await this.guard(async () => this.device.reset(), 'Board reset');
        },

        async factoryReset() {
            if (!confirm('FACTORY RESET wipes every setting on the keyboard back to stock. Continue?')) return;
            if (!confirm('Are you really sure? This cannot be undone.')) return;
            await this.guard(async () => {
                await this.device.factoryReset();
                await new Promise((r) => setTimeout(r, 800));
                const state = await this.device.readAllState(this.profile);
                this.layers = state.layers;
                this.colors = state.colors;
                this.config = state.config;
                this.rt = state.rt;
            }, 'Factory reset complete');
        },

        // --- firmware ---------------------------------------------------------------------------
        fwSource: 'official',
        fwFile: null,
        fwSize: 0,

        pickFwFile(e) {
            const file = e.target.files?.[0];
            if (!file) return;
            this.fwFile = file;
            this.fwSize = file.size;
        },

        async startFlash() {
            if (this.flashing) return;
            if (!confirm('FIRMWARE FLASH: do not unplug the keyboard or close this page until it finishes. Continue?')) return;
            if (!confirm('Last warning — an interrupted flash can brick the board. Ready?')) return;
            this.flashing = true;
            this.flashProgress = 0;
            this.flashStage = 'download';
            try {
                let fwBytes;
                if (this.fwSource === 'file' && this.fwFile) {
                    fwBytes = await firmwareFromUpload(this.fwFile);
                } else {
                    fwBytes = await fetchOfficialFirmware();
                }
                this.toast(`Firmware loaded (${formatBytes(fwBytes.byteLength)}) — rebooting into bootloader...`, 'info');
                await this.device.enterBoot();
                await new Promise((r) => setTimeout(r, 2500));
                this.flashStage = 'flash';
                await flashFirmware(new Uint8Array(fwBytes), {
                    onProgress: (p) => {
                        this.flashProgress = p;
                    },
                    onStage: (s) => {
                        this.flashStage = s;
                    },
                });
                this.toast('Flash complete! The board will restart. Reconnect it in a moment.', 'success');
                this.phase = 'gate';
                this.mascot = 'happy';
            } catch (e) {
                this.toast(e.message || String(e), 'error');
                this.flashStage = '';
            } finally {
                this.flashing = false;
            }
        },
    };
}

export function hexToRgb(hex) {
    const m = hex.replace('#', '');
    return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}

export function rgbToHex([r, g, b]) {
    return '#' + [r, g, b].map((v) => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('');
}

export { clamp, entryName, entryKind, normalEntry, emptyEntry, TYPE };
