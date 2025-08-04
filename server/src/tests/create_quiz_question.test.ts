
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { type CreateQuizQuestionInput } from '../schema';
import { createQuizQuestion } from '../handlers/create_quiz_question';
import { eq } from 'drizzle-orm';

describe('createQuizQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a quiz question', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
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

    const quizResult = await db.insert(quizzesTable)
      .values({
        lesson_id: lessonResult[0].id,
        title: 'Test Quiz',
        description: 'A test quiz',
        points_reward: 10
      })
      .returning()
      .execute();

    const testInput: CreateQuizQuestionInput = {
      quiz_id: quizResult[0].id,
      question: 'What is JavaScript?',
      options: JSON.stringify(['A programming language', 'A markup language', 'A database', 'A framework']),
      correct_answer: 'A programming language',
      explanation: 'JavaScript is a programming language used for web development',
      order_index: 1
    };

    const result = await createQuizQuestion(testInput);

    // Basic field validation
    expect(result.quiz_id).toEqual(quizResult[0].id);
    expect(result.question).toEqual('What is JavaScript?');
    expect(result.options).toEqual(testInput.options);
    expect(result.correct_answer).toEqual('A programming language');
    expect(result.explanation).toEqual('JavaScript is a programming language used for web development');
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save quiz question to database', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
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

    const quizResult = await db.insert(quizzesTable)
      .values({
        lesson_id: lessonResult[0].id,
        title: 'Test Quiz',
        description: 'A test quiz',
        points_reward: 10
      })
      .returning()
      .execute();

    const testInput: CreateQuizQuestionInput = {
      quiz_id: quizResult[0].id,
      question: 'What is the correct syntax for a JavaScript function?',
      options: JSON.stringify(['function myFunc() {}', 'def myFunc():', 'func myFunc() {}', 'function: myFunc() {}']),
      correct_answer: 'function myFunc() {}',
      explanation: null,
      order_index: 2
    };

    const result = await createQuizQuestion(testInput);

    // Query database to verify the quiz question was saved
    const questions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.id, result.id))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].quiz_id).toEqual(quizResult[0].id);
    expect(questions[0].question).toEqual('What is the correct syntax for a JavaScript function?');
    expect(questions[0].options).toEqual(testInput.options);
    expect(questions[0].correct_answer).toEqual('function myFunc() {}');
    expect(questions[0].explanation).toBeNull();
    expect(questions[0].order_index).toEqual(2);
    expect(questions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle quiz question with null explanation', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'Python',
        difficulty: 'intermediate',
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

    const quizResult = await db.insert(quizzesTable)
      .values({
        lesson_id: lessonResult[0].id,
        title: 'Python Basics Quiz',
        description: 'A quiz about Python basics',
        points_reward: 15
      })
      .returning()
      .execute();

    const testInput: CreateQuizQuestionInput = {
      quiz_id: quizResult[0].id,
      question: 'Which data type is used for whole numbers in Python?',
      options: JSON.stringify(['int', 'float', 'string', 'boolean']),
      correct_answer: 'int',
      explanation: null,
      order_index: 0
    };

    const result = await createQuizQuestion(testInput);

    expect(result.explanation).toBeNull();
    expect(result.question).toEqual('Which data type is used for whole numbers in Python?');
    expect(result.correct_answer).toEqual('int');
  });
});
