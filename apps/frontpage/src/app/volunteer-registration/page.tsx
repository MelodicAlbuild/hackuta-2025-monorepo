'use client';

import MLHBadge from '@/components/mlh-badge';
import Navbar from '@/components/navbar';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
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

export default function VolunteerRegistration() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      age: '',
      phoneNumber: '',
      email: '',
      countryOfResidence: '',
      codeOfConduct: false,
      mlhDataHandling: false,
      mlhPromotionalEmails: false,
    },
  });

  const supabase = createSupabaseBrowserClient();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const { error } = await supabase.from('volunteer_signups').insert(data);

    if (error) {
      console.error('Error inserting data:', error);
      toast.error('Failed to submit form. Please try again.');
      return;
    }

    toast.success('Form submitted successfully!');
    form.reset();
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-foreground">
      <Navbar onMobileMenuToggle={handleMobileMenuToggle} />
      <MLHBadge isMobileMenuOpen={isMobileMenuOpen} />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pb-20 pt-28 sm:px-8 lg:px-12">
        <header className="flex flex-col items-center text-center">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm uppercase tracking-[0.3em] text-primary">
            Volunteer Ops
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Be the force behind HackUTA 2025
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            Tell us a little bit about yourself and confirm the MLH agreements
            to help the team deliver an unforgettable weekend.
          </p>
        </header>

        <Card className="border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-4 border-b border-white/10 pb-8">
            <div className="flex items-center justify-between gap-4 text-left">
              <CardTitle className="text-2xl text-white sm:text-3xl">
                Volunteer Registration Form
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
                    className="h-11 w-full rounded-lg bg-primary px-6 text-base font-semibold text-black shadow-lg transition hover:bg-primary/90 sm:w-auto"
                  >
                    Submit Form
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
