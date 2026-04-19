import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function AppShell() {
  const { user, logout } = useAuth();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(168, 187, 163, 0.18), transparent 28%), radial-gradient(circle at top right, rgba(184, 124, 76, 0.16), transparent 30%), #0b1220",
      }}
    >
      <AppBar position="sticky" color="transparent" elevation={0}>
        <Toolbar sx={{ backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
          <Typography component={RouterLink} to="/" sx={{ color: "#f8fafc", textDecoration: "none", fontWeight: 900 }}>
            ViVaWav3
          </Typography>
          <Stack direction="row" spacing={1} sx={{ ml: 3 }}>
            {user?.role === "practitioner" ? (
              <>
                <Button component={NavLink} to="/assessment" color="inherit">Assessment</Button>
                <Button component={NavLink} to="/practitioner" color="inherit">Dashboard</Button>
              </>
            ) : (
              <Button component={NavLink} to="/recovery" color="inherit">Recovery</Button>
            )}
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Typography sx={{ color: "#94a3b8", mr: 2, fontSize: 13 }}>
            {user?.displayName ?? user?.email}
          </Typography>
          <Button variant="outlined" color="inherit" onClick={logout}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 3, pb: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

