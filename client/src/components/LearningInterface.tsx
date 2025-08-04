
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { ArrowLeft, BookOpen, Code, Target, ChevronRight } from 'lucide-react';
import { CodeEditor } from '@/components/CodeEditor';
import { QuizInterface } from '@/components/QuizInterface';
import type { Course, User, Lesson, Exercise, Quiz } from '../../../server/src/schema';

interface LearningInterfaceProps {
  course: Course;
  user: User;
  onBack: () => void;
}

export function LearningInterface({ course, user, onBack }: LearningInterfaceProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [isLoading, setIsLoading] = useState(true);

  const loadCourseContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const lessonsData = await trpc.getLessonsByCourse.query({ courseId: course.id });
      setLessons(lessonsData);
      
      if (lessonsData.length > 0 && !selectedLesson) {
        setSelectedLesson(lessonsData[0]);
      }
    } catch (error) {
      console.error('Failed to load course content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [course.id, selectedLesson]);

  const loadLessonContent = useCallback(async (lessonId: number) => {
    try {
      const [exercisesData, quizzesData] = await Promise.all([
        trpc.getExercisesByLesson.query({ lessonId }),
        trpc.getQuizzesByLesson.query({ lessonId })
      ]);
      setExercises(exercisesData);
      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Failed to load lesson content:', error);
    }
  }, []);

  useEffect(() => {
    loadCourseContent();
  }, [loadCourseContent]);

  useEffect(() => {
    if (selectedLesson) {
      loadLessonContent(selectedLesson.id);
    }
  }, [selectedLesson, loadLessonContent]);

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setActiveTab('content');
  };

  const difficultyColors = {
    beginner: 'bg-gruvbox-green text-gruvbox-bg0',
    intermediate: 'bg-gruvbox-yellow text-gruvbox-bg0',
    advanced: 'bg-gruvbox-red text-gruvbox-bg0'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gruvbox-bg0 p-6">
        <div className="container mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gruvbox-bg1 rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-6">
              <div className="h-96 bg-gruvbox-bg1 rounded"></div>
              <div className="col-span-3 h-96 bg-gruvbox-bg1 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gruvbox-bg0">
      {/* Header */}
      <header className="bg-gruvbox-bg1 border-b border-gruvbox-bg3 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-gruvbox-fg2 hover:text-gruvbox-yellow hover:bg-gruvbox-bg2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-xl font-bold text-gruvbox-fg0">{course.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={difficultyColors[course.difficulty]}>
                  {course.difficulty}
                </Badge>
                <span className="text-gruvbox-fg3 text-sm">• {course.language}</span>
              </div>
            </div>
          </div>
          <div className="text-gruvbox-fg2 text-sm">
            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} available
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lesson Sidebar */}
          <Card className="bg-gruvbox-bg1 border-gruvbox-bg3 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-gruvbox-fg0 flex items-center gap-2">
                <BookOpen className="text-gruvbox-blue" />
                Course Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lessons.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gruvbox-bg3 mx-auto mb-3" />
                  <p className="text-gruvbox-fg2 text-sm">No lessons available</p>
                </div>
              ) : (
                lessons.map((lesson: Lesson, index: number) => (
                  <Button
                    key={lesson.id}
                    variant={selectedLesson?.id === lesson.id ? "default" : "ghost"}
                    className={`w-full justify-start text-left p-3 h-auto ${
                      selectedLesson?.id === lesson.id
                        ? 'bg-gruvbox-yellow text-gruvbox-bg0 hover:bg-gruvbox-orange'
                        : 'text-gruvbox-fg2 hover:text-gruvbox-fg0 hover:bg-gruvbox-bg2'
                    }`}
                    onClick={() => handleLessonSelect(lesson)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gruvbox-bg2 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{lesson.title}</div>
                        <div className="text-xs opacity-75 truncate">
                          Updated: {lesson.updated_at.toLocaleDateString()}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    </div>
                  </Button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedLesson ? (
              <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
                <CardHeader>
                  <CardTitle className="text-gruvbox-fg0 text-2xl">
                    {selectedLesson.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 bg-gruvbox-bg2">
                      <TabsTrigger 
                        value="content"
                        className="data-[state=active]:bg-gruvbox-bg1 data-[state=active]:text-gruvbox-yellow"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Lesson Content
                      </TabsTrigger>
                      <TabsTrigger 
                        value="exercises"
                        className="data-[state=active]:bg-gruvbox-bg1 data-[state=active]:text-gruvbox-yellow"
                      >
                        <Code className="h-4 w-4 mr-2" />
                        Exercises ({exercises.length})
                      </TabsTrigger>
                      <TabsTrigger 
                        value="quizzes"
                        className="data-[state=active]:bg-gruvbox-bg1 data-[state=active]:text-gruvbox-yellow"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Quizzes ({quizzes.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="mt-6">
                      <div className="prose prose-invert max-w-none">
                        <div 
                          className="text-gruvbox-fg1 leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="exercises" className="mt-6">
                      {exercises.length === 0 ? (
                        <div className="text-center py-12">
                          <Code className="h-16 w-16 text-gruvbox-bg3 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gruvbox-fg0 mb-2">No Exercises Available</h3>
                          <p className="text-gruvbox-fg2">
                            No coding exercises have been created for this lesson yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {exercises.map((exercise: Exercise) => (
                            <Card key={exercise.id} className="bg-gruvbox-bg2 border-gruvbox-bg3">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-gruvbox-fg0">{exercise.title}</CardTitle>
                                  <Badge className="bg-gruvbox-orange text-gruvbox-bg0">
                                    {exercise.points_reward} points
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-gruvbox-fg2 mb-4">{exercise.description}</p>
                                <CodeEditor 
                                  exercise={exercise}
                                  user={user}
                                />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="quizzes" className="mt-6">
                      {quizzes.length === 0 ? (
                        <div className="text-center py-12">
                          <Target className="h-16 w-16 text-gruvbox-bg3 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gruvbox-fg0 mb-2">No Quizzes Available</h3>
                          <p className="text-gruvbox-fg2">
                            No quizzes have been created for this lesson yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {quizzes.map((quiz: Quiz) => (
                            <Card key={quiz.id} className="bg-gruvbox-bg2 border-gruvbox-bg3">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-gruvbox-fg0">{quiz.title}</CardTitle>
                                  <Badge className="bg-gruvbox-purple text-gruvbox-bg0">
                                    {quiz.points_reward} points
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-gruvbox-fg2 mb-4">{quiz.description}</p>
                                <QuizInterface 
                                  quiz={quiz}
                                  user={user}
                                />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-16 w-16 text-gruvbox-bg3 mb-4" />
                  <h3 className="text-xl font-semibold text-gruvbox-fg0 mb-2">Welcome to {course.title}</h3>
                  <p className="text-gruvbox-fg2 text-center max-w-md mb-6">
                    {course.description}
                  </p>
                  <p className="text-gruvbox-fg3 text-center">
                    Select a lesson from the sidebar to start learning! 🚀
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
