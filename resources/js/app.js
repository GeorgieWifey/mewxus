import 'virtual:uno.css';
import '../css/app.css';
import Alpine from 'alpinejs';
import htmx from 'htmx.org';

import { LAYOUT_KEYS, SWITCH_TYPES, LIGHTING_EFFECTS, KEY_CATEGORIES } from './hid/layout.js';
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
  activeTab: 'keymap', // 'keymap', 'lighting', 'rapid_trigger', 'socd', 'switches', 'visualizer', 'macros', 'presets', 'settings', 'firmware'
  activeLayer: 0,
  selectedKeyIndex: null,
  selectedCategory: 'basic',
  searchQuery: '',
  splitSpacebar: false,

  // Mascot state
  mascotMood: 'idle',
  mascotSpeech: 'Connect your Nexus 61S or try Demo Mode',
  mascotTimer: null,

  // Hardware layout & switches
  layoutKeys: LAYOUT_KEYS,
  switchTypes: SWITCH_TYPES,
  lightingEffects: LIGHTING_EFFECTS,
  keyCategories: KEY_CATEGORIES,

  // Selected switch type for switch selector (default: Magnetic Jade Pro = 1)
  selectedSwitchType: 1,

  // Per-key switch types: index -> switch_type (0..14)
  keySwitchMap: {},

  // Default slots from hardware
  defaultSlots: [],

  // Keymaps per layer: 4 arrays of 66 keys
  layers: [
    [], [], [], []
  ],

  // Pressed keys tracking (for 0xA0 live travel events): keyIndex -> depthMm
  pressedKeys: {},
  lastPressedKey: null,
  currentTravelMm: 0.0,
  peakTravelMm: 0.0,

  // Travel history for real-time waveform visualizer (array of last 20 depth values)
  travelWaveform: Array(20).fill(0),

  // SOCD (Snap Tap / Opposing Cardinal Directions) State
  socdPairs: [
    {
      id: 1,
      name: 'Counter-Strafe (A + D)',
      key1Index: 29, // A (row 2 col 1)
      key2Index: 31, // D (row 2 col 3)
      priority: 0,   // 0 = Last Input (Snap Tap), 1 = Absolute, 2 = Neutral, 3 = Rappy Snappy
      actuation: 1.5,
      pressSensitivity: 0.15,
      releaseSensitivity: 0.15,
      enabled: true,
    }
  ],
  socdPairIdCounter: 2,
  newSocdKey1: 29,
  newSocdKey2: 31,
  newSocdPriority: 0,
  newSocdActuation: 1.5,
  newSocdPress: 0.15,
  newSocdRelease: 0.15,

  // Live SOCD resolution state for test pad
  socdLiveOutput: {
    activeKey: null,
    resolution: 'IDLE',
    key1Down: false,
    key2Down: false,
    key1Depth: 0.0,
    key2Depth: 0.0,
  },

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
    pressDeadzone: 0.2,
    releaseDeadzone: 0.2,
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

    // Initialize keySwitchMap with default switch
    LAYOUT_KEYS.forEach((_, idx) => {
      this.keySwitchMap[idx] = 1;
    });

    // Initialize initial layers
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

    // Physical keystroke listener for live testing
    window.addEventListener('keydown', (e) => {
      if (this.isConnected) {
        this.mascotMood = 'typing';
        clearTimeout(this.mascotTimer);
        this.mascotTimer = setTimeout(() => {
          this.mascotMood = 'idle';
        }, 1200);

        this.updateSocdLiveSimulation();
      }
    });

    window.addEventListener('keyup', () => {
      if (this.isConnected) {
        this.updateSocdLiveSimulation();
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

        this.defaultSlots = await this.protocol.readKeyMatrix(7, 0, 0);
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
    let rawVal = data[10] !== undefined ? data[10] : (data[6] !== undefined ? data[6] : data[2]);

    let keyIdx = -1;
    if (pressedCode > 0) {
      keyIdx = LAYOUT_KEYS.findIndex(k => k.code === pressedCode);
    }
    if (keyIdx === -1 && data[1] < LAYOUT_KEYS.length) {
      keyIdx = data[1];
    }

    if (keyIdx !== -1) {
      const switchSpec = this.switchTypes[this.keySwitchMap[keyIdx] || 0] || { keyTravel: 3.4 };
      const maxTravel = switchSpec.keyTravel;
      const depthMm = (rawVal / 255) * maxTravel;

      if (depthMm > 0.05) {
        this.pressedKeys[keyIdx] = depthMm;
        this.lastPressedKey = keyIdx;
        this.currentTravelMm = depthMm;
        if (depthMm > this.peakTravelMm) this.peakTravelMm = depthMm;
      } else {
        delete this.pressedKeys[keyIdx];
        if (this.lastPressedKey === keyIdx) {
          this.currentTravelMm = 0.0;
        }
      }

      this.travelWaveform.shift();
      this.travelWaveform.push(this.currentTravelMm);
      this.updateSocdLiveSimulation();
    }
  },

  resolveKeyName(code) {
    for (const cat of Object.values(KEY_CATEGORIES)) {
      const match = cat.find(k => k.code === code);
      if (match) return match.name;
    }
    return `K${code}`;
  },

  // SOCD Logic & Management
  get isSocdConfigured() {
    return this.socdPairs.length > 0;
  },

  isKeyInSocd(keyIndex) {
    return this.socdPairs.some(p => p.enabled && (p.key1Index === keyIndex || p.key2Index === keyIndex));
  },

  getSocdPairForKey(keyIndex) {
    return this.socdPairs.find(p => p.enabled && (p.key1Index === keyIndex || p.key2Index === keyIndex));
  },

  addQuickSocd(presetType) {
    let k1 = 29, k2 = 31, name = 'Counter-Strafe (A + D)';
    if (presetType === 'ws') {
      k1 = 16; k2 = 30; name = 'Forward/Back (W + S)';
    } else if (presetType === 'qe') {
      k1 = 15; k2 = 17; name = 'Lean-Strafe (Q + E)';
    }

    this.socdPairs.push({
      id: this.socdPairIdCounter++,
      name,
      key1Index: k1,
      key2Index: k2,
      priority: 0,
      actuation: 1.5,
      pressSensitivity: 0.15,
      releaseSensitivity: 0.15,
      enabled: true,
    });

    this.showToast(`Added SOCD pair: ${name}`, 'success');
    this.syncSocdToHardware();
  },

  addCustomSocdPair() {
    if (this.newSocdKey1 === this.newSocdKey2) {
      this.showToast('Please select two different keys for SOCD pair', 'info');
      return;
    }

    const k1Name = LAYOUT_KEYS[this.newSocdKey1]?.name || 'Key1';
    const k2Name = LAYOUT_KEYS[this.newSocdKey2]?.name || 'Key2';

    this.socdPairs.push({
      id: this.socdPairIdCounter++,
      name: `Custom (${k1Name} + ${k2Name})`,
      key1Index: this.newSocdKey1,
      key2Index: this.newSocdKey2,
      priority: this.newSocdPriority,
      actuation: this.newSocdActuation,
      pressSensitivity: this.newSocdPress,
      releaseSensitivity: this.newSocdRelease,
      enabled: true,
    });

    this.showToast(`Created SOCD pair [${k1Name} + ${k2Name}]`, 'success');
    this.syncSocdToHardware();
  },

  removeSocdPair(id) {
    this.socdPairs = this.socdPairs.filter(p => p.id !== id);
    this.showToast('Removed SOCD pair', 'info');
    this.syncSocdToHardware();
  },

  async syncSocdToHardware() {
    if (!this.isConnected) return;

    try {
      for (const pair of this.socdPairs) {
        if (!pair.enabled) continue;

        const k1 = this.layers[this.activeLayer][pair.key1Index];
        const k2 = this.layers[this.activeLayer][pair.key2Index];
        const slot1 = k1?.slotIndex !== undefined ? k1.slotIndex : pair.key1Index;
        const slot2 = k2?.slotIndex !== undefined ? k2.slotIndex : pair.key2Index;

        // Type 148 for SOCD, Type 147 for Rappy Snappy
        const socdType = pair.priority === 3 ? 147 : 148;

        // Set hardware key binding
        await this.protocol.setUserKey(0, this.activeLayer, slot1, socdType, pair.priority, slot2);
        await this.protocol.setUserKey(0, this.activeLayer, slot2, socdType, pair.priority, slot1);

        // Set trigger params
        await this.protocol.setKeyTrigger({
          switch_type: this.keySwitchMap[pair.key1Index] || 0,
          key_mode: 1,
          key_actuation: pair.actuation,
          rt_press: pair.pressSensitivity,
          rt_release: pair.releaseSensitivity,
        }, 0, slot1);

        await this.protocol.setKeyTrigger({
          switch_type: this.keySwitchMap[pair.key2Index] || 0,
          key_mode: 1,
          key_actuation: pair.actuation,
          rt_press: pair.pressSensitivity,
          rt_release: pair.releaseSensitivity,
        }, 0, slot2);
      }

      this.showToast('SOCD settings synchronized to hardware', 'success');
    } catch (err) {
      console.error(err);
      this.showToast('Error syncing SOCD to hardware', 'error');
    }
  },

  updateSocdLiveSimulation() {
    const pair = this.socdPairs.find(p => p.enabled);
    if (!pair) {
      this.socdLiveOutput = { activeKey: null, resolution: 'NO SOCD PAIR', key1Down: false, key2Down: false, key1Depth: 0, key2Depth: 0 };
      return;
    }

    const d1 = this.pressedKeys[pair.key1Index] || 0;
    const d2 = this.pressedKeys[pair.key2Index] || 0;
    const k1Down = d1 >= pair.actuation;
    const k2Down = d2 >= pair.actuation;
    const k1Name = LAYOUT_KEYS[pair.key1Index]?.name || 'KEY 1';
    const k2Name = LAYOUT_KEYS[pair.key2Index]?.name || 'KEY 2';

    let resolution = 'IDLE';
    let activeKey = null;

    if (!k1Down && !k2Down) {
      resolution = 'IDLE';
    } else if (k1Down && !k2Down) {
      activeKey = k1Name;
      resolution = `${k1Name} ACTIVE`;
    } else if (!k1Down && k2Down) {
      activeKey = k2Name;
      resolution = `${k2Name} ACTIVE`;
    } else if (k1Down && k2Down) {
      // Both keys pressed: resolve based on priority mode
      if (pair.priority === 0) { // Last Input Priority / Snap Tap
        activeKey = this.lastPressedKey === pair.key1Index ? k1Name : k2Name;
        resolution = `LAST INPUT WIN (${activeKey})`;
      } else if (pair.priority === 1) { // Absolute Priority / First Key Win
        activeKey = this.lastPressedKey === pair.key1Index ? k2Name : k1Name;
        resolution = `ABSOLUTE WIN (${activeKey})`;
      } else if (pair.priority === 2) { // Neutral (Cancel Out)
        activeKey = null;
        resolution = 'NEUTRAL (CANCEL OUT)';
      } else if (pair.priority === 3) { // Rappy Snappy (Deeper Key Priority)
        activeKey = d1 >= d2 ? k1Name : k2Name;
        resolution = `DEEPER KEY WIN (${activeKey} ${Math.max(d1, d2).toFixed(1)}mm)`;
      }
    }

    this.socdLiveOutput = {
      activeKey,
      resolution,
      key1Down,
      key2Down,
      key1Depth: d1,
      key2Depth: d2,
    };
  },

  // Switch Selector methods
  get currentMaxTravel() {
    const sw = this.switchTypes[this.selectedSwitchType] || { keyTravel: 3.4 };
    return sw.keyTravel;
  },

  getSwitchColor(keyIdx) {
    const swIdx = this.keySwitchMap[keyIdx] || 0;
    return this.switchTypes[swIdx]?.color || '#6a9955';
  },

  async applySwitchToSelectedKey(swVal) {
    if (this.selectedKeyIndex === null) {
      this.showToast('Click a key on the board first', 'info');
      return;
    }

    this.keySwitchMap[this.selectedKeyIndex] = swVal;
    const sw = this.switchTypes[swVal];
    this.showToast(`Installed ${sw.name} on Key #${this.selectedKeyIndex}`, 'success');

    if (this.isConnected) {
      const k = this.layers[this.activeLayer][this.selectedKeyIndex];
      const slot = k.slotIndex !== undefined ? k.slotIndex : this.selectedKeyIndex;
      await this.protocol.setKeyTrigger({
        switch_type: swVal,
        key_mode: 1,
        key_actuation: Math.min(sw.keyTravel, this.rapidTrigger.globalActuation),
        rt_press: this.rapidTrigger.globalPressSensitivity,
        rt_release: this.rapidTrigger.globalReleaseSensitivity,
      }, 0, slot);
    }
  },

  async applySwitchToAllKeys(swVal) {
    this.selectedSwitchType = swVal;
    LAYOUT_KEYS.forEach((_, idx) => {
      this.keySwitchMap[idx] = swVal;
    });

    const sw = this.switchTypes[swVal];
    if (this.rapidTrigger.globalActuation > sw.keyTravel) {
      this.rapidTrigger.globalActuation = Math.max(0.1, sw.keyTravel - 0.2);
    }

    this.showToast(`Applied ${sw.name} (${sw.keyTravel}mm) to all 61 keys`, 'success');

    if (this.isConnected) {
      const travelList = LAYOUT_KEYS.map((k, idx) => ({
        switch_type: swVal,
        key_mode: 1,
        key_actuation: Math.min(sw.keyTravel, this.rapidTrigger.globalActuation),
        rt_press: this.rapidTrigger.globalPressSensitivity,
        rt_release: this.rapidTrigger.globalReleaseSensitivity,
      }));
      await this.protocol.setAllKeyTravel(travelList, 0);
    }
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
    if (presetData.socd_pairs) this.socdPairs = presetData.socd_pairs;

    if (this.isConnected) {
      this.syncKeymap();
      this.updateLighting();
      this.updateRapidTrigger();
      this.updateBaseConfig();
      this.syncSocdToHardware();
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
