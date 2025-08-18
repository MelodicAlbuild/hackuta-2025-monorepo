import { createClient } from "@/utils/supabase/server";
import { RegistrationsTable } from "@/components/registrations-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function RegistrationsPage() {
  const supabase = await createClient();

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
