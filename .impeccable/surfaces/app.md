---
version: 1
slug: "app"
primary_target: "app"
related_targets: []
---

# Surface: Mewxus configurator (route `/`)

Scope & mode: single-surface web app (Operate) — the whole keyboard configurator. Audience, job, proof: see PRODUCT.md (single owner-user, configure a Nexus 61S, real protocol bytes). Constraints: WebHID Chromium-only, demo mode elsewhere; Operate discipline — cuteness never obscures task or state.

## Direction contract

**THESIS:** A keyboard configurator that feels like petting a cat — the Nexus 61S's proprietary protocol wrapped in a pastel pixel world; refuses the grey enterprise-configurator default the official driver ships.

**OWN-WORLD:** Catppuccin Latte pastels on pixel-step borders and hard offset shadows (zero border-radius anywhere); chunky pixel buttons/toggles/sliders with 2-step pressed states; pixel display font reserved for headings and mascot speech, rounded workhorse sans (Nunito) for all labels and dense data; dither/checker accents on panel headers; an inline-SVG pixel cat mascot present in every connection state. Recognizable with all text removed.

**STORY:** The visitor lands on a gate: pixel cat asleep, one big connect button (demo mode beside it). On connect the cat wakes, the 61-key board lights up center-stage, and every task — remap, paint, tune, flash — happens in one shell with instant feedback. What they believe: this cute thing speaks real bytes. What they do: configure the board and never open the official driver again.

**FIRST VIEWPORT:** App shell at full width. Connection lives on the gate (no keyboard attached yet); the app header carries state chips (device, firmware, demo, busy). Left rail: Board buddy — pixel cat mascot with live travel meter — and the preset library. Center stage: the keyboard rendered as pixel keys at maximum scale, layer tabs and Assign/Paint modes above it, keys tappable immediately. Right rail: tabbed inspector (Keys / Lights / Feel / Macros / Settings / Firmware). Named signature interaction: pressing a physical key lights the on-screen key live (0xA0 event feed) and the mascot reacts.

**FORM:** Brief-pinned world — the user pinned "cutesy pastel pixel-art, Catppuccin Latte" verbatim; no concept roll was run, no seed key exists. Operate-mode calibration governs expression: state-rich controls, 150–250 ms motion, no load choreography.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions

- Effect `direction` byte semantics (values 1–4 per effect) rendered as a best-effort segmented control; refine against hardware later.
- Encoder (knob) assignment editing deferred unless trivially supported by protocol (knob positions render; knob remap may be read-only initially).
