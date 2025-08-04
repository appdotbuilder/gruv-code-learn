
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export function AdminLessons() {
  return (
    <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
      <CardHeader>
        <CardTitle className="text-gruvbox-fg0 flex items-center gap-2">
          <BookOpen className="text-gruvbox-blue" />
          Lesson Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gruvbox-bg3 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gruvbox-fg0 mb-2">Lesson Management</h3>
          <p className="text-gruvbox-fg2">
            Create and manage lessons for your courses. This feature will allow you to add rich content, organize lesson order, and manage lesson visibility.
          </p>
          <p className="text-gruvbox-fg3 text-sm mt-4">
            🚧 Coming soon - Full lesson management interface
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
