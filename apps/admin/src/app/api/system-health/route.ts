import { NextResponse } from 'next/server';

type ServiceSpec = { name: string; url: string; init?: RequestInit };
type ServiceResult = { name: string; url: string; up: boolean; status: number | null; error?: string; ms?: number };
async function checkOnce(url: string, timeoutMs: number, init?: RequestInit): Promise<{ up: boolean; status: number | null; error?: string; ms?: number }> {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const start = Date.now();
        const res = await fetch(url, { ...(init || {}), signal: ctrl.signal, cache: 'no-store' });
        clearTimeout(id);
        return { up: res.ok, status: res.status, ms: Date.now() - start };
    } catch (err: unknown) {
        clearTimeout(id);
        const message = err instanceof Error ? err.message : String(err);
        return { up: false, status: null, error: message };
    }
}

async function check(url: string, attempts = 3, timeoutMs = 3000, init?: RequestInit): Promise<{ up: boolean; status: number | null; error?: string; ms?: number }> {
    let last: { up: boolean; status: number | null; error?: string; ms?: number } = { up: false, status: null };
    for (let i = 0; i < attempts; i++) {
        const res = await checkOnce(url, timeoutMs, init);
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
    const rabbitUrl = process.env.RABBIT_HEALTH_URL || '';

    let rabbitInit: RequestInit | undefined = undefined;
    const rabbitUser = process.env.RABBIT_HEALTH_USER;
    const rabbitPass = process.env.RABBIT_HEALTH_PASS;
    if (rabbitUser && rabbitPass) {
        const auth = 'Basic ' + Buffer.from(`${rabbitUser}:${rabbitPass}`).toString('base64');
        rabbitInit = { headers: { Authorization: auth } };
    }

    const specs: ServiceSpec[] = [
        { name: 'WebSocket Server', url: websocketUrl },
        { name: 'Discord Bot', url: discordUrl },
        ...(rabbitUrl ? [{ name: 'RabbitMQ', url: rabbitUrl, init: rabbitInit }] : []),
    ];

    const results: ServiceResult[] = await Promise.all(
        specs.map(async (s) => {
            const r = await check(s.url, 3, 3000, s.init);
            return { name: s.name, url: s.url, up: r.up, status: r.status, error: r.error, ms: r.ms };
        }),
    );

    return NextResponse.json({ services: results });
}
