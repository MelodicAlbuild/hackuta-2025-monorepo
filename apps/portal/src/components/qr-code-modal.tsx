'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function QrCodeModal() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userGroup, setUserGroup] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserGroup = async () => {
      const response = await fetch('/api/user-group');
      const data = await response.json();
      setUserGroup(data.group);
    };
    fetchUserGroup();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Show My QR Code</Button>
      </DialogTrigger>
      <DialogContent className="w-auto">
        <DialogHeader>
          <DialogTitle>Your Personal QR Code</DialogTitle>
          <DialogDescription>
            Present this to an event organizer for <br />
            check-in or to earn points.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-white rounded-lg inline-block">
          <div className="relative h-[300px] w-[300px]">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Icons.spinner className="h-12 w-12 animate-spin text-gray-500" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
            <Image
              src="/api/my-qr"
              alt="Your personal QR Code"
              width={300}
              height={300}
              unoptimized
              className={`transition-opacity duration-300 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError('Could not load QR code.');
              }}
            />
          </div>
        </div>
        {userGroup && (
          <DialogFooter>
            <div className="flex text-center font-franklinGothic">
              <p className="font-franklinGothic text-gray-600">
                Group: <span className="font-bold text-black">{userGroup}</span>
              </p>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
