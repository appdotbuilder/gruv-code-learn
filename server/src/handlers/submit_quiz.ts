
import { db } from '../db';
import { quizAttemptsTable, quizzesTable, quizQuestionsTable, userProgressTable, usersTable, lessonsTable } from '../db/schema';
import { type SubmitQuizInput, type QuizAttempt } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function submitQuiz(input: SubmitQuizInput): Promise<QuizAttempt> {
  try {
    // Verify quiz exists and get quiz with lesson info
    const quizWithLesson = await db.select({
      quiz: quizzesTable,
      lesson: lessonsTable
    })
      .from(quizzesTable)
      .innerJoin(lessonsTable, eq(quizzesTable.lesson_id, lessonsTable.id))
      .where(eq(quizzesTable.id, input.quiz_id))
      .execute();

    if (quizWithLesson.length === 0) {
      throw new Error('Quiz not found');
    }

    const quiz = quizWithLesson[0].quiz;
    const lesson = quizWithLesson[0].lesson;

    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Get quiz questions to calculate score
    const questions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, input.quiz_id))
      .execute();

    if (questions.length === 0) {
      throw new Error('No questions found for this quiz');
    }

    // Parse user answers
    let userAnswers: string[];
    try {
      userAnswers = JSON.parse(input.answers);
    } catch (error) {
      throw new Error('Invalid answers format');
    }

    // Calculate score
    let correctAnswers = 0;
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = userAnswers[i];
      if (userAnswer === question.correct_answer) {
        correctAnswers++;
      }
    }

    // Insert quiz attempt
    const attemptResult = await db.insert(quizAttemptsTable)
      .values({
        user_id: input.user_id,
        quiz_id: input.quiz_id,
        answers: input.answers,
        score: correctAnswers,
        total_questions: questions.length
      })
      .returning()
      .execute();

    const attempt = attemptResult[0];

    // Calculate points earned (full points if all correct, proportional otherwise)
    const pointsEarned = Math.floor((correctAnswers / questions.length) * quiz.points_reward);

    // Update user progress
    const existingProgress = await db.select()
      .from(userProgressTable)
      .where(and(
        eq(userProgressTable.user_id, input.user_id),
        eq(userProgressTable.quiz_id, input.quiz_id)
      ))
      .execute();

    if (existingProgress.length === 0) {
      // Create new progress record
      await db.insert(userProgressTable)
        .values({
          user_id: input.user_id,
          course_id: lesson.course_id,
          quiz_id: input.quiz_id,
          lesson_id: null,
          exercise_id: null,
          status: 'completed',
          points_earned: pointsEarned,
          completed_at: new Date()
        })
        .execute();
    } else {
      // Update existing progress if this attempt scored better
      const currentProgress = existingProgress[0];
      if (pointsEarned > currentProgress.points_earned) {
        await db.update(userProgressTable)
          .set({
            status: 'completed',
            points_earned: pointsEarned,
            completed_at: new Date()
          })
          .where(eq(userProgressTable.id, currentProgress.id))
          .execute();
      }
    }

    // Update user total points (add the difference if this is a better attempt)
    const pointsDifference = existingProgress.length > 0 
      ? Math.max(0, pointsEarned - existingProgress[0].points_earned)
      : pointsEarned;

    if (pointsDifference > 0) {
      await db.update(usersTable)
        .set({
          total_points: user[0].total_points + pointsDifference,
          updated_at: new Date()
        })
        .where(eq(usersTable.id, input.user_id))
        .execute();
    }

    return attempt;
  } catch (error) {
    console.error('Quiz submission failed:', error);
    throw error;
  }
}
