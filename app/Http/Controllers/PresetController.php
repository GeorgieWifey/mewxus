<?php

namespace App\Http\Controllers;

use App\Models\Preset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class PresetController extends Controller
{
    public function index(Request $request): JsonResponse|Response
    {
        $presets = Preset::latest()->get(['id', 'name', 'description', 'created_at']);

        if ($request->wantsJson()) {
            return response()->json(['presets' => $presets]);
        }

        return response()->view('partials.preset-list', ['presets' => $presets]);
    }

    public function store(Request $request): Response
    {
        // the form posts the snapshot as a JSON string; decode before validating
        if (is_string($request->input('data'))) {
            $request->merge(['data' => json_decode($request->input('data'), true)]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:200'],
            'data' => ['required', 'array'],
            'data.board' => ['required', 'in:nexus61s'],
        ]);

        $preset = Preset::create($validated);

        return response()->view('partials.preset-list', [
            'presets' => Preset::latest()->get(['id', 'name', 'description', 'created_at']),
            'saved' => $preset->name,
        ])->header('HX-Trigger', json_encode(['mewxus-toast' => "Preset {$preset->name} saved!"]));
    }

    public function destroy(Preset $preset): Response
    {
        $preset->delete();

        return response()->view('partials.preset-list', [
            'presets' => Preset::latest()->get(['id', 'name', 'description', 'created_at']),
        ])->header('HX-Trigger', json_encode(['mewxus-toast' => 'Preset deleted.']));
    }

    public function export(Preset $preset): Response
    {
        $filename = Str::slug($preset->name).'.mewxus.json';

        return response()->view('partials.preset-export', ['preset' => $preset], 200, [
            'Content-Type' => 'application/json',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function import(Request $request): RedirectResponse|Response
    {
        $request->validate([
            'file' => ['required', 'file', 'max:2048'],
        ]);

        $json = json_decode($request->file('file')->getContent(), true);
        if (! is_array($json) || ($json['board'] ?? null) !== 'nexus61s') {
            return back()->withErrors(['file' => 'That is not a Nexus 61S preset file.']);
        }

        Preset::create([
            'name' => Str::limit($json['name'] ?? 'Imported preset', 80),
            'description' => 'Imported',
            'data' => $json,
        ]);

        return back();
    }
}
