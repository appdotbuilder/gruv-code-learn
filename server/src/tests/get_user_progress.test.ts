
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, userProgressTable } from '../db/schema';
import { type CreateUserInput, type CreateCourseInput, type CreateLessonInput, type CreateUserProgressInput } from '../schema';
import { getUserProgress } from '../handlers/get_user_progress';

describe('getUserProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get user progress records', async () => {
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
    const userId = userResult[0].id;

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

    // Create progress record
    await db.insert(userProgressTable)
      .values({
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        exercise_id: null,
        quiz_id: null,
        status: 'completed',
        points_earned: 50,
        completed_at: new Date()
      })
      .execute();

    const result = await getUserProgress(userId);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].course_id).toEqual(courseId);
    expect(result[0].lesson_id).toEqual(lessonId);
    expect(result[0].status).toEqual('completed');
    expect(result[0].points_earned).toEqual(50);
    expect(result[0].completed_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter progress by course ID', async () => {
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
    const userId = userResult[0].id;

    // Create two test courses
    const course1Result = await db.insert(coursesTable)
      .values({
        title: 'Test Course 1',
        description: 'First test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: userId,
        is_published: true
      })
      .returning()
      .execute();
    const courseId1 = course1Result[0].id;

    const course2Result = await db.insert(coursesTable)
      .values({
        title: 'Test Course 2',
        description: 'Second test course',
        language: 'Python',
        difficulty: 'intermediate',
        created_by: userId,
        is_published: true
      })
      .returning()
      .execute();
    const courseId2 = course2Result[0].id;

    // Create progress records for both courses
    await db.insert(userProgressTable)
      .values({
        user_id: userId,
        course_id: courseId1,
        lesson_id: null,
        exercise_id: null,
        quiz_id: null,
        status: 'started',
        points_earned: 25
      })
      .execute();

    await db.insert(userProgressTable)
      .values({
        user_id: userId,
        course_id: courseId2,
        lesson_id: null,
        exercise_id: null,
        quiz_id: null,
        status: 'completed',
        points_earned: 75
      })
      .execute();

    // Get progress for specific course
    const result = await getUserProgress(userId, courseId1);

    expect(result).toHaveLength(1);
    expect(result[0].course_id).toEqual(courseId1);
    expect(result[0].status).toEqual('started');
    expect(result[0].points_earned).toEqual(25);
  });

  it('should return empty array for user with no progress', async () => {
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
    const userId = userResult[0].id;

    const result = await getUserProgress(userId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle progress with null completed_at', async () => {
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
    const userId = userResult[0].id;

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
    const courseId = courseResult[0].id;

    // Create progress record with null completed_at (started status)
    await db.insert(userProgressTable)
      .values({
        user_id: userId,
        course_id: courseId,
        lesson_id: null,
        exercise_id: null,
        quiz_id: null,
        status: 'started',
        points_earned: 0,
        completed_at: null
      })
      .execute();

    const result = await getUserProgress(userId);

    expect(result).toHaveLength(1);
    expect(result[0].status).toEqual('started');
    expect(result[0].completed_at).toBeNull();
    expect(result[0].points_earned).toEqual(0);
  });
});
