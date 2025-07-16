// * Generate types from live database
//  supabase gen types --lang=typescript --project-id YourProjectId > types/database.types.ts

// * Generate types when using local environment
//  supabase gen types --lang=typescript --local > types/database.types.ts

type xxxGenType = 'ds';
const _yyy: xxxGenType = 'ds';

/** // TODO: Implement these rls policies for supabase tables
 
    -- Add RLS policies (customize these based on your needs)
    ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
    ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
    ALTER TABLE temp_access ENABLE ROW LEVEL SECURITY;

    -- Example policies (adjust according to your requirements)
    CREATE POLICY "Plans are viewable by everyone"
        ON plans FOR SELECT
        TO authenticated
        USING (true);

    CREATE POLICY "Collaborators are viewable by family members"
        ON collaborators FOR SELECT
        TO authenticated
        USING (family_id IN (
            SELECT f.id FROM families f
            WHERE f.members @> ARRAY[auth.uid()]::uuid[]
        ));

    CREATE POLICY "Temp access viewable by creators"
        ON temp_access FOR SELECT
        TO authenticated
        USING (created_by = auth.uid());
*/