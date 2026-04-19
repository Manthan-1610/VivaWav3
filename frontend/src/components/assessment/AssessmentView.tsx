import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, LinearProgress, Stack, Typography } from "@mui/material";
import type { NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";
import { CameraCapture } from "./CameraCapture";
import { PoseOverlay } from "./PoseOverlay";
import { AsymmetryResults } from "./AsymmetryResults";
import { SubmitAssessment } from "./SubmitAssessment";
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
  estimateSamplesFromRecordedBlob,
  getPoseLandmarker,
  landmarksToJointSample,
  type PoseJointSample,
} from "../../lib/poseEstimator";

const MAX_RECORDING_SECONDS = 60;
const MIN_RECORDING_SECONDS = 3;

function pickRecorderMimeType(): string | undefined {
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return undefined;
}

export function AssessmentView() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  const lastSampleAtRef = useRef(0);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef(0);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSequenceStarting, setIsSequenceStarting] = useState(false);
  const [poseInitError, setPoseInitError] = useState<string | null>(null);

  const [landmarker, setLandmarker] = useState<PoseLandmarker | null>(null);
  const [lastLandmarks, setLastLandmarks] = useState<NormalizedLandmark[] | null>(
    null,
  );
  const [landmarksForExport, setLandmarksForExport] =
    useState<NormalizedLandmark[] | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [poseSamples, setPoseSamples] = useState<PoseJointSample[]>([]);
  const [processingRecording, setProcessingRecording] = useState(false);
  // Zones immediately available after blob analysis (before API round-trip).
  const [liveZones, setLiveZones] = useState<{ area: string; intensity: number }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [poseGuidance, setPoseGuidance] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<BodySnapshot | null>(null);
  const [protocol, setProtocol] = useState<HardwareProtocol | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [voiceAudio, setVoiceAudio] =
    useState<GenerateProtocolResponse["voiceAudio"] | null>(null);
  const [validation, setValidation] =
    useState<GenerateProtocolResponse["validation"] | null>(null);
  const [deviceSession, setDeviceSession] =
    useState<GenerateProtocolResponse["deviceSession"] | null>(null);

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
            e instanceof Error
              ? e.message
              : "Pose estimation could not start in this browser.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // "Start recording" sequence: requests camera, and once stream is available,
  // it triggers a 3-second countdown before actual recording starts.
  const startRecordingSequence = useCallback(() => {
    setIsSequenceStarting(true);
    setCameraError(null);
    setCameraStarted(true);
  }, []);

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
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
      } catch (e) {
        if (!cancelled) {
          setCameraError(
            e instanceof Error
              ? e.message
              : "Camera access was blocked or no camera was found. Allow access and retry.",
          );
          setStream(null);
          setCameraStarted(false); // allow re-try on next click
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cameraStarted, cameraKey]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !stream) return;
    v.srcObject = stream;
    void v.play().catch(() => {
      setCameraError("Unable to play the camera stream. Try another browser or device.");
    });
  }, [stream]);

  useEffect(() => {
    poseLandmarkerRef.current = landmarker;
  }, [landmarker]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const pl = poseLandmarkerRef.current;
      const v = videoRef.current;
      if (pl && v && v.readyState >= 2 && v.videoWidth > 0) {
        try {
          const result = pl.detectForVideo(v, performance.now());
          const lm = result.landmarks[0];
          if (lm?.length) {
            setLastLandmarks(lm);
            if (isRecordingRef.current) {
              const now = performance.now();
              if (now - lastSampleAtRef.current >= 200) {
                lastSampleAtRef.current = now;
                const sample = landmarksToJointSample(lm);
                setPoseSamples((prev) => [...prev, sample]);
              }
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
  }, [stream, landmarker]);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    isRecordingRef.current = false;

    // Automatically close camera after recording stops
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    setCameraStarted(false);
  }, [stream]);

  useEffect(() => {
    if (stream && isSequenceStarting && countdown === null) {
      setCountdown(3);
    }
  }, [stream, isSequenceStarting, countdown]);

  useEffect(() => {
    if (!isRecording) return;
    const id = window.setInterval(() => {
      setRecordingSeconds((s) => {
        const next = s + 1;
        if (next >= MAX_RECORDING_SECONDS) {
          queueMicrotask(() => stopRecording());
          return MAX_RECORDING_SECONDS;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRecording, stopRecording]);

  const startRecording = useCallback(() => {
    if (!stream) return;
    setPoseGuidance(null);
    setError(null);
    setSubmissionError(null);
    setRecordedBlob(null);
    setPoseSamples([]);
    setLandmarksForExport(null);
    lastSampleAtRef.current = 0;
    setRecordingSeconds(0);
    chunksRef.current = [];

    const mime = pickRecorderMimeType();
    const mr = mime
      ? new MediaRecorder(stream, { mimeType: mime })
      : new MediaRecorder(stream);

    mr.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: mr.mimeType || "video/webm",
      });
      setRecordedBlob(blob);
      const pl = poseLandmarkerRef.current;
      if (!pl) {
        setProcessingRecording(false);
        return;
      }
      setProcessingRecording(true);
      void estimateSamplesFromRecordedBlob(blob, pl)
        .then(({ samples, lastLandmarks: lm }) => {
          const usedSamples = samples.length > 0 ? samples : poseSamples;
          if (samples.length > 0) {
            setPoseSamples(samples);
          }
          // ── Key fix: immediately surface the detected zones and landmark
          // frame so the PoseOverlay populates right after the recording stops,
          // not only after the API call finishes.
          const agg = aggregatePoseSamples(usedSamples);
          if (agg.poseFound) {
            setLiveZones(agg.zones);
            if (lm?.length) {
              setLandmarksForExport(lm);
              setLastLandmarks(lm); // keep skeleton visible on camera canvas too
            }
          }
        })
        .catch(() => {
          /* keep live samples collected during recording */
        })
        .finally(() => setProcessingRecording(false));

    };

    mr.start(500);
    mediaRecorderRef.current = mr;
    setIsRecording(true);
    isRecordingRef.current = true;
  }, [stream]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const id = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
      return () => clearTimeout(id);
    } else {
      setCountdown(null);
      setIsSequenceStarting(false);
      startRecording();
    }
  }, [countdown, startRecording]);

  const onRetryCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    setCameraStarted(false);
    setIsSequenceStarting(false);
    setCountdown(null);
    setCameraKey((k) => k + 1);
    // Re-trigger after a tick so the state resets cleanly
    setTimeout(() => setCameraStarted(true), 50);
  }, [stream]);

  const runAssessment = async () => {
    setError(null);
    setSubmissionError(null);
    setPoseGuidance(null);

    if (recordingSeconds < MIN_RECORDING_SECONDS) {
      setError(
        `Record at least ${MIN_RECORDING_SECONDS} seconds of movement so we can estimate asymmetry from your video.`,
      );
      return;
    }

    if (processingRecording) {
      setError("Still analyzing the recorded clip. Wait a moment, then try again.");
      return;
    }

    const aggregated = aggregatePoseSamples(poseSamples);
    if (!aggregated.poseFound) {
      setPoseGuidance(
        "We could not detect a clear full-body pose. Ask the client to step back, face the camera, and ensure good lighting, then record again.",
      );
      return;
    }

    setLoading(true);

    const nextSnapshot: BodySnapshot = {
      recoveryScore: aggregated.recoveryScore,
      zones: aggregated.zones.map((z) => ({
        area: z.area,
        intensity: z.intensity,
      })),
      recommendedPlacement: aggregated.recommendedPlacement,
      state: {
        // Derive a realistic mock HRV from pose-based readiness so Gemini gets a coherent signal.
        // Low readiness (high asymmetry) → low HRV (28–42). High → high HRV (62–80). Stable → mid.
        hrv:
          aggregated.readiness === "low"
            ? Math.round(28 + Math.random() * 14)   // 28–42
            : aggregated.readiness === "high"
            ? Math.round(62 + Math.random() * 18)   // 62–80
            : Math.round(42 + Math.random() * 18),  // 42–60
        strain: Math.round(40 + (aggregated.zones[0]?.intensity ?? 0) * 40),
        readiness: aggregated.readiness,
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

      const lm = landmarksForExport ?? lastLandmarks;
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
          landmarkSnapshot: lm
            ? { landmarks: JSON.stringify(lm).slice(0, 8000) }
            : {},
        },
        wearables: {
          hrv: nextSnapshot.state.hrv,
          strain: nextSnapshot.state.strain,
          sleepQuality: null,
          activity: null,
        },
        metadata: { source: "assessment_view", role: user?.role ?? "unknown" },
      });

      const res = await postGenerateProtocol(payload);

      setProtocol(res.hardwareProtocol);
      setSessionId(res.sessionId);
      setVoiceAudio(res.voiceAudio ?? null);
      setValidation(res.validation ?? null);
      setDeviceSession(res.deviceSession ?? null);
      // Confirmed snapshot zones supersede live preview
      setLiveZones([]);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Something went wrong while sending your assessment.";
      setSubmissionError(msg);
      setProtocol(null);
      setSessionId(null);
      setVoiceAudio(null);
      setValidation(null);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    !cameraError &&
    recordingSeconds >= MIN_RECORDING_SECONDS &&
    Boolean(recordedBlob) &&
    !processingRecording;

  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ color: "#f8fafc", fontWeight: 800 }}>
        Movement assessment
      </Typography>
      <Typography sx={{ color: "#cbd5e1", fontSize: 13 }}>
        Capture up to {MAX_RECORDING_SECONDS} seconds of client movement. After you stop recording,
        we analyze the saved clip with MediaPipe, then send asymmetry and wearable context to the
        protocol engine.
      </Typography>

      {poseInitError ? (
        <Alert severity="warning" sx={{ bgcolor: "rgba(184,124,76,0.15)", color: "#e2e8f0" }}>
          Pose estimation unavailable: {poseInitError}. You can still retry after a refresh; protocol
          generation needs pose estimation when the model loads.
        </Alert>
      ) : null}

      {processingRecording ? (
        <Stack spacing={0.5}>
          <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
            Analyzing recorded movement from your clip…
          </Typography>
          <LinearProgress
            sx={{
              borderRadius: 999,
              height: 6,
              bgcolor: "rgba(148,163,184,0.15)",
              "& .MuiLinearProgress-bar": {
                background: "linear-gradient(90deg, #A8BBA3, #B87C4C)",
              },
            }}
          />
        </Stack>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ bgcolor: "rgba(127,29,29,0.35)", color: "#fecaca" }}>
          {error}
        </Alert>
      ) : null}

      {poseGuidance ? (
        <Alert severity="info" sx={{ bgcolor: "rgba(30,58,138,0.35)", color: "#bfdbfe" }}>
          {poseGuidance}
        </Alert>
      ) : null}

      <CameraCapture
        videoRef={videoRef}
        stream={stream}
        cameraError={cameraError}
        cameraStarted={cameraStarted}
        countdown={countdown}
        onRetryCamera={onRetryCamera}
        isRecording={isRecording}
        recordingSeconds={recordingSeconds}
        maxSeconds={MAX_RECORDING_SECONDS}
        landmarks={lastLandmarks}
        onStartRecordingSequence={startRecordingSequence}
        onStopRecording={stopRecording}
      />

      <PoseOverlay
        zones={snapshot?.zones?.length ? snapshot.zones : liveZones}
        landmarks={landmarksForExport ?? lastLandmarks}
        poseDetected={Boolean(lastLandmarks?.length)}
        analysisComplete={Boolean(snapshot?.zones?.length || liveZones.length)}
      />

      <AsymmetryResults
        snapshot={snapshot}
        protocol={protocol}
        sessionId={sessionId}
        voiceAudio={voiceAudio}
        validation={validation}
        deviceSession={deviceSession}
      />

      <SubmitAssessment
        onSubmit={runAssessment}
        loading={loading}
        disabled={!canSubmit || Boolean(poseInitError)}
        disabledHint={
          poseInitError
            ? "Pose model did not load; refresh the page or check your network."
            : !canSubmit
              ? processingRecording
                ? "Finishing movement analysis from your recording…"
                : `Record at least ${MIN_RECORDING_SECONDS}s, then stop recording.`
              : undefined
        }
        submissionError={submissionError}
        onRetrySubmission={submissionError ? runAssessment : undefined}
      />
    </Stack>
  );
}
