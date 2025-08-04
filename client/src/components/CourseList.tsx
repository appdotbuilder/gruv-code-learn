
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, User, Play, Star } from 'lucide-react';
import type { Course } from '../../../server/src/schema';

interface CourseListProps {
  courses: Course[];
  onCourseSelect: (course: Course) => void;
  onCoursesUpdate: () => void;
}

const difficultyColors = {
  beginner: 'bg-gruvbox-green text-gruvbox-bg0',
  intermediate: 'bg-gruvbox-yellow text-gruvbox-bg0',
  advanced: 'bg-gruvbox-red text-gruvbox-bg0'
};

const difficultyIcons = {
  beginner: '🌱',
  intermediate: '🚀',
  advanced: '⚡'
};

export function CourseList({ courses, onCourseSelect }: CourseListProps) {
  const [isLoading] = useState(false);

  // Filter only published courses for students
  const publishedCourses = courses.filter(course => course.is_published);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-gruvbox-bg1 border-gruvbox-bg3 animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gruvbox-bg2 rounded w-3/4"></div>
                <div className="h-3 bg-gruvbox-bg2 rounded"></div>
                <div className="h-3 bg-gruvbox-bg2 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (publishedCourses.length === 0) {
    return (
      <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-16 w-16 text-gruvbox-bg3 mb-4" />
          <h3 className="text-xl font-semibold text-gruvbox-fg0 mb-2">No Courses Available</h3>
          <p className="text-gruvbox-fg2 text-center max-w-md">
            There are no published courses available yet. Check back later for new learning opportunities! 📚
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gruvbox-fg0 flex items-center gap-2">
            <BookOpen className="text-gruvbox-blue" />
            Available Courses
          </h2>
          <p className="text-gruvbox-fg2 mt-1">
            Choose a course to start your learning journey in backend development
          </p>
        </div>
        <div className="text-gruvbox-fg2">
          {publishedCourses.length} course{publishedCourses.length !== 1 ? 's' : ''} available
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {publishedCourses.map((course: Course) => (
          <Card 
            key={course.id} 
            className="bg-gruvbox-bg1 border-gruvbox-bg3 hover:border-gruvbox-yellow transition-colors cursor-pointer group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-gruvbox-fg0 text-lg leading-tight line-clamp-2 group-hover:text-gruvbox-yellow transition-colors">
                  {course.title}
                </CardTitle>
                <div className="flex-shrink-0">
                  <Badge className={difficultyColors[course.difficulty]}>
                    <span className="mr-1">{difficultyIcons[course.difficulty]}</span>
                    {course.difficulty}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-gruvbox-fg2 text-sm line-clamp-3 leading-relaxed">
                {course.description}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gruvbox-fg3">
                    <Clock className="h-4 w-4" />
                    <span>Language: {course.language}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gruvbox-fg3">
                    <User className="h-4 w-4" />
                    <span>ID: {course.created_by}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gruvbox-fg3">
                  <Star className="h-4 w-4" />
                  <span>Created: {course.created_at.toLocaleDateString()}</span>
                </div>
              </div>

              <Button 
                onClick={() => onCourseSelect(course)}
                className="w-full bg-gruvbox-yellow text-gruvbox-bg0 hover:bg-gruvbox-orange transition-colors group-hover:bg-gruvbox-orange"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Learning
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Statistics */}
      <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
        <CardHeader>
          <CardTitle className="text-gruvbox-fg0 flex items-center gap-2">
            <Star className="text-gruvbox-purple" />
            Course Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gruvbox-bg2 rounded-lg">
              <div className="text-2xl mb-2">🌱</div>
              <p className="text-gruvbox-fg1 font-medium">
                {publishedCourses.filter(c => c.difficulty === 'beginner').length}
              </p>
              <p className="text-gruvbox-fg3 text-sm">Beginner Courses</p>
            </div>
            <div className="text-center p-4 bg-gruvbox-bg2 rounded-lg">
              <div className="text-2xl mb-2">🚀</div>
              <p className="text-gruvbox-fg1 font-medium">
                {publishedCourses.filter(c => c.difficulty === 'intermediate').length}
              </p>
              <p className="text-gruvbox-fg3 text-sm">Intermediate Courses</p>
            </div>
            <div className="text-center p-4 bg-gruvbox-bg2 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <p className="text-gruvbox-fg1 font-medium">
                {publishedCourses.filter(c => c.difficulty === 'advanced').length}
              </p>
              <p className="text-gruvbox-fg3 text-sm">Advanced Courses</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
