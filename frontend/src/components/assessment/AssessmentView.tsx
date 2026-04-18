import { useState } from "react";
import { Stack, Typography } from "@mui/material";
import { CameraCapture } from "./CameraCapture";
import { PoseOverlay } from "./PoseOverlay";
import { AsymmetryResults } from "./AsymmetryResults";
import { SubmitAssessment } from "./SubmitAssessment";
import type { BodySnapshot, HardwareProtocol } from "../../types/vivawav3";

export function AssessmentView() {
  const [isRecording, setIsRecording] = useState(false);
  const [snapshot, setSnapshot] = useState<BodySnapshot | null>(null);
  const [protocol, setProtocol] = useState<HardwareProtocol | null>(null);

  const toggleRecording = () => {
    setIsRecording((prev) => !prev);
  };

  const runAssessment = async () => {
    setIsRecording(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    setSnapshot({
      recoveryScore: 72,
      zones: [
        { area: "left shoulder", intensity: 0.82 },
        { area: "lower back", intensity: 0.61 },
        { area: "right hip", intensity: 0.44 },
      ],
      recommendedPlacement: {
        sunPad: "lower_back",
        moonPad: "left_shoulder",
      },
      state: {
        hrv: 45,
        strain: 72,
        readiness: "low",
      },
    });

    setProtocol({
      duration: 10,
      thermal: "contrast",
      light: "red_dominant_with_blue_support",
      resonance: "low_frequency",
      guidance: [
        "Inhale for 4 seconds.",
        "Exhale for 6 seconds.",
        "Relax the jaw and shoulders.",
        "Let the session support downregulation.",
      ],
    });

    setIsRecording(false);
  };

  return (
    <Stack spacing={2}>
      <Typography sx={{ color: "#cbd5e1", fontSize: 13 }}>
        60-second kinematic intake for the client
      </Typography>

      <CameraCapture
        isRecording={isRecording}
        onToggleRecording={toggleRecording}
      />

      <PoseOverlay zones={snapshot?.zones ?? []} />

      <AsymmetryResults snapshot={snapshot} protocol={protocol} />

      <SubmitAssessment onSubmit={runAssessment} />
    </Stack>
  );
}