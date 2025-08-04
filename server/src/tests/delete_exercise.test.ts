
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, exercisesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteExercise } from '../handlers/delete_exercise';

describe('deleteExercise', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing exercise', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'admin',
        total_points: 0
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: userResult[0].id,
        is_published: true
      })
      .returning()
      .execute();

    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: courseResult[0].id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();

    const exerciseResult = await db.insert(exercisesTable)
      .values({
        lesson_id: lessonResult[0].id,
        title: 'Test Exercise',
        description: 'A test exercise',
        starter_code: 'function test() {}',
        solution_code: 'function test() { return true; }',
        test_cases: '[]',
        points_reward: 10
      })
      .returning()
      .execute();

    const exerciseId = exerciseResult[0].id;

    // Delete the exercise
    const result = await deleteExercise(exerciseId);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify exercise no longer exists in database
    const exercises = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, exerciseId))
      .execute();

    expect(exercises).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent exercise', async () => {
    // Try to delete an exercise that doesn't exist
    const result = await deleteExercise(999);

    expect(result).toBe(false);
  });

  it('should cascade delete related records', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'admin',
        total_points: 0
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: userResult[0].id,
        is_published: true
      })
      .returning()
      .execute();

    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: courseResult[0].id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();

    const exerciseResult = await db.insert(exercisesTable)
      .values({
        lesson_id: lessonResult[0].id,
        title: 'Test Exercise',
        description: 'A test exercise',
        starter_code: 'function test() {}',
        solution_code: 'function test() { return true; }',
        test_cases: '[]',
        points_reward: 10
      })
      .returning()
      .execute();

    const exerciseId = exerciseResult[0].id;

    // Verify exercise exists before deletion
    const exercisesBefore = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, exerciseId))
      .execute();

    expect(exercisesBefore).toHaveLength(1);

    // Delete the exercise
    const result = await deleteExercise(exerciseId);

    expect(result).toBe(true);

    // Verify cascade deletion worked - exercise should be gone
    const exercisesAfter = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, exerciseId))
      .execute();

    expect(exercisesAfter).toHaveLength(0);
  });
});
