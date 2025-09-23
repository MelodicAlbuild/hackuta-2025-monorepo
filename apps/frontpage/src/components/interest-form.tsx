'use client';

///
/// Welcome to this absolutely massive component just for an interest form.
/// If you are reading this, I hope you are a good programmer who can decipher code written by someone half asleep.
/// Best of luck to you, it sucks.
///
/// Recommendation... Don't touch it :)
///

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import schools from '@/data/schools.json';
import levelsOfStudy from '@/data/levels-of-study.json';
import dietaryRestrictions from '@/data/dietary-restrictions.json';
import pronouns from '@/data/pronouns.json';
import raceEthnicity from '@/data/race-ethnicity.json';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

import { iso31661 } from 'iso-3166';

import { createSupabaseBrowserClient } from '@repo/supabase/client';
import Link from 'next/link';
import { useMemo, useState } from 'react';

// Minimal country calling codes with US first
type CountryCodeOption = { id: string; label: string; dial: string };
const COUNTRY_CODES: CountryCodeOption[] = [
  { id: 'US', label: 'US (+1)', dial: '+1' },
  { id: 'CA', label: 'CA (+1)', dial: '+1' },
  { id: 'UK', label: 'UK (+44)', dial: '+44' },
  { id: 'IN', label: 'IN (+91)', dial: '+91' },
  { id: 'DE', label: 'DE (+49)', dial: '+49' },
  { id: 'AU', label: 'AU (+61)', dial: '+61' },
  { id: 'custom', label: 'Custom code…', dial: 'custom' },
];

const FormSchema = z.object({
  // General Information
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  age: z
    .string()
    .min(1, 'Age is required')
    .max(3, 'Age must be a valid number'),
  phoneNumber: z.string().refine(
    (value) => {
      const digitsOnly = value.replace(/\D/g, '');
      return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    },
    { message: 'Enter a valid phone number (7–15 digits, any format)' },
  ),
  email: z.string().email('Invalid email address'),
  school: z.string().min(1, 'School is required'),
  levelOfStudy: z.string({ error: 'Level of study is required' }),
  countryOfResidence: z.string({
    error: 'Country of residence is required',
  }),
  linkedInUrl: z.string().url('Invalid LinkedIn URL').optional(),
  // Optional Demographic Information
  dietaryRestrictions: z.string().optional(),
  underRepresentedGroup: z.string().optional(),
  genderIdentity: z.string().optional(),
  pronouns: z.string().optional(),
  raceOrEthnicity: z.string().optional(),
  lgbtqiaPlus: z.boolean().optional(),
  completedEducation: z.string().optional(),
  tShirtSize: z.string().optional(),
  shippingAddress: z.string().optional(),
  majorFieldOfStudy: z.string().optional(),
  // MLH Required Fields
  codeOfConduct: z.boolean().refine((val) => val === true, {
    message: 'Code of Conduct agreement is required',
  }),
  mlhDataHandling: z.boolean().refine((val) => val === true, {
    message: 'MLH Data Handling agreement is required',
  }),
  mlhPromotionalEmails: z.boolean().optional(),
});

function removeDuplicates<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export default function InterestForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const supabase = createSupabaseBrowserClient();

  // Remove duplicates from schools (fast) and memoize
  const uniqueSchools = useMemo(() => removeDuplicates(schools), []);

  // Typeahead state for large lists
  const [schoolQuery, setSchoolQuery] = useState('');
  const filteredSchools = useMemo(() => {
    const query = schoolQuery.trim().toLowerCase();
    const list = query
      ? uniqueSchools.filter((s) => s.toLowerCase().includes(query))
      : uniqueSchools;
    return list.slice(0, 50);
  }, [schoolQuery, uniqueSchools]);

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

  // Phone input UX state
  const [phoneCcKey, setPhoneCcKey] = useState<string>('US');
  const [phoneCc, setPhoneCc] = useState<string>('+1');
  const [customCc, setCustomCc] = useState<string>('+');
  const [phoneP1, setPhoneP1] = useState<string>('');
  const [phoneP2, setPhoneP2] = useState<string>('');
  const [phoneP3, setPhoneP3] = useState<string>('');
  const [phoneIntl, setPhoneIntl] = useState<string>('');

  // Dialog state control
  const [isDemographicsOpen, setIsDemographicsOpen] = useState(false);
  const [isDisclaimersOpen, setIsDisclaimersOpen] = useState(false);

  function composeAndSetPhone() {
    const ccRaw = phoneCc === 'custom' ? customCc : phoneCc;
    const ccDigits = ccRaw.replace(/\D/g, '');
    const local =
      phoneCc === '+1' ? `${phoneP1}${phoneP2}${phoneP3}` : phoneIntl;
    const digitsOnly = `${ccDigits}${local.replace(/\D/g, '')}`;
    form.setValue('phoneNumber', digitsOnly, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    // Sanitize phone number to digits only before storing
    data.phoneNumber = data.phoneNumber.replace(/\D/g, '');

    supabase
      .from('interest-form')
      .insert(data)
      .then(({ error }) => {
        if (error) {
          console.error('Error inserting data:', error);
          toast.error('Failed to submit form. Please try again.');
        } else {
          toast.success('Form submitted successfully!');
          form.reset();
          setPhoneCcKey('US');
          setPhoneCc('+1');
          setPhoneP1('');
          setPhoneP2('');
          setPhoneP3('');
          setPhoneIntl('');
          setCustomCc('+');
          // Reset dialog states
          setIsDemographicsOpen(false);
          setIsDisclaimersOpen(false);
        }
      });
  }
  return (
    <Dialog>
      <DialogTrigger className="cursor-target font-franklinGothic relative px-10 py-4 text-lg font-semibold text-white rounded-2xl transition-all duration-300 hover:scale-105 text-center min-w-[220px] bg-gradient-to-r from-red-900/20 to-blue-900/20 backdrop-blur-sm border border-red-500/30 hover:border-red-500/50 faq-glow shadow-[0_0_18px_rgba(239,68,68,0.4),0_0_28px_rgba(239,68,68,0.24)] hover:shadow-[0_0_24px_rgba(239,68,68,0.5),0_0_36px_rgba(239,68,68,0.32)]">
        <span className="relative z-10">REGISTER NOW</span>
      </DialogTrigger>
      <DialogContent className="max-h-[75%] overflow-y-scroll">
        <Form {...form}>
          <form className="space-y-6 z-0">
            <DialogHeader>
              <DialogTitle>HackUTA Interest Form</DialogTitle>
              <DialogDescription>
                Please fill out the form below to express your interest in
                participating in HackUTA. Your information will help us keep you
                updated about the event and its details.
              </DialogDescription>
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      First Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="input"
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
                    <FormLabel>
                      Last Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="input"
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
                    <FormLabel>
                      Age <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="input"
                        placeholder="Enter your age"
                        type="number"
                        min={0}
                        max={100}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      Phone Number <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="flex items-center gap-2">
                      <Select
                        value={phoneCcKey}
                        onValueChange={(val) => {
                          setPhoneCcKey(val);
                          const selected = COUNTRY_CODES.find(
                            (c) => c.id === val,
                          );
                          setPhoneCc(selected?.dial ?? '+1');
                          // Reset local parts when switching CC
                          setPhoneP1('');
                          setPhoneP2('');
                          setPhoneP3('');
                          setPhoneIntl('');
                          if ((selected?.dial ?? '') !== 'custom') {
                            setCustomCc('+');
                          }
                          composeAndSetPhone();
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Country code" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRY_CODES.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {phoneCc === '+1' ? (
                        <div className="flex items-center gap-2">
                          <Input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={3}
                            placeholder="123"
                            className="w-[70px] text-center"
                            value={phoneP1}
                            onChange={(e) => {
                              const val = e.target.value
                                .replace(/\D/g, '')
                                .slice(0, 3);
                              setPhoneP1(val);
                              if (val.length === 3)
                                (
                                  e.target as HTMLInputElement
                                ).nextElementSibling
                                  ?.querySelector('input')
                                  ?.focus?.();
                              composeAndSetPhone();
                            }}
                          />
                          <span className="text-gray-400">-</span>
                          <Input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={3}
                            placeholder="456"
                            className="w-[70px] text-center"
                            value={phoneP2}
                            onChange={(e) => {
                              const val = e.target.value
                                .replace(/\D/g, '')
                                .slice(0, 3);
                              setPhoneP2(val);
                              composeAndSetPhone();
                            }}
                          />
                          <span className="text-gray-400">-</span>
                          <Input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            placeholder="7890"
                            className="w-[84px] text-center"
                            value={phoneP3}
                            onChange={(e) => {
                              const val = e.target.value
                                .replace(/\D/g, '')
                                .slice(0, 4);
                              setPhoneP3(val);
                              composeAndSetPhone();
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {phoneCc === 'custom' && (
                            <Input
                              inputMode="tel"
                              maxLength={5}
                              placeholder="+CC"
                              className="w-[70px] text-center"
                              value={customCc}
                              onChange={(e) => {
                                // Keep a leading + and up to 3-4 digits
                                const raw = e.target.value.replace(
                                  /[^+\d]/g,
                                  '',
                                );
                                const hasPlus = raw.startsWith('+') ? '+' : '+';
                                const digits = raw
                                  .replace(/\D/g, '')
                                  .slice(0, 4);
                                const next = `${hasPlus}${digits}`;
                                setCustomCc(next);
                                composeAndSetPhone();
                              }}
                            />
                          )}
                          <Input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={15}
                            placeholder="Local number"
                            className="w-[220px]"
                            value={phoneIntl}
                            onChange={(e) => {
                              const val = e.target.value
                                .replace(/\D/g, '')
                                .slice(0, 15);
                              setPhoneIntl(val);
                              composeAndSetPhone();
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="input"
                        placeholder="Enter your email address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      School <span className="text-red-500">*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-[200px] justify-between',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value
                              ? uniqueSchools.find(
                                  (school) => school === field.value,
                                )
                              : 'Select school'}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[260px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search schools..."
                            value={schoolQuery}
                            onValueChange={setSchoolQuery}
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No school found.</CommandEmpty>
                            <CommandGroup>
                              {filteredSchools.map((school) => (
                                <CommandItem
                                  value={school}
                                  key={school}
                                  onSelect={() => {
                                    form.setValue('school', school);
                                  }}
                                >
                                  {school}
                                  <Check
                                    className={cn(
                                      'ml-auto',
                                      school === field.value
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                </CommandItem>
                              ))}
                              {schoolQuery &&
                                uniqueSchools.filter((s) =>
                                  s
                                    .toLowerCase()
                                    .includes(schoolQuery.trim().toLowerCase()),
                                ).length > filteredSchools.length && (
                                  <CommandItem value="more" disabled>
                                    Refine search to see more results...
                                  </CommandItem>
                                )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {/* <FormDescription>
                This is the language that will be used in the dashboard.
              </FormDescription> */}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="levelOfStudy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Level of Study <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your level of study." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {levelsOfStudy.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="countryOfResidence"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Country of Residence{' '}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-[200px] justify-between',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value
                              ? iso31661.find(
                                  (iso) => iso.alpha3 === field.value,
                                )?.name
                              : 'Select country'}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[260px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search countries..."
                            value={countryQuery}
                            onValueChange={setCountryQuery}
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {filteredCountries.map((iso) => (
                                <CommandItem
                                  value={iso.alpha3}
                                  key={iso.alpha3}
                                  onSelect={() => {
                                    form.setValue(
                                      'countryOfResidence',
                                      iso.alpha3,
                                    );
                                  }}
                                >
                                  {iso.name}
                                  <Check
                                    className={cn(
                                      'ml-auto',
                                      iso.alpha3 === field.value
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                </CommandItem>
                              ))}
                              {countryQuery &&
                                iso31661.filter(
                                  (iso) =>
                                    iso.name
                                      .toLowerCase()
                                      .includes(
                                        countryQuery.trim().toLowerCase(),
                                      ) ||
                                    iso.alpha3
                                      .toLowerCase()
                                      .includes(
                                        countryQuery.trim().toLowerCase(),
                                      ),
                                ).length > filteredCountries.length && (
                                  <CommandItem value="more-countries" disabled>
                                    Refine search to see more results...
                                  </CommandItem>
                                )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {/* <FormDescription>
                This is the language that will be used in the dashboard.
              </FormDescription> */}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedInUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="input"
                        placeholder="Enter your linkedin URL"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogHeader>

            <Button
              type="button"
              onClick={async () => {
                // Validate required fields for first page
                const requiredFields = [
                  'firstName',
                  'lastName',
                  'age',
                  'phoneNumber',
                  'email',
                  'school',
                  'levelOfStudy',
                  'countryOfResidence',
                ] as const;
                const isValid = await form.trigger(requiredFields);

                if (!isValid) {
                  toast.error(
                    'Please fill in all required fields (marked with *) before proceeding.',
                  );
                  return;
                }

                // Only open dialog if validation passes
                setIsDemographicsOpen(true);
              }}
              className="border rounded-lg py-1 px-2 text-center bg-zinc-700 text-white hover:bg-zinc-900 transition-colors"
            >
              Next
            </Button>

            <Dialog
              open={isDemographicsOpen}
              onOpenChange={setIsDemographicsOpen}
            >
              <DialogContent className="max-h-[75%] overflow-y-scroll">
                <DialogHeader>
                  <DialogTitle>Optional Demographic Information</DialogTitle>
                  <DialogDescription>
                    HackUTA Strives to create an inclusive and diverse
                    environment. Providing this information is optional and will
                    help us understand the demographics of our participants. All
                    information will be kept confidential and used only for
                    statistical purposes.
                  </DialogDescription>
                </DialogHeader>

                <FormField
                  control={form.control}
                  name="dietaryRestrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dietary Restrictions</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={'None'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your dietary restriction." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dietaryRestrictions.map((rest) => (
                            <SelectItem key={rest} value={rest}>
                              {rest}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="underRepresentedGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Under Representation</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Y/N/U" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key={'yes'} value={'Yes'}>
                            Yes
                          </SelectItem>
                          <SelectItem key={'no'} value={'No'}>
                            No
                          </SelectItem>
                          <SelectItem key={'unsure'} value={'Unsure'}>
                            Unsure
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="genderIdentity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender Identity</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="M/F/NB/O" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key={'man'} value={'Man'}>
                            Man
                          </SelectItem>
                          <SelectItem key={'woman'} value={'Woman'}>
                            Woman
                          </SelectItem>
                          <SelectItem key={'nonbinary'} value={'Non-Binary'}>
                            Non-Binary
                          </SelectItem>
                          <SelectItem
                            key={'pretsd'}
                            value={'Prefer to self-describe'}
                          >
                            Prefer to self-describe
                          </SelectItem>
                          <SelectItem
                            key={'pnta'}
                            value={'Prefer Not to Answer'}
                          >
                            Prefer Not to Answer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pronouns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pronouns</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Please Select your Pronouns" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pronouns.map((pronoun) => (
                            <SelectItem key={pronoun} value={pronoun}>
                              {pronoun}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="raceOrEthnicity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Race or Ethnicity</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Please Select your Race or Ethnicity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {raceEthnicity.map((re) => (
                            <SelectItem key={re} value={re}>
                              {re}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lgbtqiaPlus"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>LGBTQIA+ Identification</FormLabel>
                        <FormDescription>
                          Do you identify as a member of the LGBTQIA+ community?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          defaultChecked={false}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="completedEducation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Highest Completed Education</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Please Select your Education" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {levelsOfStudy.map((re) => (
                            <SelectItem key={re} value={re}>
                              {re}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tShirtSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>T-Shirt Size</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Please Select your T-Shirt Size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="input"
                          placeholder="Enter your shipping address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="majorFieldOfStudy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Major Field of Study</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="input"
                          placeholder="Enter your major field of study"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  onClick={() => {
                    // All fields on second page are optional, so no validation needed
                    // Just proceed to next page
                    setIsDisclaimersOpen(true);
                  }}
                  className="border rounded-lg py-1 px-2 text-center bg-zinc-700 text-white hover:bg-zinc-900 transition-colors"
                >
                  Next
                </Button>

                <Dialog
                  open={isDisclaimersOpen}
                  onOpenChange={setIsDisclaimersOpen}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Disclaimers</DialogTitle>
                      <DialogDescription>
                        HackUTA is partnered with Major League Hacking (MLH) and
                        adheres to their Code of Conduct. Please review the
                        information below before submitting your interest form.
                      </DialogDescription>
                    </DialogHeader>
                    <FormField
                      control={form.control}
                      name="codeOfConduct"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>
                              Code of Conduct{' '}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormDescription>
                              I have read and agree to the{' '}
                              <Link
                                className="text-blue-500 hover:underline"
                                href="https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md"
                                target="_blank"
                              >
                                MLH Code of Conduct
                              </Link>
                              .
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mlhDataHandling"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>
                              MLH Data Handling{' '}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormDescription>
                              I authorize you to share my
                              application/registration information with Major
                              League Hacking for event administration, ranking,
                              and MLH administration in-line with the{' '}
                              <Link
                                className="text-blue-500 hover:underline"
                                href="https://github.com/MLH/mlh-policies/blob/main/privacy-policy.md"
                                target="_blank"
                              >
                                MLH Privacy Policy
                              </Link>
                              . I further agree to the terms of both the{' '}
                              <Link
                                className="text-blue-500 hover:underline"
                                href="https://github.com/MLH/mlh-policies/blob/main/contest-terms.md"
                                target="_blank"
                              >
                                MLH Contest Terms and Conditions
                              </Link>{' '}
                              and the{' '}
                              <Link
                                className="text-blue-500 hover:underline"
                                href="https://github.com/MLH/mlh-policies/blob/main/privacy-policy.md"
                                target="_blank"
                              >
                                MLH Privacy Policy
                              </Link>
                              .
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mlhPromotionalEmails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>MLH Promotional Emails</FormLabel>
                            <FormDescription>
                              I authorize MLH to send me occasional emails about
                              relevant events, career opportunities, and
                              community announcements.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      onClick={async () => {
                        // Validate required disclaimer fields
                        const disclaimerFields = [
                          'codeOfConduct',
                          'mlhDataHandling',
                        ] as const;
                        const isValid = await form.trigger(disclaimerFields);

                        const values = form.getValues();

                        if (
                          !isValid ||
                          !values.codeOfConduct ||
                          !values.mlhDataHandling
                        ) {
                          toast.error(
                            'Please agree to the required disclaimers (marked with *) to proceed.',
                          );
                          return;
                        } else {
                          // Close all dialogs and submit the form
                          setIsDisclaimersOpen(false);
                          setIsDemographicsOpen(false);

                          // Submit the form
                          const finalFormData = form.getValues();
                          onSubmit(finalFormData);
                        }
                      }}
                    >
                      Submit
                    </Button>
                  </DialogContent>
                </Dialog>
              </DialogContent>
            </Dialog>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
