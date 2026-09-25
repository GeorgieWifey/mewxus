{!! json_encode(array_merge($preset->data ?? [], ['name' => $preset->name]), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) !!}
