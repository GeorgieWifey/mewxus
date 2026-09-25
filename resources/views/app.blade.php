<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mewxus - Nexus 61S Pastel WebHID Driver</title>
  <meta name="description" content="A cute pastel pixel-art WebHID driver and configurator for the Yodall Nexus 61S keyboard.">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <!-- Pixel Art SVG Favicon -->
  <link rel="icon" type="image/svg+xml" href="{{ asset('favicon.svg') }}">

  @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-latte-mantle text-latte-text font-pixel antialiased selection:bg-latte-pink selection:text-white"
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
            <g x-show="mascotMood === 'idle'">
              <rect x="9" y="11" width="3" height="4" fill="#4c4f69"/>
              <rect x="20" y="11" width="3" height="4" fill="#4c4f69"/>
              <rect x="10" y="12" width="1" height="1" fill="#eff1f5"/>
              <rect x="21" y="12" width="1" height="1" fill="#eff1f5"/>
            </g>
            <g x-show="mascotMood === 'happy'">
              <path d="M9 13 Q10.5 10 12 13" stroke="#4c4f69" stroke-width="2" fill="none"/>
              <path d="M20 13 Q21.5 10 23 13" stroke="#4c4f69" stroke-width="2" fill="none"/>
            </g>
            <g x-show="mascotMood === 'shocked'">
              <circle cx="10.5" cy="13" r="2.5" fill="#4c4f69"/>
              <circle cx="21.5" cy="13" r="2.5" fill="#4c4f69"/>
            </g>
            <g x-show="mascotMood === 'sleepy'">
              <line x1="9" y1="13" x2="12" y2="13" stroke="#4c4f69" stroke-width="2"/>
              <line x1="20" y1="13" x2="23" y2="13" stroke="#4c4f69" stroke-width="2"/>
            </g>
            <g x-show="mascotMood === 'typing'">
              <rect x="9" y="11" width="3" height="3" fill="#8839ef"/>
              <rect x="20" y="11" width="3" height="3" fill="#8839ef"/>
            </g>
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
          <div class="mt-0.5 flex items-center gap-1.5 text-[10px] text-latte-subtext0 bg-latte-mantle px-2 py-0.5 border border-latte-surface1 font-pixel">
            <x-pixel-icon name="message-text" class="w-3.5 h-3.5 text-latte-mauve" />
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
              <x-pixel-icon name="power" class="w-3.5 h-3.5" />
              <span x-text="isConnecting ? 'CONNECTING...' : 'CONNECT WEBHID'"></span>
            </button>
            <button type="button"
                    @click="enableDemoMode()"
                    class="pixel-btn-accent flex items-center gap-1.5">
              <x-pixel-icon name="gamepad" class="w-3.5 h-3.5" />
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
                    class="pixel-btn-secondary text-[10px] flex items-center gap-1">
              <x-pixel-icon name="close" class="w-3 h-3" />
              <span>DISCONNECT</span>
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
          <span class="font-pixel text-[10px] text-latte-subtext0 mr-1 hidden sm:inline">LAYER:</span>
          <template x-for="l in [0, 1, 2, 3]" :key="l">
            <button type="button"
                    @click="switchLayer(l)"
                    class="pixel-btn text-[10px] px-2.5 py-1"
                    :class="activeLayer === l ? 'bg-latte-mauve text-latte-base shadow-[1px_1px_0_0_#4c4f69]' : 'bg-latte-surface0 text-latte-text hover:bg-latte-surface1'"
                    x-text="l === 0 ? 'L0 (BASE)' : 'L' + l + ' (FN' + l + ')'">
            </button>
          </template>
        </div>

        <!-- Matrix Indicators & Split Spacebar toggle -->
        <div class="flex items-center gap-3 text-xs">
          <!-- Live travel indicator badge -->
          <div class="flex items-center gap-1 font-pixel text-[10px] bg-latte-mantle px-2 py-1 border border-latte-text">
            <span class="inline-block w-2 h-2"
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
                            class="pixel-key flex flex-col justify-between p-1.5 text-center transition-all cursor-pointer relative overflow-hidden"
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

                      <!-- Live Actuation Fill Meter (Behind Text) -->
                      <template x-if="pressedKeys[idx] !== undefined">
                        <div class="absolute bottom-0 left-0 right-0 bg-latte-mauve/25 pointer-events-none transition-all duration-75"
                             :style="{ height: ((pressedKeys[idx] / (switchTypes[keySwitchMap[idx] || 0]?.keyTravel || 3.4)) * 100) + '%' }">
                        </div>
                      </template>

                      <!-- Keycap top label -->
                      <div class="flex justify-between items-start w-full relative z-10">
                        <span class="font-pixel text-[10px] font-bold leading-tight truncate"
                              x-text="layers[activeLayer][idx]?.name || k.name"></span>
                        <span class="text-[8px] opacity-40 font-mono" x-text="idx"></span>
                      </div>

                      <!-- Keycap bottom info & installed switch marker -->
                      <div class="flex justify-between items-end w-full text-[8px] relative z-10">
                        <!-- Switch model triangle marker -->
                        <span class="inline-block w-2 h-2 border border-latte-text"
                              :style="{ backgroundColor: getSwitchColor(idx) }"
                              :title="switchTypes[keySwitchMap[idx] || 0]?.name || 'Switch'"></span>

                        <template x-if="pressedKeys[idx] !== undefined">
                          <span class="font-pixel text-white font-bold bg-latte-red px-1"
                                x-text="(pressedKeys[idx]).toFixed(1) + 'mm'"></span>
                        </template>
                        <template x-if="pressedKeys[idx] === undefined">
                          <span class="text-latte-subtext1 text-[7px]" x-text="'#' + (layers[activeLayer][idx]?.code ?? k.code)"></span>
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
            <div class="flex items-center gap-1.5">
              <span class="font-pixel text-xs text-latte-mauve font-bold"
                    x-text="'[' + (layers[activeLayer][selectedKeyIndex]?.name || layoutKeys[selectedKeyIndex]?.name) + '] (Slot #' + (layers[activeLayer][selectedKeyIndex]?.slotIndex ?? selectedKeyIndex) + ')'">
              </span>
              <span class="font-pixel text-[9px] px-1 py-0.5 border border-latte-text"
                    :style="{ backgroundColor: getSwitchColor(selectedKeyIndex) }"
                    x-text="switchTypes[keySwitchMap[selectedKeyIndex] || 0]?.name"></span>
            </div>
          </template>
          <template x-if="selectedKeyIndex === null">
            <span class="text-latte-subtext1 text-[10px]">Click any key above to inspect, remap, or change switch</span>
          </template>
        </div>

        <div class="flex items-center gap-2">
          <button type="button"
                  @click="syncKeymap()"
                  class="pixel-btn-primary text-[10px] px-2.5 py-1 flex items-center gap-1">
            <x-pixel-icon name="save" class="w-3.5 h-3.5" />
            <span>SYNC LAYER TO KEYBOARD</span>
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
                class="pixel-btn text-[10px] flex items-center gap-1.5"
                :class="activeTab === 'keymap' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <x-pixel-icon name="keyboard" class="w-3.5 h-3.5" />
          <span>KEYMAP</span>
        </button>

        <button type="button"
                @click="activeTab = 'lighting'"
                class="pixel-btn text-[10px] flex items-center gap-1.5"
                :class="activeTab === 'lighting' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <x-pixel-icon name="sun" class="w-3.5 h-3.5" />
          <span>LIGHTING</span>
        </button>

        <button type="button"
                @click="activeTab = 'rapid_trigger'"
                class="pixel-btn text-[10px] flex items-center gap-1.5"
                :class="activeTab === 'rapid_trigger' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <x-pixel-icon name="zap" class="w-3.5 h-3.5" />
          <span>RAPID TRIGGER</span>
        </button>

        <!-- Dedicated Switch Selector Tab -->
        <button type="button"
                @click="activeTab = 'switches'"
                class="pixel-btn text-[10px] flex items-center gap-1.5"
                :class="activeTab === 'switches' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <x-pixel-icon name="target" class="w-3.5 h-3.5" />
          <span>SWITCH SELECTOR</span>
        </button>

        <!-- Dedicated Keypress Visualizer Tab -->
        <button type="button"
                @click="activeTab = 'visualizer'"
                class="pixel-btn text-[10px] flex items-center gap-1.5"
                :class="activeTab === 'visualizer' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <x-pixel-icon name="sliders" class="w-3.5 h-3.5" />
          <span>TRAVEL VISUALIZER</span>
        </button>

        <button type="button"
                @click="activeTab = 'macros'"
                class="pixel-btn text-[10px] flex items-center gap-1.5"
                :class="activeTab === 'macros' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <x-pixel-icon name="script" class="w-3.5 h-3.5" />
          <span>MACROS</span>
        </button>

        <button type="button"
                @click="activeTab = 'presets'"
                class="pixel-btn text-[10px] flex items-center gap-1.5"
                :class="activeTab === 'presets' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <x-pixel-icon name="folder" class="w-3.5 h-3.5" />
          <span>PRESETS</span>
        </button>

        <button type="button"
                @click="activeTab = 'settings'"
                class="pixel-btn text-[10px] flex items-center gap-1.5"
                :class="activeTab === 'settings' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <x-pixel-icon name="sliders" class="w-3.5 h-3.5" />
          <span>SETTINGS</span>
        </button>

        <button type="button"
                @click="activeTab = 'firmware'"
                class="pixel-btn text-[10px] flex items-center gap-1.5"
                :class="activeTab === 'firmware' ? 'pixel-btn-primary' : 'pixel-btn-secondary'">
          <x-pixel-icon name="cpu" class="w-3.5 h-3.5" />
          <span>FIRMWARE</span>
        </button>
      </nav>

      <!-- Panel 1: Keymap Remapping Drawer -->
      <div x-show="activeTab === 'keymap'" class="flex flex-col gap-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex flex-wrap gap-1">
            <template x-for="(catKeys, catName) in keyCategories" :key="catName">
              <button type="button"
                      @click="selectedCategory = catName"
                      class="pixel-btn text-[10px] px-2.5 py-1 uppercase"
                      :class="selectedCategory === catName ? 'bg-latte-mauve text-latte-base' : 'bg-latte-surface0 text-latte-text hover:bg-latte-surface1'"
                      x-text="catName">
              </button>
            </template>
          </div>

          <div class="relative w-full md:w-64">
            <input type="text"
                   x-model="searchQuery"
                   placeholder="SEARCH KEY OR CODE..."
                   class="w-full px-3 py-1.5 text-[10px] bg-latte-mantle border-2 border-latte-text shadow-[2px_2px_0_0_#4c4f69] outline-none font-pixel uppercase">
          </div>
        </div>

        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 p-3 bg-latte-mantle border-2 border-latte-surface1 max-h-72 overflow-y-auto">
          <template x-for="kc in filteredKeycodes" :key="kc.code">
            <button type="button"
                    @click="assignKeycode(kc.code, kc.type)"
                    class="pixel-box bg-latte-base hover:bg-latte-pink hover:text-white p-2 text-center transition-colors cursor-pointer flex flex-col items-center justify-center">
              <span class="font-pixel text-[10px] font-bold truncate max-w-full" x-text="kc.name"></span>
              <span class="text-[8px] opacity-50" x-text="'code ' + kc.code"></span>
            </button>
          </template>
        </div>
      </div>

      <!-- Panel 2: 23 RGB Lighting Modes -->
      <div x-show="activeTab === 'lighting'" class="flex flex-col gap-5">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div class="pixel-box bg-latte-mantle p-4 flex flex-col gap-2">
            <h3 class="font-pixel text-xs text-latte-mauve font-bold mb-1">SELECT EFFECT (23 MODES)</h3>
            <div class="max-h-64 overflow-y-auto flex flex-col gap-1 pr-1">
              <template x-for="eff in lightingEffects" :key="eff.value">
                <button type="button"
                        @click="lighting.effect = eff.value; updateLighting()"
                        class="text-left px-3 py-1.5 text-[10px] font-pixel border transition-colors flex items-center justify-between"
                        :class="lighting.effect === eff.value ? 'bg-latte-mauve text-latte-base border-latte-text' : 'bg-latte-base text-latte-text border-latte-surface1 hover:border-latte-mauve'">
                  <span x-text="eff.name"></span>
                  <span class="text-[9px] opacity-60" x-text="eff.zhName"></span>
                </button>
              </template>
            </div>
          </div>

          <div class="pixel-box bg-latte-mantle p-4 flex flex-col gap-4">
            <h3 class="font-pixel text-xs text-latte-mauve font-bold">LIGHTING PARAMETERS</h3>

            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-[10px] font-pixel">
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

            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-[10px] font-pixel">
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

            <div class="flex flex-col gap-1">
              <span class="text-[10px] font-pixel">DIRECTION</span>
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

          <div class="pixel-box bg-latte-mantle p-4 flex flex-col gap-3">
            <h3 class="font-pixel text-xs text-latte-mauve font-bold">CATPPUCCIN PALETTE</h3>
            
            <div class="grid grid-cols-4 gap-2">
              <button type="button" @click="setLightingColor('#ea76cb')" class="h-10 pixel-box bg-latte-pink flex items-center justify-center font-pixel text-[9px] text-white">PINK</button>
              <button type="button" @click="setLightingColor('#8839ef')" class="h-10 pixel-box bg-latte-mauve flex items-center justify-center font-pixel text-[9px] text-white">MAUVE</button>
              <button type="button" @click="setLightingColor('#dc8a78')" class="h-10 pixel-box bg-latte-rosewater flex items-center justify-center font-pixel text-[9px] text-latte-text">ROSE</button>
              <button type="button" @click="setLightingColor('#dd7878')" class="h-10 pixel-box bg-latte-flamingo flex items-center justify-center font-pixel text-[9px] text-white">FLAMINGO</button>
              <button type="button" @click="setLightingColor('#fe640b')" class="h-10 pixel-box bg-latte-peach flex items-center justify-center font-pixel text-[9px] text-white">PEACH</button>
              <button type="button" @click="setLightingColor('#40a02b')" class="h-10 pixel-box bg-latte-green flex items-center justify-center font-pixel text-[9px] text-white">GREEN</button>
              <button type="button" @click="setLightingColor('#179299')" class="h-10 pixel-box bg-latte-teal flex items-center justify-center font-pixel text-[9px] text-white">TEAL</button>
              <button type="button" @click="setLightingColor('#7287fd')" class="h-10 pixel-box bg-latte-lavender flex items-center justify-center font-pixel text-[9px] text-white">LAVENDER</button>
            </div>

            <div class="mt-2 p-2 bg-latte-base border border-latte-surface1 text-[10px] text-latte-subtext0">
              <p>INFO: In <strong>Custom Per-Key mode</strong> (Effect 0), select a color above then click any keycap on the board to apply.</p>
            </div>
          </div>

        </div>
      </div>

      <!-- Panel 3: Rapid Trigger & Magnetic Hall Effect Actuation -->
      <div x-show="activeTab === 'rapid_trigger'" class="flex flex-col gap-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div class="pixel-box bg-latte-mantle p-4 flex flex-col gap-4">
            <h3 class="font-pixel text-xs text-latte-mauve font-bold">MAGNETIC SWITCH ACTUATION</h3>
            
            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-[10px] font-pixel">
                <span>INITIAL ACTUATION DEPTH</span>
                <span class="text-latte-red font-bold" x-text="rapidTrigger.globalActuation.toFixed(1) + ' mm'"></span>
              </div>
              <input type="range"
                     min="0.1"
                     :max="currentMaxTravel"
                     step="0.1"
                     x-model.number="rapidTrigger.globalActuation"
                     @change="updateRapidTrigger()"
                     class="pixel-slider">
              <p class="text-[9px] text-latte-subtext1" x-text="'Travel distance before key registers down (0.1mm - ' + currentMaxTravel + 'mm).'"></p>
            </div>

            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-[10px] font-pixel">
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

            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-[10px] font-pixel">
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

            <label class="flex items-center gap-2 cursor-pointer font-pixel text-[10px] mt-1">
              <input type="checkbox"
                     x-model="rapidTrigger.continuousRapidTrigger"
                     @change="updateRapidTrigger()"
                     class="pixel-checkbox">
              <span>ENABLE CONTINUOUS RAPID TRIGGER</span>
            </label>
          </div>

          <div class="pixel-box bg-latte-mantle p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 class="font-pixel text-xs text-latte-mauve font-bold mb-2">LIVE MAGNETIC TRAVEL GAUGE</h3>
              <p class="text-[10px] text-latte-subtext0 mb-4">
                Press any key on your keyboard to observe the real-time magnetic Hall sensor depth streamed via packet <code class="bg-latte-base px-1 border border-latte-surface1">0xA0</code>.
              </p>
              
              <div class="flex flex-col gap-2 max-h-48 overflow-y-auto">
                <template x-for="(depth, kIdx) in pressedKeys" :key="kIdx">
                  <div class="p-2 bg-latte-base border border-latte-text flex flex-col gap-1">
                    <div class="flex justify-between text-[10px] font-pixel">
                      <span x-text="'Key #' + kIdx + ' [' + (layers[activeLayer][kIdx]?.name || 'Key') + ']'"></span>
                      <span class="text-latte-mauve font-bold" x-text="depth.toFixed(2) + ' mm / ' + (switchTypes[keySwitchMap[kIdx] || 0]?.keyTravel || 3.4) + ' mm'"></span>
                    </div>
                    <div class="w-full bg-latte-crust h-3 border border-latte-text overflow-hidden">
                      <div class="h-full bg-latte-pink transition-all duration-75"
                           :style="{ width: ((depth / (switchTypes[keySwitchMap[kIdx] || 0]?.keyTravel || 3.4)) * 100) + '%' }"></div>
                    </div>
                  </div>
                </template>

                <template x-if="Object.keys(pressedKeys).length === 0">
                  <div class="p-6 text-center border-2 border-dashed border-latte-surface1 flex flex-col items-center justify-center gap-2">
                    <x-pixel-icon name="keyboard" class="w-8 h-8 text-latte-subtext1" />
                    <p class="font-pixel text-[10px] text-latte-subtext1">NO KEYS CURRENTLY DEPRESSED</p>
                    <p class="text-[9px] text-latte-subtext0">Press any physical switch to see real-time Hall sensor actuation</p>
                  </div>
                </template>
              </div>
            </div>

            <div class="pt-3 border-t border-latte-surface1 flex justify-end">
              <button type="button"
                      @click="updateRapidTrigger()"
                      class="pixel-btn-primary text-[10px] flex items-center gap-1.5">
                <x-pixel-icon name="zap" class="w-3.5 h-3.5" />
                <span>APPLY RAPID TRIGGER</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Panel 4: Dedicated Switch Selector (15 Official Switches) -->
      <div x-show="activeTab === 'switches'" class="flex flex-col gap-5">
        <div class="pixel-box bg-latte-mantle p-4 flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-latte-surface1 pb-3">
            <div>
              <h3 class="font-pixel text-xs text-latte-mauve font-bold">MAGNETIC SWITCH MODEL SELECTOR (15 OFFICIAL PROFILES)</h3>
              <p class="text-[10px] text-latte-subtext0">
                Nexus 61S supports magnetic Hall sensors calibrated to 15 official switch models with tailored travel depths.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button type="button"
                      @click="applySwitchToSelectedKey(selectedSwitchType)"
                      :disabled="selectedKeyIndex === null"
                      class="pixel-btn-accent text-[10px] flex items-center gap-1">
                <x-pixel-icon name="target" class="w-3 h-3" />
                <span>APPLY TO SELECTED KEY</span>
              </button>
              <button type="button"
                      @click="applySwitchToAllKeys(selectedSwitchType)"
                      class="pixel-btn-primary text-[10px] flex items-center gap-1">
                <x-pixel-icon name="check" class="w-3 h-3" />
                <span>APPLY TO ALL 61 KEYS</span>
              </button>
            </div>
          </div>

          <!-- Switch Models Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <template x-for="sw in switchTypes" :key="sw.value">
              <button type="button"
                      @click="selectedSwitchType = sw.value"
                      class="pixel-box p-3 text-left transition-all cursor-pointer flex flex-col justify-between"
                      :class="selectedSwitchType === sw.value ? 'bg-latte-mauve text-latte-base border-latte-text' : 'bg-latte-base text-latte-text hover:border-latte-mauve'">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <span class="font-pixel text-[10px] font-bold truncate" x-text="sw.name"></span>
                  <span class="inline-block w-3 h-3 border border-latte-text flex-shrink-0"
                        :style="{ backgroundColor: sw.color }"></span>
                </div>
                <div class="flex items-center justify-between text-[9px] pt-2 border-t border-latte-surface0">
                  <span class="opacity-70" x-text="'TRAVEL: ' + sw.keyTravel + 'mm'"></span>
                  <span class="font-mono text-[8px] px-1 bg-latte-mantle border border-latte-text"
                        x-text="'ID ' + sw.value"></span>
                </div>
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Panel 5: Dedicated Keypress Visualizer (Mechanical Cutaway & Waveform) -->
      <div x-show="activeTab === 'visualizer'" class="flex flex-col gap-5">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          <!-- Mechanical Switch Animated Cutaway -->
          <div class="pixel-box bg-latte-mantle p-4 flex flex-col items-center justify-between gap-4">
            <div class="w-full">
              <h3 class="font-pixel text-xs text-latte-mauve font-bold mb-1">HALL EFFECT MECHANICAL CUTAWAY</h3>
              <p class="text-[10px] text-latte-subtext0 mb-4">Live physical switch stem depression via WebHID <code class="bg-latte-base px-1 border border-latte-surface1">0xA0</code>.</p>
            </div>

            <!-- SVG Switch Cutaway Visualizer -->
            <div class="w-56 h-64 bg-latte-base border-3 border-latte-text shadow-[3px_3px_0_0_#4c4f69] p-3 flex flex-col justify-between relative overflow-hidden">
              
              <!-- Housing Top -->
              <div class="w-full flex justify-between items-center text-[8px] font-pixel text-latte-subtext1 border-b border-latte-surface1 pb-1">
                <span>TOP HOUSING</span>
                <span x-text="currentTravelMm > rapidTrigger.globalActuation ? 'ACTIVE' : 'IDLE'"
                      :class="currentTravelMm > rapidTrigger.globalActuation ? 'text-latte-green font-bold' : 'text-latte-subtext0'"></span>
              </div>

              <!-- Animated Stem & Magnet Chamber -->
              <div class="relative w-full flex-grow flex items-center justify-center my-2">
                <!-- Actuation Threshold Reference Line -->
                <div class="absolute left-0 right-0 border-t-2 border-dashed border-latte-red z-10"
                     :style="{ top: ((rapidTrigger.globalActuation / currentMaxTravel) * 100) + '%' }">
                  <span class="absolute right-1 -top-3 text-[7px] font-pixel text-latte-red font-bold"
                        x-text="'ACT: ' + rapidTrigger.globalActuation + 'mm'"></span>
                </div>

                <!-- Moving Switch Stem -->
                <div class="w-24 bg-latte-mauve border-2 border-latte-text transition-transform duration-75 relative"
                     :style="{
                       height: '70px',
                       transform: 'translateY(' + ((currentTravelMm / currentMaxTravel) * 60) + 'px)'
                     }">
                  <!-- Cross Mount -->
                  <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-3 bg-latte-pink border border-latte-text"></div>
                  <!-- Magnet in stem base -->
                  <div class="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-3 bg-latte-peach border border-latte-text flex items-center justify-center text-[7px] text-white font-bold">
                    MAGNET
                  </div>
                </div>

                <!-- Return Spring Coil Representation -->
                <div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 border-b-2 border-dashed border-latte-overlay1 z-0"></div>
              </div>

              <!-- Bottom Sensor Base -->
              <div class="w-full bg-latte-surface0 p-1.5 border border-latte-text flex justify-between items-center text-[9px] font-pixel">
                <span class="text-latte-teal font-bold">HALL SENSOR</span>
                <span class="text-latte-mauve font-bold" x-text="currentTravelMm.toFixed(2) + ' mm'"></span>
              </div>
            </div>

            <!-- Digital Readout Gauge -->
            <div class="w-full grid grid-cols-2 gap-2 text-center text-[9px] font-pixel">
              <div class="p-2 bg-latte-base border border-latte-text">
                <span class="text-latte-subtext0 block">CURRENT DEPTH</span>
                <span class="text-latte-mauve font-bold text-xs" x-text="currentTravelMm.toFixed(2) + ' mm'"></span>
              </div>
              <div class="p-2 bg-latte-base border border-latte-text">
                <span class="text-latte-subtext0 block">PEAK TRAVEL</span>
                <span class="text-latte-teal font-bold text-xs" x-text="peakTravelMm.toFixed(2) + ' mm'"></span>
              </div>
            </div>
          </div>

          <!-- Live Travel Waveform Chart -->
          <div class="lg:col-span-2 pixel-box bg-latte-mantle p-4 flex flex-col justify-between gap-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-pixel text-xs text-latte-mauve font-bold">REAL-TIME TRAVEL WAVEFORM (LAST 20 READINGS)</h3>
                <span class="font-pixel text-[9px] text-latte-teal" x-text="'MAX TRAVEL: ' + currentMaxTravel + 'mm'"></span>
              </div>
              <p class="text-[10px] text-latte-subtext0 mb-4">Visualizes continuous Hall sensor readings while pressing switches.</p>

              <!-- Waveform Bar Chart -->
              <div class="h-44 bg-latte-base border-2 border-latte-text p-2 flex items-end justify-between gap-1 relative overflow-hidden">
                <!-- Actuation Threshold Horizontal Line -->
                <div class="absolute left-0 right-0 border-t border-dashed border-latte-red pointer-events-none"
                     :style="{ bottom: ((rapidTrigger.globalActuation / currentMaxTravel) * 100) + '%' }"></div>

                <template x-for="(wVal, wIdx) in travelWaveform" :key="wIdx">
                  <div class="flex-grow bg-latte-mauve border border-latte-text transition-all duration-75"
                       :style="{
                         height: Math.max(4, (wVal / currentMaxTravel) * 100) + '%',
                         backgroundColor: wVal > rapidTrigger.globalActuation ? '#8839ef' : '#bcc0cc'
                       }"></div>
                </template>
              </div>
            </div>

            <!-- Heat matrix summary -->
            <div class="p-3 bg-latte-base border border-latte-text text-[10px] flex flex-col gap-2">
              <span class="font-pixel font-bold text-latte-text">ACTIVE ACTUATIONS:</span>
              <div class="flex flex-wrap gap-2">
                <template x-for="(dVal, kKey) in pressedKeys" :key="kKey">
                  <span class="px-2 py-0.5 bg-latte-pink text-white font-pixel text-[9px] border border-latte-text"
                        x-text="'Key #' + kKey + ': ' + dVal.toFixed(2) + 'mm'"></span>
                </template>
                <template x-if="Object.keys(pressedKeys).length === 0">
                  <span class="text-latte-subtext1 italic">Press any physical switch to see live data</span>
                </template>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Panel 6: 16-Slot Macro Editor -->
      <div x-show="activeTab === 'macros'" class="flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="pixel-box bg-latte-mantle p-3 flex flex-col gap-1">
            <h4 class="font-pixel text-xs text-latte-mauve font-bold mb-2">MACRO SLOTS (1-16)</h4>
            <div class="max-h-60 overflow-y-auto flex flex-col gap-1">
              <template x-for="(m, mIdx) in macros" :key="mIdx">
                <button type="button"
                        @click="activeMacroSlot = mIdx"
                        class="text-left px-2.5 py-1 text-[10px] font-pixel border flex justify-between"
                        :class="activeMacroSlot === mIdx ? 'bg-latte-mauve text-latte-base border-latte-text' : 'bg-latte-base text-latte-text border-latte-surface1 hover:border-latte-mauve'">
                  <span x-text="m.name"></span>
                  <span class="text-[9px] opacity-60" x-text="m.actions.length + ' acts'"></span>
                </button>
              </template>
            </div>
          </div>

          <div class="md:col-span-3 pixel-box bg-latte-mantle p-4 flex flex-col justify-between gap-4">
            <div>
              <div class="flex items-center justify-between mb-3 border-b border-latte-surface1 pb-2">
                <div class="flex items-center gap-2">
                  <h4 class="font-pixel text-[10px] font-bold" x-text="'EDITING ' + macros[activeMacroSlot].name"></h4>
                  <input type="text"
                         x-model="macros[activeMacroSlot].name"
                         class="px-2 py-0.5 text-[10px] bg-latte-base border border-latte-text font-pixel">
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

              <div class="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                <template x-for="(act, aIdx) in macros[activeMacroSlot].actions" :key="aIdx">
                  <div class="p-2 bg-latte-base border border-latte-text flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <span class="font-pixel text-[10px] text-latte-subtext0" x-text="'#' + (aIdx + 1)"></span>
                      <template x-if="act.type === 'key'">
                        <span class="font-pixel text-[10px] text-latte-mauve" x-text="'KEY [' + resolveKeyName(act.code) + '] ' + act.action.toUpperCase()"></span>
                      </template>
                      <template x-if="act.type === 'delay'">
                        <span class="font-pixel text-[10px] text-latte-teal" x-text="'DELAY ' + act.ms + 'ms'"></span>
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
                  <div class="p-4 text-center border-2 border-dashed border-latte-surface1 text-latte-subtext1 text-[10px]">
                    No actions in this macro slot yet. Click "+ ADD KEY" or "+ ADD DELAY" above.
                  </div>
                </template>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-latte-surface1">
              <button type="button"
                      @click="showToast('Macro saved to memory', 'success')"
                      class="pixel-btn-primary text-[10px] flex items-center gap-1.5">
                <x-pixel-icon name="save" class="w-3.5 h-3.5" />
                <span>SAVE MACRO</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel 7: Presets Vault (HTMX Powered) -->
      <div x-show="activeTab === 'presets'" class="flex flex-col gap-4">
        
        <div class="pixel-box bg-latte-mantle p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            <h3 class="font-pixel text-xs text-latte-mauve font-bold">SAVE CURRENT SETUP AS PRESET</h3>
            <p class="text-[10px] text-latte-subtext0">Captures all 4 layers, RGB lighting, Rapid Trigger settings, and base config.</p>
          </div>

          <form hx-post="{{ route('presets.store') }}"
                hx-target="#presets-list"
                class="flex flex-wrap items-center gap-2">
            @csrf
            <input type="hidden" name="layers" :value="JSON.stringify(layers)">
            <input type="hidden" name="lighting" :value="JSON.stringify(lighting)">
            <input type="hidden" name="rapid_trigger" :value="JSON.stringify(rapidTrigger)">
            <input type="hidden" name="base_config" :value="JSON.stringify(baseConfig)">
            <input type="hidden" name="macros" :value="JSON.stringify(macros)">

            <input type="text"
                   name="name"
                   placeholder="PRESET NAME..."
                   required
                   class="px-2.5 py-1 text-[10px] bg-latte-base border-2 border-latte-text shadow-[2px_2px_0_0_#4c4f69] font-pixel outline-none uppercase">

            <select name="category"
                    class="px-2 py-1 text-[10px] bg-latte-base border-2 border-latte-text font-pixel outline-none uppercase">
              <option value="custom">Custom</option>
              <option value="gaming">Gaming</option>
              <option value="cozy">Cozy</option>
              <option value="typing">Typing</option>
            </select>

            <button type="submit"
                    class="pixel-btn-primary text-[10px] flex items-center gap-1.5">
              <x-pixel-icon name="save" class="w-3.5 h-3.5" />
              <span>SAVE TO VAULT</span>
            </button>
          </form>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-1">
            <span class="font-pixel text-[10px] text-latte-subtext0 mr-1">FILTER:</span>
            <button type="button"
                    hx-get="{{ route('presets.index', ['category' => 'all']) }}"
                    hx-target="#presets-list"
                    class="pixel-btn-secondary text-[10px] px-2 py-1">
              ALL
            </button>
            <button type="button"
                    hx-get="{{ route('presets.index', ['category' => 'cozy']) }}"
                    hx-target="#presets-list"
                    class="pixel-btn-rose text-[10px] px-2 py-1 flex items-center gap-1">
              <x-pixel-icon name="heart" class="w-3 h-3" />
              <span>COZY</span>
            </button>
            <button type="button"
                    hx-get="{{ route('presets.index', ['category' => 'gaming']) }}"
                    hx-target="#presets-list"
                    class="pixel-btn text-[10px] px-2 py-1 bg-latte-red text-latte-base border-2 border-latte-text shadow-[2px_2px_0_0_#4c4f69] flex items-center gap-1">
              <x-pixel-icon name="gamepad" class="w-3 h-3" />
              <span>GAMING</span>
            </button>
            <button type="button"
                    hx-get="{{ route('presets.index', ['category' => 'typing']) }}"
                    hx-target="#presets-list"
                    class="pixel-btn text-[10px] px-2 py-1 bg-latte-peach text-latte-base border-2 border-latte-text shadow-[2px_2px_0_0_#4c4f69] flex items-center gap-1">
              <x-pixel-icon name="keyboard" class="w-3 h-3" />
              <span>TYPING</span>
            </button>
          </div>

          <form action="{{ route('presets.import') }}"
                method="POST"
                enctype="multipart/form-data"
                class="flex items-center gap-2">
            @csrf
            <label class="pixel-btn-secondary text-[10px] px-2 py-1 cursor-pointer flex items-center gap-1">
              <x-pixel-icon name="download" class="w-3.5 h-3.5" />
              <span>IMPORT JSON</span>
              <input type="file"
                     name="preset_file"
                     accept=".json"
                     class="hidden"
                     onchange="this.form.submit()">
            </label>
          </form>
        </div>

        <div id="presets-list">
          @include('presets._list', ['presets' => $presets])
        </div>

      </div>

      <!-- Panel 8: Hardware Settings & Gaming Options -->
      <div x-show="activeTab === 'settings'" class="flex flex-col gap-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div class="pixel-box bg-latte-mantle p-4 flex flex-col gap-4">
            <h3 class="font-pixel text-xs text-latte-mauve font-bold">COMMUNICATION & TIMING</h3>

            <div class="flex flex-col gap-1">
              <span class="text-[10px] font-pixel">POLLING RATE</span>
              <div class="grid grid-cols-4 gap-2 mt-1">
                <template x-for="rate in [125, 250, 500, 1000]" :key="rate">
                  <button type="button"
                          @click="baseConfig.reportRate = rate; updateBaseConfig()"
                          class="pixel-btn text-[10px]"
                          :class="baseConfig.reportRate === rate ? 'pixel-btn-primary' : 'pixel-btn-secondary'"
                          x-text="rate + ' HZ'">
                  </button>
                </template>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-[10px] font-pixel">
                <span>RGB SLEEP TIMER</span>
                <span class="text-latte-peach" x-text="baseConfig.lightSleep === 0 ? 'NEVER' : baseConfig.lightSleep + ' MIN'"></span>
              </div>
              <input type="range"
                     min="0"
                     max="60"
                     step="5"
                     x-model.number="baseConfig.lightSleep"
                     @change="updateBaseConfig()"
                     class="pixel-slider">
            </div>

            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-[10px] font-pixel">
                <span>DEBOUNCE FILTER</span>
                <span class="text-latte-teal" x-text="baseConfig.debounce + ' MS'"></span>
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

          <div class="pixel-box bg-latte-mantle p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 class="font-pixel text-xs text-latte-mauve font-bold mb-3">GAMING LOCKS & SYSTEM</h3>

              <div class="flex flex-col gap-2.5">
                <label class="flex items-center gap-2 cursor-pointer font-pixel text-[10px]">
                  <input type="checkbox"
                         x-model="baseConfig.lockWin"
                         @change="updateBaseConfig()"
                         class="pixel-checkbox">
                  <span>LOCK WINDOWS KEY</span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer font-pixel text-[10px]">
                  <input type="checkbox"
                         x-model="baseConfig.lockAltTab"
                         @change="updateBaseConfig()"
                         class="pixel-checkbox">
                  <span>LOCK ALT+TAB</span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer font-pixel text-[10px]">
                  <input type="checkbox"
                         x-model="baseConfig.lockAltF4"
                         @change="updateBaseConfig()"
                         class="pixel-checkbox">
                  <span>LOCK ALT+F4</span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer font-pixel text-[10px]">
                  <input type="checkbox"
                         x-model="baseConfig.berserkMode"
                         @change="updateBaseConfig()"
                         class="pixel-checkbox">
                  <span>ULTRA-LOW LATENCY (BERSERK MODE)</span>
                </label>
              </div>

              <div class="mt-4 pt-3 border-t border-latte-surface1">
                <h4 class="font-pixel text-[10px] text-latte-teal font-bold mb-1">HALL SENSOR CALIBRATION</h4>
                <p class="text-[9px] text-latte-subtext0 mb-2">Recalibrates magnetic range for all 61 keys. Run if any switch fails to trigger.</p>
                <button type="button"
                        @click="runCalibration()"
                        class="pixel-btn-accent text-[10px] flex items-center gap-1.5">
                  <x-pixel-icon name="target" class="w-3.5 h-3.5" />
                  <span>START SENSOR CALIBRATION</span>
                </button>
              </div>
            </div>

            <div class="pt-3 border-t border-latte-surface1 flex justify-between items-center">
              <button type="button"
                      @click="triggerReset()"
                      class="pixel-btn text-[10px] bg-latte-red text-latte-base hover:opacity-90 border-2 border-latte-text shadow-[2px_2px_0_0_#4c4f69] flex items-center gap-1">
                <x-pixel-icon name="square-alert" class="w-3.5 h-3.5" />
                <span>FACTORY RESET</span>
              </button>

              <button type="button"
                      @click="updateBaseConfig()"
                      class="pixel-btn-primary text-[10px] flex items-center gap-1.5">
                <x-pixel-icon name="save" class="w-3.5 h-3.5" />
                <span>SAVE SETTINGS</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      <!-- Panel 9: Official Firmware Proxy & Updater -->
      <div x-show="activeTab === 'firmware'" class="flex flex-col gap-4">
        <div class="pixel-box bg-latte-mantle p-5 flex flex-col gap-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="font-pixel text-xs text-latte-mauve font-bold mb-1">FIRMWARE RECOVERY & UPDATER</h3>
              <p class="text-[10px] text-latte-subtext0">
                Official Sonix bootloader firmware proxy. Safely downloads and inspects official Nexus 61S firmware images.
              </p>
            </div>
            <span class="font-pixel text-[10px] px-2 py-1 bg-latte-teal text-latte-base border border-latte-text">
              LATEST: v1.18
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-latte-base border-2 border-latte-surface1 text-[10px]">
            <div>
              <span class="font-pixel text-[9px] text-latte-subtext0 block">OFFICIAL IMAGE:</span>
              <span class="font-mono font-bold text-latte-text">YODALL61_118.bin</span>
            </div>
            <div>
              <span class="font-pixel text-[9px] text-latte-subtext0 block">FILE SIZE:</span>
              <span class="font-mono text-latte-text">229,696 bytes</span>
            </div>
            <div>
              <span class="font-pixel text-[9px] text-latte-subtext0 block">TARGET CONTROLLER:</span>
              <span class="font-mono text-latte-text">Sonix Bootloader (0x0C45:0x0500)</span>
            </div>
          </div>

          <div class="p-3 bg-latte-peach/15 border-2 border-latte-peach text-[10px] flex items-start gap-2.5">
            <x-pixel-icon name="square-alert" class="w-5 h-5 text-latte-peach flex-shrink-0" />
            <div>
              <h5 class="font-pixel text-[10px] text-latte-peach font-bold mb-0.5">FIRMWARE FLASHING SAFETY WARNING</h5>
              <p class="text-latte-subtext0">
                Do not unplug the keyboard or close the browser tab during a firmware flash. Only flash when experiencing corrupted sensor data or when recommended by Yodall.
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <a href="{{ route('firmware.download') }}"
               class="pixel-btn-secondary text-[10px] flex items-center gap-1.5"
               download>
              <x-pixel-icon name="download" class="w-3.5 h-3.5" />
              <span>DOWNLOAD OFFICIAL BINARY</span>
            </a>

            <button type="button"
                    @click="showToast('Connect device then switch to bootloader mode', 'info')"
                    class="pixel-btn-rose text-[10px] flex items-center gap-1.5">
              <x-pixel-icon name="cpu" class="w-3.5 h-3.5" />
              <span>PREPARE BOOTLOADER FLASH</span>
            </button>
          </div>
        </div>
      </div>

    </section>

    <!-- Footer -->
    <footer class="text-center font-pixel text-[9px] text-latte-subtext0 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div class="flex items-center gap-1.5">
        <x-pixel-icon name="heart" class="w-3 h-3 text-latte-pink" />
        <span>MEWXUS DRIVER • CATPPUCCIN LATTE • NEXUS 61S</span>
      </div>
      <div>
        <span>BUILT WITH LARAVEL • BLADE • HTMX • ALPINE • UNOCSS</span>
      </div>
    </footer>

  </div>

  <!-- Floating Toast Notification -->
  <div x-show="toast.show"
       x-transition:enter="transition ease-out duration-150"
       x-transition:enter-start="opacity-0 translate-y-2"
       x-transition:enter-end="opacity-100 translate-y-0"
       x-transition:leave="transition ease-in duration-100"
       x-transition:leave-start="opacity-100 translate-y-0"
       x-transition:leave-end="opacity-0 translate-y-2"
       class="fixed bottom-5 right-5 z-50 pixel-box px-4 py-3 flex items-center gap-2 shadow-[4px_4px_0_0_#4c4f69]"
       :class="{
         'bg-latte-base text-latte-text': toast.type === 'info',
         'bg-latte-green text-latte-base': toast.type === 'success',
         'bg-latte-red text-latte-base': toast.type === 'error'
       }">
    <span class="font-pixel text-[10px] font-bold" x-text="toast.message"></span>
    <button type="button" @click="toast.show = false" class="ml-2 font-bold hover:opacity-75">✕</button>
  </div>

</body>
</html>
