"use client";

import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendBroadcastNotification } from "./actions";

export default function NotificationsPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const handleSend = async (formData: FormData) => {
    const res = await sendBroadcastNotification(formData);
    setResult(res);
    if (res.success) {
      formRef.current?.reset();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Broadcast Notification</CardTitle>
        <CardDescription>
          This message will be sent to all users in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSend} className="space-y-4">
          {/* Add a new Input for the title */}
          <div>
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              name="title"
              placeholder="Notification Title"
              required
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <Textarea
              id="message"
              name="message"
              placeholder="Type your notification here..."
              required
              rows={5}
              className="mt-1"
            />
          </div>
          <Button type="submit">Send to All Users</Button>
        </form>
        {result?.message && (
          <p
            className={`mt-4 text-sm ${result.success ? "text-green-600" : "text-red-600"}`}
          >
            {result.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
