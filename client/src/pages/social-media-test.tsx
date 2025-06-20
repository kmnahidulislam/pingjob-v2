import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Facebook, Twitter, Instagram, CheckCircle, XCircle, Clock } from "lucide-react";

interface SocialMediaResult {
  platform: string;
  success: boolean;
  postId?: string;
  error?: string;
}

export default function SocialMediaTest() {
  const [testJob] = useState({
    title: "Senior Software Engineer",
    company: "PingJob Demo Company",
    location: "San Francisco, CA",
    description: "Join our amazing team as a Senior Software Engineer! We're looking for passionate developers to help build the future of recruitment technology.",
    employmentType: "full_time",
    experienceLevel: "senior",
    salary: "$120,000 - $180,000"
  });

  const { toast } = useToast();

  const testSocialMediaMutation = useMutation({
    mutationFn: async () => {
      // Create a test job to trigger social media posting
      return apiRequest('POST', '/api/jobs', {
        ...testJob,
        companyId: 1, // Use first company
        categoryId: 1, // Use first category
        recruiterId: "admin-krupa"
      });
    },
    onSuccess: (data: any) => {
      if (data.socialMediaResults) {
        const successCount = data.socialMediaResults.filter((r: SocialMediaResult) => r.success).length;
        toast({
          title: "Social Media Test Complete",
          description: `Posted to ${successCount}/${data.socialMediaResults.length} platforms successfully`
        });
      } else {
        toast({
          title: "Job Created",
          description: "Job created but social media posting is not configured"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test social media posting",
        variant: "destructive"
      });
    }
  });

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-5 w-5" />;
      case 'twitter': return <Twitter className="h-5 w-5" />;
      case 'instagram': return <Instagram className="h-5 w-5" />;
      default: return null;
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  const lastResult = testSocialMediaMutation.data?.socialMediaResults;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Social Media Integration Test</h1>
        
        <div className="grid gap-6">
          {/* Test Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Test Job Posting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div><strong>Title:</strong> {testJob.title}</div>
                <div><strong>Company:</strong> {testJob.company}</div>
                <div><strong>Location:</strong> {testJob.location}</div>
                <div><strong>Type:</strong> {testJob.employmentType}</div>
                <div><strong>Level:</strong> {testJob.experienceLevel}</div>
                <div><strong>Salary:</strong> {testJob.salary}</div>
                <div><strong>Description:</strong> {testJob.description}</div>
              </div>
              
              <Button 
                onClick={() => testSocialMediaMutation.mutate()}
                disabled={testSocialMediaMutation.isPending}
                className="mt-4"
              >
                {testSocialMediaMutation.isPending ? 'Testing...' : 'Test Social Media Posting'}
              </Button>
            </CardContent>
          </Card>

          {/* Social Media Status */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Facebook className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="font-medium">Facebook</div>
                    <Badge variant="secondary">Configured</Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Twitter className="h-6 w-6 text-blue-400" />
                  <div>
                    <div className="font-medium">Twitter</div>
                    <Badge variant="outline">Pending Setup</Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Instagram className="h-6 w-6 text-pink-500" />
                  <div>
                    <div className="font-medium">Instagram</div>
                    <Badge variant="outline">Pending Setup</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Test Results */}
          {lastResult && (
            <Card>
              <CardHeader>
                <CardTitle>Last Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lastResult.map((result: SocialMediaResult, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getSocialIcon(result.platform)}
                        <span className="font-medium capitalize">{result.platform}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.success)}
                        {result.success ? (
                          <div className="text-sm text-green-600">
                            Posted {result.postId && `(ID: ${result.postId})`}
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">
                            {result.error || 'Failed to post'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <strong>Facebook:</strong> Access token provided - ready for testing
                </div>
                <div>
                  <strong>Twitter:</strong> Need API key, API secret, access token, and access token secret
                </div>
                <div>
                  <strong>Instagram:</strong> Need business account access token and user ID
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <strong>Note:</strong> When all platforms are configured, creating any job through the website will automatically post to all social media accounts.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}