// K60 layout for the Yodall Nexus 61S — extracted verbatim from the official
// driver's layout chunk (61 keys + 5 encoders, 5x15 matrix, 23 light effects).

export const MATRIX = { rows: 5, cols: 15 };

export const LAYOUT = {
    width: 16,
    height: 6,
    kbWidth: 800,
    kbHeight: 280,
    keyScale: 52,
    keys: [
        { row: 0, col: 0, x: 0, y: 0, h: 1, w: 1, code: 41, name: 'ESC' },
        { row: 0, col: 1, x: 1, y: 0, h: 1, w: 1, code: 30, name: '1 !' },
        { row: 0, col: 2, x: 2, y: 0, h: 1, w: 1, code: 32, name: '2 @' },
        { row: 0, col: 3, x: 3, y: 0, h: 1, w: 1, code: 33, name: '3 #' },
        { row: 0, col: 4, x: 4, y: 0, h: 1, w: 1, code: 34, name: '4 $' },
        { row: 0, col: 5, x: 5, y: 0, h: 1, w: 1, code: 35, name: '5 %' },
        { row: 0, col: 6, x: 6, y: 0, h: 1, w: 1, code: 36, name: '6 ^' },
        { row: 0, col: 7, x: 7, y: 0, h: 1, w: 1, code: 37, name: '7 &' },
        { row: 0, col: 8, x: 8, y: 0, h: 1, w: 1, code: 38, name: '8 *' },
        { row: 0, col: 9, x: 9, y: 0, h: 1, w: 1, code: 39, name: '9 (' },
        { row: 0, col: 10, x: 10, y: 0, h: 1, w: 1, code: 45, name: '0 )' },
        { row: 0, col: 11, x: 11, y: 0, h: 1, w: 1, code: 46, name: '_ -' },
        { row: 0, col: 12, x: 12, y: 0, h: 1, w: 1, code: 47, name: '+ =' },
        { row: 0, col: 13, x: 13, y: 0, h: 1, w: 2, code: 42, name: 'BACK' },
        { row: 1, col: 0, x: 0, y: 1, h: 1, w: 1.5, code: 43, name: 'TAB' },
        { row: 1, col: 1, x: 1.5, y: 1, h: 1, w: 1, code: 20, name: 'Q' },
        { row: 1, col: 2, x: 2.5, y: 1, h: 1, w: 1, code: 26, name: 'W' },
        { row: 1, col: 3, x: 3.5, y: 1, h: 1, w: 1, code: 8, name: 'E' },
        { row: 1, col: 4, x: 4.5, y: 1, h: 1, w: 1, code: 21, name: 'R' },
        { row: 1, col: 5, x: 5.5, y: 1, h: 1, w: 1, code: 23, name: 'T' },
        { row: 1, col: 6, x: 6.5, y: 1, h: 1, w: 1, code: 28, name: 'Y' },
        { row: 1, col: 7, x: 7.5, y: 1, h: 1, w: 1, code: 24, name: 'U' },
        { row: 1, col: 8, x: 8.5, y: 1, h: 1, w: 1, code: 12, name: 'I' },
        { row: 1, col: 9, x: 9.5, y: 1, h: 1, w: 1, code: 18, name: 'O' },
        { row: 1, col: 10, x: 10.5, y: 1, h: 1, w: 1, code: 19, name: 'P' },
        { row: 1, col: 11, x: 11.5, y: 1, h: 1, w: 1, code: 47, name: '[ {' },
        { row: 1, col: 12, x: 12.5, y: 1, h: 1, w: 1, code: 48, name: '} ]' },
        { row: 1, col: 13, x: 13.5, y: 1, h: 1, w: 1.5, code: 49, name: '\\ |' },
        { row: 2, col: 0, x: 0, y: 2, h: 1, w: 1.75, code: 57, name: 'CAPS' },
        { row: 2, col: 1, x: 1.75, y: 2, h: 1, w: 1, code: 4, name: 'A' },
        { row: 2, col: 2, x: 2.75, y: 2, h: 1, w: 1, code: 22, name: 'S' },
        { row: 2, col: 3, x: 3.75, y: 2, h: 1, w: 1, code: 7, name: 'D' },
        { row: 2, col: 4, x: 4.75, y: 2, h: 1, w: 1, code: 9, name: 'F' },
        { row: 2, col: 5, x: 5.75, y: 2, h: 1, w: 1, code: 10, name: 'G' },
        { row: 2, col: 6, x: 6.75, y: 2, h: 1, w: 1, code: 11, name: 'H' },
        { row: 2, col: 7, x: 7.75, y: 2, h: 1, w: 1, code: 13, name: 'J' },
        { row: 2, col: 8, x: 8.75, y: 2, h: 1, w: 1, code: 14, name: 'K' },
        { row: 2, col: 9, x: 9.75, y: 2, h: 1, w: 1, code: 15, name: 'L' },
        { row: 2, col: 10, x: 10.75, y: 2, h: 1, w: 1, code: 51, name: '; :' },
        { row: 2, col: 11, x: 11.75, y: 2, h: 1, w: 1, code: 52, name: "' \"" },
        { row: 2, col: 13, x: 12.75, y: 2, h: 1, w: 2.25, code: 40, name: 'ENTER' },
        { row: 3, col: 0, x: 0, y: 3, h: 1, w: 2.25, code: 225, name: 'SHIFT' },
        { row: 3, col: 2, x: 2.25, y: 3, h: 1, w: 1, code: 29, name: 'Z' },
        { row: 3, col: 3, x: 3.25, y: 3, h: 1, w: 1, code: 27, name: 'X' },
        { row: 3, col: 4, x: 4.25, y: 3, h: 1, w: 1, code: 6, name: 'C' },
        { row: 3, col: 5, x: 5.25, y: 3, h: 1, w: 1, code: 25, name: 'V' },
        { row: 3, col: 6, x: 6.25, y: 3, h: 1, w: 1, code: 5, name: 'B' },
        { row: 3, col: 7, x: 7.25, y: 3, h: 1, w: 1, code: 17, name: 'N' },
        { row: 3, col: 8, x: 8.25, y: 3, h: 1, w: 1, code: 16, name: 'M' },
        { row: 3, col: 9, x: 9.25, y: 3, h: 1, w: 1, code: 54, name: ', <' },
        { row: 3, col: 10, x: 10.25, y: 3, h: 1, w: 1, code: 55, name: '. >' },
        { row: 3, col: 11, x: 11.25, y: 3, h: 1, w: 1, code: 56, name: '/ ?' },
        { row: 3, col: 13, x: 12.25, y: 3, h: 1, w: 2.75, code: 229, name: 'SHIFT' },
        { row: 4, col: 0, x: 0, y: 4, h: 1, w: 1.25, code: 224, name: 'CTRL' },
        { row: 4, col: 1, x: 1.25, y: 4, h: 1, w: 1.25, code: 227, name: 'WIN' },
        { row: 4, col: 2, x: 2.5, y: 4, h: 1, w: 1.25, code: 226, name: 'ALT' },
        { row: 4, col: 6, x: 3.75, y: 4, h: 1, w: 6.25, code: 44, name: 'SPACE', mode: 2 },
        { row: 4, col: 2, x: 3.75, y: 4, h: 1, w: 1.25, code: 200, name: 'L1', mode: 1 },
        { row: 4, col: 6, x: 5, y: 4, h: 1, w: 1.25, code: 201, name: 'L2', mode: 1 },
        { row: 4, col: 6, x: 6.25, y: 4, h: 1, w: 1.25, code: 44, name: 'SPACE', mode: 1 },
        { row: 4, col: 6, x: 7.5, y: 4, h: 1, w: 1.25, code: 202, name: 'L3', mode: 1 },
        { row: 4, col: 6, x: 8.75, y: 4, h: 1, w: 1.25, code: 203, name: 'L4', mode: 1 },
        { row: 4, col: 10, x: 10, y: 4, h: 1, w: 1.25, code: 230, name: 'ALT' },
        { row: 4, col: 11, x: 11.25, y: 4, h: 1, w: 1.25, code: 101, name: 'MENU', index: 1 },
        { row: 4, col: 12, x: 12.5, y: 4, h: 1, w: 1.25, code: 228, name: 'CTRL', index: 1 },
        { row: 4, col: 13, x: 13.75, y: 4, h: 1, w: 1.25, code: 255, name: 'FN' },
    ],
    encoders: [
        { x: 0.1, y: 0.3, w: 0.8, h: 0.8 },
        { x: 0.2, y: 1.4, w: 0.6, h: 0.6, l: true },
        { x: 0.25, y: 2.3, w: 0.5, h: 0.5 },
        { x: 0.25, y: 3.05, w: 0.5, h: 0.5 },
        { x: 0.25, y: 3.8, w: 0.5, h: 0.5 },
    ],
};

export const LIGHT_EFFECTS = [
    { name: 'Custom', lang: '200', value: 0, brightness: true, speed: false, direction: 0, color: false, palette: true },
    { name: 'Spectrum', lang: '201', value: 1, brightness: true, speed: true, direction: 0, color: false, palette: false },
    { name: 'Stairs', lang: '202', value: 2, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Static', lang: '203', value: 3, brightness: true, speed: false, direction: 0, color: true, palette: true },
    { name: 'Breathing', lang: '204', value: 4, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Blossom', lang: '205', value: 5, brightness: true, speed: true, direction: 0, color: false, palette: false },
    { name: 'Wave', lang: '206', value: 6, brightness: true, speed: true, direction: 1, color: true, palette: true },
    { name: 'Wave V', lang: '207', value: 7, brightness: true, speed: true, direction: 2, color: true, palette: true },
    { name: 'Fountain', lang: '208', value: 8, brightness: true, speed: true, direction: 3, color: true, palette: true },
    { name: 'Galaxy', lang: '209', value: 9, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Swirl', lang: '210', value: 10, brightness: true, speed: true, direction: 4, color: true, palette: true },
    { name: 'Tide', lang: '211', value: 11, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Swing', lang: '212', value: 12, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Ripple', lang: '213', value: 13, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Ripple On', lang: '214', value: 14, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Single Point', lang: '215', value: 15, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Grid', lang: '216', value: 16, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Piano', lang: '217', value: 17, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Streaming', lang: '218', value: 18, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Rainfall', lang: '219', value: 19, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Starlight', lang: '220', value: 20, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Fireworks', lang: '221', value: 21, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Wave Band', lang: '222', value: 22, brightness: true, speed: true, direction: 0, color: true, palette: true },
];

export const LOGO_EFFECTS = [
    { name: 'Wave', value: 0, brightness: true, speed: true, direction: 1, color: true, palette: true },
    { name: 'Breathing', value: 2, brightness: true, speed: true, direction: 0, color: true, palette: true },
    { name: 'Spectrum', value: 1, brightness: true, speed: true, direction: 0, color: false, palette: false },
    { name: 'Static', value: 3, brightness: true, speed: false, direction: 0, color: true, palette: true },
];

// matrix position -> layout key index (for live key events)
const matrixIndex = new Map();
LAYOUT.keys.forEach((k, i) => {
    if (k.mode === 1) return; // split-space alternates share the same matrix cell
    matrixIndex.set(`${k.row}:${k.col}`, i);
});

export function keyIndexByMatrix(row, col) {
    return matrixIndex.has(`${row}:${col}`) ? matrixIndex.get(`${row}:${col}`) : -1;
}

export function keyIndexByCode(code) {
    return LAYOUT.keys.findIndex((k) => k.code === code && k.mode !== 1);
}

// device keymap slot -> layout key (slots run in layout order; 128 slots)
export const KEY_SLOTS = LAYOUT.keys.filter((k) => k.mode !== 1).length;
