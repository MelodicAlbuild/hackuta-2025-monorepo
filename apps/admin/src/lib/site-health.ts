export type SiteStatus = {
    name: string;
    url: string;
    up: boolean;
    status: number | null;
    ms?: number;
    error?: string;
};

async function fetchWithTimeout(url: string, timeoutMs: number) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const start = Date.now();
        const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
        const ms = Date.now() - start;
        clearTimeout(id);
        return { res, ms };
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

async function checkSite(name: string, url: string, timeoutMs = 3000): Promise<SiteStatus> {
    try {
        const { res, ms } = await fetchWithTimeout(url, timeoutMs);
        const status = res.status;
        const up = status >= 200 && status < 400; // treat 3xx as up for websites
        return { name, url, up, status, ms };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { name, url, up: false, status: null, error: message };
    }
}

function parseConfiguredSites(): { name: string; url: string }[] {
    // Preferred: comma-separated list of Name|URL entries
    const list = process.env.WEBSITE_STATUS_URLS;
    if (list) {
        return list
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean)
            .map((pair) => {
                const [name, url] = pair.split('|');
                return { name: name?.trim() || 'Site', url: (url || '').trim() };
            })
            .filter((s) => !!s.url);
    }

    // Fallback to individual envs
    const sites: { name: string; url?: string }[] = [
        { name: 'Frontpage', url: process.env.SITE_FRONT_URL },
        { name: 'Auth', url: process.env.SITE_AUTH_URL },
        { name: 'Portal', url: process.env.SITE_PORTAL_URL },
    ];

    // Dev defaults if not set
    const withDefaults = sites.map((s) => {
        if (s.url) return s as { name: string; url: string };
        if (s.name === 'Frontpage') return { name: s.name, url: 'http://localhost:3000' };
        if (s.name === 'Auth') return { name: s.name, url: 'http://localhost:3002' };
        if (s.name === 'Portal') return { name: s.name, url: 'http://localhost:3003' };
        return s as { name: string; url: string };
    });

    return withDefaults.filter((s): s is { name: string; url: string } => !!s.url);
}

export async function getSitesStatus() {
    const specs = parseConfiguredSites();
    const results = await Promise.all(specs.map((s) => checkSite(s.name, s.url)));
    return { sites: results };
}
