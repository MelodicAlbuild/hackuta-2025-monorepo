"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addPoints } from "../app/points/actions";

// Type definition remains the same
type ScannedUser = {
  id: string;
  email?: string;
  role: string;
  score: number;
};

export function AdminQrScanner() {
  const [qrToken, setQrToken] = useState("");
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState(10);

  // The lookup function is now separate
  const handleLookup = async (token: string) => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    setScannedUser(null);

    try {
      const response = await fetch("/api/scan-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to find user");
      setScannedUser(data.user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPoints = async () => {
    if (!scannedUser) return;
    await addPoints(scannedUser.id, pointsToAdd);
    // Refresh user data by looking them up again with the original token
    handleLookup(qrToken);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>QR Code Scanner</CardTitle>
          <CardDescription>
            Scan a user&apos;s code with your camera or enter it manually to
            perform actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="camera">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera">Scan with Camera</TabsTrigger>
              <TabsTrigger value="manual">Enter Manually</TabsTrigger>
            </TabsList>
            <TabsContent value="camera" className="mt-4">
              <div className="w-full max-w-sm mx-auto p-4 border rounded-lg">
                <Scanner
                  constraints={{ facingMode: "environment" }}
                  sound={false}
                  onScan={(detectedBarcodes) => {
                    if (detectedBarcodes.length > 0) {
                      const scannedText = detectedBarcodes[0].rawValue;
                      console.log(scannedText);
                      setQrToken(scannedText); // Update the input field
                      handleLookup(scannedText); // Automatically look up the user
                    }
                    if (!!error) {
                      console.error("Error scanning QR code:", error);
                    }
                  }}
                />
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Point camera at a QR code
                </p>
              </div>
            </TabsContent>
            <TabsContent value="manual" className="mt-4">
              <div className="flex gap-2">
                <Input
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  placeholder="Enter QR Token..."
                  onKeyDown={(e) => e.key === "Enter" && handleLookup(qrToken)}
                />
                <Button
                  onClick={() => handleLookup(qrToken)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Icons.spinner className="animate-spin" />
                  ) : (
                    "Look Up"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* The result card is now displayed below the tabs */}
      {isLoading && <p className="text-center">Searching...</p>}
      {error && <p className="text-red-500 text-center font-medium">{error}</p>}

      {scannedUser && (
        <Card className="animate-in fade-in">
          <CardHeader>
            <CardTitle>{scannedUser.email}</CardTitle>
            <CardDescription>User ID: {scannedUser.id}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Role</p>
              <p className="text-lg font-semibold capitalize">
                {scannedUser.role}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Current Points
              </p>
              <p className="text-lg font-semibold">{scannedUser.score}</p>
            </div>
          </CardContent>
          <CardFooter className="flex items-center gap-4 border-t pt-6">
            <p className="font-medium text-sm">Actions:</p>
            <Input
              type="number"
              className="w-24"
              value={pointsToAdd}
              onChange={(e) => setPointsToAdd(Number(e.target.value))}
            />
            <Button onClick={handleAddPoints}>Add Points</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
