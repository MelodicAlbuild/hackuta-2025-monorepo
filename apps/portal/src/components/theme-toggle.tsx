'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoonStar, SunMedium } from 'lucide-react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme ?? 'light');
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label="Toggle theme"
      disabled={!mounted}
    >
      <SunMedium className="h-[1.2rem] w-[1.2rem] transition-all dark:hidden" />
      <MoonStar className="hidden h-[1.2rem] w-[1.2rem] transition-all dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
