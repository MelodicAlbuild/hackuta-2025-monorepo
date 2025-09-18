'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { inviteUser } from '../app/registrations/actions';
import { Icons } from '@/components/icons';
import { createSupabaseBrowserClient } from '@repo/supabase/client';

// The type definition remains the same
type Registration = {
  id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

// Helper function to format camelCase keys into readable labels
function formatLabel(key: string) {
  const result = key.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

async function downloadResume(url: string) {
  const supabase = createSupabaseBrowserClient();
  const article = await supabase.storage
    .from('interest-form-resumes')
    .download(url);

  if (article.error) {
    console.error('Error downloading resume:', article.error);
    return;
  }

  const blobUrl = URL.createObjectURL(article.data!);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = url.split('/')[1] || 'resume.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Helper component to display each piece of information
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DetailItem({ label, value }: { label: string; value: any }) {
  let displayValue: React.ReactNode = value;

  if (label === 'Resume') {
    if (displayValue && displayValue.toString() != '') {
      const updatedValue = displayValue!
        .toString()
        .substring(displayValue!.toString().indexOf('/') + 1);

      displayValue = (
        <a
          onClick={() => downloadResume(updatedValue)}
          className="text-primary hover:text-primary/80 hover:underline"
        >
          Download Resume
        </a>
      );
    } else {
      displayValue = <span className="text-muted-foreground">No Resume Uploaded</span>;
    }

    return (
      <div className="flex flex-col py-2 border-b border-border">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-1 text-sm text-foreground break-words">
          {displayValue}
        </dd>
      </div>
    );
  }

  if (typeof value === 'boolean') {
    displayValue = (
      <span
<<<<<<< Updated upstream
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
=======
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
          value
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
            : "bg-red-500/15 text-red-600 dark:text-red-300"
>>>>>>> Stashed changes
        }`}
      >
        {value ? 'Yes' : 'No'}
      </span>
    );
<<<<<<< Updated upstream
  } else if (value === null || value === '') {
    displayValue = <span className="text-gray-400">N/A</span>;
=======
  } else if (value === null || value === "") {
    displayValue = <span className="text-muted-foreground">N/A</span>;
>>>>>>> Stashed changes
  } else if (value === undefined) {
    if (label.toLowerCase().includes('mlh')) {
      displayValue = (
<<<<<<< Updated upstream
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${'bg-red-100 text-red-800'}`}
        >
=======
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-500/15 text-red-600 dark:text-red-300">
>>>>>>> Stashed changes
          No
        </span>
      );
    } else {
      displayValue = <span className="text-muted-foreground">N/A</span>;
    }
  }

  return (
    <div className="flex flex-col py-2 border-b border-border">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground break-words">{displayValue}</dd>
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
      alert('This user does not have an email to invite.');
      return;
    }
    setIsInviting(registration.id);
    await inviteUser(registration.email, registration.id);
    setIsInviting(null);
  };

  // Define the order and grouping of fields for the dialog
  const fieldGroups = {
    'Personal Info': [
      'firstName',
      'lastName',
      'age',
      'pronouns',
      'genderIdentity',
      'raceOrEthnicity',
      'lgbtqiaPlus',
      'underrepresented',
    ],
    'Contact & Location': [
      'email',
      'phoneNumber',
      'linkedInUrl',
      'countryOfResidence',
      'shippingAddress',
    ],
    'Academic Info': [
      'school',
      'levelOfStudy',
      'majorFieldOfStudy',
      'completedEducation',
      'resume',
    ],
    'Event Specifics': ['tShirtSize', 'dietaryRestrictions'],
    Agreements: ['codeOfConduct', 'mlhDataHandling', 'mlhPromotion'],
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
              <TableRow className="cursor-pointer transition hover:bg-muted/50">
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
<<<<<<< Updated upstream
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        reg.status === 'invited'
                          ? 'bg-blue-100 text-blue-800'
                          : reg.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
=======
                      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        reg.status === "invited"
                          ? "bg-primary/10 text-primary"
                          : reg.status === "confirmed"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
>>>>>>> Stashed changes
                      }`}
                    >
                      {reg.status == '' || reg.status == undefined
                        ? 'None'
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
                    disabled={
                      isInviting === reg.id ||
                      (reg.status != 'pending' && reg.status != undefined)
                    }
                  >
                    {isInviting === reg.id && (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {reg.status === 'pending' || reg.status == undefined
                      ? 'Invite'
                      : 'Invited'}
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
                      <h3 className="text-lg font-semibold text-foreground mb-2 border-b border-border pb-2">
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
