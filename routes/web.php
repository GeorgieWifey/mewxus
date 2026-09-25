<?php

use App\Http\Controllers\FirmwareController;
use App\Http\Controllers\PresetController;
use App\Models\Preset;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $presets = Preset::latest()->get();
    return view('app', compact('presets'));
})->name('home');

// Presets CRUD with htmx & JSON support
Route::get('/presets', [PresetController::class, 'index'])->name('presets.index');
Route::post('/presets', [PresetController::class, 'store'])->name('presets.store');
Route::get('/presets/{preset}', [PresetController::class, 'show'])->name('presets.show');
Route::delete('/presets/{preset}', [PresetController::class, 'destroy'])->name('presets.destroy');
Route::get('/presets/{preset}/export', [PresetController::class, 'export'])->name('presets.export');
Route::post('/presets/import', [PresetController::class, 'import'])->name('presets.import');

// Firmware proxy
Route::get('/firmware/info', [FirmwareController::class, 'info'])->name('firmware.info');
Route::get('/firmware/download', [FirmwareController::class, 'download'])->name('firmware.download');
