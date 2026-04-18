import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#A8BBA3", // your green
    },
    secondary: {
      main: "#B87C4C", // your brown
    },
    background: {
      default: "#0b1220",
      paper: "#111827",
    },
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
  },
});