import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Facebook, Twitter, Instagram, ExternalLink, Edit2, Save, X } from "lucide-react";

interface SocialMediaLinksProps {
  userId: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  editable?: boolean;
}

export function SocialMediaLinks({ 
  userId, 
  facebookUrl = "", 
  twitterUrl = "", 
  instagramUrl = "",
  editable = false 
}: SocialMediaLinksProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    facebookUrl,
    twitterUrl,
    instagramUrl
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateSocialMediaMutation = useMutation({
    mutationFn: async (socialData: any) => {
      const res = await apiRequest("PATCH", `/api/profile/${userId}`, socialData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${userId}`] });
      setIsEditing(false);
      toast({
        title: "Social media links updated",
        description: "Your social media profiles have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update social media links.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSocialMediaMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({ facebookUrl, twitterUrl, instagramUrl });
    setIsEditing(false);
  };

  const formatUrl = (url: string, platform: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    switch (platform) {
      case "facebook":
        return `https://facebook.com/${url}`;
      case "twitter":
        return `https://twitter.com/${url}`;
      case "instagram":
        return `https://instagram.com/${url}`;
      default:
        return url;
    }
  };

  const extractUsername = (url: string) => {
    if (!url) return "";
    return url.replace(/^https?:\/\/(www\.)?(facebook|twitter|instagram)\.com\//, "");
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Social Media Profiles</CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={updateSocialMediaMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook Profile
            </Label>
            <Input
              id="facebook"
              placeholder="facebook.com/username or just username"
              value={formData.facebookUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="twitter" className="flex items-center gap-2">
              <Twitter className="h-4 w-4 text-blue-400" />
              Twitter Profile
            </Label>
            <Input
              id="twitter"
              placeholder="twitter.com/username or @username"
              value={formData.twitterUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, twitterUrl: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              Instagram Profile
            </Label>
            <Input
              id="instagram"
              placeholder="instagram.com/username or username"
              value={formData.instagramUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, instagramUrl: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  const socialLinks = [
    {
      platform: "Facebook",
      url: facebookUrl,
      icon: Facebook,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      platform: "Twitter", 
      url: twitterUrl,
      icon: Twitter,
      color: "text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      platform: "Instagram",
      url: instagramUrl,
      icon: Instagram,
      color: "text-pink-600", 
      bgColor: "bg-pink-50 dark:bg-pink-950"
    }
  ].filter(link => link.url);

  if (socialLinks.length === 0 && !editable) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Social Media Profiles</CardTitle>
        {editable && (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {socialLinks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No social media profiles added yet.</p>
            {editable && (
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => setIsEditing(true)}
              >
                Add Social Media Links
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {socialLinks.map(({ platform, url, icon: Icon, color, bgColor }) => {
              const formattedUrl = formatUrl(url, platform.toLowerCase());
              const username = extractUsername(url);
              
              return (
                <div 
                  key={platform}
                  className={`flex items-center gap-3 p-3 rounded-lg ${bgColor} border`}
                >
                  <Icon className={`h-5 w-5 ${color}`} />
                  <div className="flex-1">
                    <p className="font-medium">{platform}</p>
                    <p className="text-sm text-muted-foreground">@{username}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => window.open(formattedUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}