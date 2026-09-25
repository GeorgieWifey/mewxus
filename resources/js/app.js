import 'virtual:uno.css';
import '../css/app.css';
import Alpine from 'alpinejs';
import htmx from 'htmx.org';

import { LAYOUT_KEYS, LIGHTING_EFFECTS, KEY_CATEGORIES } from './hid/layout.js';
import { HidTransport } from './hid/transport.js';
import { NexusProtocol, decodeKeyInfo, encodeKeyToTriple } from './hid/protocol.js';
import { MockDevice } from './hid/mock-device.js';

window.htmx = htmx;
window.Alpine = Alpine;

Alpine.data('keyboardDriver', () => ({
  // Connection state
  isConnected: false,
  isDemo: false,
  isConnecting: false,
  transport: null,
  protocol: null,
  mockDevice: null,
  deviceInfo: {
    name: 'Nexus 61S',
    fwVersion: '---',
  },

  // UI state
  activeTab: 'keymap',
  activeLayer: 0,
  selectedKeyIndex: null,
  selectedCategory: 'basic',
  searchQuery: '',
  splitSpacebar: false,

  // Mascot state
  mascotMood: 'idle',
  mascotSpeech: 'Connect your Nexus 61S or try Demo Mode',
  mascotTimer: null,

  // Hardware layout & codes
  layoutKeys: LAYOUT_KEYS,
  lightingEffects: LIGHTING_EFFECTS,
  keyCategories: KEY_CATEGORIES,

  // Hardware default slots cache
  defaultSlots: [],

  // Keymaps per layer: 4 arrays of 66 keys
  layers: [
    [], [], [], []
  ],

  // Pressed keys tracking (for 0xA0 live travel events)
  pressedKeys: {},

  // Lighting state
  lighting: {
    effect: 1, // Spectrum
    brightness: 90,
    speed: 60,
    direction: 0,
    color: { r: 136, g: 57, b: 239 }, // Mauve
    customColors: {},
  },
  paintColor: '#ea76cb',

  // Rapid Trigger state
  rapidTrigger: {
    globalActuation: 1.5,
    globalPressSensitivity: 0.2,
    globalReleaseSensitivity: 0.2,
    continuousRapidTrigger: true,
  },
  perKeyActuation: {},

  // Base config
  baseConfig: {
    reportRate: 1000,
    lightSleep: 5,
    debounce: 2,
    systemMode: 0,
    lockWin: false,
    lockAltTab: false,
    lockAltF4: false,
    floorLampSync: true,
    stabilityMode: false,
    berserkMode: true,
  },

  // Macros
  activeMacroSlot: 0,
  macros: Array.from({ length: 16 }, (_, i) => ({
    id: i,
    name: `Macro ${i + 1}`,
    actions: []
  })),

  // Toast notifications
  toast: {
    show: false,
    message: '',
    type: 'info',
    timer: null,
  },

  init() {
    this.transport = new HidTransport();
    this.protocol = new NexusProtocol(this.transport);

    // Initialize initial layers with default matching
    for (let l = 0; l < 4; l++) {
      this.layers[l] = this.buildInitialLayer(l);
    }

    this.transport.on('disconnect', () => {
      this.handleDisconnected();
    });

    this.transport.on('travel', (data) => {
      this.handleTravelEvent(data);
    });

    document.body.addEventListener('presetSaved', (e) => {
      this.showToast(`Preset "${e.detail.name}" saved`, 'success');
      this.setMascotMood('happy', 'Saved to preset vault');
    });

    document.body.addEventListener('presetDeleted', () => {
      this.showToast('Preset removed', 'info');
    });

    window.addEventListener('keydown', () => {
      if (this.isConnected) {
        this.mascotMood = 'typing';
        clearTimeout(this.mascotTimer);
        this.mascotTimer = setTimeout(() => {
          this.mascotMood = 'idle';
        }, 1200);
      }
    });
  },

  buildInitialLayer(layer) {
    return LAYOUT_KEYS.map((k, idx) => ({
      ...k,
      index: idx,
      slotIndex: idx,
      type: k.code === 255 ? 240 : 16,
      code1: k.code === 255 ? 255 : (k.code >= 224 && k.code <= 231 ? (1 << (k.code - 224)) : 0),
      code2: (k.code >= 224 && k.code <= 231) || k.code === 255 ? 0 : k.code,
      code: k.code,
      name: k.name,
    }));
  },

  updateLayerKeysFromHardware(layer, defaultSlots, userSlots) {
    this.layers[layer] = LAYOUT_KEYS.map((k, idx) => {
      let slotIdx = -1;
      if (defaultSlots && defaultSlots.length > 0) {
        slotIdx = defaultSlots.findIndex(s => s.code === k.code);
      }
      if (slotIdx === -1) slotIdx = idx;

      const userSlot = (userSlots && userSlots[slotIdx] && userSlots[slotIdx].code !== -1 && userSlots[slotIdx].type !== 255)
        ? userSlots[slotIdx]
        : null;

      if (userSlot) {
        const decoded = decodeKeyInfo(userSlot.type, userSlot.code1, userSlot.code2);
        return {
          ...k,
          index: idx,
          slotIndex: slotIdx,
          type: userSlot.type,
          code1: userSlot.code1,
          code2: userSlot.code2,
          code: decoded.code || k.code,
          name: decoded.name || this.resolveKeyName(decoded.code || k.code),
        };
      }

      return {
        ...k,
        index: idx,
        slotIndex: slotIdx,
        type: k.code === 255 ? 240 : 16,
        code1: k.code === 255 ? 255 : 0,
        code2: k.code === 255 ? 0 : k.code,
        code: k.code,
        name: k.name,
      };
    });
  },

  setMascotMood(mood, speech = null) {
    this.mascotMood = mood;
    if (speech) this.mascotSpeech = speech;
    clearTimeout(this.mascotTimer);
    this.mascotTimer = setTimeout(() => {
      this.mascotMood = 'idle';
      if (this.isConnected) {
        this.mascotSpeech = this.isDemo ? 'Running in Demo Mode. Press keys to test.' : 'Nexus 61S connected and active';
      }
    }, 4000);
  },

  showToast(message, type = 'info') {
    this.toast.message = message;
    this.toast.type = type;
    this.toast.show = true;
    clearTimeout(this.toast.timer);
    this.toast.timer = setTimeout(() => {
      this.toast.show = false;
    }, 3500);
  },

  async connectWebHID() {
    this.isConnecting = true;
    this.setMascotMood('happy', 'Searching for Nexus 61S...');

    try {
      const dev = await this.transport.requestAndConnect();
      this.isConnected = true;
      this.isDemo = false;
      this.deviceInfo.name = dev.productName || 'Nexus 61S';

      try {
        const info = await this.protocol.getInfo();
        this.deviceInfo.fwVersion = info.fwVersion;

        const base = await this.protocol.getBaseConfig();
        this.baseConfig = { ...this.baseConfig, ...base };

        const light = await this.protocol.getLighting();
        this.lighting = { ...this.lighting, ...light };

        const rt = await this.protocol.getRapidTrigger();
        this.rapidTrigger = { ...this.rapidTrigger, ...rt };

        // Read default matrix (subcommand 7) to match physical keys to EEPROM slots
        this.defaultSlots = await this.protocol.readKeyMatrix(7, 0, 0);

        // Read active layer user matrix (subcommand 8)
        const userSlots = await this.protocol.readKeyMatrix(8, 0, this.activeLayer);
        this.updateLayerKeysFromHardware(this.activeLayer, this.defaultSlots, userSlots);

      } catch (readErr) {
        console.warn('Initial read partial:', readErr);
      }

      this.showToast(`Connected to ${this.deviceInfo.name}`, 'success');
      this.setMascotMood('happy', 'Connected. Nexus 61S is ready to customize.');
    } catch (err) {
      console.error(err);
      this.showToast(err.message || 'Failed to connect device', 'error');
      this.setMascotMood('shocked', 'Could not connect. Try Demo Mode.');
    } finally {
      this.isConnecting = false;
    }
  },

  async enableDemoMode() {
    this.mockDevice = new MockDevice();
    this.transport = this.mockDevice;
    this.protocol = new NexusProtocol(this.transport);

    this.mockDevice.on('travel', (data) => {
      this.handleTravelEvent(data);
    });

    this.isConnected = true;
    this.isDemo = true;
    this.deviceInfo.name = 'Nexus 61S (Demo Mode)';
    this.deviceInfo.fwVersion = '1.18';

    this.defaultSlots = await this.protocol.readKeyMatrix(7, 0, 0);
    const userSlots = await this.protocol.readKeyMatrix(8, 0, this.activeLayer);
    this.updateLayerKeysFromHardware(this.activeLayer, this.defaultSlots, userSlots);

    this.showToast('Demo Mode active. All features unlocked', 'success');
    this.setMascotMood('happy', 'Demo Mode active. Press physical keys to test.');
  },

  disconnect() {
    if (this.transport) {
      this.transport.close();
    }
    this.handleDisconnected();
  },

  handleDisconnected() {
    this.isConnected = false;
    this.isDemo = false;
    this.deviceInfo.name = 'Nexus 61S';
    this.deviceInfo.fwVersion = '---';
    this.showToast('Keyboard disconnected', 'info');
    this.setMascotMood('sleepy', 'Keyboard disconnected. Connect whenever ready.');
  },

  handleTravelEvent(data) {
    let pressedCode = decodeKeyInfo(data[1], data[2], data[3]).code;
    let rawVal = data[10] !== undefined ? data[10] : data[2];

    let keyIdx = -1;
    if (pressedCode > 0) {
      keyIdx = LAYOUT_KEYS.findIndex(k => k.code === pressedCode);
    }
    if (keyIdx === -1 && data[1] < LAYOUT_KEYS.length) {
      keyIdx = data[1];
    }

    if (keyIdx !== -1) {
      const depthMm = (rawVal / 255) * 4.0;
      if (depthMm > 0.05) {
        this.pressedKeys[keyIdx] = depthMm;
      } else {
        delete this.pressedKeys[keyIdx];
      }
    }
  },

  resolveKeyName(code) {
    for (const cat of Object.values(KEY_CATEGORIES)) {
      const match = cat.find(k => k.code === code);
      if (match) return match.name;
    }
    return `K${code}`;
  },

  selectKey(index) {
    this.selectedKeyIndex = index;

    if (this.activeTab === 'lighting' && this.lighting.effect === 0) {
      this.lighting.customColors[index] = this.paintColor;
      this.showToast(`Key #${index} painted ${this.paintColor}`, 'info');
      return;
    }

    const currentKey = this.layers[this.activeLayer][index];
    this.setMascotMood('happy', `Selected [${currentKey?.name || 'Key'}] on Layer ${this.activeLayer}`);
  },

  async assignKeycode(newCode, newType = 16) {
    if (this.selectedKeyIndex === null) {
      this.showToast('Click a key on the visual keyboard first', 'info');
      return;
    }

    const k = this.layers[this.activeLayer][this.selectedKeyIndex];
    const triple = encodeKeyToTriple(newCode, newType);
    const decoded = decodeKeyInfo(triple.type, triple.code1, triple.code2);
    const kName = decoded.name || this.resolveKeyName(newCode);

    this.layers[this.activeLayer][this.selectedKeyIndex] = {
      ...k,
      type: triple.type,
      code1: triple.code1,
      code2: triple.code2,
      code: newCode,
      name: kName,
    };

    const slot = k.slotIndex !== undefined ? k.slotIndex : this.selectedKeyIndex;

    if (this.isConnected) {
      try {
        await this.protocol.setUserKey(0, this.activeLayer, slot, triple.type, triple.code1, triple.code2);
        this.showToast(`Assigned [${kName}] to Slot #${slot}`, 'success');
      } catch (err) {
        console.error(err);
        this.showToast('Error syncing key to hardware', 'error');
      }
    } else {
      this.showToast(`Assigned [${kName}]`, 'info');
    }

    this.setMascotMood('happy', `Assigned [${kName}]`);
  },

  async switchLayer(layer) {
    this.activeLayer = layer;
    this.selectedKeyIndex = null;
    this.setMascotMood('happy', `Switched to Layer ${layer}`);

    if (this.isConnected) {
      try {
        const userSlots = await this.protocol.readKeyMatrix(8, 0, layer);
        this.updateLayerKeysFromHardware(layer, this.defaultSlots, userSlots);
      } catch (err) {
        console.warn('Could not read layer matrix:', err);
      }
    }
  },

  async syncKeymap() {
    if (!this.isConnected) return;
    try {
      await this.protocol.setKeymap(0, this.activeLayer, this.layers[this.activeLayer]);
      this.showToast(`Layer ${this.activeLayer} saved to keyboard`, 'success');
    } catch (err) {
      console.error(err);
      this.showToast('Error syncing keymap', 'error');
    }
  },

  async updateLighting() {
    if (!this.isConnected) return;
    try {
      await this.protocol.setLighting(this.lighting);
      this.showToast('Lighting effect updated', 'success');
    } catch (err) {
      console.error(err);
      this.showToast('Error setting lighting', 'error');
    }
  },

  setLightingColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    this.lighting.color = { r, g, b };
    this.updateLighting();
  },

  async updateRapidTrigger() {
    if (!this.isConnected) return;
    try {
      await this.protocol.setRapidTrigger(this.rapidTrigger);
      this.showToast('Rapid Trigger updated', 'success');
      this.setMascotMood('happy', `Actuation set to ${this.rapidTrigger.globalActuation}mm`);
    } catch (err) {
      console.error(err);
      this.showToast('Error setting Rapid Trigger', 'error');
    }
  },

  async updateBaseConfig() {
    if (!this.isConnected) return;
    try {
      await this.protocol.setBaseConfig(this.baseConfig);
      this.showToast('Settings saved to hardware', 'success');
    } catch (err) {
      console.error(err);
      this.showToast('Error updating settings', 'error');
    }
  },

  async triggerReset() {
    if (!confirm('Reset keyboard settings to factory defaults?')) return;
    try {
      await this.protocol.factoryReset();
      this.showToast('Reset to factory defaults', 'info');
      this.setMascotMood('shocked', 'Factory reset completed');
    } catch (err) {
      this.showToast('Reset failed', 'error');
    }
  },

  async runCalibration() {
    try {
      await this.protocol.startCalibration();
      this.showToast('Calibration started. Press all keys fully down.', 'info');
      this.setMascotMood('typing', 'Calibration in progress. Press each key.');
      setTimeout(async () => {
        await this.protocol.endCalibration();
        this.showToast('Calibration finished and saved', 'success');
        this.setMascotMood('happy', 'Sensors calibrated');
      }, 5000);
    } catch (err) {
      this.showToast('Calibration error', 'error');
    }
  },

  applyPreset(presetData) {
    if (presetData.layers) this.layers = presetData.layers;
    if (presetData.lighting) this.lighting = { ...this.lighting, ...presetData.lighting };
    if (presetData.rapid_trigger) this.rapidTrigger = { ...this.rapidTrigger, ...presetData.rapid_trigger };
    if (presetData.base_config) this.baseConfig = { ...this.baseConfig, ...presetData.base_config };
    if (presetData.macros) this.macros = presetData.macros;

    if (this.isConnected) {
      this.syncKeymap();
      this.updateLighting();
      this.updateRapidTrigger();
      this.updateBaseConfig();
    }

    this.showToast(`Applied preset: ${presetData.name}`, 'success');
    this.setMascotMood('happy', `Loaded preset "${presetData.name}"`);
  },

  get filteredKeycodes() {
    const list = this.keyCategories[this.selectedCategory] || [];
    if (!this.searchQuery) return list;
    const q = this.searchQuery.toLowerCase();
    return list.filter(k => k.name.toLowerCase().includes(q) || String(k.code).includes(q));
  }
}));

Alpine.start();
