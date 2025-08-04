
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, exercisesTable, codeSubmissionsTable } from '../db/schema';
import { getUserSubmissions } from '../handlers/get_user_submissions';

describe('getUserSubmissions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no submissions', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'student'
      })
      .returning()
      .execute();

    const result = await getUserSubmissions(user[0].id);

    expect(result).toEqual([]);
  });

  it('should return all submissions for a user', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'student'
      })
      .returning()
      .execute();

    // Create course, lesson, and exercise
    const course = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: user[0].id,
        is_published: true
      })
      .returning()
      .execute();

    const lesson = await db.insert(lessonsTable)
      .values({
        course_id: course[0].id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();

    const exercise = await db.insert(exercisesTable)
      .values({
        lesson_id: lesson[0].id,
        title: 'Test Exercise',
        description: 'A test exercise',
        starter_code: 'console.log("start");',
        solution_code: 'console.log("solution");',
        test_cases: '[]',
        points_reward: 10
      })
      .returning()
      .execute();

    // Create multiple submissions
    const submission1 = await db.insert(codeSubmissionsTable)
      .values({
        user_id: user[0].id,
        exercise_id: exercise[0].id,
        code: 'console.log("first submission");',
        status: 'passed'
      })
      .returning()
      .execute();

    const submission2 = await db.insert(codeSubmissionsTable)
      .values({
        user_id: user[0].id,
        exercise_id: exercise[0].id,
        code: 'console.log("second submission");',
        status: 'failed'
      })
      .returning()
      .execute();

    const result = await getUserSubmissions(user[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(submission2[0].id); // Most recent first
    expect(result[1].id).toEqual(submission1[0].id);
    expect(result[0].code).toEqual('console.log("second submission");');
    expect(result[0].status).toEqual('failed');
    expect(result[1].code).toEqual('console.log("first submission");');
    expect(result[1].status).toEqual('passed');
  });

  it('should filter submissions by exercise ID when provided', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'student'
      })
      .returning()
      .execute();

    // Create course and lesson
    const course = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: user[0].id,
        is_published: true
      })
      .returning()
      .execute();

    const lesson = await db.insert(lessonsTable)
      .values({
        course_id: course[0].id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();

    // Create two exercises
    const exercise1 = await db.insert(exercisesTable)
      .values({
        lesson_id: lesson[0].id,
        title: 'Exercise 1',
        description: 'First exercise',
        starter_code: 'console.log("start1");',
        solution_code: 'console.log("solution1");',
        test_cases: '[]',
        points_reward: 10
      })
      .returning()
      .execute();

    const exercise2 = await db.insert(exercisesTable)
      .values({
        lesson_id: lesson[0].id,
        title: 'Exercise 2',
        description: 'Second exercise',
        starter_code: 'console.log("start2");',
        solution_code: 'console.log("solution2");',
        test_cases: '[]',
        points_reward: 15
      })
      .returning()
      .execute();

    // Create submissions for both exercises
    await db.insert(codeSubmissionsTable)
      .values({
        user_id: user[0].id,
        exercise_id: exercise1[0].id,
        code: 'console.log("exercise 1 submission");',
        status: 'passed'
      })
      .execute();

    await db.insert(codeSubmissionsTable)
      .values({
        user_id: user[0].id,
        exercise_id: exercise2[0].id,
        code: 'console.log("exercise 2 submission");',
        status: 'failed'
      })
      .execute();

    // Test filtering by exercise 1
    const result1 = await getUserSubmissions(user[0].id, exercise1[0].id);
    expect(result1).toHaveLength(1);
    expect(result1[0].exercise_id).toEqual(exercise1[0].id);
    expect(result1[0].code).toEqual('console.log("exercise 1 submission");');

    // Test filtering by exercise 2
    const result2 = await getUserSubmissions(user[0].id, exercise2[0].id);
    expect(result2).toHaveLength(1);
    expect(result2[0].exercise_id).toEqual(exercise2[0].id);
    expect(result2[0].code).toEqual('console.log("exercise 2 submission");');
  });

  it('should return empty array when filtering by non-existent exercise', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'student'
      })
      .returning()
      .execute();

    const result = await getUserSubmissions(user[0].id, 999);

    expect(result).toEqual([]);
  });

  it('should not return submissions from other users', async () => {
    // Create two test users
    const user1 = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        role: 'student'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        role: 'student'
      })
      .returning()
      .execute();

    // Create course, lesson, and exercise
    const course = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: user1[0].id,
        is_published: true
      })
      .returning()
      .execute();

    const lesson = await db.insert(lessonsTable)
      .values({
        course_id: course[0].id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();

    const exercise = await db.insert(exercisesTable)
      .values({
        lesson_id: lesson[0].id,
        title: 'Test Exercise',
        description: 'A test exercise',
        starter_code: 'console.log("start");',
        solution_code: 'console.log("solution");',
        test_cases: '[]',
        points_reward: 10
      })
      .returning()
      .execute();

    // Create submissions for both users
    await db.insert(codeSubmissionsTable)
      .values({
        user_id: user1[0].id,
        exercise_id: exercise[0].id,
        code: 'console.log("user1 submission");',
        status: 'passed'
      })
      .execute();

    await db.insert(codeSubmissionsTable)
      .values({
        user_id: user2[0].id,
        exercise_id: exercise[0].id,
        code: 'console.log("user2 submission");',
        status: 'failed'
      })
      .execute();

    // Each user should only see their own submissions
    const user1Results = await getUserSubmissions(user1[0].id);
    expect(user1Results).toHaveLength(1);
    expect(user1Results[0].user_id).toEqual(user1[0].id);
    expect(user1Results[0].code).toEqual('console.log("user1 submission");');

    const user2Results = await getUserSubmissions(user2[0].id);
    expect(user2Results).toHaveLength(1);
    expect(user2Results[0].user_id).toEqual(user2[0].id);
    expect(user2Results[0].code).toEqual('console.log("user2 submission");');
  });
});
