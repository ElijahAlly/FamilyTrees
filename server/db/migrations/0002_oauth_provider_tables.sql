CREATE TYPE "public"."family_role" AS ENUM('owner', 'banker', 'admin', 'member', 'guest');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('pending_review', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."merge_request_status" AS ENUM('pending', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TABLE "data_imports" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "data_imports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source" text NOT NULL,
	"status" "import_status" DEFAULT 'pending_review' NOT NULL,
	"family_id" integer NOT NULL,
	"imported_by" uuid NOT NULL,
	"raw_data" jsonb NOT NULL,
	"reviewed_data" jsonb,
	"import_summary" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "family_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "family_role" NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"family_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_by" uuid
);
--> statement-breakpoint
CREATE TABLE "merge_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "merge_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"status" "merge_request_status" DEFAULT 'pending' NOT NULL,
	"source_family_id" integer NOT NULL,
	"target_family_id" integer NOT NULL,
	"requested_by" uuid NOT NULL,
	"reviewed_by" uuid[] DEFAULT '{}' NOT NULL,
	"conflicts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"resolutions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"merge_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "oauth_authorization_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"redirect_uri" text NOT NULL,
	"scope" text DEFAULT '' NOT NULL,
	"code_challenge" text NOT NULL,
	"code_challenge_method" text DEFAULT 'S256' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"name" text NOT NULL,
	"client_secret_hash" text NOT NULL,
	"redirect_uris" text[] DEFAULT '{}' NOT NULL,
	"allowed_scopes" text[] DEFAULT '{}' NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_clients_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "oauth_refresh_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"scope" text DEFAULT '' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "otp_codes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "activity_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "claim_requests" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "claim_requests" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "claim_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "families" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "families" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "families_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "families" ALTER COLUMN "members" SET DATA TYPE integer[];--> statement-breakpoint
ALTER TABLE "families" ALTER COLUMN "members" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "marriages" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "marriages" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "marriages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "media_submissions" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "media_submissions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "media_submissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "people_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "performed_by" uuid;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "media_submissions" ADD COLUMN "content_rating" text;--> statement-breakpoint
ALTER TABLE "media_submissions" ADD COLUMN "person_id" integer;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "preferences" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "data_imports" ADD CONSTRAINT "data_imports_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_imports" ADD CONSTRAINT "data_imports_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_roles" ADD CONSTRAINT "family_roles_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_roles" ADD CONSTRAINT "family_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_roles" ADD CONSTRAINT "family_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_requests" ADD CONSTRAINT "merge_requests_source_family_id_families_id_fk" FOREIGN KEY ("source_family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_requests" ADD CONSTRAINT "merge_requests_target_family_id_families_id_fk" FOREIGN KEY ("target_family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_requests" ADD CONSTRAINT "merge_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_client_id_oauth_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_client_id_oauth_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "data_imports_family_idx" ON "data_imports" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "data_imports_status_idx" ON "data_imports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "family_roles_family_idx" ON "family_roles" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "family_roles_user_idx" ON "family_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "family_roles_family_user_idx" ON "family_roles" USING btree ("family_id","user_id");--> statement-breakpoint
CREATE INDEX "merge_requests_source_idx" ON "merge_requests" USING btree ("source_family_id");--> statement-breakpoint
CREATE INDEX "merge_requests_target_idx" ON "merge_requests" USING btree ("target_family_id");--> statement-breakpoint
CREATE INDEX "merge_requests_status_idx" ON "merge_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "oauth_codes_client_idx" ON "oauth_authorization_codes" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oauth_codes_user_idx" ON "oauth_authorization_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_clients_client_id_idx" ON "oauth_clients" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oauth_refresh_user_idx" ON "oauth_refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_refresh_client_idx" ON "oauth_refresh_tokens" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "otp_codes_email_idx" ON "otp_codes" USING btree ("email");--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_submissions" ADD CONSTRAINT "media_submissions_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_family_idx" ON "activity_logs" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "families_visibility_idx" ON "families" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "marriages_person1_idx" ON "marriages" USING btree ("person1_id");--> statement-breakpoint
CREATE INDEX "marriages_person2_idx" ON "marriages" USING btree ("person2_id");--> statement-breakpoint
CREATE INDEX "temp_access_email_idx" ON "temp_access" USING btree ("email");--> statement-breakpoint
CREATE INDEX "temp_access_target_idx" ON "temp_access" USING btree ("target_id");