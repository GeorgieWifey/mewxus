<?php

namespace Tests\Feature;

use App\Models\Preset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DriverTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_renders_successfully(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        $response->assertSee('MEWXUS 61S');
        $response->assertSee('CATPPUCCIN');
    }

    public function test_presets_index_returns_json_and_htmx_partial(): void
    {
        Preset::create([
            'name' => 'Test Cozy Preset',
            'category' => 'cozy',
        ]);

        // Regular JSON request
        $resJson = $this->getJson('/presets');
        $resJson->assertStatus(200);
        $resJson->assertJsonFragment(['name' => 'Test Cozy Preset']);

        // HTMX request
        $resHtmx = $this->withHeaders(['HX-Request' => 'true'])->get('/presets');
        $resHtmx->assertStatus(200);
        $resHtmx->assertSee('Test Cozy Preset');
    }

    public function test_preset_store_and_destroy(): void
    {
        $payload = [
            'name' => 'Competitive FPS Mode',
            'category' => 'gaming',
            'lighting' => ['effect' => 1, 'brightness' => 100],
            'rapid_trigger' => ['globalActuation' => 0.5],
        ];

        $postRes = $this->postJson('/presets', $payload);
        $postRes->assertStatus(201);
        $this->assertDatabaseHas('presets', ['name' => 'Competitive FPS Mode']);

        $preset = Preset::where('name', 'Competitive FPS Mode')->first();

        // Export test
        $exportRes = $this->get('/presets/' . $preset->id . '/export');
        $exportRes->assertStatus(200);
        $exportRes->assertHeader('content-disposition');

        // Delete test
        $delRes = $this->deleteJson('/presets/' . $preset->id);
        $delRes->assertStatus(200);
        $this->assertDatabaseMissing('presets', ['id' => $preset->id]);
    }

    public function test_firmware_info_endpoint(): void
    {
        $response = $this->getJson('/firmware/info');
        $response->assertStatus(200);
        $response->assertJson([
            'version' => '1.18',
            'expected_size' => 229696,
        ]);
    }
}
