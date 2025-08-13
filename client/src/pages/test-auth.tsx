import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestAuth() {
  const { user, isLoading, loginMutation } = useAuth();

  const handleTestLogin = () => {
    loginMutation.mutate({
      email: "recruiter@test.com",
      password: "password123"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Loading:</strong> {isLoading ? "Yes" : "No"}
            </div>
            <div>
              <strong>User:</strong> {user ? user.email : "Not logged in"}
            </div>
            <div>
              <strong>User Type:</strong> {user?.userType || "N/A"}
            </div>
            <Button onClick={handleTestLogin} disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Logging in..." : "Test Login"}
            </Button>
            {user && (
              <div className="mt-4 p-2 bg-green-100 rounded">
                Successfully authenticated as {user.firstName} {user.lastName}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}