
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { BookOpen, Code, Trophy, Target, Star, Clock } from 'lucide-react';
import type { User, UserProgress, UserBadge } from '../../../server/src/schema';

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [progressData, badgeData] = await Promise.all([
        trpc.getUserProgress.query({ userId: user.id }),
        trpc.getUserBadges.query({ userId: user.id })
      ]);
      setUserProgress(progressData);
      setUserBadges(badgeData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate statistics
  const completedLessons = userProgress.filter(p => p.status === 'completed' && p.lesson_id).length;
  const completedExercises = userProgress.filter(p => p.status === 'completed' && p.exercise_id).length;
  const completedQuizzes = userProgress.filter(p => p.status === 'completed' && p.quiz_id).length;
  const totalActivities = userProgress.length;
  const completionRate = totalActivities > 0 ? (userProgress.filter(p => p.status === 'completed').length / totalActivities) * 100 : 0;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gruvbox-bg1 border-gruvbox-bg3 animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gruvbox-bg2 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
        <CardHeader>
          <CardTitle className="text-2xl text-gruvbox-fg0 flex items-center gap-2">
            <Star className="text-gruvbox-yellow" />
            Welcome back, {user.username}! 🚀
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gruvbox-fg2 mb-4">
            Continue your journey in backend development. You're doing great!
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-gruvbox-orange" />
              <span className="text-gruvbox-fg1 font-medium">{user.total_points} points earned</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gruvbox-green" />
              <span className="text-gruvbox-fg1 font-medium">{completionRate.toFixed(1)}% completion rate</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gruvbox-fg2 text-sm">Lessons Completed</p>
                <p className="text-2xl font-bold text-gruvbox-fg0">{completedLessons}</p>
              </div>
              <BookOpen className="h-8 w-8 text-gruvbox-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gruvbox-fg2 text-sm">Exercises Solved</p>
                <p className="text-2xl font-bold text-gruvbox-fg0">{completedExercises}</p>
              </div>
              <Code className="h-8 w-8 text-gruvbox-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gruvbox-fg2 text-sm">Quizzes Passed</p>
                <p className="text-2xl font-bold text-gruvbox-fg0">{completedQuizzes}</p>
              </div>
              <Target className="h-8 w-8 text-gruvbox-purple" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gruvbox-fg2 text-sm">Badges Earned</p>
                <p className="text-2xl font-bold text-gruvbox-fg0">{userBadges.length}</p>
              </div>
              <Trophy className="h-8 w-8 text-gruvbox-orange" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
          <CardHeader>
            <CardTitle className="text-gruvbox-fg0 flex items-center gap-2">
              <Target className="text-gruvbox-aqua" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gruvbox-fg2">Completion Rate</span>
                <span className="text-gruvbox-fg1">{completionRate.toFixed(1)}%</span>
              </div>
              <Progress 
                value={completionRate} 
                className="bg-gruvbox-bg2"
              />
            </div>
            
            {totalActivities > 0 && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gruvbox-fg2">Completed Activities</span>
                  <span className="text-gruvbox-green">
                    {userProgress.filter(p => p.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gruvbox-fg2">In Progress</span>
                  <span className="text-gruvbox-yellow">
                    {userProgress.filter(p => p.status === 'started').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gruvbox-fg2">Total Activities</span>
                  <span className="text-gruvbox-fg1">{totalActivities}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
          <CardHeader>
            <CardTitle className="text-gruvbox-fg0 flex items-center gap-2">
              <Trophy className="text-gruvbox-orange" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userBadges.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gruvbox-bg3 mx-auto mb-3" />
                <p className="text-gruvbox-fg2">No badges earned yet</p>
                <p className="text-sm text-gruvbox-fg3 mt-1">
                  Complete exercises and quizzes to earn your first badge! 🏆
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userBadges.slice(0, 3).map((userBadge: UserBadge) => (
                  <div key={userBadge.id} className="flex items-center gap-3 p-3 bg-gruvbox-bg2 rounded-lg">
                    <div className="text-2xl">🏆</div>
                    <div className="flex-1">
                      <p className="text-gruvbox-fg1 font-medium">Achievement Unlocked</p>
                      <p className="text-gruvbox-fg3 text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {userBadge.earned_at.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {userBadges.length > 3 && (
                  <p className="text-center text-gruvbox-fg3 text-sm">
                    +{userBadges.length - 3} more badges
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
        <CardHeader>
          <CardTitle className="text-gruvbox-fg0 flex items-center gap-2">
            <Clock className="text-gruvbox-purple" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userProgress.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gruvbox-bg3 mx-auto mb-3" />
              <p className="text-gruvbox-fg2">No activity yet</p>
              <p className="text-sm text-gruvbox-fg3 mt-1">
                Start learning by enrolling in a course! 📚
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userProgress
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((progress: UserProgress) => (
                  <div key={progress.id} className="flex items-center justify-between p-3 bg-gruvbox-bg2 rounded-lg">
                    <div className="flex items-center gap-3">
                      {progress.lesson_id && <BookOpen className="h-4 w-4 text-gruvbox-blue" />}
                      {progress.exercise_id && <Code className="h-4 w-4 text-gruvbox-green" />}
                      {progress.quiz_id && <Target className="h-4 w-4 text-gruvbox-purple" />}
                      <div>
                        <p className="text-gruvbox-fg1 text-sm">
                          {progress.lesson_id && 'Lesson'}
                          {progress.exercise_id && 'Exercise'}
                          {progress.quiz_id && 'Quiz'}
                          {' '}activity
                        </p>
                        <p className="text-gruvbox-fg3 text-xs">
                          {progress.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={progress.status === 'completed' ? 'default' : 'secondary'}
                        className={progress.status === 'completed' 
                          ? 'bg-gruvbox-green text-gruvbox-bg0' 
                          : 'bg-gruvbox-bg3 text-gruvbox-fg2'
                        }
                      >
                        {progress.status}
                      </Badge>
                      {progress.points_earned > 0 && (
                        <span className="text-gruvbox-orange text-sm font-medium">
                          +{progress.points_earned}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
