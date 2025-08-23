"use client";

import { useState } from "react";
import {
  addPoints,
  getPointHistory,
  removePoints,
  setPoints,
} from "../actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icons } from "@/components/icons";

// ** 1. Defined a type for the user object **
// This describes the exact shape of the data the component expects.
type UserWithPoints = {
  id: string;
  email?: string;
  role: string;
  score: number;
};

// ** 2. Typed the `users` prop **
// The component now requires its `users` prop to be an array of `UserWithPoints`.
export function PointsTable({ users }: { users: UserWithPoints[] }) {
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  // ** 3. Added internal types for function arguments **
  const handleAmountChange = (userId: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [userId]: Number(value) }));
  };

  const isAdmin = (user: UserWithPoints) =>
    user.role === "admin" || user.role === "super-admin";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [history, setHistory] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithPoints | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const handleHistoryClick = async (user: UserWithPoints) => {
    setSelectedUser(user);
    setIsLoadingHistory(true);
    const userHistory = await getPointHistory(user.id);
    setHistory(userHistory);
    setIsLoadingHistory(false);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Score</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell className="font-bold">
                {isAdmin(user) ? "∞" : user.score}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {isAdmin(user) ? (
                  <span className="text-sm text-gray-500">N/A for Admins</span>
                ) : (
                  <>
                    <Input
                      type="number"
                      className="w-24 inline-block"
                      placeholder="Amount"
                      onChange={(e) =>
                        handleAmountChange(user.id, e.target.value)
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() => addPoints(user.id, amounts[user.id] || 0)}
                    >
                      +
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        removePoints(user.id, amounts[user.id] || 0)
                      }
                    >
                      -
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setPoints(user.id, amounts[user.id] || 0)}
                    >
                      Set
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHistoryClick(user)}
                    >
                      View History
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* History Modal */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(isOpen) => !isOpen && setSelectedUser(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Point History for {selectedUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center h-40">
                <Icons.spinner className="h-8 w-8 animate-spin" />
              </div>
            ) : history.length > 0 ? (
              <ul className="space-y-4">
                {history.map((item) => (
                  <li
                    key={item.id}
                    className="grid sm:grid-cols-1 md:grid-cols-2 border-b pb-2"
                  >
                    <div className="col-span-1">
                      <p className="font-medium">{item.source}</p>
                      <p className="text-sm text-muted-foreground">
                        by {item.admin_email}
                      </p>
                    </div>
                    <div className="col-span-1">
                      <p
                        className={`font-bold text-lg ${item.points_change >= 0 ? "text-green-600" : "text-red-600"} sm:text-left md:text-center`}
                      >
                        {item.points_change > 0 ? "+" : ""}
                        {item.points_change}
                      </p>
                      <p className="text-xs text-muted-foreground sm:text-left md:text-right">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No point history found for this user.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
