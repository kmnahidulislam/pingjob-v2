import { useAuth } from "@/hooks/use-auth";

export default function DebugAuth() {
  const { user, isLoading } = useAuth();
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded">
      <div>Loading: {isLoading ? 'YES' : 'NO'}</div>
      <div>User: {user ? user.email : 'NONE'}</div>
    </div>
  );
}