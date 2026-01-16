import { users, type User, type UpsertUser } from "@shared/schema";
import { db } from "../../db";
import { eq, sql } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser, inviteRole?: string): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser, inviteRole?: string): Promise<User> {
    const existingUser = await this.getUser(userData.id!);
    
    if (existingUser) {
      const updateData: any = {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        updatedAt: new Date(),
      };
      if (inviteRole) {
        updateData.role = inviteRole;
      }
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userData.id!));
      const [user] = await db.select().from(users).where(eq(users.id, userData.id!));
      return user;
    }

    const allUsers = await db.select().from(users);
    const isFirstUser = allUsers.length === 0;

    await db
      .insert(users)
      .values({
        ...userData,
        role: inviteRole || (isFirstUser ? 'admin' : 'student')
      });
    const [user] = await db.select().from(users).where(eq(users.id, userData.id!));
    return user;
  }
}

export const authStorage = new AuthStorage();
