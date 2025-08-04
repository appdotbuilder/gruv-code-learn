
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, exercisesTable, codeSubmissionsTable } from '../db/schema';
import { type SubmitCodeInput } from '../schema';
import { submitCode } from '../handlers/submit_code';
import { eq } from 'drizzle-orm';

describe('submitCode', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testExerciseId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'student',
        total_points: 0
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;

    // Create test course
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: testUserId,
        is_published: true
      })
      .returning()
      .execute();

    const courseId = courseResult[0].id;

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

    const lessonId = lessonResult[0].id;

    // Create test exercise
    const exerciseResult = await db.insert(exercisesTable)
      .values({
        lesson_id: lessonId,
        title: 'Test Exercise',
        description: 'A test exercise',
        starter_code: 'function add(a, b) {\n  // Your code here\n}',
        solution_code: 'function add(a, b) {\n  return a + b;\n}',
        test_cases: JSON.stringify([
          { input: [2, 3], expected: 5 },
          { input: [0, 0], expected: 0 }
        ]),
        points_reward: 10
      })
      .returning()
      .execute();

    testExerciseId = exerciseResult[0].id;
  });

  const testInput: SubmitCodeInput = {
    user_id: 0, // Will be set in test
    exercise_id: 0, // Will be set in test
    code: 'function add(a, b) {\n  return a + b;\n}'
  };

  it('should submit code successfully', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      exercise_id: testExerciseId
    };

    const result = await submitCode(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.exercise_id).toEqual(testExerciseId);
    expect(result.code).toEqual(input.code);
    expect(result.status).toEqual('passed');
    expect(result.id).toBeDefined();
    expect(result.submitted_at).toBeInstanceOf(Date);
    expect(result.test_results).toBeDefined();
  });

  it('should save submission to database', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      exercise_id: testExerciseId
    };

    const result = await submitCode(input);

    const submissions = await db.select()
      .from(codeSubmissionsTable)
      .where(eq(codeSubmissionsTable.id, result.id))
      .execute();

    expect(submissions).toHaveLength(1);
    expect(submissions[0].user_id).toEqual(testUserId);
    expect(submissions[0].exercise_id).toEqual(testExerciseId);
    expect(submissions[0].code).toEqual(input.code);
    expect(submissions[0].status).toEqual('passed');
    expect(submissions[0].submitted_at).toBeInstanceOf(Date);
  });

  it('should handle test failure', async () => {
    const input = {
      user_id: testUserId,
      exercise_id: testExerciseId,
      code: 'function add(a, b) {\n  return "wrong";\n}' // This will fail tests
    };

    const result = await submitCode(input);

    expect(result.status).toEqual('failed');
    expect(result.test_results).toBeDefined();
    
    const testResults = JSON.parse(result.test_results!);
    expect(testResults.passed).toBe(false);
    expect(testResults.results).toBeDefined();
  });

  it('should throw error for non-existent exercise', async () => {
    const input = {
      user_id: testUserId,
      exercise_id: 99999, // Non-existent exercise
      code: 'function add(a, b) {\n  return a + b;\n}'
    };

    expect(submitCode(input)).rejects.toThrow(/Exercise not found/i);
  });

  it('should throw error for non-existent user', async () => {
    const input = {
      user_id: 99999, // Non-existent user
      exercise_id: testExerciseId,
      code: 'function add(a, b) {\n  return a + b;\n}'
    };

    expect(submitCode(input)).rejects.toThrow(/User not found/i);
  });

  it('should parse and validate test results format', async () => {
    const input = {
      user_id: testUserId,
      exercise_id: testExerciseId,
      code: 'function add(a, b) {\n  return a + b;\n}'
    };

    const result = await submitCode(input);

    expect(result.test_results).toBeDefined();
    const testResults = JSON.parse(result.test_results!);
    
    expect(testResults).toHaveProperty('passed');
    expect(testResults).toHaveProperty('results');
    expect(Array.isArray(testResults.results)).toBe(true);
    expect(typeof testResults.passed).toBe('boolean');
  });
});
