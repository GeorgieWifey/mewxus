@if($presets->isEmpty())
  <div class="p-6 text-center border-2 border-dashed border-latte-overlay0 bg-latte-mantle">
    <p class="font-pixel text-xs text-latte-subtext0 mb-2">NO PRESETS FOUND</p>
    <p class="text-xs text-latte-subtext1">Save your current keyboard configuration as a preset above.</p>
  </div>
@else
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    @foreach($presets as $preset)
      <div class="pixel-box bg-latte-base p-3 flex flex-col justify-between hover:border-latte-mauve transition-colors"
           x-data="{ presetData: {{ json_encode($preset) }} }">
        <div>
          <div class="flex items-start justify-between gap-2 mb-1.5">
            <h4 class="font-pixel text-xs font-bold text-latte-text truncate" title="{{ $preset->name }}">
              {{ $preset->name }}
            </h4>
            <span class="font-pixel text-[9px] px-1.5 py-0.5 border border-latte-text 
              @if($preset->category === 'gaming') bg-latte-red text-latte-base
              @elseif($preset->category === 'typing') bg-latte-peach text-latte-base
              @elseif($preset->category === 'cozy') bg-latte-pink text-latte-base
              @else bg-latte-surface1 text-latte-text @endif">
              {{ strtoupper($preset->category) }}
            </span>
          </div>
          <p class="text-xs text-latte-subtext0 line-clamp-2 mb-3">
            {{ $preset->description ?: 'No description provided.' }}
          </p>
        </div>

        <div class="pt-2 border-t border-latte-surface0 flex items-center justify-between gap-1">
          <button type="button"
                  @click="applyPreset(presetData)"
                  class="pixel-btn-primary text-[10px] px-2 py-1 flex items-center gap-1">
            <x-pixel-icon name="check" class="w-3 h-3" />
            <span>APPLY</span>
          </button>
          
          <div class="flex items-center gap-1">
            <a href="{{ route('presets.export', $preset) }}"
               download
               title="Export as JSON"
               class="pixel-btn-secondary text-[10px] px-2 py-1 flex items-center">
              <x-pixel-icon name="save" class="w-3 h-3" />
            </a>
            <button type="button"
                    hx-delete="{{ route('presets.destroy', $preset) }}"
                    hx-target="#presets-list"
                    hx-confirm="Delete preset '{{ $preset->name }}'?"
                    title="Delete Preset"
                    class="pixel-btn text-[10px] px-2 py-1 bg-latte-red text-latte-base hover:opacity-90 border-2 border-latte-text shadow-[2px_2px_0_0_#4c4f69] flex items-center">
              <x-pixel-icon name="trash" class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    @endforeach
  </div>
@endif
