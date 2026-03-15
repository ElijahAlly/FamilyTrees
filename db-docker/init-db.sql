-- Enable UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Auth users table in the auth schema.
-- This is the primary user authentication table.
CREATE SCHEMA IF NOT EXISTS auth;

-- Auth users table for user management
CREATE TABLE auth.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    -- Add other fields if necessary to match what your app expects
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


-- TABLES (Order matters for foreign keys!)

CREATE TABLE public.families (
  id integer GENERATED ALWAYS AS IDENTITY,
  family_name character varying NOT NULL,
  members integer[] DEFAULT ARRAY[]::integer[], -- Person IDs (references people.id)
  admins uuid[] DEFAULT ARRAY[]::uuid[], -- Legacy, prefer family_roles table
  owner_id uuid, -- Denormalized owner for fast checks (FK to auth.users)
  visibility text DEFAULT 'private'::text CHECK (visibility = ANY (ARRAY['public'::text, 'private'::text])),
  access_code text,
  import_source jsonb,
  settings jsonb DEFAULT '{"allowMemberInvites": true, "minAdminsForApproval": 1, "requireMediaApproval": true}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  archived_at timestamp with time zone,
  created_by integer, -- This refers to public.people(id), so people table must exist
  CONSTRAINT families_pkey PRIMARY KEY (id),
  CONSTRAINT families_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);

CREATE TABLE public.people (
  id integer GENERATED ALWAYS AS IDENTITY,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  birth_date date,
  death_date date,
  gender character CHECK (gender = ANY (ARRAY['M'::bpchar, 'F'::bpchar, 'N'::bpchar, 'U'::bpchar])),
  mother_id integer, -- References public.people(id)
  father_id integer, -- References public.people(id)
  middle_name character varying DEFAULT NULL::character varying,
  is_living boolean NOT NULL DEFAULT true,
  pictures text[] NOT NULL DEFAULT '{}'::text[],
  user_id uuid, -- References auth.users(id)
  privacy_settings jsonb DEFAULT '{"familyView": true, "publicView": false, "friendsView": false, "timeBasedRules": [], "ageRestrictions": null}'::jsonb,
  claimed_by uuid, -- References auth.users(id)
  extended_info jsonb DEFAULT '{}'::jsonb,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_by uuid, -- References auth.users(id)
  updated_by uuid, -- References auth.users(id)
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  profile_picture text NOT NULL DEFAULT ''::text,
  CONSTRAINT people_pkey PRIMARY KEY (id),
  CONSTRAINT people_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT people_claimed_by_fkey FOREIGN KEY (claimed_by) REFERENCES auth.users(id),
  CONSTRAINT people_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT people_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

CREATE INDEX families_visibility_idx ON public.families (visibility);

-- Now add foreign key for families.created_by
ALTER TABLE public.families
ADD CONSTRAINT families_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.people(id);


CREATE TABLE public.marriages (
  id integer GENERATED ALWAYS AS IDENTITY,
  person1_id integer, -- References public.people(id)
  person2_id integer, -- References public.people(id)
  marriage_date date,
  divorce_date date,
  location text,
  marriage_type text CHECK (marriage_type = ANY (ARRAY['civil'::text, 'religious'::text, 'common-law'::text, 'unknown'::text])),
  documents jsonb DEFAULT '[]'::jsonb,
  created_by uuid, -- References auth.users(id)
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT marriages_pkey PRIMARY KEY (id),
  CONSTRAINT marriage_person1_id_fkey FOREIGN KEY (person1_id) REFERENCES public.people(id),
  CONSTRAINT marriage_person2_id_fkey FOREIGN KEY (person2_id) REFERENCES public.people(id),
  CONSTRAINT marriages_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE INDEX marriages_person1_idx ON public.marriages (person1_id);
CREATE INDEX marriages_person2_idx ON public.marriages (person2_id);

-- Self-referencing foreign keys for people
ALTER TABLE public.people
ADD CONSTRAINT person_father_id_fkey FOREIGN KEY (father_id) REFERENCES public.people(id);

ALTER TABLE public.people
ADD CONSTRAINT person_mother_id_fkey FOREIGN KEY (mother_id) REFERENCES public.people(id);


CREATE TABLE public.activity_logs (
  id integer GENERATED ALWAYS AS IDENTITY,
  person_id integer NOT NULL, -- References public.people(id)
  family_id integer NOT NULL, -- References public.families(id)
  action_type text NOT NULL,
  details jsonb,
  performed_by uuid, -- References auth.users(id) - the user who performed the action
  reason text, -- Optional reason for the action
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id),
  CONSTRAINT activity_logs_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id),
  CONSTRAINT activity_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id)
);

CREATE INDEX activity_logs_family_idx ON public.activity_logs(family_id);
CREATE INDEX activity_logs_created_at_idx ON public.activity_logs(created_at DESC);

CREATE TABLE public.collaborators (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  family_id integer, -- References public.families(id)
  user_id uuid, -- References auth.users(id)
  role text NOT NULL CHECK (role = ANY (ARRAY['viewer'::text, 'editor'::text, 'admin'::text])),
  added_by uuid, -- References auth.users(id)
  added_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT collaborators_pkey PRIMARY KEY (id),
  CONSTRAINT collaborators_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id),
  CONSTRAINT collaborators_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT collaborators_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id)
);

CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL,
  max_family_members integer NOT NULL,
  max_family_trees integer NOT NULL,
  max_generations integer NOT NULL,
  max_storage_gb integer NOT NULL,
  features jsonb NOT NULL,
  billing_cycle text NOT NULL CHECK (billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  has_media_upload boolean DEFAULT false,
  max_media_size_per_upload integer,
  bulk_upload_enabled boolean DEFAULT false,
  media_requires_approval boolean DEFAULT true,
  privacy_controls jsonb NOT NULL,
  max_admins integer NOT NULL,
  can_invite_collaborators integer NOT NULL,
  temp_access_enabled boolean DEFAULT false,
  max_temp_access_users integer,
  data_import jsonb NOT NULL,
  can_export boolean DEFAULT false,
  export_formats text[],
  family_merge_enabled boolean DEFAULT false,
  family_archive_enabled boolean DEFAULT false,
  family_audit_log boolean DEFAULT false,
  dispute_resolution boolean DEFAULT false,
  support_level text CHECK (support_level = ANY (ARRAY['basic'::text, 'priority'::text, 'dedicated'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  sort_ids integer DEFAULT 999,
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);

CREATE TABLE public.temp_access (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  access_type text NOT NULL CHECK (access_type = ANY (ARRAY['family'::text, 'person'::text])),
  target_id uuid NOT NULL, -- This UUID could refer to a family (id) or a person (id from public.people if UUID)
  expires_at timestamp with time zone NOT NULL,
  max_visits integer,
  visits_used integer DEFAULT 0,
  created_by uuid, -- References auth.users(id)
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT temp_access_pkey PRIMARY KEY (id),
  CONSTRAINT temp_access_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE INDEX temp_access_email_idx ON public.temp_access(email);
CREATE INDEX temp_access_target_idx ON public.temp_access(target_id);


-- TRIGGERS (These will need to be associated with functions)

-- Create the shared function for updating 'updated_at' columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_families_updated_at
BEFORE UPDATE ON public.families
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marriages_updated_at
BEFORE UPDATE ON public.marriages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_people_updated_at
BEFORE UPDATE ON public.people
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Custom Functions (like the random people one)
CREATE OR REPLACE FUNCTION get_random_people_efficient(
    num_results INT,
    sample_percentage NUMERIC DEFAULT 0.05
)
RETURNS SETOF people
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM people TABLESAMPLE SYSTEM (sample_percentage)
  ORDER BY RANDOM()
  LIMIT num_results;
END;
$$;


CREATE OR REPLACE FUNCTION check_user_exists(check_email text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN exists (
    SELECT 1 from auth.users
    where email = check_email
  );
END;
$$;


-- === New tables for family member confirmation logic ===

CREATE TYPE claim_request_status AS ENUM ('pending', 'approved', 'denied', 'cancelled');
CREATE TYPE claim_request_type AS ENUM ('claim_person', 'join_family', 'add_self_to_family');
CREATE TYPE family_kind AS ENUM ('relatives', 'friends');
CREATE TYPE invite_type_enum AS ENUM ('family', 'person');
CREATE TYPE membership_status AS ENUM ('active', 'pending', 'removed');
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE media_submission_status AS ENUM ('pending', 'approved', 'denied');


CREATE TABLE public.claim_requests (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type claim_request_type NOT NULL,
  status claim_request_status NOT NULL DEFAULT 'pending',
  message text,
  review_notes text,
  auth_provider text,
  required_approvals integer NOT NULL DEFAULT 1,
  current_approvals integer NOT NULL DEFAULT 0,
  reviewed_by uuid[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  resolved_at timestamp with time zone,
  requester_id uuid NOT NULL REFERENCES auth.users(id),
  person_id integer REFERENCES public.people(id),
  family_id integer REFERENCES public.families(id)
);

CREATE INDEX claim_requests_requester_idx ON public.claim_requests(requester_id);
CREATE INDEX claim_requests_family_idx ON public.claim_requests(family_id);
CREATE INDEX claim_requests_status_idx ON public.claim_requests(status);


CREATE TABLE public.family_memberships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind family_kind NOT NULL DEFAULT 'relatives',
  status membership_status NOT NULL DEFAULT 'active',
  joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  removed_at timestamp with time zone,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  family_id integer NOT NULL REFERENCES public.families(id),
  person_id integer REFERENCES public.people(id)
);

CREATE INDEX family_memberships_user_idx ON public.family_memberships(user_id);
CREATE INDEX family_memberships_family_idx ON public.family_memberships(family_id);


CREATE TABLE public.invite_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type invite_type_enum NOT NULL,
  code text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  family_id integer NOT NULL REFERENCES public.families(id),
  person_id integer REFERENCES public.people(id),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX invite_links_code_idx ON public.invite_links(code);
CREATE INDEX invite_links_family_idx ON public.invite_links(family_id);


CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  friend_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX friendships_user_idx ON public.friendships(user_id);
CREATE INDEX friendships_friend_idx ON public.friendships(friend_id);


CREATE TABLE public.media_submissions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  media_url text NOT NULL,
  caption text,
  content_rating text, -- 'general', 'teen', 'adult'
  status media_submission_status NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  reviewed_at timestamp with time zone,
  family_id integer NOT NULL REFERENCES public.families(id),
  person_id integer REFERENCES public.people(id), -- which person this media is for
  submitted_by uuid NOT NULL REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id)
);

CREATE INDEX media_submissions_family_idx ON public.media_submissions(family_id);
CREATE INDEX media_submissions_status_idx ON public.media_submissions(status);


-- === Family Roles ===
CREATE TYPE family_role AS ENUM ('owner', 'banker', 'admin', 'member', 'guest');

CREATE TABLE public.family_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id integer NOT NULL REFERENCES public.families(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role family_role NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT family_roles_family_user_unique UNIQUE (family_id, user_id)
);

CREATE INDEX family_roles_family_idx ON public.family_roles(family_id);
CREATE INDEX family_roles_user_idx ON public.family_roles(user_id);
CREATE INDEX family_roles_family_user_idx ON public.family_roles(family_id, user_id);

CREATE TRIGGER update_family_roles_updated_at
BEFORE UPDATE ON public.family_roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- === Merge Requests ===
CREATE TYPE merge_request_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

CREATE TABLE public.merge_requests (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status merge_request_status NOT NULL DEFAULT 'pending',
  source_family_id integer NOT NULL REFERENCES public.families(id),
  target_family_id integer NOT NULL REFERENCES public.families(id),
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  reviewed_by uuid[] NOT NULL DEFAULT '{}',
  conflicts jsonb NOT NULL DEFAULT '[]',
  resolutions jsonb NOT NULL DEFAULT '{}',
  merge_notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  completed_at timestamp with time zone
);

CREATE INDEX merge_requests_source_idx ON public.merge_requests(source_family_id);
CREATE INDEX merge_requests_target_idx ON public.merge_requests(target_family_id);
CREATE INDEX merge_requests_status_idx ON public.merge_requests(status);


-- === Data Imports ===
CREATE TYPE import_status AS ENUM ('pending_review', 'confirmed', 'cancelled');

CREATE TABLE public.data_imports (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source text NOT NULL,
  status import_status NOT NULL DEFAULT 'pending_review',
  family_id integer NOT NULL REFERENCES public.families(id),
  imported_by uuid NOT NULL REFERENCES auth.users(id),
  raw_data jsonb NOT NULL,
  reviewed_data jsonb,
  import_summary jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  confirmed_at timestamp with time zone
);

CREATE INDEX data_imports_family_idx ON public.data_imports(family_id);
CREATE INDEX data_imports_status_idx ON public.data_imports(status);


-- Triggers for new tables
CREATE TRIGGER update_claim_requests_updated_at
BEFORE UPDATE ON public.claim_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merge_requests_updated_at
BEFORE UPDATE ON public.merge_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- OTP codes for email verification
CREATE TABLE public.otp_codes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX otp_codes_email_idx ON public.otp_codes (email);

-- Finalizing Foreign Keys that reference public.people before its self-references
-- This assumes public.people.id is integer, but some FKs from other tables might use UUID for users
-- Clarification needed: families.members, people.user_id, people.claimed_by, people.created_by, people.updated_by refer to auth.users.id (UUID)
-- marriages.created_by, collaborators.user_id, collaborators.added_by, temp_access.created_by refer to auth.users.id (UUID)
-- So the types are correct as is, with auth.users.id as UUID.