import { relations } from 'drizzle-orm';
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['user', 'admin']);
export const creditTypeEnum = pgEnum('credit_type', ['purchase', 'consume', 'refund', 'gift']);
export const taskStatusEnum = pgEnum('task_status', ['queued', 'processing', 'completed', 'failed']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }),
  credits: integer('credits').notNull().default(5),
  role: roleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const creditTransactions = pgTable(
  'credit_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    type: creditTypeEnum('type').notNull(),
    balanceAfter: integer('balance_after').notNull(),
    referenceId: varchar('reference_id', { length: 255 }),
    description: varchar('description', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_credit_tx_user_id').on(table.userId),
    userCreatedAtIdx: index('idx_credit_tx_created_at').on(table.userId, table.createdAt),
  }),
);

export const generationTasks = pgTable(
  'generation_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: taskStatusEnum('status').notNull().default('queued'),
    prompt: text('prompt').notNull(),
    negativePrompt: text('negative_prompt'),
    params: jsonb('params').notNull(),
    creditsCost: integer('credits_cost').notNull(),
    imageUrl: varchar('image_url', { length: 500 }),
    thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
    comfyuiPromptId: varchar('comfyui_prompt_id', { length: 100 }),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_tasks_user_id').on(table.userId),
    statusIdx: index('idx_tasks_status').on(table.status),
    userCreatedAtIdx: index('idx_tasks_user_created').on(table.userId, table.createdAt),
  }),
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stripeSessionId: varchar('stripe_session_id', { length: 255 }).unique(),
    stripePaymentIntent: varchar('stripe_payment_intent', { length: 255 }),
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('usd'),
    creditsPurchased: integer('credits_purchased').notNull(),
    status: paymentStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    userIdIdx: index('idx_payments_user_id').on(table.userId),
    stripeSessionIdx: index('idx_payments_stripe_session').on(table.stripeSessionId),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  creditTransactions: many(creditTransactions),
  generationTasks: many(generationTasks),
  payments: many(payments),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

export const generationTasksRelations = relations(generationTasks, ({ one }) => ({
  user: one(users, {
    fields: [generationTasks.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
export type GenerationTask = typeof generationTasks.$inferSelect;
export type NewGenerationTask = typeof generationTasks.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
