// apps/auth/src/components/login-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Icons } from './icons';
import { useSearchParams } from 'next/navigation';

// Define the form schema for validation
const formSchema = z.object({
  email: z.email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export function LoginForm() {
  const searchParams = useSearchParams();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const redirectTo = searchParams.get('redirect_to');

  // We can use form state to show a loading spinner
  const { isSubmitting } = form.formState;

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form action={signIn}>
          {redirectTo && (
            <input type="hidden" name="redirect_to" value={redirectTo} />
          )}
          <div className="grid gap-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-franklinGothic text-lg">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/50 font-franklinGothic focus:shadow-lg focus:shadow-purple-500/25"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 font-franklinGothic" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-franklinGothic text-lg">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      className="bg-white/10 border-white/10 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/50 font-franklinGothic focus:shadow-lg focus:shadow-purple-500/25"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 font-franklinGothic" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-transparent border border-purple-400/80 text-white font-franklinGothic text-lg p-3 rounded-lg transition-all duration-300 text-sm hover:bg-purple-500/10 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/25"
            >
              {isSubmitting && (
                <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
              )}
              Sign In with Email
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
