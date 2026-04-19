import { Box, CircularProgress } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";
import { AssessmentErrorBoundary } from "./components/assessment/AssessmentErrorBoundary";
import { AssessmentView } from "./components/assessment/AssessmentView";
import { PractitionerDashboard } from "./components/practitioner/PractitionerDashboard";
import { RecoveryDashboard } from "./components/recovery/RecoveryDashboard";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { useAuth } from "./auth/useAuth";
import { AppShell } from "./layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "practitioner") return <Navigate to="/assessment" replace />;
  return <Navigate to="/recovery" replace />;
}

export function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route
          path="/assessment"
          element={
            <ProtectedRoute roles={["practitioner"]}>
              <AssessmentErrorBoundary>
                <AssessmentView />
              </AssessmentErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/practitioner"
          element={
            <ProtectedRoute roles={["practitioner"]}>
              <PractitionerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recovery"
          element={
            <ProtectedRoute roles={["client"]}>
              <RecoveryDashboard />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
