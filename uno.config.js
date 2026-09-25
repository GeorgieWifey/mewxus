import { defineConfig, presetWind3, transformerDirectives } from 'unocss';

// Catppuccin Latte — the whole world lives on these pastels.
const latte = {
  rosewater: '#dc8a78',
  flamingo: '#dd7878',
  pink: '#ea76cb',
  mauve: '#8839ef',
  red: '#d20f39',
  maroon: '#e64553',
  peach: '#fe640b',
  yellow: '#df8e1d',
  green: '#40a02b',
  teal: '#179299',
  sky: '#04a5e5',
  sapphire: '#209fb5',
  blue: '#1e66f5',
  lavender: '#7287fd',
  text: '#4c4f69',
  subtext1: '#5c5f77',
  subtext0: '#6c6f85',
  overlay2: '#7c7f93',
  overlay1: '#8c8fa1',
  overlay0: '#9ca0b0',
  surface2: '#acb0be',
  surface1: '#bcc0cc',
  surface0: '#ccd0da',
  base: '#eff1f5',
  mantle: '#e6e9ef',
  crust: '#dce0e8',
};

export default defineConfig({
  presets: [presetWind3()],
  transformers: [transformerDirectives()],
  content: {
    filesystem: [
      'resources/views/**/*.blade.php',
      'resources/js/**/*.{js,vue,ts}',
    ],
  },
  theme: {
    colors: { ...latte },
    fontFamily: {
      pixel: ['"Press Start 2P"', 'monospace'],
      // pixel type everywhere: font-sans resolves to the bitmap face too
      sans: ['"Press Start 2P"', 'monospace'],
    },
    // Press Start 2P ships a single weight; neutralize synthetic bold
    fontWeight: {
      semibold: '400',
      bold: '400',
      extrabold: '400',
      black: '400',
    },
  },
  shortcuts: {
    // 3px pixel border drawn with box-shadow so corners stay square-crisp.
    'pixel-border': 'border-3 border-crust',
    'pixel-panel': 'bg-base border-3 border-crust shadow-panel',
    'pixel-btn': 'inline-flex items-center justify-center gap-2 border-3 border-crust bg-surface0 text-text font-sans font-extrabold shadow-btn select-none cursor-pointer transition-none active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-btn',
    'pixel-btn-primary': 'bg-rosewater/50 text-text',
    'pixel-btn-green': 'bg-green/40 text-text',
    'pixel-btn-red': 'bg-red/25 text-text',
    'pixel-btn-blue': 'bg-lavender/40 text-text',
    'pixel-chip': 'inline-flex items-center gap-1 border-2 border-crust px-1.5 py-0.5 font-sans font-bold text-[10px]',
    'pixel-input': 'bg-mantle border-3 border-crust px-2 py-1.5 font-sans font-bold text-text placeholder:text-subtext1 focus:outline-none focus:border-lavender',
    'panel-title': 'font-pixel text-[10px] tracking-wide text-subtext1 uppercase',
  },
  rules: [
    // chunky offset shadow, no blur — the pixel drop
    ['shadow-pixel', { 'box-shadow': '0 4px 0 0 #dce0e8' }],
    ['shadow-panel', { 'box-shadow': '0 4px 0 0 #ccd0da' }],
    ['shadow-btn', { 'box-shadow': '0 4px 0 0 #9ca0b0' }],
    ['shadow-key', { 'box-shadow': '0 3px 0 0 #9ca0b0' }],
    ['checker', {
      'background-image': 'repeating-conic-gradient(#dce0e8 0% 25%, #eff1f5 0% 50%)',
      'background-size': '12px 12px',
    }],
    ['checker-faint', {
      'background-image': 'repeating-conic-gradient(#e6e9ef 0% 25%, #eff1f5 0% 50%)',
      'background-size': '8px 8px',
    }],
    // dotted dither strip used under panel headers
    ['dither', {
      'background-image': 'radial-gradient(#bcc0cc 1px, transparent 1px)',
      'background-size': '6px 6px',
    }],
  ],
  safelist: [],
});
