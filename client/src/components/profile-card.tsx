import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  MapPin,
  Building,
  Calendar,
  Users,
  MessageCircle,
  UserPlus,
  Check
} from "lucide-react";
import { Link } from "wouter";
import type { UserProfile } from "@/lib/types";

interface ProfileCardProps {
  profile: UserProfile;
  isOwnProfile?: boolean;
  connectionStatus?: 'none' | 'pending' | 'connected';
  onConnectionUpdate?: () => void;
}

export default function ProfileCard({ 
  profile, 
  isOwnProfile = false, 
  connectionStatus = 'none',
  onConnectionUpdate 
}: ProfileCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectionMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/connections', { receiverId: profile.id }),
    onSuccess: () => {
      toast({
        title: "Connection request sent",
        description: `Your connection request has been sent to ${profile.firstName} ${profile.lastName}`
      });
      onConnectionUpdate?.();
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive"
      });
    }
  });

  const handleConnect = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to connect with others",
        variant: "destructive"
      });
      return;
    }
    
    connectionMutation.mutate();
  };

  const formatJoinDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getConnectionButton = () => {
    if (isOwnProfile) return null;
    
    switch (connectionStatus) {
      case 'connected':
        return (
          <Button variant="outline" className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            Connected
          </Button>
        );
      case 'pending':
        return (
          <Button variant="outline" className="flex-1" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </Button>
        );
      default:
        return (
          <Button 
            onClick={handleConnect}
            disabled={connectionMutation.isPending}
            className="flex-1 bg-linkedin-blue hover:bg-linkedin-dark"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Connect
          </Button>
        );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Cover Image */}
        <div className="h-20 bg-gradient-to-r from-linkedin-blue to-linkedin-light"></div>
        
        {/* Profile Info */}
        <div className="p-6 -mt-10">
          <div className="flex items-start space-x-4">
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
              <AvatarImage src={profile.profileImageUrl || undefined} />
              <AvatarFallback className="bg-linkedin-blue text-white text-xl">
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pt-8">
              <h2 className="text-xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-600 font-medium">
                {profile.headline || 'Professional'}
              </p>
              
              {profile.location && (
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex space-x-2 mt-4">
              {getConnectionButton()}
              <Button variant="outline" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          )}

          {isOwnProfile && (
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/profile/${profile.id}`}>
                  Edit Profile
                </Link>
              </Button>
            </div>
          )}

          <Separator className="my-4" />

          {/* Profile Details */}
          <div className="space-y-3">
            {profile.industry && (
              <div className="flex items-center text-sm">
                <Building className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">{profile.industry}</span>
              </div>
            )}
            
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-600">
                Joined {formatJoinDate(profile.createdAt)}
              </span>
            </div>

            {/* Experience Preview */}
            {profile.experiences && profile.experiences.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Current Role</h4>
                <div className="text-sm">
                  <p className="font-medium">{profile.experiences[0].title}</p>
                  <p className="text-gray-600">{profile.experiences[0].company}</p>
                </div>
              </div>
            )}

            {/* Skills Preview */}
            {profile.skills && profile.skills.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Top Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {profile.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="text-xs">
                      {skill.name}
                    </Badge>
                  ))}
                  {profile.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{profile.skills.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Summary Preview */}
            {profile.summary && (
              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-2">About</h4>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {profile.summary}
                </p>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* View Full Profile */}
          <Button asChild variant="ghost" className="w-full text-linkedin-blue hover:text-linkedin-dark">
            <Link href={`/profile/${profile.id}`}>
              View Full Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
