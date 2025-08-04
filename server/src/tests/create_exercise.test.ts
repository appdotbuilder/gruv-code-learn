
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, exercisesTable } from '../db/schema';
import { type CreateExerciseInput } from '../schema';
import { createExercise } from '../handlers/create_exercise';
import { eq } from 'drizzle-orm';

describe('createExercise', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCourseId: number;
  let testLessonId: number;

  const testInput: CreateExerciseInput = {
    lesson_id: 0, // Will be set after creating lesson
    title: 'Simple Addition',
    description: 'Create a function that adds two numbers',
    starter_code: 'function add(a, b) {\n  // Your code here\n}',
    solution_code: 'function add(a, b) {\n  return a + b;\n}',
    test_cases: JSON.stringify([
      { input: [1, 2], expected: 3 },
      { input: [5, 10], expected: 15 }
    ]),
    points_reward: 10
  };

  beforeEach(async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testteacher',
        email: 'teacher@test.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    testUserId = userResult[0].id;

    // Create prerequisite course
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'JavaScript Basics',
        description: 'Learn JavaScript fundamentals',
        language: 'javascript',
        difficulty: 'beginner',
        created_by: testUserId,
        is_published: true
      })
      .returning()
      .execute();

    testCourseId = courseResult[0].id;

    // Create prerequisite lesson
    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: testCourseId,
        title: 'Functions',
        content: 'Learn about JavaScript functions',
        order_index: 1
      })
      .returning()
      .execute();

    testLessonId = lessonResult[0].id;
    testInput.lesson_id = testLessonId;
  });

  it('should create an exercise', async () => {
    const result = await createExercise(testInput);

    // Basic field validation
    expect(result.lesson_id).toEqual(testLessonId);
    expect(result.title).toEqual('Simple Addition');
    expect(result.description).toEqual(testInput.description);
    expect(result.starter_code).toEqual(testInput.starter_code);
    expect(result.solution_code).toEqual(testInput.solution_code);
    expect(result.test_cases).toEqual(testInput.test_cases);
    expect(result.points_reward).toEqual(10);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save exercise to database', async () => {
    const result = await createExercise(testInput);

    // Query database to verify exercise was saved
    const exercises = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, result.id))
      .execute();

    expect(exercises).toHaveLength(1);
    expect(exercises[0].lesson_id).toEqual(testLessonId);
    expect(exercises[0].title).toEqual('Simple Addition');
    expect(exercises[0].description).toEqual(testInput.description);
    expect(exercises[0].starter_code).toEqual(testInput.starter_code);
    expect(exercises[0].solution_code).toEqual(testInput.solution_code);
    expect(exercises[0].test_cases).toEqual(testInput.test_cases);
    expect(exercises[0].points_reward).toEqual(10);
    expect(exercises[0].created_at).toBeInstanceOf(Date);
    expect(exercises[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent lesson', async () => {
    const invalidInput = {
      ...testInput,
      lesson_id: 99999
    };

    await expect(createExercise(invalidInput)).rejects.toThrow(/lesson with id 99999 not found/i);
  });

  it('should handle JSON test cases correctly', async () => {
    const complexTestCases = JSON.stringify([
      { input: [1, 2], expected: 3, description: 'simple addition' },
      { input: [-5, 10], expected: 5, description: 'negative and positive' },
      { input: [0, 0], expected: 0, description: 'zero values' }
    ]);

    const inputWithComplexTests = {
      ...testInput,
      test_cases: complexTestCases
    };

    const result = await createExercise(inputWithComplexTests);

    expect(result.test_cases).toEqual(complexTestCases);

    // Verify it can be parsed back to JSON
    const parsedTestCases = JSON.parse(result.test_cases);
    expect(parsedTestCases).toHaveLength(3);
    expect(parsedTestCases[0].description).toEqual('simple addition');
  });
});
