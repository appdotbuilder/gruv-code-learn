
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { coursesTable, usersTable, lessonsTable, exercisesTable, quizzesTable } from '../db/schema';
import { deleteCourse } from '../handlers/delete_course';
import { eq } from 'drizzle-orm';

describe('deleteCourse', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a course successfully', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a course
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

    // Delete the course
    const result = await deleteCourse(courseId);

    expect(result).toBe(true);

    // Verify the course is deleted
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, courseId))
      .execute();

    expect(courses).toHaveLength(0);
  });

  it('should return false when course does not exist', async () => {
    const result = await deleteCourse(999);

    expect(result).toBe(false);
  });

  it('should cascade delete related lessons, exercises, and quizzes', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a course
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

    // Create a lesson
    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: courseId,
        title: 'Test Lesson',
        content: 'Lesson content',
        order_index: 1
      })
      .returning()
      .execute();

    const lessonId = lessonResult[0].id;

    // Create an exercise
    const exerciseResult = await db.insert(exercisesTable)
      .values({
        lesson_id: lessonId,
        title: 'Test Exercise',
        description: 'Exercise description',
        starter_code: 'console.log("start");',
        solution_code: 'console.log("solution");',
        test_cases: '[]',
        points_reward: 10
      })
      .returning()
      .execute();

    const exerciseId = exerciseResult[0].id;

    // Create a quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        lesson_id: lessonId,
        title: 'Test Quiz',
        description: 'Quiz description',
        points_reward: 5
      })
      .returning()
      .execute();

    const quizId = quizResult[0].id;

    // Delete the course
    const result = await deleteCourse(courseId);

    expect(result).toBe(true);

    // Verify all related data is deleted
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, courseId))
      .execute();

    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, lessonId))
      .execute();

    const exercises = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, exerciseId))
      .execute();

    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizId))
      .execute();

    expect(courses).toHaveLength(0);
    expect(lessons).toHaveLength(0);
    expect(exercises).toHaveLength(0);
    expect(quizzes).toHaveLength(0);
  });

  it('should handle deletion of multiple courses', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple courses
    const course1Result = await db.insert(coursesTable)
      .values({
        title: 'Course 1',
        description: 'First course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: userId,
        is_published: true
      })
      .returning()
      .execute();

    const course2Result = await db.insert(coursesTable)
      .values({
        title: 'Course 2',
        description: 'Second course',
        language: 'Python',
        difficulty: 'intermediate',
        created_by: userId,
        is_published: false
      })
      .returning()
      .execute();

    const course1Id = course1Result[0].id;
    const course2Id = course2Result[0].id;

    // Delete first course
    const result1 = await deleteCourse(course1Id);
    expect(result1).toBe(true);

    // Verify first course is deleted but second remains
    const course1Check = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, course1Id))
      .execute();

    const course2Check = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, course2Id))
      .execute();

    expect(course1Check).toHaveLength(0);
    expect(course2Check).toHaveLength(1);
    expect(course2Check[0].title).toEqual('Course 2');

    // Delete second course
    const result2 = await deleteCourse(course2Id);
    expect(result2).toBe(true);
  });
});
