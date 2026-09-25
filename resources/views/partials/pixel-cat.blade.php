{{-- Pixel cat mascot. Expects $state via Alpine on the wrapper (sleep|wake|happy|alarm). --}}
<div class="relative inline-block" style="width: 160px; height: 140px;">
    <svg viewBox="0 0 16 14" width="160" height="140" class="pixelated block" shape-rendering="crispEdges">
        <!-- Zzz (sleep only) -->
        <g x-show="$store.app.mascot === 'sleep'" fill="#9ca0b0">
            <rect x="13" y="0" width="2" height="1"></rect>
            <rect x="14" y="1" width="1" height="1"></rect>
            <rect x="13" y="2" width="2" height="1"></rect>
            <rect x="15" y="3" width="1" height="1"></rect>
            <rect x="14" y="4" width="2" height="1"></rect>
        </g>
        <!-- ears -->
        <g fill="#dc8a78">
            <rect x="2" y="1" width="3" height="3"></rect>
            <rect x="11" y="1" width="3" height="3"></rect>
        </g>
        <g fill="#ea76cb">
            <rect x="3" y="2" width="1" height="1"></rect>
            <rect x="12" y="2" width="1" height="1"></rect>
        </g>
        <!-- head -->
        <rect x="2" y="3" width="12" height="7" fill="#dc8a78"></rect>
        <!-- whiskers -->
        <g fill="#8c8fa1">
            <rect x="0" y="6" width="2" height="1"></rect>
            <rect x="0" y="8" width="2" height="1"></rect>
            <rect x="14" y="6" width="2" height="1"></rect>
            <rect x="14" y="8" width="2" height="1"></rect>
        </g>
        <!-- eyes: sleep -->
        <g x-show="$store.app.mascot === 'sleep'" fill="#4c4f69">
            <rect x="4" y="6" width="2" height="1"></rect>
            <rect x="10" y="6" width="2" height="1"></rect>
        </g>
        <!-- eyes: wake -->
        <g x-show="$store.app.mascot === 'wake'" fill="#4c4f69">
            <rect x="4" y="5" width="2" height="2"></rect>
            <rect x="10" y="5" width="2" height="2"></rect>
            <rect x="5" y="5" width="1" height="1" fill="#eff1f5"></rect>
            <rect x="11" y="5" width="1" height="1" fill="#eff1f5"></rect>
        </g>
        <!-- eyes: happy (^ ^) -->
        <g x-show="$store.app.mascot === 'happy'" fill="#4c4f69">
            <rect x="4" y="6" width="1" height="1"></rect>
            <rect x="5" y="5" width="1" height="1"></rect>
            <rect x="6" y="6" width="1" height="1"></rect>
            <rect x="9" y="6" width="1" height="1"></rect>
            <rect x="10" y="5" width="1" height="1"></rect>
            <rect x="11" y="6" width="1" height="1"></rect>
        </g>
        <!-- eyes: alarm -->
        <g x-show="$store.app.mascot === 'alarm'" fill="#d20f39">
            <rect x="4" y="5" width="2" height="3"></rect>
            <rect x="10" y="5" width="2" height="3"></rect>
        </g>
        <!-- blush (happy) -->
        <g x-show="$store.app.mascot === 'happy'" fill="#ea76cb">
            <rect x="3" y="8" width="2" height="1"></rect>
            <rect x="11" y="8" width="2" height="1"></rect>
        </g>
        <!-- nose + mouth -->
        <rect x="7" y="7" width="2" height="1" fill="#e64553"></rect>
        <rect x="7" y="8" width="2" height="1" fill="#4c4f69" x-show="$store.app.mascot !== 'sleep'"></rect>
        <!-- body -->
        <rect x="3" y="10" width="10" height="4" fill="#dc8a78"></rect>
        <rect x="6" y="11" width="4" height="3" fill="#f2d5cf"></rect>
        <!-- tail -->
        <g class="mewxus-tail" fill="#dc8a78">
            <rect x="13" y="11" width="2" height="1"></rect>
            <rect x="14" y="9" width="2" height="2"></rect>
        </g>
        <!-- paws -->
        <g fill="#f2d5cf">
            <rect x="3" y="13" width="3" height="1"></rect>
            <rect x="10" y="13" width="3" height="1"></rect>
        </g>
    </svg>
</div>
