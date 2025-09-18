'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

import { Icons } from '@/components/icons';

export function QrCodeDisplay() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userGroup, setUserGroup] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserGroup = async () => {
      try {
        const response = await fetch('/api/user-group');
        if (!response.ok) {
          throw new Error('Failed to fetch user group');
        }

        const data = await response.json();
        setUserGroup(data.group ?? null);
      } catch (fetchError) {
        console.error('Unable to fetch user group', fetchError);
      }
    };

    fetchUserGroup();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative rounded-xl bg-white p-4 shadow-sm">
        <div className="relative h-48 w-48 sm:h-64 sm:w-64">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icons.spinner className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}
          <Image
            src="/api/my-qr"
            alt="Your personal QR Code"
            fill
            sizes="(min-width: 640px) 16rem, 12rem"
            unoptimized
            className={`${isLoading || error ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Could not load QR code.');
            }}
          />
        </div>
      </div>
      {userGroup && (
        <p className="text-sm text-muted-foreground">
          Group: <span className="font-medium text-foreground">{userGroup}</span>
        </p>
      )}
    </div>
  );
}
