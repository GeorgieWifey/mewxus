// WebHID transport: serialized command queue + async event routing.
// Mirrors the official driver: one in-flight command, responses consumed FIFO,
// async 0xA0 (live key travel) reports are skipped by the queue and routed to
// event listeners instead.

import { packReport } from './bytes.js';
import { parseKeyEvent } from './protocol.js';

export const RUNTIME_FILTERS = [
    { vendorId: 0xfeed, productId: 0x5eea, usagePage: 1, usage: 0 },
    { vendorId: 0xfeed, productId: 0xeea, usagePage: 0xff00, usage: 1 },
];

export const BOOT_FILTERS = [
    { vendorId: 0x0c45, productId: 0x0500, usagePage: 0xff05, usage: 0x10 },
];

export class HidTransport {
    constructor(device) {
        this.device = device; // HIDDevice
        this.queue = [];
        this.flushing = false;
        this.pending = null; // { resolve, reject } for the next response
        this.buffer = []; // responses that arrived with no waiter
        this.listeners = [];
        this.onReport = this.onReport.bind(this);
    }

    static supported() {
        return typeof navigator !== 'undefined' && !!navigator.hid;
    }

    static async request(filters = RUNTIME_FILTERS) {
        const [device] = await navigator.hid.requestDevice({ filters });
        if (!device) throw new Error('No device selected.');
        return device;
    }

    static async getGranted(filters = RUNTIME_FILTERS) {
        const all = await navigator.hid.getDevices();
        const device = all.find((d) =>
            filters.some((f) => d.vendorId === f.vendorId && d.productId === f.productId),
        );
        return device || null;
    }

    async open() {
        if (!this.device.opened) await this.device.open();
        this.device.addEventListener('inputreport', this.onReport);
    }

    onReport(e) {
        const report = new Uint8Array(e.data.buffer);
        // async live key-travel events bypass the command queue
        if (report[0] === 0xa0) {
            const ev = parseKeyEvent(report);
            if (ev) this.listeners.forEach((fn) => fn(ev));
            return;
        }
        if (this.pending) {
            const { resolve } = this.pending;
            this.pending = null;
            resolve(report);
        } else {
            this.buffer.push(report);
        }
    }

    /** send one command, resolve with the response payload (bytes 8..63) */
    send(cmd, args = []) {
        return new Promise((resolve, reject) => {
            this.queue.push({ cmd, args, resolve, reject });
            this.flush();
        });
    }

    waitForResponse() {
        if (this.buffer.length > 0) return Promise.resolve(this.buffer.shift());
        return new Promise((resolve, reject) => {
            this.pending = { resolve, reject };
        });
    }

    async flush() {
        if (this.flushing) return;
        this.flushing = true;
        try {
            while (this.queue.length > 0) {
                const job = this.queue.shift();
                try {
                    if (!this.device.opened) throw new Error('Device is not open.');
                    await this.device.sendReport(0, packReport(job.cmd, job.args));
                    const report = await this.waitForResponse();
                    job.resolve(report.slice(8));
                } catch (err) {
                    job.reject(err);
                }
            }
        } finally {
            this.flushing = false;
        }
    }

    onKeyEvent(fn) {
        this.listeners.push(fn);
        return () => {
            const i = this.listeners.indexOf(fn);
            if (i > -1) this.listeners.splice(i, 1);
        };
    }

    async close() {
        try {
            this.device.removeEventListener('inputreport', this.onReport);
            if (this.device.opened) await this.device.close();
        } catch {
            /* already gone */
        }
    }
}

/** Bootloader transport: same framing, no async-event filtering. */
export class BootTransport extends HidTransport {
    onReport(e) {
        const report = new Uint8Array(e.data.buffer);
        if (this.pending) {
            const { resolve } = this.pending;
            this.pending = null;
            resolve(report);
        } else {
            this.buffer.push(report);
        }
    }
}
