"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@repo/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BellIcon } from "lucide-react";

type Notification = {
  id: number;
  created_at: string;
  title: string;
  message: string;
  target_user_id?: string | null;
  recipient_email?: string | null;
};

// Helper to truncate text
const truncate = (str: string, length: number) => {
  return str.length > length ? str.substring(0, length) + "..." : str;
};

export function NotificationsPanel({
  initialNotifications,
  role,
}: {
  initialNotifications: Notification[];
  role: string | null;
}) {
  const supabase = createSupabaseBrowserClient();
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [stateKey, setStateKey] = useState(0);
  const [seeTargets, setSeeTargets] = useState(false);

  useEffect(() => {
    const lastChecked = localStorage.getItem("notifications_last_checked");
    if (initialNotifications.length > 0) {
      if (lastChecked) {
        const newCount = initialNotifications.filter(
          (n) => new Date(n.created_at) > new Date(lastChecked)
        ).length;
        setUnreadCount(newCount);
      } else {
        setUnreadCount(initialNotifications.length);
      }
    }

    setSeeTargets(role === "super-admin");

    const fetchAndSubscribe = async () => {
      // Fetch initial notifications
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      setNotifications(data || []);

      // Check for unread notifications
      if (lastChecked && data && data.length > 0) {
        const newCount = data.filter(
          (n) => new Date(n.created_at) > new Date(lastChecked)
        ).length;
        setUnreadCount(newCount);
      }
    };

    fetchAndSubscribe();

    const channel = supabase
      .channel("notifications")
      .on<Notification>("broadcast", { event: "shout" }, async (payload) => {
        if (payload.payload.target_user_id) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;
          const target = payload.payload.target_user_id;
          if (target === user.id || role === "super-admin") {
            setNotifications((current) => [payload.payload, ...current]);
            setUnreadCount((current) => current + 1);
            setStateKey((current) => current + 1);
          }
        } else {
          setNotifications((current) => [payload.payload, ...current]);
          setUnreadCount((current) => current + 1);
          setStateKey((current) => current + 1);
        }
      });

    channel.subscribe((state, err) => {
      if (err) {
        console.error("Error subscribing to notifications:", err);
      }
    });

    return () => {
      supabase.removeAllChannels();
    };
  }, [supabase, initialNotifications]);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setUnreadCount(0);
      localStorage.setItem(
        "notifications_last_checked",
        new Date().toISOString()
      );
    }
  };

  return (
    <Dialog
      open={!!selectedNotification}
      onOpenChange={(isOpen) => !isOpen && setSelectedNotification(null)}
      key={stateKey}
    >
      <Popover onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="text-sm border-b pb-2 cursor-pointer hover:bg-accent p-2 rounded"
                    onClick={() => setSelectedNotification(notif)}
                  >
                    <p className="font-semibold">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {truncate(notif.message, 80)}
                    </p>
                    {/* ** NEW: Conditionally display the recipient ** */}
                    {notif.recipient_email && seeTargets && (
                      <p className="text-xs font-bold text-blue-600 mt-2">
                        To: {notif.recipient_email}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground p-2">
                  No new notifications.
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* This Dialog is used to show the full notification content */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selectedNotification?.title}</DialogTitle>
        </DialogHeader>
        <div className="py-4 whitespace-pre-wrap">
          {selectedNotification?.message}
        </div>
        {selectedNotification?.recipient_email && seeTargets && (
          <p className="text-xs font-bold text-blue-600 mt-2">
            To: {selectedNotification?.recipient_email}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
