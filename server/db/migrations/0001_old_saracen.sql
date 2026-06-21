CREATE TYPE "public"."claim_request_status" AS ENUM('pending', 'approved', 'denied', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."claim_request_type" AS ENUM('claim_person', 'join_family', 'add_self_to_family');--> statement-breakpoint
CREATE TYPE "public"."family_kind" AS ENUM('relatives', 'friends');--> statement-breakpoint
CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."invite_type" AS ENUM('family', 'person');--> statement-breakpoint
CREATE TYPE "public"."media_submission_status" AS ENUM('pending', 'approved', 'denied');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'pending', 'removed');--> statement-breakpoint
CREATE TABLE "claim_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "claim_request_type" NOT NULL,
	"status" "claim_request_status" DEFAULT 'pending' NOT NULL,
	"message" text,
	"review_notes" text,
	"auth_provider" text,
	"required_approvals" integer DEFAULT 1 NOT NULL,
	"current_approvals" integer DEFAULT 0 NOT NULL,
	"reviewed_by" uuid[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"requester_id" uuid NOT NULL,
	"person_id" integer,
	"family_id" integer
);
--> statement-breakpoint
CREATE TABLE "family_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "family_kind" DEFAULT 'relatives' NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	"user_id" uuid NOT NULL,
	"family_id" integer NOT NULL,
	"person_id" integer
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "friendship_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"friend_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "invite_type" NOT NULL,
	"code" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"max_uses" integer,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"family_id" integer NOT NULL,
	"person_id" integer,
	"created_by" uuid NOT NULL,
	CONSTRAINT "invite_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "media_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_url" text NOT NULL,
	"caption" text,
	"status" "media_submission_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"family_id" integer NOT NULL,
	"submitted_by" uuid NOT NULL,
	"reviewed_by" uuid
);
--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "privacy_settings" SET DEFAULT '{"familyView":true,"publicView":false,"friendsView":false,"timeBasedRules":[],"ageRestrictions":null,"requireSameLastName":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "claim_requests" ADD CONSTRAINT "claim_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_requests" ADD CONSTRAINT "claim_requests_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_requests" ADD CONSTRAINT "claim_requests_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friend_id_users_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_links" ADD CONSTRAINT "invite_links_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_links" ADD CONSTRAINT "invite_links_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_links" ADD CONSTRAINT "invite_links_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_submissions" ADD CONSTRAINT "media_submissions_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_submissions" ADD CONSTRAINT "media_submissions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_submissions" ADD CONSTRAINT "media_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "claim_requests_requester_idx" ON "claim_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "claim_requests_family_idx" ON "claim_requests" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "claim_requests_status_idx" ON "claim_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "family_memberships_user_idx" ON "family_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "family_memberships_family_idx" ON "family_memberships" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "friendships_user_idx" ON "friendships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "friendships_friend_idx" ON "friendships" USING btree ("friend_id");--> statement-breakpoint
CREATE INDEX "invite_links_code_idx" ON "invite_links" USING btree ("code");--> statement-breakpoint
CREATE INDEX "invite_links_family_idx" ON "invite_links" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "media_submissions_family_idx" ON "media_submissions" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "media_submissions_status_idx" ON "media_submissions" USING btree ("status");