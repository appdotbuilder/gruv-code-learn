
import { db } from '../db';
import { badgesTable } from '../db/schema';
import { type Badge } from '../schema';

export const getBadges = async (): Promise<Badge[]> => {
  try {
    const results = await db.select()
      .from(badgesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch badges:', error);
    throw error;
  }
};
