<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mewxus 🐾 Nexus 61S Pastel WebHID Driver</title>
  <meta name="description" content="A cute pastel pixel-art WebHID driver and configurator for the Yodall Nexus 61S keyboard.">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <!-- Catppuccin Latte favicon placeholder -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐾</text></svg>">

  @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-latte-mantle text-latte-text font-sans antialiased selection:bg-latte-pink selection:text-white"
      x-data="keyboardDriver()"
      x-cloak>

  <!-- Main Container -->
  <div class="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col gap-5 min-h-screen">

    <!-- Top Pixel Bar & Mascot Header -->
    <header class="pixel-box bg-latte-base p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      
      <!-- Brand & Mascot -->
      <div class="flex items-center gap-3 w-full md:w-auto">
        <!-- Pixel Cat Mascot SVG -->
        <div class="relative w-14 h-14 bg-latte-surface0 border-2 border-latte-text shadow-[2px_2px_0_0_#4c4f69] flex items-center justify-center overflow-hidden flex-shrink-0">
          <svg class="w-12 h-12 image-pixelated transition-transform duration-150"
               :class="{ 'scale-105': mascotMood === 'happy', 'translate-y-[-2px]': mascotMood === 'typing' }"
               viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Ears -->
            <polygon points="6,6 12,6 8,2" fill="#dc8a78"/>
            <polygon points="20,6 26,6 24,2" fill="#dc8a78"/>
            <polygon points="8,5 11,5 9,3" fill="#ea76cb"/>
            <polygon points="21,5 24,5 23,3" fill="#ea76cb"/>
            <!-- Head Base -->
            <rect x="6" y="6" width="20" height="18" fill="#eff1f5"/>
            <rect x="5" y="8" width="22" height="14" fill="#eff1f5"/>
            <!-- Whiskers -->
            <line x1="2" y1="15" x2="6" y2="14" stroke="#4c4f69" stroke-width="1.5"/>
            <line x1="2" y1="18" x2="6" y2="18" stroke="#4c4f69" stroke-width="1.5"/>
            <line x1="26" y1="14" x2="30" y2="15" stroke="#4c4f69" stroke-width="1.5"/>
            <line x1="26" y1="18" x2="30" y2="18" stroke="#4c4f69" stroke-width="1.5"/>
            <!-- Eyes depending on mood -->
            <template x-if="mascotMood === 'idle'">
              <g>
                <rect x="9" y="11" width="3" height="4" fill="#4c4f69"/>
                <rect x="20" y="11" width="3" height="4" fill="#4c4f69"/>
                <rect x="10" y="12" width="1" height="1" fill="#eff1f5"/>
                <rect x="21" y="12" width="1" height="1" fill="#eff1f5"/>
              </g>
            </template>
            <template x-if="mascotMood === 'happy'">
              <g>
                <path d="M9 13 Q10.5 10 12 13" stroke="#4c4f69" stroke-width="2" fill="none"/>
                <path d="M20 13 Q21.5 10 23 13" stroke="#4c4f69" stroke-width="2" fill="none"/>
              </g>
            </template>
            <template x-if="mascotMood === 'shocked'">
              <g>
                <circle cx="10.5" cy="13" r="2.5" fill="#4c4f69"/>
                <circle cx="21.5" cy="13" r="2.5" fill="#4c4f69"/>
              </g>
            </template>
            <template x-if="mascotMood === 'sleepy'">
              <g>
                <line x1="9" y1="13" x2="12" y2="13" stroke="#4c4f69" stroke-width="2"/>
                <line x1="20" y1="13" x2="23" y2="13" stroke="#4c4f69" stroke-width="2"/>
              </g>
            </template>
            <template x-if="mascotMood === 'typing'">
              <g>
                <rect x="9" y="11" width="3" height="3" fill="#8839ef"/>
                <rect x="20" y="11" width="3" height="3" fill="#8839ef"/>
              </g>
            </template>
            <!-- Cheeks -->
            <rect x="7" y="16" width="3" height="2" fill="#ea76cb" opacity="0.8"/>
            <rect x="22" y="16" width="3" height="2" fill="#ea76cb" opacity="0.8"/>
            <!-- Nose & Mouth -->
            <polygon points="15,16 17,16 16,17" fill="#ea76cb"/>
            <path d="M14 18 Q15 19 16 18 Q17 19 18 18" stroke="#4c4f69" stroke-width="1.2" fill="none"/>
            <!-- Paws -->
            <rect x="9" y="24" width="4" height="3" fill="#ccd0da"/>
            <rect x="19" y="24" width="4" height="3" fill="#ccd0da"/>
          </svg>
        </div>

        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-pixel text-base md:text-lg font-bold text-latte-mauve tracking-tight">
              MEWXUS 61S
            </h1>
            <span class="font-pixel text-[9px] px-1.5 py-0.5 border border-latte-text"
                  :class="isConnected ? (isDemo ? 'bg-latte-peach text-latte-base' : 'bg-latte-green text-latte-base') : 'bg-latte-surface1 text-latte-text'"
                  x-text="isConnected ? (isDemo ? 'DEMO MODE' : 'ONLINE') : 'OFFLINE'">
            </span>
          </div>
          <!-- Mascot Speech bubble -->
          <div class="mt-0.5 flex items-center gap-1.5 text-xs text-latte-subtext0 bg-latte-mantle px-2 py-0.5 border border-latte-surface1">
            <span class="text-latte-mauve font-bold">💬</span>
            <span class="truncate max-w-[260px] md:max-w-md" x-text="mascotSpeech"></span>
          </div>
        </div>
      </div>

      <!-- Connection Controls & Actions -->
      <div class="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
        <template x-if="!isConnected">
          <div class="flex items-center gap-2">
            <button type="button"
                    @click="connectWebHID()"
                    :disabled="isConnecting"
                    class="pixel-btn-primary flex items-center gap-1.5">
              <span>🔌</span>
              <span x-text="isConnecting ? 'CONNECTING...' : 'CONNECT WEBHID'"></span>
            </button>
            <button type="button"
                    @click="enableDemoMode()"
                    class="pixel-btn-accent flex items-center gap-1.5">
              <span>🎮</span>
              <span>TRY DEMO MODE</span>
            </button>
          </div>
        </template>

        <template x-if="isConnected">
          <div class="flex items-center gap-2">
            <div class="hidden sm:flex flex-col text-right font-pixel text-[10px] text-latte-subtext0">
              <span x-text="deviceInfo.name"></span>
              <span class="text-latte-teal" x-text="'FW ' + deviceInfo.fwVersion"></span>
            </div>
            <button type="button"
                    @click="disconnect()"
                    class="pixel-btn-secondary text-[11px] flex items-center gap-1">
              <span>✕</span> DISCONNECT
            </button>
          </div>
        </template>
      </div>

    </header>

    <!-- Visual 61-Key Keyboard Stage -->
    <main class="pixel-box bg-latte-base p-4 md:p-6 flex flex-col gap-4">
      
      <!-- Stage Control Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b-2 border-latte-surface1 pb-3">
        <!-- Layer Selector Tabs -->
        <div class="flex items-center gap-1">
          <span class="font-pixel text-xs text-latte-subtext0 mr-1 hidden sm:inline">LAYER:</span>
          <template x-for="l in [0, 1, 2, 3]" :key="l">
            <button type="button"
                    @click="switchLayer(l)"
                    class="pixel-btn text-xs px-2.5 py-1"
                    :class="activeLayer === l ? 'bg-latte-mauve text-latte-base shadow-[1px_1px_0_0_#4c4f69]' : 'bg-latte-surface0 text-latte-text hover:bg-latte-surface1'"
                    x-text="l === 0 ? 'L0 (BASE)' : 'L' + l + ' (FN' + l + ')'">
            </button>
          </template>
        </div>

        <!-- Matrix Indicators & Split Spacebar toggle -->
        <div class="flex items-center gap-3 text-xs">
          <!-- Live travel indicator badge -->
          <div class="flex items-center gap-1 font-pixel text-[10px] bg-latte-mantle px-2 py-1 border border-latte-text">
            <span class="inline-block w-2 h-2 rounded-full"
                  :class="Object.keys(pressedKeys).length > 0 ? 'bg-latte-green animate-ping' : 'bg-latte-surface1'"></span>
            <span x-text="Object.keys(pressedKeys).length > 0 ? 'ACTUATION DETECTED' : 'AWAITING KEYPRESS'"></span>
          </div>

          <!-- Split Space Toggle -->
          <label class="flex items-center gap-1.5 cursor-pointer font-pixel text-[10px] text-latte-subtext0">
            <input type="checkbox"
                   x-model="splitSpacebar"
                   class="pixel-checkbox">
            <span>SPLIT SPACEBAR</span>
          </label>
        </div>
      </div>

      <!-- 61-Key Keyboard Chassis -->
      <div class="w-full overflow-x-auto pb-2">
        <div class="min-w-[760px] bg-latte-surface0 p-4 border-3 border-latte-text shadow-[4px_4px_0_0_#4c4f69] rounded-none">
          
          <!-- Key Matrix Grid: Rows 0 through 4 -->
          <div class="flex flex-col gap-1.5">
            <template x-for="rowIdx in [0, 1, 2, 3, 4]" :key="rowIdx">
              <div class="flex gap-1.5">
                <template x-for="(k, idx) in layoutKeys" :key="idx">
                  <template x-if="k.row === rowIdx && (
                    !k.mode || 
                    (splitSpacebar ? k.mode === 1 : k.mode === 2)
                  )">
                    <!-- Single Pixel Keycap -->
                    <button type="button"
                            @click="selectKey(idx)"
                            class="pixel-key flex flex-col justify-between p-1.5 text-center transition-all cursor-pointer relative"
                            :class="{
                              'is-selected': selectedKeyIndex === idx,
                              'is-pressed': pressedKeys[idx] !== undefined,
                              'bg-latte-base text-latte-text': selectedKeyIndex !== idx && !pressedKeys[idx],
                              'bg-latte-pink text-white': pressedKeys[idx] !== undefined,
                              'border-latte-mauve': selectedKeyIndex === idx
                            }"
                            :style="{
                              flexGrow: k.w,
                              height: '52px',
                              minWidth: (k.w * 44) + 'px',
                              backgroundColor: (activeTab === 'lighting' && lighting.effect === 0 && lighting.customColors[idx]) ? lighting.customColors[idx] : null
                            }">
                      <!-- Keycap top label -->
                      <div class="flex justify-between items-start w-full">
                        <span class="font-pixel text-[10px] font-bold leading-tight truncate"
                              x-text="layers[activeLayer][idx]?.name || k.name"></span>
                        <span class="text-[8px] opacity-40 font-mono" x-text="idx"></span>
                      </div>

                      <!-- Keycap bottom info (Live Travel Depth mm if pressed) -->
                      <div class="flex justify-between items-end w-full text-[8px]">
                        <template x-if="pressedKeys[idx] !== undefined">
                          <span class="font-pixel text-white font-bold bg-latte-red px-1 rounded-none"
                                x-text="(pressedKeys[idx]).toFixed(1) + 'mm'"></span>
                        </template>
                        <template x-if="pressedKeys[idx] === undefined">
                          <span class="text-latte-subtext1 text-[7px]" x-text="'#' + k.code"></span>
                        </template>
                      </div>
                    </button>
                  </template>
                </template>
              </div>
            </template>
          </div>

        </div>
      </div>

      <!-- Quick Key Status Details -->
      <div class="bg-latte-mantle p-2.5 border border-latte-surface1 flex flex-wrap items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <span class="font-pixel text-[10px] text-latte-subtext0">SELECTED KEY:</span>
          <template x-if="selectedKeyIndex !== null">
            <span class="font-pixel text-xs text-latte-mauve font-bold"
                  x-text="'[' + (layers[activeLayer][selectedKeyIndex]?.name || layoutKeys[selectedKeyIndex]?.name) + '] (Slot #' + selectedKeyIndex + ')'">
            </span>
          </template>
          <template x-if="selectedKeyIndex === null">
            <span class="text-latte-subtext1 italic">Click any key above to inspect or remap</span>
          </template>
        </div>

        <div class="flex items-center gap-2">
          <button type="button"
                  @click="syncKeymap()"
                  class="pixel-btn-primary text-[10px] px-2.5 py-1">
            💾 SYNC LAYER TO KEYBOARD
          </button>
        </div>
      </div>

    </main>

    <!-- Bottom Control Dock: Tabs & Configuration Panels -->
    <section class="pixel-box bg-latte-base p-4 md:p-6 flex flex-col gap-4">
      
      <!-- Dock Navigation Bar -->
      <nav class="flex flex-wrap items-center gap-2 border-b-2 border-latte-surface1 pb-3">
        <button type="button"
                @click="activeTab = 'keymap'"
                class="pixel-btn text-xs flex items-center gap-1.5"
                :class="activeTab === 'keymap' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <span>⌨️</span> KEYMAP
        </button>

        <button type="button"
                @click="activeTab = 'lighting'"
                class="pixel-btn text-xs flex items-center gap-1.5"
                :class="activeTab === 'lighting' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <span>✨</span> LIGHTING (RGB)
        </button>

        <button type="button"
                @click="activeTab = 'rapid_trigger'"
                class="pixel-btn text-xs flex items-center gap-1.5"
                :class="activeTab === 'rapid_trigger' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <span>⚡</span> RAPID TRIGGER
        </button>

        <button type="button"
                @click="activeTab = 'macros'"
                class="pixel-btn text-xs flex items-center gap-1.5"
                :class="activeTab === 'macros' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <span>📜</span> MACROS
        </button>

        <button type="button"
                @click="activeTab = 'presets'"
                class="pixel-btn text-xs flex items-center gap-1.5"
                :class="activeTab === 'presets' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <span>🌸</span> PRESETS
        </button>

        <button type="button"
                @click="activeTab = 'settings'"
                class="pixel-btn text-xs flex items-center gap-1.5"
                :class="activeTab === 'settings' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <span>⚙️</span> SETTINGS
        </button>

        <button type="button"
                @click="activeTab = 'firmware'"
                class="pixel-btn text-xs flex items-center gap-1.5"
                :class="activeTab === 'firmware' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <span>📦</span> FIRMWARE
        </button>
      </nav>

      <!-- Panel 1: Keymap Remapping Drawer -->
      <div x-show="activeTab === 'keymap'" class="flex flex-col gap-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <!-- Category Pills -->
          <div class="flex flex-wrap gap-1">
            <template x-for="(catKeys, catName) in keyCategories" :key="catName">
              <button type="button"
                      @click="selectedCategory = catName"
                      class="pixel-btn text-[10px] px-2.5 py-1 capitalize"
                      :class="selectedCategory === catName ? 'bg-latte-mauve text-latte-base' : 'bg-latte-surface0 text-latte-text hover:bg-latte-surface1'"
                      x-text="catName">
              </button>
            </template>
          </div>

          <!-- Search Filter -->
          <div class="relative w-full md:w-64">
            <input type="text"
                   x-model="searchQuery"
                   placeholder="Search key name or code..."
                   class="w-full px-3 py-1.5 text-xs bg-latte-mantle border-2 border-latte-text shadow-[2px_2px_0_0_#4c4f69] outline-none font-pixel">
          </div>
        </div>

        <!-- Key Picker Grid -->
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 p-3 bg-latte-mantle border-2 border-latte-surface1 max-h-72 overflow-y-auto">
          <template x-for="kc in filteredKeycodes" :key="kc.code">
            <button type="button"
                    @click="assignKeycode(kc.code, kc.type)"
                    class="pixel-box bg-latte-base hover:bg-latte-pink hover:text-white p-2 text-center transition-colors cursor-pointer flex flex-col items-center justify-center">
              <span class="font-pixel text-xs font-bold truncate max-w-full" x-text="kc.name"></span>
              <span class="text-[8px] opacity-50" x-text="'code ' + kc.code"></span>
            </button>
          </template>
        </div>
      </div>

      <!-- Panel 2: 23 RGB Lighting Modes -->
      <div x-show="activeTab === 'lighting'" class="flex flex-col gap-5">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          <!-- Mode Selector -->
          <div class="pixel-box bg-latte-mantle p-4 flex flex-col gap-2">
            <h3 class="font-pixel text-xs text-latte-mauve font-bold mb-1">SELECT EFFECT (23 MODES)</h3>
            <div class="max-h-64 overflow-y-auto flex flex-col gap-1 pr-1">
              <template x-for="eff in lightingEffects" :key="eff.value">
                <button type="button"
                        @click="lighting.effect = eff.value; updateLighting()"
                        class="text-left px-3 py-1.5 text-xs font-pixel border transition-colors flex items-center justify-between"
                        :class="lighting.effect === eff.value ? 'bg-latte-mauve text-latte-base border-latte-text' : 'bg-latte-base text-latte-text border-latte-surface1 hover:border-latte-mauve'">
                  <span x-text="eff.name"></span>
                  <span class="text-[9px] opacity-60" x-text="eff.zhName"></span>
                </button>
              </template>
            </div>
          </div>

          <!-- Parameters: Brightness, Speed, Direction -->
          <div class="pixel-box bg-latte-mantle p-4 flex flex-col gap-4">
            <h3 class="font-pixel text-xs text-latte-mauve font-bold">LIGHTING PARAMETERS</h3>

            <!-- Brightness -->
            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-xs font-pixel">
                <span>BRIGHTNESS</span>
                <span class="text-latte-mauve" x-text="lighting.brightness + '%'"></span>
              </div>
              <input type="range"
                     min="0"
                     max="100"
                     x-model="lighting.brightness"
                     @change="updateLighting()"
                     class="pixel-slider">
            </div>

            <!-- Speed -->
            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-xs font-pixel">
                <span>SPEED</span>
                <span class="text-latte-teal" x-text="lighting.speed + '%'"></span>
              </div>
              <input type="range"
                     min="0"
                     max="100"
                     x-model="lighting.speed"
                     @change="updateLighting()"
                     class="pixel-slider">
            </div>

            <!-- Direction -->
            <div class="flex flex-col gap-1">
              <span class="text-xs font-pixel">DIRECTION</span>
              <div class="grid grid-cols-2 gap-2 mt-1">
                <button type="button"
                        @click="lighting.direction = 0; updateLighting()"
                        class="pixel-btn text-[10px]"
                        :class="lighting.direction === 0 ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
                  NORMAL / RIGHT
                </button>
                <button type="button"
                        @click="lighting.direction = 1; updateLighting()"
                        class="pixel-btn text-[10px]"
                        :class="lighting.direction === 1 ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
                  REVERSE / LEFT
                </button>
              </div>
            </div>
          </div>

          <!-- Color Palette Chips -->
          <div class="pixel-box bg-latte-mantle p-4 flex flex-col gap-3">
            <h3 class="font-pixel text-xs text-latte-mauve font-bold">CATPPUCCIN PALETTE</h3>
            
            <div class="grid grid-cols-4 gap-2">
              <button type="button" @click="setLightingColor('#ea76cb')" class="h-10 pixel-box bg-latte-pink flex items-center justify-center font-pixel text-[9px] text-white" title="Pink">PINK</button>
              <button type="button" @click="setLightingColor('#8839ef')" class="h-10 pixel-box bg-latte-mauve flex items-center justify-center font-pixel text-[9px] text-white" title="Mauve">MAUVE</button>
              <button type="button" @click="setLightingColor('#dc8a78')" class="h-10 pixel-box bg-latte-rosewater flex items-center justify-center font-pixel text-[9px] text-latte-text" title="Rosewater">ROSE</button>
              <button type="button" @click="setLightingColor('#dd7878')" class="h-10 pixel-box bg-latte-flamingo flex items-center justify-center font-pixel text-[9px] text-white" title="Flamingo">FLAMINGO</button>
              <button type="button" @click="setLightingColor('#fe640b')" class="h-10 pixel-box bg-latte-peach flex items-center justify-center font-pixel text-[9px] text-white" title="Peach">PEACH</button>
              <button type="button" @click="setLightingColor('#40a02b')" class="h-10 pixel-box bg-latte-green flex items-center justify-center font-pixel text-[9px] text-white" title="Green">GREEN</button>
              <button type="button" @click="setLightingColor('#179299')" class="h-10 pixel-box bg-latte-teal flex items-center justify-center font-pixel text-[9px] text-white" title="Teal">TEAL</button>
              <button type="button" @click="setLightingColor('#7287fd')" class="h-10 pixel-box bg-latte-lavender flex items-center justify-center font-pixel text-[9px] text-white" title="Lavender">LAVENDER</button>
            </div>

            <div class="mt-2 p-2 bg-latte-base border border-latte-surface1 text-xs text-latte-subtext0">
              <p>💡 Tip: For <strong>Custom Per-Key mode (Mode 0)</strong>, pick a color chip above and click any key on the visual keyboard to paint it!</p>
            </div>
          </div>

        </div>
      </div>

      <!-- Panel 3: Rapid Trigger & Magnetic Hall Effect Actuation -->
      <div x-show="activeTab === 'rapid_trigger'" class="flex flex-col gap-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <!-- Global Actuation Sliders -->
          <div class="pixel-box bg-latte-mantle p-4 flex flex-col gap-4">
            <h3 class="font-pixel text-xs text-latte-mauve font-bold">MAGNETIC SWITCH ACTUATION</h3>
            
            <!-- Global Initial Travel -->
            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-xs font-pixel">
                <span>INITIAL ACTUATION DEPTH</span>
                <span class="text-latte-red font-bold" x-text="rapidTrigger.globalActuation.toFixed(1) + ' mm'"></span>
              </div>
              <input type="range"
                     min="0.1"
                     max="4.0"
                     step="0.1"
                     x-model.number="rapidTrigger.globalActuation"
                     @change="updateRapidTrigger()"
                     class="pixel-slider">
              <p class="text-[10px] text-latte-subtext1">Travel distance before key registers down (0.1mm - 4.0mm).</p>
            </div>

            <!-- RT Press Sensitivity -->
            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-xs font-pixel">
                <span>RAPID TRIGGER PRESS SENSITIVITY</span>
                <span class="text-latte-peach font-bold" x-text="rapidTrigger.globalPressSensitivity.toFixed(2) + ' mm'"></span>
              </div>
              <input type="range"
                     min="0.05"
                     max="2.0"
                     step="0.05"
                     x-model.number="rapidTrigger.globalPressSensitivity"
                     @change="updateRapidTrigger()"
                     class="pixel-slider">
            </div>

            <!-- RT Release Sensitivity -->
            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-xs font-pixel">
                <span>RAPID TRIGGER RELEASE SENSITIVITY</span>
                <span class="text-latte-teal font-bold" x-text="rapidTrigger.globalReleaseSensitivity.toFixed(2) + ' mm'"></span>
              </div>
              <input type="range"
                     min="0.05"
                     max="2.0"
                     step="0.05"
                     x-model.number="rapidTrigger.globalReleaseSensitivity"
                     @change="updateRapidTrigger()"
                     class="pixel-slider">
            </div>

            <!-- Continuous RT Toggle -->
            <label class="flex items-center gap-2 cursor-pointer font-pixel text-xs mt-1">
              <input type="checkbox"
                     x-model="rapidTrigger.continuousRapidTrigger"
                     @change="updateRapidTrigger()"
                     class="pixel-checkbox">
              <span>ENABLE CONTINUOUS RAPID TRIGGER</span>
            </label>
          </div>

          <!-- Live Hall Effect Travel Visualizer Gauge -->
          <div class="pixel-box bg-latte-mantle p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 class="font-pixel text-xs text-latte-mauve font-bold mb-2">LIVE MAGNETIC TRAVEL GAUGE</h3>
              <p class="text-xs text-latte-subtext0 mb-4">
                Press any key on your keyboard to observe the real-time magnetic Hall sensor depth streamed via packet <code class="bg-latte-base px-1 border border-latte-surface1">0xA0</code>.
              </p>
              
              <!-- Depth Bars for Active Keys -->
              <div class="flex flex-col gap-2 max-h-48 overflow-y-auto">
                <template x-for="(depth, kIdx) in pressedKeys" :key="kIdx">
                  <div class="p-2 bg-latte-base border border-latte-text flex flex-col gap-1">
                    <div class="flex justify-between text-[11px] font-pixel">
                      <span x-text="'Key #' + kIdx + ' [' + (layers[activeLayer][kIdx]?.name || 'Key') + ']'"></span>
                      <span class="text-latte-mauve font-bold" x-text="depth.toFixed(2) + ' mm / 4.0 mm'"></span>
                    </div>
                    <!-- Visual depth meter -->
                    <div class="w-full bg-latte-crust h-3 border border-latte-text overflow-hidden">
                      <div class="h-full bg-latte-pink transition-all duration-75"
                           :style="{ width: ((depth / 4.0) * 100) + '%' }"></div>
                    </div>
                  </div>
                </template>

                <template x-if="Object.keys(pressedKeys).length === 0">
                  <div class="p-6 text-center border-2 border-dashed border-latte-surface1">
                    <span class="text-2xl">⌨️</span>
                    <p class="font-pixel text-[10px] text-latte-subtext1 mt-2">NO KEYS CURRENTLY DEPRESSED</p>
                    <p class="text-xs text-latte-subtext0 mt-1">Press any physical switch to see real-time Hall sensor actuation!</p>
                  </div>
                </template>
              </div>
            </div>

            <div class="pt-3 border-t border-latte-surface1 flex justify-end">
              <button type="button"
                      @click="updateRapidTrigger()"
                      class="pixel-btn-primary text-xs">
                ⚡ APPLY RAPID TRIGGER SETTINGS
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Panel 4: 16-Slot Macro Editor -->
      <div x-show="activeTab === 'macros'" class="flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Slots List -->
          <div class="pixel-box bg-latte-mantle p-3 flex flex-col gap-1">
            <h4 class="font-pixel text-xs text-latte-mauve font-bold mb-2">MACRO SLOTS (1-16)</h4>
            <div class="max-h-60 overflow-y-auto flex flex-col gap-1">
              <template x-for="(m, mIdx) in macros" :key="mIdx">
                <button type="button"
                        @click="activeMacroSlot = mIdx"
                        class="text-left px-2.5 py-1 text-xs font-pixel border flex justify-between"
                        :class="activeMacroSlot === mIdx ? 'bg-latte-mauve text-latte-base border-latte-text' : 'bg-latte-base text-latte-text border-latte-surface1 hover:border-latte-mauve'">
                  <span x-text="m.name"></span>
                  <span class="text-[9px] opacity-60" x-text="m.actions.length + ' acts'"></span>
                </button>
              </template>
            </div>
          </div>

          <!-- Macro Action Timeline Editor -->
          <div class="md:col-span-3 pixel-box bg-latte-mantle p-4 flex flex-col justify-between gap-4">
            <div>
              <div class="flex items-center justify-between mb-3 border-b border-latte-surface1 pb-2">
                <div class="flex items-center gap-2">
                  <h4 class="font-pixel text-xs font-bold" x-text="'EDITING ' + macros[activeMacroSlot].name"></h4>
                  <input type="text"
                         x-model="macros[activeMacroSlot].name"
                         class="px-2 py-0.5 text-xs bg-latte-base border border-latte-text font-pixel">
                </div>
                <div class="flex items-center gap-1">
                  <button type="button"
                          @click="macros[activeMacroSlot].actions.push({ type: 'key', code: 4, action: 'press', delay: 50 })"
                          class="pixel-btn-secondary text-[10px]">
                    + ADD KEY
                  </button>
                  <button type="button"
                          @click="macros[activeMacroSlot].actions.push({ type: 'delay', ms: 100 })"
                          class="pixel-btn-secondary text-[10px]">
                    + ADD DELAY
                  </button>
                </div>
              </div>

              <!-- Action List -->
              <div class="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                <template x-for="(act, aIdx) in macros[activeMacroSlot].actions" :key="aIdx">
                  <div class="p-2 bg-latte-base border border-latte-text flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <span class="font-pixel text-[10px] text-latte-subtext0" x-text="'#' + (aIdx + 1)"></span>
                      <template x-if="act.type === 'key'">
                        <span class="font-pixel text-xs text-latte-mauve" x-text="'KEY [' + resolveKeyName(act.code) + '] ' + act.action.toUpperCase()"></span>
                      </template>
                      <template x-if="act.type === 'delay'">
                        <span class="font-pixel text-xs text-latte-teal" x-text="'DELAY ' + act.ms + 'ms'"></span>
                      </template>
                    </div>
                    <button type="button"
                            @click="macros[activeMacroSlot].actions.splice(aIdx, 1)"
                            class="text-latte-red font-bold hover:opacity-80 px-1 text-xs">
                      ✕
                    </button>
                  </div>
                </template>

                <template x-if="macros[activeMacroSlot].actions.length === 0">
                  <div class="p-4 text-center border-2 border-dashed border-latte-surface1 text-latte-subtext1 text-xs">
                    No actions in this macro slot yet. Click "+ ADD KEY" or "+ ADD DELAY" above!
                  </div>
                </template>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-latte-surface1">
              <button type="button"
                      @click="showToast('Macro saved to memory! 📜', 'success')"
                      class="pixel-btn-primary text-xs">
                💾 SAVE MACRO
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel 5: Presets Vault (HTMX Powered) -->
      <div x-show="activeTab === 'presets'" class="flex flex-col gap-4">
        
        <!-- Action header: Save current config as new preset -->
        <div class="pixel-box bg-latte-mantle p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            <h3 class="font-pixel text-xs text-latte-mauve font-bold">SAVE CURRENT SETUP AS PRESET</h3>
            <p class="text-xs text-latte-subtext0">Captures all 4 layers, RGB lighting, Rapid Trigger settings, and base config.</p>
          </div>

          <!-- Create Preset Form -->
          <form hx-post="{{ route('presets.store') }}"
                hx-target="#presets-list"
                class="flex flex-wrap items-center gap-2">
            @csrf
            <!-- Hidden inputs bound to Alpine state -->
            <input type="hidden" name="layers" :value="JSON.stringify(layers)">
            <input type="hidden" name="lighting" :value="JSON.stringify(lighting)">
            <input type="hidden" name="rapid_trigger" :value="JSON.stringify(rapidTrigger)">
            <input type="hidden" name="base_config" :value="JSON.stringify(baseConfig)">
            <input type="hidden" name="macros" :value="JSON.stringify(macros)">

            <input type="text"
                   name="name"
                   placeholder="Preset name (e.g. Valorant Pro)"
                   required
                   class="px-2.5 py-1 text-xs bg-latte-base border-2 border-latte-text shadow-[2px_2px_0_0_#4c4f69] font-pixel outline-none">

            <select name="category"
                    class="px-2 py-1 text-xs bg-latte-base border-2 border-latte-text font-pixel outline-none">
              <option value="custom">Custom</option>
              <option value="gaming">Gaming</option>
              <option value="cozy">Cozy</option>
              <option value="typing">Typing</option>
            </select>

            <button type="submit"
                    class="pixel-btn-primary text-xs flex items-center gap-1">
              <span>🌸</span> SAVE TO VAULT
            </button>
          </form>
        </div>

        <!-- Filter bar & Import Form -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <!-- Category filters via htmx -->
          <div class="flex items-center gap-1">
            <span class="font-pixel text-xs text-latte-subtext0 mr-1">FILTER:</span>
            <button type="button"
                    hx-get="{{ route('presets.index', ['category' => 'all']) }}"
                    hx-target="#presets-list"
                    class="pixel-btn-secondary text-[10px] px-2 py-1">
              ALL
            </button>
            <button type="button"
                    hx-get="{{ route('presets.index', ['category' => 'cozy']) }}"
                    hx-target="#presets-list"
                    class="pixel-btn-rose text-[10px] px-2 py-1">
              🌸 COZY
            </button>
            <button type="button"
                    hx-get="{{ route('presets.index', ['category' => 'gaming']) }}"
                    hx-target="#presets-list"
                    class="pixel-btn text-[10px] px-2 py-1 bg-latte-red text-latte-base border-2 border-latte-text shadow-[2px_2px_0_0_#4c4f69]">
              ⚡ GAMING
            </button>
            <button type="button"
                    hx-get="{{ route('presets.index', ['category' => 'typing']) }}"
                    hx-target="#presets-list"
                    class="pixel-btn text-[10px] px-2 py-1 bg-latte-peach text-latte-base border-2 border-latte-text shadow-[2px_2px_0_0_#4c4f69]">
              ☕ TYPING
            </button>
          </div>

          <!-- JSON File Import Form -->
          <form action="{{ route('presets.import') }}"
                method="POST"
                enctype="multipart/form-data"
                class="flex items-center gap-2">
            @csrf
            <label class="pixel-btn-secondary text-[10px] px-2 py-1 cursor-pointer flex items-center gap-1">
              <span>📥</span> IMPORT JSON
              <input type="file"
                     name="preset_file"
                     accept=".json"
                     class="hidden"
                     onchange="this.form.submit()">
            </label>
          </form>
        </div>

        <!-- Preset Cards Grid (Target of htmx swaps) -->
        <div id="presets-list">
          @include('presets._list', ['presets' => $presets])
        </div>

      </div>

      <!-- Panel 6: Hardware Settings & Gaming Options -->
      <div x-show="activeTab === 'settings'" class="flex flex-col gap-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <!-- Polling & Debounce -->
          <div class="pixel-box bg-latte-mantle p-4 flex flex-col gap-4">
            <h3 class="font-pixel text-xs text-latte-mauve font-bold">COMMUNICATION & TIMING</h3>

            <!-- Report Rate -->
            <div class="flex flex-col gap-1">
              <span class="text-xs font-pixel">POLLING RATE</span>
              <div class="grid grid-cols-4 gap-2 mt-1">
                <template x-for="rate in [125, 250, 500, 1000]" :key="rate">
                  <button type="button"
                          @click="baseConfig.reportRate = rate; updateBaseConfig()"
                          class="pixel-btn text-[10px]"
                          :class="baseConfig.reportRate === rate ? 'pixel-btn-primary' : 'pixel-btn-secondary'"
                          x-text="rate + ' Hz'">
                  </button>
                </template>
              </div>
            </div>

            <!-- Sleep Timer -->
            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-xs font-pixel">
                <span>RGB SLEEP TIMER</span>
                <span class="text-latte-peach" x-text="baseConfig.lightSleep === 0 ? 'Never' : baseConfig.lightSleep + ' min'"></span>
              </div>
              <input type="range"
                     min="0"
                     max="60"
                     step="5"
                     x-model.number="baseConfig.lightSleep"
                     @change="updateBaseConfig()"
                     class="pixel-slider">
            </div>

            <!-- Debounce -->
            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-xs font-pixel">
                <span>DEBOUNCE FILTER</span>
                <span class="text-latte-teal" x-text="baseConfig.debounce + ' ms'"></span>
              </div>
              <input type="range"
                     min="0"
                     max="10"
                     step="1"
                     x-model.number="baseConfig.debounce"
                     @change="updateBaseConfig()"
                     class="pixel-slider">
            </div>
          </div>

          <!-- Locks, Modes & Calibration Wizard -->
          <div class="pixel-box bg-latte-mantle p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 class="font-pixel text-xs text-latte-mauve font-bold mb-3">GAMING LOCKS & SYSTEM</h3>

              <div class="flex flex-col gap-2.5">
                <label class="flex items-center gap-2 cursor-pointer font-pixel text-xs">
                  <input type="checkbox"
                         x-model="baseConfig.lockWin"
                         @change="updateBaseConfig()"
                         class="pixel-checkbox">
                  <span>LOCK WINDOWS KEY</span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer font-pixel text-xs">
                  <input type="checkbox"
                         x-model="baseConfig.lockAltTab"
                         @change="updateBaseConfig()"
                         class="pixel-checkbox">
                  <span>LOCK ALT+TAB</span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer font-pixel text-xs">
                  <input type="checkbox"
                         x-model="baseConfig.lockAltF4"
                         @change="updateBaseConfig()"
                         class="pixel-checkbox">
                  <span>LOCK ALT+F4</span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer font-pixel text-xs">
                  <input type="checkbox"
                         x-model="baseConfig.berserkMode"
                         @change="updateBaseConfig()"
                         class="pixel-checkbox">
                  <span>ULTRA-LOW LATENCY (BERSERK MODE)</span>
                </label>
              </div>

              <!-- Hall Effect Sensor Calibration Wizard -->
              <div class="mt-4 pt-3 border-t border-latte-surface1">
                <h4 class="font-pixel text-xs text-latte-teal font-bold mb-1">HALL SENSOR CALIBRATION</h4>
                <p class="text-[11px] text-latte-subtext0 mb-2">Recalibrates magnetic range for all 61 keys. Run if any key fails to trigger.</p>
                <button type="button"
                        @click="runCalibration()"
                        class="pixel-btn-accent text-[11px] flex items-center gap-1">
                  <span>🎯</span> START SENSOR CALIBRATION
                </button>
              </div>
            </div>

            <div class="pt-3 border-t border-latte-surface1 flex justify-between items-center">
              <button type="button"
                      @click="triggerReset()"
                      class="pixel-btn text-[10px] bg-latte-red text-latte-base hover:opacity-90 border-2 border-latte-text shadow-[2px_2px_0_0_#4c4f69]">
                ⚠️ FACTORY RESET
              </button>

              <button type="button"
                      @click="updateBaseConfig()"
                      class="pixel-btn-primary text-xs">
                💾 SAVE SETTINGS
              </button>
            </div>

          </div>

        </div>
      </div>

      <!-- Panel 7: Official Firmware Proxy & Updater -->
      <div x-show="activeTab === 'firmware'" class="flex flex-col gap-4">
        <div class="pixel-box bg-latte-mantle p-5 flex flex-col gap-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="font-pixel text-sm text-latte-mauve font-bold mb-1">FIRMWARE RECOVERY & UPDATER</h3>
              <p class="text-xs text-latte-subtext0">
                Official Sonix bootloader firmware proxy. Safely downloads and inspects official Nexus 61S firmware images.
              </p>
            </div>
            <span class="font-pixel text-xs px-2 py-1 bg-latte-teal text-latte-base border border-latte-text">
              LATEST: v1.18
            </span>
          </div>

          <!-- Official Firmware Details -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-latte-base border-2 border-latte-surface1 text-xs">
            <div>
              <span class="font-pixel text-[10px] text-latte-subtext0 block">OFFICIAL IMAGE:</span>
              <span class="font-mono font-bold text-latte-text">YODALL61_118.bin</span>
            </div>
            <div>
              <span class="font-pixel text-[10px] text-latte-subtext0 block">FILE SIZE:</span>
              <span class="font-mono text-latte-text">229,696 bytes</span>
            </div>
            <div>
              <span class="font-pixel text-[10px] text-latte-subtext0 block">TARGET CONTROLLER:</span>
              <span class="font-mono text-latte-text">Sonix Bootloader (0x0C45:0x0500)</span>
            </div>
          </div>

          <!-- Strict Safety Notice -->
          <div class="p-3 bg-latte-peach/15 border-2 border-latte-peach text-xs flex items-start gap-2">
            <span class="text-lg">⚠️</span>
            <div>
              <h5 class="font-pixel text-xs text-latte-peach font-bold mb-0.5">FIRMWARE FLASHING SAFETY WARNING</h5>
              <p class="text-latte-subtext0">
                Do not unplug the keyboard or close the browser tab during a firmware flash. Only flash when experiencing corrupted sensor data or when recommended by Yodall.
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <a href="{{ route('firmware.download') }}"
               class="pixel-btn-secondary text-xs flex items-center gap-1.5"
               download>
              <span>📥</span> DOWNLOAD OFFICIAL BINARY (SSRF-SAFE PROXY)
            </a>

            <button type="button"
                    @click="showToast('To flash firmware, ensure device is connected then switch to bootloader.', 'info')"
                    class="pixel-btn-rose text-xs flex items-center gap-1.5">
              <span>🚀</span> PREPARE BOOTLOADER FLASH
            </button>
          </div>
        </div>
      </div>

    </section>

    <!-- Footer -->
    <footer class="text-center font-pixel text-[10px] text-latte-subtext0 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div class="flex items-center gap-1">
        <span>🐾</span>
        <span>MEWXUS DRIVER • CATPPUCCIN LATTE • NEXUS 61S</span>
      </div>
      <div>
        <span>BUILT WITH LARAVEL • BLADE • HTMX • ALPINE • UNOCSS</span>
      </div>
    </footer>

  </div>

  <!-- Floating Toast Notification -->
  <div x-show="toast.show"
       x-transition:enter="transition ease-out duration-200"
       x-transition:enter-start="opacity-0 translate-y-2"
       x-transition:enter-end="opacity-100 translate-y-0"
       x-transition:leave="transition ease-in duration-150"
       x-transition:leave-start="opacity-100 translate-y-0"
       x-transition:leave-end="opacity-0 translate-y-2"
       class="fixed bottom-5 right-5 z-50 pixel-box px-4 py-3 flex items-center gap-2 shadow-[4px_4px_0_0_#4c4f69]"
       :class="{
         'bg-latte-base text-latte-text': toast.type === 'info',
         'bg-latte-green text-latte-base': toast.type === 'success',
         'bg-latte-red text-latte-base': toast.type === 'error'
       }">
    <span class="font-pixel text-xs font-bold" x-text="toast.message"></span>
    <button type="button" @click="toast.show = false" class="ml-2 font-bold hover:opacity-75">✕</button>
  </div>

</body>
</html>
