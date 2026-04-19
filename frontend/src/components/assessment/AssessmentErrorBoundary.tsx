import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";

type Props = { children: ReactNode };

type State = { hasError: boolean; message: string | null };

/**
 * Requirement 13: isolate assessment UI failures so the rest of the app keeps running.
 */
export class AssessmentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(err: unknown): State {
    const message =
      err instanceof Error
        ? err.message
        : "This view hit an unexpected issue. Your work is safe—try reloading this page.";
    return { hasError: true, message };
  }

  componentDidCatch(err: unknown, info: ErrorInfo) {
    console.error("[AssessmentErrorBoundary]", err, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography fontWeight={800} sx={{ mb: 0.5 }}>
              Something went wrong in the assessment view
            </Typography>
            <Typography variant="body2">{this.state.message}</Typography>
          </Alert>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
