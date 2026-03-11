import { pgTable, text, timestamp, integer, boolean, uuid, jsonb, serial, varchar, date, numeric, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

// === Enums ===
export const roleEnum = pgEnum('role', ['viewer', 'editor', 'admin']);
export const visibilityEnum = pgEnum('visibility', ['public', 'private']);
export const marriageTypeEnum = pgEnum('marriage_type', ['civil', 'religious', 'common-law', 'unknown']);
export const genderEnum = pgEnum('gender', ['M', 'F', 'N', 'U']);
export const billingCycleEnum = pgEnum('billing_cycle', ['monthly', 'yearly']);
export const accessTypeEnum = pgEnum('access_type', ['family', 'person']);
export const supportLevelEnum = pgEnum('support_level', ['basic', 'priority', 'dedicated']);

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
  id: serial('id').primaryKey(),
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
    ageRestrictions: null
  }).notNull(),
  extendedInfo: jsonb('extended_info').default({}).notNull(),
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
  id: serial('id').primaryKey(), // serial matches nextval('family_id_seq')
  familyName: varchar('family_name', { length: 255 }).notNull(),
  members: uuid('members').array(), // Assuming these are user IDs
  admins: uuid('admins').array().default([]).notNull(),
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
});

export const familiesRelations = relations(families, ({ one, many }) => ({
    creator: one(people, { fields: [families.createdBy], references: [people.id] }),
    collaborators: many(collaborators)
}));


export const marriages = pgTable('marriages', {
  id: serial('id').primaryKey(), // serial matches nextval('marriage_id_seq')
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
});

export const marriagesRelations = relations(marriages, ({ one }) => ({
    person1: one(people, { fields: [marriages.person1Id], references: [people.id], relationName: 'person1' }),
    person2: one(people, { fields: [marriages.person2Id], references: [people.id], relationName: 'person2' }),
    creator: one(authUsers, { fields: [marriages.createdBy], references: [authUsers.id] })
}));


export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  actionType: text('action_type').notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  // Foreign Keys
  personId: integer('person_id').references(() => people.id).notNull(),
  familyId: integer('family_id').references(() => families.id).notNull(),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
    person: one(people, { fields: [activityLogs.personId], references: [people.id] }),
    family: one(families, { fields: [activityLogs.familyId], references: [families.id] })
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
  targetId: uuid('target_id').notNull(), // Assuming this references auth.users.id or family.id (UUID)
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  maxVisits: integer('max_visits'),
  visitsUsed: integer('visits_used').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  // Foreign Keys
  createdBy: uuid('created_by').references(() => authUsers.id),
});

export const tempAccessRelations = relations(tempAccess, ({ one }) => ({
    creator: one(authUsers, { fields: [tempAccess.createdBy], references: [authUsers.id] })
}));

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