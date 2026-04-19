import { Button, Paper, Stack, Typography } from "@mui/material";

type Props = {
  onSubmit: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Shown when the button is disabled (e.g. recording not finished). */
  disabledHint?: string;
  /** Requirement 3.4: surfaced after a failed POST so the practitioner can retry without re-recording. */
  submissionError?: string | null;
  onRetrySubmission?: () => void;
};

export function SubmitAssessment({
  onSubmit,
  loading = false,
  disabled = false,
  disabledHint,
  submissionError,
  onRetrySubmission,
}: Props) {
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

      {disabled && disabledHint ? (
        <Typography sx={{ color: "#94a3b8", fontSize: 13, mb: 1 }}>
          {disabledHint}
        </Typography>
      ) : null}

      {submissionError ? (
        <Typography sx={{ color: "#fecaca", fontSize: 14, mb: 1 }}>
          {submissionError}
        </Typography>
      ) : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button
          fullWidth
          variant="contained"
          onClick={onSubmit}
          disabled={disabled || loading}
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
          {loading ? "Generating…" : "Generate body snapshot"}
        </Button>
        {submissionError && onRetrySubmission ? (
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            disabled={loading || disabled}
            onClick={onRetrySubmission}
            sx={{ py: 1.3, borderRadius: 3, fontWeight: 700 }}
          >
            Retry submission
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
