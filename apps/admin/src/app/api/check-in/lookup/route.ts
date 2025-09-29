import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@repo/supabase/server";

interface LookupRequestBody {
    qr_token?: string;
    email?: string;
    name?: string;
}

export async function POST(request: Request) {
    let body: LookupRequestBody;
    try {
        body = await request.json();
    } catch (error) {
        console.error("Failed to parse check-in lookup payload", error);
        return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const rawToken = typeof body.qr_token === "string" ? body.qr_token.trim() : "";
    const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const rawName = typeof body.name === "string" ? body.name.trim() : "";
    let resolvedEmail: string | null = rawEmail || null;

    if (!rawToken && !rawEmail && !rawName) {
        return NextResponse.json(
            { error: "Provide a QR token, email, or name to look up a user." },
            { status: 400 },
        );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    try {
        let userId: string | null = null;

        if (rawToken) {
            const { data: identity, error: identityError } = await supabaseAdmin
                .from("qr_identities")
                .select("user_id, qr_token, sign_up_token")
                .or(`qr_token.eq.${rawToken},sign_up_token.eq.${rawToken}`)
                .maybeSingle();

            if (identityError) {
                console.error("Failed to search qr_identities by token", identityError);
                return NextResponse.json({ error: "Failed to look up QR token." }, { status: 500 });
            }

            if (!identity) {
                return NextResponse.json({ error: "No user found for that QR token." }, { status: 404 });
            }

            userId = identity.user_id;
        } else if (rawEmail) {
            const { data: profile, error: profileError } = await supabaseAdmin
                .from("profiles")
                .select("id")
                .eq("email", rawEmail)
                .maybeSingle();

            if (profileError) {
                console.error("Failed to look up profile by email", profileError);
                return NextResponse.json({ error: "Failed to look up email." }, { status: 500 });
            }

            if (!profile) {
                return NextResponse.json({ error: "No user found for that email." }, { status: 404 });
            }

            userId = profile.id;
        } else if (rawName) {
            const condensedName = rawName.replace(/\s+/g, " ").trim();
            const normalizedName = condensedName.toLowerCase();
            const nameParts = normalizedName.split(" ").filter(Boolean);
            const escapedName = condensedName.replace(/[\\%_]/g, "\\$&");

            const orFilters = new Set<string>([
                `firstName.ilike.%${escapedName}%`,
                `lastName.ilike.%${escapedName}%`,
            ]);

            nameParts.forEach((part) => {
                const sanitizedPart = part.replace(/[\\%_]/g, "\\$&");
                if (sanitizedPart) {
                    orFilters.add(`firstName.ilike.%${sanitizedPart}%`);
                    orFilters.add(`lastName.ilike.%${sanitizedPart}%`);
                }
            });

            const { data: interestMatches, error: interestError } = await supabaseAdmin
                .from("interest-form")
                .select("email, firstName, lastName")
                .or(Array.from(orFilters).join(","))
                .limit(20);

            if (interestError) {
                console.error("Failed to search interest form by name", interestError);
                return NextResponse.json({ error: "Failed to search by name." }, { status: 500 });
            }

            const matchCandidates = (interestMatches ?? [])
                .map((entry) => ({
                    email: entry.email?.trim().toLowerCase() ?? null,
                    firstName: (entry.firstName ?? "").trim(),
                    lastName: (entry.lastName ?? "").trim(),
                }))
                .filter((candidate) => candidate.email);

            const dedupedMatches = Array.from(
                new Map(
                    matchCandidates.map((candidate) => [candidate.email as string, candidate]),
                ).values(),
            );

            if (dedupedMatches.length === 0) {
                return NextResponse.json({ error: "No users found for that name." }, { status: 404 });
            }

            if (dedupedMatches.length > 1) {
                return NextResponse.json({
                    matches: dedupedMatches.map((candidate) => ({
                        email: candidate.email as string,
                        firstName: candidate.firstName,
                        lastName: candidate.lastName,
                    })),
                });
            }

            const [singleMatch] = dedupedMatches;
            const interestEmail = singleMatch.email as string;

            const { data: profileMatch, error: profileError } = await supabaseAdmin
                .from("profiles")
                .select("id")
                .eq("email", interestEmail)
                .maybeSingle();

            if (profileError) {
                console.error("Failed to look up profile by email from interest form", profileError);
                return NextResponse.json({ error: "Failed to look up user by email." }, { status: 500 });
            }

            if (!profileMatch) {
                return NextResponse.json(
                    {
                        error: `No registered user found with email ${interestEmail}. Ensure the attendee has completed account setup.`,
                    },
                    { status: 404 },
                );
            }

            resolvedEmail = interestEmail;
            userId = profileMatch.id;
        }

        if (!userId) {
            return NextResponse.json({ error: "User could not be determined." }, { status: 404 });
        }

        const [
            { data: profile, error: profileFetchError },
            { data: identity, error: identityFetchError },
            { data: pointData, error: pointsFetchError },
            authUserResult,
        ] = await Promise.all([
            supabaseAdmin
                .from("profiles")
                .select("id, email, role")
                .eq("id", userId)
                .maybeSingle(),
            supabaseAdmin
                .from("qr_identities")
                .select("qr_token, sign_up_token")
                .eq("user_id", userId)
                .maybeSingle(),
            supabaseAdmin
                .from("points")
                .select("score")
                .eq("user_id", userId)
                .maybeSingle(),
            supabaseAdmin.auth.admin.getUserById(userId),
        ]);

        if (profileFetchError) {
            console.error("Failed to fetch profile during check-in lookup", profileFetchError);
            return NextResponse.json({ error: "Failed to load user profile." }, { status: 500 });
        }

        if (identityFetchError) {
            console.error("Failed to fetch identity during check-in lookup", identityFetchError);
            return NextResponse.json({ error: "Failed to load user QR identity." }, { status: 500 });
        }

        if (pointsFetchError) {
            console.error("Failed to fetch points during check-in lookup", pointsFetchError);
            return NextResponse.json({ error: "Failed to load user points." }, { status: 500 });
        }

        if (authUserResult.error) {
            console.error("Failed to fetch auth user during check-in lookup", authUserResult.error);
            return NextResponse.json({ error: "Failed to load authentication details." }, { status: 500 });
        }

        if (!profile) {
            return NextResponse.json({ error: "Profile not found for user." }, { status: 404 });
        }

        if (!identity) {
            return NextResponse.json({ error: "QR identity not found for user." }, { status: 404 });
        }

        const email = profile.email ?? authUserResult.data?.user?.email ?? resolvedEmail ?? rawEmail;

        const user = {
            id: profile.id,
            email,
            role: profile.role,
            score: pointData?.score ?? 0,
            qr_token: identity.qr_token ?? null,
            sign_up_token: identity.sign_up_token ?? null,
        };

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Unexpected error during check-in lookup", error);
        return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
    }
}
