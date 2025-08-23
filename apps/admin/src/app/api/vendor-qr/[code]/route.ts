import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const code = (await params).code
    if (!code) return new Response('Code is required', { status: 400 })

    const qrCodeImageBuffer = await QRCode.toBuffer(code, {
        width: 400,
        errorCorrectionLevel: 'H',
    });

    return new NextResponse(new Blob([Buffer.from(qrCodeImageBuffer)]), {
        headers: { 'Content-Type': 'image/png' },
    });
}