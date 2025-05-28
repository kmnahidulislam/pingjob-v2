import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import ProfileCard from "@/components/profile-card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Users,
  UserPlus,
  Search,
  MessageCircle,
  Check,
  X,
  Mail,
  Calendar,
  MapPin
} from "lucide-react";

export default function Network() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'suggestions'>('connections');

  const { data: connections } = useQuery({
    queryKey: ['/api/connections'],
    enabled: !!user
  });

  const { data: connectionRequests } = useQuery({
    queryKey: ['/api/connection-requests'],
    enabled: !!user
  });

  const { data: suggestions } = useQuery({
    queryKey: ['/api/suggestions'],
    enabled: !!user,
    queryFn: async () => {
      // For now, return empty array since we don't have suggestions endpoint
      return [];
    }
  });

  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: number) =>
      apiRequest('PUT', `/api/connections/${requestId}/status`, { status: 'accepted' }),
    onSuccess: () => {
      toast({
        title: "Connection accepted",
        description: "You're now connected!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/connection-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept connection",
        variant: "destructive"
      });
    }
  });

  const declineRequestMutation = useMutation({
    mutationFn: (requestId: number) =>
      apiRequest('PUT', `/api/connections/${requestId}/status`, { status: 'declined' }),
    onSuccess: () => {
      toast({
        title: "Connection declined",
        description: "Request has been declined"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connection-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline connection",
        variant: "destructive"
      });
    }
  });

  const sendConnectionMutation = useMutation({
    mutationFn: (receiverId: string) =>
      apiRequest('POST', '/api/connections', { receiverId }),
    onSuccess: () => {
      toast({
        title: "Connection request sent",
        description: "Your connection request has been sent"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/suggestions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive"
      });
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  const filteredConnections = connections?.filter((connection: any) =>
    connection.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.user?.headline?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Your Network
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <div className="text-2xl font-bold text-linkedin-blue">
                  {connections?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Connections</div>
              </div>
              
              <Separator />
              
              <nav className="space-y-2">
                <Button
                  variant={activeTab === 'connections' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('connections')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Connections
                  {connections?.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {connections.length}
                    </Badge>
                  )}
                </Button>
                
                <Button
                  variant={activeTab === 'requests' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('requests')}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Requests
                  {connectionRequests?.length > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {connectionRequests.length}
                    </Badge>
                  )}
                </Button>
                
                <Button
                  variant={activeTab === 'suggestions' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('suggestions')}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find People
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search your network..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" className="bg-linkedin-blue hover:bg-linkedin-dark">
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Content based on active tab */}
          {activeTab === 'connections' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Your Connections</h1>
                <p className="text-gray-600">{filteredConnections.length} connections</p>
              </div>

              {filteredConnections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredConnections.map((connection: any) => (
                    <Card key={connection.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={connection.user?.profileImageUrl || undefined} />
                            <AvatarFallback className="bg-linkedin-blue text-white">
                              {connection.user?.firstName?.[0]}{connection.user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {connection.user?.firstName} {connection.user?.lastName}
                            </h3>
                            <p className="text-xs text-gray-600 truncate">
                              {connection.user?.headline || 'Professional'}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              Connected {new Date(connection.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchQuery ? 'No connections found' : 'No connections yet'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery 
                        ? 'Try adjusting your search terms'
                        : 'Start building your professional network by connecting with colleagues'
                      }
                    </p>
                    {!searchQuery && (
                      <Button 
                        onClick={() => setActiveTab('suggestions')}
                        className="bg-linkedin-blue hover:bg-linkedin-dark"
                      >
                        Find People to Connect
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Connection Requests</h1>
                <p className="text-gray-600">{connectionRequests?.length || 0} pending requests</p>
              </div>

              {connectionRequests && connectionRequests.length > 0 ? (
                <div className="space-y-4">
                  {connectionRequests.map((request: any) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={request.requester?.profileImageUrl || undefined} />
                              <AvatarFallback className="bg-linkedin-blue text-white">
                                {request.requester?.firstName?.[0]}{request.requester?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div>
                              <h3 className="font-semibold text-lg">
                                {request.requester?.firstName} {request.requester?.lastName}
                              </h3>
                              <p className="text-gray-600">
                                {request.requester?.headline || 'Professional'}
                              </p>
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                Sent {new Date(request.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => declineRequestMutation.mutate(request.id)}
                              disabled={declineRequestMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              className="bg-linkedin-blue hover:bg-linkedin-dark"
                              onClick={() => acceptRequestMutation.mutate(request.id)}
                              disabled={acceptRequestMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No pending requests
                    </h3>
                    <p className="text-gray-600">
                      You don't have any connection requests at the moment
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">People You May Know</h1>
              </div>

              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Discover new connections
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Use the search feature to find colleagues, classmates, and other professionals to connect with
                  </p>
                  <Button 
                    onClick={() => setSearchQuery("")}
                    className="bg-linkedin-blue hover:bg-linkedin-dark"
                  >
                    Start Searching
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
