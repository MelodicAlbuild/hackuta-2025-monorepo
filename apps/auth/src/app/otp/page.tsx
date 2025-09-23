'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { createSupabaseBrowserClient } from '@repo/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';

const verifySchema = z
  .object({
    email: z.string().email(),
    code: z
      .string()
      .min(6, 'Enter the 6-digit code')
      .max(12, 'Code seems too long'),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type VerifyForm = z.infer<typeof verifySchema>;

export default function OtpSetPasswordPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // If user is already signed in, send them onward
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('https://portal.hackuta.org/');
    });
  }, [router, supabase]);

  const verifyForm = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      email: '',
      code: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const i = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(i);
  }, [cooldown]);

  async function onVerifyAndSetPassword(values: VerifyForm) {
    setErrorMsg('');
    setSuccessMsg('');

    const { data: verifyData, error: verifyError } =
      await supabase.auth.verifyOtp({
        email: values.email,
        token: values.code,
        type: 'email',
      });

    if (verifyError) {
      setErrorMsg(verifyError.message);
      return;
    }

    if (!verifyData.session) {
      setErrorMsg('Could not establish a session. Try again.');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (updateError) {
      setErrorMsg(updateError.message);
      return;
    }

    setSuccessMsg('Password set! Redirecting to your dashboard...');
    setTimeout(() => router.replace('https://portal.hackuta.org/'), 1200);
  }

  async function onResendCode() {
    setErrorMsg('');
    setSuccessMsg('');
    const email = verifyForm.getValues('email');
    const isEmailValid = await verifyForm.trigger('email');
    if (!isEmailValid) return;

    setIsResending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: undefined,
        shouldCreateUser: false,
      },
    });
    setIsResending(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccessMsg('We sent a new 6-digit code to your email.');
    setCooldown(30);
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Set Your Password</CardTitle>
          <CardDescription>
            Verify your email with a 6-digit code, then choose a password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...verifyForm}>
            <form
              onSubmit={verifyForm.handleSubmit(onVerifyAndSetPassword)}
              className="grid gap-4"
            >
              <FormField
                control={verifyForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={verifyForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>6-digit Code</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between -mt-2">
                <span className="text-xs text-muted-foreground">
                  Didn’t get a code? Check spam or resend.
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={onResendCode}
                  disabled={isResending || cooldown > 0}
                >
                  {isResending ? (
                    <Icons.spinner className="mr-1 h-3 w-3 animate-spin" />
                  ) : null}
                  {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend code'}
                </Button>
              </div>
              <FormField
                control={verifyForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
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
                control={verifyForm.control}
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
              <div className="grid gap-2">
                <Button
                  type="submit"
                  disabled={verifyForm.formState.isSubmitting}
                  className="w-full"
                >
                  {verifyForm.formState.isSubmitting && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Verify & Set Password
                </Button>
              </div>
            </form>
          </Form>
          {errorMsg && (
            <p className="mt-4 text-center text-sm text-red-500">{errorMsg}</p>
          )}
          {successMsg && (
            <p className="mt-4 text-center text-sm text-green-500">
              {successMsg}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
