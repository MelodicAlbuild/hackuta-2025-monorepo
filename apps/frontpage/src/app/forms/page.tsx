'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/navbar';
import MLHBadge from '@/components/mlh-badge';
import { cn } from '@/lib/utils';

const FORM_CODE_MAP: Record<string, string> = {
  '398350': '/forms/398350',
  '277812': '/forms/277812',
};

export default function FormAccessGateway() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = code.trim();

    if (cleaned.length === 0) {
      setError('Please enter the access code that was provided to you.');
      return;
    }

    const path = FORM_CODE_MAP[cleaned];

    if (!path) {
      setError(
        'That form code was not recognized. Double-check it and try again.',
      );
      return;
    }

    setError(null);
    router.push(path);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-foreground">
      <Navbar onMobileMenuToggle={setIsMobileMenuOpen} />
      <MLHBadge isMobileMenuOpen={isMobileMenuOpen} />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 pb-20 pt-28 sm:px-8 lg:px-12">
        <header className="flex flex-col items-center text-center">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm uppercase tracking-[0.3em] text-primary">
            HackUTA Forms
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Access your form with a code
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            Enter the unique code you received from the organizing team.
            We&apos;ll unlock the right experience for you instantly.
          </p>
        </header>

        <Card className="border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-2 border-b border-white/10 pb-6 text-left">
            <CardTitle className="text-xl text-white sm:text-2xl">
              Form Access
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Codes are six digits. If you don&apos;t have one, reach out to the
              HackUTA team and we&apos;ll get you set up.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-white"
                  htmlFor="formCode"
                >
                  Access code
                </label>
                <Input
                  id="formCode"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter your 6-digit code"
                  value={code}
                  onChange={(event) => {
                    const value = event.target.value.replace(/[^0-9]/g, '');
                    setCode(value);
                    if (error) {
                      setError(null);
                    }
                  }}
                  className={cn(
                    'text-lg tracking-[0.4em] text-center',
                    error && 'border-red-500 focus-visible:ring-red-500',
                  )}
                  maxLength={6}
                />
                {error && (
                  <p className="text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Lost your code?{' '}
                  <span className="font-medium text-white">
                    Email hello@hackuta.org
                  </span>
                </p>
                <Button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-primary px-6 text-base font-semibold text-black shadow-lg transition hover:bg-primary/90 sm:w-auto"
                  disabled={code.length === 0}
                >
                  Open form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
