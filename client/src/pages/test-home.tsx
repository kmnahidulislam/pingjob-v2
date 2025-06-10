import { useAuth } from "@/hooks/use-auth";

export default function TestHome() {
  const { user } = useAuth();
  
  console.log('TestHome component rendering, user:', user);
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Welcome to the Job Portal - ROUTING FIXED!
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-lg text-gray-700 mb-4">
            Hello {user?.firstName || 'User'}! The application is working correctly.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>User ID: {user?.id}</p>
            <p>Email: {user?.email}</p>
            <p>Type: {user?.userType}</p>
            <p>Current Time: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}