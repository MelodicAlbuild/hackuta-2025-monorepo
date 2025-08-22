"use client";

import { useState } from "react";
import { addPoints, removePoints, setPoints } from "../actions";
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

  return (
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
                    onClick={() => removePoints(user.id, amounts[user.id] || 0)}
                  >
                    -
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setPoints(user.id, amounts[user.id] || 0)}
                  >
                    Set
                  </Button>
                </>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
