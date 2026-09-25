@extends('layouts.app')

@section('title', 'Mewxus')

@section('content')
<div x-data>
    {{-- toasts --}}
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none" aria-live="polite">
        <template x-for="t in $store.app.toasts" :key="t.id">
            <div class="pixel-panel px-3 py-2 text-sm font-bold border-2 pointer-events-auto"
                 :class="{ 'bg-green/15 border-green/40': t.type === 'success', 'bg-red/15 border-red/40': t.type === 'error', 'bg-base': t.type === 'info' }"
                 x-text="t.text"></div>
        </template>
    </div>

    {{-- ═══════════════════════ GATE ═══════════════════════ --}}
    <div x-show="$store.app.phase === 'gate'" x-cloak class="min-h-screen checker-faint flex items-center justify-center p-4">
        <div class="pixel-panel p-6 sm:p-10 max-w-xl w-full text-center">
            <div class="flex justify-center">@include('partials.pixel-cat')</div>
            <h1 class="font-pixel text-2xl sm:text-3xl mt-2 text-text">Mewxus</h1>
            <p class="mt-3 text-subtext1 font-bold">A tiny driver with a big heart, for your Yodall Nexus 61S.</p>

            <div x-show="$store.app.error" x-cloak class="mt-4 border-3 border-red bg-red/10 px-3 py-2 text-sm font-bold text-red text-left"
                 x-text="$store.app.error"></div>

            <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button type="button" class="pixel-btn pixel-btn-primary px-5 py-3 text-base grow"
                        :disabled="$store.app.connecting"
                        @click="$store.app.connectReal()">
                    <span x-show="!$store.app.connecting">Connect keyboard</span>
                    <span x-show="$store.app.connecting" x-text="$store.app.busyText || 'Connecting...'"></span>
                </button>
                <button type="button" class="pixel-btn bg-surface1 px-5 py-3 text-base"
                        :disabled="$store.app.connecting"
                        @click="$store.app.connectDemo()">
                    Try demo cat
                </button>
            </div>

            <div x-show="!$store.app.webhidSupported" x-cloak
                 class="mt-5 border-3 border-yellow bg-yellow/15 px-3 py-2 text-sm text-left text-text">
                Your browser has no WebHID. Chrome, Edge or Opera will connect to the real board —
                or poke around in demo mode right now.
            </div>

            <p class="mt-6 text-xs text-subtext0 font-bold leading-relaxed">
                Speaks the Nexus 61S's own USB protocol directly (VID 0xFEED, PID 0x5EEA).<br>
                Nothing is uploaded anywhere; presets stay in this little app.
            </p>
        </div>
    </div>

    {{-- ═══════════════════════ APP SHELL ═══════════════════════ --}}
    <div x-show="$store.app.phase === 'ready'" x-cloak class="min-h-screen flex flex-col checker-faint">
        {{-- header --}}
        <header class="flex items-center gap-3 px-4 py-3 bg-crust dither border-b-3 border-crust flex-wrap">
            <h1 class="font-pixel text-sm text-text">Mewxus</h1>
            <span class="pixel-chip bg-green/20 border-green/50" x-text="$store.app.deviceName"></span>
            <span class="pixel-chip bg-base" x-text="'fw ' + $store.app.fw"></span>
            <span x-show="$store.app.demo" class="pixel-chip bg-pink/20 border-pink/50">demo cat</span>
            <span x-show="$store.app.busy" class="pixel-chip bg-yellow/20 border-yellow/50 animate-pulse"
                  x-text="$store.app.busyText"></span>
            <div class="grow"></div>
            <button type="button" class="pixel-btn bg-surface1 px-3 py-1.5 text-xs" @click="$store.app.disconnect()">Disconnect</button>
        </header>

        <main class="flex-1 grid gap-4 p-4 items-start grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)_380px]">
            {{-- ─── left rail ─── --}}
            <aside class="flex flex-col gap-4">
                <section class="pixel-panel p-4">
                    <h2 class="panel-title mb-2">Board buddy</h2>
                    <div class="flex flex-col items-center gap-2">
                        <div class="scale-90">@include('partials.pixel-cat')</div>
                        <div class="text-xs font-bold text-subtext1 text-center"
                             x-text="$store.app.mascot === 'sleep' ? 'zzz...' :
                                    $store.app.mascot === 'alarm' ? 'something went wrong!' :
                                    $store.app.lastTravel > 0 ? 'travel ' + $store.app.lastTravel : 'all paws on deck'"></div>
                        <div class="w-full h-3 bg-mantle border-2 border-crust overflow-hidden">
                            <div class="h-full bg-teal transition-[width] duration-150"
                                 :style="'width:' + Math.min(100, ($store.app.lastTravel / 100) * 100) + '%'"></div>
                        </div>
                        <p class="text-[10px] text-subtext0 font-bold">live key travel</p>
                    </div>
                </section>

                <section class="pixel-panel p-4">
                    <h2 class="panel-title mb-2">Presets</h2>
                    <form class="flex flex-col gap-2"
                          hx-post="/presets" hx-target="#preset-list" hx-swap="outerHTML"
                          @submit="$store.app.fillPresetInput()">
                        <input type="text" name="name" required maxlength="80" placeholder="Preset name"
                               class="pixel-input text-sm w-full">
                        <input type="hidden" name="data" x-model="$store.app.presetInputValue">
                        <button type="submit" class="pixel-btn pixel-btn-blue px-3 py-1.5 text-xs w-full">Save current setup</button>
                    </form>
                    <div id="preset-list" class="mt-3" hx-get="/presets" hx-trigger="revealed" hx-swap="innerHTML">
                        <p class="text-xs text-subtext0 font-bold">loading presets...</p>
                    </div>
                </section>
            </aside>

            {{-- ─── center: keyboard ─── --}}
            <section class="pixel-panel p-4 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-3">
                    <div class="flex" role="tablist" aria-label="Layers">
                        <template x-for="l in 4" :key="l">
                            <button type="button" class="pixel-btn font-pixel text-[10px] px-3 py-1.5 rounded-none"
                                    :class="l - 1 === $store.app.layer ? 'bg-lavender/40' : 'bg-surface0'"
                                    @click="$store.app.layer = l - 1"
                                    x-text="'L' + l"
                                    :aria-pressed="l - 1 === $store.app.layer"></button>
                        </template>
                    </div>
                    <div class="grow"></div>
                    <button type="button" class="pixel-btn px-3 py-1.5 text-xs"
                            :class="$store.app.mode === 'assign' ? 'bg-rosewater/50' : 'bg-surface1'"
                            @click="$store.app.mode = 'assign'">Assign</button>
                    <button type="button" class="pixel-btn px-3 py-1.5 text-xs"
                            :class="$store.app.mode === 'paint' ? 'bg-pink/40' : 'bg-surface1'"
                            @click="$store.app.mode = 'paint'">Paint</button>
                    <label class="pixel-chip bg-base cursor-pointer" x-show="$store.app.mode === 'paint'">
                        <input type="color" class="w-5 h-5 border-0 bg-transparent p-0 cursor-pointer"
                               x-model="$store.app.paintColor">
                        <span class="text-xs">brush</span>
                    </label>
                </div>

                @include('partials.keyboard')

                <div class="mt-3 flex items-center gap-2 flex-wrap text-xs font-bold text-subtext1">
                    <span class="pixel-chip bg-base"
                          x-text="$store.app.selectedSlot == null ? 'pick a key' : 'key: ' + $store.app.boardKeys[$store.app.selectedSlot]?.name"></span>
                    <span class="pixel-chip bg-base"
                          x-text="'assigned: ' + ($store.app.selectedSlot == null ? '—' : ($store.app.entryName($store.app.entryAt($store.app.selectedSlot)) || 'none'))"></span>
                    <span class="grow"></span>
                    <span x-show="$store.app.mode === 'assign'" class="text-subtext0">click a key, then pick from the panel on the right</span>
                    <span x-show="$store.app.mode === 'paint'" class="text-subtext0">click keys to dab your color on them</span>
                </div>
            </section>

            {{-- ─── right rail: panels ─── --}}
            <aside class="pixel-panel p-0 min-w-0">
                <nav class="grid grid-cols-3 border-b-3 border-crust" role="tablist" aria-label="Panels">
                    <template x-for="t in ['keys','lights','feel','macros','settings','firmware']" :key="t">
                        <button type="button" role="tab"
                                class="font-pixel text-[10px] px-1 py-2.5 uppercase border-r-2 border-b-2 border-crust [&:nth-child(3)]:border-r-0 cursor-pointer"
                                :class="$store.app.tab === t ? 'bg-base text-text' : 'bg-mantle text-subtext0 hover:text-text'"
                                @click="$store.app.tab = t"
                                x-text="t" :aria-selected="$store.app.tab === t"></button>
                    </template>
                </nav>

                <div class="p-4 max-h-[calc(100vh-140px)] overflow-y-auto">
                    {{-- ═══ KEYS ═══ --}}
                    <div x-show="$store.app.tab === 'keys'">
                        <div x-show="$store.app.selectedSlot == null" class="text-sm font-bold text-subtext1">
                            <svg viewBox="0 0 8 8" width="40" height="40" class="pixelated mb-2" shape-rendering="crispEdges" aria-hidden="true">
                                <g fill="#dc8a78">
                                    <rect x="1" y="1" width="2" height="2"/><rect x="5" y="1" width="2" height="2"/>
                                    <rect x="0" y="3" width="2" height="2"/><rect x="6" y="3" width="2" height="2"/>
                                    <rect x="2" y="4" width="4" height="3"/><rect x="1" y="4" width="6" height="2"/>
                                </g>
                            </svg>
                            <p>Click any key on the board, then choose what it should do.</p>
                        </div>
                        <div x-show="$store.app.selectedSlot != null" x-cloak>
                            <h2 class="font-pixel text-[10px] text-text mb-1"
                                x-text="'Key ' + $store.app.boardKeys[$store.app.selectedSlot]?.name"></h2>
                            <p class="text-xs font-bold text-subtext1 mb-3"
                               x-text="'now: ' + ($store.app.entryName($store.app.entryAt($store.app.selectedSlot || 0)) || 'nothing')"></p>

                            <input type="search" placeholder="Search keys…" class="pixel-input text-sm w-full mb-2"
                                   x-model="$store.app.pickerQuery">
                            <div class="flex flex-wrap gap-1 mb-2">
                                <template x-for="g in $store.app.pickerGroups" :key="g.id">
                                    <button type="button" class="pixel-btn bg-surface1 px-2 py-1 text-[10px]"
                                            @click="$store.app.pickerGroup = g.id"
                                            x-text="g.name"></button>
                                </template>
                            </div>
                            <div class="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto p-1 bg-mantle border-3 border-crust mb-3">
                                <template x-for="it in ($store.app.pickerGroups.find(g => g.id === $store.app.pickerGroup) || $store.app.pickerGroups[0])?.items"
                                          :key="it.label">
                                    <button type="button" class="pixel-btn bg-base px-1 py-1.5 text-[11px] font-bold"
                                            @click="$store.app.pickItem(it)" x-text="it.label"></button>
                                </template>
                            </div>

                            <div class="flex flex-wrap gap-2">
                                <button type="button" class="pixel-btn bg-surface1 px-3 py-1.5 text-xs" @click="$store.app.clearSlot()">Clear key</button>
                                <button type="button" class="pixel-btn bg-surface1 px-3 py-1.5 text-xs" @click="$store.app.resetSlotToFactory()">Factory default</button>
                            </div>
                        </div>
                    </div>

                    {{-- ═══ LIGHTS ═══ --}}
                    <div x-show="$store.app.tab === 'lights'" x-cloak>
                        <h2 class="panel-title mb-2">Effect</h2>
                            <div class="grid grid-cols-3 gap-1.5 mb-3">
                                <template x-for="fx in $store.app.lightEffects" :key="fx.value">
                                    <button type="button" class="pixel-btn px-1 py-1.5 text-[10px]"
                                            :class="$store.app.config?.effect === fx.value ? 'bg-rosewater/50' : 'bg-surface1'"
                                            @click="$store.app.updateConfig({ effect: fx.value })" x-text="fx.name"></button>
                                </template>
                            </div>

                        <label class="block text-xs font-bold mb-1">Brightness <span x-text="$store.app.config?.brightness"></span>%</label>
                        <input type="range" min="0" max="100" class="w-full mb-3"
                               x-model.number="$store.app.config.brightness"
                               @change="$store.app.updateConfig({})">

                        <label class="block text-xs font-bold mb-1">Speed <span x-text="4 - ($store.app.config?.speed ?? 2)"></span>/4</label>
                        <input type="range" min="0" max="4" class="w-full mb-3"
                               :value="4 - ($store.app.config?.speed ?? 2)"
                               @input="$store.app.updateConfig({ speed: 4 - Number($event.target.value) })">

                        <div x-show="($store.app.lightEffects.find(f => f.value === $store.app.config?.effect)?.direction || 0) > 0" x-cloak class="mb-3">
                            <label class="block text-xs font-bold mb-1">Direction</label>
                            <div class="flex gap-1.5">
                                <template x-for="d in ($store.app.lightEffects.find(f => f.value === $store.app.config?.effect)?.direction || 0)" :key="d">
                                    <button type="button" class="pixel-btn px-2 py-1 text-[10px]"
                                            :class="$store.app.config?.direction === d ? 'bg-rosewater/50' : 'bg-surface1'"
                                            @click="$store.app.updateConfig({ direction: d })" x-text="'Dir ' + d"></button>
                                </template>
                            </div>
                        </div>

                        <div x-show="$store.app.lightEffects.find(f => f.value === $store.app.config?.effect)?.palette" x-cloak class="mb-3">
                            <label class="block text-xs font-bold mb-1">Base color</label>
                            <div class="flex items-center gap-2 flex-wrap">
                                <input type="color" class="w-8 h-8 border-0 bg-transparent p-0 cursor-pointer"
                                       :value="$store.app.rgbToHex($store.app.config?.rgb || [220,138,120])"
                                       @input="$store.app.updateConfig({ rgb: $store.app.hexToRgb($event.target.value), colorFlag: 1 })">
                                <template x-for="sw in ['#dc8a78','#ea76cb','#8839ef','#7287fd','#04a5e5','#179299','#40a02b','#df8e1d','#fe640b','#d20f39']" :key="sw">
                                    <button type="button" class="w-6 h-6 border-2 border-crust cursor-pointer"
                                            :style="'background:' + sw"
                                            @click="$store.app.updateConfig({ rgb: $store.app.hexToRgb(sw), colorFlag: 1 })"></button>
                                </template>
                            </div>
                        </div>

                        <h2 class="panel-title mt-4 mb-2">Per-key paint</h2>
                        <p class="text-xs font-bold text-subtext1 mb-2">Switch the board to Paint mode and dab colors onto keys.</p>
                        <div class="flex flex-wrap gap-2">
                            <button type="button" class="pixel-btn bg-surface1 px-3 py-1.5 text-xs" @click="$store.app.paintAll()">Paint all keys</button>
                            <button type="button" class="pixel-btn bg-surface1 px-3 py-1.5 text-xs"
                                    @click="$store.app.applyPalette(['#dc8a78','#ea76cb','#8839ef','#7287fd','#04a5e5','#179299'])">Latte rainbow</button>
                        </div>

                        <h2 class="panel-title mt-4 mb-2">Logo light</h2>
                        <div class="grid grid-cols-2 gap-2 mb-2">
                            <label class="text-xs font-bold">Effect
                                <select class="pixel-input text-xs w-full mt-1"
                                        @change="$store.app.updateConfig({ logoEffect: Number($event.target.value) })">
                                    <template x-for="fx in $store.app.logoEffects" :key="fx.value">
                                        <option :value="fx.value" x-text="fx.name"
                                                :selected="$store.app.config?.logoEffect === fx.value"></option>
                                    </template>
                                </select>
                            </label>
                            <label class="text-xs font-bold">Brightness
                                <input type="number" min="0" max="100" class="pixel-input text-xs w-full mt-1"
                                       x-model.number="$store.app.config.logoBrightness"
                                       @change="$store.app.updateConfig({})">
                            </label>
                        </div>
                        <label class="flex items-center gap-2 text-xs font-bold cursor-pointer">
                            <input type="checkbox" class="accent-pink w-4 h-4"
                                   :checked="!!$store.app.config?.floorSync"
                                   @change="$store.app.updateConfig({ floorSync: $event.target.checked ? 1 : 0 })">
                            Sync with room light
                        </label>
                    </div>

                    {{-- ═══ FEEL ═══ --}}
                    <div x-show="$store.app.tab === 'feel'" x-cloak>
                        <div x-show="$store.app.selectedSlot == null" class="text-sm font-bold text-subtext1 mb-3">
                            <p>Pick a key to tune its trigger, or save a setting to every key at once.</p>
                        </div>
                        <template x-if="$store.app.selectedSlot != null">
                            <div>
                                <h2 class="font-pixel text-[10px] text-text mb-2"
                                    x-text="'Key ' + $store.app.boardKeys[$store.app.selectedSlot]?.name + ' trigger'"></h2>
                                <template x-for="f in [
                                    ['keyMode', 'Mode', 'select', [[0,'Standard actuation'],[1,'Rapid Trigger'],[2,'Rapid Trigger (press only)']]],
                                    ['actuation', 'Actuation point', 'range', [1, 200]],
                                    ['rtPress', 'Press sensitivity', 'range', [1, 120]],
                                    ['rtRelease', 'Release sensitivity', 'range', [1, 120]],
                                    ['pressDeadzone', 'Press dead zone', 'range', [0, 127]],
                                    ['releaseDeadzone', 'Release dead zone', 'range', [0, 127]],
                                    ['pressPrecision', 'Press precision', 'select', [[0,'Normal'],[1,'Fine'],[2,'Finer'],[3,'Finest']]],
                                    ['releasePrecision', 'Release precision', 'select', [[0,'Normal'],[1,'Fine'],[2,'Finer'],[3,'Finest']]],
                                ]" :key="f[0]">
                                    <div class="mb-2">
                                        <label class="block text-xs font-bold mb-1">
                                            <span x-text="f[1]"></span>
                                            <span class="text-subtext0" x-text="$store.app.rt[$store.app.selectedSlot]?.[f[0]]"></span>
                                        </label>
                                        <template x-if="f[2] === 'range'">
                                            <input type="range" class="w-full" :min="f[3][0]" :max="f[3][1]"
                                                   :value="$store.app.rt[$store.app.selectedSlot]?.[f[0]]"
                                                   @input="$store.app.updateRtLocal($store.app.selectedSlot, { [f[0]]: Number($event.target.value) })">
                                        </template>
                                        <template x-if="f[2] === 'select'">
                                            <select class="pixel-input text-xs w-full"
                                                    :value="$store.app.rt[$store.app.selectedSlot]?.[f[0]]"
                                                    @change="$store.app.updateRtLocal($store.app.selectedSlot, { [f[0]]: Number($event.target.value) })">
                                                <template x-for="o in f[3]" :key="o[0]">
                                                    <option :value="o[0]" x-text="o[1]"></option>
                                                </template>
                                            </select>
                                        </template>
                                    </div>
                                </template>
                                <div class="flex gap-2 flex-wrap">
                                    <button type="button" class="pixel-btn pixel-btn-green px-3 py-1.5 text-xs"
                                            @click="$store.app.pushRt($store.app.selectedSlot)">Save this key</button>
                                    <button type="button" class="pixel-btn bg-surface1 px-3 py-1.5 text-xs"
                                            @click="$store.app.rt = $store.app.rt.map(() => ({ ...$store.app.rt[$store.app.selectedSlot] })); $store.app.pushRtAll()">Copy to all keys</button>
                                </div>
                            </div>
                        </template>
                        <div class="mt-4 pt-3 border-t-2 border-surface1">
                            <h2 class="panel-title mb-2">Hall sensor calibration</h2>
                            <button type="button" class="pixel-btn bg-surface1 px-3 py-1.5 text-xs"
                                    :disabled="$store.app.busy" @click="$store.app.runCalibration()">
                                Calibrate (keep paws off the keys)
                            </button>
                        </div>
                    </div>

                    {{-- ═══ MACROS ═══ --}}
                    <div x-show="$store.app.tab === 'macros'" x-cloak>
                        <h2 class="panel-title mb-2">Macro slots</h2>
                        <div class="grid grid-cols-8 gap-1 mb-3">
                            <template x-for="(s, i) in $store.app.macroSlots" :key="i">
                                <button type="button" class="pixel-btn font-pixel text-[8px] px-0 py-1.5"
                                        :class="$store.app.macroSlot === i ? 'bg-rosewater/50' : (s.actions?.length ? 'bg-lavender/30' : 'bg-surface1')"
                                        @click="$store.app.setMacroSlot(i)" x-text="i + 1"></button>
                            </template>
                        </div>
                        <p class="text-xs font-bold text-subtext1 mb-2"
                           x-text="'Macro ' + ($store.app.macroSlot + 1) + ' — ' + ($store.app.macroSlots[$store.app.macroSlot]?.actions?.length || 0) + ' actions'"></p>
                        <ol class="flex flex-col gap-1 mb-3 max-h-52 overflow-y-auto">
                            <template x-for="(a, i) in $store.app.macroSlots[$store.app.macroSlot]?.actions" :key="i">
                                <li class="flex items-center gap-1.5 bg-mantle border-2 border-crust px-1.5 py-1">
                                    <span class="pixel-chip bg-base text-[9px] font-pixel"
                                          x-text="a.code ? (a.down ? 'dn' : 'up') : 'dly'"></span>
                                    <select class="pixel-input text-[10px] py-0.5 grow" x-show="a.code"
                                            :value="a.code"
                                            @change="a.code = Number($event.target.value)">
                                        <optgroup label="Keys">
                                            <template x-for="c in [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,39,40,41,42,43,44,46,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,74,75,76,77,78,79,80,81,82]" :key="c">
                                                <option :value="c" x-text="$store.app.usageName(c)"></option>
                                            </template>
                                        </optgroup>
                                        <optgroup label="Modifiers">
                                            <template x-for="(m, mi) in [[224,'LCtrl'],[225,'LShift'],[226,'LAlt'],[227,'LWin'],[228,'RCtrl'],[229,'RShift'],[230,'RAlt'],[231,'RWin']]" :key="m[0]">
                                                <option :value="m[0]" x-text="m[1]"></option>
                                            </template>
                                        </optgroup>
                                    </select>
                                    <span class="grow text-[10px] text-subtext0 font-bold" x-show="!a.code">pause</span>
                                    <input type="number" min="0" max="65535" class="pixel-input text-[10px] py-0.5 w-16"
                                           :value="a.delay" @change="a.delay = Number($event.target.value)" title="delay ms">
                                    <button type="button" class="pixel-btn bg-red/20 border-red/40 px-1.5 py-0.5 text-[10px]"
                                            @click="$store.app.removeMacroAction(i)">del</button>
                                </li>
                            </template>
                        </ol>
                        <div class="flex flex-wrap gap-2 mb-3">
                            <button type="button" class="pixel-btn bg-surface1 px-2 py-1 text-[10px]" @click="$store.app.addMacroAction('tap')">+ keypress</button>
                            <button type="button" class="pixel-btn bg-surface1 px-2 py-1 text-[10px]" @click="$store.app.addMacroAction('delay')">+ delay</button>
                        </div>
                        <button type="button" class="pixel-btn pixel-btn-green px-3 py-1.5 text-xs" @click="$store.app.pushMacro()">Save macros</button>
                        <p class="text-[10px] text-subtext0 font-bold mt-2">Assign macros to keys from the Keys panel → Macros.</p>
                    </div>

                    {{-- ═══ SETTINGS ═══ --}}
                    <div x-show="$store.app.tab === 'settings'" x-cloak>
                        <h2 class="panel-title mb-2">System</h2>
                        <div class="flex gap-1.5 mb-3">
                            <button type="button" class="pixel-btn px-3 py-1.5 text-xs"
                                    :class="$store.app.config?.sysMode === 0 ? 'bg-rosewater/50' : 'bg-surface1'"
                                    @click="$store.app.updateConfig({ sysMode: 0 })">Windows</button>
                            <button type="button" class="pixel-btn px-3 py-1.5 text-xs"
                                    :class="$store.app.config?.sysMode === 2 ? 'bg-rosewater/50' : 'bg-surface1'"
                                    @click="$store.app.updateConfig({ sysMode: 2 })">macOS</button>
                        </div>
                        <div class="flex flex-col gap-2 mb-4">
                            <label class="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <input type="checkbox" class="accent-pink w-4 h-4" :checked="!!$store.app.config?.winLock"
                                       @change="$store.app.updateConfig({ winLock: $event.target.checked })">
                                Win lock
                            </label>
                            <label class="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <input type="checkbox" class="accent-pink w-4 h-4" :checked="!!$store.app.config?.altTabLock"
                                       @change="$store.app.updateConfig({ altTabLock: $event.target.checked })">
                                Alt+Tab lock
                            </label>
                            <label class="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <input type="checkbox" class="accent-pink w-4 h-4" :checked="!!$store.app.config?.tachyon"
                                       @change="$store.app.updateConfig({ tachyon: $event.target.checked })">
                                Tachyon mode (fast report priority)
                            </label>
                            <label class="flex items-center gap-2 text-xs font-bold">Stability
                                <select class="pixel-input text-xs" :value="$store.app.config?.stability ?? 0"
                                        @change="$store.app.updateConfig({ stability: Number($event.target.value) })">
                                    <option value="0">Standard</option><option value="1">Level 1</option>
                                    <option value="2">Level 2</option><option value="3">Level 3</option>
                                </select>
                            </label>
                            <label class="flex items-center gap-2 text-xs font-bold">Debounce
                                <select class="pixel-input text-xs" :value="$store.app.config?.debounce ?? 2"
                                        @change="$store.app.updateConfig({ debounce: Number($event.target.value) })">
                                    <template x-for="d in [0,1,2,3,4,5,6,7]" :key="d">
                                        <option :value="d" x-text="'Level ' + d"></option>
                                    </template>
                                </select>
                            </label>
                            <label class="flex items-center gap-2 text-xs font-bold">Report rate
                                <select class="pixel-input text-xs" :value="$store.app.config?.reportRate ?? 1"
                                        @change="$store.app.updateConfig({ reportRate: Number($event.target.value) })">
                                    <template x-for="r in [0,1,2,3]" :key="r">
                                        <option :value="r" x-text="'Rate ' + r"></option>
                                    </template>
                                </select>
                            </label>
                        </div>

                        <div class="mt-4 pt-3 border-t-2 border-surface1">
                            <h2 class="panel-title mb-2">Danger zone</h2>
                            <div class="flex flex-wrap gap-2">
                                <button type="button" class="pixel-btn bg-surface1 px-3 py-1.5 text-xs" @click="$store.app.resetBoard()">Restart board</button>
                                <button type="button" class="pixel-btn pixel-btn-red px-3 py-1.5 text-xs" @click="$store.app.factoryReset()">Factory reset</button>
                            </div>
                        </div>
                    </div>

                    {{-- ═══ FIRMWARE ═══ --}}
                    <div x-show="$store.app.tab === 'firmware'" x-cloak>
                        <div class="border-3 border-red bg-red/10 px-3 py-2 text-xs font-bold text-text mb-3">
                            Flashing is the one thing Mewxus cannot protect you from.
                            Do not unplug the keyboard or close this tab mid-flash — an interrupted
                            flash can brick the board.
                        </div>
                        <p class="text-xs font-bold mb-3" x-text="'Current firmware: ' + ($store.app.fw || 'unknown')"></p>
                        <fieldset class="mb-3">
                            <legend class="text-xs font-bold mb-1">Firmware source</legend>
                            <label class="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <input type="radio" name="fwsrc" value="official" class="accent-pink" x-model="$store.app.fwSource">
                                Official YODALL61_118 (fetched through this server)
                            </label>
                            <label class="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <input type="radio" name="fwsrc" value="file" class="accent-pink" x-model="$store.app.fwSource">
                                My own .bin file
                            </label>
                            <input x-show="$store.app.fwSource === 'file'" type="file" accept=".bin"
                                   class="pixel-input text-xs w-full mt-1" @change="$store.app.pickFwFile($event)">
                            <p x-show="$store.app.fwSize" class="text-[10px] text-subtext0 font-bold mt-1" x-text="'Selected: ' + $store.app.fwSize + ' bytes'"></p>
                        </fieldset>
                        <button type="button" class="pixel-btn pixel-btn-red px-4 py-2 text-sm"
                                :disabled="$store.app.flashing" @click="$store.app.startFlash()">
                            <span x-text="$store.app.flashing ? 'Flashing…' : 'Enter bootloader & flash'"></span>
                        </button>
                        <div x-show="$store.app.flashing || $store.app.flashProgress > 0" x-cloak class="mt-3">
                            <div class="h-4 bg-mantle border-3 border-crust overflow-hidden">
                                <div class="h-full bg-green transition-[width] duration-200"
                                     :style="'width:' + $store.app.flashProgress + '%'"></div>
                            </div>
                            <p class="text-xs font-bold mt-1" x-text="$store.app.flashStage + ' — ' + $store.app.flashProgress + '%'"></p>
                        </div>
                        <p class="text-[10px] text-subtext0 font-bold mt-3">
                            After the board reboots, it reappears as a new USB device — the browser will
                            ask you to pick it once more, then Mewxus writes and verifies the image.
                        </p>
                    </div>
                </div>
            </aside>
        </main>
    </div>
</div>
@endsection
