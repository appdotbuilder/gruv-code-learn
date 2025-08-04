
import { db } from '../db';
import { exercisesTable } from '../db/schema';
import { type UpdateExerciseInput, type Exercise } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateExercise(input: UpdateExerciseInput): Promise<Exercise | null> {
  try {
    // First check if exercise exists
    const existingExercise = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, input.id))
      .execute();

    if (existingExercise.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.starter_code !== undefined) {
      updateData.starter_code = input.starter_code;
    }
    if (input.solution_code !== undefined) {
      updateData.solution_code = input.solution_code;
    }
    if (input.test_cases !== undefined) {
      updateData.test_cases = input.test_cases;
    }
    if (input.points_reward !== undefined) {
      updateData.points_reward = input.points_reward;
    }

    // Update exercise
    const result = await db.update(exercisesTable)
      .set(updateData)
      .where(eq(exercisesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Exercise update failed:', error);
    throw error;
  }
}
