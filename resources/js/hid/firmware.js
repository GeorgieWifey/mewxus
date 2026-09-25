// Firmware source: the Laravel server proxies the official YODALL image with
// an SSRF allowlist; a local .bin file can be picked instead.

export async function fetchOfficialFirmware() {
    const res = await fetch('/firmware/latest');
    if (!res.ok) throw new Error(`Firmware download failed (${res.status}).`);
    return await res.arrayBuffer();
}

export function firmwareFromUpload(file) {
    return file.arrayBuffer();
}

export function formatBytes(n) {
    if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MiB`;
    return `${(n / 1024).toFixed(1)} KiB`;
}
