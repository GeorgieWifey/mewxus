<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Preset extends Model
{
    protected $fillable = [
        'name',
        'description',
        'category',
        'layers',
        'lighting',
        'rapid_trigger',
        'base_config',
        'macros',
    ];

    protected $casts = [
        'layers' => 'array',
        'lighting' => 'array',
        'rapid_trigger' => 'array',
        'base_config' => 'array',
        'macros' => 'array',
    ];
}
