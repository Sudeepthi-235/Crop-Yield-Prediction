import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";

import ProtectedRoute from "./components/ui/ProtectedRoute";
import AdminRoute from "./components/ui/AdminRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboard from "./pages/AdminDashboard";
import NotFoundPage from "./pages/NotFoundPage";
import { setAuthTokenGetter } from "./services/api";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

function TokenInterceptorSetup() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(getToken);
  }, [getToken]);

  return null;
}

export default function App() {
  if (!PUBLISHABLE_KEY) {
    console.warn("[Clerk] Missing VITE_CLERK_PUBLISHABLE_KEY environment variable.");
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <TokenInterceptorSetup />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#fff",
              color: "#14532d",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login/*" element={<LoginPage />} />
          <Route path="/signup/*" element={<SignupPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}
