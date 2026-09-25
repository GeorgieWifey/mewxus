// Sonix bootloader flashing: device re-enumerates as 0x0C45:0x0500 after
// enterBoot(). Flow: erase -> send 32B chunks -> verify chunks -> end -> succ.

import { BootTransport } from './transport.js';
import { BOOT_CMD, eraseRomCommand, romDataCommands, endRomCommand, succRomCommand } from './protocol.js';

export async function flashFirmware(fwBytes, { onProgress = () => {}, onStage = () => {} } = {}) {
    onStage('waiting');
    const hidDevice = await BootTransport.request(BootTransport.BOOT_FILTERS ?? undefined);
    const transport = new BootTransport(hidDevice);
    await transport.open();

    try {
        onStage('erase');
        const erase = eraseRomCommand(0xfeed, 0x5eea);
        await transport.send(erase.cmd, erase.args);

        onStage('write');
        const writes = romDataCommands(fwBytes, BOOT_CMD.SEND);
        for (let i = 0; i < writes.length; i++) {
            await transport.send(writes[i].cmd, writes[i].args);
            onProgress(Math.round(1 + (40 * i) / writes.length));
        }

        onStage('verify');
        const checks = romDataCommands(fwBytes, BOOT_CMD.CHECK);
        for (let i = 0; i < checks.length; i++) {
            await transport.send(checks[i].cmd, checks[i].args);
            onProgress(Math.round(41 + (40 * i) / checks.length));
        }

        onStage('finish');
        onProgress(100);
        const end = endRomCommand();
        await transport.send(end.cmd, end.args);
        const succ = succRomCommand();
        await transport.send(succ.cmd, succ.args);
        onStage('done');
    } finally {
        await transport.close();
    }
}
