/**
 * Protocol Layer for Yodall Nexus 61S
 * Formats commands, addresses, checksums, and parses device responses.
 */

export class NexusProtocol {
  constructor(transport) {
    this.transport = transport;
  }

  /**
   * Helper to split 16-bit address into [low, high]
   */
  splitAddr(addr) {
    return [addr & 0xFF, (addr >> 8) & 0xFF];
  }

  /**
   * Helper to calculate memory command checksum
   * Formula from official driver: (addrLow + addrHigh + len) & 0xFF
   */
  calcChecksum(addrLow, addrHigh, len) {
    return (addrLow + addrHigh + len) & 0xFF;
  }

  /**
   * Read firmware information
   * Subcommand 3
   */
  async getInfo() {
    const res = await this.transport.sendCommand(85, [3, 0, 32, 32]);
    const payload = res.slice(8);
    const fwVerRaw = (payload[1] << 8) | payload[0];
    const fwVer = fwVerRaw.toString(16).toUpperCase();
    return {
      raw: payload,
      fwVersion: fwVer || '1.18',
    };
  }

  /**
   * Read base keyboard config
   * Subcommand 4
   */
  async getBaseConfig() {
    const res = await this.transport.sendCommand(85, [4, 0, 32, 32]);
    const p = res.slice(8);
    return {
      reportRate: p[0] || 1000,
      lightSleep: p[1] || 5, // minutes
      systemMode: p[2] || 0, // 0 = Win, 1 = Mac
      lockWin: Boolean(p[3] & 1),
      lockAltTab: Boolean(p[3] & 2),
      lockAltF4: Boolean(p[3] & 4),
      debounce: p[4] || 2, // ms
      floorLampSync: Boolean(p[5]),
      stabilityMode: Boolean(p[6]),
      berserkMode: Boolean(p[7]),
    };
  }

  /**
   * Write base config
   * Subcommand 6 with base address
   */
  async setBaseConfig(cfg) {
    const p = new Array(32).fill(0);
    p[0] = cfg.reportRate || 1000;
    p[1] = cfg.lightSleep !== undefined ? cfg.lightSleep : 5;
    p[2] = cfg.systemMode || 0;
    let lockMask = 0;
    if (cfg.lockWin) lockMask |= 1;
    if (cfg.lockAltTab) lockMask |= 2;
    if (cfg.lockAltF4) lockMask |= 4;
    p[3] = lockMask;
    p[4] = cfg.debounce || 2;
    p[5] = cfg.floorLampSync ? 1 : 0;
    p[6] = cfg.stabilityMode ? 1 : 0;
    p[7] = cfg.berserkMode ? 1 : 0;

    const [aLow, aHigh] = [0, 0];
    const len = 32;
    const checksum = this.calcChecksum(aLow, aHigh, len);
    return await this.transport.sendCommand(85, [6, 0, checksum, len, aLow, aHigh, ...p]);
  }

  /**
   * Read keymap for a given layer (0-3) and profile (0)
   * 3 bytes per key: [type, code1, code2]
   * Chunked reads of 56 bytes max per packet
   */
  async getKeymap(layer = 0, profile = 0, totalKeys = 66) {
    const baseAddr = 2048 * layer + 512 * profile;
    const totalBytes = totalKeys * 3;
    const result = [];

    for (let offset = 0; offset < totalBytes; offset += 56) {
      const len = Math.min(56, totalBytes - offset);
      const addr = baseAddr + offset;
      const [aLow, aHigh] = this.splitAddr(addr);
      const checksum = this.calcChecksum(aLow, aHigh, len);

      const res = await this.transport.sendCommand(85, [5, 0, checksum, len, aLow, aHigh]);
      const chunk = res.slice(8, 8 + len);
      result.push(...chunk);
    }

    // Parse into key objects
    const keys = [];
    for (let i = 0; i < totalKeys; i++) {
      const type = result[i * 3] || 16;
      const code1 = result[i * 3 + 1] || 0;
      const code2 = result[i * 3 + 2] || 0;
      keys.push({
        index: i,
        type,
        code: code2,
        modifier: code1,
      });
    }

    return keys;
  }

  /**
   * Write keymap for a given layer (0-3) and profile (0)
   */
  async setKeymap(layer = 0, profile = 0, keyList = []) {
    const baseAddr = 2048 * layer + 512 * profile;
    const rawBytes = [];
    for (const k of keyList) {
      rawBytes.push(k.type || 16);
      rawBytes.push(k.modifier || 0);
      rawBytes.push(k.code || 0);
    }

    for (let offset = 0; offset < rawBytes.length; offset += 56) {
      const chunk = rawBytes.slice(offset, offset + 56);
      const len = chunk.length;
      const addr = baseAddr + offset;
      const [aLow, aHigh] = this.splitAddr(addr);
      const checksum = this.calcChecksum(aLow, aHigh, len);

      await this.transport.sendCommand(85, [6, 0, checksum, len, aLow, aHigh, ...chunk]);
    }
  }

  /**
   * Read lighting configuration
   */
  async getLighting() {
    const [aLow, aHigh] = [0, 0];
    const len = 32;
    const checksum = this.calcChecksum(aLow, aHigh, len);
    const res = await this.transport.sendCommand(85, [5, 0, checksum, len, aLow, aHigh]);
    const p = res.slice(8);
    return {
      effect: p[0] || 0,
      brightness: p[1] !== undefined ? p[1] : 100,
      speed: p[2] !== undefined ? p[2] : 50,
      direction: p[3] || 0,
      color: {
        r: p[4] || 255,
        g: p[5] || 150,
        b: p[6] || 200,
      }
    };
  }

  /**
   * Write lighting configuration
   */
  async setLighting(config) {
    const p = new Array(32).fill(0);
    p[0] = config.effect !== undefined ? config.effect : 1;
    p[1] = config.brightness !== undefined ? config.brightness : 100;
    p[2] = config.speed !== undefined ? config.speed : 50;
    p[3] = config.direction || 0;
    if (config.color) {
      p[4] = config.color.r !== undefined ? config.color.r : 255;
      p[5] = config.color.g !== undefined ? config.color.g : 150;
      p[6] = config.color.b !== undefined ? config.color.b : 200;
    }

    const [aLow, aHigh] = [0, 0];
    const len = 32;
    const checksum = this.calcChecksum(aLow, aHigh, len);
    return await this.transport.sendCommand(85, [6, 0, checksum, len, aLow, aHigh, ...p]);
  }

  /**
   * Rapid Trigger & Magnetic Switch Actuation
   * Subcommands 160 & 161
   * Per-key actuation: 8 bytes per key or travel table
   */
  async getRapidTrigger(totalKeys = 66) {
    // Read key trigger configuration
    const res = await this.transport.sendCommand(85, [160, 0, 32, 32]);
    const p = res.slice(8);
    return {
      globalActuation: (p[0] || 20) / 10, // in mm (e.g. 2.0mm)
      globalPressSensitivity: (p[1] || 2) / 10, // in mm (e.g. 0.2mm)
      globalReleaseSensitivity: (p[2] || 2) / 10,
      continuousRapidTrigger: Boolean(p[3] & 1),
    };
  }

  async setRapidTrigger(rtConfig) {
    const p = new Array(32).fill(0);
    p[0] = Math.round((rtConfig.globalActuation || 2.0) * 10);
    p[1] = Math.round((rtConfig.globalPressSensitivity || 0.2) * 10);
    p[2] = Math.round((rtConfig.globalReleaseSensitivity || 0.2) * 10);
    p[3] = rtConfig.continuousRapidTrigger ? 1 : 0;

    return await this.transport.sendCommand(85, [161, 0, ...p]);
  }

  /**
   * Device Reset & Factory Reset
   */
  async reset() {
    return await this.transport.sendCommand(85, [238, 0, 0]);
  }

  async factoryReset() {
    return await this.transport.sendCommand(6, [15, 255]);
  }

  /**
   * Calibration routines
   */
  async startCalibration() {
    return await this.transport.sendCommand(85, [168, 0, 0]);
  }

  async endCalibration() {
    return await this.transport.sendCommand(85, [169, 0, 0]);
  }

  /**
   * Enter bootloader mode for firmware update
   */
  async enterBootMode() {
    return await this.transport.sendCommand(95, [6, 0, 82, 1, 0, 0, 0, 81]);
  }
}
