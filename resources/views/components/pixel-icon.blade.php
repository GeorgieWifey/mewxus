@props([
    'name',
    'class' => 'w-4 h-4 inline-block flex-shrink-0',
])

@php
    $svgPath = base_path("node_modules/pixelarticons/svg/{$name}.svg");
    $svgContent = '';
    if (file_exists($svgPath)) {
        $raw = file_get_contents($svgPath);
        // Replace outer svg tag with our class
        $svgContent = preg_replace(
            '/<svg[^>]*>/',
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="' . e($class) . '" style="image-rendering: pixelated;">',
            $raw
        );
    }
@endphp

{!! $svgContent !!}
