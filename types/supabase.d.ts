declare module '#supabase/server' {
    export { useSupabaseClient, serverSupabaseClient } from '@nuxtjs/supabase/dist/runtime/composables'
}
declare module '@supabase/supabase-js' {
    export { createClient, Session, User } from '@nuxtjs/supabase/dist/runtime/composables'
}