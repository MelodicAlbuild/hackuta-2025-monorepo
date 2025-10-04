'use client';

import MLHBadge from '@/components/mlh-badge';
import Navbar from '@/components/navbar';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createSupabaseBrowserClient } from '@repo/supabase/client';
import { iso31661 } from 'iso-3166';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ChevronsUpDown, Check } from 'lucide-react';
import NextLink from 'next/link';

const FormSchema = z.object({
  // General Information
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  age: z
    .string()
    .min(1, 'Age is required')
    .max(3, 'Age must be a valid number'),
  phoneNumber: z.string({
    error: 'Enter a valid phone number (7–15 digits, any format)',
  }),
  email: z.email('Invalid email address'),
  countryOfResidence: z.string({
    error: 'Country of residence is required',
  }),
  // MLH Required Fields
  codeOfConduct: z.boolean().refine((val) => val === true, {
    message: 'Code of Conduct agreement is required',
  }),
  mlhDataHandling: z.boolean().refine((val) => val === true, {
    message: 'MLH Data Handling agreement is required',
  }),
  mlhPromotionalEmails: z.boolean().optional(),
});

const AccountFormSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm password must be at least 8 characters long'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });

export type VolunteerFormValues = z.infer<typeof FormSchema>;
export type AccountFormValues = z.infer<typeof AccountFormSchema>;

const DEFAULT_FORM_VALUES: VolunteerFormValues = {
  firstName: '',
  lastName: '',
  age: '',
  phoneNumber: '',
  email: '',
  countryOfResidence: '',
  codeOfConduct: false,
  mlhDataHandling: false,
  mlhPromotionalEmails: false,
};

const ACCOUNT_FORM_DEFAULTS: AccountFormValues = {
  password: '',
  confirmPassword: '',
};

export default function WalkInRegistration() {
  const form = useForm<VolunteerFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: ACCOUNT_FORM_DEFAULTS,
  });

  const supabase = createSupabaseBrowserClient();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [pendingVolunteer, setPendingVolunteer] = useState<Pick<
    VolunteerFormValues,
    'email' | 'firstName' | 'lastName'
  > | null>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const { isSubmitting } = form.formState;

  const handleMobileMenuToggle = (isOpen: boolean) => {
    setIsMobileMenuOpen(isOpen);
  };

  const [countryQuery, setCountryQuery] = useState('');
  const filteredCountries = useMemo(() => {
    const query = countryQuery.trim().toLowerCase();
    const list = query
      ? iso31661.filter(
          (iso) =>
            iso.name.toLowerCase().includes(query) ||
            iso.alpha3.toLowerCase().includes(query),
        )
      : iso31661;
    return list.slice(0, 100);
  }, [countryQuery]);

  async function onSubmit(data: VolunteerFormValues) {
    const { error } = await supabase.from('walk_ins').insert(data);

    if (error) {
      console.error('Error inserting data:', error);
      toast.error('Failed to submit form. Please try again.');
      return;
    }

    toast.success('Walk In Form submitted! Let’s secure your account.');
    setPendingVolunteer({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    setAccountError(null);
    accountForm.reset(ACCOUNT_FORM_DEFAULTS);
    setIsAccountDialogOpen(true);
    form.reset(DEFAULT_FORM_VALUES);
    setCountryQuery('');
  }

  const handleAccountCreation = accountForm.handleSubmit(
    async ({ password }) => {
      if (!pendingVolunteer) {
        setAccountError(
          'We could not find your walk in details. Please submit the form again.',
        );
        return;
      }

      setIsCreatingAccount(true);
      setAccountError(null);

      try {
        const response = await fetch('/api/volunteer-registration/account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: pendingVolunteer.email,
            password,
            firstName: pendingVolunteer.firstName,
            lastName: pendingVolunteer.lastName,
          }),
        });

        let payload: unknown = null;

        try {
          payload = await response.json();
        } catch (parseError) {
          console.error(
            'Failed to parse account creation response',
            parseError,
          );
        }

        const resolvedError =
          (typeof payload === 'object' && payload && 'error' in payload
            ? (payload as { error?: string }).error
            : undefined) ??
          'Unable to create your account right now. Please try again later.';

        if (!response.ok) {
          setAccountError(resolvedError);
          return;
        }

        if (
          !payload ||
          typeof payload !== 'object' ||
          !('success' in payload) ||
          !payload.success
        ) {
          setAccountError(resolvedError);
          return;
        }

        const status =
          'status' in payload && typeof payload.status === 'string'
            ? payload.status
            : 'created';

        const successMessage =
          status === 'existing-updated'
            ? 'Your account is already set up! We refreshed your walk in access—sign in when you’re ready.'
            : 'Account created! You can now sign in with your email and new password.';

        toast.success(successMessage);
        setIsAccountDialogOpen(false);
        setPendingVolunteer(null);
        accountForm.reset(ACCOUNT_FORM_DEFAULTS);
      } catch (error) {
        console.error('Failed to create volunteer account', error);
        setAccountError(
          'Unexpected error while creating your account. Please try again.',
        );
      } finally {
        setIsCreatingAccount(false);
      }
    },
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-foreground">
      <Navbar onMobileMenuToggle={handleMobileMenuToggle} />
      <MLHBadge isMobileMenuOpen={isMobileMenuOpen} />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pb-20 pt-28 sm:px-8 lg:px-12">
        <header className="flex flex-col items-center text-center">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm uppercase tracking-[0.3em] text-primary">
            Walk In Form
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Go Beyond at HackUTA 2025
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            Tell us a little bit about yourself and confirm the MLH agreements
            to experience an unforgettable weekend of hacking!
          </p>
        </header>

        <Card className="border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-4 border-b border-white/10 pb-8">
            <div className="flex items-center justify-between gap-4 text-left">
              <CardTitle className="text-2xl text-white sm:text-3xl">
                Walk In Registration Form
              </CardTitle>
              <span className="hidden shrink-0 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-200 sm:inline-flex">
                Avg. completion: 3 min
              </span>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              Fields marked with{' '}
              <span className="font-bold text-red-400">*</span> are required.
              We&apos;ll follow up with logistics once applications are
              reviewed.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-10">
            <Form {...form}>
              <form
                className="space-y-12"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          First Name <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your first name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Last Name <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your last name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Age <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            inputMode="numeric"
                            min={0}
                            max={130}
                            placeholder="Enter your age"
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Phone Number <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your phone number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-medium">
                          Email <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your email address"
                            type="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="countryOfResidence"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-medium">
                          Country of Residence{' '}
                          <span className="text-red-400">*</span>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  'h-10 w-full justify-between bg-background/40 text-left font-normal text-white',
                                  !field.value && 'text-muted-foreground',
                                )}
                              >
                                {field.value
                                  ? iso31661.find(
                                      (iso) => iso.alpha3 === field.value,
                                    )?.name
                                  : 'Select country'}
                                <ChevronsUpDown className="ml-2 size-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[320px] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput
                                placeholder="Search countries..."
                                value={countryQuery}
                                onValueChange={setCountryQuery}
                              />
                              <CommandList>
                                <CommandEmpty>No country found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredCountries.map((iso) => (
                                    <CommandItem
                                      value={iso.alpha3}
                                      key={iso.alpha3}
                                      onSelect={(value) => {
                                        form.setValue(
                                          'countryOfResidence',
                                          value,
                                        );
                                        setCountryQuery('');
                                      }}
                                    >
                                      {iso.name}
                                      <Check
                                        className={cn(
                                          'ml-auto size-4',
                                          iso.alpha3 === field.value
                                            ? 'opacity-100'
                                            : 'opacity-0',
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                  {countryQuery &&
                                    iso31661.filter((iso) => {
                                      const query = countryQuery
                                        .trim()
                                        .toLowerCase();
                                      return (
                                        iso.name
                                          .toLowerCase()
                                          .includes(query) ||
                                        iso.alpha3.toLowerCase().includes(query)
                                      );
                                    }).length > filteredCountries.length && (
                                      <CommandItem
                                        value="more-countries"
                                        disabled
                                      >
                                        Refine search to see more results...
                                      </CommandItem>
                                    )}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <section className="space-y-6">
                  <div className="rounded-xl border border-primary/40 bg-primary/10 p-6 text-sm text-primary sm:text-base">
                    <h2 className="text-lg font-semibold text-white sm:text-xl">
                      Why we partner with MLH
                    </h2>
                    <p className="mt-2 text-balance text-sm text-muted-foreground">
                      HackUTA proudly adheres to Major League Hacking&apos;s
                      community standards. Please confirm the agreements below
                      so we can provide a safe, inclusive experience for
                      everyone.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="codeOfConduct"
                    render={({ field }) => (
                      <FormItem className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-semibold text-white">
                              Code of Conduct{' '}
                              <span className="text-red-400">*</span>
                            </FormLabel>
                            <FormDescription className="text-sm text-muted-foreground">
                              I have read and agree to the{' '}
                              <NextLink
                                className="text-primary hover:text-primary/80"
                                href="https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md"
                                target="_blank"
                                rel="noreferrer noopener"
                              >
                                MLH Code of Conduct
                              </NextLink>
                              .
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-label="Agree to the MLH Code of Conduct"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mlhDataHandling"
                    render={({ field }) => (
                      <FormItem className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-semibold text-white">
                              MLH Data Handling{' '}
                              <span className="text-red-400">*</span>
                            </FormLabel>
                            <FormDescription className="text-sm text-muted-foreground">
                              I authorize you to share my registration with
                              Major League Hacking for event and program
                              administration, complying with the{' '}
                              <NextLink
                                className="text-primary hover:text-primary/80"
                                href="https://github.com/MLH/mlh-policies/blob/main/privacy-policy.md"
                                target="_blank"
                                rel="noreferrer noopener"
                              >
                                MLH Privacy Policy
                              </NextLink>
                              . I also agree to the{' '}
                              <NextLink
                                className="text-primary hover:text-primary/80"
                                href="https://github.com/MLH/mlh-policies/blob/main/contest-terms.md"
                                target="_blank"
                                rel="noreferrer noopener"
                              >
                                MLH Contest Terms and Conditions
                              </NextLink>
                              .
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-label="Agree to MLH data handling"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mlhPromotionalEmails"
                    render={({ field }) => (
                      <FormItem className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-semibold text-white">
                              MLH Promotional Emails
                            </FormLabel>
                            <FormDescription className="text-sm text-muted-foreground">
                              I authorize MLH to send me occasional updates
                              about events, career opportunities, and community
                              announcements.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-label="Opt into MLH promotional emails"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Need to make updates? Just let us know!
                  </p>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-lg bg-primary px-6 text-base font-semibold text-black shadow-lg transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {isSubmitting ? 'Submitting…' : 'Submit Form'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Dialog
          open={isAccountDialogOpen}
          onOpenChange={(open) => {
            setIsAccountDialogOpen(open);
            if (!open) {
              setAccountError(null);
              accountForm.reset(ACCOUNT_FORM_DEFAULTS);
              setPendingVolunteer(null);
            }
          }}
        >
          <DialogContent className="border border-white/10 bg-black/85 text-foreground shadow-2xl backdrop-blur-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-white">
                Create your HackUTA account
              </DialogTitle>
              <DialogDescription>
                {pendingVolunteer ? (
                  <>
                    We just saved your account details. Set a password for{' '}
                    <span className="font-medium text-white">
                      {pendingVolunteer.email}
                    </span>{' '}
                    so you can manage your check-ins and updates.
                  </>
                ) : (
                  'Set a password to finish creating your account.'
                )}
              </DialogDescription>
            </DialogHeader>
            <Form {...accountForm}>
              <form className="space-y-6" onSubmit={handleAccountCreation}>
                <FormField
                  control={accountForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-white">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          placeholder="Create a password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={accountForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-white">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          placeholder="Repeat your password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {accountError && (
                  <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                    {accountError}
                  </p>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isCreatingAccount}
                    onClick={() => {
                      setIsAccountDialogOpen(false);
                      toast.info(
                        'You can finish account setup later—just reach out to the HackUTA team when you’re ready.',
                      );
                    }}
                  >
                    Skip for now
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-black hover:bg-primary/90"
                    disabled={isCreatingAccount}
                  >
                    {isCreatingAccount ? 'Creating account…' : 'Create account'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
