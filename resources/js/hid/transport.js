/**
 * WebHID Transport for Yodall Nexus 61S
 * Handles connection, serialization, packet queueing, and inputreport routing.
 */

export const VENDOR_ID_NORMAL = 0xFEED;      // 65261
export const PRODUCT_ID_PRIMARY = 0x5EEA;    // 24298
export const PRODUCT_ID_SECONDARY = 0x0EEA;  // 3818

export const BOOTLOADER_VENDOR_ID = 0x0C45;  // 3141
export const BOOTLOADER_PRODUCT_ID = 0x0500; // 1280

export const HID_FILTERS = [
  { vendorId: VENDOR_ID_NORMAL, productId: PRODUCT_ID_PRIMARY, usagePage: 1, usage: 0 },
  { vendorId: VENDOR_ID_NORMAL, productId: PRODUCT_ID_SECONDARY, usagePage: 0xFF00, usage: 1 },
];

export const BOOTLOADER_FILTERS = [
  { vendorId: BOOTLOADER_VENDOR_ID, productId: BOOTLOADER_PRODUCT_ID, usagePage: 0xFF05, usage: 16 }
];

export class HidTransport {
  constructor() {
    this.device = null;
    this.isDemo = false;
    this.commandQueue = [];
    this.isFlushing = false;
    this.listeners = {
      travel: [],       // 0xA0 live travel events
      profile: [],      // 0xA1 profile events
      reset: [],        // 0xA2 reset events
      light: [],        // 0xAA 0xFA light events
      disconnect: [],
    };
    this.onInputReportBound = this.handleInputReport.bind(this);
  }

  isSupported() {
    return typeof navigator !== 'undefined' && 'hid' in navigator;
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
          console.error(`Error in listener for ${event}:`, err);
        }
      }
    }
  }

  async requestAndConnect() {
    if (!this.isSupported()) {
      throw new Error('WebHID is not supported in this browser. Please use Chrome, Edge, or Opera, or enable Demo Mode.');
    }

    const devices = await navigator.hid.requestDevice({ filters: HID_FILTERS });
    if (!devices || devices.length === 0) {
      throw new Error('No device selected');
    }

    return await this.attachDevice(devices[0]);
  }

  async attachDevice(device) {
    this.device = device;
    this.isDemo = false;

    if (!this.device.opened) {
      await this.device.open();
    }

    this.device.addEventListener('inputreport', this.onInputReportBound);
    navigator.hid.addEventListener('disconnect', (event) => {
      if (event.device === this.device) {
        this.handleDisconnect();
      }
    });

    return {
      vendorId: this.device.vendorId,
      productId: this.device.productId,
      productName: this.device.productName || 'Nexus 61S',
    };
  }

  handleDisconnect() {
    this.device = null;
    this.emit('disconnect', {});
  }

  handleInputReport(event) {
    const data = new Uint8Array(event.data.buffer);
    const packetType = data[0];

    // Async live travel events (0xA0 = 160)
    if (packetType === 160) {
      this.emit('travel', data);
      return;
    }

    // Profile change event (0xA1 = 161)
    if (packetType === 161) {
      this.emit('profile', data);
      return;
    }

    // Reset event (0xA2 = 162)
    if (packetType === 162) {
      this.emit('reset', data);
      return;
    }

    // Light event (0xAA 0xFA = 170 250)
    if (packetType === 170 && data[1] === 250) {
      this.emit('light', data);
      return;
    }

    // Regular command response: resolve head of pending queue
    if (this.currentPendingPromise) {
      const { resolve } = this.currentPendingPromise;
      this.currentPendingPromise = null;
      resolve(Array.from(data));
    }
  }

  /**
   * Queue and send a 64-byte report
   * @param {number} cmd - Primary command byte (e.g. 85 / 0x55)
   * @param {number[]} args - Command arguments
   * @returns {Promise<number[]>}
   */
  async sendCommand(cmd, args = []) {
    return new Promise((resolve, reject) => {
      this.commandQueue.push({ cmd, args, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isFlushing || this.commandQueue.length === 0) return;
    this.isFlushing = true;

    while (this.commandQueue.length > 0) {
      const item = this.commandQueue.shift();
      try {
        const response = await this.executeRawCommand(item.cmd, item.args);
        item.resolve(response);
      } catch (err) {
        item.reject(err);
      }
    }

    this.isFlushing = false;
  }

  async executeRawCommand(cmd, args = []) {
    if (!this.device && !this.isDemo) {
      throw new Error('Device not connected');
    }

    // 64-byte payload format expected by firmware
    const packet = new Uint8Array(64);
    packet[0] = cmd;
    for (let i = 0; i < args.length && i < 63; i++) {
      packet[i + 1] = args[i];
    }

    // In WebHID, reportId is 0, payload is 64 bytes
    return new Promise(async (resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        if (this.currentPendingPromise?.resolve === resolve) {
          this.currentPendingPromise = null;
          reject(new Error(`Command timeout (cmd: ${cmd}, args: [${args.slice(0, 4).join(',')}...])`));
        }
      }, 1500);

      this.currentPendingPromise = {
        resolve: (data) => {
          clearTimeout(timeoutTimer);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timeoutTimer);
          reject(err);
        }
      };

      try {
        await this.device.sendReport(0, packet);
      } catch (err) {
        clearTimeout(timeoutTimer);
        this.currentPendingPromise = null;
        reject(err);
      }
    });
  }

  async close() {
    if (this.device && this.device.opened) {
      try {
        await this.device.close();
      } catch (e) {
        console.warn('Error closing device:', e);
      }
    }
    this.device = null;
  }
}
