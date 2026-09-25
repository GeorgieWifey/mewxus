# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Laravel 12 (PHP 8.5+), Blade, htmx, Alpine.js, UnoCSS, Vite, SQLite

## Users

Owners of the Yodall Nexus 61S magnetic switch keyboard who want an aesthetically pleasing, responsive, and reliable web-based configurator without the clunky official Chinese web driver.

## Product Purpose

Provide a delightful, cute pastel pixel-art WebHID configuration tool and driver for the Nexus 61S keyboard. Features include 4-layer keymapping, 23 RGB lighting modes, Rapid Trigger & per-key magnetic actuation adjustments, 16 macro slots, advanced key modes (DKS, MT, TGL), preset management, live key-travel visual feedback, and firmware update proxy.

## Positioning

Unlike the official clunky Next.js web driver (yodall.keybord.net.cn), Mewxus offers a cozy, nostalgic Catppuccin Latte pastel pixel-art aesthetic, fluid Alpine + htmx reactivity, responsive live magnetic switch visualizers, offline preset persistence, and a full mock/demo mode for testing without physical hardware.

## Operating Context

Desktop web browsers supporting WebHID (Chrome, Edge, Opera, Chromium). Runs either connected to the physical keyboard via USB, or in interactive Demo/Mock mode for testing. Deployed as a containerized web application on Railway.

## Capabilities and Constraints

- WebHID API: Client-side only (hardware connection cannot touch backend server directly).
- Real-time magnetic switch travel events: Packet 0xA0 streamed from hardware for live travel depth animations.
- Memory read/write via cmd 0x55 sub-commands (keymap, config, lighting, macros, RT, DKS, calibration).
- Presets stored on server via SQLite + htmx and import/exportable as JSON.
- Firmware proxy: strictly guarded proxy to fetch official firmware safely.
- Browsers without WebHID (Firefox, Safari) gracefully display demo mode with a friendly explanation.

## Brand Commitments

- Name: Mewxus — Nexus 61S Cute Pastel Driver
- Aesthetic: Cutesy pastel pixel art on the Catppuccin Latte color palette (`rosewater`, `flamingo`, `pink`, `mauve`, `red`, `maroon`, `peach`, `yellow`, `green`, `teal`, `sky`, `sapphire`, `blue`, `lavender`, `text`, `subtext1`, `subtext0`, `overlay2`, `overlay1`, `overlay0`, `surface2`, `surface1`, `surface0`, `base`, `mantle`, `crust`).
- Mascot: An animated pixel cat reacting to connection status, keypresses, and settings changes.
- Typography: Pixel headings (Silkscreen / Press Start 2P) paired with rounded legible sans (Nunito / Quicksand) for labels, sliders, and numbers.
- Borders: Chunky stepped pixel borders (`box-shadow` pixel art styling) with tactile click animations.

## Evidence on Hand

- Official driver chunks extracted from `https://yodall.keybord.net.cn/`.
- Full K60 layout JSON with 66 key positions (61 keys + 5 encoders/knobs) and 23 lighting effects with brightness, speed, direction, and color parameters.
- Protocol specification: vendor/product IDs, 64-byte report structures, command opcodes, EEPROM memory mapping, and bootloader protocol.

## Product Principles

1. Tactile Delight: Every interaction—clicking keys, adjusting actuation sliders, testing rapid trigger—feels responsive, cozy, and playful.
2. Direct Hardware Fidelity: Byte-exact conformity to the Nexus 61S WebHID protocol with robust queued transport and packet serialization.
3. Accessible Testing: Full interactive Mock/Demo mode so every screen, keymap layer, lighting effect, and macro can be previewed and tested without needing physical hardware attached.
4. Clean Separation: Client-side handles WebHID I/O; Laravel + Blade + htmx handles application state, preset management, and asset delivery.
