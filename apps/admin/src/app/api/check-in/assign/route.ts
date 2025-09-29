import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@repo/supabase/server";
import { cookies } from "next/headers";

interface AssignRequestBody {
    user_id?: string;
    registration_token?: string;
    points?: number;
}

export async function POST(request: Request) {
    let body: AssignRequestBody;
    try {
        body = await request.json();
    } catch (error) {
        console.error("Failed to parse check-in assign payload", error);
        return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const userId = typeof body.user_id === "string" ? body.user_id.trim() : "";
    const registrationToken =
        typeof body.registration_token === "string" ? body.registration_token.trim() : "";
    const pointsValue = Number(body.points ?? 0);

    if (!userId || !registrationToken) {
        return NextResponse.json(
            { error: "Both user_id and registration_token are required." },
            { status: 400 },
        );
    }

    if (!Number.isFinite(pointsValue)) {
        return NextResponse.json({ error: "Points must be a valid number." }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    try {
        const { data: identity, error: identityError } = await supabaseAdmin
            .from("qr_identities")
            .select("qr_token, sign_up_token")
            .eq("user_id", userId)
            .maybeSingle();

        if (identityError) {
            console.error("Failed to fetch existing identity during check-in assign", identityError);
            return NextResponse.json({ error: "Failed to load user identity." }, { status: 500 });
        }

        if (!identity) {
            return NextResponse.json({ error: "QR identity not found for user." }, { status: 404 });
        }

        const previousToken = identity.sign_up_token ?? null;

        const { data: conflict, error: conflictError } = await supabaseAdmin
            .from("qr_identities")
            .select("user_id")
            .eq("sign_up_token", registrationToken)
            .maybeSingle();

        if (conflictError) {
            console.error("Failed to check for sign_up_token conflicts", conflictError);
            return NextResponse.json({ error: "Failed to verify token uniqueness." }, { status: 500 });
        }

        if (conflict && conflict.user_id !== userId) {
            return NextResponse.json(
                { error: "That registration token is already assigned to another user." },
                { status: 409 },
            );
        }

        const { error: updateError } = await supabaseAdmin
            .from("qr_identities")
            .update({ sign_up_token: registrationToken })
            .eq("user_id", userId);

        if (updateError) {
            console.error("Failed to update sign_up_token during check-in assign", updateError);
            return NextResponse.json({ error: "Failed to update sign-up token." }, { status: 500 });
        }

        const supabase = await createSupabaseServerClient(cookies);

        const {
            data: sessionUser,
            error: sessionUserError,
        } = await supabase.auth.getUser();

        if (sessionUserError) {
            console.error("Failed to determine current admin user", sessionUserError);
        }

        const adminUserId = sessionUser?.user?.id ?? null;
        const adminEmail = sessionUser?.user?.email ?? null;

        if (pointsValue !== 0) {
            const { error: pointsError } = await supabase.rpc("update_points_and_log", {
                target_user_id: userId,
                points_change_amount: pointsValue,
                change_source: "Check-in Bonus",
            });

            if (pointsError) {
                console.error("Failed to award check-in points; attempting to revert token", pointsError);
                await supabaseAdmin
                    .from("qr_identities")
                    .update({ sign_up_token: previousToken })
                    .eq("user_id", userId);
                return NextResponse.json(
                    { error: "Failed to award points. No changes were saved." },
                    { status: 500 },
                );
            }
        }

        const { error: checkInLogError } = await supabaseAdmin.from("check_ins").insert({
            user_id: userId,
            registration_token: registrationToken,
            points_awarded: pointsValue,
            performed_by: adminUserId,
            performed_by_email: adminEmail,
            source: "admin-check-in",
        });

        if (checkInLogError) {
            console.error("Failed to record check-in; reverting prior changes", checkInLogError);
            await supabaseAdmin
                .from("qr_identities")
                .update({ sign_up_token: previousToken })
                .eq("user_id", userId);

            if (pointsValue !== 0) {
                const { error: revertError } = await supabase.rpc("update_points_and_log", {
                    target_user_id: userId,
                    points_change_amount: -pointsValue,
                    change_source: "Check-in Bonus Revert (log failure)",
                });

                if (revertError) {
                    console.error("Failed to revert points after check-in log error", revertError);
                }
            }

            return NextResponse.json(
                { error: "Failed to record check-in. No changes were saved." },
                { status: 500 },
            );
        }

        const [
            { data: profile, error: profileError },
            { data: updatedIdentity, error: updatedIdentityError },
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

        if (profileError) {
            console.error("Failed to fetch profile after assignment", profileError);
            return NextResponse.json({ error: "Failed to load updated profile." }, { status: 500 });
        }

        if (updatedIdentityError) {
            console.error("Failed to fetch updated identity after assignment", updatedIdentityError);
            return NextResponse.json({ error: "Failed to load updated identity." }, { status: 500 });
        }

        if (pointsFetchError) {
            console.error("Failed to fetch updated points after assignment", pointsFetchError);
            return NextResponse.json({ error: "Failed to load updated points." }, { status: 500 });
        }

        if (authUserResult.error) {
            console.error("Failed to fetch auth user after assignment", authUserResult.error);
            return NextResponse.json({ error: "Failed to load authentication details." }, { status: 500 });
        }

        if (!profile || !updatedIdentity) {
            return NextResponse.json({ error: "Updated user data unavailable." }, { status: 500 });
        }

        const email = profile.email ?? authUserResult.data?.user?.email ?? "";

        const user = {
            id: profile.id,
            email,
            role: profile.role,
            score: pointData?.score ?? 0,
            qr_token: updatedIdentity.qr_token ?? null,
            sign_up_token: updatedIdentity.sign_up_token ?? null,
        };

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Unexpected error during check-in assignment", error);
        return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
    }
}
