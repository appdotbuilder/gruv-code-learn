
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export function AdminBadges() {
  return (
    <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
      <CardHeader>
        <CardTitle className="text-gruvbox-fg0 flex items-center gap-2">
          <Trophy className="text-gruvbox-orange" />
          Badge Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-gruvbox-bg3 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gruvbox-fg0 mb-2">Badge System</h3>
          <p className="text-gruvbox-fg2">
            Create and manage achievement badges to gamify the learning experience. Set requirements based on points, completed courses, or exercises.
          </p>
          <p className="text-gruvbox-fg3 text-sm mt-4">
            🚧 Coming soon - Full badge creation and achievement system
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
