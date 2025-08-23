"use client";

import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createVendorCode } from "../actions";

// The component receives the initial data fetched by the server
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VendorCodeManager({ initialCodes }: { initialCodes: any[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    error: boolean;
  } | null>(null);

  const handleAction = async (formData: FormData) => {
    try {
      const result = await createVendorCode(formData);
      if (result.success) {
        setFeedback({ message: "Code created successfully!", error: false });
        formRef.current?.reset(); // Reset the form on success
      }
    } catch (e) {
      setFeedback({
        message: e instanceof Error ? e.message : "An error occurred",
        error: true,
      });
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Existing Vendor Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialCodes?.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>{code.name}</TableCell>
                    <TableCell>{code.points_value}</TableCell>
                    <TableCell>{code.scan_limit_per_user}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline">
                        <Link
                          href={`/api/vendor-qr/${code.code}`}
                          download={`${code.name}.png`}
                        >
                          Download QR
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Create New Code</CardTitle>
            <CardDescription>
              Generate a new QR code for users to scan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} action={handleAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Sponsor Booth A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Points Value</Label>
                <Input
                  id="points"
                  name="points"
                  type="number"
                  defaultValue="10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit">Scan Limit Per User</Label>
                <Input
                  id="limit"
                  name="limit"
                  type="number"
                  defaultValue="1"
                  required
                />
              </div>
              <Button type="submit">Create Code</Button>
              {feedback && (
                <p
                  className={`text-sm ${feedback.error ? "text-red-500" : "text-green-500"}`}
                >
                  {feedback.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
