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


-- Sequences for families, marriages, people auto-increment IDs
CREATE SEQUENCE IF NOT EXISTS family_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS marriage_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS person_id_seq START 1;


-- TABLES (Order matters for foreign keys!)

CREATE TABLE public.families (
  id integer NOT NULL DEFAULT nextval('family_id_seq'::regclass),
  family_name character varying NOT NULL,
  members uuid[], -- Assuming members refer to user UUIDs or person IDs
  admins uuid[] DEFAULT ARRAY[]::uuid[],
  visibility text DEFAULT 'private'::text CHECK (visibility = ANY (ARRAY['public'::text, 'private'::text])),
  access_code text,
  import_source jsonb,
  settings jsonb DEFAULT '{"allowMemberInvites": true, "minAdminsForApproval": 1, "requireMediaApproval": true}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  archived_at timestamp with time zone,
  created_by integer, -- This refers to public.people(id), so people table must exist
  CONSTRAINT families_pkey PRIMARY KEY (id)
);

CREATE TABLE public.people (
  id integer NOT NULL DEFAULT nextval('person_id_seq'::regclass),
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

-- Now add foreign key for families.created_by
ALTER TABLE public.families
ADD CONSTRAINT families_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.people(id);


CREATE TABLE public.marriages (
  id integer NOT NULL DEFAULT nextval('marriage_id_seq'::regclass),
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

-- Self-referencing foreign keys for people
ALTER TABLE public.people
ADD CONSTRAINT person_father_id_fkey FOREIGN KEY (father_id) REFERENCES public.people(id);

ALTER TABLE public.people
ADD CONSTRAINT person_mother_id_fkey FOREIGN KEY (mother_id) REFERENCES public.people(id);


CREATE TABLE public.activity_logs (
  id integer NOT NULL, -- Assuming this is auto-incrementing; if not, you'll need a sequence for it too
  person_id integer NOT NULL, -- References public.people(id)
  family_id integer NOT NULL, -- References public.families(id)
  action_type text NOT NULL,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id),
  CONSTRAINT activity_logs_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id)
);

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


-- Finalizing Foreign Keys that reference public.people before its self-references
-- This assumes public.people.id is integer, but some FKs from other tables might use UUID for users
-- Clarification needed: families.members, people.user_id, people.claimed_by, people.created_by, people.updated_by refer to auth.users.id (UUID)
-- marriages.created_by, collaborators.user_id, collaborators.added_by, temp_access.created_by refer to auth.users.id (UUID)
-- So the types are correct as is, with auth.users.id as UUID.