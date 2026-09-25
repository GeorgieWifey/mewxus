<div id="preset-list">
    <h3 class="text-xs font-bold text-subtext1 mb-1">Saved presets</h3>
    @forelse($presets as $p)
        <div class="flex items-center gap-1.5 border-2 border-crust bg-mantle px-1.5 py-1 mb-1"
             x-data="{ id: {{ $p->id }}, name: @js($p->name) }">
            <div class="min-w-0 grow">
                <p class="text-xs font-extrabold truncate" x-text="name">{{ $p->name }}</p>
                <p class="text-[10px] text-subtext0 font-bold">{{ $p->created_at?->format('M j, H:i') }}</p>
            </div>
            <button type="button" class="pixel-btn pixel-btn-green px-1.5 py-0.5 text-[10px]"
                    @click="$store.app.applyPresetById(id)">apply</button>
            <a href="{{ route('presets.export', $p) }}" class="pixel-btn bg-surface1 px-1.5 py-0.5 text-[10px]" download>export</a>
            <button type="button" class="pixel-btn bg-red/20 border-red/40 px-1.5 py-0.5 text-[10px]"
                    hx-delete="{{ route('presets.destroy', $p) }}"
                    hx-confirm="Delete the preset '{{ $p->name }}'?"
                    hx-target="#preset-list" hx-swap="outerHTML">delete</button>
        </div>
    @empty
        <p class="text-xs text-subtext0 font-bold">No presets yet — configure your board and save the first one.</p>
    @endforelse
</div>
