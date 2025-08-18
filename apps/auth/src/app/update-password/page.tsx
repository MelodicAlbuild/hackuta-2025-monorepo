"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react"; // Import useEffect
import { useRouter, useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js"; // Import Session type

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";

// Schema remains the same
const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const searchParams = useSearchParams();

  // ** NEW: Use useEffect to listen for auth state changes **
  useEffect(() => {
    const method = async () => {
      if (!window.location.hash) {
        setErrorMsg("Missing access token");
        setIsReady(true);
        return;
      }

      const hashData = window.location.hash.substring(1).split("&");

      if (hashData[0].split("=")[1] == "access_denied") {
        setErrorMsg("Invalid invitation link");
        setIsReady(true);
        return;
      }

      supabase.auth.setSession({
        access_token: hashData[0].split("=")[1],
        refresh_token: hashData[3].split("=")[1],
      });

      // 2. Proactively get the current session to handle the initial state
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setIsReady(true);
      });

      await supabase
        .from("interest-form")
        .update({ status: "confirmed" })
        .eq("email", session?.user.email);
    };

    if (searchParams) {
      method();
    }
  }, [supabase, searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setErrorMsg("");
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccessMsg("Password updated successfully! Redirecting to HackUTA...");
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  }

  const { isSubmitting } = form.formState;

  return (
    <>
      {!isReady ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Icons.spinner className="mx-auto h-12 w-12 animate-spin mb-4" />
            <p>Verifying your invitation...</p>
          </div>
        </div>
      ) : (
        <>
          {!session ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <p className="text-red-500">Error: {errorMsg}!</p>
                <p>Please request a new invitation.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-screen">
              <Card className="mx-auto max-w-lg w-md">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Create Your Password
                  </CardTitle>
                  <CardDescription>
                    Welcome to HackUTA, {session!.user.email}! Set a password to
                    complete your registration.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="grid gap-4"
                    >
                      {/* Form fields remain the same */}
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting && (
                          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Set Password and Sign In
                      </Button>
                    </form>
                  </Form>
                  {errorMsg && (
                    <p className="mt-4 text-center text-sm text-red-500">
                      {errorMsg}
                    </p>
                  )}
                  {successMsg && (
                    <p className="mt-4 text-center text-sm text-green-500">
                      {successMsg}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </>
  );
}
