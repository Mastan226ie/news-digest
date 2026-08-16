import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NewsProvider } from "./contexts/NewsContext";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";

/** Redirects unauthenticated users to /login */
function ProtectedRoute({ children }) {
  const { status } = useAuth();
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-theme-accent border-theme-border rounded-full animate-spin" />
      </div>
    );
  }
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  return children;
}

/** Redirects authenticated users away from /login */
function PublicRoute({ children }) {
  const { status, user } = useAuth();
  if (status === "loading") return null;
  if (status === "authenticated" && user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <NewsProvider>
              <HomePage />
            </NewsProvider>
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
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
