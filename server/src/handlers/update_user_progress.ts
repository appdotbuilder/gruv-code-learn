
import { db } from '../db';
import { userProgressTable } from '../db/schema';
import { type CreateUserProgressInput, type UserProgress } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const updateUserProgress = async (input: CreateUserProgressInput): Promise<UserProgress> => {
  try {
    // Build conditions to find existing progress record
    const conditions: SQL<unknown>[] = [
      eq(userProgressTable.user_id, input.user_id),
      eq(userProgressTable.course_id, input.course_id)
    ];

    // Add specific item conditions
    if (input.lesson_id !== null) {
      conditions.push(eq(userProgressTable.lesson_id, input.lesson_id));
    } else {
      conditions.push(isNull(userProgressTable.lesson_id));
    }

    if (input.exercise_id !== null) {
      conditions.push(eq(userProgressTable.exercise_id, input.exercise_id));
    } else {
      conditions.push(isNull(userProgressTable.exercise_id));
    }

    if (input.quiz_id !== null) {
      conditions.push(eq(userProgressTable.quiz_id, input.quiz_id));
    } else {
      conditions.push(isNull(userProgressTable.quiz_id));
    }

    // Check for existing progress record
    const existingProgress = await db.select()
      .from(userProgressTable)
      .where(and(...conditions))
      .execute();

    if (existingProgress.length > 0) {
      // Update existing record
      const updated = await db.update(userProgressTable)
        .set({
          status: input.status,
          points_earned: input.points_earned,
          completed_at: input.status === 'completed' ? new Date() : null,
        })
        .where(eq(userProgressTable.id, existingProgress[0].id))
        .returning()
        .execute();

      return updated[0];
    } else {
      // Create new record
      const result = await db.insert(userProgressTable)
        .values({
          user_id: input.user_id,
          course_id: input.course_id,
          lesson_id: input.lesson_id,
          exercise_id: input.exercise_id,
          quiz_id: input.quiz_id,
          status: input.status,
          points_earned: input.points_earned,
          completed_at: input.status === 'completed' ? new Date() : null
        })
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('User progress update failed:', error);
    throw error;
  }
};
