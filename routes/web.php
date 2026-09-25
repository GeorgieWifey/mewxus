<?php

use App\Http\Controllers\FirmwareController;
use App\Http\Controllers\PresetController;
use Illuminate\Support\Facades\Route;

Route::view('/', 'configurator')->name('home');

Route::get('/presets', [PresetController::class, 'index'])->name('presets.index');
Route::post('/presets', [PresetController::class, 'store'])->name('presets.store');
Route::delete('/presets/{preset}', [PresetController::class, 'destroy'])->name('presets.destroy');
Route::get('/presets/{preset}/export', [PresetController::class, 'export'])->name('presets.export');
Route::post('/presets/import', [PresetController::class, 'import'])->name('presets.import');

Route::get('/firmware/latest', [FirmwareController::class, 'latest'])->name('firmware.latest');
