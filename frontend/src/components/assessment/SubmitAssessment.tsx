import { Button, Paper, Typography } from "@mui/material";

type Props = {
  onSubmit: () => void;
};

export function SubmitAssessment({ onSubmit }: Props) {
  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 4,
        bgcolor: "rgba(168, 187, 163, 0.08)",
        border: "1px solid rgba(184, 124, 76, 0.2)",
      }}
    >
      <Typography sx={{ color: "#f8fafc", fontWeight: 800, mb: 1.5 }}>
        Submit assessment
      </Typography>

      <Button
        fullWidth
        variant="contained"
        onClick={onSubmit}
        sx={{
          py: 1.3,
          borderRadius: 3,
          fontWeight: 800,
          background: "linear-gradient(135deg, #A8BBA3, #B87C4C)",
          color: "#0b1220",
          "&:hover": {
            background: "linear-gradient(135deg, #95a892, #a56d42)",
          },
        }}
      >
        Generate body snapshot
      </Button>
    </Paper>
  );
}