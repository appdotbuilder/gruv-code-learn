
import { db } from '../db';
import { exercisesTable, lessonsTable } from '../db/schema';
import { type CreateExerciseInput, type Exercise } from '../schema';
import { eq } from 'drizzle-orm';

export const createExercise = async (input: CreateExerciseInput): Promise<Exercise> => {
  try {
    // Verify lesson exists first
    const lesson = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, input.lesson_id))
      .execute();

    if (lesson.length === 0) {
      throw new Error(`Lesson with id ${input.lesson_id} not found`);
    }

    // Insert exercise record
    const result = await db.insert(exercisesTable)
      .values({
        lesson_id: input.lesson_id,
        title: input.title,
        description: input.description,
        starter_code: input.starter_code,
        solution_code: input.solution_code,
        test_cases: input.test_cases,
        points_reward: input.points_reward
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Exercise creation failed:', error);
    throw error;
  }
};
