import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createSupabaseAdminClient } from '@repo/supabase/server';

const payloadSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
});

export async function POST(request: Request) {
    let payload: z.infer<typeof payloadSchema>;

    try {
        const body = await request.json();
        payload = payloadSchema.parse(body);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const message = error.issues[0]?.message ?? 'Invalid request payload.';
            return NextResponse.json({ error: message }, { status: 400 });
        }

        return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const metadata: Record<string, string> = {
        source: 'volunteer-registration',
        role: 'volunteer',
    };

    const trimmedFirstName = payload.firstName?.trim();
    const trimmedLastName = payload.lastName?.trim();

    if (trimmedFirstName) {
        metadata.first_name = trimmedFirstName;
    }

    if (trimmedLastName) {
        metadata.last_name = trimmedLastName;
    }

    try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: payload.email,
            password: payload.password,
            email_confirm: true,
            user_metadata: metadata,
        });

        if (error) {
            const message = error.message ?? 'Failed to create account.';
            const status = error.status ?? 500;
            const normalized = message.toLowerCase();

            if (status === 422 || normalized.includes('already registered')) {
                const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('email', payload.email)
                    .maybeSingle();

                if (profileLookupError) {
                    return NextResponse.json(
                        { error: profileLookupError.message ?? 'Failed to look up existing profile.' },
                        { status: 500 },
                    );
                }

                if (!existingProfile?.id) {
                    return NextResponse.json(
                        { error: 'Unable to locate the existing account for this email.' },
                        { status: 404 },
                    );
                }

                const { data: existingUserResponse, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(
                    existingProfile.id,
                );

                if (getUserError) {
                    return NextResponse.json(
                        { error: getUserError.message ?? 'Failed to load existing account metadata.' },
                        { status: getUserError.status ?? 500 },
                    );
                }

                const mergedMetadata = {
                    ...(existingUserResponse?.user?.user_metadata ?? {}),
                    ...metadata,
                };

                const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
                    user_metadata: mergedMetadata,
                });

                if (updateUserError) {
                    return NextResponse.json(
                        { error: updateUserError.message ?? 'Failed to update existing account metadata.' },
                        { status: updateUserError.status ?? 500 },
                    );
                }

                const { error: profileUpdateError } = await supabaseAdmin
                    .from('profiles')
                    .update({ role: 'volunteer' })
                    .eq('id', existingProfile.id);

                if (profileUpdateError) {
                    return NextResponse.json(
                        { error: profileUpdateError.message ?? 'Failed to update profile role.' },
                        { status: 500 },
                    );
                }

                return NextResponse.json({
                    success: true,
                    status: 'existing-updated',
                    user: {
                        id: existingProfile.id,
                        email: payload.email,
                    },
                });
            }

            return NextResponse.json({ error: message }, { status });
        }

        const createdUserId = data.user?.id ?? null;

        if (createdUserId) {
            const { error: profileUpdateError } = await supabaseAdmin
                .from('profiles')
                .update({ role: 'volunteer' })
                .eq('id', createdUserId);

            if (profileUpdateError) {
                return NextResponse.json(
                    { error: profileUpdateError.message ?? 'Failed to update profile role.' },
                    { status: 500 },
                );
            }
        }

        return NextResponse.json({
            success: true,
            status: 'created',
            user: {
                id: createdUserId,
                email: data.user?.email ?? payload.email,
            },
        });
    } catch (error) {
        console.error('Failed to create volunteer account', error);
        return NextResponse.json(
            { error: 'Unexpected server error while creating account.' },
            { status: 500 },
        );
    }
}
