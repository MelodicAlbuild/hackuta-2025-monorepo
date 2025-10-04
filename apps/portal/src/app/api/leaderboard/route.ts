import { createSupabaseAdminClient } from '@repo/supabase/server'
import { NextResponse } from 'next/server'

type PointsWithProfile = {
    user_id: string
    score: number
    profiles: {
        email: string
    } | {
        email: string
    }[]
}

type InterestFormData = {
    firstName: string
    lastName: string
}

export async function GET() {
    const supabaseAdmin = createSupabaseAdminClient()

    // Fetch top 10 users by points score
    // Join: points -> profiles (get email) -> interest-form (get names)
    const { data: topScores, error } = await supabaseAdmin
        .from('points')
        .select('user_id, score, profiles!inner ( email )')
        .order('score', { ascending: false })
        .limit(10)

    if (error) {
        return NextResponse.json({ error: `Failed to fetch leaderboard: ${error.message}` }, { status: 500 })
    }

    if (!topScores) {
        return NextResponse.json({ leaderboard: [] })
    }

    // For each user, fetch their name from interest-form using their email
    const leaderboard = await Promise.all(
        (topScores as PointsWithProfile[]).map(async (entry, index) => {
            // Handle both single object and array responses from Supabase
            const profileData = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles
            const email = profileData?.email
            let name = email ? email.split('@')[0] : 'Anonymous'

            if (email) {
                // Look up the user in interest-form by email (case-insensitive)
                const { data: interestForms } = await supabaseAdmin
                    .from('interest-form')
                    .select('firstName, lastName')
                    .ilike('email', email)
                    .limit(1)

                if (interestForms && interestForms.length > 0) {
                    const form = interestForms[0] as InterestFormData
                    const fullName = `${form.firstName || ''} ${form.lastName || ''}`.trim()
                    if (fullName) {
                        name = fullName
                    }
                }
            }

            return {
                rank: index + 1,
                name,
                score: entry.score ?? 0,
            }
        })
    )

    return NextResponse.json({ leaderboard })
}
