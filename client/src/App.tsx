
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Code, Trophy, Users, Settings, LogOut } from 'lucide-react';
import { LoginForm } from '@/components/LoginForm';
import { Dashboard } from '@/components/Dashboard';
import { CourseList } from '@/components/CourseList';
import { LearningInterface } from '@/components/LearningInterface';
import { AdminPanel } from '@/components/AdminPanel';
import { Leaderboard } from '@/components/Leaderboard';
import type { User, Course } from '../../server/src/schema';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Load courses on app start
  const loadCourses = useCallback(async () => {
    try {
      const result = await trpc.getCourses.query();
      setCourses(result);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleLogin = (user: User) => {
    setAuthState({
      isAuthenticated: true,
      user
    });
  };

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null
    });
    setActiveTab('dashboard');
    setSelectedCourse(null);
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setActiveTab('learning');
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setActiveTab('courses');
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gruvbox-bg0 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gruvbox-fg0 flex items-center justify-center gap-2">
                <Code className="text-gruvbox-yellow" />
                CodeLearn Platform
              </CardTitle>
              <p className="text-gruvbox-fg2">Master backend development through interactive coding</p>
            </CardHeader>
            <CardContent>
              <LoginForm onLogin={handleLogin} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <LearningInterface 
        course={selectedCourse}
        user={authState.user!}
        onBack={handleBackToCourses}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gruvbox-bg0">
      {/* Header */}
      <header className="bg-gruvbox-bg1 border-b border-gruvbox-bg3 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code className="h-8 w-8 text-gruvbox-yellow" />
            <h1 className="text-xl font-bold text-gruvbox-fg0">CodeLearn Platform</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-gruvbox-orange" />
              <span className="text-gruvbox-fg1">{authState.user?.total_points} points</span>
            </div>
            <Badge variant="secondary" className="bg-gruvbox-bg2 text-gruvbox-fg1">
              {authState.user?.role}
            </Badge>
            <span className="text-gruvbox-fg2">👋 {authState.user?.username}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-gruvbox-fg2 hover:text-gruvbox-red hover:bg-gruvbox-bg2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gruvbox-bg1">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-gruvbox-bg2 data-[state=active]:text-gruvbox-yellow"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="courses"
              className="data-[state=active]:bg-gruvbox-bg2 data-[state=active]:text-gruvbox-yellow"
            >
              <Code className="h-4 w-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard"
              className="data-[state=active]:bg-gruvbox-bg2 data-[state=active]:text-gruvbox-yellow"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            {authState.user?.role === 'admin' && (
              <TabsTrigger 
                value="admin"
                className="data-[state=active]:bg-gruvbox-bg2 data-[state=active]:text-gruvbox-yellow"
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="profile"
              className="data-[state=active]:bg-gruvbox-bg2 data-[state=active]:text-gruvbox-yellow"
            >
              <Users className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <Dashboard user={authState.user!} />
          </TabsContent>

          <TabsContent value="courses" className="mt-6">
            <CourseList 
              courses={courses} 
              onCourseSelect={handleCourseSelect}
              onCoursesUpdate={loadCourses}
            />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <Leaderboard currentUser={authState.user!} />
          </TabsContent>

          {authState.user?.role === 'admin' && (
            <TabsContent value="admin" className="mt-6">
              <AdminPanel onDataUpdate={loadCourses} />
            </TabsContent>
          )}

          <TabsContent value="profile" className="mt-6">
            <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
              <CardHeader>
                <CardTitle className="text-gruvbox-fg0">User Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gruvbox-fg2 text-sm">Username</label>
                    <p className="text-gruvbox-fg0 font-medium">{authState.user?.username}</p>
                  </div>
                  <div>
                    <label className="text-gruvbox-fg2 text-sm">Email</label>
                    <p className="text-gruvbox-fg0 font-medium">{authState.user?.email}</p>
                  </div>
                  <div>
                    <label className="text-gruvbox-fg2 text-sm">Role</label>
                    <Badge className="bg-gruvbox-bg2 text-gruvbox-fg1 mt-1">
                      {authState.user?.role}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-gruvbox-fg2 text-sm">Total Points</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Trophy className="h-4 w-4 text-gruvbox-orange" />
                      <span className="text-gruvbox-fg0 font-medium">{authState.user?.total_points}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-gruvbox-fg2 text-sm">Member Since</label>
                  <p className="text-gruvbox-fg0 font-medium">
                    {authState.user?.created_at.toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
