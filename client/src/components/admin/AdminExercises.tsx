
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code } from 'lucide-react';

export function AdminExercises() {
  return (
    <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
      <CardHeader>
        <CardTitle className="text-gruvbox-fg0 flex items-center gap-2">
          <Code className="text-gruvbox-green" />
          Exercise Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Code className="h-16 w-16 text-gruvbox-bg3 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gruvbox-fg0 mb-2">Exercise Management</h3>
          <p className="text-gruvbox-fg2">
            Create coding exercises with starter code, test cases, and solutions. Set point rewards and manage exercise difficulty.
          </p>
          <p className="text-gruvbox-fg3 text-sm mt-4">
            🚧 Coming soon - Full exercise creation and management tools
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
