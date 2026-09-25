<?php

namespace App\Http\Controllers;

use App\Models\Preset;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class PresetController extends Controller
{
    /**
     * Display a listing of presets.
     */
    public function index(Request $request)
    {
        $query = Preset::query()->latest();

        if ($category = $request->query('category')) {
            if ($category !== 'all') {
                $query->where('category', $category);
            }
        }

        $presets = $query->get();

        if ($request->header('HX-Request')) {
            return view('presets._list', compact('presets'));
        }

        return response()->json($presets);
    }

    /**
     * Store a newly created preset.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'category' => 'nullable|string|in:custom,gaming,typing,cozy',
            'layers' => 'nullable',
            'lighting' => 'nullable',
            'rapid_trigger' => 'nullable',
            'base_config' => 'nullable',
            'macros' => 'nullable',
        ]);

        // Decode JSON strings if sent from formData
        foreach (['layers', 'lighting', 'rapid_trigger', 'base_config', 'macros'] as $field) {
            if (isset($validated[$field]) && is_string($validated[$field])) {
                $validated[$field] = json_decode($validated[$field], true);
            }
        }

        $preset = Preset::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'] ?? 'custom',
            'layers' => $validated['layers'] ?? null,
            'lighting' => $validated['lighting'] ?? null,
            'rapid_trigger' => $validated['rapid_trigger'] ?? null,
            'base_config' => $validated['base_config'] ?? null,
            'macros' => $validated['macros'] ?? null,
        ]);

        if ($request->header('HX-Request')) {
            $presets = Preset::latest()->get();
            return response()
                ->view('presets._list', compact('presets'))
                ->header('HX-Trigger', json_encode(['presetSaved' => ['id' => $preset->id, 'name' => $preset->name]]));
        }

        return response()->json(['success' => true, 'preset' => $preset], 201);
    }

    /**
     * Return a preset in JSON format for the client to apply.
     */
    public function show(Preset $preset)
    {
        return response()->json($preset);
    }

    /**
     * Remove the specified preset.
     */
    public function destroy(Request $request, Preset $preset)
    {
        $preset->delete();

        if ($request->header('HX-Request')) {
            $presets = Preset::latest()->get();
            return response()
                ->view('presets._list', compact('presets'))
                ->header('HX-Trigger', json_encode(['presetDeleted' => ['id' => $preset->id]]));
        }

        return response()->json(['success' => true]);
    }

    /**
     * Export preset as downloadable JSON.
     */
    public function export(Preset $preset)
    {
        $payload = [
            'schema' => 'mewxus-preset-v1',
            'name' => $preset->name,
            'description' => $preset->description,
            'category' => $preset->category,
            'layers' => $preset->layers,
            'lighting' => $preset->lighting,
            'rapid_trigger' => $preset->rapid_trigger,
            'base_config' => $preset->base_config,
            'macros' => $preset->macros,
            'exported_at' => now()->toIso8601String(),
        ];

        $filename = 'nexus61s-' . Str::slug($preset->name) . '.json';

        return response()->json($payload, 200, [
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Import preset from uploaded JSON file.
     */
    public function import(Request $request)
    {
        $request->validate([
            'preset_file' => 'required|file|max:2048',
        ]);

        $content = file_get_contents($request->file('preset_file')->getRealPath());
        $data = json_decode($content, true);

        if (!$data || !isset($data['name'])) {
            return back()->with('error', 'Invalid preset file format.');
        }

        $preset = Preset::create([
            'name' => ($data['name'] ?? 'Imported Preset') . ' (Imported)',
            'description' => $data['description'] ?? 'Imported from JSON',
            'category' => $data['category'] ?? 'custom',
            'layers' => $data['layers'] ?? null,
            'lighting' => $data['lighting'] ?? null,
            'rapid_trigger' => $data['rapid_trigger'] ?? null,
            'base_config' => $data['base_config'] ?? null,
            'macros' => $data['macros'] ?? null,
        ]);

        if ($request->header('HX-Request')) {
            $presets = Preset::latest()->get();
            return response()
                ->view('presets._list', compact('presets'))
                ->header('HX-Trigger', json_encode(['presetSaved' => ['id' => $preset->id, 'name' => $preset->name]]));
        }

        return redirect()->back()->with('success', 'Preset imported successfully!');
    }
}
