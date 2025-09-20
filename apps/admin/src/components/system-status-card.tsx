'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type Service = {
  name: string;
  url: string;
  up: boolean;
  status: number | null;
  error?: string;
  ms?: number;
};

export function SystemStatusCard() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/system-health', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { services: Service[] };
      setServices(data.services);
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
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!services && !error && (
          <div className="text-sm text-muted-foreground">Loading…</div>
        )}
        {error && (
          <div className="text-sm text-red-600">Failed to load: {error}</div>
        )}
        {services?.map((s) => (
          <div key={s.name} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-muted-foreground break-all">
                {(() => {
                  if (s.name === 'RabbitMQ') {
                    const marker = '/api/health';
                    const idx = s.url.indexOf(marker);
                    if (idx !== -1) {
                      return s.url.slice(0, idx + marker.length);
                    }
                  }
                  return s.url;
                })()}
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
                {s.up
                  ? 'Healthy'
                  : `Unhealthy${s.status ? ` (${s.status})` : ''}`}
                {typeof s.ms === 'number' ? ` • ${s.ms}ms` : ''}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
