/**
 * Mock Device Emulator for Yodall Nexus 61S
 * Allows full interactive testing of all features without physical hardware.
 */

import { LAYOUT_KEYS, LIGHTING_EFFECTS } from './layout.js';

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

    // In-memory keyboard state
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
      layers: [
        this.generateDefaultKeymap(0),
        this.generateDefaultKeymap(1),
        this.generateDefaultKeymap(2),
        this.generateDefaultKeymap(3),
      ],
      macros: Array.from({ length: 16 }, (_, i) => ({
        id: i,
        name: `Macro ${i + 1}`,
        actions: []
      })),
    };

    this.setupPhysicalKeyboardListeners();
  }

  generateDefaultKeymap(layer) {
    return LAYOUT_KEYS.map((k, idx) => ({
      index: idx,
      type: k.code === 255 ? 224 : 16,
      code: k.code,
      modifier: 0,
      name: k.name,
    }));
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
      // Find matching key in layout
      const keyObj = LAYOUT_KEYS.find(k => {
        if (k.name.toLowerCase() === e.key.toLowerCase()) return true;
        if (e.code.toLowerCase().includes(k.name.toLowerCase())) return true;
        return false;
      });

      const keyIndex = keyObj ? LAYOUT_KEYS.indexOf(keyObj) : 0;
      this.simulateKeyTravel(keyIndex, 3.8); // 3.8mm press
    });

    window.addEventListener('keyup', (e) => {
      const keyObj = LAYOUT_KEYS.find(k => {
        if (k.name.toLowerCase() === e.key.toLowerCase()) return true;
        if (e.code.toLowerCase().includes(k.name.toLowerCase())) return true;
        return false;
      });

      const keyIndex = keyObj ? LAYOUT_KEYS.indexOf(keyObj) : 0;
      this.simulateKeyTravel(keyIndex, 0.0); // Release
    });
  }

  /**
   * Simulate a live 0xA0 travel packet
   * @param {number} keyIndex
   * @param {number} depthMm (0.0 to 4.0)
   */
  simulateKeyTravel(keyIndex, depthMm) {
    const packet = new Uint8Array(64);
    packet[0] = 0xA0; // 160
    packet[1] = keyIndex;
    packet[2] = Math.min(255, Math.round((depthMm / 4.0) * 255)); // travel raw
    this.emit('travel', packet);
  }

  async sendCommand(cmd, args = []) {
    // Artificial latency for realism (15ms)
    await new Promise(r => setTimeout(r, 15));

    // Handle 0x55 (85)
    if (cmd === 85) {
      const sub = args[0];

      // Subcommand 3: getInfo
      if (sub === 3) {
        const res = new Array(64).fill(0);
        res[8] = 0x18; // 18 hex
        res[9] = 0x01; // 01 hex -> 1.18
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

      // Subcommand 5: read memory (keymap / lighting)
      if (sub === 5) {
        const len = args[3] || 32;
        const addr = (args[5] << 8) | args[4];
        const res = new Array(64).fill(0);

        // Check if reading keymap: 2048 * layer
        const layer = Math.floor(addr / 2048);
        if (layer >= 0 && layer < 4) {
          const keymap = this.state.layers[layer];
          const byteOffset = addr % 2048;
          for (let i = 0; i < len; i++) {
            const keyIndex = Math.floor((byteOffset + i) / 3);
            const byteType = (byteOffset + i) % 3;
            const k = keymap[keyIndex] || { type: 16, code: 0, modifier: 0 };
            if (byteType === 0) res[8 + i] = k.type;
            else if (byteType === 1) res[8 + i] = k.modifier;
            else if (byteType === 2) res[8 + i] = k.code;
          }
        }
        return res;
      }

      // Subcommand 6: write memory
      if (sub === 6) {
        const len = args[3];
        const addr = (args[5] << 8) | args[4];
        const data = args.slice(6, 6 + len);

        const layer = Math.floor(addr / 2048);
        if (layer >= 0 && layer < 4) {
          const byteOffset = addr % 2048;
          for (let i = 0; i < len; i++) {
            const keyIndex = Math.floor((byteOffset + i) / 3);
            const byteType = (byteOffset + i) % 3;
            if (!this.state.layers[layer][keyIndex]) {
              this.state.layers[layer][keyIndex] = { index: keyIndex, type: 16, code: 0, modifier: 0 };
            }
            if (byteType === 0) this.state.layers[layer][keyIndex].type = data[i];
            else if (byteType === 1) this.state.layers[layer][keyIndex].modifier = data[i];
            else if (byteType === 2) this.state.layers[layer][keyIndex].code = data[i];
          }
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
        this.state.rapidTrigger.globalActuation = (args[1] || 20) / 10;
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
      this.state.layers = [
        this.generateDefaultKeymap(0),
        this.generateDefaultKeymap(1),
        this.generateDefaultKeymap(2),
        this.generateDefaultKeymap(3),
      ];
      return new Array(64).fill(0);
    }

    return new Array(64).fill(0);
  }

  async close() {
    this.emit('disconnect', {});
  }
}
