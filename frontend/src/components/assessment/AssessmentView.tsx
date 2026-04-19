import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";
import { CameraCapture } from "./CameraCapture";
import { PoseOverlay } from "./PoseOverlay";
import { AsymmetryResults } from "./AsymmetryResults";
import type {
  BodySnapshot,
  GenerateProtocolResponse,
  HardwareProtocol,
  SavedAssessmentSession,
} from "../../types/vivawav3";
import { postGenerateProtocol } from "../../api/generateProtocol";
import { saveAssessmentSession } from "../../api/sessions";
import { useAuth } from "../../auth/useAuth";
import { useAssessmentDraft } from "../../state/assessmentDraft";
import { roundTripJson } from "../../lib/jsonRoundTrip";
import {
  aggregatePoseSamples,
  getPoseLandmarker,
  landmarksToJointSample,
  type PoseJointSample,
} from "../../lib/poseEstimator";

type AssessmentViewState = "intake" | "camera" | "results";

const MOCK_PROFILES = [
  { id: "athlete", name: "High Strain Athlete", hrv: 75, strain: 90, sleepQuality: 80 },
  { id: "office", name: "Stressed Office Worker", hrv: 35, strain: 40, sleepQuality: 40 },
  { id: "rehab", name: "Post-Op Rehab", hrv: 50, strain: 20, sleepQuality: 60 },
] as const;

function statusFromReadiness(
  readiness: BodySnapshot["state"]["readiness"],
): SavedAssessmentSession["status"] {
  if (readiness === "high") return "Ready";
  if (readiness === "low") return "Needs Attention";
  return "Recovering";
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

export function AssessmentView() {
  const { user } = useAuth();
  const { draft, updateDraft } = useAssessmentDraft();

  const draftState = draft as Record<string, unknown>;

  const [viewState, setViewState] = useState<AssessmentViewState>(
    (draftState.viewState as AssessmentViewState | undefined) ?? "intake",
  );
  const [clientEmail, setClientEmail] = useState<string>(
    (draftState.clientEmail as string | undefined) ?? "",
  );
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    (draftState.selectedProfileId as string | undefined) ?? MOCK_PROFILES[0].id,
  );
  const [selectedGoal, setSelectedGoal] = useState<string>(
    (draftState.selectedGoal as string | undefined) ?? "Recovery",
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef(0);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [poseInitError, setPoseInitError] = useState<string | null>(null);
  const [landmarker, setLandmarker] = useState<PoseLandmarker | null>(null);
  const [lastLandmarks, setLastLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [poseSamples, setPoseSamples] = useState<PoseJointSample[]>([]);
  const lastSampleAtRef = useRef(0);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<BodySnapshot | null>(
    (draftState.bodySnapshot as BodySnapshot | undefined) ?? null,
  );
  const [protocol, setProtocol] = useState<HardwareProtocol | null>(
    (draftState.protocol as HardwareProtocol | undefined) ?? null,
  );
  const [sessionId, setSessionId] = useState<string | null>(
    (draftState.sessionId as string | undefined) ?? null,
  );
  const [voiceAudio, setVoiceAudio] =
    useState<GenerateProtocolResponse["voiceAudio"] | null>(
      (draftState.voiceAudio as GenerateProtocolResponse["voiceAudio"] | undefined) ?? null,
    );
  const [validation, setValidation] =
    useState<GenerateProtocolResponse["validation"] | null>(
      (draftState.validation as GenerateProtocolResponse["validation"] | undefined) ?? null,
    );
  const [deviceSession, setDeviceSession] =
    useState<GenerateProtocolResponse["deviceSession"] | null>(
      (draftState.deviceSession as GenerateProtocolResponse["deviceSession"] | undefined) ?? null,
    );

  useEffect(() => {
    let cancelled = false;
    getPoseLandmarker()
      .then((p) => {
        if (!cancelled) {
          poseLandmarkerRef.current = p;
          setLandmarker(p);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setPoseInitError(
            e instanceof Error ? e.message : "Pose estimation could not start.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    updateDraft({
      viewState,
      clientEmail,
      selectedProfileId,
      selectedGoal,
    } as any);
  }, [viewState, clientEmail, selectedProfileId, selectedGoal, updateDraft]);

  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (clientEmail.includes("@") && clientEmail.includes(".")) {
        try {
          const res = await apiFetch(`/api/clients/check/${clientEmail}`);
          const data = await res.json();
          setIsRegistered(data.exists);
        } catch (err) {
          console.warn("[AssessmentView] check-user error:", err);
          setIsRegistered(false);
        }
      } else {
        setIsRegistered(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [clientEmail]);

  useEffect(() => {
    poseLandmarkerRef.current = landmarker;
  }, [landmarker]);

  useEffect(() => {
    if (!cameraStarted) return;

    let cancelled = false;
    setCameraError(null);

    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stopTracks(s);
          return;
        }

        setStream(s);
      } catch (e) {
        if (!cancelled) {
          setCameraError(
            e instanceof Error ? e.message : "Camera access blocked.",
          );
          setStream(null);
          setCameraStarted(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cameraStarted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !stream) return;

    v.srcObject = stream;
    void v.play().catch(() => setCameraError("Unable to play stream."));
  }, [stream]);

  useEffect(() => {
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      const pl = poseLandmarkerRef.current;
      const v = videoRef.current;

      if (pl && v && v.readyState >= 2 && v.videoWidth > 0 && viewState === "camera") {
        try {
          const result = pl.detectForVideo(v, performance.now());
          const lm = result.landmarks[0];

          if (lm?.length) {
            setLastLandmarks(lm);

            const now = performance.now();
            if (now - lastSampleAtRef.current >= 100) {
              lastSampleAtRef.current = now;
              setPoseSamples((prev) => [...prev.slice(-19), landmarksToJointSample(lm)]);
            }
          } else {
            setLastLandmarks(null);
          }
        } catch {
          setLastLandmarks(null);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [stream, landmarker, viewState]);

  const startCamera = useCallback(() => {
    setError(null);
    setSaveWarning(null);
    setCameraError(null);
    setCameraStarted(true);
    setViewState("camera");
  }, []);

  const captureSnapshot = useCallback(async () => {
    if (poseSamples.length === 0) return;

    const email = clientEmail.trim();
    if (!email) {
      setError("Enter the client email before capturing or saving.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSaveWarning(null);

    const aggregated = aggregatePoseSamples(poseSamples);
    if (!aggregated.poseFound) {
      setError("No stable pose detected. Ask client to step back and retry.");
      setIsAnalyzing(false);
      return;
    }

    stopTracks(stream);
    setStream(null);
    setCameraStarted(false);

    const selectedProfile =
      MOCK_PROFILES.find((p) => p.id === selectedProfileId) ?? MOCK_PROFILES[0];

    // --- Dynamic Scoring Logic ---
    const calculateUnifiedScore = (asymRaw: number, hrv: number, strain: number, goal: string) => {
      // 1. Asymmetry component (0-100) - 100 is perfectly balanced
      const symmetryScore = Math.max(0, 100 - asymRaw * 100);
      
      // 2. Weighting based on user Goal
      let wSym = 0.5, wHrv = 0.3, wStrain = 0.2;
      if (goal === "Prep") { wSym = 0.7; wHrv = 0.2; wStrain = 0.1; }
      else if (goal === "Relaxation") { wSym = 0.3; wHrv = 0.5; wStrain = 0.2; }
      
      // 3. Normalized Wearable inputs
      const hrvScore = Math.min(100, hrv);
      const strainPotential = Math.max(0, 100 - strain);
      
      // 4. Base calculation
      const base = (symmetryScore * wSym) + (hrvScore * wHrv) + (strainPotential * wStrain);
      
      // 5. Add a small organic variance (+/- 3 points) to feel dynamic/live
      const variance = (Math.random() * 6) - 3;
      
      return Math.round(Math.max(10, Math.min(99, base + variance)));
    };

    const asymRaw = aggregated.zones.reduce((acc, z) => acc + z.intensity, 0) / Math.max(1, aggregated.zones.length);
    const finalRecoveryScore = calculateUnifiedScore(asymRaw, selectedProfile.hrv, selectedProfile.strain, selectedGoal);

    const nextSnapshot: BodySnapshot = {
      recoveryScore: finalRecoveryScore,
      zones: aggregated.zones.map((z) => ({
        area: z.area,
        intensity: z.intensity,
      })),
      recommendedPlacement: aggregated.recommendedPlacement,
      state: {
        hrv: selectedProfile.hrv,
        strain: selectedProfile.strain,
        readiness: finalRecoveryScore >= 75 ? "high" : finalRecoveryScore < 50 ? "low" : "stable",
      },
    };

    setSnapshot(nextSnapshot);

    try {
      const jointScores: Record<string, number> = {};
      for (const z of nextSnapshot.zones) {
        jointScores[z.area.replace(/\s+/g, "_")] = z.intensity;
      }
      for (const [k, v] of Object.entries(aggregated.jointScores)) {
        if (typeof v === "number") jointScores[k] = v;
      }

      const payload = roundTripJson({
        userId: `intake-${user?.uid ?? "unknown"}`,
        practitionerId: user?.uid ?? "unknown-practitioner",
        asymmetry: {
          jointScores,
          padPlacementSuggestion: {
            sun: nextSnapshot.recommendedPlacement.sunPad,
            moon: nextSnapshot.recommendedPlacement.moonPad,
          },
          readiness: nextSnapshot.state.readiness,
          landmarkSnapshot: lastLandmarks
            ? { landmarks: JSON.stringify(lastLandmarks).slice(0, 8000) }
            : {},
        },
        wearables: {
          hrv: selectedProfile.hrv,
          strain: selectedProfile.strain,
          sleepQuality: selectedProfile.sleepQuality,
          activity: selectedGoal,
        },
        metadata: { source: "assessment_view", role: user?.role ?? "unknown" },
      });

      const res = await postGenerateProtocol(payload);

      setProtocol(res.hardwareProtocol);
      setSessionId(res.sessionId);
      setVoiceAudio(res.voiceAudio ?? null);
      setValidation(res.validation ?? null);
      setDeviceSession(res.deviceSession ?? null);
      setViewState("results");

      updateDraft({
        viewState: "results",
        clientEmail: email,
        clientId: email,
        name: email,
        sessionId: res.sessionId,
        bodySnapshot: nextSnapshot,
        protocol: res.hardwareProtocol,
        voiceAudio: res.voiceAudio ?? null,
        validation: res.validation ?? null,
        deviceSession: res.deviceSession ?? null,
      } as any);

      const session: SavedAssessmentSession = {
  sessionId: res.sessionId,
  practitionerId: user?.uid ?? "unknown-practitioner",
  clientId: email,
  clientEmail: email,
  displayName: email,
  recoveryScore: nextSnapshot.recoveryScore,
  scoreDate: new Date().toISOString().slice(0, 10),
  mobilityStreakDays: Math.max(
    1,
    Math.min(14, Math.round(nextSnapshot.recoveryScore / 10))
  ),
  level: Math.max(1, Math.round(nextSnapshot.recoveryScore / 25)),
  status: statusFromReadiness(nextSnapshot.state.readiness),
  bodySnapshot: nextSnapshot,
  protocol: res.hardwareProtocol,
  voiceAudio: res.voiceAudio ?? null,
  validation: res.validation ?? null,
  deviceSession: res.deviceSession ?? null,
  createdAt: new Date().toISOString(),
};

      try {
        await saveAssessmentSession(session);
        window.dispatchEvent(new Event("vivawav3:sessions-updated"));
      } catch (saveErr) {
        const msg =
          saveErr instanceof Error
            ? saveErr.message
            : "Saved locally, but backend session save failed.";
        setSaveWarning(msg);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "API generation failed.";
      setError(msg);
      setViewState("camera");
      startCamera();
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    poseSamples,
    clientEmail,
    selectedProfileId,
    selectedGoal,
    stream,
    user?.uid,
    user?.role,
    lastLandmarks,
    startCamera,
    updateDraft,
  ]);

  const startIntake = useCallback(() => {
    stopTracks(stream);
    setStream(null);
    setCameraStarted(false);
    setCameraError(null);
    setError(null);
    setSaveWarning(null);
    setSnapshot(null);
    setProtocol(null);
    setSessionId(null);
    setVoiceAudio(null);
    setValidation(null);
    setDeviceSession(null);
    setLastLandmarks(null);
    setPoseSamples([]);
    setIsAnalyzing(false);
    setClientEmail("");
    setViewState("intake");

    updateDraft({
      viewState: "intake",
      clientEmail: "",
      clientId: undefined,
      name: undefined,
      sessionId: undefined,
      bodySnapshot: undefined,
      protocol: undefined,
      voiceAudio: undefined,
      validation: undefined,
      deviceSession: undefined,
    } as any);
  }, [stream, updateDraft]);

  const selectedProfile =
    MOCK_PROFILES.find((p) => p.id === selectedProfileId) ?? MOCK_PROFILES[0];

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h5"
          sx={{ color: "#f8fafc", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          Movement Assessment
        </Typography>

        {viewState !== "intake" ? (
          <Button variant="outlined" onClick={startIntake} sx={{ borderRadius: 999 }}>
            New Assessment
          </Button>
        ) : null}
      </Box>

      {poseInitError ? (
        <Alert
          severity="warning"
          sx={{ bgcolor: "rgba(184,124,76,0.15)", color: "#e2e8f0" }}
        >
          Pose estimation unavailable: {poseInitError}. Refresh the page and try again.
        </Alert>
      ) : null}

      {error ? (
        <Alert
          severity="error"
          sx={{ bgcolor: "rgba(127,29,29,0.35)", color: "#fecaca", borderRadius: 2 }}
        >
          {error}
        </Alert>
      ) : null}

      {saveWarning ? (
        <Alert
          severity="warning"
          sx={{ bgcolor: "rgba(184,124,76,0.15)", color: "#fcd9b5", borderRadius: 2 }}
        >
          {saveWarning}
        </Alert>
      ) : null}

      {viewState === "intake" ? (
        <Box
          sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: "rgba(17, 24, 39, 0.6)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Typography sx={{ color: "#94a3b8", mb: 3 }}>
            Step 1: Select the client context before camera capture.
          </Typography>

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Client Email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              type="email"
              autoComplete="email"
              helperText={
                isRegistered === true ? (
                  <Typography component="span" sx={{ color: "#4ade80", fontSize: 11, fontWeight: 700 }}>
                    ✓ Registered Client (History will be saved)
                  </Typography>
                ) : isRegistered === false ? (
                  <Typography component="span" sx={{ color: "#94a3b8", fontSize: 11 }}>
                    New Client (Email not found in database)
                  </Typography>
                ) : null
              }
              sx={{
                "& .MuiInputBase-input": { color: "#f8fafc" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
              }}
            />

            <FormControl fullWidth>
              <InputLabel sx={{ color: "#94a3b8" }}>Client Profile (Wearable Context)</InputLabel>
              <Select
                value={selectedProfileId}
                label="Client Profile (Wearable Context)"
                onChange={(e) => setSelectedProfileId(String(e.target.value))}
                sx={{
                  color: "#f8fafc",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                {MOCK_PROFILES.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} (HRV: {p.hrv}, Strain: {p.strain})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel sx={{ color: "#94a3b8" }}>Session Goal</InputLabel>
              <Select
                value={selectedGoal}
                label="Session Goal"
                onChange={(e) => setSelectedGoal(String(e.target.value))}
                sx={{
                  color: "#f8fafc",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <MenuItem value="Prep">Pre-Game Prep (Activation)</MenuItem>
                <MenuItem value="Recovery">Post-Game Recovery</MenuItem>
                <MenuItem value="Relaxation">Nervous System Reset (Relaxation)</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="large"
              onClick={startCamera}
              sx={{
                py: 1.5,
                background: "linear-gradient(135deg, #FF4D6D, #C9184A)",
                boxShadow: "0 4px 20px rgba(255,77,109,0.3)",
              }}
            >
              Continue to Camera
            </Button>
          </Stack>
        </Box>
      ) : null}

      {viewState === "camera" ? (
        <>
          <CameraCapture
            videoRef={videoRef}
            stream={stream}
            cameraError={cameraError}
            cameraStarted={cameraStarted}
            onRetryCamera={startCamera}
            landmarks={lastLandmarks}
            onStartCamera={startCamera}
            onCaptureSnapshot={captureSnapshot}
            isAnalyzing={isAnalyzing}
          />

          <PoseOverlay
            zones={snapshot?.zones?.length ? snapshot.zones : []}
            landmarks={lastLandmarks}
            poseDetected={Boolean(lastLandmarks?.length)}
            analysisComplete={false}
          />

          <Box
            sx={{
              p: 2,
              borderRadius: 4,
              bgcolor: "rgba(168, 187, 163, 0.08)",
              border: "1px solid rgba(184, 124, 76, 0.2)",
              color: "#e2e8f0",
            }}
          >
            <Typography sx={{ color: "#f8fafc", fontWeight: 800, mb: 0.5 }}>
              Current intake context
            </Typography>
            <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
              Client: {clientEmail || "—"} · Profile: {selectedProfile.name} · Goal: {selectedGoal}
            </Typography>
          </Box>
        </>
      ) : null}

      {viewState === "results" ? (
        <>
          <PoseOverlay
            zones={snapshot?.zones ?? []}
            landmarks={lastLandmarks}
            poseDetected={true}
            analysisComplete={true}
          />

          <CameraCapture
            videoRef={videoRef}
            stream={null}
            cameraError={null}
            cameraStarted={false}
            onRetryCamera={() => {}}
            landmarks={lastLandmarks}
            onStartCamera={() => {}}
            onCaptureSnapshot={() => {}}
            isAnalyzing={false}
            recommendedPlacement={snapshot?.recommendedPlacement}
          />

          <AsymmetryResults
            snapshot={snapshot}
            protocol={protocol}
            sessionId={sessionId}
            voiceAudio={voiceAudio}
            validation={validation}
            deviceSession={deviceSession}
          />
        </>
      ) : null}
    </Stack>
  );
}