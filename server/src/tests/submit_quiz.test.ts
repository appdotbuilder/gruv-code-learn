
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, quizzesTable, quizQuestionsTable, userProgressTable, quizAttemptsTable } from '../db/schema';
import { type SubmitQuizInput } from '../schema';
import { submitQuiz } from '../handlers/submit_quiz';
import { eq, and } from 'drizzle-orm';

describe('submitQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should submit quiz and calculate correct score', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'student',
        total_points: 100
      })
      .returning()
      .execute();
    const user = userResult[0];

    // Create test course
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: user.id,
        is_published: true
      })
      .returning()
      .execute();
    const course = courseResult[0];

    // Create test lesson
    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: course.id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();
    const lesson = lessonResult[0];

    // Create test quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson.id,
        title: 'Test Quiz',
        description: 'A test quiz',
        points_reward: 100
      })
      .returning()
      .execute();
    const quiz = quizResult[0];

    // Create quiz questions
    await db.insert(quizQuestionsTable)
      .values([
        {
          quiz_id: quiz.id,
          question: 'What is 2 + 2?',
          options: JSON.stringify(['3', '4', '5', '6']),
          correct_answer: '4',
          explanation: 'Basic math',
          order_index: 0
        },
        {
          quiz_id: quiz.id,
          question: 'What is the capital of France?',
          options: JSON.stringify(['London', 'Berlin', 'Paris', 'Madrid']),
          correct_answer: 'Paris',
          explanation: 'Geography',
          order_index: 1
        }
      ])
      .execute();

    const testInput: SubmitQuizInput = {
      user_id: user.id,
      quiz_id: quiz.id,
      answers: JSON.stringify(['4', 'Paris']) // Both correct
    };

    const result = await submitQuiz(testInput);

    // Check quiz attempt result
    expect(result.user_id).toBe(user.id);
    expect(result.quiz_id).toBe(quiz.id);
    expect(result.answers).toBe(JSON.stringify(['4', 'Paris']));
    expect(result.score).toBe(2);
    expect(result.total_questions).toBe(2);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.id).toBeDefined();
  });

  it('should save quiz attempt to database', async () => {
    // Create test data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'student',
        total_points: 50
      })
      .returning()
      .execute();
    const user = userResult[0];

    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'Python',
        difficulty: 'intermediate',
        created_by: user.id,
        is_published: true
      })
      .returning()
      .execute();
    const course = courseResult[0];

    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: course.id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();
    const lesson = lessonResult[0];

    const quizResult = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson.id,
        title: 'Test Quiz',
        description: 'A test quiz',
        points_reward: 80
      })
      .returning()
      .execute();
    const quiz = quizResult[0];

    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quiz.id,
        question: 'What is Python?',
        options: JSON.stringify(['Language', 'Snake', 'Both', 'Neither']),
        correct_answer: 'Both',
        explanation: null,
        order_index: 0
      })
      .execute();

    const testInput: SubmitQuizInput = {
      user_id: user.id,
      quiz_id: quiz.id,
      answers: JSON.stringify(['Both'])
    };

    const result = await submitQuiz(testInput);

    // Verify quiz attempt was saved
    const attempts = await db.select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.id, result.id))
      .execute();

    expect(attempts).toHaveLength(1);
    expect(attempts[0].user_id).toBe(user.id);
    expect(attempts[0].quiz_id).toBe(quiz.id);
    expect(attempts[0].score).toBe(1);
    expect(attempts[0].total_questions).toBe(1);
  });

  it('should update user progress and points', async () => {
    // Create test data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'student',
        total_points: 200
      })
      .returning()
      .execute();
    const user = userResult[0];

    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'advanced',
        created_by: user.id,
        is_published: true
      })
      .returning()
      .execute();
    const course = courseResult[0];

    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: course.id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();
    const lesson = lessonResult[0];

    const quizResult = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson.id,
        title: 'Test Quiz',
        description: 'A test quiz',
        points_reward: 60
      })
      .returning()
      .execute();
    const quiz = quizResult[0];

    await db.insert(quizQuestionsTable)
      .values([
        {
          quiz_id: quiz.id,
          question: 'Question 1',
          options: JSON.stringify(['A', 'B', 'C', 'D']),
          correct_answer: 'A',
          explanation: null,
          order_index: 0
        },
        {
          quiz_id: quiz.id,
          question: 'Question 2',
          options: JSON.stringify(['X', 'Y', 'Z', 'W']),
          correct_answer: 'Y',
          explanation: null,
          order_index: 1
        }
      ])
      .execute();

    const testInput: SubmitQuizInput = {
      user_id: user.id,
      quiz_id: quiz.id,
      answers: JSON.stringify(['A', 'Z']) // 1 out of 2 correct
    };

    await submitQuiz(testInput);

    // Check user progress was created
    const progress = await db.select()
      .from(userProgressTable)
      .where(and(
        eq(userProgressTable.user_id, user.id),
        eq(userProgressTable.quiz_id, quiz.id)
      ))
      .execute();

    expect(progress).toHaveLength(1);
    expect(progress[0].status).toBe('completed');
    expect(progress[0].points_earned).toBe(30); // 50% of 60 points

    // Check user total points were updated
    const updatedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(updatedUser[0].total_points).toBe(230); // 200 + 30
  });

  it('should handle partial correct answers', async () => {
    // Create test data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'student',
        total_points: 0
      })
      .returning()
      .execute();
    const user = userResult[0];

    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'Java',
        difficulty: 'beginner',
        created_by: user.id,
        is_published: true
      })
      .returning()
      .execute();
    const course = courseResult[0];

    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: course.id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();
    const lesson = lessonResult[0];

    const quizResult = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson.id,
        title: 'Test Quiz',
        description: 'A test quiz',
        points_reward: 100
      })
      .returning()
      .execute();
    const quiz = quizResult[0];

    await db.insert(quizQuestionsTable)
      .values([
        {
          quiz_id: quiz.id,
          question: 'Question 1',
          options: JSON.stringify(['A', 'B']),
          correct_answer: 'A',
          explanation: null,
          order_index: 0
        },
        {
          quiz_id: quiz.id,
          question: 'Question 2',
          options: JSON.stringify(['X', 'Y']),
          correct_answer: 'Y',
          explanation: null,
          order_index: 1
        },
        {
          quiz_id: quiz.id,
          question: 'Question 3',
          options: JSON.stringify(['1', '2']),
          correct_answer: '1',
          explanation: null,
          order_index: 2
        }
      ])
      .execute();

    const testInput: SubmitQuizInput = {
      user_id: user.id,
      quiz_id: quiz.id,
      answers: JSON.stringify(['A', 'X', '1']) // 2 out of 3 correct
    };

    const result = await submitQuiz(testInput);

    expect(result.score).toBe(2);
    expect(result.total_questions).toBe(3);

    // Check points calculation (2/3 * 100 = 66.66... -> 66)
    const progress = await db.select()
      .from(userProgressTable)
      .where(and(
        eq(userProgressTable.user_id, user.id),
        eq(userProgressTable.quiz_id, quiz.id)
      ))
      .execute();

    expect(progress[0].points_earned).toBe(66);
  });

  it('should reject submission for non-existent quiz', async () => {
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'student',
        total_points: 0
      })
      .returning()
      .execute();
    const user = userResult[0];

    const testInput: SubmitQuizInput = {
      user_id: user.id,
      quiz_id: 999999, // Non-existent quiz
      answers: JSON.stringify(['A'])
    };

    expect(submitQuiz(testInput)).rejects.toThrow(/quiz not found/i);
  });

  it('should reject submission for non-existent user', async () => {
    // Create a valid quiz first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'creator',
        email: 'creator@example.com',
        password_hash: 'hashed_password',
        role: 'admin',
        total_points: 0
      })
      .returning()
      .execute();
    const creator = userResult[0];

    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'Python',
        difficulty: 'beginner',
        created_by: creator.id,
        is_published: true
      })
      .returning()
      .execute();
    const course = courseResult[0];

    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: course.id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();
    const lesson = lessonResult[0];

    const quizResult = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson.id,
        title: 'Test Quiz',
        description: 'A test quiz',
        points_reward: 50
      })
      .returning()
      .execute();
    const quiz = quizResult[0];

    const testInput: SubmitQuizInput = {
      user_id: 999999, // Non-existent user
      quiz_id: quiz.id, // Valid quiz
      answers: JSON.stringify(['A'])
    };

    expect(submitQuiz(testInput)).rejects.toThrow(/user not found/i);
  });

  it('should reject submission with invalid answers format', async () => {
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'student',
        total_points: 0
      })
      .returning()
      .execute();
    const user = userResult[0];

    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'Python',
        difficulty: 'beginner',
        created_by: user.id,
        is_published: true
      })
      .returning()
      .execute();
    const course = courseResult[0];

    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: course.id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 1
      })
      .returning()
      .execute();
    const lesson = lessonResult[0];

    const quizResult = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson.id,
        title: 'Test Quiz',
        description: 'A test quiz',
        points_reward: 50
      })
      .returning()
      .execute();
    const quiz = quizResult[0];

    // Create quiz questions so we pass the questions check
    await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quiz.id,
        question: 'Test question',
        options: JSON.stringify(['A', 'B']),
        correct_answer: 'A',
        explanation: null,
        order_index: 0
      })
      .execute();

    const testInput: SubmitQuizInput = {
      user_id: user.id,
      quiz_id: quiz.id,
      answers: 'invalid json'
    };

    expect(submitQuiz(testInput)).rejects.toThrow(/invalid answers format/i);
  });
});
