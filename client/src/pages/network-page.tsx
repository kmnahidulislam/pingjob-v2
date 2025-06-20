import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Users, MessageCircle, UserPlus, Search, Send, Mail, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InvitationForm } from "@/components/invitation-form";

interface Category {
  id: number;
  name: string;
  description: string;
  userCount: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  summary: string;
  location: string;
  industry: string;
  profileImageUrl: string;
  categoryId: number;
  category: {
    id: number;
    name: string;
  };
  createdAt: string;
}

interface Connection {
  id: number;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    headline: string;
    profileImageUrl: string;
  };
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    headline: string;
    profileImageUrl: string;
  };
}

interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function NetworkPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch categories with user counts
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories/with-user-counts"],
    enabled: !!user,
  });

  // Fetch users by category
  const { data: categoryUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/categories", selectedCategory, "users"],
    enabled: !!user && !!selectedCategory,
  });

  // Fetch connections
  const { data: connections = [], isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !!user,
  });

  // Fetch connection requests
  const { data: connectionRequests = [], isLoading: requestsLoading } = useQuery<Connection[]>({
    queryKey: ["/api/connection-requests"],
    enabled: !!user,
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  // Fetch unread message count
  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: !!user,
  });

  // Send connection request
  const sendConnectionMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      const res = await apiRequest("POST", "/api/connections", { receiverId });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection request sent",
        description: "Your connection request has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send connection request.",
        variant: "destructive",
      });
    },
  });

  // Accept/reject connection request
  const updateConnectionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/connections/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection updated",
        description: "Connection request has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connection-requests"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update connection.",
        variant: "destructive",
      });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", { receiverId, content });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      setMessageContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread/count"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = categoryUsers.filter(user =>
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendConnection = (userId: string) => {
    sendConnectionMutation.mutate(userId);
  };

  const handleUpdateConnection = (id: number, status: string) => {
    updateConnectionMutation.mutate({ id, status });
  };

  const handleSendMessage = (receiverId: string) => {
    if (!messageContent.trim()) return;
    sendMessageMutation.mutate({ receiverId, content: messageContent });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Please sign in to access networking features</h2>
            <p className="text-muted-foreground">Connect with professionals in your field and expand your network.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Professional Network</h1>
        <p className="text-muted-foreground">Connect with professionals in your field and expand your network</p>
      </div>

      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="invite" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invite
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Connections ({connections.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Requests ({connectionRequests.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Messages {unreadCount.count > 0 && <Badge variant="destructive">{unreadCount.count}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categoriesLoading ? (
                    <div className="text-center py-4">Loading categories...</div>
                  ) : (
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedCategory === category.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="secondary">{category.userCount}</Badge>
                        </div>
                        {category.description && (
                          <p className="text-sm opacity-80 mt-1">{category.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Users List */}
            <div className="lg:col-span-2">
              {selectedCategory ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Professionals in Selected Category</CardTitle>
                    <Input
                      placeholder="Search professionals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mt-2"
                    />
                  </CardHeader>
                  <CardContent>
                    {usersLoading ? (
                      <div className="text-center py-8">Loading professionals...</div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No professionals found in this category
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredUsers.map((categoryUser) => (
                          <div key={categoryUser.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={categoryUser.profileImageUrl} />
                              <AvatarFallback>
                                {categoryUser.firstName?.[0]}{categoryUser.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold">
                                {categoryUser.firstName} {categoryUser.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground">{categoryUser.headline}</p>
                              <p className="text-sm text-muted-foreground">{categoryUser.location}</p>
                              <Badge variant="outline" className="mt-1">
                                {categoryUser.category?.name}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSendConnection(categoryUser.id)}
                                disabled={sendConnectionMutation.isPending}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Connect
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => setSelectedUser(categoryUser)}>
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    Message
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Send Message to {categoryUser.firstName} {categoryUser.lastName}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Textarea
                                      placeholder="Type your message..."
                                      value={messageContent}
                                      onChange={(e) => setMessageContent(e.target.value)}
                                      rows={4}
                                    />
                                    <Button
                                      onClick={() => handleSendMessage(categoryUser.id)}
                                      disabled={sendMessageMutation.isPending || !messageContent.trim()}
                                      className="w-full"
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Send Message
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Select a Category</h3>
                    <p className="text-muted-foreground">
                      Choose a professional category to discover and connect with professionals in your field
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <CardTitle>Your Connections</CardTitle>
            </CardHeader>
            <CardContent>
              {connectionsLoading ? (
                <div className="text-center py-8">Loading connections...</div>
              ) : connections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No connections yet. Start by discovering professionals in your field!
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map((connection) => (
                    <div key={connection.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={connection.user.profileImageUrl} />
                        <AvatarFallback>
                          {connection.user.firstName?.[0]}{connection.user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {connection.user.firstName} {connection.user.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{connection.user.headline}</p>
                      </div>
                      <Badge
                        variant={connection.status === "accepted" ? "default" : "secondary"}
                      >
                        {connection.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Connection Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="text-center py-8">Loading requests...</div>
              ) : connectionRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending connection requests
                </div>
              ) : (
                <div className="space-y-4">
                  {connectionRequests.map((request) => (
                    <div key={request.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.user?.profileImageUrl} />
                        <AvatarFallback>
                          {request.user?.firstName?.[0]}{request.user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {request.user?.firstName} {request.user?.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{request.user?.headline}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateConnection(request.id, "accepted")}
                          disabled={updateConnectionMutation.isPending}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateConnection(request.id, "declined")}
                          disabled={updateConnectionMutation.isPending}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {conversationsLoading ? (
                <div className="text-center py-8">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No conversations yet. Start by sending a message to a connection!
                </div>
              ) : (
                <div className="space-y-4">
                  {conversations.map((conversation) => (
                    <div key={conversation.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.otherUser?.profileImageUrl} />
                        <AvatarFallback>
                          {conversation.otherUser?.firstName?.[0]}{conversation.otherUser?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {conversation.otherUser?.firstName} {conversation.otherUser?.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{conversation.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conversation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!conversation.isRead && (
                        <Badge variant="destructive" className="h-6 w-6 rounded-full p-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}