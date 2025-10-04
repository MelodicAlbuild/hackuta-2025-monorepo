"use client";

import { memo, useState, useCallback } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";
import { applyPointsAction } from "./actions";
import { Button } from "@/components/ui/button";

type ActionState = "idle" | "loading" | "success" | "failure";
type ActionType = "add" | "remove";
type ActionSetup = {
  amount: number;
  source: string;
  type: ActionType;
};

// Helper component for the visual feedback overlay
function ActionOverlay({
  state,
  message,
}: {
  state: ActionState;
  message?: string;
}) {
  if (state === "idle") return null;
  const content = {
    loading: <Icons.spinner className="h-16 w-16 animate-spin text-white" />,
    success: <Icons.checkCircle className="h-16 w-16 text-green-400" />,
    failure: <Icons.xCircle className="h-16 w-16 text-red-400" />,
  };
  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded-lg">
      {content[state]}
      {message && (
        <p className="mt-4 text-white font-semibold text-center">{message}</p>
      )}
    </div>
  );
}

export default function ActionScannerPage() {
  // State for the action setup
  const [mode, setMode] = useState<"check-in" | "custom">("check-in");
  const [customAmount, setCustomAmount] = useState(10);
  const [customSource, setCustomSource] = useState("Workshop");
  const [actionType, setActionType] = useState<ActionType>("add");

  // State for the scanning feedback
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isConfigLocked, setIsConfigLocked] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  const lookupUserByEmail = useCallback(async (email: string) => {
    if (!email) return null;

    setIsLookingUp(true);
    try {
      const response = await fetch("/api/check-in/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to find user");
      return data.user?.qr_token || null;
    } catch (error) {
      console.error("Email lookup failed", error);
      return null;
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  // Main handler for when a QR code is successfully decoded
  const handleScan = async (scannedToken: string) => {
    // Prevent multiple scans while an action is in progress
    if (actionState !== "idle") return;

    setActionState("loading");

    try {
      // 1. First, look up the user by their token
      const response = await fetch("/api/scan-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: scannedToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to find user");
      const userId = data.user.id;
      const userEmail = data.user.email;

      // 2. Determine the action parameters based on the current mode
      let actionParams: ActionSetup;
      if (mode === "check-in") {
        actionParams = { amount: 100, source: "Event Check-in", type: "add" };
      } else {
        const amount = actionType === "add" ? customAmount : -customAmount;
        actionParams = { amount, source: customSource, type: actionType };
      }

      // 3. Apply the action by calling the server action
      await applyPointsAction({ userId, ...actionParams });

      // 4. Set success feedback
      setActionState("success");
      setFeedbackMessage(`${userEmail} updated successfully!`);
    } catch (err) {
      // 5. Set failure feedback
      setActionState("failure");
      setFeedbackMessage(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }

    // 6. Reset the overlay after 2.5 seconds
    setTimeout(() => {
      setActionState("idle");
      setFeedbackMessage("");
      setEmailInput("");
    }, 2500);
  };

  const handleEmailLookup = useCallback(async () => {
    if (!emailInput.trim()) {
      setActionState("failure");
      setFeedbackMessage("Please enter an email address");
      setTimeout(() => {
        setActionState("idle");
        setFeedbackMessage("");
      }, 1500);
      return;
    }

    const qrToken = await lookupUserByEmail(emailInput);
    if (qrToken) {
      handleScan(qrToken);
    } else {
      setActionState("failure");
      setFeedbackMessage("No user found for that email");
      setTimeout(() => {
        setActionState("idle");
        setFeedbackMessage("");
      }, 1500);
    }
  }, [emailInput, lookupUserByEmail, handleScan]);

  const ScannerView = memo(function ScannerView({
    onScan,
    onEmailLookup,
    actionState,
    feedbackMessage,
    emailInput,
    setEmailInput,
    isLookingUp,
  }: {
    onScan: (result: string) => void;
    onEmailLookup: () => void;
    actionState: ActionState;
    feedbackMessage: string;
    emailInput: string;
    setEmailInput: (value: string) => void;
    isLookingUp: boolean;
  }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scanner</CardTitle>
          <CardDescription>
            Scan participant QR code or enter email. The action configured on the left will be applied.
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
                <ActionOverlay state={actionState} message={feedbackMessage} />
                <Scanner
                  constraints={{ facingMode: "environment" }}
                  sound={false}
                  onScan={(detectedBarcodes) => {
                    if (detectedBarcodes.length > 0) {
                      const scannedText = detectedBarcodes[0].rawValue;
                      onScan(scannedText);
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
                    onKeyDown={(e) => e.key === "Enter" && onEmailLookup()}
                    type="email"
                    disabled={actionState !== "idle" || isLookingUp}
                  />
                  <Button
                    onClick={onEmailLookup}
                    disabled={actionState !== "idle" || isLookingUp}
                  >
                    {isLookingUp ? (
                      <Icons.spinner className="animate-spin" />
                    ) : (
                      "Lookup"
                    )}
                  </Button>
                </div>
                {actionState !== "idle" && (
                  <div className="flex flex-col items-center justify-center py-8">
                    {actionState === "loading" && (
                      <Icons.spinner className="h-16 w-16 animate-spin" />
                    )}
                    {actionState === "success" && (
                      <>
                        <Icons.checkCircle className="h-16 w-16 text-green-500" />
                        <p className="mt-4 font-semibold text-center">
                          {feedbackMessage}
                        </p>
                      </>
                    )}
                    {actionState === "failure" && (
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
    );
  });

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* --- COLUMN 1: CONTROL PANEL --- */}
      <Card>
        <CardHeader>
          <CardTitle>Action Setup</CardTitle>
          <CardDescription>
            Configure the action to be performed on scan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={mode}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onValueChange={(v) => setMode(v as any)}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="check-in" id="check-in" />
              <Label htmlFor="check-in" className="ml-2">
                Event Check-in (+100)
              </Label>
            </div>
            <div>
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="ml-2">
                Custom Action
              </Label>
            </div>
          </RadioGroup>

          {mode === "custom" && (
            <div className="space-y-4 p-4 border rounded-lg animate-in fade-in">
              <div className="space-y-2">
                <Label htmlFor="type">Action Type</Label>
                <RadioGroup
                  value={actionType}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onValueChange={(v) => setActionType(v as any)}
                  className="flex"
                >
                  <div className="mr-4">
                    <RadioGroupItem value="add" id="add" />
                    <Label htmlFor="add" className="ml-2">
                      Add Points
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="remove" id="remove" />
                    <Label htmlFor="remove" className="ml-2">
                      Remove Points
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Point Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Reason / Source</Label>
                <Input
                  id="source"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {isConfigLocked ? (
            <Button variant="outline" onClick={() => setIsConfigLocked(false)}>
              Change Action
            </Button>
          ) : (
            <Button onClick={() => setIsConfigLocked(true)}>
              Lock in Action & Start Scanning
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* --- COLUMN 2: SCANNER --- */}
      {isConfigLocked && (
        <ScannerView
          onScan={handleScan}
          onEmailLookup={handleEmailLookup}
          actionState={actionState}
          feedbackMessage={feedbackMessage}
          emailInput={emailInput}
          setEmailInput={setEmailInput}
          isLookingUp={isLookingUp}
        />
      )}
    </div>
  );
}
