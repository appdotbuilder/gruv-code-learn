
import { db } from '../db';
import { userBadgesTable, badgesTable } from '../db/schema';
import { type UserBadge } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserBadges(userId: number): Promise<UserBadge[]> {
  try {
    const results = await db.select()
      .from(userBadgesTable)
      .innerJoin(badgesTable, eq(userBadgesTable.badge_id, badgesTable.id))
      .where(eq(userBadgesTable.user_id, userId))
      .execute();

    return results.map(result => ({
      id: result.user_badges.id,
      user_id: result.user_badges.user_id,
      badge_id: result.user_badges.badge_id,
      earned_at: result.user_badges.earned_at
    }));
  } catch (error) {
    console.error('Failed to get user badges:', error);
    throw error;
  }
}
