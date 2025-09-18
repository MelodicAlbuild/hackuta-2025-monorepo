'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SiteStatus } from '@/lib/site-health';

export function WebsiteStatusCard() {
  const [sites, setSites] = useState<SiteStatus[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/site-health', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { sites: SiteStatus[] };
      setSites(data.sites);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium">Website Status</CardTitle>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!sites && !error && (
          <div className="text-sm text-muted-foreground">Loading…</div>
        )}
        {error && (
          <div className="text-sm text-red-600">Failed to load: {error}</div>
        )}
        {sites?.map((s) => (
          <div key={s.name} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-muted-foreground break-all">
                {s.url}
              </div>
              {!s.up && s.error && (
                <div className="text-xs text-red-600 mt-1">{s.error}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-2 w-2 rounded-full ${s.up ? 'bg-green-500' : 'bg-red-500'}`}
                aria-hidden
              />
              <span className="text-sm">
                {s.up ? 'Up' : `Down${s.status ? ` (${s.status})` : ''}`}
                {typeof s.ms === 'number' ? ` • ${s.ms}ms` : ''}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
