import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import { auth } from "../lib/firebase";
import { useAuth } from "../auth/useAuth";

type NavTab = {
  label: string;
  to: string;
};

export function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = useMemo<NavTab[]>(() => {
    if (user?.role === "practitioner") {
      return [
        { label: "Assessment", to: "/assessment" },
        { label: "Dashboard", to: "/dashboard" },
      ];
    }

    return [{ label: "Recovery", to: "/recovery" }];
  }, [user?.role]);

  const currentTab =
    tabs.find((tab) => location.pathname.startsWith(tab.to))?.to ?? false;

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0b1220" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(11, 18, 32, 0.92)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ py: 1.2, gap: 2 }}>
            <Typography
              sx={{
                color: "#f8fafc",
                fontSize: 18,
                fontWeight: 900,
                mr: 2,
                whiteSpace: "nowrap",
              }}
            >
              ViVaWav3
            </Typography>

            <Tabs
              value={currentTab}
              textColor="inherit"
              sx={{
                flex: 1,
                minHeight: 40,
                "& .MuiTabs-indicator": {
                  backgroundColor: "#B87C4C",
                  height: 3,
                },
                "& .MuiTab-root": {
                  minHeight: 40,
                  textTransform: "none",
                  fontWeight: 800,
                  color: "#cbd5e1",
                },
                "& .Mui-selected": {
                  color: "#f8fafc",
                },
              }}
            >
              {tabs.map((tab) => (
                <Tab
                  key={tab.to}
                  label={tab.label}
                  value={tab.to}
                  onClick={() => navigate(tab.to)}
                />
              ))}
            </Tabs>

            <Stack
  direction="row"
  spacing={1.5}
  sx={{ alignItems: "center" }}
>
              <Chip
                label={user?.email ?? user?.uid ?? "signed in"}
                size="small"
                sx={{
                  bgcolor: "rgba(168, 187, 163, 0.14)",
                  color: "#d9e6d6",
                  fontWeight: 700,
                }}
              />
              <Button
                variant="outlined"
                onClick={handleSignOut}
                sx={{
                  color: "#f8fafc",
                  borderColor: "rgba(248, 250, 252, 0.35)",
                  fontWeight: 800,
                  "&:hover": {
                    borderColor: "#f8fafc",
                    bgcolor: "rgba(248, 250, 252, 0.06)",
                  },
                }}
              >
                Sign out
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}