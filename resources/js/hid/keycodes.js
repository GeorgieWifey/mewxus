// HID usage tables + keymap entry types for the picker and renderer.

export const TYPE = {
    EMPTY: 0x00,
    NORMAL: 0x10,
    MACRO: 0x70,
    DKS: 0x90,
    TGL: 0x91,
    MT: 0x92,
    RS: 0x93,
    SOCD: 0x94,
    OKS: 0x95,
    LAYER: 0xe0,
    FN: 0xf0,
};

// modifier bitmasks (code1 for normal keys)
export const MODS = [
    { bit: 1, name: 'LCtrl', short: 'C' },
    { bit: 2, name: 'LShift', short: 'S' },
    { bit: 4, name: 'LAlt', short: 'A' },
    { bit: 8, name: 'LWin', short: 'W' },
    { bit: 16, name: 'RCtrl', short: 'C' },
    { bit: 32, name: 'RShift', short: 'S' },
    { bit: 64, name: 'RAlt', short: 'A' },
    { bit: 128, name: 'RWin', short: 'W' },
];

const modName = (mask) => {
    if (!mask) return '';
    const parts = [];
    if (mask & 2) parts.push('Shift');
    if (mask & 1) parts.push('Ctrl');
    if (mask & 4) parts.push('Alt');
    if (mask & 8) parts.push('Win');
    return parts.join('+') + (parts.length ? '+' : '');
};

// HID usage id -> friendly name (keyboard/page 0x07 subset)
const USAGE_NAMES = {
    4: 'A', 5: 'B', 6: 'C', 7: 'D', 8: 'E', 9: 'F', 10: 'G', 11: 'H', 12: 'I', 13: 'J',
    14: 'K', 15: 'L', 16: 'M', 17: 'N', 18: 'O', 19: 'P', 20: 'Q', 21: 'R', 22: 'S', 23: 'T',
    24: 'U', 25: 'V', 26: 'W', 27: 'X', 28: 'Y', 29: 'Z',
    30: '1', 31: '2', 32: '3', 33: '4', 34: '5', 35: '6', 36: '7', 37: '8', 38: '9', 39: '0',
    40: 'Enter', 41: 'Esc', 42: 'Backspace', 43: 'Tab', 44: 'Space', 45: '-', 46: '=',
    47: '[', 48: ']', 49: '\\', 50: '#', 51: ';', 52: "'", 53: '`', 54: ',', 55: '.', 56: '/',
    57: 'Caps', 58: 'F1', 59: 'F2', 60: 'F3', 61: 'F4', 62: 'F5', 63: 'F6',
    64: 'F7', 65: 'F8', 66: 'F9', 67: 'F10', 68: 'F11', 69: 'F12',
    70: 'PrintScreen', 71: 'Scroll Lock', 72: 'Pause', 73: 'Insert', 74: 'Home',
    75: 'Page Up', 76: 'Delete', 77: 'End', 78: 'Page Down',
    79: 'Right', 80: 'Left', 81: 'Down', 82: 'Up',
    83: 'Num Lock', 84: 'KP /', 85: 'KP *', 86: 'KP -', 87: 'KP +', 88: 'KP Enter',
    89: 'KP 1', 90: 'KP 2', 91: 'KP 3', 92: 'KP 4', 93: 'KP 5', 94: 'KP 6', 95: 'KP 7',
    96: 'KP 8', 97: 'KP 9', 98: 'KP 0', 99: 'KP .',
    101: 'Menu', 118: 'KP =', 127: 'Stop', 128: 'Again', 129: 'Undo',
    135: 'Cut', 136: 'Copy', 137: 'Paste', 138: 'Find', 139: 'Mute',
    140: 'Vol Up', 141: 'Vol Down',
    183: 'F13', 184: 'F14', 185: 'F15', 186: 'F16', 187: 'F17', 188: 'F18',
    189: 'F19', 190: 'F20', 191: 'F21', 192: 'F22', 193: 'F24',
    224: 'LCtrl', 225: 'LShift', 226: 'LAlt', 227: 'LWin',
    228: 'RCtrl', 229: 'RShift', 230: 'RAlt', 231: 'RWin',
    233: 'Eject', 234: 'Power', 240: 'WWW', 241: 'Back',
    242: 'Forward', 248: 'Email', 249: 'Player',
};

// macOS/Windows specials the official driver exposes
export const CUSTOM_KEYS = [
    { code1: 0, code2: 200, name: 'Light 1', desc: 'Lighting layer key' },
    { code1: 0, code2: 201, name: 'Light 2', desc: 'Lighting layer key' },
    { code1: 0, code2: 202, name: 'Light 3', desc: 'Lighting layer key' },
    { code1: 0, code2: 203, name: 'Light 4', desc: 'Lighting layer key' },
];

// layer tap keys: type 0xE0, code1 = layer 1..4 (device renders as codes 200-203)
export const LAYER_KEYS = [
    { layer: 1, name: 'MO 1' },
    { layer: 2, name: 'MO 2' },
    { layer: 3, name: 'MO 3' },
    { layer: 4, name: 'MO 4' },
];

export const usageName = (usage) => USAGE_NAMES[usage] || `U${usage}`;

export function entryName(entry) {
    if (!entry || entry.type === 0 || entry.type === 255 || entry.code2 === 0) return '';
    switch (entry.type) {
        case TYPE.NORMAL:
            return modName(entry.code1) + usageName(entry.code2);
        case TYPE.MACRO:
            return `MACRO ${entry.code1}`;
        case TYPE.DKS:
            return `DKS ${entry.code1 + 1}`;
        case TYPE.TGL:
            return `TGL ${entry.code1 + 1}`;
        case TYPE.MT:
            return `MT ${entry.code2 * 10}ms`;
        case TYPE.RS:
            return 'RS';
        case TYPE.SOCD:
            return 'SOCD';
        case TYPE.OKS:
            return 'OKS';
        case TYPE.LAYER:
            return entry.code1 >= 1 && entry.code1 <= 4 ? `MO ${entry.code1}` : 'LAYER';
        case TYPE.FN:
            return 'FN';
        default:
            return `T${entry.type.toString(16)}`;
    }
}

export function entryKind(entry) {
    if (!entry || entry.type === 0 || entry.type === 255) return 'empty';
    if (entry.type === TYPE.NORMAL && entry.code2 === 0) return 'empty';
    switch (entry.type) {
        case TYPE.NORMAL: return 'normal';
        case TYPE.MACRO: return 'macro';
        case TYPE.DKS: return 'dks';
        case TYPE.TGL: return 'tgl';
        case TYPE.MT: return 'mt';
        case TYPE.RS: return 'rs';
        case TYPE.SOCD: return 'socd';
        case TYPE.OKS: return 'oks';
        case TYPE.LAYER: return 'layer';
        case TYPE.FN: return 'fn';
        default: return 'other';
    }
}

export const emptyEntry = () => ({ type: 0, code1: 0, code2: 0 });
export const normalEntry = (modMask, usage) => ({ type: TYPE.NORMAL, code1: modMask, code2: usage });

// --- picker catalog -------------------------------------------------------------
const u = (usage, label) => ({ usage, label });
const mod = (bit, label) => ({ mod: bit, label });

export const PICKER_GROUPS = [
    {
        id: 'letters', name: 'Letters',
        items: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((ch, i) => u(4 + i, ch)),
    },
    {
        id: 'numbers', name: 'Numbers & symbols',
        items: [
            u(30, '1'), u(31, '2'), u(32, '3'), u(33, '4'), u(34, '5'),
            u(35, '6'), u(36, '7'), u(37, '8'), u(38, '9'), u(39, '0'),
            u(45, '-'), u(46, '='), u(47, '['), u(48, ']'), u(49, '\\'),
            u(50, '#'), u(51, ';'), u(52, "'"), u(53, '`'), u(54, ','), u(55, '.'), u(56, '/'),
        ],
    },
    {
        id: 'function', name: 'Function keys',
        items: Array.from({ length: 12 }, (_, i) => u(58 + i, `F${i + 1}`))
            .concat([u(183, 'F13'), u(184, 'F14'), u(185, 'F15'), u(186, 'F16')]),
    },
    {
        id: 'nav', name: 'Navigation',
        items: [
            u(40, 'Enter'), u(41, 'Esc'), u(42, 'Backspace'), u(43, 'Tab'), u(44, 'Space'),
            u(57, 'Caps Lock'), u(73, 'Insert'), u(74, 'Home'), u(75, 'Page Up'),
            u(76, 'Delete'), u(77, 'End'), u(78, 'Page Down'),
            u(79, 'Right'), u(80, 'Left'), u(81, 'Down'), u(82, 'Up'), u(101, 'Menu'),
        ],
    },
    {
        id: 'mods', name: 'Modifiers',
        items: [
            mod(1, 'Ctrl'), mod(2, 'Shift'), mod(4, 'Alt'), mod(8, 'Win'),
            mod(16, 'R Ctrl'), mod(32, 'R Shift'), mod(64, 'R Alt'), mod(128, 'R Win'),
        ],
    },
    {
        id: 'media', name: 'Media & system',
        items: [
            u(139, 'Mute'), u(140, 'Vol Up'), u(141, 'Vol Down'),
            u(233, 'Eject'), u(234, 'Power'), u(240, 'WWW'), u(241, 'WWW Back'),
            u(242, 'WWW Forward'), u(248, 'Email'), u(249, 'Player'),
            u(135, 'Cut'), u(136, 'Copy'), u(137, 'Paste'), u(138, 'Find'),
        ],
    },
    {
        id: 'layer', name: 'Layers & Fn',
        items: LAYER_KEYS.map((l) => ({ layer: l.layer, label: l.name }))
            .concat([{ fn: true, label: 'Fn' }]),
    },
    {
        id: 'macro', name: 'Macros',
        items: Array.from({ length: 16 }, (_, i) => ({ macro: i + 1, label: `Macro ${i + 1}` })),
    },
    {
        id: 'advanced', name: 'Advanced',
        items: [
            { adv: 'dks', label: 'DKS' },
            { adv: 'tgl', label: 'Toggle' },
            { adv: 'mt', label: 'Mod-Tap' },
            { adv: 'macro', label: 'New Macro' },
        ],
    },
];
