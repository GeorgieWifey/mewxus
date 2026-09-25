/**
 * Protocol Layer for Yodall Nexus 61S
 * Formats commands, addresses, checksums, and parses device responses.
 */

export function decodeKeyInfo(type, code1, code2) {
  let code = code2;
  let name = '';

  if (type === 16) {
    if (code1 !== 0) {
      switch (code1) {
        case 1: code = 224; break; // L-Ctrl
        case 2: code = 225; break; // L-Shift
        case 4: code = 226; break; // L-Alt
        case 8: code = 227; break; // L-Win
        case 16: code = 228; break; // R-Ctrl
        case 32: code = 229; break; // R-Shift
        case 64: code = 230; break; // R-Alt
        case 128: code = 231; break; // R-Win
      }
    }
  } else if (type === 240 && code1 === 255) {
    code = 255; // FN key
  } else if (type === 224) {
    if (code1 === 1 && code2 === 0) code = 200;
    else if (code1 === 2 && code2 === 0) code = 201;
    else if (code1 === 3 && code2 === 0) code = 202;
    else if (code1 === 4 && code2 === 0) code = 203;
  } else if (type === 112) {
    name = `M${code1 + 1}`;
  } else if (type === 144) name = 'DKS';
  else if (type === 145) name = 'TGL';
  else if (type === 146) name = 'MT';
  else if (type === 147) name = 'RS';
  else if (type === 148) name = 'SOCD';
  else if (type === 149) name = 'OKS';

  return { code, name };
}

export function encodeKeyToTriple(code, type = 16) {
  let code1 = 0;
  let code2 = code;

  // Modifier keys encode as type 16 with modifier mask in code1
  if (code === 224) { type = 16; code1 = 1; code2 = 0; }
  else if (code === 225) { type = 16; code1 = 2; code2 = 0; }
  else if (code === 226) { type = 16; code1 = 4; code2 = 0; }
  else if (code === 227) { type = 16; code1 = 8; code2 = 0; }
  else if (code === 228) { type = 16; code1 = 16; code2 = 0; }
  else if (code === 229) { type = 16; code1 = 32; code2 = 0; }
  else if (code === 230) { type = 16; code1 = 64; code2 = 0; }
  else if (code === 231) { type = 16; code1 = 128; code2 = 0; }
  else if (code === 255) { type = 240; code1 = 255; code2 = 0; }
  else if (code >= 200 && code <= 203) { type = 224; code1 = code - 199; code2 = 0; }

  return { type, code1, code2 };
}

export class NexusProtocol {
  constructor(transport) {
    this.transport = transport;
  }

  splitAddr(addr) {
    return [addr & 0xFF, (addr >> 8) & 0xFF];
  }

  calcChecksum(addrLow, addrHigh, len) {
    return (addrLow + addrHigh + len) & 0xFF;
  }

  /**
   * Read firmware information (subcommand 3)
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
   * Read base keyboard config (subcommand 4)
   */
  async getBaseConfig() {
    const res = await this.transport.sendCommand(85, [4, 0, 32, 32]);
    const p = res.slice(8);
    return {
      reportRate: p[0] || 1000,
      lightSleep: p[1] !== undefined ? p[1] : 5,
      systemMode: p[2] || 0,
      lockWin: Boolean(p[3] & 1),
      lockAltTab: Boolean(p[3] & 2),
      lockAltF4: Boolean(p[3] & 4),
      debounce: p[4] || 2,
      floorLampSync: Boolean(p[5]),
      stabilityMode: Boolean(p[6]),
      berserkMode: Boolean(p[7]),
    };
  }

  /**
   * Write base config (subcommand 6)
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
   * Read hardware matrix from EEPROM (subcommand 7 = default, subcommand 8 = user)
   * Formula: baseAddr = 512 * layer + 2048 * profile
   */
  async readKeyMatrix(subcmd = 8, profile = 0, layer = 0) {
    const baseAddr = 512 * layer + 2048 * profile;
    const result = [];

    for (let offset = 0; offset < 512; offset += 56) {
      const len = Math.min(56, 512 - offset);
      const addr = baseAddr + offset;
      const [aLow, aHigh] = this.splitAddr(addr);
      const checksum = (aLow + aHigh + len) & 0xFF;

      const res = await this.transport.sendCommand(85, [subcmd, 0, checksum, len, aLow, aHigh]);
      const chunk = res.slice(8, 8 + len);
      result.push(...chunk);
    }

    const slots = [];
    for (let i = 0; i < 128; i++) {
      const type = result[i * 3] !== undefined ? result[i * 3] : 255;
      const code1 = result[i * 3 + 1] || 0;
      const code2 = result[i * 3 + 2] || 0;
      slots.push({ slot: i, type, code1, code2 });
    }

    return slots;
  }

  /**
   * Write a single key to hardware slot
   * Address: 512 * layer + 3 * slotIndex + 2048 * profile
   * Subcommand: 9
   */
  async setUserKey(profile = 0, layer = 0, slotIndex = 0, type = 16, code1 = 0, code2 = 0) {
    const addr = 512 * layer + 3 * slotIndex + 2048 * profile;
    const data = [type, code1, code2];
    const [aLow, aHigh] = this.splitAddr(addr);
    const len = data.length;
    const checksum = (len + aLow + aHigh + 0 + data[0] + data[1] + data[2]) & 0xFF;

    return await this.transport.sendCommand(85, [9, 0, checksum, len, aLow, aHigh, 0, ...data]);
  }

  /**
   * Write full layer keymap
   */
  async setKeymap(profile = 0, layer = 0, keyList = []) {
    for (const k of keyList) {
      const slot = k.slotIndex !== undefined ? k.slotIndex : k.index;
      await this.setUserKey(profile, layer, slot, k.type || 16, k.code1 || 0, k.code2 || k.code || 0);
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
      brightness: p[1] !== undefined ? p[1] : 90,
      speed: p[2] !== undefined ? p[2] : 60,
      direction: p[3] || 0,
      color: {
        r: p[4] || 136,
        g: p[5] || 57,
        b: p[6] || 239,
      }
    };
  }

  /**
   * Write lighting configuration
   */
  async setLighting(config) {
    const p = new Array(32).fill(0);
    p[0] = config.effect !== undefined ? config.effect : 1;
    p[1] = config.brightness !== undefined ? config.brightness : 90;
    p[2] = config.speed !== undefined ? config.speed : 60;
    p[3] = config.direction || 0;
    if (config.color) {
      p[4] = config.color.r !== undefined ? config.color.r : 136;
      p[5] = config.color.g !== undefined ? config.color.g : 57;
      p[6] = config.color.b !== undefined ? config.color.b : 239;
    }

    const [aLow, aHigh] = [0, 0];
    const len = 32;
    const checksum = this.calcChecksum(aLow, aHigh, len);
    return await this.transport.sendCommand(85, [6, 0, checksum, len, aLow, aHigh, ...p]);
  }

  /**
   * Rapid Trigger & Magnetic Switch Actuation
   */
  async getRapidTrigger() {
    const res = await this.transport.sendCommand(85, [160, 0, 32, 32]);
    const p = res.slice(8);
    return {
      globalActuation: (p[0] || 15) / 10,
      globalPressSensitivity: (p[1] || 2) / 10,
      globalReleaseSensitivity: (p[2] || 2) / 10,
      continuousRapidTrigger: Boolean(p[3] & 1),
    };
  }

  async setRapidTrigger(rtConfig) {
    const p = new Array(32).fill(0);
    p[0] = Math.round((rtConfig.globalActuation || 1.5) * 10);
    p[1] = Math.round((rtConfig.globalPressSensitivity || 0.2) * 10);
    p[2] = Math.round((rtConfig.globalReleaseSensitivity || 0.2) * 10);
    p[3] = rtConfig.continuousRapidTrigger ? 1 : 0;

    return await this.transport.sendCommand(85, [161, 0, ...p]);
  }

  async reset() {
    return await this.transport.sendCommand(85, [238, 0, 0]);
  }

  async factoryReset() {
    return await this.transport.sendCommand(6, [15, 255]);
  }

  async startCalibration() {
    return await this.transport.sendCommand(85, [168, 0, 0]);
  }

  async endCalibration() {
    return await this.transport.sendCommand(85, [169, 0, 0]);
  }

  async enterBootMode() {
    return await this.transport.sendCommand(95, [6, 0, 82, 1, 0, 0, 0, 81]);
  }
}
