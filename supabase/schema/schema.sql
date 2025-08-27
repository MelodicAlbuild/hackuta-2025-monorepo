/*
 * Let's have a quick conversation.
 * First of all, welcome to this file, it is the management schema for the Supabase backend that runs HackUTA.
 * Touching, modifing, or altering this file can have disasterous consequences if you don't know what you are doing.
 * Supabase uses a handful of specific expensions that you may not understand, if you don't understand something, don't touch it.
 * 80% of the infra in this codebase is this file right here, it took me the most time, and it is the sole reason everything works.
 * This single .sql file updates the core supabase infra every time a push is made that edits this file, or a specific command is run.
 * If you don't understand why something does what it does, or have questions, even if you're looking at this years in the future,
 * come ask me, my email is in the signature on this comment, I will be happy to help fix things.
 * Thank you for reading,
 * -Alex Drum
 * ralexdrum@gmail.com
 */

-- Assorted Supabase Init Statements
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- THIS LINE WILL BREAK EVERYTHING IF IT IS REMOVED
COMMENT ON SCHEMA "public" IS 'standard public schema';

-- Add PGSQL Extensions
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Point Management Functions
CREATE OR REPLACE FUNCTION "public"."add_points"("user_id_param" "uuid", "amount_param" integer) RETURNS "void" LANGUAGE "sql" AS $$
UPDATE public.points
SET score = score + amount_param
WHERE user_id = user_id_param;
$$;

ALTER FUNCTION "public"."add_points"("user_id_param" "uuid", "amount_param" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."bulk_set_points"("amount_param" integer) RETURNS "void" LANGUAGE "sql" AS $$
UPDATE public.points
SET score = amount_param;
$$;

ALTER FUNCTION "public"."bulk_set_points"("amount_param" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."bulk_set_points_and_log"("target_score" integer, "change_source" "text") RETURNS "void" LANGUAGE "plpgsql" SECURITY DEFINER AS $$ BEGIN -- Use a Common Table Expression (CTE) to capture the changes
    WITH updated_users AS (
        -- Update the scores for all non-admin users
        UPDATE public.points p
        SET score = target_score
        FROM public.profiles pr
        WHERE p.user_id = pr.id
            AND pr.role NOT IN ('admin', 'super-admin') -- Return the user ID, their old score, and the new score for logging
        RETURNING p.user_id,
            p.score AS old_score,
            target_score AS new_score
    ) -- Now, insert a log entry for every user that was updated in the CTE
INSERT INTO public.point_history (user_id, admin_id, points_change, source)
SELECT upd.user_id,
    auth.uid(),
    (upd.new_score - upd.old_score),
    -- Calculate the difference
    change_source
FROM updated_users upd;
END;
$$;

ALTER FUNCTION "public"."bulk_set_points_and_log"("target_score" integer, "change_source" "text") OWNER TO "postgres";

-- Notification Functions
CREATE OR REPLACE FUNCTION "public"."get_notifications_for_user"() RETURNS "jsonb" LANGUAGE "plpgsql" SECURITY DEFINER AS $$ BEGIN -- If the user is a super-admin, join the recipient's email for all notifications
    IF get_user_role() = 'super-admin' THEN RETURN (
        SELECT jsonb_agg(preds)
        FROM (
                SELECT n.id,
                    n.created_at,
                    n.title,
                    n.message,
                    u.email AS recipient_email -- Join the email from auth.users
                FROM public.notifications n
                    LEFT JOIN auth.users u ON n.target_user_id = u.id
                ORDER BY n.created_at DESC
                LIMIT 10
            ) preds
    );
-- Otherwise, return only notifications relevant to the current user
ELSE RETURN (
    SELECT jsonb_agg(preds)
    FROM (
            SELECT id,
                created_at,
                title,
                message,
                NULL AS recipient_email -- Regular users don't see the recipient
            FROM public.notifications
            WHERE target_user_id IS NULL
                OR target_user_id = auth.uid()
            ORDER BY created_at DESC
            LIMIT 10
        ) preds
);
END IF;
END;
$$;

ALTER FUNCTION "public"."get_notifications_for_user"() OWNER TO "postgres";

-- User Role Method, This method is used over 30 times in the db management, do not remove or touch.
CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text" LANGUAGE "plpgsql" SECURITY DEFINER AS $$
DECLARE user_role TEXT;
BEGIN
SELECT role INTO user_role
FROM public.profiles
WHERE id = auth.uid();
RETURN user_role;
END;
$$;

ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";

-- New User Creation requires insertation into: public.profiles, public.points, public.qr_identities
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger" LANGUAGE "plpgsql" SECURITY DEFINER AS $$ BEGIN -- Copy the email from the auth table to the profiles table
INSERT INTO public.profiles (id, role, email)
VALUES (
        new.id,
        new.raw_user_meta_data->>'role',
        new.email
    );
INSERT INTO public.points (user_id, score)
VALUES (new.id, 0);
INSERT INTO public.qr_identities (user_id)
VALUES (new.id);
RETURN new;
END;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

-- Handle User Email/Id Updates
CREATE OR REPLACE FUNCTION "public"."handle_user_update"() RETURNS "trigger" LANGUAGE "plpgsql" SECURITY DEFINER AS $$ BEGIN
UPDATE public.profiles
SET email = new.email
WHERE id = new.id;
RETURN new;
END;
$$;

ALTER FUNCTION "public"."handle_user_update"() OWNER TO "postgres";

-- Vendor Code Management
CREATE OR REPLACE FUNCTION "public"."redeem_vendor_code"("scanned_code" "text") RETURNS "json" LANGUAGE "plpgsql" SECURITY DEFINER AS $$
DECLARE target_code RECORD;
scan_count INT;
current_user_id UUID := auth.uid();
BEGIN -- Find the vendor code based on the scanned text
SELECT id,
    points_value,
    scan_limit_per_user,
    name INTO target_code
FROM public.vendor_codes
WHERE code = scanned_code;
IF NOT FOUND THEN RAISE EXCEPTION 'Invalid or expired QR code.';
END IF;
-- Check if the user has already scanned this code up to the limit
SELECT count(*) INTO scan_count
FROM public.vendor_scan_logs
WHERE user_id = current_user_id
    AND code_id = target_code.id;
IF scan_count >= target_code.scan_limit_per_user THEN RAISE EXCEPTION 'You have already redeemed this code.';
END IF;
-- If all checks pass, award points and log the scan
INSERT INTO public.vendor_scan_logs (code_id, user_id)
VALUES (target_code.id, current_user_id);
-- Use our existing function to award points and create a history log
PERFORM update_points_and_log(
    current_user_id,
    target_code.points_value,
    target_code.name
);
RETURN json_build_object(
    'success',
    true,
    'message',
    'Success!',
    'points_awarded',
    target_code.points_value
);
END;
$$;

ALTER FUNCTION "public"."redeem_vendor_code"("scanned_code" "text") OWNER TO "postgres";

-- Point Removal Methods
CREATE OR REPLACE FUNCTION "public"."remove_points"("user_id_param" "uuid", "amount_param" integer) RETURNS "void" LANGUAGE "sql" AS $$
UPDATE public.points
SET score = score - amount_param
WHERE user_id = user_id_param;
$$;

ALTER FUNCTION "public"."remove_points"("user_id_param" "uuid", "amount_param" integer) OWNER TO "postgres";

-- An Update to Points and Logging
CREATE OR REPLACE FUNCTION "public"."update_points_and_log"(
        "target_user_id" "uuid",
        "points_change_amount" integer,
        "change_source" "text"
    ) RETURNS "void" LANGUAGE "plpgsql" SECURITY DEFINER AS $$ BEGIN -- Update the user's total score
UPDATE public.points
SET score = score + points_change_amount
WHERE user_id = target_user_id;
-- Insert a log of the transaction
INSERT INTO public.point_history (user_id, admin_id, points_change, source)
VALUES (
        target_user_id,
        auth.uid(),
        points_change_amount,
        change_source
    );
END;
$$;

ALTER FUNCTION "public"."update_points_and_log"(
    "target_user_id" "uuid",
    "points_change_amount" integer,
    "change_source" "text"
) OWNER TO "postgres";

-- Tablespace Methods use an inherant default tablespace, set it to empty to force tablespace lookup
SET default_tablespace = '';
-- Heap access prevents caching on low frequency methods
SET default_table_access_method = "heap";

-- Feature Flag Methods
CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "value" "text" NOT NULL,
    "description" "text"
);

ALTER TABLE "public"."feature_flags" OWNER TO "postgres";

ALTER TABLE "public"."feature_flags"
ALTER COLUMN "id"
ADD GENERATED ALWAYS AS IDENTITY (
        SEQUENCE NAME "public"."feature_flags_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
    );

-- Interest Form Methods
CREATE TABLE IF NOT EXISTS "public"."interest-form" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "firstName" "text" NOT NULL,
    "lastName" "text" NOT NULL,
    "age" bigint NOT NULL,
    "phoneNumber" "text" NOT NULL,
    "email" "text" NOT NULL,
    "school" "text" NOT NULL,
    "levelOfStudy" "text" NOT NULL,
    "countryOfResidence" "text" NOT NULL,
    "linkedInUrl" "text",
    "dietaryRestrictions" "text",
    "underRepresentedGroup" "text",
    "genderIdentity" "text",
    "pronouns" "text",
    "raceOrEthnicity" "text",
    "lgbtqiaPlus" boolean,
    "completedEducation" "text",
    "tShirtSize" "text",
    "shippingAddress" "text",
    "majorFieldOfStudy" "text",
    "codeOfConduct" boolean NOT NULL,
    "mlhDataHandling" boolean NOT NULL,
    "mlhPromotionalEmails" boolean,
    "status" "text",
    "resume" "text"
);

ALTER TABLE "public"."interest-form" OWNER TO "postgres";

ALTER TABLE "public"."interest-form"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
        SEQUENCE NAME "public"."interest-form_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
    );

-- Notifications get a bit weird with creation and usage, they need to be created after their hooks are setup or the table will auto-populate
CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'broadcast'::"text" NOT NULL,
    "target_user_id" "uuid",
    "metadata" "jsonb",
    "title" "text",
    "recipient_email" "text"
);

ALTER TABLE "public"."notifications" OWNER TO "postgres";

ALTER TABLE "public"."notifications"
ALTER COLUMN "id"
ADD GENERATED ALWAYS AS IDENTITY (
        SEQUENCE NAME "public"."notifications_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
    );

-- Point History Management
CREATE TABLE IF NOT EXISTS "public"."point_history" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "points_change" integer NOT NULL,
    "source" "text"
);

ALTER TABLE "public"."point_history" OWNER TO "postgres";

ALTER TABLE "public"."point_history"
ALTER COLUMN "id"
ADD GENERATED ALWAYS AS IDENTITY (
        SEQUENCE NAME "public"."point_history_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
    );

-- Points are similar to notifications and must be created late
CREATE TABLE IF NOT EXISTS "public"."points" (
    "user_id" "uuid" NOT NULL,
    "score" integer DEFAULT 0 NOT NULL
);

ALTER TABLE "public"."points" OWNER TO "postgres";

-- Create Remaining Tables
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "email" "text"
);

ALTER TABLE "public"."profiles" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."qr_identities" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "qr_token" "text" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."qr_identities" OWNER TO "postgres";

ALTER TABLE "public"."qr_identities"
ALTER COLUMN "id"
ADD GENERATED ALWAYS AS IDENTITY (
        SEQUENCE NAME "public"."qr_identities_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
    );

CREATE TABLE IF NOT EXISTS "public"."temporary_passwords" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "temp_password" "text" NOT NULL,
    "fetched_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."temporary_passwords" OWNER TO "postgres";

ALTER TABLE "public"."temporary_passwords"
ALTER COLUMN "id"
ADD GENERATED ALWAYS AS IDENTITY (
        SEQUENCE NAME "public"."temporary_passwords_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
    );

CREATE TABLE IF NOT EXISTS "public"."vendor_codes" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "points_value" integer DEFAULT 10 NOT NULL,
    "scan_limit_per_user" integer DEFAULT 1 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."vendor_codes" OWNER TO "postgres";

ALTER TABLE "public"."vendor_codes"
ALTER COLUMN "id"
ADD GENERATED ALWAYS AS IDENTITY (
        SEQUENCE NAME "public"."vendor_codes_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
    );

CREATE TABLE IF NOT EXISTS "public"."vendor_scan_logs" (
    "id" bigint NOT NULL,
    "code_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."vendor_scan_logs" OWNER TO "postgres";

ALTER TABLE "public"."vendor_scan_logs"
ALTER COLUMN "id"
ADD GENERATED ALWAYS AS IDENTITY (
        SEQUENCE NAME "public"."vendor_scan_logs_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1
    );

-- Handle Unique Keys, Primary Keys, and Relations
ALTER TABLE ONLY "public"."feature_flags"
ADD CONSTRAINT "feature_flags_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."feature_flags"
ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."interest-form"
ADD CONSTRAINT "interest-form_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."notifications"
ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."point_history"
ADD CONSTRAINT "point_history_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."points"
ADD CONSTRAINT "points_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."profiles"
ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."qr_identities"
ADD CONSTRAINT "qr_identities_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."qr_identities"
ADD CONSTRAINT "qr_identities_qr_token_key" UNIQUE ("qr_token");

ALTER TABLE ONLY "public"."qr_identities"
ADD CONSTRAINT "qr_identities_user_id_key" UNIQUE ("user_id");

ALTER TABLE ONLY "public"."temporary_passwords"
ADD CONSTRAINT "temporary_passwords_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."temporary_passwords"
ADD CONSTRAINT "temporary_passwords_user_id_key" UNIQUE ("user_id");

ALTER TABLE ONLY "public"."vendor_codes"
ADD CONSTRAINT "vendor_codes_code_key" UNIQUE ("code");

ALTER TABLE ONLY "public"."vendor_codes"
ADD CONSTRAINT "vendor_codes_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."vendor_scan_logs"
ADD CONSTRAINT "vendor_scan_logs_code_id_user_id_key" UNIQUE ("code_id", "user_id");

ALTER TABLE ONLY "public"."vendor_scan_logs"
ADD CONSTRAINT "vendor_scan_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."notifications"
ADD CONSTRAINT "notifications_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."point_history"
ADD CONSTRAINT "point_history_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."point_history"
ADD CONSTRAINT "point_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."points"
ADD CONSTRAINT "points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."profiles"
ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."qr_identities"
ADD CONSTRAINT "qr_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."temporary_passwords"
ADD CONSTRAINT "temporary_passwords_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."vendor_codes"
ADD CONSTRAINT "vendor_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");

ALTER TABLE ONLY "public"."vendor_scan_logs"
ADD CONSTRAINT "vendor_scan_logs_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "public"."vendor_codes"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."vendor_scan_logs"
ADD CONSTRAINT "vendor_scan_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

-- Supabase Supports Row Level Security on a global scale, manage all of those properties here (there are a lot).
CREATE POLICY "Admins and Super-Admins can update interest forms" ON "public"."interest-form" FOR
UPDATE TO "authenticated" USING (
        (
            "public"."get_user_role"() = ANY (ARRAY ['admin'::"text", 'super-admin'::"text"])
        )
    );

CREATE POLICY "Admins and Super-Admins can view interest forms" ON "public"."interest-form" FOR
SELECT TO "authenticated" USING (
        (
            "public"."get_user_role"() = ANY (ARRAY ['admin'::"text", 'super-admin'::"text"])
        )
    );

CREATE POLICY "Admins can manage vendor codes" ON "public"."vendor_codes" USING (
    (
        "public"."get_user_role"() = ANY (ARRAY ['admin'::"text", 'super-admin'::"text"])
    )
) WITH CHECK (
    (
        "public"."get_user_role"() = ANY (ARRAY ['admin'::"text", 'super-admin'::"text"])
    )
);

CREATE POLICY "Admins can update points" ON "public"."points" FOR
UPDATE TO "authenticated" USING (
        (
            "public"."get_user_role"() = ANY (ARRAY ['admin'::"text", 'super-admin'::"text"])
        )
    );

CREATE POLICY "Admins can view all QR identities" ON "public"."qr_identities" FOR
SELECT TO "authenticated" USING (
        (
            "public"."get_user_role"() = ANY (ARRAY ['admin'::"text", 'super-admin'::"text"])
        )
    );

CREATE POLICY "Admins can view password records" ON "public"."temporary_passwords" FOR
SELECT USING (
        (
            "public"."get_user_role"() = 'super-admin'::"text"
        )
    );

CREATE POLICY "Admins can view point history" ON "public"."point_history" FOR
SELECT TO "authenticated" USING (
        (
            "public"."get_user_role"() = ANY (ARRAY ['admin'::"text", 'super-admin'::"text"])
        )
    );

CREATE POLICY "Public can insert into interest forms" ON "public"."interest-form" FOR
INSERT WITH CHECK (true);

CREATE POLICY "Public can read feature flags" ON "public"."feature_flags" FOR
SELECT USING (true);

CREATE POLICY "Public can view points" ON "public"."points" FOR
SELECT USING (true);

CREATE POLICY "Service role can manage passwords" ON "public"."temporary_passwords" USING (true) WITH CHECK (true);

CREATE POLICY "Super-admins can create notifications" ON "public"."notifications" FOR
INSERT TO "authenticated" WITH CHECK (
        (
            "public"."get_user_role"() = 'super-admin'::"text"
        )
    );

CREATE POLICY "Super-admins can manage feature flags" ON "public"."feature_flags" USING (
    (
        "public"."get_user_role"() = 'super-admin'::"text"
    )
) WITH CHECK (
    (
        "public"."get_user_role"() = 'super-admin'::"text"
    )
);

CREATE POLICY "Super-admins can view all notifications" ON "public"."notifications" FOR
SELECT TO "authenticated" USING (
        (
            "public"."get_user_role"() = 'super-admin'::"text"
        )
    );

CREATE POLICY "Users can insert their own scan logs" ON "public"."vendor_scan_logs" FOR
INSERT WITH CHECK (("user_id" = "auth"."uid"()));

CREATE POLICY "Users can view relevant notifications" ON "public"."notifications" FOR
SELECT TO "authenticated" USING (
        (
            ("target_user_id" IS NULL)
            OR ("target_user_id" = "auth"."uid"())
        )
    );

CREATE POLICY "Users can view their own QR identity" ON "public"."qr_identities" FOR
SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can view their own point history" ON "public"."point_history" FOR
SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR
SELECT TO "authenticated" USING (("auth"."uid"() = "id"));

-- After Policies have been created, enable the security on each table
ALTER TABLE "public"."feature_flags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."interest-form" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."point_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."points" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."qr_identities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."temporary_passwords" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."vendor_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."vendor_scan_logs" ENABLE ROW LEVEL SECURITY;

-- Realtime publications are an extension to postgres, assign its ownership
ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

-- Table Management for Publications is done on a granular level, enable only this table
ALTER PUBLICATION "supabase_realtime"
ADD TABLE ONLY "public"."notifications";

-- Handle Usage and permissions, there are thousands of permissions, these are not complete and I end up editing them every hour or two.
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."add_points"("user_id_param" "uuid", "amount_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_points"("user_id_param" "uuid", "amount_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_points"("user_id_param" "uuid", "amount_param" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."bulk_set_points"("amount_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_set_points"("amount_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_set_points"("amount_param" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."bulk_set_points_and_log"("target_score" integer, "change_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_set_points_and_log"("target_score" integer, "change_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_set_points_and_log"("target_score" integer, "change_source" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_notifications_for_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_notifications_for_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_notifications_for_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "service_role";

GRANT ALL ON FUNCTION "public"."redeem_vendor_code"("scanned_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."redeem_vendor_code"("scanned_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."redeem_vendor_code"("scanned_code" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."remove_points"("user_id_param" "uuid", "amount_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."remove_points"("user_id_param" "uuid", "amount_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_points"("user_id_param" "uuid", "amount_param" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."update_points_and_log"(
        "target_user_id" "uuid",
        "points_change_amount" integer,
        "change_source" "text"
    ) TO "anon";

GRANT ALL ON FUNCTION "public"."update_points_and_log"(
        "target_user_id" "uuid",
        "points_change_amount" integer,
        "change_source" "text"
    ) TO "authenticated";

GRANT ALL ON FUNCTION "public"."update_points_and_log"(
        "target_user_id" "uuid",
        "points_change_amount" integer,
        "change_source" "text"
    ) TO "service_role";

GRANT ALL ON TABLE "public"."feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_flags" TO "service_role";

GRANT ALL ON SEQUENCE "public"."feature_flags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."feature_flags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."feature_flags_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."interest-form" TO "anon";
GRANT ALL ON TABLE "public"."interest-form" TO "authenticated";
GRANT ALL ON TABLE "public"."interest-form" TO "service_role";

GRANT ALL ON SEQUENCE "public"."interest-form_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."interest-form_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."interest-form_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";

GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."point_history" TO "anon";
GRANT ALL ON TABLE "public"."point_history" TO "authenticated";
GRANT ALL ON TABLE "public"."point_history" TO "service_role";

GRANT ALL ON SEQUENCE "public"."point_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."point_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."point_history_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."points" TO "anon";
GRANT ALL ON TABLE "public"."points" TO "authenticated";
GRANT ALL ON TABLE "public"."points" TO "service_role";

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON TABLE "public"."qr_identities" TO "anon";
GRANT ALL ON TABLE "public"."qr_identities" TO "authenticated";
GRANT ALL ON TABLE "public"."qr_identities" TO "service_role";

GRANT ALL ON SEQUENCE "public"."qr_identities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."qr_identities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."qr_identities_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."temporary_passwords" TO "anon";
GRANT ALL ON TABLE "public"."temporary_passwords" TO "authenticated";
GRANT ALL ON TABLE "public"."temporary_passwords" TO "service_role";

GRANT ALL ON SEQUENCE "public"."temporary_passwords_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."temporary_passwords_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."temporary_passwords_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."vendor_codes" TO "anon";
GRANT ALL ON TABLE "public"."vendor_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_codes" TO "service_role";

GRANT ALL ON SEQUENCE "public"."vendor_codes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vendor_codes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vendor_codes_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."vendor_scan_logs" TO "anon";
GRANT ALL ON TABLE "public"."vendor_scan_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_scan_logs" TO "service_role";

GRANT ALL ON SEQUENCE "public"."vendor_scan_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vendor_scan_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vendor_scan_logs_id_seq" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "service_role";

-- This is a VERY DANGEROUS COMMAND, and is only run twice, do not remove this command, do not change this command, forget it exists.
RESET ALL;