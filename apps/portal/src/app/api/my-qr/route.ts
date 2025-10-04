import { createSupabaseServerClient } from '@repo/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import QRCode from 'qrcode'

export async function GET() {
    const supabase = await createSupabaseServerClient(cookies)
    const { data: { user } } = await supabase.auth.getUser()

    const cookieStore = await cookies();

    if (!user) {
        return new Response('Unauthorized', { status: 401 })
    }

    const localToken = cookieStore.get('qr_token')
    if (localToken) {
        const tokenValue = localToken.value
        // If a local token exists, use it to fetch the QR code
        const qrCodeImageBuffer = await QRCode.toBuffer(tokenValue, {
            type: 'png',
            width: 300,
            margin: 2,
        })
        return new NextResponse(new Blob([Buffer.from(qrCodeImageBuffer)]), {
            headers: { 'Content-Type': 'image/png' },
        })
    }

    const { data: identity, error } = await supabase
        .from('qr_identities')
        .select('qr_token')
        .eq('user_id', user.id)
        .single()

    if (error || !identity) {
        return new Response('QR token not found', { status: 404 })
    }

    const tokenValue = identity.qr_token
    if (!tokenValue) {
        return new Response('QR token not configured', { status: 404 })
    }

    cookieStore.set('qr_token', tokenValue)

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