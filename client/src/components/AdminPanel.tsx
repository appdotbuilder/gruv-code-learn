
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, BookOpen, Code, Target, Trophy } from 'lucide-react';
import { AdminCourses } from '@/components/admin/AdminCourses';
import { AdminLessons } from '@/components/admin/AdminLessons';
import { AdminExercises } from '@/components/admin/AdminExercises';
import { AdminQuizzes } from '@/components/admin/AdminQuizzes';
import { AdminBadges } from '@/components/admin/AdminBadges';

interface AdminPanelProps {
  onDataUpdate: () => void;
}

export function AdminPanel({ onDataUpdate }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('courses');

  return (
    <div className="space-y-6">
      <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
        <CardHeader>
          <CardTitle className="text-2xl text-gruvbox-fg0 flex items-center gap-2">
            <Settings className="text-gruvbox-yellow" />
            Admin Panel
          </CardTitle>
          <p className="text-gruvbox-fg2">
            Manage courses, lessons, exercises, quizzes, and gamification features
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gruvbox-bg1">
          <TabsTrigger 
            value="courses"
            className="data-[state=active]:bg-gruvbox-bg2 data-[state=active]:text-gruvbox-yellow"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Courses
          </TabsTrigger>
          <TabsTrigger 
            value="lessons"
            className="data-[state=active]:bg-gruvbox-bg2 data-[state=active]:text-gruvbox-yellow"
          >
            <Code className="h-4 w-4 mr-2" />
            Lessons
          </TabsTrigger>
          <TabsTrigger 
            value="exercises"
            className="data-[state=active]:bg-gruvbox-bg2 data-[state=active]:text-gruvbox-yellow"
          >
            <Settings className="h-4 w-4 mr-2" />
            Exercises
          </TabsTrigger>
          <TabsTrigger 
            value="quizzes"
            className="data-[state=active]:bg-gruvbox-bg2 data-[state=active]:text-gruvbox-yellow"
          >
            <Target className="h-4 w-4 mr-2" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger 
            value="badges"
            className="data-[state=active]:bg-gruvbox-bg2 data-[state=active]:text-gruvbox-yellow"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Badges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-6">
          <AdminCourses onDataUpdate={onDataUpdate} />
        </TabsContent>

        <TabsContent value="lessons" className="mt-6">
          <AdminLessons />
        </TabsContent>

        <TabsContent value="exercises" className="mt-6">
          <AdminExercises />
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          <AdminQuizzes />
        </TabsContent>

        <TabsContent value="badges" className="mt-6">
          <AdminBadges />
        </TabsContent>
      </Tabs>
    </div>
  );
}
