
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { trpc } from '@/utils/trpc';
import { Trophy, Medal, Award, Crown, Star } from 'lucide-react';
import type { User } from '../../../server/src/schema';

interface LeaderboardEntry {
  userId: number;
  username: string;
  totalPoints: number;
  badgeCount: number;
  coursesCompleted: number;
}

interface LeaderboardProps {
  currentUser: User;
}

export function Leaderboard({ currentUser }: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.getLeaderboard.query({ limit: 20 });
      setLeaderboardData(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-gruvbox-yellow" />;
      case 2:
        return <Medal className="h-6 w-6 text-gruvbox-fg3" />;
      case 3:
        return <Award className="h-6 w-6 text-gruvbox-orange" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gruvbox-fg2 font-bold">{position}</span>;
    }
  };

  const getRankColor = (position: number) => {
    switch (position) {
      case 1:
        return 'border-gruvbox-yellow bg-gruvbox-yellow bg-opacity-10';
      case 2:
        return 'border-gruvbox-fg3 bg-gruvbox-fg3 bg-opacity-10';
      case 3:
        return 'border-gruvbox-orange bg-gruvbox-orange bg-opacity-10';
      default:
        return 'border-gruvbox-bg3';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <Card key={i} className="bg-gruvbox-bg1 border-gruvbox-bg3 animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gruvbox-bg2 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gruvbox-bg2 rounded w-1/4"></div>
                  <div className="h-3 bg-gruvbox-bg2 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gruvbox-bg2 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const currentUserRank = leaderboardData.findIndex(entry => entry.userId === currentUser.id) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
        <CardHeader>
          <CardTitle className="text-2xl text-gruvbox-fg0 flex items-center gap-2">
            <Trophy className="text-gruvbox-yellow" />
            Leaderboard 🏆
          </CardTitle>
          <p className="text-gruvbox-fg2">
            Top performers in our learning community
            {currentUserRank > 0 && (
              <span className="ml-2">
                • You're ranked #{currentUserRank}!
              </span>
            )}
          </p>
        </CardHeader>
      </Card>

      {/* Current User Highlight */}
      {currentUserRank > 3 && (
        <Card className="bg-gruvbox-bg1 border-gruvbox-yellow">
          <CardHeader>
            <CardTitle className="text-gruvbox-fg0 text-lg">Your Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {getRankIcon(currentUserRank)}
                <Avatar className="h-10 w-10 bg-gruvbox-bg2">
                  <AvatarFallback className="text-gruvbox-fg1 bg-gruvbox-bg2">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <p className="text-gruvbox-fg0 font-medium">{currentUser.username}</p>
                <p className="text-gruvbox-fg3 text-sm">Rank #{currentUserRank}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-gruvbox-orange">
                  <Star className="h-4 w-4" />
                  <span className="font-bold">{currentUser.total_points}</span>
                </div>
                <p className="text-gruvbox-fg3 text-xs">points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard List */}
      <div className="space-y-3">
        {leaderboardData.length === 0 ? (
          <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-16 w-16 text-gruvbox-bg3 mb-4" />
              <h3 className="text-xl font-semibold text-gruvbox-fg0 mb-2">No Rankings Yet</h3>
              <p className="text-gruvbox-fg2 text-center">
                Be the first to earn points and claim your spot on the leaderboard! 🚀
              </p>
            </CardContent>
          </Card>
        ) : (
          leaderboardData.map((entry: LeaderboardEntry, index: number) => {
            const position = index + 1;
            const isCurrentUser = entry.userId === currentUser.id;
            
            return (
              <Card 
                key={entry.userId}
                className={`
                  ${getRankColor(position)}
                  ${isCurrentUser ? 'ring-2 ring-gruvbox-yellow' : ''}
                  bg-gruvbox-bg1 transition-all hover:scale-[1.02]
                `}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex items-center gap-3">
                      {getRankIcon(position)}
                      <Avatar className="h-12 w-12 bg-gruvbox-bg2">
                        <AvatarFallback className="text-gruvbox-fg1 bg-gruvbox-bg2">
                          {entry.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-gruvbox-fg0 font-semibold">
                          {entry.username}
                        </p>
                        {isCurrentUser && (
                          <Badge className="bg-gruvbox-yellow text-gruvbox-bg0 text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gruvbox-fg3">
                        <span>{entry.coursesCompleted} courses completed</span>
                        <span>•</span>
                        <span>{entry.badgeCount} badges earned</span>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-gruvbox-orange">
                        <Star className="h-5 w-5" />
                        <span className="text-xl font-bold">{entry.totalPoints}</span>
                      </div>
                      <p className="text-gruvbox-fg3 text-sm">points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Stats Summary */}
      <Card className="bg-gruvbox-bg1 border-gruvbox-bg3">
        <CardHeader>
          <CardTitle className="text-gruvbox-fg0 flex items-center gap-2">
            <Star className="text-gruvbox-purple" />
            Community Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gruvbox-bg2 rounded-lg">
              <Trophy className="h-8 w-8 text-gruvbox-yellow mx-auto mb-2" />
              <p className="text-gruvbox-fg1 font-bold text-lg">
                {leaderboardData.length > 0 ? leaderboardData[0]?.totalPoints || 0 : 0}
              </p>
              <p className="text-gruvbox-fg3 text-sm">Highest Score</p>
            </div>
            <div className="text-center p-4 bg-gruvbox-bg2 rounded-lg">
              <Medal className="h-8 w-8 text-gruvbox-blue mx-auto mb-2" />
              <p className="text-gruvbox-fg1 font-bold text-lg">
                {leaderboardData.length}
              </p>
              <p className="text-gruvbox-fg3 text-sm">Active Learners</p>
            </div>
            <div className="text-center p-4 bg-gruvbox-bg2 rounded-lg">
              <Award className="h-8 w-8 text-gruvbox-green mx-auto mb-2" />
              <p className="text-gruvbox-fg1 font-bold text-lg">
                {leaderboardData.reduce((sum, entry) => sum + entry.totalPoints, 0)}
              </p>
              <p className="text-gruvbox-fg3 text-sm">Total Points</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
