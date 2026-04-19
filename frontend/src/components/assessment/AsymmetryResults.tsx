import { Box, Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type { BodySnapshot, GenerateProtocolResponse, HardwareProtocol } from "../../types/vivawav3";

type Props = {
  snapshot: BodySnapshot | null;
  protocol: HardwareProtocol | null;
  sessionId?: string | null;
  voiceAudio?: GenerateProtocolResponse["voiceAudio"] | null;
  validation?: GenerateProtocolResponse["validation"] | null;
  deviceSession?: GenerateProtocolResponse["deviceSession"] | null;
};

const MODALITY_LABELS: Record<string, string> = {
  thermal: "🌡 Thermal Contrast",
  photobiomodulation: "💡 Photobiomodulation",
  vibro_acoustic: "〰 Vibro-Acoustic Resonance",
  combined: "✦ Combined (All Modalities)",
};

const THERMAL_LABELS: Record<string, string> = {
  heat: "Warming",
  cool: "Cooling",
  neutral: "Neutral",
};

function formatPlacement(raw: string | undefined): string {
  if (!raw) return "—";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function intensityLabel(v: number): string {
  if (v < 35) return "Gentle";
  if (v < 65) return "Moderate";
  return "Strong";
}

export function AsymmetryResults({
  snapshot,
  protocol,
  sessionId,
  voiceAudio,
  validation,
  deviceSession,
}: Props) {
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
        Assessment results
      </Typography>

      {!snapshot ? (
        <Typography sx={{ color: "#94a3b8" }}>
          Run assessment to generate results.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {/* ── Recovery Score ── */}
          <Box>
            <Typography sx={{ color: "#94a3b8", fontSize: 12 }}>Recovery score</Typography>
            <Typography sx={{ fontSize: 34, fontWeight: 900, color: "#f8fafc" }}>
              {snapshot.recoveryScore}
              <Typography component="span" sx={{ fontSize: 14, color: "#94a3b8", ml: 1, fontWeight: 400 }}>/ 100</Typography>
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap", gap: 0.5 }}>
              <Chip
                size="small"
                label={`HRV ${snapshot.state.hrv}`}
                sx={{ bgcolor: "rgba(168,187,163,0.2)", color: "#e2e8f0", fontSize: 11 }}
              />
              <Chip
                size="small"
                label={`Strain ${snapshot.state.strain}`}
                sx={{ bgcolor: "rgba(184,124,76,0.2)", color: "#e2e8f0", fontSize: 11 }}
              />
              <Chip
                size="small"
                label={`Readiness: ${snapshot.state.readiness}`}
                sx={{
                  bgcolor:
                    snapshot.state.readiness === "high"
                      ? "rgba(34,197,94,0.15)"
                      : snapshot.state.readiness === "low"
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(148,163,184,0.15)",
                  color: "#e2e8f0",
                  fontSize: 11,
                }}
              />
            </Stack>
          </Box>

          {/* ── Asymmetry Zones ── */}
          {snapshot.zones.map((zone) => (
            <Box key={zone.area}>
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                <Typography sx={{ color: "#f8fafc", fontWeight: 700, textTransform: "capitalize" }}>
                  {zone.area}
                </Typography>
                <Typography sx={{ color: "#94a3b8", fontSize: 12 }}>
                  {Math.round(zone.intensity * 100)}% asymmetry
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={zone.intensity * 100}
                sx={{
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: "#1e293b",
                  "& .MuiLinearProgress-bar": {
                    background: "linear-gradient(90deg, #A8BBA3, #B87C4C)",
                  },
                }}
              />
            </Box>
          ))}

          {/* ── Pad Placement ── */}
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.35)" }}>
            <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>
              Recommended pad placement
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Box sx={{ flex: 1, p: 1, borderRadius: 2, bgcolor: "rgba(184,124,76,0.12)", border: "1px solid rgba(184,124,76,0.3)" }}>
                <Typography sx={{ fontSize: 11, color: "#B87C4C", fontWeight: 700 }}>☀ SUN PAD</Typography>
                <Typography sx={{ fontSize: 13, color: "#f8fafc", fontWeight: 600 }}>
                  {formatPlacement(snapshot.recommendedPlacement.sunPad)}
                </Typography>
                {protocol?.sunPad && (
                  <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: 0.3 }}>
                    {THERMAL_LABELS[protocol.sunPad.thermalMode] ?? protocol.sunPad.thermalMode}
                    {protocol.sunPad.lightIntensity != null && ` · Light ${protocol.sunPad.lightIntensity}%`}
                    {protocol.sunPad.vibroAcousticIntensity != null && ` · Vibro ${protocol.sunPad.vibroAcousticIntensity}%`}
                  </Typography>
                )}
              </Box>
              <Box sx={{ flex: 1, p: 1, borderRadius: 2, bgcolor: "rgba(168,187,163,0.12)", border: "1px solid rgba(168,187,163,0.3)" }}>
                <Typography sx={{ fontSize: 11, color: "#A8BBA3", fontWeight: 700 }}>🌙 MOON PAD</Typography>
                <Typography sx={{ fontSize: 13, color: "#f8fafc", fontWeight: 600 }}>
                  {formatPlacement(snapshot.recommendedPlacement.moonPad)}
                </Typography>
                {protocol?.moonPad && (
                  <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: 0.3 }}>
                    {THERMAL_LABELS[protocol.moonPad.thermalMode] ?? protocol.moonPad.thermalMode}
                    {protocol.moonPad.lightIntensity != null && ` · Light ${protocol.moonPad.lightIntensity}%`}
                    {protocol.moonPad.vibroAcousticIntensity != null && ` · Vibro ${protocol.moonPad.vibroAcousticIntensity}%`}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>

          {/* ── Session Protocol Card ── */}
          {protocol && (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.35)" }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Personalized session protocol
                </Typography>
                <Chip
                  size="small"
                  label={`${protocol.sessionDurationMinutes} min`}
                  sx={{ bgcolor: "rgba(168,187,163,0.2)", color: "#e2e8f0", fontWeight: 700 }}
                />
              </Stack>

              {/* Phase timeline */}
              <Stack spacing={1}>
                {protocol.sequence.map((step) => (
                  <Box
                    key={step.order}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      p: 1,
                      borderRadius: 2,
                      bgcolor: "rgba(148,163,184,0.06)",
                      border: "1px solid rgba(148,163,184,0.1)",
                    }}
                  >
                    {/* Phase number */}
                    <Box sx={{
                      minWidth: 24, height: 24, borderRadius: "50%",
                      bgcolor: "rgba(184,124,76,0.3)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#B87C4C" }}>{step.order}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ fontSize: 12, color: "#f8fafc", fontWeight: 700 }}>
                          {MODALITY_LABELS[step.modality] ?? step.modality}
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          <Chip size="small" label={`${step.durationMinutes}m`}
                            sx={{ fontSize: 10, height: 18, bgcolor: "rgba(168,187,163,0.15)", color: "#A8BBA3" }} />
                          <Chip size="small" label={`${intensityLabel(step.intensity)} (${step.intensity}%)`}
                            sx={{ fontSize: 10, height: 18, bgcolor: "rgba(184,124,76,0.15)", color: "#B87C4C" }} />
                        </Stack>
                      </Stack>
                      {step.notes && (
                        <Typography sx={{ fontSize: 11, color: "#64748b", mt: 0.3, lineHeight: 1.5 }}>
                          {step.notes}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>

              {/* Photobiomodulation specs */}
              {protocol.photobiomodulation && (
                <Typography sx={{ fontSize: 11, color: "#64748b", mt: 1 }}>
                  Light: Red {protocol.photobiomodulation.redNm}nm · Blue {protocol.photobiomodulation.blueNm}nm
                </Typography>
              )}
            </Box>
          )}

          {/* ── Validation badge ── */}
          {validation ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>Protocol source</Typography>
              <Chip
                size="small"
                label={
                  validation.source === "gemini"
                    ? `Gemini · ${validation.attempts} attempt(s)`
                    : `Fallback · ${validation.attempts} attempt(s)`
                }
                sx={{
                  bgcolor:
                    validation.source === "gemini"
                      ? "rgba(168, 187, 163, 0.25)"
                      : "rgba(184, 124, 76, 0.25)",
                  color: "#e2e8f0",
                  fontWeight: 700,
                }}
              />
              {validation.reason ? (
                <Typography sx={{ fontSize: 11, color: "#64748b" }}>{validation.reason}</Typography>
              ) : null}
            </Box>
          ) : null}

          {/* ── Voice coaching + narration ── */}
          {voiceAudio?.url ? (
            <Box>
              <Typography sx={{ fontSize: 12, color: "#94a3b8", mb: 0.5 }}>
                Personalized session narration
                {voiceAudio.fallback ? " (fallback audio)" : " · AI-generated"} ·{" "}
                {Math.round(voiceAudio.durationSeconds)}s
              </Typography>
              <audio controls src={voiceAudio.url} style={{ width: "100%", maxHeight: 40 }} />
              {voiceAudio.script ? (
                <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: "rgba(168,187,163,0.06)", border: "1px solid rgba(148,163,184,0.12)" }}>
                  <Typography sx={{ fontSize: 11, color: "#64748b", mb: 0.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Narration script — personalized from your assessment
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
                    {voiceAudio.script}
                  </Typography>
                </Box>
              ) : null}
            </Box>
          ) : null}


          {/* ── Device dispatch badge ── */}
          {deviceSession ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>Device dispatch</Typography>
              <Chip
                size="small"
                label={
                  deviceSession.live
                    ? deviceSession.status === "started"
                      ? "✓ Session started on device"
                      : "✓ Protocol queued on device"
                    : deviceSession.status === "simulated"
                    ? "◎ Simulation mode (no device credentials)"
                    : "⚠ Dispatch error"
                }
                sx={{
                  fontWeight: 700,
                  bgcolor:
                    deviceSession.live
                      ? "rgba(34,197,94,0.15)"
                      : deviceSession.status === "simulated"
                      ? "rgba(234,179,8,0.15)"
                      : "rgba(239,68,68,0.15)",
                  color:
                    deviceSession.live
                      ? "#86efac"
                      : deviceSession.status === "simulated"
                      ? "#fde047"
                      : "#fca5a5",
                }}
              />
              <Typography sx={{ fontSize: 11, color: "#475569", width: "100%" }}>
                {deviceSession.message}
              </Typography>
            </Box>
          ) : null}

          {/* ── Session ID ── */}
          {sessionId ? (
            <Typography sx={{ fontSize: 11, color: "#64748b" }}>Session: {sessionId}</Typography>
          ) : null}
        </Stack>
      )}
    </Paper>
  );
}
