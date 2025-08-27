"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUserManually } from "../actions";
import { Label } from "@/components/ui/label";

type NewUserCredentials = {
  email: string;
  password?: string;
};

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState<NewUserCredentials | null>(null);

  const handleAction = async (formData: FormData) => {
    setIsSubmitting(true);
    setError("");
    try {
      const result = await createUserManually(formData);
      if (result.success) {
        setNewUser({ email: result.email!, password: result.password });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setNewUser(null);
    setError("");
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetAndClose();
        } else {
          setOpen(isOpen);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Create User Manually</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {newUser ? "User Created Successfully" : "Create a New User"}
          </DialogTitle>
          <DialogDescription>
            {newUser
              ? "Copy the password and send it to the user securely. This password will not be shown again."
              : "A random password will be generated. No invitation email will be sent."}
          </DialogDescription>
        </DialogHeader>

        {newUser ? (
          // --- Step 2: Display credentials ---
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={newUser.email} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Generated Password</Label>
              <Input value={newUser.password} readOnly />
            </div>
            <Button
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(newUser.password!)}
            >
              Copy Password
            </Button>
          </div>
        ) : (
          // --- Step 1: User creation form ---
          <form action={handleAction} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                name="email"
                type="email"
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select name="role" defaultValue="user">
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super-admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Invite Method</Label>
              <Select name="inviteMethod" defaultValue="email">
                <SelectTrigger>
                  <SelectValue placeholder="Select an invite method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Show Password</SelectItem>
                  <SelectItem value="discord">Discord</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
