"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { getMyPointHistory } from "@/app/actions";

type HistoryItem = {
  created_at: string;
  points_change: number;
  source: string;
};

export function PointsCard({ initialPoints }: { initialPoints: number }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const handleHistoryClick = async () => {
    setIsHistoryOpen(true);
    setIsLoadingHistory(true);
    const userHistory = await getMyPointHistory();
    setHistory(userHistory);
    setIsLoadingHistory(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Points</CardTitle>
          <CardDescription>
            Points are earned by participating in events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold">{initialPoints}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleHistoryClick}>
            View History
          </Button>
        </CardFooter>
      </Card>

      {/* History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your Point History</DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center h-40">
                <Icons.spinner className="h-8 w-8 animate-spin" />
              </div>
            ) : history.length > 0 ? (
              <ul className="space-y-4">
                {history.map((item, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{item.source}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    <p
                      className={`font-bold text-lg ${item.points_change >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {item.points_change > 0 ? "+" : ""}
                      {item.points_change}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No point history found.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
