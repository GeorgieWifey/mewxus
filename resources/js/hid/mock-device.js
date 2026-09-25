/**
 * Mock Device Emulator for Yodall Nexus 61S
 * Allows full interactive testing of all features without physical hardware.
 */

import { LAYOUT_KEYS, LAYOUT_CODES, LIGHTING_EFFECTS } from './layout.js';

export class MockDevice {
  constructor() {
    this.isDemo = true;
    this.device = {
      vendorId: 0xFEED,
      productId: 0x5EEA,
      productName: 'Nexus 61S (Demo Mode)',
    };

    this.listeners = {
      travel: [],
      profile: [],
      reset: [],
      light: [],
      disconnect: [],
    };

    // Initialize 128 slots per layer matching LAYOUT_CODES
    const defaultSlots = Array.from({ length: 128 }, (_, i) => {
      const codeDef = LAYOUT_CODES[i] || { type: 16, code1: 0, code2: (LAYOUT_KEYS[i]?.code || 0) };
      return { slot: i, type: codeDef.type, code1: codeDef.code1, code2: codeDef.code2 };
    });

    this.state = {
      fwVersion: '1.18',
      baseConfig: {
        reportRate: 1000,
        lightSleep: 5,
        systemMode: 0,
        lockWin: false,
        lockAltTab: false,
        lockAltF4: false,
        debounce: 2,
        floorLampSync: true,
        stabilityMode: false,
        berserkMode: true,
      },
      lighting: {
        effect: 1, // Spectrum
        brightness: 90,
        speed: 60,
        direction: 0,
        color: { r: 136, g: 57, b: 239 }, // Catppuccin Mauve
      },
      perKeyColors: {},
      rapidTrigger: {
        globalActuation: 1.5,
        globalPressSensitivity: 0.2,
        globalReleaseSensitivity: 0.2,
        continuousRapidTrigger: true,
      },
      perKeyActuation: {},
      defaultMatrix: defaultSlots,
      userLayers: [
        JSON.parse(JSON.stringify(defaultSlots)),
        JSON.parse(JSON.stringify(defaultSlots)),
        JSON.parse(JSON.stringify(defaultSlots)),
        JSON.parse(JSON.stringify(defaultSlots)),
      ],
      macros: Array.from({ length: 16 }, (_, i) => ({
        id: i,
        name: `Macro ${i + 1}`,
        actions: []
      })),
    };

    this.setupPhysicalKeyboardListeners();
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      for (const cb of this.listeners[event]) {
        try {
          cb(data);
        } catch (err) {
          console.error(`Mock error in listener for ${event}:`, err);
        }
      }
    }
  }

  setupPhysicalKeyboardListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      const keyObj = LAYOUT_KEYS.find(k => {
        if (k.name.toLowerCase() === e.key.toLowerCase()) return true;
        if (e.code.toLowerCase().includes(k.name.toLowerCase())) return true;
        return false;
      });

      const keyIndex = keyObj ? LAYOUT_KEYS.indexOf(keyObj) : 0;
      this.simulateKeyTravel(keyIndex, 3.8);
    });

    window.addEventListener('keyup', (e) => {
      const keyObj = LAYOUT_KEYS.find(k => {
        if (k.name.toLowerCase() === e.key.toLowerCase()) return true;
        if (e.code.toLowerCase().includes(k.name.toLowerCase())) return true;
        return false;
      });

      const keyIndex = keyObj ? LAYOUT_KEYS.indexOf(keyObj) : 0;
      this.simulateKeyTravel(keyIndex, 0.0);
    });
  }

  simulateKeyTravel(keyIndex, depthMm) {
    const packet = new Uint8Array(64);
    packet[0] = 0xA0; // 160
    packet[1] = keyIndex;
    packet[2] = Math.min(255, Math.round((depthMm / 4.0) * 255));
    this.emit('travel', packet);
  }

  async sendCommand(cmd, args = []) {
    await new Promise(r => setTimeout(r, 10));

    // Handle 0x55 (85)
    if (cmd === 85) {
      const sub = args[0];

      // Subcommand 3: getInfo
      if (sub === 3) {
        const res = new Array(64).fill(0);
        res[8] = 0x18;
        res[9] = 0x01; // 1.18
        return res;
      }

      // Subcommand 4: getBaseConfig
      if (sub === 4) {
        const res = new Array(64).fill(0);
        res[8] = this.state.baseConfig.reportRate === 1000 ? 232 : 100;
        res[9] = this.state.baseConfig.lightSleep;
        res[10] = this.state.baseConfig.systemMode;
        let mask = 0;
        if (this.state.baseConfig.lockWin) mask |= 1;
        if (this.state.baseConfig.lockAltTab) mask |= 2;
        if (this.state.baseConfig.lockAltF4) mask |= 4;
        res[11] = mask;
        res[12] = this.state.baseConfig.debounce;
        res[13] = this.state.baseConfig.floorLampSync ? 1 : 0;
        res[14] = this.state.baseConfig.stabilityMode ? 1 : 0;
        res[15] = this.state.baseConfig.berserkMode ? 1 : 0;
        return res;
      }

      // Subcommand 7 (read default matrix) & 8 (read user matrix)
      if (sub === 7 || sub === 8) {
        const len = args[3] || 56;
        const addr = (args[5] << 8) | args[4];
        const res = new Array(64).fill(0);

        const layer = Math.floor(addr / 512);
        const slots = sub === 7 ? this.state.defaultMatrix : (this.state.userLayers[layer] || this.state.defaultMatrix);
        const byteOffset = addr % 512;

        for (let i = 0; i < len; i++) {
          const slotIndex = Math.floor((byteOffset + i) / 3);
          const tripletPos = (byteOffset + i) % 3;
          const s = slots[slotIndex] || { type: 16, code1: 0, code2: 0 };
          if (tripletPos === 0) res[8 + i] = s.type;
          else if (tripletPos === 1) res[8 + i] = s.code1;
          else if (tripletPos === 2) res[8 + i] = s.code2;
        }
        return res;
      }

      // Subcommand 9: write user key to slot
      if (sub === 9) {
        const len = args[3];
        const addr = (args[5] << 8) | args[4];
        const layer = Math.floor(addr / 512);
        const slot = Math.floor((addr % 512) / 3);
        const type = args[7];
        const code1 = args[8];
        const code2 = args[9];

        if (this.state.userLayers[layer]) {
          this.state.userLayers[layer][slot] = { slot, type, code1, code2 };
        }
        return new Array(64).fill(0);
      }

      // Subcommand 160: get Rapid Trigger
      if (sub === 160) {
        const res = new Array(64).fill(0);
        res[8] = Math.round(this.state.rapidTrigger.globalActuation * 10);
        res[9] = Math.round(this.state.rapidTrigger.globalPressSensitivity * 10);
        res[10] = Math.round(this.state.rapidTrigger.globalReleaseSensitivity * 10);
        res[11] = this.state.rapidTrigger.continuousRapidTrigger ? 1 : 0;
        return res;
      }

      // Subcommand 161: set Rapid Trigger
      if (sub === 161) {
        this.state.rapidTrigger.globalActuation = (args[1] || 15) / 10;
        this.state.rapidTrigger.globalPressSensitivity = (args[2] || 2) / 10;
        this.state.rapidTrigger.globalReleaseSensitivity = (args[3] || 2) / 10;
        this.state.rapidTrigger.continuousRapidTrigger = Boolean(args[4] & 1);
        return new Array(64).fill(0);
      }

      // Reset
      if (sub === 238) {
        return new Array(64).fill(0);
      }
    }

    // Factory reset
    if (cmd === 6 && args[0] === 15 && args[1] === 255) {
      this.state.userLayers = [
        JSON.parse(JSON.stringify(this.state.defaultMatrix)),
        JSON.parse(JSON.stringify(this.state.defaultMatrix)),
        JSON.parse(JSON.stringify(this.state.defaultMatrix)),
        JSON.parse(JSON.stringify(this.state.defaultMatrix)),
      ];
      return new Array(64).fill(0);
    }

    return new Array(64).fill(0);
  }

  async close() {
    this.emit('disconnect', {});
  }
}
