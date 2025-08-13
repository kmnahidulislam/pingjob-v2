import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvitationFormProps {
  onSuccess?: () => void;
}

export function InvitationForm({ onSuccess }: InvitationFormProps) {
  const [inviteType, setInviteType] = useState<"platform" | "external">("external");
  const [externalInviteData, setExternalInviteData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    message: ""
  });
  const { toast } = useToast();

  // Send external invitation mutation
  const sendExternalInvitationMutation = useMutation({
    mutationFn: async (inviteData: any) => {
      const res = await apiRequest("POST", "/api/external-invitations", inviteData);
      return res.json();
    },
    onSuccess: () => {
      setExternalInviteData({ email: "", firstName: "", lastName: "", message: "" });
      toast({
        title: "Invitation sent",
        description: "Your invitation has been sent successfully.",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive",
      });
    },
  });

  const handleSendInvitation = () => {
    if (inviteType === "external") {
      sendExternalInvitationMutation.mutate(externalInviteData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Invite Someone to Connect
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invitation Type Toggle */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={inviteType === "platform" ? "default" : "outline"}
            onClick={() => setInviteType("platform")}
            className="flex-1"
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Platform Users
          </Button>
          <Button
            size="sm"
            variant={inviteType === "external" ? "default" : "outline"}
            onClick={() => setInviteType("external")}
            className="flex-1"
          >
            <Mail className="h-4 w-4 mr-1" />
            Email Invite
          </Button>
        </div>

        {/* External Invitation Form */}
        {inviteType === "external" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                placeholder="Enter email address"
                type="email"
                value={externalInviteData.email}
                onChange={(e) => setExternalInviteData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  value={externalInviteData.firstName}
                  onChange={(e) => setExternalInviteData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  value={externalInviteData.lastName}
                  onChange={(e) => setExternalInviteData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to your invitation..."
                value={externalInviteData.message}
                onChange={(e) => setExternalInviteData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
              />
            </div>
            
            <Button
              className="w-full"
              onClick={handleSendInvitation}
              disabled={!externalInviteData.email || sendExternalInvitationMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {sendExternalInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        )}

        {/* Platform User Browse Message */}
        {inviteType === "platform" && (
          <div className="text-center p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Browse platform users by category in the main networking area to send connection requests.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}