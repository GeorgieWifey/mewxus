// Auto-generated from K60 layout & lighting & switch specs
import layoutData from '../../../k60_layout.json';

export const MATRIX = layoutData.matrix;
export const LAYOUT_KEYS = layoutData.layouts.keys;
export const LAYOUT_CODES = layoutData.layouts.codes;

export const SWITCH_TYPES = [
  { value: 0, name: 'Lightning White Switch', keyTravel: 3.2, color: '#e0e0e0' },
  { value: 1, name: 'Magnetic Jade Pro Switch', keyTravel: 3.4, color: '#6a9955' },
  { value: 2, name: 'Magnetic Jade Max Switch', keyTravel: 3.3, color: '#1a99e5' },
  { value: 3, name: 'Magneto RGB', keyTravel: 3.4, color: '#808080' },
  { value: 4, name: 'Lightning Pink PRO', keyTravel: 3.2, color: '#ce70b3' },
  { value: 5, name: 'Mount Tai GT', keyTravel: 3.4, color: '#222222' },
  { value: 6, name: 'Wukong', keyTravel: 3.4, color: '#9ebf3f' },
  { value: 7, name: 'Golden Magnetic Axis', keyTravel: 3.3, color: '#bd9e4b' },
  { value: 8, name: 'Ice Magnetic U', keyTravel: 3.5, color: '#e3e3e1' },
  { value: 9, name: 'Red Ice Magnetic U', keyTravel: 3.5, color: '#fe595b' },
  { value: 10, name: 'Ba Bao Axis', keyTravel: 3.5, color: '#d0cbb7' },
  { value: 11, name: 'Diamond Ba Bao Axis', keyTravel: 3.5, color: '#e0e0e0' },
  { value: 12, name: 'Fireworks Axis', keyTravel: 3.2, color: '#f0f0f0' },
  { value: 13, name: 'Polar Axis', keyTravel: 3.5, color: '#a0a0a0' },
  { value: 14, name: 'Ice Shine Axis', keyTravel: 3.2, color: '#7997b6' },
];

export const LIGHTING_EFFECTS = [
  { value: 0, name: 'Custom (Per-Key)', zhName: '自定义', brightness: true, speed: false, direction: 0, color: false },
  { value: 1, name: 'Spectrum', zhName: '光谱', brightness: true, speed: true, direction: 0, color: false },
  { value: 2, name: 'Steps', zhName: '阶梯', brightness: true, speed: true, direction: 0, color: true },
  { value: 3, name: 'Static Color', zhName: '静态', brightness: true, speed: false, direction: 0, color: true },
  { value: 4, name: 'Breathing', zhName: '呼吸', brightness: true, speed: true, direction: 0, color: true },
  { value: 5, name: 'Blossom', zhName: '百花', brightness: true, speed: true, direction: 0, color: false },
  { value: 6, name: 'Horizontal Wave', zhName: '波浪', brightness: true, speed: true, direction: 1, color: true },
  { value: 7, name: 'Vertical Wave', zhName: '上下波浪', brightness: true, speed: true, direction: 2, color: true },
  { value: 8, name: 'Fountain', zhName: '喷泉', brightness: true, speed: true, direction: 3, color: true },
  { value: 9, name: 'Galaxy', zhName: '银河', brightness: true, speed: true, direction: 0, color: true },
  { value: 10, name: 'Rotating Vortex', zhName: '旋转', brightness: true, speed: true, direction: 4, color: true },
  { value: 11, name: 'Tide', zhName: '潮汐', brightness: true, speed: true, direction: 0, color: true },
  { value: 12, name: 'Swing', zhName: '摆动模式', brightness: true, speed: true, direction: 0, color: true },
  { value: 13, name: 'Ripple', zhName: '涟漪', brightness: true, speed: true, direction: 0, color: true },
  { value: 14, name: 'Constant Ripple', zhName: '常亮涟漪', brightness: true, speed: true, direction: 0, color: true },
  { value: 15, name: 'Reactive Single', zhName: '单点', brightness: true, speed: true, direction: 0, color: true },
  { value: 16, name: 'Grid Pulse', zhName: '宫格', brightness: true, speed: true, direction: 0, color: true },
  { value: 17, name: 'Piano Reactive', zhName: '钢琴', brightness: true, speed: true, direction: 0, color: true },
  { value: 18, name: 'Streamer Flow', zhName: '流光', brightness: true, speed: true, direction: 0, color: true },
  { value: 19, name: 'Raindrops', zhName: '落雨', brightness: true, speed: true, direction: 0, color: true },
  { value: 20, name: 'Starlight', zhName: '星光', brightness: true, speed: true, direction: 0, color: true },
  { value: 21, name: 'Fireworks', zhName: '烟花', brightness: true, speed: true, direction: 0, color: true },
  { value: 22, name: 'Wave Band', zhName: '波带', brightness: true, speed: true, direction: 0, color: true }
];

export const KEY_CATEGORIES = {
  basic: [
    { code: 41, name: 'ESC', type: 16 },
    { code: 30, name: '1 !', type: 16 }, { code: 31, name: '2 @', type: 16 }, { code: 32, name: '3 #', type: 16 },
    { code: 33, name: '4 $', type: 16 }, { code: 34, name: '5 %', type: 16 }, { code: 35, name: '6 ^', type: 16 },
    { code: 36, name: '7 &', type: 16 }, { code: 37, name: '8 *', type: 16 }, { code: 38, name: '9 (', type: 16 },
    { code: 39, name: '0 )', type: 16 }, { code: 45, name: '- _', type: 16 }, { code: 46, name: '= +', type: 16 },
    { code: 42, name: 'BACKSPACE', type: 16 }, { code: 43, name: 'TAB', type: 16 },
    { code: 20, name: 'Q', type: 16 }, { code: 26, name: 'W', type: 16 }, { code: 8, name: 'E', type: 16 },
    { code: 21, name: 'R', type: 16 }, { code: 23, name: 'T', type: 16 }, { code: 28, name: 'Y', type: 16 },
    { code: 24, name: 'U', type: 16 }, { code: 12, name: 'I', type: 16 }, { code: 18, name: 'O', type: 16 },
    { code: 19, name: 'P', type: 16 }, { code: 47, name: '[ {', type: 16 }, { code: 48, name: '] }', type: 16 },
    { code: 49, name: '\\ |', type: 16 }, { code: 57, name: 'CAPS LOCK', type: 16 },
    { code: 4, name: 'A', type: 16 }, { code: 22, name: 'S', type: 16 }, { code: 7, name: 'D', type: 16 },
    { code: 9, name: 'F', type: 16 }, { code: 10, name: 'G', type: 16 }, { code: 11, name: 'H', type: 16 },
    { code: 13, name: 'J', type: 16 }, { code: 14, name: 'K', type: 16 }, { code: 15, name: 'L', type: 16 },
    { code: 51, name: '; :', type: 16 }, { code: 52, name: '\' "', type: 16 }, { code: 40, name: 'ENTER', type: 16 },
    { code: 225, name: 'L-SHIFT', type: 16 }, { code: 29, name: 'Z', type: 16 }, { code: 27, name: 'X', type: 16 },
    { code: 6, name: 'C', type: 16 }, { code: 25, name: 'V', type: 16 }, { code: 5, name: 'B', type: 16 },
    { code: 17, name: 'N', type: 16 }, { code: 16, name: 'M', type: 16 }, { code: 54, name: ', <', type: 16 },
    { code: 55, name: '. >', type: 16 }, { code: 56, name: '/ ?', type: 16 }, { code: 229, name: 'R-SHIFT', type: 16 },
    { code: 224, name: 'L-CTRL', type: 16 }, { code: 227, name: 'L-WIN', type: 16 }, { code: 226, name: 'L-ALT', type: 16 },
    { code: 44, name: 'SPACE', type: 16 }, { code: 230, name: 'R-ALT', type: 16 }, { code: 101, name: 'MENU', type: 16 },
    { code: 228, name: 'R-CTRL', type: 16 }, { code: 255, name: 'FN', type: 224 }
  ],
  functionKeys: [
    { code: 58, name: 'F1', type: 16 }, { code: 59, name: 'F2', type: 16 }, { code: 60, name: 'F3', type: 16 },
    { code: 61, name: 'F4', type: 16 }, { code: 62, name: 'F5', type: 16 }, { code: 63, name: 'F6', type: 16 },
    { code: 64, name: 'F7', type: 16 }, { code: 65, name: 'F8', type: 16 }, { code: 66, name: 'F9', type: 16 },
    { code: 67, name: 'F10', type: 16 }, { code: 68, name: 'F11', type: 16 }, { code: 69, name: 'F12', type: 16 }
  ],
  nav: [
    { code: 73, name: 'INS', type: 16 }, { code: 76, name: 'DEL', type: 16 },
    { code: 74, name: 'HOME', type: 16 }, { code: 77, name: 'END', type: 16 },
    { code: 75, name: 'PG UP', type: 16 }, { code: 78, name: 'PG DN', type: 16 },
    { code: 82, name: '↑', type: 16 }, { code: 80, name: '←', type: 16 },
    { code: 81, name: '↓', type: 16 }, { code: 79, name: '→', type: 16 },
    { code: 70, name: 'PRTSC', type: 16 }, { code: 71, name: 'SCRLK', type: 16 }, { code: 72, name: 'PAUSE', type: 16 }
  ],
  media: [
    { code: 128, name: 'MUTE', type: 16 }, { code: 129, name: 'VOL +', type: 16 }, { code: 130, name: 'VOL -', type: 16 },
    { code: 234, name: 'PLAY/PAUSE', type: 16 }, { code: 235, name: 'STOP', type: 16 },
    { code: 236, name: 'PREV TRACK', type: 16 }, { code: 237, name: 'NEXT TRACK', type: 16 }
  ],
  mouse: [
    { code: 1, name: 'MOUSE L-CLICK', type: 32 }, { code: 2, name: 'MOUSE R-CLICK', type: 32 },
    { code: 4, name: 'MOUSE M-CLICK', type: 32 }, { code: 8, name: 'MOUSE FORWARD', type: 32 },
    { code: 16, name: 'MOUSE BACKWARD', type: 32 }
  ],
  layers: [
    { code: 0, name: 'LAYER 0', type: 224 }, { code: 1, name: 'LAYER 1', type: 224 },
    { code: 2, name: 'LAYER 2', type: 224 }, { code: 3, name: 'LAYER 3', type: 224 },
    { code: 255, name: 'FN HOLD', type: 240 }
  ]
};
