import { NextResponse } from 'next/server';
import { getSitesStatus } from '@/lib/site-health';

export async function GET() {
    const data = await getSitesStatus();
    return NextResponse.json(data);
}
