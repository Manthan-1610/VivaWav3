import { Box, Paper, Stack, Typography } from "@mui/material";

type Props = {
  before: string;
  after: string;
};

export function BeforeAfterComparison({ before, after }: Props) {
  return (
    <Paper
      sx={{
        p: 2.2,
        borderRadius: 4,
        backgroundColor: "rgba(168, 187, 163, 0.08)",
        border: "1px solid rgba(184, 124, 76, 0.2)",
        color: "#e2e8f0",
      }}
    >
      <Typography sx={{ color: "#f8fafc", fontWeight: 800, mb: 1.4 }}>
        Before / after
      </Typography>

      <Stack spacing={1.2}>
        <Box
          sx={{
            p: 1.6,
            borderRadius: 3,
            backgroundColor: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(148, 163, 184, 0.12)",
          }}
        >
          <Typography sx={{ color: "#cbd5e1", fontSize: 12, mb: 0.5 }}>
            Before
          </Typography>
          <Typography sx={{ color: "#f8fafc", fontWeight: 700 }}>
            {before}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1.6,
            borderRadius: 3,
            backgroundColor: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(148, 163, 184, 0.12)",
          }}
        >
          <Typography sx={{ color: "#cbd5e1", fontSize: 12, mb: 0.5 }}>
            After
          </Typography>
          <Typography sx={{ color: "#f8fafc", fontWeight: 700 }}>
            {after}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}