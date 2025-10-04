import { createSupabaseAdminClient } from '@repo/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabaseAdmin = createSupabaseAdminClient()

    // Fetch top 10 users by points score
    // Join: points -> profiles (get email) -> interest-form (get names)
    const { data: topScores, error } = await supabaseAdmin
        .from('points')
        .select('user_id, score, profiles ( email )')
        .order('score', { ascending: false })
        .limit(10)

    if (error) {
        return NextResponse.json({ error: `Failed to fetch leaderboard: ${error.message}` }, { status: 500 })
    }

    // For each user, fetch their name from interest-form using their email
    const leaderboard = await Promise.all(
        topScores?.map(async (entry, index) => {
            const email = entry.profiles?.email
            let name = 'Anonymous'

            if (email) {
                // Look up the user in interest-form by email
                const { data: interestForm } = await supabaseAdmin
                    .from('interest-form')
                    .select('firstName, lastName')
                    .eq('email', email)
                    .single()

                if (interestForm) {
                    name = `${interestForm.firstName || ''} ${interestForm.lastName || ''}`.trim()
                }
            }

            // Fallback to email username if no name found
            if (name === 'Anonymous' && email) {
                name = email.split('@')[0]
            }

            return {
                rank: index + 1,
                name,
                score: entry.score ?? 0,
            }
        }) ?? []
    )

    return NextResponse.json({ leaderboard })
}
