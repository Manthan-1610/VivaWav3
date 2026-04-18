import { CssBaseline, Box, Container, Typography } from "@mui/material";
import { AssessmentView } from "./components/assessment/AssessmentView";

export function App() {
  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          py: 3,
          background:
            "radial-gradient(circle at top left, rgba(168, 187, 163, 0.18), transparent 28%), radial-gradient(circle at top right, rgba(184, 124, 76, 0.16), transparent 30%), #0b1220",
        }}
      >
        <Container maxWidth="lg">
          <Typography
            sx={{
              mb: 2,
              color: "#f8fafc",
              fontSize: { xs: "2rem", md: "3rem" },
              fontWeight: 900,
            }}
          >
            ViVaWav3 Assessment
          </Typography>

          <AssessmentView />
        </Container>
      </Box>
    </>
  );
}