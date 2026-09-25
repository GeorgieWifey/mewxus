# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

User-specified (not delegated): Laravel + Blade server, htmx + Alpine.js interactivity, UnoCSS styling, Vite bundling. SQLite database on a Railway volume. All keyboard I/O is client-side vanilla JS using the WebHID API (browsers only expose HID to the page, never the server). Hosted on Railway, deployed from GitHub (repo `GeorgieWifey/mewxus`).

## Users

The product's owner (single user, personal tool): a keyboard enthusiast with a Yodall Nexus 61S hall-effect keyboard, at a desktop machine, using a Chromium browser (WebHID requires Chrome/Edge/Opera over HTTPS). *(Inferred from the request: personal replacement for the official driver.)*

## Product Purpose

Replace the official Yodall web driver (yodall.keybord.net.cn) — which works but is clunky and ugly — with a personal configurator that is a joy to use. Success = complete control of the board (4-layer keymap, RGB, rapid trigger/actuation, macros, advanced key modes, firmware) from the user's own cute tool, with the official driver never needed again.

## Positioning

The only third-party configurator for the Nexus 61S: it speaks the board's proprietary (non-VIA, non-QMK) WebHID protocol directly, reverse-engineered verbatim from the official driver's JavaScript bundle. Nothing else can truthfully configure this board.

## Operating Context

USB-connected Nexus 61S (VID 0xFEED, PIDs 0x5EEA / 0x0EEA; bootloader 0x0C45:0x0500, Sonix-based, hall-effect switches). 64-byte HID reports. HTTPS hosting on Railway (*.up.railway.app gives the secure context WebHID requires). Firmware update from the official image (YODALL61_118.bin) via the bootloader protocol.

## Capabilities and Constraints

- Full parity scope (user-confirmed): connect/live status, 4-layer keymap editor, RGB (23 effects, per-key paint, logo light), core settings, preset library, Rapid Trigger + per-key actuation, 16-slot macro editor, advanced key modes (DKS/MT/TGL/SOCD/OKS), firmware updater.
- Demo/mock-device mode so the entire UI works without hardware (also the only mode testable during development — no physical board attached to the dev machine).
- WebHID is Chromium-only; Firefox/Safari get a friendly notice + demo mode.
- Firmware flashing and factory reset are destructive: double-confirm flows, explicit warnings.
- Presets stored server-side (SQLite + Railway volume), export/import as JSON.
- Server never touches the keyboard; Laravel serves pages, preset CRUD, and an SSRF-guarded firmware proxy (https-only, strict host allowlist for yodall.keybord.net.cn).

## Brand Commitments

- Name: **Mewxus** (user-chosen).
- Visual world pinned by the user, binding: **cutesy pastel pixel-art theme on the Catppuccin Latte palette**. Recorded as-is; not to be re-negotiated or diluted.
- Voice: cute, playful, cat-flavored — but never at the expense of task clarity.

## Evidence on Hand

- Complete reverse-engineered protocol spec (command opcodes, report framing, keymap/config/RT/macro byte layouts) extracted from the official driver's minified bundle this session.
- Official layout JSON (K60, matrix 5×15, 61 keys + 5 encoders) at `https://yodall.keybord.net.cn/_next/static/chunks/267.dc036318031ed9bc.js`; official firmware at `https://yodall.keybord.net.cn/YODALL61_118.bin` (229,696 bytes).
- Absences that must not be fabricated: no official documentation exists; no physical keyboard attached during development (correctness rests on the verbatim-extracted protocol plus demo-mode testing).

## Product Principles

1. Real board, real bytes — every control maps to a genuine protocol command; nothing decorative pretends to configure.
2. Cuteness serves the task — pixel-art charm lives in chrome and moments; controls stay instantly readable (Operate discipline).
3. Degrade gracefully — no WebHID? Demo mode, friendly notice, everything still explorable.
4. Your config is yours — presets, JSON export/import, nothing locked in.
5. Destructive ops demand respect — firmware flash and factory reset get explicit, hard-to-miss confirmation.
