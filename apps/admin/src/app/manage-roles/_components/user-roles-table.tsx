"use client";

import { useState } from "react";
import { updateUserRole } from "../actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type UserWithRole = {
  id: string;
  email?: string;
  role: string;
};

export function UserRolesTable({ users }: { users: UserWithRole[] }) {
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const handleRoleChange = (userId: string, newRole: string) => {
    setRoles((prev) => ({ ...prev, [userId]: newRole }));
  };

  const handleUpdate = async (userId: string) => {
    const newRole = roles[userId];
    if (!newRole) return;

    setIsLoading((prev) => ({ ...prev, [userId]: true }));
    setMessages((prev) => ({ ...prev, [userId]: "" }));

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await updateUserRole(userId, newRole as any);
      setMessages((prev) => ({
        ...prev,
        [userId]: result.message || "Success!",
      }));
    } catch (error) {
      setMessages((prev) => ({
        ...prev,
        [userId]: error instanceof Error ? error.message : "An error occurred.",
      }));
    } finally {
      setIsLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Current Role</TableHead>
          <TableHead>New Role</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.email}</TableCell>
            <TableCell className="capitalize">
              {user.role.includes("-")
                ? user.role.split("-").join(" ")
                : user.role}
            </TableCell>
            <TableCell>
              <Select
                onValueChange={(value) => handleRoleChange(user.id, value)}
                defaultValue={user.role}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super-admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                onClick={() => handleUpdate(user.id)}
                disabled={
                  !roles[user.id] ||
                  roles[user.id] === user.role ||
                  isLoading[user.id]
                }
              >
                {isLoading[user.id] ? "Updating..." : "Update Role"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
