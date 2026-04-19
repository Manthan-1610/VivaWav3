import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

/** Matches npm dependency; WASM CDN path must align for predictable loading. */
const TASKS_VERSION = "0.10.34";
const WASM_CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export type PoseJointSample = {
  jointScores: Record<string, number>;
  poseFound: boolean;
};

export type RecordedPoseResult = {
  samples: PoseJointSample[];
  /** Last frame with a detected pose (for landmark snapshot in API payload). */
  lastLandmarks: NormalizedLandmark[] | null;
};

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

export function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.25,
        minPosePresenceConfidence: 0.25,
        minTrackingConfidence: 0.25,
      });
    })();
  }
  return landmarkerPromise;
}

const IDX = {
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_HIP: 23,
  R_HIP: 24,
  L_KNEE: 25,
  R_KNEE: 26,
  L_ANKLE: 27,
  R_ANKLE: 28,
} as const;

function vis(lm: NormalizedLandmark | undefined): number {
  const v = lm as NormalizedLandmark & { visibility?: number; presence?: number };
  const raw = v?.visibility ?? v?.presence;
  /** Tasks Vision may omit confidence; treat missing as visible so asymmetry still computes. */
  if (raw == null) return 1;
  return raw;
}

/** Pair asymmetry 0–1 from normalized landmark y/x deltas (higher = more imbalance). */
function pairIntensity(
  left: NormalizedLandmark | undefined,
  right: NormalizedLandmark | undefined,
): number {
  if (!left || !right) return 0;
  if (vis(left) < 0.15 && vis(right) < 0.15) return 0;
  const dy = Math.abs(left.y - right.y);
  const dx = Math.abs(left.x - right.x);
  return Math.min(1, dy * 5 + dx * 3);
}

/**
 * Maps MediaPipe landmarks to joint pair scores and readable zone labels for the protocol API.
 */
export function landmarksToJointSample(landmarks: NormalizedLandmark[]): PoseJointSample {
  if (!landmarks.length) {
    return { jointScores: {}, poseFound: false };
  }

  const ls = landmarks[IDX.L_SHOULDER];
  const rs = landmarks[IDX.R_SHOULDER];
  const lh = landmarks[IDX.L_HIP];
  const rh = landmarks[IDX.R_HIP];
  const lk = landmarks[IDX.L_KNEE];
  const rk = landmarks[IDX.R_KNEE];
  const la = landmarks[IDX.L_ANKLE];
  const ra = landmarks[IDX.R_ANKLE];

  const shoulder = pairIntensity(ls, rs);
  const hip = pairIntensity(lh, rh);
  const knee = pairIntensity(lk, rk);
  const ankle = pairIntensity(la, ra);

  const poseFound = Boolean(ls && rs && lh && rh);

  const jointScores: Record<string, number> = {
    shoulders: shoulder,
    hips: hip,
    knees: knee,
    ankles: ankle,
    left_shoulder: shoulder > 0 ? shoulder * (ls!.y < rs!.y ? 1.1 : 0.9) : 0,
    right_shoulder: shoulder > 0 ? shoulder * (rs!.y < ls!.y ? 1.1 : 0.9) : 0,
  };

  return { jointScores, poseFound };
}

export type AggregatedPose = {
  jointScores: Record<string, number>;
  zones: { area: string; intensity: number }[];
  recoveryScore: number;
  recommendedPlacement: { sunPad: string; moonPad: string };
  readiness: "low" | "stable" | "high";
  poseFound: boolean;
};

function avgScores(samples: PoseJointSample[]): Record<string, number> {
  const keys = new Set<string>();
  for (const s of samples) {
    Object.keys(s.jointScores).forEach((k) => keys.add(k));
  }
  const out: Record<string, number> = {};
  for (const k of keys) {
    let sum = 0;
    let n = 0;
    for (const s of samples) {
      const v = s.jointScores[k];
      if (typeof v === "number") {
        sum += v;
        n += 1;
      }
    }
    if (n > 0) out[k] = sum / n;
  }
  return out;
}

const ZONE_LABELS: Record<string, string> = {
  shoulders: "shoulders",
  hips: "hips",
  knees: "knees",
  ankles: "ankles",
};

function scoresToZones(jointScores: Record<string, number>): { area: string; intensity: number }[] {
  const pairs = ["shoulders", "hips", "knees", "ankles"] as const;
  return pairs
    .map((k) => ({
      area: ZONE_LABELS[k] ?? k,
      intensity: jointScores[k] ?? 0,
    }))
    .sort((a, b) => b.intensity - a.intensity);
}

function suggestPads(zones: { area: string; intensity: number }[]): {
  sunPad: string;
  moonPad: string;
} {
  const top = zones[0]?.area ?? "lower_back";
  const second = zones[1]?.area ?? "hips";
  const sun = top.replace(/\s+/g, "_");
  const moon = second.replace(/\s+/g, "_");
  if (sun === moon) {
    return { sunPad: sun || "lower_back", moonPad: "upper_back" };
  }
  return { sunPad: sun, moonPad: moon };
}

/**
 * Aggregates per-frame samples from a recording window into one assessment snapshot.
 */
export function aggregatePoseSamples(samples: PoseJointSample[]): AggregatedPose {
  const valid = samples.filter((s) => s.poseFound);
  if (valid.length === 0) {
    return {
      jointScores: {},
      zones: [],
      recoveryScore: 0,
      recommendedPlacement: { sunPad: "lower_back", moonPad: "left_shoulder" },
      readiness: "low",
      poseFound: false,
    };
  }

  const jointScores = avgScores(valid);
  const zones = scoresToZones(jointScores);
  const avgAsym =
    zones.reduce((acc, z) => acc + z.intensity, 0) / Math.max(1, zones.length);
  const recoveryScore = Math.max(
    0,
    Math.min(100, Math.round(100 - avgAsym * 55)),
  );

  let readiness: "low" | "stable" | "high" = "stable";
  if (recoveryScore < 45) readiness = "low";
  else if (recoveryScore >= 72) readiness = "high";

  return {
    jointScores,
    zones,
    recoveryScore,
    recommendedPlacement: suggestPads(zones),
    readiness,
    poseFound: true,
  };
}

/**
 * Samples the recorded clip after capture (Requirement 1.3 / 2.1): decodes the blob,
 * runs MediaPipe on evenly spaced frames. Stops before `maxWallMs` (default 9.5s) to meet
 * Requirement 2.5 (processing completes within ~10s of the final frame for typical clips).
 */
export async function estimateSamplesFromRecordedBlob(
  blob: Blob,
  landmarker: PoseLandmarker,
  options?: { maxWallMs?: number; minStepSec?: number; maxFrames?: number },
): Promise<RecordedPoseResult> {
  const maxWallMs = options?.maxWallMs ?? 9500;
  const minStepSec = options?.minStepSec ?? 0.2;
  const maxFrames = options?.maxFrames ?? 48;
  const t0 = performance.now();

  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.src = url;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Recording could not be decoded for pose analysis."));
  });

  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 3;
  const samples: PoseJointSample[] = [];
  let lastLandmarks: NormalizedLandmark[] | null = null;

  const step = Math.max(
    minStepSec,
    duration / Math.min(maxFrames, Math.max(1, Math.floor(duration / minStepSec))),
  );

  const seekTo = (time: number) =>
    new Promise<void>((resolve, reject) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onErr);
        resolve();
      };
      const onErr = () => {
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onErr);
        reject(new Error("Seek failed while analyzing movement."));
      };
      video.addEventListener("seeked", onSeeked);
      video.addEventListener("error", onErr);
      video.currentTime = Math.min(Math.max(0, time), Math.max(0, duration - 0.04));
    });

  for (let t = 0; t <= duration && performance.now() - t0 < maxWallMs; t += step) {
    try {
      await seekTo(t);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const result = landmarker.detectForVideo(video, performance.now());
      const lm = result.landmarks[0];
      if (lm?.length) {
        samples.push(landmarksToJointSample(lm));
        lastLandmarks = lm;
      }
    } catch {
      break;
    }
  }

  URL.revokeObjectURL(url);
  video.removeAttribute("src");
  video.load();

  return { samples, lastLandmarks };
}

/** BlazePose topology subset for canvas drawing (segment pairs). */
export const POSE_SEGMENT_PAIRS: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [24, 26],
  [25, 27],
  [26, 28],
];
