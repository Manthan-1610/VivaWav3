import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import type { NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";
import { CameraCapture } from "./CameraCapture";
import { PoseOverlay } from "./PoseOverlay";
import { AsymmetryResults } from "./AsymmetryResults";
import type {
  BodySnapshot,
  GenerateProtocolResponse,
  HardwareProtocol,
} from "../../types/vivawav3";
import { postGenerateProtocol } from "../../api/generateProtocol";
import { useAuth } from "../../auth/useAuth";
import { roundTripJson } from "../../lib/jsonRoundTrip";
import {
  aggregatePoseSamples,
  getPoseLandmarker,
  landmarksToJointSample,
  type PoseJointSample,
} from "../../lib/poseEstimator";

const MOCK_PROFILES = [
  { id: "athlete", name: "High Strain Athlete", hrv: 75, strain: 90, sleepQuality: 80 },
  { id: "office", name: "Stressed Office Worker", hrv: 35, strain: 40, sleepQuality: 40 },
  { id: "rehab", name: "Post-Op Rehab", hrv: 50, strain: 20, sleepQuality: 60 },
];

export function AssessmentView() {
  const { user } = useAuth();
  
  // -- View State: 'intake' -> 'camera' -> 'results'
  const [viewState, setViewState] = useState<"intake" | "camera" | "results">("intake");
  const [selectedProfileId, setSelectedProfileId] = useState(MOCK_PROFILES[0].id);
  const [selectedGoal, setSelectedGoal] = useState("Recovery");

  // -- Camera & Pose State
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

  // -- Analysis & Results State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<BodySnapshot | null>(null);
  const [protocol, setProtocol] = useState<HardwareProtocol | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [voiceAudio, setVoiceAudio] = useState<GenerateProtocolResponse["voiceAudio"] | null>(null);
  const [validation, setValidation] = useState<GenerateProtocolResponse["validation"] | null>(null);
  const [deviceSession, setDeviceSession] = useState<GenerateProtocolResponse["deviceSession"] | null>(null);

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
          setPoseInitError(e instanceof Error ? e.message : "Pose estimation could not start.");
        }
      });
    return () => { cancelled = true; };
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraStarted(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(s);
    } catch (e) {
      setCameraError(e instanceof Error ? e.message : "Camera access blocked.");
      setStream(null);
      setCameraStarted(false);
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !stream) return;
    v.srcObject = stream;
    void v.play().catch(() => setCameraError("Unable to play stream."));
  }, [stream]);

  useEffect(() => {
    poseLandmarkerRef.current = landmarker;
  }, [landmarker]);

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
              // Keep a rolling buffer of the last ~2 seconds of frames (20 samples)
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

  const captureSnapshot = async () => {
    if (poseSamples.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    
    // 1. Analyze the live samples directly
    const aggregated = aggregatePoseSamples(poseSamples);
    if (!aggregated.poseFound) {
      setError("No stable pose detected. Ask client to step back and retry.");
      setIsAnalyzing(false);
      return;
    }

    // Stop camera stream immediately
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      setCameraStarted(false);
    }

    const selectedProfile = MOCK_PROFILES.find(p => p.id === selectedProfileId) || MOCK_PROFILES[0];

    const nextSnapshot: BodySnapshot = {
      recoveryScore: aggregated.recoveryScore,
      zones: aggregated.zones.map((z) => ({ area: z.area, intensity: z.intensity })),
      recommendedPlacement: aggregated.recommendedPlacement,
      state: {
        hrv: selectedProfile.hrv,
        strain: selectedProfile.strain,
        readiness: aggregated.readiness, // We let pose asymmetry determine the actual local readiness
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
          landmarkSnapshot: lastLandmarks ? { landmarks: JSON.stringify(lastLandmarks).slice(0, 8000) } : {},
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

    } catch (e) {
      const msg = e instanceof Error ? e.message : "API generation failed.";
      setError(msg);
      // Restart camera if we failed
      startCamera();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startIntake = () => {
    setViewState("intake");
    setSnapshot(null);
    setProtocol(null);
    setLastLandmarks(null);
    setPoseSamples([]);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" sx={{ color: "#f8fafc", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Movement Assessment
        </Typography>
        {viewState === "results" && (
          <Button variant="outlined" onClick={startIntake} sx={{ borderRadius: 999 }}>
            New Assessment
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ bgcolor: "rgba(127,29,29,0.35)", color: "#fecaca", borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {viewState === "intake" && (
        <Box sx={{ p: 3, borderRadius: 4, bgcolor: "rgba(17, 24, 39, 0.6)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Typography sx={{ color: "#94a3b8", mb: 3 }}>
            Step 1: Select the client's profile context before camera capture.
          </Typography>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: "#94a3b8" }}>Client Profile (Wearable Context)</InputLabel>
              <Select
                value={selectedProfileId}
                label="Client Profile (Wearable Context)"
                onChange={(e) => setSelectedProfileId(e.target.value)}
                sx={{ color: "#f8fafc", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }}
              >
                {MOCK_PROFILES.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name} (HRV: {p.hrv}, Strain: {p.strain})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel sx={{ color: "#94a3b8" }}>Session Goal</InputLabel>
              <Select
                value={selectedGoal}
                label="Session Goal"
                onChange={(e) => setSelectedGoal(e.target.value)}
                sx={{ color: "#f8fafc", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" } }}
              >
                <MenuItem value="Prep">Pre-Game Prep (Activation)</MenuItem>
                <MenuItem value="Recovery">Post-Game Recovery</MenuItem>
                <MenuItem value="Relaxation">Nervous System Reset (Relaxation)</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="large"
              onClick={() => { setViewState("camera"); startCamera(); }}
              sx={{ py: 1.5, background: "linear-gradient(135deg, #FF4D6D, #C9184A)", boxShadow: "0 4px 20px rgba(255,77,109,0.3)" }}
            >
              Continue to Camera
            </Button>
          </Stack>
        </Box>
      )}

      {viewState === "camera" && (
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
        </>
      )}

      {viewState === "results" && (
        <>
          <PoseOverlay
            zones={snapshot?.zones || []}
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
      )}

    </Stack>
  );
}
