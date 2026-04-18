import { Box, Paper, Typography } from "@mui/material";
import type { BodyZone } from "../../types/vivawav3";

type Props = {
  zones: BodyZone[];
};

export function PoseOverlay({ zones }: Props) {
  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 4,
        bgcolor: "rgba(168, 187, 163, 0.08)",
        border: "1px solid rgba(184, 124, 76, 0.2)",
        color: "#e2e8f0",
      }}
    >
      <Typography sx={{ color: "#f8fafc", fontWeight: 800, mb: 1.5 }}>
        Pose overlay
      </Typography>

      <Box
        sx={{
          height: 180,
          borderRadius: 3,
          bgcolor: "rgba(2, 6, 23, 0.55)",
          border: "1px solid rgba(148,163,184,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: "50%",
            border: "1px dashed rgba(168, 187, 163, 0.5)",
          }}
        />
        <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>
          Landmark visualization placeholder
        </Typography>
      </Box>

      <Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
        {zones.length === 0 ? (
          <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>
            No zones yet. Run assessment to populate asymmetry signals.
          </Typography>
        ) : (
          zones.map((zone) => (
            <Box
              key={zone.area}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                py: 1,
                borderBottom: "1px solid rgba(148,163,184,0.12)",
              }}
            >
              <Typography sx={{ color: "#e2e8f0" }}>{zone.area}</Typography>
              <Typography sx={{ color: "#B87C4C", fontWeight: 700 }}>
                {Math.round(zone.intensity * 100)}%
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
}