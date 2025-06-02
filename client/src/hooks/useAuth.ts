import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Temporarily bypass authentication for testing
  const mockUser = {
    id: "temp-admin",
    email: "krupas@vedsoft.com",
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
