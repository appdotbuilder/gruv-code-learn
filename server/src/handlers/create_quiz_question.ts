
import { db } from '../db';
import { quizQuestionsTable } from '../db/schema';
import { type CreateQuizQuestionInput, type QuizQuestion } from '../schema';

export const createQuizQuestion = async (input: CreateQuizQuestionInput): Promise<QuizQuestion> => {
  try {
    // Insert quiz question record
    const result = await db.insert(quizQuestionsTable)
      .values({
        quiz_id: input.quiz_id,
        question: input.question,
        options: input.options,
        correct_answer: input.correct_answer,
        explanation: input.explanation,
        order_index: input.order_index
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Quiz question creation failed:', error);
    throw error;
  }
};
