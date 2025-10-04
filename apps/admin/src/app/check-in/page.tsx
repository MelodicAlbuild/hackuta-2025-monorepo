'use client';

import { useCallback, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CheckInUser {
  id: string;
  email: string;
  role: string;
  score: number;
  qr_token: string | null;
  sign_up_token: string | null;
}

interface LookupResponse {
  user?: CheckInUser;
  matches?: LookupMatchOption[];
  error?: string;
}

interface LookupMatchOption {
  email: string;
  firstName: string;
  lastName: string;
}

interface AssignResponse {
  success: boolean;
  user: CheckInUser;
  error?: string;
}

export default function CheckInPage() {
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [lastUserScan, setLastUserScan] = useState('');
  const [attendee, setAttendee] = useState<CheckInUser | null>(null);
  const [matchOptions, setMatchOptions] = useState<LookupMatchOption[] | null>(
    null,
  );
  // Controlled tab value for mobile select + desktop tabs
  const [tabValue, setTabValue] = useState<'camera' | 'email' | 'name'>(
    'camera',
  );

  const [registrationToken, setRegistrationToken] = useState('');
  const [lastTokenScan, setLastTokenScan] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pointsToAward, setPointsToAward] = useState<number>(50);

  const performLookup = useCallback(
    async (payload: { qr_token?: string; email?: string; name?: string }) => {
      if (lookupLoading) return;
      setLookupLoading(true);
      setLookupError(null);
      setAssignError(null);
      setSuccessMessage(null);
      setRegistrationToken('');
      setLastTokenScan('');
      setPointsToAward(50);
      setMatchOptions(null);

      try {
        const response = await fetch('/api/check-in/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data: LookupResponse = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Unable to find attendee.');
        }
        if (data.matches && data.matches.length > 0) {
          setMatchOptions(data.matches);
          setAttendee(null);
          return;
        }
        if (!data.user) {
          throw new Error('No attendee data returned.');
        }
        setAttendee(data.user);
        setMatchOptions(null);
      } catch (error) {
        console.error('Check-in lookup failed', error);
        setAttendee(null);
        setLookupError(
          error instanceof Error
            ? error.message
            : 'Failed to look up attendee.',
        );
        setLastUserScan('');
        setMatchOptions(null);
      } finally {
        setLookupLoading(false);
      }
    },
    [lookupLoading],
  );

  const handleUserScan = useCallback(
    (token: string) => {
      const cleaned = token.trim();
      if (!cleaned) return;
      if (cleaned === lastUserScan) return;
      setLastUserScan(cleaned);
      performLookup({ qr_token: cleaned });
    },
    [lastUserScan, performLookup],
  );

  const handleEmailLookup = useCallback(() => {
    if (!emailInput.trim()) {
      setLookupError('Enter an email to search.');
      return;
    }
    performLookup({ email: emailInput.trim().toLowerCase() });
  }, [emailInput, performLookup]);

  const handleNameLookup = useCallback(() => {
    if (!nameInput.trim()) {
      setLookupError('Enter a name to search.');
      return;
    }
    performLookup({ name: nameInput.trim() });
  }, [nameInput, performLookup]);

  const handleMatchSelect = useCallback(
    (email: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) return;
      performLookup({ email: normalizedEmail });
    },
    [performLookup],
  );

  const handleRegistrationScan = useCallback(
    (token: string) => {
      const cleaned = token.trim();
      if (!cleaned || !attendee) return;
      if (cleaned === lastTokenScan) return;
      setLastTokenScan(cleaned);
      setRegistrationToken(cleaned);
      setAssignError(null);
      setSuccessMessage(null);
    },
    [attendee, lastTokenScan],
  );

  const handleReset = useCallback((options?: { preserveSuccess?: boolean }) => {
    setLookupError(null);
    setAssignError(null);
    if (!options?.preserveSuccess) {
      setSuccessMessage(null);
    }
    setAttendee(null);
    setEmailInput('');
    setNameInput('');
    setRegistrationToken('');
    setLastTokenScan('');
    setLastUserScan('');
    setPointsToAward(50);
    setMatchOptions(null);
  }, []);

  const handleCompleteCheckIn = useCallback(async () => {
    if (!attendee) {
      setAssignError('Lookup a user before completing check-in.');
      return;
    }
    //const cleanedToken = registrationToken.trim();
    //if (!cleanedToken) {
    //setAssignError('Scan a registration token.');
    //return;
    //}

    setAssignLoading(true);
    setAssignError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/check-in/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: attendee.id,
          //registration_token: cleanedToken,
          points: pointsToAward,
        }),
      });
      const data: AssignResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete check-in.');
      }
      const awardedPointsText = pointsToAward
        ? ` Awarded ${pointsToAward} point${pointsToAward === 1 ? '' : 's'}.`
        : '';
      setSuccessMessage(
        `Check-in complete for ${data.user.email}. ${awardedPointsText}`,
      );
      handleReset({ preserveSuccess: true });
    } catch (error) {
      console.error('Check-in assignment failed', error);
      setAssignError(
        error instanceof Error ? error.message : 'Failed to complete check-in.',
      );
      setLastTokenScan('');
    } finally {
      setAssignLoading(false);
    }
  }, [attendee, handleReset, pointsToAward, registrationToken]);

  return (
    <div className="space-y-8">
      {successMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}
      {!attendee ? (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Find Attendee</CardTitle>
            <CardDescription>
              Scan the attendee&apos;s personal QR code from the portal or
              search by their email or name.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={tabValue}
              onValueChange={(v) => setTabValue(v as typeof tabValue)}
            >
              {/* Mobile: ShadCN Select for better styling */}
              <div className="sm:hidden">
                <label htmlFor="check-in-tab" className="sr-only">
                  Choose check-in method
                </label>
                <Select
                  value={tabValue}
                  onValueChange={(v) => setTabValue(v as typeof tabValue)}
                >
                  <SelectTrigger
                    id="check-in-tab"
                    className="w-full py-6 text-base"
                  >
                    <SelectValue placeholder="Choose check-in method" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="camera">Scan QR Code</SelectItem>
                    <SelectItem value="email">Lookup by Email</SelectItem>
                    <SelectItem value="name">Lookup by Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Desktop: centered, roomy tabs */}
              <TabsList className="hidden sm:flex w-full justify-center gap-2">
                <TabsTrigger
                  value="camera"
                  className="min-w-[160px] py-2 px-4 text-sm md:text-base"
                >
                  Scan QR Code
                </TabsTrigger>
                <TabsTrigger
                  value="email"
                  className="min-w-[160px] py-2 px-4 text-sm md:text-base"
                >
                  Lookup by Email
                </TabsTrigger>
                <TabsTrigger
                  value="name"
                  className="min-w-[160px] py-2 px-4 text-sm md:text-base"
                >
                  Lookup by Name
                </TabsTrigger>
              </TabsList>
              <TabsContent value="camera" className="mt-4">
                <div className="w-full max-w-sm mx-auto p-4 border rounded-lg">
                  <Scanner
                    constraints={{ facingMode: 'environment' }}
                    sound={false}
                    onScan={(detected) => {
                      if (!detected.length) return;
                      const scanned = detected[0]?.rawValue;
                      if (scanned) {
                        handleUserScan(scanned);
                      }
                    }}
                  />
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Point the camera at the attendee&apos;s QR code.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="email" className="mt-4">
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Input
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                    placeholder="attendee@example.com"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleEmailLookup();
                      }
                    }}
                    type="email"
                  />
                  <Button onClick={handleEmailLookup} disabled={lookupLoading}>
                    {lookupLoading ? (
                      <Icons.spinner className="animate-spin" />
                    ) : (
                      'Lookup'
                    )}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="name" className="mt-4">
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Input
                    value={nameInput}
                    onChange={(event) => setNameInput(event.target.value)}
                    placeholder="Attendee Name"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleNameLookup();
                      }
                    }}
                  />
                  <Button onClick={handleNameLookup} disabled={lookupLoading}>
                    {lookupLoading ? (
                      <Icons.spinner className="animate-spin" />
                    ) : (
                      'Lookup'
                    )}
                  </Button>
                </div>
                {matchOptions && matchOptions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">
                      Multiple matches found. Select the correct attendee:
                    </p>
                    <div className="grid gap-2">
                      {matchOptions.map((option) => (
                        <Button
                          key={option.email}
                          variant="outline"
                          className="justify-start text-left font-normal"
                          onClick={() => handleMatchSelect(option.email)}
                          disabled={lookupLoading}
                        >
                          <span className="block text-sm">
                            {option.firstName || option.lastName
                              ? `${option.firstName} ${option.lastName}`.trim()
                              : 'Unnamed Attendee'}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {option.email}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          {lookupError && (
            <CardFooter>
              <p className="text-sm text-destructive">{lookupError}</p>
            </CardFooter>
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Assign Registration Token</CardTitle>
            <CardDescription>
              Scan one of the generated check-in QR codes to register this
              attendee.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Email</p>
                <p className="text-base font-semibold break-words">
                  {attendee.email}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Role</p>
                <p className="text-base font-semibold capitalize">
                  {attendee.role}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Current Points
                </p>
                <p className="text-base font-semibold">{attendee.score}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Existing Sign-Up Token
                </p>
                <p className="text-base font-medium">
                  {attendee.sign_up_token ?? (
                    <span className="text-muted-foreground">None assigned</span>
                  )}
                </p>
              </div>
            </div>
            <div className="w-full max-w-sm mx-auto p-4 border rounded-lg">
              <Scanner
                constraints={{ facingMode: 'environment' }}
                sound={false}
                onScan={(detected) => {
                  if (!detected.length) return;
                  const scanned = detected[0]?.rawValue;
                  if (scanned) {
                    handleRegistrationScan(scanned);
                  }
                }}
              />
              <p className="text-center text-sm text-muted-foreground mt-2">
                Scan an unused registration QR code to assign it to this
                attendee.
              </p>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Selected Token
                </p>
                <p className="text-sm font-medium break-all">
                  {registrationToken || (
                    <span className="text-muted-foreground">None</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium" htmlFor="points-award">
                  Points to award
                </label>
                <Input
                  id="points-award"
                  type="number"
                  className="w-32"
                  value={pointsToAward}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    if (Number.isNaN(nextValue)) {
                      setPointsToAward(0);
                    } else {
                      setPointsToAward(Math.max(0, nextValue));
                    }
                  }}
                  disabled={assignLoading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-muted-foreground sm:text-right">
              Assigning a token will overwrite any existing sign-up token for
              the attendee.
            </div>
            <Button onClick={handleCompleteCheckIn} disabled={assignLoading}>
              {assignLoading ? (
                <Icons.spinner className="animate-spin" />
              ) : (
                'Complete Check-In'
              )}
            </Button>
            <Button variant="ghost" onClick={() => handleReset()}>
              Start Over
            </Button>
          </CardFooter>
          {assignError && (
            <CardFooter>
              <p className="text-sm text-destructive">{assignError}</p>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
