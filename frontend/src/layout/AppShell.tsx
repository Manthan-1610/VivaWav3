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
    <Box sx={{ 
      minHeight: "100vh", 
      bgcolor: "#0b1220",
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '45%',
        height: '45%',
        background: 'radial-gradient(circle, rgba(184, 124, 76, 0.07) 0%, transparent 75%)',
        pointerEvents: 'none',
        zIndex: 0,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '45%',
        height: '45%',
        background: 'radial-gradient(circle, rgba(168, 187, 163, 0.05) 0%, transparent 75%)',
        pointerEvents: 'none',
        zIndex: 0,
      }
    }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(11, 18, 32, 0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
          zIndex: 10,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ py: 0.8, gap: 2 }}>
            <Typography
              sx={{
                color: "#f8fafc",
                fontSize: 20,
                fontWeight: 900,
                mr: 2,
                whiteSpace: "nowrap",
                letterSpacing: -0.5,
                background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ViVaWav3
            </Typography>

            <Tabs
              value={currentTab}
              textColor="inherit"
              sx={{
                flex: 1,
                minHeight: 48,
                "& .MuiTabs-indicator": {
                  backgroundColor: "#B87C4C",
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
                "& .MuiTab-root": {
                  minHeight: 48,
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: 14,
                  color: "#94a3b8",
                  transition: 'color 0.2s',
                  "&:hover": { color: "#cbd5e1" },
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
              spacing={2}
              sx={{ alignItems: "center" }}
            >
              <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Chip
                  label={user?.role?.toUpperCase() || "USER"}
                  size="small"
                  sx={{
                    bgcolor: "rgba(184, 124, 76, 0.15)",
                    color: "#B87C4C",
                    fontWeight: 900,
                    fontSize: 10,
                    letterSpacing: 1,
                    height: 20,
                    border: '1px solid rgba(184, 124, 76, 0.25)'
                  }}
                />
                <Typography sx={{ color: "#94a3b8", fontSize: 13, fontWeight: 700 }}>
                  {user?.email?.split('@')[0]}
                </Typography>
              </Stack>

              <Button
                variant="contained"
                onClick={handleSignOut}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                  color: "#f8fafc",
                  fontWeight: 800,
                  fontSize: 12,
                  px: 2,
                  py: 0.8,
                  borderRadius: 2,
                  boxShadow: 'none',
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  },
                }}
              >
                Sign out
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
}