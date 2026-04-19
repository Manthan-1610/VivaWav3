import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";

interface State {
  hasError: boolean;
  message: string;
}

interface Props {
  children: ReactNode;
}

/** Error boundary wrapping the client recovery dashboard. */
export class RecoveryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred in the recovery dashboard.";
    return { hasError: true, message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RecoveryErrorBoundary]", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert
            severity="error"
            sx={{ bgcolor: "rgba(127,29,29,0.25)", color: "#fecaca", borderRadius: 3 }}
            action={
              <Button
                size="small"
                onClick={this.handleReset}
                sx={{ color: "#fca5a5", fontWeight: 700 }}
              >
                Retry
              </Button>
            }
          >
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
              Recovery dashboard error
            </Typography>
            <Typography variant="body2">{this.state.message}</Typography>
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}
