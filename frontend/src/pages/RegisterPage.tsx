import { useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import type { UserRole } from "../auth/types";

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register({ displayName, email, password, role });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 2 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 900 }}>
            Create account
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 3 }}>
            Choose your role to unlock the right workspace.
          </Typography>
          <Stack component="form" spacing={2} onSubmit={onSubmit}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              slotProps={{ htmlInput: { minLength: 6, autoComplete: "new-password" } }}
            />
            <TextField
              select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              required
            >
              <MenuItem value="client">Client</MenuItem>
              <MenuItem value="practitioner">Practitioner</MenuItem>
            </TextField>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </Button>
            <Button component={RouterLink} to="/login" color="secondary">
              Already have an account? Sign in
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}