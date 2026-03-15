import { pgTable, text, timestamp, integer, boolean, uuid, jsonb, varchar, date, numeric, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

// === Enums ===
export const roleEnum = pgEnum('role', ['viewer', 'editor', 'admin']);
export const visibilityEnum = pgEnum('visibility', ['public', 'private']);
export const marriageTypeEnum = pgEnum('marriage_type', ['civil', 'religious', 'common-law', 'unknown']);
export const genderEnum = pgEnum('gender', ['M', 'F', 'N', 'U']);
export const billingCycleEnum = pgEnum('billing_cycle', ['monthly', 'yearly']);
export const accessTypeEnum = pgEnum('access_type', ['family', 'person']);
export const supportLevelEnum = pgEnum('support_level', ['basic', 'priority', 'dedicated']);
export const claimRequestStatusEnum = pgEnum('claim_request_status', ['pending', 'approved', 'denied', 'cancelled']);
export const claimRequestTypeEnum = pgEnum('claim_request_type', ['claim_person', 'join_family', 'add_self_to_family']);
export const familyKindEnum = pgEnum('family_kind', ['relatives', 'friends']);
export const inviteTypeEnum = pgEnum('invite_type', ['family', 'person']);
export const membershipStatusEnum = pgEnum('membership_status', ['active', 'pending', 'removed']);
export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted', 'blocked']);
export const mediaSubmissionStatusEnum = pgEnum('media_submission_status', ['pending', 'approved', 'denied']);
export const familyRoleEnum = pgEnum('family_role', ['owner', 'banker', 'admin', 'member', 'guest']);

// === Auth Users Table (Drizzle will map to auth.users) ===
export const authUsers = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('users_email_idx').on(table.email),
]);

// === Tables ===
export const people = pgTable('people', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  middleName: varchar('middle_name', { length: 255 }),
  birthDate: date('birth_date', { mode: 'string' }),
  deathDate: date('death_date', { mode: 'string' }),
  gender: genderEnum('gender'),
  isLiving: boolean('is_living').notNull().default(true),
  pictures: text('pictures').array().notNull().default([]),
  profilePicture: text('profile_picture').notNull().default(''),
  privacySettings: jsonb('privacy_settings').default({
    familyView: true,
    publicView: false,
    friendsView: false,
    timeBasedRules: [],
    ageRestrictions: null,
    requireSameLastName: false
  }).notNull(),
  extendedInfo: jsonb('extended_info').default({}).notNull(),
  preferences: jsonb('preferences').default({}).notNull(),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),

  motherId: integer('mother_id'),
  fatherId: integer('father_id'),
  userId: uuid('user_id').references(() => authUsers.id),
  claimedBy: uuid('claimed_by').references(() => authUsers.id),
  createdBy: uuid('created_by').references(() => authUsers.id),
  updatedBy: uuid('updated_by').references(() => authUsers.id),
},
  (table) => [
    index('people_user_id_idx').on(table.userId),
    index('people_mother_id_idx').on(table.motherId),
    index('people_father_id_idx').on(table.fatherId),
  ]
);

// Relations for people (e.g., children, marriages)
export const peopleRelations = relations(people, ({ one, many }) => ({
    mother: one(people, { fields: [people.motherId], references: [people.id], relationName: 'mother' }),
    father: one(people, { fields: [people.fatherId], references: [people.id], relationName: 'father' }),
    childrenAsMother: many(people, { relationName: 'mother' }), // For reverse lookups
    childrenAsFather: many(people, { relationName: 'father' }), // For reverse lookups
    user: one(authUsers, { fields: [people.userId], references: [authUsers.id] }),
    claimedByUser: one(authUsers, { fields: [people.claimedBy], references: [authUsers.id], relationName: 'claimedBy' }),
    createdByUser: one(authUsers, { fields: [people.createdBy], references: [authUsers.id], relationName: 'createdBy' }),
    updatedByUser: one(authUsers, { fields: [people.updatedBy], references: [authUsers.id], relationName: 'updatedBy' }),
    marriagesAsPerson1: many(marriages, { relationName: 'person1' }),
    marriagesAsPerson2: many(marriages, { relationName: 'person2' }),
    familiesCreated: many(families)
}));


export const families = pgTable('families', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  familyName: varchar('family_name', { length: 255 }).notNull(),
  members: integer('members').array().default([]), // Person IDs (references people.id)
  admins: uuid('admins').array().default([]).notNull(), // Legacy - prefer family_roles table
  ownerId: uuid('owner_id').references(() => authUsers.id), // Denormalized owner for fast checks
  visibility: visibilityEnum('visibility').default('private').notNull(),
  accessCode: text('access_code'),
  importSource: jsonb('import_source'),
  settings: jsonb('settings').default({ 
      allowMemberInvites: true, 
      minAdminsForApproval: 1, 
      requireMediaApproval: true 
  }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdBy: integer('created_by').references(() => people.id), // References public.people.id
}, (table) => [
  index('families_visibility_idx').on(table.visibility),
]);

export const familiesRelations = relations(families, ({ one, many }) => ({
    creator: one(people, { fields: [families.createdBy], references: [people.id] }),
    collaborators: many(collaborators)
}));


export const marriages = pgTable('marriages', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  marriageDate: date('marriage_date', { mode: 'string' }),
  divorceDate: date('divorce_date', { mode: 'string' }),
  location: text('location'),
  marriageType: marriageTypeEnum('marriage_type'),
  documents: jsonb('documents').default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),

  // Foreign Keys
  person1Id: integer('person1_id').references(() => people.id, { onDelete: 'set null' }),
  person2Id: integer('person2_id').references(() => people.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').references(() => authUsers.id)
}, (table) => [
  index('marriages_person1_idx').on(table.person1Id),
  index('marriages_person2_idx').on(table.person2Id),
]);

export const marriagesRelations = relations(marriages, ({ one }) => ({
    person1: one(people, { fields: [marriages.person1Id], references: [people.id], relationName: 'person1' }),
    person2: one(people, { fields: [marriages.person2Id], references: [people.id], relationName: 'person2' }),
    creator: one(authUsers, { fields: [marriages.createdBy], references: [authUsers.id] })
}));


export const activityLogs = pgTable('activity_logs', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  actionType: text('action_type').notNull(),
  details: jsonb('details'),
  performedBy: uuid('performed_by').references(() => authUsers.id),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  // Foreign Keys
  personId: integer('person_id').references(() => people.id).notNull(),
  familyId: integer('family_id').references(() => families.id).notNull(),
}, (table) => [
  index('activity_logs_family_idx').on(table.familyId),
  index('activity_logs_created_at_idx').on(table.createdAt),
]);

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
    person: one(people, { fields: [activityLogs.personId], references: [people.id] }),
    family: one(families, { fields: [activityLogs.familyId], references: [families.id] }),
    performer: one(authUsers, { fields: [activityLogs.performedBy], references: [authUsers.id] }),
}));


export const collaborators = pgTable('collaborators', {
  id: uuid('id').primaryKey().defaultRandom(),
  role: roleEnum('role').notNull(),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow(),

  // Foreign Keys
  familyId: integer('family_id').references(() => families.id),
  userId: uuid('user_id').references(() => authUsers.id),
  addedBy: uuid('added_by').references(() => authUsers.id),
});

export const collaboratorsRelations = relations(collaborators, ({ one }) => ({
    family: one(families, { fields: [collaborators.familyId], references: [families.id] }),
    user: one(authUsers, { fields: [collaborators.userId], references: [authUsers.id] }),
    adder: one(authUsers, { fields: [collaborators.addedBy], references: [authUsers.id] })
}));


export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  price: numeric('price').notNull(),
  maxFamilyMembers: integer('max_family_members').notNull(),
  maxFamilyTrees: integer('max_family_trees').notNull(),
  maxGenerations: integer('max_generations').notNull(),
  maxStorageGb: integer('max_storage_gb').notNull(),
  features: jsonb('features').notNull(),
  billingCycle: billingCycleEnum('billing_cycle').notNull(),
  hasMediaUpload: boolean('has_media_upload').default(false),
  maxMediaSizePerUpload: integer('max_media_size_per_upload'),
  bulkUploadEnabled: boolean('bulk_upload_enabled').default(false),
  mediaRequiresApproval: boolean('media_requires_approval').default(true),
  privacyControls: jsonb('privacy_controls').notNull(),
  maxAdmins: integer('max_admins').notNull(),
  canInviteCollaborators: integer('can_invite_collaborators').notNull(),
  tempAccessEnabled: boolean('temp_access_enabled').default(false),
  maxTempAccessUsers: integer('max_temp_access_users'),
  dataImport: jsonb('data_import').notNull(),
  canExport: boolean('can_export').default(false),
  exportFormats: text('export_formats').array(),
  familyMergeEnabled: boolean('family_merge_enabled').default(false),
  familyArchiveEnabled: boolean('family_archive_enabled').default(false),
  familyAuditLog: boolean('family_audit_log').default(false),
  disputeResolution: boolean('dispute_resolution').default(false),
  supportLevel: supportLevelEnum('support_level'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  sortIds: integer('sort_ids').default(999),
});


export const tempAccess = pgTable('temp_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  accessType: accessTypeEnum('access_type').notNull(),
  targetId: uuid('target_id').notNull(), // Stores family or person ID as string
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  maxVisits: integer('max_visits'),
  visitsUsed: integer('visits_used').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  // Foreign Keys
  createdBy: uuid('created_by').references(() => authUsers.id),
}, (table) => [
  index('temp_access_email_idx').on(table.email),
  index('temp_access_target_idx').on(table.targetId),
]);

export const tempAccessRelations = relations(tempAccess, ({ one }) => ({
    creator: one(authUsers, { fields: [tempAccess.createdBy], references: [authUsers.id] })
}));

// === Claim Requests ===
// Tracks requests to claim a person or join/add-self to a family
export const claimRequests = pgTable('claim_requests', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  type: claimRequestTypeEnum('type').notNull(),
  status: claimRequestStatusEnum('status').default('pending').notNull(),
  message: text('message'),
  reviewNotes: text('review_notes'),
  authProvider: text('auth_provider'),
  requiredApprovals: integer('required_approvals').default(1).notNull(),
  currentApprovals: integer('current_approvals').default(0).notNull(),
  reviewedBy: uuid('reviewed_by').array().default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),

  // Foreign Keys
  requesterId: uuid('requester_id').references(() => authUsers.id).notNull(),
  personId: integer('person_id').references(() => people.id),
  familyId: integer('family_id').references(() => families.id),
}, (table) => [
  index('claim_requests_requester_idx').on(table.requesterId),
  index('claim_requests_family_idx').on(table.familyId),
  index('claim_requests_status_idx').on(table.status),
]);

export const claimRequestsRelations = relations(claimRequests, ({ one }) => ({
  requester: one(authUsers, { fields: [claimRequests.requesterId], references: [authUsers.id] }),
  person: one(people, { fields: [claimRequests.personId], references: [people.id] }),
  family: one(families, { fields: [claimRequests.familyId], references: [families.id] }),
}));


// === Family Memberships ===
// Links a user to a family (after a claim is approved or when they create one)
export const familyMemberships = pgTable('family_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: familyKindEnum('kind').default('relatives').notNull(),
  status: membershipStatusEnum('status').default('active').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  removedAt: timestamp('removed_at', { withTimezone: true }),

  // Foreign Keys
  userId: uuid('user_id').references(() => authUsers.id).notNull(),
  familyId: integer('family_id').references(() => families.id).notNull(),
  personId: integer('person_id').references(() => people.id),
}, (table) => [
  index('family_memberships_user_idx').on(table.userId),
  index('family_memberships_family_idx').on(table.familyId),
]);

export const familyMembershipsRelations = relations(familyMemberships, ({ one }) => ({
  user: one(authUsers, { fields: [familyMemberships.userId], references: [authUsers.id] }),
  family: one(families, { fields: [familyMemberships.familyId], references: [families.id] }),
  person: one(people, { fields: [familyMemberships.personId], references: [people.id] }),
}));


// === Invite Links ===
// Sharable links for joining a family or claiming a person
export const inviteLinks = pgTable('invite_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: inviteTypeEnum('type').notNull(),
  code: text('code').unique().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  maxUses: integer('max_uses'),
  usesCount: integer('uses_count').default(0).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  // Foreign Keys
  familyId: integer('family_id').references(() => families.id).notNull(),
  personId: integer('person_id').references(() => people.id),
  createdBy: uuid('created_by').references(() => authUsers.id).notNull(),
}, (table) => [
  index('invite_links_code_idx').on(table.code),
  index('invite_links_family_idx').on(table.familyId),
]);

export const inviteLinksRelations = relations(inviteLinks, ({ one }) => ({
  family: one(families, { fields: [inviteLinks.familyId], references: [families.id] }),
  person: one(people, { fields: [inviteLinks.personId], references: [people.id] }),
  creator: one(authUsers, { fields: [inviteLinks.createdBy], references: [authUsers.id] }),
}));


// === Friendships ===
// Friend connections between users (for friends view privacy)
export const friendships = pgTable('friendships', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: friendshipStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),

  // Foreign Keys
  userId: uuid('user_id').references(() => authUsers.id).notNull(),
  friendId: uuid('friend_id').references(() => authUsers.id).notNull(),
}, (table) => [
  index('friendships_user_idx').on(table.userId),
  index('friendships_friend_idx').on(table.friendId),
]);

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(authUsers, { fields: [friendships.userId], references: [authUsers.id], relationName: 'friendshipUser' }),
  friend: one(authUsers, { fields: [friendships.friendId], references: [authUsers.id], relationName: 'friendshipFriend' }),
}));


// === Family Roles ===
// Tracks per-family per-user role assignments (Owner, Banker, Admin, Member, Guest)
export const familyRoles = pgTable('family_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  role: familyRoleEnum('role').notNull(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),

  // Foreign Keys
  familyId: integer('family_id').references(() => families.id).notNull(),
  userId: uuid('user_id').references(() => authUsers.id).notNull(),
  assignedBy: uuid('assigned_by').references(() => authUsers.id),
}, (table) => [
  index('family_roles_family_idx').on(table.familyId),
  index('family_roles_user_idx').on(table.userId),
  index('family_roles_family_user_idx').on(table.familyId, table.userId),
]);

export const familyRolesRelations = relations(familyRoles, ({ one }) => ({
  family: one(families, { fields: [familyRoles.familyId], references: [families.id] }),
  user: one(authUsers, { fields: [familyRoles.userId], references: [authUsers.id] }),
  assigner: one(authUsers, { fields: [familyRoles.assignedBy], references: [authUsers.id], relationName: 'roleAssigner' }),
}));


// === Media Submissions ===
// For photo approval workflow when non-admins add pictures
export const mediaSubmissions = pgTable('media_submissions', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  mediaUrl: text('media_url').notNull(),
  caption: text('caption'),
  contentRating: text('content_rating'), // 'general', 'teen', 'adult'
  status: mediaSubmissionStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),

  // Foreign Keys
  familyId: integer('family_id').references(() => families.id).notNull(),
  personId: integer('person_id').references(() => people.id), // which person this media is for
  submittedBy: uuid('submitted_by').references(() => authUsers.id).notNull(),
  reviewedBy: uuid('reviewed_by').references(() => authUsers.id),
}, (table) => [
  index('media_submissions_family_idx').on(table.familyId),
  index('media_submissions_status_idx').on(table.status),
]);

export const mediaSubmissionsRelations = relations(mediaSubmissions, ({ one }) => ({
  family: one(families, { fields: [mediaSubmissions.familyId], references: [families.id] }),
  submitter: one(authUsers, { fields: [mediaSubmissions.submittedBy], references: [authUsers.id] }),
  reviewer: one(authUsers, { fields: [mediaSubmissions.reviewedBy], references: [authUsers.id] }),
}));


// === Merge Requests ===
// Tracks requests to merge two duplicate families
export const mergeRequestStatusEnum = pgEnum('merge_request_status', ['pending', 'approved', 'rejected', 'completed']);

export const mergeRequests = pgTable('merge_requests', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  status: mergeRequestStatusEnum('status').default('pending').notNull(),
  sourceFamilyId: integer('source_family_id').references(() => families.id).notNull(),
  targetFamilyId: integer('target_family_id').references(() => families.id).notNull(),
  requestedBy: uuid('requested_by').references(() => authUsers.id).notNull(),
  reviewedBy: uuid('reviewed_by').array().default([]).notNull(),
  conflicts: jsonb('conflicts').default([]).notNull(), // Array of {field, sourceValue, targetValue, resolution}
  resolutions: jsonb('resolutions').default({}).notNull(), // Resolved conflict choices
  mergeNotes: text('merge_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => [
  index('merge_requests_source_idx').on(table.sourceFamilyId),
  index('merge_requests_target_idx').on(table.targetFamilyId),
  index('merge_requests_status_idx').on(table.status),
]);

export const mergeRequestsRelations = relations(mergeRequests, ({ one }) => ({
  sourceFamily: one(families, { fields: [mergeRequests.sourceFamilyId], references: [families.id], relationName: 'mergeSource' }),
  targetFamily: one(families, { fields: [mergeRequests.targetFamilyId], references: [families.id], relationName: 'mergeTarget' }),
  requester: one(authUsers, { fields: [mergeRequests.requestedBy], references: [authUsers.id] }),
}));


// === Data Imports ===
// Tracks import jobs from external sources
export const importStatusEnum = pgEnum('import_status', ['pending_review', 'confirmed', 'cancelled']);

export const dataImports = pgTable('data_imports', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  source: text('source').notNull(), // 'ancestry', 'familysearch', 'csv', 'gedcom'
  status: importStatusEnum('status').default('pending_review').notNull(),
  familyId: integer('family_id').references(() => families.id).notNull(),
  importedBy: uuid('imported_by').references(() => authUsers.id).notNull(),
  rawData: jsonb('raw_data').notNull(), // Original parsed data
  reviewedData: jsonb('reviewed_data'), // User-modified data after review
  importSummary: jsonb('import_summary'), // Stats: people added, marriages added, etc.
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
}, (table) => [
  index('data_imports_family_idx').on(table.familyId),
  index('data_imports_status_idx').on(table.status),
]);

export const dataImportsRelations = relations(dataImports, ({ one }) => ({
  family: one(families, { fields: [dataImports.familyId], references: [families.id] }),
  importer: one(authUsers, { fields: [dataImports.importedBy], references: [authUsers.id] }),
}));


// === OTP Codes ===
// Temporary OTP codes for email verification
export const otpCodes = pgTable('otp_codes', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('otp_codes_email_idx').on(table.email),
]);


// Types for Drizzle
export type SelectPerson = InferSelectModel<typeof people>;
export type InsertPerson = InferInsertModel<typeof people>;
export type SelectFamily = InferSelectModel<typeof families>;
export type InsertFamily = InferInsertModel<typeof families>;
export type SelectMarriage = InferSelectModel<typeof marriages>;
export type InsertMarriage = InferInsertModel<typeof marriages>;
export type SelectActivityLog = InferSelectModel<typeof activityLogs>;
export type InsertActivityLog = InferInsertModel<typeof activityLogs>;
export type SelectCollaborator = InferSelectModel<typeof collaborators>;
export type InsertCollaborator = InferInsertModel<typeof collaborators>;
export type SelectPlan = InferSelectModel<typeof plans>;
export type InsertPlan = InferInsertModel<typeof plans>;
export type SelectTempAccess = InferSelectModel<typeof tempAccess>;
export type InsertTempAccess = InferInsertModel<typeof tempAccess>;
export type SelectAuthUser = InferSelectModel<typeof authUsers>;
export type InsertAuthUser = InferInsertModel<typeof authUsers>;
export type SelectClaimRequest = InferSelectModel<typeof claimRequests>;
export type InsertClaimRequest = InferInsertModel<typeof claimRequests>;
export type SelectFamilyMembership = InferSelectModel<typeof familyMemberships>;
export type InsertFamilyMembership = InferInsertModel<typeof familyMemberships>;
export type SelectInviteLink = InferSelectModel<typeof inviteLinks>;
export type InsertInviteLink = InferInsertModel<typeof inviteLinks>;
export type SelectFriendship = InferSelectModel<typeof friendships>;
export type InsertFriendship = InferInsertModel<typeof friendships>;
export type SelectMediaSubmission = InferSelectModel<typeof mediaSubmissions>;
export type InsertMediaSubmission = InferInsertModel<typeof mediaSubmissions>;
export type SelectMergeRequest = InferSelectModel<typeof mergeRequests>;
export type InsertMergeRequest = InferInsertModel<typeof mergeRequests>;
export type SelectDataImport = InferSelectModel<typeof dataImports>;
export type InsertDataImport = InferInsertModel<typeof dataImports>;
export type SelectFamilyRole = InferSelectModel<typeof familyRoles>;
export type InsertFamilyRole = InferInsertModel<typeof familyRoles>;