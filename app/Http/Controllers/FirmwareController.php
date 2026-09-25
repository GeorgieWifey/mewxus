<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/**
 * Proxies the official YODALL61 firmware image. SSRF-hardened: https only,
 * a strict host+path allowlist, and IP resolution checks that refuse
 * loopback/private/reserved targets before any request is made.
 */
class FirmwareController extends Controller
{
    private const ALLOWED_HOST = 'yodall.keybord.net.cn';

    private const ALLOWED_PATH = '/YODALL61_118.bin';

    private const CACHE_KEY = 'firmware-yodall61-118';

    public function latest(): Response
    {
        if (Storage::disk('local')->exists(self::CACHE_KEY)) {
            $bytes = Storage::disk('local')->get(self::CACHE_KEY);

            return $this->binary($bytes);
        }

        $url = 'https://'.self::ALLOWED_HOST.self::ALLOWED_PATH;
        $this->assertUrlIsAllowed($url);

        // follow at most 2 redirects, re-validating every hop's host
        $response = Http::withOptions(['allow_redirects' => false])
            ->timeout(60)
            ->get($url);

        $hops = 0;
        while ($response->redirect() && $hops < 2) {
            $location = $response->header('Location');
            $this->assertUrlIsAllowed($location);
            $response = Http::withOptions(['allow_redirects' => false])
                ->timeout(60)
                ->get($location);
            $hops++;
        }

        if ($response->failed()) {
            abort(502, 'Firmware upstream is unreachable.');
        }

        $bytes = $response->body();
        if (strlen($bytes) < 1024) {
            abort(502, 'Firmware upstream returned something that is not a firmware image.');
        }

        Storage::disk('local')->put(self::CACHE_KEY, $bytes);

        return $this->binary($bytes);
    }

    private function binary(string $bytes): Response
    {
        return response($bytes, 200, [
            'Content-Type' => 'application/octet-stream',
            'Content-Length' => strlen($bytes),
            'Content-Disposition' => 'attachment; filename="YODALL61_118.bin"',
            'Cache-Control' => 'no-store',
        ]);
    }

    /**
     * https-only, host+path allowlisted, and the resolved IPs must be public
     * unicast addresses (no localhost, loopback, private or reserved ranges).
     */
    private function assertUrlIsAllowed(string $url): void
    {
        $parts = parse_url($url);
        if ($parts === false || ($parts['scheme'] ?? '') !== 'https') {
            abort(400, 'Firmware URL must use https.');
        }
        if (strcasecmp($parts['host'] ?? '', self::ALLOWED_HOST) !== 0) {
            abort(400, 'Firmware host is not allowlisted.');
        }
        if (($parts['path'] ?? '') !== self::ALLOWED_PATH || ($parts['query'] ?? '') !== '') {
            abort(400, 'Firmware path is not allowlisted.');
        }

        // gethostbynamel works cross-platform (incl. Windows); AAAA is best-effort
        $ips = gethostbynamel(self::ALLOWED_HOST) ?: [];
        try {
            foreach (dns_get_record(self::ALLOWED_HOST, DNS_AAAA) ?: [] as $record) {
                if (! empty($record['ipv6_addr'])) {
                    $ips[] = $record['ipv6_addr'];
                }
            }
        } catch (\Throwable) {
            // AAAA resolution unavailable on this platform; IPv4 checks still apply
        }
        if (! $ips) {
            abort(502, 'Cannot resolve the firmware host.');
        }

        foreach ($ips as $ip) {
            if (! filter_var($ip, FILTER_VALIDATE_IP)) {
                abort(502, 'Firmware host resolved to an invalid address.');
            }
            if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                abort(400, 'Firmware host resolves to a private or reserved address.');
            }
        }
    }
}
