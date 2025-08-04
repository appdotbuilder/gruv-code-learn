
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Exercise, User, CodeSubmission } from '../../../server/src/schema';

interface TestResult {
  passed: boolean;
  message: string;
  expected?: string;
  actual?: string;
}

interface CodeEditorProps {
  exercise: Exercise;
  user: User;
}

export function CodeEditor({ exercise, user }: CodeEditorProps) {
  const [code, setCode] = useState(exercise.starter_code || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState<CodeSubmission | null>(null);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await trpc.submitCode.mutate({
        user_id: user.id,
        exercise_id: exercise.id,
        code
      });
      setSubmission(result);
      
      // Parse test results if available
      if (result.test_results) {
        try {
          const parsedResults = JSON.parse(result.test_results) as TestResult[];
          setTestResults(parsedResults);
        } catch (error) {
          console.error('Failed to parse test results:', error);
          setTestResults(null);
        }
      }
    } catch (error) {
      console.error('Failed to submit code:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-gruvbox-green" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-gruvbox-red" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gruvbox-yellow" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-gruvbox-green text-gruvbox-bg0';
      case 'failed':
        return 'bg-gruvbox-red text-gruvbox-bg0';
      case 'pending':
        return 'bg-gruvbox-yellow text-gruvbox-bg0';
      default:
        return 'bg-gruvbox-bg3 text-gruvbox-fg2';
    }
  };

  return (
    <div className="space-y-4">
      {/* Code Editor */}
      <div className="space-y-2">
        <label className="text-gruvbox-fg2 text-sm font-medium">Your Code:</label>
        <Textarea
          value={code}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCode(e.target.value)}
          className="font-mono text-sm bg-gruvbox-bg0 border-gruvbox-bg3 text-gruvbox-fg1 focus:border-gruvbox-yellow min-h-[300px] gruvbox-scrollbar"
          placeholder="Write your solution here..."
        />
      </div>

      {/* Test Cases Preview */}
      <div className="bg-gruvbox-bg0 border border-gruvbox-bg3 rounded-lg p-4">
        <h4 className="text-gruvbox-fg1 font-medium mb-2">Test Cases:</h4>
        <pre className="text-gruvbox-fg2 text-sm whitespace-pre-wrap">
          {exercise.test_cases || 'No test cases provided'}
        </pre>
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !code.trim()}
          className="bg-gruvbox-green text-gruvbox-bg0 hover:bg-gruvbox-aqua"
        >
          {isSubmitting ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Submit Solution
            </>
          )}
        </Button>
        
        {submission && (
          <div className="flex items-center gap-2">
            {getStatusIcon(submission.status)}
            <Badge className={getStatusColor(submission.status)}>
              {submission.status}
            </Badge>
          </div>
        )}
      </div>

      {/* Submission Results */}
      {submission && (
        <Alert className="bg-gruvbox-bg2 border-gruvbox-bg3">
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gruvbox-fg1 font-medium">
                  Submission Status: {submission.status}
                </span>
                <span className="text-gruvbox-fg3 text-sm">
                  {submission.submitted_at.toLocaleString()}
                </span>
              </div>
              
              {testResults && (
                <div className="mt-3">
                  <h5 className="text-gruvbox-fg1 font-medium mb-2">Test Results:</h5>
                  <div className="space-y-2">
                    {testResults.map((result: TestResult, index: number) => (
                      <div key={index} className="bg-gruvbox-bg0 p-2 rounded border border-gruvbox-bg3">
                        <div className="flex items-center gap-2 mb-1">
                          {result.passed ? (
                            <CheckCircle className="h-4 w-4 text-gruvbox-green" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gruvbox-red" />
                          )}
                          <span className={`text-sm font-medium ${result.passed ? 'text-gruvbox-green' : 'text-gruvbox-red'}`}>
                            Test {index + 1}: {result.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        <p className="text-gruvbox-fg2 text-sm">{result.message}</p>
                        {result.expected && result.actual && (
                          <div className="text-xs text-gruvbox-fg3 mt-1">
                            <div>Expected: {result.expected}</div>
                            <div>Actual: {result.actual}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {submission.status === 'passed' && (
                <div className="text-gruvbox-green text-sm flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Congratulations! You earned {exercise.points_reward} points! 🎉
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Solution Preview (for debugging - would be hidden in production) */}
      <details className="bg-gruvbox-bg2 border border-gruvbox-bg3 rounded-lg p-4">
        <summary className="text-gruvbox-fg2 cursor-pointer hover:text-gruvbox-yellow">
          💡 Solution Preview (Development Only)
        </summary>
        <pre className="text-gruvbox-fg3 text-sm mt-2 whitespace-pre-wrap">
          {exercise.solution_code}
        </pre>
      </details>
    </div>
  );
}
