import { Alert } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import type { UserRole } from "./types";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  roles?: UserRole[];
};

export function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        This page is available for a different role.
      </Alert>
    );
  }
  return <>{children}</>;
}

