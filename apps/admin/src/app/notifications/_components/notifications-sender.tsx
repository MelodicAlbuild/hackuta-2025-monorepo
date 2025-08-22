"use client";

import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sendBroadcastNotification, sendDirectNotification } from "../actions";

type User = {
  id: string;
  email: string;
};

export function NotificationSender({ users }: { users: User[] }) {
  const broadcastFormRef = useRef<HTMLFormElement>(null);
  const directFormRef = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const handleAction = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: (formData: FormData) => Promise<any>,
    formData: FormData,
    formRef: React.RefObject<HTMLFormElement>
  ) => {
    const res = await action(formData);
    setResult(res);
    if (res.success) {
      formRef.current?.reset();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Notification</CardTitle>
        <CardDescription>
          Send a message to all users or a specific user.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="broadcast">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
            <TabsTrigger value="direct">Direct Message</TabsTrigger>
          </TabsList>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast" className="mt-4">
            <form
              ref={broadcastFormRef}
              action={(fd) =>
                handleAction(
                  sendBroadcastNotification,
                  fd,
                  broadcastFormRef as React.RefObject<HTMLFormElement>
                )
              }
              className="space-y-4"
            >
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
          </TabsContent>

          {/* Direct Message Tab */}
          <TabsContent value="direct" className="mt-4">
            <form
              ref={directFormRef}
              action={(fd) =>
                handleAction(
                  sendDirectNotification,
                  fd,
                  directFormRef as React.RefObject<HTMLFormElement>
                )
              }
              className="space-y-4"
            >
              <div>
                <label htmlFor="targetUserId" className="text-sm font-medium">
                  Recipient
                </label>
                <Select name="targetUserId" required>
                  <SelectTrigger id="targetUserId" className="mt-1">
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  placeholder="Type your message here..."
                  required
                  rows={5}
                  className="mt-1"
                />
              </div>
              <Button type="submit">Send Direct Message</Button>
            </form>
          </TabsContent>
        </Tabs>

        {result?.message && (
          <p
            className={`mt-4 text-sm font-medium ${result.success ? "text-green-600" : "text-red-600"}`}
          >
            {result.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
