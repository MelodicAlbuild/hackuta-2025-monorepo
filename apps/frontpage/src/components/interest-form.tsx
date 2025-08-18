"use client";

///
/// Welcome to this absolutely massive component just for an interest form.
/// If you are reading this, I hope you are a good programmer who can decipher code written by someone half asleep.
/// Best of luck to you, it sucks.
///
/// Recommendation... Don't touch it :)
///

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import schools from "@/data/schools.json";
import levelsOfStudy from "@/data/levels-of-study.json";
import dietaryRestrictions from "@/data/dietary-restrictions.json";
import pronouns from "@/data/pronouns.json";
import raceEthnicity from "@/data/race-ethnicity.json";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

import { iso31661 } from "iso-3166";

import { createSupabaseBrowserClient } from "@repo/supabase/client";
import Link from "next/link";
import { useRef } from "react";

const FormSchema = z.object({
  // General Information
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  age: z
    .string()
    .min(1, "Age is required")
    .max(3, "Age must be a valid number"),
  phoneNumber: z
    .string()
    .regex(/^\d{11}$/, "Phone number must be 10 digits plus country code"),
  email: z.string().email("Invalid email address"),
  school: z.string().optional(),
  levelOfStudy: z.string({ error: "Level of study is required" }),
  countryOfResidence: z.string({
    error: "Country of residence is required",
  }),
  linkedInUrl: z.string().url("Invalid LinkedIn URL").optional(),
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
  codeOfConduct: z.boolean(),
  mlhDataHandling: z.boolean(),
  mlhPromotionalEmails: z.boolean().optional(),
});

function removeDuplicates<T>(arr: T[]): T[] {
  return arr.filter((item, index) => arr.indexOf(item) === index);
}

export default function InterestForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  const closeLevelOneRef = useRef<HTMLButtonElement>(null);
  const closeLevelTwoRef = useRef<HTMLButtonElement>(null);

  const supabase = createSupabaseBrowserClient();

  // Remove duplicates from schools
  const uniqueSchools = removeDuplicates(schools);

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (data.school === undefined) {
      data.school = "Other";
    }

    supabase
      .from("interest-form")
      .insert(data)
      .then(({ error }) => {
        if (error) {
          console.error("Error inserting data:", error);
          toast.error("Failed to submit form. Please try again.");
        } else {
          toast.success("Form submitted successfully!");
          form.reset();
        }
      });
  }
  return (
    <Dialog>
      <DialogTrigger
        className="font-franklinGothic relative px-8 py-3 text-lg sm:text-2xl font-semibold text-white rounded-full transition duration-300
              bg-gradient-to-r from-purple-600 to-red-500 hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl w-[90%] max-w-[300px] text-center"
      >
        REGISTER NOW
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
                    <FormLabel>First Name</FormLabel>
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
                    <FormLabel>Last Name</FormLabel>
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
                    <FormLabel>Age</FormLabel>
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="input"
                        placeholder="Enter your phone number (10 digits + Country Code)"
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
                  <FormItem>
                    <FormLabel>Email</FormLabel>
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
                    <FormLabel>School</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-[200px] justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? uniqueSchools.find(
                                  (school) => school === field.value
                                )
                              : "Select school"}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search schools..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No school found.</CommandEmpty>
                            <CommandGroup>
                              {uniqueSchools.map((school) => (
                                <CommandItem
                                  value={school}
                                  key={school}
                                  onSelect={() => {
                                    form.setValue("school", school);
                                  }}
                                >
                                  {school}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      school === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
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
                    <FormLabel>Level of Study</FormLabel>
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
                    <FormLabel>Country of Residence</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-[200px] justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? iso31661.find(
                                  (iso) => iso.alpha3 === field.value
                                )?.name
                              : "Select country"}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search schools..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {iso31661.map((iso) => (
                                <CommandItem
                                  value={iso.alpha3}
                                  key={iso.alpha3}
                                  onSelect={() => {
                                    form.setValue(
                                      "countryOfResidence",
                                      iso.alpha3
                                    );
                                  }}
                                >
                                  {iso.name}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      iso.alpha3 === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
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

            <Dialog>
              <DialogTrigger className="border rounded-lg py-1 px-2 text-center bg-zinc-700 text-white hover:bg-zinc-900 transition-colors">
                Next
              </DialogTrigger>
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
                        defaultValue={"None"}
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
                          <SelectItem key={"yes"} value={"Yes"}>
                            Yes
                          </SelectItem>
                          <SelectItem key={"no"} value={"No"}>
                            No
                          </SelectItem>
                          <SelectItem key={"unsure"} value={"Unsure"}>
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
                          <SelectItem key={"man"} value={"Man"}>
                            Man
                          </SelectItem>
                          <SelectItem key={"woman"} value={"Woman"}>
                            Woman
                          </SelectItem>
                          <SelectItem key={"nonbinary"} value={"Non-Binary"}>
                            Non-Binary
                          </SelectItem>
                          <SelectItem
                            key={"pretsd"}
                            value={"Prefer to self-describe"}
                          >
                            Prefer to self-describe
                          </SelectItem>
                          <SelectItem
                            key={"pnta"}
                            value={"Prefer Not to Answer"}
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
                          {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
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

                <Dialog>
                  <DialogTrigger className="border rounded-lg py-1 px-2 text-center bg-zinc-700 text-white hover:bg-zinc-900 transition-colors">
                    Next
                  </DialogTrigger>
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
                            <FormLabel>Code of Conduct</FormLabel>
                            <FormDescription>
                              I have read and agree to the{" "}
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
                            <FormLabel>MLH Data Handling</FormLabel>
                            <FormDescription>
                              I authorize you to share my
                              application/registration information with Major
                              League Hacking for event administration, ranking,
                              and MLH administration in-line with the{" "}
                              <Link
                                className="text-blue-500 hover:underline"
                                href="https://github.com/MLH/mlh-policies/blob/main/privacy-policy.md"
                                target="_blank"
                              >
                                MLH Privacy Policy
                              </Link>
                              . I further agree to the terms of both the{" "}
                              <Link
                                className="text-blue-500 hover:underline"
                                href="https://github.com/MLH/mlh-policies/blob/main/contest-terms.md"
                                target="_blank"
                              >
                                MLH Contest Terms and Conditions
                              </Link>{" "}
                              and the{" "}
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
                    <DialogClose asChild>
                      <Button
                        type="button"
                        onClick={() => {
                          closeLevelTwoRef.current!.click();
                        }}
                      >
                        Submit
                      </Button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>
                <DialogClose asChild>
                  <Button
                    type="button"
                    ref={closeLevelTwoRef}
                    className="hidden"
                    onClick={() => {
                      closeLevelOneRef.current!.click();
                    }}
                  >
                    Submit
                  </Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          </form>
        </Form>
        <DialogClose asChild>
          <Button
            ref={closeLevelOneRef}
            type="button"
            className="hidden"
            onClick={() => {
              form.handleSubmit(onSubmit)();
            }}
          />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
