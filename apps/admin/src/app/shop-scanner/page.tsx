'use client';

import { useState, useCallback, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { purchaseShopItem } from './actions';

type ShopItem = {
  id: number;
  name: string;
  description: string | null;
  point_cost: number;
  stock: number | null;
  image_url: string | null;
  category: string;
};

type ScanState = 'idle' | 'loading' | 'success' | 'failure';

export default function ShopScannerPage() {
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [lastScannedToken, setLastScannedToken] = useState('');
  const [scannerKey, setScannerKey] = useState(0);
  const [emailInput, setEmailInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Fetch active shop items
  useEffect(() => {
    async function fetchShopItems() {
      try {
        const response = await fetch('/api/active-shop-items');
        const data = await response.json();
        setShopItems(data.items || []);
      } catch (error) {
        console.error('Failed to fetch shop items', error);
      }
    }
    fetchShopItems();
  }, [scanState]); // Refresh after each scan

  const lookupUserByEmail = useCallback(async (email: string) => {
    if (!email) return null;

    setIsLookingUp(true);
    try {
      const response = await fetch('/api/check-in/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to find user');
      return data.user?.qr_token || null;
    } catch (error) {
      console.error('Email lookup failed', error);
      return null;
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  const handleScan = useCallback(
    async (scannedToken: string) => {
      if (scanState !== 'idle') return;
      if (scannedToken === lastScannedToken) return;
      if (!selectedItemId) {
        setScanState('failure');
        setFeedbackMessage('Please select a shop item first');
        setTimeout(() => {
          setScanState('idle');
          setFeedbackMessage('');
        }, 1500);
        return;
      }

      setLastScannedToken(scannedToken);
      setScanState('loading');

      try {
        const result = await purchaseShopItem({
          qr_token: scannedToken,
          item_id: selectedItemId,
        });

        setScanState('success');
        setFeedbackMessage(result.message || 'Purchase successful!');

        // Return to idle and remount scanner
        setTimeout(() => {
          setScanState('idle');
          setFeedbackMessage('');
          setLastScannedToken('');
          setScannerKey(prev => prev + 1);
          setEmailInput('');
        }, 1500);
      } catch (error) {
        setScanState('failure');
        setFeedbackMessage(
          error instanceof Error ? error.message : 'Purchase failed'
        );

        // Return to idle and remount scanner
        setTimeout(() => {
          setScanState('idle');
          setFeedbackMessage('');
          setLastScannedToken('');
          setScannerKey(prev => prev + 1);
        }, 1500);
      }
    },
    [scanState, selectedItemId, lastScannedToken]
  );

  const handleEmailLookup = useCallback(async () => {
    if (!emailInput.trim()) {
      setScanState('failure');
      setFeedbackMessage('Please enter an email address');
      setTimeout(() => {
        setScanState('idle');
        setFeedbackMessage('');
      }, 1500);
      return;
    }

    const qrToken = await lookupUserByEmail(emailInput);
    if (qrToken) {
      handleScan(qrToken);
    } else {
      setScanState('failure');
      setFeedbackMessage('No user found for that email');
      setTimeout(() => {
        setScanState('idle');
        setFeedbackMessage('');
      }, 1500);
    }
  }, [emailInput, lookupUserByEmail, handleScan]);

  const selectedItem = shopItems.find((item) => item.id === selectedItemId);

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Shop Scanner</h2>
      <p className="text-muted-foreground mb-6">
        Scan participant QR codes to process shop purchases.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Select Item</CardTitle>
            <CardDescription>
              Choose which shop item to sell when scanning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select
                value={selectedItemId?.toString() || ''}
                onValueChange={(value) => setSelectedItemId(parseInt(value, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a shop item..." />
                </SelectTrigger>
                <SelectContent>
                  {shopItems.map((item) => (
                    <SelectItem
                      key={item.id}
                      value={item.id.toString()}
                      disabled={item.stock === 0}
                    >
                      {item.name} - {item.point_cost} pts
                      {item.stock !== null && ` (Stock: ${item.stock})`}
                      {item.stock === 0 && ' - OUT OF STOCK'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {shopItems.length === 0 && (
                <p className="text-sm text-gray-500">
                  No shop items available. Create some in the Shop Items management page.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scanner Panel */}
        {selectedItemId && (
          <Card>
            <CardHeader>
              <CardTitle>Scanner</CardTitle>
              <CardDescription>
                Scan participant QR code or enter email to process purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="camera">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="camera">Scan QR Code</TabsTrigger>
                  <TabsTrigger value="email">Lookup by Email</TabsTrigger>
                </TabsList>
                <TabsContent value="camera" className="mt-4">
                  <div className="relative w-full max-w-sm mx-auto overflow-hidden border rounded-lg">
                    {scanState !== 'idle' && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded-lg">
                        {scanState === 'loading' && (
                          <Icons.spinner className="h-16 w-16 animate-spin text-white" />
                        )}
                        {scanState === 'success' && (
                          <>
                            <Icons.checkCircle className="h-16 w-16 text-green-400" />
                            <p className="mt-4 text-white font-semibold text-center px-4">
                              {feedbackMessage}
                            </p>
                          </>
                        )}
                        {scanState === 'failure' && (
                          <>
                            <Icons.xCircle className="h-16 w-16 text-red-400" />
                            <p className="mt-4 text-white font-semibold text-center px-4">
                              {feedbackMessage}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                    <Scanner
                      key={scannerKey}
                      constraints={{ facingMode: 'environment' }}
                      sound={false}
                      onScan={(detectedBarcodes) => {
                        if (detectedBarcodes.length > 0) {
                          const scannedText = detectedBarcodes[0].rawValue;
                          handleScan(scannedText);
                        }
                      }}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="email" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="participant@example.com"
                        onKeyDown={(e) => e.key === 'Enter' && handleEmailLookup()}
                        type="email"
                        disabled={scanState !== 'idle' || isLookingUp}
                      />
                      <Button
                        onClick={handleEmailLookup}
                        disabled={scanState !== 'idle' || isLookingUp}
                      >
                        {isLookingUp ? (
                          <Icons.spinner className="animate-spin" />
                        ) : (
                          'Lookup'
                        )}
                      </Button>
                    </div>
                    {scanState !== 'idle' && (
                      <div className="flex flex-col items-center justify-center py-8">
                        {scanState === 'loading' && (
                          <Icons.spinner className="h-16 w-16 animate-spin" />
                        )}
                        {scanState === 'success' && (
                          <>
                            <Icons.checkCircle className="h-16 w-16 text-green-500" />
                            <p className="mt-4 font-semibold text-center">
                              {feedbackMessage}
                            </p>
                          </>
                        )}
                        {scanState === 'failure' && (
                          <>
                            <Icons.xCircle className="h-16 w-16 text-red-500" />
                            <p className="mt-4 font-semibold text-center text-red-600">
                              {feedbackMessage}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}