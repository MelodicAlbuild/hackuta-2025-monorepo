import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
          <CardDescription>
            You do not have the necessary permissions to view this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            This admin portal is restricted to users with &apos;admin&apos; or
            &apos;super-admin&apos; roles. Please contact the HackUTA organizers
            if you believe this is an error.
          </p>
          <Button asChild>
            <Link href={process.env.NEXT_PUBLIC_AUTH_APP_URL || "/"}>
              Return to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
