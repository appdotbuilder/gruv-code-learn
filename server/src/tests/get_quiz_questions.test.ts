
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, quizzesTable, quizQuestionsTable } from '../db/schema';
import { getQuizQuestions } from '../handlers/get_quiz_questions';

describe('getQuizQuestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return quiz questions ordered by order_index', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [course] = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: user.id
      })
      .returning()
      .execute();

    const [lesson] = await db.insert(lessonsTable)
      .values({
        course_id: course.id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();

    const [quiz] = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson.id,
        title: 'Test Quiz',
        description: 'A test quiz',
        points_reward: 10
      })
      .returning()
      .execute();

    // Create quiz questions with different order_index values
    const questionsData = [
      {
        quiz_id: quiz.id,
        question: 'Question 3',
        options: JSON.stringify(['A', 'B', 'C', 'D']),
        correct_answer: 'A',
        explanation: 'Explanation 3',
        order_index: 3
      },
      {
        quiz_id: quiz.id,
        question: 'Question 1',
        options: JSON.stringify(['A', 'B', 'C', 'D']),
        correct_answer: 'B',
        explanation: 'Explanation 1',
        order_index: 1
      },
      {
        quiz_id: quiz.id,
        question: 'Question 2',
        options: JSON.stringify(['A', 'B', 'C', 'D']),
        correct_answer: 'C',
        explanation: null,
        order_index: 2
      }
    ];

    await db.insert(quizQuestionsTable)
      .values(questionsData)
      .execute();

    const result = await getQuizQuestions(quiz.id);

    // Should return all questions
    expect(result).toHaveLength(3);

    // Should be ordered by order_index
    expect(result[0].question).toEqual('Question 1');
    expect(result[0].order_index).toEqual(1);
    expect(result[0].correct_answer).toEqual('B');
    expect(result[0].explanation).toEqual('Explanation 1');

    expect(result[1].question).toEqual('Question 2');
    expect(result[1].order_index).toEqual(2);
    expect(result[1].correct_answer).toEqual('C');
    expect(result[1].explanation).toBeNull();

    expect(result[2].question).toEqual('Question 3');
    expect(result[2].order_index).toEqual(3);
    expect(result[2].correct_answer).toEqual('A');
    expect(result[2].explanation).toEqual('Explanation 3');

    // Verify all fields are present and correct types
    result.forEach(question => {
      expect(question.id).toBeDefined();
      expect(typeof question.id).toBe('number');
      expect(question.quiz_id).toEqual(quiz.id);
      expect(typeof question.question).toBe('string');
      expect(typeof question.options).toBe('string');
      expect(typeof question.correct_answer).toBe('string');
      expect(typeof question.order_index).toBe('number');
      expect(question.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for quiz with no questions', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [course] = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: user.id
      })
      .returning()
      .execute();

    const [lesson] = await db.insert(lessonsTable)
      .values({
        course_id: course.id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();

    const [quiz] = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson.id,
        title: 'Empty Quiz',
        description: 'A quiz with no questions',
        points_reward: 0
      })
      .returning()
      .execute();

    const result = await getQuizQuestions(quiz.id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent quiz', async () => {
    const result = await getQuizQuestions(99999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle questions with same order_index correctly', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [course] = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: user.id
      })
      .returning()
      .execute();

    const [lesson] = await db.insert(lessonsTable)
      .values({
        course_id: course.id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();

    const [quiz] = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson.id,
        title: 'Test Quiz',
        description: 'A test quiz',
        points_reward: 10
      })
      .returning()
      .execute();

    // Create questions with same order_index
    const questionsData = [
      {
        quiz_id: quiz.id,
        question: 'Question A',
        options: JSON.stringify(['A', 'B']),
        correct_answer: 'A',
        explanation: 'First question',
        order_index: 1
      },
      {
        quiz_id: quiz.id,
        question: 'Question B',
        options: JSON.stringify(['C', 'D']),
        correct_answer: 'C',
        explanation: 'Second question',
        order_index: 1
      }
    ];

    await db.insert(quizQuestionsTable)
      .values(questionsData)
      .execute();

    const result = await getQuizQuestions(quiz.id);

    expect(result).toHaveLength(2);
    // Both should have order_index 1
    expect(result[0].order_index).toEqual(1);
    expect(result[1].order_index).toEqual(1);
    // Should still return both questions
    const questions = result.map(q => q.question);
    expect(questions).toContain('Question A');
    expect(questions).toContain('Question B');
  });

  it('should only return questions for the specified quiz', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [course] = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: user.id
      })
      .returning()
      .execute();

    const [lesson] = await db.insert(lessonsTable)
      .values({
        course_id: course.id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();

    // Create two quizzes
    const [quiz1] = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson.id,
        title: 'Quiz 1',
        description: 'First quiz',
        points_reward: 10
      })
      .returning()
      .execute();

    const [quiz2] = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson.id,
        title: 'Quiz 2',
        description: 'Second quiz',
        points_reward: 15
      })
      .returning()
      .execute();

    // Add questions to both quizzes
    await db.insert(quizQuestionsTable)
      .values([
        {
          quiz_id: quiz1.id,
          question: 'Quiz 1 Question',
          options: JSON.stringify(['A', 'B']),
          correct_answer: 'A',
          explanation: 'Quiz 1 explanation',
          order_index: 1
        },
        {
          quiz_id: quiz2.id,
          question: 'Quiz 2 Question',
          options: JSON.stringify(['C', 'D']),
          correct_answer: 'C',
          explanation: 'Quiz 2 explanation',
          order_index: 1
        }
      ])
      .execute();

    const result1 = await getQuizQuestions(quiz1.id);
    const result2 = await getQuizQuestions(quiz2.id);

    // Each should only return questions for its own quiz
    expect(result1).toHaveLength(1);
    expect(result1[0].question).toEqual('Quiz 1 Question');
    expect(result1[0].quiz_id).toEqual(quiz1.id);

    expect(result2).toHaveLength(1);
    expect(result2[0].question).toEqual('Quiz 2 Question');
    expect(result2[0].quiz_id).toEqual(quiz2.id);
  });
});
