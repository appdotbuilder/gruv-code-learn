
import { db } from '../db';
import { userProgressTable } from '../db/schema';
import { type UserProgress } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export async function getUserProgress(userId: number, courseId?: number): Promise<UserProgress[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    conditions.push(eq(userProgressTable.user_id, userId));

    if (courseId !== undefined) {
      conditions.push(eq(userProgressTable.course_id, courseId));
    }

    // Execute query with conditions
    const results = await db.select()
      .from(userProgressTable)
      .where(and(...conditions))
      .execute();

    return results.map(progress => ({
      ...progress,
      completed_at: progress.completed_at || null, // Ensure null handling
    }));
  } catch (error) {
    console.error('Get user progress failed:', error);
    throw error;
  }
}
