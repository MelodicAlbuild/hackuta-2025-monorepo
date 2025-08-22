"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateUser } from "../actions";

// Define the schema for the form
const profileFormSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters." })
    .max(50, { message: "Full name must be less than 50 characters." }),
  email: z.email(),
  displayName: z
    .string()
    .min(2, { message: "Display name must be at least 2 characters." })
    .max(50, { message: "Display name must be less than 50 characters." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// The component receives the user object as a prop
export function UserProfileForm({ user }: { user: User }) {
  const [message, setMessage] = useState("");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      // Pre-fill the form with the user's current data
      email: user.email || "",
      fullName: user.user_metadata.fullName || "",
      displayName: user.user_metadata.displayName || "",
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    const result = await updateUser(data);
    if (result.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage("Profile updated successfully!");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                {/* Email is read-only as it's the primary identifier */}
                <Input {...field} readOnly disabled className="bg-gray-100" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Your display name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update Profile</Button>
        {message && <p className="text-sm mt-4">{message}</p>}
      </form>
    </Form>
  );
}
