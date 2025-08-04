
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, exercisesTable, quizzesTable, userProgressTable } from '../db/schema';
import { type CreateUserProgressInput } from '../schema';
import { updateUserProgress } from '../handlers/update_user_progress';
import { eq, and, isNull } from 'drizzle-orm';

describe('updateUserProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let courseId: number;
  let lessonId: number;
  let exerciseId: number;
  let quizId: number;

  beforeEach(async () => {
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
    userId = user[0].id;

    // Create test course
    const course = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: userId
      })
      .returning()
      .execute();
    courseId = course[0].id;

    // Create test lesson
    const lesson = await db.insert(lessonsTable)
      .values({
        course_id: courseId,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();
    lessonId = lesson[0].id;

    // Create test exercise
    const exercise = await db.insert(exercisesTable)
      .values({
        lesson_id: lessonId,
        title: 'Test Exercise',
        description: 'Test exercise description',
        starter_code: 'console.log("hello");',
        solution_code: 'console.log("hello world");',
        test_cases: '[]',
        points_reward: 10
      })
      .returning()
      .execute();
    exerciseId = exercise[0].id;

    // Create test quiz
    const quiz = await db.insert(quizzesTable)
      .values({
        lesson_id: lessonId,
        title: 'Test Quiz',
        description: 'Test quiz description',
        points_reward: 20
      })
      .returning()
      .execute();
    quizId = quiz[0].id;
  });

  it('should create new lesson progress record', async () => {
    const input: CreateUserProgressInput = {
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      exercise_id: null,
      quiz_id: null,
      status: 'started',
      points_earned: 0
    };

    const result = await updateUserProgress(input);

    expect(result.user_id).toEqual(userId);
    expect(result.course_id).toEqual(courseId);
    expect(result.lesson_id).toEqual(lessonId);
    expect(result.exercise_id).toBeNull();
    expect(result.quiz_id).toBeNull();
    expect(result.status).toEqual('started');
    expect(result.points_earned).toEqual(0);
    expect(result.completed_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create new exercise progress record', async () => {
    const input: CreateUserProgressInput = {
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      exercise_id: exerciseId,
      quiz_id: null,
      status: 'completed',
      points_earned: 10
    };

    const result = await updateUserProgress(input);

    expect(result.exercise_id).toEqual(exerciseId);
    expect(result.status).toEqual('completed');
    expect(result.points_earned).toEqual(10);
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should create new quiz progress record', async () => {
    const input: CreateUserProgressInput = {
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      exercise_id: null,
      quiz_id: quizId,
      status: 'completed',
      points_earned: 20
    };

    const result = await updateUserProgress(input);

    expect(result.quiz_id).toEqual(quizId);
    expect(result.status).toEqual('completed');
    expect(result.points_earned).toEqual(20);
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should update existing progress record', async () => {
    // Create initial progress record
    const initialInput: CreateUserProgressInput = {
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      exercise_id: null,
      quiz_id: null,
      status: 'started',
      points_earned: 0
    };

    const initial = await updateUserProgress(initialInput);
    expect(initial.status).toEqual('started');
    expect(initial.points_earned).toEqual(0);
    expect(initial.completed_at).toBeNull();

    // Update the same progress record
    const updateInput: CreateUserProgressInput = {
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      exercise_id: null,
      quiz_id: null,
      status: 'completed',
      points_earned: 5
    };

    const updated = await updateUserProgress(updateInput);

    expect(updated.id).toEqual(initial.id); // Same record ID
    expect(updated.status).toEqual('completed');
    expect(updated.points_earned).toEqual(5);
    expect(updated.completed_at).toBeInstanceOf(Date);
  });

  it('should save progress record to database', async () => {
    const input: CreateUserProgressInput = {
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      exercise_id: exerciseId,
      quiz_id: null,
      status: 'completed',
      points_earned: 10
    };

    const result = await updateUserProgress(input);

    // Verify in database
    const progressRecords = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.id, result.id))
      .execute();

    expect(progressRecords).toHaveLength(1);
    expect(progressRecords[0].user_id).toEqual(userId);
    expect(progressRecords[0].exercise_id).toEqual(exerciseId);
    expect(progressRecords[0].status).toEqual('completed');
    expect(progressRecords[0].points_earned).toEqual(10);
  });

  it('should handle multiple different progress records for same user/course', async () => {
    // Create lesson progress
    const lessonInput: CreateUserProgressInput = {
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      exercise_id: null,
      quiz_id: null,
      status: 'completed',
      points_earned: 5
    };

    // Create exercise progress
    const exerciseInput: CreateUserProgressInput = {
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      exercise_id: exerciseId,
      quiz_id: null,
      status: 'completed',
      points_earned: 10
    };

    const lessonProgress = await updateUserProgress(lessonInput);
    const exerciseProgress = await updateUserProgress(exerciseInput);

    // Should be different records
    expect(lessonProgress.id).not.toEqual(exerciseProgress.id);
    expect(lessonProgress.exercise_id).toBeNull();
    expect(exerciseProgress.exercise_id).toEqual(exerciseId);

    // Verify both exist in database
    const allProgress = await db.select()
      .from(userProgressTable)
      .where(and(
        eq(userProgressTable.user_id, userId),
        eq(userProgressTable.course_id, courseId)
      ))
      .execute();

    expect(allProgress).toHaveLength(2);
  });

  it('should properly handle null values in matching logic', async () => {
    // Create progress with all nulls
    const input: CreateUserProgressInput = {
      user_id: userId,
      course_id: courseId,
      lesson_id: null,
      exercise_id: null,
      quiz_id: null,
      status: 'started',
      points_earned: 0
    };

    const result = await updateUserProgress(input);

    expect(result.lesson_id).toBeNull();
    expect(result.exercise_id).toBeNull();
    expect(result.quiz_id).toBeNull();

    // Try to update the same record (all nulls should match)
    const updateInput: CreateUserProgressInput = {
      user_id: userId,
      course_id: courseId,
      lesson_id: null,
      exercise_id: null,
      quiz_id: null,
      status: 'completed',
      points_earned: 1
    };

    const updated = await updateUserProgress(updateInput);

    expect(updated.id).toEqual(result.id); // Should be same record
    expect(updated.status).toEqual('completed');
    expect(updated.points_earned).toEqual(1);
  });
});
