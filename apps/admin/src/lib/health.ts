export type ServiceHealth = {
    name: string;
    url: string;
    up: boolean;
    status: number | null;
    error?: string;
};

export async function checkHealth(url: string, timeoutMs = 3000): Promise<ServiceHealth> {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
        clearTimeout(id);
        const up = res.ok;
        return { name: url, url, up, status: res.status };
    } catch (err: unknown) {
        clearTimeout(id);
        const message = err instanceof Error ? err.message : String(err);
        return { name: url, url, up: false, status: null, error: message };
    }
}

export async function getSystemHealth() {
    const websocketUrl = process.env.WEBSOCKET_HEALTH_URL || 'http://localhost:8080/readyz';
    const discordUrl = process.env.DISCORD_HEALTH_URL || 'http://localhost:3000/readyz';

    const [websocket, discord] = await Promise.all([
        checkHealth(websocketUrl),
        checkHealth(discordUrl),
    ]);

    return {
        services: [
            { name: 'WebSocket Server', url: websocket.url, up: websocket.up, status: websocket.status, error: websocket.error },
            { name: 'Discord Bot', url: discord.url, up: discord.up, status: discord.status, error: discord.error },
        ]
    };
}
