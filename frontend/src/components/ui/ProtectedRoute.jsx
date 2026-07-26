import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50">
        <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
