'use server'
import { createSupabaseServerClient } from '@repo/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function createVendorCode(formData: FormData) {
    const supabase = await createSupabaseServerClient(cookies)
    const { data: { user } } = await supabase.auth.getUser()

    const newCode = {
        name: formData.get('name') as string,
        points_value: Number(formData.get('points')),
        scan_limit_per_user: Number(formData.get('limit')),
        created_by: user!.id,
    };

    const { error } = await supabase.from('vendor_codes').insert(newCode)
    if (error) throw new Error(error.message)

    revalidatePath('/vendor-codes')
    return { success: true }
}