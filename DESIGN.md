---
name: Mewxus
description: Cutesy pastel pixel-art WebHID driver for Nexus 61S
colors:
  primary: "#8839ef"
  primary-hover: "#ea76cb"
  secondary: "#ccd0da"
  accent-rose: "#dc8a78"
  accent-pink: "#ea76cb"
  accent-teal: "#179299"
  accent-peach: "#fe640b"
  neutral-text: "#4c4f69"
  neutral-bg: "#eff1f5"
  neutral-surface: "#ccd0da"
  neutral-mantle: "#e6e9ef"
  neutral-crust: "#dce0e8"
typography:
  display:
    fontFamily: '"Silkscreen", "Press Start 2P", monospace'
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: '"Nunito", system-ui, -apple-system, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "0px"
  md: "0px"
  lg: "0px"
spacing:
  sm: "4px"
  md: "8px"
  lg: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

# Design System: Mewxus Nexus 61S

## Overview

**Creative North Star: "The Pastel Pixel Sanctuary"**

Mewxus elevates keyboard driver utilities from sterile industrial panels into a cozy, tactile pixel-art experience. Built around the Catppuccin Latte colorway, every surface communicates comfort, clarity, and nostalgic charm while delivering low-latency magnetic switch configuration.

### Key Characteristics:
- Authentic pixel-art geometry with hard-stepped block borders and no rounded corners.
- Playful interaction feedback: an animated pixel cat mascot that reacts to typing, moods, and hardware status.
- Real-time magnetic switch travel gauge streaming 0xA0 packets with live depth visualizers.

## Colors

The palette is strictly derived from Catppuccin Latte's warm pastel tones.

### Primary
- **Latte Mauve** (`#8839ef`): Primary actions, active layer badges, and selected keycap highlights.

### Secondary
- **Latte Pink** (`#ea76cb`): Active keypress aura, cheerful notifications, and mascot blush accents.
- **Latte Teal** (`#179299`): Precision status indicators, sensitivity sliders, and FW tags.
- **Latte Peach** (`#fe640b`): Warning callouts and demo mode status badge.

### Neutral
- **Latte Base** (`#eff1f5`): Clean panel backgrounds.
- **Latte Mantle** (`#e6e9ef`): App canvas background with subtle pixel dot grid texture.
- **Latte Crust** (`#dce0e8`): Recessed sliders and track troughs.
- **Latte Text** (`#4c4f69`): High-contrast pixel borders, key legends, and primary typography.

## Typography

**Display Font:** Silkscreen (with Press Start 2P, monospace fallback)
**Body Font:** Nunito (with system-ui, -apple-system fallback)

### Hierarchy
- **Display** (Bold 700, 1.125rem, 1.2): Title banner and brand logo.
- **Headline** (Bold 700, 0.75rem, 1.3): Panel headings and layer selectors.
- **Body** (Regular 400, 0.75rem - 0.875rem, 1.5): Instructional copy and descriptions.
- **Label** (Bold 700, 0.625rem, uppercase): Keycap legends and slot indicators.

## Layout

A balanced 7xl desktop container featuring a 3-tier vertical rhythm:
1. Top Header: Mascot avatar, connection status, and device connect controls.
2. Central Stage: Proportional 61-key magnetic switch matrix with responsive key widths.
3. Bottom Dock: Multi-tab configurator with keymap picker, RGB lighting, Rapid Trigger sliders, macros, and presets.

## Elevation & Depth

Zero-blur hard stepped shadows convey authentic 8-bit tactile depth.
- `shadow-[2px_2px_0_0_#4c4f69]`: Standard pixel buttons and input fields.
- `shadow-[4px_4px_0_0_#4c4f69]`: Outer keyboard chassis and floating toasts.
- `active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`: Physical key press depression.

## Shapes

- Strict zero-radius corners across all interactive components (`rounded-none`).
- 2px to 3px solid borders in `#4c4f69`.

## Components

### Buttons
- **Shape:** Rectangular, sharp edges (`border: 2px solid #4c4f69`).
- **Primary:** Mauve background with white text, transitioning to pink on hover.

### Visual Keycaps
- Keycaps feature 3D stepped base shadow (`box-shadow: 0 4px 0 0 #4c4f69, inset 0 2px 0 0 rgba(255,255,255,0.6)`), depressing 3px on physical or simulated touch.

## Do's and Don'ts

### Do:
- **Do** maintain the Catppuccin Latte pastel palette for all UI elements.
- **Do** use Silkscreen for headings and keycap legends, and Nunito for numerical data and reading text.
- **Do** ensure live visual feedback occurs on real-time actuation events.

### Don't:
- **Don't** introduce rounded border radii (`border-radius > 0`) or soft drop shadows.
- **Don't** use generic stock icon sets; prefer authored SVGs and pixel glyphs.
