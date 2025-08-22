import { createSupabaseServerClient } from "@repo/supabase/server";
import { RegistrationsTable } from "@/components/registrations-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cookies } from "next/headers";

export default async function RegistrationsPage() {
  const supabase = await createSupabaseServerClient(cookies);

  const { data: registrations, error } = await supabase
    .from("interest-form")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p>
        Could not load registrations. <br />
        {error.message}
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applicants</CardTitle>
        <CardDescription>
          A list of all users who have submitted an interest form.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-y-auto h-md">
          <RegistrationsTable registrations={registrations || []} />
        </div>
      </CardContent>
    </Card>
  );
}
