<?php

namespace Database\Seeders;

use App\Models\Preset;
use Illuminate\Database\Seeder;

class PresetSeeder extends Seeder
{
    public function run(): void
    {
        Preset::truncate();

        Preset::create([
            'name' => 'Sakura Cozy',
            'description' => 'Gentle pastel theme for daily typing. Soft pink and lavender breathing lights, standard 2.0mm magnetic actuation.',
            'category' => 'cozy',
            'lighting' => [
                'effect' => 4, // Breathing
                'brightness' => 80,
                'speed' => 40,
                'direction' => 0,
                'color' => ['r' => 234, 'g' => 118, 'b' => 203], // Catppuccin Pink
            ],
            'rapid_trigger' => [
                'globalActuation' => 2.0,
                'globalPressSensitivity' => 0.2,
                'globalReleaseSensitivity' => 0.2,
                'continuousRapidTrigger' => false,
            ],
            'base_config' => [
                'reportRate' => 1000,
                'lightSleep' => 5,
                'debounce' => 2,
                'systemMode' => 0,
                'lockWin' => false,
                'floorLampSync' => true,
                'berserkMode' => false,
            ],
        ]);

        Preset::create([
            'name' => 'Apex Rapid Trigger',
            'description' => 'Ultra-fast competitive FPS mode. 0.4mm actuation with 0.1mm continuous Rapid Trigger and berserk performance.',
            'category' => 'gaming',
            'lighting' => [
                'effect' => 1, // Spectrum
                'brightness' => 100,
                'speed' => 75,
                'direction' => 0,
                'color' => ['r' => 136, 'g' => 57, 'b' => 239], // Mauve
            ],
            'rapid_trigger' => [
                'globalActuation' => 0.4,
                'globalPressSensitivity' => 0.1,
                'globalReleaseSensitivity' => 0.1,
                'continuousRapidTrigger' => true,
            ],
            'base_config' => [
                'reportRate' => 1000,
                'lightSleep' => 15,
                'debounce' => 1,
                'systemMode' => 0,
                'lockWin' => true,
                'floorLampSync' => true,
                'berserkMode' => true,
            ],
        ]);

        Preset::create([
            'name' => 'Latte Code & Focus',
            'description' => 'Static warm latte cream lighting with 1.8mm balanced tactile travel and Win key enabled.',
            'category' => 'typing',
            'lighting' => [
                'effect' => 3, // Static Color
                'brightness' => 60,
                'speed' => 50,
                'direction' => 0,
                'color' => ['r' => 220, 'g' => 138, 'b' => 120], // Rosewater
            ],
            'rapid_trigger' => [
                'globalActuation' => 1.8,
                'globalPressSensitivity' => 0.2,
                'globalReleaseSensitivity' => 0.2,
                'continuousRapidTrigger' => false,
            ],
            'base_config' => [
                'reportRate' => 1000,
                'lightSleep' => 10,
                'debounce' => 2,
                'systemMode' => 0,
                'lockWin' => false,
                'floorLampSync' => true,
                'berserkMode' => false,
            ],
        ]);
    }
}
