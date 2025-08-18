"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { updatePassword } from "./actions"; // We will create this action next
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

const passwordFormSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function UpdatePasswordForm() {
  const [message, setMessage] = useState("");

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: "" },
  });

  async function onSubmit(data: PasswordFormValues) {
    const result = await updatePassword(data);
    if (result.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage("Password updated successfully!");
      form.reset(); // Clear the form on success
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update Password</Button>
        {message && <p className="text-sm mt-4">{message}</p>}
      </form>
    </Form>
  );
}
