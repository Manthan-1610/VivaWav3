import { Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type { BodySnapshot, HardwareProtocol } from "../../types/vivawav3";

type Props = {
  snapshot: BodySnapshot | null;
  protocol: HardwareProtocol | null;
};

export function AsymmetryResults({ snapshot, protocol }: Props) {
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
        Asymmetry results
      </Typography>

      {!snapshot ? (
        <Typography sx={{ color: "#94a3b8" }}>
          Run assessment to generate results.
        </Typography>
      ) : (
        <Stack spacing={2}>
          <Box>
            <Typography sx={{ color: "#94a3b8", fontSize: 12 }}>
              Recovery score
            </Typography>
            <Typography sx={{ fontSize: 34, fontWeight: 900, color: "#f8fafc" }}>
              {snapshot.recoveryScore}
            </Typography>
          </Box>

          {snapshot.zones.map((zone) => (
            <Box key={zone.area}>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", mb: 0.5 }}
              >
                <Typography sx={{ color: "#f8fafc", fontWeight: 700 }}>
                  {zone.area}
                </Typography>
                <Typography sx={{ color: "#94a3b8", fontSize: 12 }}>
                  {Math.round(zone.intensity * 100)}%
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={zone.intensity * 100}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: "#1e293b",
                  "& .MuiLinearProgress-bar": {
                    background: "linear-gradient(90deg, #A8BBA3, #B87C4C)",
                  },
                }}
              />
            </Box>
          ))}

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
          >
            <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>
              Sun pad: {snapshot.recommendedPlacement.sunPad}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>
              Moon pad: {snapshot.recommendedPlacement.moonPad}
            </Typography>
          </Box>

          {protocol && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "rgba(0,0,0,0.4)",
              }}
            >
              <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>
                Protocol preview
              </Typography>
              <Typography sx={{ color: "#f8fafc", fontWeight: 700 }}>
                {protocol.duration} min · {protocol.thermal} · {protocol.light}
              </Typography>
            </Box>
          )}
        </Stack>
      )}
    </Paper>
  );
}