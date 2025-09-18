'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react'; // Import useEffect
import { useRouter, useSearchParams } from 'next/navigation';
import type { Session } from '@supabase/supabase-js'; // Import Session type

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
import Link from 'next/link';
import Image from 'next/image';

// Schema remains the same
const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function UpdatePasswordPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const searchParams = useSearchParams();

  // ** NEW: Use useEffect to listen for auth state changes **
  useEffect(() => {
    const method = async () => {
      if (!window.location.hash) {
        setErrorMsg('Missing access token');
        setIsReady(true);
        return;
      }

      const hashData = window.location.hash.substring(1).split('&');

      if (hashData[0].split('=')[1] == 'access_denied') {
        setErrorMsg('Invalid invitation link');
        setIsReady(true);
        return;
      }

      supabase.auth.setSession({
        access_token: hashData[0].split('=')[1],
        refresh_token: hashData[3].split('=')[1],
      });

      // 2. Proactively get the current session to handle the initial state
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setIsReady(true);
      });

      await supabase
        .from('interest-form')
        .update({ status: 'confirmed' })
        .eq('email', session?.user.email);
    };

    if (searchParams) {
      method();
    }
  }, [supabase, searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setErrorMsg('');
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccessMsg('Password updated successfully! Redirecting to HackUTA...');
    setTimeout(() => {
      router.push('/dashboard');
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
            <div className="scrollbar-hide bg-gradient-to-b from-black to-gray-950 max-h-screen overflow-hidden relative">
              {/* HackUTA Logo at Top */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[20]">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  <Image
                    src="/Logo.svg"
                    alt="HackUTA Logo"
                    width={100}
                    height={100}
                    className="drop-shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                  />
                </Link>
              </div>

              {/* Main Content - Centered Form */}
              <div className="font-franklinCondensed text-white text-center w-[100vw] mx-auto px-6 sm:px-10 p-[20px] relative z-[10] pb-[500px]">
                <div className="flex items-center justify-center min-h-[100vh]">
                  <div className="bg-black/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 space-y-6">
                    <div className="text-center">
                      <p className="text-red-500">Error: {errorMsg}!</p>
                      <p>Please request a new invitation.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buildings + Glow */}
              <div className="absolute w-full bottom-0 sm:bottom-auto sm:top-[82%] left-0 z-0">
                <div className="relative w-full">
                  <Image
                    src="/BuildingGlow.svg"
                    alt="Building Glow"
                    className="w-full h-auto opacity-80"
                    width={1438}
                    height={730}
                  />
                  <Image
                    src="/Buildings.svg"
                    alt="Buildings"
                    className="absolute top-0 left-0 w-full h-auto"
                    width={1440}
                    height={761}
                  />
                </div>
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
