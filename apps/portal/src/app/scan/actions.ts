'use server'
import { createSupabaseServerClient } from '@repo/supabase/server'
import { cookies } from 'next/headers'

export async function redeemVendorCode(code: string) {
    const supabase = await createSupabaseServerClient(cookies)

    // Call our secure database function that handles all validation and point logic
    const { data, error } = await supabase.rpc('redeem_vendor_code', {
        scanned_code: code,
    })

    if (error) {
        // The error message from the database function (e.g., "Already redeemed") will be passed here
        throw new Error(error.message)
    }

    return data
}