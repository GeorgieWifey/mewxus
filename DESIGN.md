---
name: Mewxus
description: Cutesy pastel pixel-art web driver for the Yodall Nexus 61S keyboard, on the Catppuccin Latte palette
colors:
  rosewater: "#dc8a78"
  flamingo: "#dd7878"
  pink: "#ea76cb"
  mauve: "#8839ef"
  red: "#d20f39"
  maroon: "#e64553"
  peach: "#fe640b"
  yellow: "#df8e1d"
  green: "#40a02b"
  teal: "#179299"
  sky: "#04a5e5"
  sapphire: "#209fb5"
  blue: "#1e66f5"
  lavender: "#7287fd"
  text: "#4c4f69"
  subtext1: "#5c5f77"
  subtext0: "#6c6f85"
  overlay2: "#7c7f93"
  overlay1: "#8c8fa1"
  overlay0: "#9ca0b0"
  surface2: "#acb0be"
  surface1: "#bcc0cc"
  surface0: "#ccd0da"
  base: "#eff1f5"
  mantle: "#e6e9ef"
  crust: "#dce0e8"
typography:
  display:
    fontFamily: '"Press Start 2P", monospace'
    fontSize: "8px–2rem by context (8px multiples are crisp)"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  body:
    fontFamily: '"Press Start 2P", monospace'
    fontWeight: 400
    fontSize: "10–11px"
    lineHeight: 1.7
  label:
    fontFamily: '"Press Start 2P", monospace'
    fontWeight: 400
    fontSize: "8–10px"
components:
  button-primary:
    backgroundColor: "{colors.rosewater}"
    textColor: "{colors.text}"
    padding: "12px 20px"
  button-ghost:
    backgroundColor: "{colors.surface1}"
    textColor: "{colors.text}"
    padding: "6px 12px"
  panel:
    backgroundColor: "{colors.base}"
    textColor: "{colors.text}"
  chip:
    backgroundColor: "{colors.base}"
    textColor: "{colors.text}"
  input:
    backgroundColor: "{colors.mantle}"
    textColor: "{colors.text}"
---

# Design System: Mewxus

## Overview

**Creative North Star: "A keyboard configurator that feels like petting a cat."**

Mewxus wraps a hall-effect keyboard's raw USB protocol in a pastel pixel world. Everything is square, chunky, and pressed-like: 3px crust borders instead of radius, hard 4px offset shadows instead of blur, checker and dither fields instead of gradients. The Catppuccin Latte palette supplies every color — there is no pure black or pure white anywhere; the darkest ink is `text` (#4c4f69) and the lightest surface is `base` (#eff1f5).

Cuteness lives in the chrome and the mascot (an inline-SVG pixel cat that reacts to connection state and live key-travel data); it never lives in the controls. Buttons, sliders, and tabs stay instantly readable Operate UI — state is conveyed through accent **tints** (accent at 25–50% over base) with `text` ink, never light-on-mid-tone text.

**Key Characteristics:**
- Zero border-radius anywhere; square corners are the world's signature
- Hard offset shadows (no blur) as the only depth system
- Press Start 2P everywhere — headings, body, labels, data; the only face in the system
- State fills are tints, not solid accents (readability floor ≥ 4.5:1)
- Painted key colors are displayed blended 45% toward base; the device keeps the true RGB

## Colors

The full Catppuccin Latte palette is the system; accents appear as tints for state, solids only in the mascot and painted keys.

### Primary
- **Rosewater** (#dc8a78): primary CTA fill (as 50% tint), active Assign mode, active effect/segmented options, the cat itself.
- **Lavender** (#7287fd): active layer tab and active inspector tab (40% tint), "Save current setup".
- **Pink** (#ea76cb): Paint mode active, selection color, cat ear-insides and blush.

### Secondary
- **Green** (#40a02b): success (40% tint on "Save this key", pressed-key flash, preset apply, flash-progress bar).
- **Red** (#d20f39): destructive identity — borders and 10–25% fills on Factory reset and the firmware warning; never small red text on light fills.
- **Teal** (#179299): live key-travel meter.
- **Yellow** (#df8e1d): warning tints (WebHID notice).

### Neutral
- **Text** (#4c4f69): all ink.
- **Subtext1 / Subtext0** (#5c5f77 / #6c6f85): secondary copy, panel titles, hints.
- **Overlay0** (#9ca0b0): button drop shadows, sleeping cat Zzz.
- **Surface1 / Surface0** (#bcc0cc / #ccd0da): slider tracks, secondary button fills.
- **Base / Mantle / Crust** (#eff1f5 / #e6e9ef / #dce0e8): page ground, inputs and wells, borders and header.

### Named Rules
**The Tint State Rule.** Active/selected/pressed fills are accent tints (25–50% over base) with `text` ink — never solid accent fills with light text. Solid accents are for the mascot, painted keys, and borders.
**The No-Pure-Black Rule.** No #000 or #fff anywhere; darkest ink is #4c4f69, lightest ground #eff1f5.

## Typography

**Font:** Press Start 2P — the only face. Bitmap type is used for everything: headings, body copy, labels, data, inputs.

**Character:** One bitmap voice for the whole world. It demands generosity: small sizes (8–11px) for dense UI, real line-height (1.7) so glyphs never clip, and no synthetic bold/italic (the font ships a single weight).

### Hierarchy
- **Display** (400, 1.5–2rem): the Mewxus wordmark and the gate headline only.
- **Title** (400, 10px, uppercase): panel titles, tab labels.
- **Body** (400, 10–11px, lh 1.7): all copy, hints, statuses.
- **Label** (400, 8px): keyboard key legends, macro chips, dense controls.

### Named Rules
**The Bitmap Sizes Rule.** 8px and 16px are crisp (integer multiples of the 8px em); 10–11px for dense UI is accepted. Never below 8px, never synthetic bold/italic.
**The Contained Rule.** Because UnoCSS ships no preflight, `box-sizing: border-box` is asserted globally in app.css — bordered+padded elements must never overflow their containers.

## Layout

App shell: three columns at `lg` — left rail 270px (Board buddy mascot + live travel meter, preset library), fluid center (layer tabs, mode toggle, the 61-key board, status chips), right rail 380px (six-panel inspector: Keys / Lights / Feel / Macros / Settings / Firmware). Below `lg`, everything stacks in one column. The keyboard is absolutely positioned keys inside a 16:5 `aspect-ratio` grid (x/16, y/5 percentages from the K60 layout); a separate vertical knob strip renders the five encoders. Spacing rhythm: 16px page padding, 12–16px panel padding, 6–8px inside groups.

## Elevation & Depth

Hard offset shadows only — zero blur anywhere. Depth is pixel-art depth: a flat block of a darker neutral offset straight down.

### Shadow Vocabulary
- **shadow-btn** (`box-shadow: 0 4px 0 0 #9ca0b0`): buttons and slider thumbs; the thumb translates down 3px and drops its shadow on `:active` for a physical press.
- **shadow-key** (`box-shadow: 0 3px 0 0 #9ca0b0`): keyboard keys and knobs; the live-press effect removes it (key "sinks").
- **shadow-panel** (`box-shadow: 0 4px 0 0 #ccd0da`): panels and cards.

### Named Rules
**The Press-Down Rule.** Every pressable element moves down and loses its shadow when active — never scale, never blur.

## Shapes

No border-radius at any size, any component. Borders are 3px solid `crust` (2px inside dense groups like chips and macro rows), drawn square. Backgrounds may carry a checker (`repeating-conic-gradient` of crust/base at 12px) or dither (`radial-gradient` dots of surface1 at 6px) — texture, never gradient color washes.

## Components

### Buttons
- **Shape:** square, 3px crust border, hard drop shadow, Press Start 2P 10–16px.
- **Primary:** rosewater 50% tint fill, `text` ink ("Connect keyboard").
- **Active/selected state:** accent tints — lavender/40 (tabs), rosewater/50 (Assign), pink/40 (Paint).
- **Danger:** red 25% tint with crust border (identity via fill+context+confirm dialogs, not red text).
- **Focus:** 3px dashed mauve outline, offset 2px.

### Chips
- **Style:** 2px crust border, base fill, pixel 10px; tinted fills (green/20, pink/20, yellow/20) for device/demo/busy state.

### Cards / Containers
- **Panel:** base fill, 3px crust border, shadow-panel; internal padding 12–16px; panel titles in pixel font 10px uppercase subtext1.

### Inputs / Fields
- **Style:** mantle fill, 3px crust border, pixel 10–11px; sliders are custom — 12px square-track (surface1, crust border) with a 20px square rosewater thumb that presses down on drag; checkboxes/radios use pink accent-color; caret is `text`.
- **Focus:** dashed mauve outline; focus border shifts to lavender.

### Keyboard (signature)
61 absolutely-positioned pixel keys plus 5 knob squares. Each key: 3px crust border, drop shadow, two stacked pixel labels — physical name over the assigned binding, both 8px. Painted keys show the blended device color as fill; selected key switches its border to flamingo; a live physical press sinks the key and flashes a green tint. Below `sm`, only the physical name renders.

## Do's and Don'ts

### Do:
- **Do** express every state (active/selected/pressed) as an accent tint at 25–50% with `text` ink.
- **Do** keep depth as hard offset shadows that disappear on press.
- **Do** blend displayed key paints toward base (45%) so labels stay legible; the device keeps the true RGB.
- **Do** let the mascot carry personality (state eyes, tail wag, Zzz) while controls stay quiet.

### Don't:
- **Don't** round any corner (no `border-radius` anywhere).
- **Don't** use blurred shadows, gradients, or glass — checker/dither textures only.
- **Don't** put light text on mid-tone accent fills (the gate CTA lesson: `text-base` is a color in UnoCSS, and light-on-pastel fails contrast).
- **Don't** use emoji or unicode glyphs as icons; draw pixel SVGs (the cat, the paw) or write the word in pixel font.
- **Don't** apply pure black/white; the palette's `text`/`base` are the ink/ground extremes.
