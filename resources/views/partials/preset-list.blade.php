<div id="preset-list">
    <h3 class="text-[10px] font-bold text-subtext1 mb-1">Saved presets</h3>
    @forelse($presets as $p)
        <div class="flex flex-col gap-1 border-2 border-crust bg-mantle px-2 py-2 mb-2"
             x-data="{ id: {{ $p->id }}, name: @js($p->name) }">
            <div class="flex items-baseline justify-between gap-2">
                <p class="text-[10px] font-bold truncate" x-text="name">{{ $p->name }}</p>
                <p class="text-[8px] text-subtext0 font-bold shrink-0">{{ $p->created_at?->format('M j') }}</p>
            </div>
            <div class="flex items-center gap-1.5">
                <button type="button" class="pixel-btn pixel-btn-green px-1.5 py-1 text-[8px] grow"
                        @click="$store.app.applyPresetById(id)">apply</button>
                <a href="{{ route('presets.export', $p) }}" class="pixel-btn bg-surface1 px-1.5 py-1 text-[8px]" download>export</a>
                <button type="button" class="pixel-btn bg-red/20 border-red/40 px-1.5 py-1 text-[8px]"
                        hx-delete="{{ route('presets.destroy', $p) }}"
                        hx-confirm="Delete the preset '{{ $p->name }}'?"
                        hx-target="#preset-list" hx-swap="outerHTML">delete</button>
            </div>
        </div>
    @empty
        <p class="text-[10px] text-subtext0 font-bold">No presets yet — configure your board and save the first one.</p>
    @endforelse
</div>
