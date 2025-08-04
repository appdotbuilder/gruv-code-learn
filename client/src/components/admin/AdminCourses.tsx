
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, BookOpen, Eye, EyeOff } from 'lucide-react';
import type { Course, CreateCourseInput, UpdateCourseInput } from '../../../../server/src/schema';

interface AdminCoursesProps {
  onDataUpdate: () => void;
}

export function AdminCourses({ onDataUpdate }: AdminCoursesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState<CreateCourseInput>({
    title: '',
    description: '',
    language: '',
    difficulty: 'beginner',
    is_published: false
  });

  const loadCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getCourses.query();
      setCourses(result);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      language: '',
      difficulty: 'beginner',
      is_published: false
    });
    setEditingCourse(null);
    setShowCreateForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await trpc.createCourse.mutate({ ...formData, userId: 1 }); // Using hardcoded admin ID
      await loadCourses();
      onDataUpdate();
      resetForm();
    } catch (error) {
      console.error('Failed to create course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      language: course.language,
      difficulty: course.difficulty,
      is_published: course.is_published
    });
    setShowCreateForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    
    setIsSubmitting(true);
    try {
      const updateData: UpdateCourseInput = {
        id: editingCourse.id,
        ...formData
      };
      await trpc.updateCourse.mutate(updateData);
      await loadCourses();
      onDataUpdate();
      resetForm();
    } catch (error) {
      console.error('Failed to update course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (courseId: number) => {
    try {
      await trpc.deleteCourse.mutate({ courseId });
      await loadCourses();
      onDataUpdate();
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const difficultyColors = {
    beginner: 'bg-gruvbox-green text-gruvbox-bg0',
    intermediate: 'bg-gruvbox-yellow text-gruvbox-bg0',
    advanced: 'bg-gruvbox-red text-gruvbox-bg0'
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gruvbox-fg0">Course Management</h3>
          <p className="text-gruvbox-fg2 text-sm">Create and manage learning courses</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-gruvbox-blue text-gruvbox-bg0 hover:bg-gruvbox-aqua"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Course
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
          <CardHeader>
            <CardTitle className="text-gruvbox-fg0">
              {editingCourse ? 'Edit Course' : 'Create New Course'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingCourse ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gruvbox-fg2">Course Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCourseInput) => ({ ...prev, title: e.target.value }))
                    }
                    className="bg-gruvbox-bg2 border-gruvbox-bg3 text-gruvbox-fg1"
                    placeholder="Enter course title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="text-gruvbox-fg2">Programming Language</Label>
                  <Input
                    id="language"
                    value={formData.language}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCourseInput) => ({ ...prev, language: e.target.value }))
                    }
                    className="bg-gruvbox-bg2 border-gruvbox-bg3 text-gruvbox-fg1"
                    placeholder="e.g., Python, JavaScript, Java"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gruvbox-fg2">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateCourseInput) => ({ ...prev, description: e.target.value }))
                  }
                  className="bg-gruvbox-bg2 border-gruvbox-bg3 text-gruvbox-fg1 min-h-[100px]"
                  placeholder="Describe what students will learn in this course"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-gruvbox-fg2">Difficulty Level</Label>
                  <Select
                    value={formData.difficulty || 'beginner'}
                    onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                      setFormData((prev: CreateCourseInput) => ({ ...prev, difficulty: value }))
                    }
                  >
                    <SelectTrigger className="bg-gruvbox-bg2 border-gruvbox-bg3 text-gruvbox-fg1">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent className="bg-gruvbox-bg1 border-gruvbox-bg3">
                      <SelectItem value="beginner">🌱 Beginner</SelectItem>
                      <SelectItem value="intermediate">🚀 Intermediate</SelectItem>
                      <SelectItem value="advanced">⚡ Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gruvbox-fg2">Publication Status</Label>
                  <div className="flex items-center space-x-2 p-3 bg-gruvbox-bg2 rounded-md">
                    <Switch
                      id="published"
                      checked={formData.is_published}
                      onCheckedChange={(checked: boolean) =>
                        setFormData((prev: CreateCourseInput) => ({ ...prev, is_published: checked }))
                      }
                    />
                    <Label htmlFor="published" className="text-gruvbox-fg1">
                      {formData.is_published ? 'Published' : 'Draft'}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gruvbox-green text-gruvbox-bg0 hover:bg-gruvbox-aqua"
                >
                  {isSubmitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={resetForm}
                  className="border-gruvbox-bg3 text-gruvbox-fg1 hover:bg-gruvbox-bg2"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Courses List */}
      <div className="space-y-4">
        {courses.length === 0 ? (
          <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-gruvbox-bg3 mb-4" />
              <h3 className="text-xl font-semibold text-gruvbox-fg0 mb-2">No Courses Yet</h3>
              <p className="text-gruvbox-fg2 text-center">
                Create your first course to start building your learning platform! 📚
              </p>
            </CardContent>
          </Card>
        ) : (
          courses.map((course: Course) => (
            <Card key={course.id} className="bg-gruvbox-bg1 border-gruvbox-bg3">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gruvbox-fg0">{course.title}</h4>
                      <Badge className={difficultyColors[course.difficulty]}>
                        {course.difficulty}
                      </Badge>
                      <Badge variant="outline" className={
                        course.is_published 
                          ? 'border-gruvbox-green text-gruvbox-green' 
                          : 'border-gruvbox-yellow text-gruvbox-yellow'
                      }>
                        {course.is_published ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Draft
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="text-gruvbox-fg2 mb-2">{course.description}</p>
                    <p className="text-gruvbox-fg3 text-sm">
                      Language: {course.language} • Created: {course.created_at.toLocaleDateString()} • 
                      Updated: {course.updated_at.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(course)}
                      className="border-gruvbox-bg3 text-gruvbox-fg1 hover:bg-gruvbox-bg2"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gruvbox-red text-gruvbox-red hover:bg-gruvbox-red hover:text-gruvbox-bg0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gruvbox-bg1 border-gruvbox-bg3">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-gruvbox-fg0">Delete Course</AlertDialogTitle>
                          <AlertDialogDescription className="text-gruvbox-fg2">
                            Are you sure you want to delete "{course.title}"? This will also delete all associated lessons, exercises, and quizzes. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-gruvbox-bg3 text-gruvbox-fg1 hover:bg-gruvbox-bg2">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(course.id)}
                            className="bg-gruvbox-red text-gruvbox-bg0 hover:bg-gruvbox-red hover:opacity-90"
                          >
                            Delete Course
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
