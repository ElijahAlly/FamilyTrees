CREATE TYPE "public"."access_type" AS ENUM('family', 'person');--> statement-breakpoint
CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('M', 'F', 'N', 'U');--> statement-breakpoint
CREATE TYPE "public"."marriage_type" AS ENUM('civil', 'religious', 'common-law', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('viewer', 'editor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."support_level" AS ENUM('basic', 'priority', 'dedicated');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_type" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"person_id" integer NOT NULL,
	"family_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "role" NOT NULL,
	"added_at" timestamp with time zone DEFAULT now(),
	"family_id" integer,
	"user_id" uuid,
	"added_by" uuid
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_name" varchar(255) NOT NULL,
	"members" uuid[],
	"admins" uuid[] DEFAULT '{}' NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"access_code" text,
	"import_source" jsonb,
	"settings" jsonb DEFAULT '{"allowMemberInvites":true,"minAdminsForApproval":1,"requireMediaApproval":true}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "marriages" (
	"id" serial PRIMARY KEY NOT NULL,
	"marriage_date" date,
	"divorce_date" date,
	"location" text,
	"marriage_type" "marriage_type",
	"documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"person1_id" integer,
	"person2_id" integer,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"middle_name" varchar(255),
	"birth_date" date,
	"death_date" date,
	"gender" "gender",
	"is_living" boolean DEFAULT true NOT NULL,
	"pictures" text[] DEFAULT '{}' NOT NULL,
	"profile_picture" text DEFAULT '' NOT NULL,
	"privacy_settings" jsonb DEFAULT '{"familyView":true,"publicView":false,"friendsView":false,"timeBasedRules":[],"ageRestrictions":null}'::jsonb NOT NULL,
	"extended_info" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"mother_id" integer,
	"father_id" integer,
	"user_id" uuid,
	"claimed_by" uuid,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric NOT NULL,
	"max_family_members" integer NOT NULL,
	"max_family_trees" integer NOT NULL,
	"max_generations" integer NOT NULL,
	"max_storage_gb" integer NOT NULL,
	"features" jsonb NOT NULL,
	"billing_cycle" "billing_cycle" NOT NULL,
	"has_media_upload" boolean DEFAULT false,
	"max_media_size_per_upload" integer,
	"bulk_upload_enabled" boolean DEFAULT false,
	"media_requires_approval" boolean DEFAULT true,
	"privacy_controls" jsonb NOT NULL,
	"max_admins" integer NOT NULL,
	"can_invite_collaborators" integer NOT NULL,
	"temp_access_enabled" boolean DEFAULT false,
	"max_temp_access_users" integer,
	"data_import" jsonb NOT NULL,
	"can_export" boolean DEFAULT false,
	"export_formats" text[],
	"family_merge_enabled" boolean DEFAULT false,
	"family_archive_enabled" boolean DEFAULT false,
	"family_audit_log" boolean DEFAULT false,
	"dispute_resolution" boolean DEFAULT false,
	"support_level" "support_level",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sort_ids" integer DEFAULT 999,
	CONSTRAINT "plans_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "temp_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"access_type" "access_type" NOT NULL,
	"target_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"max_visits" integer,
	"visits_used" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_created_by_people_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_person1_id_people_id_fk" FOREIGN KEY ("person1_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_person2_id_people_id_fk" FOREIGN KEY ("person2_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_claimed_by_users_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temp_access" ADD CONSTRAINT "temp_access_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "people_user_id_idx" ON "people" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "people_mother_id_idx" ON "people" USING btree ("mother_id");--> statement-breakpoint
CREATE INDEX "people_father_id_idx" ON "people" USING btree ("father_id");