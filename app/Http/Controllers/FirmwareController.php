<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class FirmwareController extends Controller
{
    private const ALLOWED_HOST = 'yodall.keybord.net.cn';
    private const FIRMWARE_URL = 'https://yodall.keybord.net.cn/YODALL61_118.bin';
    private const EXPECTED_SIZE = 229696;
    private const VERSION = '1.18';

    /**
     * Get information about the latest official firmware.
     */
    public function info()
    {
        return response()->json([
            'version' => self::VERSION,
            'filename' => 'YODALL61_118.bin',
            'expected_size' => self::EXPECTED_SIZE,
            'source' => 'Official Yodall Cloud',
            'notes' => 'Official factory firmware 1.18. Improves magnetic Hall sensor stability and Rapid Trigger response time.',
            'warning' => 'Do not disconnect the keyboard or close the browser during the flashing process.',
        ]);
    }

    /**
     * Download or proxy the official firmware binary safely.
     */
    public function download()
    {
        // Check cache first
        $cachePath = 'firmware/YODALL61_118.bin';
        if (Storage::disk('local')->exists($cachePath)) {
            $contents = Storage::disk('local')->get($cachePath);
            return response($contents, 200, [
                'Content-Type' => 'application/octet-stream',
                'Content-Disposition' => 'attachment; filename="YODALL61_118.bin"',
                'Content-Length' => strlen($contents),
                'X-Firmware-Source' => 'cached',
            ]);
        }

        // SSRF protection: parse URL and enforce strict constraints
        $parsed = parse_url(self::FIRMWARE_URL);
        if ($parsed['scheme'] !== 'https' || strtolower($parsed['host']) !== self::ALLOWED_HOST) {
            abort(403, 'Forbidden firmware host');
        }

        // DNS resolution check: forbid localhost / private ranges
        $ip = gethostbyname($parsed['host']);
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            abort(403, 'Resolved to private or reserved IP address');
        }

        try {
            $response = Http::timeout(20)
                ->withHeaders([
                    'User-Agent' => 'Mewxus-Driver/1.0',
                ])
                ->get(self::FIRMWARE_URL);

            if (!$response->successful()) {
                return response()->json(['error' => 'Failed to fetch firmware from official source'], 502);
            }

            $binary = $response->body();

            // Cache binary locally
            Storage::disk('local')->put($cachePath, $binary);

            return response($binary, 200, [
                'Content-Type' => 'application/octet-stream',
                'Content-Disposition' => 'attachment; filename="YODALL61_118.bin"',
                'Content-Length' => strlen($binary),
                'X-Firmware-Source' => 'proxied',
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error contacting official firmware mirror: ' . $e->getMessage()], 502);
        }
    }
}
