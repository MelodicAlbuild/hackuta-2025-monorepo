import { createSupabaseServerClient } from '@repo/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import QRCode from 'qrcode'

export async function GET() {
    const supabase = await createSupabaseServerClient(cookies)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new Response('Unauthorized', { status: 401 })
    }

    const { data: identity, error } = await supabase
        .from('qr_identities')
        .select('qr_token, sign_up_token')
        .eq('user_id', user.id)
        .single()

    if (error || !identity) {
        return new Response('QR token not found', { status: 404 })
    }

    const tokenValue = identity.sign_up_token ?? identity.qr_token
    if (!tokenValue) {
        return new Response('QR token not configured', { status: 404 })
    }

    // Generate the QR code image from the token
    const qrCodeImageBuffer = await QRCode.toBuffer(tokenValue, {
        type: 'png',
        width: 300,
        margin: 2,
    })

    return new NextResponse(new Blob([Buffer.from(qrCodeImageBuffer)]), {
        headers: { 'Content-Type': 'image/png' },
    })
}