import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";

export function useAuth() {
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user } = useUser();

  return {
    user: user ? { ...user, email: user.primaryEmailAddress?.emailAddress } : null,
    loading: !isLoaded,
    isSignedIn,
    logout: signOut,
  };
}

export function AuthProvider({ children }) {
  return <>{children}</>;
}
