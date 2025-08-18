"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { inviteUser } from "./actions";
import { Icons } from "@/components/icons";

// The type definition remains the same
type Registration = {
  id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

// Helper function to format camelCase keys into readable labels
function formatLabel(key: string) {
  const result = key.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// Helper component to display each piece of information
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DetailItem({ label, value }: { label: string; value: any }) {
  let displayValue: React.ReactNode = value;

  if (typeof value === "boolean") {
    displayValue = (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  } else if (value === null || value === "") {
    displayValue = <span className="text-gray-400">N/A</span>;
  } else if (value === undefined) {
    if (label.toLowerCase().includes("mlh")) {
      displayValue = (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${"bg-red-100 text-red-800"}`}
        >
          No
        </span>
      );
    } else {
      displayValue = <span className="text-gray-400">N/A</span>;
    }
  }

  return (
    <div className="flex flex-col py-2 border-b border-gray-100">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 break-words">{displayValue}</dd>
    </div>
  );
}

export function RegistrationsTable({
  registrations,
}: {
  registrations: Registration[];
}) {
  const [isInviting, setIsInviting] = useState<number | null>(null);

  const handleInvite = async (registration: Registration) => {
    if (!registration.email) {
      alert("This user does not have an email to invite.");
      return;
    }
    setIsInviting(registration.id);
    await inviteUser(registration.email, registration.id);
    setIsInviting(null);
  };

  // Define the order and grouping of fields for the dialog
  const fieldGroups = {
    "Personal Info": [
      "firstName",
      "lastName",
      "age",
      "pronouns",
      "genderIdentity",
      "raceOrEthnicity",
      "lgbtqiaPlus",
      "underrepresented",
    ],
    "Contact & Location": [
      "email",
      "phoneNumber",
      "linkedInUrl",
      "countryOfResidence",
      "shippingAddress",
    ],
    "Academic Info": [
      "school",
      "levelOfStudy",
      "majorFieldOfStudy",
      "completedEducation",
    ],
    "Event Specifics": ["tShirtSize", "dietaryRestrictions"],
    Agreements: ["codeOfConduct", "mlhDataHandling", "mlhPromotion"],
  };

  return (
    <Table>
      {/* TableHeader and TableBody structure remains the same */}
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>School</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registrations.map((reg) => {
          return (
            <Dialog key={reg.id}>
              <TableRow className="cursor-pointer">
                <DialogTrigger asChild>
                  <TableCell className="font-medium">
                    {reg.firstName} {reg.lastName}
                  </TableCell>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <TableCell>{reg.email}</TableCell>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <TableCell>{reg.school}</TableCell>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        reg.status === "invited"
                          ? "bg-blue-100 text-blue-800"
                          : reg.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {reg.status == "" || reg.status == undefined
                        ? "None"
                        : reg.status.charAt(0).toUpperCase() +
                          reg.status.slice(1)}
                    </span>
                  </TableCell>
                </DialogTrigger>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInvite(reg)}
                    // disabled={
                    //   isInviting === reg.id ||
                    //   (reg.status != "pending" && reg.status != undefined)
                    // }
                    disabled={true}
                  >
                    {isInviting === reg.id && (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {reg.status === "pending" || reg.status == undefined
                      ? "Invite"
                      : "Invited"}
                  </Button>
                </TableCell>
              </TableRow>
              {/* --- UPDATED DIALOG CONTENT --- */}
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Applicant Details: {reg.firstName} {reg.lastName}
                  </DialogTitle>
                  <DialogDescription>
                    Full submission from {reg.email}.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                  {Object.entries(fieldGroups).map(([groupTitle, fields]) => (
                    <div key={groupTitle}>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-2">
                        {groupTitle}
                      </h3>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        {fields.map((fieldKey) => (
                          <DetailItem
                            key={fieldKey}
                            label={formatLabel(fieldKey)}
                            value={reg[fieldKey]}
                          />
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </TableBody>
    </Table>
  );
}
