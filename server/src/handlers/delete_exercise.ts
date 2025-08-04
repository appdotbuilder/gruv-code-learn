
import { db } from '../db';
import { exercisesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteExercise(exerciseId: number): Promise<boolean> {
  try {
    // Delete the exercise by ID
    const result = await db.delete(exercisesTable)
      .where(eq(exercisesTable.id, exerciseId))
      .execute();

    // Return true if a row was deleted, false if exercise didn't exist
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Exercise deletion failed:', error);
    throw error;
  }
}
