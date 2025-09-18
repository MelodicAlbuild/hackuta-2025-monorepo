import { NextResponse } from 'next/server';

type ServiceSpec = { name: string; url: string };
type ServiceResult = { name: string; url: string; up: boolean; status: number | null; error?: string; ms?: number };
async function checkOnce(url: string, timeoutMs: number): Promise<{ up: boolean; status: number | null; error?: string; ms?: number }> {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const start = Date.now();
        const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
        clearTimeout(id);
        return { up: res.ok, status: res.status, ms: Date.now() - start };
    } catch (err: unknown) {
        clearTimeout(id);
        const message = err instanceof Error ? err.message : String(err);
        return { up: false, status: null, error: message };
    }
}

async function check(url: string, attempts = 3, timeoutMs = 3000): Promise<{ up: boolean; status: number | null; error?: string; ms?: number }> {
    let last: { up: boolean; status: number | null; error?: string; ms?: number } = { up: false, status: null };
    for (let i = 0; i < attempts; i++) {
        const res = await checkOnce(url, timeoutMs);
        last = res;
        if (res.up) return res;
        // backoff
        await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** i, 3000)));
    }
    return last;
}

export async function GET() {
    const websocketUrl = process.env.WEBSOCKET_HEALTH_URL || 'http://localhost:8090/readyz';
    const discordUrl = process.env.DISCORD_HEALTH_URL || 'http://localhost:3090/readyz';

    const specs: ServiceSpec[] = [
        { name: 'WebSocket Server', url: websocketUrl },
        { name: 'Discord Bot', url: discordUrl },
    ];

    const results: ServiceResult[] = await Promise.all(
        specs.map(async (s) => {
            const r = await check(s.url, 3, 3000);
            return { name: s.name, url: s.url, up: r.up, status: r.status, error: r.error, ms: r.ms };
        }),
    );

    return NextResponse.json({ services: results });
}
