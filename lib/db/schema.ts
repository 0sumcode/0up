import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, integer, bigint, index } from 'drizzle-orm/pg-core';

export const uploads = pgTable(
  'upload',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    hash: text('hash').notNull(),
    expireAt: timestamp('expire_at', { withTimezone: true }).notNull(),
    expireDownloads: integer('expire_downloads').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    report: text('report'),
  },
  (table) => ({
    expireAtIdx: index('upload_expire_at_idx').on(table.expireAt),
  }),
);

export const files = pgTable('file', {
  id: text('id').primaryKey(),
  uploadId: uuid('upload_id')
    .notNull()
    .references(() => uploads.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  salt: text('salt').notNull(),
  header: text('header').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  metaHeader: text('meta_header').notNull(),
  metaData: text('meta_data').notNull(),
  downloads: integer('downloads').notNull().default(0),
});

export const uploadsRelations = relations(uploads, ({ many }) => ({
  files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  upload: one(uploads, {
    fields: [files.uploadId],
    references: [uploads.id],
  }),
}));

export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;
export type FileRow = typeof files.$inferSelect;
export type NewFileRow = typeof files.$inferInsert;
