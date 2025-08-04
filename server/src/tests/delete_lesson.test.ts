
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, exercisesTable, quizzesTable, quizQuestionsTable, userProgressTable } from '../db/schema';
import { deleteLesson } from '../handlers/delete_lesson';
import { eq } from 'drizzle-orm';

describe('deleteLesson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing lesson', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        role: 'admin'
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: userResult[0].id
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

    const lessonId = lessonResult[0].id;

    // Delete the lesson
    const result = await deleteLesson(lessonId);

    expect(result).toBe(true);

    // Verify lesson is deleted from database
    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, lessonId))
      .execute();

    expect(lessons).toHaveLength(0);
  });

  it('should return false for non-existent lesson', async () => {
    const result = await deleteLesson(999);

    expect(result).toBe(false);
  });

  it('should cascade delete related exercises and quizzes', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        role: 'admin'
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: userResult[0].id
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

    const lessonId = lessonResult[0].id;

    // Create exercise
    const exerciseResult = await db.insert(exercisesTable)
      .values({
        lesson_id: lessonId,
        title: 'Test Exercise',
        description: 'Test exercise description',
        starter_code: 'console.log("start");',
        solution_code: 'console.log("solution");',
        test_cases: '[]',
        points_reward: 10
      })
      .returning()
      .execute();

    // Create quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        lesson_id: lessonId,
        title: 'Test Quiz',
        description: 'Test quiz description',
        points_reward: 5
      })
      .returning()
      .execute();

    // Create quiz question
    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quizResult[0].id,
        question: 'Test question?',
        options: '["A", "B", "C"]',
        correct_answer: 'A',
        explanation: 'Test explanation',
        order_index: 1
      })
      .execute();

    // Delete the lesson
    const result = await deleteLesson(lessonId);

    expect(result).toBe(true);

    // Verify lesson is deleted
    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, lessonId))
      .execute();

    expect(lessons).toHaveLength(0);

    // Verify exercises are cascade deleted
    const exercises = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.lesson_id, lessonId))
      .execute();

    expect(exercises).toHaveLength(0);

    // Verify quizzes are cascade deleted
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.lesson_id, lessonId))
      .execute();

    expect(quizzes).toHaveLength(0);

    // Verify quiz questions are cascade deleted
    const quizQuestions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizResult[0].id))
      .execute();

    expect(quizQuestions).toHaveLength(0);
  });

  it('should cascade delete user progress records', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'student',
        email: 'student@test.com',
        password_hash: 'hashed_password',
        role: 'student'
      })
      .returning()
      .execute();

    const adminResult = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@test.com', 
        password_hash: 'hashed_password',
        role: 'admin'
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: adminResult[0].id
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

    const lessonId = lessonResult[0].id;

    // Create user progress record
    await db.insert(userProgressTable)
      .values({
        user_id: userResult[0].id,
        course_id: courseResult[0].id,
        lesson_id: lessonId,
        status: 'started',
        points_earned: 0
      })
      .execute();

    // Delete the lesson
    const result = await deleteLesson(lessonId);

    expect(result).toBe(true);

    // Verify user progress records are cascade deleted
    const progressRecords = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.lesson_id, lessonId))
      .execute();

    expect(progressRecords).toHaveLength(0);
  });
});
