{{-- Visual keyboard: keys positioned from the K60 layout, live-press aware. --}}
<div class="flex items-stretch gap-3 w-full">
    {{-- knob strip --}}
    <div class="flex flex-col justify-between shrink-0 py-1" aria-label="Encoder knobs">
        <template x-for="i in 5" :key="i">
            <div class="flex items-center justify-center">
                <div class="relative w-7 h-7 sm:w-9 sm:h-9 bg-surface1 border-3 border-crust shadow-key"
                     :class="i === 1 ? 'w-9 h-9 sm:w-12 sm:h-12' : 'w-6 h-6 sm:w-8 sm:h-8'">
                    <div class="absolute inset-1 border-2 border-subtext0 bg-base"></div>
                    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full w-1 h-2 bg-text"></div>
                </div>
            </div>
        </template>
    </div>

    {{-- key grid: 16 x 5 units --}}
    <div class="relative flex-1" style="aspect-ratio: 16 / 5;">
        <template x-for="k in $store.app.boardKeys" :key="'k' + k.slot">
            <button type="button"
                    class="absolute pixel-border text-text flex flex-col items-center justify-center gap-0.5 px-0.5 text-center cursor-pointer transition-none select-none
                           hover:brightness-105 active:translate-y-0.5 focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-mauve"
                    :style="$store.app.keyStyle(k)"
                    :class="$store.app.keyClass(k)"
                    :aria-label="'Key ' + k.name"
                    @click="$store.app.selectSlot(k.slot)">
                <span class="block font-sans font-bold leading-none text-[8px] truncate w-full"
                      x-text="k.name"></span>
                <span class="hidden sm:block font-pixel leading-none text-[8px] truncate w-full"
                      x-text="$store.app.entryName($store.app.entryAt(k.slot))"></span>
            </button>
        </template>
    </div>
</div>

{{-- shared style/class helpers as a script-less pattern: methods on the store --}}
