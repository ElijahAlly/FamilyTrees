# Recommendations (Architecture & Features)                                                                                                                                     

##  Critical / Security
                                                                                                                                                                                  
  1. Implement proper authentication middleware - Every API route currently trusts userId from the request body/query. Anyone can impersonate any user by sending a different     
  UUID. Add JWT/session middleware that sets an authenticated user context, and stop accepting userId as a parameter.                                                             
  2. OTP verification is broken for production - server/api/auth/verify-otp.post.ts:18-20 returns an error for all non-dev environments. Wire up a real OTP provider (Brevo or Resend) before deploying.                                                                                                                             
  3. Authorization checks missing on write endpoints - add-to-family, delete-profile, update-privacy, update-extended-info, and add-pictures-to-person don't verify the caller has
   permission. Any authenticated user can modify any family/person.                                                                                                               
  4. Dual-write inconsistency - families.admins array and familyRoles table can get out of sync. Some endpoints check admins array (invites, temp-access, imports), others use  
  familyRoles. Migrate to a single source of truth (familyRoles table) and add a migration to deprecate the array.                                                                

##  High Priority                                                                                                                                                                   
                                                                                                                                                                                
  5. Add rate limiting - Login, OTP verification, and invite endpoints have no rate limiting, enabling brute-force attacks.                                                       
  6. Add input validation library - Use zod with h3 for consistent request validation across all endpoints instead of manual if (!field) checks.
  7. Replace window.location.reload() - FamilyDetails.vue:36 and PersonInfoSidebar.vue:45 do full page reloads after adding a person. Instead, emit events to refetch the tree    
  data and re-render.                                                                                                                                                             
  8. Add error boundaries - Most async operations in Vue components silently console.error. Add user-visible error states/toasts for failed API calls.                            

##  Medium Priority                                                                                                                                                               
                                                                                                                                                                                  
  9. Add database indexes - Add indexes for frequently queried columns like familyMemberships(userId), claimRequests(requesterId), activityLogs(familyId) that aren't covered by  
  the init-db.sql indexes.
  11. Use useFetch/useAsyncData instead of raw $fetch in stores/components where appropriate - this gives Nuxt SSR hydration, automatic deduplication, and built-in loading/error states.
  12. Add Pinia persistence for claims store - useClaimsStore doesn't persist, so membership/claim state is lost on refresh.                                                      
  13. Type safety for API responses - Most $fetch calls cast results with as any. Define shared response types and use Nuxt's typed $fetch with nitro route rules.                

##  Low Priority                                                                                                                                                                    
                                                                                                                                                                                  
  14. Remove db-docker/postgres-data from git history - The files are gitignored now, but hundreds of binary files bloat the repo. Consider git filter-branch or BFG Repo Cleaner 
  to remove them from history.                                                                                                                                                  
  15. Add .env.example - The .env is gitignored but there's no example file documenting required environment variables.                                                           
  16. Galaxy generator / 3D visualization - The Three.js GalacticPeople component is a nice touch but may be pulling in a large bundle. Consider lazy-loading it.                 
  17. Add aria-label and keyboard navigation - Several interactive elements (color pickers, tree nodes, sidebar toggles) lack accessibility attributes.                           
   

CBA storage collections number 2402022760