import { createSupabaseAdminClient } from "@repo/supabase/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const flag = searchParams.get("flag");
    const supabaseAdmin = createSupabaseAdminClient();

    const { data: flagData } = await supabaseAdmin
        .from('feature_flags')
        .select('value')
        .eq('name', flag)
        .single();

    return new Response(JSON.stringify(flagData?.value), {
        headers: { "Content-Type": "application/json" },
    });
}