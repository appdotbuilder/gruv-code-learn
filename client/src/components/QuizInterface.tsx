
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { Play, CheckCircle, XCircle, Clock, Target } from 'lucide-react';
import type { Quiz, User, QuizQuestion, QuizAttempt } from '../../../server/src/schema';

interface QuizInterfaceProps {
  quiz: Quiz;
  user: User;
}

export function QuizInterface({ quiz, user }: QuizInterfaceProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const questionsData = await trpc.getQuizQuestions.query({ quizId: quiz.id });
      setQuestions(questionsData);
    } catch (error) {
      console.error('Failed to load quiz questions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [quiz.id]);

  useEffect(() => {
    if (isStarted) {
      loadQuestions();
    }
  }, [isStarted, loadQuestions]);

  const handleStartQuiz = () => {
    setIsStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setQuizAttempt(null);
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev: Record<number, string>) => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    try {
      const answersJson = JSON.stringify(answers);
      const result = await trpc.submitQuiz.mutate({
        user_id: user.id,
        quiz_id: quiz.id,
        answers: answersJson
      });
      setQuizAttempt(result);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredQuestions = Object.keys(answers).length;

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Clock className="h-8 w-8 text-gruvbox-yellow mx-auto mb-2 animate-spin" />
        <p className="text-gruvbox-fg2">Loading quiz questions...</p>
      </div>
    );
  }

  if (quizAttempt) {
    const scorePercentage = quizAttempt.total_questions > 0 ? (quizAttempt.score / quizAttempt.total_questions) * 100 : 0;
    const isPassed = scorePercentage >= 70; // 70% passing grade

    return (
      <Card className="bg-gruvbox-bg0 border-gruvbox-bg3">
        <CardHeader className="text-center">
          <CardTitle className="text-gruvbox-fg0 flex items-center justify-center gap-2">
            {isPassed ? (
              <CheckCircle className="text-gruvbox-green" />
            ) : (
              <XCircle className="text-gruvbox-red" />
            )}
            Quiz Completed!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2" style={{ 
              color: isPassed ? 'var(--gruvbox-green)' : 'var(--gruvbox-red)' 
            }}>
              {quizAttempt.score}/{quizAttempt.total_questions}
            </div>
            <p className="text-gruvbox-fg2">
              You scored {scorePercentage.toFixed(1)}%
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gruvbox-fg2">Score</span>
              <span className="text-gruvbox-fg1">{scorePercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={scorePercentage} 
              className="bg-gruvbox-bg2"
            />
          </div>

          <Alert className={`${isPassed ? 'border-gruvbox-green' : 'border-gruvbox-red'} bg-gruvbox-bg2`}>
            <AlertDescription className={isPassed ? 'text-gruvbox-green' : 'text-gruvbox-red'}>
              {isPassed ? (
                <>
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  Congratulations! You passed the quiz and earned {quiz.points_reward} points! 🎉
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 inline mr-2" />
                  You need at least 70% to pass this quiz. Review the lesson and try again!
                </>
              )}
            </AlertDescription>
          </Alert>

          <div className="text-center text-gruvbox-fg3 text-sm">
            Completed: {quizAttempt.completed_at.toLocaleString()}
          </div>

          <Button 
            onClick={handleStartQuiz}
            variant="outline"
            className="w-full border-gruvbox-bg3 text-gruvbox-fg1 hover:bg-gruvbox-bg2"
          >
            Take Quiz Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isStarted) {
    return (
      <Card className="bg-gruvbox-bg0 border-gruvbox-bg3">
        <CardHeader className="text-center">
          <CardTitle className="text-gruvbox-fg0 flex items-center justify-center gap-2">
            <Target className="text-gruvbox-purple" />
            Ready to Start Quiz?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gruvbox-fg2">
            Test your knowledge with this quiz. You'll need at least 70% to pass.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gruvbox-fg3">
            <span>🎯 Earn {quiz.points_reward} points</span>
            <span>•</span>
            <span>⏱️ No time limit</span>
          </div>
          <Button 
            onClick={handleStartQuiz}
            className="bg-gruvbox-purple text-gruvbox-bg0 hover:bg-gruvbox-aqua"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Alert className="bg-gruvbox-bg2 border-gruvbox-bg3">
        <AlertDescription className="text-gruvbox-fg2">
          No questions available for this quiz yet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gruvbox-fg2 text-sm">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <Badge variant="outline" className="border-gruvbox-bg3 text-gruvbox-fg2">
            {answeredQuestions}/{questions.length} answered
          </Badge>
        </div>
        <Progress value={progress} className="bg-gruvbox-bg2" />
      </div>

      {/* Current Question */}
      <Card className="bg-gruvbox-bg0 border-gruvbox-bg3">
        <CardHeader>
          <CardTitle className="text-gruvbox-fg0 text-lg">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion.id] || ''}
            onValueChange={(value: string) => handleAnswerChange(currentQuestion.id, value)}
          >
            {JSON.parse(currentQuestion.options || '[]').map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2 p-2 rounded hover:bg-gruvbox-bg1">
                <RadioGroupItem 
                  value={option} 
                  id={`option-${index}`}
                  className="border-gruvbox-bg3 text-gruvbox-yellow"
                />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="text-gruvbox-fg1 flex-1 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {currentQuestion.explanation && answers[currentQuestion.id] && (
            <Alert className="mt-4 bg-gruvbox-bg2 border-gruvbox-blue">
              <AlertDescription className="text-gruvbox-fg2">
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="border-gruvox-bg3 text-gruvbox-fg1 hover:bg-gruvbox-bg2"
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              onClick={handleNextQuestion}
              className="bg-gruvbox-blue text-gruvbox-bg0 hover:bg-gruvbox-aqua"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting || answeredQuestions < questions.length}
              className="bg-gruvbox-green text-gruvbox-bg0 hover:bg-gruvbox-aqua"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Quiz
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Answer Progress */}
      <div className="flex flex-wrap gap-2">
        {questions.map((question: QuizQuestion, index: number) => (
          <Button
            key={question.id}
            variant="outline"
            size="sm"
            onClick={() => setCurrentQuestionIndex(index)}
            className={`w-10 h-10 p-0 ${
              answers[question.id] 
                ? 'bg-gruvbox-green text-gruvbox-bg0 border-gruvbox-green' 
                : 'border-gruvbox-bg3 text-gruvbox-fg2 hover:bg-gruvbox-bg2'
            } ${
              index === currentQuestionIndex 
                ? 'ring-2 ring-gruvbox-yellow' 
                : ''
            }`}
          >
            {index + 1}
          </Button>
        ))}
      </div>
    </div>
  );
}
