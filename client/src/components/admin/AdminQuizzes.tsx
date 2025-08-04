
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

export function AdminQuizzes() {
  return (
    <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
      <CardHeader>
        <CardTitle className="text-gruvbox-fg0 flex items-center gap-2">
          <Target className="text-gruvbox-purple" />
          Quiz Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-gruvbox-bg3 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gruvbox-fg0 mb-2">Quiz Management</h3>
          <p className="text-gruvbox-fg2">
            Create quizzes with multiple choice questions, set correct answers, add explanations, and configure point rewards.
          </p>
          <p className="text-gruvbox-fg3 text-sm mt-4">
            🚧 Coming soon - Full quiz creation and question management system
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
