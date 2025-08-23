"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { redeemVendorCode } from "./actions";

type ActionState = "idle" | "loading" | "success" | "failure";

// Reusable overlay for visual feedback
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

export default function UserScannerPage() {
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleScan = async (scannedToken: string) => {
    // Prevent new scans while an action is in progress
    if (actionState !== "idle") return;

    setActionState("loading");

    try {
      // Call the server action with the scanned code
      const result = await redeemVendorCode(scannedToken);
      setActionState("success");
      setFeedbackMessage(`+${result.points_awarded} points!`);
    } catch (err) {
      setActionState("failure");
      setFeedbackMessage(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }

    // Reset the overlay after 2.5 seconds to allow for another scan
    setTimeout(() => setActionState("idle"), 2500);
  };

  return (
    <div className="flex justify-center pt-8">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Scan an Event Code</CardTitle>
          <CardDescription>
            Scan a QR code from a sponsor booth or event activity to earn
            points.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-hidden border-2 border-dashed rounded-lg">
            <ActionOverlay state={actionState} message={feedbackMessage} />
            <Scanner
              onScan={(result) => {
                if (result) handleScan(result[0].rawValue);
              }}
              sound={false}
              constraints={{ facingMode: "environment" }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
