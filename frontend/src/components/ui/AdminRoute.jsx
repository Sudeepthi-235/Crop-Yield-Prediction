import { useAuth, useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";

export default function AdminRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

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

  const role = (user?.publicMetadata?.role || "USER").toUpperCase();

  if (role !== "ADMIN") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sage-50 p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">403 - Access Denied</h1>
        <p className="text-gray-600 max-w-md mb-6">
          You do not have administrative privileges to access this page. Required role: <strong>ADMIN</strong>.
        </p>
        <a
          href="/dashboard"
          className="px-6 py-2.5 bg-forest-700 text-white font-medium rounded-xl hover:bg-forest-800 transition-all"
        >
          Return to User Dashboard
        </a>
      </div>
    );
  }

  return children;
}
