import { createSupabaseServerClient } from "@repo/supabase/server";
import { VendorCodeManager } from "./_components/vendor-code-manager";
import { cookies } from "next/headers";

export default async function VendorCodesPage() {
  const supabase = await createSupabaseServerClient(cookies);
  const { data: codes } = await supabase.from("vendor_codes").select("*");

  return <VendorCodeManager initialCodes={codes || []} />;
}
