
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, exercisesTable } from '../db/schema';
import { type CreateUserInput, type CreateCourseInput, type CreateLessonInput, type CreateExerciseInput } from '../schema';
import { getExercisesByLesson } from '../handlers/get_exercises_by_lesson';

// Test data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'admin'
};

const testCourse: CreateCourseInput = {
  title: 'Test Course',
  description: 'A course for testing',
  language: 'JavaScript',
  difficulty: 'beginner',
  is_published: true
};

const testLesson: CreateLessonInput = {
  course_id: 1, // Will be set after course creation
  title: 'Test Lesson',
  content: 'This is a test lesson',
  order_index: 1
};

const testExercise1: CreateExerciseInput = {
  lesson_id: 1, // Will be set after lesson creation
  title: 'Exercise 1',
  description: 'First test exercise',
  starter_code: 'function hello() {}',
  solution_code: 'function hello() { return "Hello World"; }',
  test_cases: '{"tests": [{"input": "", "expected": "Hello World"}]}',
  points_reward: 10
};

const testExercise2: CreateExerciseInput = {
  lesson_id: 1, // Will be set after lesson creation
  title: 'Exercise 2',
  description: 'Second test exercise',
  starter_code: 'function add(a, b) {}',
  solution_code: 'function add(a, b) { return a + b; }',
  test_cases: '{"tests": [{"input": [2, 3], "expected": 5}]}',
  points_reward: 15
};

describe('getExercisesByLesson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return exercises for a lesson', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        title: testCourse.title,
        description: testCourse.description,
        language: testCourse.language,
        difficulty: testCourse.difficulty,
        created_by: userResult[0].id,
        is_published: testCourse.is_published
      })
      .returning()
      .execute();

    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: courseResult[0].id,
        title: testLesson.title,
        content: testLesson.content,
        order_index: testLesson.order_index
      })
      .returning()
      .execute();

    // Create exercises
    await db.insert(exercisesTable)
      .values([
        {
          lesson_id: lessonResult[0].id,
          title: testExercise1.title,
          description: testExercise1.description,
          starter_code: testExercise1.starter_code,
          solution_code: testExercise1.solution_code,
          test_cases: testExercise1.test_cases,
          points_reward: testExercise1.points_reward
        },
        {
          lesson_id: lessonResult[0].id,
          title: testExercise2.title,
          description: testExercise2.description,
          starter_code: testExercise2.starter_code,
          solution_code: testExercise2.solution_code,
          test_cases: testExercise2.test_cases,
          points_reward: testExercise2.points_reward
        }
      ])
      .execute();

    const result = await getExercisesByLesson(lessonResult[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Exercise 1');
    expect(result[0].description).toEqual(testExercise1.description);
    expect(result[0].points_reward).toEqual(10);
    expect(result[0].lesson_id).toEqual(lessonResult[0].id);
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('Exercise 2');
    expect(result[1].description).toEqual(testExercise2.description);
    expect(result[1].points_reward).toEqual(15);
    expect(result[1].lesson_id).toEqual(lessonResult[0].id);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for lesson with no exercises', async () => {
    // Create prerequisite data without exercises
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        title: testCourse.title,
        description: testCourse.description,
        language: testCourse.language,
        difficulty: testCourse.difficulty,
        created_by: userResult[0].id,
        is_published: testCourse.is_published
      })
      .returning()
      .execute();

    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: courseResult[0].id,
        title: testLesson.title,
        content: testLesson.content,
        order_index: testLesson.order_index
      })
      .returning()
      .execute();

    const result = await getExercisesByLesson(lessonResult[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent lesson', async () => {
    const result = await getExercisesByLesson(999);

    expect(result).toHaveLength(0);
  });

  it('should only return exercises for the specified lesson', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        title: testCourse.title,
        description: testCourse.description,
        language: testCourse.language,
        difficulty: testCourse.difficulty,
        created_by: userResult[0].id,
        is_published: testCourse.is_published
      })
      .returning()
      .execute();

    // Create two lessons
    const lesson1Result = await db.insert(lessonsTable)
      .values({
        course_id: courseResult[0].id,
        title: 'Lesson 1',
        content: 'First lesson',
        order_index: 1
      })
      .returning()
      .execute();

    const lesson2Result = await db.insert(lessonsTable)
      .values({
        course_id: courseResult[0].id,
        title: 'Lesson 2',
        content: 'Second lesson',
        order_index: 2
      })
      .returning()
      .execute();

    // Create exercises for both lessons
    await db.insert(exercisesTable)
      .values([
        {
          lesson_id: lesson1Result[0].id,
          title: 'Lesson 1 Exercise',
          description: 'Exercise for lesson 1',
          starter_code: 'function test1() {}',
          solution_code: 'function test1() { return 1; }',
          test_cases: '{"tests": []}',
          points_reward: 5
        },
        {
          lesson_id: lesson2Result[0].id,
          title: 'Lesson 2 Exercise',
          description: 'Exercise for lesson 2',
          starter_code: 'function test2() {}',
          solution_code: 'function test2() { return 2; }',
          test_cases: '{"tests": []}',
          points_reward: 8
        }
      ])
      .execute();

    const result = await getExercisesByLesson(lesson1Result[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Lesson 1 Exercise');
    expect(result[0].lesson_id).toEqual(lesson1Result[0].id);
  });
});
