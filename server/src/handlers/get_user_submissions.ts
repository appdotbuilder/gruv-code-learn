
import { db } from '../db';
import { codeSubmissionsTable } from '../db/schema';
import { type CodeSubmission } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getUserSubmissions(userId: number, exerciseId?: number): Promise<CodeSubmission[]> {
  try {
    // Build conditions array
    const conditions = [eq(codeSubmissionsTable.user_id, userId)];

    // Add exercise filter if provided
    if (exerciseId !== undefined) {
      conditions.push(eq(codeSubmissionsTable.exercise_id, exerciseId));
    }

    // Build and execute query in a single chain
    const results = await db.select()
      .from(codeSubmissionsTable)
      .where(and(...conditions))
      .orderBy(desc(codeSubmissionsTable.submitted_at))
      .execute();

    // Return results (no numeric conversion needed - all fields are integers/text/timestamps)
    return results;
  } catch (error) {
    console.error('Failed to fetch user submissions:', error);
    throw error;
  }
}
