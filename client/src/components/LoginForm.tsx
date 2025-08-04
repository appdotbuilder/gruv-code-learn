
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { User, LoginInput, CreateUserInput } from '../../../server/src/schema';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [loginData, setLoginData] = useState<LoginInput>({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: '',
    role: 'student'
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await trpc.loginUser.mutate(loginData);
      if (result) {
        onLogin(result);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await trpc.createUser.mutate(registerData);
      onLogin(result);
    } catch (error) {
      console.error('Registration failed:', error);
      setError('Registration failed. Please check your information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo login function for development
  const handleDemoLogin = () => {
    // Create a demo user for development purposes
    const demoUser: User = {
      id: 1,
      username: 'demo_student',
      email: 'demo@example.com',
      password_hash: 'hashed_password',
      role: 'student',
      total_points: 150,
      created_at: new Date(),
      updated_at: new Date()
    };
    onLogin(demoUser);
  };

  const handleDemoAdminLogin = () => {
    // Create a demo admin user for development purposes
    const demoAdmin: User = {
      id: 2,
      username: 'demo_admin',
      email: 'admin@example.com',
      password_hash: 'hashed_password',
      role: 'admin',
      total_points: 500,
      created_at: new Date(),
      updated_at: new Date()
    };
    onLogin(demoAdmin);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gruvbox-bg2">
          <TabsTrigger 
            value="login"
            className="data-[state=active]:bg-gruvbox-bg1 data-[state=active]:text-gruvbox-yellow"
          >
            Login
          </TabsTrigger>
          <TabsTrigger 
            value="register"
            className="data-[state=active]:bg-gruvbox-bg1 data-[state=active]:text-gruvbox-yellow"
          >
            Register
          </TabsTrigger>
        </TabsList>

        {error && (
          <Alert className="mt-4 bg-gruvbox-bg2 border-gruvbox-red text-gruvbox-red">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-gruvbox-fg2">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={loginData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLoginData((prev: LoginInput) => ({ ...prev, email: e.target.value }))
                }
                className="bg-gruvbox-bg2 border-gruvbox-bg3 text-gruvbox-fg1 focus:border-gruvbox-yellow"
                placeholder="your.email@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-gruvbox-fg2">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={loginData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLoginData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                }
                className="bg-gruvbox-bg2 border-gruvbox-bg3 text-gruvbox-fg1 focus:border-gruvbox-yellow"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gruvbox-yellow text-gruvbox-bg0 hover:bg-gruvbox-orange"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="register">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-username" className="text-gruvbox-fg2">Username</Label>
              <Input
                id="register-username"
                type="text"
                value={registerData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRegisterData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                }
                className="bg-gruvbox-bg2 border-gruvbox-bg3 text-gruvbox-fg1 focus:border-gruvbox-yellow"
                placeholder="Choose a username"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="register-email" className="text-gruvbox-fg2">Email</Label>
              <Input
                id="register-email"
                type="email"
                value={registerData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRegisterData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                }
                className="bg-gruvbox-bg2 border-gruvbox-bg3 text-gruvbox-fg1 focus:border-gruvbox-yellow"
                placeholder="your.email@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="register-password" className="text-gruvbox-fg2">Password</Label>
              <Input
                id="register-password"
                type="password"
                value={registerData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRegisterData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                }
                className="bg-gruvbox-bg2 border-gruvbox-bg3 text-gruvbox-fg1 focus:border-gruvbox-yellow"
                placeholder="Create a secure password"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gruvbox-green text-gruvbox-bg0 hover:bg-gruvbox-aqua"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* Demo Login Section - Development Only */}
      <div className="border-t border-gruvbox-bg3 pt-4">
        <p className="text-gruvbox-fg3 text-sm text-center mb-3">
          🚧 Demo Mode (Development Only)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={handleDemoLogin}
            variant="outline"
            className="border-gruvbox-bg3 text-gruvbox-fg2 hover:bg-gruvbox-bg2"
          >
            Demo Student
          </Button>
          <Button 
            onClick={handleDemoAdminLogin}
            variant="outline"
            className="border-gruvbox-bg3 text-gruvbox-fg2 hover:bg-gruvbox-bg2"
          >
            Demo Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
