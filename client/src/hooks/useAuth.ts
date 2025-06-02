import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Temporarily bypass authentication for testing
  const mockUser = {
    id: "admin-krupa",
    email: "krupashankar@gmail.com",
    firstName: "Krupa",
    lastName: "Shankar",
    profileImageUrl: null,
    userType: "admin"
  };

  return {
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
  };
}
