import { Chip } from "@mui/material";

type Props = {
  connected?: boolean;
};

export function RealTimeIndicator({ connected = true }: Props) {
  return (
    <Chip
      label={connected ? "Live sync ready" : "Sync unavailable"}
      sx={{
        alignSelf: "flex-start",
        bgcolor: connected
          ? "rgba(168, 187, 163, 0.16)"
          : "rgba(184, 124, 76, 0.16)",
        color: connected ? "#c7d8c2" : "#f0c7a8",
        border: `1px solid ${
          connected ? "rgba(168, 187, 163, 0.28)" : "rgba(184, 124, 76, 0.28)"
        }`,
        fontWeight: 800,
      }}
    />
  );
}