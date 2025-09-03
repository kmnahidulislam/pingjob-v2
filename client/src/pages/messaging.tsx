import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  MessageCircle,
  Send,
  Search,
  MoreVertical,
  Users,
  Plus,
  Phone,
  Video,
  Info
} from "lucide-react";

export default function Messaging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [newConversationSearch, setNewConversationSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: !!user
  });

  const { data: messages } = useQuery({
    queryKey: [`/api/messages/${selectedConversation}`],
    enabled: !!selectedConversation,
    refetchInterval: 5000 // Poll for new messages every 5 seconds
  });

  const { data: connections } = useQuery({
    queryKey: ['/api/connections'],
    enabled: !!user
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { receiverId: string; content: string }) =>
      apiRequest('/api/messages', 'POST', data),
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedConversation}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  const startConversationMutation = useMutation({
    mutationFn: (data: { receiverId: string; content: string }) =>
      apiRequest('/api/messages', 'POST', data),
    onSuccess: (data: any, variables) => {
      setMessageInput("");
      setShowNewConversationDialog(false);
      setSelectedConversation(variables.receiverId);
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${variables.receiverId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({
        title: "Success",
        description: "Conversation started successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      receiverId: selectedConversation,
      content: messageInput.trim()
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredConversations = (conversations || []).filter((conv: any) =>
    conv.otherUser?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get connections that don't already have conversations
  const existingConversationUserIds = (conversations || []).map((conv: any) => conv.otherUser?.id);
  const availableConnections = (connections || []).filter((conn: any) => 
    !existingConversationUserIds.includes(conn.user?.id)
  );

  // Filter available connections for new conversation dialog
  const filteredAvailableConnections = availableConnections.filter((conn: any) =>
    conn.user?.firstName?.toLowerCase().includes(newConversationSearch.toLowerCase()) ||
    conn.user?.lastName?.toLowerCase().includes(newConversationSearch.toLowerCase())
  );

  const handleStartConversation = (receiverId: string) => {
    const initialMessage = `Hi! I'd like to connect with you.`;
    startConversationMutation.mutate({
      receiverId,
      content: initialMessage
    });
  };

  const selectedUser = (connections || []).find((conn: any) => conn.user?.id === selectedConversation)?.user;

  const formatMessageTime = (date: string | Date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - messageDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[80vh]">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Messages
                </span>
                <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Start New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                        <Input
                          placeholder="Search connections..."
                          value={newConversationSearch}
                          onChange={(e) => setNewConversationSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Available Connections */}
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {filteredAvailableConnections.length > 0 ? (
                          <div className="space-y-2">
                            {filteredAvailableConnections.map((connection: any) => (
                              <div
                                key={connection.user.id}
                                onClick={() => handleStartConversation(connection.user.id)}
                                className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={connection.user.profileImageUrl || undefined} />
                                    <AvatarFallback className="bg-linkedin-blue text-white">
                                      {connection.user.firstName?.[0]}{connection.user.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm">
                                      {connection.user.firstName} {connection.user.lastName}
                                    </h4>
                                    <p className="text-sm text-gray-600 truncate">
                                      {connection.user.headline || 'Professional'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              {newConversationSearch 
                                ? 'No connections found matching your search' 
                                : availableConnections.length === 0 
                                  ? 'All your connections already have conversations'
                                  : 'No available connections'
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
              
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-0">
              {filteredConversations.length > 0 ? (
                <div className="space-y-1">
                  {filteredConversations.map((conversation: any) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.otherUser?.id)}
                      className={`p-3 cursor-pointer border-b hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation.otherUser?.id ? 'bg-blue-50 border-l-4 border-l-linkedin-blue' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.otherUser?.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-linkedin-blue text-white">
                            {conversation.otherUser?.firstName?.[0]}{conversation.otherUser?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate">
                              {conversation.otherUser?.firstName} {conversation.otherUser?.lastName}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(conversation.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.content}
                          </p>
                          {!conversation.isRead && (
                            <Badge variant="destructive" className="mt-1 h-2 w-2 p-0 rounded-full">
                              <span className="sr-only">Unread</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {searchQuery ? 'No conversations found' : 'No messages yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            {selectedConversation && selectedUser ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedUser.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-linkedin-blue text-white">
                          {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedUser.headline || 'Professional'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-4">
                  <div className="space-y-4">
                    {(messages || []).length > 0 ? (
                      (messages || []).map((message: any) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`message-bubble max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId === user?.id
                                ? 'bg-linkedin-blue text-white message-sent'
                                : 'bg-gray-100 text-gray-900 message-received'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Start a conversation with {selectedUser.firstName}
                        </p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                      className="bg-linkedin-blue hover:bg-linkedin-dark"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600 max-w-sm">
                    Choose from your existing conversations or start a new message with your connections
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
