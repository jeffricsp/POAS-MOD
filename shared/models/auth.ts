import { users } from "@shared/schema";

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
