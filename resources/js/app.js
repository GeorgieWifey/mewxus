import 'virtual:uno.css';
import '../css/app.css';
import Alpine from 'alpinejs';
import htmx from 'htmx.org';

import { LAYOUT_KEYS, LIGHTING_EFFECTS, KEY_CATEGORIES } from './hid/layout.js';
import { HidTransport } from './hid/transport.js';
import { NexusProtocol } from './hid/protocol.js';
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
  activeTab: 'keymap', // 'keymap', 'lighting', 'rapid_trigger', 'macros', 'presets', 'settings', 'firmware'
  activeLayer: 0,      // 0, 1, 2, 3
  selectedKeyIndex: null,
  selectedCategory: 'basic',
  searchQuery: '',
  splitSpacebar: false,

  // Mascot state
  mascotMood: 'idle', // 'idle', 'happy', 'sleepy', 'shocked', 'typing'
  mascotSpeech: 'Meow! Connect your Nexus 61S or try Demo Mode!',
  mascotTimer: null,

  // Hardware state
  layoutKeys: LAYOUT_KEYS,
  lightingEffects: LIGHTING_EFFECTS,
  keyCategories: KEY_CATEGORIES,

  // Keymaps per layer: 4 arrays of 66 keys
  layers: [
    [], [], [], []
  ],

  // Pressed keys tracking (for 0xA0 live travel events)
  pressedKeys: {}, // keyIndex -> depthMm (0.0 to 4.0)

  // Lighting state
  lighting: {
    effect: 1, // Spectrum
    brightness: 90,
    speed: 60,
    direction: 0,
    color: { r: 136, g: 57, b: 239 }, // Mauve
    customColors: {}, // keyIndex -> hex
  },
  paintColor: '#ea76cb', // Pink for custom per-key lighting

  // Rapid Trigger state
  rapidTrigger: {
    globalActuation: 1.5,
    globalPressSensitivity: 0.2,
    globalReleaseSensitivity: 0.2,
    continuousRapidTrigger: true,
  },
  perKeyActuation: {}, // keyIndex -> mm

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

    // Initialize default layers
    for (let l = 0; l < 4; l++) {
      this.layers[l] = LAYOUT_KEYS.map((k, idx) => ({
        index: idx,
        type: k.code === 255 ? 224 : 16,
        code: k.code,
        modifier: 0,
        name: k.name,
      }));
    }

    // Auto-detect disconnect
    this.transport.on('disconnect', () => {
      this.handleDisconnected();
    });

    // Listen for 0xA0 live key travel events
    this.transport.on('travel', (data) => {
      this.handleTravelEvent(data);
    });

    // Handle htmx custom events
    document.body.addEventListener('presetSaved', (e) => {
      this.showToast(`Preset "${e.detail.name}" saved! 🌸`, 'success');
      this.setMascotMood('happy', 'Saved to preset vault! Purr~');
    });

    document.body.addEventListener('presetDeleted', () => {
      this.showToast('Preset removed', 'info');
    });

    // Physical keypresses in browser trigger cute mascot reaction
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

  setMascotMood(mood, speech = null) {
    this.mascotMood = mood;
    if (speech) this.mascotSpeech = speech;
    clearTimeout(this.mascotTimer);
    this.mascotTimer = setTimeout(() => {
      this.mascotMood = 'idle';
      if (this.isConnected) {
        this.mascotSpeech = this.isDemo ? 'Running in Demo Mode! Press keys to test.' : 'Nexus 61S connected & purring!';
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
    this.setMascotMood('happy', 'Reaching for your Nexus 61S...');

    try {
      const dev = await this.transport.requestAndConnect();
      this.isConnected = true;
      this.isDemo = false;
      this.deviceInfo.name = dev.productName || 'Nexus 61S';

      // Read initial config from device
      try {
        const info = await this.protocol.getInfo();
        this.deviceInfo.fwVersion = info.fwVersion;
        const base = await this.protocol.getBaseConfig();
        this.baseConfig = { ...this.baseConfig, ...base };
        const light = await this.protocol.getLighting();
        this.lighting = { ...this.lighting, ...light };
        const rt = await this.protocol.getRapidTrigger();
        this.rapidTrigger = { ...this.rapidTrigger, ...rt };

        // Read active layer keymap
        const km = await this.protocol.getKeymap(this.activeLayer);
        if (km && km.length > 0) {
          this.layers[this.activeLayer] = km.map((k, idx) => ({
            ...k,
            name: this.resolveKeyName(k.code),
          }));
        }
      } catch (readErr) {
        console.warn('Initial read partial:', readErr);
      }

      this.showToast(`Connected to ${this.deviceInfo.name}! 🐾`, 'success');
      this.setMascotMood('happy', 'Connected! Nexus 61S is ready to customize!');
    } catch (err) {
      console.error(err);
      this.showToast(err.message || 'Failed to connect device', 'error');
      this.setMascotMood('shocked', 'Oops! Could not connect. Try Demo Mode!');
    } finally {
      this.isConnecting = false;
    }
  },

  enableDemoMode() {
    this.mockDevice = new MockDevice();
    this.transport = this.mockDevice;
    this.protocol = new NexusProtocol(this.transport);

    // Forward events
    this.mockDevice.on('travel', (data) => {
      this.handleTravelEvent(data);
    });

    this.isConnected = true;
    this.isDemo = true;
    this.deviceInfo.name = 'Nexus 61S (Demo Mode)';
    this.deviceInfo.fwVersion = '1.18';

    this.showToast('Demo Mode active! All features unlocked ✨', 'success');
    this.setMascotMood('happy', 'Welcome to Demo Mode! Try typing on your keyboard!');
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
    this.setMascotMood('sleepy', 'Keyboard went to sleep. Connect whenever you are ready!');
  },

  handleTravelEvent(data) {
    const keyIndex = data[1];
    const rawVal = data[2]; // 0 - 255
    const depthMm = (rawVal / 255) * 4.0;

    if (depthMm > 0.05) {
      this.pressedKeys[keyIndex] = depthMm;
    } else {
      delete this.pressedKeys[keyIndex];
    }
  },

  resolveKeyName(code) {
    for (const cat of Object.values(KEY_CATEGORIES)) {
      const match = cat.find(k => k.code === code);
      if (match) return match.name;
    }
    return `K${code}`;
  },

  // Key Selection & Mapping
  selectKey(index) {
    this.selectedKeyIndex = index;

    // If on lighting custom paint mode, apply color immediately
    if (this.activeTab === 'lighting' && this.lighting.effect === 0) {
      this.lighting.customColors[index] = this.paintColor;
      this.showToast(`Key #${index} painted ${this.paintColor}!`, 'info');
      return;
    }

    const currentKey = this.layers[this.activeLayer][index];
    this.setMascotMood('happy', `Selected [${currentKey?.name || 'Key'}] on Layer ${this.activeLayer}`);
  },

  assignKeycode(newCode, type = 16) {
    if (this.selectedKeyIndex === null) {
      this.showToast('Please click a key on the visual keyboard first!', 'info');
      return;
    }

    const kName = this.resolveKeyName(newCode);
    this.layers[this.activeLayer][this.selectedKeyIndex] = {
      index: this.selectedKeyIndex,
      type,
      code: newCode,
      modifier: 0,
      name: kName,
    };

    this.showToast(`Assigned [${kName}] to Key #${this.selectedKeyIndex}`, 'success');
    this.setMascotMood('happy', `Assigned [${kName}]! Don't forget to sync.`);

    // Sync to device
    this.syncKeymap();
  },

  async switchLayer(layer) {
    this.activeLayer = layer;
    this.selectedKeyIndex = null;
    this.setMascotMood('happy', `Switched to Layer ${layer}`);

    if (this.isConnected && !this.isDemo) {
      try {
        const km = await this.protocol.getKeymap(layer);
        if (km && km.length > 0) {
          this.layers[layer] = km.map(k => ({
            ...k,
            name: this.resolveKeyName(k.code),
          }));
        }
      } catch (err) {
        console.warn('Could not read layer:', err);
      }
    }
  },

  async syncKeymap() {
    if (!this.isConnected) return;
    try {
      await this.protocol.setKeymap(this.activeLayer, 0, this.layers[this.activeLayer]);
      this.showToast(`Layer ${this.activeLayer} saved to keyboard! 🐾`, 'success');
    } catch (err) {
      console.error(err);
      this.showToast('Error syncing keymap', 'error');
    }
  },

  // Lighting controls
  async updateLighting() {
    if (!this.isConnected) return;
    try {
      await this.protocol.setLighting(this.lighting);
      this.showToast('Lighting effect updated! ✨', 'success');
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

  // Rapid Trigger controls
  async updateRapidTrigger() {
    if (!this.isConnected) return;
    try {
      await this.protocol.setRapidTrigger(this.rapidTrigger);
      this.showToast('Rapid Trigger updated! ⚡', 'success');
      this.setMascotMood('happy', `Actuation set to ${this.rapidTrigger.globalActuation}mm!`);
    } catch (err) {
      console.error(err);
      this.showToast('Error setting Rapid Trigger', 'error');
    }
  },

  // Base config
  async updateBaseConfig() {
    if (!this.isConnected) return;
    try {
      await this.protocol.setBaseConfig(this.baseConfig);
      this.showToast('Settings saved to hardware! ⚙️', 'success');
    } catch (err) {
      console.error(err);
      this.showToast('Error updating settings', 'error');
    }
  },

  // Factory reset
  async triggerReset() {
    if (!confirm('Reset keyboard settings to factory defaults?')) return;
    try {
      await this.protocol.factoryReset();
      this.showToast('Reset to factory defaults! 🌸', 'info');
      this.setMascotMood('shocked', 'Factory reset completed!');
    } catch (err) {
      this.showToast('Reset failed', 'error');
    }
  },

  // Calibration
  async runCalibration() {
    try {
      await this.protocol.startCalibration();
      this.showToast('Calibration started! Press all keys fully down.', 'info');
      this.setMascotMood('typing', 'Calibration in progress! Press each key.');
      setTimeout(async () => {
        await this.protocol.endCalibration();
        this.showToast('Calibration finished & saved! 🐾', 'success');
        this.setMascotMood('happy', 'Sensors calibrated to perfection!');
      }, 5000);
    } catch (err) {
      this.showToast('Calibration error', 'error');
    }
  },

  // Presets
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

    this.showToast(`Applied preset: ${presetData.name} 🌸`, 'success');
    this.setMascotMood('happy', `Loaded preset "${presetData.name}"!`);
  },

  // Filtered keys helper
  get filteredKeycodes() {
    const list = this.keyCategories[this.selectedCategory] || [];
    if (!this.searchQuery) return list;
    const q = this.searchQuery.toLowerCase();
    return list.filter(k => k.name.toLowerCase().includes(q) || String(k.code).includes(q));
  }
}));

Alpine.start();
