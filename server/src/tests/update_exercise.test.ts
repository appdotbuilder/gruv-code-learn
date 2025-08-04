
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, exercisesTable } from '../db/schema';
import { type UpdateExerciseInput } from '../schema';
import { updateExercise } from '../handlers/update_exercise';
import { eq } from 'drizzle-orm';

describe('updateExercise', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let courseId: number;
  let lessonId: number;
  let exerciseId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'admin'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test course
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: userId,
        is_published: true
      })
      .returning()
      .execute();
    courseId = courseResult[0].id;

    // Create test lesson
    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: courseId,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();
    lessonId = lessonResult[0].id;

    // Create test exercise
    const exerciseResult = await db.insert(exercisesTable)
      .values({
        lesson_id: lessonId,
        title: 'Original Exercise',
        description: 'Original description',
        starter_code: 'console.log("start");',
        solution_code: 'console.log("solution");',
        test_cases: '{"tests": []}',
        points_reward: 10
      })
      .returning()
      .execute();
    exerciseId = exerciseResult[0].id;
  });

  it('should update exercise with all fields', async () => {
    const updateInput: UpdateExerciseInput = {
      id: exerciseId,
      title: 'Updated Exercise',
      description: 'Updated description',
      starter_code: 'console.log("updated start");',
      solution_code: 'console.log("updated solution");',
      test_cases: '{"tests": ["updated"]}',
      points_reward: 20
    };

    const result = await updateExercise(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(exerciseId);
    expect(result!.title).toEqual('Updated Exercise');
    expect(result!.description).toEqual('Updated description');
    expect(result!.starter_code).toEqual('console.log("updated start");');
    expect(result!.solution_code).toEqual('console.log("updated solution");');
    expect(result!.test_cases).toEqual('{"tests": ["updated"]}');
    expect(result!.points_reward).toEqual(20);
    expect(result!.lesson_id).toEqual(lessonId);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateExerciseInput = {
      id: exerciseId,
      title: 'Partially Updated',
      points_reward: 15
    };

    const result = await updateExercise(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Partially Updated');
    expect(result!.points_reward).toEqual(15);
    // Other fields should remain unchanged
    expect(result!.description).toEqual('Original description');
    expect(result!.starter_code).toEqual('console.log("start");');
    expect(result!.solution_code).toEqual('console.log("solution");');
    expect(result!.test_cases).toEqual('{"tests": []}');
  });

  it('should update database record', async () => {
    const updateInput: UpdateExerciseInput = {
      id: exerciseId,
      title: 'Database Test',
      description: 'Database test description'
    };

    await updateExercise(updateInput);

    const exercises = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, exerciseId))
      .execute();

    expect(exercises).toHaveLength(1);
    expect(exercises[0].title).toEqual('Database Test');
    expect(exercises[0].description).toEqual('Database test description');
  });

  it('should return null for non-existent exercise', async () => {
    const updateInput: UpdateExerciseInput = {
      id: 99999,
      title: 'Non-existent Exercise'
    };

    const result = await updateExercise(updateInput);

    expect(result).toBeNull();
  });

  it('should update updated_at timestamp', async () => {
    const originalExercise = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, exerciseId))
      .execute();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateExerciseInput = {
      id: exerciseId,
      title: 'Timestamp Test'
    };

    const result = await updateExercise(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalExercise[0].updated_at.getTime());
  });
});
