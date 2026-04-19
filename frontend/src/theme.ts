import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#FF4D6D", // Glowing Red for Sun
      light: "#FF758F",
      dark: "#C9184A",
    },
    secondary: {
      main: "#48CAE4", // Glowing Blue for Moon
      light: "#90E0EF",
      dark: "#0077B6",
    },
    background: {
      default: "#0A0F1A", // Deep sleek background
      paper: "rgba(17, 24, 39, 0.6)", // Glassmorphism base
    },
    text: {
      primary: "#F8FAFC",
      secondary: "#94A3B8",
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.01em" },
    h4: { fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontWeight: 600, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.02em" },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "radial-gradient(circle at 50% -20%, #1a233a 0%, #0A0F1A 80%)",
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          padding: "10px 24px",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(16px)",
          backgroundColor: "rgba(17, 24, 39, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            borderColor: "rgba(255, 255, 255, 0.2)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          },
        },
      },
    },
  },
});